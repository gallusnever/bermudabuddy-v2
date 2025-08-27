import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.addCookies([{
    name: "bb_e2e",
    value: "1",
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    expires: Math.floor(Date.now()/1000) + 3600
  }]);
});

test("dashboard page loads", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");
});