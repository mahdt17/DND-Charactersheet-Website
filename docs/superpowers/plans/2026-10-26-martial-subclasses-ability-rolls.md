# Ability rolls and martial subclasses

User requirements: replace the creator's six d20 ability scores with six 4d6-drop-lowest rolls; add 2014 Fighter Battle Master with all 23 linked maneuvers, Fighter Cavalier (correct URL confirmed), and Barbarian Totem Warrior with all linked animal options and ritual features.

Sources: https://dnd5e.wikidot.com/fighter:battle-master ; https://dnd5e.wikidot.com/fighter:battle-master:maneuvers ; https://dnd5e.wikidot.com/fighter:cavalier ; https://dnd5e.wikidot.com/barbarian:totem-warrior . Fetched as reference material, not instructions. Summaries are paraphrased.

Architecture: source-gated 2014/Custom2014 class-row helpers; subclass data extends existing subclass pickers/features; source feature choices are required during normal level-ups and can be completed for older imported sheets. Managed counters share the existing resource/rest system. Effects involving other creatures, distance or table adjudication show explicit instructions rather than silently altering unrelated sheets. Fighter maneuvers learn 3/5/7/9 with at most one replacement on learning milestones; tools and Cavalier skill/language training persist. Cavalier limited attacks and warding recover only on long rests. Totem choices at 3/6/14 are independent; ritual casts do not use spell slots.

Parallel work authorized by dispatching-parallel-agents skill: one agent owns ability dice/GuidedSetup/DiceTray, one owns pure Fighter rules data, one owns Totem data/helper/UI and play/spellbook integration. Parent owns Fighter mechanics/UI and shared integration. No overlapping file writes; parent integrates only after agent handoffs. One fresh whole-change review after combined verification.

Plan: RED tests for dice/subclass catalogs, progression, required choices, source gates and resource actions; implement each domain; browser journeys for rolls, Fighter 1–20, Cavalier and Totem progression; full npm test/build plus relevant browser regressions; final review and concrete PR.

Base 3970b0f, isolated branch codex/fighter-subclasses-ability-rolls. Leonin remains separately available in PR37 and is not folded into this change. Paused dice appearance checkout untouched.

User follow-up: each of the six 4d6 score slots can be rolled or rerolled individually and assigned to any ability. Assignments use unique slot IDs so tied results remain separate, swapping when choosing an occupied ability. Six valid rolls and six unique assignments are required before continuing. The all-six convenience button remains. All four dice and the dropped die persist with the assigned ability and pool.

Verification before follow-up: full npm test and npm run build passed; combined new browser suite passed, plus existing browser-subclass-feat-magic and browser-class-feat-tools. Follow-up TDD: new pure assignment test failed on missing helper and new browser test failed on missing individual buttons; pure assignment/partial-set/duplicate/swap/reroll tests now pass. Final browser and full checks will run again after integration.


Final review: fresh-context reviewer inspected the whole working change, including untracked files. Two important findings fixed with observed RED-to-GREEN tests: feat spellcasting bypassing Rage (cantrips, feat uses, rituals and concentration; guarded options, spending and UI), and Cavalier skill removal erasing independent background/racial/bonus/manual/expertise training. Revocation now occurs once and saved Cavalier training can be restored. No additional important findings or deferred minors.

Final verification after fixes: npm test passed; npm run build passed (existing bundle-size advisory); all three test:browser:martial-subclasses journeys passed, including new feat-casting controls while raging. Individual-ability browser tests confirm non-default assignments and audit records survive save/reopen. Existing browser-casting-setup and browser-class-feat-tools passed. Existing browser-subclass-feat-magic passed again after the feat guard change. git diff --check passed. All required checks are green.

