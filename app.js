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
if("IntersectionObserver" in window){
  const io=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting){e.target.classList.remove("pre");io.unobserve(e.target)}}},{rootMargin:"0px 0px -6% 0px",threshold:.05});
  $$("[data-reveal]").forEach(el=>{const r=el.getBoundingClientRect();if(r.top>innerHeight*.92){el.classList.add("pre");io.observe(el)}});
  setTimeout(()=>$$("[data-reveal].pre").forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.remove("pre")}),2500);
}

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

/* ---------- implant scroll scene ---------- */
const track=$("#sceneTrack"), sticky=$("#sceneSticky"), bar=$("#sceneBar"), guide=$("#archGuide"), sceneLabel=$("#sceneLabel");
const stageNames={en:["Full arch","Implant positions","Full-arch restoration"],hi:["पूरा आर्च","इम्प्लांट की जगह","फुल-आर्च रिस्टोरेशन"]};
let sceneP=-1;
function renderSceneLabel(){
  if(!sceneLabel)return;
  const n=stageNames[lang];const i=sceneP<.3?0:sceneP<.68?1:2;
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
  if(guide)guide.style.opacity=p>.2?String(Math.min((p-.2)*2.6,.85)):0;
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
    const d=new Date(e.date+"T12:00:00+05:30");
    const art=document.createElement("article");art.className="event";
    const badge=document.createElement("span");badge.className="ev-date";
    badge.innerHTML=`<b>${new Intl.DateTimeFormat("en-GB",{day:"2-digit",timeZone:"Asia/Kolkata"}).format(d)}</b><i>${new Intl.DateTimeFormat("en-GB",{month:"short",timeZone:"Asia/Kolkata"}).format(d).toUpperCase()}</i>`;
    const body=document.createElement("div");
    const h=document.createElement("strong");h.textContent=e.title;
    const when=document.createElement("p");when.textContent=`${e.city} · ${e.time} IST`;
    const venue=document.createElement("small");venue.textContent=e.venue;
    body.append(h,when,venue);art.append(badge,body);box.append(art);
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

/* ---------- hero parallax ---------- */
const heroMedia=document.querySelector(".hero-media img");
if(heroMedia&&!reduce){
  let raf=0;
  const move=()=>{raf=0;const y=Math.min(scrollY,innerHeight);heroMedia.style.transform=`translate3d(0,${(y*.16).toFixed(1)}px,0) scale(1.04)`};
  addEventListener("scroll",()=>{if(!raf)raf=requestAnimationFrame(move)},{passive:true});
}
/* ---------- boot ---------- */
applyLang();scene();syncQuick();
window.__vdw={lang:()=>lang,today:todayIST,profile:()=>profile,scene:()=>sceneP};
