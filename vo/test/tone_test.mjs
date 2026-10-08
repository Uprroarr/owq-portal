// unit test: the voice tone classifier picks 'yell' for shouting, not for normal or excited talking
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
// syllables of random length (speech is not a metronome)
const sy=[];{let on=1;for(let i=0;i<4000;){const n=on?4+Math.floor(rnd()*9):1+Math.floor(rnd()*4);for(let k=0;k<n;k++)sy.push(on);i+=n;on=1-on}}
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
let T0=0;globalThis.performance={now:()=>T0};
const {Tone}=await import('/home/claude/owq-src/vo/src/tone.js');
function run(name,lvF,hfF,f0F,secs=3){
  const t=new Tone('u');const dt=1/30;
  // 12 s of normal talking to learn the baseline (syllable rhythm)
  for(let i=0;i<12*30;i++){T0+=dt*1000;const ph=sy[(i+500)%4000]===1;t.step(dt,ph?.3+.04*Math.sin(i):.03,.3,ph?160+6*Math.sin(i*.3):0)}
  let w;const seen={};
  for(let i=0;i<secs*30;i++){T0+=dt*1000;const ph=sy[i]===1;w=t.step(dt,ph?lvF(i):.03,ph?hfF(i):.2,ph?f0F(i):0);for(const k in w)seen[k]=Math.max(seen[k]||0,w[k])}
  const top=Object.entries(w).sort((a,b)=>b[1]-a[1])[0];
  console.log(name.padEnd(28),'cur='+(t.cur||'-').padEnd(6),'top='+top[0]+' '+top[1].toFixed(2),'yell max='+(seen.yell||0).toFixed(2),JSON.stringify(t.f));
  return t.cur;
}
const r={};
r.normal=run('normal talking',i=>.3+.04*Math.sin(i),i=>.3,i=>160+6*Math.sin(i*.3));
r.excited=run('excited (louder, higher)',i=>.42+.05*Math.sin(i),i=>.36,i=>200+12*Math.sin(i*.5));
r.yell=run('yelling (2.4x, harsh)',i=>.72+.05*Math.sin(i),i=>.52,i=>210+8*Math.sin(i*.4));
r.yell2=run('yelling (2x, not harsh)',i=>.6+.04*Math.sin(i),i=>.32,i=>170+5*Math.sin(i*.4));
r.angry=run('low angry (fire)',i=>.45,i=>.48,i=>135+3*Math.sin(i*.4));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
ok(r.normal!=='yell','normal talking is not yelling');
ok(r.excited!=='yell','excited talking is not yelling');
ok(r.yell==='yell','shouting much louder than usual is yelling');
ok(r.yell2==='yell','shouting 2x louder is yelling even without harshness');
ok(r.angry!=='yell','a firm, slightly louder voice is not yelling');

// a real laugh: regular quick bursts, high pitch
{const t=new Tone('L');const dt=1/30;for(let i=0;i<12*30;i++){T0+=dt*1000;const ph=sy[(i+900)%4000]===1;t.step(dt,ph?.3:.03,.3,ph?160:0)}let w;for(let i=0;i<90;i++){T0+=dt*1000;const ph=(i%6)<3;w=t.step(dt,ph?.6:.03,ph?.45:.2,ph?260:0)}ok(w.laugh>.5,'a loud, regular, high ha-ha-ha is still a laugh ('+w.laugh.toFixed(2)+')')}
