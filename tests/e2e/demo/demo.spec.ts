import { expect, fillSignUp, newPassword, PASSWORD, signIn, signOut, signUpDemo, test, uniqueEmail } from "../support";

// The production build with REQUIRE_EMAIL_VERIFICATION=false and no email
// provider: how the live demo runs.

test("sign-up says it's a demo and signs in right away", async ({ page }) => {
  const email = uniqueEmail("demo");
  await page.goto("/sign-up");
  await expect(page.getByText("Demo mode")).toBeVisible();
  await signUpDemo(page, "Demo Visitor", email);
  await expect(page.getByRole("heading", { name: "Hi, Demo" })).toBeVisible();
  await signOut(page);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("forgot password explains that email isn't set up", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByText("Email isn't set up")).toBeVisible();
});

test("deleting your account happens right away", async ({ page }) => {
  const email = uniqueEmail("demodelete");
  await signUpDemo(page, "Short Stay", email);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.fill("#delete-password", PASSWORD);
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expect(page).toHaveURL(/\/$/);
  await signIn(page, email);
  await expect(page.getByText("don't match")).toBeVisible();
});

test("the sixth sign-in attempt in a minute is rate limited", async ({ page }) => {
  await page.goto("/");
  const statuses = await page.evaluate(async (password) => {
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "nobody@example.com", password }),
      });
      codes.push(res.status);
    }
    return codes;
  }, newPassword());
  expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
  expect(statuses[5]).toBe(429);
});

test("security headers are set", async ({ page }) => {
  const response = (await page.goto("/sign-in"))!;
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("Back after leaving through the popup doesn't reopen it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("dialog").getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/sign-up/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("a hostile callbackURL on sign-up still lands on the dashboard", async ({ page }) => {
  // "/<tab>/example.com": browsers drop the tab, which would make it "//example.com".
  await page.goto("/sign-up?callbackURL=%2F%09%2Fexample.com");
  await page.fill("#name", "Stay On Site");
  await page.fill("#email", uniqueEmail("staysite"));
  await page.fill("#password", PASSWORD);
  await page.fill("#confirmPassword", PASSWORD);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("email changes apply right away, and a taken address is refused", async ({ page, newPerson }) => {
  const taken = uniqueEmail("demotaken");
  await signUpDemo(await newPerson(), "Already Here", taken);

  const first = uniqueEmail("demofirst");
  const second = uniqueEmail("demosecond");
  await signUpDemo(page, "Demo Mover", first);
  await page.goto("/settings");
  await page.fill("#account-email", taken);
  await page.getByRole("button", { name: "Change email" }).click();
  await expect(page.getByText("That email is already in use")).toBeVisible();

  await page.fill("#account-email", second);
  await page.getByRole("button", { name: "Change email" }).click();
  await expect(page.getByText("Email updated")).toBeVisible();
  await signOut(page);
  await signIn(page, first);
  await expect(page.getByText("don't match")).toBeVisible();
  await signIn(page, second);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("guessing the current password is rate limited like sign-in", async ({ page }) => {
  await signUpDemo(page, "Guess Limit", uniqueEmail("guess"));
  const statuses = await page.evaluate(
    async ([wrong, next]) => {
      const codes: number[] = [];
      for (let i = 0; i < 6; i++) {
        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ currentPassword: wrong, newPassword: next }),
        });
        codes.push(res.status);
      }
      return codes;
    },
    [newPassword(), newPassword()],
  );
  expect(statuses.slice(0, 5).every((s) => s === 400)).toBe(true);
  expect(statuses[5]).toBe(429);
});

test("signing up twice with one address says the account exists", async ({ page, newPerson }) => {
  const email = uniqueEmail("demotwice");
  await signUpDemo(page, "Here First", email);
  const other = await newPerson();
  await fillSignUp(other, "Here Second", email);
  await expect(other.getByText("An account with this email already exists")).toBeVisible();
});

test("the API refuses a profile picture or an oversized name sent around the forms", async ({ page }) => {
  await signUpDemo(page, "Field Limits", uniqueEmail("limits"));
  const result = await page.evaluate(async () => {
    const update = async (body: unknown) => {
      const res = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return [res.status, ((await res.json()) as { code?: string }).code];
    };
    return {
      image: await update({ image: "https://example.com/tracker.png" }),
      longName: await update({ name: "x".repeat(81) }),
      okName: (await update({ name: "Renamed Fine" }))[0],
    };
  });
  expect(result.image).toEqual([400, "IMAGE_NOT_ALLOWED"]);
  expect(result.longName).toEqual([400, "INVALID_NAME"]);
  expect(result.okName).toBe(200);
});
