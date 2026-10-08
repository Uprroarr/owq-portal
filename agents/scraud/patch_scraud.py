"""Screen share with sound: share tab/system audio, everyone hears it, a Screen share audio slider (plus one per sharer) in the volume mixer. Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ['OWQ_BASE'];O=os.environ['OWQ_OUT']
s=open(B,encoding='utf-8').read();assert 'scrAudioHint' not in s
def rep(o,n,c=1):
    global s
    k=s.count(o);assert k==c,(k,c,o[:90]);s=s.replace(o,n)
# 1. ask for the tab / system sound too (clean, unprocessed); fall back to picture only if the browser refuses
rep("try{const s=await md.getDisplayMedia({video:{frameRate:{ideal:15,max:20}},audio:false});VC.scr=s;",
    "try{let s=null;try{s=await md.getDisplayMedia({video:{frameRate:{ideal:15,max:20}},audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},systemAudio:'include'})}catch(e1){if(e1&&e1.name==='NotAllowedError')throw e1;s=await md.getDisplayMedia({video:{frameRate:{ideal:15,max:20}},audio:false})}VC.scr=s;scrAudioHint(s);")
# 2. mixer: a Screen share audio category, and a slider for each person sharing
rep("var K='owq_snd',CATS={m:1,mu:1,fx:1,vo:1},X=window.SNDX={};\n var S={v:{m:100,mu:100,fx:100,vo:100},x:{},p:{},px:{}};",
    "var K='owq_snd',CATS={m:1,mu:1,fx:1,vo:1,ss:1},X=window.SNDX={};\n var S={v:{m:100,mu:100,fx:100,vo:100,ss:100},x:{},p:{},px:{}};")
rep("function mult(el){var k=cat(el),f=lvl('m');if(k==='mu')f*=lvl('mu');else if(k==='vo')f*=lvl('vo')*pp(el.__who||'');else f*=lvl('fx');return sq(f)}",
    "function mult(el){var k=cat(el),f=lvl('m');if(k==='mu')f*=lvl('mu');else if(k==='vo')f*=lvl('vo')*pp(el.__who||'');else if(k==='ss')f*=lvl('ss')*pp(el.__who?'scr:'+el.__who:'');else f*=lvl('fx');return sq(f)}")
rep("function voices(){try{if(typeof VC!=='object'||!VC||!VC.vid)return;Object.keys(VC.vid).forEach(function(k){if(k.indexOf('local-')===0)return;var v=VC.vid[k];if(!v)return;v.__snd='vo';var p=peerOf(k),n=p?nameOf(p):'';if(n)v.__who=n;apply(v)})}catch(e){}}",
    "function ssOf(peer){try{var a=VC.room?VC.room.peers():[];for(var i=0;i<a.length;i++)if(a[i].peer===peer)return(a[i].presence&&a[i].presence.ss)||''}catch(e){}return''}\n function voices(){try{if(typeof VC!=='object'||!VC||!VC.vid)return;Object.keys(VC.vid).forEach(function(k){if(k.indexOf('local-')===0)return;var v=VC.vid[k];if(!v)return;var p=peerOf(k),n=p?nameOf(p):'';v.__snd=p&&ssOf(p)===k?'ss':'vo';if(n)v.__who=n;apply(v)})}catch(e){}}")
rep("function people(){var out=[],seen={};try{var me=vcMe();vcList().forEach(function(p){if(p.sameTab||p.peer===me)return;var x=p.presence||{},n=String(x.nm||'').slice(0,40);if(!n||seen[n])return;seen[n]=1;out.push({n:n,sp:!!(x.sp&&!x.mu)})})}catch(e){}return out}",
    "function people(){var out=[],seen={};try{var me=vcMe();vcList().forEach(function(p){if(p.sameTab||p.peer===me)return;var x=p.presence||{},n=String(x.nm||'').slice(0,40);if(!n||seen[n])return;seen[n]=1;out.push({n:n,sp:!!(x.sp&&!x.mu),scr:!!(x.scr&&x.ss)})})}catch(e){}return out}")
rep("""function floorHtml(){var L=people();P.names=L.map(function(x){return x.n});P.sig=P.names.join('|');
  if(!L.length)return'<p class=snde>Nobody else is on the floor right now. When teammates walk on, each one gets a slider here, remembered by name.</p>';
  return L.map(function(x,i){return prow(x.n,i,x.sp)}).join('')}""",
    """function floorHtml(){var L=people(),SC=L.filter(function(x){return x.scr});P.names=L.map(function(x){return x.n}).concat(SC.map(function(x){return'scr:'+x.n}));P.sig=P.names.join('|');
  if(!L.length)return'<p class=snde>Nobody else is on the floor right now. When teammates walk on, each one gets a slider here, remembered by name.</p>';
  return L.map(function(x,i){return prow(x.n,i,x.sp)}).join('')+(SC.length?'<h5 class=sndsh>SHARED SCREENS</h5>'+SC.map(function(x,j){return prow('scr:'+x.n,L.length+j,false)}).join(''):'')}""")
# per-sharer rows show "<name>'s screen"
rep("""'</button><label class=sndl for="sndq_'+i+'">'+avh(n)+'<b>'+e+'</b><i class=snddot title="Talking"></i></label>""",
    """'</button><label class=sndl for="sndq_'+i+'">'+(n.indexOf('scr:')===0?'<span class=sndsi aria-hidden=true>&#128250;</span><b>'+E(n.slice(4))+'&rsquo;s screen</b>':avh(n)+'<b>'+e+'</b><i class=snddot title="Talking"></i>')+'</label>""")
