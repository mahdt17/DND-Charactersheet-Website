export function spendCampaignGold(c,gp){
 if(!Number.isFinite(gp)||gp<0||!Number.isInteger(gp*100))throw Error('Cost must be nonnegative gold, to the nearest copper.');
 const rates={cp:1,sp:10,ep:50,gp:100,pp:1000},total=Object.entries(rates).reduce((n,[k,v])=>n+Math.max(0,Math.floor(Number(c.currency?.[k]||0)))*v,0),remaining=total-Math.round(gp*100);
 if(remaining<0)throw Error('Not enough gold for the consumed materials.');
 return {...c,currency:{cp:remaining%10,sp:Math.floor(remaining%100/10),ep:0,gp:Math.floor(remaining/100),pp:0}};
}
