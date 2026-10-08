import {clamp, damp, sstep} from './util.js';

const MOODS=['hype','laugh','focus','fire','calm'];
const KEY='owq_vtone';
let SAVED=null;
function store(){if(SAVED)return SAVED;SAVED={};try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');if(v&&typeof v==='object')SAVED=v}catch(e){}return SAVED}
function persist(){try{const o=store(),ks=Object.keys(o);if(ks.length>40)delete o[ks[0]];localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
const zero=()=>({hype:0,laugh:0,focus:0,fire:0,calm:0});
const W=2.4;
const st=f=>12*Math.log2(f/55);
// pitch in semitones
class Tone{
  constructor(key){this.key=String(key||'x');const s=store()[this.key];
    this.b=s&&s.n>0?{lv:+s.lv||.3,hf:+s.hf||.3,p:+s.p||0,n:+s.n||0}:{lv:.3,hf:.3,p:0,n:0};
    this.t=0;this.fr=[];this.pk=[];this.env={up:1,mx:0,mn:1};this.quiet=9;this.cur='';this.curS=0;this.lgh=0;this.saveT=0;
    this.w=zero();this.f={}}
  // one frame: level 0..1, brightness 0..1, pitch Hz (0 = not voiced)
  step(dt,lv,hf,f0){const b=this.b,nw=performance.now()/1000;if(this.lt&&nw>this.lt)dt=Math.min(.5,Math.max(dt,nw-this.lt));this.lt=nw;this.t+=dt;const t=this.t,talk=lv>.1;
    if(talk)this.quiet=0;else this.quiet+=dt;
    // learn this person's normal voice
    if(talk){const tau=clamp(b.n*.5,3,120),a=Math.min(1,dt/tau)*(b.n>8&&(this.cur||this.lgh>0)?.12:1);b.n=Math.min(900,b.n+dt);b.lv+=(lv-b.lv)*a;b.hf+=(hf-b.hf)*a;
      if(f0>0){const p=st(f0);if(!b.p)b.p=p;else if(Math.abs(p-b.p)<14)b.p+=(p-b.p)*a*.8}
      this.saveT+=dt;if(this.saveT>8){this.saveT=0;store()[this.key]={lv:+b.lv.toFixed(4),hf:+b.hf.toFixed(4),p:+b.p.toFixed(2),n:Math.round(b.n)};persist()}}
    // recent speech frames
    const fr=this.fr;if(talk)fr.push([t,lv,hf,f0>0?st(f0):0,dt]);while(fr.length&&fr[0][0]<t-W)fr.shift();
    this.bursts(t,lv);
    const tg=zero();
    let sp=0;for(const r of fr)sp+=r[4];
    if(fr.length>=4&&sp>=.5&&this.quiet<1.2){
      let ls=0,hs=0;const ps=[];for(const r of fr){ls+=r[1];hs+=r[2];if(r[3])ps.push(r[3])}
      const lvm=ls/fr.length,hfm=hs/fr.length,R=lvm/Math.max(.05,b.lv),H=hfm/Math.max(.05,b.hf);
      let rel=0,sd=1.9,vf=ps.length/fr.length;
      if(ps.length>=4){const so=ps.slice().sort((x,y)=>x-y),md=so[so.length>>1];const q=ps.filter(x=>Math.abs(x-md)<8);rel=md-(b.p||md);
        let m=0;for(const x of q)m+=x;m/=q.length;let v=0;for(const x of q)v+=(x-m)*(x-m);sd=Math.sqrt(v/q.length)}
      const quiet=1-sstep(.5,.8,R),up=sstep(.8,3.5,rel),dn=sstep(.6,3,-rel),vari=sstep(1.8,4.2,sd),stdy=1-sstep(1.0,2.2,sd),harsh=sstep(1.12,1.5,H);
      const conf=sstep(1.5,6,b.n)*sstep(.5,1.2,sp);
      // calls level everyone's volume, so pitch carries most of it and loudness adds on top
      const en=clamp((R-1)/.45,-1,1),lo=Math.max(0,en);
      tg.hype=clamp(.45*up+.2*vari+.35*lo+.15*harsh*up,0,1)*(1-.7*dn)*conf;
      tg.fire=clamp(.45*dn+.35*lo+.35*harsh,0,1)*(1-up)*(1-.5*vari)*conf;
      tg.focus=stdy*(1-lo)*(1-quiet)*(.5+.5*dn)*(1-up)*conf;
      tg.calm=quiet*(.45+.55*stdy)*(1-.5*up)*conf;
      this.f={R:+R.toFixed(2),H:+H.toFixed(2),rel:+rel.toFixed(1),sd:+sd.toFixed(1),vf:+vf.toFixed(2)};
      // laughing: six or more quick, very even bursts, well above the usual pitch (laughs sit much higher than talking)
      if(this.laughing(t)&&(rel>4.5||(vf<.4&&rel>1.5)))this.lgh=1.1}
    this.lgh=Math.max(0,this.lgh-dt);if(this.lgh>0){tg.laugh=1;for(const k of MOODS)if(k!=='laugh')tg[k]*=.3}
    // one mood at a time, with a little stickiness so it does not flicker
    let bk='',bs=0;for(const k of MOODS){if(k==='laugh')continue;if(tg[k]>bs){bs=tg[k];bk=k}}
    if(this.cur&&bk!==this.cur&&tg[this.cur]>bs-.12){bk=this.cur;bs=tg[this.cur]}
    if(bs<.32)bk='';this.cur=bk;
    const w=this.w,fall=this.quiet>1.2?1.1:1.6;
    for(const k of MOODS){const g=k==='laugh'?tg.laugh:(k===bk?bs:0),rate=g>w[k]?(k==='laugh'?7:2.8):(k==='laugh'?2.2:fall);w[k]=damp(w[k],Math.min(1,g*1.25),rate,dt);if(w[k]<.003)w[k]=0}
    return w}
  bursts(t,lv){const e=this.env;if(e.up){if(lv>e.mx)e.mx=lv;if(e.mx>.2&&lv<e.mx*.3){this.pk.push(t);e.up=0;e.mn=lv}}else{if(lv<e.mn)e.mn=lv;if(lv>Math.max(e.mn*3,e.mn+.16)){e.up=1;e.mx=lv}}
    while(this.pk.length&&this.pk[0]<t-1.7)this.pk.shift()}
  laughing(t){const p=this.pk;if(p.length<6)return false;const iv=[];for(let i=1;i<p.length;i++)iv.push(p[i]-p[i-1]);
    let m=0;for(const x of iv)m+=x;m/=iv.length;if(m<.11||m>.32)return false;let v=0;for(const x of iv)v+=(x-m)*(x-m);return Math.sqrt(v/iv.length)/m<.2}
  // demo teammates: a scripted mood while they talk
  drive(dt,talking,k){const nw=performance.now()/1000;if(this.lt&&nw>this.lt)dt=Math.min(.5,Math.max(dt,nw-this.lt));this.lt=nw;this.t+=dt;const w=this.w;for(const m of MOODS){const g=talking&&m===k?.9:0;w[m]=damp(w[m],g,g>w[m]?2.8:1.1,dt);if(w[m]<.003)w[m]=0}return w}
  static zero(){return zero()}
}

export {MOODS, Tone};
