"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Section } from "@/components/settings/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { toastAuthError } from "@/lib/toast-auth-error";

export function ProfileForm({ name }: { name: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const trimmed = value.trim();

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trimmed) return setError("Enter your name");
    if (trimmed.length > 80) return setError("Keep it under 80 characters");
    setError("");
    setPending(true);
    const res = await authClient.updateUser({ name: trimmed });
    setPending(false);
    if (res.error) return toastAuthError(res.error);
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <form onSubmit={save} noValidate>
      <Section
        title="Profile"
        description="How you appear across the app."
        footer={
          <Button size="sm" type="submit" loading={pending} disabled={trimmed === name}>
            Save
          </Button>
        }
      >
        <div className="max-w-sm">
          <Field label="Name" htmlFor="profile-name" error={error}>
            <Input
              id="profile-name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="name"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "profile-name-error" : undefined}
            />
          </Field>
        </div>
      </Section>
    </form>
  );
}
