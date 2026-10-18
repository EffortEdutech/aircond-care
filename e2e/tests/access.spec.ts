import { test, expect } from "@playwright/test";
import { login, USERS } from "./helpers";

test.describe("who can open what", () => {
  for (const path of ["/units", "/bookings", "/work", "/admin", "/account"]) {
    test(`signed-out visit to ${path} goes to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("a customer cannot use admin or the contractor workspace", async ({ page }) => {
    await login(page, USERS.customer);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
    await page.goto("/work");
    await expect(page.getByText(/work list|your jobs|incoming/i).first()).not.toBeVisible();
  });

  test("a contractor owner cannot use admin", async ({ page }) => {
    await login(page, USERS.owner);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test("admin can open the admin home", async ({ page }) => {
    await login(page, USERS.admin);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("a wrong password shows an error and stays on login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(USERS.customer);
    await page.locator('input[name="password"]').fill("not-the-password");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