rep("""'<div class=snds><h5>SALES FLOOR</h5>'+row('vo','All voices','Everyone you hear on the floor')+'<div id=sndfl>'""",
    """'<div class=snds><h5>SALES FLOOR</h5>'+row('vo','All voices','Everyone you hear on the floor')+row('ss','Screen share audio','Sound from screens people share to the TV')+'<div id=sndfl>'""")
rep("X.reset=function(){S={v:{m:100,mu:100,fx:100,vo:100},x:{},p:{},px:{}};","X.reset=function(){S={v:{m:100,mu:100,fx:100,vo:100,ss:100},x:{},p:{},px:{}};")
js=r'''
/*SCRAUD: screen share sound. The sharer picks a tab (with "Also share tab audio") or the whole screen (with "Also share system audio");
  the sound rides along with the picture. Screen sound never drives anyone's mouth or mood on the floor. */
function scrAudioHint(s){try{const a=s&&s.getAudioTracks?s.getAudioTracks():[];if(a.length){toast('Sharing your screen with sound. Everyone can set its volume in the volume mixer.',1)}
 else toast('Sharing without sound. To include sound, share a Chrome tab and turn on "Also share tab audio", or share your entire screen with "Also share system audio".')}catch(e){}}
(function(){const w=setInterval(()=>{if(typeof voApi==='undefined'||!voApi.audio)return;clearInterval(w);const _a=voApi.audio;
 voApi.audio=function(id){try{const x=((vcList().find(p=>p.peer===id)||{}).presence)||{},m=VC.rs[id]||{};for(const k in m){if(k===x.ss)continue;const st=m[k];if(st&&st.getAudioTracks&&st.getAudioTracks().length)return st}return null}catch(e){return _a.apply(this,arguments)}}},300)})();
'''
css=".sndsh{margin:12px 0 4px!important}.sndsi{font-size:16px;width:22px;text-align:center}\n"
a='</style><canvas id=bgc>';assert s.count(a)==1;s=s.replace(a,css+a)
assert all(ord(c)<128 for c in js)
s=s.rstrip('\n');assert s.endswith('</script>');s=s+'\n<script>\n'+js+'</script>\n'
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
