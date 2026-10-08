export const clamp=(x,a,b)=>x<a?a:x>b?b:x;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export const now=()=>performance.now()/1000;
export function hash(s){s=String(s||'');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function rng(seed){let s=(seed>>>0)||0x9e3779b9;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
export const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
