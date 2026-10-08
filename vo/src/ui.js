import {esc} from './util.js';
import {ACC, HAIRC, HAIRS, OUTC_ALL, PANTS, SKIN} from './avatar.js';
import {BPEM, COS, CREM, SIGE, SIGM, SIGP, SIGS} from './cosm.js';

var IC = { board: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/></svg>', cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>', film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M3 7l3-4 4 1 4-1 4 1 3-1v4"/><path d="M7 3l2 4M12 3l2 4M17 3l2 4"/></svg>', snd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>', sndoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>', crowd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/><circle cx="17.5" cy="9" r="2.6"/><path d="M17 13.6c3 .3 5 2.4 5 5.4"/></svg>', exp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>', shrink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>', list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>', micoff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l22 22"/><path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V4a3 3 0 0 0-5.9-.6"/><path d="M17 16.9A7 7 0 0 1 5 12v-2M19 10v2c0 .8-.1 1.5-.4 2.2M12 19v4M8 23h8"/></svg>', x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>' };
var CSS = `.vo3{position:absolute;inset:0;overflow:hidden;background:#07040a;font-family:Verdana,Geneva,sans-serif;color:#fff;-webkit-user-select:none;user-select:none;border-radius:inherit}
.vo3 .vo3c{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none;outline:none}
.vo3 .vo3c.ptr{cursor:pointer}.vo3 .vo3c.drag{cursor:grabbing}
.vo3l{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.vo3t{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;gap:5px;will-change:transform;transition:opacity .35s}
.vo3n{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 8px;border-radius:999px;background:rgba(10,6,14,.74);border:1px solid rgba(255,255,255,.15);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-size:11px;font-weight:700;letter-spacing:.04em;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.45);transition:box-shadow .18s,border-color .18s,transform .18s}
.vo3n i{width:7px;height:7px;border-radius:50%;background:#7c7583;flex:none;transition:background .15s,box-shadow .15s}
.vo3t.sp .vo3n{border-color:#3ddc97;box-shadow:0 0 0 2px rgba(61,220,151,.32),0 0 20px rgba(61,220,151,.55);transform:scale(1.06)}
.vo3t.sp .vo3n i{background:#3ddc97;box-shadow:0 0 9px #3ddc97}
.vo3t.mu .vo3n i{background:#ff4d6d;box-shadow:0 0 8px #ff4d6d}
.vo3n s{display:none;width:12px;height:12px;color:#ff6b84;text-decoration:none}.vo3n s svg{width:12px;height:12px;display:block}.vo3t.mu .vo3n s{display:block}
.vo3n em{font-style:normal;font-size:8px;letter-spacing:.14em;padding:2px 6px;border-radius:999px;background:#ff1f4f}.vo3n em.d{background:#4c4657}
.vo3cam{width:84px;height:84px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.75);box-shadow:0 8px 26px rgba(0,0,0,.6);display:none;background:#000}
.vo3t.cm .vo3cam{display:block}.vo3cam video{width:100%;height:100%;object-fit:cover;display:block}.vo3t.me .vo3cam video{transform:scaleX(-1)}
.vo3hd{display:none;font-size:22px;line-height:1;filter:drop-shadow(0 3px 6px rgba(0,0,0,.6));animation:vo3bob 1.1s ease-in-out infinite}.vo3t.hd .vo3hd{display:block}
@keyframes vo3bob{50%{transform:translateY(-5px) rotate(-8deg)}}
.vo3pop{position:absolute;left:0;top:0;font-size:32px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.5));animation:vo3up 1.9s cubic-bezier(.2,.8,.3,1) forwards}
.vo3pop.t{font:800 15px Verdana,'DejaVu Sans',sans-serif;letter-spacing:.14em;color:#fff;white-space:nowrap;padding:6px 11px;background:linear-gradient(135deg,#ff1f4f,#b3002d);border:1px solid rgba(255,255,255,.35);box-shadow:0 0 18px rgba(255,31,79,.55);text-shadow:0 1px 2px rgba(0,0,0,.4)}
@keyframes vo3up{0%{opacity:0;margin-top:0;transform:translate(-50%,-50%) scale(.3)}14%{opacity:1;transform:translate(-50%,-50%) scale(1.25)}30%{transform:translate(-50%,-50%) scale(1)}100%{opacity:0;margin-top:-110px;transform:translate(-50%,-50%) scale(1)}}
.vo3top{position:absolute;top:12px;left:14px;right:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;pointer-events:none;z-index:4}
.vo3ttl{pointer-events:auto;display:flex;align-items:center;gap:11px;padding:9px 15px 9px 13px;border-radius:14px;background:rgba(10,6,14,.62);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.vo3ttl b{display:block;font-size:13px;letter-spacing:.16em}.vo3ttl small{display:block;font-size:10px;color:#cdb9c4;letter-spacing:.1em;margin-top:2px}
.vo3lv{width:9px;height:9px;border-radius:50%;background:#ff1f4f;box-shadow:0 0 12px #ff1f4f;animation:vo3pl 1.4s ease-in-out infinite;flex:none}@keyframes vo3pl{50%{opacity:.35}}
.vo3tb{pointer-events:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.vo3tb button{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(10,6,14,.62);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#fff;cursor:pointer;display:grid;place-items:center;padding:0;transition:background .15s,transform .15s}
.vo3tb button:hover{transform:translateY(-1px);background:rgba(40,16,28,.8)}.vo3tb button.on{background:rgba(255,31,79,.9);border-color:#ff1f4f}.vo3tb svg{width:17px;height:17px}
.vo3th{position:absolute;inset:0;background:rgba(3,2,5,.94);display:none;flex-direction:column;z-index:8}.vo3th.on{display:flex}
.vo3thh{display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:12px;letter-spacing:.12em;font-weight:700}.vo3thh .vo3lv{margin-right:2px}
.vo3thh button{margin-left:auto;width:36px;height:36px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#fff;cursor:pointer;display:grid;place-items:center}.vo3thh button svg{width:16px;height:16px}
.vo3ths{display:flex;gap:6px}.vo3ths button{margin:0;width:auto;padding:0 12px;font:700 10px Verdana;letter-spacing:.08em}
.vo3thv{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 16px 16px}
.vo3thv video,.vo3thv canvas{width:100%;height:100%;object-fit:contain;background:#000;border-radius:12px;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 20px 80px rgba(255,31,79,.15)}
.vo3toast{position:absolute;left:50%;top:66px;transform:translate(-50%,-6px);padding:9px 18px;border-radius:999px;background:rgba(255,31,79,.94);font-size:12px;font-weight:700;letter-spacing:.04em;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;white-space:nowrap;z-index:6;box-shadow:0 10px 30px rgba(255,31,79,.35)}
.vo3toast.on{opacity:1;transform:translate(-50%,0)}
.vo3card{position:absolute;z-index:6;min-width:210px;padding:12px 14px;border-radius:14px;background:rgba(10,6,14,.9);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.14);box-shadow:0 16px 40px rgba(0,0,0,.55);display:none;transform:translate(-50%,-100%)}
.vo3card.on{display:block}.vo3card b{display:block;font-size:13px;letter-spacing:.04em}.vo3card small{display:block;font-size:10px;color:#c9b5c1;letter-spacing:.1em;margin:3px 0 10px}
.vo3card .r{display:flex;gap:6px;flex-wrap:wrap}.vo3card button{padding:7px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font:700 10px Verdana;letter-spacing:.06em;cursor:pointer}.vo3card button:hover{background:#ff1f4f;border-color:#ff1f4f}
.vo3look{position:absolute;right:14px;top:62px;width:min(330px,calc(100% - 28px));max-height:calc(100% - 160px);overflow:auto;padding:14px 15px;border-radius:16px;background:rgba(10,6,14,.9);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.13);display:none;z-index:7;box-shadow:0 18px 60px rgba(0,0,0,.55)}
.vo3look.on{display:block}.vo3look h4{margin:0 0 4px;font-size:12px;letter-spacing:.18em}.vo3look p{margin:0 0 8px;font-size:10px;color:#bfaab6}
.vo3look h5{margin:12px 0 6px;font-size:9px;letter-spacing:.18em;color:#ff8da3}.vo3sw{display:flex;flex-wrap:wrap;gap:6px}
.vo3sw button{min-width:30px;height:30px;padding:0 9px;border-radius:9px;border:2px solid rgba(255,255,255,.08);cursor:pointer;color:#fff;background:rgba(255,255,255,.06);font:700 10px Verdana}
.vo3sw button.c{width:30px;min-width:30px;padding:0}.vo3sw button.on{border-color:#ff1f4f;box-shadow:0 0 12px rgba(255,31,79,.5)}
.vo3nk{position:absolute;inset:0;pointer-events:none;z-index:4;opacity:0;display:flex;align-items:center;justify-content:center}.vo3nk b{font:800 clamp(15px,3.2vw,38px) Verdana,sans-serif;letter-spacing:.22em;color:#fff;text-align:center;padding:0 16px;text-shadow:0 0 18px #ff1f4f,0 0 44px #ff1f4f}
.vo3look .vo3lk{margin:2px 0 4px;font-size:9.5px;color:#9a8f97}.vo3look h5.vo3bph{margin-top:18px;padding-top:12px;border-top:1px solid rgba(255,255,255,.12);color:#ffcf40}.vo3look h5.vo3bph b{float:right;color:#fff}
.vo3ti{text-decoration:none;font-size:8.5px;letter-spacing:.14em;padding:2px 6px;border-radius:6px;background:rgba(255,207,64,.16);color:#ffcf40;margin-left:4px}
.vo3t.n1 .vo3n{border-color:#e3b04f;box-shadow:0 0 14px rgba(227,176,79,.5)}.vo3t.n1 .vo3n b{color:#ffe08a}.vo3t.n2 .vo3n{border-color:#14e6ff;box-shadow:0 0 16px rgba(20,230,255,.55)}.vo3t.n2 .vo3n b{color:#b6f6ff;text-shadow:0 0 8px #14e6ff}
.vo3t.n3 .vo3n{border-color:#ff7a1a;background:linear-gradient(90deg,rgba(120,20,0,.85),rgba(40,6,10,.85));box-shadow:0 0 16px rgba(255,122,26,.6)}.vo3t.n4 .vo3n{border-color:#dff3ff;background:linear-gradient(90deg,rgba(60,90,120,.8),rgba(12,18,30,.85));box-shadow:0 0 18px rgba(170,230,255,.6)}.vo3t.n4 .vo3n b{color:#fff;text-shadow:0 0 8px #9fd8ff}
.vo3t.n5 .vo3n{border-color:#9fe8ff;background:linear-gradient(90deg,rgba(120,200,240,.45),rgba(10,30,50,.85));box-shadow:0 0 16px rgba(159,232,255,.6)}.vo3t.n5 .vo3n b{color:#e8fbff;text-shadow:0 0 6px #9fe8ff}
.vo3t.n6 .vo3n{border-color:#7dff3a;background:linear-gradient(90deg,rgba(40,90,0,.85),rgba(8,20,4,.85));box-shadow:0 0 16px rgba(125,255,58,.6)}.vo3t.n6 .vo3n b{color:#c9ff9e;text-shadow:0 0 8px #7dff3a}
.vo3t.n7 .vo3n{border-color:#1aff6a;background:#020a04;box-shadow:0 0 12px rgba(26,255,106,.45)}.vo3t.n7 .vo3n b{color:#3dff7a;font-family:Menlo,Consolas,monospace;text-shadow:0 0 6px #1aff6a}
.vo3t.n8 .vo3n{border-color:#e3b04f;background:linear-gradient(90deg,rgba(74,20,112,.92),rgba(30,6,50,.92));box-shadow:0 0 18px rgba(181,92,255,.55)}.vo3t.n8 .vo3n b{color:#ffe08a}
.vo3t.n9 .vo3n{border-color:#b98cff;background:radial-gradient(circle at 20% 40%,rgba(255,255,255,.5) 0 1px,transparent 2px),radial-gradient(circle at 70% 60%,rgba(255,255,255,.45) 0 1px,transparent 2px),linear-gradient(90deg,rgba(60,20,140,.92),rgba(10,10,50,.92));box-shadow:0 0 20px rgba(140,90,255,.65)}.vo3t.n9 .vo3n b{color:#fff;text-shadow:0 0 8px #b98cff}
.vo3t.n10 .vo3n{border-color:transparent;background:linear-gradient(rgba(10,6,14,.88),rgba(10,6,14,.88)) padding-box,linear-gradient(90deg,#ff1f4f,#ffcf40,#3ddc97,#3fa9ff,#b55cff,#ff1f4f) border-box;border-width:2px;background-size:100% 100%,300% 100%;animation:vo3rb 3s linear infinite;box-shadow:0 0 18px rgba(255,120,200,.5)}
@keyframes vo3rb{to{background-position:0 0,300% 0}}
.vo3look p.vo3vx{margin:0 0 7px;line-height:1.45}.vo3look .ft{display:flex;justify-content:space-between;gap:8px;margin-top:14px}.vo3look .ft button{flex:1;padding:9px;border-radius:10px;border:0;background:#ff1f4f;color:#fff;font:800 11px Verdana;letter-spacing:.1em;cursor:pointer}.vo3look .ft button.o{background:rgba(255,255,255,.08)}
.vo3ld{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#2a0815,#07040a 70%);z-index:3;transition:opacity .6s}.vo3ld.off{opacity:0;pointer-events:none}
.vo3ld div{font-size:11px;letter-spacing:.3em;color:#ffb3c2}.vo3ld i{display:block;width:180px;height:2px;margin:12px auto 0;background:linear-gradient(90deg,transparent,#ff1f4f,transparent);background-size:200% 100%;animation:vo3sh 1.1s linear infinite}@keyframes vo3sh{to{background-position:-200% 0}}
.vo3hold{position:absolute;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;overflow:hidden}`;
function injectCSS(){if(document.getElementById('vo3css'))return;const s=document.createElement('style');s.id='vo3css';s.textContent=CSS;document.head.appendChild(s)}
class Overlay {
    constructor(root,o){this.o=o;this.root=root;
    root.insertAdjacentHTML('beforeend',`<div class=vo3l></div><div class=vo3top><div class=vo3ttl><span class=vo3lv></span><div><b>SALES FLOOR</b><small class=vo3cnt>&nbsp;</small></div></div><div class=vo3tb></div></div>
      <div class=vo3toast></div><div class=vo3card></div><div class=vo3look></div><div class=vo3th><div class=vo3thh><span class=vo3lv></span><span class=vo3tht></span><span class=vo3ths></span><button class=vo3thx aria-label="Close">${IC.x}</button></div><div class=vo3thv></div></div><div class=vo3hold></div><div class=vo3ld><div>ENTERING THE FLOOR<i></i></div></div>`);
    const q=s=>root.querySelector(s);this.L=q('.vo3l');this.cnt=q('.vo3cnt');this.tb=q('.vo3tb');this.toastE=q('.vo3toast');this.card=q('.vo3card');this.look=q('.vo3look');this.th=q('.vo3th');this.tht=q('.vo3tht');this.ths=q('.vo3ths');this.thv=q('.vo3thv');this.hold=q('.vo3hold');this.ld=q('.vo3ld');
    q('.vo3thx').onclick=()=>o.closeTheater();this.tags=new Map();this.tt=0}
  loaded(){this.ld.classList.add('off')}
  toolbar(btns){const h=btns.map(b=>`<button class="${b.on?'on':''}" data-k="${b.k}" title="${esc(b.t)}" aria-label="${esc(b.t)}">${b.i}</button>`).join('');if(h!==this._tb){this._tb=h;this.tb.innerHTML=h;this.tb.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();this.o.tool(b.dataset.k)})}}
  count(t){if(t!==this._ct){this._ct=t;this.cnt.innerHTML=t}}
  tag(a){let e=this.tags.get(a.id);if(!e){e=document.createElement('div');e.className='vo3t';e.innerHTML=`<div class=vo3hd>✋</div><div class=vo3cam></div><div class=vo3n><i></i><b></b><s>${IC.micoff}</s></div>`;this.L.appendChild(e);e._b=e.querySelector('b');e._c=e.querySelector('.vo3cam');e._n=e.querySelector('.vo3n');this.tags.set(a.id,e)}return e}
  setTag(e,a,x,y,vis,sc){const nm=a.nm+(a.me?'':''),badge=a.me?'<em>YOU</em>':a.bot?'<em class=d>DEMO</em>':'',L=a.look||{},ti=L.T&&COS.T[L.T]?`<u class=vo3ti>${esc(COS.T[L.T])}</u>`:'';const h=esc(nm)+ti+badge;if(e._h!==h){e._h=h;e._b.innerHTML=h}
    const cls='vo3t'+(a.L>.12&&!a.muted?' sp':'')+(a.muted?' mu':'')+(a.hand?' hd':'')+(a.camOn?' cm':'')+(a.me?' me':'')+(L.N?' n'+L.N:'');if(e.className!==cls)e.className=cls;
    e.style.opacity=vis?'1':'0';e.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%) scale(${sc.toFixed(3)})`}
  dropTag(id){const e=this.tags.get(id);if(e){const v=e._c.querySelector('video');if(v)this.hold.appendChild(v);e.remove();this.tags.delete(id)}}
  pop(x,y,emoji,cls){const p=document.createElement('div');p.className='vo3pop'+(cls?' '+cls:'');p.textContent=emoji;p.style.left=x+'px';p.style.top=y+'px';this.L.appendChild(p);setTimeout(()=>p.remove(),2000)}
  toast(msg,ms=2600){this.toastE.textContent=msg;this.toastE.classList.add('on');clearTimeout(this._tt);this._tt=setTimeout(()=>this.toastE.classList.remove('on'),ms)}
  showCard(a,x,y,acts){this.card.innerHTML=`<b>${esc(a.nm)}${a.me?' (you)':''}</b><small>${esc(a.status)}</small><div class=r>${acts.map(b=>`<button data-k="${b.k}">${esc(b.t)}</button>`).join('')}</div>`;
    this.card.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();this.hideCard();this.o.cardAct(b.dataset.k,a)});
    this.card.style.left=Math.max(120,Math.min(this.root.clientWidth-120,x))+'px';this.card.style.top=Math.max(150,y)+'px';this.card.classList.add('on');this.cardFor=a.id}
  hideCard(){this.card.classList.remove('on');this.cardFor=null}
  openLook($, J, Q) {
      let Z = (W, H, N, F) => `<div class=vo3sw data-k="${W}">${H.map((G, _) => F ? `<button class="c${_ === N ? " on" : ""}" data-v="${_}" style="background:${G}" title="${_ + 1}"></button>` : `<button class="${_ === N ? "on" : ""}" data-v="${_}">${esc(G)}</button>`).join("")}</div>`, U = null;
      try {
        U = this.o.api && this.o.api.bp ? this.o.api.bp() : null;
      } catch (W) {}
      let q = { s: 6, o: 5, k: 10 }, E = (W, H) => !H || q[W] !== undefined && H < q[W] || !!(U && U.has(W, H)), Y = (W, H, N, F) => {
        let G = H.map((D, O) => O).filter((D) => E(W, D)), _ = H.length - G.length;
        return `<div class=vo3sw data-k="${W}">${G.map((D) => F ? `<button class="c${D === N ? " on" : ""}" data-v="${D}" style="background:${H[D]}" title="${D + 1}"></button>` : `<button class="${D === N ? "on" : ""}" data-v="${D}">${esc(H[D])}</button>`).join("")}</div>${_ ? `<p class=vo3lk>&#128274; ${_} more in the Battle Pass, Loot Crates and Shop</p>` : ""}`;
      }, K = SKIN.concat(["linear-gradient(135deg,#f6d37a,#b8862e)", "linear-gradient(135deg,#ffffff,#9fd8ff)", "linear-gradient(135deg,#d99a5e,#7a4a22)", "linear-gradient(135deg,#ffffff,#8a8f99)", "linear-gradient(135deg,#bffcff,#1aa8c0)", "radial-gradient(circle at 30% 30%,#b98cff,#1d0f52)"]), V = () => {
        let W = [["H", "HAT"], ["B", "EXTRA"], ["G", "HEADSET"], ["J", "BLASTER (ON YOUR HIP)"], ["D", "DESK"], ["C", "COMPUTER SETUP"], ["I", "DESK ITEM"], ["R", "CHAIR"], ["T", "TITLE"], ["N", "NAME TAG"], ["E", "ENTRANCE"], ["V", "TALKING AURA"], ["W", "YOUR RIDE"], ["F", "YOUR PLANE (FLIES OVER YOUR DESK)"]], H = `<h5 class=vo3bph>YOUR REWARDS${U ? ` <b>TIER ${U.lvl}</b>` : ""}</h5>` + W.map(([N, F]) => `<h5>${F}</h5>${Y(N, COS[N], $[N] || 0)}`).join("");
        if (U && U.sig) {
          let N = SIGM.map((F, G) => [F, G]).filter(([F]) => !BPEM.some((G) => G[0] === F) && !CREM.some((G) => G[0] === F) || U.em(F));
          H += `<h5>SIGNATURE EMOTE</h5><p>Your own emote: pick a move, an emoji burst, a catchphrase and a sound.</p><div class=vo3sw data-k="X">${N.map(([F, G]) => `<button class="${($.X || 0) === G ? "on" : ""}" data-v="${G}">${esc(F)}</button>`).join("")}</div>
        <div class=vo3sw data-k="Y">${SIGE.map((F, G) => `<button class="${($.Y || 0) === G ? "on" : ""}" data-v="${G}">${F}</button>`).join("")}</div><div class=vo3sw data-k="Z">${SIGP.map((F, G) => `<button class="${($.Z || 0) === G ? "on" : ""}" data-v="${G}">${esc(F)}</button>`).join("")}</div>
        <div class=vo3sw data-k="Q">${SIGS.map((F, G) => `<button class="${($.Q || 0) === G ? "on" : ""}" data-v="${G}">${esc(F)}</button>`).join("")}</div><div class=ft style="margin-top:8px"><button class=o data-x=sig>TRY IT</button></div>`;
        } else
          H += "<h5>SIGNATURE EMOTE</h5><p class=vo3lk>&#128274; Unlocks at tier 30 of the Battle Pass</p>";
        return H;
      }, X = () => {
        this.look.innerHTML = `<h4>YOUR LOOK</h4><p>Everyone on the floor sees this avatar.</p><h5>SKIN</h5>${Y("s", K, $.s, 1)}<h5>HAIR</h5>${Z("h", HAIRS, $.h)}<h5>HAIR COLOR</h5>${Z("c", HAIRC, $.c, 1)}<h5>OUTFIT</h5>${Y("o", COS.o, $.o)}<h5>OUTFIT COLOR</h5>${Y("k", OUTC_ALL, $.k, 1)}<h5>PANTS</h5>${Z("p", PANTS, $.p, 1)}<h5>EXTRAS</h5>${Z("a", ACC, $.a)}${U ? V() : ""}<h5>VOICE EXPRESSIONS</h5><p class=vo3vx>Your face and gestures react to the tone of your voice. Worked out live in each browser; nothing is recorded or sent.</p>${Z("m", ["On", "Off"], $.m || 0)}<div class=ft><button class=o data-x=rand>SHUFFLE</button><button data-x=done>DONE</button></div>`, this.look.querySelectorAll(".vo3sw button").forEach((H) => H.onclick = (N) => {
          N.stopPropagation(), $[H.parentNode.dataset.k] = +H.dataset.v, X(), J($);
        }), this.look.querySelector("[data-x=rand]").onclick = (H) => {
          H.stopPropagation(), $.s = Math.random() * 6 | 0, $.h = Math.random() * 10 | 0, $.c = Math.random() * 8 | 0, $.o = Math.random() * 5 | 0, $.k = Math.random() * 10 | 0, $.p = Math.random() * 4 | 0, $.a = Math.random() * 6 | 0, X(), J($);
        };
        let W = this.look.querySelector("[data-x=sig]");
        if (W)
          W.onclick = (H) => {
            H.stopPropagation();
            try {
              this.o.emote("sig");
            } catch (N) {}
          };
        this.look.querySelector("[data-x=done]").onclick = (H) => {
          H.stopPropagation(), this.closeLook(), Q && Q();
        };
      };
      X(), this.look.classList.add("on"), this.lookOpen = true;
    }
  closeLook(){this.look.classList.remove('on');this.lookOpen=false;this.o.lookClosed&&this.o.lookClosed()}
  theater(open,title,list,cur){if(!open){this.th.classList.remove('on');return}this.tht.textContent=title;this.ths.innerHTML=(list||[]).length>1?list.map(s=>`<button data-sid="${esc(s.sid)}" class="${s.sid===cur?'on':''}">${esc(s.nm)}</button>`).join(''):'';
    this.ths.querySelectorAll('button').forEach(b=>b.onclick=()=>this.o.watch(b.dataset.sid));this.th.classList.add('on')}
}

export {IC, Overlay, injectCSS};
