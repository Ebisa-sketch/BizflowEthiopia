import { expect, test } from "@playwright/test";

for (const path of ["/dashboard", "/sales/new", "/settings"]) {
  test(`redirects unauthenticated users away from ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  });
}

test("rejects a present but invalid session cookie", async ({ page, context }) => {
  await context.addCookies([
    {
      name: "bizflow_session",
      value: "this-is-not-a-valid-signed-session-cookie",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
});

test("keeps the login page public without a session", async ({ page }) => {
  await page.goto("/login");

  await expect(page).toHaveURL(/\/login$/);
});
