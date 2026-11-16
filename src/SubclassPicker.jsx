import React from 'react';
import {availableSubclasses, findExpandedSubclass, subclassLabel, legacySubclassName, subclassNameKey} from './lib/expandedSubclassCatalog';
import {legacySubclasses2014} from './lib/rules';

export default function SubclassPicker({className, edition='2014', value='', onChange, id='subclasses', fallback=[]}) {
  const expanded = availableSubclasses(className, edition);
  const record = edition === '2014' ? findExpandedSubclass(className, value) : null;
  const legacy = (edition === '2014' ? legacySubclasses2014 : fallback)
    .filter(option => option.class?.name === className)
    .filter(option => !expanded.some(item => item.id === findExpandedSubclass(className, option.name)?.id));
  const options = [...expanded, ...legacy];
  const matchedLegacy = legacy.find(option => subclassNameKey(legacySubclassName(option)) === subclassNameKey(value));
  const selected = record?.id || matchedLegacy?.id || matchedLegacy?.index || '';
  const choose = event => {
    const option = options.find(item => (item.id || item.index) === event.target.value);
    onChange(option ? legacySubclassName(option) : '');
  };

  return <div className="subclass-picker">
    <label className="l-field"><span>{className} subclass source</span>
      <select aria-label={`${className} subclass source`} value={selected} onChange={choose}>
        <option value="">Choose subclass or enter a custom name</option>
        {options.map(option => <option key={option.id || option.index} value={option.id || option.index}>
          {option.sourceBook ? subclassLabel(option) : option.name}
        </option>)}
      </select>
    </label>
    <label className="l-field"><span>Subclass name</span>
      <input aria-label="Subclass name" list={id} value={value} onChange={event => onChange(event.target.value)} placeholder="Custom subclass name"/>
      <datalist id={id}>{options.map(option => <option key={option.id || option.index} value={legacySubclassName(option)}>{option.sourceBook || ''}</option>)}</datalist>
    </label>
    {record && <p className="l-muted">{record.sourceBook} · {className} level {record.entryLevel}{record.playtest ? ' · Unearthed Arcana playtest' : ''} · <a href={record.sourceUrl} target="_blank" rel="noreferrer">Source rules</a></p>}
    {value && !record && !matchedLegacy && edition === '2014' && <p className="l-muted">Custom subclass: record its rules and effects manually.</p>}
  </div>;
}
