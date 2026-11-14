"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck, CircleX, LogIn } from "lucide-react";
import { AuthFormSkeleton } from "@/components/auth/form-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/form-alert";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { safeRedirect, signInHref } from "@/lib/utils";
import { emailSchema } from "@/lib/validation";

/** Landing page for email verification links (success or failure). */
export function VerifyEmailStatus() {
  const params = useSearchParams();
  const next = safeRedirect(params.get("next"));
  const failed = Boolean(params.get("error"));
  // A working link signs you in, so the session is the proof. Without one,
  // this page was opened directly, or the link was already used on another
  // device: don't claim anything, just point to sign-in.
  const { data: session, isPending } = authClient.useSession();

  if (failed) return <ResendVerification next={next} />;
  if (isPending) return <AuthFormSkeleton />;

  if (!session) {
    return (
      <div className="flex flex-col items-start gap-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
          <LogIn className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground">
            If you opened a verification link, your email is verified. Sign in to finish.
          </p>
        </div>
        <Link
          href={signInHref(next)}
          className={buttonVariants()}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <span className="flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
        <CircleCheck className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Email verified</h1>
        <p className="text-sm text-muted-foreground">Your account is active and you&apos;re signed in.</p>
      </div>
      <Link href={next} className={buttonVariants()}>
        Continue
      </Link>
    </div>
  );
}

function ResendVerification({ next }: { next: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError("");
    setState("sending");
    const res = await authClient.sendVerificationEmail({
      email: parsed.data,
      callbackURL: `/verify-email?next=${encodeURIComponent(next)}`,
    });
    // Only "slow down" is shown. Anything else looks the same, so this form
    // can't be used to find out which addresses have accounts.
    if (res.error?.status === 429) {
      setState("idle");
      return setError(authErrorMessage(res.error));
    }
    setState("sent");
  }

  return (
    <div className="flex flex-col gap-5">
      <span className="flex size-11 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <CircleX className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">This link has expired</h1>
        <p className="text-sm text-muted-foreground">Verification links work once and expire after 1 hour. Get a new one below.</p>
      </div>
      {state === "sent" ? (
        <FormAlert variant="success">If that email needs verifying, a new link is on its way.</FormAlert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Email" htmlFor="email" error={error}>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </Field>
          <Button type="submit" loading={state === "sending"}>
            Send a new link
          </Button>
        </form>
      )}
    </div>
  );
}
