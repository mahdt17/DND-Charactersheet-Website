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
  channels[0].state('SUBSCRIBED');channels[0].refresh();
  assert.deepEqual([first,second],[2,2]);
  leaveFirst();channels[0].refresh();assert.deepEqual([first,second],[2,3]);assert.deepEqual(removed,[]);
  leaveSecond();leaveOther();assert.equal(removed.length,2);
  const a=api.encounter('one'),b=api.encounter('one'),other=api.encounter('two');
  assert.deepEqual(requests,['one','two']);
  reads[0]({data:{round:1}});reads[1]({data:null});
  assert.deepEqual(await Promise.all([a,b,other]),[{round:1},{round:1},null]);
  const retry=api.encounter('one');reads[2]({error:{message:'Disconnected'}});await assert.rejects(retry,/Disconnected/);
  const next=api.encounter('one');reads[3]({data:{round:2}});assert.deepEqual(await next,{round:2});
});

test('healthy sessions back off, hidden changes wait for focus, disconnected views recover',async t=>{
  globalThis.window=new EventTarget();globalThis.document=new EventTarget();document.hidden=false;
  t.after(()=>{delete globalThis.document;delete globalThis.window;});
  const intervals=new Map();
  t.mock.method(globalThis,'setInterval',(callback,ms)=>{const key=Symbol();intervals.set(key,{callback,ms});return key;});
  t.mock.method(globalThis,'clearInterval',key=>intervals.delete(key));
  let changed,connection,reads=0;
  const api={subscribe(id,onChange,onConnection){changed=onChange;connection=onConnection;return ()=>{};}};
  const stop=watchRoster(api,'one',()=>{},assert.fail,async()=>++reads);
  await Promise.resolve();assert.equal(reads,1);
  assert.deepEqual([...intervals.values()].map(t=>t.ms),[10000]);
  connection(true);assert.deepEqual([...intervals.values()].map(t=>t.ms),[60000]);
  document.hidden=true;changed();[...intervals.values()][0].callback();assert.equal(reads,1);
  document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await Promise.resolve();assert.equal(reads,2);
  connection(false);assert.deepEqual([...intervals.values()].map(t=>t.ms),[10000]);
  stop();assert.equal(intervals.size,0);
});
