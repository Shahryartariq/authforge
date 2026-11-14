import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { DeleteAccount } from "@/components/settings/delete-account";
import { EmailSection } from "@/components/settings/email";
import { PasskeysSection } from "@/components/settings/passkeys";
import { PasswordSection } from "@/components/settings/password";
import { ProfileForm } from "@/components/settings/profile";
import { SessionsSection } from "@/components/settings/sessions";
import { TwoFactorSection } from "@/components/settings/two-factor";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { emailFeatures, providers } from "@/lib/env";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, sign-in methods and security.</p>
      </div>
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const { user, session } = await requireSession("/settings");
  const h = await headers();
  const { internalAdapter } = await auth.$context;
  const [accounts, sessions, passkeys] = await Promise.all([
    auth.api.listUserAccounts({ headers: h }),
    // Read straight from the database, not through `auth.api.listSessions`:
    // that endpoint refuses sessions older than a day, which would break this
    // page for anyone who stays signed in. Tokens never leave the server.
    internalAdapter.listSessions(user.id),
    auth.api.listPasskeys({ headers: h }),
  ]);
  const hasPassword = accounts.some((a) => a.providerId === "credential");
  // How this account can change its email (see `user.changeEmail` in auth.ts).
  const emailChange =
    !user.emailVerified && !emailFeatures.verificationRequired
      ? "instant"
      : emailFeatures.delivery
        ? "confirm"
        : "off";

  return (
    <div className="flex flex-col gap-6">
      <ProfileForm name={user.name} />
      <EmailSection email={user.email} mode={emailChange} />
      <div id="security" className="flex scroll-mt-20 flex-col gap-6">
        <PasswordSection hasPassword={hasPassword} email={user.email} emailDelivery={emailFeatures.delivery} />
        <TwoFactorSection enabled={Boolean(user.twoFactorEnabled)} hasPassword={hasPassword} />
        <PasskeysSection
          passkeys={passkeys.map((p) => ({
            id: p.id,
            name: p.name ?? null,
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
            deviceType: p.deviceType,
            backedUp: p.backedUp,
          }))}
        />
      </div>
      <ConnectedAccounts
        enabled={providers}
        linked={accounts.map((a) => ({ providerId: a.providerId, id: a.id }))}
      />
      <SessionsSection
        currentId={session.id}
        sessions={sessions.map((s) => ({
          id: s.id,
          userAgent: s.userAgent ?? null,
          ipAddress: s.ipAddress ?? null,
          createdAt: new Date(s.createdAt).toISOString(),
          updatedAt: new Date(s.updatedAt).toISOString(),
        }))}
      />
      <DeleteAccount hasPassword={hasPassword} emailDelivery={emailFeatures.delivery} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}
