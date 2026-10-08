import re,base64,sys,os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad/'
GXD=SP+'gx/'
OUT='/mnt/user-data/outputs/owq-command-station-v2.html'
src=open(SP+'v70-base.html',encoding='utf-8').read()
L=src.split('\n')
N=len(L)
act={}   # 1-indexed line -> None (delete) | str (replace)
def exp(n,prefix=None,suffix=None,contains=None):
    l=L[n-1]
    if prefix is not None: assert l.startswith(prefix),(n,'prefix',l[:80])
    if suffix is not None: assert l.endswith(suffix),(n,'suffix',l[-80:])
    if contains is not None: assert contains in l,(n,'contains',contains)
def delete(a,b,pa=None,sb=None):
    if pa is not None: exp(a,prefix=pa)
    if sb is not None: exp(b,suffix=sb)
    for n in range(a,b+1):
        assert n not in act,('already acted',n)
        act[n]=None
def replace_line(n,new,**k):
    exp(n,**k); assert n not in act; act[n]=new
def sub(n,a,b,cnt=1):
    l=act[n] if n in act and act[n] is not None else L[n-1]
    assert l.count(a)==cnt,(n,'sub',a[:80],l.count(a))
    act[n]=l.replace(a,b)

b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
engine=open(GXD+'gx_engine.js',encoding='utf-8').read()
ui=open(GXD+'gx_ui.js',encoding='utf-8').read()
def _esc(t):
    o=[]
    for ch in t:
        c=ord(ch)
        if c<128: o.append(ch)
        elif c<0x10000: o.append('\\u%04x'%c)
        else:
            c-=0x10000; o.append('\\u%04x\\u%04x'%(0xd800+(c>>10),0xdc00+(c&0x3ff)))
    return ''.join(o)
ui=_esc(ui)
css=open(GXD+'gx.css',encoding='utf-8').read()
poster='data:image/jpeg;base64,'+b64(GXD+'poster_idle.jpg')
css=css.replace('__POSTER__',poster)
tx="const GXTX={lights:'data:image/jpeg;base64,%s',pack:'data:image/jpeg;base64,%s'};"%(b64(GXD+'lights.jpg'),b64(GXD+'pack.jpg'))

# ---- head: fonts ----
replace_line(1,L[0]+'\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&display=swap">',prefix='<title>')

# ---- css removals ----
replace_line(77,css,prefix='/*CXcss*/#cx{')
replace_line(78,'#fwo{position:fixed;inset:0;width:100%;height:100%;z-index:420;pointer-events:none}',prefix='#fwo{',suffix='/*CXcssend*/')
delete(79,80,pa='#lgmap{',sb=None)
delete(82,89,pa='#lgfx{',sb='/*L3end*/')
delete(95,103,pa='#login.on.s2{')
delete(251,254,pa='.lgp{display:grid')
delete(281,353,pa='/* ===== HERO INTRO v15',sb=None)
exp(353,prefix='#lgmap.cruise')
delete(362,366,pa='#cbars{')
delete(503,504,pa='#cine{display:none}')
delete(514,519,pa='/*LGUI*/',sb='/*LGUIend*/')

# ---- markup ----
i=L[620].index('<canvas id=lgmap'); j=L[620].index('<div id=login></div>')
assert i<j
replace_line(621,L[620][:i]+'<div id=gx aria-hidden="true"><div id=gxposter></div></div><div id=gxfl></div>'+L[620][j:],contains='<canvas id=lgmap')

# ---- js: sync refresh, login functions ----
sub_n=4725
sub(4725,"if(!LG&&document.getElementById('login').className==='on')lockView();return}","if(!LG&&typeof GXU!=='undefined'&&GXU.on())GXU.refresh();return}")
delete(4816,4826,pa='function lockView(){')
exp(4827,prefix='let RMQ=RM;')
delete(4828,4830,pa='function pickProfile(n){')
delete(4831,4971,pa='const MP={',sb='mapEvGen(t)}')
delete(4998,5119,pa='const FLY={',sb='FLY.raf=requestAnimationFrame(flyFrame)}')
delete(5121,5125,pa='function doLogin(){')
delete(6165,6658,pa='/* ===== CINEMATIC GRADE')
exp(6659,prefix='/* ===== Check-in nag')
sub(6777,"photo:()=>(typeof CX!=='undefined'&&CX.IMG&&CX.IMG.photo)||''","photo:()=>OFFICE_PHOTO||''")

