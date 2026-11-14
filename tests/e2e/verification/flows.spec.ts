import {
  addPasskey,
  addVirtualAuthenticator,
  ageSessions,
  emailLink,
  emailText,
  expect,
  fillSignUp,
  newPassword,
  PASSWORD,
  promoteToAdmin,
  sessionStatus,
  signIn,
  signOut,
  signUpVerified,
  test,
  uniqueEmail,
} from "../support";

test.describe("staying signed in for days", () => {
  test("Settings still loads, and a sensitive action asks you to sign in again", async ({ page }) => {
    await addVirtualAuthenticator(page);
    const email = uniqueEmail("longstay");
    await signUpVerified(page, "Long Stay", email);
    await ageSessions(email, 2);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Active sessions" })).toBeVisible();
    await expect(page.getByText("This device")).toBeVisible();

    // Adding a passkey needs a recent sign-in: the toast offers one.
    await page.getByRole("button", { name: "Add a passkey" }).click();
    await page.getByRole("button", { name: "Create passkey" }).click();
    await expect(page.getByText("please sign in again")).toBeVisible();
    await page.getByRole("button", { name: "Sign in again" }).click();
    await expect(page).toHaveURL(/\/sign-in\?callbackURL=%2Fsettings/);
    await expect(page.getByText("For security, sign in again to continue.")).toBeVisible();

    await page.fill("#email", email);
    await page.fill("#password", PASSWORD);
    await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await addPasskey(page, "After signing in again");
    await expect(page.getByText("After signing in again")).toBeVisible();
  });

  test("session tokens are never sent to the page", async ({ page, context }) => {
    await signUpVerified(page, "Token Keeper", uniqueEmail("tokens"));
    const response = (await page.goto("/settings"))!;
    await expect(page.getByText("This device")).toBeVisible();
    const cookie = (await context.cookies()).find((c) => c.name.endsWith("session_token"))!;
    const token = decodeURIComponent(cookie.value).split(".")[0];
    expect(token.length).toBeGreaterThan(20);
    expect(await response.text()).not.toContain(token);
    expect(await page.content()).not.toContain(token);
  });
});

test.describe("a session that ended somewhere else", () => {
  test("the next action sends you to sign-in and back", async ({ page, newPerson }) => {
    const email = uniqueEmail("ended");
    await signUpVerified(page, "Ended Elsewhere", email);
    const laptop = await newPerson();
    await signIn(laptop, email);
    await expect(laptop).toHaveURL(/\/dashboard/);
    await laptop.goto("/settings");
    await expect(laptop.getByText("This device")).toBeVisible();

    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out of all other sessions" }).click();
    await expect(page.getByText("Signed out of all other sessions")).toBeVisible();

    await laptop.fill("#profile-name", "Still Here");
    await laptop.getByRole("button", { name: "Save" }).click();
    await expect(laptop).toHaveURL(/\/sign-in\?callbackURL=%2Fsettings/);
    await expect(laptop.getByText("Your session ended")).toBeVisible();
  });

  test("signing out one other device works from its id", async ({ page, newPerson }) => {
    const email = uniqueEmail("oneout");
    await signUpVerified(page, "One Out", email);
    const phone = await newPerson();
    await signIn(phone, email);
    await expect(phone).toHaveURL(/\/dashboard/);

    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page.getByText("Session signed out")).toBeVisible();
    expect(await sessionStatus(phone)).toBe(401);
    expect(await sessionStatus(page)).toBe(200);
  });
});

