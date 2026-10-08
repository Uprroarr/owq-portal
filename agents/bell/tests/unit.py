"""Unit-ish checks of the quick view's pure helpers inside the real page (page.evaluate): link detection, badge arithmetic
with alert/message dedup, keyed reconciliation (reuses nodes, reorders, removes), window geometry clamp + corner snap, mention matching."""
import sys,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import qvt
from playwright.sync_api import sync_playwright
R=[];errs=[]
def ok(name,cond,info=''):
    R.append((name,bool(cond)));print(('PASS ' if cond else 'FAIL ')+name+(' | '+str(info)[:300] if info else ''),flush=True)
with sync_playwright() as p:
    b=qvt.launch(p);ctx=qvt.context(b,1366,860);pg=qvt.page(ctx,errs)
    qvt.open_login(pg,'file://'+qvt.BUILD,6)
    E=pg.evaluate
    ok('link: URL with query, trailing period stays outside',E("qvLink(esc('see https://x.example.com/a?b=1&c=2. ok'))")=='see <a href="https://x.example.com/a?b=1&amp;c=2" target=_blank rel="noopener noreferrer">https://x.example.com/a?b=1&amp;c=2</a>. ok')
    ok('link: stops at an escaped quote',E("qvLink(esc('\"https://x.example.com\"'))")=='&quot;<a href="https://x.example.com" target=_blank rel="noopener noreferrer">https://x.example.com</a>&quot;')
    ok('link: no javascript: or bare words',E("qvLink(esc('javascript:alert(1) and www.example.com'))")=='javascript:alert(1) and www.example.com')
    ok('link: markup in text cannot break out',E("qvLink(chTxt('<img src=x onerror=alert(1)> https://a.example.com/<b>'))").count('<img')==0)
    ok('mention: whole first name only',E("[qvMent({text:'@Agency please'}),qvMent({text:'@AgencyX nope'}),qvMent({text:'email agency@x'}),qvMent({text:'hey @agency'})]")==[True,False,False,True])
    c0=E("qvCounts()")
    E("""(()=>{const m=chIn('General').filter(x=>x.who!==WHO&&x.at>((D.chatSeen||{}).General||0))[0];pushAlert({sev:'info',t:'Team Chat: '+m.who,m:'#General: '+m.text,go:['Team Chat'],k:'cm-'+m.id},true)})()""")
    c1=E("qvCounts()")
    ok('bell dedup: a chat alert for an unread message counts once',c1['al']==c0['al']+1 and c1['ch']==c0['ch'] and c1['bell']==c0['bell'],(c0,c1))
    E("AL()[0].rd=1")
    c2=E("qvCounts()")
    ok('bell dedup: reading the alert leaves the unread message counted',c2['bell']==c0['bell'] and c2['al']==c0['al'],(c0,c2))
    k=E("""(()=>{const box=document.createElement('div');const it=(k,s)=>({k,s,h:'<p>'+k+s+'</p>'});qvKeyed(box,[it('a',1),it('b',1),it('c',1)]);const [a,b2,c]=box.children;
      qvKeyed(box,[it('b',1),it('c',2),it('d',1)]);const r=[box.children.length,box.children[0]===b2,box.children[1]!==c,box.children[1].textContent,box.children[2].textContent,a.isConnected];
      box.appendChild(document.createElement('i'));qvKeyed(box,[it('b',1)]);r.push(box.children.length,box.children[0]===b2);return r})()""")
    ok('keyed: reuses unchanged nodes, replaces changed, drops removed and strays',k==[3,True,True,'c2','d1',False,1,True],k)
    g=E("""(()=>{const s=JSON.stringify(QV.fl),out=[];QV.fl.x=99999;QV.fl.y=3;QV.fl.w=50;QV.fl.h=99999;let q=qvGeo();out.push([q.x,q.y,q.w,q.h]);
      QV.fl.w=380;QV.fl.h=420;QV.fl.x=innerWidth-380-30;QV.fl.y=innerHeight-420-20;qvSnap();out.push([QV.fl.x,QV.fl.y]);QV.fl.x=200;QV.fl.y=200;QV.fl.w=380;QV.fl.h=420;qvSnap();out.push([QV.fl.x,QV.fl.y]);QV.fl=JSON.parse(s);return [out,innerWidth,innerHeight]})()""")
    (o,W,H)=g
    ok('geometry: clamped to the viewport with min size',o[0]==[W-300-8,8,300,H-16],o)
    ok('geometry: snaps to the nearest corner when dropped near it',o[1]==[W-380-16,H-420-16],o)
    ok('geometry: no snap in the middle',o[2]==[200,200],o)
    ok('no page errors',not errs,errs[:5])
    b.close()
n=sum(1 for _,c in R if c);print('RESULT %d/%d passed'%(n,len(R)))
sys.exit(0 if n==len(R) else 1)
