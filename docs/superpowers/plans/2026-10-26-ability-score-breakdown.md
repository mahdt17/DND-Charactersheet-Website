# Ability-score breakdown popups

User request: after merging Variant Human, let each ability score open a small, closable breakdown like the supplied screenshot, with editable scores.

Design: keep the existing ability-check roll controls. Make the displayed score a separate accessible popup button. The existing modal shows total score, modifier, base score, recorded species/background bonus, supported feat increases and active effects, using the same calculation as the sheet. Edit the base and recorded bonus with a live preview; Save applies both, Cancel/Escape/backdrop discards the draft. No separate override hierarchy or new character schema is needed to correct a score. Permanent increases already stored in the base are not counted again. Preserve other scores and legacy racial fallbacks when editing a bonus.

Implementation: add failing calculation/edit and browser checks; extract a shared breakdown from abilityScores.js without changing arithmetic; add a compact accessible modal and score buttons; update the two browser selectors that previously assumed a tile had only one button. Verify real save/reopen, downstream rolls, invalid input, cancellation, all six abilities and mobile layout. Run the full rules suite and build; get one fresh independent review.

Base: d1394a5 (merged Human PR35, all six GitHub workflows successful). Isolated branch codex/ability-score-breakdown. Paused dice checkout untouched.

Verification: initial unit tests failed because breakdown/edit APIs were absent, and browser test failed because score popup triggers were absent. Both now pass. Save/reopen assertions wait for the existing debounced save. A failing keyboard-focus assertion led to explicit focus restoration and controlled Escape dismissal in the shared dialog; the browser regression now passes.

Final review: fresh independent reviewer found no blocking defects, with one source-label concern. Because the feature is intended to audit scores, clarified saved bonuses as species/background or manual adjustments rather than asserting canonical provenance. Added a failing-then-passing source-label test; no new character fields or override layers required. No deferred findings.

Final validation: full npm test PASS; npm run build PASS (existing large-bundle warning); new browser score test PASS for all six abilities, preview/edit/save/reopen, invalid input, rolls, Cancel/Escape/backdrop/focus and 390px mobile layout. Existing browser-editions, browser-class-effects35-checks and browser-subclass-feat-magic all PASS. Desktop and mobile screenshots inspected.
