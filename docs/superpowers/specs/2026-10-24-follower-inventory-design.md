# Follower inventories and accessible notes

The user requested inventories similar to the main character sheet and notes at the bottom of thrall sheets, with everything easily accessible. Add Inventory to the existing follower action picker. Reuse the main inventory controls: published/basic equipment, custom items, details, quantity, equipped marker, item notes, carried weight and coin balances. Thralls, believers and recorded creatures each own their inventory and currency; edits never change the player or another follower.

Move the existing n.notes editor out of Manage to an always-visible Notes section at the bottom of the expanded sheet. Keep existing text and saved fields intact. Panels remain mounted so unfinished item searches/custom names survive switching actions and roster regrouping. Old saves missing inventory/currency start empty; new sheets receive independent empty inventories and coin balances.

Approaches: duplicating the main inventory would drift over time; extracting its small existing component lets both interfaces use the same controls. Choose the shared component as the implementation default because the user explicitly requested the established main-sheet behavior. No new dependencies, catalog changes or database migrations. Player equipment still updates player armor/actions as before. NPC equipped markers track gear; NPC armor/attack conversion remains editable in Manage, with concise guidance beside their items.

Deliver a tested, reviewable PR. Merge/deployment remains a separate user action.