test.describe("changing your email", () => {
  test("the old address approves, the new address confirms, then only the new one signs in", async ({ page }) => {
    const oldEmail = uniqueEmail("before");
    const newEmail = uniqueEmail("after");
    await signUpVerified(page, "Email Mover", oldEmail);

    await page.goto("/settings");
    await page.fill("#account-email", newEmail);
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText(`Check ${oldEmail}`)).toBeVisible();

    // Step 1: the current address approves. Nothing has changed yet.
    expect(await emailText(oldEmail, /Approve your .* email change/)).toContain(newEmail);
    await page.goto(await emailLink(oldEmail, "verify"));
    await expect(page.getByText("Approved. We sent a link to your new address.")).toBeVisible();
    await expect(page.locator("#account-email")).toHaveValue(oldEmail);

    // Step 2: the new address confirms.
    await emailText(newEmail, /Confirm your new email/);
    await page.goto(await emailLink(newEmail, "verify"));
    await expect(page.getByText(`You now sign in with ${newEmail}`)).toBeVisible();
    await expect(page.locator("#account-email")).toHaveValue(newEmail);

    await signOut(page);
    await signIn(page, oldEmail);
    await expect(page.getByText("don't match")).toBeVisible();
    await signIn(page, newEmail);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("a broken link changes nothing and says so", async ({ page }) => {
    const email = uniqueEmail("brokenlink");
    await signUpVerified(page, "Broken Link", email);
    await page.goto("/api/auth/verify-email?token=not-a-token&callbackURL=%2Fsettings%3FemailChange%3Dapproved");
    await expect(page.getByText("That link is invalid or has expired")).toBeVisible();
    await expect(page.locator("#account-email")).toHaveValue(email);
  });

  test("your own address and a malformed one are refused on the spot", async ({ page }) => {
    const email = uniqueEmail("same");
    await signUpVerified(page, "Same Address", email);
    await page.goto("/settings");
    await page.fill("#account-email", "not-an-email");
    await page.getByRole("button", { name: "Change email" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await page.fill("#account-email", `  ${email.toUpperCase()} `);
    await expect(page.getByRole("button", { name: "Change email" })).toBeDisabled();
  });
});

test.describe("emails that tell the owner what happened", () => {
  test("signing up with a registered address emails its owner", async ({ page, newPerson }) => {
    const email = uniqueEmail("taken");
    await signUpVerified(page, "First Owner", email);

    const someoneElse = await newPerson();
    await fillSignUp(someoneElse, "Second Try", email, newPassword());
    // Same screen as a new sign-up, so the form can't be used to find accounts.
    await expect(someoneElse.getByText("Check your inbox")).toBeVisible();
    const text = await emailText(email, /You already have/);
    expect(text).toContain("/sign-in");
    expect(text).not.toContain("verify-email");

    // The owner's password still works; the second try's doesn't exist.
    await signOut(page);
    await signIn(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("changing or resetting the password emails a notice", async ({ page }) => {
    const email = uniqueEmail("pwnotice");
    await signUpVerified(page, "Password Notice", email);
    await page.goto("/settings");
    const next = newPassword();
    await page.fill("#currentPassword", PASSWORD);
    await page.fill("#newPassword", next);
    await page.fill("#confirmPassword", next);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password changed")).toBeVisible();
    // The strength meter clears along with the fields.
    await expect(page.getByText(/^(Weak|Fair|Good|Strong)$/)).toHaveCount(0);
    expect(await emailText(email, /password was changed/)).toContain("/forgot-password");
  });
});

test.describe("verification page", () => {
  test("opened directly, it doesn't claim your email is verified", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(page.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
    await expect(page.getByText("Email verified")).toHaveCount(0);
    await page.goto("/verify-email?next=%2Fsettings");
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/sign-in?callbackURL=%2Fsettings");
  });

  test("a second click on a used link asks you to sign in", async ({ page, newPerson }) => {
    const email = uniqueEmail("twice");
    await fillSignUp(page, "Click Twice", email);
    const link = await emailLink(email, "verify");
    await page.goto(link);
    await expect(page.getByText("Email verified")).toBeVisible();
    const otherDevice = await newPerson();
    await otherDevice.goto(link);
    await expect(otherDevice.getByRole("heading", { name: "Sign in to continue" })).toBeVisible();
  });

  test("its Continue link can't be pointed at another site", async ({ page }) => {
    await signUpVerified(page, "Stay Here", uniqueEmail("stayhere"));
    // A tab or newline in the path: browsers drop it, which would make "//example.com".
    for (const next of ["%2F%09%2Fexample.com", "%2F%0A%2Fexample.com", "%2F%5Cexample.com", "%2F%2Fexample.com"]) {
      await page.goto(`/verify-email?next=${next}`);
      await expect(page.getByRole("link", { name: "Continue" }), next).toHaveAttribute("href", "/dashboard");
    }
  });
});

test("links between sign-in and sign-up keep where you were going", async ({ page }) => {
  await page.goto("/sign-up?callbackURL=%2Fsettings");
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toHaveAttribute(
    "href",
    "/sign-in?callbackURL=%2Fsettings",
  );
  await page.goto("/two-factor?callbackURL=%2Fsettings");
  await expect(page.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/sign-in?callbackURL=%2Fsettings");
});

test.describe("admin", () => {
  async function asAdmin(page: Parameters<typeof signOut>[0]) {
    const email = uniqueEmail("admin");
    await signUpVerified(page, "Ada Admin", email);
    promoteToAdmin(email);
    return email;
  }

  test("sets a new password for a locked-out user and signs them out", async ({ page, newPerson }) => {
    const email = uniqueEmail("lockedout");
    const user = await newPerson();
    await signUpVerified(user, "Locked Out", email);
    await asAdmin(page);

    await page.goto(`/admin?q=${encodeURIComponent(email)}`);
    await page.getByRole("button", { name: `Actions for ${email}` }).click();
    await page.getByRole("menuitem", { name: "Set password…" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#set-password").fill("short");
    await dialog.getByRole("button", { name: "Set password" }).click();
    await expect(dialog.getByText("Use at least 8 characters")).toBeVisible();
    const fresh = newPassword();
    await dialog.locator("#set-password").fill(fresh);
    await dialog.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByText(`New password set for ${email}`)).toBeVisible();

    expect(await sessionStatus(user)).toBe(401);
    await signIn(user, email);
    await expect(user.getByText("don't match")).toBeVisible();
    await signIn(user, email, fresh);
    await expect(user).toHaveURL(/\/dashboard/);
  });

  test("impersonating can look, but can't change how the user signs in", async ({ page, newPerson }) => {
    await addVirtualAuthenticator(page);
    const email = uniqueEmail("watched");
    const user = await newPerson();
    await signUpVerified(user, "Watched User", email);
    await asAdmin(page);

    await page.goto(`/admin?q=${encodeURIComponent(email)}`);
    await page.getByRole("button", { name: `Actions for ${email}` }).click();
    await page.getByRole("menuitem", { name: "Impersonate" }).click();
    await expect(page.getByText("impersonation")).toBeVisible();

    const blocked = await page.evaluate(async () => {
      const post = (path: string, body: unknown) =>
        fetch(`/api/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }).then((r) => r.status);
      return {
        passkey: (await fetch("/api/auth/passkey/generate-register-options")).status,
        linkGitHub: await post("/link-social", { provider: "github", callbackURL: "/settings", disableRedirect: true }),
        changeEmail: await post("/change-email", { newEmail: "elsewhere@example.com" }),
        deleteAccount: await post("/delete-user", { callbackURL: "/" }),
        signOutOthers: await post("/revoke-other-sessions", {}),
      };
    });
    expect(blocked).toEqual({ passkey: 403, linkGitHub: 403, changeEmail: 403, deleteAccount: 403, signOutOthers: 403 });

    // In the page, the same thing shows as a message.
    await page.goto("/settings");
    await page.getByRole("button", { name: "Add a passkey" }).click();
    await page.getByRole("button", { name: "Create passkey" }).click();
    await expect(page.getByText("can't be changed while impersonating")).toBeVisible();

    // The user's own session was never touched.
    expect(await sessionStatus(user)).toBe(200);
  });

  test("a page number past the end shows the last page", async ({ page }) => {
    await asAdmin(page);
    await page.goto("/admin?page=99999");
    await expect(page).not.toHaveURL(/page=99999/);
    await expect(page.getByRole("button", { name: /^Actions for / }).first()).toBeVisible();
  });
});
