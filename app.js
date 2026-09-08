const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const defaultState = {
  theme:"dark", language:"fr", bg:null,
  titles:{notes:"note idée",projects:"projet",motivation:"motivation"},
  notes:[
    {id:1,text:"idée importante",important:true},
    {id:2,text:"toutes les notes",important:false}
  ],
  projects:[],
  quotes:["“easy choices now make harder life, harder choices now makes easy life”"]
};
let state = JSON.parse(localStorage.getItem("ZEN_STATE") || "null") || structuredClone(defaultState);
let currentNoteFilter="all";

function save(){localStorage.setItem("ZEN_STATE",JSON.stringify(state))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function pad(n){return String(n).padStart(2,"0")}
function timeString(){const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`}
function updateClocks(){
  const t=timeString();
  ["homeClock","notesClock","projectsClock","motivationClock","zenTime"].forEach(id=>{const e=$("#"+id);if(e)e.textContent=t});
}
setInterval(updateClocks,1000);updateClocks();

function go(screen){
  $$(".screen").forEach(s=>s.classList.remove("active"));
  $("#screen-"+screen).classList.add("active");
  render();
}
function showZen(){ $("#zenScreen").classList.remove("hidden"); updateClocks() }
function hideZen(){ $("#zenScreen").classList.add("hidden") }

$$(".home-trigger").forEach(b=>b.onclick=()=>go("home"));
$$(".settings-trigger").forEach(b=>b.onclick=()=>go("settings"));
$$(".zen-trigger").forEach(b=>b.onclick=showZen);
$$(".shortcut").forEach(b=>b.onclick=()=>go(b.dataset.go));
$("#zenExit").onclick=hideZen;

function modal(html){
  $("#modalContent").innerHTML=html;
  $("#modal").classList.remove("hidden");
}
function closeModal(){$("#modal").classList.add("hidden");$("#modalContent").innerHTML=""}
$("#modalClose").onclick=closeModal;
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

function renderNotes(){
  $("#notesLabel").textContent=state.titles.notes;
  const list=$("#notesList");
  const notes=currentNoteFilter==="important"?state.notes.filter(n=>n.important):state.notes;
  list.innerHTML=notes.length?notes.map(n=>`
    <div class="note-row">
      <button class="note-text" data-edit-note="${n.id}">${escapeHtml(n.text)}</button>
      <button class="note-btn ${n.important?"important":""}" data-important="${n.id}" title="Idée importante">★</button>
      <button class="note-btn" data-delete-note="${n.id}" title="Supprimer">×</button>
    </div>`).join(""):`<div style="padding:30px;text-align:center;color:#aaa">aucune note ici</div>`;
  $$("[data-important]").forEach(b=>b.onclick=()=>{let n=state.notes.find(x=>x.id==b.dataset.important);n.important=!n.important;save();renderNotes()});
  $$("[data-delete-note]").forEach(b=>b.onclick=()=>{state.notes=state.notes.filter(n=>n.id!=b.dataset.deleteNote);save();renderNotes();toast("note supprimée")});
  $$("[data-edit-note]").forEach(b=>b.onclick=()=>editNote(b.dataset.editNote));
}
function editNote(id){
  const n=state.notes.find(x=>x.id==id);
  modal(`<h2>modifier la note</h2><textarea id="noteText">${escapeHtml(n.text)}</textarea>
  <div class="modal-actions"><button class="secondary" id="cancelModal">annuler</button><button class="primary" id="saveNote">enregistrer</button></div>`);
  $("#cancelModal").onclick=closeModal;
  $("#saveNote").onclick=()=>{n.text=$("#noteText").value.trim()||n.text;save();closeModal();renderNotes()};
}
$("#addNoteBtn").onclick=()=>modal(`<h2>nouvelle note</h2><textarea id="noteText" placeholder="écris ton idée…"></textarea>
<div class="modal-actions"><button class="secondary" id="cancelModal">annuler</button><button class="primary" id="saveNote">ajouter</button></div>`);
document.addEventListener("click",e=>{
 if(e.target.id==="saveNote" && $("#noteText") && !e.target.closest(".modal-card").dataset.editing){
   const v=$("#noteText").value.trim();
   if(v){state.notes.unshift({id:Date.now(),text:v,important:false});save();closeModal();renderNotes()}
 }
});
$$(".pill-nav").forEach(b=>b.onclick=()=>{currentNoteFilter=b.dataset.filter;renderNotes()});

function renderProjects(){
 $("#projectsLabel").textContent=state.titles.projects;
 const list=$("#projectsList");
 list.innerHTML=state.projects.length?state.projects.map(p=>`
 <article class="project-card">
   <strong>${escapeHtml(p.name)}</strong>
   <span class="project-meta">${p.notes.length} note(s) · ${p.photos.length} photo(s)</span>
   <button data-project="${p.id}">ouvrir</button>
 </article>`).join(""):`<div style="grid-column:1/-1;padding:35px;text-align:center;color:#aaa">aucun projet — crée ton premier dossier avec ＋</div>`;
 $$("[data-project]").forEach(b=>b.onclick=()=>openProject(b.dataset.project));
}
$("#addProjectBtn").onclick=()=>newProject();
function newProject(){
 modal(`<h2>nouveau projet</h2><input id="projectName" placeholder="nom du projet">
 <div class="modal-actions"><button class="secondary" id="cancelModal">annuler</button><button class="primary" id="createProject">créer</button></div>`);
 $("#cancelModal").onclick=closeModal;
 $("#createProject").onclick=()=>{const name=$("#projectName").value.trim();if(!name)return;state.projects.unshift({id:Date.now(),name,notes:[],photos:[]});save();closeModal();renderProjects()};
}
function openProject(id){
 const p=state.projects.find(x=>x.id==id);
 modal(`<h2>${escapeHtml(p.name)}</h2>
 <textarea id="projectNote" placeholder="ajouter une note au projet…"></textarea>
 <label class="file-btn">ajouter une photo<input id="projectPhoto" type="file" accept="image/*"></label>
 <div id="projectPhotos" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${p.photos.map(x=>`<img class="photo-preview" src="${x}">`).join("")}</div>
 <h3>notes</h3><div id="projectNotes">${p.notes.map(n=>`<div style="padding:9px;border-bottom:1px solid #fff2">${escapeHtml(n)}</div>`).join("")||"<span style='color:#999'>aucune note</span>"}</div>
 <div class="modal-actions" style="margin-top:15px"><button class="secondary" id="deleteProject">supprimer</button><button class="primary" id="saveProject">enregistrer</button></div>`);
 $("#cancelModal")?.addEventListener("click",closeModal);
 $("#saveProject").onclick=()=>{const n=$("#projectNote").value.trim();if(n)p.notes.push(n);const f=$("#projectPhoto").files[0];if(f){const r=new FileReader();r.onload=()=>{p.photos.push(r.result);save();closeModal();openProject(id)};r.readAsDataURL(f)}else{save();closeModal();renderProjects()}};
 $("#deleteProject").onclick=()=>{state.projects=state.projects.filter(x=>x.id!=id);save();closeModal();renderProjects()};
}
function renderQuotes(){
 $("#motivationLabel").textContent=state.titles.motivation;
 $("#motivationQuote").textContent=state.quotes[0]||"";
 $("#quotesList").innerHTML=state.quotes.slice(1).map((q,i)=>`<div class="quote-card">${escapeHtml(q)}</div>`).join("");
}
$("#addQuoteBtn").onclick=()=>modal(`<h2>nouvelle quote</h2><textarea id="quoteText" placeholder="écris ta quote…"></textarea>
<div class="modal-actions"><button class="secondary" id="cancelModal">annuler</button><button class="primary" id="saveQuote">ajouter</button></div>`);
document.addEventListener("click",e=>{
 if(e.target.id==="saveQuote"){const q=$("#quoteText").value.trim();if(q){state.quotes.push(q);save();closeModal();renderQuotes()}}
});

$$(".edit-title").forEach(b=>b.onclick=()=>{
 const key=b.dataset.title;
 modal(`<h2>renommer le menu</h2><input id="titleValue" value="${escapeHtml(state.titles[key])}">
 <div class="modal-actions"><button class="secondary" id="cancelModal">annuler</button><button class="primary" id="saveTitle">enregistrer</button></div>`);
 $("#cancelModal").onclick=closeModal;
 $("#saveTitle").onclick=()=>{state.titles[key]=$("#titleValue").value.trim()||state.titles[key];save();closeModal();render()};
});

$("#themeSelect").value=state.theme;
$("#languageSelect").value=state.language;
$("#themeSelect").onchange=e=>{state.theme=e.target.value;applySettings();save()};
$("#languageSelect").onchange=e=>{state.language=e.target.value;save();toast(e.target.value==="fr"?"français activé":"English enabled")};
$("#useDefaultBg").onclick=()=>{state.bg=null;save();applySettings();toast("fond restauré")};
$("#bgInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{state.bg=r.result;save();applySettings();toast("fond modifié")};r.readAsDataURL(f)};
$("#resetData").onclick=()=>{if(confirm("Réinitialiser toutes les données de ZEN ?")){state=structuredClone(defaultState);save();applySettings();render();toast("données réinitialisées")}};

function applySettings(){
 document.body.classList.toggle("light",state.theme==="light");
 $("#backgroundLayer").style.backgroundImage=`url("${state.bg||"assets/dubai.jpg"}")`;
 $("#themeSelect").value=state.theme;$("#languageSelect").value=state.language;
}
function render(){renderNotes();renderProjects();renderQuotes();applySettings()}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

// Splash particles
const sp=$("#sparkles");
for(let i=0;i<34;i++){const s=document.createElement("i");s.className="spark";s.style.left=(5+Math.random()*90)+"%";s.style.top=(5+Math.random()*85)+"%";s.style.animationDelay=(-Math.random()*2.6)+"s";s.style.animationDuration=(1.8+Math.random()*2)+"s";sp.appendChild(s)}
applySettings();render();
setTimeout(()=>{$("#splash").classList.add("hidden");$("#mainApp").classList.remove("hidden")},1450);

// Service worker registration
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
