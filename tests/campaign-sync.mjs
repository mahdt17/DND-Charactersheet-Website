import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignService,watchRoster} from '../src/lib/sharedCampaigns.js';

test('campaign views share a filtered channel and one in-flight encounter read',async()=>{
  const channels=[],removed=[],requests=[],reads=[];
  const api=campaignService({
    channel(){
      const channel={on(event,filter,refresh){Object.assign(this,{filter,refresh});return this;},subscribe(state){this.state=state;return this;}};
      channels.push(channel);return channel;
    },
    removeChannel(channel){removed.push(channel);},
    rpc(name,params){requests.push(params.p_campaign);return new Promise(resolve=>reads.push(resolve));}
  },'owner');
  let first=0,second=0;
  const leaveFirst=api.subscribe('one',()=>first++);
  const leaveSecond=api.subscribe('one',()=>second++);
  const leaveOther=api.subscribe('two',()=>{});
  assert.deepEqual(channels.map(c=>c.filter.filter),['id=eq.one','id=eq.two']);
  channels[0].state('SUBSCRIBED');channels[0].refresh({new:{}});
  assert.deepEqual([first,second],[2,2]);
  leaveFirst();channels[0].refresh({new:{}});assert.deepEqual([first,second],[2,3]);assert.deepEqual(removed,[]);
  leaveSecond();leaveOther();assert.equal(removed.length,2);
  const a=api.encounter('one'),b=api.encounter('one'),other=api.encounter('two');
  assert.deepEqual(requests,['one','two']);
  reads[0]({data:{round:1}});reads[1]({data:null});
  assert.deepEqual(await Promise.all([a,b,other]),[{round:1},{round:1},null]);
  const retry=api.encounter('one');reads[2]({error:{message:'Disconnected'}});await assert.rejects(retry,/Disconnected/);
  const next=api.encounter('one');reads[3]({data:{round:2}});assert.deepEqual(await next,{round:2});
});

test('one revision read catches missed events and idle views avoid content refetches',async t=>{
  const timers=new Set();
  t.mock.method(globalThis,'setInterval',(fn,delay)=>{assert.equal(delay,10000);timers.add(fn);return fn;});
  t.mock.method(globalThis,'clearInterval',fn=>timers.delete(fn));
  globalThis.document=new EventTarget();globalThis.window=new EventTarget();document.hidden=false;
  t.after(()=>{delete globalThis.document;delete globalThis.window;});
  let revision=1,revisionReads=0,contentReads=0,deliver;
  const api=campaignService({
    channel:()=>({on(event,filter,listener){deliver=listener;return this;},subscribe(){return this;}}),
    removeChannel(){},
    from:()=>({select(columns){assert.equal(columns,'revision');return this;},eq(){return this;},
      async maybeSingle(){revisionReads++;return {data:revision==null?null:{revision}};}})
  },'first');
  const read=async()=>++contentReads;
  const a=watchRoster(api,'one',()=>{},assert.fail,read),b=watchRoster(api,'one',()=>{},assert.fail,read);
  await Promise.resolve();assert.equal(timers.size,1);
  const check=[...timers][0];await check();const baseline=contentReads;
  await check();await check();assert.equal(contentReads,baseline);assert.equal(revisionReads,3);
  revision=2;await check();assert.equal(contentReads,baseline+2);
  deliver({new:{revision:2}});assert.equal(contentReads,baseline+2);
  document.hidden=true;revision=3;await check();assert.equal(revisionReads,4);
  document.hidden=false;await check();assert.equal(contentReads,baseline+4);
  revision=null;await check();assert.equal(contentReads,baseline+6);
  a();assert.equal(timers.size,1);b();assert.equal(timers.size,0);
});
