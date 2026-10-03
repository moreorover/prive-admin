import { expect, test } from "@playwright/test"

test("member access opens the sign-in screen", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("link", { name: "Member Access" }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible()
})
