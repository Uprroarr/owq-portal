/*CHCP: copy and paste in chat channels: paste a screenshot or file to attach it, copy any message's text */
function chPaste(ev,where){try{const it=ev&&ev.clipboardData&&ev.clipboardData.items;if(!it)return;let f=null;for(const x of it){if(x.kind==='file'){f=x.getAsFile();if(f)break}}if(!f)return;
  ev.preventDefault();if(!f.name||f.name==='image.png'){const ext=(f.type.split('/')[1]||'png').replace('jpeg','jpg');try{f=new File([f],'pasted-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.'+ext,{type:f.type})}catch(e){}}
  if(where==='mr'){if(typeof mrPick==='function')mrPick([f],'t')}else chPick([f])}catch(e){}}
function cpText(t){const done=()=>toast('Copied',1),fb=()=>{try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();ok?done():toast('Could not copy. Select the text and press Ctrl+C.')}catch(e){toast('Could not copy. Select the text and press Ctrl+C.')}};
 try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,fb);return}}catch(e){}fb()}
function chCopy(id,btn){try{const m=chAll().find(x=>String(x.id)===String(id));if(!m)return;let t=String(m.text||'');if(m.att&&IMG.test(okType(m.att.type))){cpImage(m.att,t);if(btn){btn.classList.add('ok');setTimeout(()=>btn.classList.remove('ok'),1200)}return}if(!t&&m.att)t=String(m.att.name||m.att.url||'');if(!t)return toast('Nothing to copy in that message.');cpText(t);
  if(btn){btn.classList.add('ok');setTimeout(()=>btn.classList.remove('ok'),1200)}}catch(e){}}
/* copy a picture itself (as PNG, the format clipboards accept) */
function cpImgBlob(a){return chLoad(a).then(data=>{if(!data)throw 0;return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);c.toBlob(b=>b?res(b):rej(0),'image/png')}catch(e){rej(0)}};im.onerror=()=>rej(0);im.src='data:'+okType(a.type)+';base64,'+data})})}
function cpImage(a,text){const no=()=>toast('Your browser blocked copying the picture. Open it, then right-click it and choose Copy image.');
 try{if(!navigator.clipboard||!navigator.clipboard.write||typeof ClipboardItem==='undefined')return no();const parts={'image/png':cpImgBlob(a)};if(text)parts['text/plain']=new Blob([text],{type:'text/plain'});
  navigator.clipboard.write([new ClipboardItem(parts)]).then(()=>toast(text?'Picture and text copied':'Picture copied',1),no)}catch(e){no()}}
function chCopyImg(id){const a=chAtt(id);if(a)cpImage(a,'')}
