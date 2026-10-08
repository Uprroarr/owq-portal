const fs=require('fs');const s=fs.readFileSync(__dirname+'/../src/nf.js','utf8');
const core=s.slice(s.indexOf('/*NFPcore*/'),s.indexOf('/*NFPend*/'));
const NFP=new Function(core+';return NFP')();
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL',m)}else console.log('ok',m)};
let r=1;NFP.setRng(()=>{r=(r*16807)%2147483647;return r/2147483647});
for(let i=0;i<1000;i++)NFP.add({x:5,y:5,vx:1,vy:1,m:.5});
ok(NFP.count()===250,'pool capped at 250 (got '+NFP.count()+')');
NFP.clear();ok(NFP.count()===0,'clear');
NFP.burst(100,100,1);NFP.impact(50,50,1);ok(NFP.count()>40&&NFP.count()<=250,'burst+impact spawn '+NFP.count());
let bad=0;for(let t=0;t<200;t++){NFP.step(.016);for(const p of NFP.pool)if(p.a&&!(isFinite(p.x)&&isFinite(p.y)))bad++}
ok(bad===0,'no NaN/Infinity');ok(NFP.count()===0&&NFP.rings.length===0,'all particles and rings expire (alive '+NFP.count()+')');
NFP.add({x:0,y:0,vx:100,m:.3,d:1});NFP.step(NaN);NFP.step(-1);NFP.step(5);NFP.step(5);NFP.step(5);NFP.step(5);ok(NFP.count()===0,'bad dt clamped, life ends');
for(let i=0;i<20;i++)NFP.ring({x:1,y:1});ok(NFP.rings.length<=8,'rings capped');
const ctx=new Proxy({}, {get:(t,k)=>k in t?t[k]:(()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
NFP.burst(10,10,.72);for(let k of [0,1,2,3,4])NFP.add({x:1,y:1,m:1,k});try{NFP.draw(ctx);ok(true,'draw runs for all kinds')}catch(e){ok(false,'draw '+e)}
process.exit(fails?1:0)
