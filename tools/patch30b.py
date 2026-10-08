import re
p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global s
    assert s.count(a)==cnt,(a[:90],s.count(a))
    s=s.replace(a,b)

# 1) motion preference: follow system by default, remembered "full" / "reduce" override
rep("RM=matchMedia('(prefers-reduced-motion:reduce)').matches;",
    "RM0=(()=>{try{return matchMedia('(prefers-reduced-motion:reduce)').matches}catch(e){return false}})();\n"
    "let MOTION=(()=>{try{return localStorage.getItem('owq_motion')||''}catch(e){return ''}})(),RM=MOTION==='full'?false:MOTION==='reduce'?true:RM0;\n"
    "try{document.documentElement.classList.toggle('fullmo',MOTION==='full');document.documentElement.classList.toggle('redmo',MOTION==='reduce')}catch(e){}")
rep("const RMQ=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();","let RMQ=RM;")

# 2) scope every reduced-motion stylesheet block so "Play cinematic" can lift it
def scope(m):
    body=m.group(1);out=[];i=0
    for rm in re.finditer(r'([^{}]+)\{([^{}]*)\}',body):
        sels=','.join('html:not(.fullmo) '+x.strip() for x in rm.group(1).split(','))
        out.append(sels+'{'+rm.group(2)+'}')
    return '@media(prefers-reduced-motion:reduce){'+''.join(out)+'}'
n0=s.count('@media(prefers-reduced-motion:reduce){')
s=re.sub(r'@media\(prefers-reduced-motion:reduce\)\{((?:[^{}]*\{[^{}]*\})*)\}',scope,s)
assert s.count('html:not(.fullmo)')>=n0, 'scope failed'

css='''/*GFXcss*/html.redmo *{animation:none!important;transition:none!important}
#gfxs{position:fixed;left:16px;top:14px;z-index:330;display:none;align-items:center;gap:9px;padding:7px 13px 7px 11px;border-radius:999px;background:rgba(9,5,13,.66);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.13);color:#eee3ee;font:600 11px/1.25 Verdana,sans-serif;letter-spacing:.05em;cursor:pointer;max-width:min(620px,calc(100vw - 32px));text-align:left;box-shadow:0 8px 30px rgba(0,0,0,.45)}
#gfxs.on{display:flex}#gfxs:hover{border-color:rgba(255,255,255,.3)}
#gfxs i{width:8px;height:8px;border-radius:50%;background:#ffb347;box-shadow:0 0 10px #ffb347;flex:none}
#gfxs.ok i{background:#3ddc97;box-shadow:0 0 10px #3ddc97}#gfxs.bad i{background:#ff4d6d;box-shadow:0 0 10px #ff4d6d}
#gfxs.wait i{animation:gfxp 1s ease-in-out infinite!important}@keyframes gfxp{50%{opacity:.25;transform:scale(.7)}}
#gfxs b{margin-left:8px;padding:3px 9px;border-radius:999px;background:#ff1f4f;color:#fff;font-weight:800;letter-spacing:.08em;white-space:nowrap}
#gfxd{position:fixed;left:16px;top:54px;z-index:331;width:min(420px,calc(100vw - 32px));padding:16px 18px;border-radius:14px;background:rgba(9,5,13,.92);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.14);color:#eee3ee;font:12px/1.5 Verdana,sans-serif;box-shadow:0 18px 60px rgba(0,0,0,.6)}
#gfxd h4{margin:0 0 10px;font-size:12px;letter-spacing:.16em;color:#ff8da3}#gfxd dl{display:grid;grid-template-columns:96px 1fr;gap:5px 10px;margin:0 0 12px}#gfxd dt{color:#9b8d99}#gfxd dd{margin:0;word-break:break-word}
#gfxd .gm{display:flex;gap:6px;flex-wrap:wrap}#gfxd .gm button{padding:6px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#fff;font:700 11px Verdana,sans-serif;cursor:pointer}#gfxd .gm button.on{background:#ff1f4f;border-color:#ff1f4f}
#gfxd .gx{position:absolute;top:8px;right:10px;background:none;border:0;color:#bbb;font-size:18px;cursor:pointer}
/*GFXcssend*/
'''
s=s.replace('/*CXcss*/',css+'/*CXcss*/',1)

