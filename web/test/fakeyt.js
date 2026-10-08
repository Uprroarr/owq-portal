(function(){const L=window.__YTL=[];
class Player{constructor(el,o){this.o=o;this.t=+(o.playerVars&&o.playerVars.start)||0;this.st=-1;this.ts=performance.now();this.vol=100;this.mu=false;this.calls=[];
 const f=document.createElement('iframe');f.src='about:blank';f.style.background='#123';f.dataset.v=o.videoId;el.replaceWith(f);this.f=f;L.push(this);
 setTimeout(()=>{o.events&&o.events.onReady&&o.events.onReady({target:this});if(o.playerVars&&o.playerVars.autoplay&&!window.__YT_NOAUTO)this.playVideo()},150)}
 now(){return this.st===1?Math.min(300,this.t+(performance.now()-this.ts)/1000):this.t}
 set(s){this.t=this.now();this.ts=performance.now();this.st=s;const e=this.o.events&&this.o.events.onStateChange;if(e)setTimeout(()=>e({data:s,target:this}),0)}
 playVideo(){this.calls.push('play');if(window.__YT_NOAUTO&&!navigator.userActivation.isActive){this.set(5);return}this.set(1)}
 pauseVideo(){this.calls.push('pause');this.set(2)}
 seekTo(t){this.calls.push('seek');this.t=t;this.ts=performance.now()}
 getCurrentTime(){return this.now()}getDuration(){return 300}getPlayerState(){return this.st}
 getVideoData(){return{title:'Test Video '+this.o.videoId}}setVolume(v){this.vol=v}mute(){this.mu=true}unMute(){this.mu=false}
 getIframe(){return this.f}destroy(){this.f.remove();this.dead=1}}
window.YT={Player};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),50)})();
