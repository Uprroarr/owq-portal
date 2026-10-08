import base64
p='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(p).read()
uri='data:audio/mpeg;base64,'+base64.b64encode(open('clip_austin.mp3','rb').read()).decode()
a="const SONGS={'Cole Leckey':SONGCOLE,'Agency Owner':SONGCOLE},YTV={};"
assert a in h
h=h.replace(a,"const SONGAUS='"+uri+"';\nconst SONGS={'Cole Leckey':SONGCOLE,'Agency Owner':SONGCOLE,'Austin Vardzel':SONGAUS},YTV={};")
bk="""const BK={on:0,t:0};
function bkLoop(){if(!BK.on||ONLINE)return;clearTimeout(BK.t);try{const s=globalThis.speechSynthesis;if(!s||typeof SpeechSynthesisUtterance==='undefined'){BK.on=0;return}const u=new SpeechSynthesisUtterance('broke-ee'),nx=()=>{clearTimeout(BK.t);BK.t=setTimeout(bkLoop,1600)};u.volume=.1;u.rate=.6;u.pitch=.2;const vs=s.getVoices?s.getVoices():[],v=vs.find(x=>/^en/i.test(x.lang));if(v)u.voice=v;u.onend=nx;u.onerror=nx;s.speak(u);BK.t=setTimeout(nx,5000)}catch(e){BK.on=0}}
function bkStart(){if(BK.on||ONLINE)return;BK.on=1;bkLoop()}
function bkStop(){BK.on=0;clearTimeout(BK.t);try{globalThis.speechSynthesis&&speechSynthesis.cancel()}catch(e){}}
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{if(!ONLINE)bkStart()},{passive:true}));
setTimeout(()=>{if(!ONLINE)bkStart()},600);
"""
h=h.replace("const BST=[",bk+"const BST=[",1)
b="function fxLogin(){let done=0;"
assert b in h
h=h.replace(b,"function fxLogin(){let done=0;bkStop();",1)
open(p,'w').write(h)
