"""Morning Recognition: no character limit on the quote, the focus note or replies (a hidden 20000 ceiling protects storage). Base -> new base."""
import os
SP='/tmp/claude-0/-home-claude/6e37954b-9c9e-57d7-b212-24d756de5469/scratchpad'
B=os.environ.get('OWQ_BASE',SP+'/v87-final.html');O=os.environ.get('OWQ_OUT',SP+'/v88-final.html')
s=open(B,encoding='utf-8').read()
def rep(o,n,c=1):
    global s
    k=s.count(o);assert k==c,(k,c,o[:90]);s=s.replace(o,n)
X='20000'
# stored records
rep("quote=String(d.quote||'').slice(0,260);if(!goals.length&&!quote)return null;","quote=String(d.quote||'').slice(0,%s);if(!goals.length&&!quote)return null;"%X)
rep("note:String(d.note||'').slice(0,320),att:mrCleanAtt(d.att)","note:String(d.note||'').slice(0,%s),att:mrCleanAtt(d.att)"%X)
rep("text:String(d.text||'').slice(0,500),at:+d.at||0,att:mrCleanAtt(d.att)","text:String(d.text||'').slice(0,%s),at:+d.at||0,att:mrCleanAtt(d.att)"%X)
# the post form
rep("quote:d&&d.quote?String(d.quote).slice(0,260):mrRandQuote(),own:d&&d.own?1:0,note:d?String(d.note||'').slice(0,300):''","quote:d&&d.quote?String(d.quote).slice(0,%s):mrRandQuote(),own:d&&d.own?1:0,note:d?String(d.note||'').slice(0,%s):''"%(X,X))
rep("note=String(f.note||'').trim().slice(0,300);let e='';","note=String(f.note||'').trim().slice(0,%s);let e='';"%X)
rep("<textarea id=mrfq rows=3 maxlength=260 ","<textarea id=mrfq rows=3 ")
rep("mrCnt('mrfqc',this.value.length,260);","")
rep("<small class=mrcn id=mrfqc>${f.quote.length}/260</small>","")
rep("<textarea id=mrfn rows=3 maxlength=300 ","<textarea id=mrfn rows=3 ")
rep("mrCnt('mrfnc',this.value.length,300);","")
rep("<small class=mrcn id=mrfnc>${f.note.length}/300</small>","")
# replies
rep("<input id=mri maxlength=500 ","<input id=mri ")
rep("i.value=(i.value+t.value).slice(0,500);MR.draft=i.value;","i.value=(i.value+t.value).slice(0,%s);MR.draft=i.value;"%X)
rep("i.value=(v+'\\u{1F3C6} Shout-out to @').slice(0,500);","i.value=(v+'\\u{1F3C6} Shout-out to @').slice(0,%s);"%X)
rep("const ok=await mrPostMsg({rid:r.id,who:mrMe(),text:t.slice(0,500),","const ok=await mrPostMsg({rid:r.id,who:mrMe(),text:t.slice(0,%s),"%X)
rep("inp.value=(pre+inp.value.slice(pos)).slice(0,500);MR.draft=inp.value;","inp.value=(pre+inp.value.slice(pos)).slice(0,%s);MR.draft=inp.value;"%X)
rep("const p=mrPostMsg({rid:r.id,who:mrMe(),text:t.slice(0,500),at:Date.now(),att:null});","const p=mrPostMsg({rid:r.id,who:mrMe(),text:t.slice(0,%s),at:Date.now(),att:null});"%X)
open(O,'w',encoding='utf-8').write(s);print('wrote',O,len(s))
