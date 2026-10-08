p='/mnt/user-data/outputs/owq-command-station-v2.html'
s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:60],s.count(a));s=s.replace(a,b)
# all devices in list
rep("const L=CQ.mic.devs,def=L.find(d=>d.id==='default'),real=L.filter(d=>d.id!=='default'&&d.id!=='communications'),dn=def?def.label.replace(/^Default - /,''):'';","const L=CQ.mic.devs,def=L.find(d=>d.id==='default'),real=L.filter(d=>d.id!=='default'),dn=def?def.label.replace(/^Default - /,''):'';")
rep("return`<select id=cqdev onchange=\"cqSetMic(this.value)\" aria-label=\"Microphone\">","return`<select id=cqdev onfocus=\"cqNeedLbl()\" onchange=\"cqSetMic(this.value)\" aria-label=\"Microphone\">")
# html for meter
a=s.index("return`<label for=cqdev style=\"margin:0 0 3px\">INPUT DEVICE</label>");b=s.index("function cqSetMic(")
newhtml=r"""return`<label for=cqdev style="margin:0 0 3px">INPUT DEVICE <span class=mut>(${CQ.mic.devs.length} found)</span></label>${CQ.mic.devs.length?cqMicSel():'<small class=mut>Not loaded yet</small>'}<div class=cqpmh><span>VOICE METER</span><b id=cqsig class="cqsig ${CQ.mic.stream?'on':''}">${CQ.mic.stream?'LISTENING, NO SOUND YET':'OFF'}</b></div><div class=cqpm id=cqpm aria-hidden=true>${'<i></i>'.repeat(24)}</div><div class=cqmb><button class=cqmon onclick="cqTest()">${CQ.mic.test?'Turn off mic meter':'Turn on mic meter'}</button>${hasLbl?'':'<button onclick="cqDevs(1)">Allow mic and list devices</button>'}<button onclick="cqDevs(0)" aria-label="Refresh device list">Refresh</button></div><small id=cqinfo class=mut>${CQ.mic.cur?'Hearing: '+esc(CQ.mic.cur):'Turn on the meter, then speak. The bars should jump.'}</small>${hint}`}
function cqNeedLbl(){if(!CQ.mic.devs.some(d=>d.label&&!/^Microphone \d+$/.test(d.label)))cqDevs(1)}
"""
s=s[:a]+newhtml+s[b:]
# interval: spectrum bars + signal chip
old="CQ.mic.iv=setInterval(()=>{an.getByteTimeDomainData(buf);"
assert s.count(old)==1
s=s.replace(old,"const fb=new Uint8Array(an.frequencyBinCount);CQ.mic.t0=Date.now();CQ.mic.heard=0;CQ.mic.iv=setInterval(()=>{if(!document.getElementById('cqpm')&&!CQ.wake&&!CQ.rec){cqMicClose();return}an.getByteFrequencyData(fb);const bs=document.querySelectorAll('#cqpm i');bs.forEach((el,k)=>{const lo=2+k*2,v=(fb[lo]+fb[lo+1]+fb[lo+2])/3/255;el.style.height=Math.max(8,Math.round(v*100))+'%';el.className=v>.28?'hot':v>.1?'mid':''});an.getByteTimeDomainData(buf);")
old2="CQ.mic.lv=CQ.mic.lv*.6+lv*.4;const b=document.getElementById('cqlv');if(b)b.style.width=Math.round(CQ.mic.lv*100)+'%';"
assert s.count(old2)==1
s=s.replace(old2,"CQ.mic.lv=CQ.mic.lv*.6+lv*.4;if(CQ.mic.lv>.07){CQ.mic.heard=1;CQ.mic.lastv=Date.now()}const sg=document.getElementById('cqsig');if(sg){const hot=Date.now()-(CQ.mic.lastv||0)<700;sg.textContent=hot?'VOICE DETECTED':(!CQ.mic.heard&&Date.now()-CQ.mic.t0>4000)?'NO SOUND FROM THIS INPUT':'LISTENING, NO SOUND YET';sg.className='cqsig on'+(hot?' hot':(!CQ.mic.heard&&Date.now()-CQ.mic.t0>4000)?' bad':'')}")
# close: reset bars
rep("CQ.mic.lv=0;const b=document.getElementById('cqlv');if(b)b.style.width='0%';if(!keep)CQ.mic.test=0}","CQ.mic.lv=0;document.querySelectorAll('#cqpm i').forEach(el=>{el.style.height='8%';el.className=''});const sg=document.getElementById('cqsig');if(sg&&!keep){sg.textContent='OFF';sg.className='cqsig'}if(!keep)CQ.mic.test=0}")
# test persistent
a=s.index("async function cqTest(){");b=s.index("/* the orb */")
s=s[:a]+"""async function cqTest(){if(CQ.mic.test){CQ.mic.test=0;if(!CQ.wake&&!CQ.rec)cqMicClose();cqPaintMic();cqNote('');return}CQ.mic.test=1;cqPaintMic();const t=await cqMicOpen();if(!t){CQ.mic.test=0;cqPaintMic();return}cqPaintMic();cqNote('Speak now. The meter, the bars and the orb should move with your voice.')}
"""+s[b:]
s=s.replace("</style>",""".cqpmh{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:10px;letter-spacing:2px;color:var(--mut)}.cqsig{font-size:10px;letter-spacing:1px;padding:3px 7px;border:1px solid var(--ln);color:var(--mut)}.cqsig.on{color:#ffb020;border-color:#ffb02080}.cqsig.hot{color:#06140d;background:var(--ok);border-color:var(--ok);box-shadow:0 0 14px #3ddc9780}.cqsig.bad{color:#fff;background:#b3123a;border-color:var(--red)}
.cqpm{display:flex;align-items:flex-end;gap:2px;height:46px;margin:6px 0;padding:3px;background:#0b0b10;border:1px solid var(--ln)}.cqpm i{flex:1;height:8%;background:#5a1424;transition:height .06s}.cqpm i.mid{background:var(--red)}.cqpm i.hot{background:var(--ok);box-shadow:0 0 8px #3ddc9780}
.cqmon{background:var(--red)!important;color:#fff!important;border-color:var(--red)!important}
</style>""",1)
open(p,'w').write(s)
