import assert from 'node:assert/strict';

export async function checkAffiliationFlow(page) {
  const button=(name,scope=page)=>scope.getByRole('button',{name,exact:true});
  const tab=name=>page.getByRole('tab',{name,exact:true}).click();
  await button('All characters').click();
  await button('Create character').click();
  await page.getByLabel('Character name',{exact:true}).fill('Institute archer');
  await page.getByText('Use the Shadow Archer build',{exact:true}).click();
  await button('Create level 5 Shadow Archer').click();
  await page.locator('.sheet-identity').filter({hasText:'Institute archer'}).waitFor();
  await tab('Affiliations');
  await page.getByText('Add another affiliation',{exact:true}).click();
  await page.getByLabel('Guild or institution name').fill('Silver Quill');
  await button('Add membership').click();
  await button('Join an arcane institute').click();
  await page.getByLabel('Award type').selectOption('prior');
  await button('Credit prior training').click();
  assert.equal(await button('Credit prior training').isDisabled(),true);
  await page.getByLabel('Highest rank approved by your DM').selectOption('5');
  await page.getByLabel('DM approves two spellbook additions').check();
  await page.getByText('Choose two spellbook additions Â· effective Wizard 5',{exact:true}).click();
  for(const name of ['Fireball','Counterspell']){
    await page.getByLabel('Search spells').fill(name);
    await page.getByRole('button',{name:new RegExp('^Select '+name+' [(]')}).first().click();
  }
  await button('Add both spells to spellbook').click();
  await tab('Spells');
  await page.getByLabel('Spellcasting class',{exact:true}).selectOption('2014:wizard');
  assert.equal(await page.getByRole('button',{name:/^Level 3 slot /}).count(),2);
  await button('Level up').click();
  const dialog=page.getByRole('dialog',{name:'Choose how to level up'});
  await dialog.getByLabel('Class to advance').selectOption('2014:wizard');
  await dialog.getByRole('checkbox',{name:/I reviewed the class/}).check();
  await button('Continue to level choices',dialog).click();
  await button('Continue',page.locator('.creation-footer')).click();
  await button('Apply level up').click();
  await page.locator('.sheet-identity').filter({hasText:/LEVEL 6/i}).waitFor();
  await tab('Affiliations');
  await page.getByRole('heading',{name:'Silver Quill'}).waitFor();
  await page.getByText('Choose two spellbook additions Â· effective Wizard 6',{exact:true}).waitFor();
  assert.equal(await page.getByText('Choose two spellbook additions Â· effective Wizard 5',{exact:true}).count(),0);
  await page.getByLabel('Check total including modifiers').fill('16');
  await button('Record education check').click();
  await page.getByText('6 Fame',{exact:true}).waitFor();
  await button('All characters').click();
  await page.locator('.character-card').filter({hasText:'Institute archer'}).getByRole('button',{name:'Open character'}).click();
  await tab('Affiliations');
  await page.getByText('6 Fame',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'Silver Quill'}).waitFor();
}
