// Per-stream speech level + brightness (for mouth shapes). Analysis only: nothing is routed to the speakers.
export class Levels{constructor(){this.ac=null;this.n=new Map()}
  ctx(){if(!this.ac){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return null;try{this.ac=new AC()}catch(e){return null}}
    if(this.ac.state==='suspended')this.ac.resume().catch(()=>{});return this.ac}
  resume(){if(this.ac&&this.ac.state==='suspended')this.ac.resume().catch(()=>{})}
  // clone=true analyses an independent copy of the track so speech is seen even while the sender track is muted
  get(key,stream,clone){if(!stream||!stream.getAudioTracks)return null;const tr=stream.getAudioTracks()[0];if(!tr||tr.readyState==='ended')return null;
    let n=this.n.get(key);if(n&&n.tid!==tr.id){this.drop(key);n=null}
    if(!n){const ac=this.ctx();if(!ac)return null;try{let st=stream,cl=null;if(clone){cl=tr.clone();cl.enabled=true;st=new MediaStream([cl])}
        const src=ac.createMediaStreamSource(st),an=ac.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=.15;src.connect(an);
        n={tid:tr.id,src,an,cl,td:new Float32Array(an.fftSize),fd:new Uint8Array(an.frequencyBinCount),lv:0,hf:.5,f0:0,vc:0,pc:0};this.n.set(key,n)}catch(e){return null}}
    const a=n.an;if(a.getFloatTimeDomainData)a.getFloatTimeDomainData(n.td);else{const b=new Uint8Array(a.fftSize);a.getByteTimeDomainData(b);for(let i=0;i<b.length;i++)n.td[i]=(b[i]-128)/128}
    let s=0;for(let i=0;i<n.td.length;i++)s+=n.td[i]*n.td[i];const rms=Math.sqrt(s/n.td.length);
    a.getByteFrequencyData(n.fd);const bin=(this.ac.sampleRate/2)/n.fd.length;let lo=0,hi=0;const l1=Math.round(900/bin),h0=Math.round(2200/bin),h1=Math.round(6000/bin);
    for(let i=2;i<l1;i++)lo+=n.fd[i];for(let i=h0;i<h1&&i<n.fd.length;i++)hi+=n.fd[i];n.hf=hi/(lo+hi+1);
    n.lv=Math.max(0,Math.min(1,(rms-.006)*7.5));
    // voice pitch about 30 times a second, only while someone is talking
    const pn=performance.now();if(pn-(n.pt||0)>30){n.pt=pn;if(n.lv>.06){const r=pitch(n.td,this.ac.sampleRate);n.f0=r?r[0]:0;n.vc=r?r[1]:0}else{n.f0=0;n.vc=0}}return n}
  drop(key){const n=this.n.get(key);if(!n)return;try{n.src.disconnect()}catch(e){}if(n.cl)try{n.cl.stop()}catch(e){}this.n.delete(key)}
  prune(keep){for(const k of [...this.n.keys()])if(!keep.has(k))this.drop(k)}
  close(){for(const k of [...this.n.keys()])this.drop(k);if(this.ac)try{this.ac.close()}catch(e){}this.ac=null}}
// Pitch of a voice (70-450 Hz) by normalised autocorrelation on a 12 kHz copy of the frame. Returns [Hz, clarity] or null when unvoiced.
const XB=new Float32Array(1024);
export function pitch(td,sr){const D=Math.max(1,Math.round(sr/12000)),fs=sr/D,N=Math.min(XB.length,Math.floor(td.length/D));let m=0;
  for(let i=0;i<N;i++){let a=0;for(let j=0;j<D;j++)a+=td[i*D+j];XB[i]=a/D;m+=XB[i]}m/=N;for(let i=0;i<N;i++)XB[i]-=m;
  const t0=Math.floor(fs/450),t1=Math.min(N>>1,Math.ceil(fs/70));if(t1<=t0+2)return null;const nf=new Float32Array(t1+2);let best=0;
  for(let t=t0-1;t<=t1+1;t++){let ac=0,e=0;const L=N-t;for(let i=0;i<L;i++){const a=XB[i],b=XB[i+t];ac+=a*b;e+=a*a+b*b}nf[t]=e>1e-9?2*ac/e:0;if(t>=t0&&t<=t1&&nf[t]>best)best=nf[t]}
  if(best<.6)return null;
  for(let t=t0;t<=t1;t++){if(nf[t]>=best*.88&&nf[t]>=nf[t-1]&&nf[t]>=nf[t+1]){const a=nf[t-1],b=nf[t],c=nf[t+1],d=a-2*b+c,o=d<0?.5*(a-c)/d:0;return[fs/(t+o),b]}}
  return null}
