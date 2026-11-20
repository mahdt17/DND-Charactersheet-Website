import assert from "node:assert/strict";
import { chromium } from "playwright";

const app = process.env.SIGNUP_TEST_URL;
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  let returnAddress;
  await page.route("**/auth/v1/signup?*", async route => {
    returnAddress = new URL(route.request().url()).searchParams.get("redirect_to");
    await route.fulfill({ json: { id: "test-user", email: "player@example.test", identities: [] } });
  });
  await page.goto(app + "?from=invite#party");
  await page.getByRole("button", { name: "Create a new account" }).click();
  await page.getByLabel("Email", { exact: true }).fill("player@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Test-ledger-42");
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByText("Account created. Check your email to confirm your account.").waitFor();
  assert.equal(returnAddress, app);
  assert.equal(await page.getByLabel("Password", { exact: true }).inputValue(), "");
  await page.getByRole("button", { name: "Enter the Ledger" }).waitFor();

  // Open the email in a fresh browser context, as a player can do on another device.
  const confirmation = await browser.newPage();
  const authRequests = [];
  confirmation.on("request", req => { if (req.url().includes("/auth/v1/")) authRequests.push(req.url()); });
  await confirmation.goto(returnAddress + "#access_token=fixture&refresh_token=fixture&type=signup&token_type=bearer&expires_in=3600");
  await confirmation.getByText("Email confirmed. Sign in to your ledger.").waitFor();
  await confirmation.getByRole("button", { name: "Enter the Ledger" }).waitFor();
  assert.equal(confirmation.url(), app);
  assert.deepEqual(authRequests, []);
  await confirmation.reload();
  await confirmation.getByRole("button", { name: "Enter the Ledger" }).waitFor();
  assert.equal(await confirmation.getByText("Email confirmed. Sign in to your ledger.").count(), 0);
} finally {
  await browser.close();
}
