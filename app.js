"use strict";
const CANONICAL="https://acovrp.github.io/vdm/";
const PHONE="+919711344420";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let lang=localStorage.getItem("vdw-lang")==="hi"?"hi":"en";
let profile=null;

/* ---------- language ---------- */
const whatsappText={en:"Hello Dr. Adarsh Verma, I would like to ask about an appointment.",hi:"नमस्ते डॉक्टर आदर्श वर्मा जी, मुझे अपॉइंटमेंट के बारे में जानकारी चाहिए।"};
function applyLang(){
  document.documentElement.lang=lang;
  $$("[data-en]").forEach(el=>{const v=el.dataset[lang];if(v!=null)el.innerHTML=v});
  const b=$("#language");b.textContent=lang==="en"?"हिन्दी":"English";
  b.setAttribute("aria-label",lang==="en"?"Read in Hindi":"Read in English");
  const wa=$("#whatsapp"),qwa=$("#quick-wa"),url="https://wa.me/919711344420?text="+encodeURIComponent(whatsappText[lang]);
  wa.href=url;qwa.href=url;
  renderEvents();renderSceneLabel();
}
$("#language").addEventListener("click",()=>{
  lang=lang==="en"?"hi":"en";
  try{localStorage.setItem("vdw-lang",lang)}catch{}
  document.body.animate?.([{opacity:1},{opacity:.55},{opacity:1}],{duration:260,easing:"ease-out"});
  applyLang();
});

/* ---------- press feedback / haptics ---------- */
document.addEventListener("pointerdown",e=>{
  if(e.target.closest("a,button")){try{navigator.vibrate?.(7)}catch{}}
},{passive:true});

/* ---------- reveal ---------- */
const io=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}},{threshold:.18});
$$("[data-reveal]").forEach(el=>io.observe(el));

/* ---------- sticky quick bar ---------- */
const quick=$("#quick");
let lastQuick=false;
function syncQuick(){
  const show=scrollY>innerHeight*.82;
  if(show===lastQuick)return;lastQuick=show;
  quick.classList.toggle("show",show);
  quick.toggleAttribute("inert",!show);
  quick.setAttribute("aria-hidden",String(!show));
}
addEventListener("scroll",syncQuick,{passive:true});syncQuick();

/* ---------- mirror loupe ---------- */
const frame=$("#mirrorFrame"), lens=$("#lens"), hint=frame?$(".hint",frame):null;
let lensState={x:0,y:0,tx:0,ty:0,ready:false}, lensRAF=0, touched=false;
function frameMetrics(){
  const r=frame.getBoundingClientRect(), img=frame.querySelector("img");
  const nw=img.naturalWidth||742, nh=img.naturalHeight||1052;
  const scale=Math.max(r.width/nw,r.height/nh);
  const dw=nw*scale, dh=nh*scale;
  return {r,scale,dw,dh,ox:(r.width-dw)/2,oy:(r.height-dh)*0.14,nw,nh};
}
function placeLens(x,y,instant){
  const m=frameMetrics(), R=lens.offsetWidth/2, z=2.35;
  // keep the magnified centre inside the photo
  x=Math.min(Math.max(x,0),m.r.width); y=Math.min(Math.max(y,0),m.r.height);
  lensState.tx=x; lensState.ty=y;
  lens.style.backgroundSize=`${m.dw*z}px ${m.dh*z}px`;
  const bx=-((x-m.ox)*z-R), by=-((y-m.oy)*z-R);
  lens.style.backgroundPosition=`${bx}px ${by}px`;
  if(instant||reduce){lensState.x=x;lensState.y=y;lens.style.transform=`translate(${x-R}px,${y-R}px)`;lensState.ready=true}
  else if(!lensRAF)lensRAF=requestAnimationFrame(tick);
}
function tick(){
  lensState.x+=(lensState.tx-lensState.x)*.22;
  lensState.y+=(lensState.ty-lensState.y)*.22;
  const R=lens.offsetWidth/2;
  lens.style.transform=`translate(${lensState.x-R}px,${lensState.y-R}px)`;
  if(Math.abs(lensState.tx-lensState.x)>.4||Math.abs(lensState.ty-lensState.y)>.4)lensRAF=requestAnimationFrame(tick);
  else lensRAF=0;
}
if(frame&&lens){
  const rest=()=>{const m=frameMetrics();return {x:m.ox+m.nw*m.scale*.5,y:m.oy+m.nh*m.scale*.30}};
  const start=()=>{const p=rest();placeLens(p.x,p.y,true);};
  if("ResizeObserver" in window)new ResizeObserver(()=>{if(!touched)start()}).observe(frame);
  start();
  const intro=new IntersectionObserver((es)=>{for(const e of es){if(!e.isIntersecting)continue;intro.unobserve(frame);
    if(reduce)return;
    const p=rest();let t0=performance.now();
    const step=t=>{const k=Math.min((t-t0)/1500,1);const ease=1-Math.pow(1-k,3);
      placeLens(p.x+Math.sin(k*Math.PI*3)*46*(1-ease),p.y+Math.cos(k*Math.PI*2)*20*(1-ease),false);
      if(k<1)requestAnimationFrame(step)};
    requestAnimationFrame(step);
  }},{threshold:.45});
  intro.observe(frame);
  const move=e=>{
    const r=frame.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    placeLens(t.clientX-r.left,t.clientY-r.top,false);
    if(!touched){touched=true;hint?.classList.add("gone")}
  };
  frame.addEventListener("pointerdown",e=>{frame.setPointerCapture?.(e.pointerId);move(e)});
  frame.addEventListener("pointermove",e=>{if(e.buttons||e.pointerType==="touch")move(e)});
  frame.addEventListener("touchstart",move,{passive:true});
  frame.addEventListener("touchmove",move,{passive:true});
}

