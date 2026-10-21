# Player experience cleanup

The existing rules and character data format are unchanged. This update refines the screens used to create and play a character:

- Creation explains the next missing choice, including skill, language and spell counts. An untouched name field does not begin in an error state.
- Phone layouts provide Actions, Spells, Inventory and Checks shortcuts near the character header. Stats are more compact; the play panel appears before the detailed checks on phones.
- Sheet tabs support Left/Right, Home and End keys, keep the selected tab visible, and label their associated panel.
- HP controls label the amount and announce the resulting HP after damage/healing. Errors appear beside the controls.
- Resource counters retain their controls and totals while recovery/source explanations are expandable. Manual restoration feedback reports the actual number restored.
- Configured Entomancers show gameplay before setup/reference details. Setup stays mounted and open during editing, and incomplete characters have a direct setup shortcut. Ability options are grouped by activation, irrelevant creature-type inputs are hidden, and successful actions provide feedback.
- Long action descriptions are expandable. Focus outlines, tab text and touch targets are clearer; light/dark themes and scenic backgrounds remain available.

Run `npm run test:browser:usability` for the new interaction coverage. The full modernization workflow runs it after installing Chromium. Existing creation, Entomancer, resource and main app browser suites also verify the affected flows. Browser tests accept `BROWSER_EXECUTABLE_PATH` for an installed Chromium browser.
