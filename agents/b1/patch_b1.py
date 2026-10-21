"""v117 batch 1: quiet alerts (#3), sync re-render patches the page in place (#11), annualized vs issued premium labels (#12),
inline access code under the picked name with no camera flight (#16), plain fade into the portal instead of the black hole (#1 part),
late-to-the-Sales-Floor popup once a day (#21). App icon (#22) is in web/build_web.py."""
import os
SP = '/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get('OWQ_BASE', SP + '/v116-final.html')
OUT = os.environ.get('OWQ_OUT', SP + '/v117-final.html')
s = open(BASE, encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, count, old[:90]); s = s.replace(old, new)
assert '/*B1start*/' not in s, 'already patched'
js = open(os.path.join(HERE, 'b1.js'), encoding='utf8').read(); css = open(os.path.join(HERE, 'b1.css'), encoding='utf8').read()
assert all(ord(c) < 128 for c in js + css)
# module at the very end of the app (every function and const already exists), css with the first stylesheet
i = s.rfind('</script>'); s = s[:i] + js + '\n' + s[i:]
i = s.find('</style>'); s = s[:i] + css + s[i:]
# 3. alerts: the voice reads only what alSpeakOk allows
rep("if(typeof ONLINE!=='undefined'&&ONLINE)setTimeout(()=>alertSay(String(al.t||'')+(al.m?'. '+String(al.m):'')),700)}catch(e){}}",
    "if(typeof ONLINE!=='undefined'&&ONLINE&&(typeof alSpeakOk!=='function'||alSpeakOk(al)))setTimeout(()=>alertSay(String(al.t||'')+(al.m?'. '+String(al.m):'')),700)}catch(e){}}")
# 11. go() writes the page through owqSetMain (morph when it is a quiet sync refresh)
rep("document.getElementById('main').innerHTML=tick2()+views[tab][0]()+'<p class=note>", "owqSetMain(tick2()+views[tab][0]()+'<p class=note>")
rep("Use Settings to back it up.</p>';anim();hudRender();", "Use Settings to back it up.</p>');anim();hudRender();")
# 12. premium labels: submitted business is Annualized Premium (AP), issued is Issued Premium
rep("kpi('Annualized Premium',cu(s.sub,'$')", "kpi('Annualized Premium (Submitted AP)',cu(s.sub,'$')")
rep("kpi('Submitted, Not Issued',", "kpi('Submitted AP, Not Issued',")
rep("<th class=n>Submitted, not issued", "<th class=n>Submitted AP, not issued")
rep("apxTile('Submitted',cu(c.sub,'$')", "apxTile('Annualized Premium (Submitted)',cu(c.sub,'$')")
rep("<h4>Submitted vs. Issued<", "<h4>Submitted AP vs. Issued Premium<")
rep("x.ap))} Submitted Premium", "x.ap))} Submitted AP")
rep("in submitted premium", "in submitted AP")
open(OUT + '.tmp', 'w', encoding='utf8').write(s)
# 16 + black hole: inside the login controller
rep("function pick(name){if(U.st!=='menu'||U.busy||!name)return;U.busy=1;U.altOn=0;LG=name;const c=U.city=nextCity();sfx('sel');",
    r"""function pick(name){if((U.st!=='menu'&&!(U.st==='land'&&U.inl))||U.busy||!name)return;if(U.inl&&LG===name){const q=$g('lgi');if(q)try{q.focus()}catch(e){}return}
 LG=name;U.city=nextCity();sfx('sel');U.inl=1;setSt('land');hud('');const L=$g('login');if(L)L.classList.add('gxinl');const A=$g('gxa');if(A)A.innerHTML='';
 const list=$g('gxlist');if(!list)return;list.querySelectorAll('.gxin').forEach(x=>x.remove());const b=list.querySelector('.gxo[data-i="'+U.names.indexOf(name)+'"]');if(!b)return;
 const w=document.createElement('div');w.className='gxin';w.innerHTML='<form onsubmit="event.preventDefault();doLogin()"><input id=lgi type=password placeholder="ACCESS CODE" autocomplete=off aria-label="Access code for '+esc(name)+'"><button type=submit>Enter</button></form><p>'+(PWD[name]?'Not case sensitive. Esc to go back.':'No code set yet: any word works for now.')+'</p>';
 b.after(w);requestAnimationFrame(()=>{w.classList.add('on');const q=$g('lgi');if(q)try{q.focus({preventScroll:true})}catch(e){}});
 const q=$g('lgi');if(q)q.onkeydown=ev=>{if(ev.key==='Escape'){ev.preventDefault();back()}};return;
 const c=U.city;""")
rep("function back(){if(U.st!=='land')return;LG=null;", "function back(){if(U.st!=='land')return;if(U.inl){U.inl=0;LG=null;const L=$g('login');if(L)L.classList.remove('gxinl');const list=$g('gxlist');if(list)list.querySelectorAll('.gxin').forEach(x=>x.remove());setSt('menu');sync();return}LG=null;")
rep("function showMenu(){clearLater();U.pinOn=0;U.busy=0;", "function showMenu(){clearLater();U.pinOn=0;U.busy=0;U.inl=0;{const L=$g('login');if(L)L.classList.remove('gxinl')}")
# no black hole: always the short plain transition into the portal
rep(" if(U.gl&&!isStill()){sfx('grant');later(()=>sfx('launch'),150);", " if(false){sfx('grant');later(()=>sfx('launch'),150);")
rep(" else{sfx('grant');/*GXSstart*/gxsIris(fl,reduced);/*GXSend*/setTimeout(done,/*GXSstart*/reduced?460:/*GXSend*/380)}}",
    " else{sfx('grant');if(fl){fl.style.transition='none';fl.style.background='#0b0b10';fl.style.opacity='0';void fl.offsetWidth;fl.style.transition='opacity .32s ease-in';fl.style.opacity='1';setTimeout(()=>{fl.style.background=''},1500)}setTimeout(done,340)}}")
os.remove(OUT + '.tmp')
open(OUT, 'w', encoding='utf8').write(s); print('wrote', OUT, len(s))
