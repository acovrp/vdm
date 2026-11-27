import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const host=document.querySelector("#stage3d"), track=document.querySelector("#sceneTrack"), sticky=document.querySelector("#sceneSticky");
const clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

try{ start(); }catch(e){ console.warn("3D unavailable",e); }

function start(){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;
  host.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  const pmrem=new THREE.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;

  const camera=new THREE.PerspectiveCamera(34,1,.1,100);

  scene.add(new THREE.HemisphereLight(0x9fb6aa,0x06110c,.6));
  const key=new THREE.DirectionalLight(0xfff4e4,2.4); key.position.set(3,6,4); scene.add(key);
  const rim=new THREE.DirectionalLight(0xe4401f,3.0); rim.position.set(-4,1.5,-4); scene.add(rim);

  const enamel=new THREE.MeshPhysicalMaterial({color:0xf6f1e4,roughness:.3,metalness:.02,clearcoat:.6,clearcoatRoughness:.35});
  const ti=new THREE.MeshStandardMaterial({color:0xd6dfda,roughness:.22,metalness:1});
  const tiDark=new THREE.MeshStandardMaterial({color:0x94a39c,roughness:.34,metalness:1});
  const boneMat=new THREE.MeshStandardMaterial({color:0x14291F,roughness:.95,metalness:.05});
  const planMat=new THREE.MeshBasicMaterial({color:0xe4401f,transparent:true,opacity:.55});

  const arch=new THREE.Group();
  scene.add(arch);

  // bone ridge
  const ridge=new THREE.Mesh(new THREE.TorusGeometry(1,.115,10,96),boneMat);
  ridge.rotation.x=Math.PI/2; ridge.scale.set(1.95,1.4,1); arch.add(ridge);

  // digital plan ring
  const plan=new THREE.Mesh(new THREE.TorusGeometry(1,.006,4,120),planMat);
  plan.rotation.x=Math.PI/2; plan.scale.set(2.32,1.78,1); plan.position.y=-.34; arch.add(plan);

  const kinds=[.62,.6,.52,.52,.45,.4,.4,.4,.4,.45,.52,.52,.6,.62];
  const rx=1.95, rz=1.4, a0=THREE.MathUtils.degToRad(202), a1=THREE.MathUtils.degToRad(338);
  const crowns=[];

  kinds.forEach((w,i)=>{
    const a=a0+(a1-a0)*i/(kinds.length-1);
    const x=Math.cos(a)*rx, z=Math.sin(a)*rz;
    const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=Math.atan2(x,z); arch.add(g);

    const platform=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,.1,18),ti);
    platform.position.y=.1; g.add(platform);

    const screw=new THREE.Mesh(new THREE.CylinderGeometry(.11,.055,.72,14),tiDark);
    screw.position.y=-.36; g.add(screw);
    [.02,-.12,-.26,-.4].forEach((y,k)=>{
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.115-k*.014,.016,5,18),ti);
      ring.rotation.x=Math.PI/2; ring.position.y=y; g.add(ring);
    });

    const holder=new THREE.Group(); holder.position.y=.14; g.add(holder);
    const abut=new THREE.Mesh(new THREE.CylinderGeometry(.075,.115,.2,16),ti);
    abut.position.y=.1; holder.add(abut);

    const h=w*.92;
    const crown=new THREE.Mesh(new THREE.CylinderGeometry(w*.5,w*.38,h*.72,7),enamel);
    crown.rotation.y=Math.PI/7;
    crown.position.y=h*.36+.19; holder.add(crown);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(w*.5,16,10,0,Math.PI*2,0,Math.PI/2),enamel);
    dome.scale.set(1,.62,1); dome.rotation.y=Math.PI/7;
    dome.position.y=h*.72+.19; holder.add(dome);
    crowns.push({holder,base:.14});
  });

  const state={drag:false,px:0,py:0,ry:-.3,rx:0,spin:reduce?0:1};
  const el=renderer.domElement;
  el.style.touchAction="pan-y";
  el.addEventListener("pointerdown",e=>{state.drag=true;document.querySelector("#stageHint")?.classList.add("gone");state.px=e.clientX;state.py=e.clientY;el.setPointerCapture?.(e.pointerId)});
  el.addEventListener("pointermove",e=>{
    if(!state.drag)return;
    state.ry+=(e.clientX-state.px)*.006; state.px=e.clientX; state.py=e.clientY;
  });
  ["pointerup","pointercancel"].forEach(t=>el.addEventListener(t,()=>state.drag=false));

  function size(){
    const w=host.clientWidth||1, h=host.clientHeight||1;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }
  const FIT=5.1;
  function fitDist(){
    const vfov=THREE.MathUtils.degToRad(camera.fov);
    const fitH=(FIT/2)/Math.tan(vfov/2);
    const fitW=(FIT/2)/(Math.tan(vfov/2)*Math.max(camera.aspect,.2));
    return Math.max(fitH,fitW);
  }
  new ResizeObserver(size).observe(host); size();

  let p=0;
  const prog=()=>{ if(!track)return 0; const r=track.getBoundingClientRect(); return clamp((0-r.top)/(r.height-innerHeight),0,1); };

  let visible=false;
  new IntersectionObserver(es=>{visible=es[0].isIntersecting},{rootMargin:"140px"}).observe(sticky);

  let last=performance.now();
  function frame(now){
    const dt=Math.min((now-last)/1000,.05); last=now;
    p+=(prog()-p)*.1;
    crowns.forEach(c=>{c.holder.position.y=c.base+p*1.05});
    if(!state.drag&&state.spin)state.ry+=dt*.1;
    arch.rotation.y=state.ry; arch.rotation.x=state.rx*.4;
    const el=THREE.MathUtils.degToRad(26+p*10);
    const d=fitDist()*(1-p*.1);
    camera.position.set(0,Math.sin(el)*d,Math.cos(el)*d);
    camera.lookAt(0,.15,0);
    renderer.render(scene,camera);
    if(visible)requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  new IntersectionObserver(es=>{if(es[0].isIntersecting)requestAnimationFrame(frame)},{rootMargin:"140px"}).observe(sticky);

  sticky.classList.add("has3d");
  window.__arch3d={renderer,scene,camera,arch,p:()=>p,shot:()=>{renderer.render(scene,camera);return renderer.domElement.toDataURL("image/jpeg",.72)}};
}
