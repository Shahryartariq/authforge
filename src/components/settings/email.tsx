"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/form-alert";
import { authClient } from "@/lib/auth-client";
import { EMAIL_CHANGE } from "@/lib/email-change";
import { toastAuthError } from "@/lib/toast-auth-error";
import { useQueryParams } from "@/lib/use-query-params";
import { emailSchema } from "@/lib/validation";

/**
 * How this account can change its email:
 * - "confirm": the current address approves, then the new address confirms.
 * - "instant": demo mode, where addresses aren't verified.
 * - "off": the address is verified but this deployment can't send email.
 */
type Mode = "confirm" | "instant" | "off";

export function EmailSection({ email, mode }: { email: string; mode: Mode }) {
  const router = useRouter();
  const params = useQueryParams();
  const [value, setValue] = useState(email);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sentFor, setSentFor] = useState<string | null>(null);

  // Where an emailed link landed: ?emailChange=approved|done, plus ?error= when it failed.
  const step = params.get(EMAIL_CHANGE.param);
  const linkFailed = Boolean(step && params.get("error"));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (parsed.data === email.toLowerCase()) return setError("That's already your email");
    setError("");
    setPending(true);
    const res = await authClient.changeEmail({
      newEmail: parsed.data,
      ...(mode === "confirm" ? { callbackURL: EMAIL_CHANGE.approvedURL } : {}),
    });
    if (res.error) {
      setPending(false);
      return toastAuthError(res.error);
    }
    if (mode === "confirm") {
      setPending(false);
      setValue(email);
      return setSentFor(parsed.data);
    }
    // Demo mode changes it at once. The server stays quiet when the address
    // belongs to someone else, so read the session back to see what happened.
    const { data } = await authClient.getSession();
    setPending(false);
    if (data?.user.email !== parsed.data) return setError("That email is already in use. Try another one.");
    toast.success("Email updated");
    router.refresh();
  }

  if (mode === "off") {
    return (
      <Section title="Email address" description="Your email is used to sign in.">
        <div className="max-w-sm">
          <Field
            label="Email"
            htmlFor="account-email"
            hint="Email isn't set up on this deployment, so a verified address can't be changed."
          >
            <Input id="account-email" value={email} disabled readOnly />
          </Field>
        </div>
      </Section>
    );
  }

  return (
    <form onSubmit={save} noValidate>
      <Section
        title="Email address"
        description={
          mode === "confirm"
            ? "Used to sign in. To change it, you approve from your current address, then confirm the new one."
            : "Used to sign in. Addresses aren't verified in demo mode, so a change applies right away."
        }
        footer={
          <Button size="sm" type="submit" loading={pending} disabled={value.trim().toLowerCase() === email.toLowerCase()}>
            Change email
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {linkFailed ? (
            <FormAlert>That link is invalid or has expired. Nothing was changed. Start the change again below.</FormAlert>
          ) : step === "done" ? (
            <FormAlert variant="success">Your email was changed. You now sign in with {email}.</FormAlert>
          ) : step === "approved" ? (
            <FormAlert variant="info">
              Approved. We sent a link to your new address. Open it to finish the change.
            </FormAlert>
          ) : null}
          {sentFor && (
            <FormAlert variant="success">
              Check {email}: we sent a link to approve the change. After that, we&apos;ll send a second link to{" "}
              {sentFor} to confirm it. Your email stays the same until both are opened.
            </FormAlert>
          )}
          <div className="max-w-sm">
            <Field label="Email" htmlFor="account-email" error={error}>
              <Input
                id="account-email"
                type="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "account-email-error" : undefined}
              />
            </Field>
          </div>
        </div>
      </Section>
    </form>
  );
}
