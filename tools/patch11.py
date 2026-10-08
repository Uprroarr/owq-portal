p='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(p).read()
fx=r"""let FXC=null,FXI=0;
function fxCtx(){try{FXC=FXC||new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(FXC.state==='suspended')FXC.resume();return FXC}catch(e){return null}}
function fxHit(c,t,f0,dur,vol){const o=c.createOscillator(),g=c.createGain(),l=c.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(28,f0/2),t+dur);l.type='lowpass';l.frequency.value=420;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(l);l.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.05)}
function fxRise(c,t,dur,vol){const o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),l=c.createBiquadFilter();o.type='sawtooth';o2.type='square';o.frequency.setValueAtTime(55,t);o.frequency.exponentialRampToValueAtTime(440,t+dur);o2.frequency.setValueAtTime(55.6,t);o2.frequency.exponentialRampToValueAtTime(443,t+dur);l.type='lowpass';l.frequency.setValueAtTime(200,t);l.frequency.exponentialRampToValueAtTime(5000,t+dur);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(vol,t+dur*.9);g.gain.exponentialRampToValueAtTime(.001,t+dur+.08);o.connect(l);o2.connect(l);l.connect(g);g.connect(c.destination);o.start(t);o2.start(t);o.stop(t+dur+.1);o2.stop(t+dur+.1)}
function fxIntro(){if(FXI)return;const c=fxCtx();if(!c)return;FXI=1;const t=c.currentTime+.05;fxRise(c,t,1.6,.12);fxHit(c,t+1.6,110,1.4,.5);fxHit(c,t+1.6,55,1.6,.6)}
function fxSay(txt){try{const s=globalThis.speechSynthesis;if(!s||typeof SpeechSynthesisUtterance==='undefined')return;s.cancel();const u=new SpeechSynthesisUtterance(txt),vs=s.getVoices?s.getVoices():[],v=vs.find(x=>/en/i.test(x.lang)&&/(google|microsoft|daniel|alex|male|david|guy)/i.test(x.name))||vs.find(x=>/^en/i.test(x.lang));if(v)u.voice=v;u.rate=.82;u.pitch=.35;u.volume=1;s.speak(u)}catch(e){}}
function fxLogin(){const c=fxCtx();if(c){const t=c.currentTime+.02;fxRise(c,t,.7,.1);fxHit(c,t+.7,98,1.2,.5);fxHit(c,t+.7,49,1.4,.55)}setTimeout(()=>fxSay('Financial Freedom Loading'),900)}
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{if(typeof ONLINE!=='undefined'&&!ONLINE)fxIntro()},{once:false,passive:true}));
"""
a="const PWD={"
assert a in h
h=h.replace(a,fx+a,1)
b="i.classList.add('shake');setTimeout(()=>i.classList.remove('shake'),500);return}"+"\nFXPLACEHOLDER"
# hook after password check
c="setTimeout(()=>i.classList.remove('shake'),500);return}"
k=h.index("function doLogin()")
j=h.index(c,h.index("PWD[LG]&&v.toLowerCase()",k))+len(c)
h=h[:j]+"fxLogin();"+h[j:]
open(p,'w').write(h)
