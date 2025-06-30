import { test } from "@playwright/test";

test("inspect form structure", async ({ page }) => {
  await page.goto("/create-account");
  await page.waitForLoadState("networkidle");

  // Get all input elements and their attributes
  const inputs = await page.locator("input").all();

  console.log("\n=== FORM INPUTS ===");
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = (await input.getAttribute("type")) || "text";
    const id = (await input.getAttribute("id")) || "no-id";
    const name = (await input.getAttribute("name")) || "no-name";
    const placeholder =
      (await input.getAttribute("placeholder")) || "no-placeholder";

    console.log(
      `Input ${i}: type="${type}", id="${id}", name="${name}", placeholder="${placeholder}"`
    );
  }

  // Get form structure
  const formHtml = await page.locator("form").innerHTML();
  console.log("\n=== FORM STRUCTURE ===");
  console.log(formHtml.substring(0, 1000) + "...");
});
