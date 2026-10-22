export async function openSwarm(page,section='abilities'){
 const tab=page.getByRole('tab',{name:'Swarm',exact:true});if(await tab.count())await tab.click();
 const workspace=page.getByRole('region',{name:'Entomancer swarm',exact:true});
 await workspace.getByRole('button',{name:{abilities:'Abilities',active:'Active',creatures:'Creatures',recovery:'Recovery'}[section],exact:true}).click();return workspace;
}
export async function selectSwarmAbility(page,id){const workspace=await openSwarm(page);await workspace.getByLabel('Find a swarm ability').fill('');await workspace.getByLabel('Show available abilities only').uncheck();await workspace.locator(`[data-swarm-action="${id}"]`).click();return workspace;}
export async function setSwarmSave(page,success){await page.getByLabel(success?'Target succeeded on its save':'Target failed its save',{exact:true}).check();}
