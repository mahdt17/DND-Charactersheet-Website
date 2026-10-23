export const classToolPanel=page=>page.locator('.class-owner-panel:visible');
export async function openClassTools(page,section='Abilities',owner){
 await page.getByRole('tab',{name:'Class tools',exact:true}).click();
 const tabs=page.getByRole('tablist',{name:'Classes and feats'});
 const choices=owner?[owner]:section==='Companions'?['Thrallherd','Psicrystal Affinity','Encounter']:['Archivist','Psion (Telepath)'];
 for(const name of choices){const tab=tabs.getByRole('tab',{name,exact:true});if(await tab.count()){await tab.click();break;}}
 const button=classToolPanel(page).getByRole('button',{name:section,exact:true});if(await button.count())await button.click();
}
export async function openClassDisclosure(page,label){
 const summary=page.locator('summary:visible').filter({hasText:new RegExp('^'+label+'$')});
 if(!(await summary.evaluate(el=>el.parentElement.open)))await summary.click();
}
export async function chooseClassPower(page,name){
 await openClassTools(page,'Abilities','Psion (Telepath)');
 await page.getByRole('button',{name:'Telepath powers',exact:true}).click();
 await page.getByRole('button',{name:'Select '+name,exact:true}).click();
}
