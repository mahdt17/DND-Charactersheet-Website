// A batch can include attacks, damage and bonus dice. Older rows remain visible
// while the new batch rolls, so wait for the current history to finish updating.
export async function waitForRollHistory(page) {
  const history=page.locator('.roll-history[aria-busy="false"]');
  await history.locator('.roll-result strong').first().waitFor({timeout:30000});
}
