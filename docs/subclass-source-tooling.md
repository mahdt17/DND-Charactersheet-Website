# 2014 subclass source data

The canonical audited inputs live in `scripts/data/subclasses2014`: the inventory records source URLs, the source snapshots preserve the reviewed text, and the two mechanics audits preserve the structured findings. `SHA256SUMS` lists a SHA-256 digest for each input. These files are used by build tools only and are not imported into the browser bundle.

Run `npm run subclasses:verify-data` to check hashes and compare the generated subclass catalog, source manifest, subclass spell catalog, mechanics, and additional choice-spell catalog with their checked-in outputs. This command does not write generated files or depend on `.superpowers`.

To regenerate after intentionally editing the audited inputs, first update and review their hashes, then run:

```
node scripts/build_expanded_subclasses.mjs --source-dir scripts/data/subclasses2014
node scripts/build_subclass_mechanics.mjs --audit-dir scripts/data/subclasses2014
node scripts/build_subclass_choice_spells.mjs
npm run subclasses:verify-data
```

Runtime capability coverage in `docs/subclass-coverage.md` is a separate contract from the source inventory and generated mechanics metadata; these generators do not overwrite it.
The audited inputs and exact generator outputs have path-scoped `-text` attributes, so Git preserves their bytes across platforms regardless of local line-ending settings. The hash manifest covers the input bytes; generated-file verification compares the bytes produced by the scripts with the checked-in outputs.
