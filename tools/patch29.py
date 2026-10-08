p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p,encoding='utf-8').read()
ask=open('ask2.js',encoding='utf-8').read().split('\n')
blk='\n'.join(ask[63:72])  # cqAsk..cqClear
assert blk.startswith('async function cqAsk') and 'function cqClear' in blk
if 'async function cqAsk' not in s:
    s=s.replace('/* the orb */','/* ask / stop / clear (restored) */\n'+blk+'\n/* the orb */',1) if '/* the orb */' in s else s.replace('function cqKick(){',blk+'\nfunction cqKick(){',1)
# voice pref
s=s.replace("let CQP={vo:1,min:1};try{const x=JSON.parse(localStorage.getItem('owq_cq')||'{}');if(x.vo===0)CQP.vo=0;if(x.min===0)CQP.min=0}catch(e){}","let CQP={vo:1,min:1,vn:''};try{const x=JSON.parse(localStorage.getItem('owq_cq')||'{}');if(x.vo===0)CQP.vo=0;if(x.min===0)CQP.min=0;if(x.vn)CQP.vn=String(x.vn)}catch(e){}",1)
s=s.replace("localStorage.setItem('owq_cq',JSON.stringify({vo:CQP.vo,min:CQP.min}))","localStorage.setItem('owq_cq',JSON.stringify({vo:CQP.vo,min:CQP.min,vn:CQP.vn}))",1)
s=s.replace("v=vs.find(x=>/en-GB/i.test(x.lang)&&/male|daniel","v=(CQP.vn&&vs.find(x=>x.name===CQP.vn))||vs.find(x=>/en-GB/i.test(x.lang)&&/male|daniel",1)
out='''/* voice output: picker + test */
function cqOutHtml(){let vs=[];try{vs=(globalThis.speechSynthesis&&speechSynthesis.getVoices?speechSynthesis.getVoices():[]).filter(v=>/^en/i.test(v.lang))}catch(e){}
 if(!globalThis.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined')return'<label style="margin:0 0 3px">VOICE OUTPUT</label><small class=mut>This browser has no speech voices, so replies show as text only.</small>';
 return`<label for=cqvn style="margin:0 0 3px">VOICE OUTPUT</label><select id=cqvn onchange="cqVoicePick(this.value)" aria-label="Voice"><option value="">Auto (best English voice)</option>${vs.map(v=>`<option value="${esc(v.name)}" ${CQP.vn===v.name?'selected':''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}</select><div class=cqmb><button onclick="cqVoiceTest()">Test voice</button></div><small class=mut>Voice plays through your computer's default speakers or headphones. Change the output in your system sound settings (the browser cannot pick a speaker for speech).</small>`}
function cqVoicePick(n){CQP.vn=n||'';cqSave()}
function cqVoiceTest(){const o=CQP.vo;CQP.vo=1;const ok=cqSay('At your service. J.A.R.V.I.S. voice check. If you can hear this, output is working.');CQP.vo=o;if(!ok)cqNote('No voice available in this browser. Replies will show as text.');else cqNote('Playing a test line. If you hear nothing, check your system volume and default output device.')}
try{if(globalThis.speechSynthesis)speechSynthesis.addEventListener('voiceschanged',()=>{const e=document.getElementById('cqout');if(e&&document.activeElement!==document.getElementById('cqvn'))e.innerHTML=cqOutHtml()})}catch(e){}
'''
if 'function cqOutHtml' not in s:
    s=s.replace('function cqKick(){',out+'function cqKick(){',1)
    s=s.replace("${mic?`<div class=cqmc id=cqmic>${cqMicHtml()}</div>`:''}</div>","${mic?`<div class=cqmc id=cqmic>${cqMicHtml()}</div>`:''}<div class=cqmc id=cqout>${cqOutHtml()}</div></div>",1)
open(p,'w',encoding='utf-8').write(s)
print(s.count('async function cqAsk'),s.count('id=cqout'),s.count('function cqStop'))
