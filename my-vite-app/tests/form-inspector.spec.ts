/**
 * Debug Script: Form Inspector
 *
 * This script helps identify the correct selectors for form elements
 * by inspecting the actual rendered HTML and logging all available
 * form fields with their attributes.
 */

import { test, expect } from "@playwright/test";

test.describe("Form Debug Inspector", () => {
  test("inspect company signup form structure", async ({ page }) => {
    // Navigate to the form
    await page.goto("/company-signup");
    await page.waitForLoadState("networkidle");

    console.log("=== COMPANY SIGNUP FORM INSPECTION ===");

    // Take a screenshot for reference
    await page.screenshot({
      path: "form-inspection-screenshot.png",
      fullPage: true,
    });

    // Get the main form element
    const form = page.locator("form").first();
    await expect(form).toBeVisible();

    console.log("\n1. FORM STRUCTURE:");
    const formHTML = await form.innerHTML();
    console.log("Form HTML (first 2000 chars):", formHTML.substring(0, 2000));

    console.log("\n2. ALL INPUT FIELDS:");
    const inputs = await page.locator("input").all();
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const id = await input.getAttribute("id");
      const name = await input.getAttribute("name");
      const type = await input.getAttribute("type");
      const placeholder = await input.getAttribute("placeholder");
      const className = await input.getAttribute("class");

      console.log(`Input ${i + 1}:`, {
        id,
        name,
        type,
        placeholder,
        className: className?.substring(0, 100) + "...",
      });
    }

    console.log("\n3. TEXTAREA FIELDS:");
    const textareas = await page.locator("textarea").all();
    for (let i = 0; i < textareas.length; i++) {
      const textarea = textareas[i];
      const id = await textarea.getAttribute("id");
      const name = await textarea.getAttribute("name");
      const placeholder = await textarea.getAttribute("placeholder");
      const className = await textarea.getAttribute("class");

      console.log(`Textarea ${i + 1}:`, {
        id,
        name,
        placeholder,
        className: className?.substring(0, 100) + "...",
      });
    }

    console.log("\n4. SELECT FIELDS:");
    const selects = await page.locator("select, .ant-select").all();
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const id = await select.getAttribute("id");
      const className = await select.getAttribute("class");

      console.log(`Select ${i + 1}:`, {
        id,
        className: className?.substring(0, 100) + "...",
      });
    }

    console.log("\n5. FORM ITEMS (ANT DESIGN):");
    const formItems = await page.locator(".ant-form-item").all();
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      const label = await item
        .locator("label")
        .textContent()
        .catch(() => "");
      const controls = await item
        .locator(".ant-form-item-control")
        .innerHTML()
        .catch(() => "");

      console.log(`Form Item ${i + 1}:`, {
        label,
        controls: controls.substring(0, 200) + "...",
      });
    }

    console.log("\n6. BUTTONS:");
    const buttons = await page.locator("button").all();
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const type = await button.getAttribute("type");
      const className = await button.getAttribute("class");

      console.log(`Button ${i + 1}:`, {
        text,
        type,
        className: className?.substring(0, 100) + "...",
      });
    }

    console.log("\n7. STEP INDICATORS:");
    const steps = await page.locator(".ant-steps-item").all();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const title = await step
        .locator(".ant-steps-item-title")
        .textContent()
        .catch(() => "");
      const description = await step
        .locator(".ant-steps-item-description")
        .textContent()
        .catch(() => "");
      const isActive = await step.getAttribute("class");

      console.log(`Step ${i + 1}:`, {
        title,
        description,
        isActive: isActive?.includes("active"),
      });
    }

    console.log("\n=== INSPECTION COMPLETE ===");

    // Keep the page open for manual inspection if needed
    await page.waitForTimeout(2000);
  });

  test("test specific form field interactions", async ({ page }) => {
    await page.goto("/company-signup");
    await page.waitForLoadState("networkidle");

    console.log("\n=== TESTING FORM FIELD INTERACTIONS ===");

    // Test company name field
    console.log("\n1. Testing Company Name field:");
    const companyNameSelectors = [
      'input[name="companyName"]',
      'input[id*="companyName"]',
      "#companyName",
      '.ant-form-item:has(label:text("اسم الشركة")) input',
    ];

    for (const selector of companyNameSelectors) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible();
        console.log(
          `  Selector "${selector}": ${isVisible ? "FOUND" : "NOT FOUND"}`
        );

        if (isVisible) {
          await element.fill("Test Company Name");
          const value = await element.inputValue();
          console.log(`    Successfully filled with: "${value}"`);
          await element.clear();
        }
      } catch (error) {
        console.log(`  Selector "${selector}": ERROR - ${error}`);
      }
    }

    // Test company description field
    console.log("\n2. Testing Company Description field:");
    const descriptionSelectors = [
      'textarea[name="companyDescription"]',
      'textarea[id*="companyDescription"]',
      "#companyDescription",
      '.ant-form-item:has(label:text("وصف الشركة")) textarea',
    ];

    for (const selector of descriptionSelectors) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible();
        console.log(
          `  Selector "${selector}": ${isVisible ? "FOUND" : "NOT FOUND"}`
        );

        if (isVisible) {
          await element.fill(
            "Test company description that is longer than 10 characters"
          );
          const value = await element.inputValue();
          console.log(
            `    Successfully filled with: "${value.substring(0, 50)}..."`
          );
          await element.clear();
        }
      } catch (error) {
        console.log(`  Selector "${selector}": ERROR - ${error}`);
      }
    }

    // Test city select field
    console.log("\n3. Testing City Select field:");
    const citySelectors = [
      "#companyCity",
      '[id*="companyCity"]',
      '.ant-form-item:has(label:text("المدينة")) .ant-select',
      ".ant-select",
    ];

    for (const selector of citySelectors) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible();
        console.log(
          `  Selector "${selector}": ${isVisible ? "FOUND" : "NOT FOUND"}`
        );

        if (isVisible) {
          await element.click();
          await page.waitForTimeout(500);

          // Check if dropdown opened
          const dropdown = page.locator(".ant-select-dropdown");
          const dropdownVisible = await dropdown.isVisible();
          console.log(`    Dropdown opened: ${dropdownVisible}`);

          if (dropdownVisible) {
            // Try to select Damascus
            const option = page.locator('.ant-select-item:has-text("دمشق")');
            const optionVisible = await option.isVisible();
            console.log(`    Damascus option found: ${optionVisible}`);

            if (optionVisible) {
              await option.click();
              console.log(`    Successfully selected Damascus`);
            }
          }

          // Close dropdown if still open
          await page.keyboard.press("Escape");
        }
      } catch (error) {
        console.log(`  Selector "${selector}": ERROR - ${error}`);
      }
    }

    console.log("\n=== INTERACTION TESTING COMPLETE ===");
  });
});
