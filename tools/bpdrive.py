"""Helpers that drive a Blueprint section through the real DOM (clicks, selects) the way a learner would."""
import re,json,time
def mod(pg,key):
    return pg.evaluate("(k)=>{const m=LNM.find(x=>x.id==='bp-'+k);return m&&m.bp?{id:m.id,wo:m.wo,n:m.slides.length,pages:m.bp.pages.length,guide:m.bp.guide.map(g=>g.b.map(b=>({k:b.k,type:b.type||null,req:!!b.req,n:(b.items||b.pairs||b.blanks||b.o||[]).length}))),quiz:m.bp.quiz.length}:null}",key)
def data(pg,key):
    return pg.evaluate("(k)=>LNM.find(x=>x.id==='bp-'+k).bp",key)
def wrong_first(pg,cpid,b,k):
    """one deliberately wrong attempt; returns True if the UI showed the 'Not quite' feedback"""
    t=b['type']
    if t=='pick':
        bad=[i for i in range(len(b['o'])) if i!=b['a']][0]
        pg.click(f"#{cpid} button[onclick=\"lnPick('{k}',{bad})\"]")
    elif t=='multi':
        bad=[i for i in range(len(b['o'])) if i not in b['a']]
        if not bad: return None
        pg.click(f"#{cpid} button[onclick=\"lnMultiT('{k}',{bad[0]})\"]")
        pg.click(f"#{cpid} button[onclick=\"lnMultiGo('{k}')\"]")
    elif t=='order':
        n=len(b['items'])
        for i in reversed(range(n)):
            pg.click(f"#{cpid} .lnpool button[onclick=\"lnOrdAdd('{k}',{i})\"]")
        # reversed order is only wrong if n>1
        if n<2: return None
    elif t=='match':
        n=len(b['pairs'])
        if n<2: return None
        for i in range(n):
            pg.click(f"#{cpid} .lnml button[onclick=\"lnMtL('{k}',{i})\"]")
            pg.click(f"#{cpid} .lnmr button[onclick=\"lnMtR('{k}',{(i+1)%n})\"]")
    elif t=='fill':
        for j,x in enumerate(b['blanks']):
            wrong=[i for i in range(len(x['o'])) if i!=x['a']][0]
            pg.select_option(f"#{cpid} select.lnfs >> nth={j}",index=wrong+1)
        pg.click(f"#{cpid} button[onclick=\"lnFillGo('{k}')\"]")
    elif t=='sort':
        nb=len(b['buckets'])
        for i,it in enumerate(b['items']):
            pg.click(f"#{cpid} button[onclick=\"lnSortSet('{k}',{i},{(it[1]+1)%nb})\"]")
        pg.click(f"#{cpid} button[onclick=\"lnSortGo('{k}')\"]")
    pg.wait_for_timeout(60)
    return pg.evaluate("(id)=>!!document.querySelector('#'+id+' .lnfb.bad')",cpid)
def answer(pg,cpid,b,k):
    t=b['type']
    if t=='pick':
        pg.click(f"#{cpid} button[onclick=\"lnPick('{k}',{b['a']})\"]")
    elif t=='multi':
        cur=pg.evaluate("(k)=>(lnCpSt(k).sel||[])",k)
        for i in b['a']:
            if i not in cur: pg.click(f"#{cpid} button[onclick=\"lnMultiT('{k}',{i})\"]")
        for i in cur:
            if i not in b['a']: pg.click(f"#{cpid} button[onclick=\"lnMultiT('{k}',{i})\"]")
        pg.click(f"#{cpid} button[onclick=\"lnMultiGo('{k}')\"]")
    elif t=='order':
        pg.evaluate("(k)=>{const s=lnCpSt(k);if(s.lock)lnOrdReset(k)}",k)
        pg.evaluate("(k)=>{const s=lnCpSt(k);if((s.seq||[]).length)lnOrdReset(k)}",k)
        for i in range(len(b['items'])):
            pg.click(f"#{cpid} .lnpool button[onclick=\"lnOrdAdd('{k}',{i})\"]")
    elif t=='match':
        n=len(b['pairs'])
        for i in range(n):
            if pg.evaluate("(a)=>{const s=lnCpSt(a[0]);return (s.ok||[]).indexOf(a[1])>=0}",[k,i]): continue
            pg.click(f"#{cpid} .lnml button[onclick=\"lnMtL('{k}',{i})\"]")
            pg.click(f"#{cpid} .lnmr button[onclick=\"lnMtR('{k}',{i})\"]")
    elif t=='fill':
        for j,x in enumerate(b['blanks']):
            pg.select_option(f"#{cpid} select.lnfs >> nth={j}",index=x['a']+1)
        pg.click(f"#{cpid} button[onclick=\"lnFillGo('{k}')\"]")
    elif t=='sort':
        for i,it in enumerate(b['items']):
            pg.click(f"#{cpid} button[onclick=\"lnSortSet('{k}',{i},{it[1]})\"]")
        pg.click(f"#{cpid} button[onclick=\"lnSortGo('{k}')\"]")
    pg.wait_for_timeout(40)
    return pg.evaluate("(k)=>!!LN.sn[k]",k)
def do_step(pg,key,si,D,wrong=False,shots=None):
    """complete every gate of guide step si (1-based). returns list of problems"""
    probs=[];st=D['guide'][si-1];mid='bp-'+key
    for bi,b in enumerate(st['b']):
        if b['k']=='cp':
            k=f"{mid}:{si}:c{bi}";cpid=f"cp_{si}_{bi}"
            if not pg.query_selector('#'+cpid): probs.append(f"step {si} block {bi}: checkpoint element missing");continue
            if wrong:
                w=wrong_first(pg,cpid,b,k)
                if w is False: probs.append(f"step {si} block {bi} ({b['type']}): wrong attempt showed no feedback")
            ok=answer(pg,cpid,b,k)
            if not ok: probs.append(f"step {si} block {bi} ({b['type']}): could not clear checkpoint")
        elif b['k'] in('tiles','check') and b.get('req'):
            pre='t' if b['k']=='tiles' else 'k'
            for i in range(len(b['items'])):
                k=f"{mid}:{si}:{pre}{bi}.{i}"
                el=pg.query_selector(f"button[onclick*=\"'{k}'\"]")
                if not el: probs.append(f"step {si} block {bi}: required item {i} missing");continue
                if not pg.evaluate("(k)=>!!LN.sn[k]",k): el.click();pg.wait_for_timeout(30)
    return probs