/* ---------- implant scroll scene ---------- */
const track=$("#sceneTrack"), sticky=$("#sceneSticky"), bar=$("#sceneBar"), guide=$("#guide"), sceneLabel=$("#sceneLabel");
const stageNames={en:["Crown","Abutment","Implant","Bone"],hi:["क्राउन","एबटमेंट","इम्प्लांट","हड्डी"]};
let sceneP=-1;
function renderSceneLabel(){
  if(!sceneLabel)return;
  const n=stageNames[lang];const i=sceneP<.25?0:sceneP<.5?1:sceneP<.75?2:3;
  if(sceneLabel.dataset.i!==String(i)){sceneLabel.dataset.i=String(i);sceneLabel.textContent=n[i]}
}
function scene(){
  if(!track)return;
  const r=track.getBoundingClientRect();
  const p=Math.min(Math.max((0-r.top)/(r.height-innerHeight),0),1);
  if(Math.abs(p-sceneP)<.002)return;
  sceneP=p;
  sticky.style.setProperty("--p",p.toFixed(4));
  if(bar)bar.style.width=(p*100).toFixed(1)+"%";
  if(guide)guide.style.opacity=p>.12?String(Math.min((p-.12)*3,.9)):0;
  renderSceneLabel();
}
addEventListener("scroll",()=>{scene();},{passive:true});
addEventListener("resize",scene);

/* ---------- events ---------- */
function todayIST(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const g=t=>parts.find(p=>p.type===t).value;return `${g("year")}-${g("month")}-${g("day")}`;
}
function renderEvents(){
  const box=$("#events");if(!box)return;box.replaceChildren();
  if(!profile)return;
  const today=todayIST();
  const upcoming=(profile.events||[]).filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date));
  for(const e of upcoming){
    const art=document.createElement("article");art.className="event";
    const h=document.createElement("strong");h.textContent=e.title;
    const when=document.createElement("p");
    const date=new Intl.DateTimeFormat(lang==="hi"?"hi-IN":"en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date(e.date+"T12:00:00+05:30"));
    when.textContent=`${date} · ${e.city}`;
    const venue=document.createElement("small");venue.textContent=`${e.venue} · ${e.time} IST`;
    art.append(h,when,venue);box.append(art);
  }
  if(!upcoming.length){const p=document.createElement("p");p.textContent=lang==="hi"?"अगले कोर्स की जानकारी के लिए संपर्क करें।":"Get in touch for the next course dates.";box.append(p)}
  if(profile.rating&&profile.ratingVerifiedAt){const r=$("#rating");if(r)r.textContent=`${profile.rating} / 5 · Google${profile.ratingCount?` · ${profile.ratingCount} reviews`:""}`}
}
fetch("profile.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{profile=d;applyLang()}).catch(()=>{});

/* ---------- QR overlay ---------- */
const overlay=$("#qrOverlay");let lastFocus=null;
function openQR(){
  lastFocus=document.activeElement;
  overlay.classList.add("open");overlay.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(()=>$("#qrClose").focus(),60);
}
function closeQR(){
  overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  lastFocus?.focus?.();
}
["#open-share","#open-share-2","#open-share-3"].forEach(s=>$(s)?.addEventListener("click",openQR));
$("#qrClose")?.addEventListener("click",closeQR);
overlay?.addEventListener("click",e=>{if(e.target===overlay)closeQR()});
addEventListener("keydown",e=>{
  if(!overlay.classList.contains("open"))return;
  if(e.key==="Escape"){closeQR();return}
  if(e.key==="Tab"){
    const f=$$("a[href],button:not([disabled])",overlay).filter(el=>el.offsetParent!==null);
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});

/* ---------- share / copy ---------- */
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("visible");clearTimeout(toast.id);toast.id=setTimeout(()=>t.classList.remove("visible"),2600)}
async function copyLink(){
  try{await navigator.clipboard.writeText(CANONICAL);toast(lang==="hi"?"लिंक कॉपी हो गया।":"Link copied.")}
  catch{toast(lang==="hi"?"लिंक दबाकर कॉपी करें।":"Press and hold the address bar to copy.")}
}
$("#copy-link")?.addEventListener("click",copyLink);
$("#native-share")?.addEventListener("click",async()=>{
  if(navigator.share){try{await navigator.share({title:"Verma Dental World",text:"Dr. Adarsh Verma · Implantologist",url:CANONICAL})}catch(e){if(e.name!=="AbortError")copyLink()}}
  else copyLink();
});

/* ---------- boot ---------- */
applyLang();scene();syncQuick();
window.__vdw={lang:()=>lang,today:todayIST,profile:()=>profile,scene:()=>sceneP};
