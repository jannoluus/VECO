const $=(s)=>document.querySelector(s);
const $$=(s)=>Array.from(document.querySelectorAll(s));
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=window.VECO_PAGE||'objects';
const APP_VERSION='v3.11.7.2';
const APP_BUILD='20260606_2148';
let state=window.VECO_STORAGE.load();
state.projects=state.projects||[]; state.workorders=state.workorders||[]; state.acts=state.acts||[]; state.devices=state.devices||[]; state.objects=state.objects||[]; state.clients=state.clients||[]; state.people=state.people||[]; state.absences=state.absences||[]; state.oncall=state.oncall||[];
let selectedObjectId=state.objects?.[0]?.id||'';
let objectTab='overview';
let selectedClientId=state.clients?.[0]?.id||'';
let clientTab='overview';
let selectedProjectId=state.projects?.[0]?.id||'';
let projectTab='overview';
let selectedWorkorderId=state.workorders?.[0]?.id||'';
let selectedActId=state.acts?.[0]?.id||'';
let selectedTeamPersonId='';
const detailOpen={objects:false,projects:false,workorders:false,acts:false};

const pageTitles={calendar:'Kalender',team:'Tiimivaade',objects:'Objektid',projects:'Projektid',workorders:'Töökäsud',acts:'Aktid',oncall:'Valvegraafik',people:'Tehnikud',vacations:'Puhkused',clients:'Kliendid',mobile:'Tehniku vaade',mobilePreview:'Mobiili eelvaade'};
const pageFiles={calendar:'index.html',team:'team.html',objects:'objects.html',projects:'projects.html',workorders:'workorders.html',acts:'acts.html',oncall:'oncall.html',people:'people.html',vacations:'vacations.html',clients:'clients.html',mobile:'mobile.html',mobilePreview:'mobile-preview.html'};

const byId=(arr,id)=>arr.find(x=>x.id===id)||null;
const clientName=(id)=>byId(state.clients,id)?.name||'-';
const techName=(id)=>byId(state.people,id)?.name||'-';
const objectName=(id)=>byId(state.objects,id)?.name||'-';
const projectName=(id)=>byId(state.projects,id)?.name||'-';
const objectClientId=(objectId)=>byId(state.objects,objectId)?.clientId||'';
const projectObjectId=(projectId)=>byId(state.projects,projectId)?.objectId||'';
const projectClientId=(projectId)=>objectClientId(projectObjectId(projectId));
const objectProjects=(id)=>state.projects.filter(p=>p.objectId===id);
const objectWorkorders=(id)=>state.workorders.filter(w=>w.objectId===id);
const objectDevices=(id)=>state.devices.filter(d=>d.objectId===id);
const objectActs=(id)=>state.acts.filter(a=>a.objectId===id);
const clientObjects=(id)=>state.objects.filter(o=>o.clientId===id);
const clientProjects=(id)=>state.projects.filter(p=>clientObjects(id).some(o=>o.id===p.objectId));
const clientWorkorders=(id)=>state.workorders.filter(w=>clientObjects(id).some(o=>o.id===w.objectId));
const clientActs=(id)=>state.acts.filter(a=>clientObjects(id).some(o=>o.id===a.objectId));
const projectWorkorders=(id)=>state.workorders.filter(w=>w.projectId===id);
const projectActs=(id)=>state.acts.filter(a=>projectWorkorders(id).some(w=>w.id===a.workorderId));
const openWorkorders=()=>state.workorders.filter(w=>!['Täidetud','Suletud','Arhiveeritud'].includes(w.status));
const statusClass=(s)=>/töös|aktiivne|planeeritud|täidetud|valmis|saadetud/i.test(s||'')?'ok':/ootel|attention|mustand|pausil/i.test(s||'')?'warn':/deaktiveeritud|seisab|arhiveeritud|suletud/i.test(s||'')?'red':'';
function save(){ state=window.VECO_API?.save ? window.VECO_API.save(state) : window.VECO_STORAGE.save(state); }
function uid(prefix){return `${prefix}-${String(Date.now()).slice(-6)}`}
function icon(i){return `<span class="icon">${i}</span>`}
function nav(){
  const groups=[
    ['Töö',[['calendar','▦'],['team','◫'],['objects','⌂'],['projects','▣'],['workorders','☑'],['acts','▧'],['oncall','☎']]],
    ['Haldus',[['people','☷'],['vacations','▤'],['clients','▥']]],
    ['Arendus',[['mobile','▤'],['mobilePreview','▧']]]
  ];
  const navGroups=groups.map(([title,items])=>`<div class="nav-section"><div class="nav-section-title">${title}</div>${items.map(([key,ic])=>key==='mobile'?`<a class="${page===key?'active':''}" href="${pageFiles[key]}" target="_blank" rel="noopener" title="Ava tehniku vaade uues aknas">${icon('↗')}Tehniku vaade</a>`:`<a class="${page===key?'active':''}" href="${pageFiles[key]}">${icon(ic)}${pageTitles[key]}</a>`).join('')}</div>`).join('');
  return `<aside class="sidebar"><div class="sidebar-actions"><button class="btn ghost sidebar-toggle" id="sidebarToggleBtn" type="button" title="Näita/peida menüü" aria-label="Näita/peida menüü">${icon('☰')}</button><input id="importDataFile" type="file" accept="application/json" class="hidden"></div><nav class="nav nav-grouped" aria-label="Põhivaated">${navGroups}<div class="nav-section"><div class="nav-section-title">Süsteem</div><button type="button" id="databaseBtn">${icon('↔')}Andmebaas: ${window.VECO_API?.modeLabel?.()||'lokaalne'}</button><button type="button" id="exportDataBtn">${icon('⇩')}Varukoopia</button><label class="nav-file-action" for="importDataFile">${icon('⇧')}Taasta</label></div></nav></aside>`
}
function themeLogo(){
  return `<button class="brand-badge brand-theme-toggle" type="button" data-theme-toggle title="Vaheta hele/tume režiim" aria-label="Vaheta hele/tume režiim"><span class="brand-wordmark">VECO</span></button>`;
}
function viewContextText(value){
  return String(value||'').toUpperCase();
}
function header(title,filters='',actions='',context=''){
  const label=viewContextText(context||title);
  if(page==='mobile') return `<div class="panel-head mobile-head"><div><h2>${esc(label)}</h2><span class="muted">Lihtne tehniku töövaade</span></div></div>`;
  return `<div class="panel-head view-head"><div class="view-head-left"><div class="brand-row">${themeLogo()}<h2 class="context-pill view-context-pill">${esc(label)}</h2></div>${filters?`<div class="filter-row">${filters}</div>`:''}</div><div class="view-head-right">${actions?`<div class="action-row">${actions}</div>`:''}</div></div>`
}

function detailHeader(title,actions=''){
  return `<div class="panel-head detail-head"><div class="view-head-left"><h2 class="context-pill">${esc(title)}</h2></div><div class="view-head-right">${actions?`<div class="action-row">${actions}</div>`:''}</div></div>`;
}


