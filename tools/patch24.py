p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:60],s.count(a));s=s.replace(a,b)
# recStart with track
rep("function cqRecStart(wake){const SR=cqSR();","function cqRecStart(wake,track){const SR=cqSR();")
rep("r.start();return true}catch(e){CQ.rec=null;cqSet('idle');return false}}","if(track&&SR.available){try{r.start(track)}catch(e){r.start()}}else r.start();return true}catch(e){CQ.rec=null;cqSet('idle');return false}}")
# error notes in onend
rep("r.onend=()=>{CQ.rec=null;const bad=/not-allowed|service-not-allowed/.test(CQ.recErr||'');if(wake){","r.onend=()=>{CQ.rec=null;const bad=/not-allowed|service-not-allowed/.test(CQ.recErr||'');if(!wake&&!CQ.wake)setTimeout(cqMicClose,400);cqNote(cqErrTxt(CQ.recErr,wake));if(wake){")
rep("if(q)cqAsk(q,1);else cqSet('idle')};","if(q)cqAsk(q,1);else{cqSet('idle');if(!CQ.recErr)cqNote('I did not catch anything. Check the input device and watch the level bar while you speak.')}};")
# cqMic/cqWake
a=s.index("function cqMic(){");b=s.index("async function cqAsk(")
new=r"""async function cqMic(){if(CQ.fn==null)return;if(CQ.rec&&!CQ.wakeMode){cqRecStop();const q=(CQ.final||CQ.heard||'').trim();cqSet('idle');if(!CQ.wake)cqMicClose();if(q)cqAsk(q,1);return}if(CQ.busy)return;cqShut();cqRecStop();cqNote('');const t=await cqMicOpen();cqRecStart(false,VC.pref.mic?t:null)}
async function cqWake(){if(CQ.wake){CQ.wake=0;cqRecStop();cqMicClose();cqSet('idle');cqPaint();return}CQ.wake=1;cqShut();cqRecStop();const t=await cqMicOpen();if(!cqRecStart(true,VC.pref.mic?t:null))CQ.wake=0;cqPaint()}
/* microphone: device list, selection, live level */
CQ.mic={devs:[],stream:null,ctx:null,iv:0,lv:0,cur:'',err:'',test:0};
const cqErrTxt=(e,w)=>!e?'':/not-allowed|service-not-allowed/.test(e)?'The browser blocked the microphone for this page. Click the lock or camera icon in the address bar and allow the microphone, then try again.':e==='audio-capture'?'No microphone was found. Pick one in the list below.':e==='no-speech'?'I heard silence. Check the input device below and watch the level bar while you speak.':e==='network'?'The speech service could not be reached. Check your connection.':e==='aborted'?'':'Voice input problem ('+e+').';
function cqNote(t){CQ.note=t||'';const e=document.getElementById('cqnote');if(e)e.textContent=CQ.note}
async function cqDevs(ask){try{const md=navigator.mediaDevices;if(!md||!md.enumerateDevices){CQ.mic.err='This browser cannot list microphones.';return}let l=await md.enumerateDevices();if(ask&&!l.some(d=>d.kind==='audioinput'&&d.label)){try{const s=await md.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());l=await md.enumerateDevices()}catch(e){cqNote(cqErrTxt('not-allowed'))}}
CQ.mic.devs=l.filter(d=>d.kind==='audioinput').map((d,i)=>({id:d.deviceId,label:d.label||('Microphone '+(i+1))}));if(!md.__cq){md.__cq=1;try{md.addEventListener('devicechange',()=>cqDevs(0))}catch(e){}}cqPaintMic()}catch(e){}}
function cqMicSel(){const L=CQ.mic.devs,def=L.find(d=>d.id==='default'),real=L.filter(d=>d.id!=='default'&&d.id!=='communications'),dn=def?def.label.replace(/^Default - /,''):'';
return`<select id=cqdev onchange="cqSetMic(this.value)" aria-label="Microphone"><option value="">System default (Windows)${dn?': '+esc(dn):''}</option>${real.map(d=>`<option value="${esc(d.id)}" ${VC.pref.mic===d.id?'selected':''}>${esc(d.label)}</option>`).join('')}</select>`}
function cqPaintMic(){const e=document.getElementById('cqmic');if(e)e.innerHTML=cqMicHtml()}
function cqMicHtml(){const hasLbl=CQ.mic.devs.some(d=>/[a-z]{3}/i.test(d.label)&&!/^Microphone \d+$/.test(d.label)),SR=cqSR(),hint=VC.pref.mic&&!(SR&&SR.available)?'<small class=mut>Heads up: this browser\'s speech recognition always listens with the default microphone. Your pick drives the level bar. To change what it hears, set the default input in Windows Sound settings.</small>':'';
return`<label for=cqdev style="margin:0 0 3px">INPUT DEVICE</label>${CQ.mic.devs.length?cqMicSel():'<small class=mut>Not loaded yet</small>'}<div class=cqlvw><i id=cqlv></i></div><div class=cqmb>${hasLbl?'':'<button onclick="cqDevs(1)">Allow mic and list devices</button>'}<button onclick="cqTest()">${CQ.mic.test?'Stop test':'Test mic'}</button><button onclick="cqDevs(0)" aria-label="Refresh device list">Refresh</button></div><small id=cqinfo class=mut>${CQ.mic.cur?'Hearing: '+esc(CQ.mic.cur):''}</small>${hint}`}
function cqSetMic(id){VC.pref.mic=id;try{vcPrefSave()}catch(e){}cqMicClose();if(CQ.mic.test||CQ.wake||CQ.rec){cqMicOpen()}cqPaintMic();try{if(typeof vcSetMic==='function'&&VC.on)vcSetMic(id)}catch(e){}}
async function cqMicOpen(){cqMicClose(true);const md=navigator.mediaDevices;if(!md||!md.getUserMedia){cqNote('This browser cannot open the microphone.');return null}const id=VC.pref.mic,base={echoCancellation:true,noiseSuppression:true};let s=null;
try{s=await md.getUserMedia({audio:id?Object.assign({deviceId:{exact:id}},base):base})}catch(e){if(id&&/Overconstrained|NotFound/.test(e.name||'')){VC.pref.mic='';try{vcPrefSave()}catch(x){}try{s=await md.getUserMedia({audio:base})}catch(x2){}cqNote('That microphone is not available, so I switched back to the Windows default.')}else{cqNote(cqErrTxt('not-allowed'))}}
if(!s)return null;CQ.mic.stream=s;const tr=s.getAudioTracks()[0];CQ.mic.cur=tr?tr.label:'';
try{const AC2=globalThis.AudioContext||globalThis.webkitAudioContext;CQ.mic.ctx=new AC2();const an=CQ.mic.ctx.createAnalyser();an.fftSize=512;CQ.mic.ctx.createMediaStreamSource(s).connect(an);const buf=new Uint8Array(an.fftSize);CQ.mic.iv=setInterval(()=>{an.getByteTimeDomainData(buf);let sum2=0;for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128;sum2+=v*v}const rms=Math.sqrt(sum2/buf.length),lv=Math.min(1,rms*5);CQ.mic.lv=CQ.mic.lv*.6+lv*.4;const b=document.getElementById('cqlv');if(b)b.style.width=Math.round(CQ.mic.lv*100)+'%';if(CQ.st==='listen'||CQ.mic.test)CQ.e=Math.max(CQ.e||0,CQ.mic.lv*1.3)},60)}catch(e){}
const inf=document.getElementById('cqinfo');if(inf)inf.textContent=CQ.mic.cur?'Hearing: '+CQ.mic.cur:'';if(!CQ.mic.devs.some(d=>d.label&&!/^Microphone \d+$/.test(d.label)))cqDevs(0);return tr||null}
function cqMicClose(keep){try{clearInterval(CQ.mic.iv);CQ.mic.iv=0;if(CQ.mic.stream)CQ.mic.stream.getTracks().forEach(t=>t.stop());CQ.mic.stream=null;if(CQ.mic.ctx){CQ.mic.ctx.close();CQ.mic.ctx=null}}catch(e){}CQ.mic.lv=0;const b=document.getElementById('cqlv');if(b)b.style.width='0%';if(!keep)CQ.mic.test=0}
async function cqTest(){if(CQ.mic.test){CQ.mic.test=0;if(!CQ.wake&&!CQ.rec)cqMicClose();cqPaintMic();return}CQ.mic.test=1;cqPaintMic();const t=await cqMicOpen();if(!t){CQ.mic.test=0;cqPaintMic();return}cqNote('Speak now. The bar and the orb should move with your voice.');setTimeout(()=>{if(CQ.mic.test){CQ.mic.test=0;if(!CQ.wake&&!CQ.rec)cqMicClose();cqPaintMic();cqNote('')}},8000)}
"""
s=s[:a]+new+s[b:]
# UI: add mic panel under toggles, and note line
rep("""</div></div>
<div class=cqr><div class=cqm id=cqm>""","""</div><div class=cqmc id=cqmic>${cqMicHtml()}</div></div>
<div class=cqr><div class=cqnote id=cqnote role=status>${esc(CQ.note||'')}</div><div class=cqm id=cqm>""") if False else None
open(p,'w').write(s)
