#!/usr/bin/env python3
"""Splice the login-globe sources into a portal build (engine, UI, css, textures).
   env: OWQ_BASE  (default $SP/v75-final.html)   OWQ_OUT (default $SP/agents/intro/out/portal.html)   GX_DIR (default $SP/agents/intro/gx)
   Files read from GX_DIR: gx_engine.js, gx_ui.js, gx.css (use __POSTER__ where the poster data URI goes), lights.jpg, pack.jpg, poster_idle.jpg
   Self-test: with the sources copied from $SP/gx (unchanged) the output is byte-identical to v75-final.html."""
import os,sys,base64
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
BASE=os.environ.get('OWQ_BASE',SP+'/v75-final.html')
OUT=os.environ.get('OWQ_OUT',SP+'/agents/intro/out/portal.html')
GXD=os.environ.get('GX_DIR',SP+'/agents/intro/gx')
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
def esc(t):
    o=[]
    for ch in t:
        c=ord(ch)
        if c<128:o.append(ch)
        elif c<0x10000:o.append('\\u%04x'%c)
        else:
            c-=0x10000;o.append('\\u%04x\\u%04x'%(0xd800+(c>>10),0xdc00+(c&0x3ff)))
    return ''.join(o)
L=open(BASE,encoding='utf-8').read().split('\n')
def idx(pred,start=0,what=''):
    for i in range(start,len(L)):
        if pred(L[i]):return i
    raise SystemExit('anchor not found: '+what)
engine=open(GXD+'/gx_engine.js',encoding='utf-8').read().rstrip('\n')
ui=esc(open(GXD+'/gx_ui.js',encoding='utf-8').read()).rstrip('\n')
css=open(GXD+'/gx.css',encoding='utf-8').read().rstrip('\n').replace('__POSTER__','data:image/jpeg;base64,'+b64(GXD+'/poster_idle.jpg'))
tx="const GXTX={lights:'data:image/jpeg;base64,%s',pack:'data:image/jpeg;base64,%s'};"%(b64(GXD+'/lights.jpg'),b64(GXD+'/pack.jpg'))
# --- css block
c0=idx(lambda l:l=='/*GXcss*/',0,'/*GXcss*/');c1=idx(lambda l:l=='/*GXcssend*/',c0,'/*GXcssend*/')
L[c0:c1+1]=css.split('\n')
# --- ui block (do before engine so indexes stay simple): header comment .. end of the GXU iife
u0=idx(lambda l:l.startswith('/* ===== GX UI'),0,'GX UI header');u1=idx(lambda l:l=='})();',u0,'end of GXU')
L[u0:u1+1]=ui.split('\n')
# --- textures
t0=idx(lambda l:l.startswith('const GXTX='),0,'GXTX');L[t0]=tx
# --- engine: everything between /*GXstart*/ and the GXTX line (keeps one blank line before GXTX like the original)
s0=idx(lambda l:l=='/*GXstart*/',0,'/*GXstart*/');t0=idx(lambda l:l.startswith('const GXTX='),s0,'GXTX')
L[s0+1:t0]=engine.split('\n')+['']
os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,'w',encoding='utf-8').write('\n'.join(L))
print('wrote',OUT,sum(len(x)+1 for x in L))
