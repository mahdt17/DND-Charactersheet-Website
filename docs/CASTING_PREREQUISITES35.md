# Reviewed casting prerequisites

The shared requirements evaluator accepts `{kind: 'spellcasting', minimum: 3,
tradition: 'arcane'}`. Minimum is a spell level from 0 through 9; tradition is
optional, or exactly arcane/divine. It composes with existing all/any/count
groups and uses distinct confirmation identities. It does not mean caster
level, known spells of a particular name, or remaining uses today.

Closed source clauses such as “Ability to cast 3rd-level arcane spells” and
fully specified arcane/divine AND/OR alternatives lower to these predicates.
Narrative restrictions, named spells, spontaneous/prepared distinctions,
infusion/power/spell-like alternatives and partial matches remain manual.
Source records with flattened staged entry requirements or cross-clause OR
requirements remain manual too; no class-name exclusions are used.

The adapter reuses the existing per-class spell-slot progression parser and
reviewed source features. Spell access and bonus-slot abilities are explicit
metadata on 19 previously reviewed casting feature records, transcribed from
their existing descriptions. These are separate for the Archivist; access
also remains separate from save DCs for Favored Soul and Spirit Shaman.
Missing or ambiguous metadata is unresolved, never supplied by a class name.

Qualification requires an unlocked spell level, the applicable ability score,
and a positive normal slot count or an applicable bonus slot for a printed
zero. A dash never unlocks bonus spells. Slots spent today, slot overrides,
global caster-level fields and cached classSpellSlots do not grant eligibility.
This checks class casting capability rather than a day's selected preparation.

Prestige advancement is counted only when its source class and level still
exist and its saved choice matches the current source-derived advancement
plan. Entries must match their group identity, kind and unit amount. Duplicate
entries count once; orphaned, conflicting and future grants do not count.
Source and target row/definition identities must agree. Traditions are checked
per class; multiclass slot levels are never summed. This validation is local to
qualification and does not rewrite the existing saved progression model.

`scripts/audit_casting_prerequisites35.mjs` exports exact source IDs and clauses.
At this checkpoint, 151 class records have recognized clauses; Ardent
Dilettante and Ruathar remain manual because of source scope. Recognition is
not a class-completion or whole-entry eligibility claim. Every actual character
still needs sufficient reviewed casting capability and its other requirements.

Tests cover ability thresholds and malformed values, printed zero/dash,
tradition separation, dual progression, source conflicts, stale/duplicate
advancement, persistence, cleanup and real Requirements/feature-choice UI.
Certification totals remain 0 certified, 127 pending and 927 blocked. No tracker
status or evidence-manifest entry is promoted by this subsystem change.
