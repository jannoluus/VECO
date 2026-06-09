const $=(s)=>document.querySelector(s);
const $$=(s)=>Array.from(document.querySelectorAll(s));
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=window.VECO_PAGE||'objects';
const APP_VERSION='v3.15.0';
const APP_BUILD='20260609_2025';
let state=window.VECO_STORAGE.load();
state.projects=state.projects||[]; state.workorders=state.workorders||[]; state.acts=state.acts||[]; state.devices=state.devices||[]; state.objects=state.objects||[]; state.clients=state.clients||[]; state.people=state.people||[]; state.absences=state.absences||[]; state.oncall=state.oncall||[];
normalizeOncallPeople();


function normalizeWorkorderPeople(){
  (state.workorders||[]).forEach(w=>{
    if(!w.responsibleTechnicianId) w.responsibleTechnicianId=w.technicianId||'';
    if(!Array.isArray(w.participantTechnicianIds)){
      if(Array.isArray(w.participants)) w.participantTechnicianIds=w.participants.slice();
      else if(typeof w.participantTechnicianIds==='string') w.participantTechnicianIds=w.participantTechnicianIds.split(',').map(x=>x.trim()).filter(Boolean);
      else w.participantTechnicianIds=[];
    }
    w.participantTechnicianIds=Array.from(new Set(w.participantTechnicianIds.filter(Boolean))).filter(id=>id!==w.responsibleTechnicianId);
    w.technicianId=w.responsibleTechnicianId||w.technicianId||'';
  });
}
function workorderResponsibleId(w){ return w?.responsibleTechnicianId||w?.technicianId||''; }
function workorderParticipantIds(w){
  const resp=workorderResponsibleId(w);
  const ids=Array.isArray(w?.participantTechnicianIds)?w.participantTechnicianIds:(typeof w?.participantTechnicianIds==='string'?w.participantTechnicianIds.split(','):[]);
  return Array.from(new Set(ids.map(x=>String(x||'').trim()).filter(Boolean))).filter(id=>id!==resp);
}
function workorderPeopleIds(w){
  const resp=workorderResponsibleId(w);
  return [resp,...workorderParticipantIds(w)].filter(Boolean);
}
function workorderMatchesPerson(w,personId){ return !!personId && workorderPeopleIds(w).includes(personId); }
function workorderAssigneeLabel(w){
  const resp=workorderResponsibleId(w);
  const participants=workorderParticipantIds(w);
  const base=techName(resp)||'-';
  return participants.length?`${base} +${participants.length}`:base;
}
function workorderPeopleLabel(w){
  const names=workorderPeopleIds(w).map(techName).filter(n=>n&&n!=='-');
  return names.join(', ')||'-';
}
function workorderRoleLabel(w,personId){
  if(workorderResponsibleId(w)===personId) return workorderParticipantIds(w).length?`👑 Vastutaja · ${workorderParticipantIds(w).length} osalejat`:'👑 Vastutaja';
  if(workorderParticipantIds(w).includes(personId)) return `Osaleja · Vastutaja: ${techName(workorderResponsibleId(w))}`;
  return '';
}

function normalizeOncallPeople(){
  const scheduledIds=new Set((state.oncall||[]).map(o=>o.personId).filter(Boolean));
  (state.people||[]).forEach((p,index)=>{
    if(typeof p.onCallActive==='undefined') p.onCallActive=scheduledIds.has(p.id);
    if(typeof p.onCallOrder==='undefined') p.onCallOrder=index+1;
  });
}

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
let modalEscHandler=null;

const pageTitles={calendar:'Kalender',team:'Tiimivaade',mobile:'Tehniku vaade',workorders:'Töökäsud',acts:'Aktid',oncall:'Valvegraafik',vacations:'Puhkused',people:'Tehnikud',objects:'Objektid',clients:'Kliendid',projects:'Projektid',ticker:'Ticker',mobilePreview:'Mobiili eelvaade',demo:'Demoandmed',diagnostics:'Diagnostika'};
const pageFiles={calendar:'index.html',team:'team.html',mobile:'mobile.html',workorders:'workorders.html',acts:'acts.html',oncall:'oncall.html',vacations:'vacations.html',people:'people.html',objects:'objects.html',clients:'clients.html',projects:'projects.html',ticker:'ticker.html',mobilePreview:'mobile-preview.html',demo:'demo.html',diagnostics:'diagnostics.html'};

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
const completedStatuses=['Lõpetatud','Täidetud','Suletud','Arhiveeritud'];
const isCompletedStatus=(s)=>completedStatuses.includes(String(s||'').trim());
const openWorkorders=()=>state.workorders.filter(w=>!isCompletedStatus(w.status));
const workorderStatusOptions=['Planeeritud','Töös','Lõpetatud'];
const completedByLabel=(w)=>techName(workorderResponsibleId(w))||'VECO';
const completionCommentText=(w)=>String(w?.completionComment||w?.completion_comment||w?.done||w?.workDone||'').trim();
const statusClass=(s)=>{
  if(/lõpetatud|täidetud|valmis/i.test(s||'')) return 'done';
  if(/töös/i.test(s||'')) return 'progress';
  if(/planeeritud|aktiivne|saadetud/i.test(s||'')) return 'ok';
  if(/ootel|attention|mustand|pausil/i.test(s||'')) return 'warn';
  if(/deaktiveeritud|seisab|arhiveeritud|suletud/i.test(s||'')) return 'red';
  return '';
};
const statusSlug=(s)=>String(s||'').toLowerCase().replace(/[õ]/g,'o').replace(/[ä]/g,'a').replace(/[ö]/g,'o').replace(/[ü]/g,'u').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function save(){
  normalizeWorkorderPeople();
  state=window.VECO_API?.save ? window.VECO_API.save(state) : window.VECO_STORAGE.save(state);
  notifyLocalPeers();
}
const LOCAL_SYNC_KEY='veco_v3_sync_pulse';
let localSyncChannel=null;
let localSyncTimer=null;
let localStateWatchTimer=null;
let localStateSnapshot='';
function localStateSignature(data){
  return JSON.stringify((data?.workorders||[]).map(w=>[w.id,w.status,w.date,w.time,w.title,w.technicianId,w.responsibleTechnicianId,(w.participantTechnicianIds||[]).join(','),w.objectId,w.projectId,w.description,w.plannedHours||w.durationHours||w.hours,w.completedAt||'',w.completedBy||'',w.completionComment||'']));
}
function notifyLocalPeers(){
  try{
    localStateSnapshot=localStateSignature(state);
    const msg={type:'workorders-updated',page,t:Date.now()};
    localStorage.setItem(LOCAL_SYNC_KEY,JSON.stringify(msg));
    if(localSyncChannel) localSyncChannel.postMessage(msg);
  }catch(e){ /* ignore local sync errors */ }
}
function isUserEditingOrChoosing(){
  const el=document.activeElement;
  if(!el) return false;
  const tag=String(el.tagName||'').toLowerCase();
  if(['select','input','textarea'].includes(tag)) return true;
  if(el.isContentEditable) return true;
  if(el.closest?.('.dialog')) return true;
  return false;
}
function renderCurrentPageWhenIdle(){
  if(isUserEditingOrChoosing()){
    clearTimeout(localSyncTimer);
    localSyncTimer=setTimeout(renderCurrentPageWhenIdle,650);
    return;
  }
  renderCurrentPage();
}
function scheduleLocalRefresh(){
  clearTimeout(localSyncTimer);
  localSyncTimer=setTimeout(()=>{
    try{
      if($('#modal')?.classList.contains('open')) return;
      state=window.VECO_STORAGE.load();
      localStateSnapshot=localStateSignature(state);
      renderCurrentPageWhenIdle();
    }catch(e){ console.warn('VECO local peer refresh failed',e); }
  },120);
}
function startLocalStateWatch(){
  if(localStateWatchTimer) return;
  try{ localStateSnapshot=localStateSignature(window.VECO_STORAGE.load()); }catch(e){ localStateSnapshot=''; }
  localStateWatchTimer=setInterval(()=>{
    try{
      if($('#modal')?.classList.contains('open')) return;
      const latest=window.VECO_STORAGE.load();
      const nextSig=localStateSignature(latest);
      if(nextSig!==localStateSnapshot){
        localStateSnapshot=nextSig;
        state=latest;
        renderCurrentPageWhenIdle();
      }
    }catch(e){ console.warn('VECO local state watch failed',e); }
  },1000);
}
function bindLocalPeerSync(){
  try{
    if('BroadcastChannel' in window && !localSyncChannel){
      localSyncChannel=new BroadcastChannel('veco_v3_sync');
      localSyncChannel.onmessage=(event)=>{
        if(event?.data?.type==='workorders-updated') scheduleLocalRefresh();
      };
    }
    window.addEventListener('storage',(event)=>{
      if(event.key===LOCAL_SYNC_KEY || event.key===window.VECO_STORAGE?.key) scheduleLocalRefresh();
    });
    startLocalStateWatch();
  }catch(e){ console.warn('VECO local peer sync unavailable',e); }
}
function uid(prefix){return `${prefix}-${String(Date.now()).slice(-6)}`}
function icon(i){return `<span class="icon">${i}</span>`}
function nav(){
  const groups=[
    ['Töö',[['calendar','▦'],['team','◫'],['mobile','▤']]],
    ['Haldus',[['workorders','☑'],['acts','▧'],['oncall','☎'],['vacations','▤'],['people','☷'],['objects','⌂'],['clients','▥'],['projects','▣'],['ticker','▭']]],
    ['Süsteem',[['system-database','↔'],['system-export','⇩'],['system-import','⇧']]],
    ['Arendus',[['mobilePreview','▧'],['demo','↺'],['diagnostics','◎']]]
  ];
  const navItem=([key,ic])=>{
    if(key==='system-database') return `<button type="button" id="databaseBtn">${icon(ic)}Andmebaas: ${window.VECO_API?.modeLabel?.()||'lokaalne'}</button>`;
    if(key==='system-export') return `<button type="button" id="exportDataBtn">${icon(ic)}Varukoopia</button>`;
    if(key==='system-import') return `<label class="nav-file-action" for="importDataFile">${icon(ic)}Taasta</label>`;
    return `<a class="${page===key?'active':''}" href="${pageFiles[key]}">${icon(ic)}${pageTitles[key]}</a>`;
  };
  const navGroups=groups.map(([title,items])=>`<div class="nav-section"><div class="nav-section-title">${title}</div>${items.map(navItem).join('')}</div>`).join('');
  return `<aside class="sidebar"><div class="sidebar-actions"><button class="btn ghost sidebar-toggle" id="sidebarToggleBtn" type="button" title="Näita/peida menüü" aria-label="Näita/peida menüü">${icon('☰')}</button><input id="importDataFile" type="file" accept="application/json" class="hidden"></div><nav class="nav nav-grouped" aria-label="Põhivaated">${navGroups}</nav></aside>`
}
function themeLogo(){
  return `<button class="brand-badge brand-theme-toggle" type="button" data-theme-toggle title="Vaheta hele/tume režiim" aria-label="Vaheta hele/tume režiim"><span class="brand-wordmark">VECO</span></button>`;
}
function currentOncallLabel(days=null){
  const contextDays=Array.isArray(days)&&days.length ? days : (Array.isArray(window.__VECO_ONCALL_CONTEXT_DAYS__)&&window.__VECO_ONCALL_CONTEXT_DAYS__.length ? window.__VECO_ONCALL_CONTEXT_DAYS__ : [dateKeyFromDate(new Date())]);
  const start=contextDays[0];
  const end=contextDays[contextDays.length-1];
  const names=state.oncall
    .filter(o=>o.start<=end&&o.end>=start)
    .map(o=>techName(o.personId))
    .filter(name=>name&&name!=='-');
  return [...new Set(names)].length ? [...new Set(names)].join(', ') : 'PUUDUB';
}
function oncallPill(){
  return `<button class="context-pill view-context-pill oncall-pill" type="button" title="Valitud perioodi valve" aria-label="Valitud perioodi valve">VALVE · ${esc(currentOncallLabel()).toUpperCase()}</button>`;
}
function viewContextText(value){
  return String(value||'').toUpperCase();
}
function header(title,filters='',actions='',context=''){
  const label=viewContextText(context||title);
  if(page==='mobile') return `<div class="panel-head mobile-head"><div><h2>${esc(label)}</h2><span class="muted">Lihtne tehniku töövaade</span></div></div>`;
  return `<div class="panel-head view-head"><div class="view-head-left"><div class="brand-row">${themeLogo()}<h2 class="context-pill view-context-pill">${esc(label)}</h2>${oncallPill()}</div>${filters?`<div class="filter-row">${filters}</div>`:''}</div><div class="view-head-right">${actions?`<div class="action-row">${actions}</div>`:''}</div></div>`
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
function openModal(html){
  const modal=$('#modal');
  if(!modal) return;
  modal.innerHTML=`<div class="dialog" role="dialog" aria-modal="true">${html}</div>`;
  modal.classList.add('open');
  document.body.classList.add('modal-open');

  // Taustale klikk sulgeb akna, akna sees klikk ei sulge.
  // Kasutame onclicki, et iga uue modali avamisel ei jääks vanu kuulareid külge.
  modal.onclick=(e)=>{
    if(e.target===modal) closeModal();
  };
  modal.querySelector('.dialog')?.addEventListener('click',e=>e.stopPropagation());

  if(modalEscHandler) document.removeEventListener('keydown',modalEscHandler);
  modalEscHandler=(e)=>{
    if(e.key==='Escape' && modal.classList.contains('open')){
      e.preventDefault();
      closeModal();
    }
  };
  document.addEventListener('keydown',modalEscHandler);
}
function closeModal(){
  const modal=$('#modal');
  modal?.classList.remove('open');
  if(modal){
    modal.onclick=null;
    modal.innerHTML='';
  }
  document.body.classList.remove('modal-open');
  if(modalEscHandler){
    document.removeEventListener('keydown',modalEscHandler);
    modalEscHandler=null;
  }
}
function showSyncNotice(text='Andmed uuendatud'){
  let el=document.getElementById('syncNotice');
  if(!el){
    el=document.createElement('div');
    el.id='syncNotice';
    el.className='sync-notice';
    document.body.appendChild(el);
  }
  el.textContent=text;
  el.classList.add('show');
  clearTimeout(window.__VECO_SYNC_NOTICE_TIMER__);
  window.__VECO_SYNC_NOTICE_TIMER__=setTimeout(()=>el.classList.remove('show'),1800);
}
function bindClose(){ $('#modalCloseBtn')?.addEventListener('click',closeModal); $('#cancelModalBtn')?.addEventListener('click',closeModal); }

function openVecoConfirm({title='Kinnitus',message='',details='',confirmText='OK',cancelText='Loobu',danger=false}={}){
  return new Promise(resolve=>{
    const existing=document.getElementById('vecoConfirm');
    if(existing) existing.remove();
    const el=document.createElement('div');
    el.id='vecoConfirm';
    el.className='confirm-modal open';
    el.innerHTML=`<div class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="vecoConfirmTitle">
      <div class="dialog-head"><h2 id="vecoConfirmTitle">${esc(title)}</h2></div>
      <div class="detail-body">
        <div class="confirm-message">${esc(message)}</div>
        ${details?`<div class="confirm-details">${details}</div>`:''}
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" id="vecoConfirmCancel">${esc(cancelText)}</button>
        <button type="button" class="btn ${danger?'danger':'primary'}" id="vecoConfirmOk">${esc(confirmText)}</button>
      </div>
    </div>`;
    const cleanup=(value)=>{
      document.removeEventListener('keydown',onKey);
      el.remove();
      resolve(value);
    };
    const onKey=(e)=>{
      if(e.key==='Escape'){
        e.preventDefault();
        cleanup(false);
      }
      if(e.key==='Enter'){
        e.preventDefault();
        cleanup(true);
      }
    };
    document.body.appendChild(el);
    document.addEventListener('keydown',onKey);
    el.addEventListener('click',e=>{ if(e.target===el) cleanup(false); });
    el.querySelector('#vecoConfirmCancel')?.addEventListener('click',()=>cleanup(false));
    el.querySelector('#vecoConfirmOk')?.addEventListener('click',()=>cleanup(true));
    setTimeout(()=>el.querySelector('#vecoConfirmCancel')?.focus(),0);
  });
}

function openCompletionCommentModal(w,initial=''){
  return new Promise(resolve=>{
    const existing=document.getElementById('vecoConfirm');
    if(existing) existing.remove();
    const el=document.createElement('div');
    el.id='vecoConfirm';
    el.className='confirm-modal open';
    el.innerHTML=`<form class="confirm-dialog" id="completionCommentForm" role="dialog" aria-modal="true" aria-labelledby="completionCommentTitle">
      <div class="dialog-head"><h2 id="completionCommentTitle">Töö lõpetamine</h2></div>
      <div class="detail-body">
        <div class="confirm-message">Lisa töö tulemus enne töökäsu lõpetamist.</div>
        <div class="confirm-details"><strong>${esc(w?.id||'')}</strong><br>${esc(objectName(w?.objectId))}<br>${esc(w?.title||'')}</div>
        <label class="full" style="display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:650;">Akti tüüp<select class="select" id="completionActType"><option value="Väljakutse akt">Väljakutse akt</option></select></label>
        <label class="full" style="display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:650;">Töö tulemus *<textarea id="completionCommentInput" required minlength="5" placeholder="Kirjelda lühidalt, mis tehti või mis seis jäi.">${esc(initial||'')}</textarea></label>
        <div class="form-error hidden" id="completionCommentError">Töö tulemus on kohustuslik.</div>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" id="completionCommentCancel">Loobu</button>
        <button type="submit" class="btn primary" id="completionCommentOk">Lõpeta töö</button>
      </div>
    </form>`;
    const cleanup=(value)=>{
      document.removeEventListener('keydown',onKey);
      el.remove();
      resolve(value);
    };
    const input=()=>el.querySelector('#completionCommentInput');
    const error=()=>el.querySelector('#completionCommentError');
    const onKey=(e)=>{ if(e.key==='Escape'){ e.preventDefault(); cleanup(null); } };
    document.body.appendChild(el);
    document.addEventListener('keydown',onKey);
    el.addEventListener('click',e=>{ if(e.target===el) cleanup(null); });
    el.querySelector('#completionCommentCancel')?.addEventListener('click',()=>cleanup(null));
    el.querySelector('#completionCommentForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const value=String(input()?.value||'').trim();
      if(value.length<5){ error()?.classList.remove('hidden'); input()?.focus(); return; }
      cleanup({comment:value,actType:el.querySelector('#completionActType')?.value||'Väljakutse akt'});
    });
    input()?.addEventListener('input',()=>error()?.classList.add('hidden'));
    setTimeout(()=>input()?.focus(),0);
  });
}

function normalizeCompletionResult(result){
  if(!result) return null;
  if(typeof result==='string') return {comment:result,actType:'Väljakutse akt'};
  return {comment:String(result.comment||'').trim(),actType:result.actType||'Väljakutse akt'};
}

function actNumber(a){
  if(!a) return '';
  if(String(a.number||'').startsWith('VECO-')) return a.number;
  if(String(a.id||'').startsWith('VECO-')) return a.id;
  const date=String(a.createdAt||a.date||dateKeyFromDate(new Date())).replace(/[^0-9]/g,'').slice(0,8)||dateKeyFromDate(new Date()).replace(/-/g,'');
  const suffix=String(a.id||'ACT').replace(/[^0-9A-Za-z]/g,'').slice(-4).toUpperCase();
  return `VECO-${date}-${suffix}`;
}

