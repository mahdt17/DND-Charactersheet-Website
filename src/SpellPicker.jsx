import React, { useState } from 'react';

export default function SpellPicker({ title, spells, selected, limit, onToggle }) {
  const [query, setQuery] = useState('');
  const [school, setSchool] = useState('all');
  const [level, setLevel] = useState('all');
  const [kind, setKind] = useState('all');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [page, setPage] = useState(0);
  const schools = [...new Set(spells.map(s => s.school).filter(Boolean))].sort();
  const levels = [...new Set(spells.map(s => s.level))].sort((a,b) => a-b);
  const filtered = spells.filter(s =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()) &&
    (school === 'all' || s.school === school) &&
    (level === 'all' || s.level === Number(level)) &&
    (kind === 'all' || kind === 'ritual' && s.ritual || kind === 'concentration' && s.concentration) &&
    (!selectedOnly || selected.includes(s.name))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, pages - 1);
  const change = setter => e => { setter(e.target.value); setPage(0); };
  return <section className="creation-section spell-picker" aria-label={title}>
    <div className="creation-section-title">{title} <span aria-live="polite">{selected.length} / {limit} selected</span></div>
    {selected.length > 0 && <div className="spell-picker-selected">{selected.map(name =>
      <button type="button" className="skill-pill is-selected" key={name} aria-label={`Remove ${name}`} onClick={() => onToggle(name)}>{name} ×</button>
    )}</div>}
    <div className="spell-picker-filters">
      <label className="creation-field"><span>Search spells</span><input value={query} onChange={change(setQuery)} placeholder="Spell name…" /></label>
      <label className="creation-field"><span>School</span><select value={school} onChange={change(setSchool)}><option value="all">All schools</option>{schools.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="creation-field"><span>Level</span><select value={level} onChange={change(setLevel)}><option value="all">All levels</option>{levels.map(n => <option key={n} value={n}>{n === 0 ? 'Cantrip' : `Level ${n}`}</option>)}</select></label>
      <label className="creation-field"><span>Type</span><select value={kind} onChange={change(setKind)}><option value="all">All spells</option><option value="ritual">Ritual</option><option value="concentration">Concentration</option></select></label>
    </div>
    <label className="spell-picker-toggle"><input type="checkbox" checked={selectedOnly} onChange={e => { setSelectedOnly(e.target.checked); setPage(0); }} /> Show selected only</label>
    <p className="creation-helper" aria-live="polite">{filtered.length} matching spells. Open Details to read a spell.</p>
    <div className="spell-picker-list">{filtered.slice(currentPage*12, currentPage*12+12).map(s => {
      const chosen = selected.includes(s.name);
      return <article className={`spell-picker-row ${chosen ? 'is-selected' : ''}`} key={s.index || s.name}>
        <div><strong>{s.name}</strong><p>{s.level === 0 ? 'Cantrip' : `Level ${s.level}`} · {s.school}{s.ritual ? ' · Ritual' : ''}{s.concentration ? ' · Concentration' : ''}</p></div>
        <button type="button" className="creation-secondary" aria-label={`${chosen ? 'Remove' : 'Select'} ${s.name}`} aria-pressed={chosen} disabled={!chosen && selected.length >= limit} onClick={() => onToggle(s.name)}>{chosen ? 'Remove' : 'Select'}</button>
        <details><summary>Details</summary><p>{s.casting_time} {s.range ? `· Range: ${s.range}` : ''}</p><p className="preserve-lines">{s.description}</p>{s.higher_level?.length > 0 && <p>{s.higher_level.join('\n\n')}</p>}</details>
      </article>;
    })}</div>
    {!filtered.length && <p>No spells match these filters.</p>}
    {pages > 1 && <div className="spell-picker-pagination"><button type="button" className="creation-secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {pages}</span><button type="button" className="creation-secondary" disabled={currentPage+1 >= pages} onClick={() => setPage(currentPage+1)}>Next</button></div>}
  </section>;
}
