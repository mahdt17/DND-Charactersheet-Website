# Canonical content model

Step one of the content overhaul introduces one normalized shape for rules content before the UI, multiclass engine, or editable overrides depend on it.

## Goals

Every class, subclass, race/species, feat, spell, feature, trait, item/equipment entry, background, monster and reference entry can expose the same top-level fields:

- `schemaVersion`
- `catalogId`
- `contentType`
- `edition`
- `name`
- `description`
- `sourceMeta`
- `stats`
- `prerequisites`
- `progression`
- `editable`
- `completeness`

Existing source-specific fields are preserved so current code is not broken while later work migrates to the normalized fields.

## Editions

The normalized edition IDs are:

- `3.5`
- `2014` for 5e / SRD 5.1
- `2024` for revised 5e / SRD 5.2.1
- `custom`

Legacy labels such as `3.5-reference`, `5e`, and `5.5e` are normalized at the boundary.

## Source and licensing metadata

`sourceMeta.kind` distinguishes licensed SRD data, external reference indexes, and homebrew. An external source URL is metadata; it does not make third-party prose redistributable.

Bundled SRD descriptions can remain full rules text where the repository's existing licenses permit it. External references from DnD Tools or the 5e Wikidot must not be treated as though their full prose were bundled SRD content.

## Completeness

Missing data is explicit rather than replaced with placeholder prose. `completeness.missing` may contain:

- `description`
- `stats`
- `source`
- `prerequisites`
- `progression`

This lets later UI show exactly what needs to be completed and lets the prestige prerequisite engine avoid interpreting a missing requirement as "no requirement."

## Current source layers

The repository currently contains:

1. 2014 SRD datasets with descriptions and structured mechanics.
2. 2024 SRD datasets with descriptions and structured mechanics.
3. A 3.5 SRD dataset with descriptions, classes, spells, races, feats and source tables.
4. A complete DnD Tools index across 14 public categories. This index intentionally contains names and source links rather than copied source-book prose.

The DnD Tools loader now normalizes reference entries and marks absent descriptions/stats/progression as incomplete instead of inventing a generic description.

## Next content step

The next phase builds persistent user overrides on top of these canonical records. Overrides will be able to fill or change descriptions, stats, prerequisites, progression and source notes without mutating the bundled source record.
