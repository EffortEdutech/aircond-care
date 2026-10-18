import { test, expect } from "@playwright/test";

test.describe("public pages", () => {
  for (const path of ["/", "/terms", "/privacy", "/refunds", "/contractor-terms", "/support", "/login", "/signup"]) {
    test(`${path} loads with a heading and no horizontal scroll`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("legal pages show the draft banner", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  test("sign-up needs the terms box ticked", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('input[name="accept_terms"]')).toBeVisible();
  });

  test("health endpoint answers and hides detail without the secret", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.missingEnv).toBeUndefined();
  });
});
