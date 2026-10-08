#!/usr/bin/env python3
"""Build the stand-alone website version of the portal (GitHub Pages + Firebase).
env: OWQ_BASE  portal build to convert (default $SP/v80-final.html)
     OWQ_SITE  output folder (default $SP/web/site)
     OWQ_CFG   Firebase web config JSON file (default $SP/web/firebase-config.json; missing -> the page shows 'setup pending')
     OWQ_TEST  '1' -> test build: loads the Firebase stand-in (web/test/fakefb-*.js) and a dummy config
Access codes are removed from the page (they live in Firestore cfg/codes, readable only after sign-in); the codes found in the
base are written to $SP/web/private/codes.json for the one-time data import (never published)."""
import os, re, json, shutil, time
STAMP=os.environ.get('OWQ_STAMP') or time.strftime('%Y-%m-%d %H:%M UTC',time.gmtime())
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
W=SP+'/web'
BASE=os.environ.get('OWQ_BASE',SP+'/v97-final.html')
TEST=os.environ.get('OWQ_TEST')=='1'
SITE=os.environ.get('OWQ_SITE',W+('/test/site' if TEST else '/site'))
CFGF=os.environ.get('OWQ_CFG',W+'/firebase-config.json')
s=open(BASE,encoding='utf-8').read()
assert '/*OWQCLOUDstart*/' not in s,'base already converted'
def rep(old,new,count=1):
    global s
    n=s.count(old); assert n==count,('anchor count',n,count,old[:70]); s=s.replace(old,new)

# 1. access codes out of the page
m=list(re.finditer(r"const PWD=\{([^}]*)\};",s)); assert len(m)==1,'PWD anchor'
codes={}
for k,v in re.findall(r"'([^']+)'\s*:\s*'([^']*)'",m[0].group(1)): codes[k]=v.lower()
os.makedirs(W+'/private',exist_ok=True)
json.dump(codes,open(W+'/private/codes.json','w'))
s=s[:m[0].start()]+"const PWD={};"+s[m[0].end():]

# 2. owner tools: sidebar button + command palette entry
rep('<button class="btn o" onclick="lockView()">Lock station</button></div></aside>',
    '<button class="btn o" onclick="lockView()">Lock station</button><button class="btn o owqtab" id=owqtab hidden onclick="OWQC.team()" style="margin-top:6px">Team access</button></div></aside>')
rep("['Lock station','System',lockView]","['Lock station','System',lockView],['Team access (owner)','System',()=>{try{OWQC.team()}catch(e){}}]")

# 2a. Sales Floor pop-out (ON HOLD: only built with OWQ_POPOUT=1): the floor window (?floor=1) skips the intro and the lobby music
POPOUT=os.environ.get('OWQ_POPOUT')=='1'
if POPOUT: rep('D.sim=0;lockView();chInit();mrInit();synInit();vcInit();','D.sim=0;if(!window.OWQ_FLOOR)lockView();chInit();mrInit();synInit();vcInit();')
if POPOUT: rep('function lobbyStart(){if(ONLINE||LB.off)return;','function lobbyStart(){if(ONLINE||LB.off||window.OWQ_FLOOR)return;')

# 2b. website-only portal fixes, appended after the app scripts (they wrap app functions)
for fx in ('vfix.js',)+(('popout.js',) if POPOUT else ()):
    code=open(W+'/src/'+fx,encoding='utf-8').read(); assert all(ord(c)<128 for c in code),fx+' must be ASCII'
    s=s+'\n<script>\n'+code+'\n</script>'

# 3. document shell: head with config + cloud adapter (must run before the app scripts)
t=re.search(r'<title>.*?</title>',s,re.S); title=t.group(0) if t else '<title>Only Winners &amp; Quitters</title>'
if t: s=s[:t.start()]+s[t.end():]
if TEST: cfg={'apiKey':'test-key','authDomain':'test.local','projectId':'owq-test','databaseURL':'https://owq-test.local','appId':'1:1:web:1'}
elif os.path.exists(CFGF): cfg=json.load(open(CFGF))
else: cfg=None
cloud=open(W+'/src/owqcloud.js',encoding='utf-8').read()
pocss=open(W+'/src/popout.css',encoding='utf-8').read() if POPOUT else ''; assert all(ord(c)<128 for c in pocss),'popout.css must be ASCII'
floorjs='' if not POPOUT else 'window.OWQ_FLOOR=/[?&]floor=1(&|$)/.test(location.search)?1:0;if(window.OWQ_FLOOR){document.documentElement.classList.add("owqfl");document.title="Sales Floor | Only Winners & Quitters"}'
assert all(ord(c)<128 for c in cloud),'adapter must be ASCII'
head=('<!doctype html><html lang="en"><head><meta charset="utf-8">'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
      '<meta name="theme-color" content="#0b0b10"><meta name="color-scheme" content="dark">'
      '<meta name="robots" content="noindex,nofollow">'
      '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png">'
      +title+
      '<script>window.OWQ_FIREBASE='+json.dumps(cfg)+';window.OWQ_WEB=1;window.OWQ_BUILD='+json.dumps(STAMP)+';'+floorjs+'</script>'+('<style>'+pocss+'</style>' if pocss else '')
      +('<script src="fakefb-client.js"></script>' if TEST else '')+
      '<script>\n'+cloud+'\n</script></head><body>')
s=head+s+'\n</body></html>\n'
os.makedirs(SITE,exist_ok=True)
open(SITE+'/index.html','w',encoding='utf-8').write(s)
open(SITE+'/.nojekyll','w').write('')
open(SITE+'/version.txt','w').write(STAMP+'\n')
man={'name':'Only Winners & Quitters','short_name':'OWQ Station','start_url':'./','scope':'./','display':'standalone','background_color':'#0b0b10','theme_color':'#0b0b10',
     'icons':[{'src':'icon-192.png','sizes':'192x192','type':'image/png'},{'src':'icon-512.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]}
json.dump(man,open(SITE+'/manifest.webmanifest','w'),indent=1)
# icons: crimson ring + core on black (brand mark)
try:
    from PIL import Image, ImageDraw
    for n in (192,512):
        im=Image.new('RGB',(n,n),(11,11,16)); d=ImageDraw.Draw(im); c=n/2
        r1=n*0.36; w=max(3,int(n*0.035))
        for a in range(0,360,24): d.arc([c-r1,c-r1,c+r1,c+r1],a,a+14,fill=(255,31,79),width=w)
        r2=n*0.17; d.ellipse([c-r2,c-r2,c+r2,c+r2],fill=(255,31,79))
        im.save(SITE+'/icon-%d.png'%n)
except Exception as e: print('icons skipped',e)
if TEST:
    for f in ('fakefb-worker.js','fakefb-client.js','keep.html'): shutil.copy(W+'/test/'+f,SITE+'/'+f)
print('wrote',SITE+'/index.html',len(s),'codes',len(codes),'test' if TEST else ('config' if cfg else 'NO CONFIG'))
