#!/usr/bin/env python3
"""crm builder: turn the Clients section into a CRM (Phase A). Exact, count-asserted replacements on the base portal.
Usage: OWQ_BASE=<base.html> OWQ_OUT=<out.html> python3 patch_crm.py   (defaults: $SP/v76-final.html -> agents/crm/out/portal.html)"""
import os,json
HERE=os.path.dirname(os.path.abspath(__file__))
SP=os.path.abspath(os.path.join(HERE,'..','..'))
BASE=os.environ.get('OWQ_BASE',os.path.join(SP,'v76-final.html'))
OUT=os.environ.get('OWQ_OUT',os.path.join(HERE,'out','portal.html'))
s=open(BASE,encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    n=s.count(old)
    assert n==cnt,'expected %d match(es) but found %d for: %s'%(cnt,n,old[:90])
    s=s.replace(old,new)
rd=lambda f:open(os.path.join(HERE,'src',f),encoding='utf-8').read()
css=rd('crm.css');js=rd('crm_data.js')+rd('crm_ui.js')
mod='const CRM_CSS='+json.dumps(css)+';\n'+js
assert all(ord(c)<128 for c in mod),'module must stay ASCII (the page has no charset meta when opened from a file)'
assert '/*CRMstart*/' not in s,'base already contains the CRM module'
# 1) module: right before the old client list helper (inside the Clients area)
rep("function clist(){",mod+"\nfunction clist(){")
# 2) legacy shim: every MYCL() consumer reads CRM data
rep("function MYCL(){return WHO==='Agency Owner'||WHO==='Cole Leckey'?D.clients:D.clients.filter(c=>c.ag===WHO)}",
    "function MYCL(){if(crmOn())return crmMy();return WHO==='Agency Owner'||WHO==='Cole Leckey'?D.clients:D.clients.filter(c=>c.ag===WHO)}")
# 3) the Clients view
rep("function cli(){return SUB['Clients']==='Message Builder'?msgBuilder():cliBook()}",
    "function cli(){if(crmOn())return crmView();return SUB['Clients']==='Message Builder'?msgBuilder():cliBook()}")
rep("return hd('Clients','Pick a client and get a ready-to-send policy message.',[['+ Add Client',\"openM('C')\"]])+seg('Clients',['Client Book','Message Builder'])+",
    "return (crmOn()?crmHead('Message Builder'):hd('Clients','Pick a client and get a ready-to-send policy message.',[['+ Add Client',\"openM('C')\"]])+seg('Clients',['Client Book','Message Builder']))+")
# 4) old write paths -> CRM API (originals kept for the kill switch)
rep("const clearFu=id=>{MYCL()","const clearFu=id=>{if(crmOn())return crmClearFu(id);MYCL()")
rep("function mbEnsurePin(c){","function mbEnsurePin(c){if(crmOn())return crmMbPin(c,0);")
rep("function mbNewPin(){","function mbNewPin(){if(crmOn())return crmMbPin(mbClient(),1);")
rep("function mbSet(k,v){","function mbSet(k,v){if(crmOn())return crmMbSet(k,v);")
rep("function mbLog(){","function mbLog(){if(crmOn())return crmMbLog();")
rep("function saveC(id){","function saveC(id){if(crmOn())return crmSaveC(id);")
rep("function addN(id){","function addN(id){if(crmOn())return crmAddN(id);")
rep("const setSt=(id,v)=>{MYCL()","const setSt=(id,v)=>{if(crmOn())return crmSetSt(id,v);MYCL()")
rep("delN=(id,i)=>{MYCL()","delN=(id,i)=>{if(crmOn())return crmDelN(id,i);MYCL()")
rep("delC=id=>ask('Delete this client and all notes?',","delC=id=>crmOn()?crmDelC(id):ask('Delete this client and all notes?',")
rep("function ciSet(id,k,v){","function ciSet(id,k,v){if(crmOn())return crmCiSet(id,k,v);")
# 5) simulated inbound lead + demo seeders
rep("else if(kind==='lead'){","else if(kind==='lead'&&crmOn()){crmSimLead()}else if(kind==='lead'){")
rep("D.goal=60000;D.hT=60;D.lT=1000;D.seeded=1;D.sim=1;D.alerts=[];D.aid=0;save()}",
    "D.goal=60000;D.hT=60;D.lT=1000;D.seeded=1;D.sim=1;D.alerts=[];D.aid=0;save();if(crmOn())crmSeedLegacy(D.clients,1)}")
rep("Follow up Friday.'}]});\nsave();closeM();go()}","Follow up Friday.'}]});\nif(crmOn())crmSeedLegacy(D.clients,1);save();closeM();go()}")
# 6) Ctrl-K palette entries and alert scan hook
rep("MYCL().forEach(c=>L.push(['Client: '+c.name,c.st,","crmCmds(L);MYCL().forEach(c=>L.push(['Client: '+c.name,c.st,")
rep("chSync().forEach(a=>out.push(a));ckScan().forEach(a=>out.push(a));","chSync().forEach(a=>out.push(a));ckScan().forEach(a=>out.push(a));crmScan().forEach(a=>out.push(a));")
os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,'w',encoding='utf-8').write(s)
print('wrote',OUT,len(s))
