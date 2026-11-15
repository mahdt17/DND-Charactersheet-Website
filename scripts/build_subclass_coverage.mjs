import { readFileSync, writeFileSync } from 'node:fs';

const catalogPath = new URL('../src/data/expandedSubclasses.json', import.meta.url);
const evidencePath = new URL('./data/subclass-runtime-coverage.json', import.meta.url);
const outputPath = new URL('../docs/subclass-coverage.md', import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));

const groups = [
  ['choices', 'Choice controls'],
  ['training', 'Training grants'],
  ['spells', 'Spell grants'],
  ['resources', 'Counters'],
  ['actions', 'Generic action model'],
  ['dedicated', 'Dedicated plans'],
  ['numeric', 'Recognized numeric routes'],
  ['unverifiedNumeric', 'Numeric effects awaiting verification']
];
const featureCount = catalog.reduce((count, record) => count + record.features.length, 0);
const rows = new Set();
const markdown = [
  '# 2014 subclass runtime coverage',
  '',
  `This ledger covers ${catalog.length} source records and ${featureCount} feature milestones. Published, digital and Unearthed Arcana records retain separate identities.`,
  '',
  'The entries distinguish observed data and controls from source-specific effect behavior. Generic action observations cover only candidate availability, confirmed pool spending and separately offered dice. A dedicated panel can replace the generic control. A numeric route may require the stated state, equipment or timing.',
  '',
  'Open sheet gaps are separate from table facts such as target position or an external saving throw. An unverified effect needs additional testing before it can be claimed. Resource capacities and rolls shown here are examples at the feature milestone; they can change with levels, choices or ability scores.',
  '',
  'Rebuild with `node scripts/build_subclass_coverage.mjs`. Use `--check` to verify the checked-in ledger. The checked-in source-keyed evidence is the input to this report.',
  ''
];

for (const record of catalog) {
  markdown.push(
    `## ${record.class.name} — ${record.name}`,
    '',
    `Entry level ${record.entryLevel} · [${record.sourceBook}](${record.sourceUrl})`,
    ''
  );
  if (record.spellGrants?.length) {
    const grants = new Map();
    for (const spell of record.spellGrants) {
      const grant = `level ${spell.classLevel} ${spell.acquisition}`;
      if (!grants.has(grant)) grants.set(grant, []);
      grants.get(grant).push(spell.name);
    }
    markdown.push('Source spell progression · ' +
      Array.from(grants, ([grant, spells]) => `${grant}: ${spells.join(', ')}`).join(' · '), '');
  }

  for (const feature of record.features) {
    const item = evidence[feature.id];
    if (!item || feature.level !== item.level || rows.has(feature.id)) {
      throw new Error(`Invalid coverage for ${feature.id} at level ${feature.level}`);
    }
    rows.add(feature.id);
    markdown.push(`### Level ${feature.level} · ${feature.name}`, '');
    if (item.claim) markdown.push(item.claim, '');
    for (const [field, label] of groups) {
      if (item[field]?.length) markdown.push(`- ${label} · ${item[field].join(' · ')}`);
    }
    if (item.table) markdown.push(`- Table fact · ${item.table}`);
    if (item.gap) markdown.push(`- Open sheet gap · ${item.gap}`);
    if (item.test) markdown.push(`- Verification · ${item.test}`);
    if (!item.claim && !item.gap && !item.table) {
      markdown.push('- Remaining source effects need verification.');
    }
    markdown.push('');
  }
}

if (rows.size !== Object.keys(evidence).length) throw new Error('Evidence contains unknown feature IDs');
const generated = markdown.join('\n');
if (process.argv.includes('--check')) {
  const recorded = readFileSync(outputPath, 'utf8').replaceAll('\r\n', '\n');
  if (recorded !== generated) throw new Error('Subclass runtime coverage is out of date');
} else {
  writeFileSync(outputPath, generated, 'utf8');
}
console.log(`Verified ${catalog.length} subclass records and ${rows.size} coverage entries`);
