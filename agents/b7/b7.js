/*B7start*/
/* v123: no inactivity sign-out while on the Sales Floor (10 minute rule only applies off the floor) */
setInterval(()=>{try{if(typeof VC!=='undefined'&&VC.on){FL.last=Date.now();if(typeof LASTACT!=='undefined')LASTACT=Date.now();const e=document.getElementById('idlew');if(e&&e.className.indexOf(' on')>=0){e.className='idlew';e.innerHTML=''}}}catch(e){}},1000);
/*B7end*/
