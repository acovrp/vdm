import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const host=document.querySelector("#stage3d"), track=document.querySelector("#sceneTrack"), sticky=document.querySelector("#sceneSticky");
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

try{ start(); }catch(e){ console.warn("3D unavailable",e); }

function start(){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  host.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,80);
  camera.position.set(0,5.6,8.4);
  camera.lookAt(0,.55,0);

  scene.add(new THREE.HemisphereLight(0xa9c0b4,0x08140f,.9));
  const key=new THREE.DirectionalLight(0xfff3e0,2.6); key.position.set(2.6,4.4,2.8); scene.add(key);
  const rim=new THREE.DirectionalLight(0xe4401f,2.4); rim.position.set(-3.4,1.2,-3.6); scene.add(rim);
  const fill=new THREE.DirectionalLight(0x6fc4a4,.45); fill.position.set(-2.4,-1.2,2.2); scene.add(fill);

  const enamel=new THREE.MeshStandardMaterial({color:0xf4eedf,roughness:.26,metalness:.06});
  const ti=new THREE.MeshStandardMaterial({color:0xd2dcd6,roughness:.22,metalness:1});
  const tiDark=new THREE.MeshStandardMaterial({color:0x93a29b,roughness:.34,metalness:1});
  const boneMat=new THREE.MeshStandardMaterial({color:0x1d382b,roughness:.95,metalness:.04});

  const arch=new THREE.Group(); arch.scale.setScalar(1.25); scene.add(arch);

  const ridge=new THREE.Mesh(new THREE.TorusGeometry(1,.17,10,90),boneMat);
  ridge.rotation.x=Math.PI/2; ridge.scale.set(1.98,1.38,1); arch.add(ridge);

  const kinds=[.64,.62,.54,.54,.47,.42,.42,.42,.42,.47,.54,.54,.62,.64];
  const rx=1.98, rz=1.38, a0=THREE.MathUtils.degToRad(203), a1=THREE.MathUtils.degToRad(337);
  const crowns=[];

  kinds.forEach((w,i)=>{
    const a=a0+(a1-a0)*i/(kinds.length-1);
    const x=Math.cos(a)*rx, z=Math.sin(a)*rz;
    const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=Math.atan2(x,z); arch.add(g);

    const platform=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.1,18),ti);
    platform.position.y=.14; g.add(platform);

    const screw=new THREE.Mesh(new THREE.ConeGeometry(.12,.62,14),tiDark);
    screw.position.y=-.22; screw.rotation.x=Math.PI; g.add(screw);
    [.06,-.08,-.22].forEach((y,k)=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.118-k*.012,.017,5,16),ti);
      ring.rotation.x=Math.PI/2; ring.position.y=y; g.add(ring);
    });

    const holder=new THREE.Group(); holder.position.y=.16; g.add(holder);
    const abut=new THREE.Mesh(new THREE.CylinderGeometry(.09,.14,.22,16),ti);
    abut.position.y=.11; holder.add(abut);

    const h=w*.98;
    const crown=new THREE.Mesh(new RoundedBoxGeometry(w,h,w*.88,3,Math.min(.14,w*.22)),enamel);
    crown.position.y=h/2+.22; holder.add(crown);
    crowns.push({holder,base:.16});
  });

  // ---- interaction ----
  const state={drag:false,px:0,py:0,ry:-.32,rx:.06,spin:reduce?0:1};
  const el=renderer.domElement;
  el.style.touchAction="pan-y";
  el.addEventListener("pointerdown",e=>{state.drag=true;state.px=e.clientX;state.py=e.clientY;el.setPointerCapture?.(e.pointerId)});
  el.addEventListener("pointermove",e=>{
    if(!state.drag)return;
    state.ry+=(e.clientX-state.px)*.006;
    state.rx=clamp(state.rx+(e.clientY-state.py)*.003,-.35,.5);
    state.px=e.clientX; state.py=e.clientY;
  });
  ["pointerup","pointercancel"].forEach(t=>el.addEventListener(t,()=>state.drag=false));

  function size(){
    const w=host.clientWidth||1, h=host.clientHeight||1;
    renderer.setSize(w,h,false);
    camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(host); size();

  // ---- scroll progress ----
  let p=0;
  function prog(){
    if(!track)return 0;
    const r=track.getBoundingClientRect();
    return clamp((0-r.top)/(r.height-innerHeight),0,1);
  }

  let visible=false;
  new IntersectionObserver(es=>{visible=es[0].isIntersecting},{rootMargin:"120px"}).observe(sticky);

  let last=performance.now();
  function frame(now){
    const dt=Math.min((now-last)/1000,.05); last=now;
    p+=(prog()-p)*.12;
    crowns.forEach(c=>{c.holder.position.y=c.base+p*.95; c.holder.rotation.x=p*.08});
    if(!state.drag&&state.spin) state.ry+=dt*.09;
    arch.rotation.y=state.ry;
    arch.rotation.x=state.rx;
    camera.position.y=8.2-p*1.6;
    camera.position.z=10.6+p*1.1;
    camera.lookAt(0,.1+p*.35,0);
    renderer.render(scene,camera);
    if(visible)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const io=new IntersectionObserver(es=>{if(es[0].isIntersecting)requestAnimationFrame(frame)},{rootMargin:"120px"});
  io.observe(sticky);

  sticky.classList.add("has3d");
  window.__arch3d={renderer,scene,camera,arch,p:()=>p,shot:()=>{renderer.render(scene,camera);return renderer.domElement.toDataURL("image/jpeg",.7)}};
}
