D='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad/vo/src/'
def edit(fn,pairs):
    s=open(D+fn,encoding='utf-8').read()
    for o,n in pairs:
        assert s.count(o)==1,(fn,'count',s.count(o),o[:80]);assert all(ord(c)<128 for c in n),'non-ascii';s=s.replace(o,n)
    open(D+fn,'w',encoding='utf-8').write(s);print(fn,'ok')
edit('avatar.js',[
 ("throw:2.0,dizzy:3.6,lift:2.2};","throw:2.0,dizzy:3.6,lift:2.2,shake:1.9};"),
 ("      else if(ek==='dizzy'){","      else if(ek==='shake'){const w1=Math.sin(et*30),w2=Math.sin(et*30+1.3);P.lsz=lerp(P.lsz,2.75+.16*w1,ew);P.rsz=lerp(P.rsz,-2.75+.16*w1,ew);P.lsx=lerp(P.lsx,-.28+.12*w2,ew);P.rsx=lerp(P.rsx,-.28+.12*w2,ew);P.lex=lerp(P.lex,-.6,ew);P.rex=lerp(P.rex,-.6,ew);P.hx=lerp(P.hx,-.32,ew);P.tz=lerp(P.tz,.06*w1,ew);P.sway=lerp(P.sway,.03*w1,ew)}\n      else if(ek==='dizzy'){"),
])
edit('index.js',[("toss,targets,yeet} from './office.js';","toss,targets,yeet,shake} from './office.js';")])
edit('office.js',[
 ("busy(a){return !!(a&&(a.toss||a.plank||a.yeet||a.yeetA||a.thanks))}","busy(a){return !!(a&&(a.toss||a.plank||a.yeet||a.yeetA||a.thanks||a.shakeA||a.shakeB))}"),
 ("playEmote(a,k,em){if(k==='thanks'){this.playThanks(a);return}","playEmote(a,k,em){if(k==='thanks'){this.playThanks(a);return}if(k==='shake'){const b=em&&em.to?this.av.get(String(em.to)):null;if(b)this.playShake(a,b);return}"),
 ("this.yeetTick(dt,t);this.thanksTick(dt,t);","this.yeetTick(dt,t);this.thanksTick(dt,t);this.shakeTick(dt,t);this.screwTick(dt);"),
 ("if(a.thanks){a.thanks=null;a.pk=0;a.dip=0}if(a.plank)this.plankEnd(a);",
  "if(a.thanks){a.thanks=null;a.pk=0;a.dip=0}if(a.shakeA)this.shakeHome(a,1);if(a.shakeB){a.shakeB=null}if(a.plank)this.plankEnd(a);"),
 ("  // ---------- walk the plank: a pirate exit through the back window",
"""  // ---------- owner only: walk over, pick a teammate up and shake them until a screw falls out (clink, clink, clink) ----------
  shake(id){const me=this.meAv,b=this.av.get(id),f=n=>String(n||'').split(' ')[0];
    if(!this.plankOk(me)){this.ui.toast(me?'Sit back down at your desk first.':'Walk onto the floor first.');return false}
    if(!b||b===me||b.leaving){this.ui.toast('They are not on the floor any more.');return false}
    if(!this.plankOk(b)){this.ui.toast(f(b.nm)+' is not at their desk right now.');return false}
    let n=null;try{n=this.api.emote?this.api.emote('shake',{to:id}):null}catch(e){}if(n!=null)me.localEm=n;this.playShake(me,b);return true}
  playShake(a,b){if(!a||!b||a===b||a.leaving||b.leaving||!a.seat||!b.seat||this.busy(a)||this.busy(b)||a.mode==='wait'||b.mode==='wait')return;const f=n=>String(n||'').split(' ')[0];
    if(b.me)this.ui.toast(f(a.nm)+' is checking you for loose screws...');else if(a.me)this.ui.toast('Go shake '+f(b.nm)+'!');
    if(RM()){this.popAt(b,'\\u{1F529}');return}
    const sa=a.seat,sb=b.seat,path=this.route(sa,sb,[sa.x,sa.aisle]);path.push([sb.x,sb.z-.95]);
    a.shakeA={ph:'go',b,sb,t:0};b.shakeB={a,C:new THREE.Vector3()};
    a.speed=3.2;a.emo=null;a.idleK=null;a.mode='rising';a._leavePath=path;a._done=()=>{if(a.shakeA&&a.shakeA.ph==='go'){a.shakeA.ph='grab';a.shakeA.t=0}}}
  shakeTick(dt,t){const off=this._skO||(this._skO=new THREE.Vector3()),H=this._skH||(this._skH=new THREE.Vector3()),S=this._skS||(this._skS=new THREE.Vector3());
    this.av.forEach(a=>{const Y=a.shakeA;if(!Y)return;Y.t+=dt;const b=Y.b,B=b&&b.shakeB;
      if(Y.ph==='go'){if(!B||b.leaving)this.shakeHome(a);return}
      if(Y.ph==='back')return;
      if(!B||b.leaving||B.a!==a){this.shakeHome(a);return}
      a.root.rotation.y=0;const r=b.root,C=B.C;H.set(a.root.position.x,2.55,a.root.position.z+.05);
      const place=()=>{off.set(0,.9,0).applyEuler(r.rotation);r.position.copy(C).sub(off)};
      if(Y.ph==='grab'){if(!Y.g){Y.g=1;a.emote('lift');b.mode='tossed';b.emo=null;b.tossF=0;b.chuteK=0;B.C0=new THREE.Vector3(r.position.x,r.position.y+.75,r.position.z);B.side=b.seat.x<.5?1:-1;this.popAt(b,'\\u{1F633}')}
        const k=sstep(0,.5,Y.t);C.lerpVectors(B.C0,H,k);r.rotation.set(0,0,k*Math.PI/2*B.side);b.tossF=k;place();if(Y.t>=.5){Y.ph='shake';Y.t=0;a.emote('shake');this.say('Hold still!')}return}
      if(Y.ph==='shake'){C.copy(H);C.x+=Math.sin(Y.t*31)*.14;C.y+=Math.abs(Math.sin(Y.t*24))*.1;r.rotation.set(Math.sin(Y.t*17)*.18,0,Math.PI/2*B.side+Math.sin(Y.t*29)*.32);b.tossF=1;place();
        if(((Y.t*9)|0)!==Y.rt){Y.rt=(Y.t*9)|0;this.sfx('rattle')}
        if(Y.t>=1.25&&!Y.out){Y.out=1;this.screw(b.headPos(this._skP||(this._skP=new THREE.Vector3())));this.sfx('pop');this.popAt(b,'\\u{1F529}')}
        if(Y.t>=1.75){Y.ph='hold';Y.t=0;a.emo=null}return}
      if(Y.ph==='hold'){C.copy(H);r.rotation.set(0,0,Math.PI/2*B.side);b.tossF=.4;place();if(Y.t>=1.1){Y.ph='put';Y.t=0;B.C1=C.clone()}return}
      if(Y.ph==='put'){const k=sstep(0,.6,Y.t);S.set(b.seat.x,.75,b.seat.sz);C.lerpVectors(B.C1,S,k);r.rotation.set(0,0,Math.PI/2*B.side*(1-k));b.tossF=.4*(1-k);place();
        if(Y.t>=.62){this.shakeHome(a)}return}})}
  /* back to the desk; whoever was being shaken is put back in their chair first (never left floating) */
  shakeHome(a,gone){const Y=a.shakeA;if(!Y||Y.ph==='back')return;const b=Y.b;
    if(b&&b.shakeB&&b.shakeB.a===a){b.shakeB=null;if(Y.g&&!b.leaving&&b.seat){const r=b.root;r.rotation.set(0,0,0);r.position.set(b.seat.x,0,b.seat.sz);b.mode='seated';b.sitK=1;b.tossF=0;if(!gone){b.emote('dizzy');this.popAt(b,'\\u{1F635}\\u200D\\u{1F4AB}')}}}
    if(gone){a.shakeA=null;return}
    Y.ph='back';const sa=a.seat,sb=Y.sb||sa;a.speed=2.6;
    const p=[[sb.x,sb.aisle]];if(sb.row===sa.row)p.push([sa.x,sa.aisle]);else{const cx=(sa.x+sb.x)/2<0?-7.6:7.6;p.push([cx,sb.aisle],[cx,sa.aisle],[sa.x,sa.aisle])}p.push([sa.x,sa.sz]);
    a.walk(p,()=>{a.mode='sitting';a.turnTo=0;a.speed=2.1;a.shakeA=null})}
  /* the screw: pops out of the head, arcs over the desk, bounces on the floor with a metal clink, lies there, then fades */
  screw(h){const M=this._scM||(this._scM={m:new THREE.MeshStandardMaterial({color:0xd8dce6,metalness:1,roughness:.2}),d:new THREE.MeshStandardMaterial({color:0x2a2d34,metalness:.6,roughness:.5})});
    const G=this._scG||(this._scG={shaft:new THREE.CylinderGeometry(.024,.024,.18,14),tip:new THREE.ConeGeometry(.024,.06,14),head:new THREE.CylinderGeometry(.066,.058,.032,24),slot:new THREE.BoxGeometry(.094,.012,.018),ring:new THREE.TorusGeometry(.026,.007,6,16)});
    const g=new THREE.Group(),add=(geo,m,y,rx)=>{const o=new THREE.Mesh(geo,m);o.position.y=y;if(rx)o.rotation.x=rx;o.castShadow=true;g.add(o);return o};
    add(G.shaft,M.m,0);add(G.tip,M.m,-.12,Math.PI);add(G.head,M.m,.106);add(G.slot,M.d,.123);for(let i=0;i<6;i++)add(G.ring,M.m,-.075+i*.028,Math.PI/2+.25);
    g.scale.setScalar(1.25);g.position.copy(h);g.position.y+=.05;this.room.group.add(g);
    (this.screws||(this.screws=[])).push({g,v:new THREE.Vector3((Math.random()-.5)*.5,1.05,2.2),w:new THREE.Vector3(9,4,13),t:0,nb:0,rest:0})}
  screwTick(dt){const L=this.screws;if(!L||!L.length)return;for(let i=L.length-1;i>=0;i--){const s=L[i],g=s.g;s.t+=dt;
      if(!s.rest){s.v.y-=9.8*dt;g.position.addScaledVector(s.v,dt);g.rotation.x+=s.w.x*dt;g.rotation.y+=s.w.y*dt;g.rotation.z+=s.w.z*dt;
        if(g.position.y<.08&&s.v.y<0){g.position.y=.08;s.nb++;const sp=-s.v.y;this.sfx('clink',Math.min(1,sp/4.5));if(s.nb===1)this.shk=Math.max(this.shk||0,.2);
          if(sp<1||s.nb>=4){s.rest=1;g.rotation.set(Math.PI/2,g.rotation.y,0);g.position.y=.08}else{s.v.y=sp*.45;s.v.x*=.6;s.v.z*=.45;s.w.multiplyScalar(.6)}}}
      else if(s.t>8){const k=Math.max(0,1-(s.t-8)/.6);g.scale.setScalar(1.25*k);if(k<=0){this.room.group.remove(g);L.splice(i,1)}}}}
  // ---------- walk the plank: a pirate exit through the back window"""),
 ("    let th=null;this.av.forEach(a=>{const H=a.thanks;",
  "    let sk=null;this.av.forEach(a=>{const Y=a.shakeA;if(Y&&Y.ph!=='go'&&Y.ph!=='back')sk=Y});\n    if(sk&&!ts&&!yw&&!this.thSid){const s=sk.sb;P.set(s.x*.7+1.2,2.6,s.z+5.6);T.set(s.x,1.2,s.z-.2);F=clamp(vf,34,58)}\n    let th=null;this.av.forEach(a=>{const H=a.thanks;"),
 ("if(th&&!ts&&!yw&&!this.thSid){","if(th&&!ts&&!yw&&!sk&&!this.thSid){"),
 ("  sfx(k){if(!this.opts.sfx||RM())return;const ac=this.lv.ac;if(!ac||ac.state!=='running')return;const t=ac.currentTime;",
  "  sfx(k,v){if(!this.opts.sfx||RM())return;const ac=this.lv.ac;if(!ac||ac.state!=='running')return;const t=ac.currentTime;v=v==null?1:v;"),
 ("    else if(k==='pop'){tone(190,0,.12,.16,'sine');tone(95,.02,.1,.24,'sine')}",
  "    else if(k==='pop'){tone(190,0,.12,.16,'sine');tone(95,.02,.1,.24,'sine')}\n    else if(k==='clink'){[[2380,.075,.55],[3790,.055,.4],[5230,.04,.3],[7010,.022,.2]].forEach(([f,a,l])=>tone(f*(.97+Math.random()*.06),0,a*v,l*(.6+.4*v)));const n=(ac.sampleRate*.03)|0,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,6);\n      const s=ac.createBufferSource();s.buffer=b;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=3000;const g=ac.createGain();g.gain.value=.2*v;s.connect(hp);hp.connect(g);g.connect(ac.destination);s.start(t)}\n    else if(k==='rattle'){tone(3500+Math.random()*900,0,.02,.04,'square');tone(5200+Math.random()*1200,.012,.012,.03)}"),
 ("export function yeet(id){return OF?OF.yeet(id):false}","export function yeet(id){return OF?OF.yeet(id):false}\nexport function shake(id){return OF?OF.shake(id):false}"),
])