function globalTicker(){
  if(page==='mobile') return '';
  const hidden=localStorage.getItem('veco_ticker_hidden')==='true';
  if(hidden){
    return `<button class="global-ticker-restore" id="tickerRestoreBtn" type="button" title="Näita tickerit">▴</button>`;
  }
  const open= openWorkorders();
  const openCount=open.length;
  const draftActs=state.acts.filter(a=>['Mustand','Koostamisel','Saatmata'].includes(a.status)).length;
  const activeObjects=state.objects.filter(o=>o.status!=='inactive'&&o.status!=='Peatatud').length;
  const today=dateKeyFromDate(new Date());
  const todayWork=state.workorders.filter(w=>w.date===today).length;
  const oncallToday=state.oncall.filter(o=>o.start<=today&&o.end>=today).map(o=>techName(o.personId)).filter(Boolean);
  const overdue=open.filter(w=>w.date && w.date<today).length;
  const pageBits={
    calendar:[`${todayWork} täna`, `${openCount} avatud tööd`],
    team:[`${state.people.length} tehnikut`, `${openCount} avatud tööd`, `${state.absences.length} puudumist`],
    objects:[`${activeObjects} aktiivset objekti`, `${state.devices.length} seadet`, `${openCount} avatud tööd`],
    projects:[`${state.projects.length} projekti`, `${state.workorders.length} töökäsku`],
    workorders:[`${openCount} avatud`, overdue?`${overdue} tähtajast üle`:'tähtajad korras'],
    acts:[`${state.acts.length} akti`, `${draftActs} akti ootel`],
    clients:[`${state.clients.length} klienti`, `${activeObjects} objekti`],
    people:[`${state.people.length} tehnikut`, `${state.absences.length} puudumist`],
    vacations:[`${state.absences.length} puudumist`, `${state.people.length} tehnikut`],
    oncall:[oncallToday.length?`Täna valves: ${oncallToday.join(', ')}`:'Täna valvet ei ole']
  };
  const bits=[
    `VECO CRM · ${APP_VERSION}`,
    `Build ${APP_BUILD}`,
    `Vaade: ${pageTitles[page]||page}`,
    `Andmed: ${window.VECO_API?.modeLabel?.()||'lokaalne'}`,
    ...(pageBits[page]||[]),
    oncallToday.length&&page!=='oncall'?`Valve: ${oncallToday.join(', ')}`:'',
    draftActs&&page!=='acts'?`${draftActs} akti ootel`:''
  ].filter(Boolean);
  const items=bits.map(x=>`<span class="global-ticker-item">${esc(x)}</span>`).join('<b>•</b>');
  return `<div class="global-ticker moving" role="status" aria-label="VECO süsteemi staatuseriba"><div class="global-ticker-viewport"><div class="global-ticker-track"><span class="global-ticker-set">${items}</span><span class="global-ticker-set" aria-hidden="true">${items}</span></div></div><button class="global-ticker-close" id="tickerCloseBtn" type="button" title="Peida ticker">×</button></div>`;
}
function shell(main,aside='',opts={}){
  applyTheme();
  const collapsed=page!=='mobile'&&localStorage.getItem('veco_sidebar_collapsed')==='true';
  document.body.innerHTML=`<div class="app page-${page} ${page==='mobile'?'app-mobile':''} ${collapsed?'sidebar-collapsed':''}">${page==='mobile'?'':nav()}<main><section class="content ${(!aside||opts.wide)?'wide':''}"><div class="panel">${main}</div>${aside?`<aside class="panel detail">${aside}</aside>`:''}</section>${globalTicker()}</main></div><div class="modal" id="modal"></div>`;
  bindGlobal();
}
function applyTheme(){
  document.body.classList.toggle('theme-light',localStorage.getItem('veco_theme')==='light');
}
function toggleTheme(){
  const light=!document.body.classList.contains('theme-light');
  localStorage.setItem('veco_theme',light?'light':'dark');
  document.body.classList.toggle('theme-light',light);
}
function bindGlobal(){
  $$('[data-theme-toggle]').forEach(btn=>btn.addEventListener('click',toggleTheme));
  $('#sidebarToggleBtn')?.addEventListener('click',()=>{
    const app=$('.app');
    const collapsed=!app.classList.contains('sidebar-collapsed');
    app.classList.toggle('sidebar-collapsed',collapsed);
    localStorage.setItem('veco_sidebar_collapsed',collapsed?'true':'false');
  });
  $('#databaseBtn')?.addEventListener('click',()=>{ if(window.VECO_API?.configure?.()){ location.reload(); } });
  $('#exportDataBtn')?.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`veco-v3-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#importDataFile')?.addEventListener('change',async e=>{
    const file=e.target.files?.[0];
    if(!file) return;
    try{
      const imported=JSON.parse(await file.text());
      state={...window.VECO_STORAGE.defaultData(),...imported};
      save();
      location.reload();
    }catch(err){
      alert('Varukoopia faili lugemine ebaõnnestus.');
    }finally{
      e.target.value='';
    }
  });
  $('#tickerCloseBtn')?.addEventListener('click',()=>{localStorage.setItem('veco_ticker_hidden','true');renderCurrentPage();});
  $('#tickerRestoreBtn')?.addEventListener('click',()=>{localStorage.setItem('veco_ticker_hidden','false');renderCurrentPage();});
}
function card(title,rows=[],status='',extra=''){
  return `<div class="card"><div class="card-top"><h3>${esc(title)}</h3>${status?`<span class="status ${statusClass(status)}">${esc(status)}</span>`:''}</div>${rows.map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><strong>${esc(v||'-')}</strong></div>`).join('')}${extra}</div>`
}
function table(headers,rows){const body=Array.isArray(rows)?rows.join(''):(rows||'');return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`}
function summaryBox(label,value){return `<div class="summary-box"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`}
function openModal(html){$('#modal').innerHTML=`<div class="dialog">${html}</div>`;$('#modal').classList.add('open')}
function closeModal(){$('#modal').classList.remove('open');$('#modal').innerHTML=''}
function bindClose(){ $('#modalCloseBtn')?.addEventListener('click',closeModal); $('#cancelModalBtn')?.addEventListener('click',closeModal); }

function renderObjects(){
  const clientFilter=$('#objectClientFilter')?.value||'all';
  const techFilter=$('#objectTechFilter')?.value||'all';
  const q=($('#objectSearch')?.value||'').toLowerCase();
  const objects=state.objects.filter(o=>(clientFilter==='all'||o.clientId===clientFilter)&&(techFilter==='all'||o.responsibleTechId===techFilter)&&`${o.name} ${o.address} ${clientName(o.clientId)} ${o.notes}`.toLowerCase().includes(q));
  if(!objects.some(o=>o.id===selectedObjectId)) selectedObjectId=objects[0]?.id||state.objects[0]?.id||'';
  const filters=`<input class="field" id="objectSearch" placeholder="Otsi objekti, aadressi või klienti..." value="${esc(q)}"><select class="select" id="objectClientFilter"><option value="all">Kõik kliendid</option>${state.clients.map(c=>`<option value="${c.id}" ${clientFilter===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><select class="select" id="objectTechFilter"><option value="all">Kõik tehnikud</option>${state.people.map(p=>`<option value="${p.id}" ${techFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn">${icon('↺')}Demoandmed</button><button class="btn primary" id="newObjectBtn">${icon('＋')}Lisa objekt</button>`;
  const rows=objects.map(o=>`<tr data-object-id="${o.id}" class="${detailOpen.objects&&o.id===selectedObjectId?'selected':''}"><td><strong>${esc(o.name)}</strong><div class="muted">${esc(o.address)}</div></td><td>${esc(clientName(o.clientId))}</td><td>${esc(techName(o.responsibleTechId))}</td><td>${objectProjects(o.id).length}</td><td>${objectWorkorders(o.id).filter(w=>!['Täidetud','Suletud'].includes(w.status)).length}</td><td><span class="status ${statusClass(o.status)}">${o.status==='active'?'Aktiivne':'Peatatud'}</span></td></tr>`);
  const main=header('Objektide töövaade',filters,actions,'Objektid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Objekte',state.objects.length)}${summaryBox('Seadmeid',state.devices.length)}${summaryBox('Projekte',state.projects.length)}${summaryBox('Avatud töid',openWorkorders().length)}</div>${table(['Objekt','Klient','Vastutaja','Projektid','Avatud tööd','Staatus'],rows)}</div>`;
  shell(main,detailOpen.objects?objectDetailHtml():'');
  $('#objectSearch')?.addEventListener('input',renderObjects); $('#objectClientFilter')?.addEventListener('change',renderObjects); $('#objectTechFilter')?.addEventListener('change',renderObjects);
  $$('[data-object-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.objectId; if(detailOpen.objects&&selectedObjectId===id){detailOpen.objects=false;}else{selectedObjectId=id;detailOpen.objects=true;} renderObjects();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedObjectId=state.objects[0]?.id||'';detailOpen.objects=false;renderObjects();});
  $('#newObjectBtn')?.addEventListener('click',()=>openObjectModal()); bindObjectDetail();
}
function objectDetailHtml(){
  const o=byId(state.objects,selectedObjectId); if(!o) return detailHeader('Objekti detail')+`<div class="detail-body"><span class="muted">Vali objekt.</span></div>`;
  const tabs=[['overview','Üldinfo'],['devices','Seadmed'],['projects','Projektid'],['workorders','Töökäsud'],['acts','Aktid']];
  let body='';
  if(objectTab==='overview') body=`<div class="summary-grid">${summaryBox('Seadmeid',objectDevices(o.id).length)}${summaryBox('Projekte',objectProjects(o.id).length)}${summaryBox('Töökäske',objectWorkorders(o.id).length)}${summaryBox('Akte',objectActs(o.id).length)}</div>${card(o.name,[['Klient',clientName(o.clientId)],['Aadress',o.address],['Vastutaja',techName(o.responsibleTechId)],['Hooldusleping',o.contract],['Kontakt',o.mainContact]],o.status==='active'?'Aktiivne':'Peatatud',`<div class="section-title">Märkused</div><div class="muted">${esc(o.notes)}</div>`)}<div class="section-title">Kontaktid</div><div class="list">${(o.contacts||[]).map(c=>`<div class="event-row"><strong>${esc(c.name)} · ${esc(c.role)}</strong><span class="muted">${esc(c.phone)} · ${esc(c.email)}</span></div>`).join('')||'<span class="muted">Kontaktid puuduvad.</span>'}</div>`;
  if(objectTab==='devices') body=`<div class="list">${objectDevices(o.id).map(d=>`<div class="event-row"><strong>${esc(d.name)} · ${esc(d.type)}</strong><span class="muted">${esc(d.location)} · hooldus: ${esc(d.serviceInterval)}</span><span class="status ${d.status==='ok'?'ok':'warn'}">${d.status==='ok'?'Korras':'Tähelepanu'}</span></div>`).join('')||'<span class="muted">Seadmeid pole.</span>'}</div>`;
  if(objectTab==='projects') body=`<div class="list">${objectProjects(o.id).map(p=>`<div class="event-row"><strong>${esc(p.name)}</strong><span class="muted">Vastutaja: ${esc(techName(p.responsibleTechId))} · tähtaeg ${esc(p.deadline)}</span><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></div>`).join('')||'<span class="muted">Projekte pole.</span>'}</div>`;
  if(objectTab==='workorders') body=`<div class="list">${objectWorkorders(o.id).map(w=>`<div class="event-row"><strong>${esc(w.date)} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(techName(w.technicianId))} · ${esc(w.description)}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töökäske pole.</span>'}</div>`;
  if(objectTab==='acts') body=`<div class="list">${objectActs(o.id).map(a=>`<div class="event-row"><strong>${esc(a.date)} · ${esc(a.title)}</strong><span class="muted">Seotud töökäsk: ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  return detailHeader('Objekti detail','<button class="btn small" id="editObjectBtn">✎ Muuda</button><button class="btn small primary" id="addWorkorderBtn">＋ Töökäsk</button><button class="btn small ghost" id="objectDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${objectTab===k?'active':''}" data-object-tab="${k}">${t}</button>`).join('')}</div>${body}</div>`;
}
function bindObjectDetail(){ $$('[data-object-tab]').forEach(b=>b.addEventListener('click',()=>{objectTab=b.dataset.objectTab;renderObjects();})); $('#editObjectBtn')?.addEventListener('click',()=>openObjectModal(selectedObjectId)); $('#addWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal('',{objectId:selectedObjectId})); $('#objectDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.objects=false;renderObjects();}); }
function openObjectModal(id='',defaults={}){
  const o=id?byId(state.objects,id):{clientId:defaults.clientId||state.clients[0]?.id||'',name:'',address:'',mainContact:'',responsibleTechId:state.people[0]?.id||'',contract:'Jah',status:'active',notes:'',contacts:[]};
  openModal(`<form id="objectForm"><div class="dialog-head"><h2>${id?'Muuda objekti':'Lisa objekt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Objekti nimi<input class="field" name="name" required value="${esc(o.name)}"></label><label>Klient<select class="select" name="clientId">${state.clients.map(c=>`<option value="${c.id}" ${o.clientId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label class="full">Aadress<input class="field" name="address" required value="${esc(o.address)}"></label><label>Kontakt<input class="field" name="mainContact" value="${esc(o.mainContact)}"></label><label>Vastutaja<select class="select" name="responsibleTechId">${state.people.map(p=>`<option value="${p.id}" ${o.responsibleTechId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Hooldusleping<input class="field" name="contract" value="${esc(o.contract)}"></label><label>Staatus<select class="select" name="status"><option value="active" ${o.status==='active'?'selected':''}>Aktiivne</option><option value="inactive" ${o.status!=='active'?'selected':''}>Peatatud</option></select></label><label class="full">Märkused<textarea name="notes">${esc(o.notes)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#objectForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('O'),clientId:f.clientId.value,name:f.name.value,address:f.address.value,mainContact:f.mainContact.value,responsibleTechId:f.responsibleTechId.value,contract:f.contract.value,status:f.status.value,notes:f.notes.value,contacts:o.contacts||[]}; if(id){Object.assign(o,next)}else{state.objects.push(next);selectedObjectId=next.id;detailOpen.objects=true} save();closeModal(); page==='clients'?renderClients():renderObjects();});
}

function renderClients(){
  const status=$('#clientStatusFilter')?.value||'all'; const q=($('#clientSearch')?.value||'').toLowerCase();
  const clients=state.clients.filter(c=>(status==='all'||(status==='active')===!!c.active)&&`${c.name} ${c.contact} ${c.email} ${c.notes}`.toLowerCase().includes(q));
  if(!clients.some(c=>c.id===selectedClientId)) selectedClientId=clients[0]?.id||state.clients[0]?.id||'';
  const filters=`<input class="field" id="clientSearch" placeholder="Otsi klienti..." value="${esc(q)}"><select class="select" id="clientStatusFilter"><option value="all">Kõik kliendid</option><option value="active" ${status==='active'?'selected':''}>Aktiivsed</option><option value="inactive" ${status==='inactive'?'selected':''}>Peatatud</option></select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn">${icon('↺')}Demoandmed</button><button class="btn primary" id="newClientBtn">${icon('＋')}Lisa klient</button>`;
  const rows=clients.map(c=>{const objs=clientObjects(c.id),pros=clientProjects(c.id),wo=clientWorkorders(c.id).filter(w=>!['Täidetud','Suletud'].includes(w.status));return `<tr data-client-id="${c.id}" class="${c.id===selectedClientId?'selected':''}"><td><strong>${esc(c.name)}</strong><div class="muted">${esc(c.regNo)}</div></td><td>${esc(c.contact)}</td><td>${esc(c.phone)}</td><td>${objs.length}</td><td>${pros.length}</td><td>${wo.length}</td><td><span class="status ${c.active?'ok':'red'}">${c.active?'Aktiivne':'Peatatud'}</span></td></tr>`});
  const main=header('Klientide register',filters,actions,'Kliendid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Kliente',state.clients.length)}${summaryBox('Objekte',state.objects.length)}${summaryBox('Projekte',state.projects.length)}${summaryBox('Avatud töid',openWorkorders().length)}</div>${table(['Klient','Kontakt','Telefon','Objektid','Projektid','Avatud tööd','Staatus'],rows)}</div>`;
  shell(main,clientDetailHtml()); $('#clientSearch')?.addEventListener('input',renderClients); $('#clientStatusFilter')?.addEventListener('change',renderClients);
  $$('[data-client-id]').forEach(row=>row.addEventListener('click',()=>{selectedClientId=row.dataset.clientId;renderClients();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedClientId=state.clients[0]?.id||'';renderClients();}); $('#newClientBtn')?.addEventListener('click',()=>openClientModal()); bindClientDetail();
}
function clientDetailHtml(){
  const c=byId(state.clients,selectedClientId); if(!c) return detailHeader('Kliendi detail')+`<div class="detail-body"><span class="muted">Vali klient.</span></div>`;
  const tabs=[['overview','Üldinfo'],['objects','Objektid'],['projects','Projektid'],['workorders','Töökäsud'],['acts','Aktid']];
  const objs=clientObjects(c.id), projects=clientProjects(c.id), workorders=clientWorkorders(c.id), acts=clientActs(c.id); let body='';
  if(clientTab==='overview') body=`<div class="summary-grid">${summaryBox('Objekte',objs.length)}${summaryBox('Projekte',projects.length)}${summaryBox('Töökäske',workorders.length)}${summaryBox('Akte',acts.length)}</div>${card(c.name,[['Registrikood',c.regNo],['Kontakt',c.contact],['Telefon',c.phone],['E-post',c.email],['Arve e-post',c.invoiceEmail]],c.active?'Aktiivne':'Peatatud',`<div class="section-title">Märkused</div><div class="muted">${esc(c.notes)}</div>`)}<div class="section-title">Kiirülevaade</div><div class="list"><div class="event-row"><strong>Objektid</strong><span class="muted">${objs.map(o=>o.name).join(', ')||'Puuduvad'}</span></div><div class="event-row"><strong>Avatud tööd</strong><span class="muted">${workorders.filter(w=>!['Täidetud','Suletud'].includes(w.status)).map(w=>`${w.date} · ${w.title}`).join(', ')||'Puuduvad'}</span></div></div>`;
  if(clientTab==='objects') body=`<div class="list">${objs.map(o=>`<div class="event-row"><strong>${esc(o.name)}</strong><span class="muted">${esc(o.address)} · vastutaja ${esc(techName(o.responsibleTechId))}</span><span class="status ${o.status==='active'?'ok':'red'}">${o.status==='active'?'Aktiivne':'Peatatud'}</span></div>`).join('')||'<span class="muted">Objekte pole.</span>'}</div>`;
  if(clientTab==='projects') body=`<div class="list">${projects.map(p=>`<div class="event-row"><strong>${esc(p.name)}</strong><span class="muted">Objekt: ${esc(objectName(p.objectId))} · tähtaeg ${esc(p.deadline)}</span><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></div>`).join('')||'<span class="muted">Projekte pole.</span>'}</div>`;
  if(clientTab==='workorders') body=`<div class="list">${workorders.map(w=>`<div class="event-row"><strong>${esc(w.date)} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(objectName(w.objectId))} · ${esc(techName(w.technicianId))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töökäske pole.</span>'}</div>`;
  if(clientTab==='acts') body=`<div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(a.date)} · ${esc(a.title)}</strong><span class="muted">Objekt: ${esc(objectName(a.objectId))} · töökäsk ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  return detailHeader('Kliendi detail','<button class="btn small" id="editClientBtn">✎ Muuda</button><button class="btn small primary" id="addClientObjectBtn">＋ Objekt</button>')+`<div class="detail-body"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${clientTab===k?'active':''}" data-client-tab="${k}">${t}</button>`).join('')}</div>${body}</div>`;
}
function bindClientDetail(){ $$('[data-client-tab]').forEach(b=>b.addEventListener('click',()=>{clientTab=b.dataset.clientTab;renderClients();})); $('#editClientBtn')?.addEventListener('click',()=>openClientModal(selectedClientId)); $('#addClientObjectBtn')?.addEventListener('click',()=>openObjectModal('',{clientId:selectedClientId})); }
function openClientModal(id=''){
  const c=id?byId(state.clients,id):{name:'',regNo:'',contact:'',phone:'',email:'',invoiceEmail:'',active:true,notes:''};
  openModal(`<form id="clientForm"><div class="dialog-head"><h2>${id?'Muuda klienti':'Lisa klient'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Kliendi nimi<input class="field" name="name" required value="${esc(c.name)}"></label><label>Registrikood<input class="field" name="regNo" value="${esc(c.regNo)}"></label><label>Kontaktisik<input class="field" name="contact" value="${esc(c.contact)}"></label><label>Telefon<input class="field" name="phone" value="${esc(c.phone)}"></label><label>E-post<input class="field" name="email" type="email" value="${esc(c.email)}"></label><label>Arve e-post<input class="field" name="invoiceEmail" type="email" value="${esc(c.invoiceEmail)}"></label><label>Staatus<select class="select" name="active"><option value="true" ${c.active?'selected':''}>Aktiivne</option><option value="false" ${!c.active?'selected':''}>Peatatud</option></select></label><label class="full">Märkused<textarea name="notes">${esc(c.notes)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#clientForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('C'),name:f.name.value,regNo:f.regNo.value,contact:f.contact.value,phone:f.phone.value,email:f.email.value,invoiceEmail:f.invoiceEmail.value,active:f.active.value==='true',notes:f.notes.value}; if(id){Object.assign(c,next)}else{state.clients.push(next);selectedClientId=next.id} save();closeModal();renderClients();});
}

function renderProjects(){
  const status=$('#projectStatusFilter')?.value||'all'; const client=$('#projectClientFilter')?.value||'all'; const q=($('#projectSearch')?.value||'').toLowerCase();
  const projects=state.projects.filter(p=>(status==='all'||p.status===status)&&(client==='all'||projectClientId(p.id)===client)&&`${p.name} ${p.description} ${objectName(p.objectId)} ${clientName(projectClientId(p.id))}`.toLowerCase().includes(q));
  if(!projects.some(p=>p.id===selectedProjectId)) selectedProjectId=projects[0]?.id||state.projects[0]?.id||'';
  const statuses=[...new Set(state.projects.map(p=>p.status))];
  const filters=`<input class="field" id="projectSearch" placeholder="Otsi projekti..." value="${esc(q)}"><select class="select" id="projectClientFilter"><option value="all">Kõik kliendid</option>${state.clients.map(c=>`<option value="${c.id}" ${client===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><select class="select" id="projectStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn">${icon('↺')}Demoandmed</button><button class="btn primary" id="newProjectBtn">${icon('＋')}Lisa projekt</button>`;
  const rows=projects.map(p=>`<tr data-project-id="${p.id}" class="${detailOpen.projects&&p.id===selectedProjectId?'selected':''}"><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.description)}</div></td><td>${esc(clientName(projectClientId(p.id)))}</td><td>${esc(objectName(p.objectId))}</td><td>${esc(techName(p.responsibleTechId))}</td><td>${esc(p.deadline)}</td><td>${projectWorkorders(p.id).length}</td><td><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></td></tr>`);
  const main=header('Projektide register',filters,actions,'Projektid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Projekte',state.projects.length)}${summaryBox('Töökäske',state.workorders.length)}${summaryBox('Avatud töid',openWorkorders().length)}${summaryBox('Akte',state.acts.length)}</div>${table(['Projekt','Klient','Objekt','Vastutaja','Tähtaeg','Töökäsud','Staatus'],rows)}</div>`;
  shell(main,detailOpen.projects?projectDetailHtml():''); $('#projectSearch')?.addEventListener('input',renderProjects); $('#projectClientFilter')?.addEventListener('change',renderProjects); $('#projectStatusFilter')?.addEventListener('change',renderProjects);
  $$('[data-project-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.projectId; if(detailOpen.projects&&selectedProjectId===id){detailOpen.projects=false;}else{selectedProjectId=id;detailOpen.projects=true;} renderProjects();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedProjectId=state.projects[0]?.id||'';detailOpen.projects=false;renderProjects();}); $('#newProjectBtn')?.addEventListener('click',()=>openProjectModal()); bindProjectDetail();
}
function projectDetailHtml(){
  const p=byId(state.projects,selectedProjectId); if(!p) return detailHeader('Projekti detail')+`<div class="detail-body"><span class="muted">Vali projekt.</span></div>`;
  const tabs=[['overview','Üldinfo'],['workorders','Töökäsud'],['acts','Aktid']]; const wos=projectWorkorders(p.id), acts=projectActs(p.id); let body='';
  if(projectTab==='overview') body=`<div class="summary-grid">${summaryBox('Töökäske',wos.length)}${summaryBox('Avatud',wos.filter(w=>!['Täidetud','Suletud'].includes(w.status)).length)}${summaryBox('Akte',acts.length)}${summaryBox('Tähtaeg',p.deadline)}</div>${card(p.name,[['Klient',clientName(projectClientId(p.id))],['Objekt',objectName(p.objectId)],['Vastutaja',techName(p.responsibleTechId)],['Tähtaeg',p.deadline]],p.status,`<div class="section-title">Kirjeldus</div><div class="muted">${esc(p.description)}</div>`)}`;
  if(projectTab==='workorders') body=`<div class="list">${wos.map(w=>`<div class="event-row"><strong>${esc(w.date)} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(techName(w.technicianId))} · ${esc(w.description)}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töökäske pole.</span>'}</div>`;
  if(projectTab==='acts') body=`<div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(a.date)} · ${esc(a.title)}</strong><span class="muted">Töökäsk: ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  return detailHeader('Projekti detail','<button class="btn small" id="editProjectBtn">✎ Muuda</button><button class="btn small primary" id="addProjectWorkorderBtn">＋ Töökäsk</button><button class="btn small ghost" id="projectDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${projectTab===k?'active':''}" data-project-tab="${k}">${t}</button>`).join('')}</div>${body}</div>`;
}
function bindProjectDetail(){ $$('[data-project-tab]').forEach(b=>b.addEventListener('click',()=>{projectTab=b.dataset.projectTab;renderProjects();})); $('#editProjectBtn')?.addEventListener('click',()=>openProjectModal(selectedProjectId)); $('#addProjectWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal('',{projectId:selectedProjectId,objectId:projectObjectId(selectedProjectId)})); $('#projectDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.projects=false;renderProjects();}); }
function openProjectModal(id=''){
  const p=id?byId(state.projects,id):{objectId:state.objects[0]?.id||'',name:'',responsibleTechId:state.people[0]?.id||'',status:'Planeeritud',deadline:'',description:''};
  openModal(`<form id="projectForm"><div class="dialog-head"><h2>${id?'Muuda projekti':'Lisa projekt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Projekti nimi<input class="field" name="name" required value="${esc(p.name)}"></label><label>Objekt<select class="select" name="objectId">${state.objects.map(o=>`<option value="${o.id}" ${p.objectId===o.id?'selected':''}>${esc(o.name)} · ${esc(clientName(o.clientId))}</option>`).join('')}</select></label><label>Vastutaja<select class="select" name="responsibleTechId">${state.people.map(t=>`<option value="${t.id}" ${p.responsibleTechId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label>Staatus<select class="select" name="status">${['Planeeritud','Töös','Ootel','Pausil','Täidetud','Arhiveeritud'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Tähtaeg<input class="field" name="deadline" type="date" value="${esc(p.deadline)}"></label><label class="full">Kirjeldus<textarea name="description">${esc(p.description)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#projectForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('PRJ'),objectId:f.objectId.value,name:f.name.value,responsibleTechId:f.responsibleTechId.value,status:f.status.value,deadline:f.deadline.value,description:f.description.value}; if(id){Object.assign(p,next)}else{state.projects.push(next);selectedProjectId=next.id;detailOpen.projects=true} save();closeModal();renderProjects();});
}

function renderWorkorders(){
  const status=$('#woStatusFilter')?.value||'all'; const tech=$('#woTechFilter')?.value||'all'; const q=($('#woSearch')?.value||'').toLowerCase();
  const statuses=[...new Set(state.workorders.map(w=>w.status))];
  const list=state.workorders.filter(w=>(status==='all'||w.status===status)&&(tech==='all'||w.technicianId===tech)&&`${w.title} ${w.description} ${objectName(w.objectId)} ${projectName(w.projectId)}`.toLowerCase().includes(q));
  if(!list.some(w=>w.id===selectedWorkorderId)) selectedWorkorderId=list[0]?.id||state.workorders[0]?.id||'';
  const filters=`<input class="field" id="woSearch" placeholder="Otsi töökäsku..." value="${esc(q)}"><select class="select" id="woTechFilter"><option value="all">Kõik tehnikud</option>${state.people.map(p=>`<option value="${p.id}" ${tech===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><select class="select" id="woStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn">${icon('↺')}Demoandmed</button><button class="btn primary" id="newWorkorderBtn">${icon('＋')}Lisa töökäsk</button>`;
  const rows=list.map(w=>`<tr data-workorder-id="${w.id}" class="${detailOpen.workorders&&w.id===selectedWorkorderId?'selected':''}"><td><strong>${esc(w.title)}</strong><div class="muted">${esc(w.description)}</div></td><td>${esc(w.date)} ${esc(w.time)}</td><td>${esc(clientName(objectClientId(w.objectId)))}</td><td>${esc(objectName(w.objectId))}</td><td>${esc(projectName(w.projectId))}</td><td>${esc(techName(w.technicianId))}</td><td><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></td></tr>`);
  const main=header('Töökäsud',filters,actions,'Töökäsud')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Töökäske',state.workorders.length)}${summaryBox('Avatud',openWorkorders().length)}${summaryBox('Täidetud',state.workorders.filter(w=>w.status==='Täidetud').length)}${summaryBox('Aktid',state.acts.length)}</div>${table(['Töö','Aeg','Klient','Objekt','Projekt','Tehnik','Staatus'],rows)}</div>`;
  shell(main,detailOpen.workorders?workorderDetailHtml():''); $('#woSearch')?.addEventListener('input',renderWorkorders); $('#woTechFilter')?.addEventListener('change',renderWorkorders); $('#woStatusFilter')?.addEventListener('change',renderWorkorders);
  $$('[data-workorder-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.workorderId; if(detailOpen.workorders&&selectedWorkorderId===id){detailOpen.workorders=false;}else{selectedWorkorderId=id;detailOpen.workorders=true;} renderWorkorders();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedWorkorderId=state.workorders[0]?.id||'';detailOpen.workorders=false;renderWorkorders();}); $('#newWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal()); bindWorkorderDetail();
}
function workorderDetailHtml(){
  const w=byId(state.workorders,selectedWorkorderId); if(!w) return detailHeader('Töökäsu detail')+`<div class="detail-body"><span class="muted">Vali töökäsk.</span></div>`;
  const acts=state.acts.filter(a=>a.workorderId===w.id);
  const body=`<div class="summary-grid">${summaryBox('Aktid',acts.length)}${summaryBox('Kuupäev',w.date)}${summaryBox('Kell',w.time)}${summaryBox('Staatus',w.status)}</div>${card(w.title,[['Klient',clientName(objectClientId(w.objectId))],['Objekt',objectName(w.objectId)],['Projekt',projectName(w.projectId)],['Tehnik',techName(w.technicianId)],['Aeg',`${w.date} ${w.time}`]],w.status,`<div class="section-title">Kirjeldus</div><div class="muted">${esc(w.description)}</div>`)}<div class="section-title">Aktid</div><div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(a.date)} · ${esc(a.title)}</strong><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  return detailHeader('Töökäsu detail','<button class="btn small" id="editWorkorderBtn">✎ Muuda</button><button class="btn small primary" id="createActBtn">＋ Loo akt</button><button class="btn small ghost" id="workorderDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body">${body}</div>`;
}
function bindWorkorderDetail(){ $('#editWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal(selectedWorkorderId)); $('#createActBtn')?.addEventListener('click',()=>openActModal('',{workorderId:selectedWorkorderId})); $('#workorderDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.workorders=false;renderWorkorders();}); }
function openWorkorderModal(id='',defaults={}){
  const w=id?byId(state.workorders,id):{projectId:defaults.projectId||state.projects[0]?.id||'',objectId:defaults.objectId||projectObjectId(defaults.projectId)||state.objects[0]?.id||'',title:defaults.title||'',date:defaults.date||'',time:defaults.time||'09:00',technicianId:defaults.technicianId||state.people[0]?.id||'',status:defaults.status||'Planeeritud',description:defaults.description||''};
  openModal(`<form id="workorderForm"><div class="dialog-head"><h2>${id?'Muuda töökäsku':'Lisa töökäsk'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Töö nimetus<input class="field" name="title" required value="${esc(w.title)}"></label><label>Objekt<select class="select" name="objectId">${state.objects.map(o=>`<option value="${o.id}" ${w.objectId===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label>Projekt<select class="select" name="projectId"><option value="">Projektita</option>${state.projects.map(p=>`<option value="${p.id}" ${w.projectId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Kuupäev<input class="field" name="date" type="date" value="${esc(w.date)}"></label><label>Kell<input class="field" name="time" type="time" value="${esc(w.time)}"></label><label>Tehnik<select class="select" name="technicianId">${state.people.map(p=>`<option value="${p.id}" ${w.technicianId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Staatus<select class="select" name="status">${['Uus','Planeeritud','Töös','Ootel','Pausil','Täidetud','Suletud'].map(s=>`<option ${w.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="full">Kirjeldus<textarea name="description">${esc(w.description)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#workorderForm').elements.projectId?.addEventListener('change',e=>{const oid=projectObjectId(e.target.value); if(oid) $('#workorderForm').elements.objectId.value=oid;});
  $('#workorderForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('WO'),projectId:f.projectId.value,objectId:f.objectId.value,title:f.title.value,date:f.date.value,time:f.time.value,technicianId:f.technicianId.value,status:f.status.value,description:f.description.value}; if(id){Object.assign(w,next)}else{state.workorders.push(next);selectedWorkorderId=next.id;detailOpen.workorders=true} save();closeModal(); if(page==='calendar') renderCalendar(); else if(page==='projects') renderProjects(); else if(page==='objects') renderObjects(); else renderWorkorders();});
}

function renderActs(){
  const status=$('#actStatusFilter')?.value||'all'; const q=($('#actSearch')?.value||'').toLowerCase(); const statuses=[...new Set(state.acts.map(a=>a.status))];
  const list=state.acts.filter(a=>(status==='all'||a.status===status)&&`${a.title} ${objectName(a.objectId)} ${a.workorderId}`.toLowerCase().includes(q));
  if(!list.some(a=>a.id===selectedActId)) selectedActId=list[0]?.id||state.acts[0]?.id||'';
  const filters=`<input class="field" id="actSearch" placeholder="Otsi akti..." value="${esc(q)}"><select class="select" id="actStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn">${icon('↺')}Demoandmed</button><button class="btn primary" id="newActBtn">${icon('＋')}Lisa akt</button>`;
  const rows=list.map(a=>{const w=byId(state.workorders,a.workorderId)||{};return `<tr data-act-id="${a.id}" class="${detailOpen.acts&&a.id===selectedActId?'selected':''}"><td><strong>${esc(a.title)}</strong><div class="muted">${esc(a.id)}</div></td><td>${esc(a.date)}</td><td>${esc(clientName(objectClientId(a.objectId)))}</td><td>${esc(objectName(a.objectId))}</td><td>${esc(w.title||a.workorderId)}</td><td><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></td></tr>`});
  const main=header('Aktid',filters,actions,'Aktid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Akte',state.acts.length)}${summaryBox('Mustandeid',state.acts.filter(a=>a.status==='Mustand').length)}${summaryBox('Saadetud',state.acts.filter(a=>a.status==='Saadetud').length)}${summaryBox('Töökäske',state.workorders.length)}</div>${table(['Akt','Kuupäev','Klient','Objekt','Töökäsk','Staatus'],rows)}</div>`;
  shell(main,detailOpen.acts?actDetailHtml():''); $('#actSearch')?.addEventListener('input',renderActs); $('#actStatusFilter')?.addEventListener('change',renderActs);
  $$('[data-act-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.actId; if(detailOpen.acts&&selectedActId===id){detailOpen.acts=false;}else{selectedActId=id;detailOpen.acts=true;} renderActs();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedActId=state.acts[0]?.id||'';detailOpen.acts=false;renderActs();}); $('#newActBtn')?.addEventListener('click',()=>openActModal()); bindActDetail();
}
function actDetailHtml(){
  const a=byId(state.acts,selectedActId); if(!a) return detailHeader('Akti detail')+`<div class="detail-body"><span class="muted">Vali akt.</span></div>`;
  const w=byId(state.workorders,a.workorderId)||{};
  const body=`<div class="summary-grid">${summaryBox('Kuupäev',a.date)}${summaryBox('Staatus',a.status)}${summaryBox('Objekt',objectName(a.objectId))}${summaryBox('Töökäsk',a.workorderId)}</div>${card(a.title,[['Klient',clientName(objectClientId(a.objectId))],['Objekt',objectName(a.objectId)],['Töökäsk',w.title||a.workorderId],['Kuupäev',a.date]],a.status,`<div class="section-title">Märkused</div><div class="muted">PDF genereerimine tuleb järgmises etapis. Praegu on akt seotud töökäsu ja objektiga.</div>`)}`;
  return detailHeader('Akti detail','<button class="btn small" id="editActBtn">✎ Muuda</button><button class="btn small primary" id="markActSentBtn">↗ Märgi saadetuks</button><button class="btn small ghost" id="actDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body">${body}</div>`;
}
function bindActDetail(){ $('#editActBtn')?.addEventListener('click',()=>openActModal(selectedActId)); $('#markActSentBtn')?.addEventListener('click',()=>{const a=byId(state.acts,selectedActId); if(a){a.status='Saadetud'; save(); renderActs();}}); $('#actDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.acts=false;renderActs();}); }
function openActModal(id='',defaults={}){
  const a=id?byId(state.acts,id):{workorderId:defaults.workorderId||state.workorders[0]?.id||'',objectId:defaults.objectId||byId(state.workorders,defaults.workorderId)?.objectId||state.objects[0]?.id||'',date:'',title:'',status:'Mustand'};
  openModal(`<form id="actForm"><div class="dialog-head"><h2>${id?'Muuda akti':'Lisa akt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Akti nimetus<input class="field" name="title" required value="${esc(a.title)}"></label><label>Töökäsk<select class="select" name="workorderId">${state.workorders.map(w=>`<option value="${w.id}" ${a.workorderId===w.id?'selected':''}>${esc(w.id)} · ${esc(w.title)}</option>`).join('')}</select></label><label>Objekt<select class="select" name="objectId">${state.objects.map(o=>`<option value="${o.id}" ${a.objectId===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label>Kuupäev<input class="field" name="date" type="date" value="${esc(a.date)}"></label><label>Staatus<select class="select" name="status">${['Mustand','Valmis','Saadetud','Arhiveeritud'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#actForm').elements.workorderId?.addEventListener('change',e=>{const oid=byId(state.workorders,e.target.value)?.objectId; if(oid) $('#actForm').elements.objectId.value=oid;});
  $('#actForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('ACT'),workorderId:f.workorderId.value,objectId:f.objectId.value,date:f.date.value,title:f.title.value,status:f.status.value}; if(id){Object.assign(a,next)}else{state.acts.push(next);selectedActId=next.id;detailOpen.acts=true} save();closeModal(); if(page==='workorders') renderWorkorders(); else renderActs();});
}

function renderPeople(){
  const status=$('#peopleStatusFilter')?.value||'active';
  const q=($('#peopleSearch')?.value||'').toLowerCase();
  const list=state.people.filter(p=>{
    const statusOk=status==='all'||(status==='active'?p.active:!p.active);
    const hay=`${p.name} ${p.role} ${p.phone} ${p.email} ${p.region} ${p.skills}`.toLowerCase();
    return statusOk && hay.includes(q);
  });
  const filters=`<input class="field" id="peopleSearch" placeholder="Otsi kasutajat..." value="${esc(q)}"><select class="select" id="peopleStatusFilter"><option value="active" ${status==='active'?'selected':''}>Aktiivsed</option><option value="inactive" ${status==='inactive'?'selected':''}>Deaktiveeritud</option><option value="all" ${status==='all'?'selected':''}>Kõik kasutajad</option></select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn">${icon('↺')}Demoandmed</button><button class="btn primary" id="newPersonBtn">${icon('＋')}Lisa kasutaja</button>`;
  const rows=list.map(p=>`<tr data-person-id="${p.id}"><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.id)}</div></td><td>${esc(p.role||'-')}</td><td>${esc(p.phone||'-')}</td><td>${esc(p.email||'-')}</td><td>${esc(p.region||'-')}</td><td><span class="status ${p.active?'ok':'red'}">${p.active?'Aktiivne':'Deaktiveeritud'}</span></td><td><button class="btn small" data-edit-person="${p.id}" type="button">Muuda</button> <button class="btn small ${p.active?'danger':'primary'}" data-toggle-person="${p.id}" type="button">${p.active?'Deaktiveeri':'Aktiveeri'}</button> <button class="btn small danger" data-delete-person="${p.id}" type="button">Kustuta</button></td></tr>`).join('');
  const main=header('Tehnikute administreerimine',filters,actions,'TEHNIKUD')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Kasutajaid',state.people.length)}${summaryBox('Aktiivseid',state.people.filter(p=>p.active).length)}${summaryBox('Tehnikuid',state.people.filter(p=>p.role==='Tehnik').length)}${summaryBox('Demo',state.people.filter(p=>p.role==='Demo').length)}</div>${table(['Nimi','Roll','Telefon','E-post','Piirkond','Staatus','Tegevused'],rows)}</div>`;
  shell(main,'',{wide:true});
  $('#peopleSearch')?.addEventListener('input',renderPeople);
  $('#peopleStatusFilter')?.addEventListener('change',renderPeople);
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();renderPeople();});
  $('#newPersonBtn')?.addEventListener('click',()=>openPersonModal());
  $$('[data-edit-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openPersonModal(btn.dataset.editPerson);}));
  $$('[data-toggle-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const p=byId(state.people,btn.dataset.togglePerson);if(p){p.active=!p.active;save();renderPeople();}}));
  $$('[data-delete-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const id=btn.dataset.deletePerson;const p=byId(state.people,id);if(!p)return;const used=state.workorders.some(w=>w.technicianId===id)||state.projects.some(pr=>pr.responsibleTechId===id)||state.objects.some(o=>o.responsibleTechId===id)||state.absences.some(a=>a.personId===id)||state.oncall.some(o=>o.personId===id);const msg=used?`Kasutaja ${p.name} on seotud tööde/objektidega. Kustutamine võib jätta viited tühjaks. Kas kustutada?`:`Kas kustutada kasutaja ${p.name}?`;if(confirm(msg)){state.people=state.people.filter(x=>x.id!==id);save();renderPeople();}}));
}
function openPersonModal(id=''){
  const p=id?byId(state.people,id):{name:'',role:'Tehnik',phone:'',email:'',region:'',skills:'',active:true};
  openModal(`<form id="personForm"><div class="dialog-head"><h2>${id?'Muuda kasutajat':'Lisa kasutaja'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Nimi<input class="field" name="name" required value="${esc(p.name)}"></label><label>Roll<select class="select" name="role">${['Admin','Tehnik','Demo'].map(r=>`<option value="${r}" ${p.role===r?'selected':''}>${r}</option>`).join('')}</select></label><label>Telefon<input class="field" name="phone" value="${esc(p.phone||'')}"></label><label>E-post<input class="field" name="email" type="email" value="${esc(p.email||'')}"></label><label>Piirkond<input class="field" name="region" value="${esc(p.region||'')}"></label><label>Oskused<input class="field" name="skills" value="${esc(p.skills||'')}"></label><label>Staatus<select class="select" name="active"><option value="true" ${p.active?'selected':''}>Aktiivne</option><option value="false" ${!p.active?'selected':''}>Deaktiveeritud</option></select></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#personForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('U'),name:f.name.value,role:f.role.value,phone:f.phone.value,email:f.email.value,region:f.region.value,skills:f.skills.value,active:f.active.value==='true'};if(id){Object.assign(p,next)}else{state.people.push(next)}save();closeModal();renderPeople();});
}


function parseDateKey(value){ const d=new Date(`${value}T12:00:00`); return Number.isNaN(d.getTime())?new Date():d; }
function dateKeyFromDate(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function addDateDays(date,days){ const d=new Date(date); d.setDate(d.getDate()+days); return d; }
function weekStartKeyFrom(value){ const d=value?parseDateKey(value):new Date(); const day=d.getDay()||7; d.setDate(d.getDate()-day+1); return dateKeyFromDate(d); }
function weekDaysFrom(startKey){ const start=parseDateKey(startKey); return Array.from({length:7},(_,i)=>dateKeyFromDate(addDateDays(start,i))); }
function isInRange(date,start,end){ return date>=start && date<=end; }
function workorderHours(w){ return Number(w.hours||w.durationHours||w.plannedHours||2)||2; }
function teamWeekAbsences(personId,weekDays){ const start=weekDays[0], end=weekDays[6]; return state.absences.filter(a=>a.personId===personId && a.start<=end && a.end>=start); }
function teamWeekOncall(personId,weekDays){ const start=weekDays[0], end=weekDays[6]; return state.oncall.filter(o=>o.personId===personId && o.start<=end && o.end>=start); }
function workloadStatus(hours,absences){ if(absences.length) return 'Puudub'; if(hours>=8) return 'Ülekoormus'; if(hours>=4) return 'Koormus'; if(hours>0) return 'Madal'; return 'Vaba'; }
function workloadClass(hours,absences){ if(absences.length) return 'warn'; if(hours>=8) return 'red'; if(hours>=4) return 'ok'; if(hours>0) return ''; return ''; }
function renderTeam(){
  const currentWeek=$('#teamWeekStart')?.value||weekStartKeyFrom(localStorage.getItem('veco_team_week')||'');
  const statusFilter=$('#teamStatusFilter')?.value||'open';
  const q=($('#teamSearch')?.value||'').toLowerCase();
  const view=$('#teamViewMode')?.value||localStorage.getItem('veco_team_view')||'cards';
  const scope=$('#teamWeekScope')?.value||localStorage.getItem('veco_team_scope')||'workdays';
  const selectedDay=$('#teamDaySelect')?.value||localStorage.getItem('veco_team_day')||dateKeyFromDate(new Date());
  const weekDays=weekDaysFrom(currentWeek);
  const visibleDays=scope==='full'?weekDays:weekDays.slice(0,5);
  localStorage.setItem('veco_team_week',currentWeek);
  localStorage.setItem('veco_team_view',view);
  localStorage.setItem('veco_team_scope',scope);
  localStorage.setItem('veco_team_day',selectedDay);
  const openStatuses=['Uus','Planeeritud','Töös','Ootel','Pausil'];
  const inVisibleRange=w=>visibleDays.includes(w.date);
  const inWeek=w=>weekDays.includes(w.date);
  const statusOk=w=>statusFilter==='all'||(statusFilter==='open'?openStatuses.includes(w.status):w.status===statusFilter);
  const searchable=w=>`${w.id} ${w.title} ${objectName(w.objectId)} ${clientName(objectClientId(w.objectId))} ${projectName(w.projectId)} ${techName(w.technicianId)}`.toLowerCase().includes(q);
  const weekWorkorders=state.workorders.filter(w=>inWeek(w)&&statusOk(w)&&searchable(w));
  const visibleWorkorders=weekWorkorders.filter(w=>inVisibleRange(w));
  const dayWorkorders=state.workorders.filter(w=>w.date===selectedDay&&statusOk(w)&&searchable(w));
  if(selectedTeamPersonId && !state.people.some(p=>p.id===selectedTeamPersonId)) selectedTeamPersonId='';

  const personJobs=(person,days=visibleDays)=>weekWorkorders.filter(w=>w.technicianId===person.id&&days.includes(w.date)).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const personDayJobs=(person,date)=>weekWorkorders.filter(w=>w.technicianId===person.id&&w.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const dayNames=['E','T','K','N','R','L','P'];
  const weekDayOptions=weekDays.map((d,i)=>`<option value="${d}" ${selectedDay===d?'selected':''}>${dayNames[i]} ${d}</option>`).join('');
  const viewSwitch=`<select class="select" id="teamViewMode"><option value="cards" ${view==='cards'?'selected':''}>Kaardid</option><option value="matrix" ${view==='matrix'?'selected':''}>Nädalatabel</option><option value="day" ${view==='day'?'selected':''}>Päev</option></select><select class="select" id="teamWeekScope"><option value="workdays" ${scope==='workdays'?'selected':''}>E–R</option><option value="full" ${scope==='full'?'selected':''}>E–P</option></select>${view==='day'?`<select class="select" id="teamDaySelect">${weekDayOptions}</select>`:''}`;
  const filters=`<input class="field" id="teamSearch" placeholder="Otsi tööd, objekti või tehnikut..." value="${esc(q)}"><input class="field" id="teamWeekStart" type="date" value="${esc(currentWeek)}"><select class="select" id="teamStatusFilter"><option value="open" ${statusFilter==='open'?'selected':''}>Avatud tööd</option><option value="all" ${statusFilter==='all'?'selected':''}>Kõik staatused</option>${['Uus','Planeeritud','Töös','Ootel','Pausil','Täidetud','Suletud'].map(s=>`<option value="${s}" ${statusFilter===s?'selected':''}>${s}</option>`).join('')}</select>${viewSwitch}`;
  const actions=`<button class="btn ghost" id="teamPrevWeekBtn" type="button">‹ Eelmine</button><button class="btn primary" id="teamThisWeekBtn" type="button">↕ Täna</button><button class="btn ghost" id="teamNextWeekBtn" type="button">Järgmine ›</button>`;

  const techCards=state.people.map(p=>{
    const jobs=personJobs(p);
    const hours=jobs.reduce((sum,w)=>sum+workorderHours(w),0);
    const abs=teamWeekAbsences(p.id,visibleDays);
    const oc=teamWeekOncall(p.id,visibleDays);
    const limit=scope==='full'?56:40;
    const loadPct=Math.min(100,Math.round((hours/limit)*100));
    const warnings=[
      (scope==='workdays'&&hours>=32)||(scope==='full'&&hours>=42)?'Kontrolli koormust: nädal on tihe.':'',
      abs.length?`Puudumine: ${abs.map(a=>`${a.type} ${a.start}–${a.end}`).join(', ')}`:'',
      oc.length?`Valve: ${oc.map(o=>`${o.start}–${o.end}`).join(', ')}`:''
    ].filter(Boolean);
    const jobList=jobs.slice(0,5).map(w=>`<div class="team-job-line"><strong>${esc(w.date)} ${esc(w.time)} · ${esc(objectName(w.objectId))}</strong><span>${esc(w.title)}</span></div>`).join('') || '<span class="muted">Selles vahemikus töid ei ole.</span>';
    return `<div class="card clickable team-card ${p.id===selectedTeamPersonId?'selected':''}" data-team-person="${p.id}">
      <div class="card-top"><h3>${esc(p.name)}</h3><span class="status ${workloadClass(hours,abs)}">${esc(workloadStatus(hours,abs))}</span></div>
      <div class="team-load-row"><span>${jobs.length} tööd</span><strong>${hours} h</strong></div>
      <div class="load-meter"><span style="width:${loadPct}%"></span></div>
      <div class="muted">${esc(p.role||'Tehnik')} · ${esc(p.region||'-')}</div>
      <div class="team-job-list">${jobList}</div>
      ${warnings.length?`<div class="team-warning-list">${warnings.map(w=>`<span>${esc(w)}</span>`).join('')}</div>`:''}
    </div>`;
  }).join('');

  const matrixRows=state.people.map(p=>{
    const cells=visibleDays.map(date=>{
      const jobs=personDayJobs(p,date);
      const h=jobs.reduce((sum,w)=>sum+workorderHours(w),0);
      const abs=state.absences.filter(a=>a.personId===p.id&&a.start<=date&&a.end>=date);
      const oc=state.oncall.filter(o=>o.personId===p.id&&o.start<=date&&o.end>=date);
      const classes=['team-matrix-cell', h>=8?'busy':'', abs.length?'absent':'', oc.length?'oncall':''].filter(Boolean).join(' ');
      const items=jobs.slice(0,2).map(w=>`<div class="team-matrix-job"><strong>${esc(w.time||'')}</strong><span>${esc(objectName(w.objectId))}</span><span>${workorderHours(w)} h</span></div>`).join('');
      const more=jobs.length>2?`<span class="team-more">+${jobs.length-2} veel</span>`:'';
      const workSummary=jobs.length?`<span class="team-day-count">${jobs.length} tööd</span>`:'<span class="muted">Vaba</span>';
      return `<td class="${classes}"><div class="team-cell-head"><strong>${h?h+' h':'-'}</strong>${abs.length?'<span class="status warn">Puudub</span>':''}${oc.length?'<span class="status warn">Valve</span>':''}</div>${workSummary}${items}${more}</td>`;
    }).join('');
    const jobs=personJobs(p);
    const hours=jobs.reduce((sum,w)=>sum+workorderHours(w),0);
    return `<tr data-team-person="${p.id}" class="${p.id===selectedTeamPersonId?'selected':''}"><th><strong>${esc(p.name)}</strong><span class="muted">${esc(p.role||'Tehnik')} · ${hours} h</span></th>${cells}</tr>`;
  }).join('');
  const matrixHtml=`<div class="team-matrix-wrap"><table class="team-matrix"><thead><tr><th>Tehnik</th>${visibleDays.map((d,i)=>`<th>${dayNames[weekDays.indexOf(d)]}<span>${esc(d)}</span></th>`).join('')}</tr></thead><tbody>${matrixRows}</tbody></table></div>`;

  const dayHtml=`<div class="team-day-view">${state.people.map(p=>{
    const jobs=dayWorkorders.filter(w=>w.technicianId===p.id).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const abs=state.absences.filter(a=>a.personId===p.id&&a.start<=selectedDay&&a.end>=selectedDay);
    const oc=state.oncall.filter(o=>o.personId===p.id&&o.start<=selectedDay&&o.end>=selectedDay);
    const body=abs.length?`<div class="event-row"><strong>${esc(abs[0].type)}</strong><span class="muted">${esc(abs[0].note||'Puudumine')}</span></div>`:(jobs.map(w=>`<div class="team-job-line"><strong>${esc(w.time||'')} · ${esc(objectName(w.objectId))}</strong><span>${esc(w.title)}</span><span class="muted">${esc(clientName(objectClientId(w.objectId)))} · ${esc(w.status)}</span></div>`).join('')||'<span class="muted">Vaba</span>');
    return `<div class="card clickable team-day-card ${p.id===selectedTeamPersonId?'selected':''}" data-team-person="${p.id}"><div class="card-top"><h3>${esc(p.name)}</h3>${oc.length?'<span class="status warn">Valves</span>':abs.length?'<span class="status warn">Puudub</span>':'<span class="status ok">Saadaval</span>'}</div><div class="team-job-list">${body}</div></div>`;
  }).join('')}</div>`;

  const totalHours=visibleWorkorders.reduce((sum,w)=>sum+workorderHours(w),0);
  const absentCount=state.people.filter(p=>teamWeekAbsences(p.id,visibleDays).length).length;
  const overloaded=state.people.filter(p=>personJobs(p).reduce((sum,w)=>sum+workorderHours(w),0)>=(scope==='full'?42:32)).length;
  const content=view==='matrix'?matrixHtml:(view==='day'?dayHtml:`<div class="grid team-grid">${techCards}</div>`);
  const teamHeaderLabel=formatViewPeriod('Tiimivaade',view==='day'?'day':'week',view==='day'?[selectedDay]:visibleDays,currentWeek,{hideRange:view!=='day'});
  const main=header('Tiimivaade',filters,actions,teamHeaderLabel)+`<div class="detail-body"><div class="summary-grid">${summaryBox('Tehnikuid',state.people.length)}${summaryBox(view==='day'?'Päeva töid':'Vahemiku töid',view==='day'?dayWorkorders.length:visibleWorkorders.length)}${summaryBox('Planeeritud h',view==='day'?dayWorkorders.reduce((sum,w)=>sum+workorderHours(w),0):totalHours)}${summaryBox('Hoiatusi',absentCount+overloaded)}</div><div class="team-view-hint">${view==='cards'?'Kaardivaade näitab tehniku koormust valitud nädalas.':view==='matrix'?'Nädalatabel näitab kogu tiimi päevade kaupa.':'Päevavaade sobib hommikuseks tööde jagamiseks.'}</div>${content}</div>`;
  const detail=selectedTeamPersonId?teamDetailHtml(visibleDays,view==='day'?dayWorkorders:visibleWorkorders):'';
  shell(main,detail);
  $('#teamSearch')?.addEventListener('input',renderTeam); $('#teamWeekStart')?.addEventListener('change',renderTeam); $('#teamStatusFilter')?.addEventListener('change',renderTeam); $('#teamViewMode')?.addEventListener('change',renderTeam); $('#teamWeekScope')?.addEventListener('change',renderTeam); $('#teamDaySelect')?.addEventListener('change',renderTeam);
  $('#teamPrevWeekBtn')?.addEventListener('click',()=>{
    if(view==='day'){
      const nextDay=dateKeyFromDate(addDateDays(parseDateKey(selectedDay),-1));
      localStorage.setItem('veco_team_day',nextDay);
      localStorage.setItem('veco_team_week',weekStartKeyFrom(nextDay));
    }else{
      localStorage.setItem('veco_team_week',dateKeyFromDate(addDateDays(parseDateKey(currentWeek),-7)));
    }
    renderTeam();
  });
  $('#teamNextWeekBtn')?.addEventListener('click',()=>{
    if(view==='day'){
      const nextDay=dateKeyFromDate(addDateDays(parseDateKey(selectedDay),1));
      localStorage.setItem('veco_team_day',nextDay);
      localStorage.setItem('veco_team_week',weekStartKeyFrom(nextDay));
    }else{
      localStorage.setItem('veco_team_week',dateKeyFromDate(addDateDays(parseDateKey(currentWeek),7)));
    }
    renderTeam();
  });
  $('#teamThisWeekBtn')?.addEventListener('click',()=>{
    const todayKey=dateKeyFromDate(new Date());
    localStorage.setItem('veco_team_week',weekStartKeyFrom(todayKey));
    localStorage.setItem('veco_team_day',todayKey);
    renderTeam();
  });
  $$('[data-team-person]').forEach(el=>el.addEventListener('click',()=>{
    selectedTeamPersonId = selectedTeamPersonId===el.dataset.teamPerson ? '' : el.dataset.teamPerson;
    renderTeam();
  }));
  $('#teamDetailCloseBtn')?.addEventListener('click',()=>{selectedTeamPersonId='';renderTeam();});
}

function teamDetailHtml(weekDays,weekWorkorders){
  const p=byId(state.people,selectedTeamPersonId);
  if(!p) return '';
  const jobs=weekWorkorders.filter(w=>w.technicianId===p.id).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const hours=jobs.reduce((sum,w)=>sum+workorderHours(w),0);
  const abs=teamWeekAbsences(p.id,weekDays);
  const oc=teamWeekOncall(p.id,weekDays);
  const jobsHtml=jobs.map(w=>`<div class="event-row"><strong>${esc(w.date)} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(clientName(objectClientId(w.objectId)))} · ${esc(objectName(w.objectId))} · ${esc(projectName(w.projectId))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Sellel nädalal valitud filtriga töid ei ole.</span>';
  const absHtml=abs.map(a=>`<div class="event-row"><strong>${esc(a.type)} ${esc(a.start)}–${esc(a.end)}</strong><span class="muted">${esc(a.note)}</span></div>`).join('')||'<span class="muted">Puudumisi ei ole.</span>';
  const ocHtml=oc.map(o=>`<div class="event-row"><strong>Valve ${esc(o.start)}–${esc(o.end)}</strong><span class="muted">${esc(o.note)}</span></div>`).join('')||'<span class="muted">Valvet ei ole.</span>';
  return detailHeader(`${p.name} · detail`,'<button class="btn ghost" id="teamDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Töid',jobs.length)}${summaryBox('Tunde',hours)}${summaryBox('Puudumisi',abs.length)}${summaryBox('Valveid',oc.length)}</div>${card(p.name,[['Roll',p.role],['Piirkond',p.region],['Telefon',p.phone],['E-post',p.email],['Oskused',p.skills]],workloadStatus(hours,abs))}<div class="section-title">Nädala tööd</div><div class="list">${jobsHtml}</div><div class="section-title">Puudumised</div><div class="list">${absHtml}</div><div class="section-title">Valve</div><div class="list">${ocHtml}</div></div>`;
}

function renderOncall(){const today=dateKeyFromDate(new Date()); const label=formatViewPeriod('Valvegraafik','week',weekDaysFrom(weekStartKeyFrom(today)),today,{hideRange:true}); shell(header('Valvegraafik','','<button class="btn primary">＋ Lisa valve</button>',label)+`<div class="detail-body"><div class="grid">${state.oncall.map(o=>card(techName(o.personId),[['Algus',o.start],['Lõpp',o.end],['Märkus',o.note]],'Valves')).join('')}</div></div>`,'',{wide:true});}
function renderVacations(){shell(header('Puhkused ja puudumised','','<button class="btn primary">＋ Lisa puudumine</button>','Puhkused')+`<div class="detail-body"><div class="grid">${state.absences.map(a=>card(`${techName(a.personId)} · ${a.type}`,[['Algus',a.start],['Lõpp',a.end],['Märkus',a.note]],a.type)).join('')}</div></div>`,'',{wide:true});}
function activeMobilePeople(){
  return state.people.filter(p=>p.active);
}
function mobileCurrentUser(){
  const id=localStorage.getItem('veco_mobile_user_id')||'';
  return activeMobilePeople().find(p=>p.id===id)||null;
}
function renderMobile(){
  const USER_KEY='veco_mobile_user_id';
  const activePeople=activeMobilePeople();
  const current=mobileCurrentUser();
  if(!current){
    const cards=activePeople.map(p=>`<button class="card clickable mobile-user-choice" data-mobile-user="${p.id}" type="button"><div class="card-top"><h3>${esc(p.name)}</h3><span class="status ${p.role==='Admin'?'ok':p.role==='Demo'?'warn':''}">${esc(p.role||'Tehnik')}</span></div><span class="muted">${esc(p.region||'')} ${p.skills?`· ${esc(p.skills)}`:''}</span></button>`).join('')||'<span class="muted">Aktiivseid kasutajaid ei ole. Lisa kasutaja admin vaates.</span>';
    shell(`<div class="panel-head mobile-head"><div><h2>VECO TEHNIKU VAADE</h2><span class="muted">Vali kasutaja piloodi testimiseks.</span></div></div><div class="detail-body mobile-detail"><div class="grid mobile-user-grid">${cards}</div></div>`,'',{wide:true});
    $$('[data-mobile-user]').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem(USER_KEY,btn.dataset.mobileUser);renderMobile();}));
    return;
  }
  const today=dateKeyFromDate(new Date());
  const show=$('#mobileScope')?.value||localStorage.getItem('veco_mobile_scope')||'today';
  localStorage.setItem('veco_mobile_scope',show);
  const openStatuses=['Uus','Planeeritud','Töös','Ootel','Pausil'];
  const jobs=state.workorders.filter(w=>w.technicianId===current.id && (show==='all'||(show==='today'?w.date===today:openStatuses.includes(w.status)))).sort((a,b)=>`${a.date} ${a.time||''}`.localeCompare(`${b.date} ${b.time||''}`));
  const filters=`<select class="select" id="mobileScope"><option value="today" ${show==='today'?'selected':''}>Täna</option><option value="open" ${show==='open'?'selected':''}>Avatud tööd</option><option value="all" ${show==='all'?'selected':''}>Kõik minu tööd</option></select>`;
  const actions=`<button class="btn primary" id="mobileAddWorkBtn" type="button">＋ Lisa töö</button><button class="btn ghost" id="mobileSwitchUserBtn" type="button">⇄ Vaheta</button>`;
  const rows=jobs.map(w=>`<div class="card mobile-work-card"><div class="card-top"><h3>${esc(w.time||'')} · ${esc(objectName(w.objectId))}</h3><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div><div class="kv"><span>Klient</span><strong>${esc(clientName(objectClientId(w.objectId)))}</strong></div><div class="kv"><span>Töö</span><strong>${esc(w.title)}</strong></div><div class="kv"><span>Kuupäev</span><strong>${esc(w.date)}</strong></div><div class="muted">${esc(w.description||'')}</div><div class="actions mobile-actions"><button class="btn primary" data-mobile-status="${w.id}" data-status="Töös" type="button">Alusta</button><button class="btn" data-mobile-status="${w.id}" data-status="Pausil" type="button">Paus</button><button class="btn" data-mobile-edit="${w.id}" type="button">Täida</button><button class="btn" data-mobile-status="${w.id}" data-status="Täidetud" type="button">Lõpeta</button></div></div>`).join('')||'<div class="card"><strong>Töid ei ole</strong><span class="muted">Valitud vahemikus sellele kasutajale töid ei ole.</span></div>';
  shell(`<div class="panel-head mobile-head"><div><h2>${esc(current.name)}</h2><span class="muted">${jobs.length} tööd · ${esc(current.role||'')}</span></div><div class="filters mobile-head-actions">${filters}${actions}</div></div><div class="detail-body mobile-detail"><div class="grid mobile-work-grid">${rows}</div></div>`,'',{wide:true});
  $('#mobileScope')?.addEventListener('change',renderMobile);
  $('#mobileSwitchUserBtn')?.addEventListener('click',()=>{localStorage.removeItem(USER_KEY);renderMobile();});
  $('#mobileAddWorkBtn')?.addEventListener('click',()=>openMobileAddWorkModal(current.id));
  $$('[data-mobile-status]').forEach(btn=>btn.addEventListener('click',()=>{const w=byId(state.workorders,btn.dataset.mobileStatus);if(w){w.status=btn.dataset.status;save();renderMobile();}}));
  $$('[data-mobile-edit]').forEach(btn=>btn.addEventListener('click',()=>openMobileWorkModal(btn.dataset.mobileEdit)));
}
function openMobileAddWorkModal(personId){
  const today=dateKeyFromDate(new Date());
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=now.getMinutes()<30?'00':'30';
  openModal(`<form id="mobileAddWorkForm"><div class="dialog-head"><h2>Lisa töö</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid mobile-form-grid"><label class="full">Objekt<select class="select" name="objectId" required>${state.objects.map(o=>`<option value="${o.id}">${esc(o.name)} · ${esc(clientName(o.clientId))}</option>`).join('')}</select></label><label class="full">Töö lühikirjeldus<input class="field" name="title" required placeholder="nt Telefonitellimus / rike"></label><label>Kuupäev<input class="field" name="date" type="date" required value="${today}"></label><label>Kell<input class="field" name="time" type="time" value="${hh}:${mm}"></label><label>Prioriteet<select class="select" name="priority"><option>Tavaline</option><option>Kõrge</option><option>Madal</option></select></label><label>Staatus<select class="select" name="status"><option>Uus</option><option selected>Planeeritud</option><option>Töös</option></select></label><label class="full">Märkus<textarea name="description" placeholder="Kes helistas, mida paluti, mis objektil juhtus?"></textarea></label></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta töö</button></div></form>`);
  bindClose();
  $('#mobileAddWorkForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const objectId=f.objectId.value;const project=state.projects.find(p=>p.objectId===objectId);const next={id:uid('WO'),projectId:project?.id||'',objectId,title:f.title.value,date:f.date.value,time:f.time.value,technicianId:personId,status:f.status.value,priority:f.priority.value,description:f.description.value};state.workorders.push(next);selectedWorkorderId=next.id;save();closeModal();renderMobile();});
}
function openMobileWorkModal(id){
  const w=byId(state.workorders,id); if(!w) return;
  openModal(`<form id="mobileWorkForm"><div class="dialog-head"><h2>${esc(w.title)}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="card"><strong>${esc(objectName(w.objectId))}</strong><span class="muted">${esc(w.date)} ${esc(w.time||'')} · ${esc(clientName(objectClientId(w.objectId)))}</span></div><div class="form-grid mobile-form-grid"><label class="full">Tehtud töö / märkus<textarea name="done">${esc(w.done||w.workDone||'')}</textarea></label><label>Staatus<select class="select" name="status">${['Planeeritud','Töös','Pausil','Ootel','Täidetud'].map(st=>`<option ${w.status===st?'selected':''}>${st}</option>`).join('')}</select></label><label>Foto / viide<input class="field" name="photoNote" value="${esc(w.photoNote||'')}" placeholder="Foto lisamine tuleb järgmises etapis"></label></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#mobileWorkForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;w.done=f.done.value;w.workDone=f.done.value;w.status=f.status.value;w.photoNote=f.photoNote.value;save();closeModal();renderMobile();});
}
function renderMobilePreview(){
  const devices=[['iPhone SE','320px','568px'],['Android 360','360px','740px'],['iPhone 14','390px','844px'],['Large phone','414px','896px'],['Tahvel','768px','1024px']];
  const cards=devices.map(([name,w,h])=>`<div class="card preview-device"><div class="card-top"><h3>${name}</h3><span class="status">${w} × ${h}</span></div><div class="preview-frame-wrap" style="--preview-w:${w};--preview-h:${h};"><iframe src="mobile.html" title="${esc(name)}"></iframe></div></div>`).join('');
  shell(header('Mobiili eelvaade','','<a class="btn primary" href="mobile.html" target="_blank" rel="noopener">Ava tehniku vaade ↗</a>','MOBIILI EELVAADE')+`<div class="detail-body"><div class="card"><strong>Testi eri ekraanisuuruseid</strong><span class="muted">Eesmärk: tehniku vaates ei tohi tekkida horisontaalset kerimist ning põhitoimingud peavad mahtuma ühe veeruna.</span></div><div class="preview-grid">${cards}</div></div>`,'',{wide:true});
}

function calendarVisibleDays(startKey,mode,hideWeekend){
  if(mode==='day') return [startKey||dateKeyFromDate(new Date())];
  if(mode==='week'){
    const days=weekDaysFrom(weekStartKeyFrom(startKey));
    return hideWeekend?days.slice(0,5):days;
  }
  if(mode==='month'){
    const base=parseDateKey(startKey||dateKeyFromDate(new Date()));
    const first=new Date(base.getFullYear(),base.getMonth(),1,12,0,0);
    const last=new Date(base.getFullYear(),base.getMonth()+1,0,12,0,0);
    const days=[];
    for(let d=new Date(first); d<=last; d=addDateDays(d,1)){
      const dow=d.getDay();
      if(!hideWeekend || (dow!==0 && dow!==6)) days.push(dateKeyFromDate(d));
    }
    return days;
  }
  const base=parseDateKey(startKey||dateKeyFromDate(new Date()));
  return Array.from({length:12},(_,i)=>`${base.getFullYear()}-${String(i+1).padStart(2,'0')}`);
}
function isoWeekNumber(dateKey){
  const d=parseDateKey(dateKey||dateKeyFromDate(new Date()));
  d.setHours(0,0,0,0);
  d.setDate(d.getDate()+3-((d.getDay()+6)%7));
  const week1=new Date(d.getFullYear(),0,4);
  return 1+Math.round(((d-week1)/86400000-3+((week1.getDay()+6)%7))/7);
}
function fmtShortDate(dateKey,withYear=false){
  const d=parseDateKey(dateKey);
  const dd=String(d.getDate()).padStart(2,'0');
  const mm=String(d.getMonth()+1).padStart(2,'0');
  return withYear?`${dd}.${mm}.${d.getFullYear()}`:`${dd}.${mm}`;
}
const EST_MONTHS=['JAANUAR','VEEBRUAR','MÄRTS','APRILL','MAI','JUUNI','JUULI','AUGUST','SEPTEMBER','OKTOOBER','NOVEMBER','DETSEMBER'];
function monthYearLabel(dateKey){
  const d=parseDateKey(dateKey||dateKeyFromDate(new Date()));
  return `${EST_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function rangeMonthLabel(days,startKey){
  const list=(days&&days.length)?days:[startKey||dateKeyFromDate(new Date())];
  const first=parseDateKey(list[0]);
  const last=parseDateKey(list[list.length-1]);
  if(first.getMonth()===last.getMonth() && first.getFullYear()===last.getFullYear()) return monthYearLabel(list[0]);
  const firstMonth=EST_MONTHS[first.getMonth()];
  const lastMonth=EST_MONTHS[last.getMonth()];
  return first.getFullYear()===last.getFullYear()?`${firstMonth} / ${lastMonth} ${last.getFullYear()}`:`${firstMonth} ${first.getFullYear()} / ${lastMonth} ${last.getFullYear()}`;
}
function formatViewPeriod(viewName,mode,days,startKey,opts={}){
  const name=String(viewName||'').toUpperCase();
  const base=startKey||dateKeyFromDate(new Date());
  if(mode==='year') return `${name} · ${parseDateKey(base).getFullYear()}`;
  if(mode==='month') return `${name} · ${monthYearLabel(base)}`;
  const list=(days&&days.length)?days:[base];
  const monthLabel=rangeMonthLabel(list,base);
  const weekNo=isoWeekNumber(list[0]);
  if(opts.hideRange) return `${name} · ${monthLabel} · NÄDAL ${weekNo}`;
  if(mode==='day') return `${monthLabel} · NÄDAL ${weekNo} · ${fmtShortDate(list[0])}`;
  return `${monthLabel} · NÄDAL ${weekNo} · ${fmtShortDate(list[0])}–${fmtShortDate(list[list.length-1])}`;
}
function calendarRangeLabel(mode,days,startKey){
  return formatViewPeriod('Kalender',mode,days,startKey,{noName:true});
}
function renderCalendar(){
  const storedDate=localStorage.getItem('veco_calendar_week')||weekStartKeyFrom('');
  const currentDate=storedDate;
  const techFilter=$('#calendarTechFilter')?.value||'all';
  const statusFilter=$('#calendarStatusFilter')?.value||'open';
  const mode=$('#calendarViewMode')?.value||localStorage.getItem('veco_calendar_view')||'week';
  const hideWeekend=(localStorage.getItem('veco_calendar_hide_weekend')||'false')==='true';
  localStorage.setItem('veco_calendar_week',currentDate);
  localStorage.setItem('veco_calendar_view',mode);
  localStorage.setItem('veco_calendar_hide_weekend',hideWeekend?'true':'false');
  const openStatuses=['Uus','Planeeritud','Töös','Ootel','Pausil'];
  const visibleDays=calendarVisibleDays(currentDate,mode,hideWeekend);
  const startKey=mode==='week'?weekStartKeyFrom(currentDate):currentDate;
  const dateInView=(w)=>{
    if(mode==='year') return w.date && w.date.startsWith(String(parseDateKey(currentDate).getFullYear())+'-');
    return visibleDays.includes(w.date);
  };
  const filtered=state.workorders.filter(w=>{
    const techOk=techFilter==='all'||w.technicianId===techFilter;
    const statusOk=statusFilter==='all'||(statusFilter==='open'?openStatuses.includes(w.status):w.status===statusFilter);
    const hay=`${w.id} ${w.title} ${clientName(objectClientId(w.objectId))} ${objectName(w.objectId)} ${projectName(w.projectId)} ${techName(w.technicianId)} ${w.status}`.toLowerCase();
    return dateInView(w)&&techOk&&statusOk;
  });
  const filters=`<input class="field" id="calendarWeekStart" type="date" value="${esc(currentDate)}"><select class="select" id="calendarTechFilter"><option value="all">Kõik tehnikud</option>${state.people.map(p=>`<option value="${p.id}" ${techFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><select class="select" id="calendarViewMode"><option value="day" ${mode==='day'?'selected':''}>Päev</option><option value="week" ${mode==='week'?'selected':''}>Nädal</option><option value="month" ${mode==='month'?'selected':''}>Kuu</option><option value="year" ${mode==='year'?'selected':''}>Aasta</option></select><button class="btn ghost" id="calendarHideWeekend" type="button" data-hidden="${hideWeekend?'true':'false'}">▦ ${hideWeekend?'Näita L/P':'Peida L/P'}</button><select class="select" id="calendarStatusFilter"><option value="open" ${statusFilter==='open'?'selected':''}>Avatud tööd</option><option value="all" ${statusFilter==='all'?'selected':''}>Kõik staatused</option>${['Uus','Planeeritud','Töös','Ootel','Pausil','Täidetud','Suletud'].map(s=>`<option value="${s}" ${statusFilter===s?'selected':''}>${s}</option>`).join('')}</select>`;
  const actions=`<button class="btn ghost" id="calendarImportWorkBtn" type="button">▧ Impordi töö</button><button class="btn ghost" id="calendarPrevWeekBtn" type="button">‹ Eelmine</button><button class="btn primary" id="calendarThisWeekBtn" type="button">⌖ Täna</button><button class="btn ghost" id="calendarNextWeekBtn" type="button">Järgmine ›</button><button class="btn primary" id="newCalendarWorkorderBtn" type="button">＋ Lisa töökäsk</button>`;
  const calendarStartHour=6;
  const calendarEndHour=22;
  const calendarHoursTotal=calendarEndHour-calendarStartHour;
  const hours=Array.from({length:calendarHoursTotal},(_,i)=>calendarStartHour+i);
  const dayNames=['P','E','T','K','N','R','L'];
  const today=dateKeyFromDate(new Date());
  const now=new Date();
  const nowHour=now.getHours()+now.getMinutes()/60;
  const showNowLine=mode==='week'||mode==='day';
  const nowTopPct=Math.max(0,Math.min(100,((nowHour-calendarStartHour)/calendarHoursTotal)*100));

  let body='';
  if(mode==='week'||mode==='day'){
    const columns=visibleDays.map(date=>{
      const d=parseDateKey(date);
      const jobs=filtered.filter(w=>w.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      const compactClass=jobs.length>=3?' compact':'';
      const cards=jobs.map(w=>{
        const [hh,mm]=(w.time||'09:00').split(':').map(Number);
        const start=((Number.isFinite(hh)?hh:9)+(Number.isFinite(mm)?mm:0)/60);
        const topPct=Math.max(0,Math.min(96,((start-calendarStartHour)/calendarHoursTotal)*100));
        const height=Math.max(jobs.length>=3?34:40,Math.min(105,workorderHours(w)*34));
        return `<button class="calendar-event${compactClass}" style="top:${topPct}%;min-height:${height}px" data-calendar-edit="${w.id}" data-calendar-drag="${w.id}" draggable="true" type="button" title="Lohista töö teisele ajale või päevale"><span><strong>${esc(w.time||'')} · ${esc(objectName(w.objectId))}</strong><em class="status ${statusClass(w.status)}">${esc(w.status)}</em></span><small>${esc(clientName(objectClientId(w.objectId)))} · ${esc(w.title)}</small><small>${esc(techName(w.technicianId))} · ${esc(projectName(w.projectId))}</small></button>`;
      }).join('');
      const slots=hours.map(h=>`<button class="calendar-slot" data-add-date="${date}" data-add-time="${String(h).padStart(2,'0')}:00" title="Lisa töö ${date} ${String(h).padStart(2,'0')}:00" type="button"></button>`).join('');
      return `<div class="calendar-planner-day ${date===today?'today':''}"><div class="calendar-planner-day-head"><strong>${dayNames[d.getDay()]}</strong><span>${esc(date)}</span></div><div class="calendar-planner-lane" data-calendar-lane="${date}">${slots}${date===today&&showNowLine?`<div class="calendar-now-line" style="top:${nowTopPct}%"><span>${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}</span></div>`:''}${cards || '<div class="calendar-empty-note">Töid ei ole</div>'}</div></div>`;
    }).join('');
    body=`<div class="calendar-planner" style="--calendar-hours-count:${hours.length}"><div class="calendar-hours"><div class="calendar-hours-spacer"></div>${hours.map(h=>`<div class="calendar-hour-label">${String(h).padStart(2,'0')}:00</div>`).join('')}</div><div class="calendar-planner-grid" style="grid-template-columns:repeat(${visibleDays.length},minmax(150px,1fr))">${columns}</div></div>`;
  }else if(mode==='month'){
    body=`<div class="calendar-month-grid">${visibleDays.map(date=>{const jobs=filtered.filter(w=>w.date===date).sort((a,b)=>(a.time||'').localeCompare(b.time||''));const d=parseDateKey(date);return `<div class="calendar-month-day ${date===today?'today':''}" data-add-date="${date}"><div class="calendar-month-head"><strong>${d.getDate()}</strong><span>${dayNames[d.getDay()]}</span></div>${jobs.slice(0,4).map(w=>`<button class="calendar-mini-event" data-calendar-edit="${w.id}" type="button">${esc(w.time||'')} · ${esc(objectName(w.objectId))}</button>`).join('')}${jobs.length>4?`<span class="muted">+${jobs.length-4} veel</span>`:''}</div>`}).join('')}</div>`;
  }else{
    body=`<div class="calendar-year-grid">${visibleDays.map(month=>{const jobs=filtered.filter(w=>w.date&&w.date.startsWith(month));const label=parseDateKey(month+'-01').toLocaleDateString('et-EE',{month:'long',year:'numeric'});return `<div class="calendar-year-month"><strong>${esc(label)}</strong><span class="muted">${jobs.length} tööd</span>${jobs.slice(0,5).map(w=>`<button class="calendar-mini-event" data-calendar-edit="${w.id}" type="button">${esc(w.date)} · ${esc(objectName(w.objectId))}</button>`).join('')}</div>`}).join('')}</div>`;
  }
  const main=header('Kalender',filters,actions,calendarRangeLabel(mode,visibleDays,currentDate))+`<div class="calendar-planner-wrap">${body}</div>`;
  shell(main,'',{wide:true});
  $('#calendarWeekStart')?.addEventListener('change',e=>{localStorage.setItem('veco_calendar_week',e.target.value);renderCalendar();}); $('#calendarTechFilter')?.addEventListener('change',renderCalendar); $('#calendarStatusFilter')?.addEventListener('change',renderCalendar); $('#calendarViewMode')?.addEventListener('change',renderCalendar);
  $('#calendarHideWeekend')?.addEventListener('click',()=>{localStorage.setItem('veco_calendar_hide_weekend',hideWeekend?'false':'true');renderCalendar();});
  $('#calendarPrevWeekBtn')?.addEventListener('click',()=>{const base=parseDateKey(currentDate); let next;if(mode==='day') next=addDateDays(base,-1); else if(mode==='week') next=addDateDays(base,-7); else if(mode==='month') next=new Date(base.getFullYear(),base.getMonth()-1,1,12,0,0); else next=new Date(base.getFullYear()-1,0,1,12,0,0); localStorage.setItem('veco_calendar_week',dateKeyFromDate(next));renderCalendar();});
  $('#calendarNextWeekBtn')?.addEventListener('click',()=>{const base=parseDateKey(currentDate); let next;if(mode==='day') next=addDateDays(base,1); else if(mode==='week') next=addDateDays(base,7); else if(mode==='month') next=new Date(base.getFullYear(),base.getMonth()+1,1,12,0,0); else next=new Date(base.getFullYear()+1,0,1,12,0,0); localStorage.setItem('veco_calendar_week',dateKeyFromDate(next));renderCalendar();});
  $('#calendarThisWeekBtn')?.addEventListener('click',()=>{localStorage.setItem('veco_calendar_week',mode==='week'?weekStartKeyFrom(''):dateKeyFromDate(new Date()));renderCalendar();});
  $('#newCalendarWorkorderBtn')?.addEventListener('click',()=>openCalendarWorkorderModal(currentDate,'09:00'));
  $('#calendarImportWorkBtn')?.addEventListener('click',()=>openCalendarImportModal(currentDate));
  $$('[data-add-date]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.closest('[data-calendar-edit]')) return; const date=el.dataset.addDate; const time=el.dataset.addTime||'09:00'; openCalendarWorkorderModal(date,time); }));
  bindCalendarDragDrop(calendarStartHour,calendarEndHour);
  $$('[data-calendar-edit]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation(); if(window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__){window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false; return;} openWorkorderModal(el.dataset.calendarEdit);}));
}

function bindCalendarDragDrop(startHour=6,endHour=22){
  let draggedId='';
  const clampHour=(value)=>Math.max(startHour,Math.min(endHour-1,value));
  const timeFromDrop=(lane,event)=>{
    const rect=lane.getBoundingClientRect();
    const y=Math.max(0,Math.min(rect.height,event.clientY-rect.top));
    const ratio=rect.height ? y/rect.height : 0;
    const hour=clampHour(startHour+Math.floor(ratio*(endHour-startHour)));
    return `${String(hour).padStart(2,'0')}:00`;
  };
  $$('[data-calendar-drag]').forEach(card=>{
    card.addEventListener('dragstart',e=>{
      draggedId=card.dataset.calendarDrag;
      card.classList.add('dragging');
      document.body.classList.add('calendar-drag-active');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',draggedId);
    });
    card.addEventListener('dragend',()=>{
      card.classList.remove('dragging');
      document.body.classList.remove('calendar-drag-active');
      $$('.calendar-planner-lane.drop-target').forEach(x=>x.classList.remove('drop-target'));
      window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=true;
      setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;},250);
    });
  });
  $$('[data-calendar-lane]').forEach(lane=>{
    lane.addEventListener('dragenter',e=>{ if(draggedId){ e.preventDefault(); lane.classList.add('drop-target'); } });
    lane.addEventListener('dragover',e=>{ if(draggedId){ e.preventDefault(); e.dataTransfer.dropEffect='move'; lane.classList.add('drop-target'); } });
    lane.addEventListener('dragleave',e=>{ if(!lane.contains(e.relatedTarget)) lane.classList.remove('drop-target'); });
    lane.addEventListener('drop',e=>{
      const id=e.dataTransfer.getData('text/plain')||draggedId;
      if(!id) return;
      e.preventDefault();
      e.stopPropagation();
      lane.classList.remove('drop-target');
      const w=byId(state.workorders,id);
      if(!w) return;
      w.date=lane.dataset.calendarLane;
      w.time=timeFromDrop(lane,e);
      save();
      renderCalendar();
    });
  });
}

function openCalendarImportModal(defaultDate){
  openModal(`<form id="calendarImportForm"><div class="dialog-head"><h2>Impordi töö</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Kleebi töökäsu tekst või snipilt loetud info<textarea name="importText" placeholder="Näide: klient, objekt, aadress, töö kirjeldus, kuupäev, kellaaeg..."></textarea></label><label>Kuupäev<input class="field" name="date" type="date" value="${esc(defaultDate||dateKeyFromDate(new Date()))}"></label><label>Kell<input class="field" name="time" type="time" value="09:00"></label></div><span class="muted">Praegu teeb import tekstist eeltäidetud töökäsu. Pildi/OCR automaatika jääb hilisemaks etapiks.</span></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Ava eeltäidetud töökäsk</button></div></form>`);
  bindClose();
  $('#calendarImportForm').addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const text=String(f.importText.value||'').trim();
    const date=f.date.value||defaultDate||dateKeyFromDate(new Date());
    const time=f.time.value||'09:00';
    closeModal();
    openCalendarWorkorderModal(date,time);
    const form=$('#workorderForm');
    if(form && text){
      const lines=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      form.elements.title.value=lines[0]?.slice(0,90)||'Imporditud töö';
      form.elements.description.value=text;
    }
  });
}

function openCalendarWorkorderModal(date,time){
  const obj=state.objects[0]?.id||'';
  openWorkorderModal('',{objectId:obj});
  const form=$('#workorderForm');
  if(form){
    form.elements.date.value=date||'';
    form.elements.time.value=time||'09:00';
  }
}
function calendarDetailHtml(){ return ''; }


function renderCurrentPage(){
  ({calendar:renderCalendar,clients:renderClients,objects:renderObjects,projects:renderProjects,workorders:renderWorkorders,people:renderPeople,team:renderTeam,acts:renderActs,oncall:renderOncall,vacations:renderVacations,mobile:renderMobile,mobilePreview:renderMobilePreview}[page]||renderObjects)();
}
async function bootstrapApp(){
  renderCurrentPage();
  if(window.VECO_API?.mode?.()==='supabase'){
    try{
      state=await window.VECO_API.load();
      selectedObjectId=state.objects?.[0]?.id||selectedObjectId||'';
      selectedClientId=state.clients?.[0]?.id||selectedClientId||'';
      selectedProjectId=state.projects?.[0]?.id||selectedProjectId||'';
      selectedWorkorderId=state.workorders?.[0]?.id||selectedWorkorderId||'';
      selectedActId=state.acts?.[0]?.id||selectedActId||'';
      renderCurrentPage();
      window.VECO_API.startWorkorderPolling?.((merged)=>{ state=merged; renderCurrentPage(); });
    }catch(err){
      console.warn('VECO bootstrap Supabase load failed',err);
    }
  }
}
bootstrapApp();
