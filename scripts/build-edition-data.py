"""Build licensed catalogs from locally checked-out 5e-database and olimot/srd-v3.5 HTML."""
import json,re,html,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
source=pathlib.Path(sys.argv[1]); legacy=pathlib.Path(sys.argv[2])
pack={}
for name in ['Spells','Classes','Species','Backgrounds','Levels','Traits','Features','Feats','Subspecies','Subclasses']:
 p=source/'src/2024/en'/f'5e-SRD-{name}.json'
 pack[name.lower()]=json.loads(p.read_text()) if p.exists() else []
(root/'src/data/srd2024.json').write_text(json.dumps(pack,separators=(',',':')))
def text(s):
 s=re.sub(r'</(?:p|h[1-6]|tr|li|div)>','\n',s)
 s=re.sub(r'</(?:td|th)>',' | ',s)
 return re.sub(r'[ \t]+',' ',html.unescape(re.sub('<[^>]+>','',s))).strip()
def parts(p, heading=2):
 s=p.read_text(); hs=list(re.finditer(rf'<h{heading} id="([^"]+)">(.*?)</h{heading}>',s,re.S))
 for i,h in enumerate(hs): yield h[1],text(h[2]),s[h.end():hs[i+1].start() if i+1<len(hs) else s.index('</body>')]
pack={'spells':[],'classes':[],'races':[],'feats':[]}
cn={'Brd':'Bard','Clr':'Cleric','Drd':'Druid','Pal':'Paladin','Rgr':'Ranger','Sor':'Sorcerer','Wiz':'Wizard'}
for p in sorted(legacy.glob('spells__spells-*.html')):
 for key,name,body in parts(p):
  desc=text(body); lev=re.search(r'Level:\s*([^\n]+)',desc); pairs=re.findall(r'([A-Za-z/]+)\s+(\d)',lev[1] if lev else '')
  levels={cn.get(c,c):int(n) for c,n in pairs for c in c.split('/')}
  def field(n):
   m=re.search(n+r':\s*([^\n]+)',desc);return m[1] if m else ''
  pack['spells'].append(dict(index=key,name=name,edition='3.5',source='SRD 3.5',level=min(levels.values(),default=0),classLevels=levels,classes=list(levels),school=desc.split('\n')[0],description=desc,casting_time=field('Casting Time'),duration=field('Duration'),range=field('Range'),components=field('Components').split(', '),sourceUrl='https://olimot.github.io/srd-v3.5/'+p.name.replace('__','/')+'#'+key))
for p in legacy.glob('*.html'):
 if any(x in p.name for x in ['character-classes','prestige-classes','npc-classes','psionic-classes']):
  for key,name,body in parts(p):
   desc=text(body);die=re.search(r'Hit Die:\s*(d\d+)',desc,re.I)
   if not die or name.startswith('Ex-'):continue
   tables=[]
   for table in re.findall(r'<table.*?</table>',body,re.S):
    rows=[]
    for row in re.findall(r'<tr.*?</tr>',table,re.S):
     cells=[text(c) for c in re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>',row,re.S)]
     rows.append(cells)
    tables.append(rows)
   pack['classes'].append(dict(index=key,name=name,edition='3.5',source='SRD 3.5',hit_die=int(die[1][1:]),description=desc,tables=tables,prestige='prestige' in p.name,sourceUrl='https://olimot.github.io/srd-v3.5/'+p.name.replace('__','/')+'#'+key))
 if 'races.html' in p.name:
  names={'humans':'Human','dwarves':'Dwarf','elves':'Elf','gnomes':'Gnome','half-elves':'Half-Elf','half-orcs':'Half-Orc','halflings':'Halfling'}
  for key,name,body in parts(p):
   if key in names:
    desc=text(body);bonuses={k[:3].lower():int(n.replace('–','-').replace('−','-')) for n,k in re.findall(r'([+−–-]\d)\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)',desc)}
    speed=re.search(r'base land speed is (\d+)',desc)
    pack['races'].append(dict(index=key,name=names[key],edition='3.5',source='SRD 3.5',speed=int(speed[1]) if speed else 30,bonuses=bonuses,description=desc,traits=[{'name':names[key]+' racial traits','description':desc}]))
 if 'feats.html' in p.name:
  for key,name,body in parts(p,3):pack['feats'].append(dict(index=key,name=name,edition='3.5',source='SRD 3.5',description=text(body)))
(root/'src/data/srd35.json').write_text(json.dumps(pack,separators=(',',':')))
legal=text((legacy/'basic-rules-and-legal__legal-information.html').read_text().split('<body>')[1].split('</body>')[0])
(root/'public/OGL-1.0a.txt').write_text(legal+'\n\nAdventurer’s Ledger: data marked SRD 3.5 is Open Game Content. Application code and 5e/5.5e content are separate works.\n')
print({k:len(v) for k,v in pack.items()})
