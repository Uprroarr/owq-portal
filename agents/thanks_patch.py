import sys
D='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad/vo/src/'
f=D+'office.js';s=open(f,encoding='utf-8').read()
def rep(o,n,c=1):
    global s
    assert s.count(o)==c,('count',s.count(o),o[:80])
    assert all(ord(ch)<128 for ch in n),'non-ascii in new text'
    s=s.replace(o,n)
rep("busy(a){return !!(a&&(a.toss||a.plank||a.yeet||a.yeetA))}","busy(a){return !!(a&&(a.toss||a.plank||a.yeet||a.yeetA||a.thanks))}")
rep("emote(k){const me=this.meAv;if(k==='plank'&&!this.plankOk(me)){","emote(k){const me=this.meAv;if((k==='plank'||k==='thanks')&&!this.plankOk(me)){")
rep("playEmote(a,k,em){if(k==='plank'){this.playPlank(a);return}","playEmote(a,k,em){if(k==='thanks'){this.playThanks(a);return}if(k==='plank'){this.playPlank(a);return}")
rep("this.yeetTick(dt,t);this.tossTick(dt,t);","this.yeetTick(dt,t);this.thanksTick(dt,t);this.tossTick(dt,t);")
rep("depart(a){a.leaving=true;const d=this.room.desks[a.seat.i];if(a.plank)this.plankEnd(a);",
    "depart(a){a.leaving=true;const d=this.room.desks[a.seat.i],wasT=!!a.thanks||a.mode==='thanks';if(a.thanks){a.thanks=null;a.pk=0;a.dip=0}if(a.plank)this.plankEnd(a);")
rep("if(RM()||!a.root.visible||a.mode==='wait'||a.mode==='tossed'){this.remove(a);return}","if(RM()||wasT||!a.root.visible||a.mode==='wait'||a.mode==='tossed'){this.remove(a);return}")
rep("popAt(a,e){if(a._vis)this.ui.pop(a._sx,a._sy-34,e)}","popAt(a,e,c){if(a._vis)this.ui.pop(a._sx,a._sy-34,e,c)}")
rep("  // ---------- walk the plank: a pirate exit through the back window",
"""  // ---------- the "thank you" trend: walk out to the gold inlay, drop into a wide plank, hip dips with a THANK YOU on every rep ----------
  /* from a seat to the stage in front of the desks: back along the row's aisle, then forward through the gaps between desks */
  stagePath(s,X,Z){const G={b:[-4.725,-1.575,1.575,4.725],m:[-3.15,0,3.15],f:[-1.575,1.575]},A={b:-5.6,m:-2.65,f:.25},N={b:-2.65,m:.25,f:Z},R=['b','m','f'];
    const p=[[s.x,s.aisle]];let x=s.x;for(let i=Math.max(0,R.indexOf(s.row));i<3;i++){const r=R[i];let g=G[r][0],bd=1e9;G[r].forEach(v=>{const c=Math.abs(v-x)+.6*Math.abs(v-X);if(c<bd){bd=c;g=v}});p.push([g,A[r]],[g,N[r]]);x=g}
    p.push([X,Z]);return p}
  playThanks(a){if(!a||this.busy(a)||a.leaving||a.mode==='wait'||!a.seat)return;this.popAt(a,'\\u{1F64F}');if(RM())return;
    const s=a.seat,X=clamp(s.x*.3,-1.4,1.4),Z=3.35,path=this.stagePath(s,X,Z);
    a.thanks={ph:'go',t:0,X,Z,n:0,N:8,k:-1,path};a.speed=3.4;a.emo=null;a.idleK=null;a.mode='rising';a._leavePath=path;
    a._done=()=>{const H=a.thanks;if(H&&H.ph==='go'){H.ph='down';H.t=0;a.mode='thanks';a.root.position.set(H.X,0,H.Z)}}}
  thanksTick(dt,t){this.av.forEach(a=>{const H=a.thanks;if(!H)return;H.t+=dt;const r=a.root;if(H.ph==='go'||H.ph==='back')return;
    let dy=-r.rotation.y;dy=Math.atan2(Math.sin(dy),Math.cos(dy));r.rotation.y+=dy*Math.min(1,dt*10);
    if(H.ph==='down'){a.pk=sstep(0,.75,H.t);a.dip=0;a.thx=0;if(H.t>=.8){H.ph='reps';H.t=0}return}
    if(H.ph==='reps'){const T=.66,i=Math.floor(H.t/T),u=(H.t-i*T)/T;
      if(i>=H.N){a.dip=0;a.thx=0;H.ph='up';H.t=0;this.popAt(a,H.N+' THANK YOUS \\u{1F64F}','t');return}
      a.pk=1;a.dip=u<.42?sstep(0,.42,u):1-sstep(.48,1,u);a.thx=Math.exp(-Math.pow((u-.46)/.13,2));
      if(i!==H.k&&u>=.4){H.k=i;H.n=i+1;this.popAt(a,'THANK YOU','t');this.thanksSay()}return}
    if(H.ph==='up'){a.pk=1-sstep(0,.6,H.t);a.dip=0;a.thx=0;if(H.t>=.65){a.pk=0;H.ph='back';const s=a.seat,p=H.path.slice().reverse();p.push([s.x,s.sz]);a.speed=3.0;
        a.walk(p,()=>{a.mode='sitting';a.turnTo=0;a.speed=2.1;a.thanks=null})}return}})}
  thanksSay(){if(!this.opts.sfx||RM())return;try{const S=globalThis.speechSynthesis;if(!S||typeof SpeechSynthesisUtterance==='undefined'||S.speaking||S.pending)return;const u=new SpeechSynthesisUtterance('thank you');u.rate=1.25;u.pitch=.5;u.volume=.9;S.speak(u)}catch(e){}}
  // ---------- walk the plank: a pirate exit through the back window""")
rep("    if(yw&&!ts&&!this.thSid){P.set(0,5.6,11.6);T.set(0,.9,.6);F=clamp(vf*1.1,36,66)}",
    "    if(yw&&!ts&&!this.thSid){P.set(0,5.6,11.6);T.set(0,.9,.6);F=clamp(vf*1.1,36,66)}\n    let th=null;this.av.forEach(a=>{const H=a.thanks;if(H&&(H.ph==='down'||H.ph==='reps'||H.ph==='up'))th=H});\n    if(th&&!ts&&!yw&&!this.thSid){P.set(th.X+.05,.85,th.Z+2.35);T.set(th.X,.4,th.Z+.25);F=clamp(vf*.9,34,56)}")
open(f,'w',encoding='utf-8').write(s);print('office ok')
f=D+'ui.js';s=open(f,encoding='utf-8').read()
rep("pop(x,y,emoji){const p=document.createElement('div');p.className='vo3pop';","pop(x,y,emoji,cls){const p=document.createElement('div');p.className='vo3pop'+(cls?' '+cls:'');")
o=".vo3pop{position:absolute;left:0;top:0;font-size:32px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));animation:vo3up 1.9s cubic-bezier(.2,.8,.3,1) forwards}"
rep(o,o+"\n.vo3pop.t{font:800 15px Verdana,'DejaVu Sans',sans-serif;letter-spacing:.14em;color:#fff;white-space:nowrap;padding:6px 11px;background:linear-gradient(135deg,#ff1f4f,#b3002d);border:1px solid rgba(255,255,255,.35);box-shadow:0 0 18px rgba(255,31,79,.55);text-shadow:0 1px 2px rgba(0,0,0,.4)}")
open(f,'w',encoding='utf-8').write(s);print('ui ok')
