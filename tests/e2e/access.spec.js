import { expect, test } from "@playwright/test";

const API_URL = process.env.API_URL;
const ADMIN = {
  user: process.env.ADMIN_USER,
  password: process.env.ADMIN_PASSWORD,
};
const ANALYST = {
  user: process.env.ANALYST_USER,
  password: process.env.ANALYST_PASSWORD,
};

async function signIn(page, { user, password }) {
  await page.locator('[data-goto="login"]').first().click();
  await page.locator('#login-form input[name="username"]').fill(user);
  await page.locator('#login-form input[name="password"]').fill(password);
  await page.locator("#login-submit").click();
}

test.describe("access control", () => {
  test.skip(!API_URL, "set API_URL to run the system tests");

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto(`/?api=${encodeURIComponent(API_URL)}`);
    await page.locator('[data-goto="login"]').first().click();
    await page.locator('#login-form input[name="username"]').fill("nobody");
    await page.locator('#login-form input[name="password"]').fill("wrong");
    await page.locator("#login-submit").click();

    await expect(page.locator("#login-error")).toContainText("Invalid");
  });

  test("admin reaches the console and the admin tab", async ({ page }) => {
    test.skip(
      !ADMIN.user || !ADMIN.password,
      "set ADMIN_USER and ADMIN_PASSWORD",
    );
    await page.goto(`/?api=${encodeURIComponent(API_URL)}`);
    await signIn(page, ADMIN);

    await expect(page.locator("#app")).toBeVisible();
    await expect(page.locator("#tab-admin")).toBeVisible();
  });

  test("analyst does not see the admin tab", async ({ page }) => {
    test.skip(
      !ANALYST.user || !ANALYST.password,
      "set ANALYST_USER and ANALYST_PASSWORD",
    );
    await page.goto(`/?api=${encodeURIComponent(API_URL)}`);
    await signIn(page, ANALYST);

    await expect(page.locator("#app")).toBeVisible();
    await expect(page.locator("#tab-admin")).toBeHidden();
  });
});
