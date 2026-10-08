#!/usr/bin/env python3
"""Assemble the portal with Morning Recognition. Base = v72-base.html (published v72)."""
import os,sys,datetime
SP=os.path.dirname(os.path.abspath(__file__))
BASE=os.environ.get('OWQ_BASE',os.path.join(SP,'v72-base.html'))
OUT=os.environ.get('OWQ_OUT','/mnt/user-data/outputs/owq-command-station-v2.html')
SINCE=os.environ.get('MR_SINCE',datetime.date.today().isoformat())
s=open(BASE,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt,'expected %d match(es) but found %d for: %s'%(cnt,n,old[:90])
    s=s.replace(old,new)
rd=lambda f:open(os.path.join(SP,'mr',f),encoding='utf-8').read()
# 1) styles
rep('</style><canvas id=bgc>',rd('mr.css')+'\n</style><canvas id=bgc>')
# 2) module (after the chat attachment helpers, before the page helpers)
js=(rd('mr1.js')+rd('mr0.js')+rd('mr2.js')+rd('mr3.js')).replace('__MRSINCE__',SINCE)
assert '__MRSINCE__' not in js
css=rd('mr.css')
assert all(ord(c)<128 for c in js+css),'module must stay ASCII (the page has no charset meta when opened from a file)'
rep("const kpi=(l,v,s='')=>",js+"\nconst kpi=(l,v,s='')=>")
# 3) navigation: new TEAM item right after Team Chat, with its badge
rep("'Team Chat':[chat,'&#9993;','TEAM','Group chat for agents'],",
    "'Team Chat':[chat,'&#9993;','TEAM','Group chat for agents'],'Morning Recognition':[mrPage,'&#9728;','TEAM','Daily goals and quote, pinned for all'],")
rep("${k==='Team Chat'?chBadge():k==='Check-In'?ckBadge():''}",
    "${k==='Team Chat'?chBadge():k==='Morning Recognition'?mrBadge():k==='Check-In'?ckBadge():''}")
# 4) after the page renders; background refresh must not wipe a reply being typed
rep("hudRender();if(tab==='Team Chat')chScroll()}","hudRender();if(tab==='Team Chat')chScroll();if(tab==='Morning Recognition')mrAfter()}")
rep("function refreshQuiet(){if(!ONLINE)return;","function refreshQuiet(){if(!ONLINE)return;try{if(MR.ready)mrHitCheck()}catch(e){}if(tab==='Morning Recognition'){try{mrRefresh()}catch(e){}return}")
# 5) start the live connection with the others, and the reminders at login
rep("D.sim=0;lockView();chInit();synInit();vcInit();","D.sim=0;lockView();chInit();mrInit();synInit();vcInit();")
rep("railInit();chInit();acIn();go();","railInit();chInit();mrInit();acIn();go();mrLogin();")
# 6) Command Deck: banner for the person on duty and a card for everyone
rep("${WHO==='Agency Owner'?cqHtml():''}<div class=deck>","${WHO==='Agency Owner'?cqHtml():''}${mrBanner()}<div class=deck>")
rep("${chDeck()}\n</div>`}","${mrDeck()}${chDeck()}\n</div>`}")
# 7) Team Chat: the pinned strip between the channel header and the messages
rep("</span></div><div class=chl id=chl role=log aria-live=polite>${chMsgs()}</div>","</span></div>${mrStrip()}<div class=chl id=chl role=log aria-live=polite>${chMsgs()}</div>")
open(OUT,'w',encoding='utf-8').write(s)
print('wrote',OUT,len(s),'since',SINCE)
