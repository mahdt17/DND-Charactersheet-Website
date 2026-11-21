# Live combat plan — timed effects

**Status:** Planned. Integrate with turn advancement, sheet actions, conditions, and the DM encounter log.

## What players and the DM see

Show active effects near the character sheet’s combat controls. Include the effect name, time remaining, and concentration marker where applicable. For example, Finral’s sheet might show **Bladesong · 0:54 · 9 rounds**. For a turn-specific duration, use wording such as **Until the start of Finral’s next turn**. Show the same values on the DM’s shared sheet and the appropriate affected targets. Keep hidden combatants and private effect sources within the DM’s visibility controls.

## When the clock advances

- Treat one complete initiative rotation as six seconds of game time. Anchor a timed effect to where it began in the order. An effect activated by the last combatant stays at 1:00 when the first combatant acts and reaches 0:54 when a full rotation has elapsed since activation.
- Apply the same calculation to timed features, spells, conditions, items and custom effects. Keep explicit start-of-turn and end-of-turn deadlines tied to the named creature and phase. An instantaneous effect has no countdown.
- Use the authoritative encounter turn state and stable combatant identifiers. Reactions, extra actions, player reconnects, retries, and roster visibility changes do not advance time. Verify that adding or removing a combatant cannot skip or repeat a timer tick. Preserve remaining game time on effects that outlast combat; the DM can advance elapsed time between encounters.

## When an effect ends early

- Read duration, renewal and ending conditions from the version of the feature the sheet uses, including level-based exceptions. Base 2014 Rage has a one-minute maximum and ends on unconsciousness. Check its attack/damage upkeep at the proper turn end. Base 2024 Rage has a different renewal rule and a ten-minute maximum.
- For Tasha’s Bladesong, handle incapacitation, disallowed armor or shield use, a two-handed weapon attack, and voluntary dismissal. Remove granted bonuses together with the effect.
- Track concentration on the caster, with dependent effects linked to affected targets. Taking damage prompts the required save. A success preserves the timer. A failure, incapacitation, death, voluntary release, or starting another concentration spell ends concentration immediately. Resolve spell-specific consequences for each affected target.
- Let the DM end an effect or correct its remaining duration when adjudicating untracked actions or homebrew. Record starts, endings and DM corrections in the existing DM log with the reason. Compute displayed countdowns from shared encounter state without per-second database writes or per-round log entries for every effect.

## Acceptance checks

1. Activate a one-minute effect mid-round. Confirm 1:00 on activation, 0:54 after one full rotation, 0:06 after nine and expiration after ten. Verify matching times on both sheets after refresh.
2. Resolve a reaction and retry a turn advancement from a second tab. Confirm the clock advances exactly once for the completed rotation.
3. Knock a raging barbarian unconscious and confirm Rage ends during that turn. Incapacitate Finral during Bladesong and confirm the effect and its AC bonus disappear together.
4. For a concentration spell on several targets, test a successful save, a failed save and starting a new concentration spell. Confirm each affected sheet updates immediately and reveals only information visible to its viewer.
5. End combat with time remaining on a longer spell and confirm its remaining duration carries forward.

## Rules references

- [Combat rounds](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/combat)
- [2014 Rage](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/classes) and [2024 Rage](https://www.dndbeyond.com/sources/dnd/br-2024/character-classes)
- [Bladesong from Tasha’s Cauldron of Everything](https://www.dndbeyond.com/posts/1048-wizard-101-bladesinging-from-tashas-cauldron-of)
- [Concentration](https://www.dndbeyond.com/sources/dnd/basic-rules-2014/spellcasting) and [timing when replacing a concentration spell](https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium)
