const quantity=f=>Math.max(0,Math.floor(Number(f?.quantity??1)||0));
const losses=f=>[...new Set((f?.lostMembers||[]).filter(n=>Number.isInteger(n)&&n>=0&&n<quantity(f)))];

export function activeFollowerQuantity(f){return f?.lost?0:Math.max(0,quantity(f)-losses(f).length);}
export function followerMemberLost(f,member=0){return !!f?.lost||losses(f).includes(member);}

export function recordFollowerLoss(char,id,{member,quantity:amount=1}={}){
 const state=char.archivistCampaign||{},follower=state.followers?.find(f=>f.id===id);
 if(!follower||!activeFollowerQuantity(follower))throw Error('An available follower record is required.');
 const available=Array.from({length:quantity(follower)},(_,i)=>i).filter(i=>!followerMemberLost(follower,i));
 let selected;
 if(member!=null){
  if(!Number.isInteger(member)||member<0||member>=quantity(follower))throw Error('Choose a valid follower member.');
  if(followerMemberLost(follower,member))throw Error('This follower member is already lost.');
  selected=[member];
 }else{
  if(!Number.isInteger(amount)||amount<1)throw Error('Enter a positive whole-number loss quantity.');
  if(amount>available.length)throw Error('Loss quantity exceeds the available members.');
  selected=available.slice(0,amount);
 }
 const lostMembers=[...losses(follower),...selected].sort((a,b)=>a-b);
 return {...char,archivistCampaign:{...state,
  followers:state.followers.map(f=>f.id===id?{...f,lostMembers,lost:lostMembers.length===quantity(f)}:f),
  creatures:(state.creatures||[]).map(n=>n.followerId===id&&selected.includes(n.member??0)?{...n,followerLost:true,concentration:null}:n)
 }};
}