# ---- the GX block replaces the CX renderer ----
m=re.search(r"photo:'(data:image/jpeg;base64,[A-Za-z0-9+/=]+)'",L[6817])
assert m
photo=m.group(1)
glue=r'''
function lockView(){
 try{const o=document.getElementById('ytfx');if(o)o.remove()}catch(e){}
 if(ONLINE)acOut();ONLINE=0;LG=null;clearTimeout(SIMT);POPS=[];RAIL=false;
 const rl=document.getElementById('rail');if(rl)rl.className='rail';popRender();
 lobbyStart();GXU.enter()}
function pickProfile(n){GXU.pick(n)}
function doLogin(){
 if(GXU.U.leaving)return;
 const i=document.getElementById('lgi'),v=i?i.value.trim():'';
 if(!i||!v||!LG){if(i){i.classList.add('shake');setTimeout(()=>i.classList.remove('shake'),500)}return}
 if(PWD[LG]&&v.toLowerCase()!==PWD[LG]){i.value='';i.placeholder='Wrong code. Try again.';i.classList.add('shake');setTimeout(()=>i.classList.remove('shake'),500);GXU.deny();return}
 fxLogin();WHO=LG;const l=document.getElementById('login');
 GXU.granted(()=>{l.className='';l.innerHTML='';document.getElementById('who').innerHTML=`<span class=whr>${av(WHO,30)}<span>OPERATOR<br>${esc(WHO.toUpperCase())}</span></span>`;if(typeof GXU.U!=='undefined')GXU.U.st='off';tab='Command Deck';ONLINE=1;LASTACT=Date.now();railInit();chInit();acIn();go();setTimeout(scanStream,RM?400:2600);simLoop()})}
function setMotion(m){MOTION=m;try{if(m)localStorage.setItem('owq_motion',m);else localStorage.removeItem('owq_motion')}catch(e){}
 RM=m==='full'?false:m==='reduce'?true:RM0;RMQ=RM;try{document.documentElement.classList.toggle('fullmo',m==='full');document.documentElement.classList.toggle('redmo',m==='reduce')}catch(e){}
 try{if(!(typeof ONLINE!=='undefined'&&ONLINE)){GXU.motion();GXU.gfxR()}}catch(e){}}
'''
block='/*GXstart*/\n'+engine+'\n'+tx+'\nconst OFFICE_PHOTO=\''+photo+'\';\n'+ui+glue+'/*GXend*/'
replace_line(6813,block,prefix='/*CXstart*/')
delete(6814,7090)
# alert code that stays (7091-7116): detach from the old renderer
sub(7112,"if(CX.on&&CX.ready)CX.firework({col,typ});else fwOverlay(col,typ);","if(typeof GXU!=='undefined'&&GXU.on())GXU.ping(al,true);else fwOverlay(col,typ);")
sub(7113,",CX.on?1500:700)}catch(e){}}",",700)}catch(e){}}")
delete(7117,7140,pa='// ---- graphics status + motion control',sb='/*CXend*/')

out=[]
for n in range(1,N+1):
    if n in act:
        if act[n] is None: continue
        out.append(act[n])
    else: out.append(L[n-1])
res='\n'.join(out)
# sanity: no leftovers
for bad in ['mapStart','fxFly','MP.hold','CX.','L3.','FLY.','lgmap','cbars','hxChrome']:
    k=res.count(bad)
    if k: print('LEFTOVER',bad,k)
open(OUT,'w',encoding='utf-8').write(res)
print('wrote',len(res),'bytes; lines',len(out))
