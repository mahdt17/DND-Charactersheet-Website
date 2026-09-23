import React from 'react';
export default function Requirements({checks,confirmations={},onConfirm}) {
  return <div className="requirements"><ul>{checks.map(r=><li key={r.id}><strong>{({met:'Met',unmet:'Unmet',manual:'Needs manual confirmation',confirmed:'Manually verified'})[r.status]}: </strong>{r.text}{onConfirm&&['manual','confirmed'].includes(r.status)&&<label className="l-check"><input type="checkbox" checked={!!confirmations[r.id]} onChange={e=>onConfirm({...confirmations,[r.id]:e.target.checked})}/> I verified this requirement with the source / DM</label>}</li>)}</ul>{!checks.length&&<p>No entry prerequisites are recorded.</p>}</div>;
}
