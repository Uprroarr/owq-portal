/*SHKstart*/
/* Owner only (Cole Leckey / Agency Owner): pick a teammate, walk over, lift them up and shake them until a screw falls out.
   The 3D office (VO3.shake) runs it for everyone on the floor (presence em:{k:'shake',n,to:<peer>}). */
function voOwnerNow(){return typeof WHO!=='undefined'&&(WHO==='Cole Leckey'||WHO==='Agency Owner')}
function voShakePanel(){if(!voOwnerNow())return'';let L=[];try{L=typeof VO3!=='undefined'&&VO3.targets?VO3.targets():[]}catch(e){}
 /* Austin first */L=L.slice().sort((a,b)=>(/^Austin/i.test(b.nm||'')?1:0)-(/^Austin/i.test(a.nm||'')?1:0));VOX.tl=L;const f=n=>esc(String(n||'').split(' ')[0]);
 return `<div class="vopn votp" role=dialog aria-label="Shake a screw loose"><div class=votph><button class=votb onclick="voPop('emo')" title="Back to emotes" aria-label="Back to emotes">&larr;</button><b>&#128297; SHAKE A SCREW LOOSE</b></div>`+
  (L.length?`<div class=votg>${L.map((x,i)=>`<button onclick="voShake(${i})" ${x.ok?'':'disabled'} title="${x.ok?'Shake '+f(x.nm)+' until a screw falls out':f(x.nm)+' is not at their desk right now'}">${av(x.nm,34)}<b>${f(x.nm)}</b><small>${x.bot?'Demo crowd':x.ok?'At their desk':'Away from desk'}</small></button>`).join('')}</div>`:
   `<p class=votn>Nobody else is on the floor yet. Turn on the demo crowd (the people button on the floor) to practice.</p>`)+
  `<small class=votn>Owner only. You walk over, pick them up and shake them until a screw falls out.</small></div>`}
function voShake(i){const x=VOX.tl[i];VOX.pop='';vcPaint();if(!x||!voOwnerNow())return;try{if(typeof VO3!=='undefined'&&VO3.shake)VO3.shake(x.id)}catch(e){}}
setInterval(()=>{try{if(VOX.pop==='shake'&&typeof voOffice==='function'&&voOffice())vcPaint()}catch(e){}},1000);
/*SHKend*/
