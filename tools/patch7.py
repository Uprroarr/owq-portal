F='/mnt/user-data/outputs/owq-command-station-v2.html'
h=open(F).read()
def rep(a,b):
    global h
    assert a in h,('missing',a[:80]);h=h.replace(a,b,1)
# chSend
i=h.index("function chSend(){");j=h.index("\n",i)
h=h[:i]+"""async function chSend(){if(CH.ch==='__voice')return;const i=document.getElementById('chi'),t=(i?i.value:CH.draft).trim(),att=CH.att;if((!t&&!att)||!CH.canW)return;CH.draft='';CH.err='';CH.att=null;if(i)i.value='';chStage();let a=null;
if(att){try{toast('Uploading file...');a=await chUpload(att)}catch(e){CH.att=att;CH.draft=t;const perm=e&&(e.code==='invalid_argument'||e.code==='not_granted'||e.code==='revoked');CH.err=perm?'You have view-only access: you can read the chat but not post. Ask the owner to set your sharing to Contributor.':'Could not upload the file ('+((e&&e.code)||'error')+'). Try again or use a smaller file.';if(perm)CH.canW=false;go();return}}
chPost({ch:CH.ch,who:WHO,text:t.slice(0,500),at:Date.now(),att:a});setTimeout(chScroll,30)}"""+h[j:]
rep("<p>${chTxt(m.text)}</p><div class=cmr>","${m.text?`<p>${chTxt(m.text)}</p>`:''}${attHtml(m)}<div class=cmr>")
rep("<div class=chf><input id=chi","<div id=chst class=chst>${chStaged()}</div><div class=chf><button class=\"btn o\" onclick=\"document.getElementById('chfile').click()\" aria-label=\"Attach a file\" title=\"Attach a file or image\" ${ro?'disabled':''}>&#128206;</button><input type=file id=chfile hidden accept=\"image/*,${CHA}\" onchange=\"chPick(this.files)\"><input id=chi")
rep("m:'#'+m.ch+': '+String(m.text).slice(0,90)","m:'#'+m.ch+': '+(m.att&&!m.text?'Sent a file: '+String(m.att.name||'').slice(0,60):String(m.text).slice(0,90))")
rep("if(CH.live&&CH.db){CH.db.doc('chat/'+id).delete().catch(()=>{})}","if(CH.live&&CH.db){const mm=chAll().find(x=>x.id===id);if(mm&&mm.att)for(let n=0;n<Math.min(+mm.att.n||0,8);n++)CH.db.doc('files/'+fileKey(mm.att.id)+'_'+n).delete().catch(()=>{});CH.db.doc('chat/'+id).delete().catch(()=>{})}")
rep("const kpi=",open('chfile.js').read()+"\nconst kpi=")
css=".chst{padding:0 12px}.chsc{display:flex;gap:10px;align-items:center;border:1px solid var(--ln);background:#0f0f15;padding:6px 10px;margin-top:8px}.chsc img{width:40px;height:40px;object-fit:cover}.chsc span{font-size:26px}.chsc div{flex:1;min-width:0}.chsc b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.chsc small,.chai small,.chaf small{color:var(--mut);font-size:10px;display:block}.chsc button{background:none;border:0;color:var(--mut);font-size:20px;cursor:pointer}.chai,.chaf{display:flex;background:#0f0f15;border:1px solid var(--ln);color:var(--tx);cursor:pointer;text-align:left;margin-top:6px;padding:6px;gap:10px;align-items:center;max-width:320px;font:12px Verdana,sans-serif}.chai{flex-direction:column;align-items:flex-start}.chai img{max-width:200px;max-height:160px;object-fit:cover}.chai:hover,.chaf:hover{border-color:var(--red)}.chaf span{font-size:26px}.chv{max-width:min(92vw,720px)}.chvi{max-width:100%;max-height:68vh;display:block;margin:10px auto 0}"
rep("</style>",css+"</style>")
open(F,'w').write(h);print(len(h))