function timestampActId(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `VECO-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function actTypeCode(type){
  const t=String(type||'').toLowerCase();
  if(t.includes('väljakutse')||t.includes('valjakutse')) return 'VA';
  if(t.includes('hooldus')) return 'HA';
  if(t.includes('defekt')) return 'DA';
  if(t.includes('elektr')) return 'EA';
  if(t.includes('gaas')) return 'GA';
  if(t.includes('jahut')) return 'JA';
  return 'AKT';
}
function fmtActDate(dateKey){
  if(!dateKey) return '';
  const m=String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return `${m[3]}.${m[2]}.${m[1]}`;
  return String(dateKey);
}
function fmtActDateTime(dateKey,time){
  const d=fmtActDate(dateKey);
  return `${d}${time?' '+time:''}`.trim();
}
function renderObjects(){
  const clientFilter=$('#objectClientFilter')?.value||'all';
  const techFilter=$('#objectTechFilter')?.value||'all';
  const q=($('#objectSearch')?.value||'').toLowerCase();
  const objects=state.objects.filter(o=>(clientFilter==='all'||o.clientId===clientFilter)&&(techFilter==='all'||o.responsibleTechId===techFilter)&&`${o.name} ${o.address} ${clientName(o.clientId)} ${o.notes}`.toLowerCase().includes(q));
  if(!objects.some(o=>o.id===selectedObjectId)) selectedObjectId=objects[0]?.id||state.objects[0]?.id||'';
  const filters=`<input class="field" id="objectSearch" placeholder="Otsi objekti, aadressi või klienti..." value="${esc(q)}"><select class="select" id="objectClientFilter"><option value="all">Kõik kliendid</option>${state.clients.map(c=>`<option value="${c.id}" ${clientFilter===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><select class="select" id="objectTechFilter"><option value="all">Kõik tehnikud</option>${state.people.map(p=>`<option value="${p.id}" ${techFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;
  const actions=`<button class="btn primary" id="newObjectBtn">${icon('＋')}Lisa objekt</button>`;
  const rows=objects.map(o=>`<tr data-object-id="${o.id}" class="${detailOpen.objects&&o.id===selectedObjectId?'selected':''}"><td><strong>${esc(o.name)}</strong><div class="muted">${esc(o.address)}</div></td><td>${esc(clientName(o.clientId))}</td><td>${esc(techName(o.responsibleTechId))}</td><td>${objectProjects(o.id).length}</td><td>${objectWorkorders(o.id).filter(w=>!isCompletedStatus(w.status)).length}</td><td><span class="status ${statusClass(o.status)}">${o.status==='active'?'Aktiivne':'Peatatud'}</span></td></tr>`);
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
  if(objectTab==='projects') body=`<div class="list">${objectProjects(o.id).map(p=>`<div class="event-row"><strong>${esc(p.name)}</strong><span class="muted">Vastutaja: ${esc(techName(p.responsibleTechId))} · tähtaeg ${esc(fmtActDate(p.deadline))}</span><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></div>`).join('')||'<span class="muted">Projekte pole.</span>'}</div>`;
  if(objectTab==='workorders') body=`<div class="list">${objectWorkorders(o.id).map(w=>`<div class="event-row"><strong>${esc(fmtActDate(w.date))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(workorderAssigneeLabel(w))} · ${esc(w.description)}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töökäske pole.</span>'}</div>`;
  if(objectTab==='acts') body=`<div class="list">${objectActs(o.id).map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="muted">Seotud töökäsk: ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
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
  const actions=`<button class="btn primary" id="newClientBtn">${icon('＋')}Lisa klient</button>`;
  const rows=clients.map(c=>{const objs=clientObjects(c.id),pros=clientProjects(c.id),wo=clientWorkorders(c.id).filter(w=>!isCompletedStatus(w.status));return `<tr data-client-id="${c.id}" class="${c.id===selectedClientId?'selected':''}"><td><strong>${esc(c.name)}</strong><div class="muted">${esc(c.regNo)}</div></td><td>${esc(c.contact)}</td><td>${esc(c.phone)}</td><td>${objs.length}</td><td>${pros.length}</td><td>${wo.length}</td><td><span class="status ${c.active?'ok':'red'}">${c.active?'Aktiivne':'Peatatud'}</span></td></tr>`});
  const main=header('Klientide register',filters,actions,'Kliendid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Kliente',state.clients.length)}${summaryBox('Objekte',state.objects.length)}${summaryBox('Projekte',state.projects.length)}${summaryBox('Avatud töid',openWorkorders().length)}</div>${table(['Klient','Kontakt','Telefon','Objektid','Projektid','Avatud tööd','Staatus'],rows)}</div>`;
  shell(main,clientDetailHtml()); $('#clientSearch')?.addEventListener('input',renderClients); $('#clientStatusFilter')?.addEventListener('change',renderClients);
  $$('[data-client-id]').forEach(row=>row.addEventListener('click',()=>{selectedClientId=row.dataset.clientId;renderClients();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedClientId=state.clients[0]?.id||'';renderClients();}); $('#newClientBtn')?.addEventListener('click',()=>openClientModal()); bindClientDetail();
}
function clientDetailHtml(){
  const c=byId(state.clients,selectedClientId); if(!c) return detailHeader('Kliendi detail')+`<div class="detail-body"><span class="muted">Vali klient.</span></div>`;
  const tabs=[['overview','Üldinfo'],['objects','Objektid'],['projects','Projektid'],['workorders','Töökäsud'],['acts','Aktid']];
  const objs=clientObjects(c.id), projects=clientProjects(c.id), workorders=clientWorkorders(c.id), acts=clientActs(c.id); let body='';
  if(clientTab==='overview') body=`<div class="summary-grid">${summaryBox('Objekte',objs.length)}${summaryBox('Projekte',projects.length)}${summaryBox('Töökäske',workorders.length)}${summaryBox('Akte',acts.length)}</div>${card(c.name,[['Registrikood',c.regNo],['Kontakt',c.contact],['Telefon',c.phone],['E-post',c.email],['Arve e-post',c.invoiceEmail]],c.active?'Aktiivne':'Peatatud',`<div class="section-title">Märkused</div><div class="muted">${esc(c.notes)}</div>`)}<div class="section-title">Kiirülevaade</div><div class="list"><div class="event-row"><strong>Objektid</strong><span class="muted">${objs.map(o=>o.name).join(', ')||'Puuduvad'}</span></div><div class="event-row"><strong>Avatud tööd</strong><span class="muted">${workorders.filter(w=>!isCompletedStatus(w.status)).map(w=>`${fmtActDate(w.date)} · ${w.title}`).join(', ')||'Puuduvad'}</span></div></div>`;
  if(clientTab==='objects') body=`<div class="list">${objs.map(o=>`<div class="event-row"><strong>${esc(o.name)}</strong><span class="muted">${esc(o.address)} · vastutaja ${esc(techName(o.responsibleTechId))}</span><span class="status ${o.status==='active'?'ok':'red'}">${o.status==='active'?'Aktiivne':'Peatatud'}</span></div>`).join('')||'<span class="muted">Objekte pole.</span>'}</div>`;
  if(clientTab==='projects') body=`<div class="list">${projects.map(p=>`<div class="event-row"><strong>${esc(p.name)}</strong><span class="muted">Objekt: ${esc(objectName(p.objectId))} · tähtaeg ${esc(fmtActDate(p.deadline))}</span><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></div>`).join('')||'<span class="muted">Projekte pole.</span>'}</div>`;
  if(clientTab==='workorders') body=`<div class="list">${workorders.map(w=>`<div class="event-row"><strong>${esc(fmtActDate(w.date))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(objectName(w.objectId))} · ${esc(workorderAssigneeLabel(w))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töökäske pole.</span>'}</div>`;
  if(clientTab==='acts') body=`<div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="muted">Objekt: ${esc(objectName(a.objectId))} · töökäsk ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
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
  const actions=`<button class="btn primary" id="newProjectBtn">${icon('＋')}Lisa projekt</button>`;
  const rows=projects.map(p=>`<tr data-project-id="${p.id}" class="${detailOpen.projects&&p.id===selectedProjectId?'selected':''}"><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.description)}</div></td><td>${esc(clientName(projectClientId(p.id)))}</td><td>${esc(objectName(p.objectId))}</td><td>${esc(techName(p.responsibleTechId))}</td><td>${esc(fmtActDate(p.deadline))}</td><td>${projectWorkorders(p.id).length}</td><td><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></td></tr>`);
  const main=header('Projektide register',filters,actions,'Projektid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Projekte',state.projects.length)}${summaryBox('Töökäske',state.workorders.length)}${summaryBox('Avatud töid',openWorkorders().length)}${summaryBox('Akte',state.acts.length)}</div>${table(['Projekt','Klient','Objekt','Vastutaja','Tähtaeg','Töökäsud','Staatus'],rows)}</div>`;
  shell(main,detailOpen.projects?projectDetailHtml():''); $('#projectSearch')?.addEventListener('input',renderProjects); $('#projectClientFilter')?.addEventListener('change',renderProjects); $('#projectStatusFilter')?.addEventListener('change',renderProjects);
  $$('[data-project-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.projectId; if(detailOpen.projects&&selectedProjectId===id){detailOpen.projects=false;}else{selectedProjectId=id;detailOpen.projects=true;} renderProjects();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedProjectId=state.projects[0]?.id||'';detailOpen.projects=false;renderProjects();}); $('#newProjectBtn')?.addEventListener('click',()=>openProjectModal()); bindProjectDetail();
}
function projectDetailHtml(){
  const p=byId(state.projects,selectedProjectId); if(!p) return detailHeader('Projekti detail')+`<div class="detail-body"><span class="muted">Vali projekt.</span></div>`;
  const tabs=[['overview','Üldinfo'],['workorders','Töökäsud'],['acts','Aktid']]; const wos=projectWorkorders(p.id), acts=projectActs(p.id); let body='';
  if(projectTab==='overview') body=`<div class="summary-grid">${summaryBox('Töökäske',wos.length)}${summaryBox('Avatud',wos.filter(w=>!isCompletedStatus(w.status)).length)}${summaryBox('Akte',acts.length)}${summaryBox('Tähtaeg',fmtActDate(p.deadline))}</div>${card(p.name,[['Klient',clientName(projectClientId(p.id))],['Objekt',objectName(p.objectId)],['Vastutaja',techName(p.responsibleTechId)],['Tähtaeg',fmtActDate(p.deadline)]],p.status,`<div class="section-title">Kirjeldus</div><div class="muted">${esc(p.description)}</div>`)}`;
  if(projectTab==='workorders') body=`<div class="list">${wos.map(w=>`<div class="event-row"><strong>${esc(fmtActDate(w.date))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(workorderAssigneeLabel(w))} · ${esc(w.description)}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töökäske pole.</span>'}</div>`;
  if(projectTab==='acts') body=`<div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="muted">Töökäsk: ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
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
  const list=state.workorders.filter(w=>(status==='all'||w.status===status)&&(tech==='all'||workorderMatchesPerson(w,tech))&&`${w.title} ${w.description} ${objectName(w.objectId)} ${projectName(w.projectId)} ${workorderPeopleLabel(w)}`.toLowerCase().includes(q));
  if(!list.some(w=>w.id===selectedWorkorderId)) selectedWorkorderId=list[0]?.id||state.workorders[0]?.id||'';
  const filters=`<input class="field" id="woSearch" placeholder="Otsi töökäsku..." value="${esc(q)}"><select class="select" id="woTechFilter"><option value="all">Kõik tehnikud</option>${state.people.map(p=>`<option value="${p.id}" ${tech===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><select class="select" id="woStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn primary" id="newWorkorderBtn">${icon('＋')}Lisa töökäsk</button>`;
  const rows=list.map(w=>`<tr data-workorder-id="${w.id}" class="${detailOpen.workorders&&w.id===selectedWorkorderId?'selected':''}"><td><strong>${esc(w.title)}</strong><div class="muted">${esc(w.description)}</div></td><td>${esc(fmtActDate(w.date))} ${esc(w.time)}</td><td>${esc(clientName(objectClientId(w.objectId)))}</td><td>${esc(objectName(w.objectId))}</td><td>${esc(projectName(w.projectId))}</td><td>${esc(workorderAssigneeLabel(w))}</td><td><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></td></tr>`);
  const main=header('Töökäsud',filters,actions,'Töökäsud')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Töökäske',state.workorders.length)}${summaryBox('Avatud',openWorkorders().length)}${summaryBox('Lõpetatud',state.workorders.filter(w=>isCompletedStatus(w.status)).length)}${summaryBox('Aktid',state.acts.length)}</div>${table(['Töö','Aeg','Klient','Objekt','Projekt','Vastutaja / osalejad','Staatus'],rows)}</div>`;
  shell(main,detailOpen.workorders?workorderDetailHtml():''); $('#woSearch')?.addEventListener('input',renderWorkorders); $('#woTechFilter')?.addEventListener('change',renderWorkorders); $('#woStatusFilter')?.addEventListener('change',renderWorkorders);
  $$('[data-workorder-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.workorderId; if(detailOpen.workorders&&selectedWorkorderId===id){detailOpen.workorders=false;}else{selectedWorkorderId=id;detailOpen.workorders=true;} renderWorkorders();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedWorkorderId=state.workorders[0]?.id||'';detailOpen.workorders=false;renderWorkorders();}); $('#newWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal()); bindWorkorderDetail();
}
function workorderDetailHtml(){
  const w=byId(state.workorders,selectedWorkorderId); if(!w) return detailHeader('Töökäsu detail')+`<div class="detail-body"><span class="muted">Vali töökäsk.</span></div>`;
  const acts=state.acts.filter(a=>a.workorderId===w.id);
  const body=`<div class="summary-grid">${summaryBox('Aktid',acts.length)}${summaryBox('Kuupäev',fmtActDate(w.date))}${summaryBox('Kell',w.time)}${summaryBox('Staatus',w.status)}</div>${card(w.title,[['Klient',clientName(objectClientId(w.objectId))],['Objekt',objectName(w.objectId)],['Projekt',projectName(w.projectId)],['Vastutaja',techName(workorderResponsibleId(w))],['Osalejad',workorderParticipantIds(w).map(techName).join(', ')||'-'],['Aeg',`${fmtActDate(w.date)} ${w.time}`]],w.status,`<div class="section-title">Kirjeldus</div><div class="muted">${esc(w.description)}</div>`)}<div class="section-title">Aktid</div><div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  return detailHeader('Töökäsu detail','<button class="btn small" id="editWorkorderBtn">✎ Muuda</button><button class="btn small primary" id="createActBtn">＋ Loo akt</button><button class="btn small" id="previewWorkorderActBtn" type="button">👁 Eelvaade</button><button class="btn small" id="printWorkorderActBtn" type="button">⎙ Prindi</button><button class="btn small" id="pdfWorkorderActBtn" type="button">⇩ Salvesta PDF</button><button class="btn small ghost" id="workorderDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body">${body}</div>`;
}
function bindWorkorderDetail(){ $('#editWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal(selectedWorkorderId)); $('#createActBtn')?.addEventListener('click',()=>openActModal('',{workorderId:selectedWorkorderId})); $('#previewWorkorderActBtn')?.addEventListener('click',()=>openWorkorderActPrint(selectedWorkorderId)); $('#printWorkorderActBtn')?.addEventListener('click',()=>{const a=ensureActForWorkorder(selectedWorkorderId); if(a) printAct(a.id);}); $('#pdfWorkorderActBtn')?.addEventListener('click',()=>{const a=ensureActForWorkorder(selectedWorkorderId); if(a) saveActPdf(a.id);}); $('#workorderDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.workorders=false;renderWorkorders();}); }
function openWorkorderModal(id='',defaults={}){
  const isEdit=!!id;
  const existing=isEdit?byId(state.workorders,id):null;
  const w=existing||{
    projectId:'',objectId:'',title:'',
    date:defaults.date||'',time:defaults.time||'09:00',
    technicianId:'',responsibleTechnicianId:'',participantTechnicianIds:[],status:defaults.status||'Planeeritud',description:'',
    plannedHours:defaults.plannedHours||2,durationHours:defaults.durationHours||2,hours:defaults.hours||2
  };
  const currentObject=byId(state.objects,w.objectId)||null;
  const currentClient=byId(state.clients,currentObject?.clientId)||null;
  const currentProject=byId(state.projects,w.projectId)||null;
  const currentHours=workorderHours(w);
  const objectOptions=state.objects.map(o=>`<option value="${esc(o.name)}" label="${esc(clientName(o.clientId))} · ${esc(o.address||'')}"></option>`).join('');
  const clientOptions=state.clients.map(c=>`<option value="${esc(c.name)}" label="${esc(c.contact||'')}"></option>`).join('');
  const projectOptions=state.projects.map(p=>`<option value="${esc(p.name)}" label="${esc(objectName(p.objectId))}"></option>`).join('');
  const responsibleId=workorderResponsibleId(w);
  const participantIds=workorderParticipantIds(w);
  const participantOptions=state.people.map(p=>`<option value="${p.id}" ${participantIds.includes(p.id)?'selected':''}>${esc(p.name)}</option>`).join('');
  const title=isEdit?`Töökäsk ${esc(w.id)}`:'Lisa töökäsk';
  openModal(`<form id="workorderForm"><div class="dialog-head"><h2>${title}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid">
    <label class="full">Töö nimetus<input class="field" name="title" required placeholder="Kirjuta töö nimetus..." value="${esc(w.title)}"></label>
    <label>Klient<input class="field" name="clientName" list="clientOptions" placeholder="Vali või otsi klient..." value="${isEdit?esc(currentClient?.name||''):''}"><datalist id="clientOptions">${clientOptions}</datalist></label>
    <label>Objekt<input class="field" name="objectName" list="objectOptions" placeholder="Vali või otsi objekt..." value="${isEdit?esc(currentObject?.name||''):''}" required><datalist id="objectOptions">${objectOptions}</datalist></label>
    <label>Projekt<input class="field" name="projectName" list="projectOptions" placeholder="Vali projekt või jäta tühjaks..." value="${isEdit?esc(currentProject?.name||''):''}"><datalist id="projectOptions">${projectOptions}</datalist></label>
    <label>Vastutaja<select class="select" name="responsibleTechnicianId"><option value="">Vali vastutaja...</option>${state.people.map(p=>`<option value="${p.id}" ${responsibleId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Osalejad<select class="select" name="participantTechnicianIds" multiple size="4">${participantOptions}</select><span class="muted">Ctrl/⌘ + klikk mitme osaleja valimiseks.</span></label>
    <label>Staatus<select class="select" name="status">${workorderStatusOptions.map(s=>`<option ${w.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
    <label>Kuupäev<input class="field" name="date" type="date" value="${esc(w.date)}"></label>
    <label>Algusaeg<input class="field" name="time" type="time" value="${esc(w.time)}"></label>
    <label>Kestus<div class="unit-field"><input class="field" name="plannedHours" type="number" min="1" max="16" step="1" value="${esc(currentHours)}"><span>h</span></div></label>
    <label class="full">Kirjeldus<textarea name="description" placeholder="Lisa töö kirjeldus või juhised...">${esc(w.description)}</textarea></label>
    ${!isEdit?'<div class="full muted">Uue töökäsu loomisel klienti, objekti, projekti ega tehnikut automaatselt ei valita. Kuupäev ja kell võivad tulla kalendris klikitud ajast.</div>':''}
  </div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Sulge</button>${isEdit?'<button type="button" class="btn danger" id="deleteWorkorderBtn">Kustuta</button>':''}<button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  const form=$('#workorderForm');
  const resolveObject=()=>{
    const rawObject=form.elements.objectName.value.trim();
    const objectText=rawObject.toLowerCase();
    const clientText=form.elements.clientName.value.trim().toLowerCase();
    if(!objectText) return null;
    const client=clientText
      ? (state.clients.find(c=>c.name.toLowerCase()===clientText)||state.clients.find(c=>c.name.toLowerCase().includes(clientText)))
      : null;
    let candidates=state.objects;
    if(client){
      const scoped=state.objects.filter(o=>o.clientId===client.id);
      if(scoped.length) candidates=scoped;
    }
    let obj=candidates.find(o=>o.name.toLowerCase()===objectText)
      || candidates.find(o=>o.name.toLowerCase().includes(objectText))
      || state.objects.find(o=>o.name.toLowerCase()===objectText);
    if(obj) return obj;
    obj={
      id:uid('O'),
      clientId:client?.id||'',
      name:rawObject,
      address:'',
      mainContact:'',
      responsibleTechId:form.elements.responsibleTechnicianId?.value||'',
      contract:'',
      status:'active',
      notes:'Lisatud kalendri töökäsu loomisel.',
      contacts:[]
    };
    state.objects.push(obj);
    return obj;
  };
  const resolveProject=(obj)=>{
    const text=form.elements.projectName.value.trim().toLowerCase();
    if(!text) return null;
    return state.projects.find(p=>p.name.toLowerCase()===text)||state.projects.find(p=>p.name.toLowerCase().includes(text)&&(!obj||p.objectId===obj.id))||null;
  };
  form.elements.clientName?.addEventListener('input',()=>{
    const clientText=form.elements.clientName.value.trim().toLowerCase();
    const client=state.clients.find(c=>c.name.toLowerCase()===clientText);
    if(client){
      const opts=state.objects.filter(o=>o.clientId===client.id).map(o=>`<option value="${esc(o.name)}" label="${esc(o.address||'')}"></option>`).join('');
      const dl=document.getElementById('objectOptions');
      if(dl) dl.innerHTML=opts||objectOptions;
    }
  });
  $('#deleteWorkorderBtn')?.addEventListener('click',async()=>{
    if(!existing) return;
    const ok=await openVecoConfirm({
      title:'Kustuta töökäsk',
      message:'Kas soovid selle töökäsu kustutada?',
      details:`<strong>${esc(existing.id)}</strong><br>${esc(objectName(existing.objectId))}<br>${esc(existing.title)}`,
      confirmText:'Kustuta',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    state.workorders=state.workorders.filter(x=>x.id!==existing.id);
    window.VECO_STORAGE.save(state);
    if(window.VECO_API?.deleteWorkorder) await window.VECO_API.deleteWorkorder(existing.id);
    closeModal();
    if(page==='calendar') renderCalendar(); else if(page==='projects') renderProjects(); else if(page==='objects') renderObjects(); else renderWorkorders();
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const obj=resolveObject();
    if(!obj){ f.objectName.focus(); return; }
    const project=resolveProject(obj);
    const hours=Number(f.plannedHours.value)||2;
    const previousStatus=isEdit?existing.status:'';
    const nextStatus=f.status.value;
    const next={
      id:id||uid('WO'),
      projectId:project?.id||'',
      objectId:obj.id,
      title:f.title.value,
      date:f.date.value,
      time:f.time.value,
      technicianId:f.responsibleTechnicianId.value,
      responsibleTechnicianId:f.responsibleTechnicianId.value,
      participantTechnicianIds:Array.from(f.participantTechnicianIds?.selectedOptions||[]).map(o=>o.value).filter(id=>id&&id!==f.responsibleTechnicianId.value),
      status:nextStatus,
      description:f.description.value,
      plannedHours:hours,
      durationHours:hours,
      hours:hours
    };
    if(nextStatus==='Lõpetatud' && !isCompletedStatus(previousStatus)){
      const result=normalizeCompletionResult(await openCompletionCommentModal(next,completionCommentText(existing)));
      if(!result) return;
      next.completedAt=new Date().toISOString();
      next.completedBy=completedByLabel(next);
      next.completionComment=result.comment;
      next.actType=result.actType;
    }else if(nextStatus==='Lõpetatud' && isEdit){
      const currentComment=completionCommentText(existing);
      if(!currentComment){
        const result=normalizeCompletionResult(await openCompletionCommentModal(next,''));
        if(!result) return;
        next.completionComment=result.comment;
        next.actType=result.actType;
      }else{
        next.completionComment=currentComment;
      }
      next.completedAt=existing.completedAt||new Date().toISOString();
      next.completedBy=existing.completedBy||completedByLabel(next);
    }else{
      next.completedAt='';
      next.completedBy='';
      next.completionComment='';
    }
    if(isEdit){Object.assign(existing,next)}else{state.workorders.push(next);selectedWorkorderId=next.id;detailOpen.workorders=true}
    if(isCompletedStatus(next.status)) ensureActForWorkorder(next.id);
    save();closeModal();
    if(page==='calendar') renderCalendar(); else if(page==='projects') renderProjects(); else if(page==='objects') renderObjects(); else renderWorkorders();
  });
}

function ensureActForWorkorder(workorderId){
  const w=byId(state.workorders,workorderId);
  if(!w) return null;
  let a=state.acts.find(x=>x.workorderId===w.id);
  if(a) return a;
  a={
    id:timestampActId(),
    number:timestampActId(),
    workorderId:w.id,
    objectId:w.objectId,
    date:w.date||dateKeyFromDate(new Date()),
    title:`${w.actType||'Väljakutse akt'} - ${objectName(w.objectId)}`,
    status:'Mustand',
    type:w.actType||'Väljakutse akt',
    createdAt:new Date().toISOString()
  };
  state.acts.push(a);
  save();
  return a;
}
function actPrintHtml(actId,{autoPrint=false,autoPdf=false}={}){
  const a=byId(state.acts,actId);
  if(!a) return '';
  const w=byId(state.workorders,a.workorderId)||{};
  const obj=byId(state.objects,a.objectId||w.objectId)||{};
  const client=byId(state.clients,obj.clientId)||{};
  const startTime=w.time||'';
  const endTime=w.time?workorderEndTime(w):'';
  const result=completionCommentText(w)||'Töö tulemus puudub.';
  const logoUrl=new URL('assets/img/veco-act-logo.jpg', window.location.href).href;
  const headerLeft=[['Akt nr',actNumber(a)],['Kuupäev',fmtActDate(a.date||w.date||'')]];
  const headerRight=[['Objekt',obj.name||''],['Töökäsk',w.id||a.workorderId]];
  const topItems=[
    ['Klient',client.name||''],['Staatus',w.status||a.status],['Vastutaja',techName(workorderResponsibleId(w))],['Osalejad',workorderParticipantIds(w).map(techName).join(', ')||'-'],['Kestus',`${workorderHours(w)} h`],
    ['Algus',fmtActDateTime(w.date||a.date||'',startTime)],['Lõpp',endTime],['Tüüp',a.type||'Väljakutse akt'],['Töökäsk',w.id||a.workorderId]
  ];
  const autoScript=autoPrint?`<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script>`:'';
  const helper=autoPrint?'Prindivaade avatakse automaatselt.':'Akti eelvaade.';
  return `<!doctype html><html lang="et"><head><meta charset="utf-8"><title>${esc(actNumber(a))} · ${esc(a.title||'Väljakutse akt')}</title><style>
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:18px;font-size:12px;line-height:1.28;background:#fff}.actions{margin:0 0 12px;display:flex;gap:8px;flex-wrap:wrap}.btn{border:1px solid #777;background:#f7f7f7;padding:8px 12px;border-radius:6px;cursor:pointer}.act-head{display:grid;grid-template-columns:1fr 170px 1fr;gap:18px;align-items:start;margin-bottom:16px}.head-side{display:grid;gap:10px}.head-card{border:1px solid #d9dee7;border-radius:8px;min-height:42px;padding:7px 9px;background:#f7f9fc}.head-card .value{font-size:12px}.top{text-align:center;display:flex;align-items:flex-start;justify-content:center;min-height:118px;padding-top:10px}.logo-img{width:68px;height:68px;object-fit:contain;display:block;margin:0 auto}.muted{color:#555;font-size:11px}.meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.meta-item{border:1px solid #d9dee7;border-radius:8px;min-height:42px;padding:7px 9px;overflow:hidden;background:#f7f9fc}.meta-item.address{grid-column:1/-1;min-height:42px}.label{font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}.value{font-size:12px;font-weight:700;color:#0f172a;overflow-wrap:anywhere}.section-title{font-size:14px;font-weight:800;margin:24px 0 7px;border-bottom:1px solid #cbd5e1;padding-bottom:5px;letter-spacing:.02em}.section-title.desc{margin-top:22px}.box{border:1px solid #d9dee7;border-radius:8px;padding:9px 10px;white-space:pre-wrap;overflow-wrap:anywhere}.box.description{min-height:36px}.box.result{min-height:96px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:12px}.signature{border:1px solid #d9dee7;border-radius:8px;min-height:72px;padding:9px}.signature-line{border-top:1px solid #999;margin-top:24px;padding-top:5px;color:#555}@media(max-width:800px){.act-head{grid-template-columns:1fr}.meta{grid-template-columns:1fr 1fr}.meta-item.address{grid-column:1/-1}}@media print{.actions{display:none} body{margin:10mm}.act-head{grid-template-columns:1fr 150px 1fr;gap:12px;margin-bottom:14px}.top{min-height:116px;padding-top:8px}.logo-img{width:62px;height:62px}.head-card,.meta-item{min-height:38px;padding:5px 7px}.meta{gap:8px}.section-title{margin-top:20px}.section-title.desc{margin-top:20px}.box.description{min-height:30px}.box.result{min-height:90px}.signature{min-height:68px}}
  </style>${autoScript}</head><body><div class="actions"><button class="btn" onclick="window.print()">Prindi</button><button class="btn" onclick="window.close()">Sulge</button><span class="muted">${esc(helper)}</span></div><div class="act-head"><div class="head-side">${headerLeft.map(([k,v])=>`<div class="head-card"><div class="label">${esc(k)}</div><div class="value">${esc(v||'-')}</div></div>`).join('')}</div><div class="top"><img class="logo-img" src="${logoUrl}" alt="VECO"></div><div class="head-side">${headerRight.map(([k,v])=>`<div class="head-card"><div class="label">${esc(k)}</div><div class="value">${esc(v||'-')}</div></div>`).join('')}</div></div><div class="section-title">Üldandmed</div><div class="meta">${topItems.map(([k,v])=>`<div class="meta-item"><div class="label">${esc(k)}</div><div class="value">${esc(v||'-')}</div></div>`).join('')}<div class="meta-item address"><div class="label">Aadress</div><div class="value">${esc(obj.address||'-')}</div></div></div><div class="section-title desc">Töö kirjeldus</div><div class="box description">${esc(w.description||'-')}</div><div class="section-title">Töö tulemus</div><div class="box result">${esc(result)}</div><div class="section-title">Allkirjad</div><div class="signatures"><div class="signature"><strong>Teostaja</strong><div>${esc(workorderPeopleLabel(w))}</div><div class="signature-line">Allkiri / kuupäev</div></div><div class="signature"><strong>Tellija</strong><div>&nbsp;</div><div class="signature-line">Allkiri / kuupäev</div></div></div></body></html>`;
}
function openActWindow(actId,mode='preview'){
  const html=actPrintHtml(actId,{autoPrint:mode==='print',autoPdf:mode==='pdf'});
  if(!html) return;
  const win=window.open('','_blank');
  if(!win){ alert('Brauser blokeeris akti akna. Luba popupid või proovi uuesti.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(()=>win.focus(),100);
}
function openActPreview(actId){ openActWindow(actId,'preview'); }
function printAct(actId){ openActWindow(actId,'print'); }

function actPdfData(actId){
  const a=byId(state.acts,actId); if(!a) return null;
  const w=byId(state.workorders,a.workorderId)||{};
  const obj=byId(state.objects,a.objectId||w.objectId)||{};
  const client=byId(state.clients,obj.clientId)||{};
  return {
    act:a, workorder:w, object:obj, client,
    number:actNumber(a),
    type:a.type||'Väljakutse akt',
    date:fmtActDate(a.date||w.date||''),
    clientName:client.name||'',
    objectName:obj.name||'',
    address:obj.address||'',
    technician:workorderPeopleLabel(w),
    workorder:w.id||a.workorderId||'',
    status:w.status||a.status||'',
    start:fmtActDateTime(w.date||a.date||'',w.time||''),
    end:w.time?workorderEndTime(w):'',
    duration:`${workorderHours(w)} h`,
    type:a.type||'Väljakutse akt',
    description:w.description||'-',
    result:completionCommentText(w)||'Töö tulemus puudub.'
  };
}
function actPdfFileName(a){
  const code=actTypeCode(a?.type||'Väljakutse akt');
  const number=String(actNumber(a)||timestampActId());
  const date=(number.match(/(\d{8})/)||[])[1] || String(a?.date||dateKeyFromDate(new Date())).replace(/[^0-9]/g,'').slice(0,8);
  let seq=(number.match(/(T\d{3,})$/i)||number.match(/(\d{6})$/)||[])[1] || String(a?.id||'0001').replace(/[^0-9A-Za-z]/g,'').slice(-4).toUpperCase();
  seq=String(seq).toUpperCase();
  return `VECO_${code}_${date}_${seq}.pdf`;
}
function loadActLogo(){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=new URL('assets/img/veco-act-logo.jpg', window.location.href).href;
  });
}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
  const words=String(text||'').replace(/\r/g,'').split(/\s+/);
  const lines=[];
  let line='';
  for(const word of words){
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>maxWidth && line){ lines.push(line); line=word; }
    else line=test;
  }
  if(line) lines.push(line);
  const shown=lines.slice(0,maxLines);
  if(lines.length>maxLines && shown.length){ shown[shown.length-1]=shown[shown.length-1].replace(/\s*$/,'')+'…'; }
  shown.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));
  return y+shown.length*lineHeight;
}
function roundRectPath(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.lineTo(x+w-rr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
  ctx.lineTo(x+w,y+h-rr); ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
  ctx.lineTo(x+rr,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-rr);
  ctx.lineTo(x,y+rr); ctx.quadraticCurveTo(x,y,x+rr,y); ctx.closePath();
}
function drawInfoCell(ctx,label,value,x,y,w,h){
  ctx.strokeStyle='#d7dee8'; ctx.lineWidth=1; ctx.fillStyle='#f7f9fc';
  roundRectPath(ctx,x,y,w,h,10); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#64748b'; ctx.font='700 14px Arial, Helvetica, sans-serif'; ctx.fillText(String(label).toUpperCase(),x+14,y+20);
  ctx.fillStyle='#0f172a'; ctx.font='700 18px Arial, Helvetica, sans-serif';
  wrapCanvasText(ctx,value||'-',x+14,y+46,w-28,22,2);
}
function jpegBytesFromDataUrl(dataUrl){
  const b64=dataUrl.split(',')[1]||'';
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return bytes;
}
function asciiBytes(str){ return new TextEncoder().encode(str); }
function buildImagePdf(jpegBytes,imgW,imgH){
  const pageW=595.28, pageH=841.89;
  const content=`q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
  const objs=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${asciiBytes(content).length} >>\nstream\n${content}endstream`,
    {image:true, bytes:jpegBytes, header:`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`, footer:'\nendstream'}
  ];
  const parts=[]; let offset=0; const offsets=[0];
  function push(part){
    const bytes=part instanceof Uint8Array ? part : asciiBytes(String(part));
    parts.push(bytes); offset+=bytes.length;
  }
  push('%PDF-1.4\n');
  objs.forEach((obj,i)=>{
    offsets.push(offset);
    push(`${i+1} 0 obj\n`);
    if(obj && obj.image){ push(obj.header); push(obj.bytes); push(obj.footer); }
    else push(obj);
    push('\nendobj\n');
  });
  const xref=offset;
  push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);
  for(let i=1;i<offsets.length;i++) push(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
  push(`trailer << /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts,{type:'application/pdf'});
}
async function renderActPdfCanvas(actId){
  const d=actPdfData(actId); if(!d) return null;
  const canvas=document.createElement('canvas');
  canvas.width=1240; canvas.height=1754;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  const left=70, gap=14, colW=(canvas.width-left*2-gap*3)/4;
  const logo=await loadActLogo();
  const logoSize=88;
  const headY=46;
  drawInfoCell(ctx,'Akt nr',d.number,left,headY,colW*1.55,58);
  drawInfoCell(ctx,'Kuupäev',d.date,left,headY+72,colW*1.55,58);
  drawInfoCell(ctx,'Objekt',d.objectName,canvas.width-left-colW*1.55,headY,colW*1.55,58);
  drawInfoCell(ctx,'Töökäsk',d.workorder,canvas.width-left-colW*1.55,headY+72,colW*1.55,58);
  if(logo){ ctx.drawImage(logo, (canvas.width-logoSize)/2, headY+16, logoSize, logoSize); }
  else { ctx.fillStyle='#2483ff'; ctx.beginPath(); ctx.arc(canvas.width/2,headY+16+logoSize/2,logoSize/2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='700 26px Arial'; ctx.textAlign='center'; ctx.fillText('VECO',canvas.width/2,headY+16+logoSize/2+8); ctx.textAlign='left'; }
  ctx.textAlign='left';

  let y=205;
  const cells=[
    ['Klient',d.clientName],['Staatus',d.status],['Tehnik',d.technician],['Kestus',d.duration],
    ['Algus',d.start],['Lõpp',d.end],['Tüüp',d.type],['Töökäsk',d.workorder]
  ];
  cells.forEach((c,i)=>{ const x=left+(i%4)*(colW+gap); const yy=y+Math.floor(i/4)*74; drawInfoCell(ctx,c[0],c[1],x,yy,colW,58); });
  y+=Math.ceil(cells.length/4)*74;
  drawInfoCell(ctx,'Aadress',d.address,left,y,canvas.width-left*2,58);
  y+=94;

  function section(title,body,minH,maxLines){
    ctx.fillStyle='#0f172a'; ctx.font='800 22px Arial, Helvetica, sans-serif'; ctx.fillText(title.toUpperCase(),left,y);
    y+=16; ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(canvas.width-left,y); ctx.stroke(); y+=17;
    ctx.fillStyle='#fff'; ctx.strokeStyle='#d7dee8'; roundRectPath(ctx,left,y,canvas.width-left*2,minH,12); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#111827'; ctx.font='21px Arial, Helvetica, sans-serif';
    wrapCanvasText(ctx,body,left+20,y+34,canvas.width-left*2-40,29,maxLines || Math.floor((minH-38)/29));
    y+=minH+38;
  }
  section('Töö kirjeldus',d.description,62,2);
  section('Töö tulemus',d.result,150,6);

  ctx.fillStyle='#0f172a'; ctx.font='800 22px Arial, Helvetica, sans-serif'; ctx.fillText('ALLKIRJAD',left,y); y+=18;
  ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(canvas.width-left,y); ctx.stroke(); y+=22;
  const sigW=(canvas.width-left*2-gap)/2;
  [['TEOSTAJA',d.technician],['TELLIJA','']].forEach((s,i)=>{
    const x=left+i*(sigW+gap);
    ctx.fillStyle='#fff'; ctx.strokeStyle='#d7dee8'; roundRectPath(ctx,x,y,sigW,118,12); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#64748b'; ctx.font='700 16px Arial'; ctx.fillText(s[0],x+18,y+28);
    ctx.fillStyle='#0f172a'; ctx.font='700 20px Arial'; ctx.fillText(s[1]||'Nimi',x+18,y+58);
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+18,y+86); ctx.lineTo(x+sigW-18,y+86); ctx.stroke();
    ctx.fillStyle='#64748b'; ctx.font='16px Arial'; ctx.fillText('Allkiri / kuupäev',x+18,y+108);
  });
  ctx.fillStyle='#94a3b8'; ctx.font='16px Arial'; ctx.textAlign='center'; ctx.fillText('VECO · kinnisvara hooldus',canvas.width/2,1708); ctx.textAlign='left';
  return canvas;
}
async function saveActPdf(actId){
  const a=byId(state.acts,actId); if(!a) return;
  try{
    const canvas=await renderActPdfCanvas(actId);
    if(!canvas) return;
    const jpegBytes=jpegBytesFromDataUrl(canvas.toDataURL('image/jpeg',0.92));
    const blob=buildImagePdf(jpegBytes,canvas.width,canvas.height);
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=actPdfFileName(a);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(err){
    console.error('PDF salvestamine ebaõnnestus',err);
    alert('PDF salvestamine ebaõnnestus. Proovi akt avada eelvaates ja salvesta brauseri kaudu.');
  }
}

function openActPrint(actId){ openActPreview(actId); }
function openWorkorderActPrint(workorderId){
  const a=ensureActForWorkorder(workorderId);
  if(!a) return;
  selectedActId=a.id;
  openActPreview(a.id);
}
function renderActs(){
  const status=$('#actStatusFilter')?.value||'all'; const q=($('#actSearch')?.value||'').toLowerCase(); const statuses=[...new Set(state.acts.map(a=>a.status))];
  const list=state.acts.filter(a=>(status==='all'||a.status===status)&&`${a.title} ${objectName(a.objectId)} ${a.workorderId}`.toLowerCase().includes(q));
  if(!list.some(a=>a.id===selectedActId)) selectedActId=list[0]?.id||state.acts[0]?.id||'';
  const filters=`<input class="field" id="actSearch" placeholder="Otsi akti..." value="${esc(q)}"><select class="select" id="actStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn primary" id="newActBtn">${icon('＋')}Lisa akt</button>`;
  const rows=list.map(a=>{const w=byId(state.workorders,a.workorderId)||{};return `<tr data-act-id="${a.id}" class="${detailOpen.acts&&a.id===selectedActId?'selected':''}"><td><strong>${esc(a.title)}</strong><div class="muted">${esc(a.id)}</div></td><td>${esc(fmtActDate(a.date))}</td><td>${esc(clientName(objectClientId(a.objectId)))}</td><td>${esc(objectName(a.objectId))}</td><td>${esc(w.title||a.workorderId)}</td><td><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></td></tr>`});
  const main=header('Aktid',filters,actions,'Aktid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Akte',state.acts.length)}${summaryBox('Mustandeid',state.acts.filter(a=>a.status==='Mustand').length)}${summaryBox('Saadetud',state.acts.filter(a=>a.status==='Saadetud').length)}${summaryBox('Töökäske',state.workorders.length)}</div>${table(['Akt','Kuupäev','Klient','Objekt','Töökäsk','Staatus'],rows)}</div>`;
  shell(main,detailOpen.acts?actDetailHtml():''); $('#actSearch')?.addEventListener('input',renderActs); $('#actStatusFilter')?.addEventListener('change',renderActs);
  $$('[data-act-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.actId; if(detailOpen.acts&&selectedActId===id){detailOpen.acts=false;}else{selectedActId=id;detailOpen.acts=true;} renderActs();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedActId=state.acts[0]?.id||'';detailOpen.acts=false;renderActs();}); $('#newActBtn')?.addEventListener('click',()=>openActModal()); bindActDetail();
}
function actDetailHtml(){
  const a=byId(state.acts,selectedActId); if(!a) return detailHeader('Akti detail')+`<div class="detail-body"><span class="muted">Vali akt.</span></div>`;
  const w=byId(state.workorders,a.workorderId)||{};
  const body=`<div class="summary-grid">${summaryBox('Kuupäev',a.date)}${summaryBox('Staatus',a.status)}${summaryBox('Objekt',objectName(a.objectId))}${summaryBox('Töökäsk',a.workorderId)}</div>${card(a.title,[['Klient',clientName(objectClientId(a.objectId))],['Objekt',objectName(a.objectId)],['Töökäsk',w.title||a.workorderId],['Kuupäev',a.date]],a.status,`<div class="section-title">Märkused</div><div class="muted">Kasuta eelvaadet, printimist või salvesta akt otse PDF-failina.</div>`)}`;
  return detailHeader('Akti detail','<button class="btn small" id="editActBtn">✎ Muuda</button><button class="btn small" id="previewActBtn" type="button">👁 Eelvaade</button><button class="btn small" id="printActBtn" type="button">⎙ Prindi</button><button class="btn small" id="pdfActBtn" type="button">⇩ Salvesta PDF</button><button class="btn small primary" id="markActSentBtn">↗ Märgi saadetuks</button><button class="btn small ghost" id="actDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body">${body}</div>`;
}
function bindActDetail(){ $('#editActBtn')?.addEventListener('click',()=>openActModal(selectedActId)); $('#previewActBtn')?.addEventListener('click',()=>openActPreview(selectedActId)); $('#printActBtn')?.addEventListener('click',()=>printAct(selectedActId)); $('#pdfActBtn')?.addEventListener('click',()=>saveActPdf(selectedActId)); $('#markActSentBtn')?.addEventListener('click',()=>{const a=byId(state.acts,selectedActId); if(a){a.status='Saadetud'; save(); renderActs();}}); $('#actDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.acts=false;renderActs();}); }
function openActModal(id='',defaults={}){
  const a=id?byId(state.acts,id):{workorderId:defaults.workorderId||state.workorders[0]?.id||'',objectId:defaults.objectId||byId(state.workorders,defaults.workorderId)?.objectId||state.objects[0]?.id||'',date:'',title:'',status:'Mustand',type:'Väljakutse akt'};
  openModal(`<form id="actForm"><div class="dialog-head"><h2>${id?'Muuda akti':'Lisa akt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Akti nimetus<input class="field" name="title" required value="${esc(a.title)}"></label><label>Töökäsk<select class="select" name="workorderId">${state.workorders.map(w=>`<option value="${w.id}" ${a.workorderId===w.id?'selected':''}>${esc(w.id)} · ${esc(w.title)}</option>`).join('')}</select></label><label>Objekt<select class="select" name="objectId">${state.objects.map(o=>`<option value="${o.id}" ${a.objectId===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label>Kuupäev<input class="field" name="date" type="date" value="${esc(a.date)}"></label><label>Staatus<select class="select" name="status">${['Mustand','Valmis','Saadetud','Arhiveeritud'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Akti tüüp<select class="select" name="type"><option value="Väljakutse akt" ${a.type==='Väljakutse akt'?'selected':''}>Väljakutse akt</option></select></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#actForm').elements.workorderId?.addEventListener('change',e=>{const oid=byId(state.workorders,e.target.value)?.objectId; if(oid) $('#actForm').elements.objectId.value=oid;});
  $('#actForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const newId=timestampActId();const next={id:id||newId,number:a.number||newId,workorderId:f.workorderId.value,objectId:f.objectId.value,date:f.date.value,title:f.title.value,status:f.status.value,type:f.type?.value||'Väljakutse akt',createdAt:a.createdAt||new Date().toISOString()}; if(id){Object.assign(a,next)}else{state.acts.push(next);selectedActId=next.id;detailOpen.acts=true} save();closeModal(); if(page==='workorders') renderWorkorders(); else renderActs();});
}

function renderPeople(){
  normalizeOncallPeople();
  const status=$('#peopleStatusFilter')?.value||'active';
  const q=($('#peopleSearch')?.value||'').toLowerCase();
  const list=state.people.filter(p=>{
    const statusOk=status==='all'||(status==='active'?p.active:!p.active);
    const hay=`${p.name} ${p.role} ${p.phone} ${p.email} ${p.region} ${p.skills}`.toLowerCase();
    return statusOk && hay.includes(q);
  });
  const filters=`<input class="field" id="peopleSearch" placeholder="Otsi kasutajat..." value="${esc(q)}"><select class="select" id="peopleStatusFilter"><option value="active" ${status==='active'?'selected':''}>Aktiivsed</option><option value="inactive" ${status==='inactive'?'selected':''}>Deaktiveeritud</option><option value="all" ${status==='all'?'selected':''}>Kõik kasutajad</option></select>`;
  const actions=`<button class="btn primary" id="newPersonBtn">${icon('＋')}Lisa kasutaja</button>`;
  const rows=list.map(p=>`<tr data-person-id="${p.id}"><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.id)}</div></td><td>${esc(p.role||'-')}</td><td>${esc(p.phone||'-')}</td><td>${esc(p.email||'-')}</td><td>${esc(p.region||'-')}</td><td><button class="status ${p.onCallActive?'ok':'red'}" data-toggle-oncall-person="${p.id}" type="button" title="Lisa/eemalda valvegraafikust">${p.onCallActive?'Aktiivne':'Ei osale'}</button><div class="muted">Jrk ${Number(p.onCallOrder||0)||'-'}</div></td><td><span class="status ${p.active?'ok':'red'}">${p.active?'Aktiivne':'Deaktiveeritud'}</span></td><td><button class="btn small" data-edit-person="${p.id}" type="button">Muuda</button> <button class="btn small ${p.active?'danger':'primary'}" data-toggle-person="${p.id}" type="button">${p.active?'Deaktiveeri':'Aktiveeri'}</button> <button class="btn small danger" data-delete-person="${p.id}" type="button">Kustuta</button></td></tr>`).join('');
  const main=header('Tehnikute administreerimine',filters,actions,'TEHNIKUD')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Kasutajaid',state.people.length)}${summaryBox('Aktiivseid',state.people.filter(p=>p.active).length)}${summaryBox('Tehnikuid',state.people.filter(p=>p.role==='Tehnik').length)}${summaryBox('Valve aktiivsed',state.people.filter(p=>p.onCallActive).length)}</div>${table(['Nimi','Roll','Telefon','E-post','Piirkond','Valvegraafik','Staatus','Tegevused'],rows)}</div>`;
  shell(main,'',{wide:true});
  $('#peopleSearch')?.addEventListener('input',renderPeople);
  $('#peopleStatusFilter')?.addEventListener('change',renderPeople);
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();normalizeOncallPeople();save();renderPeople();});
  $('#newPersonBtn')?.addEventListener('click',()=>openPersonModal());
  $$('[data-toggle-oncall-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const p=byId(state.people,btn.dataset.toggleOncallPerson);if(p){p.onCallActive=!p.onCallActive;if(p.onCallActive&&!p.onCallOrder){p.onCallOrder=nextOncallOrder();}save();renderPeople();}}));
  $$('[data-edit-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openPersonModal(btn.dataset.editPerson);}))
  $$('[data-toggle-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const p=byId(state.people,btn.dataset.togglePerson);if(p){p.active=!p.active;save();renderPeople();}}));
  $$('[data-delete-person]').forEach(btn=>btn.addEventListener('click',async e=>{
    e.stopPropagation();
    const id=btn.dataset.deletePerson;
    const p=byId(state.people,id);
    if(!p) return;
    const related={
      works:state.workorders.filter(w=>workorderMatchesPerson(w,id)).length,
      projects:state.projects.filter(pr=>pr.responsibleTechId===id).length,
      objects:state.objects.filter(o=>o.responsibleTechId===id).length,
      absences:state.absences.filter(a=>a.personId===id).length,
      oncall:state.oncall.filter(o=>o.personId===id).length
    };
    const used=Object.values(related).some(Boolean);
    const detailRows=`<div class="confirm-kv"><span>Kasutaja</span><strong>${esc(p.name)}</strong></div>`+(used?`<div class="confirm-warning">⚠ Kasutaja on seotud: ${related.works} tööd, ${related.projects} projekti, ${related.objects} objekti, ${related.absences} puudumist, ${related.oncall} valvet.</div>`:'');
    const ok=await openVecoConfirm({
      title:'Kustuta kasutaja?',
      message:used?'Kasutaja on seotud teiste kirjetega. Kustutamine võib jätta viited tühjaks.':'Kas soovid selle kasutaja kustutada?',
      details:detailRows,
      confirmText:'Kustuta',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    state.people=state.people.filter(x=>x.id!==id);
    save();
    renderPeople();
  }));
}
function openPersonModal(id=''){
  const p=id?byId(state.people,id):{name:'',role:'Tehnik',phone:'',email:'',region:'',skills:'',active:true,onCallActive:false,onCallOrder:nextOncallOrder()};
  openModal(`<form id="personForm"><div class="dialog-head"><h2>${id?'Muuda kasutajat':'Lisa kasutaja'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Nimi<input class="field" name="name" required value="${esc(p.name)}"></label><label>Roll<select class="select" name="role">${['Admin','Tehnik'].map(r=>`<option value="${r}" ${p.role===r?'selected':''}>${r}</option>`).join('')}</select></label><label>Telefon<input class="field" name="phone" value="${esc(p.phone||'')}"></label><label>E-post<input class="field" name="email" type="email" value="${esc(p.email||'')}"></label><label>Piirkond<input class="field" name="region" value="${esc(p.region||'')}"></label><label>Oskused<input class="field" name="skills" value="${esc(p.skills||'')}"></label><label>Staatus<select class="select" name="active"><option value="true" ${p.active?'selected':''}>Aktiivne</option><option value="false" ${!p.active?'selected':''}>Deaktiveeritud</option></select></label><label>Valvegraafik<select class="select" name="onCallActive"><option value="true" ${p.onCallActive?'selected':''}>Aktiivne</option><option value="false" ${!p.onCallActive?'selected':''}>Ei osale</option></select></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#personForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('U'),name:f.name.value,role:f.role.value,phone:f.phone.value,email:f.email.value,region:f.region.value,skills:f.skills.value,active:f.active.value==='true',onCallActive:f.onCallActive.value==='true',onCallOrder:p.onCallOrder||nextOncallOrder()};if(id){Object.assign(p,next)}else{state.people.push(next)}save();closeModal();renderPeople();});
}


function parseDateKey(value){ const d=new Date(`${value}T12:00:00`); return Number.isNaN(d.getTime())?new Date():d; }
function dateKeyFromDate(date){ const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`; }
function addDateDays(date,days){ const d=new Date(date); d.setDate(d.getDate()+days); return d; }
function weekStartKeyFrom(value){ const d=value?parseDateKey(value):new Date(); const day=d.getDay()||7; d.setDate(d.getDate()-day+1); return dateKeyFromDate(d); }
function weekDaysFrom(startKey){ const start=parseDateKey(startKey); return Array.from({length:7},(_,i)=>dateKeyFromDate(addDateDays(start,i))); }
function isInRange(date,start,end){ return date>=start && date<=end; }
function workorderHours(w){ return Number(w.hours||w.durationHours||w.plannedHours||2)||2; }
function timeHourOf(value){
  const [hh]=String(value||'09:00').split(':').map(Number);
  return Number.isFinite(hh)?hh:9;
}
function timeLabelFromHour(hour){
  const h=Math.max(0,Math.min(23,Math.floor(Number(hour)||0)));
  return `${String(h).padStart(2,'0')}:00`;
}
function workorderEndTime(w,limitHour=22){
  const start=timeHourOf(w.time);
  const duration=workorderHours(w);
  const end=Math.max(start+1,Math.min(limitHour,start+duration));
  return timeLabelFromHour(end);
}
function workorderEndDate(w){ return w.endDate||w.end_date||w.date; }
function daysBetweenKeys(startKey,endKey){
  const start=parseDateKey(startKey);
  const end=parseDateKey(endKey||startKey);
  const diff=Math.round((end-start)/86400000);
  return Math.max(0,diff);
}
function workorderDaySpan(w){ return daysBetweenKeys(w.date,workorderEndDate(w))+1; }
function workorderOccursOnDay(w,date){
  const start=w?.date;
  const end=workorderEndDate(w||{});
  return !!start && !!date && date>=start && date<=end;
}
function workorderDaysInRange(w,days=[]){
  return (days||[]).filter(date=>workorderOccursOnDay(w,date)).length;
}
function workorderHoursInRange(w,days=[]){
  return workorderHours(w)*workorderDaysInRange(w,days);
}
function workorderDateRangeLabel(w){
  const end=workorderEndDate(w);
  return end&&end!==w.date?`${fmtActDate(w.date)}–${fmtActDate(end)}`:fmtActDate(w.date);
}
function setWorkorderDateRange(w,startKey,endKey){
  if(!w) return;
  const start=startKey||w.date;
  const end=endKey||start;
  w.date=start;
  if(end && end!==start) w.endDate=end; else delete w.endDate;
  delete w.end_date;
}
function teamWeekAbsences(personId,weekDays){ const start=weekDays[0], end=weekDays[6]; return state.absences.filter(a=>a.personId===personId && a.start<=end && a.end>=start); }
function teamWeekOncall(personId,weekDays){ const start=weekDays[0], end=weekDays[6]; return state.oncall.filter(o=>o.personId===personId && o.start<=end && o.end>=start); }

function teamWorkConflictsForPerson(personId,days){
  return (state.workorders||[]).filter(w=>workorderMatchesPerson(w,personId)&&!isCompletedStatus(w.status)&&(days||[]).some(date=>workorderOccursOnDay(w,date))&&(state.absences||[]).some(a=>a.personId===personId&&a.start<=workorderEndDate(w)&&a.end>=w.date));
}
function teamOncallConflictsForPerson(personId,days){
  return (state.oncall||[]).filter(o=>o.personId===personId&&(days||[]).some(date=>o.start<=date&&o.end>=date)&&(state.absences||[]).some(a=>a.personId===personId&&a.start<=o.end&&a.end>=o.start));
}
function teamWarningCount(days){
  const people=(state.people||[]).filter(p=>p.active!==false);
  const conflictPeople=people.filter(p=>teamWorkConflictsForPerson(p.id,days).length||teamOncallConflictsForPerson(p.id,days).length).length;
  const overloaded=people.filter(p=>{
    const jobs=(state.workorders||[]).filter(w=>workorderMatchesPerson(w,p.id)&&(days||[]).some(date=>workorderOccursOnDay(w,date))&&!isCompletedStatus(w.status));
    return jobs.reduce((sum,w)=>sum+workorderHoursInRange(w,days),0)>=(days&&days.length>5?42:32);
  }).length;
  return conflictPeople+overloaded;
}
function workloadStatus(hours,absences,limit=8){
  if(absences.length) return 'Puudub';
  const h=Number(hours)||0;
  const l=Number(limit)||8;
  if(h<=0) return 'Vaba';
  if(h>l) return 'Ülekoormus';
  if(Math.abs(h-l)<0.001) return 'Täis';
  if(h>=l*0.75) return 'Normaalne';
  return 'Madal';
}
function workloadClass(hours,absences,limit=8){
  if(absences.length) return 'warn';
  const h=Number(hours)||0;
  const l=Number(limit)||8;
  if(h<=0) return '';
  if(h>l) return 'red';
  if(Math.abs(h-l)<0.001) return 'warn';
  if(h>=l*0.75) return 'ok';
  return '';
}
function renderTeam(){
  const rawWeek=$('#teamWeekStart')?.value||localStorage.getItem('veco_team_week')||dateKeyFromDate(new Date());
  const currentWeek=weekStartKeyFrom(rawWeek);
  const statusFilter=$('#teamStatusFilter')?.value||'open';
  const q='';
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
  const inVisibleRange=w=>visibleDays.some(date=>workorderOccursOnDay(w,date));
  const inWeek=w=>weekDays.some(date=>workorderOccursOnDay(w,date));
  const statusOk=w=>statusFilter==='all'||(statusFilter==='open'?openStatuses.includes(w.status):w.status===statusFilter);
  const searchable=w=>`${w.id} ${w.title} ${objectName(w.objectId)} ${clientName(objectClientId(w.objectId))} ${projectName(w.projectId)} ${workorderPeopleLabel(w)}`.toLowerCase().includes(q);
  const weekWorkorders=state.workorders.filter(w=>inWeek(w)&&statusOk(w)&&searchable(w));
  const visibleWorkorders=weekWorkorders.filter(w=>inVisibleRange(w));
  const dayWorkorders=state.workorders.filter(w=>workorderOccursOnDay(w,selectedDay)&&statusOk(w)&&searchable(w));
  if(selectedTeamPersonId && !state.people.some(p=>p.id===selectedTeamPersonId)) selectedTeamPersonId='';

  const personJobs=(person,days=visibleDays)=>weekWorkorders.filter(w=>workorderMatchesPerson(w,person.id)&&days.some(date=>workorderOccursOnDay(w,date))).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const personDayJobs=(person,date)=>weekWorkorders.filter(w=>workorderMatchesPerson(w,person.id)&&workorderOccursOnDay(w,date)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const dayNames=['E','T','K','N','R','L','P'];
  const weekDayOptions=weekDays.map((d,i)=>`<option value="${d}" ${selectedDay===d?'selected':''}>${dayNames[i]} ${d}</option>`).join('');
  const viewSwitch=`<select class="select" id="teamViewMode"><option value="cards" ${view==='cards'?'selected':''}>Kaardid</option><option value="matrix" ${view==='matrix'?'selected':''}>Nädalatabel</option><option value="day" ${view==='day'?'selected':''}>Päev</option></select><select class="select" id="teamWeekScope"><option value="workdays" ${scope==='workdays'?'selected':''}>E–R</option><option value="full" ${scope==='full'?'selected':''}>E–P</option></select>${view==='day'?`<select class="select" id="teamDaySelect">${weekDayOptions}</select>`:''}`;
  const filters=`<input class="field" id="teamWeekStart" type="date" value="${esc(currentWeek)}"><select class="select" id="teamStatusFilter"><option value="open" ${statusFilter==='open'?'selected':''}>Avatud tööd</option><option value="all" ${statusFilter==='all'?'selected':''}>Kõik staatused</option>${workorderStatusOptions.map(s=>`<option value="${s}" ${statusFilter===s?'selected':''}>${s}</option>`).join('')}</select>${viewSwitch}`;
  const actions=`<button class="btn ghost" id="teamPrevWeekBtn" type="button">‹ Eelmine</button><button class="btn primary" id="teamThisWeekBtn" type="button">↕ Täna</button><button class="btn ghost" id="teamNextWeekBtn" type="button">Järgmine ›</button>`;

  const techCards=state.people.map(p=>{
    const jobs=personJobs(p);
    const hours=jobs.reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0);
    const abs=teamWeekAbsences(p.id,visibleDays);
    const oc=teamWeekOncall(p.id,visibleDays);
    const limit=scope==='full'?56:40;
    const loadPct=Math.min(100,Math.round((hours/limit)*100));
    const warnings=[
      (scope==='workdays'&&hours>=32)||(scope==='full'&&hours>=42)?'Kontrolli koormust: nädal on tihe.':'',
      abs.length?`Puudumine: ${abs.map(a=>`${a.type} ${a.start}–${a.end}`).join(', ')}`:'',
      oc.length?`Valve: ${oc.map(o=>`${o.start}–${o.end}`).join(', ')}`:''
    ].filter(Boolean);
    const jobList=jobs.slice(0,5).map(w=>`<div class="team-job-line"><strong>${esc(workorderDateRangeLabel(w))} ${esc(w.time)} · ${esc(objectName(w.objectId))}</strong><span>${esc(w.title)} · ${workorderHoursInRange(w,visibleDays)} h · ${esc(workorderRoleLabel(w,p.id))}</span></div>`).join('') || '<span class="muted">Selles vahemikus töid ei ole.</span>';
    return `<div class="card clickable team-card ${p.id===selectedTeamPersonId?'selected':''}" data-team-person="${p.id}">
      <div class="card-top"><h3>${esc(p.name)}</h3><span class="status ${workloadClass(hours,abs,limit)}">${esc(workloadStatus(hours,abs,limit))}</span></div>
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
      const items=jobs.slice(0,2).map(w=>`<div class="team-matrix-job"><strong>${esc(w.time||'')}</strong><span>${esc(objectName(w.objectId))}</span><span>${workorderHours(w)} h${workorderDaySpan(w)>1?' · '+esc(daysBetweenKeys(w.date,date)+1)+'/'+esc(workorderDaySpan(w)):''} · ${esc(workorderRoleLabel(w,p.id))}</span></div>`).join('');
      const more=jobs.length>2?`<span class="team-more">+${jobs.length-2} veel</span>`:'';
      const workSummary=jobs.length?`<span class="team-day-count">${jobs.length} tööd</span>`:'<span class="muted">Vaba</span>';
      return `<td class="${classes}"><div class="team-cell-head"><strong>${h?h+' h':'-'}</strong>${abs.length?'<span class="status warn">Puudub</span>':''}${oc.length?'<span class="status warn">Valve</span>':''}</div>${workSummary}${items}${more}</td>`;
    }).join('');
    const jobs=personJobs(p);
    const hours=jobs.reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0);
    return `<tr data-team-person="${p.id}" class="${p.id===selectedTeamPersonId?'selected':''}"><th><strong>${esc(p.name)}</strong><span class="muted">${esc(p.role||'Tehnik')} · ${hours} h</span></th>${cells}</tr>`;
  }).join('');
  const matrixHtml=`<div class="team-matrix-wrap"><table class="team-matrix"><thead><tr><th>Tehnik</th>${visibleDays.map((d,i)=>`<th>${dayNames[weekDays.indexOf(d)]}<span>${esc(fmtActDate(d))}</span></th>`).join('')}</tr></thead><tbody>${matrixRows}</tbody></table></div>`;

  const dayHtml=`<div class="team-day-view">${state.people.map(p=>{
    const jobs=dayWorkorders.filter(w=>workorderMatchesPerson(w,p.id)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const abs=state.absences.filter(a=>a.personId===p.id&&a.start<=selectedDay&&a.end>=selectedDay);
    const oc=state.oncall.filter(o=>o.personId===p.id&&o.start<=selectedDay&&o.end>=selectedDay);
    const body=abs.length?`<div class="event-row"><strong>${esc(abs[0].type)}</strong><span class="muted">${esc(abs[0].note||'Puudumine')}</span></div>`:(jobs.map(w=>`<div class="team-job-line"><strong>${esc(w.time||'')} · ${esc(objectName(w.objectId))}</strong><span>${esc(w.title)}</span><span class="muted">${esc(clientName(objectClientId(w.objectId)))} · ${esc(w.status)} · ${workorderHours(w)} h · ${esc(workorderRoleLabel(w,p.id))}${workorderDaySpan(w)>1?' · '+esc(daysBetweenKeys(w.date,selectedDay)+1)+'/'+esc(workorderDaySpan(w)):''}</span></div>`).join('')||'<span class="muted">Vaba</span>');
    return `<div class="card clickable team-day-card ${p.id===selectedTeamPersonId?'selected':''}" data-team-person="${p.id}"><div class="card-top"><h3>${esc(p.name)}</h3>${oc.length?'<span class="status warn">Valves</span>':abs.length?'<span class="status warn">Puudub</span>':'<span class="status ok">Saadaval</span>'}</div><div class="team-job-list">${body}</div></div>`;
  }).join('')}</div>`;

  const totalHours=visibleWorkorders.reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0);
  const absentCount=state.people.filter(p=>teamWorkConflictsForPerson(p.id,visibleDays).length||teamOncallConflictsForPerson(p.id,visibleDays).length).length;
  const overloaded=state.people.filter(p=>personJobs(p).reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0)>=(scope==='full'?42:32)).length;
  const content=view==='matrix'?matrixHtml:(view==='day'?dayHtml:`<div class="grid team-grid">${techCards}</div>`);
  const teamHeaderLabel=formatViewPeriod('Tiimivaade',view==='day'?'day':'week',view==='day'?[selectedDay]:visibleDays,currentWeek,{hideRange:view!=='day'});
  window.__VECO_ONCALL_CONTEXT_DAYS__ = view==='day' ? [selectedDay] : visibleDays;
  const main=header('Tiimivaade',filters,actions,teamHeaderLabel)+`<div class="detail-body"><div class="summary-grid">${summaryBox('Tehnikuid',state.people.length)}${summaryBox(view==='day'?'Päeva töid':'Vahemiku töid',view==='day'?dayWorkorders.length:visibleWorkorders.length)}${summaryBox('Planeeritud h',view==='day'?dayWorkorders.reduce((sum,w)=>sum+workorderHours(w),0):totalHours)}${summaryBox('Hoiatusi',absentCount+overloaded)}</div><div class="team-view-hint">${view==='cards'?'Kaardivaade näitab tehniku koormust valitud nädalas.':view==='matrix'?'Nädalatabel näitab kogu tiimi päevade kaupa.':'Päevavaade sobib hommikuseks tööde jagamiseks.'}</div>${content}</div>`;
  const detail=selectedTeamPersonId?teamDetailHtml(visibleDays,view==='day'?dayWorkorders:visibleWorkorders):'';
  shell(main,detail);
  $('#teamWeekStart')?.addEventListener('change',()=>{const next=weekStartKeyFrom($('#teamWeekStart').value); localStorage.setItem('veco_team_week',next); $('#teamWeekStart').value=next; renderTeam();}); $('#teamStatusFilter')?.addEventListener('change',renderTeam); $('#teamViewMode')?.addEventListener('change',renderTeam); $('#teamWeekScope')?.addEventListener('change',renderTeam); $('#teamDaySelect')?.addEventListener('change',renderTeam);
  $('#teamPrevWeekBtn')?.addEventListener('click',()=>{
    if(view==='day'){
      const nextDay=dateKeyFromDate(addDateDays(parseDateKey(selectedDay),-1));
      const nextWeek=weekStartKeyFrom(nextDay);
      localStorage.setItem('veco_team_day',nextDay);
      localStorage.setItem('veco_team_week',nextWeek);
      const dayEl=$('#teamDaySelect'); if(dayEl) dayEl.value=nextDay;
      const weekEl=$('#teamWeekStart'); if(weekEl) weekEl.value=nextWeek;
    }else{
      const nextWeek=dateKeyFromDate(addDateDays(parseDateKey(currentWeek),-7));
      localStorage.setItem('veco_team_week',nextWeek);
      const weekEl=$('#teamWeekStart'); if(weekEl) weekEl.value=nextWeek;
    }
    renderTeam();
  });
  $('#teamNextWeekBtn')?.addEventListener('click',()=>{
    if(view==='day'){
      const nextDay=dateKeyFromDate(addDateDays(parseDateKey(selectedDay),1));
      const nextWeek=weekStartKeyFrom(nextDay);
      localStorage.setItem('veco_team_day',nextDay);
      localStorage.setItem('veco_team_week',nextWeek);
      const dayEl=$('#teamDaySelect'); if(dayEl) dayEl.value=nextDay;
      const weekEl=$('#teamWeekStart'); if(weekEl) weekEl.value=nextWeek;
    }else{
      const nextWeek=dateKeyFromDate(addDateDays(parseDateKey(currentWeek),7));
      localStorage.setItem('veco_team_week',nextWeek);
      const weekEl=$('#teamWeekStart'); if(weekEl) weekEl.value=nextWeek;
    }
    renderTeam();
  });
  $('#teamThisWeekBtn')?.addEventListener('click',()=>{
    const todayKey=dateKeyFromDate(new Date());
    const thisWeek=weekStartKeyFrom(todayKey);
    localStorage.setItem('veco_team_week',thisWeek);
    localStorage.setItem('veco_team_day',todayKey);
    const weekEl=$('#teamWeekStart'); if(weekEl) weekEl.value=thisWeek;
    const dayEl=$('#teamDaySelect'); if(dayEl) dayEl.value=todayKey;
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
  const jobs=weekWorkorders.filter(w=>workorderMatchesPerson(w,p.id)).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const hours=jobs.reduce((sum,w)=>sum+workorderHoursInRange(w,weekDays),0);
  const abs=teamWeekAbsences(p.id,weekDays);
  const oc=teamWeekOncall(p.id,weekDays);
  const jobsHtml=jobs.map(w=>`<div class="event-row"><strong>${esc(workorderDateRangeLabel(w))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(clientName(objectClientId(w.objectId)))} · ${esc(objectName(w.objectId))} · ${esc(projectName(w.projectId))} · ${workorderHoursInRange(w,weekDays)} h · ${esc(workorderRoleLabel(w,p.id))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Sellel nädalal valitud filtriga töid ei ole.</span>';
  const absHtml=abs.map(a=>`<div class="event-row"><strong>${esc(a.type)} ${esc(a.start)}–${esc(a.end)}</strong><span class="muted">${esc(a.note)}</span></div>`).join('')||'<span class="muted">Puudumisi ei ole.</span>';
  const ocHtml=oc.map(o=>`<div class="event-row"><strong>Valve ${esc(o.start)}–${esc(o.end)}</strong><span class="muted">${esc(o.note)}</span></div>`).join('')||'<span class="muted">Valvet ei ole.</span>';
  return detailHeader(`${p.name} · detail`,'<button class="btn ghost" id="teamDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Töid',jobs.length)}${summaryBox('Tunde',hours)}${summaryBox('Puudumisi',abs.length)}${summaryBox('Valveid',oc.length)}</div>${card(p.name,[['Roll',p.role],['Piirkond',p.region],['Telefon',p.phone],['E-post',p.email],['Oskused',p.skills]],workloadStatus(hours,abs))}<div class="section-title">Nädala tööd</div><div class="list">${jobsHtml}</div><div class="section-title">Puudumised</div><div class="list">${absHtml}</div><div class="section-title">Valve</div><div class="list">${ocHtml}</div></div>`;
}

function nextOncallOrder(){
  return Math.max(0,...(state.people||[]).map(p=>Number(p.onCallOrder)||0))+1;
}
function activeOncallPeople(){
  normalizeOncallPeople();
  return (state.people||[]).filter(p=>p.active&&p.onCallActive).sort((a,b)=>(Number(a.onCallOrder)||9999)-(Number(b.onCallOrder)||9999)||a.name.localeCompare(b.name));
}
function oncallConflicts(shift){
  return (state.absences||[]).filter(a=>a.personId===shift.personId && a.start<=shift.end && a.end>=shift.start);
}
function oncallConflictHtml(shift){
  const conflicts=oncallConflicts(shift);
  if(!conflicts.length) return '';
  return `<div class="oncall-conflict">⚠ ${esc(techName(shift.personId))}: ${conflicts.map(a=>`${a.type} ${fmtActDate(a.start)}–${fmtActDate(a.end)}`).join(', ')}</div>`;
}
function weekRangeFrom(startKey,days=7){
  const start=parseDateKey(startKey);
  const end=addDateDays(start,days-1);
  return [dateKeyFromDate(start),dateKeyFromDate(end)];
}
function renderOncall(){
  normalizeOncallPeople();
  const today=dateKeyFromDate(new Date());
  const active=activeOncallPeople();
  const label=formatViewPeriod('Valvegraafik','week',weekDaysFrom(weekStartKeyFrom(today)),today,{hideRange:true});
  const actions=`<button class="btn ghost" id="generateOncallBtn" type="button">↻ Genereeri 12 nädalat</button><button class="btn primary" id="newOncallBtn" type="button">＋ Lisa valve</button>`;
  const activeHtml=active.length?active.map((p,i)=>`<div class="oncall-person" draggable="true" data-oncall-person="${p.id}"><span class="oncall-drag">☰</span><strong>${i+1}. ${esc(p.name)}</strong><span class="muted">${esc(p.role||'')}</span></div>`).join(''):'<div class="muted">Märgi Tehnikute vaates inimesed valvegraafikus aktiivseks.</div>';
  const shiftRows=state.oncall.slice().sort((a,b)=>a.start.localeCompare(b.start)).map(o=>`<tr><td><strong>${esc(techName(o.personId))}</strong>${oncallConflictHtml(o)}</td><td>${esc(fmtActDate(o.start))}</td><td>${esc(fmtActDate(o.end))}</td><td>${esc(o.note||'-')}</td><td>${oncallConflicts(o).length?'<span class="status warn">Konflikt</span>':'<span class="status ok">OK</span>'}</td><td><button class="btn small" data-edit-oncall="${o.id}" type="button">Muuda</button> <button class="btn small danger" data-delete-oncall="${o.id}" type="button">Kustuta</button></td></tr>`).join('');
  const conflicts=state.oncall.reduce((sum,o)=>sum+oncallConflicts(o).length,0);
  const main=header('Valvegraafik','',actions,label)+`<div class="detail-body"><div class="summary-grid">${summaryBox('Aktiivseid',active.length)}${summaryBox('Valveid',state.oncall.length)}${summaryBox('Täna valves',currentOncallLabel([today]))}${summaryBox('Hoiatusi',conflicts)}</div><div class="oncall-layout"><section class="card"><div class="card-top"><h3>Osalejad ja järjekord</h3><span class="status ok">Lohista</span></div><div class="oncall-sort-list" id="oncallSortList">${activeHtml}</div><div class="muted">Järjekord salvestatakse tehniku külge ja seda kasutatakse rotatsiooni genereerimisel.</div></section><section class="card"><div class="card-top"><h3>Konfliktid</h3><span class="status ${conflicts?'warn':'ok'}">${conflicts?conflicts:'OK'}</span></div><div class="list">${state.oncall.flatMap(o=>oncallConflicts(o).map(a=>`<div class="event-row"><strong>⚠ ${esc(techName(o.personId))}</strong><span class="muted">Valve ${fmtActDate(o.start)}–${fmtActDate(o.end)} kattub: ${esc(a.type)} ${fmtActDate(a.start)}–${fmtActDate(a.end)}</span></div>`)).join('')||'<span class="muted">Konflikte ei ole.</span>'}</div></section></div><div class="section-title">Valvekirjed</div>${table(['Tehnik','Algus','Lõpp','Märkus','Staatus','Tegevused'],shiftRows)}</div>`;
  shell(main,'',{wide:true});
  bindOncallView();
}
function bindOncallView(){
  $('#newOncallBtn')?.addEventListener('click',()=>openOncallModal());
  $('#generateOncallBtn')?.addEventListener('click',generateOncallRotation);
  $$('[data-edit-oncall]').forEach(btn=>btn.addEventListener('click',()=>openOncallModal(btn.dataset.editOncall)));
  $$('[data-delete-oncall]').forEach(btn=>btn.addEventListener('click',async()=>{
    const id=btn.dataset.deleteOncall;
    const o=byId(state.oncall,id);
    if(!o) return;
    const ok=await openVecoConfirm({
      title:'Kustuta valve?',
      message:'Kas soovid selle valveperioodi kustutada?',
      details:`<div class="confirm-kv"><span>Tehnik</span><strong>${esc(techName(o.personId))}</strong></div><div class="confirm-kv"><span>Periood</span><strong>${esc(fmtActDate(o.start))} – ${esc(fmtActDate(o.end))}</strong></div>${o.note?`<div class="confirm-kv"><span>Märkus</span><strong>${esc(o.note)}</strong></div>`:''}`,
      confirmText:'Kustuta',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    state.oncall=state.oncall.filter(x=>x.id!==id);
    save();
    renderOncall();
  }));
  let draggedId='';
  $$('#oncallSortList .oncall-person').forEach(item=>{
    item.addEventListener('dragstart',()=>{draggedId=item.dataset.oncallPerson;item.classList.add('dragging');});
    item.addEventListener('dragend',()=>{item.classList.remove('dragging');draggedId='';});
    item.addEventListener('dragover',e=>{e.preventDefault();const target=item.dataset.oncallPerson;if(!draggedId||draggedId===target)return;const list=activeOncallPeople().map(p=>p.id);const from=list.indexOf(draggedId);const to=list.indexOf(target);if(from<0||to<0)return;list.splice(to,0,list.splice(from,1)[0]);list.forEach((id,idx)=>{const p=byId(state.people,id);if(p)p.onCallOrder=idx+1;});save();renderOncall();});
  });
}
function openOncallModal(id=''){
  normalizeOncallPeople();
  const active=activeOncallPeople();
  const today=dateKeyFromDate(new Date());
  const o=id?byId(state.oncall,id):{personId:active[0]?.id||state.people[0]?.id||'',start:today,end:today,note:'Telefonivalve'};
  openModal(`<form id="oncallForm"><div class="dialog-head"><h2>${id?'Muuda valvet':'Lisa valve'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Tehnik<select class="select" name="personId">${state.people.filter(p=>p.active).map(p=>`<option value="${p.id}" ${o.personId===p.id?'selected':''}>${esc(p.name)}${p.onCallActive?'':' · ei osale rotatsioonis'}</option>`).join('')}</select></label><label>Algus<input class="field" name="start" type="date" required value="${esc(o.start)}"></label><label>Lõpp<input class="field" name="end" type="date" required value="${esc(o.end)}"></label><label>Märkus<input class="field" name="note" value="${esc(o.note||'')}"></label></div><div class="muted">Kui valve kattub puhkuse/puudumise/haigusega, kuvatakse valvegraafikus hoiatus.</div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#oncallForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('OC'),personId:f.personId.value,start:f.start.value,end:f.end.value,note:f.note.value,manualOverride:true};if(next.end<next.start){alert('Lõpp ei saa olla enne algust.');return;}if(id){Object.assign(o,next)}else{state.oncall.push(next)}save();closeModal();renderOncall();});
}
async function generateOncallRotation(){
  const active=activeOncallPeople();
  if(!active.length){alert('Valvegraafikus pole aktiivseid tehnikuid.');return;}
  const generateOk=await openVecoConfirm({title:'Genereeri valvegraafik?',message:'Genereerin 12 nädalat rotatsiooni alates käesolevast nädalast.',details:'<div class="muted">Olemasolevad käsitsi muudetud valved jäävad alles.</div>',confirmText:'Genereeri',cancelText:'Loobu'}); if(!generateOk) return;
  const first=weekStartKeyFrom(dateKeyFromDate(new Date()));
  for(let i=0;i<12;i++){
    const [start,end]=weekRangeFrom(dateKeyFromDate(addDateDays(parseDateKey(first),i*7)),7);
    if(state.oncall.some(o=>o.start===start&&o.end===end&&o.manualOverride)) continue;
    state.oncall=state.oncall.filter(o=>!(o.start===start&&o.end===end&&!o.manualOverride));
    const p=active[i%active.length];
    state.oncall.push({id:uid('OC'),personId:p.id,start,end,note:'Telefonivalve',manualOverride:false});
  }
  save();renderOncall();
}
function absenceDays(a){ return daysBetweenKeys(a.start,a.end)+1; }
function absenceIsActive(a,today=dateKeyFromDate(new Date())){ return a.start<=today && a.end>=today; }
function absenceIsUpcoming(a,today=dateKeyFromDate(new Date())){ return a.start>today; }
function absenceTypeClass(type){
  const t=String(type||'').toLowerCase();
  if(t.includes('haig')) return 'red';
  if(t.includes('puhkus')) return 'ok';
  if(t.includes('koolitus')) return 'warn';
  return 'warn';
}
function absenceWorkConflicts(absence){
  return (state.workorders||[]).filter(w=>workorderMatchesPerson(w,absence.personId)&&w.status!=='Lõpetatud'&&w.date<=absence.end&&workorderEndDate(w)>=absence.start);
}
function absenceOncallConflicts(absence){
  return (state.oncall||[]).filter(o=>o.personId===absence.personId&&o.start<=absence.end&&o.end>=absence.start);
}
function absenceConflictSummary(absence){
  const work=absenceWorkConflicts(absence).length;
  const oncall=absenceOncallConflicts(absence).length;
  const bits=[];
  if(work) bits.push(`${work} töö`);
  if(oncall) bits.push(`${oncall} valve`);
  return bits.join(' · ');
}
function renderVacations(){
  const today=dateKeyFromDate(new Date());
  const sorted=(state.absences||[]).slice().sort((a,b)=>a.start.localeCompare(b.start)||techName(a.personId).localeCompare(techName(b.personId)));
  const active=sorted.filter(a=>absenceIsActive(a,today));
  const upcoming=sorted.filter(a=>absenceIsUpcoming(a,today));
  const past=sorted.filter(a=>a.end<today);
  const conflicts=sorted.reduce((sum,a)=>sum+absenceWorkConflicts(a).length+absenceOncallConflicts(a).length,0);
  const actions='<button class="btn primary" id="newAbsenceBtn" type="button">＋ Lisa puudumine</button>';
  const row=(a)=>{
    const conflict=absenceConflictSummary(a);
    const status=absenceIsActive(a,today)?'<span class="status warn">Täna</span>':(a.end<today?'<span class="status">Möödunud</span>':'<span class="status ok">Planeeritud</span>');
    return `<tr><td><strong>${esc(techName(a.personId))}</strong><div class="muted">${esc(a.note||'')}</div></td><td><span class="status ${absenceTypeClass(a.type)}">${esc(a.type||'Puudumine')}</span></td><td>${esc(fmtActDate(a.start))}</td><td>${esc(fmtActDate(a.end))}</td><td>${absenceDays(a)} p</td><td>${conflict?`<span class="status warn">⚠ ${esc(conflict)}</span>`:'<span class="status ok">OK</span>'}</td><td>${status}</td><td><button class="btn small" data-edit-absence="${esc(a.id)}" type="button">Muuda</button> <button class="btn small danger" data-delete-absence="${esc(a.id)}" type="button">Kustuta</button></td></tr>`;
  };
  const activeHtml=active.map(a=>`<div class="event-row"><strong>${esc(techName(a.personId))} · ${esc(a.type)}</strong><span class="muted">${fmtActDate(a.start)}–${fmtActDate(a.end)} · ${absenceDays(a)} p · ${esc(a.note||'')}</span>${absenceConflictSummary(a)?`<span class="status warn">⚠ ${esc(absenceConflictSummary(a))}</span>`:''}</div>`).join('')||'<span class="muted">Täna puudumisi ei ole.</span>';
  const conflictHtml=sorted.flatMap(a=>[
    ...absenceWorkConflicts(a).map(w=>`<div class="event-row"><strong>⚠ ${esc(techName(a.personId))} · ${esc(a.type)}</strong><span class="muted">Kattub tööga: ${esc(w.title)} · ${fmtActDate(w.date)}${workorderEndDate(w)!==w.date?'–'+fmtActDate(workorderEndDate(w)):''} · ${esc(objectName(w.objectId))}</span></div>`),
    ...absenceOncallConflicts(a).map(o=>`<div class="event-row"><strong>⚠ ${esc(techName(a.personId))} · ${esc(a.type)}</strong><span class="muted">Kattub valvega: ${fmtActDate(o.start)}–${fmtActDate(o.end)}</span></div>`)
  ]).join('')||'<span class="muted">Konflikte ei ole.</span>';
  const main=header('Puhkused ja puudumised','',actions,'Puhkused')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Kokku',state.absences.length)}${summaryBox('Täna puudub',active.length)}${summaryBox('Tulekul',upcoming.length)}${summaryBox('Konflikte',conflicts)}</div><div class="grid"><section class="card"><div class="card-top"><h3>Täna puuduvad</h3><span class="status ${active.length?'warn':'ok'}">${active.length}</span></div><div class="list">${activeHtml}</div></section><section class="card"><div class="card-top"><h3>Konfliktid</h3><span class="status ${conflicts?'warn':'ok'}">${conflicts?conflicts:'OK'}</span></div><div class="list">${conflictHtml}</div></section></div><div class="section-title">Puudumised</div>${table(['Töötaja','Tüüp','Algus','Lõpp','Päevi','Konflikt','Staatus','Tegevused'],sorted.map(row))}<div class="muted">Puudumise alla märgi puhkus, haigus, koolitus või muu äraolek. Sama info kasutatakse valvegraafiku ja tiimivaate konfliktide näitamiseks.</div></div>`;
  shell(main,'',{wide:true});
  bindVacations();
}
function bindVacations(){
  $('#newAbsenceBtn')?.addEventListener('click',()=>openAbsenceModal());
  $$('[data-edit-absence]').forEach(btn=>btn.addEventListener('click',()=>openAbsenceModal(btn.dataset.editAbsence)));
  $$('[data-delete-absence]').forEach(btn=>btn.addEventListener('click',async()=>{
    const id=btn.dataset.deleteAbsence;
    const a=byId(state.absences,id);
    if(!a) return;
    const workConflicts=absenceWorkConflicts(a);
    const oncallConflicts=absenceOncallConflicts(a);
    const conflictHtml=(workConflicts.length||oncallConflicts.length)?`<div class="confirm-warning">⚠ Selle puudumisega on seotud ${workConflicts.length} tööd ja ${oncallConflicts.length} valvet.</div>`:'';
    const ok=await openVecoConfirm({
      title:'Kustuta puudumine?',
      message:'Kas soovid selle puudumise kustutada?',
      details:`<div class="confirm-kv"><span>Töötaja</span><strong>${esc(techName(a.personId))}</strong></div><div class="confirm-kv"><span>Tüüp</span><strong>${esc(a.type||'Puudumine')}</strong></div><div class="confirm-kv"><span>Periood</span><strong>${esc(fmtActDate(a.start))} – ${esc(fmtActDate(a.end))}</strong></div>${a.note?`<div class="confirm-kv"><span>Märkus</span><strong>${esc(a.note)}</strong></div>`:''}${conflictHtml}`,
      confirmText:'Kustuta',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    state.absences=state.absences.filter(x=>x.id!==id);
    save();
    renderVacations();
  }));
}
function openAbsenceModal(id=''){
  const today=dateKeyFromDate(new Date());
  const a=id?byId(state.absences,id):{personId:state.people.find(p=>p.active)?.id||state.people[0]?.id||'',type:'Puhkus',start:today,end:today,note:''};
  const types=['Puhkus','Haigus','Puudumine','Koolitus','Muu'];
  openModal(`<form id="absenceForm"><div class="dialog-head"><h2>${id?'Muuda puudumist':'Lisa puudumine'}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Töötaja<select class="select" name="personId" required>${state.people.filter(p=>p.active).map(p=>`<option value="${esc(p.id)}" ${a.personId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Tüüp<select class="select" name="type">${types.map(t=>`<option value="${t}" ${a.type===t?'selected':''}>${t}</option>`).join('')}</select></label><label>Algus<input class="field" name="start" type="date" required value="${esc(a.start)}"></label><label>Lõpp<input class="field" name="end" type="date" required value="${esc(a.end)}"></label><label class="full">Märkus<textarea name="note">${esc(a.note||'')}</textarea></label></div><div class="muted">Puhkus, haigus ja muu puudumine tekitavad hoiatused, kui samale ajale on planeeritud töö või valve.</div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#absenceForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('EV'),personId:f.personId.value,type:f.type.value,start:f.start.value,end:f.end.value,note:f.note.value};if(next.end<next.start){alert('Lõpp ei saa olla enne algust.');return;}if(id){Object.assign(a,next)}else{state.absences.push(next)}save();closeModal();renderVacations();});
}
function activeMobilePeople(){
  return state.people.filter(p=>p.active);
}
function mobileCurrentUser(){
  const id=localStorage.getItem('veco_mobile_user_id')||'';
  return activeMobilePeople().find(p=>p.id===id)||null;
}
function mobileWorkflowButtons(w){
  if(isCompletedStatus(w.status)){
    return `<button class="btn" data-mobile-edit="${w.id}" type="button">Ava / muuda</button><button class="btn primary" data-mobile-action="reopen" data-workorder-id="${w.id}" type="button">↺ Ava uuesti</button>`;
  }
  if(String(w.status||'').trim()==='Töös'){
    return `<button class="btn" data-mobile-action="pause" data-workorder-id="${w.id}" type="button">⏸ Peata</button><button class="btn" data-mobile-edit="${w.id}" type="button">Täida</button><button class="btn primary" data-mobile-action="finish" data-workorder-id="${w.id}" type="button">✓ Lõpeta</button>`;
  }
  return `<button class="btn primary" data-mobile-action="start" data-workorder-id="${w.id}" type="button">▶ Alusta</button><button class="btn" data-mobile-edit="${w.id}" type="button">Täida</button>`;
}
async function applyMobileWorkorderAction(action,workorderId){
  const w=byId(state.workorders,workorderId);
  if(!w) return;
  if(action==='start'){
    w.status='Töös';
    w.completedAt='';
    w.completedBy='';
    w.completionComment='';
  }else if(action==='pause'){
    w.status='Planeeritud';
    w.completedAt='';
    w.completedBy='';
    w.completionComment='';
  }else if(action==='finish'){
    const result=normalizeCompletionResult(await openCompletionCommentModal(w,completionCommentText(w)));
    if(!result) return;
    w.status='Lõpetatud';
    w.completedAt=new Date().toISOString();
    w.completedBy=completedByLabel(w);
    w.completionComment=result.comment;
    w.actType=result.actType;
    w.done=result.comment;
    w.workDone=result.comment;
    ensureActForWorkorder(w.id);
  }else if(action==='reopen'){
    const ok=await openVecoConfirm({title:'Ava töö uuesti',message:'Kas soovid lõpetatud töö uuesti avada?',details:`<strong>${esc(w.id)}</strong><br>${esc(objectName(w.objectId))}<br>${esc(w.title)}`,confirmText:'Ava uuesti',cancelText:'Loobu'});
    if(!ok) return;
    w.status='Töös';
    w.completedAt='';
    w.completedBy='';
    w.completionComment='';
  }
  save();
  state=window.VECO_STORAGE.load();
  renderMobile();
}
function mobileTomorrowKey(todayKey){
  return dateKeyFromDate(addDateDays(parseDateKey(todayKey),1));
}
function mobileCurrentWeekEndKey(todayKey){
  const start=weekStartKeyFrom(todayKey);
  return dateKeyFromDate(addDateDays(parseDateKey(start),6));
}
function mobileNextWeekStartKey(todayKey){
  return dateKeyFromDate(addDateDays(parseDateKey(weekStartKeyFrom(todayKey)),7));
}
function mobileNextWeekEndKey(todayKey){
  return dateKeyFromDate(addDateDays(parseDateKey(weekStartKeyFrom(todayKey)),13));
}
function mobileRangeOverlaps(w,rangeStart,rangeEnd){
  const start=w.date||'';
  const end=workorderEndDate(w)||start;
  if(!start) return false;
  return start<=rangeEnd && end>=rangeStart;
}
function mobileJobPlannedHoursInRange(w,rangeStart,rangeEnd){
  const start=w.date||rangeStart;
  const end=workorderEndDate(w)||start;
  const from=start>rangeStart?start:rangeStart;
  const to=end<rangeEnd?end:rangeEnd;
  if(to<from) return 0;
  const days=Math.max(1,Math.round((parseDateKey(to)-parseDateKey(from))/(24*60*60*1000))+1);
  return workorderHours(w)*days;
}
function mobileJobPlannedHours(w){
  const start=w.date||dateKeyFromDate(new Date());
  const end=workorderEndDate(w)||start;
  const days=Math.max(1,Math.round((parseDateKey(end)-parseDateKey(start))/(24*60*60*1000))+1);
  return workorderHours(w)*days;
}
function mobileOncallForPerson(personId,todayKey){
  const shifts=(state.oncall||[]).filter(o=>o.personId===personId).sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
  const todayShift=shifts.find(o=>o.start<=todayKey&&o.end>=todayKey);
  const nextShift=shifts.find(o=>o.start>todayKey);
  const conflict=(todayShift?oncallConflicts(todayShift):[])[0];
  if(conflict) return {type:'conflict',label:`⚠ Valve kattub puudumisega ${fmtActDate(conflict.start)}–${fmtActDate(conflict.end)}`};
  if(todayShift) return {type:'today',label:`🟢 Täna valves`};
  if(nextShift) return {type:'next',label:`🟦 Järgmine valve: ${fmtActDate(nextShift.start)}–${fmtActDate(nextShift.end)}`};
  return {type:'none',label:'Valve puudub'};
}
function mobileNeedsAct(w){
  if(!w) return false;
  if(w.requiresAct===true || w.needsAct===true || w.actRequired===true) return true;
  if(String(w.actNeed||'').toLowerCase()==='jah') return true;
  if(w.actType && !state.acts.some(a=>a.workorderId===w.id)) return true;
  return false;
}
function mobileActLabel(w){
  const existing=state.acts.find(a=>a.workorderId===w.id);
  if(existing) return `Akt: ${existing.status||'koostatud'}`;
  if(mobileNeedsAct(w)) return `Vajab akti${w.actType?' · '+w.actType:''}`;
  return '';
}
function mobileWorkCard(w,opts={}){
  const actLabel=mobileActLabel(w);
  const dateLabel=workorderDateRangeLabel(w);
  const rolePart=opts.personId?`<div class="kv"><span>Roll</span><strong>${esc(workorderRoleLabel(w,opts.personId)||'Töö')}</strong></div>`:'';
  const dayPart=opts.dayLabel?`<div class="kv"><span>Vaade</span><strong>${esc(opts.dayLabel)}</strong></div>`:'';
  return `<div class="card mobile-work-card ${opts.extraClass||''}"><div class="card-top"><h3>${esc(w.time||'')} · ${esc(objectName(w.objectId))}</h3><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div><div class="kv"><span>Klient</span><strong>${esc(clientName(objectClientId(w.objectId)))}</strong></div><div class="kv"><span>Töö</span><strong>${esc(w.title)}</strong></div><div class="kv"><span>Kuupäev</span><strong>${esc(dateLabel)}</strong></div>${rolePart}${dayPart}${actLabel?`<div class="kv"><span>Akt</span><strong>${esc(actLabel)}</strong></div>`:''}<div class="muted">${esc(w.description||'')}</div><div class="actions mobile-actions">${mobileWorkflowButtons(w)}</div></div>`;
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
  const tomorrow=mobileTomorrowKey(today);
  const thisWeekStart=dateKeyFromDate(addDateDays(parseDateKey(today),2));
  const thisWeekEnd=mobileCurrentWeekEndKey(today);
  const nextWeekStart=mobileNextWeekStartKey(today);
  const nextWeekEnd=mobileNextWeekEndKey(today);
  const ownWorkorders=state.workorders.filter(w=>workorderMatchesPerson(w,current.id));
  const isOpen=w=>!isCompletedStatus(w.status);
  const byDateTime=(a,b)=>`${a.date} ${a.time||''}`.localeCompare(`${b.date} ${b.time||''}`);
  const todayJobs=ownWorkorders.filter(w=>isOpen(w)&&workorderOccursOnDay(w,today)).sort(byDateTime);
  const tomorrowJobs=ownWorkorders.filter(w=>isOpen(w)&&workorderOccursOnDay(w,tomorrow)).sort(byDateTime);
  const thisWeekJobs=thisWeekStart<=thisWeekEnd
    ? ownWorkorders.filter(w=>isOpen(w)&&mobileRangeOverlaps(w,thisWeekStart,thisWeekEnd)&&!workorderOccursOnDay(w,today)&&!workorderOccursOnDay(w,tomorrow)).sort(byDateTime)
    : [];
  const nextWeekJobs=ownWorkorders.filter(w=>isOpen(w)&&mobileRangeOverlaps(w,nextWeekStart,nextWeekEnd)).sort(byDateTime);
  const unfinishedJobs=ownWorkorders.filter(w=>{
    if(!isOpen(w)) return false;
    const end=workorderEndDate(w);
    return (end && end<today) || mobileNeedsAct(w);
  }).sort(byDateTime);
  const completedJobs=ownWorkorders
    .filter(w=>isCompletedStatus(w.status))
    .sort((a,b)=>`${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`))
    .slice(0,12);
  const actions=`<button class="btn primary" id="mobileAddWorkBtn" type="button">＋ Lisa töö</button><button class="btn ghost" id="mobileSwitchUserBtn" type="button">⇄ Vaheta</button>`;
  const sectionSummary=(jobs,rangeStart,rangeEnd)=>{
    const hours=jobs.reduce((sum,w)=>sum+mobileJobPlannedHoursInRange(w,rangeStart,rangeEnd),0);
    return `<div class="mobile-future-title mobile-period-summary"><strong>${jobs.length} tööd</strong><span>${hours} h</span></div>`;
  };
  const completedRows=completedJobs.map(w=>{const comment=completionCommentText(w);return `<div class="card mobile-work-card mobile-completed-card"><div class="card-top"><h3>${esc(w.time||'')} · ${esc(objectName(w.objectId))}</h3><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div><div class="kv"><span>Klient</span><strong>${esc(clientName(objectClientId(w.objectId)))}</strong></div><div class="kv"><span>Töö</span><strong>${esc(w.title)}</strong></div><div class="kv"><span>Kuupäev</span><strong>${esc(workorderDateRangeLabel(w))}</strong></div>${comment?`<div class="mobile-completion-comment"><strong>Töö tulemus</strong><span>${esc(comment)}</span></div>`:`<div class="muted">Töö tulemus puudub.</div>`}<div class="actions mobile-actions">${mobileWorkflowButtons(w)}</div></div>`}).join('')||'<div class="card"><strong>Lõpetatud töid ei ole</strong><span class="muted">Kui töö lõpetatakse, jääb see siia vajadusel uuesti avamiseks.</span></div>';
  const groups={
    today:{label:'Täna',short:'Täna',count:todayJobs.length,jobs:todayJobs,empty:'Tänaseid töid ei ole',body:todayJobs.map(w=>mobileWorkCard(w,{personId:current.id})).join('')},
    tomorrow:{label:'Homme',short:'Homme',count:tomorrowJobs.length,jobs:tomorrowJobs,empty:'Homseid töid ei ole',body:tomorrowJobs.length?`${sectionSummary(tomorrowJobs,tomorrow,tomorrow)}${tomorrowJobs.map(w=>mobileWorkCard(w,{personId:current.id})).join('')}`:''},
    thisweek:{label:'See nädal',short:'See nädal',count:thisWeekJobs.length,jobs:thisWeekJobs,empty:'Selle nädala ülejäänud töid ei ole',body:thisWeekJobs.length?`${sectionSummary(thisWeekJobs,thisWeekStart,thisWeekEnd)}${thisWeekJobs.map(w=>mobileWorkCard(w,{personId:current.id})).join('')}`:''},
    nextweek:{label:'Järgmine nädal',short:'Järgmine',count:nextWeekJobs.length,jobs:nextWeekJobs,empty:'Järgmise nädala töid ei ole',body:nextWeekJobs.length?`${sectionSummary(nextWeekJobs,nextWeekStart,nextWeekEnd)}${nextWeekJobs.map(w=>mobileWorkCard(w,{personId:current.id})).join('')}`:''},
    unfinished:{label:'Tegemata / vajab akti',short:'Tegemata',count:unfinishedJobs.length,jobs:unfinishedJobs,empty:'Tegemata või akti vajavaid töid ei ole',body:unfinishedJobs.map(w=>mobileWorkCard(w,{extraClass:'mobile-warning-card',personId:current.id})).join('')},
    completed:{label:'Lõpetatud tööd',short:'Lõpetatud',count:completedJobs.length,jobs:completedJobs,empty:'Lõpetatud töid ei ole',body:completedRows}
  };
  const order=['today','tomorrow','thisweek','nextweek','unfinished','completed'];
  const storedTab=localStorage.getItem('veco_mobile_active_tab')||'';
  const fallback=order.find(k=>groups[k].count>0&&k!=='completed')||'today';
  const activeTab=groups[storedTab]?storedTab:fallback;
  const activeGroup=groups[activeTab];
  const headerStats=`${todayJobs.length} täna • ${tomorrowJobs.length} homme • ${thisWeekJobs.length} see nädal • ${nextWeekJobs.length} järgmine nädal • ${unfinishedJobs.length} tegemata`;
  const oncallInfo=mobileOncallForPerson(current.id,today);
  const tabCards=order.map(key=>{
    const g=groups[key];
    const warn=key==='unfinished'&&g.count>0?' warn':'';
    const active=key===activeTab?' active':'';
    return `<button class="mobile-tab-card${active}${warn}" data-mobile-tab="${key}" type="button"><span>${esc(g.short)}</span><strong>${g.count}</strong></button>`;
  }).join('');
  const activeBody=activeGroup.body||`<div class="card"><strong>${esc(activeGroup.empty)}</strong><span class="muted">Vali ülevalt teine kaart või lisa uus töö.</span></div>`;
  shell(`<div class="panel-head mobile-head"><div><h2>${esc(current.name)}</h2><div class="mobile-duty ${esc(oncallInfo.type)}">${esc(oncallInfo.label)}</div><span class="muted">${esc(headerStats)} · ${esc(current.role||'')}</span></div><div class="filters mobile-head-actions">${actions}</div></div><div class="detail-body mobile-detail"><div class="mobile-tab-grid">${tabCards}</div><div class="mobile-active-section"><div class="mobile-active-title"><h3>${esc(activeGroup.label)} (${activeGroup.count})</h3><span class="muted">Kaardivalik</span></div><div class="grid mobile-work-grid">${activeBody}</div></div></div>`,'',{wide:true});
  $('#mobileSwitchUserBtn')?.addEventListener('click',()=>{localStorage.removeItem(USER_KEY);renderMobile();});
  $('#mobileAddWorkBtn')?.addEventListener('click',()=>openMobileAddWorkModal(current.id));
  $$('[data-mobile-tab]').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem('veco_mobile_active_tab',btn.dataset.mobileTab);renderMobile();}));
  $$('[data-mobile-action]').forEach(btn=>btn.addEventListener('click',()=>applyMobileWorkorderAction(btn.dataset.mobileAction,btn.dataset.workorderId)));
  $$('[data-mobile-edit]').forEach(btn=>btn.addEventListener('click',()=>openMobileWorkModal(btn.dataset.mobileEdit)));
}

function mobileObjectChoiceLabel(o){
  const client=clientName(o.clientId);
  return `${o.name}${client&&client!=='-'?' · '+client:''}`;
}
function resolveMobileObjectChoice(raw){
  const value=String(raw||'').trim();
  if(!value) return null;
  const exact=state.objects.find(o=>mobileObjectChoiceLabel(o).toLowerCase()===value.toLowerCase()||String(o.name||'').toLowerCase()===value.toLowerCase());
  if(exact) return exact;
  const created={
    id:uid('O'),
    clientId:'',
    name:value,
    address:'',
    mainContact:'',
    responsibleTechId:'',
    contract:'',
    status:'active',
    notes:'Lisatud tehniku vaatest töökäsu loomisel.',
    contacts:[]
  };
  state.objects.push(created);
  return created;
}
function openMobileAddWorkModal(personId){
  const today=dateKeyFromDate(new Date());
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=now.getMinutes()<30?'00':'30';
  const objectOptions=state.objects.map(o=>`<option value="${esc(mobileObjectChoiceLabel(o))}"></option>`).join('');
  openModal(`<form id="mobileAddWorkForm"><div class="dialog-head"><h2>Lisa töö</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="form-grid mobile-form-grid"><label class="full">Objekt<input class="field" name="objectChoice" list="mobileObjectChoices" required autocomplete="off" placeholder="Vali objekt või kirjuta uus objekt..."><datalist id="mobileObjectChoices">${objectOptions}</datalist><span class="muted">Vali olemasolev objekt või kirjuta uue objekti nimi.</span></label><label class="full">Töö lühikirjeldus<input class="field" name="title" required placeholder="nt Telefonitellimus / rike"></label><label>Kuupäev<input class="field" name="date" type="date" required value="${today}"></label><label>Kell<input class="field" name="time" type="time" value="${hh}:${mm}"></label><label>Prioriteet<select class="select" name="priority"><option>Tavaline</option><option>Kõrge</option><option>Madal</option></select></label><label>Staatus<select class="select" name="status">${workorderStatusOptions.map(st=>`<option ${st==='Planeeritud'?'selected':''}>${st}</option>`).join('')}</select></label><label class="full">Märkus<textarea name="description" placeholder="Kes helistas, mida paluti, mis objektil juhtus?"></textarea></label></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta töö</button></div></form>`);
  bindClose();
  $('#mobileAddWorkForm').addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const object=resolveMobileObjectChoice(f.objectChoice.value);
    if(!object){f.objectChoice.focus();return;}
    const project=state.projects.find(p=>p.objectId===object.id);
    const next={id:uid('WO'),projectId:project?.id||'',objectId:object.id,title:f.title.value,date:f.date.value,time:f.time.value,technicianId:personId,responsibleTechnicianId:personId,participantTechnicianIds:[],status:f.status.value,priority:f.priority.value,description:f.description.value};
    state.workorders.push(next);
    selectedWorkorderId=next.id;
    save();
    closeModal();
    renderMobile();
  });
}
function openMobileWorkModal(id){
  const w=byId(state.workorders,id); if(!w) return;
  openModal(`<form id="mobileWorkForm"><div class="dialog-head"><h2>${esc(w.title)}</h2><button type="button" class="btn ghost" id="modalCloseBtn">× Sulge</button></div><div class="detail-body"><div class="card"><strong>${esc(objectName(w.objectId))}</strong><span class="muted">${esc(fmtActDate(w.date))} ${esc(w.time||'')} · ${esc(clientName(objectClientId(w.objectId)))}</span></div><div class="form-grid mobile-form-grid"><label class="full">Tehtud töö / märkus<textarea name="done">${esc(w.done||w.workDone||'')}</textarea></label><label>Staatus<select class="select" name="status">${workorderStatusOptions.map(st=>`<option ${w.status===st?'selected':''}>${st}</option>`).join('')}</select></label><label>Foto / viide<input class="field" name="photoNote" value="${esc(w.photoNote||'')}" placeholder="Foto lisamine tuleb järgmises etapis"></label></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#mobileWorkForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget.elements;const nextStatus=f.status.value;const note=String(f.done.value||'').trim();if(nextStatus==='Lõpetatud'){const result=isCompletedStatus(w.status)?{comment:(completionCommentText(w)||note),actType:w.actType||'Väljakutse akt'}:normalizeCompletionResult(await openCompletionCommentModal(w,note));if(!result||!result.comment)return;w.completedAt=w.completedAt||new Date().toISOString();w.completedBy=w.completedBy||completedByLabel(w);w.completionComment=result.comment;w.actType=result.actType;w.done=result.comment;w.workDone=result.comment;ensureActForWorkorder(w.id);}else{w.completedAt='';w.completedBy='';w.completionComment='';w.done=note;w.workDone=note;}w.status=nextStatus;w.photoNote=f.photoNote.value;save();closeModal();state=window.VECO_STORAGE.load();renderMobile();});
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

function estonianEasterDate(year){
  const a=year%19;
  const b=Math.floor(year/100);
  const c=year%100;
  const d=Math.floor(b/4);
  const e=b%4;
  const f=Math.floor((b+8)/25);
  const g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30;
  const i=Math.floor(c/4);
  const k=c%4;
  const l=(32+2*e+2*i-h-k)%7;
  const m=Math.floor((a+11*h+22*l)/451);
  const month=Math.floor((h+l-7*m+114)/31)-1;
  const day=((h+l-7*m+114)%31)+1;
  return new Date(year,month,day,12,0,0);
}
function estonianHolidayMapForYear(year){
  const map=new Map();
  const add=(key,name,type='holiday')=>map.set(key,{name,type});
  add(`${year}-01-01`,'Uusaasta');
  add(`${year}-02-24`,'Eesti Vabariigi aastapäev');
  const easter=estonianEasterDate(year);
  add(dateKeyFromDate(addDateDays(easter,-2)),'Suur reede');
  add(dateKeyFromDate(easter),'Ülestõusmispühade 1. püha');
  add(`${year}-05-01`,'Kevadpüha');
  add(dateKeyFromDate(addDateDays(easter,49)),'Nelipühade 1. püha');
  add(`${year}-06-23`,'Võidupüha');
  add(`${year}-06-24`,'Jaanipäev');
  add(`${year}-08-20`,'Taasiseseisvumispäev');
  add(`${year}-12-24`,'Jõululaupäev');
  add(`${year}-12-25`,'Esimene jõulupüha');
  add(`${year}-12-26`,'Teine jõulupüha');
  return map;
}
function previousWorkdayKey(date){
  let d=addDateDays(date,-1);
  while(d.getDay()===0 || d.getDay()===6) d=addDateDays(d,-1);
  return dateKeyFromDate(d);
}
function estonianShortDayMapForYear(year){
  const map=new Map();
  const add=(date,name)=>map.set(previousWorkdayKey(date),{name,type:'short'});
  add(new Date(year,0,1,12,0,0),'Uusaastale eelnev lühendatud tööpäev');
  add(new Date(year,1,24,12,0,0),'Eesti Vabariigi aastapäevale eelnev lühendatud tööpäev');
  add(new Date(year,5,23,12,0,0),'Võidupühale eelnev lühendatud tööpäev');
  add(new Date(year,11,24,12,0,0),'Jõululaupäevale eelnev lühendatud tööpäev');
  add(new Date(year+1,0,1,12,0,0),'Uusaastale eelnev lühendatud tööpäev');
  return map;
}
function estonianCalendarDayInfo(dateKey){
  const d=parseDateKey(dateKey);
  const year=d.getFullYear();
  const holidayMaps=[estonianHolidayMapForYear(year-1),estonianHolidayMapForYear(year),estonianHolidayMapForYear(year+1)];
  for(const m of holidayMaps){ if(m.has(dateKey)) return {...m.get(dateKey),isHoliday:true,isShort:false,isWeekend:d.getDay()===0||d.getDay()===6}; }
  const shortMaps=[estonianShortDayMapForYear(year-1),estonianShortDayMapForYear(year),estonianShortDayMapForYear(year+1)];
  for(const m of shortMaps){ if(m.has(dateKey)) return {...m.get(dateKey),isHoliday:false,isShort:true,isWeekend:d.getDay()===0||d.getDay()===6}; }
  return {name:'',type:'normal',isHoliday:false,isShort:false,isWeekend:d.getDay()===0||d.getDay()===6};
}
function calendarDayClass(dateKey){
  const info=estonianCalendarDayInfo(dateKey);
  const classes=[];
  if(info.isWeekend) classes.push('weekend');
  if(info.isHoliday) classes.push('holiday');
  if(info.isShort) classes.push('short-day');
  return classes.join(' ');
}
function calendarDayMarker(dateKey){
  const info=estonianCalendarDayInfo(dateKey);
  if(info.isHoliday) return `<small class="calendar-day-note" title="${esc(info.name)}">${esc(info.name)}</small>`;
  if(info.isShort) return `<small class="calendar-day-note" title="${esc(info.name)}">Lühendatud tööpäev</small>`;
  return '';
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
  const calendarDefaultStatuses=['Uus','Planeeritud','Töös','Ootel','Pausil','Lõpetatud'];
  const visibleDays=calendarVisibleDays(currentDate,mode,hideWeekend);
  const startKey=mode==='week'?weekStartKeyFrom(currentDate):currentDate;
  const workorderOccursOnDate=(w,date)=>{
    const start=w.date;
    const end=workorderEndDate(w);
    return !!start && date>=start && date<=end;
  };
  const workorderIntersectsVisibleDays=(w)=> visibleDays.some(date=>workorderOccursOnDate(w,date));
  const dateInView=(w)=>{
    if(mode==='year') return w.date && w.date.startsWith(String(parseDateKey(currentDate).getFullYear())+'-');
    return workorderIntersectsVisibleDays(w);
  };
  const filtered=state.workorders.filter(w=>{
    const techOk=techFilter==='all'||workorderMatchesPerson(w,techFilter);
    const statusOk=statusFilter==='all'||(statusFilter==='open'?calendarDefaultStatuses.includes(w.status):w.status===statusFilter);
    const hay=`${w.id} ${w.title} ${clientName(objectClientId(w.objectId))} ${objectName(w.objectId)} ${projectName(w.projectId)} ${workorderPeopleLabel(w)} ${w.status}`.toLowerCase();
    return dateInView(w)&&techOk&&statusOk;
  });
  const filters=`<input class="field" id="calendarWeekStart" type="date" value="${esc(currentDate)}"><select class="select" id="calendarTechFilter"><option value="all">Kõik tehnikud</option>${state.people.map(p=>`<option value="${p.id}" ${techFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><select class="select" id="calendarViewMode"><option value="day" ${mode==='day'?'selected':''}>Päev</option><option value="week" ${mode==='week'?'selected':''}>Nädal</option><option value="month" ${mode==='month'?'selected':''}>Kuu</option><option value="year" ${mode==='year'?'selected':''}>Aasta</option></select><button class="btn ghost" id="calendarHideWeekend" type="button" data-hidden="${hideWeekend?'true':'false'}">▦ ${hideWeekend?'Näita L/P':'Peida L/P'}</button><select class="select" id="calendarStatusFilter"><option value="open" ${statusFilter==='open'?'selected':''}>Kalendri tööd</option><option value="all" ${statusFilter==='all'?'selected':''}>Kõik staatused</option>${workorderStatusOptions.map(s=>`<option value="${s}" ${statusFilter===s?'selected':''}>${s}</option>`).join('')}</select>`;
  const actions=`<button class="btn ghost" id="calendarImportWorkBtn" type="button">▧ Impordi töö</button><button class="btn ghost" id="calendarPrevWeekBtn" type="button">‹ Eelmine</button><button class="btn primary" id="calendarThisWeekBtn" type="button">⌖ Täna</button><button class="btn ghost" id="calendarNextWeekBtn" type="button">Järgmine ›</button><button class="btn primary" id="newCalendarWorkorderBtn" type="button">＋ Lisa töökäsk</button>`;
  const calendarStartHour=6;
  const calendarEndHour=22;
  const calendarHoursTotal=calendarEndHour-calendarStartHour;
  const workdayStartHour=8;
  const workdayEndHour=17;
  const workdayStartPct=Math.max(0,Math.min(100,((workdayStartHour-calendarStartHour)/calendarHoursTotal)*100));
  const workdayEndPct=Math.max(0,Math.min(100,((workdayEndHour-calendarStartHour)/calendarHoursTotal)*100));
  const workdayHeightPct=Math.max(0,workdayEndPct-workdayStartPct);
  const shortDayStartHour=workdayEndHour-3;
  const shortDayStartPct=Math.max(0,Math.min(100,((shortDayStartHour-calendarStartHour)/calendarHoursTotal)*100));
  const shortDayHeightPct=Math.max(0,100-shortDayStartPct);
  const hours=Array.from({length:calendarHoursTotal},(_,i)=>calendarStartHour+i);
  const dayNames=['P','E','T','K','N','R','L'];
  const today=dateKeyFromDate(new Date());
  const now=new Date();
  const nowHour=now.getHours()+now.getMinutes()/60;
  const showNowLine=mode==='week'||mode==='day';
  const nowTopPct=Math.max(0,Math.min(100,((nowHour-calendarStartHour)/calendarHoursTotal)*100));

  let body='';
  if(mode==='week'||mode==='day'){
    const buildCalendarCard=(w,{date='',compactClass='',spanEvent=false,spanStartIndex=0,spanDays=1}={})=>{
      const [hh,mm]=(w.time||'09:00').split(':').map(Number);
      const start=((Number.isFinite(hh)?hh:9)+(Number.isFinite(mm)?mm:0)/60);
      const topPct=Math.max(0,Math.min(96,((start-calendarStartHour)/calendarHoursTotal)*100));
      const duration=workorderHours(w);
      const minHeight=Math.max(compactClass?34:40,Math.min(60,duration*34));
      const endTime=workorderEndTime(w,calendarEndHour);
      const totalSpan=workorderDaySpan(w);
      const currentDayIndex=date?Math.min(totalSpan,daysBetweenKeys(w.date,date)+1):1;
      const dayLabel=totalSpan>1?(spanEvent?`Kestus: ${totalSpan} päeva`:`${currentDayIndex}/${totalSpan} päeva`):'1 päev';
      const rangeLabel=totalSpan>1?` · ${fmtShortDate(w.date)}–${fmtShortDate(workorderEndDate(w))}`:'';
      const style=spanEvent
        ? `--span-start:${spanStartIndex};--span-days:${spanDays};top:calc(40px + (100% - 40px) * ${topPct/100});height:calc(((100% - 40px) / var(--calendar-hours-count)) * ${duration} - 4px);min-height:${minHeight}px`
        : `top:${topPct}%;height:calc((100% / var(--calendar-hours-count)) * ${duration} - 4px);min-height:${minHeight}px`;
      const daySeparators=spanEvent&&spanDays>1?Array.from({length:spanDays-1},(_,i)=>`<span class="calendar-span-day-separator" style="left:${((i+1)/spanDays)*100}%" aria-hidden="true"></span>`).join(''):'';
      return `<button class="calendar-event calendar-status-${statusSlug(w.status)}${compactClass}${totalSpan>1?' multi-day':''}${spanEvent?' calendar-span-event':''}" style="${style}" data-calendar-edit="${w.id}" data-calendar-drag="${w.id}" data-calendar-start="${esc(w.date||'')}" data-calendar-end="${esc(workorderEndDate(w))}" type="button" title="Lohista töö teisele ajale või päevale. Venita külgedelt mitmepäevaseks."><span class="calendar-span-continuation" aria-hidden="true"></span>${daySeparators}<span class="calendar-span-resize calendar-span-resize-left" data-calendar-span-resize="${w.id}" data-resize-side="left" title="Venita alguskuupäeva" aria-hidden="true"></span><span class="calendar-span-resize calendar-span-resize-right" data-calendar-span-resize="${w.id}" data-resize-side="right" title="Venita lõppkuupäeva" aria-hidden="true"></span><span class="calendar-time-resize calendar-time-resize-top" data-calendar-start-resize="${w.id}" title="Muuda alguskellaaega" aria-hidden="true"></span><span class="calendar-move-edge calendar-move-edge-left" title="Lohista vasakule / eelmisele päevale" aria-hidden="true"></span><span class="calendar-move-edge calendar-move-edge-right" title="Lohista paremale / järgmisele päevale" aria-hidden="true"></span><span class="calendar-event-head"><strong><b class="calendar-start-time">${esc(w.time||'')}</b> · ${esc(objectName(w.objectId))}</strong><em class="status ${statusClass(w.status)}">${esc(w.status)}</em></span><small>${esc(clientName(objectClientId(w.objectId)))} · ${esc(w.title)}</small><small>${esc(workorderAssigneeLabel(w))} · ${esc(projectName(w.projectId))}</small><span class="calendar-event-footer" aria-label="Töö lõpp ja kestus"><b class="calendar-duration">${duration} h · ${esc(dayLabel)}${esc(rangeLabel)}</b><b class="calendar-end-time">kuni ${esc(fmtShortDate(workorderEndDate(w)))} ${esc(endTime)}</b></span><span class="calendar-resize-handle" data-calendar-resize="${w.id}" title="Muuda kellalist kestust" aria-hidden="true"></span></button>`;
    };
    const multiDayOverlay=filtered.filter(w=>workorderDaySpan(w)>1 && workorderIntersectsVisibleDays(w)).sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(w=>{
      const startIdx=visibleDays.findIndex(date=>workorderOccursOnDate(w,date));
      const endIdx=visibleDays.reduce((last,date,idx)=>workorderOccursOnDate(w,date)?idx:last,-1);
      if(startIdx<0||endIdx<startIdx) return '';
      return buildCalendarCard(w,{spanEvent:true,spanStartIndex:startIdx,spanDays:endIdx-startIdx+1});
    }).join('');
    const columns=visibleDays.map(date=>{
      const d=parseDateKey(date);
      const jobs=filtered.filter(w=>workorderOccursOnDate(w,date) && workorderDaySpan(w)<=1).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      const compactClass=jobs.length>=3?' compact':'';
      const cards=jobs.map(w=>buildCalendarCard(w,{date,compactClass})).join('');
      const slots=hours.map(h=>`<button class="calendar-slot" data-add-date="${date}" data-add-time="${String(h).padStart(2,'0')}:00" title="Lisa töö ${date} ${String(h).padStart(2,'0')}:00" type="button"></button>`).join('');
      const dayInfo=estonianCalendarDayInfo(date);
      const specialShade=dayInfo.isHoliday||dayInfo.isWeekend?'<span class="calendar-special-day-shade full" aria-hidden="true"></span>':(dayInfo.isShort?`<span class="calendar-special-day-shade partial" style="top:${shortDayStartPct}%;height:${shortDayHeightPct}%" aria-hidden="true"></span>`:'');
      const workdayMarkers=`${specialShade}<span class="calendar-workday-shade" style="top:${workdayStartPct}%;height:${workdayHeightPct}%" aria-hidden="true"></span><span class="calendar-workday-line calendar-workday-start" style="top:${workdayStartPct}%" aria-hidden="true"></span><span class="calendar-workday-line calendar-workday-end" style="top:${workdayEndPct}%" aria-hidden="true"></span>`;
      const hasJobs=cards || filtered.some(w=>workorderOccursOnDate(w,date));
      const dayNote=calendarDayMarker(date);
      return `<div class="calendar-planner-day ${date===today?'today':''} ${calendarDayClass(date)}"><div class="calendar-planner-day-head"><strong>${dayNames[d.getDay()]}</strong><span>${esc(fmtShortDate(date,true))}</span>${dayNote}</div><div class="calendar-planner-lane" data-calendar-lane="${date}">${workdayMarkers}${slots}${date===today&&showNowLine?`<div class="calendar-now-line" style="top:${nowTopPct}%"><span>${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}</span></div>`:''}${cards || (!hasJobs?'<div class="calendar-empty-note">Töid ei ole</div>':'')}</div></div>`;
    }).join('');
    body=`<div class="calendar-planner" style="--calendar-hours-count:${hours.length}"><div class="calendar-hours"><div class="calendar-hours-spacer"></div>${hours.map(h=>`<div class="calendar-hour-label">${String(h).padStart(2,'0')}:00</div>`).join('')}</div><div class="calendar-planner-grid" style="--calendar-day-count:${visibleDays.length};grid-template-columns:repeat(${visibleDays.length},minmax(150px,1fr))">${columns}${multiDayOverlay}</div></div>`;
  }else if(mode==='month'){
    body=`<div class="calendar-month-grid">${visibleDays.map(date=>{const jobs=filtered.filter(w=>workorderOccursOnDate(w,date)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));const d=parseDateKey(date);const dayNote=calendarDayMarker(date);return `<div class="calendar-month-day ${date===today?'today':''} ${calendarDayClass(date)}" data-add-date="${date}"><div class="calendar-month-head"><strong>${d.getDate()}</strong><span>${dayNames[d.getDay()]}</span></div>${dayNote}${jobs.slice(0,4).map(w=>`<button class="calendar-mini-event" data-calendar-edit="${w.id}" type="button">${esc(w.time||'')} · ${esc(objectName(w.objectId))}${workorderDaySpan(w)>1?' · '+esc(daysBetweenKeys(w.date,date)+1)+'/'+esc(workorderDaySpan(w)):''}</button>`).join('')}${jobs.length>4?`<span class="muted">+${jobs.length-4} veel</span>`:''}</div>`}).join('')}</div>`;
  }else{
    body=`<div class="calendar-year-grid">${visibleDays.map(month=>{const jobs=filtered.filter(w=>w.date&&w.date.startsWith(month));const label=parseDateKey(month+'-01').toLocaleDateString('et-EE',{month:'long',year:'numeric'});return `<div class="calendar-year-month"><strong>${esc(label)}</strong><span class="muted">${jobs.length} tööd</span>${jobs.slice(0,5).map(w=>`<button class="calendar-mini-event" data-calendar-edit="${w.id}" type="button">${esc(fmtActDate(w.date))} · ${esc(objectName(w.objectId))}</button>`).join('')}</div>`}).join('')}</div>`;
  }
  window.__VECO_ONCALL_CONTEXT_DAYS__ = visibleDays;
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
  bindCalendarResize(calendarStartHour,calendarEndHour);
  bindCalendarSpanResize();
  bindCalendarDragDrop(calendarStartHour,calendarEndHour);
  $$('[data-calendar-edit]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation(); if(window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__){window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false; return;} openWorkorderModal(el.dataset.calendarEdit);}));
}


function bindCalendarResize(startHour=6,endHour=22){
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const startHourOf=(w)=>timeHourOf(w.time);
  const endLabelFor=(w,hours)=>timeLabelFromHour(clamp(startHourOf(w)+hours,startHourOf(w)+1,endHour));
  const resizeLabel=(w,hours)=>{
    return `${timeLabelFromHour(startHourOf(w))}–${endLabelFor(w,hours)} · ${hours} h`;
  };
  $$('[data-calendar-resize]').forEach(handle=>{
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      const card=handle.closest('[data-calendar-drag]');
      let lane=handle.closest('[data-calendar-lane]');
      const workorderId=handle.dataset.calendarResize;
      const w=byId(state.workorders,workorderId);
      if(!lane&&w?.date) lane=document.querySelector(`[data-calendar-lane="${w.date}"]`);
      if(!card||!lane||!w) return;
      const laneRect=lane.getBoundingClientRect();
      const hourHeight=laneRect.height/(endHour-startHour);
      const startY=e.clientY;
      const startHours=workorderHours(w);
      const maxHours=clamp(endHour-startHourOf(w),1,endHour-startHour);
      let nextHours=startHours;
      card.classList.add('resizing');
      document.body.classList.add('calendar-resize-active');
      card.setAttribute('data-resize-label',resizeLabel(w,nextHours));

      const applyPreview=()=>{
        card.style.height=`calc((100% / var(--calendar-hours-count)) * ${nextHours} - 4px)`;
        card.setAttribute('data-resize-label',resizeLabel(w,nextHours));
        const endEl=card.querySelector('.calendar-end-time');
        const durEl=card.querySelector('.calendar-duration');
        if(endEl) endEl.textContent=endLabelFor(w,nextHours);
        if(durEl) durEl.textContent=`${nextHours} h`;
      };
      const cleanup=()=>{
        document.removeEventListener('pointermove',onMove,true);
        document.removeEventListener('pointerup',onUp,true);
        document.removeEventListener('pointercancel',onCancel,true);
        document.body.classList.remove('calendar-resize-active');
        card.classList.remove('resizing');
        card.removeAttribute('data-resize-label');
      };
      const onMove=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        const delta=Math.round((ev.clientY-startY)/hourHeight);
        nextHours=clamp(startHours+delta,1,maxHours);
        applyPreview();
      };
      const onUp=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        ev.stopPropagation();
        w.plannedHours=nextHours;
        w.durationHours=nextHours;
        w.hours=nextHours;
        save();
        cleanup();
        window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=true;
        setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;renderCalendar();},0);
      };
      const onCancel=()=>{ cleanup(); renderCalendar(); };
      document.addEventListener('pointermove',onMove,true);
      document.addEventListener('pointerup',onUp,true);
      document.addEventListener('pointercancel',onCancel,true);
    },true);
  });

  $$('[data-calendar-start-resize]').forEach(handle=>{
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      const card=handle.closest('[data-calendar-drag]');
      let lane=handle.closest('[data-calendar-lane]');
      const workorderId=handle.dataset.calendarStartResize;
      const w=byId(state.workorders,workorderId);
      if(!lane&&w?.date) lane=document.querySelector(`[data-calendar-lane="${w.date}"]`);
      if(!card||!lane||!w) return;
      const laneRect=lane.getBoundingClientRect();
      const hourHeight=laneRect.height/(endHour-startHour);
      const originalStart=startHourOf(w);
      const originalHours=workorderHours(w);
      const fixedEnd=clamp(originalStart+originalHours,originalStart+1,endHour);
      const minStart=startHour;
      const maxStart=fixedEnd-1;
      const startY=e.clientY;
      let nextStart=originalStart;
      let nextHours=originalHours;
      card.classList.add('resizing','start-resizing');
      document.body.classList.add('calendar-resize-active');

      const label=()=>`${timeLabelFromHour(nextStart)}–${timeLabelFromHour(fixedEnd)} · ${nextHours} h`;
      const applyPreview=()=>{
        const topPct=Math.max(0,Math.min(96,((nextStart-startHour)/(endHour-startHour))*100));
        const isSpan=card.classList.contains('calendar-span-event');
        card.style.top=isSpan?`calc(40px + (100% - 40px) * ${topPct/100})`:`${topPct}%`;
        card.style.height=isSpan?`calc(((100% - 40px) / var(--calendar-hours-count)) * ${nextHours} - 4px)`:`calc((100% / var(--calendar-hours-count)) * ${nextHours} - 4px)`;
        card.setAttribute('data-resize-label',label());
        const startEl=card.querySelector('.calendar-start-time');
        const endEl=card.querySelector('.calendar-end-time');
        const durEl=card.querySelector('.calendar-duration');
        if(startEl) startEl.textContent=timeLabelFromHour(nextStart);
        if(endEl) endEl.textContent=`kuni ${fmtShortDate(workorderEndDate(w))} ${timeLabelFromHour(fixedEnd)}`;
        if(durEl) durEl.textContent=`${nextHours} h`;
      };
      const cleanup=()=>{
        document.removeEventListener('pointermove',onMove,true);
        document.removeEventListener('pointerup',onUp,true);
        document.removeEventListener('pointercancel',onCancel,true);
        document.body.classList.remove('calendar-resize-active');
        card.classList.remove('resizing','start-resizing');
        card.removeAttribute('data-resize-label');
      };
      const onMove=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        const delta=Math.round((ev.clientY-startY)/hourHeight);
        nextStart=clamp(originalStart+delta,minStart,maxStart);
        nextHours=fixedEnd-nextStart;
        applyPreview();
      };
      const onUp=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        ev.stopPropagation();
        w.time=timeLabelFromHour(nextStart);
        w.plannedHours=nextHours;
        w.durationHours=nextHours;
        w.hours=nextHours;
        save();
        cleanup();
        window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=true;
        setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;renderCalendar();},0);
      };
      const onCancel=()=>{ cleanup(); renderCalendar(); };
      card.setAttribute('data-resize-label',label());
      document.addEventListener('pointermove',onMove,true);
      document.addEventListener('pointerup',onUp,true);
      document.addEventListener('pointercancel',onCancel,true);
    },true);
  });
}


function bindCalendarSpanResize(){
  const laneAtPoint=(x,y,ignoreEl)=>{
    const oldPointer=ignoreEl?.style.pointerEvents;
    if(ignoreEl) ignoreEl.style.pointerEvents='none';
    const el=document.elementFromPoint(x,y);
    if(ignoreEl) ignoreEl.style.pointerEvents=oldPointer||'';
    return el?.closest?.('[data-calendar-lane]')||null;
  };
  const dayShort=(date)=>{ const d=parseDateKey(date); return ['P','E','T','K','N','R','L'][d.getDay()]+' '+fmtShortDate(date); };
  const labelFor=(start,end)=> start===end ? `${dayShort(start)} · 1 päev` : `${dayShort(start)} – ${dayShort(end)} · ${daysBetweenKeys(start,end)+1} päeva`;
  $$('[data-calendar-span-resize]').forEach(handle=>{
    handle.addEventListener('pointerdown',e=>{
      if(e.button!==0) return;
      e.preventDefault();
      e.stopPropagation();
      const workorderId=handle.dataset.calendarSpanResize;
      const side=handle.dataset.resizeSide||'right';
      const card=handle.closest('[data-calendar-drag]');
      const w=byId(state.workorders,workorderId);
      if(!card||!w) return;
      let nextStart=w.date;
      let nextEnd=workorderEndDate(w);
      let resizing=false;
      const begin=()=>{
        resizing=true;
        window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=true;
        document.body.classList.add('calendar-span-resize-active');
        card.classList.add('span-resizing');
        card.setAttribute('data-span-label',labelFor(nextStart,nextEnd));
      };
      const cleanup=()=>{
        document.removeEventListener('pointermove',onMove,true);
        document.removeEventListener('pointerup',onUp,true);
        document.removeEventListener('pointercancel',onCancel,true);
        document.body.classList.remove('calendar-span-resize-active');
        card.classList.remove('span-resizing');
        card.removeAttribute('data-span-label');
      };
      const applyPoint=(clientX,clientY)=>{
        const lane=laneAtPoint(clientX,clientY,card);
        if(!lane?.dataset?.calendarLane) return;
        const target=lane.dataset.calendarLane;
        const currentStart=w.date;
        const currentEnd=workorderEndDate(w);
        if(side==='right'){
          nextStart=currentStart;
          nextEnd=target<currentStart?currentStart:target;
        }else{
          nextEnd=currentEnd;
          nextStart=target>currentEnd?currentEnd:target;
        }
        card.setAttribute('data-span-label',labelFor(nextStart,nextEnd));
      };
      const onMove=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        if(!resizing) begin();
        ev.preventDefault();
        applyPoint(ev.clientX,ev.clientY);
      };
      const onUp=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        ev.stopPropagation();
        if(resizing){
          applyPoint(ev.clientX,ev.clientY);
          setWorkorderDateRange(w,nextStart,nextEnd);
          save();
        }
        cleanup();
        setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;renderCalendar();},0);
      };
      const onCancel=()=>{ cleanup(); setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;},120); };
      document.addEventListener('pointermove',onMove,true);
      document.addEventListener('pointerup',onUp,true);
      document.addEventListener('pointercancel',onCancel,true);
    },true);
  });
}

function bindCalendarDragDrop(startHour=6,endHour=22){
  const clampHour=(value)=>Math.max(startHour,Math.min(endHour-1,value));
  const timeFromPoint=(lane,clientY)=>{
    const rect=lane.getBoundingClientRect();
    const y=Math.max(0,Math.min(rect.height,clientY-rect.top));
    const ratio=rect.height ? y/rect.height : 0;
    const hour=clampHour(startHour+Math.floor(ratio*(endHour-startHour)));
    return `${String(hour).padStart(2,'0')}:00`;
  };
  const laneAtPoint=(x,y,ignoreEl)=>{
    const oldPointer=ignoreEl?.style.pointerEvents;
    if(ignoreEl) ignoreEl.style.pointerEvents='none';
    const el=document.elementFromPoint(x,y);
    if(ignoreEl) ignoreEl.style.pointerEvents=oldPointer||'';
    return el?.closest?.('[data-calendar-lane]')||null;
  };
  const clearTargets=()=>$$('.calendar-planner-lane.drop-target').forEach(x=>x.classList.remove('drop-target'));
  const dayShort=(date)=>{
    const d=parseDateKey(date);
    return ['P','E','T','K','N','R','L'][d.getDay()]+' '+fmtShortDate(date);
  };

  $$('[data-calendar-drag]').forEach(card=>{
    card.addEventListener('pointerdown',e=>{
      if(e.button!==0) return;
      const workorderId=card.dataset.calendarDrag;
      const wStart=byId(state.workorders,workorderId);
      if(!wStart) return;
      const startX=e.clientX;
      const startY=e.clientY;
      const cardRect=card.getBoundingClientRect();
      const offsetX=startX-cardRect.left;
      const offsetY=startY-cardRect.top;
      const originalTime=wStart.time||'09:00';
      let dragging=false;
      let ghost=null;
      let lastLane=null;
      let lastX=startX;
      let lastY=startY;
      let horizontalMove=false;
      const originalTransition=card.style.transition;
      const originalZ=card.style.zIndex;

      const createGhost=()=>{
        ghost=card.cloneNode(true);
        ghost.classList.add('calendar-drag-ghost');
        ghost.classList.remove('dragging');
        ghost.style.width=`${cardRect.width}px`;
        ghost.style.height=`${cardRect.height}px`;
        ghost.style.left=`${cardRect.left}px`;
        ghost.style.top=`${cardRect.top}px`;
        ghost.style.transform='none';
        ghost.style.pointerEvents='none';
        document.body.appendChild(ghost);
      };
      const updateGhost=(clientX,clientY,lane)=>{
        const targetDate=lane?.dataset.calendarLane||'';
        const targetTime=lane?(horizontalMove?originalTime:timeFromPoint(lane,clientY)):'';
        const label=targetDate&&targetTime ? `${dayShort(targetDate)} · ${targetTime}${horizontalMove?' · kellaaeg jääb':''}` : 'Lohista kalendrisse';
        card.setAttribute('data-drag-label',label);
        if(ghost){
          ghost.style.left=`${clientX-offsetX}px`;
          ghost.style.top=`${clientY-offsetY}px`;
          ghost.setAttribute('data-drag-label',label);
        }
      };
      const cleanup=()=>{
        document.removeEventListener('pointermove',onMove,true);
        document.removeEventListener('pointerup',onUp,true);
        document.removeEventListener('pointercancel',onCancel,true);
        document.body.classList.remove('calendar-drag-active');
        clearTargets();
        card.classList.remove('dragging');
        card.style.transform='';
        card.style.transition=originalTransition;
        card.style.zIndex=originalZ;
        card.removeAttribute('data-drag-label');
        ghost?.remove?.();
        ghost=null;
      };
      const beginDrag=()=>{
        dragging=true;
        window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=true;
        document.body.classList.add('calendar-drag-active');
        card.classList.add('dragging');
        card.style.transition='none';
        card.style.zIndex='200';
        createGhost();
      };
      const onMove=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        lastX=ev.clientX;
        lastY=ev.clientY;
        const dx=lastX-startX;
        const dy=lastY-startY;
        if(!dragging && Math.hypot(dx,dy)<8) return;
        if(!dragging) beginDrag();
        horizontalMove=Math.abs(dx)>Math.max(18,Math.abs(dy)*1.35);
        ev.preventDefault();
        lastLane=laneAtPoint(lastX,lastY,ghost||card);
        clearTargets();
        if(lastLane) lastLane.classList.add('drop-target');
        updateGhost(lastX,lastY,lastLane);
      };
      const onUp=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        if(dragging){
          ev.preventDefault();
          ev.stopPropagation();
          const lane=lastLane||laneAtPoint(lastX,lastY,ghost||card);
          const w=byId(state.workorders,workorderId);
          if(w && lane){
            const spanDays=workorderDaySpan(w);
            const newStart=lane.dataset.calendarLane;
            const newEnd=dateKeyFromDate(addDateDays(parseDateKey(newStart),spanDays-1));
            setWorkorderDateRange(w,newStart,newEnd);
            w.time=horizontalMove?originalTime:timeFromPoint(lane,lastY);
            save();
          }
          cleanup();
          setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;renderCalendar();},0);
        }else{
          cleanup();
        }
      };
      const onCancel=()=>{
        cleanup();
        setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;},120);
      };
      document.addEventListener('pointermove',onMove,true);
      document.addEventListener('pointerup',onUp,true);
      document.addEventListener('pointercancel',onCancel,true);
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



function renderTicker(){
  const sources=[
    ['Tänane valve','Sisemine operatiivinfo valvetest.','Valmis ühendamiseks valvegraafikuga'],
    ['Tänased puudumised','Puhkus, haigus, koolitus ja muu puudumine.','Valmis ühendamiseks puhkuste vaatega'],
    ['Hilinenud tööd','Töökäsud, mille planeeritud aeg on möödas.','Tulevane klikitav teade'],
    ['Aktid ootavad allkirja','Aktid, mis vajavad lõpetamist või saatmist.','Tulevane akti töövoog'],
    ['Riigipühad ja tähtpäevad','Eesti pühad ja lühendatud tööpäevad.','Kalendri eripäevade loogika olemas'],
    ['Sünnipäevad','Tehnikute sünnipäevad.','Vajab sünnikuupäeva välja tehniku kaardile'],
    ['Täna ajaloos','Üldinfo tickeri alumisele ribale.','Tulevane sisuallikas'],
    ['Päeva fakt','Kerge infosisu alumisele tickerile.','Tulevane sisuallikas']
  ];
  const rows=sources.map(([name,desc,status])=>`<tr><td><strong>${esc(name)}</strong></td><td>${esc(desc)}</td><td><span class="status ok">${esc(status)}</span></td></tr>`).join('');
  const main=header('Ticker Center','', '', 'HALDUS')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Ülemine ticker','Operatiivne')}${summaryBox('Alumine ticker','Info')}${summaryBox('Allikaid',sources.length)}${summaryBox('Staatus','Alus')}</div><div class="card"><strong>Soovituslik jaotus</strong><span class="muted">Ülemine ticker: valve, puudumised, hilinenud tööd ja aktid. Alumine ticker: riigipühad, sünnipäevad, faktid ja ajalugu.</span></div>${table(['Allikas','Kirjeldus','Staatus'],rows)}</div>`;
  shell(main,'',{wide:true});
}
function renderDemo(){
  const actions=`<button class="btn warn" id="resetDemoDataBtn">${icon('↺')}Taasta demoandmed</button>`;
  const main=header('Demoandmed','',actions,'ARENDUS')+`<div class="detail-body"><div class="card"><strong>Demoandmed on viidud arenduse alla.</strong><span class="muted">Tavavaadetes demoandmete kiirnuppe enam ei kuvata. Kasuta seda vaadet ainult testimiseks või esitluseks.</span></div><div class="card"><strong>Hoiatus</strong><span class="muted">Demoandmete taastamine kirjutab lokaalse testandmestiku üle.</span></div></div>`;
  shell(main,'',{wide:true});
  $('#resetDemoDataBtn')?.addEventListener('click',()=>showConfirmDialog({
    title:'Taasta demoandmed?',
    message:'See asendab praegused lokaalsed andmed demoandmetega.',
    details:'<div class="confirm-kv"><span>Mõju</span><strong>Lokaalne testandmestik kirjutatakse üle</strong></div>',
    confirmText:'Taasta demoandmed',
    onConfirm:()=>{state=window.VECO_STORAGE.reset();normalizeWorkorderPeople();normalizeOncallPeople();save();renderDemo();}
  }));
}
function renderDiagnostics(){
  const rows=[
    ['Versioon',APP_VERSION],
    ['Build',APP_BUILD],
    ['Andmerežiim',window.VECO_API?.modeLabel?.()||'lokaalne'],
    ['Objekte',state.objects.length],
    ['Töökäske',state.workorders.length],
    ['Akte',state.acts.length],
    ['Tehnikuid',state.people.length],
    ['Puudumisi',state.absences.length],
    ['Valvekirjeid',state.oncall.length]
  ].map(([k,v])=>`<tr><td><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join('');
  const main=header('Diagnostika','','','ARENDUS')+`<div class="detail-body">${table(['Parameeter','Väärtus'],rows)}</div>`;
  shell(main,'',{wide:true});
}

function renderCurrentPage(){
  ({calendar:renderCalendar,team:renderTeam,mobile:renderMobile,clients:renderClients,objects:renderObjects,projects:renderProjects,workorders:renderWorkorders,people:renderPeople,acts:renderActs,oncall:renderOncall,vacations:renderVacations,ticker:renderTicker,mobilePreview:renderMobilePreview,demo:renderDemo,diagnostics:renderDiagnostics}[page]||renderCalendar)();
}
async function bootstrapApp(){
  bindLocalPeerSync();
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
      const onRemoteWorkorders=(merged,meta={})=>{ state=merged; renderCurrentPageWhenIdle(); showSyncNotice(meta.source==='polling'?'Andmed uuendatud':'Realtime uuendus'); };
      const realtimeStarted=window.VECO_API.startWorkorderRealtime?.(onRemoteWorkorders,(status)=>{
        if(status==='SUBSCRIBED') showSyncNotice('Realtime ühendus aktiivne');
      });
      if(!realtimeStarted) window.VECO_API.startWorkorderPolling?.(onRemoteWorkorders);
    }catch(err){
      console.warn('VECO bootstrap Supabase load failed',err);
    }
  }
}
bootstrapApp();
