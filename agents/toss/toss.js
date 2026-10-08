/*TOSSstart*/
/* Sales Floor emote: toss a teammate out the back window (3D office). The picker lives in the Emotes panel; the 3D office
   (VO3.toss / VO3.targets) runs the throw, the glass, the parachute and the walk back in, for everyone on the floor
   (the emote goes out in presence as em:{k:'toss',n,to:<peer>}). */
VOX.tl=[];
function voTossPanel(mode){const Y=mode==='yeet';let L=[];try{L=typeof VO3!=='undefined'&&VO3.targets?VO3.targets():[]}catch(e){}VOX.tl=L;
 const f=n=>esc(String(n||'').split(' ')[0]);
 return `<div class="vopn votp" role=dialog aria-label="Toss someone out the window"><div class=votph><button class=votb onclick="voPop('emo')" title="Back to emotes" aria-label="Back to emotes">&larr;</button><b>${Y?'&#128165; THROW SOMEONE ACROSS THE ROOM':'&#129666; TOSS SOMEONE OUT THE WINDOW'}</b></div>`+
  (L.length?`<div class=votg>${L.map((x,i)=>`<button onclick="voToss(${i},'${Y?'yeet':'toss'}')" ${x.ok?'':'disabled'} title="${x.ok?(Y?'Throw '+f(x.nm)+' across the room':'Toss '+f(x.nm)+' out the window'):f(x.nm)+' is not at their desk right now'}">${av(x.nm,34)}<b>${f(x.nm)}</b><small>${x.bot?'Demo crowd':x.ok?'At their desk':'Away from desk'}</small></button>`).join('')}</div>`:
   `<p class=votn>Nobody else is on the floor yet. Turn on the demo crowd (the people button on the floor) to practice.</p>`)+
  `<small class=votn>${Y?'You walk over, lift them up and launch them. They bounce back.':'They land safely. Parachute included.'}</small></div>`}
function voToss(i,m){const x=VOX.tl[i];VOX.pop='';vcPaint();if(!x)return;try{if(typeof VO3!=='undefined'){if(m==='yeet'&&VO3.yeet)VO3.yeet(x.id);else if(VO3.toss)VO3.toss(x.id)}}catch(e){}}
/* keep the picker current while it is open (people sit down, walk in, get tossed) */
setInterval(()=>{try{if((VOX.pop==='toss'||VOX.pop==='yeet')&&typeof voOffice==='function'&&voOffice())vcPaint()}catch(e){}},1000);
/*TOSSend*/
