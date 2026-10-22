export async function openClassTools(page,section='Abilities'){
 await page.getByRole('tab',{name:'Class tools',exact:true}).click();
 await page.getByRole('region',{name:'Converted class abilities',exact:true}).getByRole('button',{name:section,exact:true}).click();
}
export async function openClassDisclosure(page,label){
 const summary=page.locator('summary').filter({hasText:new RegExp('^'+label+'$')});
 if(!(await summary.evaluate(el=>el.parentElement.open)))await summary.click();
}
export async function chooseClassPower(page,name){
 await openClassTools(page);
 await page.getByRole('button',{name:'Telepath powers',exact:true}).click();
 await page.getByRole('button',{name:'Select '+name,exact:true}).click();
}
