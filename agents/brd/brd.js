/*BRDstart: Brainstorm Board. One huge board for the whole team, shown on the Sales Floor's right wall and on its own TEAM page.
  Draw, highlight, erase, type, sticky notes, boxes, circles, arrows, lines, photos and charts (custom or live team numbers).
  Every item is one document in the shared 'brd' collection; photos are stored in 'files' chunks the same way chat files are. */
const BRD={W:3300,H:1200,it:new Map(),pend:new Map(),list:[],db:null,live:0,boot:0,ro:0,err:'',open:0,tool:'pen',ci:0,si:1,
  v:{s:1,ox:0,oy:0,fit:1},sel:null,ur:[],rr:[],img:{},loc:{},tc:null,tv:1,tdirty:1,tT:0,dirty:1,el:null,ptr:new Map(),act:null,ed:null,space:0,curT:0,curK:'',raf:0,dpr:1,chart:{k:'bar'},pv:0,warnT:0};
const BRDC=['#f4f4f6','#ff1f4f','#ffd166','#3ddc97','#4cc9f0','#b388ff','#ff8a3d','#8a8a96'];
const BRDN=['#ffd166','#ff8fab','#ffe8a3','#8ef0c2','#9ad9ff','#d2b8ff','#ffb98a','#e7e7ee'];
const BRDS=[3,6,12,24],BRDF=[32,48,72,110],BRDT=new Set(['s','x','n','r','o','a','l','i','c']);
const BRDI={
 sel:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 3l14 8-6 2-3 6z"/></svg>',
 pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/></svg>',
 hl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14l-3 3 2 2 3-3"/><path d="M9 14l7-9 4 4-9 7z"/><path d="M4 21h7"/></svg>',
 era:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h12"/><path d="M4 15l9-9 6 6-7 7H8z"/><path d="M9 10l6 6"/></svg>',
 txt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 6V4h14v2M12 4v16M9 20h6"/></svg>',
 note:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 4h16v10l-6 6H4z"/><path d="M14 20v-6h6"/></svg>',
 r:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="16" height="12" rx="2"/></svg>',
 o:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="8" ry="6"/></svg>',
 a:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5M10 5h9v9"/></svg>',
 l:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 19L19 5"/></svg>',
 hand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V5.5a1.5 1.5 0 013 0V12M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6.5a1.5 1.5 0 013 0V15c0 3.3-2.7 6-6 6h-1c-2.2 0-3.6-1-4.8-2.6L3.6 14.6a1.5 1.5 0 012.3-1.9L8 15"/></svg>',
 img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>',
 chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20h16M7 16v-5M12 16V7M17 16v-8"/></svg>',
 undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/></svg>',
 redo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/></svg>',
 zout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
 zin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 12h12M12 6v12"/></svg>',
 fit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
 dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
 trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 full:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
 shrink:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'};
const brdOwner=()=>typeof WHO!=='undefined'&&(WHO==='Agency Owner'||WHO==='Cole Leckey');
const brdN=(v,a,b,d)=>{v=+v;return isFinite(v)?Math.max(a,Math.min(b,v)):d},brdCol=v=>/^#[0-9a-f]{6}$/i.test(String(v))?String(v).toLowerCase():'#f4f4f6';
function brdSan(d){if(!d||typeof d!=='object'||!BRDT.has(d.t))return null;const W=BRD.W,H=BRD.H,o={t:d.t,by:String(d.by||'').slice(0,40),at:brdN(d.at,0,9e15,0),z:brdN(d.z,0,9e15,0)};
  if(d.t==='s'){const p=Array.isArray(d.p)?d.p.slice(0,4000).map(v=>Math.round(+v)||0):[];if(p.length<2)return null;if(p.length%2)p.pop();o.p=p;o.c=brdCol(d.c);o.lw=brdN(d.lw,1,160,6);o.al=brdN(d.al,.05,1,1);o.dx=brdN(d.dx,-W*2,W*2,0);o.dy=brdN(d.dy,-H*2,H*2,0);return o}
  if(d.t==='a'||d.t==='l'){o.x=brdN(d.x,-W,W*2,0);o.y=brdN(d.y,-H,H*2,0);o.x2=brdN(d.x2,-W,W*2,0);o.y2=brdN(d.y2,-H,H*2,0);o.c=brdCol(d.c);o.lw=brdN(d.lw,1,160,6);return o}
  o.x=brdN(d.x,-W,W*2,0);o.y=brdN(d.y,-H,H*2,0);o.w=brdN(d.w,8,W*2,100);o.h=brdN(d.h,8,H*2,100);
  if(d.t==='r'||d.t==='o'){o.c=brdCol(d.c);o.lw=brdN(d.lw,1,160,6);return o}
  if(d.t==='x'){o.v=String(d.v||'').slice(0,2000);if(!o.v.trim())return null;o.c=brdCol(d.c);o.f=brdN(d.f,10,400,48);return o}
  if(d.t==='n'){o.v=String(d.v||'').slice(0,2000);o.bg=brdCol(d.bg);return o}
  if(d.t==='i'){const m=d.im&&typeof d.im==='object'?d.im:{};o.im={id:fileKey(m.id),n:brdN(m.n,0,8,0)|0};if(!o.im.id||!o.im.n)return null;return o}
  if(d.t==='c'){o.k=['bar','line','pie'].includes(d.k)?d.k:'bar';o.ti=String(d.ti||'').slice(0,80);const lb=Array.isArray(d.lb)?d.lb.slice(0,24).map(v=>String(v).slice(0,24)):[],vl=Array.isArray(d.vl)?d.vl.slice(0,24).map(v=>brdN(v,-1e12,1e12,0)):[];
    const n=Math.min(lb.length,vl.length);o.lb=lb.slice(0,n);o.vl=vl.slice(0,n);return o}
  return null}
/* ---------- data ---------- */
async function brdBoot(){if(BRD.boot)return;BRD.boot=1;try{const c=globalThis.claude;if(!c||!c.use)return;const db=await c.use('db');if(!db)return;
  try{const u=await c.use('user');if(u&&u.can){const w=await u.can('data.write');if(w===false)BRD.ro=1}}catch(e){}
  BRD.db=db;db.collection('brd').onSnapshot(s=>{BRD.live=1;BRD.err='';const m=new Map();s.docs.forEach(d=>{const v=brdSan(d.data());if(v)m.set(d.id,v)});const now=Date.now();
    BRD.pend.forEach((p,id)=>{if(now-p.t>9000){BRD.pend.delete(id);return}const cur=m.get(id);if(p.v===null){if(!cur)BRD.pend.delete(id);else m.delete(id)}else if(cur&&JSON.stringify(cur)===JSON.stringify(p.v))BRD.pend.delete(id);else m.set(id,p.v)});
    BRD.it=m;brdChanged()},e=>{BRD.live=0;BRD.err='The board lost its live connection.';brdChanged()})}catch(e){}}
function brdChanged(){BRD.list=[...BRD.it.entries()].sort((a,b)=>(a[1].z||a[1].at)-(b[1].z||b[1].at));BRD.dirty=1;BRD.tdirty=1;if(BRD.sel&&!BRD.it.has(BRD.sel))BRD.sel=null;brdHead()}
function brdW(id,v){if(BRD.db)BRD.pend.set(id,{v,t:Date.now()});if(v)BRD.it.set(id,v);else BRD.it.delete(id);brdChanged();if(!BRD.db)return;
  let p;try{p=v?BRD.db.doc('brd/'+id).set(v):BRD.db.doc('brd/'+id).delete()}catch(e){p=Promise.reject(e)}Promise.resolve(p).catch(e=>{BRD.pend.delete(id);brdWErr(e)})}
function brdWErr(e){const c=e&&e.code;if(c==='not_granted'||c==='revoked'||c==='permission-denied'||/permission/i.test(String(e&&e.message||''))){BRD.ro=1;brdHead()}if(Date.now()-BRD.warnT>4000){BRD.warnT=Date.now();toast(BRD.ro?'View only: your changes to the board were not saved.':'The board could not save that change. Check your connection.')}}
function brdCan(){if(BRD.ro){if(Date.now()-BRD.warnT>3000){BRD.warnT=Date.now();toast('View only: you can look at the board but not change it.')}return false}return true}
// every change is a list of {id, a: before, b: after}; undo/redo replay them
function brdDo(ops){ops=ops.filter(Boolean);if(!ops.length)return;ops.forEach(o=>brdW(o.id,o.b));BRD.ur.push(ops);if(BRD.ur.length>100)BRD.ur.shift();BRD.rr=[];brdHead()}
function brdUndo(){const ops=BRD.ur.pop();if(!ops)return;ops.slice().reverse().forEach(o=>brdW(o.id,o.a));BRD.rr.push(ops);brdHead()}
function brdRedo(){const ops=BRD.rr.pop();if(!ops)return;ops.forEach(o=>brdW(o.id,o.b));BRD.ur.push(ops);brdHead()}
function brdNew(o){if(!brdCan())return null;const now=Date.now();const v=brdSan(Object.assign({by:typeof WHO!=='undefined'?WHO:'',at:now,z:now},o));if(!v)return null;const id='b'+uid();brdDo([{id,a:null,b:v}]);return id}
function brdSet(id,v){const a=BRD.it.get(id);if(!a||!brdCan())return;const b=brdSan(v);if(!b)return;if(JSON.stringify(a)===JSON.stringify(b))return;brdDo([{id,a,b}])}
function brdDel(ids){if(!brdCan())return;brdDo(ids.map(id=>{const a=BRD.it.get(id);return a?{id,a,b:null}:null}));if(ids.includes(BRD.sel))BRD.sel=null}
/* ---------- geometry ---------- */
function brdBB(it){if(it.t==='s'){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const p=it.p;for(let i=0;i<p.length;i+=2){const x=p[i],y=p[i+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}const r=it.lw/2;return{x:x0+it.dx-r,y:y0+it.dy-r,w:x1-x0+2*r,h:y1-y0+2*r}}
  if(it.t==='a'||it.t==='l'){const r=it.lw*2+12;return{x:Math.min(it.x,it.x2)-r,y:Math.min(it.y,it.y2)-r,w:Math.abs(it.x2-it.x)+2*r,h:Math.abs(it.y2-it.y)+2*r}}
  return{x:it.x,y:it.y,w:it.w,h:it.h}}
function brdSeg(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?((px-ax)*dx+(py-ay)*dy)/l:0;t=Math.max(0,Math.min(1,t));const x=ax+dx*t-px,y=ay+dy*t-py;return Math.sqrt(x*x+y*y)}
function brdHitIt(it,x,y,tol){const b=brdBB(it);if(x<b.x-tol||y<b.y-tol||x>b.x+b.w+tol||y>b.y+b.h+tol)return false;
  if(it.t==='s'){const p=it.p,r=it.lw/2+tol,px=x-it.dx,py=y-it.dy;if(p.length===2)return Math.hypot(px-p[0],py-p[1])<r;for(let i=0;i<p.length-2;i+=2)if(brdSeg(px,py,p[i],p[i+1],p[i+2],p[i+3])<r)return true;return false}
  if(it.t==='a'||it.t==='l')return brdSeg(x,y,it.x,it.y,it.x2,it.y2)<it.lw/2+tol+4;return true}
function brdHit(x,y,tol){for(let i=BRD.list.length-1;i>=0;i--){const [id,it]=BRD.list[i];if(brdHitIt(it,x,y,tol))return id}return null}
function brdMoved(it,d){const o=Object.assign({},it);if(!d)return o;
  if(d.k==='move'){if(o.t==='s'){o.dx+=d.dx;o.dy+=d.dy}else if(o.t==='a'||o.t==='l'){o.x+=d.dx;o.y+=d.dy;o.x2+=d.dx;o.y2+=d.dy}else{o.x+=d.dx;o.y+=d.dy}}
  else if(d.k==='size'){if(o.t==='a'||o.t==='l'){if(d.end){o.x2+=d.dx;o.y2+=d.dy}else{o.x+=d.dx;o.y+=d.dy}}
    else{const w=Math.max(30,o.w+d.dx),h=o.t==='i'||o.t==='x'?w*o.h/o.w:Math.max(24,o.h+d.dy);if(o.t==='x')o.f=Math.max(10,Math.min(400,o.f*h/o.h));o.w=w;o.h=h}}
  return o}
/* ---------- drawing ---------- */
function brdRR(x,X,Y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
function brdA(c,a){const n=parseInt(c.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
function brdWrap(x,txt,mw){const out=[];String(txt||'').split('\n').forEach(par=>{const ws=par.split(' ');let l='';ws.forEach(w=>{const t=l?l+' '+w:w;if(x.measureText(t).width>mw&&l){out.push(l);l=w}else l=t;
    while(x.measureText(l).width>mw&&l.length>1){let k=l.length-1;while(k>1&&x.measureText(l.slice(0,k)).width>mw)k--;out.push(l.slice(0,k));l=l.slice(k)}});out.push(l)});return out}
const BRDP=['#ff1f4f','#ffd166','#3ddc97','#4cc9f0','#b388ff','#ff8a3d','#f4f4f6','#ff8fab'];
function brdFmt(v){const a=Math.abs(v);return(a>=1e6?(v/1e6).toFixed(a>=1e7?0:1)+'M':a>=1e4?(v/1e3).toFixed(a>=1e5?0:1)+'K':Math.round(v*10)/10).toString()}
function brdChart(x,it){const X=it.x,Y=it.y,w=it.w,h=it.h,pad=Math.min(w,h)*.07;x.save();x.beginPath();brdRR(x,X,Y,w,h,18);x.fillStyle='rgba(18,10,18,.92)';x.fill();x.strokeStyle='rgba(255,31,79,.45)';x.lineWidth=3;x.stroke();
  const ft=Math.max(14,Math.min(40,h*.075));x.fillStyle='#fff';x.font=`800 ${ft}px Verdana,Geneva,sans-serif`;x.textBaseline='top';x.textAlign='left';x.fillText(String(it.ti||'Chart').toUpperCase(),X+pad,Y+pad*.8,w-pad*2);
  const lb=it.lb,vl=it.vl,n=vl.length,top=Y+pad*.8+ft*1.6,bot=Y+h-pad-ft*.9,L=X+pad,R=X+w-pad;
  if(!n){x.fillStyle='#a3909a';x.font=`600 ${ft*.7}px Verdana,Geneva,sans-serif`;x.fillText('No data yet',L,top);x.restore();return}
  const fs=Math.max(11,Math.min(26,h*.045));
  if(it.k==='pie'){const tot=vl.reduce((s,v)=>s+Math.max(0,v),0)||1,r=Math.min((R-L)*.32,(bot-top)/2),cx=L+r+4,cy=(top+bot)/2;let a=-Math.PI/2;
    vl.forEach((v,i)=>{const da=Math.max(0,v)/tot*Math.PI*2;x.beginPath();x.moveTo(cx,cy);x.arc(cx,cy,r,a,a+da);x.closePath();x.fillStyle=BRDP[i%BRDP.length];x.fill();x.strokeStyle='#120a12';x.lineWidth=4;x.stroke();a+=da});
    x.beginPath();x.arc(cx,cy,r*.5,0,Math.PI*2);x.fillStyle='#120a12';x.fill();x.fillStyle='#fff';x.font=`800 ${fs*1.3}px Verdana,Geneva,sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(brdFmt(tot),cx,cy);
    x.textAlign='left';const lx=cx+r+pad,lh=Math.min(fs*1.7,(bot-top)/Math.max(1,n));x.font=`700 ${fs}px Verdana,Geneva,sans-serif`;
    lb.forEach((l,i)=>{const yy=top+i*lh+lh/2;x.fillStyle=BRDP[i%BRDP.length];x.fillRect(lx,yy-fs*.4,fs*.8,fs*.8);x.fillStyle='#e9dde3';x.fillText(l+'  '+brdFmt(vl[i])+'  ('+Math.round(Math.max(0,vl[i])/tot*100)+'%)',lx+fs*1.2,yy,R-lx-fs*1.2)});x.restore();return}
  const mx=Math.max(0,...vl),mn=Math.min(0,...vl),rg=(mx-mn)||1,ch=bot-top-fs*1.4,yv=v=>top+fs*1.2+ch*(mx-v)/rg,y0=yv(0);
  x.strokeStyle='rgba(255,255,255,.08)';x.lineWidth=2;for(let k=0;k<=4;k++){const yy=top+fs*1.2+ch*k/4;x.beginPath();x.moveTo(L,yy);x.lineTo(R,yy);x.stroke()}
  const bw=(R-L)/n;x.font=`700 ${fs}px Verdana,Geneva,sans-serif`;x.textAlign='center';
  if(it.k==='bar'){vl.forEach((v,i)=>{const bx=L+bw*i+bw*.16,ww=bw*.68,yy=yv(v),g=x.createLinearGradient(0,yy,0,y0);g.addColorStop(0,'#ff4d73');g.addColorStop(1,'#a3002a');x.fillStyle=g;x.beginPath();brdRR(x,bx,Math.min(yy,y0),ww,Math.max(2,Math.abs(y0-yy)),Math.min(10,ww/4));x.fill();
      x.fillStyle='#fff';x.textBaseline='bottom';x.fillText(brdFmt(v),bx+ww/2,Math.min(yy,y0)-6,bw);x.fillStyle='#b9a3ad';x.textBaseline='top';x.fillText(lb[i],bx+ww/2,bot-fs*.1,bw*.98)})}
  else{x.beginPath();vl.forEach((v,i)=>{const px=L+bw*(i+.5),py=yv(v);if(i)x.lineTo(px,py);else x.moveTo(px,py)});const ln=new Path2D();vl.forEach((v,i)=>{const px=L+bw*(i+.5),py=yv(v);if(i)ln.lineTo(px,py);else ln.moveTo(px,py)});
    x.lineTo(L+bw*(n-.5),y0);x.lineTo(L+bw*.5,y0);x.closePath();x.fillStyle='rgba(255,209,102,.14)';x.fill();x.strokeStyle='#ffd166';x.lineWidth=Math.max(3,fs*.22);x.lineJoin='round';x.stroke(ln);
    vl.forEach((v,i)=>{const px=L+bw*(i+.5),py=yv(v);x.beginPath();x.arc(px,py,fs*.32,0,Math.PI*2);x.fillStyle='#ffd166';x.fill();x.fillStyle='#fff';x.textBaseline='bottom';x.fillText(brdFmt(v),px,py-fs*.4,bw);x.fillStyle='#b9a3ad';x.textBaseline='top';x.fillText(lb[i],px,bot-fs*.1,bw*.98)})}
  x.restore()}
function brdImg(m){const c=BRD.img[m.id];if(c)return c.st==='bad'?false:c.el;const e={el:null,st:'load'};BRD.img[m.id]=e;
  (async()=>{try{let d=BRD.loc[m.id];if(!d){if(!BRD.db)throw 0;const ps=[];for(let n=0;n<m.n;n++){const s=await BRD.db.doc('files/'+m.id+'_'+n).get();if(!s.exists)throw 0;ps.push(String((s.data()||{}).d||''))}d=ps.join('');if(!B64.test(d))throw 0}
    const im=new Image();im.onload=()=>{e.el=im;e.st='ok';BRD.dirty=1;BRD.tdirty=1};im.onerror=()=>{e.st='bad';BRD.dirty=1};im.src='data:image/jpeg;base64,'+d}catch(x){e.st='bad';BRD.dirty=1;BRD.tdirty=1}})();return null}
function brdItem(x,it){const T=it.t;
  if(T==='s'){const p=it.p;x.save();x.translate(it.dx,it.dy);x.globalAlpha=it.al;x.strokeStyle=it.c;x.lineWidth=it.lw;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(p[0],p[1]);
    if(p.length<=4)x.lineTo(p.length===2?p[0]+.01:p[2],p.length===2?p[1]:p[3]);else{for(let i=2;i<p.length-2;i+=2)x.quadraticCurveTo(p[i],p[i+1],(p[i]+p[i+2])/2,(p[i+1]+p[i+3])/2);x.lineTo(p[p.length-2],p[p.length-1])}x.stroke();x.restore();return}
  if(T==='a'||T==='l'){x.save();x.strokeStyle=it.c;x.fillStyle=it.c;x.lineWidth=it.lw;x.lineCap='round';const an=Math.atan2(it.y2-it.y,it.x2-it.x),L=it.lw*3+18;x.beginPath();x.moveTo(it.x,it.y);
    if(T==='a')x.lineTo(it.x2-Math.cos(an)*L*.6,it.y2-Math.sin(an)*L*.6);else x.lineTo(it.x2,it.y2);x.stroke();
    if(T==='a'){x.beginPath();x.moveTo(it.x2,it.y2);x.lineTo(it.x2-L*Math.cos(an-.45),it.y2-L*Math.sin(an-.45));x.lineTo(it.x2-L*Math.cos(an+.45),it.y2-L*Math.sin(an+.45));x.closePath();x.fill()}x.restore();return}
  if(T==='r'||T==='o'){x.save();x.strokeStyle=it.c;x.lineWidth=it.lw;x.fillStyle=brdA(it.c,.09);x.beginPath();if(T==='r')brdRR(x,it.x,it.y,it.w,it.h,Math.min(22,it.w/6,it.h/6));else x.ellipse(it.x+it.w/2,it.y+it.h/2,it.w/2,it.h/2,0,0,Math.PI*2);x.fill();x.stroke();x.restore();return}
  if(T==='x'){x.save();x.fillStyle=it.c;x.font=`700 ${it.f}px Verdana,Geneva,sans-serif`;x.textBaseline='top';x.textAlign='left';String(it.v).split('\n').forEach((l,i)=>x.fillText(l,it.x+4,it.y+4+i*it.f*1.22));x.restore();return}
  if(T==='n'){x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=22;x.shadowOffsetY=10;x.fillStyle=it.bg;x.beginPath();brdRR(x,it.x,it.y,it.w,it.h,12);x.fill();x.restore();x.save();
    x.fillStyle='rgba(0,0,0,.09)';x.beginPath();x.moveTo(it.x+it.w-40,it.y+it.h);x.lineTo(it.x+it.w,it.y+it.h-40);x.lineTo(it.x+it.w,it.y+it.h);x.closePath();x.fill();
    const pad=Math.min(26,it.w*.08);let f=Math.max(14,Math.min(46,it.h/4)),L=[];const mw=it.w-pad*2,wd=String(it.v||'').split(/\s+/);for(let k=0;k<16;k++){x.font=`700 ${f}px Verdana,Geneva,sans-serif`;L=brdWrap(x,it.v,mw);const big=wd.some(w=>x.measureText(w).width>mw);if((L.length*f*1.24<=it.h-pad*2-18&&!big)||f<=14)break;f*=.9}
    x.fillStyle='#1b1420';x.textBaseline='top';x.textAlign='left';L.forEach((l,i)=>{const yy=it.y+pad+i*f*1.24;if(yy+f<it.y+it.h-pad)x.fillText(l,it.x+pad,yy)});
    if(it.by){x.font='700 15px Verdana,Geneva,sans-serif';x.fillStyle='rgba(27,20,32,.55)';x.textBaseline='bottom';x.fillText(String(it.by).split(' ')[0].toUpperCase(),it.x+pad,it.y+it.h-pad*.7)}x.restore();return}
  if(T==='i'){const im=brdImg(it.im);if(im&&im.naturalWidth){x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=20;x.shadowOffsetY=8;x.drawImage(im,it.x,it.y,it.w,it.h);x.restore()}
    else{x.save();x.fillStyle='rgba(255,255,255,.05)';x.fillRect(it.x,it.y,it.w,it.h);x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=3;x.strokeRect(it.x,it.y,it.w,it.h);x.fillStyle='#a3909a';x.font='700 26px Verdana,Geneva,sans-serif';x.textAlign='center';x.textBaseline='middle';
      x.fillText(im===false?'Photo unavailable':'Loading photo...',it.x+it.w/2,it.y+it.h/2);x.restore()}return}
  if(T==='c')brdChart(x,it)}
function brdBg(x){const W=BRD.W,H=BRD.H;x.fillStyle='#0a060d';x.fillRect(0,0,W,H);const g=x.createRadialGradient(W*.5,H*.42,H*.1,W*.5,H*.5,W*.62);g.addColorStop(0,'rgba(255,31,79,.075)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='rgba(255,255,255,.075)';for(let i=50;i<W;i+=50)for(let j=50;j<H;j+=50)x.fillRect(i-1.5,j-1.5,3,3)}
function brdRender(x,o){o=o||{};brdBg(x);if(!BRD.list.length&&!o.drag){x.save();x.fillStyle='rgba(255,255,255,.16)';x.font='800 64px Verdana,Geneva,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('BRAINSTORM BOARD',BRD.W/2,BRD.H/2-40);
    x.font='600 30px Verdana,Geneva,sans-serif';x.fillStyle='rgba(255,179,194,.35)';x.fillText('Draw, type, add sticky notes, photos and charts. Everyone sees it live.',BRD.W/2,BRD.H/2+30);x.restore()}
  for(const [id,it] of BRD.list){if(o.hide===id)continue;brdItem(x,o.drag&&o.drag.id===id?brdMoved(it,o.drag):it)}}
// the copy shown on the Sales Floor wall (and the TEAM page preview)
function brdTex(force){if(!BRD.tc){BRD.tc=document.createElement('canvas');BRD.tc.width=2048;BRD.tc.height=Math.round(2048*BRD.H/BRD.W);BRD.tdirty=1}const now=Date.now();
  if(BRD.tdirty&&(force||now-BRD.tT>600)){BRD.tdirty=0;BRD.tT=now;const x=BRD.tc.getContext('2d'),k=BRD.tc.width/BRD.W;x.setTransform(k,0,0,k,0,0);try{brdRender(x)}catch(e){}x.setTransform(1,0,0,1,0,0);BRD.tv++}return BRD.tc}
function brdHue(n){let h=0;for(const ch of String(n))h=(h*31+ch.charCodeAt(0))|0;return BRDP[Math.abs(h)%6]}
function brdPeers(){const out=[];try{if(typeof VC==='undefined'||!VC.room)return out;const me=vcMe();vcList().forEach(p=>{const b=p.presence&&p.presence.bd;if(!b||typeof b!=='object')return;
    const nm=String(p.presence.nm||'Teammate').slice(0,40);out.push({me:p.peer===me,nm,x:brdN(b.x,-1,BRD.W+1,0),y:brdN(b.y,-1,BRD.H+1,0),c:brdHue(nm)})})}catch(e){}return out}
/* ---------- the editor ---------- */
function brdBtn(k,ic,t,fn,on,dis){return`<button class="${on?'on':''}" data-k="${k}" title="${t}" aria-label="${t}" onclick="${fn}" ${dis?'disabled':''}>${ic}</button>`}
function brdHead(){const e=BRD.el&&BRD.el.querySelector('.brdh');if(!e)return;const T=BRD.tool,ro=BRD.ro,own=brdOwner(),ppl=brdPeers().filter(p=>!p.me);
  const st=!BRD.db?'<small class=off>ONLY ON THIS DEVICE</small>':ro?'<small class=ro>VIEW ONLY</small>':BRD.live?'<small>LIVE &middot; SAVED FOR THE TEAM</small>':'<small class=off>CONNECTING...</small>';
  const tools=[['sel',BRDI.sel,'Select and move (V)'],['pen',BRDI.pen,'Pen (P)'],['hl',BRDI.hl,'Highlighter (H)'],['era',BRDI.era,'Eraser (E)'],['txt',BRDI.txt,'Text (T)'],['note',BRDI.note,'Sticky note (N)'],['r',BRDI.r,'Box (R)'],['o',BRDI.o,'Circle (O)'],['a',BRDI.a,'Arrow (A)'],['l',BRDI.l,'Line (L)'],['hand',BRDI.hand,'Move around the board (hold Space)']];
  const cols=(T==='note'||(BRD.sel&&(BRD.it.get(BRD.sel)||{}).t==='n')?BRDN:BRDC).map((c,i)=>`<button class="brdc${i===BRD.ci?' on':''}" style="background:${c}" title="Color" aria-label="Color ${i+1}" onclick="brdColor(${i})"></button>`).join('');
  const szs=BRDS.map((s,i)=>`<button class="brdsz${i===BRD.si?' on':''}" title="Size ${i+1}" aria-label="Size ${i+1}" onclick="brdSize(${i})"><i style="width:${4+i*4}px;height:${4+i*4}px"></i></button>`).join('');
  const h=`<div class=brdt><i></i><div><b>BRAINSTORM BOARD</b><br>${st}</div><div class=brdpp>${ppl.slice(0,6).map(p=>av(p.nm,26)).join('')}</div></div>
    <div class=brdg>${brdBtn('img',BRDI.img,'Add a photo (or paste / drop one)','brdPickImg()',0,ro)}${brdBtn('chart',BRDI.chart,'Add a chart','brdChartOpen()',0,ro)}${brdBtn('undo',BRDI.undo,'Undo (Ctrl+Z)','brdUndo()',0,!BRD.ur.length)}${brdBtn('redo',BRDI.redo,'Redo (Ctrl+Shift+Z)','brdRedo()',0,!BRD.rr.length)}</div>
    <div class=brdg>${brdBtn('zout',BRDI.zout,'Zoom out (-)','brdZoom(1/1.25)')}<button class=brdzl title="Fit the whole board (0)" aria-label="Fit the whole board" onclick="brdFit()">${Math.round(BRD.v.s/BRD.v.fit*100)}%</button>${brdBtn('zin',BRDI.zin,'Zoom in (+)','brdZoom(1.25)')}</div>
    <div class=brdg>${brdBtn('dl',BRDI.dl,'Save the board as a picture','brdExport()')}${own?brdBtn('trash',BRDI.trash,'Clear the whole board (owner)','brdClear()',0,!BRD.list.length):''}</div>
    <span class=brdsp></span><button class=brdx onclick="brdFull()" title="${BRD.full?'Back into the Sales Floor':'Full screen'}" aria-label="${BRD.full?'Back into the Sales Floor':'Full screen'}">${BRD.full?BRDI.shrink:BRDI.full}</button><button class=brdx onclick="brdClose()" title="Back to the floor (Esc)" aria-label="Close the board">${BRDI.x}</button>`;
  const tl=`<div class="brdg brdtl">${tools.map(([k,ic,t])=>brdBtn(k,ic,t,`brdTool('${k}')`,T===k,ro&&k!=='sel'&&k!=='hand')).join('')}</div>`,pl=`<div class="brdg brdpl">${cols}<i class=brdsep></i>${szs}</div>`;
  const te=BRD.el.querySelector('.brdtools'),pe=BRD.el.querySelector('.brdpal');if(te&&tl!==te._h){te._h=tl;te.innerHTML=tl}if(pe&&pl!==pe._h){pe._h=pl;pe.innerHTML=pl}
  if(h!==e._h){e._h=h;e.innerHTML=h}}
function brdUI(){if(BRD.el)return BRD.el;const e=document.createElement('div');e.className='brd';e.id='brd';e.setAttribute('role','dialog');e.setAttribute('aria-label','Brainstorm Board');
  e.innerHTML=`<div class=brdh></div><div class=brds id=brds><canvas class=brdcb></canvas><canvas class=brdcl></canvas><div class=brdtools></div><div class=brdpal></div><textarea class=brdta spellcheck=false aria-label="Board text"></textarea>
    <div class=brdsel></div><div class=brdpn></div><div class=brdst></div><div class=brddrop>DROP PHOTOS ON THE BOARD</div></div><input type=file accept="image/*" multiple hidden class=brdf>`;
  document.body.appendChild(e);BRD.el=e;BRD.st=e.querySelector('.brds');BRD.cb=e.querySelector('.brdcb');BRD.cl=e.querySelector('.brdcl');BRD.ta=e.querySelector('.brdta');BRD.sb=e.querySelector('.brdsel');BRD.pn=e.querySelector('.brdpn');BRD.stl=e.querySelector('.brdst');
  const st=BRD.st;st.addEventListener('pointerdown',brdDown);st.addEventListener('pointermove',brdMove);st.addEventListener('pointerup',brdUp);st.addEventListener('pointercancel',brdUp);
  st.addEventListener('wheel',brdWheel,{passive:false});st.addEventListener('dblclick',brdDbl);
  st.addEventListener('dragover',ev=>{ev.preventDefault();st.classList.add('drop')});st.addEventListener('dragleave',()=>st.classList.remove('drop'));
  st.addEventListener('drop',ev=>{ev.preventDefault();st.classList.remove('drop');const f=[...(ev.dataTransfer&&ev.dataTransfer.files||[])];if(f.length)brdFiles(f,brdPt(ev))});
  const ta=BRD.ta;ta.addEventListener('input',brdTaFit);ta.addEventListener('keydown',ev=>{ev.stopPropagation();if(ev.key==='Escape'){ev.preventDefault();brdEdEnd(false)}else if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();brdEdEnd(true)}});
  ta.addEventListener('blur',()=>setTimeout(()=>{if(BRD.ed&&document.activeElement!==BRD.ta)brdEdEnd(true)},120));
  e.querySelector('.brdf').addEventListener('change',ev=>{const f=[...(ev.target.files||[])];ev.target.value='';if(f.length)brdFiles(f,null)});
  try{new ResizeObserver(()=>{if(BRD.open)brdResize()}).observe(st)}catch(x){addEventListener('resize',()=>{if(BRD.open)brdResize()})}
  return e}
function brdFloor(){return document.getElementById('vofm')||document.querySelector('.chm')||document.getElementById('main')}
function brdPos(){const e=BRD.el;if(!e)return true;if(BRD.full){e.style.left=e.style.top='0px';e.style.width=innerWidth+'px';e.style.height=innerHeight+'px';return true}const f=brdFloor();if(!f)return false;const r=f.getBoundingClientRect();if(r.width<40||r.height<40)return false;
  const k=Math.round(r.left)+','+Math.round(r.top)+','+Math.round(r.width)+','+Math.round(r.height);if(k!==BRD.posK){BRD.posK=k;e.style.left=r.left+'px';e.style.top=r.top+'px';e.style.width=r.width+'px';e.style.height=r.height+'px'}return true}
function brdFull(){BRD.full=!BRD.full;BRD.posK='';if(BRD.el)BRD.el.classList.toggle('full',BRD.full);brdPos();brdHead()}
function brdOpen(){brdBoot();brdUI();if(BRD.open)return;if(!brdFloor()){toast('Open the Sales Floor to use the Brainstorm Board.');return}BRD.open=1;BRD.posK='';brdPos();BRD.st.className='brds t-'+BRD.tool;BRD.el.classList.add('on');brdHead();requestAnimationFrame(()=>{brdResize(1);brdLoop()});
  document.addEventListener('keydown',brdKey,true);document.addEventListener('keyup',brdKeyUp,true);document.addEventListener('paste',brdPaste,true);brdCur(null,1)}
function brdClose(){if(!BRD.open)return;if(BRD.ed)brdEdEnd(true);BRD.open=0;BRD.sel=null;BRD.act=null;BRD.ptr.clear();brdChartClose();BRD.el.classList.remove('on');if(BRD.full){BRD.full=false;BRD.el.classList.remove('full')}cancelAnimationFrame(BRD.raf);
  document.removeEventListener('keydown',brdKey,true);document.removeEventListener('keyup',brdKeyUp,true);document.removeEventListener('paste',brdPaste,true);
  try{if(typeof VC!=='undefined'&&VC.on&&VC.room)VC.room.presence({bd:null}).catch(()=>{})}catch(e){}BRD.curK=''}
function brdResize(refit){const st=BRD.st,w=Math.max(2,st.clientWidth|0),h=Math.max(2,st.clientHeight|0),dpr=Math.min(2,globalThis.devicePixelRatio||1);BRD.dpr=dpr;
  [BRD.cb,BRD.cl].forEach(c=>{c.width=w*dpr;c.height=h*dpr;c.style.width=w+'px';c.style.height=h+'px'});const V=BRD.v,mL=58,mB=58,fit=Math.max(.01,Math.min((w-mL-14)/BRD.W,(h-mB-14)/BRD.H));
  V.fit=fit;V.s=fit;V.ox=mL+(w-mL-14-BRD.W*fit)/2;V.oy=12+(h-12-mB-BRD.H*fit)/2;BRD.sw=w;BRD.sh=h;BRD.dirty=1;if(BRD.ed)brdTaStyle();brdHead()}
function brdFit(){brdResize(1)}
function brdZoom(f,px,py){const V=BRD.v;if(px===undefined){px=BRD.sw/2;py=BRD.sh/2}const s=Math.max(V.fit*.5,Math.min(V.fit*8,V.s*f));V.ox=px-(px-V.ox)*s/V.s;V.oy=py-(py-V.oy)*s/V.s;V.s=s;BRD.dirty=1;if(BRD.ed)brdTaPlace();brdHead()}
function brdPt(e){const r=BRD.st.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,V=BRD.v;return{x:(px-V.ox)/V.s,y:(py-V.oy)/V.s,px,py}}
function brdLoop(){if(!BRD.open)return;BRD.raf=requestAnimationFrame(brdLoop);if(!brdPos()){brdClose();return}try{if(BRD.dirty){BRD.dirty=0;brdPaint()}brdLive()}catch(e){}if(++BRD.pv%60===0)brdHead()}
function brdPaint(){const c=BRD.cb,x=c.getContext('2d'),d=BRD.dpr,V=BRD.v;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.setTransform(d*V.s,0,0,d*V.s,d*V.ox,d*V.oy);
  x.save();x.shadowColor='rgba(255,31,79,.32)';x.shadowBlur=60;x.fillStyle='#0a060d';x.fillRect(0,0,BRD.W,BRD.H);x.restore();
  x.save();x.beginPath();x.rect(0,0,BRD.W,BRD.H);x.clip();const A=BRD.act;brdRender(x,{drag:A&&(A.k==='move'||A.k==='size')&&A.d?A.d:null,hide:BRD.ed&&BRD.ed.id});x.restore();
  x.strokeStyle='rgba(255,31,79,.55)';x.lineWidth=2/V.s;x.strokeRect(0,0,BRD.W,BRD.H);
  BRD.stl.textContent=(BRD.list.length?BRD.list.length+(BRD.list.length===1?' item':' items'):'Empty board')+(BRD.err?' - '+BRD.err:'')}
function brdLive(){const c=BRD.cl,x=c.getContext('2d'),d=BRD.dpr,V=BRD.v,A=BRD.act;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,c.width,c.height);x.setTransform(d*V.s,0,0,d*V.s,d*V.ox,d*V.oy);
  if(A&&A.k==='draw'){brdItem(x,{t:'s',p:A.p,c:A.c,lw:A.lw,al:A.al,dx:0,dy:0})}
  if(A&&A.k==='shape'){const s=brdShapeOf(A);if(s)brdItem(x,s)}
  if(A&&A.k==='erase'&&A.at){x.beginPath();x.arc(A.at.x,A.at.y,A.r,0,Math.PI*2);x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=2/V.s;x.stroke()}
  const sid=BRD.sel,si=sid&&BRD.it.get(sid);BRD.sb.style.display='none';
  if(si&&!BRD.ed){const it=A&&A.d&&A.d.id===sid?brdMoved(si,A.d):si,b=brdBB(it),pd=8/V.s;x.setLineDash([10/V.s,7/V.s]);x.strokeStyle='#ff1f4f';x.lineWidth=2/V.s;x.strokeRect(b.x-pd,b.y-pd,b.w+pd*2,b.h+pd*2);x.setLineDash([]);
    brdHandles(it).forEach(h=>{x.beginPath();x.arc(h.x,h.y,7/V.s,0,Math.PI*2);x.fillStyle='#fff';x.fill();x.strokeStyle='#ff1f4f';x.lineWidth=3/V.s;x.stroke()});
    if(!A){const sx=V.ox+(b.x+b.w/2)*V.s,sy=V.oy+(b.y-pd)*V.s-10;BRD.sb.style.display='flex';BRD.sb.style.left=Math.max(80,Math.min(BRD.sw-80,sx))+'px';BRD.sb.style.top=Math.max(48,sy)+'px';
      const k=si.t+'|'+sid;if(BRD.sb._k!==k){BRD.sb._k=k;BRD.sb.innerHTML=(si.t==='x'||si.t==='n'?'<button onclick="brdEditSel()">EDIT</button>':'')+'<button onclick="brdFront()">TO FRONT</button><button onclick="brdDup()">COPY</button><button class=del onclick="brdDel([BRD.sel])">DELETE</button>'}}}
  brdPeers().forEach(p=>{if(p.me)return;const r=10/V.s;x.beginPath();x.arc(p.x,p.y,r,0,Math.PI*2);x.fillStyle=p.c;x.fill();x.strokeStyle='#fff';x.lineWidth=2/V.s;x.stroke();
    x.font=`800 ${13/V.s}px Verdana,Geneva,sans-serif`;const nm=p.nm.split(' ')[0].toUpperCase(),tw=x.measureText(nm).width;x.fillStyle=p.c;x.beginPath();brdRR(x,p.x+r*1.2,p.y+r*.6,tw+12/V.s,20/V.s,6/V.s);x.fill();x.fillStyle='#0b070c';x.textBaseline='middle';x.fillText(nm,p.x+r*1.2+6/V.s,p.y+r*.6+10/V.s)})}
function brdHandles(it){if(it.t==='s')return[];if(it.t==='a'||it.t==='l')return[{x:it.x,y:it.y,end:0},{x:it.x2,y:it.y2,end:1}];return[{x:it.x+it.w,y:it.y+it.h,end:1}]}
function brdShapeOf(A){const t=A.t;if(t==='a'||t==='l'){if(Math.hypot(A.x1-A.x0,A.y1-A.y0)<4)return null;return{t,x:A.x0,y:A.y0,x2:A.x1,y2:A.y1,c:A.c,lw:A.lw}}
  let x0=Math.min(A.x0,A.x1),y0=Math.min(A.y0,A.y1),w=Math.abs(A.x1-A.x0),h=Math.abs(A.y1-A.y0);if(A.sq){const m=Math.max(w,h);w=h=m;x0=A.x1<A.x0?A.x0-m:A.x0;y0=A.y1<A.y0?A.y0-m:A.y0}if(w<4&&h<4)return null;return{t,x:x0,y:y0,w:Math.max(8,w),h:Math.max(8,h),c:A.c,lw:A.lw}}
function brdColNow(){return BRDC[BRD.ci]||BRDC[0]}
function brdTool(k){if(BRD.ed)brdEdEnd(true);BRD.tool=k;if(k!=='sel')BRD.sel=null;BRD.st.className='brds t-'+k;brdHead()}
function brdColor(i){BRD.ci=i;const it=BRD.sel&&BRD.it.get(BRD.sel);if(it){const o=Object.assign({},it);if(it.t==='n')o.bg=BRDN[i];else if(it.t!=='i'&&it.t!=='c')o.c=BRDC[i];brdSet(BRD.sel,o)}if(BRD.ed){BRD.ed.it.c=BRDC[i];if(BRD.ed.it.t==='n')BRD.ed.it.bg=BRDN[i];brdTaStyle()}brdHead()}
function brdSize(i){BRD.si=i;const it=BRD.sel&&BRD.it.get(BRD.sel);if(it){const o=Object.assign({},it);if(it.t==='s')o.lw=it.al<1?BRDS[i]*3+10:BRDS[i];else if('ralo'.includes(it.t))o.lw=BRDS[i];else if(it.t==='x'){o.f=BRDF[i];const m=brdMeasure(o.v,o.f);o.w=m.w;o.h=m.h}brdSet(BRD.sel,o)}
  if(BRD.ed&&BRD.ed.it.t==='x'){BRD.ed.it.f=BRDF[i];brdTaStyle()}brdHead()}
function brdFront(){const it=BRD.sel&&BRD.it.get(BRD.sel);if(it)brdSet(BRD.sel,Object.assign({},it,{z:Date.now()}))}
function brdDup(){const it=BRD.sel&&BRD.it.get(BRD.sel);if(!it)return;const o=brdMoved(it,{k:'move',dx:40,dy:40});delete o.z;delete o.at;const id=brdNew(o);if(id)BRD.sel=id}
/* pointer input */
function brdDown(e){if(e.target===BRD.ta||BRD.pn.contains(e.target)||BRD.sb.contains(e.target)||(e.target.closest&&e.target.closest('.brdtools,.brdpal')))return;if(BRD.ed){brdEdEnd(true);if(BRD.tool==='txt')return}
  try{BRD.st.setPointerCapture(e.pointerId)}catch(x){}BRD.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(BRD.ptr.size===2){const [a,b]=[...BRD.ptr.values()];BRD.act={k:'pinch',d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};return}if(BRD.ptr.size>2)return;
  const p=brdPt(e),V=BRD.v,tool=BRD.space||e.button===1?'hand':BRD.tool,tol=8/V.s;
  if(tool==='hand'){BRD.act={k:'pan',x:e.clientX,y:e.clientY,ox:V.ox,oy:V.oy};BRD.st.classList.add('grab');return}
  if(tool==='sel'){const si=BRD.sel&&BRD.it.get(BRD.sel);if(si){const h=brdHandles(si).find(h=>Math.hypot(h.x-p.x,h.y-p.y)<14/V.s);if(h){BRD.act={k:'size',id:BRD.sel,x:p.x,y:p.y,end:h.end,d:{k:'size',id:BRD.sel,dx:0,dy:0,end:h.end}};return}}
    const id=brdHit(p.x,p.y,tol);if(id){BRD.sel=id;BRD.act={k:'move',id,x:p.x,y:p.y,d:{k:'move',id,dx:0,dy:0}};brdHead();return}
    BRD.sel=null;brdHead();BRD.act={k:'pan',x:e.clientX,y:e.clientY,ox:V.ox,oy:V.oy};BRD.st.classList.add('grab');return}
  if(!brdCan())return;
  if(tool==='pen'||tool==='hl'){const hl=tool==='hl';BRD.act={k:'draw',p:[Math.round(p.x),Math.round(p.y)],c:brdColNow(),lw:hl?BRDS[BRD.si]*3+10:BRDS[BRD.si],al:hl?.35:1};return}
  if(tool==='era'){BRD.act={k:'erase',del:new Set(),r:14+BRDS[BRD.si]*1.5,at:p};brdErase(p);return}
  if('rola'.includes(tool)){BRD.act={k:'shape',t:tool,x0:p.x,y0:p.y,x1:p.x,y1:p.y,c:brdColNow(),lw:BRDS[BRD.si],sq:e.shiftKey};return}
  if(tool==='txt'){const id=brdHit(p.x,p.y,tol),it=id&&BRD.it.get(id);if(it&&it.t==='x'){brdEdStart(id);return}brdEdNew({t:'x',x:p.x,y:p.y-BRDF[BRD.si]*.6,f:BRDF[BRD.si],c:brdColNow(),v:''});return}
  if(tool==='note'){const id=brdHit(p.x,p.y,tol),it=id&&BRD.it.get(id);if(it&&it.t==='n'){brdEdStart(id);return}brdEdNew({t:'n',x:p.x-150,y:p.y-130,w:300,h:260,bg:BRDN[BRD.ci],v:''});return}}
function brdMove(e){const p=brdPt(e);if(BRD.ptr.has(e.pointerId))BRD.ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});brdCur(p);const A=BRD.act;if(!A)return;const V=BRD.v;
  if(A.k==='pinch'){if(BRD.ptr.size<2)return;const [a,b]=[...BRD.ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,r=BRD.st.getBoundingClientRect();
    V.ox+=cx-A.cx;V.oy+=cy-A.cy;brdZoom(d/(A.d||1),cx-r.left,cy-r.top);A.d=d;A.cx=cx;A.cy=cy;return}
  if(A.k==='pan'){V.ox=A.ox+e.clientX-A.x;V.oy=A.oy+e.clientY-A.y;BRD.dirty=1;if(BRD.ed)brdTaPlace();return}
  if(A.k==='draw'){const ev=e.getCoalescedEvents?e.getCoalescedEvents():[e];for(const q of ev){const pp=brdPt(q),lx=A.p[A.p.length-2],ly=A.p[A.p.length-1];if(Math.hypot(pp.x-lx,pp.y-ly)>=2.5){A.p.push(Math.round(pp.x),Math.round(pp.y))}}
    if(A.p.length>=3600){const last=A.p.slice(-2);brdStroke(A);A.p=last}return}
  if(A.k==='erase'){A.at=p;brdErase(p);return}
  if(A.k==='shape'){A.x1=p.x;A.y1=p.y;A.sq=e.shiftKey;return}
  if(A.k==='move'||A.k==='size'){A.d.dx=p.x-A.x;A.d.dy=p.y-A.y;BRD.dirty=1}}
function brdUp(e){BRD.ptr.delete(e.pointerId);const A=BRD.act;BRD.st.classList.remove('grab');if(!A)return;if(A.k==='pinch'){if(BRD.ptr.size<2)BRD.act=null;return}BRD.act=null;
  if(A.k==='draw')brdStroke(A);
  else if(A.k==='erase'){if(A.del.size)brdDel([...A.del]);BRD.dirty=1}
  else if(A.k==='shape'){const s=brdShapeOf(A);if(s){const id=brdNew(s);if(id&&BRD.tool==='sel')BRD.sel=id}}
  else if(A.k==='move'||A.k==='size'){const it=BRD.it.get(A.id);if(it&&(Math.abs(A.d.dx)>.5||Math.abs(A.d.dy)>.5)){if(!brdCan()){BRD.dirty=1;return}let o=brdMoved(it,A.d);if(o.t==='x'){const m=brdMeasure(o.v,o.f);o.w=m.w;o.h=m.h}brdSet(A.id,o)}BRD.dirty=1}}
function brdSimplify(p,eps){if(p.length<=6)return p;const pts=[];for(let i=0;i<p.length;i+=2)pts.push([p[i],p[i+1]]);const keep=new Uint8Array(pts.length);keep[0]=keep[pts.length-1]=1;const st=[[0,pts.length-1]];
  while(st.length){const [a,b]=st.pop();let md=0,mi=-1;for(let i=a+1;i<b;i++){const d=brdSeg(pts[i][0],pts[i][1],pts[a][0],pts[a][1],pts[b][0],pts[b][1]);if(d>md){md=d;mi=i}}if(md>eps&&mi>0){keep[mi]=1;st.push([a,mi],[mi,b])}}
  const out=[];pts.forEach((q,i)=>{if(keep[i])out.push(q[0],q[1])});return out}
function brdStroke(A){const p=brdSimplify(A.p,.8);brdNew({t:'s',p,c:A.c,lw:A.lw,al:A.al,dx:0,dy:0})}
function brdErase(p){const A=BRD.act;for(let i=BRD.list.length-1;i>=0;i--){const [id,it]=BRD.list[i];if(A.del.has(id))continue;if('salro'.includes(it.t)&&brdHitIt(it,p.x,p.y,A.r)){A.del.add(id)}}
  if(A.del.size){BRD.dirty=1;BRD.list=BRD.list.filter(([id])=>!A.del.has(id))}}
function brdWheel(e){e.preventDefault();const r=BRD.st.getBoundingClientRect();if(e.ctrlKey||e.metaKey){brdZoom(Math.exp(-e.deltaY*.0045),e.clientX-r.left,e.clientY-r.top)}else{const V=BRD.v;V.ox-=e.shiftKey?e.deltaY:e.deltaX;V.oy-=e.shiftKey?0:e.deltaY;BRD.dirty=1;if(BRD.ed)brdTaPlace()}}
function brdDbl(e){const p=brdPt(e),id=brdHit(p.x,p.y,8/BRD.v.s),it=id&&BRD.it.get(id);if(it&&(it.t==='x'||it.t==='n')&&!BRD.ro)brdEdStart(id)}
function brdKey(e){if(!BRD.open)return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;const k=e.key,mod=e.ctrlKey||e.metaKey;let ok=1;
  if(mod&&(k==='z'||k==='Z')){e.shiftKey?brdRedo():brdUndo()}else if(mod&&(k==='y'||k==='Y'))brdRedo();
  else if(mod)ok=0;
  else if(k==='Escape'){if(BRD.pn.classList.contains('on'))brdChartClose();else if(BRD.sel){BRD.sel=null;brdHead()}else brdClose()}
  else if((k==='Delete'||k==='Backspace')&&BRD.sel)brdDel([BRD.sel]);
  else if(k===' '){if(!BRD.space){BRD.space=1;BRD.st.classList.add('pan')}}
  else if(k==='+'||k==='=')brdZoom(1.25);else if(k==='-'||k==='_')brdZoom(1/1.25);else if(k==='0')brdFit();
  else{const m=k.length===1?{v:'sel',p:'pen',h:'hl',e:'era',t:'txt',n:'note',r:'r',o:'o',a:'a',l:'l'}[k.toLowerCase()]:null;if(m)brdTool(m);else ok=0}
  if(ok)e.preventDefault();if(ok||!mod)e.stopPropagation()}
function brdKeyUp(e){if(e.key===' '){BRD.space=0;if(BRD.st)BRD.st.classList.remove('pan')}}
function brdCur(p,force){try{if(typeof VC==='undefined'||!VC.on||!VC.room)return;const now=Date.now();if(!force&&now-BRD.curT<120)return;const b=p?{x:Math.round(Math.max(0,Math.min(BRD.W,p.x))),y:Math.round(Math.max(0,Math.min(BRD.H,p.y)))}:{x:BRD.W/2,y:BRD.H/2};
  const k=b.x+','+b.y;if(k===BRD.curK&&!force)return;BRD.curK=k;BRD.curT=now;VC.room.presence({bd:b}).catch(()=>{})}catch(e){}}
/* text and sticky notes */
function brdMeasure(v,f){const x=BRD.cb?BRD.cb.getContext('2d'):document.createElement('canvas').getContext('2d');x.save();x.setTransform(1,0,0,1,0,0);x.font=`700 ${f}px Verdana,Geneva,sans-serif`;const L=String(v).split('\n');let w=0;L.forEach(l=>{w=Math.max(w,x.measureText(l).width)});x.restore();return{w:Math.max(20,w+12),h:L.length*f*1.22+10}}
function brdEdNew(it){BRD.ed={id:null,it};BRD.ta.value='';brdTaShow()}
function brdEdStart(id){const it=BRD.it.get(id);if(!it||!brdCan())return;BRD.sel=null;BRD.ed={id,it:Object.assign({},it)};BRD.ta.value=it.v||'';brdTaShow();BRD.dirty=1}
function brdEditSel(){if(BRD.sel)brdEdStart(BRD.sel)}
function brdTaShow(){const ta=BRD.ta;ta.style.display='block';brdTaStyle();setTimeout(()=>{ta.focus();try{ta.setSelectionRange(ta.value.length,ta.value.length)}catch(e){}},0)}
function brdTaStyle(){const E=BRD.ed;if(!E)return;const it=E.it,ta=BRD.ta,V=BRD.v;ta.classList.toggle('note',it.t==='n');
  if(it.t==='n'){ta.style.background=it.bg;ta.style.color='#1b1420';const f=Math.max(14,Math.min(46,it.h/4));ta.style.fontSize=f*V.s+'px';ta.style.padding=Math.min(26,it.w*.08)*V.s+'px'}else{ta.style.background='rgba(10,6,13,.55)';ta.style.color=it.c;ta.style.fontSize=it.f*V.s+'px';ta.style.padding='2px 4px'}
  brdTaPlace();brdTaFit()}
function brdTaPlace(){const E=BRD.ed;if(!E)return;const it=E.it,ta=BRD.ta,V=BRD.v;ta.style.left=V.ox+it.x*V.s+'px';ta.style.top=V.oy+it.y*V.s+'px';if(it.t==='n'){ta.style.width=it.w*V.s+'px';ta.style.height=it.h*V.s+'px'}}
function brdTaFit(){const E=BRD.ed;if(!E||E.it.t==='n')return;const ta=BRD.ta,m=brdMeasure(ta.value||'M',E.it.f),V=BRD.v;ta.style.width=Math.max(160,m.w*V.s+18)+'px';ta.style.height=Math.max(m.h,E.it.f*1.3)*V.s+8+'px'}
function brdEdEnd(save){const E=BRD.ed;if(!E)return;BRD.ed=null;const ta=BRD.ta,v=String(ta.value||'').replace(/\s+$/,'').slice(0,2000);ta.style.display='none';ta.blur();BRD.dirty=1;if(!save)return;const it=Object.assign({},E.it,{v});
  if(it.t==='x'){if(!v.trim()){if(E.id)brdDel([E.id]);return}const m=brdMeasure(v,it.f);it.w=m.w;it.h=m.h}
  if(E.id)brdSet(E.id,it);else{if(it.t==='x'&&!v.trim())return;const id=brdNew(it);if(id&&BRD.tool==='sel')BRD.sel=id}}
/* photos */
function brdPickImg(){if(!brdCan())return;BRD.el.querySelector('.brdf').click()}
function brdCenter(j){const V=BRD.v,r=j?()=>(Math.random()-.5)*160:()=>0;return{x:(BRD.sw/2-V.ox)/V.s+r(),y:(BRD.sh/2-V.oy)/V.s+r()}}
async function brdFiles(files,at){if(!brdCan())return;const ims=files.filter(f=>/^image\//.test(f.type)).slice(0,6);if(!ims.length)return toast('Drop or pick photos (PNG, JPG, GIF or WebP).');const c=at||brdCenter();let k=0;
  for(const f of ims){try{const d=await rdURL(f),r=await imgFit(d),full=r&&r.full?r.full:String(r||''),i=full.indexOf(','),data=full.slice(i+1);if(!B64.test(data)||data.length>1.3e6){toast('That photo is too big.');continue}
      const dim=await new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth,im.naturalHeight]);im.onerror=()=>res([4,3]);im.src=full});const sc=Math.min(900/dim[0],600/dim[1],1.6),w=Math.max(60,dim[0]*sc),h=Math.max(45,dim[1]*sc);
      const id=fileKey(uid()),parts=[];for(let p=0;p<data.length;p+=18e4)parts.push(data.slice(p,p+18e4));
      if(BRD.db){for(let n=0;n<parts.length;n++)await BRD.db.doc('files/'+id+'_'+n).set({d:parts[n]})}else BRD.loc[id]=data;BRD.loc[id]=data;
      const nid=brdNew({t:'i',im:{id,n:parts.length},x:c.x-w/2+k*40,y:c.y-h/2+k*40,w,h});if(nid){BRD.sel=nid;if(BRD.tool!=='sel')brdTool('sel');BRD.sel=nid}k++}catch(e){toast('Could not add that photo.')}}}
function brdPaste(e){if(!BRD.open)return;const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;const it=e.clipboardData&&e.clipboardData.items;if(!it)return;const fs=[];let txt='';
  for(const x of it){if(x.kind==='file'){const f=x.getAsFile();if(f)fs.push(f)}}if(fs.length){e.preventDefault();brdFiles(fs,null);return}
  txt=(e.clipboardData.getData('text/plain')||'').slice(0,2000);if(txt.trim()&&brdCan()){e.preventDefault();const c=brdCenter(),f=BRDF[BRD.si],m=brdMeasure(txt,f);brdNew({t:'x',x:c.x-m.w/2,y:c.y-m.h/2,w:m.w,h:m.h,f,c:brdColNow(),v:txt})}}
/* charts */
function brdChartOpen(){if(!brdCan())return;const C=BRD.chart;BRD.pn.classList.add('on');BRD.pn.innerHTML=`<h5>ADD A CHART</h5>
  <div class=seg>${[['bar','Bars'],['line','Line'],['pie','Pie']].map(([k,l])=>`<button class="btn o${C.k===k?' on':''}" onclick="BRD.chart.k='${k}';brdChartOpen()">${l}</button>`).join('')}</div>
  <label for=brdct>Title</label><input id=brdct maxlength=80 value="${esc(C.ti||'')}" placeholder="What are we looking at?" oninput="BRD.chart.ti=this.value">
  <label for=brdcd>Data: one per line, label then value</label><textarea id=brdcd placeholder="Mon, 4&#10;Tue, 7&#10;Wed, 5" oninput="BRD.chart.d=this.value">${esc(C.d||'')}</textarea>
  <div class=pre><button class="btn o" onclick="brdPreset('ap')">Team AP this week</button><button class="btn o" onclick="brdPreset('apps')">Apps this week</button><button class="btn o" onclick="brdPreset('st')">Policies by status</button></div>
  <div class=ft><button class="btn o" onclick="brdChartClose()">Cancel</button><button class=btn onclick="brdChartAdd()">Add to board</button></div>`;setTimeout(()=>{const i=document.getElementById('brdct');if(i)i.focus()},30)}
function brdChartClose(){if(BRD.pn){BRD.pn.classList.remove('on');BRD.pn.innerHTML=''}}
function brdPreset(k){let rows=[],ti='';try{if(k==='st'){const m={};(D.policies||[]).forEach(p=>{const s=String(p.st||'Other');m[s]=(m[s]||0)+1});rows=Object.entries(m);ti='Policies by status'}
    else{const S=voStats(),o=k==='ap'?S.T:S.A;rows=Object.entries(o||{}).sort((a,b)=>b[1]-a[1]).map(([n,v])=>[String(n).split(' ')[0],Math.round(v)]);ti=k==='ap'?'Issued AP, last 7 days':'Apps written, last 7 days'}}catch(e){}
  if(!rows.length)rows=[['No data yet',0]];BRD.chart.ti=ti;BRD.chart.d=rows.map(r=>r[0]+', '+r[1]).join('\n');if(k==='st')BRD.chart.k='pie';brdChartOpen()}
function brdChartAdd(){const C=BRD.chart,lb=[],vl=[];String(C.d||'').split('\n').forEach(l=>{const m=l.match(/^\s*(.+?)\s*[,:=\t]\s*\$?\s*(-?[\d.,]+)\s*[kKmM]?\s*$/)||l.match(/^\s*(.+?)\s+\$?(-?[\d.,]+)\s*$/);if(!m)return;let v=+String(m[2]).replace(/,/g,'');if(/k\s*$/i.test(l))v*=1e3;if(/m\s*$/i.test(l))v*=1e6;if(isFinite(v)){lb.push(m[1].slice(0,24));vl.push(v)}});
  if(!lb.length)return toast('Add at least one line like "Mon, 4".');const c=brdCenter(1),w=C.k==='pie'?820:900,h=520;const id=brdNew({t:'c',k:C.k,ti:String(C.ti||'').slice(0,80),lb:lb.slice(0,24),vl:vl.slice(0,24),x:c.x-w/2,y:c.y-h/2,w,h});
  brdChartClose();if(id){brdTool('sel');BRD.sel=id}}
/* save, clear */
async function brdExport(){const c=document.createElement('canvas');c.width=BRD.W;c.height=BRD.H;const x=c.getContext('2d');brdRender(x);const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)return toast('Could not save the picture.');
  let dl=null;try{const cl=globalThis.claude;dl=cl&&cl.use?await cl.use('downloads'):null}catch(e){}const fn='brainstorm-board-'+new Date().toISOString().slice(0,10)+'.png';
  if(dl){try{await dl.save({filename:fn,data:blob});toast('Saved',1)}catch(e){toast(e&&e.code==='declined'?'Save cancelled.':'Could not save the picture.')}return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);toast('Saved',1)}catch(e){toast('Could not save the picture.')}}
function brdClear(){if(!brdOwner())return;ask('Clear the whole Brainstorm Board for everyone? You can undo this right after.',()=>{brdDel(BRD.list.map(r=>r[0]));toast('Board cleared',1)})}
// the Sales Floor wall
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined')return;clearInterval(w);
  voApi.board=function(){brdBoot();return{cv:brdTex(),v:BRD.tv,open:!!BRD.open,cur:brdPeers().map(p=>({x:p.x,y:p.y,c:p.c})),W:BRD.W,H:BRD.H}};voApi.openBoard=function(){brdOpen()}},300)})();
/*BRDend*/
