import { expect, test } from "@playwright/test";

test("landing exposes the manual tabs", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#home")).toBeVisible();
  await expect(page.locator("#app")).toBeHidden();
  await expect(page.locator("#manual")).toBeVisible();
  await expect(page.locator(".docs-tab")).toHaveCount(7);
  await expect(page.getByRole("tab", { name: "ENGINE" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("tab", { name: "PIPELINE" }).click();
  await expect(page.locator("#how")).toBeVisible();
  await expect(page.locator("#engine")).toBeHidden();
});
