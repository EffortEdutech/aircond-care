import { expect, type Page } from "@playwright/test";

export const PASSWORD = process.env.TEST_PASSWORD ?? "AircondTest#2026";
export const USERS = {
  customer: "test.customer1@example.test",
  customer2: "test.customer2@example.test",
  owner: "test.owner1@example.test", // owner of [TEST] Cool Breeze Aircond (pro)
  admin: "test.admin@example.test",
};

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
