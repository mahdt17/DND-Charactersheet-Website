# Class spell progressions

Supported 2014 and revised classes use their published spell-slot tables at each class level, including Custom characters. This includes the core twelve classes, Eldritch Knight, Arcane Trickster, the 2014 Artificer, and the supported 2014 Entomancer. Approved campaign conversions retain their dedicated progression rules.

Slots determine casts; spells known, spellbook additions, cantrips, and prepared spells have separate limits. Spell choices use the owning class's level. Higher multiclass slots allow upcasting without unlocking higher-level choices for an underleveled class. Pact Magic remains a separate pool in multiclass characters and recovers on short rests.

Saved `unrestrictedSpellAccess` flags no longer bypass class lists, editions or level gates. Specific source-backed feature grants remain supported. Stored slot overrides cannot replace verified automatic tables. Unsupported classes and cross-edition combinations retain explicitly labeled manual totals; these require checking their actual source.

The level-up wizard displays the class's next-level slots and spell selection limits. The spell management screen displays verified totals as read-only. Saved spells remain intact; invalid choices are marked for review and cannot be cast through the normal class path.

For 3.5, the source-table parser now recognizes numeric spell headers and daily infusion headings, rejects advancement data rows mistaken for headers, and recognizes explicit spellcaster-level advancement wording. Reviewed casting metadata supplies minimum casting abilities and bonus-slot abilities independently of spell DC abilities. For example, Archivists use Intelligence for access and Wisdom for bonus slots; Favored Souls and Spirit Shamans retain their separate DC abilities. Printed zero daily slots unlock ability-bonus slots; a dash does not.

Verification:

- `tests/spell-progression-matrix.mjs`: 600 class/subclass level rows in ordinary and Custom modes; 39,330 legal two-class combinations across the supported 2014 and revised profiles, including half/third caster rounding and Pact Magic.
- `tests/legacy-spell-progression-matrix.mjs`: 145 annotated daily/infusion matrices, 2,226 level rows and 15,970 printed cells across the 1,054-record 3.5 catalog, plus advancement parser regressions.
- `tests/legacy-spell-ability.mjs`: non-core bonus slots, printed-zero slots, minimum abilities and split access/bonus/DC abilities.
- Browser regressions cover character creation, leveling, spell management, class ownership, casting and rest recovery.

Table fidelity does not certify all rules of every 3.5 source. Gnome Artificer blueprints and Shadowcaster mysteries are not treated as ordinary daily spell slots. Chameleon focus and Maho-tsukai Taint rules remain manual until those source-specific values are modeled. Fixed daily casting abilities for Artificer, Cultist of the Shattered Peak, Ocular Adept and Shaman are source-reviewed. Some other source classes lack reviewed ability metadata, special casting semantics or clean advancement text. Such source gaps remain subject to the linked class rules rather than invented mechanics.

Primary shared rules: [SRD 5.1](https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf), [SRD 5.2.1](https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf). Individual imported class tables retain their catalog source identities.
