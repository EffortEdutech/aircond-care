import { test, expect } from "@playwright/test";
import { login, logout, USERS } from "./helpers";

// One booking followed through request -> accept -> pay (sandbox) -> schedule.
// Runs in order and shares state. It creates a real booking in the test project each run.
// Not covered here: the technician's job report (needs photos) and the confirm/dispute steps;
// follow the manual checklist for those.
test.describe.serial("booking journey (sandbox payment)", () => {
  let bookingUrl = "";

  test("customer requests a fixed-price service from the test contractor", async ({ page }) => {
    await login(page, USERS.customer);
    await page.goto("/contractors");
    await page.getByRole("link", { name: /Cool Breeze/i }).first().click();
    await page.locator('a[href^="/book/"]').first().click();
    await expect(page).toHaveURL(/\/book\//);

    // choose the first real service for each unit shown
    const selects = page.locator('select[name^="service_"]');
    const n = await selects.count();
    expect(n, "customer1 needs at least one unit registered").toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await selects.nth(i).selectOption({ index: 1 });
    }
    await page.locator('textarea[name="fault_description"]').fill("e2e test: not cold");
    await page.getByRole("button", { name: "Send request" }).click();
    await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]{36}/);
    bookingUrl = new URL(page.url()).pathname;
  });

  test("contractor accepts at the listed price", async ({ page }) => {
    test.skip(!bookingUrl, "no booking from the previous step");
    const id = bookingUrl.split("/").pop();
    await login(page, USERS.owner);
    await page.goto(`/work/${id}`);
    await page.getByRole("button", { name: /Accept at listed price/ }).click();
    await expect(page.getByText(/pay|awaiting|accepted/i).first()).toBeVisible();
  });

  test("customer pays with the sandbox gateway", async ({ page }) => {
    test.skip(!bookingUrl, "no booking from the previous step");
    await login(page, USERS.customer);
    await page.goto(bookingUrl);
    await page.getByRole("button", { name: "Pay now" }).click();
    await expect(page).toHaveURL(/\/pay\/sandbox\//);
    await page.getByRole("button", { name: "Pay successfully" }).click();
    await expect(page).toHaveURL(new RegExp(bookingUrl));
    await expect(page.getByText(/paid/i).first()).toBeVisible();
  });

  test("contractor schedules the visit after payment", async ({ page }) => {
    test.skip(!bookingUrl, "no booking from the previous step");
    const id = bookingUrl.split("/").pop();
    await login(page, USERS.owner);
    await page.goto(`/work/${id}`);

    const start = page.locator('input[name="start"]');
    await start.fill(new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 16));
    await page.locator('select[name="technician"]').selectOption({ index: 1 });
    await page.getByRole("button", { name: "Confirm schedule" }).click();
    await expect(page.getByText(/scheduled/i).first()).toBeVisible();
  });

  test("another customer cannot open this booking", async ({ page }) => {
    test.skip(!bookingUrl, "no booking from the previous step");
    await logout(page);
    await login(page, USERS.customer2);
    const res = await page.goto(bookingUrl);
    expect(res?.status() === 404 || (await page.getByText(/not found|could not find/i).count()) > 0).toBeTruthy();
  });
});
