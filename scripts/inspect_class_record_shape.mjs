import fs from 'node:fs/promises';

const id=process.argv[2]||'classes/arcane-devotee-657';
const rows=JSON.parse(await fs.readFile('public/catalogs/dndtools/classes.json','utf8'));
const row=rows.find(item=>item.id===id);
if(!row)throw new Error(`Missing class ${id}`);
const summarize=value=>{
  if(value==null)return null;
  if(typeof value==='string')return {type:'string',length:value.length,preview:value.slice(0,800)};
  if(Array.isArray(value))return {type:'array',length:value.length,preview:value.slice(0,3)};
  if(typeof value==='object')return {type:'object',keys:Object.keys(value).slice(0,80),preview:Object.fromEntries(Object.entries(value).slice(0,12))};
  return {type:typeof value,value};
};
const report={id,rowKeys:Object.keys(row),fields:Object.fromEntries(Object.entries(row).map(([key,value])=>[key,summarize(value)]))};
await fs.mkdir('test-results',{recursive:true});
await fs.writeFile('test-results/class-record-shape.json',JSON.stringify(report,null,2));
console.log(`CLASS_RECORD_SHAPE=${JSON.stringify({id,rowKeys:report.rowKeys})}`);