js=r'''
// ---- graphics status + motion control (login screen) ----
const GFX={el:null};
function gfxGpu(g){const m=String(g||'').match(/(Radeon[^(),]*|GeForce[^(),]*|Quadro[^(),]*|RTX[^(),]*|Arc[^(),]*|Iris[^(),]*|UHD Graphics[^(),]*|Apple [^(),]*|Mali[^(),]*|Adreno[^(),]*|SwiftShader)/i);return (m?m[1]:String(g||'')).replace(/\s+/g,' ').trim().slice(0,46)}
function gfxOnLogin(){const l=document.getElementById('login');return !!l&&/(^| )on( |$)/.test(l.className)&&!(typeof ONLINE!=='undefined'&&ONLINE)}
function gfxTick(){try{let e=GFX.el;if(!e){e=GFX.el=document.createElement('button');e.id='gfxs';e.type='button';e.onclick=gfxClick;document.body.appendChild(e)}
 if(!gfxOnLogin()){if(e.className)e.className='';const d=document.getElementById('gfxd');if(d)d.remove();return}
 const now=performance.now();let c='',t='';
 if(RM0&&MOTION!=='full'){c='on';t='Animations are paused by your system &ldquo;reduce motion&rdquo; setting<b>&#9654; PLAY CINEMATIC</b>'}
 else if(CX.dead){c='on bad';t='Standard graphics: the ultra 3D engine could not start in this browser<b>DETAILS</b>'}
 else if(CX.on&&!CX.ready){const sec=Math.round((now-(CX.tc0||now))/1000);if(sec>=1){c='on wait';t='Warming up ultra graphics&hellip; '+sec+'s'}}
 else if(CX.ready&&now-(CX.tReady||0)<7000){c='on ok';t='Ultra graphics on'+(CX.gpu?' &middot; '+esc(gfxGpu(CX.gpu)):'')}
 if(e.className!==c)e.className=c;if(e._t!==t){e._t=t;e.innerHTML='<i></i><span>'+t+'</span>'}
 const d=document.getElementById('gfxd');if(d&&d._k!==gfxSig())gfxDetails(true)}catch(x){}}
function gfxSig(){return [CX.ready,CX.dead,CX.es1,MOTION,RM].join()}
function gfxClick(){if(RM0&&MOTION!=='full'){setMotion('full');return}gfxDetails()}
function gfxDetails(refresh){let d=document.getElementById('gfxd');if(d&&!refresh){d.remove();return}if(!d){d=document.createElement('div');d.id='gfxd';d.setAttribute('role','dialog');document.body.appendChild(d)}
 const st=CX.dead?'Not available'+(CX.err?': '+esc(String(CX.err.message||CX.err).slice(0,220)):''):CX.ready?'Running':CX.on?'Compiling shaders&hellip;':'Idle';
 const b=(m,l)=>`<button class="${MOTION===m?'on':''}" onclick="setMotion('${m}')">${l}</button>`;
 d._k=gfxSig();d.innerHTML=`<button class=gx onclick="this.parentNode.remove()" aria-label="Close">&times;</button><h4>GRAPHICS</h4><dl><dt>Engine</dt><dd>${CX.ready&&!CX.dead?'Ultra 3D (ray-marched HDR)':'Standard 2D'}</dd><dt>Status</dt><dd>${st}</dd><dt>GPU</dt><dd>${esc(CX.gpu||'Unknown')}</dd><dt>API</dt><dd>${esc(CX.api||'-')}${CX.api==='WebGL 2'?(CX.es1?' &middot; compatibility shaders':' &middot; fast-compile shaders'):''}</dd><dt>Warm-up</dt><dd>${CX.tComp?(CX.tComp/1000).toFixed(1)+' s':'-'}</dd><dt>System motion</dt><dd>${RM0?'Reduce motion is ON':'Normal'}</dd></dl><div class=gm>${b('full','Full motion')}${b('','Follow system')}${b('reduce','Reduced')}</div>`}
function setMotion(m){MOTION=m;try{if(m)localStorage.setItem('owq_motion',m);else localStorage.removeItem('owq_motion')}catch(e){}
 RM=m==='full'?false:m==='reduce'?true:RM0;RMQ=RM;try{document.documentElement.classList.toggle('fullmo',m==='full');document.documentElement.classList.toggle('redmo',m==='reduce')}catch(e){}
 try{if(!(typeof ONLINE!=='undefined'&&ONLINE))lockView()}catch(e){}gfxTick();const d=document.getElementById('gfxd');if(d)gfxDetails(true)}
setInterval(gfxTick,500);
'''
rep("const alive=L3.fl||(typeof mapOn==='function'&&mapOn());","const alive=!L3.yieldTo&&(L3.fl||(typeof mapOn==='function'&&mapOn()));")
rep("function kick(){if(raf||!L3.ok)return;","function kick(){if(raf||!L3.ok||L3.yieldTo)return;")
rep('/*CXend*/',js+'/*CXend*/')
open(p,'w',encoding='utf-8').write(s)
print('ok',s.count('html:not(.fullmo)'),n0)
