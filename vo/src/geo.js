import * as THREE from 'three';
import {mergeGeometries} from '../three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from '../three/examples/jsm/geometries/RoundedBoxGeometry.js';

const _q=new THREE.Quaternion();
const _e=new THREE.Euler();
const _s=new THREE.Vector3();
const _p=new THREE.Vector3();
function M(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){_e.set(rx,ry,rz,'YXZ');_q.setFromEuler(_e);_p.set(x,y,z);_s.set(sx,sy,sz);return new THREE.Matrix4().compose(_p,_q,_s)}
function norm(g){let n=g.index?g.toNonIndexed():g.clone();const keep={position:1,normal:1,uv:1};
  Object.keys(n.attributes).forEach(k=>{if(!keep[k])n.deleteAttribute(k)});
  if(!n.attributes.normal)n.computeVertexNormals();
  if(!n.attributes.uv)n.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n.attributes.position.count*2),2));
  n.morphAttributes={};n.clearGroups();return n}
/* collects geometry per material, merges into one mesh per material */
class Batch{constructor(){this.m=new Map()}
  add(mat,geo,matrix){const g=matrix?geo.clone().applyMatrix4(matrix):geo;let a=this.m.get(mat);if(!a)this.m.set(mat,a=[]);a.push(g);return this}
  build(parent,o={}){const out=[];this.m.forEach((geos,mat)=>{if(!geos.length)return;const g=mergeGeometries(geos.map(norm),false);g.computeBoundingSphere();const mesh=new THREE.Mesh(g,mat);
    mesh.castShadow=o.cast!==false;mesh.receiveShadow=o.receive!==false;mesh.matrixAutoUpdate=false;mesh.updateMatrix();if(o.layer!==undefined){mesh.layers.set(o.layer)}parent.add(mesh);out.push(mesh)});this.m.clear();return out}}
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const rbox=(w,h,d,r=.02,s=2)=>new RoundedBoxGeometry(w,h,d,s,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const cyl=(rt,rb,h,s=24,open=false)=>new THREE.CylinderGeometry(rt,rb,h,s,1,open);
const sph=(r,w=24,h=16)=>new THREE.SphereGeometry(r,w,h);
/* limb capsule hanging down from origin (joint) */
function limb(r,len,cs=6,rs=14){const g=new THREE.CapsuleGeometry(r,len,cs,rs);g.translate(0,-len/2,0);return g}
/* bent frond strip: base at origin, extends +x, droops -y, folds up along width */
function frondGeo(len,width,droop,segs=14,fold=.35){const g=new THREE.PlaneGeometry(len,width,segs,2);g.translate(len/2,0,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),t=x/len;p.setXYZ(i,x*(1-.12*t*t),-droop*t*t*len+Math.abs(y)*fold,y*(1-.25*t))}
  g.computeVertexNormals();return g}
/* leaf card bent like a cup, base at origin pointing +y */
function leafGeo(w,h,cup=.18,curl=.25){const g=new THREE.PlaneGeometry(w,h,6,8);g.translate(0,h/2,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),t=y/h,u=x/(w/2);p.setZ(i,-cup*w*u*u*.5+curl*h*t*t)}g.computeVertexNormals();return g}
function lathe(pts,seg=32){return new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg)}
function tube(pts,r,seg=24,rs=8){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2]))),seg,r,rs,false)}

export {Batch, M, box, cyl, frondGeo, lathe, leafGeo, limb, rbox, sph, tube};
