const $=(s)=>document.querySelector(s);
const $$=(s)=>Array.from(document.querySelectorAll(s));
const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=window.VECO_PAGE||'objects';
const APP_VERSION='v3.19.27';
const APP_BUILD='RC1.001';

// VECO Admin LoadingManager: admin-only delayed loader.
// Field V1 and legacy mobile stay intentionally simple and unaffected.
function vecoAdminLoadingEnabled(){
  const p=window.VECO_PAGE||'objects';
  return p!=='mobile' && p!=='technicianV1';
}
const VECO_LOADING=(()=>{
  let counter=0;
  let timer=null;
  let visible=false;
  let lastText='Laen...';
  const delayMs=160;
  function enabled(){ return vecoAdminLoadingEnabled(); }
  function ensure(){
    if(!enabled()) return null;
    let el=document.getElementById('vecoLoadingOverlay');
    if(!el){
      el=document.createElement('div');
      el.id='vecoLoadingOverlay';
      el.className='veco-loading-overlay';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      el.innerHTML=`<div class="veco-loading-card"><div class="veco-loading-logo" aria-hidden="true"><span class="veco-loading-word">VECO</span></div><div class="veco-loading-text">Laen...</div></div>`;
      document.body.appendChild(el);
    }
    return el;
  }
  function render(){
    const el=ensure();
    if(!el) return;
    const textEl=el.querySelector('.veco-loading-text');
    if(textEl) textEl.textContent=lastText||'Laen...';
    el.classList.remove('is-hiding');
    el.classList.add('is-visible');
    visible=true;
  }
  function show(text='Laen...',opts={}){
    if(!enabled()) return;
    counter+=1;
    lastText=text||'Laen...';
    clearTimeout(timer);
    timer=setTimeout(render,opts.immediate?0:delayMs);
  }
  function hide(opts={}){
    if(!enabled()) return;
    counter=opts.force?0:Math.max(0,counter-1);
    if(counter>0) return;
    clearTimeout(timer);
    timer=null;
    const el=document.getElementById('vecoLoadingOverlay');
    if(el){
      el.classList.add('is-hiding');
      el.classList.remove('is-visible');
      setTimeout(()=>{ if(!counter) el.remove(); },180);
    }
    visible=false;
  }
  async function withLoading(text,fn){
    show(text);
    try{ return await fn(); } finally { hide(); }
  }
  function ensureActive(){
    if(enabled() && (counter>0 || visible)) render();
  }
  return {show,hide,withLoading,ensureActive};
})();
if(vecoAdminLoadingEnabled()) VECO_LOADING.show('Laen töölauda...', {immediate:true});
window.__VECO_EMPLOYEE_FILTER_RENDERERS__=window.__VECO_EMPLOYEE_FILTER_RENDERERS__||{};
function closeEmployeeFilterMenu(scope,{render=false}={}){
  const menu=document.querySelector(`[data-employee-filter-menu="${scope}"]`);
  if(!menu || menu.classList.contains('hidden')) return;
  menu.classList.add('hidden');
  if(render && window.__VECO_EMPLOYEE_FILTER_RENDERERS__?.[scope]) window.__VECO_EMPLOYEE_FILTER_RENDERERS__[scope]();
}
function closeAllEmployeeFilterMenus({except=null,render=false}={}){
  document.querySelectorAll('[data-employee-filter-menu]').forEach(menu=>{
    const scope=menu.dataset.employeeFilterMenu;
    if(except && scope===except) return;
    if(!menu.classList.contains('hidden')){
      menu.classList.add('hidden');
      if(render && window.__VECO_EMPLOYEE_FILTER_RENDERERS__?.[scope]) window.__VECO_EMPLOYEE_FILTER_RENDERERS__[scope]();
    }
  });
}

// Build 20260613_1138: kalenderi päeva/kuupäeva päis on eraldi sticky overlay ja jääb aktiivses tööalas nähtavale.
// Keeps filters clickable even if render lifecycle replaces the direct listeners.
document.addEventListener('click',e=>{
  const statusBtn=e.target.closest?.('#teamStatusFilterBtn');
  const peopleBtn=e.target.closest?.('#teamPeopleFilterBtn');
  const employeeBtn=e.target.closest?.('[data-employee-filter-toggle]');
  if(statusBtn){
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('#teamPeopleMenu')?.classList.add('hidden');
    document.querySelector('#teamStatusMenu')?.classList.toggle('hidden');
  }
  if(peopleBtn){
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('#teamStatusMenu')?.classList.add('hidden');
    document.querySelector('#teamPeopleMenu')?.classList.toggle('hidden');
  }
  if(employeeBtn){
    e.preventDefault();
    e.stopPropagation();
    const scope=employeeBtn.dataset.employeeFilterToggle;
    const menu=document.querySelector(`[data-employee-filter-menu="${scope}"]`);
    const willOpen=menu?.classList.contains('hidden');
    closeAllEmployeeFilterMenus({except:scope,render:true});
    if(menu){
      if(willOpen){
        menu.classList.remove('hidden');
      }else{
        closeEmployeeFilterMenu(scope,{render:true});
      }
    }
  }
},true);
document.addEventListener('pointerdown',e=>{
  const wrap=e.target.closest?.('[data-employee-filter]');
  const menu=e.target.closest?.('[data-employee-filter-menu]');
  const toggle=e.target.closest?.('[data-employee-filter-toggle]');
  if(wrap || menu || toggle) return;
  closeAllEmployeeFilterMenus({render:true});
},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape') closeAllEmployeeFilterMenus({render:true});
});
let state=window.VECO_STORAGE.load();
state.projects=state.projects||[]; state.workorders=state.workorders||[]; state.acts=state.acts||[]; state.devices=state.devices||[]; state.objects=state.objects||[]; state.clients=state.clients||[]; state.people=state.people||[]; state.absences=state.absences||[]; state.oncall=state.oncall||[]; state.maintenanceNorms=state.maintenanceNorms||[]; state.maintenanceProfiles=state.maintenanceProfiles||[]; state.granlundClassifiers=state.granlundClassifiers||[]; state.unplannedMaintenance=state.unplannedMaintenance||[]; state.photos=state.photos||[];

// CR-STATE-002: startup hydration. The calendar may restore the last rendered
// shell before app.js loads, so refresh does not show a blank/semi-rendered
// calendar. app.js then hydrates event handlers and updates data in background.
const VECO_BOOT_HTML_PREFIX='veco_boot_html_';
const VECO_BOOT_BUILD_PREFIX='veco_boot_build_';
let __vecoBootSnapshotTimer=null;
function normalizeStateArrays(target=state){
  target.projects=target.projects||[]; target.workorders=target.workorders||[]; target.acts=target.acts||[]; target.devices=target.devices||[]; target.objects=target.objects||[]; target.clients=target.clients||[]; target.people=target.people||[]; target.absences=target.absences||[]; target.oncall=target.oncall||[]; target.maintenanceNorms=target.maintenanceNorms||[]; target.maintenanceProfiles=target.maintenanceProfiles||[]; target.granlundClassifiers=target.granlundClassifiers||[]; target.unplannedMaintenance=target.unplannedMaintenance||[]; target.photos=target.photos||[];
  return target;
}
function saveBootHtmlSnapshot(){
  if(page!=='calendar') return;
  clearTimeout(__vecoBootSnapshotTimer);
  __vecoBootSnapshotTimer=setTimeout(()=>{
    try{
      const app=document.querySelector('.app.page-calendar');
      const modal=document.getElementById('modal');
      if(!app||!modal||modal.classList.contains('open')) return;
      const clone=document.body.cloneNode(true);
      clone.querySelectorAll('script').forEach(n=>n.remove());
      const wrap=document.querySelector('.calendar-planner-wrap');
      if(wrap){
        localStorage.setItem('veco_boot_scroll_top_calendar',String(wrap.scrollTop||0));
        localStorage.setItem('veco_boot_scroll_left_calendar',String(wrap.scrollLeft||0));
      }
      localStorage.setItem(VECO_BOOT_HTML_PREFIX+'calendar',clone.innerHTML);
      localStorage.setItem(VECO_BOOT_BUILD_PREFIX+'calendar',APP_BUILD);
      localStorage.setItem('veco_boot_saved_at_calendar',new Date().toISOString());
    }catch(err){ console.warn('VECO boot snapshot save failed',err); }
  },120);
}

const AUTH_KEY='veco_v3_auth_v1';
const AUTH_SESSION_KEY='veco_v3_auth_session_v1';
const AUTH_LOCK_KEY='veco_v3_auth_locks_v1';
const AUTH_RULES={technician:{min:4,max:4,label:'4-kohaline PIN'},supervisor:{min:4,max:4,label:'4-kohaline PIN'},admin:{min:6,max:12,label:'vähemalt 6-kohaline PIN'},superadmin:{min:6,max:8,label:'6–8 kohaline PIN'}};
const ADMIN_PAGES=new Set(['team','people','vacations','oncall','objects','clients','projects','ticker','maintenanceNorms','devices','maintenanceProfiles','granlundClassifier','unplannedMaintenance','activities','callouts','mobilePreview','demo','diagnostics']);
const SUPERVISOR_PAGES=new Set(['calendar','activities','team','mobile','technicianV1','workorders','acts','vacations','oncall','objects','clients','projects','devices','maintenanceProfiles','unplannedMaintenance']);
// CR-091: technician route guard. Technicians may only use the simplified mobile view.
const TECH_PAGES=new Set(['mobile','technicianV1']);
function isTechnicianUiPage(){return page==='mobile'||page==='technicianV1';}
function authLoad(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'{}')||{};}catch(_){return {};}}
function authSave(a){localStorage.setItem(AUTH_KEY,JSON.stringify(a||{}));}
let authRemoteAvailable=false;
let authPushTimer=null;
function authPushRemote(auth=null){
  if(!authRemoteAvailable||!window.VECO_API?.saveAuthUsers) return;
  clearTimeout(authPushTimer);
  const snapshot=JSON.parse(JSON.stringify(auth||authLoad()));
  authPushTimer=setTimeout(()=>window.VECO_API.saveAuthUsers(snapshot).catch(err=>console.warn('VECO auth remote save failed',err)),120);
}
function authPersist(auth){authSave(auth); authPushRemote(auth);}
async function authSaveUserRemoteNow(user){
  if(window.VECO_API?.mode?.()==='supabase' && window.VECO_API?.saveAuthUser){
    await window.VECO_API.saveAuthUser(user);
  }
}
async function authLoadRemoteIntoLocal(){
  if(window.VECO_API?.mode?.()!=='supabase'||!window.VECO_API?.loadAuthUsers) return false;
  try{
    const remote=await window.VECO_API.loadAuthUsers();
    authRemoteAvailable=true;
    if(remote && Object.keys(remote.users||{}).length){
      // Supabase-first: remote auth_users is the source of truth.
      // Do not push local/demo people back to Supabase on load, because that creates duplicates.
      authSave(remote);
      mergeAuthUsersIntoPeople(remote,{saveState:true,replace:true});
      return true;
    }
    return true;
  }catch(err){ console.warn('VECO auth remote unavailable',err); authRemoteAvailable=false; return false; }
}
function authLocksLoad(){try{return JSON.parse(localStorage.getItem(AUTH_LOCK_KEY)||'{}')||{};}catch(_){return {};}}
function authLocksSave(l){localStorage.setItem(AUTH_LOCK_KEY,JSON.stringify(l||{}));}

function authRoleFromPersonRole(role){
  const r=String(role||'').trim().toLowerCase();
  if(r==='admin') return 'admin';
  if(r==='supervisor'||r==='hooldusjuht'||r==='hooldusjuht / juht'||r==='vanemtehnik') return 'supervisor';
  if(r==='assistant'||r==='assistent') return 'assistant';
  if(r==='contractor'||r==='alltöövõtja'||r==='alltoovotja') return 'contractor';
  if(r==='superadmin') return 'superadmin';
  return 'technician';
}
function personRoleFromAuthRole(role){
  const r=String(role||'').trim().toLowerCase();
  if(r==='admin') return 'Admin';
  if(r==='supervisor') return 'Hooldusjuht';
  if(r==='assistant') return 'Assistent';
  if(r==='contractor') return 'Alltöövõtja';
  return 'Tehnik';
}
function authRoleLabel(role){
  const r=String(role||'').trim().toLowerCase();
  if(r==='admin') return 'Admin';
  if(r==='supervisor') return 'Hooldusjuht';
  if(r==='assistant') return 'Assistent';
  if(r==='contractor') return 'Alltöövõtja';
  if(r==='superadmin') return 'Superadmin';
  return 'Tehnik';
}
function authUsernameFromPerson(p){
  const base=String(p?.email||p?.name||p?.id||'').trim().toLowerCase();
  const cleaned=base.split('@')[0].normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[õ]/g,'o').replace(/[ä]/g,'a').replace(/[ö]/g,'o').replace(/[ü]/g,'u').replace(/[^a-z0-9]+/g,'.').replace(/^\.+|\.+$/g,'');
  return cleaned||String(p?.id||'').replace(/^U-/i,'').toLowerCase();
}
function mergeAuthUsersIntoPeople(auth,{saveState=false,replace=false}={}){
  const users=Object.values(auth?.users||{}).filter(u=>u&&u.id);
  if(!users.length) return false;
  const asPerson=(u,idx)=>({
    id:u.id,
    dbId:u.dbId||'',
    username:u.username||'',
    name:u.name||u.full_name||u.username||u.id,
    role:personRoleFromAuthRole(u.role),
    active:u.active!==false,
    phone:u.phone||'',
    email:u.email||'',
    region:u.region||'',
    skills:u.skills||'',
    onCallActive:u.onCallActive===true,
    onCallOrder:u.onCallActive===true ? (Number(u.onCallOrder||0)||idx+1) : 0,
    availabilityStatus:u.availabilityStatus||'available'
  });
  if(replace){
    const next=users.map(asPerson);
    const before=JSON.stringify((state.people||[]).map(p=>[p.id,p.name,p.role,p.active]));
    const after=JSON.stringify(next.map(p=>[p.id,p.name,p.role,p.active]));
    state.people=next;
    if(before!==after && saveState) window.VECO_STORAGE?.save?.(state);
    return before!==after;
  }
  let changed=false;
  state.people=state.people||[];
  users.forEach((u,idx)=>{
    let p=state.people.find(x=>x.id===u.id) || state.people.find(x=>authUsernameFromPerson(x)===String(u.username||'').toLowerCase());
    const next=asPerson(u,idx);
    if(p){
      if(p.id!==next.id){ p.id=next.id; changed=true; }
      ['name','role','active','phone','email','region','skills','onCallActive','onCallOrder','availabilityStatus'].forEach(k=>{ if(p[k]!==next[k]){ p[k]=next[k]; changed=true; }});
    }else{
      state.people.push(next);
      changed=true;
    }
  });
  if(changed && saveState) window.VECO_STORAGE?.save?.(state);
  return changed;
}
function softDeactivateAuthUser(userId){
  const auth=authLoad();
  if(auth.users?.[userId]){
    auth.users[userId].active=false;
    auth.users[userId].pinResetRequired=false;
    authSave(auth);
  }
  if(window.VECO_API?.deactivateAuthUser){
    window.VECO_API.deactivateAuthUser(userId).catch(err=>console.warn('VECO auth remote deactivate failed',err));
  }else{
    authPushRemote(auth);
  }
}
function deleteAuthUserLocal(userId){
  // CR-089C: hard delete is intentionally avoided because users can be linked to work orders/acts.
  // The visible "Kustuta" action now means archive/deactivate, so Supabase does not re-create the user on refresh.
  softDeactivateAuthUser(userId);
}
function normalizeAuthUsers(){
  const auth=authLoad(); auth.users=auth.users||{};
  (state.people||[]).forEach(p=>{
    if(!p.id) return;
    const existing=auth.users[p.id]||{};
    const role=authRoleFromPersonRole(existing.role||p.role);
    const pinHash=existing.pinHash||'';
    auth.users[p.id]={
      id:p.id,
      username:existing.username||authUsernameFromPerson(p),
      name:p.name||existing.name||p.id,
      role,
      active:p.active!==false,
      phone:p.phone||existing.phone||'',
      email:p.email||existing.email||'',
      region:p.region||existing.region||'',
      skills:p.skills||existing.skills||'',
      onCallActive:p.onCallActive===true,
      onCallOrder:p.onCallActive===true ? (Number(p.onCallOrder)||0) : 0,
      availabilityStatus:p.availabilityStatus||'available',
      pinHash,
      pinSetAt:existing.pinSetAt||'',
      pinResetRequired:existing.pinResetRequired===true || (!pinHash && existing.pinResetRequired!==false)
    };
  });
  auth.superadmin=auth.superadmin||{role:'superadmin',pinHash:'',pinSetAt:''};
  authSave(auth);
  return auth;
}
function authHash(pin,salt='VECO-V3'){return btoa(unescape(encodeURIComponent(`${salt}:${pin}`)));}
function authVerify(pin,hash){return !!hash && authHash(pin)===hash;}
function authSession(){try{return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY)||'null');}catch(_){return null;}}
function authSetSession(user){sessionStorage.setItem(AUTH_SESSION_KEY,JSON.stringify({id:user.id||'SUPERADMIN',name:user.name||'Superadmin',role:user.role,at:new Date().toISOString()}));}
function authClearSession(){sessionStorage.removeItem(AUTH_SESSION_KEY);}
function currentAuthUser(){const s=authSession(); if(!s) return null; if(s.role==='superadmin') return s; const auth=normalizeAuthUsers(); const u=auth.users?.[s.id]; if(!u||u.active===false) return null; return {...s,...u};}
function authRole(){return currentAuthUser()?.role||'';}
function canAccessPage(pg=page){const role=authRole(); if(role==='admin') return true; if(role==='supervisor') return SUPERVISOR_PAGES.has(pg); if(role==='technician') return TECH_PAGES.has(pg); if(role==='superadmin') return ['people','diagnostics'].includes(pg); return false;}
function authLockInfo(role){const locks=authLocksLoad(); const l=locks[role]||{}; const until=Number(l.until||0); return {locked:until>Date.now(),until,failures:Number(l.failures||0)};}
function authRegisterFailure(role){const locks=authLocksLoad(); const limit=role==='superadmin'?30*60*1000:5*60*1000; const l=locks[role]||{failures:0,until:0}; l.failures=(Number(l.failures)||0)+1; if(l.failures>=5){l.until=Date.now()+limit; l.failures=0;} locks[role]=l; authLocksSave(locks); return authLockInfo(role);}
function authClearFailure(role){const locks=authLocksLoad(); locks[role]={failures:0,until:0}; authLocksSave(locks);}
function validatePin(role,pin){const r=AUTH_RULES[role]||AUTH_RULES.technician; const v=String(pin||'').trim(); return /^\d+$/.test(v) && v.length>=r.min && v.length<=r.max;}
function lockText(info){const min=Math.ceil((info.until-Date.now())/60000); return `Liiga palju valesid katseid. Proovi uuesti ${Math.max(1,min)} minuti pärast.`;}

const FIELD_LAST_USER_KEY='veco_field_last_user_id';
const FIELD_PICKER_KEY='veco_field_show_user_picker';
const FIELD_ADMIN_PREVIEW_KEY='veco_field_admin_preview_grant';
const FIELD_ADMIN_PREVIEW_TTL=5*60*1000;
function grantFieldAdminPreview(){
  const u=currentAuthUser();
  if(!u||u.role!=='admin') return false;
  try{localStorage.setItem(FIELD_ADMIN_PREVIEW_KEY,JSON.stringify({id:u.id,name:u.name,role:u.role,at:Date.now()}));return true;}catch(_){return false;}
}
function consumeFieldAdminPreviewGrant(){
  if(page!=='technicianV1') return false;
  const params=new URLSearchParams(location.search||'');
  if(params.get('adminPreview')!=='1') return false;
  try{
    const raw=localStorage.getItem(FIELD_ADMIN_PREVIEW_KEY);
    const g=raw?JSON.parse(raw):null;
    if(!g||g.role!=='admin'||Date.now()-Number(g.at||0)>FIELD_ADMIN_PREVIEW_TTL) return false;
    authSetSession({id:g.id,name:g.name||'Admin',role:'admin'});
    return true;
  }catch(_){return false;}
}
function fieldLoginMode(){return page==='technicianV1';}
function userLoginKey(u){return String((u?.username||u?.name||u?.id||'')+'|'+(u?.role||'')).toLowerCase().trim();}
function dedupeAuthUsersForLogin(users){
  const peopleIds=new Set((state.people||[]).map(p=>p.id));
  const seen=new Map();
  (users||[]).forEach(u=>{
    if(!u||u.active===false) return;
    const key=userLoginKey(u);
    const score=(peopleIds.has(u.id)?1000:0)+(u.pinHash?100:0)+(u.pinResetRequired?20:0)+(u.updatedAt?1:0);
    const prev=seen.get(key);
    if(!prev||score>prev.score){
      const merged={...(prev?.u||{}),...u};
      if(prev?.u?.pinResetRequired||u.pinResetRequired) merged.pinResetRequired=true;
      if(prev?.u?.pinHash&&!merged.pinHash) merged.pinHash=prev.u.pinHash;
      seen.set(key,{u:merged,score});
    }
  });
  return Array.from(seen.values()).map(x=>x.u);
}
function fieldLoginUsers(users){
  if(!fieldLoginMode()) return users;
  const allowedIds=new Set((state.people||[]).filter(p=>p.active!==false && authRoleFromPersonRole(p.role)==='technician').map(p=>p.id));
  return users.filter(u=>(u.role||'technician')==='technician' && (!allowedIds.size || allowedIds.has(u.id)));
}
function authUsersForLogin(){
  const auth=normalizeAuthUsers();
  const users=fieldLoginUsers(dedupeAuthUsersForLogin(Object.values(auth.users||{})));
  return users.sort((a,b)=>{
    const ar=a.role||'technician', br=b.role||'technician';
    if(ar!==br) return ar==='admin'?-1:br==='admin'?1:ar.localeCompare(br,'et');
    return String(a.name||'').localeCompare(String(b.name||''),'et');
  });
}
function authRenderScreen(message=''){
  VECO_LOADING?.hide?.({force:true});
  const auth=normalizeAuthUsers();
  const allUsers=authUsersForLogin();
  const rememberedId=fieldLoginMode()?localStorage.getItem(FIELD_LAST_USER_KEY)||'':'';
  const showPicker=localStorage.getItem(FIELD_PICKER_KEY)==='1';
  const remembered=rememberedId && !showPicker ? allUsers.find(u=>u.id===rememberedId) : null;
  const users=remembered?[remembered]:allUsers;
  const options=users.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} · ${fieldLoginMode()?'Tehnik':authRoleLabel(u.role)}${u.pinResetRequired?' · uus PIN vajalik':(u.pinHash?'':' · PIN puudub')}</option>`).join('');
  const userControl=remembered
    ? `<input type="hidden" name="userId" value="${esc(remembered.id)}"><div class="auth-remembered-user"><span>Kasutaja</span><strong>${esc(remembered.name)}</strong><button class="btn small ghost" type="button" id="fieldChangeUserBtn">Vaheta kasutajat</button></div>`
    : `<label>Kasutaja<select class="select" name="userId" required>${options}</select></label>`;
  document.body.innerHTML=`<div class="auth-page"><form class="auth-card" id="authLoginForm"><div class="auth-brand">VECO</div><h1>${fieldLoginMode()?'VECO Field':'Sisselogimine'}</h1><p class="muted" id="authHelpText">${fieldLoginMode()?'Sisesta tehniku PIN.':'Vali kasutaja ja sisesta PIN.'}</p>${message?`<div class="auth-message">${esc(message)}</div>`:''}${userControl}<label id="authPinLabel">PIN<input class="field" name="pin" type="password" inputmode="numeric" autocomplete="current-password" placeholder="PIN" required></label><label id="authPinRepeatLabel" class="hidden">Korda uut PIN-i<input class="field" name="pin2" type="password" inputmode="numeric" autocomplete="new-password" placeholder="Korda PIN-i"></label><button class="btn primary" type="submit" id="authSubmitBtn">Logi sisse</button><div class="auth-build">VECO_V3_${APP_BUILD}</div></form></div>`;
  const form=document.getElementById('authLoginForm');
  document.getElementById('fieldChangeUserBtn')?.addEventListener('click',()=>{localStorage.setItem(FIELD_PICKER_KEY,'1');localStorage.removeItem(FIELD_LAST_USER_KEY);authRenderScreen();});
  const syncPinMode=()=>{const authNow=normalizeAuthUsers(); const u=authNow.users?.[form.elements.userId.value]; const reset=u?.pinResetRequired===true; const role=u?.role||'technician'; const fieldResetBlocked=fieldLoginMode()&&reset; const pin2=form.elements.pin2; const pin=form.elements.pin; document.getElementById('authPinRepeatLabel')?.classList.toggle('hidden',!reset||fieldResetBlocked); if(pin2) pin2.required=reset&&!fieldResetBlocked; const pinLabel=document.getElementById('authPinLabel'); if(pinLabel){ pinLabel.classList.toggle('hidden',fieldResetBlocked); pinLabel.childNodes[0].nodeValue=reset?'Uus PIN':'PIN'; } if(pin) pin.disabled=fieldResetBlocked; const help=document.getElementById('authHelpText'); if(help) help.textContent=fieldResetBlocked?'PIN-i uuendamine on admini kinnitust ootamas. Palu hooldusjuhil määrata ajutine PIN või luba seade admini vaates.':(reset?`Admin lubas PIN-i uuesti seadistada. Sisesta uus ${AUTH_RULES[role].label} kaks korda.`:(fieldLoginMode()?'Sisesta tehniku PIN.':'Vali kasutaja ja sisesta PIN.')); const btn=document.getElementById('authSubmitBtn'); if(btn){ btn.textContent=fieldResetBlocked?'PIN vajab admini kinnitust':(reset?'Salvesta PIN ja logi sisse':'Logi sisse'); btn.disabled=fieldResetBlocked; }};
  if(form.elements.userId?.tagName==='SELECT') form.elements.userId.addEventListener('change',syncPinMode); syncPinMode();
  form.addEventListener('submit',async e=>{e.preventDefault(); const uid=form.elements.userId.value; const pin=form.elements.pin.value; const pin2=form.elements.pin2?.value; const authNow=normalizeAuthUsers(); const u=authNow.users?.[uid]; if(!u) return authRenderScreen('Kasutajat ei leitud.'); const role=u.role||'technician'; const lock=authLockInfo(role); if(lock.locked) return authRenderScreen(lockText(lock)); if(u.pinResetRequired===true){ if(fieldLoginMode()) return authRenderScreen('PIN-i uuendamine ei ole avalikus Field loginis lubatud. Palu hooldusjuhil määrata ajutine PIN admini vaatest.'); if(pin!==pin2) return authRenderScreen('PIN-i kordus ei ühti.'); if(!validatePin(role,pin)) return authRenderScreen(`PIN peab olema ${AUTH_RULES[role].label}.`); u.pinHash=authHash(pin); u.pinSetAt=new Date().toISOString(); u.pinResetRequired=false; authNow.users[uid]=u; authSave(authNow); try{ await authSaveUserRemoteNow(u); }catch(err){ console.warn('VECO PIN remote save failed',err); return authRenderScreen('PIN-i salvestamine Supabase’i ebaõnnestus. Kontrolli ühendust ja RLS õiguseid.'); } authClearFailure(role); if(fieldLoginMode()){localStorage.setItem(FIELD_LAST_USER_KEY,u.id);localStorage.removeItem(FIELD_PICKER_KEY);} authSetSession(u); location.reload(); return; } if(!u.pinHash){ return authRenderScreen(`${u.name}: PIN puudub. Admin peab kasutajale lubama PIN-i uuesti seadistamise või määrama ajutise PIN-i.`); } if(!authVerify(pin,u.pinHash)){const l=authRegisterFailure(role); return authRenderScreen(l.locked?lockText(l):'Vale PIN.');} authClearFailure(role); if(fieldLoginMode()){localStorage.setItem(FIELD_LAST_USER_KEY,u.id);localStorage.removeItem(FIELD_PICKER_KEY);} authSetSession(u); location.reload(); });
}
function authRenderSuperadmin(message=''){
  VECO_LOADING?.hide?.({force:true});
  applyTheme?.();
  const auth=normalizeAuthUsers(); const setup=!auth.superadmin?.pinHash;
  document.body.innerHTML=`<div class="auth-page"><form class="auth-card" id="superForm"><div class="auth-brand">VECO</div><h1>Superadmin</h1><p class="muted">${setup?'Loo esmane superadmin PIN.':'Sisesta superadmin PIN süsteemi taastamiseks.'}</p>${message?`<div class="auth-message">${esc(message)}</div>`:''}<label>${setup?'Uus superadmin PIN':'Superadmin PIN'}<input class="field" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required></label>${setup?`<label>Korda PIN-i<input class="field" name="pin2" type="password" inputmode="numeric" autocomplete="new-password" required></label>`:''}<button class="btn primary" type="submit">${setup?'Loo PIN':'Sisene'}</button><button class="btn ghost" type="button" id="backLoginBtn">Tagasi</button></form></div>`;
  document.getElementById('backLoginBtn')?.addEventListener('click',()=>authRenderScreen());
  document.getElementById('superForm')?.addEventListener('submit',e=>{e.preventDefault(); const pin=e.currentTarget.elements.pin.value; const pin2=e.currentTarget.elements.pin2?.value; const lock=authLockInfo('superadmin'); if(lock.locked) return authRenderSuperadmin(lockText(lock)); const authNow=normalizeAuthUsers(); if(!authNow.superadmin.pinHash){ if(pin!==pin2) return authRenderSuperadmin('PIN-i kordus ei ühti.'); if(!validatePin('superadmin',pin)) return authRenderSuperadmin(`Superadmin PIN peab olema ${AUTH_RULES.superadmin.label}.`); authNow.superadmin.pinHash=authHash(pin); authNow.superadmin.pinSetAt=new Date().toISOString(); authPersist(authNow); authSetSession({id:'SUPERADMIN',name:'Superadmin',role:'superadmin'}); location.href='people.html'; return; } if(!authVerify(pin,authNow.superadmin.pinHash)){const l=authRegisterFailure('superadmin'); return authRenderSuperadmin(l.locked?lockText(l):'Vale superadmin PIN.');} authClearFailure('superadmin'); authSetSession({id:'SUPERADMIN',name:'Superadmin',role:'superadmin'}); location.href='people.html'; });
}
function requireAuthOrRender(){
  normalizeAuthUsers();
  if(!currentAuthUser()) consumeFieldAdminPreviewGrant();
  const user=currentAuthUser();
  if(!user){authRenderScreen(); return false;}
  // CR-091: URL based route guard. A technician must not reach admin/manager pages by editing the address bar.
  // Redirect instead of rendering protected content.
  if(user.role==='technician' && !TECH_PAGES.has(page)){
    location.replace('mobile.html');
    return false;
  }
  if(!canAccessPage(page)){
    shell(header('Ligipääs puudub','','','LIGIPÄÄS PUUDUB')+`<div class="detail-body"><p class="muted">Sinu rollil puudub selle vaate kasutamise õigus.</p><div class="actions"><button class="btn primary" id="goMobileBtn" type="button">Mine tehniku vaatesse</button><button class="btn" id="authLogoutBtn" type="button">Logi välja</button></div></div>`,'',{wide:true});
    document.getElementById('goMobileBtn')?.addEventListener('click',()=>{location.href='mobile.html';});
    document.getElementById('authLogoutBtn')?.addEventListener('click',()=>{localStorage.removeItem(ADMIN_VIEW_AS_KEY); authClearSession(); location.href='mobile.html';});
    return false;
  }
  return true;
}
function authStatusPill(){const u=currentAuthUser(); if(!u) return ''; return `<button class="auth-user-pill" id="authLogoutBtn" type="button" title="Logi välja">${esc(u.name)} · ${u.role==='admin'?'Admin':u.role==='superadmin'?'Superadmin':'Tehnik'} · Välju</button>`;}
const ADMIN_VIEW_AS_KEY='veco_admin_view_as_user_id';
function adminViewAsId(){
  if(authRole()!=='admin') return '';
  const id=localStorage.getItem(ADMIN_VIEW_AS_KEY)||'';
  const p=(state.people||[]).find(x=>x.id===id && x.active!==false);
  if(id && !p) localStorage.removeItem(ADMIN_VIEW_AS_KEY);
  return p?.id||'';
}
function scopedPersonId(){
  const u=currentAuthUser();
  if(!u) return '';
  if(u.role==='technician') return u.id;
  if(u.role==='admin') return adminViewAsId();
  return '';
}
function scopedPerson(){const id=scopedPersonId(); return id?byId(state.people,id):null;}
function currentEffectiveUser(){
  const u=currentAuthUser();
  const p=scopedPerson();
  if(u?.role==='admin' && p) return {...p,role:'technician',viewedBy:u};
  return u;
}
function activeTechnicians(){return (state.people||[]).filter(p=>p.active!==false && p.id!=='U-DEMO' && String(p.role||'').toLowerCase()!=='demo');}
function dedupePeopleById(list){const m=new Map();(list||[]).forEach(p=>{if(p&&p.id&&!m.has(p.id))m.set(p.id,p);});return Array.from(m.values());}
function fieldTechnicianPeople(){return dedupePeopleById((state.people||[]).filter(p=>p.active!==false && authRoleFromPersonRole(p.role)==='technician')).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'et'));}
function visiblePeopleForCurrentScope(){const id=scopedPersonId(); return id ? activeTechnicians().filter(p=>p.id===id) : activeTechnicians();}
function personAuthRole(p){return authRoleFromPersonRole(p?.role||'technician');}
const EMPLOYEE_FILTER_ROLES=[
  ['role:admin','Adminid','admin'],
  ['role:supervisor','Hooldusjuhid','supervisor'],
  ['role:technician','Tehnikud','technician'],
  ['role:assistant','Assistendid','assistant'],
  ['role:contractor','Alltöövõtjad','contractor']
];
function employeeFilterStorageKey(scope){return `veco_${scope||'calendar'}_employee_filter_v2`;}
function currentPersonIdForDefaults(){
  const u=currentAuthUser();
  if(!u) return '';
  return activeTechnicians().some(p=>p.id===u.id)?u.id:'';
}
function employeeFilterDefaultTokens(){
  const people=visiblePeopleForCurrentScope();
  const tokens=[];
  const mine=currentPersonIdForDefaults();
  if(mine) tokens.push(mine);
  if(people.some(p=>personAuthRole(p)==='technician')) tokens.push('role:technician');
  if(!tokens.length) tokens.push('all');
  return tokens;
}
function parseEmployeeFilterTokens(raw){
  if(Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if(raw==null||raw==='') return [];
  const str=String(raw);
  if(str.startsWith('[')){try{return (JSON.parse(str)||[]).map(String).filter(Boolean);}catch(_){}}
  if(str==='all') return ['all'];
  return str.split(',').map(x=>x.trim()).filter(Boolean);
}
function employeeFilterSelected(scope='calendar'){
  const stored=localStorage.getItem(employeeFilterStorageKey(scope));
  const tokens=parseEmployeeFilterTokens(stored);
  return tokens.length?tokens:employeeFilterDefaultTokens();
}
function employeeFilterSet(scope,tokens){
  const next=parseEmployeeFilterTokens(tokens);
  localStorage.setItem(employeeFilterStorageKey(scope),JSON.stringify(next.length?next:employeeFilterDefaultTokens()));
}
function employeeFilterOptionPersonIds(tokens){
  const selected=parseEmployeeFilterTokens(tokens);
  const people=visiblePeopleForCurrentScope();
  if(!selected.length||selected.includes('all')) return people.map(p=>p.id);
  const ids=new Set();
  selected.forEach(v=>{
    if(v.startsWith('role:')){
      const role=v.slice(5);
      people.filter(p=>personAuthRole(p)===role).forEach(p=>ids.add(p.id));
    }else if(people.some(p=>p.id===v)) ids.add(v);
  });
  return Array.from(ids);
}
function employeeFilterMatchesWorkorder(w,filterValue){
  const ids=employeeFilterOptionPersonIds(filterValue);
  if(!ids.length) return false;
  return ids.some(id=>workorderMatchesPerson(w,id));
}
function employeeFilterLabel(tokens){
  const selected=parseEmployeeFilterTokens(tokens);
  if(!selected.length||selected.includes('all')) return 'Kõik töötajad';
  const parts=[];
  const mine=currentPersonIdForDefaults();
  if(mine && selected.includes(mine)) parts.push('Mina');
  EMPLOYEE_FILTER_ROLES.forEach(([value,label])=>{ if(selected.includes(value)) parts.push(label); });
  const otherPeople=selected.filter(v=>!v.startsWith('role:')&&v!==mine).map(id=>byId(state.people,id)?.name).filter(Boolean);
  parts.push(...otherPeople.slice(0,2));
  if(otherPeople.length>2) parts.push(`+${otherPeople.length-2}`);
  return parts.join(' + ')||'Töötajad';
}
function employeeMultiFilterHtml(scope='calendar',tokens=null,{disabled=false,label='Minu tööd'}={}){
  const selected=parseEmployeeFilterTokens(tokens||employeeFilterSelected(scope));
  const people=visiblePeopleForCurrentScope();
  if(disabled){return `<button class="btn ghost" type="button" disabled>${esc(label)}</button>`;}
  const hasRole=role=>people.some(p=>personAuthRole(p)===role);
  const isChecked=value=>selected.includes('all')?value==='all':selected.includes(value);
  const roleOptions=EMPLOYEE_FILTER_ROLES.filter(([,lbl,role])=>hasRole(role) || role==='assistant' || role==='contractor').map(([value,label,role])=>`<label class="team-people-option"><input type="checkbox" value="${esc(value)}" ${isChecked(value)?'checked':''}> <span>${esc(label)}</span><small>${hasRole(role)?'rolligrupp':'tulevikus'}</small></label>`).join('');
  const personOptions=people.map(p=>`<label class="team-people-option"><input type="checkbox" value="${esc(p.id)}" ${isChecked(p.id)?'checked':''}> <span>${esc(p.name)}</span><small>${esc(authRoleLabel(personAuthRole(p)))}</small></label>`).join('');
  return `<div class="team-people-filter employee-multi-filter" data-employee-filter="${esc(scope)}"><button class="btn ghost" type="button" data-employee-filter-toggle="${esc(scope)}">☑ ${esc(employeeFilterLabel(selected))}</button><div class="team-people-menu hidden" data-employee-filter-menu="${esc(scope)}"><div class="team-people-menu-head"><strong>Töötajad vaates</strong><button class="btn small ghost" type="button" data-employee-filter-default="${esc(scope)}">Vaikimisi</button></div><label class="team-people-option"><input type="checkbox" value="all" ${isChecked('all')?'checked':''}> <span>Kõik töötajad</span><small>kõik rollid</small></label><div class="section-title small">Rollid</div>${roleOptions}<div class="section-title small">Isikud</div>${personOptions}<div class="team-people-menu-actions"><button class="btn small ghost" type="button" data-employee-filter-all="${esc(scope)}">Kõik</button><button class="btn small ghost" type="button" data-employee-filter-clear="${esc(scope)}">Tühjenda</button></div></div></div>`;
}
function employeeFilterApplyVisualState(wrap,scope){
  if(!wrap) return;
  const selected=employeeFilterSelected(scope);
  const selectedSet=new Set(selected);
  const allSelected=selectedSet.has('all');
  wrap.querySelectorAll('[data-employee-filter-menu] input[type="checkbox"]').forEach(input=>{
    input.checked=allSelected ? input.value==='all' : selectedSet.has(input.value);
  });
  const btn=wrap.querySelector('[data-employee-filter-toggle]');
  if(btn) btn.textContent='☑ '+employeeFilterLabel(selected);
}
function bindEmployeeMultiFilter(scope,renderFn){
  const wrap=document.querySelector(`[data-employee-filter="${scope}"]`);
  if(!wrap) return;
  window.__VECO_EMPLOYEE_FILTER_RENDERERS__[scope]=renderFn;
  const read=()=>Array.from(wrap.querySelectorAll('[data-employee-filter-menu] input[type="checkbox"]:checked')).map(i=>i.value);
  wrap.querySelectorAll('[data-employee-filter-menu] input[type="checkbox"]').forEach(input=>input.addEventListener('click',e=>e.stopPropagation()));
  wrap.querySelectorAll('[data-employee-filter-menu] input[type="checkbox"]').forEach(input=>input.addEventListener('change',e=>{
    e.stopPropagation();
    let selected=read();
    if(input.value==='all' && input.checked) selected=['all'];
    if(input.value!=='all') selected=selected.filter(v=>v!=='all');
    employeeFilterSet(scope,selected);
    employeeFilterApplyVisualState(wrap,scope);
  }));
  wrap.querySelector('[data-employee-filter-default]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();employeeFilterSet(scope,employeeFilterDefaultTokens());employeeFilterApplyVisualState(wrap,scope);});
  wrap.querySelector('[data-employee-filter-all]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();employeeFilterSet(scope,['all']);employeeFilterApplyVisualState(wrap,scope);});
  wrap.querySelector('[data-employee-filter-clear]')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();employeeFilterSet(scope,[]);employeeFilterApplyVisualState(wrap,scope);});
}
function workorderVisibleToCurrentScope(w){const id=scopedPersonId(); return !id || workorderMatchesPerson(w,id);}
function actVisibleToCurrentScope(a){const id=scopedPersonId(); if(!id) return true; const w=byId(state.workorders,a.workorderId); return w ? workorderMatchesPerson(w,id) : false;}
function scopedWorkorders(){return (state.workorders||[]).filter(workorderVisibleToCurrentScope);}
function scopedActs(list=null){return (list||state.acts||[]).filter(actVisibleToCurrentScope);}


// CR-099.1: töö pildigalerii. Pildid salvestatakse Supabase Storage bucketisse
// workorder-photos ning metaandmed tabelisse photos. Kui Supabase insert ebaõnnestub,
// jääb pilt lokaalsesse vahemällu ja kasutaja saab tööd jätkata.
const PHOTO_BUCKET='workorder-photos';
const PHOTO_TYPE_OPTIONS=[['general','Üldine'],['before','Enne tööd'],['during','Töö käigus'],['after','Pärast tööd'],['defect','Puudus'],['device','Seade'],['document','Dokument']];
const photoCacheLoading=new Set();
function vecoCleanSupabaseUrl(value){return String(value||'').trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');}
function vecoSupabaseClient(){
  if(window.__VECO_SUPABASE_CLIENT__) return window.__VECO_SUPABASE_CLIENT__;
  const url=vecoCleanSupabaseUrl(window.VECO_SUPABASE_URL||localStorage.getItem('veco_supabase_url'));
  const key=String(window.VECO_SUPABASE_KEY||localStorage.getItem('veco_supabase_key')||'').trim();
  if(!url||!key||!window.supabase) return null;
  window.__VECO_SUPABASE_URL__=url;
  window.__VECO_SUPABASE_KEY__=key;
  window.__VECO_SUPABASE_CLIENT__=window.supabase.createClient(url,key);
  return window.__VECO_SUPABASE_CLIENT__;
}
function isUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));}
function stableUuidFromText(value){
  const str=String(value||'photo');
  let h1=0x811c9dc5,h2=0x811c9dc5^0x9e3779b9,h3=0x811c9dc5^0x85ebca6b,h4=0x811c9dc5^0xc2b2ae35;
  for(let i=0;i<str.length;i++){const c=str.charCodeAt(i); h1=Math.imul(h1^c,16777619); h2=Math.imul(h2^c,2246822507); h3=Math.imul(h3^c,3266489909); h4=Math.imul(h4^c,668265263);}
  const hex=n=>(n>>>0).toString(16).padStart(8,'0');
  const raw=(hex(h1)+hex(h2)+hex(h3)+hex(h4)).slice(0,32).split('');
  raw[12]='4';
  raw[16]=(['8','9','a','b'][(parseInt(raw[16]||'0',16)%4)]);
  const x=raw.join('');
  return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`;
}
function photoDbId(value,prefix=''){return isUuid(value)?String(value):stableUuidFromText(`${prefix}:${value}`);}
function photoNullableUuid(value,prefix=''){return value ? photoDbId(value,prefix) : null;}
function photoWorkorderDbId(workorderId){return photoDbId(workorderId,'workorder');}
function photoUserDbId(){
  const u=currentMobileActionUser?.() || currentEffectiveUser?.() || currentAuthUser?.() || null;
  return isUuid(u?.dbId)?u.dbId:(isUuid(u?.id)?u.id:null);
}
function photoUserName(){
  const u=currentMobileActionUser?.() || currentEffectiveUser?.() || currentAuthUser?.() || null;
  return u?.name||u?.full_name||u?.username||'';
}
function photoFromDb(row){
  return {
    id:row.id,
    clientId:row.client_id||'',
    objectId:row.object_id||'',
    deviceId:row.device_id||'',
    workorderId:row.workorder_id||'',
    actId:row.act_id||'',
    fileUrl:row.file_url||'',
    filePath:row.file_path||'',
    category:row.category||'',
    comment:row.comment||'',
    includeInAct:row.include_in_act===true,
    uploadedBy:row.uploaded_by||'',
    uploadedByName:row.uploaded_by_name||'',
    createdAt:row.created_at||'',
    takenAt:row.taken_at||'',
    isCover:row.is_cover===true,
    sortOrder:Number(row.sort_order||0)||0,
    photoType:row.photo_type||row.category||'general',
    deletedAt:row.deleted_at||'',
    previewUrl:row.preview_url||''
  };
}
function photoToDb(photo){
  return {
    id:photo.id,
    client_id:photo.clientId||null,
    object_id:photo.objectId||null,
    device_id:photo.deviceId||null,
    workorder_id:photo.workorderId||null,
    act_id:photo.actId||null,
    file_url:photo.fileUrl||photo.filePath,
    file_path:photo.filePath,
    category:photo.category||photo.photoType||'general',
    comment:photo.comment||null,
    include_in_act:photo.includeInAct===true,
    uploaded_by:photo.uploadedBy||null,
    taken_at:photo.takenAt||null,
    is_cover:photo.isCover===true,
    sort_order:Number(photo.sortOrder||0)||0,
    photo_type:photo.photoType||'general',
    deleted_at:photo.deletedAt||null
  };
}
function mergePhotoCache(list){
  state.photos=state.photos||[];
  const byKey=new Map(state.photos.map(p=>[p.id,p]));
  (list||[]).forEach(p=>byKey.set(p.id,{...(byKey.get(p.id)||{}),...p}));
  state.photos=Array.from(byKey.values());
  try{window.VECO_STORAGE.save(state);}catch(_){/* ignore cache save */}
}
function workorderPhotos(workorderId){
  if(!isStoredWorkorderId(workorderId)) return [];
  const key=photoWorkorderDbId(workorderId);
  // P0 data-integrity: photos belong only to the exact workorder UUID/key.
  // Do not fall back to workorderNo, because old WO-number collisions can attach foreign photos.
  return (state.photos||[]).filter(p=>!p.deletedAt && p.workorderId===key).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')) || Number(a.sortOrder||0)-Number(b.sortOrder||0));
}
function photoPreviewSrc(p){return p.previewUrl||p.signedUrl||p.publicUrl||p.fileUrl||'';}
function isLikelyHttpUrl(value){return /^https?:\/\//i.test(String(value||'')) || /^blob:/i.test(String(value||'')) || /^data:image\//i.test(String(value||''));}
function photoStoragePath(p){
  const fp=String(p?.filePath||'').trim();
  if(fp && !isLikelyHttpUrl(fp)) return fp;
  const fu=String(p?.fileUrl||'').trim();
  if(fu && !isLikelyHttpUrl(fu)) return fu;
  return '';
}
async function ensurePhotoPreviewUrl(p){
  if(!p) return '';
  const existing=photoPreviewSrc(p);
  if(existing && isLikelyHttpUrl(existing)) return existing;
  const path=photoStoragePath(p);
  if(path){
    const signed=await signedPhotoUrl(path);
    if(signed){ p.previewUrl=signed; p.signedUrl=signed; mergePhotoCache([p]); return signed; }
  }
  return existing || '';
}
async function signedPhotoUrl(path){
  const client=vecoSupabaseClient();
  if(!client||!path) return '';
  const {data,error}=await client.storage.from(PHOTO_BUCKET).createSignedUrl(path,60*60);
  if(error) return '';
  return data?.signedUrl||'';
}
async function loadWorkorderPhotos(workorderId,force=false){
  if(!isStoredWorkorderId(workorderId)) return [];
  const key=photoWorkorderDbId(workorderId);
  if(!force && workorderPhotos(workorderId).some(p=>p.previewUrl)) return workorderPhotos(workorderId);
  if(photoCacheLoading.has(key)) return workorderPhotos(workorderId);
  const client=vecoSupabaseClient();
  if(!client) return workorderPhotos(workorderId);
  photoCacheLoading.add(key);
  try{
    const {data,error}=await client.from('photos').select('*').eq('workorder_id',key).is('deleted_at',null).order('created_at',{ascending:false});
    if(error) throw error;
    const rows=(data||[]).map(photoFromDb);
    for(const p of rows){p.previewUrl=await signedPhotoUrl(p.filePath);}
    mergePhotoCache(rows);
  }catch(err){console.warn('VECO photos load failed',err);}finally{photoCacheLoading.delete(key);}
  return workorderPhotos(workorderId);
}
function workorderPhotoGalleryHtml(workorderId,opts={}){
  if(!isStoredWorkorderId(workorderId)) return `<div class="muted photo-empty">Pilte saab lisada pärast töö salvestamist.</div>`;
  const photos=workorderPhotos(workorderId);
  const empty=photoCacheLoading.has(photoWorkorderDbId(workorderId))?'Pilte laetakse...':'Pilte pole lisatud.';
  const cards=photos.map(p=>{
    const typeLabel=PHOTO_TYPE_OPTIONS.find(x=>x[0]===p.photoType)?.[1]||'Foto';
    const includeChecked=p.includeInAct?'checked':'';
    return `<div class="photo-card" data-photo-id="${esc(p.id)}"><button class="photo-thumb" data-photo-preview="${esc(p.id)}" type="button">${photoPreviewSrc(p)?`<img src="${esc(photoPreviewSrc(p))}" alt="${esc(p.comment||'Töö foto')}">`:'<span>📷</span>'}</button><div class="photo-meta"><strong>${esc(p.comment||typeLabel)}</strong><span class="muted">${esc(fmtDateTimeShort(p.createdAt)||'')}${p.uploadedByName?` · ${esc(p.uploadedByName)}`:''}</span><label class="photo-act-toggle" title="Märgi, et see pilt võetakse hiljem akti kaasa"><input type="checkbox" data-photo-include-act="${esc(p.id)}" ${includeChecked}> <span>${p.includeInAct?'Lisatakse aktile':'Lisa hiljem aktile'}</span></label></div><div class="photo-actions"><button class="btn small" data-photo-comment="${esc(p.id)}" type="button">✎</button><button class="btn small danger" data-photo-delete="${esc(p.id)}" type="button">Kustuta</button></div></div>`;
  }).join('');
  return `<div class="section-title photo-section-title"><span>📷 Pildid</span><button class="btn small primary" data-add-workorder-photo="${esc(workorderId)}" type="button">＋ Lisa pilt</button></div><div class="photo-gallery" data-photo-gallery="${esc(workorderId)}">${cards||`<div class="muted photo-empty">${empty}</div>`}</div><input class="hidden" type="file" accept="image/*" multiple data-workorder-photo-input="${esc(workorderId)}">${opts.hint?`<div class="muted">${esc(opts.hint)}</div>`:''}`;
}
function bindWorkorderPhotos(renderFn){
  $$('[data-add-workorder-photo]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.addWorkorderPhoto;
    document.querySelector(`[data-workorder-photo-input="${CSS.escape(id)}"]`)?.click();
  }));
  $$('[data-workorder-photo-input]').forEach(input=>input.addEventListener('change',async()=>{
    const id=input.dataset.workorderPhotoInput;
    const files=Array.from(input.files||[]);
    input.value='';
    if(files.length) await uploadWorkorderPhotos(id,files,renderFn);
  }));
  $$('[data-photo-preview]').forEach(btn=>btn.addEventListener('click',()=>openPhotoLightbox(btn.dataset.photoPreview,renderFn)));
  $$('[data-photo-comment]').forEach(btn=>btn.addEventListener('click',()=>openPhotoComment(btn.dataset.photoComment,renderFn)));
  $$('[data-photo-delete]').forEach(btn=>btn.addEventListener('click',()=>deletePhoto(btn.dataset.photoDelete,renderFn)));
  $$('[data-photo-include-act]').forEach(input=>input.addEventListener('change',()=>togglePhotoIncludeInAct(input.dataset.photoIncludeAct,!!input.checked,renderFn)));
}
async function togglePhotoIncludeInAct(photoId,value,renderFn){
  const p=(state.photos||[]).find(x=>x.id===photoId);
  if(!p) return;
  p.includeInAct=value===true;
  const client=vecoSupabaseClient();
  if(client){
    const {error}=await client.from('photos').update({include_in_act:p.includeInAct}).eq('id',p.id);
    if(error){console.warn('VECO photo include_in_act update failed',error); alert(`Pildi akti märkimine ebaõnnestus: ${error.message||error}`);}
  }
  mergePhotoCache([p]);
  if(typeof renderFn==='function') renderFn();
}
async function openPhotoMetaModal(files){
  return new Promise(resolve=>{
    const count=files.length;
    const types=PHOTO_TYPE_OPTIONS.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
    openModal(`<form id="photoMetaForm"><div class="dialog-head"><h2>Lisa pilt${count>1?'e':''}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="card"><strong>${count} faili valitud</strong><span class="muted">Kommentaar rakendub kõigile valitud piltidele.</span></div><div class="form-grid"><label class="full">Kommentaar<textarea name="comment" placeholder="nt Lekke koht, enne tööd, pärast tööd..."></textarea></label><label>Tüüp<select class="select" name="photoType">${types}</select></label><label class="check-card"><input type="checkbox" name="includeInAct"> <span>Lisa hiljem aktile</span></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Laadi üles</button></div></form>`);
    bindClose(()=>resolve(null));
    $('#photoMetaForm')?.addEventListener('submit',e=>{e.preventDefault(); const f=e.currentTarget.elements; const result={comment:String(f.comment.value||'').trim(),photoType:f.photoType.value||'general',includeInAct:!!f.includeInAct.checked}; closeModal(); resolve(result);});
  });
}
async function uploadWorkorderPhotos(workorderId,files,renderFn){
  if(!isStoredWorkorderId(workorderId)) return;
  const w=byId(state.workorders,workorderId);
  if(!w||!files?.length) return;
  const meta=await openPhotoMetaModal(files);
  if(!meta) return;
  const client=vecoSupabaseClient();
  const object=byId(state.objects,w.objectId)||{};
  const clientId=object.clientId||'';
  const uploaded=[];
  for(const file of files){
    if(!String(file.type||'').startsWith('image/')) continue;
    const ext=(file.name?.split('.').pop()||file.type.split('/').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const id=(crypto?.randomUUID?.()||photoDbId(`${workorderId}:${file.name}:${Date.now()}:${Math.random()}`));
    const path=`clients/${clientId||'unknown'}/objects/${w.objectId||'unknown'}/workorders/${workorderId}/${id}.${ext}`;
    let ok=false;
    if(client){
      const up=await client.storage.from(PHOTO_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
      if(up.error){console.warn('VECO photo upload failed',up.error); alert(`Pildi üleslaadimine ebaõnnestus: ${up.error.message||up.error}`); continue;}
      ok=true;
    }
    const photo={id,clientId:photoNullableUuid(clientId,'client'),objectId:photoNullableUuid(w.objectId,'object'),deviceId:null,workorderId:photoWorkorderDbId(workorderId),workorderNo:workorderId,actId:null,fileUrl:path,filePath:path,category:meta.photoType,comment:meta.comment,includeInAct:meta.includeInAct,uploadedBy:photoUserDbId(),uploadedByName:photoUserName(),createdAt:new Date().toISOString(),takenAt:null,isCover:false,sortOrder:0,photoType:meta.photoType,deletedAt:'',previewUrl:URL.createObjectURL(file)};
    if(client && ok){
      const ins=await client.from('photos').insert(photoToDb(photo)).select('*').maybeSingle();
      if(ins.error){console.warn('VECO photo metadata insert failed',ins.error); alert(`Pildi metaandmete salvestus ebaõnnestus: ${ins.error.message||ins.error}`);}
      else if(ins.data){Object.assign(photo,photoFromDb(ins.data)); photo.previewUrl=await signedPhotoUrl(photo.filePath)||URL.createObjectURL(file);}
    }
    uploaded.push(photo);
  }
  if(uploaded.length){mergePhotoCache(uploaded); if(typeof renderFn==='function') renderFn();}
}
function removePhotoLightbox(){
  document.getElementById('photoLightbox')?.remove();
  document.documentElement.classList.remove('photo-lightbox-open');
  document.body.classList.remove('photo-lightbox-open');
}
async function openPhotoLightbox(photoId,renderFn){
  const p=(state.photos||[]).find(x=>x.id===photoId); if(!p) return;
  const src=await ensurePhotoPreviewUrl(p);
  const el=document.createElement('div');
  el.id='photoLightbox';
  el.className='photo-lightbox open';
  el.innerHTML=`<div class="photo-lightbox-dialog" role="dialog" aria-modal="true"><div class="photo-lightbox-head"><h2>${esc(p.comment||'Foto')}</h2><button type="button" class="btn ghost" data-photo-lightbox-close>× Sulge</button></div><div class="photo-lightbox-body">${src?`<img src="${esc(src)}" alt="${esc(p.comment||'Foto')}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'muted',textContent:'Pilti ei õnnestunud laadida. Kontrolli Storage read policy / signed URL.'}))">`:'<div class="muted">Eelvaadet ei ole.</div>'}</div><div class="photo-lightbox-meta"><span class="muted">${esc(fmtDateTimeShort(p.createdAt)||'')} ${p.includeInAct?'· lisatakse aktile':''}</span><div class="photo-lightbox-actions"><button type="button" class="btn" data-photo-lightbox-include>${p.includeInAct?'Ära lisa aktile':'Lisa hiljem aktile'}</button><button type="button" class="btn" data-photo-lightbox-edit>Muuda kommentaari</button><button type="button" class="btn danger" data-photo-lightbox-delete>Kustuta</button></div></div></div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('photo-lightbox-open');
  document.body.classList.add('photo-lightbox-open');
  const close=()=>removePhotoLightbox();
  el.addEventListener('click',e=>{ if(e.target===el) close(); });
  el.querySelector('[data-photo-lightbox-close]')?.addEventListener('click',close);
  el.querySelector('[data-photo-lightbox-include]')?.addEventListener('click',async()=>{ await togglePhotoIncludeInAct(photoId,!p.includeInAct,renderFn); close(); });
  el.querySelector('[data-photo-lightbox-edit]')?.addEventListener('click',()=>{ close(); openPhotoComment(photoId,renderFn); });
  el.querySelector('[data-photo-lightbox-delete]')?.addEventListener('click',async()=>{ close(); await deletePhoto(photoId,renderFn); });
}
function openPhotoPreview(photoId,renderFn){ openPhotoLightbox(photoId,renderFn); }
async function openPhotoComment(photoId,renderFn){
  const p=(state.photos||[]).find(x=>x.id===photoId); if(!p) return;
  const types=PHOTO_TYPE_OPTIONS.map(([v,l])=>`<option value="${esc(v)}" ${p.photoType===v?'selected':''}>${esc(l)}</option>`).join('');
  openModal(`<form id="photoCommentForm"><div class="dialog-head"><h2>Muuda pilti</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Kommentaar<textarea name="comment">${esc(p.comment||'')}</textarea></label><label>Tüüp<select class="select" name="photoType">${types}</select></label><label class="check-card"><input type="checkbox" name="includeInAct" ${p.includeInAct?'checked':''}> <span>Lisa hiljem aktile</span></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#photoCommentForm')?.addEventListener('submit',async e=>{e.preventDefault(); const f=e.currentTarget.elements; p.comment=String(f.comment.value||'').trim(); p.photoType=f.photoType.value||'general'; p.category=p.photoType; p.includeInAct=!!f.includeInAct.checked; const client=vecoSupabaseClient(); if(client){const {error}=await client.from('photos').update({comment:p.comment,photo_type:p.photoType,category:p.photoType,include_in_act:p.includeInAct}).eq('id',p.id); if(error) console.warn('VECO photo update failed',error);} mergePhotoCache([p]); closeModal(); if(typeof renderFn==='function') renderFn();});
}
async function deletePhoto(photoId,renderFn){
  const p=(state.photos||[]).find(x=>x.id===photoId); if(!p) return;
  const ok=await openVecoConfirm({title:'Kustuta pilt',message:'Kas soovid pildi töö vaates peita?',details:'Faili ei kustutata Storage’ist. Täidetakse deleted_at.',confirmText:'Kustuta',cancelText:'Loobu'});
  if(!ok) return;
  p.deletedAt=new Date().toISOString();
  const client=vecoSupabaseClient();
  if(client){const {error}=await client.from('photos').update({deleted_at:p.deletedAt}).eq('id',p.id); if(error) console.warn('VECO photo soft delete failed',error);}
  mergePhotoCache([p]);
  if(typeof renderFn==='function') renderFn();
}
function refreshWorkorderPhotosThen(workorderId,renderFn){
  loadWorkorderPhotos(workorderId,true).then(()=>{if(typeof renderFn==='function') renderFn();}).catch(err=>console.warn('VECO photo refresh failed',err));
}
function adminViewAsControl(){
  if(authRole()!=='admin') return '';
  const current=adminViewAsId();
  const opts=['<option value="">Admin: kõik tehnikud</option>'].concat(activeTechnicians().map(p=>`<option value="${esc(p.id)}" ${current===p.id?'selected':''}>Vaata kasutajana: ${esc(p.name)}</option>`)).join('');
  return `<select class="select admin-view-as" id="adminViewAsSelect" title="Admini kontrollivaade">${opts}</select>`;
}
function scopeNotice(){const p=scopedPerson(); return p?`<div class="scope-notice">Kuvatakse kasutaja <strong>${esc(p.name)}</strong> vaadet. Teiste tehnikute tööd ja kalendrid on peidetud.</div>`:'';}

function requestUserPinReset(userId){const auth=normalizeAuthUsers(); if(auth.users?.[userId]){auth.users[userId].pinHash=''; auth.users[userId].pinSetAt=''; auth.users[userId].pinResetRequired=true; authPersist(auth); authSaveUserRemoteNow(auth.users[userId]).catch(err=>console.warn('VECO auth remote PIN reset failed',err));}}
function setUserTempPin(userId,pin){const auth=normalizeAuthUsers(); const u=auth.users?.[userId]; if(!u) return false; const role=u.role||'technician'; if(!validatePin(role,pin)) return false; u.pinHash=authHash(pin); u.pinSetAt=new Date().toISOString(); u.pinResetRequired=false; auth.users[userId]=u; authPersist(auth); authSaveUserRemoteNow(u).catch(err=>console.warn('VECO auth remote temp PIN failed',err)); return true;}
function resetAdminPins(){const auth=normalizeAuthUsers(); Object.values(auth.users||{}).filter(u=>u.role==='admin').forEach(u=>{u.pinHash='';u.pinSetAt='';u.pinResetRequired=true;}); authPersist(auth);}

(state.acts||[]).forEach(a=>{ if(a.archived===undefined) a.archived=false;});
normalizeOncallPeople();

function normalizeWorkorderContentFields(){
  (state.workorders||[]).forEach(w=>{
    if(w.problemDescription===undefined) w.problemDescription=w.description||'';
    if(w.performedWork===undefined && (w.workPerformed||w.workText)) w.performedWork=w.workPerformed||w.workText||'';
    if(w.workResult===undefined) w.workResult=w.resultNotes||w.result||'';
    if(w.recommendations===undefined) w.recommendations=w.defects||w.suggestions||'';
    if(w.materials===undefined) w.materials='';
  });
}
normalizeWorkorderContentFields();

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
function techInitials(name){
  const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
}
function workorderCalendarPeopleHtml(w){
  const respName=techName(workorderResponsibleId(w))||'-';
  const participants=workorderParticipantIds(w).map(techName).filter(n=>n&&n!=='-');
  const allNames=[respName,...participants].filter(n=>n&&n!=='-');
  const participantText=participants.length===1?participants[0]:(participants.length>1?`${participants[0]} +${participants.length-1}`:'');
  const badges=allNames.slice(0,4).map((name,i)=>`<span class="calendar-tech-badge ${i===0?'responsible':''}" title="${i===0?'Vastutaja':'Osaleja'}: ${esc(name)}">${esc(techInitials(name))}</span>`).join('');
  const more=allNames.length>4?`<span class="calendar-tech-more" title="Tehnikud: ${esc(allNames.join(', '))}">+${allNames.length-4}</span>`:'';
  return `<span class="calendar-people"><span class="calendar-person-resp" title="Vastutaja: ${esc(respName)}">${esc(respName)}</span>${participantText?`<span class="calendar-person-participants" title="Osalejad: ${esc(participants.join(', '))}">+ ${esc(participantText)}</span>`:''}<span class="calendar-tech-badges" aria-label="Tehnikud">${badges}${more}</span></span>`;
}
function workorderCalendarTitle(w){
  const respName=techName(workorderResponsibleId(w))||'-';
  const participants=workorderParticipantIds(w).map(techName).filter(n=>n&&n!=='-');
  const lines=[`Töö: ${w.title||'-'}`,`Objekt: ${workorderObjectLabel(w)}`,`Vastutaja: ${respName}`];
  if(participants.length) lines.push(`Osalejad: ${participants.join(', ')}`);
  lines.push(`Kestus: ${workorderHours(w)} h`, `Aeg: ${fmtShortDate(w.date)} ${w.time||''} – ${workorderDaySpan(w)>1?fmtShortDate(workorderEndDate(w))+' ':''}${workorderEndTime(w,22)}`);
  return lines.join('\n');
}
function workorderPeopleNames(w){
  return workorderPeopleIds(w).map(techName).filter(n=>n&&n!=='-');
}
function workorderPeopleLabel(w){
  const names=workorderPeopleNames(w);
  return names.join(', ')||'-';
}
function workorderPeopleMultiline(w){
  const names=workorderPeopleNames(w);
  return names.join('\n')||'-';
}
function workorderPeopleHeading(w,singular='TEHNIK',plural='TEHNIKUD'){
  return workorderPeopleNames(w).length>1?plural:singular;
}
function workorderRoleLabel(w,personId){
  if(workorderResponsibleId(w)===personId) return workorderParticipantIds(w).length?`👑 Vastutaja · ${workorderParticipantIds(w).length} osalejat`:'👑 Vastutaja';
  if(workorderParticipantIds(w).includes(personId)) return `Osaleja · Vastutaja: ${techName(workorderResponsibleId(w))}`;
  return '';
}

function normalizeOncallPeople(){
  // Supabase-first: on-call membership is stored on auth_users.on_call_active.
  // Existing shift rows must not automatically enroll people into the rotation.
  (state.people||[]).forEach(p=>{
    if(typeof p.onCallActive==='undefined') p.onCallActive=false;
    if(p.onCallActive!==true) p.onCallOrder=0;
  });
  if(typeof normalizeOncallPeopleOrder==='function') normalizeOncallPeopleOrder();
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
const detailOpen={objects:false,clients:false,projects:false,workorders:false,acts:false};
let modalEscHandler=null;

const pageTitles={calendar:'Kalender',activities:'Tegevused',team:'Tiimivaade',mobile:'Minu tööd',technicianV1:'Technician V1',workorders:'Tööd',callouts:'Väljakutsed',acts:'Aktid',oncall:'Valvegraafik',vacations:'Saadavus',people:'Tehnikud',objects:'Objektid',clients:'Kliendid',projects:'Projektid',ticker:'Ticker',maintenanceNorms:'Hooldusnormid',devices:'Seadmed',maintenanceProfiles:'Hooldusprofiil',granlundClassifier:'Granlund klassifikaator',unplannedMaintenance:'Planeerimata hooldused',mobilePreview:'Mobiili eelvaade',demo:'Demoandmed',diagnostics:'Diagnostika'};
const pageFiles={calendar:'index.html',activities:'activities.html',team:'team.html',mobile:'mobile.html',technicianV1:'technician-v1.html',workorders:'workorders.html',callouts:'callouts.html',acts:'acts.html',oncall:'oncall.html',vacations:'vacations.html',people:'people.html',objects:'objects.html',clients:'clients.html',projects:'projects.html',ticker:'ticker.html',maintenanceNorms:'maintenance-norms.html',devices:'devices.html',maintenanceProfiles:'maintenance-profiles.html',granlundClassifier:'granlund-classifier.html',unplannedMaintenance:'unplanned-maintenance.html',mobilePreview:'mobile-preview.html',demo:'demo.html',diagnostics:'diagnostics.html'};

const byId=(arr,id)=>arr.find(x=>x.id===id)||null;
const isArchivedRecord=(x)=>x?.isDeleted===true||x?.is_deleted===true;
const activeClients=()=>state.clients.filter(c=>!isArchivedRecord(c));
const activeObjects=()=>state.objects.filter(o=>!isArchivedRecord(o)&&!isArchivedRecord(byId(state.clients,o.clientId)));
const clientName=(id)=>{const c=byId(state.clients,id); return c?`${c.name}${isArchivedRecord(c)?' (arhiivis)':''}`:'-';};
const techName=(id)=>byId(state.people,id)?.name||'-';
function workorderHasMissingObject(w){
  return !!(w&&w.objectId&&!byId(state.objects,w.objectId));
}
function workorderObjectLabel(w){
  if(!w) return '-';
  const o=byId(state.objects,w.objectId);
  if(o) return `${o.name}${isArchivedRecord(o)||isArchivedRecord(byId(state.clients,o.clientId))?' (arhiivis)':''}`;
  return w.objectId?`⚠ Objekt puudub: ${w.objectId}`:'-';
}
function orphanWorkorders(){
  return (state.workorders||[]).filter(w=>w&&w.objectId&&!byId(state.objects,w.objectId));
}
const objectName=(id)=>{const o=byId(state.objects,id); return o?`${o.name}${isArchivedRecord(o)||isArchivedRecord(byId(state.clients,o.clientId))?' (arhiivis)':''}`:'-';};
const projectName=(id)=>byId(state.projects,id)?.name||'-';
const objectClientId=(objectId)=>byId(state.objects,objectId)?.clientId||'';
const projectObjectId=(projectId)=>byId(state.projects,projectId)?.objectId||'';
const projectClientId=(projectId)=>objectClientId(projectObjectId(projectId));
const objectProjects=(id)=>state.projects.filter(p=>p.objectId===id);
const objectWorkorders=(id)=>state.workorders.filter(w=>w.objectId===id);
const objectDevices=(id)=>state.devices.filter(d=>d.objectId===id);
const objectMaintenanceProfiles=(id)=>state.maintenanceProfiles.filter(p=>objectDevices(id).some(d=>d.id===p.deviceId));
const objectActs=(id)=>state.acts.filter(a=>a.objectId===id);
const clientObjects=(id)=>state.objects.filter(o=>o.clientId===id&&!isArchivedRecord(o));
const clientProjects=(id)=>state.projects.filter(p=>clientObjects(id).some(o=>o.id===p.objectId));
const clientWorkorders=(id)=>state.workorders.filter(w=>clientObjects(id).some(o=>o.id===w.objectId));
const clientActs=(id)=>state.acts.filter(a=>clientObjects(id).some(o=>o.id===a.objectId));
const projectWorkorders=(id)=>state.workorders.filter(w=>w.projectId===id);
const projectActs=(id)=>state.acts.filter(a=>projectWorkorders(id).some(w=>w.id===a.workorderId));
const completedStatuses=['Teostatud','Lõpetatud','Täidetud','Suletud','Arhiveeritud'];
const isCompletedStatus=(s)=>completedStatuses.includes(String(s||'').trim());
const taskWorkflowOptions=[
  {value:'valjakutse',label:'Väljakutse'},
  {value:'kontroll',label:'Kontroll'},
  {value:'diagnostika',label:'Diagnostika'},
  {value:'hooldus',label:'Hooldus'},
  {value:'remont',label:'Remont'},
  {value:'paigaldus',label:'Paigaldus'},
  {value:'muu',label:'Muu'}
];
function taskWorkflowValue(w){return String(w?.workflow||w?.workflowType||w?.taskWorkflow||'kontroll').trim()||'kontroll';}
function taskWorkflowLabel(w){const value=taskWorkflowValue(w); return taskWorkflowOptions.find(x=>x.value===value)?.label||value;}
function taskFlag(w,key,legacyKey=false){
  if(!w) return false;
  if(w[key]===true || w[key]==='true' || w[key]==='on' || w[key]===1) return true;
  if(w[key]===false || w[key]==='false' || w[key]===0) return false;
  if(legacyKey && (w[legacyKey]===true || w[legacyKey]==='true' || w[legacyKey]==='on' || w[legacyKey]===1)) return true;
  if(legacyKey && (w[legacyKey]===false || w[legacyKey]==='false' || w[legacyKey]===0)) return false;
  return false;
}
function taskRequiresAct(w){return taskFlag(w,'requiresAct','actRequired') || inferActRequired(w);}
function taskBillable(w){return taskFlag(w,'isBillable','billable');}
function taskTrackTime(w){return taskFlag(w,'trackTime','timeTracking');}
function taskUsesMaterials(w){return taskFlag(w,'usesMaterials','materialsRequired');}
function taskRequiresSignature(w){return taskFlag(w,'requiresSignature','signatureRequired');}
function taskPropertiesSummary(w){
  const items=[];
  if(taskRequiresAct(w)) items.push('Akt');
  if(taskBillable(w)) items.push('Arveldatav');
  if(taskTrackTime(w)) items.push('Tööaeg');
  if(taskUsesMaterials(w)) items.push('Materjalid');
  if(taskRequiresSignature(w)) items.push('Allkiri');
  return items.join(' · ')||'Lihtne töö';
}
function inferActRequired(w){
  const text=`${w?.title||''} ${w?.type||''} ${w?.actType||''}`.toLowerCase();
  if(actForWorkorder(w?.id)) return true;
  return text.includes('väljakutse') || text.includes('remont');
}
function workorderActRequired(w){
  return taskRequiresAct(w);
}
function autoClosePerformedWorkorders(){
  const now=Date.now();
  const sevenDays=7*24*60*60*1000;
  let changed=false;
  (state.workorders||[]).forEach(w=>{
    if(String(w.status||'').trim()==='Teostatud' && !workorderActRequired(w) && w.completedAt){
      const t=new Date(w.completedAt).getTime();
      if(!Number.isNaN(t) && now-t>=sevenDays){
        w.status='Lõpetatud';
        w.closedAt=w.closedAt||new Date().toISOString();
        changed=true;
      }
    }
  });
  if(changed) save();
}
const openWorkorders=()=>state.workorders.filter(w=>!isCompletedStatus(w.status));
const workorderStatusOptions=['Planeeritud','Töös','Peatatud','Teostatud','Akteeritud','Lõpetatud'];
const completedByLabel=(w)=>techName(workorderResponsibleId(w))||'VECO';
const completionCommentText=(w)=>String(w?.completionComment||w?.completion_comment||w?.done||w?.workDone||'').trim();
const problemDescriptionText=(w={})=>String(w?.problemDescription||w?.description||w?.issueDescription||w?.problem||w?.customerRequest||'').trim();
const performedWorkText=(w={})=>String(w?.performedWork||w?.workPerformed||w?.workText||w?.workDone||w?.done||w?.completionComment||w?.completion_comment||'').trim();
const workResultText=(w={})=>String(w?.workResult||w?.resultNotes||w?.result||'').trim();
const workRecommendationsText=(w={})=>String(w?.recommendations||w?.defects||w?.suggestions||'').trim();
const workMaterialsText=(w={})=>String(w?.materials||'').trim();
const actProblemDescriptionText=(a,w={})=>String(problemDescriptionText(w)||a?.problemDescription||a?.issueDescription||'').trim();
const actPerformedText=(a,w={})=>String(performedWorkText(w)||a?.performedWork||a?.workText||a?.workDone||a?.done||a?.content||'').trim();
const actResultText=(a,w={})=>String(workResultText(w)||a?.resultNotes||a?.result||a?.notes||'').trim();
const actRecommendationsText=(a,w={})=>String(workRecommendationsText(w)||a?.recommendations||a?.defects||a?.suggestions||'').trim();
const actMaterialsText=(a,w={})=>String(workMaterialsText(w)||a?.materials||'').trim();
function normalizeActContentFromWorkorder(a,w={}){
  if(!a) return a;
  // VECO_V3_20260627_0007: töö on akti sisu master-allikas.
  // Kui tehnik muudab Field V1-s "Teostatud töö" teksti, peab akti eelvaade/PDF võtma viimase tööinfo.
  const problem=problemDescriptionText(w);
  const performed=performedWorkText(w);
  const result=workResultText(w);
  const recommendations=workRecommendationsText(w);
  const materials=workMaterialsText(w);
  if(problem) a.problemDescription=problem;
  if(performed){ a.performedWork=performed; a.workText=performed; }
  if(result) a.resultNotes=result;
  if(recommendations) a.recommendations=recommendations;
  if(materials) a.materials=materials;
  if(a.workText===undefined) a.workText=a.performedWork||'';
  if(a.resultNotes===undefined) a.resultNotes=a.result||a.notes||'';
  if(a.recommendations===undefined) a.recommendations=a.defects||a.suggestions||'';
  if(a.materials===undefined) a.materials='';
  return a;
}
const statusClass=(s)=>{
  if(/teostatud|lõpetatud|täidetud|valmis/i.test(s||'')) return 'done';
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
// CR-084B: multi-tab render guard. Peer sync must not repaint calendar unless data signature changed.
const LOCAL_SYNC_KEY='veco_v3_sync_pulse';
const LOCAL_SYNC_TAB_ID=`tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
let localSyncChannel=null;
let localSyncTimer=null;
let localStateWatchTimer=null;
let localStateSnapshot='';
let localRefreshInProgress=false;
function localStateSignature(data){
  return JSON.stringify((data?.workorders||[]).map(w=>[w.id,w.status,w.date,w.endDate||w.end_date||'',w.time,w.title,w.technicianId,w.responsibleTechnicianId,(w.participantTechnicianIds||[]).join(','),w.objectId,w.projectId,w.description,w.workflow||w.workflowType||'',w.actRequired||w.requiresAct||false,w.isBillable||false,w.trackTime||false,w.usesMaterials||false,w.requiresSignature||false,w.plannedHours||w.durationHours||w.hours,w.completedAt||'',w.completedBy||'',w.completionComment||'',w.updatedAt||w.updated_at||'']));
}
function notifyLocalPeers(){
  try{
    localStateSnapshot=localStateSignature(state);
    const msg={type:'workorders-updated',page,t:Date.now(),tabId:LOCAL_SYNC_TAB_ID,sig:localStateSnapshot};
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
function renderCurrentPageWhenIdle(reason='idle'){
  if(isUserEditingOrChoosing()){
    clearTimeout(localSyncTimer);
    localSyncTimer=setTimeout(()=>renderCurrentPageWhenIdle(reason),650);
    return;
  }
  renderCurrentPage(reason);
}
function scheduleLocalRefresh(meta={}){
  if(meta?.tabId && meta.tabId===LOCAL_SYNC_TAB_ID) return;
  if(meta?.sig && meta.sig===localStateSnapshot) return;
  clearTimeout(localSyncTimer);
  localSyncTimer=setTimeout(()=>{
    if(localRefreshInProgress) return;
    localRefreshInProgress=true;
    try{
      if($('#modal')?.classList.contains('open')) return;
      const latest=window.VECO_STORAGE.load();
      const nextSig=localStateSignature(latest);
      if(nextSig===localStateSnapshot) return;
      state=latest;
      localStateSnapshot=nextSig;
      renderCurrentPageWhenIdle('local-peer-refresh');
    }catch(e){ console.warn('VECO local peer refresh failed',e); }
    finally{ localRefreshInProgress=false; }
  },160);
}
function startLocalStateWatch(){
  // Supabase pages already use realtime/polling. A same-tab localStorage watcher can repaint the calendar after every save.
  // Keep the watcher only for local/offline mode; cross-tab sync remains available through BroadcastChannel/storage.
  if(window.VECO_API?.mode?.()==='supabase') return;
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
        renderCurrentPageWhenIdle('local-peer-refresh');
      }
    }catch(e){ console.warn('VECO local state watch failed',e); }
  },1000);
}
function bindLocalPeerSync(){
  try{
    if('BroadcastChannel' in window && !localSyncChannel){
      localSyncChannel=new BroadcastChannel('veco_v3_sync');
      localSyncChannel.onmessage=(event)=>{
        if(event?.data?.type==='workorders-updated') scheduleLocalRefresh(event.data);
      };
    }
    window.addEventListener('storage',(event)=>{
      if(event.key===LOCAL_SYNC_KEY){
        try{ scheduleLocalRefresh(JSON.parse(event.newValue||'{}')); }catch(_){ scheduleLocalRefresh(); }
      }else if(event.key===window.VECO_STORAGE?.key){
        scheduleLocalRefresh();
      }
    });
    startLocalStateWatch();
  }catch(e){ console.warn('VECO local peer sync unavailable',e); }
}
function uid(prefix){
  const p=String(prefix||'ID').replace(/[^A-Za-z0-9_-]/g,'')||'ID';
  const rnd=(crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`);
  return `${p}-${rnd}`;
}
function isStoredWorkorderId(value){
  const v=String(value||'').trim();
  return !!v && v!=='undefined' && v!=='null';
}
function isRenderableWorkorder(w){
  return !!(w && isStoredWorkorderId(w.id) && w.date && (w.objectId || w.title));
}
function icon(i){return `<span class="icon">${i}</span>`}
function nav(sidebarMode='full'){
  const groups=[
    ['Tööjuht',[['calendar','▦'],['activities','◎'],['unplannedMaintenance','⚠'],['workorders','☑'],['callouts','☎'],['team','◫'],['oncall','☎'],['mobile','▤'],['technicianV1','▣'],['acts','▧']]],
    ['Tehnikud',[['people','☷'],['vacations','▤']]],
    ['Kliendid ja objektid',[['objects','⌂'],['clients','▥'],['projects','▣']]],
    ['Hooldusinfo',[['devices','▤'],['maintenanceNorms','≡'],['maintenanceProfiles','☑'],['granlundClassifier','⌁']]],
    ['Süsteem',[['ticker','▭'],['system-database','↔'],['system-export','⇩'],['system-import','⇧']]],
    ['Arendus',[['mobilePreview','▧'],['demo','↺'],['diagnostics','◎']]]
  ];
  const activeGroupTitle=(groups.find(([_,items])=>items.some(([key])=>key===page))||groups[0])[0];
  const storedNavOpenRaw=localStorage.getItem('veco_nav_open_groups');
  const openGroups=(()=>{
    try{ return storedNavOpenRaw ? (JSON.parse(storedNavOpenRaw)||{}) : null; }catch(_){ return null; }
  })() || {'Tööjuht':true,[activeGroupTitle]:true};
  const navItem=([key,ic])=>{
    if(key==='system-database') return `<button type="button" id="databaseBtn" title="Andmebaas" aria-label="Andmebaas">${icon(ic)}<span class="nav-label">Andmebaas</span><small>${window.VECO_API?.modeLabel?.()||'lokaalne'}</small></button>`;
    if(key==='system-export') return `<button type="button" id="exportDataBtn" title="Varukoopia" aria-label="Varukoopia">${icon(ic)}<span class="nav-label">Varukoopia</span></button>`;
    if(key==='system-import') return `<label class="nav-file-action" for="importDataFile" title="Taasta" aria-label="Taasta">${icon(ic)}<span class="nav-label">Taasta</span></label>`;
    const opensNewTab=(key==='mobile'||key==='technicianV1');
    const isFieldPreviewLink=(key==='technicianV1' && authRole()==='admin');
    const href=isFieldPreviewLink?'technician-v1.html?adminPreview=1':pageFiles[key];
    const externalAttrs=opensNewTab?' target="_blank" rel="noopener"':'';
    const previewAttr=isFieldPreviewLink?' data-field-admin-preview="1"':'';
    return `<a class="${page===key?'active':''}" href="${href}"${externalAttrs}${previewAttr} title="${esc(pageTitles[key]||key)}" aria-label="${esc(pageTitles[key]||key)}">${icon(ic)}<span class="nav-label">${pageTitles[key]}${opensNewTab?' ↗':''}</span></a>`;
  };
  const navGroups=groups.map(([title,items])=>{
    const visibleItems=items.filter(([key])=>key.startsWith('system-') ? authRole()==='admin' : canAccessPage(key));
    if(!visibleItems.length) return '';
    const isOpen=!!openGroups[title];
    return `<div class="nav-section ${isOpen?'open':'collapsed'}" data-nav-group="${esc(title)}"><button class="nav-section-title" type="button" data-nav-toggle="${esc(title)}" aria-expanded="${isOpen?'true':'false'}"><span>${isOpen?'▾':'▸'}</span>${title}</button><div class="nav-section-items">${visibleItems.map(navItem).join('')}</div></div>`;
  }).join('');
  const toggleTitle=sidebarMode==='hidden'?'Ava menüü':'Peida menüü';
  return `<aside class="sidebar" data-sidebar-state="${sidebarMode}"><button class="sidebar-toggle-rail" id="sidebarToggleRail" type="button" title="${toggleTitle}" aria-label="${toggleTitle}"></button><input id="importDataFile" type="file" accept="application/json" class="hidden"><nav class="nav nav-grouped nav-accordion" aria-label="Põhivaated">${navGroups}</nav></aside>`
}
function themeLogo(){
  return `<button class="brand-badge brand-theme-toggle" type="button" data-theme-toggle title="Vaheta hele/tume režiim" aria-label="Vaheta hele/tume režiim"><span class="brand-wordmark">VECO</span></button>`;
}
function mobileThemeButton(){
  const light=(localStorage.getItem('veco_mobile_theme')||'dark')==='light';
  return `<button class="btn ghost mobile-theme-toggle" type="button" data-mobile-theme-toggle title="Vaheta tehniku vaate hele/tume režiim" aria-label="Vaheta tehniku vaate hele/tume režiim">${light?'☀ Hele':'☾ Tume'}</button>`;
}
function currentOncallLabel(days=null){
  const contextDays=Array.isArray(days)&&days.length ? days : (Array.isArray(window.__VECO_ONCALL_CONTEXT_DAYS__)&&window.__VECO_ONCALL_CONTEXT_DAYS__.length ? window.__VECO_ONCALL_CONTEXT_DAYS__ : [dateKeyFromDate(new Date())]);
  const start=contextDays[0];
  const end=contextDays[contextDays.length-1];
  const names=(state.oncall||[])
    .filter(o=>o.start<=end&&o.end>=start)
    .map(o=>techName(o.personId)||o.userName||o.user_name||'')
    .filter(name=>name&&name!=='-');
  return [...new Set(names)].length ? [...new Set(names)].join(', ') : 'PUUDUB';
}
function oncallPill(){
  return `<button class="context-pill view-context-pill oncall-pill" type="button" title="Valitud perioodi valve" aria-label="Valitud perioodi valve">VALVE · ${esc(currentOncallLabel()).toUpperCase()}</button>`;
}
function viewContextText(value){
  return String(value||'').toUpperCase();
}
function adminHeaderPeriodInfo(){
  const start=localStorage.getItem('veco_calendar_week')||weekStartKeyFrom('');
  const days=weekDaysFrom(start).slice(0,5);
  const monthLabel=rangeMonthLabel(days,start);
  const weekNo=isoWeekNumber(days[0]);
  return {
    main:`${monthLabel} · NÄDAL ${weekNo}`.toUpperCase(),
    range:`${fmtShortDate(days[0])}–${fmtShortDate(days[days.length-1])}`,
    days
  };
}
function header(title,filters='',actions='',context=''){
  const label=viewContextText(context||title);
  if(isTechnicianUiPage()) return `<div class="panel-head mobile-head"><div><h2>${esc(label)}</h2><span class="muted">Lihtne tehniku töövaade</span></div></div>`;
  const employeeFilterPages=['calendar','team','workorders'];
  const controls=`${employeeFilterPages.includes(page)?'':adminViewAsControl()}${authStatusPill()}`;
  const period=adminHeaderPeriodInfo();
  const valve=currentOncallLabel ? currentOncallLabel(period.days) : '';
  const lowerRow=(filters||controls) ? `<div class="admin-compact-filterbar">${filters||''}${controls?`<div class="admin-compact-controls">${controls}</div>`:''}</div>` : '';
  const periodHtml=page==='vacations'?'':`<div class="admin-period-title"><strong>${esc(period.main)}</strong><span>${esc(period.range)} <b>•</b> <em>VALVE: ${esc(valve).toUpperCase()}</em></span></div>`;
  return `<div class="admin-compact-head admin-unified-head"><div class="admin-compact-main"><div class="admin-compact-left">${themeLogo()}<div class="admin-page-title"><strong>${esc(label)}</strong></div>${periodHtml}</div><div class="admin-compact-right">${actions||''}</div></div>${lowerRow}</div>`;
}

function detailHeader(title,actions=''){
  return `<div class="panel-head detail-head"><div class="view-head-left"><h2 class="context-pill">${esc(title)}</h2></div><div class="view-head-right">${adminViewAsControl()}${authStatusPill()}${actions?`<div class="action-row">${actions}</div>`:''}</div></div>`;
}


function globalTicker(){
  // Build 20260615_1504: ticker/status footer removed from the UI.
  // Calendar/workspace gets the full available vertical area; no footer height is reserved.
  return '';
}
function getStoredSidebarMode(){
  if(isTechnicianUiPage()) return 'full';
  // VECO_V3_20260615_1834: slide sidebar is an ephemeral overlay.
  // It must never reopen automatically after refresh, even if old localStorage says open.
  return 'hidden';
}
function setStoredSidebarMode(mode){
  if(mode==='compact') mode='hidden';
  if(!['full','hidden'].includes(mode)) mode='hidden';
  // Keep legacy keys in a safe closed state so older builds do not auto-open after deploy/cache.
  localStorage.setItem('veco_sidebar_mode',mode);
  localStorage.setItem('veco_sidebar_collapsed',mode==='hidden'?'true':'false');
  localStorage.setItem('veco_sidebar_open','false');
  return mode;
}
function shell(main,aside='',opts={}){
  applyTheme();
  // VECO_V3_20260626_0826 / CR-RENDER-002:
  // Google Calendar style shell update. Do not replace the whole <body> on every
  // render. Replacing body rebuilds sidebar, main, modal and calendar DOM and is
  // visible as a short flicker after saves/realtime updates. When the current
  // page shell already exists, update only the content panel + optional detail
  // panel and keep the static app chrome in place.
  const sidebarMode=setStoredSidebarMode(getStoredSidebarMode());
  const sidebarClass=sidebarMode==='hidden'?'sidebar-hidden':'sidebar-full';
  const existingApp=document.querySelector(`.app.page-${page}`);
  if(existingApp && page==='calendar' && window.__VECO_BOOT_RESTORED__ && !window.__VECO_BOOT_HYDRATED__ && !opts.forceFullShell){
    // CR-STATE-002: F5 hydration. A restored calendar shell already exists in
    // DOM from localStorage. Do not replace it on the first render; only attach
    // listeners below in renderCalendar(). This removes the refresh flash.
    window.__VECO_BOOT_HYDRATED__=true;
    existingApp.classList.toggle('sidebar-full',sidebarMode==='full');
    existingApp.classList.toggle('sidebar-hidden',sidebarMode!=='full');
    existingApp.classList.remove('sidebar-compact');
    document.body.classList.remove('veco-boot-restored');
    if(!document.getElementById('modal')){
      const modal=document.createElement('div');
      modal.className='modal';
      modal.id='modal';
      document.body.appendChild(modal);
    }
    bindGlobal();
    return;
  }
  if(existingApp && !isTechnicianUiPage() && !opts.forceFullShell){
    existingApp.classList.toggle('sidebar-full',sidebarMode==='full');
    existingApp.classList.toggle('sidebar-hidden',sidebarMode!=='full');
    existingApp.classList.remove('sidebar-compact');
    const content=existingApp.querySelector('main > section.content');
    const mainPanel=content?.querySelector(':scope > .panel:not(.detail)');
    if(content&&mainPanel){
      content.classList.toggle('wide',(!aside||opts.wide));
      mainPanel.innerHTML=main;
      let detail=content.querySelector(':scope > aside.panel.detail');
      if(aside){
        if(!detail){
          detail=document.createElement('aside');
          detail.className='panel detail';
          content.appendChild(detail);
        }
        detail.innerHTML=aside;
      }else if(detail){
        detail.remove();
      }
      if(!document.getElementById('modal')){
        const modal=document.createElement('div');
        modal.className='modal';
        modal.id='modal';
        document.body.appendChild(modal);
      }
      bindGlobal();
      VECO_LOADING?.ensureActive?.();
      return;
    }
  }
  document.body.innerHTML=`<div class="app page-${page} ${isTechnicianUiPage()?'app-mobile':''} ${sidebarClass}">${isTechnicianUiPage()?'':nav(sidebarMode)}${isTechnicianUiPage()?'':'<button class="sidebar-scrim" id="sidebarScrim" type="button" aria-label="Sulge menüü"></button>'}<main><section class="content ${(!aside||opts.wide)?'wide':''}"><div class="panel">${main}</div>${aside?`<aside class="panel detail">${aside}</aside>`:''}</section>${globalTicker()}</main></div><div class="modal" id="modal"></div>`;
  bindGlobal();
  VECO_LOADING?.ensureActive?.();
}
function activeThemeKey(){
  return isTechnicianUiPage() ? 'veco_mobile_theme' : 'veco_theme';
}
function applyTheme(){
  const key=activeThemeKey();
  document.body.classList.toggle('theme-light',(localStorage.getItem(key)||'dark')==='light');
}
function toggleTheme(){
  const key=activeThemeKey();
  const light=!document.body.classList.contains('theme-light');
  localStorage.setItem(key,light?'light':'dark');
  document.body.classList.toggle('theme-light',light);
}
function bindGlobal(){
  $$('[data-theme-toggle]').forEach(btn=>{ btn.onclick=toggleTheme; });
  $$('[data-mobile-theme-toggle]').forEach(btn=>{ btn.onclick=()=>{toggleTheme();renderCurrentPage('theme-toggle');}; });
  const applySidebarMode=(mode)=>{
    mode=setStoredSidebarMode(mode);
    const appEl=$('.app');
    const sidebar=$('.sidebar');
    const rail=$('#sidebarToggleRail');
    if(appEl){
      appEl.classList.toggle('sidebar-full',mode==='full');
      appEl.classList.toggle('sidebar-hidden',mode!=='full');
      appEl.classList.remove('sidebar-compact');
    }
    if(sidebar) sidebar.dataset.sidebarState=mode;
    if(rail){
      const title=mode==='full'?'Peida menüü':'Ava menüü';
      rail.setAttribute('title',title);
      rail.setAttribute('aria-label',title);
    }
  };
  const sidebarToggleHandler=()=>{
    const appEl=$('.app');
    const isOpen=!!appEl?.classList.contains('sidebar-full');
    applySidebarMode(isOpen?'hidden':'full');
  };
  const railBtn=$('#sidebarToggleRail'); if(railBtn) railBtn.onclick=sidebarToggleHandler;
  const sideBtn=$('#sidebarToggleBtn'); if(sideBtn) sideBtn.onclick=sidebarToggleHandler;
  const scrimBtn=$('#sidebarScrim'); if(scrimBtn) scrimBtn.onclick=()=>applySidebarMode('hidden');

  // Build 20260626_0826: bind persistent document-level sidebar handlers only once.
  // After CR-RENDER shell reuse, bindGlobal() can run many times. Multiple handlers
  // made one click toggle the sidebar open and immediately closed again.
  if(!window.__VECO_SIDEBAR_DOC_BOUND__){
    window.__VECO_SIDEBAR_DOC_BOUND__=true;
    document.addEventListener('click',(event)=>{
      const appEl=$('.app');
      if(!appEl?.classList.contains('sidebar-full')) return;
      const target=event.target;
      if(!target) return;
      if(target.closest?.('.sidebar,#sidebarToggleRail,#sidebarToggleBtn,.sidebar-scrim,.modal,.confirm-modal,.photo-lightbox,.team-people-menu,[data-employee-filter-menu]')) return;
      if(target.closest?.('main,.content,.panel,.calendar-compact-head,.calendar-filter-panel,.calendar-filter-fields,.calendar-planner-wrap,.calendar-planner')){
        const mode=setStoredSidebarMode('hidden');
        appEl.classList.toggle('sidebar-full',false);
        appEl.classList.toggle('sidebar-hidden',true);
        appEl.classList.remove('sidebar-compact');
        const sidebar=$('.sidebar'); if(sidebar) sidebar.dataset.sidebarState=mode;
        const rail=$('#sidebarToggleRail'); if(rail){ rail.setAttribute('title','Ava menüü'); rail.setAttribute('aria-label','Ava menüü'); }
      }
    },true);

    document.addEventListener('keydown',(event)=>{
      if(event.key==='Escape' && $('.app')?.classList.contains('sidebar-full')){
        const appEl=$('.app');
        const mode=setStoredSidebarMode('hidden');
        appEl.classList.toggle('sidebar-full',false);
        appEl.classList.toggle('sidebar-hidden',true);
        appEl.classList.remove('sidebar-compact');
        const sidebar=$('.sidebar'); if(sidebar) sidebar.dataset.sidebarState=mode;
        const rail=$('#sidebarToggleRail'); if(rail){ rail.setAttribute('title','Ava menüü'); rail.setAttribute('aria-label','Ava menüü'); }
      }
    });
  }
  $$('[data-nav-toggle]').forEach(btn=>{ btn.onclick=(event)=>{
    event.preventDefault();
    event.stopPropagation();
    const title=btn.dataset.navToggle;
    let open={};
    try{ open=JSON.parse(localStorage.getItem('veco_nav_open_groups')||'{}')||{}; }catch(_){ open={}; }
    open[title]=!open[title];
    localStorage.setItem('veco_nav_open_groups',JSON.stringify(open));

    const section=btn.closest('.nav-section');
    const isOpen=!!open[title];
    if(section){
      section.classList.toggle('open',isOpen);
      section.classList.toggle('collapsed',!isOpen);
    }
    btn.setAttribute('aria-expanded',isOpen?'true':'false');
    const arrow=btn.querySelector('span');
    if(arrow) arrow.textContent=isOpen?'▾':'▸';
  }; });
  $$('[data-field-admin-preview]').forEach(a=>{ a.onclick=()=>{ grantFieldAdminPreview(); }; });
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
  $('#adminViewAsSelect')?.addEventListener('change',e=>{
    const v=e.currentTarget.value||'';
    if(v) localStorage.setItem(ADMIN_VIEW_AS_KEY,v); else localStorage.removeItem(ADMIN_VIEW_AS_KEY);
    if(page==='mobile') localStorage.removeItem('veco_mobile_user_id');
    renderCurrentPage();
  });
  $('#authLogoutBtn')?.addEventListener('click',()=>{localStorage.removeItem(ADMIN_VIEW_AS_KEY);authClearSession();location.href='index.html';});
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
  modal.style.display='flex';
  modal.classList.add('open');
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');

  // Taustale klikk sulgeb akna. Nupu sulgemine on all delegatsioonina,
  // et see töötaks ka siis, kui vormi sees on mitu dünaamilist modali.
  modal.onclick=(e)=>{
    if(e.target===modal) closeModal();
  };
  modal.querySelector('.dialog')?.addEventListener('click',e=>e.stopPropagation());

  // Topeltkindlus: seo konkreetsed nupud kohe ning kasuta preventDefaulti,
  // et vormi sees olev Sulge/Tühista ei prooviks vormi submitida.
  modal.querySelectorAll('#modalCloseBtn,#cancelModalBtn,[data-modal-close]').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    },{capture:true});
  });

  if(modalEscHandler) document.removeEventListener('keydown',modalEscHandler);
  modalEscHandler=(e)=>{
    if(e.key==='Escape' && modal.classList.contains('open')){
      e.preventDefault();
      closeModal();
    }
  };
  document.addEventListener('keydown',modalEscHandler);
  setupAutoTextareas(modal);
  bindClose();
}
function setupAutoTextareas(root=document){
  const resize=(ta)=>{
    if(!ta || ta.dataset.noAutoHeight==='1') return;
    ta.style.height='auto';
    const max=parseInt(getComputedStyle(ta).maxHeight||'0',10)||520;
    ta.style.height=Math.min(ta.scrollHeight+2,max)+'px';
  };
  root.querySelectorAll?.('textarea').forEach(ta=>{
    resize(ta);
    ta.addEventListener('input',()=>resize(ta));
  });
}
function closeModal(){
  const modal=$('#modal');
  if(modal){
    modal.classList.remove('open');
    modal.onclick=null;
    modal.innerHTML='';
    modal.style.display='none';
  }
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
  if(modalEscHandler){
    document.removeEventListener('keydown',modalEscHandler);
    modalEscHandler=null;
  }
}
window.closeModal=closeModal;
window.vecoCloseModal=closeModal;
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
function bindClose(){
  document.querySelectorAll('#modalCloseBtn,#cancelModalBtn,[data-modal-close]').forEach(btn=>{
    if(btn.dataset.vecoCloseBound==='1') return;
    btn.dataset.vecoCloseBound='1';
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    },true);
  });
}

// Globaalne modali sulgemise delegatsioon. See hoiab ära olukorra, kus
// dünaamiliselt lisatud Sulge nupp jääb kuulajata või vorm püüab sündmuse kinni.
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#modalCloseBtn,#cancelModalBtn,[data-modal-close]');
  if(!btn) return;
  const modal=$('#modal');
  if(modal?.classList.contains('open')){
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  }
},true);

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
    let resolved=false;
    const cleanup=(value)=>{
      if(resolved) return;
      resolved=true;
      document.removeEventListener('keydown',onKey,true);
      document.body.classList.remove('confirm-open');
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
    document.body.classList.add('confirm-open');
    document.addEventListener('keydown',onKey,true);
    el.addEventListener('click',e=>{
      if(e.target===el){
        e.preventDefault();
        cleanup(false);
      }
    });
    el.querySelector('#vecoConfirmCancel')?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); cleanup(false); });
    el.querySelector('#vecoConfirmOk')?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); cleanup(true); });
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
    const nowIso=new Date().toISOString();
    const startIso=defaultWorkStartIso(w,nowIso);
    const endIso=(w?.completedAt||w?.completed_at)||nowIso;
    const registered=workorderRegisteredAt(w);
    const problem=problemDescriptionText(w)||'-';
    el.innerHTML=`<form class="confirm-dialog" id="completionCommentForm" role="dialog" aria-modal="true" aria-labelledby="completionCommentTitle" novalidate>
      <div class="dialog-head"><h2 id="completionCommentTitle">Töö teostatuks märkimine</h2></div>
      <div class="detail-body">
        <div class="confirm-message">Lisa teostatud töö ja kontrolli tegelik tööaeg. Registreerimise aeg säilib eraldi jäljena.</div>
        <div class="confirm-details"><strong>${esc(w?.id||'')}</strong><br>${esc(objectName(w?.objectId))}<br>${esc(w?.title||'')}${registered?`<br><span class="muted">Registreeritud: ${esc(fmtDateTimeShort(registered))}</span>`:''}</div>
        <div class="tv1-detail-card"><strong>Probleem</strong><p>${esc(problem)}</p></div>
        <div class="tv1-detail-card"><strong>Töö aeg</strong><div class="form-grid" style="margin-top:8px"><label>Algus<input class="field" id="completionStartInput" type="datetime-local" value="${esc(isoToLocalDatetimeInput(startIso))}"></label><label>Lõpp<input class="field" id="completionEndInput" type="datetime-local" value="${esc(isoToLocalDatetimeInput(endIso))}"></label></div><div class="muted" id="completionDurationPreview" style="margin-top:8px"></div></div>
        <label class="full" style="display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:650;">Teostatud töö *<textarea id="completionCommentInput" required minlength="5" placeholder="Kirjelda, mida objektil tehti.">${esc(initial||'')}</textarea></label>
        <div class="form-error hidden" id="completionCommentError">Teostatud töö ja korrektne tööaeg on kohustuslikud.</div>
      </div>
      <div class="dialog-actions">
        <button type="button" class="btn ghost" id="completionCommentCancel">Loobu</button>
        <button type="submit" class="btn primary" id="completionCommentOk">Märgi teostatuks</button>
      </div>
    </form>`;
    let resolved=false;
    const cleanup=(value)=>{
      if(resolved) return;
      resolved=true;
      document.removeEventListener('keydown',onKey);
      el.remove();
      resolve(value);
    };
    const input=()=>el.querySelector('#completionCommentInput');
    const startInput=()=>el.querySelector('#completionStartInput');
    const endInput=()=>el.querySelector('#completionEndInput');
    const preview=()=>el.querySelector('#completionDurationPreview');
    const error=()=>el.querySelector('#completionCommentError');
    const onKey=(e)=>{ if(e.key==='Escape'){ e.preventDefault(); cleanup(null); } };
    const updatePreview=()=>{
      const sIso=localDatetimeInputToIso(startInput()?.value||'');
      const eIso=localDatetimeInputToIso(endInput()?.value||'');
      const mins=minutesBetweenIso(sIso,eIso);
      const billable=billableMinutesFromActual(mins,60);
      if(preview()) preview().innerHTML=mins?workTimeSummaryHtml(mins,billable,60):'Sisesta algus ja lõpp.';
      return {startedAt:sIso,completedAt:eIso,durationMinutes:mins,billableDurationMinutes:billable,minimumBillableMinutes:60};
    };
    const submitCompletion=()=>{
      const value=String(input()?.value||'').trim();
      const times=updatePreview();
      if(value.length<3 || !times.startedAt || !times.completedAt || !times.durationMinutes || new Date(times.completedAt)<new Date(times.startedAt)){
        error()?.classList.remove('hidden');
        if(value.length<3) input()?.focus(); else startInput()?.focus();
        return;
      }
      cleanup({comment:value,performedWork:value,workResult:'',recommendations:'',materials:'',actType:w?.actType||'Väljakutse akt',...times});
    };
    document.body.appendChild(el);
    document.addEventListener('keydown',onKey);
    el.addEventListener('click',e=>{ if(e.target===el) cleanup(null); });
    el.querySelector('#completionCommentCancel')?.addEventListener('click',()=>cleanup(null));
    el.querySelector('#completionCommentForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      submitCompletion();
    });
    el.querySelector('#completionCommentOk')?.addEventListener('click',e=>{
      e.preventDefault();
      submitCompletion();
    });
    [input(),startInput(),endInput()].forEach(elm=>elm?.addEventListener('input',()=>{error()?.classList.add('hidden'); updatePreview();}));
    setTimeout(()=>{ updatePreview(); input()?.focus(); },0);
  });
}

function normalizeCompletionResult(result){
  if(!result) return null;
  if(typeof result==='string') return {comment:result,performedWork:result,workResult:'',recommendations:'',materials:'',actType:'Väljakutse akt'};
  const performed=String(result.performedWork||result.comment||'').trim();
  return {comment:performed,performedWork:performed,workResult:String(result.workResult||'').trim(),recommendations:String(result.recommendations||'').trim(),materials:String(result.materials||'').trim(),actType:result.actType||'Väljakutse akt',startedAt:result.startedAt||'',completedAt:result.completedAt||'',durationMinutes:Number(result.durationMinutes||0)||0,billableDurationMinutes:Number(result.billableDurationMinutes||0)||0,minimumBillableMinutes:Number(result.minimumBillableMinutes||60)||60};
}

function shortActDateCode(dateKey){
  const m=String(dateKey||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return `${m[3]}${m[2]}${m[1].slice(-2)}`;
  const digits=String(dateKey||'').replace(/[^0-9]/g,'');
  if(digits.length>=8) return `${digits.slice(6,8)}${digits.slice(4,6)}${digits.slice(2,4)}`;
  const d=new Date(); const pad=n=>String(n).padStart(2,'0');
  return `${pad(d.getDate())}${pad(d.getMonth()+1)}${String(d.getFullYear()).slice(-2)}`;
}
function shortActTimeCode(timeValue){
  const m=String(timeValue||'').match(/(\d{1,2})[:.](\d{2})/);
  if(m) return `${String(m[1]).padStart(2,'0')}${m[2]}`;
  const d=new Date(); const pad=n=>String(n).padStart(2,'0');
  return `${pad(d.getHours())}${pad(d.getMinutes())}`;
}
function actNumber(a){
  if(!a) return '';
  const w=byId(state.workorders,a.workorderId)||{};
  return `${shortActDateCode(a.date||w.date||a.createdAt)}-${shortActTimeCode(w.time||a.createdAt)}`;
}

function workorderDisplayNumber(w={}){
  const existing=String(w.displayNumber||w.display_number||'').trim();
  if(existing) return existing;
  const dateSource=w.date||w.registeredAt||w.createdAt||w.created_at||new Date().toISOString();
  const timeSource=w.time||w.registeredAt||w.createdAt||w.created_at||new Date().toISOString();
  return `${shortActDateCode(dateSource)}-${shortActTimeCode(timeSource)}`;
}
function workorderDisplayType(w={}){
  if(isCalloutWorkorder(w)) return 'Väljakutse';
  const wf=taskWorkflowValue(w);
  if(String(wf||'').toLowerCase().includes('hool')) return 'Hooldustöö';
  return 'Töö';
}
function workorderDisplayLabel(w={}){
  return `${workorderDisplayType(w)} ${workorderDisplayNumber(w)}`.trim();
}
function generateDisplayNumber(dateValue='',timeValue=''){
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const dateKey=dateValue||dateKeyFromDate(now);
  const timeKey=timeValue||`${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return `${shortActDateCode(dateKey)}-${shortActTimeCode(timeKey)}`;
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
function actStartDateTimeLabel(w={},a={}){
  if(w.startedAt||w.started_at) return fmtDateTimeShort(w.startedAt||w.started_at);
  return fmtActDateTime(w.date||a.date||'',w.time||'');
}
function actEndDateTimeLabel(w={},a={}){
  if(w.completedAt||w.completed_at) return fmtDateTimeShort(w.completedAt||w.completed_at);
  const endDate=workorderEndDate(w)||w.date||a.date||'';
  const endTime=w.time?workorderEndTime(w):'';
  return fmtActDateTime(endDate,endTime);
}
function actDurationLabel(w={}){
  return actualDurationLabel(w);
}
function renderObjects(){
  normalizeDevices();
  const archiveFilter=$('#objectArchiveFilter')?.value||'active';
  const clientFilter=$('#objectClientFilter')?.value||'all';
  const techFilter=$('#objectTechFilter')?.value||'all';
  const q=($('#objectSearch')?.value||'').toLowerCase();
  const activeList=activeObjects();
  const archivedObjects=state.objects.filter(o=>isArchivedRecord(o)||isArchivedRecord(byId(state.clients,o.clientId)));
  const source=archiveFilter==='archive'?archivedObjects:(archiveFilter==='all'?state.objects:activeList);
  const objects=source.filter(o=>(clientFilter==='all'||o.clientId===clientFilter)&&(techFilter==='all'||o.responsibleTechId===techFilter)&&`${o.name} ${o.address} ${clientName(o.clientId)} ${o.notes}`.toLowerCase().includes(q));
  if(!objects.some(o=>o.id===selectedObjectId)) selectedObjectId=objects[0]?.id||'';
  const filters=`<input class="field" id="objectSearch" placeholder="Otsi objekti, aadressi või klienti..." value="${esc(q)}"><select class="select" id="objectArchiveFilter"><option value="active" ${archiveFilter==='active'?'selected':''}>Aktiivsed objektid</option><option value="archive" ${archiveFilter==='archive'?'selected':''}>Arhiivis</option><option value="all" ${archiveFilter==='all'?'selected':''}>Kõik objektid</option></select><select class="select" id="objectClientFilter"><option value="all">Kõik kliendid</option>${(archiveFilter==='active'?activeClients():state.clients).map(c=>`<option value="${c.id}" ${clientFilter===c.id?'selected':''}>${esc(c.name)}${isArchivedRecord(c)?' (arhiivis)':''}</option>`).join('')}</select><select class="select" id="objectTechFilter"><option value="all">Kõik töötajad</option>${state.people.map(p=>`<option value="${p.id}" ${techFilter===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;
  const actions=`<button class="btn primary" id="newObjectBtn">${icon('＋')}Lisa objekt</button>`;
  const empty=archiveFilter==='archive'&&!objects.length?`<div class="empty-state"><strong>Objektide arhiiv on tühi.</strong><div class="muted">Arhiveeritud objektid ilmuvad siia ja neid saab taastada.</div></div>`:'';
  const rows=objects.map(o=>{const ownArchived=isArchivedRecord(o); const parentArchived=isArchivedRecord(byId(state.clients,o.clientId)); const archived=ownArchived||parentArchived; const statusLabel=archived?(parentArchived&&!ownArchived?'Kliendi arhiivis':'Arhiivis'):(o.status==='active'?'Aktiivne':'Peatatud'); const statusCls=archived?'warn':(o.status==='active'?'ok':'red'); return `<tr data-object-id="${o.id}" class="${detailOpen.objects&&o.id===selectedObjectId?'selected':''}"><td><strong>${esc(o.name)}</strong><div class="muted">${esc(o.address)}</div></td><td>${esc(clientName(o.clientId))}</td><td>${esc(techName(o.responsibleTechId))}</td><td>${objectProjects(o.id).length}</td><td>${objectWorkorders(o.id).filter(w=>!isCompletedStatus(w.status)).length}</td><td><span class="status ${statusCls}">${statusLabel}</span></td></tr>`});
  const main=header('Objektide töövaade',filters,actions,'Objektid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Aktiivseid objekte',activeList.length)}${summaryBox('Arhiivis',archivedObjects.length)}${summaryBox('Seadmeid',state.devices.length)}${summaryBox('Avatud töid',openWorkorders().length)}</div>${empty||table(['Objekt','Klient','Vastutaja','Projektid','Avatud tööd','Staatus'],rows)}</div>`;
  shell(main,detailOpen.objects?objectDetailHtml():'');
  $('#objectSearch')?.addEventListener('input',renderObjects); $('#objectArchiveFilter')?.addEventListener('change',()=>{detailOpen.objects=false;renderObjects();}); $('#objectClientFilter')?.addEventListener('change',renderObjects); $('#objectTechFilter')?.addEventListener('change',renderObjects);
  $$('[data-object-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.objectId; if(detailOpen.objects&&selectedObjectId===id){detailOpen.objects=false;}else{selectedObjectId=id;detailOpen.objects=true;} renderObjects();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedObjectId=state.objects[0]?.id||'';detailOpen.objects=false;renderObjects();});
  $('#newObjectBtn')?.addEventListener('click',()=>openObjectModal()); bindObjectDetail();
}
function objectDetailHtml(){
  const o=byId(state.objects,selectedObjectId); if(!o) return detailHeader('Objekti detail')+`<div class="detail-body"><span class="muted">Vali objekt.</span></div>`;
  const tabs=[['overview','Üldinfo'],['devices','Seadmed'],['maintenance','Hooldusprofiil'],['projects','Projektid'],['workorders','Tööd'],['acts','Aktid']];
  let body='';
  if(objectTab==='overview') body=`<div class="summary-grid">${summaryBox('Seadmeid',objectDevices(o.id).length)}${summaryBox('Projekte',objectProjects(o.id).length)}${summaryBox('Töid',objectWorkorders(o.id).length)}${summaryBox('Akte',objectActs(o.id).length)}</div>${card(o.name,[['Klient',clientName(o.clientId)],['Aadress',o.address],['Vastutaja',techName(o.responsibleTechId)],['Hooldusleping',o.contract],['Kontakt',o.mainContact]],o.status==='active'?'Aktiivne':'Peatatud',`<div class="section-title">Märkused</div><div class="muted">${esc(o.notes)}</div>`)}<div class="section-title">Kontaktid</div><div class="list">${(o.contacts||[]).map(c=>`<div class="event-row"><strong>${esc(c.name)} · ${esc(c.role)}</strong><span class="muted">${esc(c.phone)} · ${esc(c.email)}</span></div>`).join('')||'<span class="muted">Kontaktid puuduvad.</span>'}</div>`;
  if(objectTab==='devices') body=`<div class="list">${objectDevices(o.id).map(d=>`<div class="event-row"><strong>${esc(d.code||d.name)} · ${esc(d.type)}</strong><span class="muted">${esc(d.name||'')} ${d.location?'· '+esc(d.location):''}</span><span class="status ${d.status==='Aktiivne'?'ok':(d.status==='Reserv'?'warn':'red')}">${esc(d.status||'')}</span></div>`).join('')||'<span class="muted">Seadmeid pole.</span>'}</div>`;
  if(objectTab==='maintenance'){ normalizeMaintenanceProfiles(); const profiles=objectMaintenanceProfiles(o.id); const total=profiles.reduce((sum,p)=>sum+profileHours(p),0); body=`<div class="summary-grid">${summaryBox('Profiile',profiles.length)}${summaryBox('Prognoos',total.toFixed(1)+' h')} ${summaryBox('Seadmeid',new Set(profiles.map(p=>p.deviceId)).size)}${summaryBox('Aktiivseid',profiles.filter(p=>p.active!==false).length)}</div>${table(['Seade','Hooldus','Tase','Sagedus','Norm'],profiles.map(p=>`<tr><td><strong>${esc(deviceLabel(p.deviceId))}</strong></td><td>${esc(p.type)}</td><td>${esc(p.level)}</td><td>${esc(p.frequency)}</td><td><strong>${profileHours(p).toFixed(1)} h</strong></td></tr>`).join('')||'<tr><td colspan="5" class="muted">Hooldusprofiile pole.</td></tr>')}<div class="muted">Profiile saab hallata menüüs Seaded → Hooldusprofiil.</div>`; }
  if(objectTab==='projects') body=`<div class="list">${objectProjects(o.id).map(p=>`<div class="event-row"><strong>${esc(p.name)}</strong><span class="muted">Vastutaja: ${esc(techName(p.responsibleTechId))} · tähtaeg ${esc(fmtActDate(p.deadline))}</span><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></div>`).join('')||'<span class="muted">Projekte pole.</span>'}</div>`;
  if(objectTab==='workorders') body=`<div class="list">${objectWorkorders(o.id).map(w=>`<div class="event-row"><strong>${esc(fmtActDate(w.date))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(workorderAssigneeLabel(w))} · ${esc(problemDescriptionText(w))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töid pole.</span>'}</div>`;
  if(objectTab==='acts') body=`<div class="list">${objectActs(o.id).map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="muted">Seotud töö: ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  const objectArchived=isArchivedRecord(o);
  const objectActions=`<button class="btn small" id="editObjectBtn">✎ Muuda</button><button class="btn small primary" id="addWorkorderBtn">＋ Töö</button>${objectArchived?'<button class="btn small primary" id="restoreObjectBtn" type="button">↩ Taasta</button>':'<button class="btn small danger" id="archiveObjectBtn" type="button">Arhiveeri</button>'}<button class="btn small ghost" id="objectDetailCloseBtn" type="button">× Sulge</button>`;
  return detailHeader('Objekti detail',objectActions)+`<div class="detail-body"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${objectTab===k?'active':''}" data-object-tab="${k}">${t}</button>`).join('')}</div>${body}</div>`;
}
async function archiveObject(id){
  const o=byId(state.objects,id);
  if(!o||isArchivedRecord(o)) return;
  const related=objectWorkorders(id).length+objectActs(id).length+objectProjects(id).length;
  const details=`<div class="muted">Kirje eemaldatakse aktiivsetest valikutest. Varasemad tööd ja aktid jäävad alles.${related?`<br><br>Seotud kirjeid: ${related}`:''}</div>`;
  const ok=await openVecoConfirm({
    title:'Arhiveeri objekt?',
    message:`${esc(o.name)}`,
    details,
    confirmText:'Arhiveeri objekt',
    cancelText:'Loobu',
    danger:true
  });
  if(!ok) return;
  const deletedBy=(typeof currentUser!=='undefined'&&currentUser?.name)||(typeof activePerson!=='undefined'&&activePerson?.name)||(typeof currentPerson!=='undefined'&&currentPerson?.name)||'VECO';
  try{
    if(window.VECO_API?.mode?.()==='supabase' && typeof window.VECO_API.archiveObject==='function'){
      await window.VECO_API.archiveObject(o.id,deletedBy);
      localStorage.removeItem('veco_v3_last_masterdata_sync_error');
    }
    Object.assign(o,{isDeleted:true,deletedAt:new Date().toISOString(),deletedBy});
    save();
  }catch(err){
    console.warn('VECO object archive failed',err);
    alert(`Objekti arhiveerimine ebaõnnestus: ${err?.message||err}`);
    return;
  }
  detailOpen.objects=false;
  selectedObjectId=activeObjects()[0]?.id||'';
  renderObjects();
}
async function restoreObject(id){
  const o=byId(state.objects,id);
  if(!o||!isArchivedRecord(o)) return;
  const ok=await openVecoConfirm({
    title:'Taasta objekt?',
    message:`${esc(o.name)}`,
    details:'<div class="muted">Kirje ilmub taas aktiivsetesse objektide valikutesse. Kui kliendi kirje on arhiivis, taasta esmalt klient.</div>',
    confirmText:'Taasta objekt',
    cancelText:'Loobu'
  });
  if(!ok) return;
  try{
    if(window.VECO_API?.mode?.()==='supabase' && typeof window.VECO_API.restoreObject==='function'){
      await window.VECO_API.restoreObject(o.id);
      localStorage.removeItem('veco_v3_last_masterdata_sync_error');
    }
    Object.assign(o,{isDeleted:false,deletedAt:'',deletedBy:''});
    save();
  }catch(err){
    console.warn('VECO object restore failed',err);
    alert(`Objekti taastamine ebaõnnestus: ${err?.message||err}`);
    return;
  }
  detailOpen.objects=false;
  selectedObjectId=o.id;
  renderObjects();
}
function bindObjectDetail(){ $$('[data-object-tab]').forEach(b=>b.addEventListener('click',()=>{objectTab=b.dataset.objectTab;renderObjects();})); $('#editObjectBtn')?.addEventListener('click',()=>openObjectModal(selectedObjectId)); $('#addWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal('',{objectId:selectedObjectId})); $('#archiveObjectBtn')?.addEventListener('click',()=>archiveObject(selectedObjectId)); $('#restoreObjectBtn')?.addEventListener('click',()=>restoreObject(selectedObjectId)); $('#objectDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.objects=false;renderObjects();}); }
function openObjectModal(id='',defaults={}){
  const o=id?byId(state.objects,id):{clientId:defaults.clientId||activeClients()[0]?.id||'',name:'',address:'',mainContact:'',responsibleTechId:state.people[0]?.id||'',contract:'Jah',status:'active',notes:'',contacts:[]};
  openModal(`<form id="objectForm"><div class="dialog-head"><h2>${id?'Muuda objekti':'Lisa objekt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Objekti nimi<input class="field" name="name" required value="${esc(o.name)}"></label><label>Klient<select class="select" name="clientId">${activeClients().map(c=>`<option value="${c.id}" ${o.clientId===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label class="full">Aadress<input class="field" name="address" required value="${esc(o.address)}"></label><label>Kontakt<input class="field" name="mainContact" value="${esc(o.mainContact)}"></label><label>Vastutaja<select class="select" name="responsibleTechId">${state.people.map(p=>`<option value="${p.id}" ${o.responsibleTechId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Hooldusleping<input class="field" name="contract" value="${esc(o.contract)}"></label><label>Staatus<select class="select" name="status"><option value="active" ${o.status==='active'?'selected':''}>Aktiivne</option><option value="inactive" ${o.status!=='active'?'selected':''}>Peatatud</option></select></label><label class="full">Märkused<textarea name="notes">${esc(o.notes)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#objectForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('O'),clientId:f.clientId.value,name:f.name.value,address:f.address.value,mainContact:f.mainContact.value,responsibleTechId:f.responsibleTechId.value,contract:f.contract.value,status:f.status.value,notes:f.notes.value,contacts:o.contacts||[],isDeleted:o.isDeleted===true,deletedAt:o.deletedAt||'',deletedBy:o.deletedBy||''}; if(id){Object.assign(o,next)}else{state.objects.push(next);selectedObjectId=next.id;detailOpen.objects=true} save();closeModal(); page==='clients'?renderClients():renderObjects();});
}

function renderClients(){
  const archiveFilter=$('#clientArchiveFilter')?.value||'active';
  const status=$('#clientStatusFilter')?.value||'all';
  const q=($('#clientSearch')?.value||'').toLowerCase();
  const activeList=activeClients();
  const archivedClients=state.clients.filter(c=>isArchivedRecord(c));
  const source=archiveFilter==='archive'?archivedClients:(archiveFilter==='all'?state.clients:activeList);
  const clients=source.filter(c=>(status==='all'||(status==='active')===!!c.active)&&`${c.name} ${c.contact} ${c.email} ${c.notes}`.toLowerCase().includes(q));
  if(!clients.some(c=>c.id===selectedClientId)) selectedClientId=clients[0]?.id||'';
  const filters=`<input class="field" id="clientSearch" placeholder="Otsi klienti..." value="${esc(q)}"><select class="select" id="clientArchiveFilter"><option value="active" ${archiveFilter==='active'?'selected':''}>Aktiivsed kliendid</option><option value="archive" ${archiveFilter==='archive'?'selected':''}>Arhiivis</option><option value="all" ${archiveFilter==='all'?'selected':''}>Kõik kliendid</option></select><select class="select" id="clientStatusFilter"><option value="all">Kõik staatused</option><option value="active" ${status==='active'?'selected':''}>Aktiivne</option><option value="inactive" ${status==='inactive'?'selected':''}>Peatatud</option></select>`;
  const actions=`<button class="btn primary" id="newClientBtn">${icon('＋')}Lisa klient</button>`;
  const empty=archiveFilter==='archive'&&!clients.length?`<div class="empty-state"><strong>Klientide arhiiv on tühi.</strong><div class="muted">Arhiveeritud kliendid ilmuvad siia ja neid saab taastada.</div></div>`:'';
  const rows=clients.map(c=>{const objs=clientObjects(c.id),pros=clientProjects(c.id),wo=clientWorkorders(c.id).filter(w=>!isCompletedStatus(w.status)); const archived=isArchivedRecord(c); const statusLabel=archived?'Arhiivis':(c.active?'Aktiivne':'Peatatud'); const statusCls=archived?'warn':(c.active?'ok':'red');return `<tr data-client-id="${c.id}" class="${detailOpen.clients&&c.id===selectedClientId?'selected':''}"><td><strong>${esc(c.name)}</strong><div class="muted">${esc(c.regNo)}</div></td><td>${esc(c.contact)}</td><td>${esc(c.phone)}</td><td>${objs.length}</td><td>${pros.length}</td><td>${wo.length}</td><td><span class="status ${statusCls}">${statusLabel}</span></td></tr>`});
  const main=header('Klientide register',filters,actions,'Kliendid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Aktiivseid kliente',activeList.length)}${summaryBox('Arhiivis',archivedClients.length)}${summaryBox('Objekte',activeObjects().length)}${summaryBox('Avatud töid',openWorkorders().length)}</div>${empty||table(['Klient','Kontakt','Telefon','Objektid','Projektid','Avatud tööd','Staatus'],rows)}</div>`;
  shell(main,detailOpen.clients?clientDetailHtml():''); $('#clientSearch')?.addEventListener('input',renderClients); $('#clientArchiveFilter')?.addEventListener('change',()=>{detailOpen.clients=false;renderClients();}); $('#clientStatusFilter')?.addEventListener('change',renderClients);
  $$('[data-client-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.clientId; if(detailOpen.clients&&selectedClientId===id){detailOpen.clients=false;}else{selectedClientId=id;detailOpen.clients=true;} renderClients();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedClientId=state.clients[0]?.id||'';detailOpen.clients=false;renderClients();}); $('#newClientBtn')?.addEventListener('click',()=>openClientModal()); bindClientDetail();
}
function clientDetailHtml(){
  const c=byId(state.clients,selectedClientId); if(!c) return detailHeader('Kliendi detail')+`<div class="detail-body"><span class="muted">Vali klient.</span></div>`;
  const tabs=[['overview','Üldinfo'],['objects','Objektid'],['projects','Projektid'],['workorders','Tööd'],['acts','Aktid']];
  const objs=clientObjects(c.id), projects=clientProjects(c.id), workorders=clientWorkorders(c.id), acts=clientActs(c.id); let body='';
  if(clientTab==='overview') body=`<div class="summary-grid">${summaryBox('Objekte',objs.length)}${summaryBox('Projekte',projects.length)}${summaryBox('Töid',workorders.length)}${summaryBox('Akte',acts.length)}</div>${card(c.name,[['Registrikood',c.regNo],['Kontakt',c.contact],['Telefon',c.phone],['E-post',c.email],['Arve e-post',c.invoiceEmail]],c.active?'Aktiivne':'Peatatud',`<div class="section-title">Märkused</div><div class="muted">${esc(c.notes)}</div>`)}<div class="section-title">Kiirülevaade</div><div class="list"><div class="event-row"><strong>Objektid</strong><span class="muted">${objs.map(o=>o.name).join(', ')||'Puuduvad'}</span></div><div class="event-row"><strong>Avatud tööd</strong><span class="muted">${workorders.filter(w=>!isCompletedStatus(w.status)).map(w=>`${fmtActDate(w.date)} · ${w.title}`).join(', ')||'Puuduvad'}</span></div></div>`;
  if(clientTab==='objects') body=`<div class="list">${objs.map(o=>`<div class="event-row"><strong>${esc(o.name)}</strong><span class="muted">${esc(o.address)} · vastutaja ${esc(techName(o.responsibleTechId))}</span><span class="status ${o.status==='active'?'ok':'red'}">${o.status==='active'?'Aktiivne':'Peatatud'}</span></div>`).join('')||'<span class="muted">Objekte pole.</span>'}</div>`;
  if(clientTab==='projects') body=`<div class="list">${projects.map(p=>`<div class="event-row"><strong>${esc(p.name)}</strong><span class="muted">Objekt: ${esc(objectName(p.objectId))} · tähtaeg ${esc(fmtActDate(p.deadline))}</span><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></div>`).join('')||'<span class="muted">Projekte pole.</span>'}</div>`;
  if(clientTab==='workorders') body=`<div class="list">${workorders.map(w=>`<div class="event-row"><strong>${esc(fmtActDate(w.date))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(objectName(w.objectId))} · ${esc(workorderAssigneeLabel(w))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töid pole.</span>'}</div>`;
  if(clientTab==='acts') body=`<div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="muted">Objekt: ${esc(objectName(a.objectId))} · töö ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  const clientArchived=isArchivedRecord(c);
  const clientActions=`<button class="btn small" id="editClientBtn">✎ Muuda</button><button class="btn small primary" id="addClientObjectBtn">＋ Objekt</button>${clientArchived?'<button class="btn small primary" id="restoreClientBtn" type="button">↩ Taasta</button>':'<button class="btn small danger" id="archiveClientBtn" type="button">Arhiveeri</button>'}<button class="btn small ghost" id="clientDetailCloseBtn" type="button">× Sulge</button>`;
  return detailHeader('Kliendi detail',clientActions)+`<div class="detail-body"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${clientTab===k?'active':''}" data-client-tab="${k}">${t}</button>`).join('')}</div>${body}</div>`;
}
async function archiveClient(id){
  const c=byId(state.clients,id);
  if(!c||isArchivedRecord(c)) return;
  const activeObjCount=state.objects.filter(o=>o.clientId===id&&!isArchivedRecord(o)).length;
  const related=clientWorkorders(id).length+clientActs(id).length+clientProjects(id).length;
  const details=`<div class="muted">Kirje eemaldatakse aktiivsetest valikutest. Varasemad tööd ja aktid jäävad alles.${activeObjCount?`<br><br>Tähelepanu: kliendil on ${activeObjCount} aktiivset objekti, mis peidetakse aktiivsetest valikutest koos kliendiga.`:''}${related?`<br>Seotud kirjeid: ${related}`:''}</div>`;
  const ok=await openVecoConfirm({
    title:'Arhiveeri klient?',
    message:`${esc(c.name)}`,
    details,
    confirmText:'Arhiveeri klient',
    cancelText:'Loobu',
    danger:true
  });
  if(!ok) return;
  const deletedBy=(typeof currentUser!=='undefined'&&currentUser?.name)||(typeof activePerson!=='undefined'&&activePerson?.name)||(typeof currentPerson!=='undefined'&&currentPerson?.name)||'VECO';
  try{
    if(window.VECO_API?.mode?.()==='supabase' && typeof window.VECO_API.archiveClient==='function'){
      await window.VECO_API.archiveClient(c.id,deletedBy);
      localStorage.removeItem('veco_v3_last_masterdata_sync_error');
    }
    Object.assign(c,{isDeleted:true,deletedAt:new Date().toISOString(),deletedBy});
    save();
  }catch(err){
    console.warn('VECO client archive failed',err);
    alert(`Kliendi arhiveerimine ebaõnnestus: ${err?.message||err}`);
    return;
  }
  detailOpen.clients=false;
  selectedClientId=activeClients()[0]?.id||'';
  renderClients();
}
async function restoreClient(id){
  const c=byId(state.clients,id);
  if(!c||!isArchivedRecord(c)) return;
  const ok=await openVecoConfirm({
    title:'Taasta klient?',
    message:`${esc(c.name)}`,
    details:'<div class="muted">Kirje ilmub taas aktiivsetesse klientide valikutesse. Varem arhiveeritud objektid tuleb vajadusel eraldi taastada.</div>',
    confirmText:'Taasta klient',
    cancelText:'Loobu'
  });
  if(!ok) return;
  try{
    if(window.VECO_API?.mode?.()==='supabase' && typeof window.VECO_API.restoreClient==='function'){
      await window.VECO_API.restoreClient(c.id);
      localStorage.removeItem('veco_v3_last_masterdata_sync_error');
    }
    Object.assign(c,{isDeleted:false,deletedAt:'',deletedBy:''});
    save();
  }catch(err){
    console.warn('VECO client restore failed',err);
    alert(`Kliendi taastamine ebaõnnestus: ${err?.message||err}`);
    return;
  }
  detailOpen.clients=false;
  selectedClientId=c.id;
  renderClients();
}
function bindClientDetail(){ $$('[data-client-tab]').forEach(b=>b.addEventListener('click',()=>{clientTab=b.dataset.clientTab;renderClients();})); $('#editClientBtn')?.addEventListener('click',()=>openClientModal(selectedClientId)); $('#addClientObjectBtn')?.addEventListener('click',()=>openObjectModal('',{clientId:selectedClientId})); $('#archiveClientBtn')?.addEventListener('click',()=>archiveClient(selectedClientId)); $('#restoreClientBtn')?.addEventListener('click',()=>restoreClient(selectedClientId)); $('#clientDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.clients=false;renderClients();}); }
function openClientModal(id=''){
  const c=id?byId(state.clients,id):{name:'',regNo:'',contact:'',phone:'',email:'',invoiceEmail:'',active:true,notes:''};
  openModal(`<form id="clientForm"><div class="dialog-head"><h2>${id?'Muuda klienti':'Lisa klient'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Kliendi nimi<input class="field" name="name" required value="${esc(c.name)}"></label><label>Registrikood<input class="field" name="regNo" value="${esc(c.regNo)}"></label><label>Kontaktisik<input class="field" name="contact" value="${esc(c.contact)}"></label><label>Telefon<input class="field" name="phone" value="${esc(c.phone)}"></label><label>E-post<input class="field" name="email" type="email" value="${esc(c.email)}"></label><label>Arve e-post<input class="field" name="invoiceEmail" type="email" value="${esc(c.invoiceEmail)}"></label><label>Staatus<select class="select" name="active"><option value="true" ${c.active?'selected':''}>Aktiivne</option><option value="false" ${!c.active?'selected':''}>Peatatud</option></select></label><label class="full">Märkused<textarea name="notes">${esc(c.notes)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#clientForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('C'),name:f.name.value,regNo:f.regNo.value,contact:f.contact.value,phone:f.phone.value,email:f.email.value,invoiceEmail:f.invoiceEmail.value,active:f.active.value==='true',notes:f.notes.value,isDeleted:c.isDeleted===true,deletedAt:c.deletedAt||'',deletedBy:c.deletedBy||''}; if(id){Object.assign(c,next)}else{state.clients.push(next);selectedClientId=next.id;detailOpen.clients=true} save();closeModal();renderClients();});
}

function renderProjects(){
  const status=$('#projectStatusFilter')?.value||'all'; const client=$('#projectClientFilter')?.value||'all'; const q=($('#projectSearch')?.value||'').toLowerCase();
  const projects=state.projects.filter(p=>(status==='all'||p.status===status)&&(client==='all'||projectClientId(p.id)===client)&&`${p.name} ${p.description} ${objectName(p.objectId)} ${clientName(projectClientId(p.id))}`.toLowerCase().includes(q));
  if(!projects.some(p=>p.id===selectedProjectId)) selectedProjectId=projects[0]?.id||state.projects[0]?.id||'';
  const statuses=[...new Set(state.projects.map(p=>p.status))];
  const filters=`<input class="field" id="projectSearch" placeholder="Otsi projekti..." value="${esc(q)}"><select class="select" id="projectClientFilter"><option value="all">Kõik kliendid</option>${activeClients().map(c=>`<option value="${c.id}" ${client===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select><select class="select" id="projectStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn primary" id="newProjectBtn">${icon('＋')}Lisa projekt</button>`;
  const rows=projects.map(p=>`<tr data-project-id="${p.id}" class="${detailOpen.projects&&p.id===selectedProjectId?'selected':''}"><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.description)}</div></td><td>${esc(clientName(projectClientId(p.id)))}</td><td>${esc(objectName(p.objectId))}</td><td>${esc(techName(p.responsibleTechId))}</td><td>${esc(fmtActDate(p.deadline))}</td><td>${projectWorkorders(p.id).length}</td><td><span class="status ${statusClass(p.status)}">${esc(p.status)}</span></td></tr>`);
  const main=header('Projektide register',filters,actions,'Projektid')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Projekte',state.projects.length)}${summaryBox('Töid',state.workorders.length)}${summaryBox('Avatud töid',openWorkorders().length)}${summaryBox('Akte',state.acts.length)}</div>${table(['Projekt','Klient','Objekt','Vastutaja','Tähtaeg','Tööd','Staatus'],rows)}</div>`;
  shell(main,detailOpen.projects?projectDetailHtml():''); $('#projectSearch')?.addEventListener('input',renderProjects); $('#projectClientFilter')?.addEventListener('change',renderProjects); $('#projectStatusFilter')?.addEventListener('change',renderProjects);
  $$('[data-project-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.projectId; if(detailOpen.projects&&selectedProjectId===id){detailOpen.projects=false;}else{selectedProjectId=id;detailOpen.projects=true;} renderProjects();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedProjectId=state.projects[0]?.id||'';detailOpen.projects=false;renderProjects();}); $('#newProjectBtn')?.addEventListener('click',()=>openProjectModal()); bindProjectDetail();
}
function projectDetailHtml(){
  const p=byId(state.projects,selectedProjectId); if(!p) return detailHeader('Projekti detail')+`<div class="detail-body"><span class="muted">Vali projekt.</span></div>`;
  const tabs=[['overview','Üldinfo'],['workorders','Tööd'],['acts','Aktid']]; const wos=projectWorkorders(p.id), acts=projectActs(p.id); let body='';
  if(projectTab==='overview') body=`<div class="summary-grid">${summaryBox('Töid',wos.length)}${summaryBox('Avatud',wos.filter(w=>!isCompletedStatus(w.status)).length)}${summaryBox('Akte',acts.length)}${summaryBox('Tähtaeg',fmtActDate(p.deadline))}</div>${card(p.name,[['Klient',clientName(projectClientId(p.id))],['Objekt',objectName(p.objectId)],['Vastutaja',techName(p.responsibleTechId)],['Tähtaeg',fmtActDate(p.deadline)]],p.status,`<div class="section-title">Kirjeldus</div><div class="muted">${esc(p.description)}</div>`)}`;
  if(projectTab==='workorders') body=`<div class="list">${wos.map(w=>`<div class="event-row"><strong>${esc(fmtActDate(w.date))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(workorderAssigneeLabel(w))} · ${esc(problemDescriptionText(w))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Töid pole.</span>'}</div>`;
  if(projectTab==='acts') body=`<div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="muted">Töö: ${esc(a.workorderId)}</span><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  return detailHeader('Projekti detail','<button class="btn small" id="editProjectBtn">✎ Muuda</button><button class="btn small primary" id="addProjectWorkorderBtn">＋ Töö</button><button class="btn small ghost" id="projectDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${projectTab===k?'active':''}" data-project-tab="${k}">${t}</button>`).join('')}</div>${body}</div>`;
}
function bindProjectDetail(){ $$('[data-project-tab]').forEach(b=>b.addEventListener('click',()=>{projectTab=b.dataset.projectTab;renderProjects();})); $('#editProjectBtn')?.addEventListener('click',()=>openProjectModal(selectedProjectId)); $('#addProjectWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal('',{projectId:selectedProjectId,objectId:projectObjectId(selectedProjectId)})); $('#projectDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.projects=false;renderProjects();}); }
function openProjectModal(id=''){
  const p=id?byId(state.projects,id):{objectId:activeObjects()[0]?.id||'',name:'',responsibleTechId:state.people[0]?.id||'',status:'Planeeritud',deadline:'',description:''};
  openModal(`<form id="projectForm"><div class="dialog-head"><h2>${id?'Muuda projekti':'Lisa projekt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Projekti nimi<input class="field" name="name" required value="${esc(p.name)}"></label><label>Objekt<select class="select" name="objectId">${activeObjects().map(o=>`<option value="${o.id}" ${p.objectId===o.id?'selected':''}>${esc(o.name)} · ${esc(clientName(o.clientId))}</option>`).join('')}</select></label><label>Vastutaja<select class="select" name="responsibleTechId">${state.people.map(t=>`<option value="${t.id}" ${p.responsibleTechId===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label>Staatus<select class="select" name="status">${['Planeeritud','Töös','Ootel','Pausil','Täidetud','Arhiveeritud'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Tähtaeg<input class="field" name="deadline" type="date" value="${esc(p.deadline)}"></label><label class="full">Kirjeldus<textarea name="description">${esc(p.description)}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose(); $('#projectForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('PRJ'),objectId:f.objectId.value,name:f.name.value,responsibleTechId:f.responsibleTechId.value,status:f.status.value,deadline:f.deadline.value,description:f.description.value,problemDescription:f.description.value,actRequired:!!f.actRequired?.checked,requiresAct:!!f.actRequired?.checked,workflow:f.workflow?.value||'kontroll',workflowType:f.workflow?.value||'kontroll'}; if(id){Object.assign(p,next)}else{state.projects.push(next);selectedProjectId=next.id;detailOpen.projects=true} save();closeModal();renderProjects();});
}

function renderWorkorders(){
  autoClosePerformedWorkorders();
  const status=$('#woStatusFilter')?.value||'all'; const tech=scopedPersonId()?[scopedPersonId()]:employeeFilterSelected('workorders'); const q=($('#woSearch')?.value||'').toLowerCase();
  const baseWorkorders=scopedWorkorders();
  const statuses=[...new Set(baseWorkorders.map(w=>w.status))];
  const list=baseWorkorders.filter(w=>(status==='all'||w.status===status)&&employeeFilterMatchesWorkorder(w,tech)&&`${w.title} ${w.description} ${objectName(w.objectId)} ${projectName(w.projectId)} ${workorderPeopleLabel(w)}`.toLowerCase().includes(q));
  if(!list.some(w=>w.id===selectedWorkorderId)) selectedWorkorderId=list[0]?.id||baseWorkorders[0]?.id||'';
  const peopleForFilter=visiblePeopleForCurrentScope();
  const techFilterHtml=scopedPersonId()?employeeMultiFilterHtml('workorders',[scopedPersonId()],{disabled:true,label:scopedPerson()?.name||'Minu tööd'}):employeeMultiFilterHtml('workorders',tech);
  const filters=`<input class="field" id="woSearch" placeholder="Otsi tööd..." value="${esc(q)}">${techFilterHtml}<select class="select" id="woStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=`<button class="btn primary" id="newWorkorderBtn">${icon('＋')}Lisa töö</button>`;
  const rows=list.map(w=>`<tr data-workorder-id="${w.id}" class="${detailOpen.workorders&&w.id===selectedWorkorderId?'selected':''}"><td><strong>${esc(w.title)}</strong><div class="muted">${esc(problemDescriptionText(w))}</div></td><td>${esc(fmtActDate(w.date))} ${esc(w.time)}</td><td>${esc(clientName(objectClientId(w.objectId)))}</td><td>${esc(workorderObjectLabel(w))}</td><td>${esc(projectName(w.projectId))}</td><td>${esc(workorderAssigneeLabel(w))}</td><td><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></td><td>${esc(taskWorkflowLabel(w))}</td><td>${esc(taskPropertiesSummary(w))}</td></tr>`);
  const main=header('Tööd',filters,actions,'TÖÖD')+`<div class="detail-body">${scopeNotice()}<div class="summary-grid">${summaryBox('Töid',baseWorkorders.length)}${summaryBox('Avatud',baseWorkorders.filter(w=>!isCompletedStatus(w.status)).length)}${summaryBox('Lõpetatud',baseWorkorders.filter(w=>isCompletedStatus(w.status)).length)}${summaryBox('Aktid',scopedActs().length)}</div>${table(['Töö','Aeg','Klient','Objekt','Projekt','Vastutaja / osalejad','Staatus','Workflow','Omadused'],rows)}</div>`;
  shell(main,detailOpen.workorders?workorderDetailHtml():''); $('#woSearch')?.addEventListener('input',renderWorkorders); bindEmployeeMultiFilter('workorders',renderWorkorders); $('#woStatusFilter')?.addEventListener('change',renderWorkorders);
  $$('[data-workorder-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.workorderId; if(detailOpen.workorders&&selectedWorkorderId===id){detailOpen.workorders=false;}else{selectedWorkorderId=id;detailOpen.workorders=true;} renderWorkorders();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedWorkorderId=state.workorders[0]?.id||'';detailOpen.workorders=false;renderWorkorders();}); $('#newWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal()); bindWorkorderDetail();
}
function workorderDetailHtml(){
  const w=byId(state.workorders,selectedWorkorderId); if(!w) return detailHeader('Töö detail')+`<div class="detail-body"><span class="muted">Vali töö.</span></div>`;
  const acts=(state.acts||[]).filter(a=>a.workorderId===w.id);
  const activeAct=activeActForWorkorder(w.id);
  const archivedAct=archivedActForWorkorder(w.id);
  const actState=activeAct?'Aktiivne':(archivedAct?'Akt arhiveeritud':'Akt puudub');
  const workSections=`<div class="section-title">Kirjeldus</div><div class="muted">${esc(problemDescriptionText(w)||'-')}</div><div class="section-title">Teostatud tööd</div><div class="muted workorder-result-text">${esc(performedWorkText(w)||completionCommentText(w)||'-')}</div><div class="section-title">Töö tulemus / märkused</div><div class="muted workorder-result-text">${esc(workResultText(w)||'-')}</div><div class="section-title">Soovitused / puudused</div><div class="muted workorder-result-text">${esc(workRecommendationsText(w)||'-')}</div>`;
  const body=`<div class="summary-grid">${summaryBox('Pilte',workorderPhotos(w.id).length)}${summaryBox('Aktid',acts.length)}${summaryBox('Kuupäev',fmtActDate(w.date))}${summaryBox('Staatus',w.status)}</div>${card(w.title,[['Klient',clientName(objectClientId(w.objectId))],['Objekt',workorderObjectLabel(w)],['Projekt',projectName(w.projectId)],['Workflow',taskWorkflowLabel(w)],['Omadused',taskPropertiesSummary(w)],['Vastutaja',techName(workorderResponsibleId(w))],['Osalejad',workorderParticipantIds(w).map(techName).join(', ')||'-'],['Aeg',`${fmtActDate(w.date)} ${w.time}`],['Akt vajalik',workorderActRequired(w)?'Jah':'Ei'],['Akti seis',actState]],w.status,workSections)}${workorderPhotoGalleryHtml(w.id,{hint:'Pildid on seotud tööga. Märge “Lisa hiljem aktile” võimaldab need hiljem akti kaasa võtta.'})}<div class="section-title">Aktid</div><div class="list">${acts.map(a=>`<div class="event-row"><strong>${esc(fmtActDate(a.date))} · ${esc(a.title)}</strong><span class="status ${statusClass(a.status)}">${esc(a.archived?'Arhiivis':a.status)}</span></div>`).join('')||'<span class="muted">Akte pole.</span>'}</div>`;
  const completed=isCompletedStatus(w.status);
  const actButtonLabel=activeAct?'Ava akt':(archivedAct?'Taasta akt':'＋ Loo akt');
  const actButtonClass=archivedAct?'btn small warn':'btn small primary';
  const actActions=completed?`<button class="${actButtonClass}" id="createActBtn">${actButtonLabel}</button>${(activeAct||archivedAct)?'<button class="btn small" id="previewWorkorderActBtn" type="button">👁 Eelvaade</button><button class="btn small" id="printWorkorderActBtn" type="button">⎙ Prindi</button><button class="btn small" id="pdfWorkorderActBtn" type="button">⇩ Salvesta PDF</button>':''}`:'';
  return detailHeader('Töö detail',`<button class="btn small" id="editWorkorderBtn">✎ Muuda</button><button class="btn small" id="copyWorkorderDetailBtn" type="button">⧉ Kopeeri</button>${actActions}<button class="btn small ghost" id="workorderDetailCloseBtn" type="button">× Sulge</button>`)+`<div class="detail-body">${body}</div>`;
}
function bindWorkorderDetail(){
  $('#editWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal(selectedWorkorderId));
  $('#copyWorkorderDetailBtn')?.addEventListener('click',()=>openWorkorderCopyModal(selectedWorkorderId));
  $('#createActBtn')?.addEventListener('click',()=>{
    const archived=archivedActForWorkorder(selectedWorkorderId);
    if(archived){ restoreAct(archived.id); selectedActId=archived.id; window.location.href=pageFiles.acts; return; }
    const a=generateActFromWorkorder(selectedWorkorderId);
    if(a){ selectedActId=a.id; window.location.href=pageFiles.acts; }
  });
  $('#previewWorkorderActBtn')?.addEventListener('click',()=>openWorkorderActPrint(selectedWorkorderId));
  $('#printWorkorderActBtn')?.addEventListener('click',()=>{const a=ensureActForWorkorder(selectedWorkorderId); if(a) printAct(a.id);});
  $('#pdfWorkorderActBtn')?.addEventListener('click',()=>{const a=ensureActForWorkorder(selectedWorkorderId); if(a) saveActPdf(a.id);});
  $('#workorderDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.workorders=false;renderWorkorders();});
  bindWorkorderPhotos(renderWorkorders);
  // Photos are loaded on demand/upload. Do not refresh here: repeated async refresh caused
  // the workorders detail panel to rerender continuously and made row clicks appear dead.
}
function workorderCopyDefaults(source){
  if(!source) return {};
  let nextDate=source.date||dateKeyFromDate(new Date());
  try{ nextDate=dateKeyFromDate(addDateDays(parseDateKey(nextDate),1)); }catch(_){ nextDate=source.date||dateKeyFromDate(new Date()); }
  const responsibleId=workorderResponsibleId(source);
  return {
    copiedFromId:source.id,
    projectId:source.projectId||'',
    objectId:source.objectId||'',
    title:source.title||'',
    date:nextDate,
    time:source.time||'09:00',
    responsibleTechnicianId:responsibleId,
    technicianId:responsibleId,
    participantTechnicianIds:workorderParticipantIds(source).filter(id=>id&&id!==responsibleId),
    status:'Planeeritud',
    description:source.problemDescription||source.description||'',
    problemDescription:source.problemDescription||source.description||'',
    performedWork:source.performedWork||source.workPerformed||'',
    workResult:source.workResult||'',
    recommendations:source.recommendations||'',
    materials:source.materials||'',
    plannedHours:workorderHours(source),
    durationHours:workorderHours(source),
    hours:workorderHours(source)
  };
}
function openWorkorderCopyModal(id){
  const source=byId(state.workorders,id);
  if(!source) return;
  openWorkorderModal('',workorderCopyDefaults(source));
}
function shouldEditCompletionInWorkorder(w){
  // CR-WO-003: teostatud tööde väljad peavad olema täidetavad juba töö täitmise vaates.
  // Kui tööl on akt juba loodud, jääb sisu muutmine akti vaatesse, et töö ja akt ei läheks lahku.
  return !!(w && !actForWorkorder(w.id));
}
function workorderActEditNotice(w){
  const info=calendarActState(w);
  if(!isCompletedStatus(w?.status) || info.state==='missing') return '';
  const text=info.state==='archived'
    ? 'Selle töö akt on arhiivis. Töö sisutekste muuda pärast akti taastamist akti vaates.'
    : 'Selle töö akt on juba loodud. Teostatud tööd, tulemused, soovitused ja materjalid muuda akti vaates.';
  return `<div class="full card soft-warning"><strong>Töö sisu on seotud aktiga</strong><span class="muted">${esc(text)}</span></div>`;
}
function workorderCompletedWorkAdminHtml(w){
  if(!w || !isCompletedStatus(w.status)) return '';
  const performed=performedWorkText(w)||completionCommentText(w)||'';
  const result=workResultText(w);
  const recommendations=workRecommendationsText(w);
  const materials=workMaterialsText(w);
  return `<div class="full admin-completed-work-card"><div class="section-title">Teostatud töö</div><div class="admin-completed-work-text">${esc(performed||'Teostatud töö kirjeldus puudub.').replace(/\n/g,'<br>')}</div>${result?`<div class="section-title small">Töö tulemus / märkused</div><div class="muted preline">${esc(result)}</div>`:''}${recommendations?`<div class="section-title small">Soovitused / puudused</div><div class="muted preline">${esc(recommendations)}</div>`:''}${materials?`<div class="section-title small">Materjalid</div><div class="muted preline">${esc(materials)}</div>`:''}</div>`;
}
function openMissingWorkorderModal(id='',source='calendar'){
  const safeId=String(id||'').trim();
  openModal(`<div class="dialog-head"><h2>Vigane kalendrikirje</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="card warn-card"><strong>Seotud tööd ei leitud.</strong><span class="muted">See võib juhtuda, kui väljakutse/töö on juba kustutatud, aga vana kalendrivaade on veel ekraanil või brauseri vahemälus.</span></div><div class="card"><strong>Tehniline info</strong><span class="muted">Allikas: ${esc(source||'calendar')} · ID: ${esc(safeId||'-')}</span></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Sulge</button><button type="button" class="btn primary" id="removeBrokenCalendarBtn">Eemalda kalendrist</button></div>`);
  bindClose();
  document.getElementById('removeBrokenCalendarBtn')?.addEventListener('click',()=>{
    if(safeId){
      state.workorders=(state.workorders||[]).filter(w=>String(w.id)!==safeId);
      try{window.VECO_STORAGE.save(state);}catch(_){/* ignore */}
    }
    closeModal();
    if(page==='calendar') renderCalendar();
  });
}
function openWorkorderModal(id='',defaults={}){
  const isEdit=!!id;
  const existing=isEdit?byId(state.workorders,id):null;
  if(isEdit && !existing){ openMissingWorkorderModal(id,defaults.source||'openWorkorderModal'); return; }
  const w=existing||{
    projectId:defaults.projectId||'',objectId:defaults.objectId||'',title:defaults.title||'',
    date:defaults.date||'',time:defaults.time||'',
    technicianId:defaults.technicianId||defaults.responsibleTechnicianId||'',responsibleTechnicianId:defaults.responsibleTechnicianId||defaults.technicianId||'',participantTechnicianIds:defaults.participantTechnicianIds||[],status:defaults.status||'Planeeritud',description:defaults.description||'',problemDescription:defaults.problemDescription||defaults.description||'',performedWork:defaults.performedWork||'',workResult:defaults.workResult||'',recommendations:defaults.recommendations||'',materials:defaults.materials||'',
    plannedHours:defaults.plannedHours||2,durationHours:defaults.durationHours||2,hours:defaults.hours||2,
    actRequired:defaults.actRequired!==undefined?defaults.actRequired:undefined,requiresAct:defaults.requiresAct,isBillable:defaults.isBillable,trackTime:defaults.trackTime,usesMaterials:defaults.usesMaterials,requiresSignature:defaults.requiresSignature,workflow:defaults.workflow||defaults.workflowType||'kontroll'
  };
  const currentObject=byId(state.objects,w.objectId)||null;
  const currentClient=byId(state.clients,currentObject?.clientId)||null;
  const currentProject=byId(state.projects,w.projectId)||null;
  const currentHours=workorderHours(w);
  const objectOptions=activeObjects().map(o=>`<option value="${esc(o.name)}" label="${esc(clientName(o.clientId))} · ${esc(o.address||'')}"></option>`).join('');
  const clientOptions=activeClients().map(c=>`<option value="${esc(c.name)}" label="${esc(c.contact||'')}"></option>`).join('');
  const projectOptions=state.projects.map(p=>`<option value="${esc(p.name)}" label="${esc(objectName(p.objectId))}"></option>`).join('');
  const responsibleId=workorderResponsibleId(w);
  const participantIds=workorderParticipantIds(w);
  const participantJson=esc(JSON.stringify(participantIds));
  const title=isEdit?`Töö ${esc(w.id)}`:(defaults.copiedFromId?`Kopeeri töö`:'Lisa töö');
  const workflowValue=taskWorkflowValue(w);
  openModal(`<form id="workorderForm"><div class="dialog-head"><h2>${title}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid">
    <label class="full">Töö nimetus<input class="field" name="title" required placeholder="Kirjuta töö nimetus..." value="${esc(w.title)}"></label>
    <label>Klient<input class="field" name="clientName" list="clientOptions" placeholder="Vali või otsi klient..." value="${esc(currentClient?.name||'')}"><datalist id="clientOptions">${clientOptions}</datalist></label>
    <label>Objekt<input class="field" name="objectName" list="objectOptions" placeholder="Vali või otsi objekt..." value="${esc(currentObject?.name||'')}" required><datalist id="objectOptions">${objectOptions}</datalist></label>
    <label>Projekt<input class="field" name="projectName" list="projectOptions" placeholder="Vali projekt või jäta tühjaks..." value="${esc(currentProject?.name||'')}"><datalist id="projectOptions">${projectOptions}</datalist></label>
    <label>Vastutaja<select class="select" name="responsibleTechnicianId"><option value="">Vali vastutaja...</option>${state.people.map(p=>`<option value="${p.id}" ${responsibleId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
    <label>Osalejad<div class="participant-picker" id="workorderParticipantPicker" data-selected="${participantJson}"><div class="participant-chips" id="participantChips"></div><div class="participant-add-row"><button type="button" class="btn small" id="addParticipantBtn">＋ Lisa osaleja</button><input class="field participant-search hidden" id="participantSearch" type="search" placeholder="Otsi tehnikut..." autocomplete="off"></div><div class="participant-dropdown hidden" id="participantDropdown"></div><input type="hidden" name="participantTechnicianIds" value="${participantIds.join(',')}"></div><span class="muted">Valitud osalejad kuvatakse loendina. Vastutajat osalejaks ei lisata.</span></label>
    <label>Workflow<select class="select" name="workflow">${taskWorkflowOptions.map(x=>`<option value="${esc(x.value)}" ${workflowValue===x.value?'selected':''}>${esc(x.label)}</option>`).join('')}</select></label>
    <label>Staatus<select class="select" name="status">${workorderStatusOptions.map(s=>`<option ${w.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
    <div class="full task-properties-grid"><label class="check-card"><input type="checkbox" name="actRequired" ${workorderActRequired(w)?'checked':''}> <span>Vajab akti</span><small>Kui märgitud, tuleb töö lõpetamiseks koostada akt.</small></label><label class="check-card"><input type="checkbox" name="isBillable" ${taskBillable(w)?'checked':''}> <span>Arveldatav</span></label><label class="check-card"><input type="checkbox" name="trackTime" ${taskTrackTime(w)?'checked':''}> <span>Tööaja arvestus</span></label><label class="check-card"><input type="checkbox" name="usesMaterials" ${taskUsesMaterials(w)?'checked':''}> <span>Materjalid</span></label><label class="check-card"><input type="checkbox" name="requiresSignature" ${taskRequiresSignature(w)?'checked':''}> <span>Kliendi allkiri</span></label></div>
    <label>Kuupäev<input class="field" name="date" type="date" value="${esc(w.date)}"></label>
    <label>Algusaeg<input class="field" name="time" type="time" value="${esc(w.time)}"></label>
    <label>Kestus<div class="unit-field"><input class="field" name="plannedHours" type="number" min="1" max="16" step="1" value="${esc(currentHours)}"><span>h</span></div></label>
    <label class="full">Probleemi kirjeldus<textarea name="description" placeholder="Kirjelda kliendi pöördumist, probleemi või töö põhjust...">${esc(problemDescriptionText(w))}</textarea></label>
    ${isEdit&&!shouldEditCompletionInWorkorder(w)?workorderCompletedWorkAdminHtml(w):''}
    ${isEdit&&shouldEditCompletionInWorkorder(w)?`<label class="full">Teostatud tööd<textarea name="completionComment" placeholder="Kirjelda, mida tehnik objektil tegi...">${esc(performedWorkText(w))}</textarea></label><label class="full">Töö tulemus / märkused<textarea name="workResult" placeholder="Kirjelda tulemus või seis lahkumisel...">${esc(workResultText(w))}</textarea></label><label class="full">Soovitused / puudused<textarea name="recommendations" placeholder="Lisa puudused või soovitused...">${esc(workRecommendationsText(w))}</textarea></label><label class="full">Materjalid<textarea name="materials" placeholder="Lisa kasutatud materjalid...">${esc(workMaterialsText(w))}</textarea></label>`:''}
    ${isEdit?workorderActEditNotice(w):''}
    ${isEdit?workorderActPanelHtml(w):''}
    ${isEdit?`<div class="full workorder-modal-photos" data-workorder-modal-photo-wrap="${esc(w.id)}">${workorderPhotoGalleryHtml(w.id,{hint:'Admin näeb siin tehniku lisatud pilte. Märge “Lisa hiljem aktile” võimaldab need hiljem akti kaasa võtta.'})}</div>`:''}
    ${defaults.copiedFromId?`<div class="full muted">Kopeeritakse töö ${esc(defaults.copiedFromId)}. Muuda kuupäeva, vastutajat, osalejaid või aega enne salvestamist.</div>`:(!isEdit?'<div class="full muted">Uue töö loomisel klienti, objekti, projekti ega tehnikut automaatselt ei valita. Kuupäev ja kell võivad tulla kalendris klikitud ajast.</div>':'')}
  </div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn">Sulge</button>${isEdit?'<button type="button" class="btn" id="copyWorkorderBtn">⧉ Kopeeri</button><button type="button" class="btn danger" id="deleteWorkorderBtn">Kustuta</button>':''}<button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  if(isEdit) bindWorkorderActPanel(w);
  const refreshWorkorderModalPhotos=()=>{
    const wrap=document.querySelector(`[data-workorder-modal-photo-wrap="${CSS.escape(w.id)}"]`);
    if(!wrap) return;
    wrap.innerHTML=workorderPhotoGalleryHtml(w.id,{hint:'Admin näeb siin tehniku lisatud pilte. Märge “Lisa hiljem aktile” võimaldab need hiljem akti kaasa võtta.'});
    bindWorkorderPhotos(refreshWorkorderModalPhotos);
  };
  if(isEdit){
    bindWorkorderPhotos(refreshWorkorderModalPhotos);
    loadWorkorderPhotos(w.id,true).then(()=>{
      if(document.querySelector('#workorderForm')) refreshWorkorderModalPhotos();
    }).catch(err=>console.warn('VECO workorder modal photo refresh failed',err));
  }
  const form=$('#workorderForm');
  const participantPicker=$('#workorderParticipantPicker');
  let selectedParticipants=[];
  try{ selectedParticipants=JSON.parse(participantPicker?.dataset.selected||'[]'); }catch(_){ selectedParticipants=[]; }
  const syncParticipants=()=>{
    const resp=form.elements.responsibleTechnicianId?.value||'';
    selectedParticipants=Array.from(new Set(selectedParticipants.filter(id=>id&&id!==resp)));
    form.elements.participantTechnicianIds.value=selectedParticipants.join(',');
  };
  const renderParticipantPicker=()=>{
    if(!participantPicker) return;
    syncParticipants();
    const chips=$('#participantChips');
    const dropdown=$('#participantDropdown');
    const search=$('#participantSearch');
    if(chips){
      chips.innerHTML=selectedParticipants.map(id=>`<span class="participant-chip">${esc(techName(id))}<button type="button" data-remove-participant="${esc(id)}" title="Eemalda">×</button></span>`).join('')||'<span class="muted">Osalejaid pole lisatud.</span>';
    }
    const q=(search?.value||'').trim().toLowerCase();
    const resp=form.elements.responsibleTechnicianId?.value||'';
    const candidates=state.people.filter(p=>p.id!==resp&&!selectedParticipants.includes(p.id)).filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.role||'').toLowerCase().includes(q));
    if(dropdown){
      dropdown.innerHTML=candidates.length?candidates.map(p=>`<button type="button" class="participant-option" data-add-participant="${esc(p.id)}"><strong>${esc(p.name)}</strong><span>${esc(p.role||'Tehnik')}</span></button>`).join(''):'<div class="participant-empty">Sobivaid tehnikuid ei ole.</div>';
    }
  };
  const openParticipantSearch=()=>{
    $('#participantSearch')?.classList.remove('hidden');
    $('#participantDropdown')?.classList.remove('hidden');
    $('#participantSearch')?.focus();
    renderParticipantPicker();
  };
  $('#addParticipantBtn')?.addEventListener('click',openParticipantSearch);
  $('#participantSearch')?.addEventListener('input',renderParticipantPicker);
  form.elements.responsibleTechnicianId?.addEventListener('change',renderParticipantPicker);
  participantPicker?.addEventListener('click',e=>{
    const add=e.target.closest('[data-add-participant]');
    const remove=e.target.closest('[data-remove-participant]');
    if(add){ selectedParticipants.push(add.dataset.addParticipant); $('#participantSearch').value=''; renderParticipantPicker(); openParticipantSearch(); }
    if(remove){ selectedParticipants=selectedParticipants.filter(id=>id!==remove.dataset.removeParticipant); renderParticipantPicker(); }
  });
  function closeParticipantSearch(){
    $('#participantDropdown')?.classList.add('hidden');
    $('#participantSearch')?.classList.add('hidden');
  }
  document.addEventListener('pointerdown',function participantOutsideHandler(e){
    if(!document.body.contains(participantPicker)){ document.removeEventListener('pointerdown',participantOutsideHandler,true); return; }
    if(participantPicker&&!participantPicker.contains(e.target)) closeParticipantSearch();
  },true);
  document.addEventListener('keydown',function participantEscHandler(e){
    if(!document.body.contains(participantPicker)){ document.removeEventListener('keydown',participantEscHandler,true); return; }
    if(e.key==='Escape') closeParticipantSearch();
  },true);
  renderParticipantPicker();
  const resolveObject=()=>{
    const rawObject=form.elements.objectName.value.trim();
    const objectText=rawObject.toLowerCase();
    const rawClient=form.elements.clientName.value.trim();
    const clientText=rawClient.toLowerCase();
    if(!objectText) return null;
    let client=clientText
      ? (activeClients().find(c=>String(c.name||'').toLowerCase()===clientText)||activeClients().find(c=>String(c.name||'').toLowerCase().includes(clientText)))
      : null;
    if(!client && rawClient){
      client={
        id:uid('C'),
        name:rawClient,
        regNo:'',
        contact:'',
        phone:'',
        email:'',
        invoiceEmail:'',
        active:true,
        notes:'Lisatud töö loomisel.'
      };
      state.clients.push(client);
    }
    let candidates=activeObjects();
    if(client){
      const scoped=activeObjects().filter(o=>o.clientId===client.id);
      if(scoped.length) candidates=scoped;
    }
    let obj=candidates.find(o=>String(o.name||'').toLowerCase()===objectText)
      || candidates.find(o=>String(o.name||'').toLowerCase().includes(objectText))
      || activeObjects().find(o=>String(o.name||'').toLowerCase()===objectText);
    if(obj){
      if(client && !obj.clientId){ obj.clientId=client.id; }
      return obj;
    }
    obj={
      id:uid('O'),
      clientId:client?.id||'',
      name:rawObject,
      address:'',
      mainContact:'',
      responsibleTechId:form.elements.responsibleTechnicianId?.value||'',
      contract:'',
      status:'active',
      notes:'Lisatud kalendri töö loomisel.',
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
  const refreshObjectOptionsForClient=(opts={})=>{
    const clientText=form.elements.clientName.value.trim().toLowerCase();
    const client=activeClients().find(c=>c.name.toLowerCase()===clientText);
    const dl=document.getElementById('objectOptions');
    if(!dl) return;
    if(client){
      const filteredObjects=activeObjects().filter(o=>o.clientId===client.id);
      dl.innerHTML=filteredObjects.map(o=>`<option value="${esc(o.name)}" label="${esc(o.address||'')}"></option>`).join('');
      const objectText=form.elements.objectName.value.trim().toLowerCase();
      const selectedObject=activeObjects().find(o=>o.name.toLowerCase()===objectText);
      if(!opts.keepObject && selectedObject && selectedObject.clientId!==client.id){
        form.elements.objectName.value='';
        if(form.elements.projectName) form.elements.projectName.value='';
      }
    }else{
      dl.innerHTML=objectOptions;
    }
  };
  const syncClientFromObject=()=>{
    const objectText=form.elements.objectName.value.trim().toLowerCase();
    if(!objectText) return;
    const obj=activeObjects().find(o=>o.name.toLowerCase()===objectText)||activeObjects().find(o=>o.name.toLowerCase().includes(objectText));
    if(!obj) return;
    const client=byId(state.clients,obj.clientId);
    if(client){
      form.elements.clientName.value=client.name;
      refreshObjectOptionsForClient({keepObject:true});
    }
  };
  form.elements.clientName?.addEventListener('input',()=>refreshObjectOptionsForClient());
  form.elements.clientName?.addEventListener('change',()=>refreshObjectOptionsForClient());
  form.elements.objectName?.addEventListener('input',syncClientFromObject);
  form.elements.objectName?.addEventListener('change',syncClientFromObject);
  refreshObjectOptionsForClient({keepObject:true});
  $('#copyWorkorderBtn')?.addEventListener('click',()=>{
    if(!existing) return;
    openWorkorderCopyModal(existing.id);
  });
  $('#deleteWorkorderBtn')?.addEventListener('click',async()=>{
    if(!existing) return;
    const ok=await openVecoConfirm({
      title:'Kustuta töö',
      message:'Kas soovid selle töö kustutada?',
      details:`<strong>${esc(existing.id)}</strong><br>${esc(objectName(existing.objectId))}<br>${esc(existing.title)}`,
      confirmText:'Arhiveeri',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    await deleteWorkorderCascade(existing.id);
    closeModal();
    if(page==='calendar') renderCalendar(); else if(page==='projects') renderProjects(); else if(page==='objects') renderObjects(); else if(page==='callouts') renderCallouts(); else renderWorkorders();
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
      participantTechnicianIds:String(f.participantTechnicianIds?.value||'').split(',').map(x=>x.trim()).filter(id=>id&&id!==f.responsibleTechnicianId.value),
      status:nextStatus,
      workflow:f.workflow?.value||'kontroll',
      workflowType:f.workflow?.value||'kontroll',
      actRequired:!!f.actRequired?.checked,
      requiresAct:!!f.actRequired?.checked,
      isBillable:!!f.isBillable?.checked,
      trackTime:!!f.trackTime?.checked,
      usesMaterials:!!f.usesMaterials?.checked,
      requiresSignature:!!f.requiresSignature?.checked,
      description:f.description.value,
      problemDescription:f.description.value,
      performedWork:existing?.performedWork||existing?.workPerformed||'',
      workResult:existing?.workResult||'',
      recommendations:existing?.recommendations||'',
      materials:existing?.materials||'',
      copiedFromWorkorderId:defaults.copiedFromId||'',
      plannedHours:hours,
      durationHours:hours,
      hours:hours
    };
    if(isCompletedStatus(nextStatus) && !isCompletedStatus(previousStatus)){
      const result=normalizeCompletionResult(await openCompletionCommentModal(next,completionCommentText(existing)));
      if(!result) return;
      next.completedAt=new Date().toISOString();
      next.completedBy=completedByLabel(next);
      next.completionComment=result.comment;
      next.done=result.comment;
      next.workDone=result.comment;
      next.performedWork=result.performedWork||result.comment;
      next.workResult=result.workResult||'';
      next.recommendations=result.recommendations||'';
      next.materials=result.materials||'';
      next.actType=result.actType;
    }else if(isCompletedStatus(nextStatus) && isEdit){
      const currentComment=String(f.completionComment?.value||completionCommentText(existing)||'').trim();
      if(!currentComment){
        const result=normalizeCompletionResult(await openCompletionCommentModal(next,''));
        if(!result) return;
        next.completionComment=result.comment;
        next.done=result.comment;
        next.workDone=result.comment;
        next.performedWork=result.performedWork||result.comment;
        next.workResult=result.workResult||'';
        next.recommendations=result.recommendations||'';
        next.materials=result.materials||'';
        next.actType=result.actType;
      }else{
        next.completionComment=currentComment;
        next.done=currentComment;
        next.workDone=currentComment;
        next.performedWork=String(f.completionComment?.value||existing?.performedWork||existing?.workPerformed||currentComment||'').trim();
        next.workResult=String(f.workResult?.value||existing?.workResult||'').trim();
        next.recommendations=String(f.recommendations?.value||existing?.recommendations||'').trim();
        next.materials=String(f.materials?.value||existing?.materials||'').trim();
      }
      next.completedAt=existing.completedAt||new Date().toISOString();
      next.completedBy=existing.completedBy||completedByLabel(next);
    }else{
      next.completedAt=existing?.completedAt||'';
      next.completedBy=existing?.completedBy||'';
      next.completionComment=existing?.completionComment||existing?.done||existing?.workDone||'';
      next.done=existing?.done||existing?.workDone||next.completionComment||'';
      next.workDone=next.done;
      next.performedWork=existing?.performedWork||existing?.workPerformed||'';
      next.workResult=existing?.workResult||'';
      next.recommendations=existing?.recommendations||'';
      next.materials=existing?.materials||'';
    }
    next.updatedAt=new Date().toISOString();
    next.updated_at=next.updatedAt;
    if(!next.title.trim()){ alert('Töö nimetus on kohustuslik.'); f.title.focus(); return; }
    if(!next.objectId){ alert('Objekt on kohustuslik.'); f.objectName.focus(); return; }
    if(!next.date){ alert('Kuupäev on kohustuslik.'); f.date.focus(); return; }
    if(!next.time){ alert('Algusaeg on kohustuslik.'); f.time.focus(); return; }
    const previousWorkorder=isEdit?{...existing,participantTechnicianIds:[...(existing.participantTechnicianIds||[])]}:null;
    if(isEdit){Object.assign(existing,next)}else{state.workorders.push(next);selectedWorkorderId=next.id;detailOpen.workorders=true}
    save();
    if(isCompletedStatus(next.status) && workorderActRequired(next) && !actForWorkorder(next.id)){ ensureActForWorkorder(next.id); }
    closeModal();
    if(page==='calendar') refreshCalendarAfterWorkorderSave(previousWorkorder||next,next); else if(page==='projects') renderProjects(); else if(page==='objects') renderObjects(); else renderWorkorders();
  });
}

async function deleteWorkorderCascade(workorderId){
  if(!isStoredWorkorderId(workorderId)) return false;
  const key=photoWorkorderDbId(workorderId);
  const now=new Date().toISOString();
  state.photos=(state.photos||[]).map(p=>{
    if(p.workorderId===key || p.workorderNo===workorderId){ return {...p,deletedAt:p.deletedAt||now}; }
    return p;
  });
  state.acts=(state.acts||[]).map(a=>a.workorderId===workorderId ? {...a,archived:true,archivedAt:a.archivedAt||now,status:a.status==='Allkirjastatud'?a.status:'Arhiveeritud'} : a);
  state.workorders=(state.workorders||[]).filter(x=>x.id!==workorderId);
  window.VECO_STORAGE.save(state);
  try{
    const client=vecoSupabaseClient();
    if(client){
      await client.from('photos').update({deleted_at:now}).eq('workorder_id',key);
    }
  }catch(err){console.warn('VECO photo cleanup failed',err);}
  if(window.VECO_API?.deleteWorkorder) await window.VECO_API.deleteWorkorder(workorderId);
  return true;
}
function calendarLayoutKey(w={}){
  return [w.date||'', w.time||'', workorderHours(w), workorderEndDate(w), workorderResponsibleId(w), String(w.status||'')].join('|');
}
function refreshCalendarCardDom(w){
  if(page!=='calendar' || !w?.id) return false;
  const btn=document.querySelector(`[data-calendar-edit="${CSS.escape(String(w.id))}"]`);
  if(!btn) return false;
  const objectText=objectName(w.objectId);
  const titleText=(w.title||objectText||'Töö').trim();
  const duration=workorderHours(w);
  const endTime=workorderEndTime(w,22);
  btn.title=workorderCalendarTitle(w);
  btn.className=btn.className.replace(/calendar-status-[^\s]+/g,'').trim()+` calendar-status-${statusSlug(w.status)}`;
  const head=btn.querySelector('.calendar-event-head');
  if(head){
    const strong=head.querySelector('strong');
    if(strong) strong.innerHTML=`<b class="calendar-start-time">${esc(w.time||'')}</b> · ${esc(objectText)}`;
    const em=head.querySelector('em');
    if(em){ em.className=`status ${statusClass(w.status)}`; em.textContent=w.status||''; }
  }
  const workTitle=btn.querySelector('.calendar-work-title');
  if(workTitle) workTitle.textContent=titleText;
  const peopleNode=btn.querySelector('.calendar-people');
  const peopleHtml=workorderCalendarPeopleHtml(w);
  if(peopleNode){
    const tmp=document.createElement('div'); tmp.innerHTML=peopleHtml;
    peopleNode.replaceWith(tmp.firstElementChild || document.createTextNode(''));
  }
  const dur=btn.querySelector('.calendar-duration'); if(dur) dur.textContent=`${duration} h`;
  const end=btn.querySelector('.calendar-end-time'); if(end) end.textContent=endTime;
  const oldBadge=btn.querySelector('.calendar-act-badge');
  const badgeHtml=calendarActBadgeHtml(w);
  if(oldBadge){
    if(badgeHtml){ const tmp=document.createElement('div'); tmp.innerHTML=badgeHtml; oldBadge.replaceWith(tmp.firstElementChild); }
    else oldBadge.remove();
  }else if(badgeHtml){
    const tmp=document.createElement('div'); tmp.innerHTML=badgeHtml;
    const after=btn.querySelector('.calendar-event-head');
    if(after&&tmp.firstElementChild) after.insertAdjacentElement('afterend',tmp.firstElementChild);
  }
  return true;
}
function refreshCalendarAfterWorkorderSave(previous,next){
  if(page!=='calendar') return false;
  if(calendarLayoutKey(previous)!==calendarLayoutKey(next)){
    renderCalendar();
    return true;
  }
  if(refreshCalendarCardDom(next)){
    // CR-RENDER-002: content-only save must not trigger layout recalculation.
    // Re-running responsive layout after every field edit causes a visible micro-flicker.
    return true;
  }
  renderCalendar();
  return true;
}

function calendarVisibleWorkorders(data=state){
  try{
    const storedDate=localStorage.getItem('veco_calendar_week')||weekStartKeyFrom('');
    const mode=$('#calendarViewMode')?.value||localStorage.getItem('veco_calendar_view')||'week';
    const hideWeekend=(localStorage.getItem('veco_calendar_hide_weekend')||'false')==='true';
    const statusFilter=$('#calendarStatusFilter')?.value||'all';
    const scopedId=scopedPersonId();
    const techFilter=scopedId?[scopedId]:employeeFilterSelected('calendar');
    const visibleDays=calendarVisibleDays(storedDate,mode,hideWeekend);
    const occurs=(w,date)=>{const start=w.date; const end=w.endDate||w.end_date||w.date; return !!start && date>=start && date<=end;};
    const dateInView=(w)=> mode==='year' ? (w.date&&w.date.startsWith(String(parseDateKey(storedDate).getFullYear())+'-')) : visibleDays.some(d=>occurs(w,d));
    return (data?.workorders||[]).filter(isRenderableWorkorder).filter(w=>{
      const statusOk=statusFilter==='all'||(statusFilter==='open'?workorderStatusOptions.includes(w.status):w.status===statusFilter);
      return dateInView(w) && employeeFilterMatchesWorkorder(w,techFilter) && statusOk;
    });
  }catch(e){
    return [];
  }
}
function patchCalendarFromRemote(previousData,nextData){
  if(page!=='calendar') return false;
  const grid=document.querySelector('.calendar-planner-grid');
  if(!grid) return false;
  const prevRows=calendarVisibleWorkorders(previousData);
  const nextRows=calendarVisibleWorkorders(nextData);
  const prevIds=new Set(prevRows.map(w=>String(w.id)));
  const nextIds=new Set(nextRows.map(w=>String(w.id)));
  if(prevIds.size!==nextIds.size) return false;
  for(const id of prevIds){ if(!nextIds.has(id)) return false; }
  const prevById=new Map(prevRows.map(w=>[String(w.id),w]));
  for(const next of nextRows){
    const prev=prevById.get(String(next.id));
    if(!prev) return false;
    if(calendarLayoutKey(prev)!==calendarLayoutKey(next)) return false;
    if(!document.querySelector(`[data-calendar-edit="${CSS.escape(String(next.id))}"]`)) return false;
  }
  nextRows.forEach(w=>refreshCalendarCardDom(w));
  return true;
}


function actForWorkorder(workorderId){
  return activeActForWorkorder(workorderId)||archivedActForWorkorder(workorderId)||null;
}
function activeActForWorkorder(workorderId){
  return activeActs().find(a=>a.workorderId===workorderId)||null;
}
function archivedActForWorkorder(workorderId){
  return archivedActs().find(a=>a.workorderId===workorderId)||null;
}
function calendarActState(w){
  // Variant A: akt kuulub ainult lõpetatud töö juurde. Planeeritud/Töös töödel ei kuvata akti ega akti ikooni, isegi kui vanast andmest on actId/akt olemas.
  if(!isCompletedStatus(w?.status)) return {state:'none',act:null,icon:'',label:''};
  const active=activeActForWorkorder(w.id);
  if(active) return {state:'active',act:active,icon:active.status==='Allkirjastatud'?'✅📄':'📄',label:active.status||'Akt olemas'};
  const archived=archivedActForWorkorder(w.id);
  if(archived) return {state:'archived',act:archived,icon:'🗄️📄',label:'Akt arhiveeritud'};
  return {state:'missing',act:null,icon:'',label:'Akt puudub'};
}
function calendarActBadgeHtml(w){
  const info=calendarActState(w);
  if(!info.icon) return '';
  return `<span class="calendar-act-badge calendar-act-${esc(info.state)}" title="${esc(info.label)}" aria-label="${esc(info.label)}">${esc(info.icon)}</span>`;
}
function workorderActPanelHtml(w){
  const info=calendarActState(w);
  if(info.state==='active'&&info.act){
    return `<div class="calendar-act-panel full"><div class="section-title">Akt</div><div class="card"><div class="card-top"><h3>${esc(info.act.title||'Väljakutse akt')}</h3><span class="status ${statusClass(info.act.status)}">${esc(info.act.status||'Mustand')}</span></div><div class="muted">${esc(fmtActDate(info.act.date||w.date))} · ${esc(actNumber(info.act))}</div><div class="actions"><button class="btn" type="button" id="calendarPreviewActBtn">👁 Ava eelvaade</button><button class="btn" type="button" id="calendarDownloadActBtn">⇩ Laadi PDF</button><button class="btn" type="button" id="calendarEditActBtn">✎ Muuda akti</button></div></div></div>`;
  }
  if(info.state==='archived'&&info.act){
    return `<div class="calendar-act-panel full"><div class="section-title">Akt</div><div class="card"><div class="card-top"><h3>${esc(info.act.title||'Väljakutse akt')}</h3><span class="status warn">Arhiivis</span></div><div class="muted">${esc(fmtActDate(info.act.date||w.date))} · ${esc(actNumber(info.act))}</div><div class="actions"><button class="btn" type="button" id="calendarPreviewActBtn">👁 Ava eelvaade</button><button class="btn" type="button" id="calendarDownloadActBtn">⇩ Laadi PDF</button><button class="btn primary" type="button" id="calendarRestoreActBtn">Taasta akt</button></div></div></div>`;
  }
  if(isCompletedStatus(w.status) && workorderActRequired(w)){
    return `<div class="calendar-act-panel full"><div class="section-title">Akt</div><div class="card"><div class="card-top"><h3>Akti ei ole loodud</h3><span class="status red">Akt puudub</span></div><div class="muted">Sellele tööle on akt kohustuslik. Koosta akt töö lõpetamiseks/dokumenteerimiseks.</div><div class="actions"><button class="btn primary" type="button" id="calendarCreateActBtn">Loo akt</button></div></div></div>`;
  }
  return '';
}
function bindWorkorderActPanel(w){
  const getAct=()=>actForWorkorder(w.id);
  $('#calendarPreviewActBtn')?.addEventListener('click',()=>{const a=getAct(); if(a) openActPreview(a.id);});
  $('#calendarDownloadActBtn')?.addEventListener('click',()=>{const a=getAct(); if(a) saveActPdf(a.id);});
  $('#calendarEditActBtn')?.addEventListener('click',()=>{const a=getAct(); if(a) openActModal(a.id);});
  $('#calendarRestoreActBtn')?.addEventListener('click',()=>{const a=archivedActForWorkorder(w.id); if(a){ restoreAct(a.id); closeModal(); if(page==='calendar') renderCalendar(); else if(page==='workorders') renderWorkorders(); }});
  $('#calendarCreateActBtn')?.addEventListener('click',()=>{const a=ensureActForWorkorder(w.id); if(a){ closeModal(); selectedActId=a.id; detailOpen.acts=true; if(page==='calendar') renderCalendar(); else renderActs(); }});
}
function actPendingWorkorders(){
  // Akti ootel tähendab ainult lõpetatud tööd, millel ei ole ühtegi seotud akti.
  // Kui akt on aktiivne või arhiivis, ei tohi sama tööd uuesti akti ootele ega "Genereeri akt" nupu alla panna.
  return (state.workorders||[])
    .filter(w=>isCompletedStatus(w.status))
    .filter(w=>workorderActRequired(w))
    .filter(w=>!actForWorkorder(w.id))
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')) || String(b.time||'').localeCompare(String(a.time||'')));
}
function generateActFromWorkorder(workorderId){
  const a=ensureActForWorkorder(workorderId);
  if(!a) return null;
  selectedActId=a.id;
  detailOpen.acts=true;
  save();
  return a;
}


function splitSectionLines(text){
  const raw=String(text||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(raw.length<=1) return [];
  return raw.map(x=>x.replace(/^[-•*]\s*/,''));
}
function sectionHtml(text,{bullets=false}={}){
  const value=String(text||'').trim();
  if(!value) return '';
  const lines=String(value).replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(lines.length>1){
    return lines.map(line=>`<div class="act-line">${esc(line.replace(/^[-•*]\s*/,''))}</div>`).join('');
  }
  return esc(value);
}
function canvasSectionLines(text,{bullets=false}={}){
  const value=String(text||'').trim();
  if(!value) return [];
  return String(value).replace(/\r/g,'').split('\n').map(x=>x.trim().replace(/^[-•*]\s*/,'')).filter(Boolean);
}
function measureCanvasWrappedLines(ctx,text,maxWidth){
  const paragraphs=Array.isArray(text)?text:String(text||'').replace(/\r/g,'').split('\n').map(t=>t.trim()).filter(Boolean);
  const result=[];
  paragraphs.forEach((para)=>{
    const words=String(para||'').split(/\s+/).filter(Boolean);
    const lines=[];
    let line='';
    for(const word of words){
      const test=line?line+' '+word:word;
      if(ctx.measureText(test).width>maxWidth && line){ lines.push(line); line=word; }
      else line=test;
    }
    if(line) lines.push(line);
    if(lines.length) result.push(lines);
  });
  return result;
}
function wrapCanvasParagraphs(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
  const paragraphs=measureCanvasWrappedLines(ctx,text,maxWidth);
  let used=0;
  paragraphs.forEach((lines,pidx)=>{
    lines.forEach((ln)=>{
      if(used>=maxLines) return;
      ctx.fillText(ln,x,y);
      y+=lineHeight;
      used+=1;
    });
    if(pidx<paragraphs.length-1 && used<maxLines) y+=8;
  });
  return y;
}
function canvasSectionHeight(ctx,text,maxWidth,minH,lineHeight=28){
  const paragraphs=measureCanvasWrappedLines(ctx,text,maxWidth);
  const lineCount=paragraphs.reduce((sum,p)=>sum+p.length,0);
  const paragraphGaps=Math.max(0,paragraphs.length-1)*8;
  const contentH=lineCount*lineHeight+paragraphGaps;
  return Math.max(minH, contentH+52);
}

function ensureActForWorkorder(workorderId){
  const w=byId(state.workorders,workorderId);
  if(!w || !isCompletedStatus(w.status)) return null;
  let a=actForWorkorder(w.id);
  if(a) return normalizeActContentFromWorkorder(a,w);
  if(!workorderActRequired(w)) return null;
  a={
    id:timestampActId(),
    number:timestampActId(),
    workorderId:w.id,
    objectId:w.objectId,
    date:w.date||dateKeyFromDate(new Date()),
    title:`${w.actType||'Väljakutse akt'} - ${w.title||objectName(w.objectId)}`,
    status:'Mustand',
    type:w.actType||'Väljakutse akt',
    source:'Töö',
    createdAt:new Date().toISOString(),
    archived:false,
    problemDescription:problemDescriptionText(w)||'',
    performedWork:performedWorkText(w)||'',
    workText:performedWorkText(w)||'',
    resultNotes:workResultText(w)||'',
    recommendations:workRecommendationsText(w)||'',
    materials:workMaterialsText(w)||''
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
  const startLabel=actStartDateTimeLabel(w,a);
  const endLabel=actEndDateTimeLabel(w,a);
  const performed=actPerformedText(a,w)||'Teostatud tööde kirjeldus puudub.';
  const result=actResultText(a,w);
  const recommendations=actRecommendationsText(a,w);
  const materials=actMaterialsText(a,w);
  const logoUrl=new URL('assets/img/veco-act-logo.jpg', window.location.href).href;
  const headerLeft=[['Kuupäev',fmtActDate(a.date||w.date||'')],['Akt nr',actNumber(a)]];
  const headerRight=[['Objekt',obj.name||''],['Klient',client.name||'']];
  const topItems=[
    ['Algus',startLabel],['Lõpp',endLabel],[workorderPeopleHeading(w,'Tehnik','Tehnikud'),workorderPeopleMultiline(w)],['Kestus',actDurationLabel(w)],['Tüüp',a.type||'Väljakutse akt']
  ];
  const autoScript=autoPrint?`<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script>`:'';
  const helper=autoPrint?'Prindivaade avatakse automaatselt.':'Akti eelvaade.';
  return `<!doctype html><html lang="et"><head><meta charset="utf-8"><title>${esc(actNumber(a))} · ${esc(a.title||'Väljakutse akt')}</title><style>
    *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:18px;font-size:12px;line-height:1.42;background:#fff}.actions{margin:0 0 12px;display:flex;gap:8px;flex-wrap:wrap}.btn{border:1px solid #777;background:#f7f7f7;padding:8px 12px;border-radius:6px;cursor:pointer}.act-head{display:grid;grid-template-columns:1fr 240px 1fr;gap:18px;align-items:start;margin-bottom:18px}.head-side{display:grid;gap:10px}.head-card{border:1.6px solid #94a3b8;border-radius:8px;min-height:48px;padding:9px 11px;background:#f3f7fb}.head-card .value{font-size:13px;white-space:pre-line}.top{text-align:center;display:flex;align-items:center;justify-content:center;min-height:130px;padding-top:0}.logo-img{width:132px;height:118px;object-fit:contain;display:block;margin:0 auto}.muted{color:#555;font-size:11px}.meta{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.meta-item{border:1.6px solid #94a3b8;border-radius:8px;min-height:48px;height:auto;padding:9px 11px;overflow:visible;background:#f3f7fb}.label{font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}.value{font-size:13px;font-weight:700;color:#0f172a;overflow-wrap:anywhere;white-space:pre-line}.content-start{margin-top:26px;padding-top:16px;border-top:1.5px solid #94a3b8}.section-title{font-size:15px;font-weight:800;margin:24px 0 10px;border-bottom:1px solid #cbd5e1;padding-bottom:6px;letter-spacing:.02em}.content-start .section-title{margin-top:0}.box{border:1px solid #cbd5e1;border-radius:8px;padding:15px 16px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.42}.box.description{min-height:50px}.box.result{min-height:72px}.act-line{margin:0 0 7px}.act-line:last-child{margin-bottom:0}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:12px}.signature{border:1px solid #cbd5e1;border-radius:8px;min-height:80px;padding:12px 14px}.signature-line{border-top:1px solid #334155;margin-top:26px;padding-top:5px;color:#555}@media(max-width:800px){.act-head{grid-template-columns:1fr}.meta{grid-template-columns:1fr 1fr}}@media print{.actions{display:none} body{margin:10mm}.act-head{grid-template-columns:1fr 210px 1fr;gap:12px;margin-bottom:16px}.top{min-height:122px;padding-top:0}.logo-img{width:120px;height:110px}.head-card,.meta-item{min-height:42px;padding:7px 9px}.meta{gap:8px}.content-start{margin-top:24px;padding-top:14px}.section-title{margin-top:22px;margin-bottom:9px}.content-start .section-title{margin-top:0}.box{padding:13px 14px;line-height:1.42}.box.description{min-height:44px}.box.result{min-height:72px}.signature{min-height:74px}}
  </style>${autoScript}</head><body><div class="actions"><button class="btn" onclick="window.print()">Prindi</button><button class="btn" onclick="window.close()">Sulge</button><span class="muted">${esc(helper)}</span></div><div class="act-head"><div class="head-side">${headerLeft.map(([k,v])=>`<div class="head-card"><div class="label">${esc(k)}</div><div class="value">${esc(v||'-')}</div></div>`).join('')}</div><div class="top"><img class="logo-img" src="${logoUrl}" alt="VECO"></div><div class="head-side">${headerRight.map(([k,v])=>`<div class="head-card"><div class="label">${esc(k)}</div><div class="value">${esc(v||'-')}</div></div>`).join('')}</div></div><div class="section-title">Üldandmed</div><div class="meta">${topItems.map(([k,v])=>`<div class="meta-item"><div class="label">${esc(k)}</div><div class="value">${esc(v||'-')}</div></div>`).join('')}</div><div class="content-start"><div class="section-title desc">Probleemi kirjeldus</div><div class="box description">${sectionHtml(actProblemDescriptionText(a,w)||'-')}</div><div class="section-title">Teostatud tööd</div><div class="box result">${sectionHtml(performed)}</div>${result?`<div class="section-title">Töö tulemus / märkused</div><div class="box result">${sectionHtml(result)}</div>`:''}${recommendations?`<div class="section-title">Soovitused / puudused</div><div class="box result">${sectionHtml(recommendations)}</div>`:''}${materials?`<div class="section-title">Materjalid</div><div class="box description">${sectionHtml(materials)}</div>`:''}</div><div class="section-title">Allkirjad</div><div class="signatures"><div class="signature"><strong>${esc(workorderPeopleHeading(w,'Teostaja','Teostajad'))}</strong><div style="white-space:pre-line">${esc(workorderPeopleMultiline(w))}</div><div class="signature-line">Allkiri / kuupäev</div></div><div class="signature"><strong>Tellija</strong><div>&nbsp;</div><div class="signature-line">Allkiri / kuupäev</div></div></div></body></html>`;
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
    technician:workorderPeopleMultiline(w),
    technicianHeading:workorderPeopleHeading(w,'Tehnik','Tehnikud'),
    performerHeading:workorderPeopleHeading(w,'TEOSTAJA','TEOSTAJAD'),
    start:actStartDateTimeLabel(w,a),
    end:actEndDateTimeLabel(w,a),
    duration:actDurationLabel(w),
    type:a.type||'Väljakutse akt',
    description:actProblemDescriptionText(a,w)||'-',
    performed:actPerformedText(a,w)||'Teostatud tööde kirjeldus puudub.',
    result:actResultText(a,w),
    recommendations:actRecommendationsText(a,w),
    materials:actMaterialsText(a,w)
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
  ctx.strokeStyle='#94a3b8'; ctx.lineWidth=1.8; ctx.fillStyle='#f3f7fb';
  roundRectPath(ctx,x,y,w,h,10); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#64748b'; ctx.font='700 14px Arial, Helvetica, sans-serif'; ctx.fillText(String(label).toUpperCase(),x+14,y+20);
  ctx.fillStyle='#0f172a'; ctx.font='700 18px Arial, Helvetica, sans-serif';
  const lines=String(value||'-').replace(/\r/g,'').split('\n').filter(Boolean);
  let yy=y+46;
  lines.forEach((line,idx)=>{ yy=wrapCanvasText(ctx,line,x+14,yy,w-28,22,idx===0?2:1); });
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
  const left=70, gap=14, colW=(canvas.width-left*2-gap*4)/5;
  const logo=await loadActLogo();
  const logoSize=150;
  const headY=46;
  drawInfoCell(ctx,'Kuupäev',d.date,left,headY,colW*1.55,58);
  drawInfoCell(ctx,'Akt nr',d.number,left,headY+72,colW*1.55,58);
  drawInfoCell(ctx,'Objekt',d.objectName,canvas.width-left-colW*1.55,headY,colW*1.55,58);
  drawInfoCell(ctx,'Klient',d.clientName,canvas.width-left-colW*1.55,headY+72,colW*1.55,58);
  if(logo){ ctx.drawImage(logo, (canvas.width-logoSize)/2, headY-2, logoSize, logoSize); }
  else { ctx.fillStyle='#2483ff'; ctx.beginPath(); ctx.arc(canvas.width/2,headY-2+logoSize/2,logoSize/2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='700 34px Arial'; ctx.textAlign='center'; ctx.fillText('VECO',canvas.width/2,headY-2+logoSize/2+10); ctx.textAlign='left'; }
  ctx.textAlign='left';

  let y=205;
  const cells=[
    ['Algus',d.start],['Lõpp',d.end],[d.technicianHeading||'Tehnik',d.technician],['Kestus',d.duration],
    ['Tüüp',d.type]
  ];
  cells.forEach((c,i)=>{ const x=left+(i%5)*(colW+gap); const yy=y+Math.floor(i/5)*74; drawInfoCell(ctx,c[0],c[1],x,yy,colW,(String(c[1]||'').includes('\n')?78:58)); });
  y+=Math.ceil(cells.length/5)*(cells.some(c=>String(c[1]||'').includes('\n'))?92:74);
  y+=14;
  ctx.strokeStyle='#d9dee7'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(canvas.width-left,y); ctx.stroke();
  y+=32;

  function section(title,body,minH,maxLines,opts={}){
    const boxW=canvas.width-left*2;
    const textX=left+22;
    const textW=boxW-44;
    ctx.font='20px Arial, Helvetica, sans-serif';
    const boxH=canvasSectionHeight(ctx,body,textW,minH,29);
    ctx.fillStyle='#0f172a'; ctx.font='800 22px Arial, Helvetica, sans-serif'; ctx.fillText(title.toUpperCase(),left,y);
    y+=18; ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(canvas.width-left,y); ctx.stroke(); y+=18;
    ctx.fillStyle='#fff'; ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=1.5; roundRectPath(ctx,left,y,boxW,boxH,12); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#111827'; ctx.font='20px Arial, Helvetica, sans-serif';
    wrapCanvasParagraphs(ctx,body,textX,y+38,textW,29,999);
    y+=boxH+46;
  }
  section('Probleemi kirjeldus',d.description,72);
  section('Teostatud tööd',d.performed,150);
  if(d.result) section('Töö tulemus / märkused',d.result,92);
  if(d.recommendations) section('Soovitused / puudused',d.recommendations,100);
  if(d.materials) section('Materjalid',d.materials,80);

  const minSignatureTop = canvas.height - 220;
  if(y < minSignatureTop) y = minSignatureTop;

  ctx.fillStyle='#0f172a'; ctx.font='800 22px Arial, Helvetica, sans-serif'; ctx.fillText('ALLKIRJAD',left,y); y+=18;
  ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(canvas.width-left,y); ctx.stroke(); y+=22;
  const sigW=(canvas.width-left*2-gap)/2;
  [[d.performerHeading||'TEOSTAJA',d.technician],['TELLIJA','']].forEach((s,i)=>{
    const x=left+i*(sigW+gap);
    ctx.fillStyle='#fff'; ctx.strokeStyle='#d7dee8'; roundRectPath(ctx,x,y,sigW,124,12); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#64748b'; ctx.font='700 16px Arial'; ctx.fillText(s[0],x+18,y+28);
    ctx.fillStyle='#0f172a'; ctx.font='700 19px Arial';
    const nameLines=String(s[1]||'Nimi').split('\n').filter(Boolean);
    nameLines.slice(0,3).forEach((ln,idx)=>ctx.fillText(ln,x+18,y+56+idx*22));
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+18,y+92); ctx.lineTo(x+sigW-18,y+92); ctx.stroke();
    ctx.fillStyle='#64748b'; ctx.font='16px Arial'; ctx.fillText('Allkiri / kuupäev',x+18,y+114);
  });
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
  const w=byId(state.workorders,workorderId);
  if(!w || !isCompletedStatus(w.status)) return;
  const a=actForWorkorder(workorderId)||ensureActForWorkorder(workorderId);
  if(!a) return;
  selectedActId=a.id;
  openActPreview(a.id);
}
function renderActs(){
  const status=$('#actStatusFilter')?.value||'all';
  const archiveView=$('#actArchiveFilter')?.value||'active';
  const q=($('#actSearch')?.value||'').toLowerCase();
  const baseActs=scopedActs(archiveView==='archive'?archivedActs():activeActs());
  const statuses=[...new Set(baseActs.map(a=>a.status))];
  const pending=actPendingWorkorders().filter(workorderVisibleToCurrentScope);
  const list=baseActs.filter(a=>(status==='all'||a.status===status)&&`${a.title} ${objectName(a.objectId)} ${a.workorderId}`.toLowerCase().includes(q));
  if(!list.some(a=>a.id===selectedActId)) selectedActId=list[0]?.id||'';
  const filters=`<input class="field" id="actSearch" placeholder="Otsi akti..." value="${esc(q)}"><select class="select" id="actArchiveFilter"><option value="active" ${archiveView==='active'?'selected':''}>Aktiivsed aktid</option><option value="archive" ${archiveView==='archive'?'selected':''}>Arhiiv</option></select><select class="select" id="actStatusFilter"><option value="all">Kõik staatused</option>${statuses.map(s=>`<option value="${esc(s)}" ${status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>`;
  const actions=archiveView==='active'?`<button class="btn primary" id="newActBtn">${icon('＋')}Lisa akt</button>`:`<button class="btn" id="backToActiveActsBtn" type="button">← Aktiivsed aktid</button>`;
  const rows=list.map(a=>{const w=byId(state.workorders,a.workorderId)||{}; const rowActions=archiveView==='archive'?`<button class="btn small" data-edit-act="${esc(a.id)}" type="button">Muuda</button><button class="btn small" data-restore-act="${esc(a.id)}" type="button">Taasta</button><button class="btn small danger" data-delete-act="${esc(a.id)}" type="button">Kustuta lõplikult</button>`:`<button class="btn small" data-edit-act="${esc(a.id)}" type="button">Muuda</button><button class="btn small" data-archive-act="${esc(a.id)}" type="button">Arhiveeri</button>`;return `<tr data-act-id="${a.id}" class="${detailOpen.acts&&a.id===selectedActId?'selected':''}"><td><strong>${esc(a.title)}</strong><div class="muted">${esc(a.id)}</div></td><td>${esc(fmtActDate(a.date))}</td><td>${esc(clientName(objectClientId(a.objectId)))}</td><td>${esc(objectName(a.objectId))}</td><td>${esc(w.title||a.workorderId)}</td><td><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></td><td class="row-actions">${rowActions}</td></tr>`});
  const pendingRows=pending.map(w=>{
    return `<tr><td><strong>${esc(objectName(w.objectId))}</strong><div class="muted">${esc(clientName(objectClientId(w.objectId)))}</div></td><td><strong>${esc(w.title||'-')}</strong><div class="muted">${esc(completionCommentText(w)||w.description||'')}</div></td><td>${esc(fmtActDate(w.date))} ${esc(w.time||'')}</td><td>${esc(workorderPeopleLabel(w))}</td><td><span class="status red">Akt puudub</span></td><td><button class="btn small primary" data-generate-act="${esc(w.id)}" type="button">Genereeri akt</button></td></tr>`;
  }).join('');
  const pendingBlock=archiveView==='active'?`<div class="section-title">Akti ootel tööd</div>${pending.length?table(['Objekt','Töö','Kuupäev','Teostaja','Akti seis','Tegevus'],pendingRows):`<div class="empty-state"><strong>Akti ootel töid ei ole.</strong><div class="muted">Kui töö märgitakse lõpetatuks, ilmub see siia akti loomiseks või avamiseks.</div></div>`}`:'';
  const archiveEmpty=archiveView==='archive' && !list.length?`<div class="empty-state"><strong>Arhiiv on tühi.</strong><div class="muted">Arhiveeritud aktid ilmuvad siia. Siit saab neid taastada või lõplikult kustutada.</div></div>`:'';
  const activeCount=scopedActs(activeActs()).length;
  const archiveCount=scopedActs(archivedActs()).length;
  const main=header('Aktid',filters,actions,'Aktid')+`<div class="detail-body">${scopeNotice()}<div class="summary-grid">${summaryBox('Akti ootel',pending.length)}${summaryBox('Aktiivsed aktid',activeCount)}${summaryBox('Arhiivis',archiveCount)}${summaryBox('Mustandeid',scopedActs(activeActs()).filter(a=>a.status==='Mustand').length)}</div>${pendingBlock}<div class="section-title">${archiveView==='archive'?'Aktide arhiiv':'Aktide register'}</div>${archiveEmpty||table(['Akt','Kuupäev','Klient','Objekt','Töö','Staatus','Tegevused'],rows)}</div>`;
  shell(main,detailOpen.acts?actDetailHtml():'');
  $('#actSearch')?.addEventListener('input',renderActs);
  $('#actStatusFilter')?.addEventListener('change',renderActs);
  $('#actArchiveFilter')?.addEventListener('change',()=>{detailOpen.acts=false; selectedActId=''; renderActs();});
  $('#backToActiveActsBtn')?.addEventListener('click',()=>{const f=$('#actArchiveFilter'); if(f) f.value='active'; detailOpen.acts=false; renderActs();});
  $$('[data-generate-act]').forEach(btn=>btn.addEventListener('click',e=>{
    e.stopPropagation();
    const a=generateActFromWorkorder(btn.dataset.generateAct);
    if(a){ selectedActId=a.id; detailOpen.acts=true; }
    renderActs();
  }));
  $$('[data-edit-act]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); openActModal(btn.dataset.editAct); }));
  $$('[data-archive-act]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); archiveAct(btn.dataset.archiveAct); renderActs();}));
  $$('[data-restore-act]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); restoreAct(btn.dataset.restoreAct); renderActs();}));
  $$('[data-delete-act]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); deleteActPermanently(btn.dataset.deleteAct); renderActs();}));
  $$('[data-act-id]').forEach(row=>row.addEventListener('click',()=>{const id=row.dataset.actId; if(detailOpen.acts&&selectedActId===id){detailOpen.acts=false;}else{selectedActId=id;detailOpen.acts=true;} renderActs();}));
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();selectedActId=state.acts[0]?.id||'';detailOpen.acts=false;renderActs();});
  $('#newActBtn')?.addEventListener('click',()=>openActModal());
  bindActDetail();
}
function actDetailHtml(){
  const a=byId(state.acts,selectedActId); if(!a) return detailHeader('Akti detail')+`<div class="detail-body"><span class="muted">Vali akt.</span></div>`;
  const w=byId(state.workorders,a.workorderId)||{};
  const extra=`<div class="section-title">Teostatud tööd</div><div class="muted preline">${esc(actPerformedText(a,w)||'Puudub.')}</div><div class="section-title">Töö tulemus / märkused</div><div class="muted preline">${esc(actResultText(a,w)||'Puudub.')}</div><div class="section-title">Soovitused / puudused</div><div class="muted preline">${esc(actRecommendationsText(a,w)||'Puudub.')}</div>${actMaterialsText(a,w)?`<div class="section-title">Materjalid</div><div class="muted preline">${esc(actMaterialsText(a,w))}</div>`:''}`;
  const body=`<div class="summary-grid">${summaryBox('Kuupäev',a.date)}${summaryBox('Staatus',a.status)}${summaryBox('Objekt',objectName(a.objectId))}${summaryBox('Töö',a.workorderId)}</div>${card(a.title,[['Klient',clientName(objectClientId(a.objectId))],['Objekt',objectName(a.objectId)],['Töö',w.title||a.workorderId],['Kuupäev',a.date]],a.status,extra)}`;
  const archiveButton=a.archived?'<button class="btn small" id="restoreActBtn" type="button">↩ Taasta</button><button class="btn small danger" id="deleteActBtn" type="button">Kustuta lõplikult</button>':'<button class="btn small" id="archiveActBtn" type="button">Arhiveeri</button>';
  return detailHeader('Akti detail','<button class="btn small" id="editActBtn">✎ Muuda</button><button class="btn small" id="previewActBtn" type="button">👁 Eelvaade</button><button class="btn small" id="printActBtn" type="button">⎙ Prindi</button><button class="btn small" id="pdfActBtn" type="button">⇩ Salvesta PDF</button><button class="btn small primary" id="markActSentBtn">↗ Märgi saadetuks</button>'+archiveButton+'<button class="btn small ghost" id="actDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body">${body}</div>`;
}
function bindActDetail(){ $('#editActBtn')?.addEventListener('click',()=>openActModal(selectedActId)); $('#previewActBtn')?.addEventListener('click',()=>openActPreview(selectedActId)); $('#printActBtn')?.addEventListener('click',()=>printAct(selectedActId)); $('#pdfActBtn')?.addEventListener('click',()=>saveActPdf(selectedActId)); $('#markActSentBtn')?.addEventListener('click',()=>{const a=byId(state.acts,selectedActId); if(a){a.status='Saadetud'; save(); renderActs();}}); $('#archiveActBtn')?.addEventListener('click',()=>{archiveAct(selectedActId); renderActs();}); $('#restoreActBtn')?.addEventListener('click',()=>{restoreAct(selectedActId); renderActs();}); $('#deleteActBtn')?.addEventListener('click',()=>{deleteActPermanently(selectedActId); renderActs();}); $('#actDetailCloseBtn')?.addEventListener('click',()=>{detailOpen.acts=false;renderActs();}); }
function openActModal(id='',defaults={}){
  const defaultWorkorder=defaults.workorderId?byId(state.workorders,defaults.workorderId)||{}:{};
  const isGeneratedFromWorkorder=!!defaults.workorderId && !!defaultWorkorder.id;
  const a=id?byId(state.acts,id):{workorderId:isGeneratedFromWorkorder?defaultWorkorder.id:'',objectId:defaults.objectId||(isGeneratedFromWorkorder?defaultWorkorder.objectId:'')||'',date:isGeneratedFromWorkorder?(defaultWorkorder.date||dateKeyFromDate(new Date())):'',title:isGeneratedFromWorkorder?`${defaultWorkorder.actType||'Väljakutse akt'} - ${defaultWorkorder.title||objectName(defaultWorkorder.objectId)}`:'',status:'Mustand',type:isGeneratedFromWorkorder?(defaultWorkorder.actType||'Väljakutse akt'):'Väljakutse akt',problemDescription:isGeneratedFromWorkorder?(problemDescriptionText(defaultWorkorder)||''):'',performedWork:isGeneratedFromWorkorder?(performedWorkText(defaultWorkorder)||''):'',workText:isGeneratedFromWorkorder?(performedWorkText(defaultWorkorder)||''):'',resultNotes:isGeneratedFromWorkorder?(workResultText(defaultWorkorder)||''):'',recommendations:isGeneratedFromWorkorder?(workRecommendationsText(defaultWorkorder)||''):'',materials:isGeneratedFromWorkorder?(workMaterialsText(defaultWorkorder)||''):'',archived:false};
  const w=byId(state.workorders,a?.workorderId)||defaultWorkorder||{};
  if(id || isGeneratedFromWorkorder) normalizeActContentFromWorkorder(a,w);
  openModal(`<form id="actForm"><div class="dialog-head"><h2>${id?'Muuda akti':'Lisa akt'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Akti nimetus<input class="field" name="title" required value="${esc(a.title)}"></label><label>Töö<select class="select" name="workorderId"><option value="" ${!a.workorderId?'selected':''}>Ilma tööta</option>${state.workorders.map(w=>`<option value="${w.id}" ${a.workorderId===w.id?'selected':''}>${esc(w.title||w.id)} · ${esc(objectName(w.objectId))}</option>`).join('')}</select></label><label>Objekt<select class="select" name="objectId"><option value="" ${!a.objectId?'selected':''}>Vali objekt...</option>${state.objects.map(o=>`<option value="${o.id}" ${a.objectId===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select></label><label>Kuupäev<input class="field" name="date" type="date" value="${esc(a.date)}"></label><label>Staatus<select class="select" name="status">${['Mustand','Valmis','Saadetud','Arhiveeritud'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Akti tüüp<select class="select" name="type"><option value="Väljakutse akt" ${a.type==='Väljakutse akt'?'selected':''}>Väljakutse akt</option></select></label><label class="full">Probleemi kirjeldus<textarea name="problemDescription" placeholder="Kliendi pöördumine või töö põhjus...">${esc(actProblemDescriptionText(a,w))}</textarea></label><label class="full">Teostatud tööd<textarea name="performedWork" placeholder="Kirjelda teostatud tööd...">${esc(actPerformedText(a,w))}</textarea></label><label class="full">Töö tulemus / märkused<textarea name="resultNotes" placeholder="Lisa töö tulemus, kontrolli tulemused või märkused...">${esc(actResultText(a,w))}</textarea></label><label class="full">Soovitused / puudused<textarea name="recommendations" placeholder="Lisa puudused, remondivajadused või soovitused kliendile...">${esc(actRecommendationsText(a,w))}</textarea></label><label class="full">Materjalid<textarea name="materials" placeholder="Lisa kasutatud materjalid või kulumaterjalid...">${esc(actMaterialsText(a,w))}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#actForm').elements.workorderId?.addEventListener('change',e=>{
    const wo=byId(state.workorders,e.target.value)||{};
    if(wo.objectId) $('#actForm').elements.objectId.value=wo.objectId;
    if($('#actForm').elements.problemDescription && !$('#actForm').elements.problemDescription.value.trim()) $('#actForm').elements.problemDescription.value=problemDescriptionText(wo)||'';
    if(!$('#actForm').elements.performedWork.value.trim()) $('#actForm').elements.performedWork.value=performedWorkText(wo)||'';
  });
  $('#actForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const newId=timestampActId();const next={id:id||newId,number:a.number||newId,workorderId:f.workorderId.value,objectId:f.objectId.value,date:f.date.value,title:f.title.value,status:f.status.value,type:f.type?.value||'Väljakutse akt',problemDescription:f.problemDescription?.value||'',performedWork:f.performedWork.value,workText:f.performedWork.value,resultNotes:f.resultNotes.value,recommendations:f.recommendations.value,materials:f.materials.value,createdAt:a.createdAt||new Date().toISOString(),archived:(a.archived===true||f.status.value==='Arhiveeritud')}; if(id){Object.assign(a,next)}else{state.acts.push(next);selectedActId=next.id;detailOpen.acts=true} save();closeModal(); if(page==='workorders') renderWorkorders(); else renderActs();});
}


function pinStatusHtml(p){
  const auth=normalizeAuthUsers(); const u=auth.users?.[p.id];
  return `<span class="status ${u?.pinResetRequired?'warn':(u?.pinHash?'ok':'red')}">${u?.pinResetRequired?'Uus PIN ootel':(u?.pinHash?'PIN määratud':'PIN puudub')}</span>`;
}
function superadminPanelHtml(){
  if(authRole()!=='superadmin') return '';
  const auth=normalizeAuthUsers();
  const admins=Object.values(auth.users||{}).filter(u=>u.role==='admin');
  const list=admins.map(u=>`<div class="kv"><span>${esc(u.name)}</span><strong>${u.pinResetRequired?'Uus PIN ootel':(u.pinHash?'PIN määratud':'PIN puudub')}</strong></div>`).join('');
  return `<div class="auth-admin-panel"><h3>Superadmin taastamine</h3><p class="muted">Superadmin saab taastada admini ligipääsu. PIN-koode ei kuvata.</p>${list}<button class="btn danger" id="resetAdminPinsBtn" type="button">Lähtesta kõik admin PIN-id</button></div>`;
}


function normalizeOncallPeopleOrder({persist=false}={}){
  const active=(state.people||[])
    .filter(p=>p&&p.active!==false&&p.onCallActive===true)
    .sort((a,b)=>(Number(a.onCallOrder)||9999)-(Number(b.onCallOrder)||9999)||String(a.name||'').localeCompare(String(b.name||''),'et'));
  let changed=false;
  active.forEach((p,idx)=>{ const order=idx+1; if(Number(p.onCallOrder||0)!==order){ p.onCallOrder=order; changed=true; } });
  (state.people||[]).forEach(p=>{ if(!p||p.onCallActive===true) return; if(Number(p.onCallOrder||0)!==0){ p.onCallOrder=0; changed=true; } });
  if(changed && persist) save();
  return changed;
}
async function persistPersonAuthToRemote(p){
  if(!p) return false;
  const auth=normalizeAuthUsers();
  const user=auth.users?.[p.id];
  if(!user) return false;
  if(window.VECO_API?.saveAuthUser){ await window.VECO_API.saveAuthUser(user); }
  return true;
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
  const today=dateKeyFromDate(new Date());
  const rows=list.map(p=>`<tr data-person-id="${p.id}"><td><strong>${esc(p.name)}</strong><div class="muted">${esc(p.id)}</div></td><td>${esc(p.role||'-')}</td><td>${availabilityBadgesHtml(p.id,today,{empty:true})}</td><td>${esc(p.phone||'-')}</td><td>${esc(p.email||'-')}</td><td>${esc(p.region||'-')}</td><td><button class="status ${p.onCallActive===true?'ok':'red'}" data-toggle-oncall-person="${p.id}" type="button" title="Lisa/eemalda valvegraafikust">${p.onCallActive===true?'Aktiivne':'Ei osale'}</button><div class="muted">${p.onCallActive===true&&Number(p.onCallOrder||0)>0?'Jrk '+Number(p.onCallOrder):''}</div></td><td><span class="status ${p.active?'ok':'red'}">${p.active?'Aktiivne':'Deaktiveeritud'}</span></td><td>${pinStatusHtml(p)}</td><td><button class="btn small" data-edit-person="${p.id}" type="button">Muuda</button> <button class="btn small" data-reset-pin="${p.id}" type="button">Luba uus PIN</button> <button class="btn small" data-temp-pin="${p.id}" type="button">Määra PIN</button> <button class="btn small ${p.active?'danger':'primary'}" data-toggle-person="${p.id}" type="button">${p.active?'Deaktiveeri':'Aktiveeri'}</button> <button class="btn small danger" data-delete-person="${p.id}" type="button">Arhiveeri</button></td></tr>`).join('');
  const main=header('Tehnikute administreerimine',filters,actions,'TEHNIKUD')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Kasutajaid',state.people.length)}${summaryBox('Aktiivseid',state.people.filter(p=>p.active).length)}${summaryBox('Tehnikuid',state.people.filter(p=>authRoleFromPersonRole(p.role)==='technician').length)}${summaryBox('Valve aktiivsed',state.people.filter(p=>p.onCallActive).length)}</div>${superadminPanelHtml()}${table(['Nimi','Roll','Saadavus täna','Telefon','E-post','Piirkond','Valvegraafik','Staatus','PIN','Tegevused'],rows)}</div>`;
  shell(main,'',{wide:true});
  $('#peopleSearch')?.addEventListener('input',renderPeople);
  $('#peopleStatusFilter')?.addEventListener('change',renderPeople);
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();normalizeOncallPeople();save();renderPeople();});
  $('#newPersonBtn')?.addEventListener('click',()=>openPersonModal());
  $$('[data-toggle-oncall-person]').forEach(btn=>btn.addEventListener('click',async e=>{
    e.stopPropagation();
    const p=byId(state.people,btn.dataset.toggleOncallPerson);
    if(!p) return;
    p.onCallActive = !(p.onCallActive===true);
    p.onCallOrder = p.onCallActive===true ? nextOncallOrder() : 0;
    normalizeOncallPeopleOrder({persist:false});
    save();
    try{
      await persistPersonAuthToRemote(p);
      // Persist normalized orders for all active on-call users, so Supabase remains consistent.
      const active=(state.people||[]).filter(x=>x&&x.onCallActive===true);
      for(const person of active){ await persistPersonAuthToRemote(person); }
    }catch(err){
      console.warn('VECO on-call remote update failed',err);
      alert('Valvegraafiku salvestamine Supabase’i ebaõnnestus.');
      await authLoadRemoteIntoLocal();
      renderPeople();
      return;
    }
    await authLoadRemoteIntoLocal();
    renderPeople();
  }));
  $$('[data-reset-pin]').forEach(btn=>btn.addEventListener('click',async e=>{e.stopPropagation();const p=byId(state.people,btn.dataset.resetPin); if(!p) return; const ok=await openVecoConfirm({title:'Luba uus PIN?',message:`${p.name} vana PIN unustatakse. Järgmisel sisselogimisel saab kasutaja ise uue PIN-i määrata.`,confirmText:'Luba uus PIN',cancelText:'Loobu'}); if(ok){requestUserPinReset(p.id); renderPeople();}}));
  $$('[data-temp-pin]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();const p=byId(state.people,btn.dataset.tempPin); if(!p) return; const role=authRoleFromPersonRole(p.role); const pin=prompt(`${p.name} uus PIN (${AUTH_RULES[role].label})`); if(pin===null) return; if(!setUserTempPin(p.id,pin)){alert(`PIN peab olema ${AUTH_RULES[role].label}.`); return;} renderPeople();}));
  $('#resetAdminPinsBtn')?.addEventListener('click',async()=>{const ok=await openVecoConfirm({title:'Lähtesta admin PIN-id?',message:'Kõigi adminide vana PIN unustatakse. Järgmisel sisselogimisel saavad nad uue PIN-i määrata.',confirmText:'Lähtesta',cancelText:'Loobu',danger:true}); if(ok){resetAdminPins(); renderPeople();}});
  $$('[data-edit-person]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();openPersonModal(btn.dataset.editPerson);}))
  $$('[data-toggle-person]').forEach(btn=>btn.addEventListener('click',async e=>{e.stopPropagation();const p=byId(state.people,btn.dataset.togglePerson);if(!p)return;p.active=!p.active;save();const auth=normalizeAuthUsers();authSave(auth);try{await authSaveUserRemoteNow(auth.users[p.id]);}catch(err){console.warn('VECO auth remote user update failed',err);alert('Kasutaja staatuse salvestamine Supabase’i ebaõnnestus.');}await authLoadRemoteIntoLocal();renderPeople();}));
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
      title:'Arhiveeri kasutaja?',
      message:used?'Kasutaja on seotud teiste kirjetega. Kustutamine võib jätta viited tühjaks.':'Kas soovid selle kasutaja arhiveerida?',
      details:detailRows,
      confirmText:'Arhiveeri',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    p.active=false;
    save();
    const auth=normalizeAuthUsers();
    authSave(auth);
    try{ if(window.VECO_API?.deactivateAuthUser){ await window.VECO_API.deactivateAuthUser(id); } }
    catch(err){ console.warn('VECO auth remote archive failed',err); alert('Kasutaja arhiveerimine Supabase’is ebaõnnestus.'); }
    await authLoadRemoteIntoLocal();
    renderPeople();
  }));
}
function openPersonModal(id=''){
  const p=id?byId(state.people,id):{name:'',role:'Tehnik',phone:'',email:'',region:'',skills:'',active:true,onCallActive:false,onCallOrder:nextOncallOrder()};
  openModal(`<form id="personForm"><div class="dialog-head"><h2>${id?'Muuda kasutajat':'Lisa kasutaja'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Nimi<input class="field" name="name" required value="${esc(p.name)}"></label><label>Roll<select class="select" name="role">${['Admin','Hooldusjuht','Tehnik'].map(r=>`<option value="${r}" ${p.role===r?'selected':''}>${r}</option>`).join('')}</select></label><label>Telefon<input class="field" name="phone" value="${esc(p.phone||'')}"></label><label>E-post<input class="field" name="email" type="email" value="${esc(p.email||'')}"></label><label>Piirkond<input class="field" name="region" value="${esc(p.region||'')}"></label><label>Oskused<input class="field" name="skills" value="${esc(p.skills||'')}"></label><label>Saadavus<select class="select" name="availabilityStatus"><option value="available" ${(p.availabilityStatus||'available')==='available'?'selected':''}>Saadaval</option><option value="vacation" ${p.availabilityStatus==='vacation'?'selected':''}>Puhkus</option><option value="sick" ${p.availabilityStatus==='sick'?'selected':''}>Haigus</option><option value="training" ${p.availabilityStatus==='training'?'selected':''}>Koolitus</option><option value="oncall" ${p.availabilityStatus==='oncall'?'selected':''}>Valve</option></select></label><label>Staatus<select class="select" name="active"><option value="true" ${p.active?'selected':''}>Aktiivne</option><option value="false" ${!p.active?'selected':''}>Deaktiveeritud</option></select></label><label>Valvegraafik<select class="select" name="onCallActive"><option value="true" ${p.onCallActive?'selected':''}>Aktiivne</option><option value="false" ${!p.onCallActive?'selected':''}>Ei osale</option></select></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#personForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('U'),name:f.name.value,role:f.role.value,phone:f.phone.value,email:f.email.value,region:f.region.value,skills:f.skills.value,availabilityStatus:f.availabilityStatus.value||'available',active:f.active.value==='true',onCallActive:f.onCallActive.value==='true',onCallOrder:f.onCallActive.value==='true' ? (p.onCallOrder||nextOncallOrder()) : 0};if(id){Object.assign(p,next)}else{state.people.push(next)}save();const auth=normalizeAuthUsers();authSave(auth);try{if(window.VECO_API?.saveAuthUser){await window.VECO_API.saveAuthUser(auth.users[next.id]);}}catch(err){console.warn('VECO auth remote user save failed',err); alert('Kasutaja salvestamine Supabase’i ebaõnnestus. Muudatus jäi ainult lokaalseks.'); return;}closeModal();await authLoadRemoteIntoLocal();renderPeople();});
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
  // CR-CALENDAR-SPAN-004: mark local date-range edits so a fast F5 does not
  // immediately overwrite the fresh local range with a still-stale Supabase row.
  w.updatedAt=new Date().toISOString();
  w.updated_at=w.updatedAt;
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
  const legacyStatusFilter=$('#teamStatusFilter')?.value||'';
  const readTeamStatuses=()=>{
    const checked=$$('#teamStatusMenu input[type="checkbox"]:checked').map(i=>i.value);
    if(checked.length) return checked;
    try{
      const stored=JSON.parse(localStorage.getItem('veco_team_statuses')||'null');
      if(Array.isArray(stored)&&stored.length) return stored;
    }catch(_){ }
    if(legacyStatusFilter==='all') return ['Uus','Planeeritud','Töös','Ootel','Pausil','Lõpetatud','Täidetud','Suletud','Arhiveeritud'];
    if(legacyStatusFilter==='open') return ['Uus','Planeeritud','Töös','Ootel','Pausil'];
    if(legacyStatusFilter) return [legacyStatusFilter];
    return ['Planeeritud','Töös'];
  };
  const selectedStatuses=readTeamStatuses();
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
  const allTeamStatuses=['Uus','Planeeritud','Töös','Ootel','Pausil','Lõpetatud','Täidetud','Suletud','Arhiveeritud'];
  const openStatuses=['Uus','Planeeritud','Töös','Ootel','Pausil'];
  localStorage.setItem('veco_team_statuses',JSON.stringify(selectedStatuses));
  const inVisibleRange=w=>visibleDays.some(date=>workorderOccursOnDay(w,date));
  const inWeek=w=>weekDays.some(date=>workorderOccursOnDay(w,date));
  const statusOk=w=>selectedStatuses.includes(w.status);
  const searchable=w=>`${w.id} ${w.title} ${objectName(w.objectId)} ${clientName(objectClientId(w.objectId))} ${projectName(w.projectId)} ${workorderPeopleLabel(w)}`.toLowerCase().includes(q);
  const teamVisiblePeople=visiblePeopleForCurrentScope();
  const selectedEmployeeTokens=employeeFilterSelected('team');
  const selectedPeople=employeeFilterOptionPersonIds(selectedEmployeeTokens);
  const visiblePeople=teamVisiblePeople.filter(p=>selectedPeople.includes(p.id));
  const statusFilterLabel=selectedStatuses.length===allTeamStatuses.length?'Kõik staatused':(selectedStatuses.length===openStatuses.length && openStatuses.every(s=>selectedStatuses.includes(s))?'Avatud tööd':`${selectedStatuses.length} staatust`);
  const weekWorkorders=state.workorders.filter(w=>inWeek(w)&&statusOk(w)&&searchable(w));
  const visibleWorkorders=weekWorkorders.filter(w=>inVisibleRange(w)&&visiblePeople.some(p=>workorderMatchesPerson(w,p.id)));
  const dayWorkorders=state.workorders.filter(w=>workorderOccursOnDay(w,selectedDay)&&statusOk(w)&&searchable(w)&&visiblePeople.some(p=>workorderMatchesPerson(w,p.id)));
  if(selectedTeamPersonId && !visiblePeople.some(p=>p.id===selectedTeamPersonId)) selectedTeamPersonId='';

  const personJobs=(person,days=visibleDays)=>weekWorkorders.filter(w=>workorderMatchesPerson(w,person.id)&&days.some(date=>workorderOccursOnDay(w,date))).sort((a,b)=>`${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const personDayJobs=(person,date)=>weekWorkorders.filter(w=>workorderMatchesPerson(w,person.id)&&workorderOccursOnDay(w,date)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const dayNames=['E','T','K','N','R','L','P'];
  const weekDayOptions=weekDays.map((d,i)=>`<option value="${d}" ${selectedDay===d?'selected':''}>${dayNames[i]} ${d}</option>`).join('');
  const teamStatusFilter=`<div class="team-people-filter" id="teamStatusFilterWrap"><button class="btn ghost" type="button" id="teamStatusFilterBtn">☑ ${esc(statusFilterLabel)}</button><div class="team-people-menu hidden" id="teamStatusMenu"><div class="team-people-menu-head"><strong>Staatused vaates</strong><button class="btn small ghost" type="button" id="teamStatusOpenBtn">Avatud</button></div>${allTeamStatuses.map(st=>`<label class="team-people-option"><input type="checkbox" value="${esc(st)}" ${selectedStatuses.includes(st)?'checked':''}> <span>${esc(st)}</span><small>${isCompletedStatus(st)?'lõpetatud':'avatud'}</small></label>`).join('')}<div class="team-people-menu-actions"><button class="btn small ghost" type="button" id="teamStatusAllBtn">Kõik</button><button class="btn small ghost" type="button" id="teamStatusDefaultBtn">Vaikimisi</button></div></div></div>`;
  const teamPeopleFilter=employeeMultiFilterHtml('team',selectedEmployeeTokens);
  const viewSwitch=`<select class="select" id="teamViewMode"><option value="cards" ${view==='cards'?'selected':''}>Kaardid</option><option value="matrix" ${view==='matrix'?'selected':''}>Nädalatabel</option><option value="day" ${view==='day'?'selected':''}>Päev</option></select><select class="select" id="teamWeekScope"><option value="workdays" ${scope==='workdays'?'selected':''}>E–R</option><option value="full" ${scope==='full'?'selected':''}>E–P</option></select>${view==='day'?`<select class="select" id="teamDaySelect">${weekDayOptions}</select>`:''}`;
  const filters=`<input class="field" id="teamWeekStart" type="date" value="${esc(currentWeek)}">${teamStatusFilter}${teamPeopleFilter}${viewSwitch}`;
  const actions=`<button class="btn ghost" id="teamPrevWeekBtn" type="button">‹ Eelmine</button><button class="btn primary" id="teamThisWeekBtn" type="button">↕ Täna</button><button class="btn ghost" id="teamNextWeekBtn" type="button">Järgmine ›</button>`;

  const techCards=visiblePeople.map(p=>{
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

  const matrixRows=visiblePeople.map(p=>{
    const cells=visibleDays.map(date=>{
      const jobs=personDayJobs(p,date);
      const h=jobs.reduce((sum,w)=>sum+workorderHours(w),0);
      const abs=state.absences.filter(a=>a.personId===p.id&&a.start<=date&&a.end>=date);
      const oc=state.oncall.filter(o=>o.personId===p.id&&o.start<=date&&o.end>=date);
      const dayInfo=estonianCalendarDayInfo(date);
      const classes=['team-matrix-cell', h>=8?'busy':'', abs.length?'absent':'', oc.length?'oncall':'', dayInfo.isHoliday?'holiday':'', dayInfo.isShort?'short-day':''].filter(Boolean).join(' ');
      const items=jobs.slice(0,2).map(w=>`<div class="team-matrix-job"><strong>${esc(w.time||'')}</strong><span>${esc(objectName(w.objectId))}</span><span>${workorderHours(w)} h${workorderDaySpan(w)>1?' · '+esc(daysBetweenKeys(w.date,date)+1)+'/'+esc(workorderDaySpan(w)):''} · ${esc(workorderRoleLabel(w,p.id))}</span></div>`).join('');
      const more=jobs.length>2?`<span class="team-more">+${jobs.length-2} veel</span>`:'';
      const workSummary=jobs.length?`<span class="team-day-count">${jobs.length} tööd</span>`:'<span class="muted">Vaba</span>';
      const holidayBadge=dayInfo.isHoliday?`<span class="status holiday" title="${esc(dayInfo.name)}">Riigipüha</span>`:(dayInfo.isShort?`<span class="status holiday" title="${esc(dayInfo.name)}">Lühike</span>`:'');
      return `<td class="${classes}"><div class="team-cell-head"><strong>${h?h+' h':'-'}</strong>${holidayBadge}${abs.length?'<span class="status warn">Puudub</span>':''}${oc.length?'<span class="status warn">Valve</span>':''}</div>${workSummary}${items}${more}</td>`;
    }).join('');
    const jobs=personJobs(p);
    const hours=jobs.reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0);
    return `<tr data-team-person="${p.id}" class="${p.id===selectedTeamPersonId?'selected':''}"><th><strong>${esc(p.name)}</strong><span class="muted">${esc(p.role||'Tehnik')} · ${hours} h</span></th>${cells}</tr>`;
  }).join('');
  const matrixHtml=`<div class="team-matrix-wrap"><table class="team-matrix"><thead><tr><th>Töötaja</th>${visibleDays.map((d,i)=>{const dayInfo=estonianCalendarDayInfo(d);return `<th class="${dayInfo.isHoliday?'holiday':dayInfo.isShort?'short-day':''}">${dayNames[weekDays.indexOf(d)]}<span>${esc(fmtActDate(d))}</span>${holidayShortMarker(d)}</th>`;}).join('')}</tr></thead><tbody>${matrixRows}</tbody></table></div>`;

  const dayHtml=`<div class="team-day-view">${visiblePeople.map(p=>{
    const jobs=dayWorkorders.filter(w=>workorderMatchesPerson(w,p.id)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    const abs=state.absences.filter(a=>a.personId===p.id&&a.start<=selectedDay&&a.end>=selectedDay);
    const oc=state.oncall.filter(o=>o.personId===p.id&&o.start<=selectedDay&&o.end>=selectedDay);
    const body=abs.length?`<div class="event-row"><strong>${esc(abs[0].type)}</strong><span class="muted">${esc(abs[0].note||'Puudumine')}</span></div>`:(jobs.map(w=>`<div class="team-job-line"><strong>${esc(w.time||'')} · ${esc(workorderObjectLabel(w))}</strong><span>${esc(w.title)}</span><span class="muted">${esc(clientName(objectClientId(w.objectId)))} · ${esc(w.status)} · ${workorderHours(w)} h · ${esc(workorderRoleLabel(w,p.id))}${workorderDaySpan(w)>1?' · '+esc(daysBetweenKeys(w.date,selectedDay)+1)+'/'+esc(workorderDaySpan(w)):''}</span></div>`).join('')||'<span class="muted">Vaba</span>');
    return `<div class="card clickable team-day-card ${p.id===selectedTeamPersonId?'selected':''}" data-team-person="${p.id}"><div class="card-top"><h3>${esc(p.name)}</h3>${oc.length?'<span class="status warn">Valves</span>':abs.length?'<span class="status warn">Puudub</span>':'<span class="status ok">Saadaval</span>'}</div><div class="team-job-list">${body}</div></div>`;
  }).join('')}</div>`;

  const totalHours=visibleWorkorders.reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0);
  const absentCount=visiblePeople.filter(p=>teamWorkConflictsForPerson(p.id,visibleDays).length||teamOncallConflictsForPerson(p.id,visibleDays).length).length;
  const overloaded=visiblePeople.filter(p=>personJobs(p).reduce((sum,w)=>sum+workorderHoursInRange(w,visibleDays),0)>=(scope==='full'?42:32)).length;
  const content=view==='matrix'?matrixHtml:(view==='day'?dayHtml:`<div class="grid team-grid">${techCards}</div>`);
  const summaryWorkCount=view==='day'?dayWorkorders.length:visibleWorkorders.length;
  const summaryHours=view==='day'?dayWorkorders.reduce((sum,w)=>sum+workorderHours(w),0):totalHours;
  const summaryWarnings=absentCount+overloaded;
  const teamSummaryBar=`<div class="team-summary-bar" aria-label="Tiimivaate kokkuvõte"><span>Töötajad: <strong>${esc(visiblePeople.length)}</strong></span><span>Tööd: <strong>${esc(summaryWorkCount)}</strong></span><span>H: <strong>${esc(summaryHours)}</strong></span><span>⚠ <strong>${esc(summaryWarnings)}</strong></span></div>`;
  const teamHeaderLabel=formatViewPeriod('Tiimivaade',view==='day'?'day':'week',view==='day'?[selectedDay]:visibleDays,currentWeek,{hideRange:view!=='day'});
  window.__VECO_ONCALL_CONTEXT_DAYS__ = view==='day' ? [selectedDay] : visibleDays;
  const main=header('Tiimivaade',filters,actions,teamHeaderLabel)+`<div class="detail-body">${scopeNotice()}${teamSummaryBar}${content}</div>`;
  const detail=selectedTeamPersonId?teamDetailHtml(visibleDays,view==='day'?dayWorkorders:visibleWorkorders):'';
  shell(main,detail);
  $('#teamWeekStart')?.addEventListener('change',()=>{const next=weekStartKeyFrom($('#teamWeekStart').value); localStorage.setItem('veco_team_week',next); $('#teamWeekStart').value=next; renderTeam();}); $('#teamViewMode')?.addEventListener('change',renderTeam); $('#teamWeekScope')?.addEventListener('change',renderTeam); $('#teamDaySelect')?.addEventListener('change',renderTeam);
  bindEmployeeMultiFilter('team',renderTeam);
  $('#teamStatusFilterBtn')?.addEventListener('click',e=>{ e.stopPropagation(); $('#teamStatusMenu')?.classList.toggle('hidden'); });
  $$('#teamStatusMenu input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{
    const selected=$$('#teamStatusMenu input[type="checkbox"]:checked').map(i=>i.value);
    localStorage.setItem('veco_team_statuses',JSON.stringify(selected.length?selected:['Planeeritud','Töös']));
    renderTeam();
  }));
  $('#teamStatusOpenBtn')?.addEventListener('click',e=>{ e.stopPropagation(); localStorage.setItem('veco_team_statuses',JSON.stringify(openStatuses)); renderTeam(); });
  $('#teamStatusAllBtn')?.addEventListener('click',e=>{ e.stopPropagation(); localStorage.setItem('veco_team_statuses',JSON.stringify(allTeamStatuses)); renderTeam(); });
  $('#teamStatusDefaultBtn')?.addEventListener('click',e=>{ e.stopPropagation(); localStorage.setItem('veco_team_statuses',JSON.stringify(['Planeeritud','Töös'])); renderTeam(); });
  $$('[data-team-status-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
    const value=btn.dataset.teamStatusToggle;
    const next=new Set(selectedStatuses);
    next.has(value)?next.delete(value):next.add(value);
    localStorage.setItem('veco_team_statuses',JSON.stringify(Array.from(next).length?Array.from(next):['Planeeritud','Töös']));
    renderTeam();
  }));
  document.addEventListener('pointerdown',function teamPeopleOutside(e){
    const wrap=document.querySelector('[data-employee-filter="team"]');
    if(!document.body.contains(wrap)){ document.removeEventListener('pointerdown',teamPeopleOutside,true); return; }
    const statusWrap=$('#teamStatusFilterWrap');
    if(wrap&&!wrap.contains(e.target)) document.querySelector('[data-employee-filter-menu="team"]')?.classList.add('hidden');
    if(statusWrap&&!statusWrap.contains(e.target)) $('#teamStatusMenu')?.classList.add('hidden');
  },true);
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
  const jobsHtml=jobs.map(w=>`<div class="event-row"><strong>${esc(workorderDateRangeLabel(w))} ${esc(w.time)} · ${esc(w.title)}</strong><span class="muted">${esc(clientName(objectClientId(w.objectId)))} · ${esc(workorderObjectLabel(w))} · ${esc(projectName(w.projectId))} · ${workorderHoursInRange(w,weekDays)} h · ${esc(workorderRoleLabel(w,p.id))}</span><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join('')||'<span class="muted">Sellel nädalal valitud filtriga töid ei ole.</span>';
  const absHtml=abs.map(a=>`<div class="event-row"><strong>${esc(a.type)} ${esc(a.start)}–${esc(a.end)}</strong><span class="muted">${esc(a.note)}</span></div>`).join('')||'<span class="muted">Puudumisi ei ole.</span>';
  const ocHtml=oc.map(o=>`<div class="event-row"><strong>Valve ${esc(o.start)}–${esc(o.end)}</strong><span class="muted">${esc(o.note)}</span></div>`).join('')||'<span class="muted">Valvet ei ole.</span>';
  return detailHeader(`${p.name} · detail`,'<button class="btn ghost" id="teamDetailCloseBtn" type="button">× Sulge</button>')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Töid',jobs.length)}${summaryBox('Tunde',hours)}${summaryBox('Puudumisi',abs.length)}${summaryBox('Valveid',oc.length)}</div>${card(p.name,[['Roll',p.role],['Piirkond',p.region],['Telefon',p.phone],['E-post',p.email],['Oskused',p.skills]],workloadStatus(hours,abs))}<div class="section-title">Nädala tööd</div><div class="list">${jobsHtml}</div><div class="section-title">Saadavuse kirjed</div><div class="list">${absHtml}</div><div class="section-title">Valve</div><div class="list">${ocHtml}</div></div>`;
}

function nextOncallOrder(){
  return Math.max(0,...(state.people||[]).filter(p=>p&&p.onCallActive===true).map(p=>Number(p.onCallOrder)||0))+1;
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
  const main=header('Valvegraafik','',actions,label)+`<div class="detail-body"><div class="summary-grid">${summaryBox('Aktiivseid',active.length)}${summaryBox('Valveid',state.oncall.length)}${summaryBox('Täna valves',currentOncallLabel([today]))}${summaryBox('Hoiatusi',conflicts)}</div><div class="oncall-layout"><section class="card"><div class="card-top"><h3>Osalejad ja järjekord</h3><span class="status ok">Lohista</span></div><div class="oncall-sort-list" id="oncallSortList">${activeHtml}</div><div class="muted">Järjekord salvestatakse tehniku külge ja seda kasutatakse rotatsiooni genereerimisel.</div></section><section class="card"><div class="card-top"><h3>Konfliktid / Märkused</h3><span class="status ${conflicts?'warn':'ok'}">${conflicts?conflicts:'OK'}</span></div><div class="list">${state.oncall.flatMap(o=>oncallConflicts(o).map(a=>`<div class="event-row"><strong>⚠ ${esc(techName(o.personId))}</strong><span class="muted">Valve ${fmtActDate(o.start)}–${fmtActDate(o.end)} kattub: ${esc(a.type)} ${fmtActDate(a.start)}–${fmtActDate(a.end)}</span></div>`)).join('')||'<span class="muted">Konflikte ei ole.</span>'}</div></section></div><div class="section-title">Valvekirjed</div>${table(['Tehnik','Algus','Lõpp','Märkus','Staatus','Tegevused'],shiftRows)}</div>`;
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
      confirmText:'Arhiveeri',
      cancelText:'Loobu',
      danger:true
    });
    if(!ok) return;
    const previousOncall=state.oncall.slice();
    state.oncall=state.oncall.filter(x=>x.id!==id);
    try{
      save();
      if(window.VECO_API&&window.VECO_API.mode&&window.VECO_API.mode()==='supabase'){
        await window.VECO_API.syncOncallAssignments(state.oncall,state.people);
        const remote=await window.VECO_API.loadOncallAssignments(state.people);
        if(Array.isArray(remote)) state.oncall=remote;
        save();
      }
      renderOncall();
    }catch(err){
      state.oncall=previousOncall;
      save();
      console.error('VECO on-call delete/save failed',err);
      alert("Valve salvestamine Supabase'i ebaõnnestus: "+(err&&err.message?err.message:err));
      renderOncall();
    }
  }));
  let draggedId='';
  $$('#oncallSortList .oncall-person').forEach(item=>{
    item.addEventListener('dragstart',()=>{draggedId=item.dataset.oncallPerson;item.classList.add('dragging');});
    item.addEventListener('dragend',()=>{item.classList.remove('dragging');draggedId='';});
    item.addEventListener('dragover',e=>{e.preventDefault();const target=item.dataset.oncallPerson;if(!draggedId||draggedId===target)return;const list=activeOncallPeople().map(p=>p.id);const from=list.indexOf(draggedId);const to=list.indexOf(target);if(from<0||to<0)return;list.splice(to,0,list.splice(from,1)[0]);list.forEach((id,idx)=>{const p=byId(state.people,id);if(p){p.onCallActive=true;p.onCallOrder=idx+1;}});save();renderOncall();clearTimeout(window.__vecoOncallOrderSaveTimer);window.__vecoOncallOrderSaveTimer=setTimeout(async()=>{try{for(const id of list){await persistPersonAuthToRemote(byId(state.people,id));}}catch(err){console.warn('VECO on-call order remote save failed',err);}},300);});
  });
}
function openOncallModal(id=''){
  normalizeOncallPeople();
  const active=activeOncallPeople();
  const today=dateKeyFromDate(new Date());
  const o=id?byId(state.oncall,id):{personId:active[0]?.id||state.people[0]?.id||'',start:today,end:today,note:'Telefonivalve'};
  openModal(`<form id="oncallForm"><div class="dialog-head"><h2>${id?'Muuda valvet':'Lisa valve'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Tehnik<select class="select" name="personId">${state.people.filter(p=>p.active).map(p=>`<option value="${p.id}" ${o.personId===p.id?'selected':''}>${esc(p.name)}${p.onCallActive?'':' · ei osale rotatsioonis'}</option>`).join('')}</select></label><label>Algus<input class="field" name="start" type="date" required value="${esc(o.start)}"></label><label>Lõpp<input class="field" name="end" type="date" required value="${esc(o.end)}"></label><label>Märkus<input class="field" name="note" value="${esc(o.note||'')}"></label></div><div class="muted">Kui valve kattub puhkuse/puudumise/haigusega, kuvatakse valvegraafikus hoiatus.</div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#oncallForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const next={id:id||uid('OC'),personId:f.personId.value,userName:techName(f.personId.value),start:f.start.value,end:f.end.value,note:f.note.value,manualOverride:true};
    if(next.end<next.start){alert('Lõpp ei saa olla enne algust.');return;}
    const previousOncall=state.oncall.slice();
    if(id){Object.assign(o,next)}else{state.oncall.push(next)}
    try{
      save();
      if(window.VECO_API&&window.VECO_API.mode&&window.VECO_API.mode()==='supabase'){
        await window.VECO_API.syncOncallAssignments(state.oncall,state.people);
        const remote=await window.VECO_API.loadOncallAssignments(state.people);
        if(Array.isArray(remote)) state.oncall=remote;
        save();
      }
      closeModal();
      renderOncall();
    }catch(err){
      state.oncall=previousOncall;
      save();
      console.error('VECO on-call save failed',err);
      alert("Valve salvestamine Supabase'i ebaõnnestus: "+(err&&err.message?err.message:err));
      renderOncall();
    }
  });
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
    state.oncall.push({id:uid('OC'),personId:p.id,userName:p.name||techName(p.id),start,end,note:'Telefonivalve',manualOverride:false});
  }
  try{
    save();
    if(window.VECO_API&&window.VECO_API.mode&&window.VECO_API.mode()==='supabase'){
      await window.VECO_API.syncOncallAssignments(state.oncall,state.people);
      const remote=await window.VECO_API.loadOncallAssignments(state.people);
      if(Array.isArray(remote)) state.oncall=remote;
      save();
    }
    renderOncall();
  }catch(err){
    console.error('VECO on-call generation save failed',err);
    alert("Valvegraafiku salvestamine Supabase'i ebaõnnestus: "+(err&&err.message?err.message:err));
    renderOncall();
  }
}
function absenceDays(a){ return daysBetweenKeys(a.start,a.end)+1; }
function absenceIsActive(a,today=dateKeyFromDate(new Date())){ return a.start<=today && a.end>=today; }
function absenceIsUpcoming(a,today=dateKeyFromDate(new Date())){ return a.start>today; }
function absenceTypeClass(type){
  const t=String(type||'').toLowerCase();
  if(t.includes('haig')) return 'red';
  if(t.includes('puhkus')) return 'ok';
  if(t.includes('koolitus')) return 'warn';
  if(t.includes('osaliselt')||t==='partial') return 'warn';
  if(t.includes('mitte')||t==='unavailable') return 'red';
  if(t.includes('valve')) return 'info';
  if(t.includes('lähet')||t.includes('lahet')) return 'info';
  return 'warn';
}
function availabilityMeta(type){
  const t=String(type||'').toLowerCase();
  if(t.includes('puhkus')||t==='vacation') return {icon:'🏖', label:'Puhkus', cls:'vacation'};
  if(t.includes('haig')||t==='sick') return {icon:'🤒', label:'Haigus', cls:'sick'};
  if(t.includes('koolitus')||t==='training') return {icon:'🎓', label:'Koolitus', cls:'training'};
  if(t.includes('valve')||t==='oncall') return {icon:'☎', label:'Valve', cls:'oncall'};
  if(t.includes('osaliselt')||t==='partial') return {icon:'◐', label:'Osaliselt', cls:'partial'};
  if(t.includes('mitte')||t==='unavailable') return {icon:'⛔', label:'Mitte saadaval', cls:'absent'};
  if(t.includes('lähet')||t.includes('lahet')) return {icon:'🚗', label:'Lähetus', cls:'travel'};
  if(t.includes('puud')) return {icon:'⛔', label:'Puudub', cls:'absent'};
  return {icon:'📌', label:type||'Muu', cls:'other'};
}
function activeAbsencesForPerson(personId,day=dateKeyFromDate(new Date())){
  return (state.absences||[]).filter(a=>a.personId===personId && a.start<=day && a.end>=day);
}
function activeOncallForPerson(personId,day=dateKeyFromDate(new Date())){
  return (state.oncall||[]).filter(o=>o.personId===personId && o.start<=day && o.end>=day);
}
function availabilityBadgesForPerson(personId,day=dateKeyFromDate(new Date())){
  const person=byId(state.people||[],personId);
  const status=String(person?.availabilityStatus||'available').toLowerCase();
  const statusBadge=status&&status!=='available'?(()=>{const meta=availabilityMeta(status);return [{kind:'status',cls:meta.cls,icon:meta.icon,label:meta.label,title:meta.label}];})():[];
  const abs=activeAbsencesForPerson(personId,day).map(a=>{
    const meta=availabilityMeta(a.type||'Puudumine');
    return {kind:'absence', cls:meta.cls, icon:meta.icon, label:meta.label, title:`${meta.label}: ${fmtActDate(a.start)}–${fmtActDate(a.end)}${a.note?' · '+a.note:''}`};
  });
  const calls=activeOncallForPerson(personId,day).map(o=>{
    const meta=availabilityMeta('Valve');
    return {kind:'oncall', cls:meta.cls, icon:meta.icon, label:'Valve', title:`Valve: ${fmtActDate(o.start)}–${fmtActDate(o.end)}${o.note?' · '+o.note:''}`};
  });
  return [...statusBadge,...abs,...calls];
}
function availabilityBadgesHtml(personId,day=dateKeyFromDate(new Date()),opts={}){
  const badges=availabilityBadgesForPerson(personId,day);
  if(!badges.length) return opts.empty?`<div class="availability-strip availability-ok"><span>✓ Saadaval</span></div>`:'';
  return `<div class="availability-strip">${badges.map(b=>`<span class="availability-badge availability-${esc(b.cls)}" title="${esc(b.title)}">${esc(b.icon)} ${esc(b.label)}</span>`).join('')}</div>`;
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
function availabilityPeriodStart(){
  const stored=localStorage.getItem('veco_availability_week_start')||'';
  if(/^\d{4}-\d{2}-\d{2}$/.test(stored)) return weekStartKeyFrom(stored);
  return weekStartKeyFrom(dateKeyFromDate(new Date()));
}
function setAvailabilityPeriodStart(value){
  localStorage.setItem('veco_availability_week_start',weekStartKeyFrom(value));
}
function availabilityStatusForPersonDay(personId,day){
  const abs=activeAbsencesForPerson(personId,day);
  const calls=activeOncallForPerson(personId,day);
  if(abs.length){
    const priority=['Haigus','Mitte saadaval','Puhkus','Osaliselt saadaval','Koolitus','Lähetus','Puudumine','Muu'];
    const pick=abs.slice().sort((a,b)=>priority.findIndex(x=>String(a.type||'').toLowerCase().includes(x.toLowerCase()))-priority.findIndex(x=>String(b.type||'').toLowerCase().includes(x.toLowerCase())))[0]||abs[0];
    const meta=availabilityMeta(pick.type||'Puudumine');
    return {kind:'absence',type:pick.type||'Puudumine',label:meta.label,icon:meta.icon,cls:meta.cls,title:`${meta.label}: ${fmtActDate(pick.start)}–${fmtActDate(pick.end)}${pick.note?' · '+pick.note:''}`};
  }
  if(calls.length){
    const meta=availabilityMeta('Valve');
    return {kind:'oncall',type:'Valve',label:meta.label,icon:meta.icon,cls:meta.cls,title:`Valve: ${calls.map(o=>`${fmtActDate(o.start)}–${fmtActDate(o.end)}`).join(', ')}`};
  }
  return {kind:'available',type:'Tööl',label:'Tööl',icon:'✓',cls:'available',title:'Tööl / saadaval'};
}
function entriesInRange(list,start,end){
  return (list||[]).filter(x=>x.start<=end && x.end>=start);
}
function availabilityConflictItems(entries){
  return entries.flatMap(a=>[
    ...absenceWorkConflicts(a).map(w=>({type:'work',personId:a.personId,absence:a,text:`${techName(a.personId)} · ${a.type} kattub tööga: ${w.title} · ${fmtActDate(w.date)}${workorderEndDate(w)!==w.date?'–'+fmtActDate(workorderEndDate(w)):''} · ${objectName(w.objectId)}`})),
    ...absenceOncallConflicts(a).map(o=>({type:'oncall',personId:a.personId,absence:a,text:`${techName(a.personId)} · ${a.type} kattub valvega: ${fmtActDate(o.start)}–${fmtActDate(o.end)}`}))
  ]);
}
function availabilityMonthCalendarHtml(monthDate,rangeStart,rangeEnd){
  const y=monthDate.getFullYear();
  const m=monthDate.getMonth();
  const first=new Date(y,m,1);
  const last=new Date(y,m+1,0);
  const offset=(first.getDay()||7)-1;
  const cells=[];
  for(let i=0;i<offset;i++) cells.push('<span class="availability-mini-day empty"></span>');
  for(let d=1;d<=last.getDate();d++){
    const key=dateKeyFromDate(new Date(y,m,d));
    const entries=entriesInRange(state.absences,key,key);
    const conflicts=availabilityConflictItems(entries).length;
    const hasOncall=(state.oncall||[]).some(o=>o.start<=key&&o.end>=key);
    const dayInfo=estonianCalendarDayInfo(key);
    const cls=conflicts?'conflict':entries.length?'limited':hasOncall?'oncall':dayInfo.isHoliday?'holiday':dayInfo.isShort?'short-day':'ok';
    const selected=key>=rangeStart&&key<=rangeEnd?' selected':'';
    const title=[fmtActDate(key),dayInfo.name].filter(Boolean).join(' · ');
    cells.push(`<button class="availability-mini-day ${cls}${selected}" data-availability-day="${key}" type="button" title="${esc(title)}">${d}${dayInfo.isHoliday?'<em>★</em>':''}</button>`);
  }
  const monthName=monthDate.toLocaleString('et-EE',{month:'long',year:'numeric'}).toUpperCase();
  return `<div class="availability-mini-calendar"><div class="availability-mini-head"><button class="btn small ghost" data-availability-month="prev" type="button">‹</button><strong>${esc(monthName)}</strong><button class="btn small ghost" data-availability-month="next" type="button">›</button></div><div class="availability-weekdays"><span>E</span><span>T</span><span>K</span><span>N</span><span>R</span><span>L</span><span>P</span></div><div class="availability-mini-grid">${cells.join('')}</div><div class="availability-mini-legend"><span><i class="dot ok"></i>OK</span><span><i class="dot limited"></i>Piirang</span><span><i class="dot conflict"></i>Konflikt</span><span><i class="dot oncall"></i>Valve</span><span><i class="dot holiday"></i>Riigipüha</span></div></div>`;
}

function availabilityCompactHeader(rangeStart,rangeEnd,rangeMode,actions=''){
  const days=weekDaysFrom(rangeStart);
  const monthLabel=rangeMonthLabel(days,rangeStart);
  const weekNo=isoWeekNumber(rangeStart);
  const mainLabel=`${monthLabel} · NÄDAL ${weekNo}`.toUpperCase();
  const dateRange=`${fmtShortDate(rangeStart)}–${fmtShortDate(rangeEnd)}`;
  const rangeSelect=`<select class="select calendar-top-view availability-header-range" id="availabilityRangeSelect" aria-label="Vahemik"><option value="this-week" ${rangeMode==='this-week'?'selected':''}>See nädal</option><option value="today">Täna</option><option value="next-week" ${rangeMode==='next-week'?'selected':''}>Järgmine nädal</option><option value="this-month">See kuu</option>${rangeMode==='custom'?'<option value="custom" selected>Kohandatud</option>':''}</select>`;
  return `<div class="calendar-compact-head availability-compact-head filters-closed">
    <div class="calendar-compact-main">
      <div class="calendar-compact-left">
        ${themeLogo()}
        <div class="calendar-nav-mini" aria-label="Saadavuse navigeerimine">
          <button class="btn ghost square" data-availability-nav="prev" type="button" title="Eelmine">‹</button>
          <button class="btn primary" data-availability-jump="today" type="button">Täna</button>
          <button class="btn ghost square" data-availability-nav="next" type="button" title="Järgmine">›</button>
        </div>
        <div class="calendar-period-title"><strong>${esc(mainLabel)}</strong><span>${esc(dateRange)} <b>•</b> <em>VALVE: ${esc(currentOncallLabel(days)).toUpperCase()}</em></span></div>
      </div>
      <div class="calendar-compact-right">
        ${rangeSelect}
        ${actions||''}
      </div>
    </div>
  </div>`;
}

function renderVacations(){
  const today=dateKeyFromDate(new Date());
  const start=availabilityPeriodStart();
  const [rangeStart,rangeEnd]=weekRangeFrom(start,7);
  const days=weekDaysFrom(rangeStart);
  const selectedMonth=parseDateKey(localStorage.getItem('veco_availability_month')||rangeStart);
  const sorted=(state.absences||[]).slice().sort((a,b)=>a.start.localeCompare(b.start)||techName(a.personId).localeCompare(techName(b.personId)));
  const visibleEntries=entriesInRange(sorted,rangeStart,rangeEnd);
  const upcoming=sorted.filter(a=>a.start>today);
  const conflictsList=availabilityConflictItems(visibleEntries);
  const activePeople=(state.people||[]).filter(p=>p.active!==false).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'et'));
  const availableInRange=activePeople.filter(p=>days.every(day=>availabilityStatusForPersonDay(p.id,day).kind!=='absence')).length;
  const limitedInRange=activePeople.length-availableInRange;
  const oncallInRange=(state.oncall||[]).filter(o=>o.start<=rangeEnd&&o.end>=rangeStart).length;
  const dbMode=window.VECO_API?.modeLabel?.()||'lokaalne';
  const periodTitle=`Nädal ${isoWeekNumber(rangeStart)} (${fmtActDate(rangeStart).slice(0,5)}–${fmtActDate(rangeEnd).slice(0,5)})`;
  const thisWeekStart=weekStartKeyFrom(today);
  const nextWeekStart=dateKeyFromDate(addDateDays(parseDateKey(thisWeekStart),7));
  const rangeMode=rangeStart===nextWeekStart?'next-week':(rangeStart===thisWeekStart?'this-week':'custom');
  const actions='<button class="btn primary" id="newAbsenceBtn" type="button">＋ Lisa saadavuse kirje</button>';
  const row=(a)=>{
    const conflict=absenceConflictSummary(a);
    const status=absenceIsActive(a,today)?'<span class="status warn">Täna</span>':(a.end<today?'<span class="status">Möödunud</span>':'<span class="status ok">Planeeritud</span>');
    return `<tr><td><strong>${esc(techName(a.personId))}</strong><div class="muted">${esc(a.note||'')}</div></td><td><span class="status ${absenceTypeClass(a.type)}">${esc(a.type||'Puudumine')}</span></td><td>${esc(fmtActDate(a.start))}</td><td>${esc(fmtActDate(a.end))}</td><td>${absenceDays(a)} p</td><td>${conflict?`<span class="status warn">⚠ ${esc(conflict)}</span>`:'<span class="status ok">OK</span>'}</td><td>${status}</td><td><button class="btn small" data-edit-absence="${esc(a.id)}" type="button">Muuda</button> <button class="btn small danger" data-delete-absence="${esc(a.id)}" type="button">Kustuta</button></td></tr>`;
  };
  const visibleOncalls=entriesInRange(state.oncall||[],rangeStart,rangeEnd);
  const noteItems=[
    ...visibleEntries.map(a=>({kind:'absence',personId:a.personId,type:a.type||'Puudumine',start:a.start,end:a.end,days:absenceDays(a),note:a.note||''})),
    ...visibleOncalls.map(o=>({kind:'oncall',personId:o.personId,type:'Valve',start:o.start,end:o.end,days:days.filter(d=>d>=o.start&&d<=o.end).length||'',note:o.note||''}))
  ].sort((a,b)=>String(techName(a.personId)).localeCompare(String(techName(b.personId)),'et')||String(a.start).localeCompare(String(b.start)));
  const noteHtml=noteItems.map(item=>{const meta=availabilityMeta(item.type);return `<div class="availability-note-item"><span class="availability-cell availability-cell-${esc(meta.cls)}"><b>${esc(meta.label.slice(0,1))}</b></span><div><strong>${esc(techName(item.personId))}</strong><span>${esc(meta.label)} ${esc(fmtActDate(item.start))}–${esc(fmtActDate(item.end))}${item.days?` · ${esc(item.days)} p`:''}${item.note?` · ${esc(item.note)}`:''}</span></div></div>`;}).join('');
  const conflictHtml=conflictsList.length?conflictsList.map(c=>`<div class="event-row"><strong>⚠ ${esc(techName(c.personId))}</strong><span class="muted">${esc(c.text)}</span></div>`).join(''):`<span class="muted">Valitud vahemikus konflikte ei leitud.</span>${noteHtml?`<div class="availability-note-divider"></div><div class="availability-note-title">Piirangud ja valved valitud perioodil</div>${noteHtml}`:''}`;
  const matrixRows=activePeople.map(p=>`<tr><th><strong>${esc(p.name)}</strong><div class="muted">${esc(p.role||'Töötaja')}</div></th>${days.map(day=>{const s=availabilityStatusForPersonDay(p.id,day);const dayInfo=estonianCalendarDayInfo(day);return `<td class="${dayInfo.isHoliday?'holiday':dayInfo.isShort?'short-day':''}"><span class="availability-cell availability-cell-${esc(s.cls)}" title="${esc(s.title)}"><b>${esc(s.icon)}</b><small>${esc(s.label.slice(0,1))}</small></span></td>`;}).join('')}</tr>`).join('')||'<tr><td colspan="8"><span class="muted">Aktiivseid töötajaid ei ole.</span></td></tr>';
  const matrix=`<div class="availability-matrix-wrap"><table class="availability-matrix"><thead><tr><th>Töötaja</th>${days.map(d=>{const dayInfo=estonianCalendarDayInfo(d);return `<th class="${dayInfo.isHoliday?'holiday':dayInfo.isShort?'short-day':''}"><span>${['E','T','K','N','R','L','P'][days.indexOf(d)]}</span><small>${fmtActDate(d).slice(0,5)}</small>${holidayShortMarker(d)}</th>`;}).join('')}</tr></thead><tbody>${matrixRows}</tbody></table></div>`;
  const legend=`<div class="availability-status-legend"><span><i class="availability-cell availability-cell-available">✓</i>Tööl</span><span><i class="availability-cell availability-cell-vacation">P</i>Puhkus</span><span><i class="availability-cell availability-cell-sick">H</i>Haigus</span><span><i class="availability-cell availability-cell-training">K</i>Koolitus</span><span><i class="availability-cell availability-cell-travel">L</i>Lähetus</span><span><i class="availability-cell availability-cell-partial">O</i>Osaliselt</span><span><i class="availability-cell availability-cell-oncall">V</i>Valve</span><span><i class="availability-cell availability-cell-absent">M</i>Mitte saadaval</span></div>`;
  const mini=availabilityMonthCalendarHtml(selectedMonth,rangeStart,rangeEnd);
  const main=availabilityCompactHeader(rangeStart,rangeEnd,rangeMode,actions)+`<div class="detail-body availability-page"><div class="team-summary-bar availability-summary-bar"><span>Töötajaid: <strong>${activePeople.length}</strong></span><span>Perioodis saadaval: <strong>${availableInRange}</strong></span><span>Piiranguga: <strong>${limitedInRange}</strong></span><span>Valveid: <strong>${oncallInRange}</strong></span><span>⚠ <strong>${conflictsList.length}</strong></span><span>Tulekul: <strong>${upcoming.length}</strong></span><span>DB: <strong>${esc(dbMode)}</strong></span></div><div class="availability-workspace"><section class="card availability-side"><div class="card-top"><h3>Minikalender</h3><span class="status ${conflictsList.length?'warn':'ok'}">${conflictsList.length?'Hoiatus':'OK'}</span></div>${mini}${legend}</section><section class="card availability-main"><div class="card-top"><h3>Ressursimaatriks</h3><span class="muted">alfabeetiline järjestus</span></div>${matrix}</section><section class="card availability-conflicts"><div class="card-top"><h3>Konfliktid / Märkused</h3><span class="status ${conflictsList.length?'warn':'ok'}">${conflictsList.length?conflictsList.length:'OK'}</span></div><div class="list">${conflictHtml}</div></section></div><div class="section-title">Saadavuse kirjed valitud vahemikus</div>${table(['Töötaja','Tüüp','Algus','Lõpp','Päevi','Konflikt','Staatus','Tegevused'],visibleEntries.map(row))}<div class="muted">Vahemiku vaade näitab kirjeid, mis algavad, lõppevad või kattuvad valitud nädalaga. Valvegraafik jääb eraldi tabelisse ja kuvatakse siin ainult planeerimise infona.</div></div>`;
  shell(main,'',{wide:true});
  bindVacations();
}
function bindVacations(){
  $('#newAbsenceBtn')?.addEventListener('click',()=>openAbsenceModal());
  $$('[data-availability-nav]').forEach(btn=>btn.addEventListener('click',()=>{
    const current=parseDateKey(availabilityPeriodStart());
    const delta=btn.dataset.availabilityNav==='prev'?-7:7;
    setAvailabilityPeriodStart(dateKeyFromDate(addDateDays(current,delta)));
    renderVacations();
  }));
  const applyAvailabilityRange=(value)=>{
    if(value==='custom') return;
    const today=dateKeyFromDate(new Date());
    if(value==='next-week') setAvailabilityPeriodStart(dateKeyFromDate(addDateDays(parseDateKey(weekStartKeyFrom(today)),7)));
    else setAvailabilityPeriodStart(today);
    if(value==='this-month') localStorage.setItem('veco_availability_month',today);
    renderVacations();
  };
  $('#availabilityRangeSelect')?.addEventListener('change',e=>applyAvailabilityRange(e.currentTarget.value));
  $$('[data-availability-jump]').forEach(btn=>btn.addEventListener('click',()=>applyAvailabilityRange(btn.dataset.availabilityJump)));
  $$('[data-availability-day]').forEach(btn=>btn.addEventListener('click',()=>{
    const day=btn.dataset.availabilityDay;
    setAvailabilityPeriodStart(day);
    localStorage.setItem('veco_availability_month',day);
    renderVacations();
  }));
  $$('[data-availability-month]').forEach(btn=>btn.addEventListener('click',()=>{
    const current=parseDateKey(localStorage.getItem('veco_availability_month')||availabilityPeriodStart());
    current.setMonth(current.getMonth()+(btn.dataset.availabilityMonth==='prev'?-1:1),1);
    localStorage.setItem('veco_availability_month',dateKeyFromDate(current));
    renderVacations();
  }));
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
      confirmText:'Arhiveeri',
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
  const a=id?byId(state.absences,id):{personId:'',type:'',start:'',end:'',note:''};
  const types=['Puhkus','Haigus','Koolitus','Lähetus','Osaliselt saadaval','Mitte saadaval','Puudumine','Muu'];
  openModal(`<form id="absenceForm"><div class="dialog-head"><h2>${id?'Muuda saadavust':'Lisa saadavus'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Töötaja<select class="select" name="personId" required><option value="" ${!a.personId?'selected':''} disabled>Vali töötaja...</option>${state.people.filter(p=>p.active).map(p=>`<option value="${esc(p.id)}" ${a.personId===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Tüüp<select class="select" name="type" required><option value="" ${!a.type?'selected':''} disabled>Vali tüüp...</option>${types.map(t=>`<option value="${t}" ${a.type===t?'selected':''}>${t}</option>`).join('')}</select></label><label>Algus<input class="field" name="start" type="date" required value="${esc(a.start)}"></label><label>Lõpp<input class="field" name="end" type="date" required value="${esc(a.end)}"></label><label class="full">Märkus<textarea name="note">${esc(a.note||'')}</textarea></label></div><div class="muted">Puhkus, haigus, koolitus ja muu saadavuse kirje tekitavad vajadusel hoiatused, kui samale ajale on planeeritud töö või valve. Valve ise jääb eraldi valvegraafiku tabelisse.</div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#absenceForm').addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const next={id:id||uid('EV'),personId:f.personId.value,type:f.type.value,start:f.start.value,end:f.end.value,note:f.note.value};if(next.end<next.start){alert('Lõpp ei saa olla enne algust.');return;}if(id){Object.assign(a,next)}else{state.absences.push(next)}save();closeModal();renderVacations();});
}
function activeMobilePeople(){
  const scopedId=scopedPersonId();
  const people=page==='technicianV1'?fieldTechnicianPeople():visiblePeopleForCurrentScope();
  return scopedId ? people.filter(p=>p.id===scopedId) : people;
}
function mobileCurrentUser(){
  const scopedId=scopedPersonId();
  if(scopedId) return activeMobilePeople().find(p=>p.id===scopedId)||null;
  const id=localStorage.getItem('veco_mobile_user_id')||'';
  const person=activeMobilePeople().find(p=>p.id===id)||null;
  if(id && !person) localStorage.removeItem('veco_mobile_user_id');
  return person;
}

function workorderTimestampHtml(w){
  const rows=[];
  if(w.startedAt) rows.push(['Alustatud',fmtDateTimeShort(w.startedAt)]);
  if(w.pausedAt && String(w.status||'').trim()==='Peatatud') rows.push(['Paus',fmtDateTimeShort(w.pausedAt)]);
  if(w.completedAt) rows.push([String(w.status||'')==='Teostatud'?'Teostatud':'Lõpetatud',fmtDateTimeShort(w.completedAt)]);
  if(!rows.length) return '';
  return `<div class="mobile-timebox">${rows.map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
}
function fmtDateTimeShort(value){
  if(!value) return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return String(value).slice(0,16).replace('T',' ');
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function isoToLocalDatetimeInput(value){
  if(!value) return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return String(value).slice(0,16);
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localDatetimeInputToIso(value){
  if(!value) return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}
function minutesBetweenIso(startIso,endIso){
  const a=new Date(startIso), b=new Date(endIso);
  if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())) return 0;
  return Math.max(0,Math.round((b-a)/60000));
}
function durationLabelFromMinutes(total){
  const minutes=Math.max(0,Number(total)||0);
  const h=Math.floor(minutes/60);
  const m=minutes%60;
  if(h&&m) return `${h} h ${m} min`;
  if(h) return `${h} h`;
  return `${m} min`;
}
function billableMinutesFromActual(actualMinutes, minimumMinutes=60){
  const actual=Math.max(0,Number(actualMinutes)||0);
  const minimum=Math.max(0,Number(minimumMinutes)||0);
  if(!actual) return 0;
  return Math.max(actual,minimum);
}
function updateWorkorderDurationFields(w,startedAt,completedAt,minimumMinutes=60){
  const actual=minutesBetweenIso(startedAt,completedAt);
  const billable=billableMinutesFromActual(actual,minimumMinutes);
  w.actualDurationMinutes=actual;
  w.actual_duration_minutes=actual;
  w.billableDurationMinutes=billable;
  w.billable_duration_minutes=billable;
  w.minimumBillableMinutes=minimumMinutes;
  w.minimum_billable_minutes=minimumMinutes;
  return {actual,billable,minimum:minimumMinutes};
}
function workTimeSummaryHtml(durationMinutes,billableMinutes,minimumMinutes=60){
  const actualLabel=durationLabelFromMinutes(durationMinutes);
  const billableLabel=durationLabelFromMinutes(billableMinutes);
  const minimumLabel=durationLabelFromMinutes(minimumMinutes);
  const note=billableMinutes>durationMinutes?`<br><span class="muted">Minimaalne arvestus: ${esc(minimumLabel)}</span>`:'';
  return `<strong>Tegelik kestus:</strong> ${esc(actualLabel)}<br><strong>Arvestatav kestus:</strong> ${esc(billableLabel)}${note}`;
}
function actualDurationLabel(w={}){
  const mins=minutesBetweenIso(w.startedAt||w.started_at,w.completedAt||w.completed_at);
  return mins?durationLabelFromMinutes(mins):`${workorderHours(w)} h`;
}
function workorderRegisteredAt(w={}){
  return w.createdAt||w.created_at||w.created||'';
}
function defaultWorkStartIso(w={},fallbackIso=''){
  if(w.startedAt||w.started_at) return w.startedAt||w.started_at;
  if(workorderRegisteredAt(w)) return workorderRegisteredAt(w);
  if(w.date){
    const t=String(w.time||'').slice(0,5)||'08:00';
    const d=new Date(`${w.date}T${t}:00`);
    if(!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallbackIso||new Date().toISOString();
}
function currentMobileActionUser(){
  const person=mobileCurrentUser() || scopedPerson() || null;
  if(person){
    if(person.dbId) return person;
    const auth=normalizeAuthUsers();
    const u=auth.users?.[person.id];
    return {...person, dbId:u?.dbId||'', username:u?.username||''};
  }
  return currentAuthUser() || null;
}
function mobileWorkflowButtons(w){
  const status=String(w.status||'').trim();
  if(isCompletedStatus(status)){
    const active=activeActForWorkorder(w.id);
    const archived=archivedActForWorkorder(w.id);
    const actLabel=active?'Ava akt':(archived?'Taasta akt':'Loo akt');
    const actBtn=(workorderActRequired(w)||active||archived)?`<button class="btn" data-mobile-act="${w.id}" type="button">${actLabel}</button>`:'';
    return `<button class="btn" data-mobile-edit="${w.id}" type="button">Muuda tööd</button>${actBtn}<button class="btn primary" data-mobile-action="reopen" data-workorder-id="${w.id}" type="button">↺ Ava uuesti</button>`;
  }
  if(status==='Töös'){
    return `<button class="btn" data-mobile-action="pause" data-workorder-id="${w.id}" type="button">⏸ Paus</button><button class="btn" data-mobile-edit="${w.id}" type="button">Täida</button><button class="btn primary" data-mobile-action="finish" data-workorder-id="${w.id}" type="button">✓ Töö valmis</button>`;
  }
  if(status==='Peatatud'){
    return `<button class="btn primary" data-mobile-action="resume" data-workorder-id="${w.id}" type="button">▶ Jätka</button><button class="btn" data-mobile-edit="${w.id}" type="button">Täida</button><button class="btn" data-mobile-action="finish" data-workorder-id="${w.id}" type="button">✓ Töö valmis</button>`;
  }
  return `<button class="btn primary" data-mobile-action="start" data-workorder-id="${w.id}" type="button">▶ Alusta tööd</button><button class="btn" data-mobile-edit="${w.id}" type="button">Täida</button>`;
}
function technicianV1WorkflowButtons(w){
  return mobileWorkflowButtons(w).replace(/<button class="btn" data-mobile-edit="[^>]*>Täida<\/button>/g,'');
}
async function applyMobileWorkorderAction(action,workorderId){
  const w=byId(state.workorders,workorderId);
  if(!w) return;
  const actor=currentMobileActionUser();
  const now=new Date().toISOString();
  const actorName=actor?.name || completedByLabel(w);
  const actorUuid=actor?.dbId || '';
  const workDetails=`<strong>${esc(objectName(w.objectId))}</strong><br>${esc(fmtActDate(w.date))} ${esc(w.time||'')} · ${esc(w.title||'')}`;
  if(action==='start'){
    const ok=await openVecoConfirm({title:'Alusta tööd',message:'Kas soovid töö alustada?',details:workDetails,confirmText:'Alusta tööd',cancelText:'Loobu'});
    if(!ok) return;
    w.status='Töös';
    if(!w.startedAt) w.startedAt=now;
    if(actorUuid) w.startedByUuid=actorUuid;
    if(actorName) w.startedBy=actorName;
  }else if(action==='resume'){
    const ok=await openVecoConfirm({title:'Jätka tööd',message:'Kas soovid peatatud tööga jätkata?',details:workDetails,confirmText:'Jätka',cancelText:'Loobu'});
    if(!ok) return;
    w.status='Töös';
  }else if(action==='pause'){
    const ok=await openVecoConfirm({title:'Peata töö',message:'Kas soovid töö ajutiselt peatada?',details:workDetails,confirmText:'Peata töö',cancelText:'Loobu'});
    if(!ok) return;
    w.status='Peatatud';
    w.pausedAt=now;
  }else if(action==='finish'){
    let result=normalizeCompletionResult(await openCompletionCommentModal(w,performedWorkText(w)||completionCommentText(w)));
    if(!result || !String(result.comment||'').trim()) return;
    const comment=String(result.performedWork||result.comment||'').trim();
    const billableMinutes=result.billableDurationMinutes||billableMinutesFromActual(result.durationMinutes,60);
    const timeSummary=`<strong>Algus:</strong> ${esc(fmtDateTimeShort(result.startedAt))}<br><strong>Lõpp:</strong> ${esc(fmtDateTimeShort(result.completedAt))}<br>${workTimeSummaryHtml(result.durationMinutes,billableMinutes,result.minimumBillableMinutes||60)}`;
    const ok=await openVecoConfirm({title:'Lõpeta töö',message:'Kas oled kindel, et töö on valmis?',details:`${workDetails}<br><br>${timeSummary}<br><br><strong>Teostatud töö:</strong><br>${esc(comment).replace(/\n/g,'<br>')}<br><br><strong>Töö märgitakse teostatuks.</strong> Kalendris jääb kaart alles, Field vaates liigub see lõpetatud tööde alla.`,confirmText:'Lõpeta töö',cancelText:'Tagasi'});
    if(!ok) return;
    w.startedAt=result.startedAt||now;
    if(actorUuid && !w.startedByUuid) w.startedByUuid=actorUuid;
    if(actorName && !w.startedBy) w.startedBy=actorName;
    w.status='Teostatud';
    w.completedAt=result.completedAt||now;
    updateWorkorderDurationFields(w,w.startedAt,w.completedAt,result.minimumBillableMinutes||60);
    w.completedBy=actorName;
    w.completedByUuid=actorUuid;
    w.completionComment=comment;
    w.actType=result.actType||w.actType||'Väljakutse akt';
    w.done=comment;
    w.workDone=comment;
    w.performedWork=comment;
    w.workResult=result.workResult||workResultText(w)||'';
    w.recommendations=result.recommendations||workRecommendationsText(w)||'';
    w.materials=result.materials||workMaterialsText(w)||'';
    if(workorderActRequired(w) && !actForWorkorder(w.id)){
      save();
      ensureActForWorkorder(w.id);
    }
  }else if(action==='reopen'){
    const act=actForWorkorder(w.id);
    const ok=await openVecoConfirm({title:'Ava töö uuesti',message:'Kas soovid lõpetatud töö uuesti avada?',details:`${workDetails}${act?'<br><br><strong>Seotud akt säilitatakse.</strong> Vajadusel uuenda akti eraldi akti vaates.':''}`,confirmText:'Ava uuesti',cancelText:'Loobu'});
    if(!ok) return;
    w.status='Töös';
  }
  save();
  state=window.VECO_STORAGE.load();
  if(page==='technicianV1') renderTechnicianV1();
  else renderMobile();
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
function mobileOncallOverview(todayKey){
  const shifts=(state.oncall||[])
    .filter(o=>o&&o.personId&&o.start&&o.end)
    .slice()
    .sort((a,b)=>`${a.start||''} ${a.end||''}`.localeCompare(`${b.start||''} ${b.end||''}`));
  const todayShift=shifts.find(o=>o.start<=todayKey&&o.end>=todayKey);
  const nextShift=shifts.find(o=>o.start>todayKey);
  const todayName=todayShift?techName(todayShift.personId):'Valve puudub';
  const nextName=nextShift?techName(nextShift.personId):'Valve puudub';
  const todayRange=todayShift?`${fmtActDate(todayShift.start)}–${fmtActDate(todayShift.end)}`:'';
  const nextRange=nextShift?`${fmtActDate(nextShift.start)}–${fmtActDate(nextShift.end)}`:'';
  return `<div class="mobile-oncall-overview" title="Tänane ja järgmine valve">
    <div class="mobile-oncall-line"><span>Täna valves</span><strong>${esc(todayName)}</strong>${todayRange?`<em>${esc(todayRange)}</em>`:''}</div>
    <div class="mobile-oncall-line"><span>Järgmine valve</span><strong>${esc(nextName)}</strong>${nextRange?`<em>${esc(nextRange)}</em>`:''}</div>
  </div>`;
}
function mobileNeedsAct(w){
  if(!w || !isCompletedStatus(w.status) || !workorderActRequired(w)) return false;
  return !actForWorkorder(w.id);
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
  return `<div class="card mobile-work-card ${opts.extraClass||''}"><div class="card-top"><h3>${esc(w.time||'')} · ${esc(workorderObjectLabel(w))}</h3><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div><div class="kv"><span>Klient</span><strong>${esc(clientName(objectClientId(w.objectId)))}</strong></div><div class="kv"><span>Töö</span><strong>${esc(w.title)}</strong></div><div class="kv"><span>Workflow</span><strong>${esc(taskWorkflowLabel(w))}</strong></div><div class="kv"><span>Omadused</span><strong>${esc(taskPropertiesSummary(w))}</strong></div><div class="kv"><span>Kuupäev</span><strong>${esc(dateLabel)}</strong></div>${rolePart}${dayPart}${actLabel?`<div class="kv"><span>Akt</span><strong>${esc(actLabel)}</strong></div>`:''}${workorderTimestampHtml(w)}<div class="muted">${esc(problemDescriptionText(w)||'')}</div><div class="actions mobile-actions">${mobileWorkflowButtons(w)}</div></div>`;
}
function renderMobile(){
  autoClosePerformedWorkorders();
  const USER_KEY='veco_mobile_user_id';
  const activePeople=authRole()==='admin'?fieldTechnicianPeople():activeMobilePeople();
  const current=technicianV1CurrentUser();
  if(!current){
    const today=dateKeyFromDate(new Date());
    const cards=activePeople.map(p=>`<button class="card clickable mobile-user-choice" data-mobile-user="${p.id}" type="button"><div class="card-top"><h3>${esc(p.name)}</h3><span class="status ${p.role==='Admin'?'ok':p.role==='Demo'?'warn':''}">${esc(p.role||'Tehnik')}</span></div>${availabilityBadgesHtml(p.id,today,{empty:true})}<span class="muted">${esc(p.region||'')} ${p.skills?`· ${esc(p.skills)}`:''}</span></button>`).join('')||'<span class="muted">Aktiivseid kasutajaid ei ole. Lisa kasutaja admin vaates.</span>';
    shell(`<div class="panel-head mobile-head mobile-head-split"><div><h2>VECO MINU TÖÖD</h2><span class="muted">Vali kasutaja piloodi testimiseks.</span></div><div class="filters mobile-head-actions">${mobileThemeButton()}</div></div><div class="detail-body mobile-detail"><div class="grid mobile-user-grid">${cards}</div></div>`,'',{wide:true});
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
  const actions=`${mobileThemeButton()}<button class="btn primary" id="mobileAddWorkBtn" type="button">＋ Lisa töö</button><button class="btn ghost" id="mobileSwitchUserBtn" type="button">⇄ Vaheta</button>`;
  const sectionSummary=(jobs,rangeStart,rangeEnd)=>{
    const hours=jobs.reduce((sum,w)=>sum+mobileJobPlannedHoursInRange(w,rangeStart,rangeEnd),0);
    return `<div class="mobile-future-title mobile-period-summary"><strong>${jobs.length} tööd</strong><span>${hours} h</span></div>`;
  };
  const completedRows=completedJobs.map(w=>{const comment=completionCommentText(w);const actLabel=mobileActLabel(w);return `<div class="card mobile-work-card mobile-completed-card"><div class="card-top"><h3>${esc(w.time||'')} · ${esc(workorderObjectLabel(w))}</h3><span class="status ${statusClass(w.status)}">${esc(w.status)}</span></div><div class="kv"><span>Klient</span><strong>${esc(clientName(objectClientId(w.objectId)))}</strong></div><div class="kv"><span>Töö</span><strong>${esc(w.title)}</strong></div><div class="kv"><span>Workflow</span><strong>${esc(taskWorkflowLabel(w))}</strong></div><div class="kv"><span>Omadused</span><strong>${esc(taskPropertiesSummary(w))}</strong></div><div class="kv"><span>Kuupäev</span><strong>${esc(workorderDateRangeLabel(w))}</strong></div>${actLabel?`<div class="kv"><span>Akt</span><strong>${esc(actLabel)}</strong></div>`:''}${workorderTimestampHtml(w)}${comment?`<div class="mobile-completion-comment"><strong>Töö tulemus</strong><span>${esc(comment)}</span></div>`:`<div class="muted">Töö tulemus puudub.</div>`}<div class="actions mobile-actions">${mobileWorkflowButtons(w)}</div></div>`}).join('')||'<div class="card"><strong>Lõpetatud töid ei ole</strong><span class="muted">Kui töö lõpetatakse, jääb see siia vajadusel uuesti avamiseks.</span></div>';
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
  const oncallOverview=mobileOncallOverview(today);
  const availabilityToday=availabilityBadgesHtml(current.id,today);
  const primaryTabs=['today','tomorrow','thisweek'];
  const moreTabs=['nextweek','unfinished','completed'];
  const tabButton=(key,extra='')=>{
    const g=groups[key];
    const warn=key==='unfinished'&&g.count>0?' warn':'';
    const active=key===activeTab?' active':'';
    return `<button class="mobile-filter-chip${active}${warn} ${extra}" data-mobile-tab="${key}" type="button"><span>${esc(g.short)}</span><strong>${g.count}</strong></button>`;
  };
  const moreActive=moreTabs.includes(activeTab);
  const moreLabel=moreActive?groups[activeTab].short:'⋯';
  const mobileFilterBar=`<div class="mobile-filter-row" aria-label="Tööde filter">${primaryTabs.map(k=>tabButton(k)).join('')}<details class="mobile-more-menu"><summary class="mobile-filter-chip${moreActive?' active':''}"><span>${esc(moreLabel)}</span><strong>${moreActive?activeGroup.count:'⋯'}</strong></summary><div class="mobile-more-popover">${moreTabs.map(k=>tabButton(k,'mobile-more-item')).join('')}</div></details></div>`;
  const activeBody=activeGroup.body||`<div class="card"><strong>${esc(activeGroup.empty)}</strong><span class="muted">Vali ülevalt teine filter või lisa uus töö.</span></div>`;
  shell(`<div class="panel-head mobile-head"><div><h2>${esc(current.name)}</h2>${oncallOverview}${availabilityToday}<span class="muted">${esc(headerStats)} · ${esc(current.role||'')}</span></div><div class="filters mobile-head-actions">${actions}</div></div><div class="detail-body mobile-detail">${mobileFilterBar}<div class="mobile-active-section"><div class="mobile-active-title"><h3>${esc(activeGroup.label)} (${activeGroup.count})</h3><span class="muted">Kaardivalik</span></div><div class="grid mobile-work-grid">${activeBody}</div></div></div>`,'',{wide:true});
  $('#mobileSwitchUserBtn')?.addEventListener('click',()=>{localStorage.removeItem(USER_KEY);renderMobile();});
  $('#mobileAddWorkBtn')?.addEventListener('click',()=>openMobileAddWorkModal(current.id));
  $$('[data-mobile-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.mobile-more-menu[open]').forEach(d=>d.open=false);localStorage.setItem('veco_mobile_active_tab',btn.dataset.mobileTab);renderMobile();}));
  setTimeout(()=>{
    const closeMobileMore=(ev)=>{
      document.querySelectorAll('.mobile-more-menu[open]').forEach(d=>{if(!d.contains(ev.target)) d.open=false;});
    };
    document.addEventListener('click',closeMobileMore,{once:true});
    document.addEventListener('keydown',(ev)=>{if(ev.key==='Escape') document.querySelectorAll('.mobile-more-menu[open]').forEach(d=>d.open=false);},{once:true});
  },0);
  $$('[data-mobile-action]').forEach(btn=>btn.addEventListener('click',()=>applyMobileWorkorderAction(btn.dataset.mobileAction,btn.dataset.workorderId)));
  $$('[data-mobile-edit]').forEach(btn=>btn.addEventListener('click',()=>openMobileWorkModal(btn.dataset.mobileEdit)));
  $$('[data-mobile-act]').forEach(btn=>btn.addEventListener('click',()=>{
    const workorderId=btn.dataset.mobileAct;
    const archived=archivedActForWorkorder(workorderId);
    if(archived){ restoreAct(archived.id); selectedActId=archived.id; window.location.href=pageFiles.acts; return; }
    const a=generateActFromWorkorder(workorderId);
    if(a){ selectedActId=a.id; window.location.href=pageFiles.acts; }
  }));
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
    notes:'Lisatud tehniku vaatest töö loomisel.',
    contacts:[]
  };
  state.objects.push(created);
  return created;
}

function calloutObjectQuickInfoHtml(objectId){
  const o=byId(state.objects,objectId);
  if(!o) return '';
  const client=clientName(o.clientId);
  const callouts=(state.workorders||[]).filter(w=>isCalloutWorkorder(w)&&w.objectId===objectId&&!isCompletedStatus(w.status));
  const lastCompleted=(state.workorders||[]).filter(w=>w.objectId===objectId && (isCompletedStatus(w.status)||w.completedAt||w.completed_at)).slice().sort((a,b)=>String(b.completedAt||b.completed_at||b.date||'').localeCompare(String(a.completedAt||a.completed_at||a.date||'')))[0];
  const bits=[];
  if(client&&client!=='-') bits.push(`<div><span>Klient</span><strong>${esc(client)}</strong></div>`);
  if(lastCompleted) bits.push(`<div><span>Viimane töö</span><strong>${esc(fmtActDate(lastCompleted.date)||fmtDateTimeShort(lastCompleted.completedAt||lastCompleted.completed_at)||'-')}</strong></div>`);
  bits.push(`<div><span>Avatud väljakutseid</span><strong>${callouts.length}</strong></div>`);
  return `<div class="callout-object-info" id="calloutObjectInfo">${bits.join('')}</div>`;
}
function openRegisterCalloutModal(opts={}){
  const auth=currentAuthUser();
  const actorId=opts.actorId||auth?.id||'';
  const today=dateKeyFromDate(new Date());
  const now=new Date();
  const pad=n=>String(n).padStart(2,'0');
  const timeNow=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const previewNumber=generateDisplayNumber(today,timeNow);
  const objectOptions=activeObjects().map(o=>`<option value="${esc(o.name)}" data-id="${esc(o.id)}" label="${esc(clientName(o.clientId))} · ${esc(o.address||'')}"></option>`).join('');
  const techOptions=activeTechnicians().map(p=>`<option value="${esc(p.id)}" ${p.id===actorId?'selected':''}>${esc(p.name)}</option>`).join('');
  const isTechSource=opts.source==='technicianV1';
  openModal(`<form id="registerCalloutForm"><div class="dialog-head"><div><div class="muted">Väljakutse ${esc(previewNumber)} <span class="muted">· luuakse salvestamisel</span></div><h2>Registreeri väljakutse</h2></div><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid register-callout-grid"><label class="full">Objekt *<input class="field" name="objectName" list="registerCalloutObjects" required autocomplete="off" placeholder="Vali objekt..."><datalist id="registerCalloutObjects">${objectOptions}</datalist></label><div class="full" id="calloutObjectInfoWrap"></div><label class="full">Prioriteet *<div class="priority-choice" role="radiogroup" aria-label="Prioriteet"><label><input type="radio" name="priority" value="Kiire"><span class="priority-pill priority-urgent">🔴 Kiire</span></label><label><input type="radio" name="priority" value="Kõrge"><span class="priority-pill priority-high">🟠 Kõrge</span></label><label><input type="radio" name="priority" value="Tavaline" checked><span class="priority-pill priority-normal">🟡 Tavaline</span></label><label><input type="radio" name="priority" value="Planeeritav"><span class="priority-pill priority-low">🟢 Planeeritav</span></label></div></label><label class="full">Lühikirjeldus *<input class="field" name="title" required placeholder="Mis juhtus? nt Ruumides palav"></label><label class="full">Lisainfo<textarea name="description" placeholder="Kes helistas, kontaktisik, telefon, täpsem kirjeldus..."></textarea></label><label class="full">Vastutaja<select class="select" name="responsibleTechnicianId"><option value="">Määramata</option>${techOptions}</select><span class="muted">Kui vastutaja jääb määramata, saab tehniku hiljem lisada.</span></label></div></div><div class="dialog-actions callout-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit" data-mode="register">✓ Registreeri väljakutse</button><button class="btn primary hidden" id="registerAndStartBtn" type="button">▶ Registreeri ja alusta</button></div></form>`);
  bindClose();
  const form=$('#registerCalloutForm');
  const objectInput=form.elements.objectName;
  const respSelect=form.elements.responsibleTechnicianId;
  const startBtn=$('#registerAndStartBtn');
  const resolveObject=()=>{
    const raw=String(objectInput.value||'').trim();
    if(!raw) return null;
    const lower=raw.toLowerCase();
    return activeObjects().find(o=>String(o.name||'').toLowerCase()===lower)||activeObjects().find(o=>String(o.name||'').toLowerCase().includes(lower))||null;
  };
  const refreshInfo=()=>{
    const obj=resolveObject();
    const wrap=$('#calloutObjectInfoWrap');
    if(wrap) wrap.innerHTML=obj?calloutObjectQuickInfoHtml(obj.id):'';
  };
  const syncStartButton=()=>{
    const canStart=!!actorId && respSelect.value===actorId;
    startBtn?.classList.toggle('hidden',!canStart);
  };
  objectInput.addEventListener('input',refreshInfo);
  objectInput.addEventListener('change',refreshInfo);
  respSelect.addEventListener('change',syncStartButton);
  syncStartButton();
  const createCallout=(startNow=false)=>{
    const obj=resolveObject();
    if(!obj){ objectInput.focus(); return null; }
    const title=String(form.elements.title.value||'').trim();
    if(!title){ form.elements.title.focus(); return null; }
    const priority=form.elements.priority.value||'Tavaline';
    const responsibleId=String(respSelect.value||'').trim();
    const startedAt=startNow?new Date().toISOString():'';
    const displayNumber=generateDisplayNumber(today,timeNow);
    const w={
      id:uid('WO'),
      displayNumber,
      display_number:displayNumber,
      projectId:state.projects.find(p=>p.objectId===obj.id)?.id||'',
      objectId:obj.id,
      title,
      date:today,
      time:timeNow,
      technicianId:responsibleId,
      responsibleTechnicianId:responsibleId,
      participantTechnicianIds:[],
      status:startNow?'Töös':'Planeeritud',
      priority,
      description:String(form.elements.description.value||'').trim(),
      problemDescription:String(form.elements.description.value||title||'').trim(),
      actRequired:true,
      requiresAct:true,
      isBillable:true,
      trackTime:true,
      workflow:'valjakutse',
      workflowType:'valjakutse',
      source:'registered_callout',
      createdBy:actorId||auth?.id||'',
      createdByName:actorId?techName(actorId):(auth?.name||auth?.email||'VECO'),
      createdAt:new Date().toISOString(),
      registeredAt:new Date().toISOString(),
      registered_at:new Date().toISOString(),
      startedAt,
      started_at:startedAt,
      timeline:[{type:'registered',at:new Date().toISOString(),by:actorId||auth?.id||'',label:'Väljakutse registreeritud'}].concat(startNow?[{type:'started',at:startedAt,by:actorId||auth?.id||'',label:'Töö alustatud'}]:[])
    };
    state.workorders.push(w);
    selectedWorkorderId=w.id;
    save();
    return w;
  };
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const w=createCallout(false);
    if(!w) return;
    closeModal();
    if(isTechSource) renderTechnicianV1(); else renderCallouts();
  });
  startBtn?.addEventListener('click',e=>{
    e.preventDefault();
    const w=createCallout(true);
    if(!w) return;
    closeModal();
    if(isTechSource){ renderTechnicianV1(); openTechnicianV1WorkModal(w.id); }
    else { renderCallouts(); openWorkorderModal(w.id); }
  });
}

function openMobileAddWorkModal(personId){
  const isTechnicianV1=page==='technicianV1';
  const today=dateKeyFromDate(new Date());
  const now=new Date();
  const hh=String(now.getHours()).padStart(2,'0');
  const mm=now.getMinutes()<30?'00':'30';
  const objectOptions=state.objects.map(o=>`<option value="${esc(mobileObjectChoiceLabel(o))}"></option>`).join('');
  const titleText=isTechnicianV1?'Uus väljakutse':'Lisa töö';
  const submitText=isTechnicianV1?'Salvesta väljakutse':'Salvesta töö';
  const titlePlaceholder=isTechnicianV1?'nt Klient helistas / rike':'nt Telefonitellimus / rike';
  const workflowField=isTechnicianV1
    ? `<input type="hidden" name="workflow" value="valjakutse"><input type="hidden" name="date" value="${today}"><input type="hidden" name="time" value="${hh}:${mm}"><input type="hidden" name="status" value="Planeeritud"><input type="hidden" name="actRequired" value="">`
    : `<label>Workflow<select class="select" name="workflow">${taskWorkflowOptions.map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('')}</select></label>`;
  openModal(`<form id="mobileAddWorkForm"><div class="dialog-head"><h2>${titleText}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid mobile-form-grid"><label class="full">Objekt<input class="field" name="objectChoice" list="mobileObjectChoices" required autocomplete="off" placeholder="Vali objekt või kirjuta uus objekt..."><datalist id="mobileObjectChoices">${objectOptions}</datalist><span class="muted">Vali olemasolev objekt või kirjuta uue objekti nimi.</span></label><label class="full">${isTechnicianV1?'Väljakutse lühikirjeldus':'Töö lühikirjeldus'}<input class="field" name="title" required placeholder="${titlePlaceholder}"></label>${isTechnicianV1?'':`<label>Kuupäev<input class="field" name="date" type="date" required value="${today}"></label><label>Kell<input class="field" name="time" type="time" value="${hh}:${mm}"></label>`}<label>Prioriteet<select class="select" name="priority"><option>${isTechnicianV1?'Kõrge':'Tavaline'}</option><option>${isTechnicianV1?'Tavaline':'Kõrge'}</option><option>Madal</option></select></label>${workflowField}${isTechnicianV1?'':`<label>Staatus<select class="select" name="status">${workorderStatusOptions.map(st=>`<option ${st==='Planeeritud'?'selected':''}>${st}</option>`).join('')}</select></label><label class="check-card"><input type="checkbox" name="actRequired"> <span>Akt vajalik</span></label>`}<label class="full">Märkus<textarea name="description" placeholder="Kes helistas, mida paluti, mis objektil juhtus?"></textarea></label></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">${submitText}</button></div></form>`);
  bindClose();
  $('#mobileAddWorkForm').addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const object=resolveMobileObjectChoice(f.objectChoice.value);
    if(!object){f.objectChoice.focus();return;}
    const project=state.projects.find(p=>p.objectId===object.id);
    const workflowValue=isTechnicianV1?'valjakutse':(f.workflow?.value||'kontroll');
    const next={id:uid('WO'),projectId:project?.id||'',objectId:object.id,title:f.title.value,date:f.date.value,time:f.time.value,technicianId:personId,responsibleTechnicianId:personId,participantTechnicianIds:[],status:f.status.value,priority:f.priority.value,description:f.description.value,problemDescription:f.description.value,actRequired:!!f.actRequired?.checked,requiresAct:!!f.actRequired?.checked,workflow:workflowValue,workflowType:workflowValue,source:isTechnicianV1?'technician_v1_callout':'mobile',createdBy:personId,createdByName:techName(personId),createdAt:new Date().toISOString()};
    state.workorders.push(next);
    selectedWorkorderId=next.id;
    save();
    closeModal();
    if(isTechnicianV1) renderTechnicianV1(); else renderMobile();
  });
}
function openMobileWorkModal(id){
  const w=byId(state.workorders,id); if(!w) return;
  const editCompletion=shouldEditCompletionInWorkorder(w);
  const actNotice=workorderActEditNotice(w);
  const completionFields=editCompletion?`<label class="full">Teostatud tööd *<textarea name="done" placeholder="Kirjelda, mida objektil tehti. Seda nõutakse töö lõpetamisel.">${esc(performedWorkText(w))}</textarea></label><label class="full">Töö tulemus / märkused<textarea name="workResult" placeholder="Mis seis jäi lahkumisel?">${esc(workResultText(w))}</textarea></label><label class="full">Soovitused / puudused<textarea name="recommendations" placeholder="Lisa remondivajadused või soovitused.">${esc(workRecommendationsText(w))}</textarea></label>`:`<input type="hidden" name="done" value="${esc(performedWorkText(w))}"><input type="hidden" name="workResult" value="${esc(workResultText(w))}"><input type="hidden" name="recommendations" value="${esc(workRecommendationsText(w))}">${actNotice}`;
  openModal(`<form id="mobileWorkForm"><div class="dialog-head"><h2>${esc(w.title)}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="card"><strong>${esc(workorderObjectLabel(w))}</strong><span class="muted">${esc(fmtActDate(w.date))} ${esc(w.time||'')} · ${esc(clientName(objectClientId(w.objectId)))}</span></div><div class="form-grid mobile-form-grid"><div class="kv full"><span>Workflow</span><strong>${esc(taskWorkflowLabel(w))}</strong></div><div class="kv full"><span>Omadused</span><strong>${esc(taskPropertiesSummary(w))}</strong></div><label class="full">Probleemi kirjeldus<textarea readonly>${esc(problemDescriptionText(w)||'-')}</textarea></label>${completionFields}<div class="full mobile-status-panel"><div class="kv"><span>Staatus</span><strong><span class="status ${statusClass(w.status)}">${esc(w.status||'Planeeritud')}</span></strong></div><div class="actions mobile-actions mobile-modal-actions">${mobileWorkflowButtons(w)}</div><span class="muted">Minu töödes muutub staatus tegevusnuppudega. Kalendris jääb töö alles.</span></div><label class="check-card"><input type="checkbox" name="actRequired" ${workorderActRequired(w)?'checked':''}> <span>Akt vajalik</span></label><label>Foto / viide<input class="field" name="photoNote" value="${esc(w.photoNote||'')}" placeholder="Vaba märkus foto kohta"></label><div class="full">${workorderPhotoGalleryHtml(w.id,{hint:'Saad lisada mitu pilti korraga. Pildid jäävad töö külge.'})}</div></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#mobileWorkForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget.elements;const note=String(f.done.value||'').trim();w.done=note||w.done||'';w.workDone=note||w.workDone||'';w.performedWork=note||w.performedWork||'';w.workResult=String(f.workResult?.value||w.workResult||'').trim();w.recommendations=String(f.recommendations?.value||w.recommendations||'').trim();w.actRequired=!!f.actRequired?.checked;w.photoNote=f.photoNote.value;save();closeModal();state=window.VECO_STORAGE.load();renderMobile();});
  $$('#mobileWorkForm [data-mobile-action]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();const action=btn.dataset.mobileAction;const wid=btn.dataset.workorderId;const form=$('#mobileWorkForm');if(form){const f=form.elements;const draft=byId(state.workorders,wid);if(draft){const note=String(f.done?.value||'').trim();draft.done=note||draft.done||'';draft.workDone=note||draft.workDone||'';draft.performedWork=note||draft.performedWork||'';draft.workResult=String(f.workResult?.value||draft.workResult||'').trim();draft.recommendations=String(f.recommendations?.value||draft.recommendations||'').trim();draft.actRequired=!!f.actRequired?.checked;draft.photoNote=f.photoNote?.value||draft.photoNote||'';save();}}closeModal();applyMobileWorkorderAction(action,wid);}));
  const rebindPhotoActions=()=>bindWorkorderPhotos(()=>{closeModal();openMobileWorkModal(id);});
  rebindPhotoActions();

  // CR-099 fix: ära sulge ja ava mobiili töö modali automaatselt pärast fotode laadimist.
  // Varasem loogika tegi closeModal()+openMobileWorkModal() iga refreshi järel,
  // mis käivitas uue refreshi ja tekitas lõputu taasavamise tsükli. Selle tõttu
  // Sulge/Tühista/Salvesta vajutused näisid mitte töötavat ning scroll hüppas kinni.
  loadWorkorderPhotos(id,true).then(()=>{
    const modal=$('#modal');
    const form=$('#mobileWorkForm');
    if(!modal?.classList.contains('open') || !form) return;
    const gallery=modal.querySelector(`[data-photo-gallery="${CSS.escape(id)}"]`);
    const wrap=gallery?.parentElement;
    if(wrap){
      wrap.innerHTML=workorderPhotoGalleryHtml(id,{hint:'Saad lisada mitu pilti korraga. Pildid jäävad töö külge.'});
      rebindPhotoActions();
    }
  }).catch(err=>console.warn('VECO photo refresh failed',err));
}

function technicianV1DateLabel(){
  const d=new Date();
  const days=['Pühapäev','Esmaspäev','Teisipäev','Kolmapäev','Neljapäev','Reede','Laupäev'];
  return `${days[d.getDay()]} · ${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

function technicianV1CurrentUser(){
  const USER_KEY='veco_mobile_user_id';
  const auth=currentAuthUser();
  if(auth?.role==='technician') return activeTechnicians().find(p=>p.id===auth.id)||mobileCurrentUser();
  const stored=localStorage.getItem(USER_KEY)||'';
  const found=activeTechnicians().find(p=>p.id===stored);
  if(stored && !found) localStorage.removeItem(USER_KEY);
  return found||null;
}
function technicianV1AdminSwitchHtml(current){
  if(authRole()!=='admin') return '';
  const opts=activeTechnicians().map(p=>`<option value="${esc(p.id)}" ${p.id===current?.id?'selected':''}>${esc(p.name)}</option>`).join('');
  return `<label class="tv1-admin-user-label"><span>Admin testib</span><select class="tv1-admin-user-select" id="tv1AdminUserSelect" title="Admin: vaata tehniku vaadet"><option value="" ${!current?'selected':''}>Vali tehnik...</option>${opts}</select></label>`;
}
function technicianV1OncallCard(current,todayKey){
  const shifts=(state.oncall||[])
    .filter(o=>o&&o.start&&o.end)
    .slice()
    .sort((a,b)=>`${a.start||''} ${a.end||''}`.localeCompare(`${b.start||''} ${b.end||''}`));
  const todayShift=shifts.find(o=>o.start<=todayKey&&o.end>=todayKey);
  const nextShift=shifts.find(o=>o.start>todayKey);
  const shiftName=o=>o?(o.userName||o.user_name||techName(o.personId||o.user_id)||'Valveisik'):'Valve puudub';
  const shiftRange=o=>o?`${fmtActDate(o.start)}–${fmtActDate(o.end)}`:'';
  const todayName=shiftName(todayShift);
  const nextName=shiftName(nextShift);
  const own=!!(todayShift && current && (String(todayShift.personId||todayShift.user_id||'')===String(current.id||'') || String(todayName).trim()===String(current.name||'').trim()));
  const title=own?'Oled täna valves':'Valveinfo';
  const todayLine=todayShift ? (own?`Sina · ${shiftRange(todayShift)}`:`${todayName} · ${shiftRange(todayShift)}`) : 'Täna valve puudub';
  const nextLine=nextShift ? `${nextName} · ${shiftRange(nextShift)}` : 'Järgmist valvet pole';
  return `<div class="tv1-oncall-card ${own?'is-own':''}">
    <div class="tv1-oncall-compact-head"><span>${own?'🟢':'⚪'}</span><strong>${esc(title)}</strong></div>
    <div class="tv1-oncall-compact-row"><span>Täna</span><b>${esc(todayLine)}</b></div>
    <div class="tv1-oncall-compact-row"><span>Järgmine</span><b>${esc(nextLine)}</b></div>
  </div>`;
}
function technicianV1WorkTime(w){
  const start=String(w.time||'').trim();
  const end=String(w.endTime||w.timeEnd||'').trim();
  if(start&&end) return `${start}–${end}`;
  if(start) return start;
  return 'Aeg määramata';
}
function technicianV1Location(w){
  const o=byId(state.objects||[],w.objectId);
  return o?.address||o?.name||workorderObjectLabel(w)||'';
}
function technicianV1WorkCard(w,current){
  const status=String(w.status||'Planeeritud');
  const act=mobileActLabel(w);
  const desc=problemDescriptionText(w)||'';
  const photos=(state.workorderPhotos?.[w.id]||[]).length;
  const location=technicianV1Location(w);
  const participants=workorderParticipantIds(w).filter(Boolean);
  const extraPeople=participants.filter(id=>String(id)!==String(current?.id||''));
  const peopleLabel=extraPeople.length?` · +${extraPeople.length} osaleja${extraPeople.length>1?'t':''}`:'';
  return `<button class="tv1-work-card" data-tv1-work="${esc(w.id)}" type="button">
    <div class="tv1-work-main"><div class="tv1-work-time">${esc(technicianV1WorkTime(w))}</div><div class="tv1-work-status ${statusClass(status)}">${esc(status)}</div></div>
    <div class="tv1-work-object">${esc(workorderObjectLabel(w))}</div>
    <div class="tv1-work-title">${esc(w.title||'Töö')}</div>
    ${location?`<div class="tv1-work-location">📍 ${esc(location)}</div>`:''}
    <div class="tv1-work-meta"><span>${esc(workorderDateRangeLabel(w))}${esc(peopleLabel)}</span>${act?`<span>📄 ${esc(act)}</span>`:''}${photos?`<span>📷 ${photos}</span>`:''}</div>
    ${desc?`<div class="tv1-work-desc">${esc(desc)}</div>`:''}
  </button>`;
}
function openTechnicianV1WorkModal(id){
  const w=byId(state.workorders,id); if(!w) return;
  const obj=byId(state.objects||[],w.objectId);
  const address=obj?.address||'';
  const desc=problemDescriptionText(w)||'';
  const mapQuery=encodeURIComponent(address||obj?.name||workorderObjectLabel(w)||'');
  const navigation=mapQuery?`<a class="btn primary" href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener">📍 Navigeeri</a>`:'';
  openModal(`<form id="tv1WorkForm"><div class="dialog-head tv1-detail-head"><div><div class="tv1-kicker">${esc(technicianV1WorkTime(w))} · ${esc(workorderDateRangeLabel(w))}</div><h2>${esc(workorderObjectLabel(w))}</h2><p>${esc(w.title||'Töö')}</p></div><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body tv1-detail-body"><div class="tv1-detail-card"><strong>Objekt</strong><span>${esc(workorderObjectLabel(w))}</span>${address?`<em>${esc(address)}</em>`:''}</div>${desc?`<div class="tv1-detail-card"><strong>Kirjeldus</strong><p>${esc(desc)}</p></div>`:''}<div class="tv1-detail-card"><strong>Staatus</strong><span><span class="status ${statusClass(w.status)}">${esc(w.status||'Planeeritud')}</span></span>${workorderRegisteredAt(w)?`<em>Registreeritud: ${esc(fmtDateTimeShort(workorderRegisteredAt(w)))}</em>`:''}${w.startedAt?`<em>Algus: ${esc(fmtDateTimeShort(w.startedAt))}</em>`:''}${w.completedAt?`<em>Lõpp: ${esc(fmtDateTimeShort(w.completedAt))}</em>`:''}</div><label class="full tv1-detail-note"><span>Teostatud töö</span><textarea name="done" placeholder="Kirjelda lühidalt, mida objektil tehti...">${esc(performedWorkText(w))}</textarea></label><div class="tv1-detail-actions">${navigation}${technicianV1WorkflowButtons(w)}</div><div class="tv1-detail-card"><strong>Fotod</strong><div>${workorderPhotoGalleryHtml(w.id,{hint:'Lisa fotod otse töö külge.'})}</div></div></div><div class="dialog-actions mobile-dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Sulge</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#tv1WorkForm')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;const note=String(f.done?.value||'').trim();w.done=note||w.done||'';w.workDone=note||w.workDone||'';w.performedWork=note||w.performedWork||'';const act=actForWorkorder(w.id); if(act) normalizeActContentFromWorkorder(act,w); save();closeModal();state=window.VECO_STORAGE.load();renderTechnicianV1();});
  $$('#tv1WorkForm [data-mobile-action]').forEach(btn=>btn.addEventListener('click',async e=>{e.preventDefault();const action=btn.dataset.mobileAction;const wid=btn.dataset.workorderId;const form=$('#tv1WorkForm');const draft=byId(state.workorders,wid);if(form&&draft){const note=String(form.elements.done?.value||'').trim();draft.done=note||draft.done||'';draft.workDone=note||draft.workDone||'';draft.performedWork=note||draft.performedWork||'';const act=actForWorkorder(draft.id); if(act) normalizeActContentFromWorkorder(act,draft); save();}closeModal();await applyMobileWorkorderAction(action,wid);if(action!=='finish'){setTimeout(()=>{if(page==='technicianV1'&&byId(state.workorders,wid)) openTechnicianV1WorkModal(wid);},80);}}));
  const rebindPhotoActions=()=>bindWorkorderPhotos(()=>{closeModal();openTechnicianV1WorkModal(id);});
  rebindPhotoActions();
  loadWorkorderPhotos(id,true).then(()=>{const modal=$('#modal');const form=$('#tv1WorkForm');if(!modal?.classList.contains('open')||!form) return;const gallery=modal.querySelector(`[data-photo-gallery="${CSS.escape(id)}"]`);const wrap=gallery?.parentElement;if(wrap){wrap.innerHTML=workorderPhotoGalleryHtml(id,{hint:'Lisa fotod otse töö külge.'});rebindPhotoActions();}}).catch(err=>console.warn('VECO tv1 photo refresh failed',err));
}

function renderTechnicianV1(){
  autoClosePerformedWorkorders();
  const USER_KEY='veco_mobile_user_id';
  const activePeople=authRole()==='admin'?fieldTechnicianPeople():activeMobilePeople();
  const current=mobileCurrentUser();
  if(!current){
    const today=dateKeyFromDate(new Date());
    const cards=activePeople.map(p=>`<button class="tv1-user-card" data-mobile-user="${esc(p.id)}" type="button"><strong>${esc(p.name)}</strong><span>${esc(p.role||'Tehnik')}</span>${availabilityBadgesHtml(p.id,today,{empty:true})}</button>`).join('')||'<div class="tv1-empty">Aktiivseid kasutajaid ei ole. Lisa kasutaja admin vaates.</div>';
    shell(`<div class="tv1-shell"><div class="tv1-login-head"><div><div class="tv1-kicker">VECO Technician V1</div><h1>Vali tehnik</h1><p>Piloodi testimiseks vali kasutaja.</p></div><div>${mobileThemeButton()}</div></div><div class="tv1-user-grid">${cards}</div></div>`,'',{wide:true});
    $$('[data-mobile-user]').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem(USER_KEY,btn.dataset.mobileUser);renderTechnicianV1();}));
    return;
  }
  const today=dateKeyFromDate(new Date());
  const tomorrow=mobileTomorrowKey(today);
  const weekEnd=mobileCurrentWeekEndKey(today);
  const own=state.workorders.filter(w=>workorderMatchesPerson(w,current.id));
  const open=w=>!isCompletedStatus(w.status);
  const byDateTime=(a,b)=>`${a.date} ${a.time||''}`.localeCompare(`${b.date} ${b.time||''}`);
  const groups={
    today:{label:'Täna',count:0,jobs:own.filter(w=>open(w)&&workorderOccursOnDay(w,today)).sort(byDateTime)},
    tomorrow:{label:'Homme',count:0,jobs:own.filter(w=>open(w)&&workorderOccursOnDay(w,tomorrow)).sort(byDateTime)},
    week:{label:'Nädal',count:0,jobs:own.filter(w=>open(w)&&mobileRangeOverlaps(w,today,weekEnd)).sort(byDateTime)},
    all:{label:'Kõik',count:0,jobs:own.filter(open).sort(byDateTime)},
    done:{label:'Valmis',count:0,jobs:own.filter(w=>isCompletedStatus(w.status)).sort((a,b)=>`${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`)).slice(0,20)}
  };
  Object.values(groups).forEach(g=>g.count=g.jobs.length);
  const order=['today','tomorrow','week','all','done'];
  const stored=localStorage.getItem('veco_technician_v1_tab')||'today';
  const active=groups[stored]?stored:'today';
  const g=groups[active];
  const tabs=order.map(k=>`<button class="tv1-tab ${k===active?'active':''}" data-tv1-tab="${k}" type="button"><span>${esc(groups[k].label)}</span><strong>${groups[k].count}</strong></button>`).join('');
  const list=g.jobs.map(w=>technicianV1WorkCard(w,current)).join('')||`<div class="tv1-empty"><strong>${esc(g.label)} töid ei ole</strong><span>Vali teine filter või lisa uus väljakutse.</span></div>`;
  const adminSwitch=technicianV1AdminSwitchHtml(current);
  const header=`<div class="tv1-header"><div><div class="tv1-kicker">${esc(technicianV1DateLabel())}</div><h1>${esc(current.name)}</h1>${adminSwitch?`<div class="tv1-admin-switch-wrap">${adminSwitch}</div>`:''}</div><div class="tv1-header-actions">${mobileThemeButton()}<button class="tv1-dispatch-btn" id="tv1AddWorkBtn" type="button">📞 Registreeri väljakutse</button></div></div>`;
  shell(`<div class="tv1-shell">${header}${technicianV1OncallCard(current,today)}<div class="tv1-tabs">${tabs}</div><div class="tv1-section-title"><strong>${esc(g.label)}</strong><span>${g.count} tööd</span></div><div class="tv1-work-list">${list}</div></div>`,'',{wide:true});
  $('#tv1AddWorkBtn')?.addEventListener('click',()=>openRegisterCalloutModal({source:'technicianV1',actorId:current.id}));
  $('#tv1AdminUserSelect')?.addEventListener('change',e=>{const v=e.currentTarget.value||''; if(v) localStorage.setItem('veco_mobile_user_id',v); else localStorage.removeItem('veco_mobile_user_id'); renderTechnicianV1();});
  $$('[data-tv1-tab]').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem('veco_technician_v1_tab',btn.dataset.tv1Tab);renderTechnicianV1();}));
  $$('[data-tv1-work]').forEach(btn=>btn.addEventListener('click',()=>openTechnicianV1WorkModal(btn.dataset.tv1Work)));
}


function isCalloutWorkorder(w){
  const wf=String(taskWorkflowValue(w)||'').toLowerCase();
  return wf==='valjakutse' || wf==='väljakutse' || wf==='callout' || String(w?.source||'').toLowerCase().includes('callout');
}

// VECO_V3_RC1.001: Activity Engine V1 mapping layer.
// This is intentionally UI-only: it does not migrate database tables yet and does not alter legacy Calendar/Workorders/Callouts behavior.
const activityTypeDefs={
  event:{label:'Sündmus',icon:'📅',className:'event',hint:'Lihtne Field-kaart / päevaplaani kirje'},
  maintenance:{label:'Hooldustöö',icon:'🔧',className:'maintenance',hint:'Planeeritud hooldus- või remonditöö'},
  callout:{label:'Väljakutse',icon:'🚨',className:'callout',hint:'Rike või kliendi teavitus'}
};
function activityTypeFromWorkorder(w={}){
  const wf=taskWorkflowValue(w).toLowerCase();
  const raw=`${w.activityType||w.type||w.title||''}`.toLowerCase();
  if(wf==='valjakutse'||raw.includes('väljakutse')||raw.includes('valjakutse')||raw.includes('rike')) return 'callout';
  if(['hooldus','remont','paigaldus','diagnostika','kontroll'].includes(wf)||raw.includes('hooldus')||raw.includes('remont')) return 'maintenance';
  return 'event';
}
function activityBaseStatus(w={}){
  const st=String(w.status||'').trim();
  if(/töös|käimas/i.test(st)) return 'Käimas';
  if(/teostatud|lõpetatud|täidetud|valmis|suletud/i.test(st)) return 'Lõpetatud';
  return 'Planeeritud';
}
function activityCapabilitySummary(w={}){
  const type=activityTypeFromWorkorder(w);
  const items=['Kalender','Field'];
  if(type==='event') items.push('Märgi tehtuks');
  if(type==='maintenance') items.push('Tööaeg','Teostatud töö','Fotod','Akt valikuline');
  if(type==='callout') items.push('Tööaeg','Teostatud töö','Fotod','Akt','Akteerimine','Arveldus');
  return items;
}
function activityRows(){
  return (state.workorders||[]).filter(isRenderableWorkorder).map(w=>{
    const type=activityTypeFromWorkorder(w);
    const def=activityTypeDefs[type]||activityTypeDefs.event;
    const o=byId(state.objects,w.objectId);
    const c=o?byId(state.clients,o.clientId):null;
    const start=[w.date,w.time].filter(Boolean).join(' ');
    return {id:w.id,workorder:w,type,def,title:w.title||taskWorkflowLabel(w)||'Tegevus',status:activityBaseStatus(w),object:o?.name||workorderObjectLabel(w),client:c?.name||'',technician:workorderPeopleNames(w).join(', ')||techName(workorderResponsibleId(w)),start,performed:performedWorkText(w),problem:problemDescriptionText(w),capabilities:activityCapabilitySummary(w)};
  }).sort((a,b)=>String(a.start||'9999').localeCompare(String(b.start||'9999'))||String(a.title).localeCompare(String(b.title),'et'));
}
function renderActivities(){
  const search=($('#activitySearch')?.value||'').toLowerCase();
  const typeFilter=$('#activityTypeFilter')?.value||'all';
  const statusFilter=$('#activityStatusFilter')?.value||'all';
  const rows=activityRows().filter(a=>{
    if(typeFilter!=='all'&&a.type!==typeFilter) return false;
    if(statusFilter!=='all'&&a.status!==statusFilter) return false;
    const hay=[a.title,a.object,a.client,a.technician,a.status,a.def.label,a.problem,a.performed].join(' ').toLowerCase();
    return !search||hay.includes(search);
  });
  const counts=activityRows().reduce((acc,a)=>{acc[a.type]=(acc[a.type]||0)+1; acc.total=(acc.total||0)+1; return acc;},{});
  const filters=`<input class="field" id="activitySearch" placeholder="Otsi tegevust, objekti, klienti või tehnikut..." value="${esc($('#activitySearch')?.value||'')}"><select class="select" id="activityTypeFilter"><option value="all">Kõik tüübid</option>${Object.entries(activityTypeDefs).map(([key,def])=>`<option value="${esc(key)}" ${typeFilter===key?'selected':''}>${def.icon} ${esc(def.label)}</option>`).join('')}</select><select class="select" id="activityStatusFilter"><option value="all">Kõik staatused</option>${['Planeeritud','Käimas','Lõpetatud'].map(st=>`<option value="${esc(st)}" ${statusFilter===st?'selected':''}>${esc(st)}</option>`).join('')}</select>`;
  const summary=`<div class="summary-grid activity-summary">${summaryBox('Tegevusi',counts.total||0)}${summaryBox('Sündmused',counts.event||0)}${summaryBox('Hooldustööd',counts.maintenance||0)}${summaryBox('Väljakutsed',counts.callout||0)}</div>`;
  const cards=rows.map(a=>`<article class="activity-card activity-${esc(a.def.className)}" data-open-workorder="${esc(a.id)}"><div class="activity-card-head"><div class="activity-type"><span class="activity-type-icon">${a.def.icon}</span><span>${esc(a.def.label)}</span></div><span class="status ${statusClass(a.status)}">${esc(a.status)}</span></div><h3>${esc(a.title)}</h3><div class="activity-meta"><span>📍 ${esc(a.object||'-')}</span><span>🕒 ${esc(a.start||'-')}</span><span>👤 ${esc(a.technician||'-')}</span></div>${a.problem?`<div class="activity-block"><strong>Probleem</strong><div>${esc(a.problem)}</div></div>`:''}${a.performed?`<div class="activity-block"><strong>Teostatud töö</strong><div>${esc(a.performed)}</div></div>`:''}<div class="activity-capabilities">${a.capabilities.map(x=>`<span>${esc(x)}</span>`).join('')}</div></article>`).join('')||`<div class="empty-state"><strong>Tegevusi ei leitud.</strong><div class="muted">Activity Engine V1 kasutab praegu olemasolevaid tööde/väljakutsete kirjeid mapping layer'ina.</div></div>`;
  const actions=`<a class="btn ghost" href="index.html">Vana kalender</a><a class="btn primary" href="workorders.html">Lisa töö</a>`;
  const intro=`<div class="activity-engine-note"><strong>VECO Activity Engine V1</strong><span>Kõik Fieldis nähtavad planeeringud käsitletakse tegevustena: 📅 Sündmus, 🔧 Hooldustöö või 🚨 Väljakutse. See vaade on uus testvaade vana kalendri kõrval ega muuda andmebaasi struktuuri.</span></div>`;
  shell(header('Tegevused',filters,actions)+`<div class="detail-body">${intro}${summary}<div class="activity-grid">${cards}</div></div>`,'',{wide:true});
  $('#activitySearch')?.addEventListener('input',renderActivities);
  $('#activityTypeFilter')?.addEventListener('change',renderActivities);
  $('#activityStatusFilter')?.addEventListener('change',renderActivities);
  $$('[data-open-workorder]').forEach(card=>card.addEventListener('click',()=>{selectedWorkorderId=card.dataset.openWorkorder; openWorkorderModal(selectedWorkorderId);}));
}

function renderCallouts(){
  const rows=(state.workorders||[]).filter(isRenderableWorkorder).filter(isCalloutWorkorder).slice().sort((a,b)=>`${b.date||''} ${b.time||''}`.localeCompare(`${a.date||''} ${a.time||''}`));
  const openRows=rows.filter(w=>!isCompletedStatus(w.status));
  const doneRows=rows.filter(w=>isCompletedStatus(w.status));
  const card=w=>{
    const obj=workorderObjectLabel(w);
    const createdBy=w.createdByName||techName(workorderResponsibleId(w))||'-';
    const desc=problemDescriptionText(w)||'';
    const performed=performedWorkText(w)||'';
    const act=calendarActState(w);
    const photoCount=workorderPhotos(w.id).length;
    const meta=[photoCount?`📷 ${photoCount}`:'',act.icon?`${act.icon} ${act.label}`:''].filter(Boolean).join(' · ');
    return `<button class="card callout-card" data-callout-open="${esc(w.id)}" type="button"><div class="card-top"><h3>📞 ${esc(w.title||workorderDisplayLabel(w))}</h3><span class="status ${statusClass(w.status)}">${esc(w.status||'Planeeritud')}</span></div><div class="muted"><strong>${esc(workorderDisplayLabel(w))}</strong> · ${esc(fmtActDate(w.date))} ${esc(w.time||'')} · ${esc(obj)}</div><div class="muted">Tehnik: ${esc(createdBy)}</div>${desc?`<p class="callout-problem"><strong>Probleem:</strong> ${esc(desc)}</p>`:''}${performed?`<p class="callout-performed"><strong>Teostatud:</strong> ${esc(performed)}</p>`:''}${meta?`<div class="callout-meta">${esc(meta)}</div>`:''}</button>`;
  };
  const body=`<div class="detail-body"><div class="grid cards-3"><div class="card"><strong>Uued/töös</strong><span class="big-number">${openRows.length}</span></div><div class="card"><strong>Lahendatud</strong><span class="big-number">${doneRows.length}</span></div><div class="card"><strong>Kokku</strong><span class="big-number">${rows.length}</span></div></div><div class="section-title">Aktiivsed väljakutsed</div><div class="callout-grid">${openRows.map(card).join('')||'<div class="card muted">Aktiivseid väljakutseid ei ole.</div>'}</div><div class="section-title">Lahendatud</div><div class="callout-grid">${doneRows.slice(0,20).map(card).join('')||'<div class="card muted">Lahendatud väljakutseid ei ole.</div>'}</div></div>`;
  const actions=`<button class="btn primary" id="registerCalloutBtn" type="button">＋ Registreeri väljakutse</button>`;
  shell(header('Väljakutsed','',actions,'VÄLJAKUTSED')+body,'',{wide:true});
  $('#registerCalloutBtn')?.addEventListener('click',()=>openRegisterCalloutModal({source:'callouts'}));
  $$('[data-callout-open]').forEach(btn=>btn.addEventListener('click',()=>openWorkorderModal(btn.dataset.calloutOpen)));
}
function renderMobilePreview(){
  const devices=[['iPhone SE','320px','568px'],['Android 360','360px','740px'],['iPhone 14','390px','844px'],['Large phone','414px','896px'],['Tahvel','768px','1024px']];
  const cards=devices.map(([name,w,h])=>`<div class="card preview-device"><div class="card-top"><h3>${name}</h3><span class="status">${w} × ${h}</span></div><div class="preview-frame-wrap" style="--preview-w:${w};--preview-h:${h};"><iframe src="mobile.html" title="${esc(name)}"></iframe></div></div>`).join('');
  shell(header('Mobiili eelvaade','','<a class="btn" href="mobile.html" target="_blank" rel="noopener">Legacy mobile ↗</a><a class="btn primary" href="technician-v1.html" target="_blank" rel="noopener">Technician V1 ↗</a>','MOBIILI EELVAADE')+`<div class="detail-body"><div class="card"><strong>Testi eri ekraanisuuruseid</strong><span class="muted">Eesmärk: tehniku vaates ei tohi tekkida horisontaalset kerimist ning põhitoimingud peavad mahtuma ühe veeruna.</span></div><div class="preview-grid">${cards}</div></div>`,'',{wide:true});
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
function holidayName(dateKey){
  const info=estonianCalendarDayInfo(dateKey);
  return info.isHoliday ? info.name : '';
}
function holidayShortMarker(dateKey){
  const info=estonianCalendarDayInfo(dateKey);
  if(info.isHoliday) return `<small class="holiday-mini-note" title="${esc(info.name)}">${esc(info.name)}</small>`;
  if(info.isShort) return `<small class="holiday-mini-note short" title="${esc(info.name)}">Lühike päev</small>`;
  return '';
}

function personShortName(personId){
  const p=byId(state.people||[],personId);
  const name=String(p?.name||'').trim();
  if(!name) return '-';
  const parts=name.split(/\s+/).filter(Boolean);
  if(parts.length===1) return parts[0];
  return `${parts[0]} ${parts[parts.length-1].slice(0,1)}.`;
}
function calendarDayAvailabilityData(dateKey){
  const activePeople=(state.people||[]).filter(p=>p&&p.active!==false);
  const absenceItems=[];
  activePeople.forEach(p=>{
    activeAbsencesForPerson(p.id,dateKey).forEach(a=>{
      const meta=availabilityMeta(a.type||'Puudumine');
      absenceItems.push({personId:p.id,name:personShortName(p.id),type:a.type||meta.label,label:meta.label,cls:meta.cls,note:a.note||'',start:a.start,end:a.end});
    });
  });
  const oncallItems=(state.oncall||[])
    .filter(o=>o.start<=dateKey && o.end>=dateKey)
    .map(o=>({personId:o.personId,name:personShortName(o.personId),note:o.note||'',start:o.start,end:o.end}));
  const uniqueAbs=[];
  const seenAbs=new Set();
  absenceItems.forEach(x=>{const key=`${x.personId}|${x.label}|${x.start}|${x.end}`; if(!seenAbs.has(key)){seenAbs.add(key); uniqueAbs.push(x);}});
  const uniqueOncall=[];
  const seenOncall=new Set();
  oncallItems.forEach(x=>{const key=`${x.personId}|${x.start}|${x.end}`; if(!seenOncall.has(key)){seenOncall.add(key); uniqueOncall.push(x);}});
  return {absences:uniqueAbs,oncall:uniqueOncall};
}
function calendarDayAvailabilityHtml(dateKey){
  const data=calendarDayAvailabilityData(dateKey);
  const absenceCount=data.absences.length;
  const absTitle=data.absences.length?data.absences.map(x=>`${x.name}: ${x.label} ${fmtActDate(x.start)}–${fmtActDate(x.end)}${x.note?' · '+x.note:''}`).join('\n'):'Kõik saadaval';
  const names=data.absences.map(x=>String(x.name||'').toUpperCase()).filter(Boolean).join(', ');
  const status=absenceCount
    ? `<span class="calendar-day-availability-pill warn ${absenceCount>1?'multi':''}" title="${esc(absTitle)}">⚠ ${absenceCount>1?'PUUDUVAD':'PUUDUB'}: ${esc(names)}</span>`
    : `<span class="calendar-day-availability-pill ok" title="${esc(absTitle)}">✓ Kõik saadaval</span>`;
  return `<div class="calendar-day-availability" data-calendar-day-availability="${esc(dateKey)}">${status}</div>`;
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

function calendarDefaultScrollState(){
  const savedTop=Number(localStorage.getItem('veco_boot_scroll_top_calendar'));
  const savedLeft=Number(localStorage.getItem('veco_boot_scroll_left_calendar'));
  return {
    wrapTop:Number.isFinite(savedTop)&&savedTop>0?savedTop:0,
    wrapLeft:Number.isFinite(savedLeft)&&savedLeft>0?savedLeft:0,
    gridLeft:0,
    winY:0,
    winX:0,
    hasWrap:Number.isFinite(savedTop)&&savedTop>0,
    forceWorkdayStart:!(Number.isFinite(savedTop)&&savedTop>0)
  };
}
function captureCalendarScrollState(){
  const wrap=document.querySelector('.calendar-planner-wrap');
  const grid=document.querySelector('.calendar-planner-grid');
  return {
    wrapTop:wrap?wrap.scrollTop:0,
    wrapLeft:wrap?wrap.scrollLeft:0,
    gridLeft:grid?grid.scrollLeft:0,
    winY:window.scrollY||0,
    winX:window.scrollX||0,
    hasWrap:!!wrap
  };
}
function calendarWorkdayInitialScrollTop(){
  const wrap=document.querySelector('.calendar-planner-wrap');
  const planner=document.querySelector('.calendar-planner');
  if(!wrap||!planner) return 0;
  const initialHour=Number(planner?.dataset?.initialScrollHour||7);
  const hourPx=parseFloat(getComputedStyle(planner||wrap).getPropertyValue('--calendar-hour-px'))||72;
  const raw=Math.max(0,Math.round(initialHour*hourPx));
  const max=Math.max(0,(wrap.scrollHeight||0)-(wrap.clientHeight||0));
  return Math.max(0,Math.min(raw,max));
}
function applyCalendarScrollStateNow(pos){
  if(!pos) return;
  const wrap=document.querySelector('.calendar-planner-wrap');
  const grid=document.querySelector('.calendar-planner-grid');
  if(wrap){
    const initialTop=calendarWorkdayInitialScrollTop();
    const requested=pos.forceWorkdayStart?initialTop:(pos.hasWrap?(pos.wrapTop||0):initialTop);
    const max=Math.max(0,(wrap.scrollHeight||0)-(wrap.clientHeight||0));
    wrap.scrollTop=Math.max(0,Math.min(Math.round(requested||0),max));
    wrap.scrollLeft=pos.wrapLeft||0;
  }
  if(grid) grid.scrollLeft=pos.gridLeft||0;
  if(pos.hasWrap || pos.winY || pos.winX) window.scrollTo(pos.winX||0,pos.winY||0);
}
function restoreCalendarScrollState(pos){
  requestAnimationFrame(()=>requestAnimationFrame(()=>applyCalendarScrollStateNow(pos)));
}
function restoreCalendarScrollStateRobust(pos){
  if(!pos) return;
  restoreCalendarScrollState(pos);
  if(pos.forceWorkdayStart || !pos.hasWrap){
    [120,320,700].forEach(delay=>setTimeout(()=>applyCalendarScrollStateNow(pos),delay));
  }
}


// Build 20260613_1330: robust calendar sticky header alignment.
// The visible E-P header is positioned from the actual rendered day-column
// measurements, so browser zoom/sub-pixel rounding cannot desync header/body.
function syncCalendarStickyHeader(){
  const header=document.querySelector('.calendar-date-sticky-header');
  const wrap=document.querySelector('.calendar-planner-wrap');
  const planner=document.querySelector('.calendar-planner');
  const hours=document.querySelector('.calendar-hours');
  const grid=document.querySelector('.calendar-planner-grid');
  const days=[...document.querySelectorAll('.calendar-planner-grid > .calendar-planner-day')];
  if(!header||!planner||!hours||!grid||!days.length) return false;

  const plannerRect=planner.getBoundingClientRect();
  const hoursRect=hours.getBoundingClientRect();
  const wrapClientWidth=wrap ? wrap.clientWidth : plannerRect.width;
  const wrapRect=wrap ? wrap.getBoundingClientRect() : plannerRect;

  // Build 20260613_1541: Equal day width fix.
  // Do not let the vertical scrollbar/gutter become part of the last day.
  // Calculate one shared day width from the visible planner content area and
  // apply it to both body columns and the sticky header at sub-pixel precision.
  const hoursLeft=hoursRect.left-plannerRect.left;
  const hoursWidth=hoursRect.width;
  const plannerVisibleRight=Math.min(plannerRect.right, wrapRect.left + wrapClientWidth);
  const dayAreaLeft=plannerRect.left + hoursLeft + hoursWidth;
  const availableDayArea=Math.max(0, plannerVisibleRight - dayAreaLeft);
  const minDayWidth=window.matchMedia && window.matchMedia('(max-width:1120px)').matches ? 260 : 150;
  const calculatedDayWidth=availableDayArea / days.length;
  const dayWidth=Math.max(minDayWidth, calculatedDayWidth);
  const totalDayWidth=dayWidth * days.length;

  grid.style.setProperty('grid-template-columns',`repeat(${days.length}, ${dayWidth.toFixed(3)}px)`,'important');
  grid.style.setProperty('width',`${totalDayWidth.toFixed(3)}px`,'important');
  grid.style.setProperty('min-width',`${totalDayWidth.toFixed(3)}px`,'important');
  grid.style.setProperty('--calendar-equal-day-width',`${dayWidth.toFixed(3)}px`);

  header.style.setProperty('--calendar-sticky-left','0px');
  header.style.setProperty('--calendar-sticky-width',`${(hoursWidth+totalDayWidth).toFixed(3)}px`);

  const spacer=header.querySelector('.calendar-date-sticky-spacer');
  if(spacer){
    spacer.style.left=`${hoursLeft.toFixed(3)}px`;
    spacer.style.width=`${hoursWidth.toFixed(3)}px`;
  }

  const headerDays=[...header.querySelectorAll('.calendar-date-sticky-day')];
  headerDays.forEach((h,i)=>{
    const left=hoursLeft + hoursWidth + i*dayWidth;
    h.style.left=`${left.toFixed(3)}px`;
    h.style.width=`${dayWidth.toFixed(3)}px`;
  });

  header.style.setProperty('--calendar-sticky-gutter','0px');
  header.dataset.synced='true';
  return true;
}
function scheduleCalendarStickyHeaderSync(){
  // CR-084: keep sticky header sync as a single animation-frame pass.
  // The older delayed retries caused visible column/header jumps during first paint.
  requestAnimationFrame(()=>syncCalendarStickyHeader());
}

// Build 20260615_1504: adaptive workday calendar hour height; ticker removed.
// Keeps the full 24h scrollable timeline, but adjusts one-hour row height
// so the default visible work window targets 07:00-18:00 (~11 hours).
function clampCalendarHourPx(value){
  const n=Number(value);
  if(!Number.isFinite(n)) return 84;
  return Math.max(48,Math.min(84,Math.round(n)));
}
function calendarInitialResponsiveHourPx(){
  const viewportH=window.innerHeight||900;
  const small=window.matchMedia&&window.matchMedia('(max-width:1120px)').matches;
  const offset=small?176:156;
  const wrapH=Math.max(420,viewportH-offset);
  const bodyH=Math.max(360,wrapH-40);
  return clampCalendarHourPx(bodyH/10.5);
}
function applyCalendarResponsiveHourHeight(){
  const planner=document.querySelector('.calendar-planner');
  const wrap=document.querySelector('.calendar-planner-wrap');
  if(!planner||!wrap) return false;
  const hoursCount=Number(planner.style.getPropertyValue('--calendar-hours-count'))||24;
  const viewportH=window.innerHeight||document.documentElement.clientHeight||900;
  const rect=wrap.getBoundingClientRect();
  const wrapStyles=getComputedStyle(wrap);
  const bottomPad=parseFloat(wrapStyles.paddingBottom)||0;
  const topPad=parseFloat(wrapStyles.paddingTop)||0;
  const bottomGap=10;
  // VECO_V3_20260615_1716: use the actual flex-filled wrapper height.
  // Do not write an inline height here: it can freeze the wrapper too short
  // and leave a dead black zone below the inner scroll area.
  const fallbackH=Math.max(360,Math.floor(viewportH-rect.top-bottomGap));
  const availableH=Math.max(360,Math.floor(wrap.clientHeight||fallbackH));
  // Target 07:00–18:00 as the default visible work window.
  const bodyH=Math.max(320,availableH-40-topPad-bottomPad);
  const hourPx=clampCalendarHourPx(bodyH/11);
  planner.style.setProperty('--calendar-hour-px',`${hourPx}px`);
  planner.style.setProperty('--calendar-body-height',`${hoursCount*hourPx}px`);
  planner.dataset.hourPx=String(hourPx);
  planner.dataset.viewportHeight=String(availableH);
  return true;
}
let calendarLayoutTimer=null;
let calendarLayoutSeq=0;
function setCalendarLayoutPreparing(){
  document.body.classList.remove('calendar-layout-ready');
  document.body.classList.add('calendar-layout-preparing');
}
function setCalendarLayoutReady(){
  document.body.classList.remove('calendar-layout-preparing');
  document.body.classList.add('calendar-layout-ready');
}
function scheduleCalendarLayoutSync({scrollState=null,delay=40}={}){
  const seq=++calendarLayoutSeq;
  clearTimeout(calendarLayoutTimer);
  calendarLayoutTimer=setTimeout(()=>{
    requestAnimationFrame(()=>{
      if(seq!==calendarLayoutSeq) return;
      applyCalendarResponsiveHourHeight();
      syncCalendarStickyHeader();
      restoreCalendarScrollStateRobust(scrollState);
      syncCalendarStickyHeader();
      setCalendarLayoutReady();
    });
  },delay);
}
function scheduleCalendarResponsiveHourHeight(){
  scheduleCalendarLayoutSync({delay:70});
}
function bindCalendarResponsiveHeightObserver(){
  if(!window.__VECO_CALENDAR_RESPONSIVE_RO__ && 'ResizeObserver' in window){
    window.__VECO_CALENDAR_RESPONSIVE_RO__=new ResizeObserver(()=>{
      if(document.body.classList.contains('calendar-layout-preparing')) return;
      scheduleCalendarLayoutSync({delay:90});
    });
  }
  const ro=window.__VECO_CALENDAR_RESPONSIVE_RO__;
  if(ro){
    const bind=()=>{
      const wrap=document.querySelector('.calendar-planner-wrap');
      const panel=document.querySelector('.app.page-calendar .panel');
      const head=document.querySelector('.calendar-compact-head');
      [wrap,panel,head].filter(Boolean).forEach(el=>{
        if(el.dataset.calendarRoObserved==='true') return;
        el.dataset.calendarRoObserved='true';
        ro.observe(el);
      });
    };
    requestAnimationFrame(bind);
  }
  if(!window.__VECO_CALENDAR_RESPONSIVE_LOAD_BOUND__){
    window.__VECO_CALENDAR_RESPONSIVE_LOAD_BOUND__=true;
    window.addEventListener('load',()=>scheduleCalendarLayoutSync({delay:90}),{once:false,passive:true});
  }
}
if(!window.__VECO_CALENDAR_STICKY_SYNC_BOUND__){
  window.__VECO_CALENDAR_STICKY_SYNC_BOUND__=true;
  window.addEventListener('resize',()=>{scheduleCalendarResponsiveHourHeight();scheduleCalendarStickyHeaderSync();},{passive:true});
  window.addEventListener('orientationchange',()=>{scheduleCalendarResponsiveHourHeight();scheduleCalendarStickyHeaderSync();},{passive:true});
}


function calendarCompactHeader({rangeLabel='',visibleDays=[],mode='week',currentDate='',calendarTechFilterHtml='',hideWeekend=false,statusFilter='open'}={}){
  const parts=String(rangeLabel||'').split(' · ');
  const mainLabel=(parts.slice(0,2).join(' · ') || rangeLabel || 'Kalender').toUpperCase();
  const dateRange=(parts.slice(2).join(' · ') || (visibleDays?.length?`${fmtShortDate(visibleDays[0])}–${fmtShortDate(visibleDays[visibleDays.length-1])}`:''));
  const filtersExpanded=localStorage.getItem('veco_calendar_filters_expanded')==='true';
  const viewSelect=`<select class="select calendar-top-view" id="calendarViewMode"><option value="day" ${mode==='day'?'selected':''}>Päev</option><option value="week" ${mode==='week'?'selected':''}>Nädal</option><option value="month" ${mode==='month'?'selected':''}>Kuu</option><option value="year" ${mode==='year'?'selected':''}>Aasta</option></select>`;
  const authPill=authStatusPill();
  const filterFields=`<div class="calendar-filter-fields">
    <label><span>Kuupäev</span><input class="field" id="calendarWeekStart" type="date" value="${esc(currentDate)}"></label>
    <label><span>Töötaja</span>${calendarTechFilterHtml}</label>
    <label><span>L/P</span><button class="btn ghost" id="calendarHideWeekend" type="button" data-hidden="${hideWeekend?'true':'false'}">▦ ${hideWeekend?'Näita L/P':'Peida L/P'}</button></label>
    <label><span>Töö tüüp</span><select class="select" id="calendarStatusFilter"><option value="open" ${statusFilter==='open'?'selected':''}>Kalendri tööd</option><option value="all" ${statusFilter==='all'?'selected':''}>Kõik staatused</option>${workorderStatusOptions.map(st=>`<option value="${st}" ${statusFilter===st?'selected':''}>${st}</option>`).join('')}</select></label>
    <label><span>Import</span><button class="btn ghost" id="calendarImportWorkBtn" type="button">▧ Impordi töö</button></label>
    ${authPill?`<label class="calendar-auth-label"><span>Kasutaja</span>${authPill}</label>`:''}
  </div>`;
  return `<div class="calendar-compact-head ${filtersExpanded?'filters-open':'filters-closed'}">
    <div class="calendar-compact-main">
      <div class="calendar-compact-left">
        ${themeLogo()}
        <div class="calendar-nav-mini" aria-label="Kalendri navigeerimine">
          <button class="btn ghost square" id="calendarPrevWeekBtn" type="button" title="Eelmine">‹</button>
          <button class="btn primary" id="calendarThisWeekBtn" type="button">Täna</button>
          <button class="btn ghost square" id="calendarNextWeekBtn" type="button" title="Järgmine">›</button>
        </div>
        <div class="calendar-period-title"><strong>${esc(mainLabel)}</strong><span>${esc(dateRange)} <b>•</b> <em>VALVE: ${esc(currentOncallLabel(visibleDays)).toUpperCase()}</em></span></div>
      </div>
      <div class="calendar-compact-right">
        <button class="btn ghost calendar-filter-toggle" id="calendarFiltersToggle" type="button" aria-expanded="${filtersExpanded?'true':'false'}">☷ Filtrid ${filtersExpanded?'⌃':'⌄'}</button>
        ${viewSelect}
        <button class="btn primary" id="newCalendarWorkorderBtn" type="button">+ Lisa töö</button>
      </div>
    </div>
    <div class="calendar-filter-panel" aria-hidden="${filtersExpanded?'false':'true'}">${filterFields}</div>
  </div>`;
}


function stopCalendarNowLineTicker(){
  if(window.__VECO_NOW_LINE_TIMER__){
    clearInterval(window.__VECO_NOW_LINE_TIMER__);
    window.__VECO_NOW_LINE_TIMER__=null;
  }
  if(window.__VECO_NOW_LINE_TIMEOUT__){
    clearTimeout(window.__VECO_NOW_LINE_TIMEOUT__);
    window.__VECO_NOW_LINE_TIMEOUT__=null;
  }
}
function updateCalendarNowLine(){
  const cfg=window.__VECO_NOW_LINE_CFG__;
  const line=document.querySelector('.calendar-now-line.calendar-now-line-global');
  if(!cfg || !line) return;
  const now=new Date();
  const today=dateKeyFromDate(now);
  const nowHour=now.getHours()+now.getMinutes()/60+now.getSeconds()/3600;
  const inView=Array.isArray(cfg.visibleDays) && cfg.visibleDays.includes(today);
  const inHours=nowHour>=cfg.startHour && nowHour<=cfg.endHour;
  if(!inView || !inHours){
    line.style.display='none';
    return;
  }
  const total=Math.max(1,cfg.endHour-cfg.startHour);
  const pct=Math.max(0,Math.min(100,((nowHour-cfg.startHour)/total)*100));
  line.style.display='';
  line.style.top=`calc(40px + (100% - 40px) * ${pct/100})`;
  const label=line.querySelector('span');
  if(label) label.textContent=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}
function startCalendarNowLineTicker({visibleDays,startHour,endHour,mode}){
  stopCalendarNowLineTicker();
  window.__VECO_NOW_LINE_CFG__={visibleDays:[...(visibleDays||[])],startHour,endHour,mode};
  updateCalendarNowLine();
  const delay=Math.max(250,60000-(Date.now()%60000));
  window.__VECO_NOW_LINE_TIMEOUT__=setTimeout(()=>{
    updateCalendarNowLine();
    window.__VECO_NOW_LINE_TIMER__=setInterval(updateCalendarNowLine,60000);
  },delay);
}

function renderCalendar(){
  setCalendarLayoutPreparing();
  const isBootHydrating=page==='calendar' && window.__VECO_BOOT_RESTORED__ && !window.__VECO_BOOT_HYDRATED__;
  const calendarScrollState=isBootHydrating?calendarDefaultScrollState():captureCalendarScrollState();
  const storedDate=localStorage.getItem('veco_calendar_week')||weekStartKeyFrom('');
  const currentDate=storedDate;
  const scopedId=scopedPersonId();
  const techFilter=scopedId?[scopedId]:employeeFilterSelected('calendar');
  const statusFilter=$('#calendarStatusFilter')?.value||'all';
  const mode=$('#calendarViewMode')?.value||localStorage.getItem('veco_calendar_view')||'week';
  const hideWeekend=(localStorage.getItem('veco_calendar_hide_weekend')||'false')==='true';
  localStorage.setItem('veco_calendar_week',currentDate);
  localStorage.setItem('veco_calendar_view',mode);
  localStorage.setItem('veco_calendar_hide_weekend',hideWeekend?'true':'false');
  const calendarDefaultStatuses=workorderStatusOptions;
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
  const filtered=(state.workorders||[]).filter(isRenderableWorkorder).filter(w=>{
    const techOk=employeeFilterMatchesWorkorder(w,techFilter);
    const statusOk=statusFilter==='all'||(statusFilter==='open'?calendarDefaultStatuses.includes(w.status):w.status===statusFilter);
    const hay=`${w.id} ${w.title} ${clientName(objectClientId(w.objectId))} ${objectName(w.objectId)} ${projectName(w.projectId)} ${workorderPeopleLabel(w)} ${w.status}`.toLowerCase();
    return dateInView(w)&&techOk&&statusOk;
  });
  const calendarWorkTimeBounds=(jobs,days)=>{
    // Google Calendari-laadne loogika: renderdame alati kogu 24 h
    // ajatelje (00:00–24:00), aga avamisel kerime vaate tööaja
    // alguse juurde. Nii saab kasutaja vajadusel üles varasemaks
    // ja alla hilisemaks kerida ning tööpäeva lõppu ei lõigata ära.
    return {start:0,end:24};
  };
  const calendarPeople=visiblePeopleForCurrentScope();
  const calendarTechFilterHtml=scopedId?employeeMultiFilterHtml('calendar',[scopedId],{disabled:true,label:scopedPerson()?.name||'Minu kalender'}):employeeMultiFilterHtml('calendar',techFilter);
  const calendarBounds=calendarWorkTimeBounds(filtered,visibleDays);
  const calendarStartHour=calendarBounds.start;
  const calendarEndHour=calendarBounds.end;
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
  const showNowLine=(mode==='week'||mode==='day')&&visibleDays.includes(today)&&nowHour>=calendarStartHour&&nowHour<=calendarEndHour;
  const nowTopPct=Math.max(0,Math.min(100,((nowHour-calendarStartHour)/calendarHoursTotal)*100));

  let body='';
  if(mode==='week'||mode==='day'){
    const buildCalendarCard=(w,{date='',compactClass='',spanEvent=false,spanStartIndex=0,spanDays=1,spanRow=0,overlap=null}={})=>{
      const [hh,mm]=(w.time||'09:00').split(':').map(Number);
      const start=((Number.isFinite(hh)?hh:9)+(Number.isFinite(mm)?mm:0)/60);
      const topPct=Math.max(0,Math.min(96,((start-calendarStartHour)/calendarHoursTotal)*100));
      const duration=workorderHours(w);
      const minHeight=Math.max(compactClass?34:40,Math.min(60,duration*34));
      const endTime=workorderEndTime(w,calendarEndHour);
      const totalSpan=workorderDaySpan(w);
      const currentDayIndex=date?Math.min(totalSpan,daysBetweenKeys(w.date,date)+1):1;
      const dayLabel=totalSpan>1?`${totalSpan} päeva`:'1 päev';
      const endLabel=totalSpan>1?`${fmtShortDate(workorderEndDate(w))} ${endTime}`:endTime;
      const overlapStyle=overlap&&!spanEvent
        ? `left:calc(8px + (100% - 16px - var(--calendar-click-gutter, 22px)) * ${overlap.left/100});right:auto;width:calc((100% - 16px - var(--calendar-click-gutter, 22px)) * ${overlap.width/100} - 3px);`
        : '';
      const style=spanEvent
        ? `--span-start:${spanStartIndex};--span-days:${spanDays};--span-row:${spanRow};top:calc(40px + (7 * var(--calendar-hour-px)) + (var(--span-row, 0) * 34px));height:30px;min-height:30px`
        : `top:${topPct}%;height:calc((100% / var(--calendar-hours-count)) * ${duration} - 4px);min-height:${minHeight}px;${overlapStyle}`;
      const daySeparators=spanEvent&&spanDays>1?Array.from({length:spanDays-1},(_,i)=>`<span class="calendar-span-day-separator" style="left:${((i+1)/spanDays)*100}%" aria-hidden="true"></span>`).join(''):'';
      const objectText=objectName(w.objectId);
      const titleText=(w.title||objectText||'Töö').trim();
      const clientText=clientName(objectClientId(w.objectId));
      if(spanEvent){
        const peopleCount=workorderPeopleIds(w).length||1;
        const peopleNames=workorderPeopleLabel(w);
        const peopleText=peopleNames || `${peopleCount} tehnik${peopleCount===1?'':'ut'}`;
        const spanMeta=`${fmtShortDate(w.date)}–${fmtShortDate(workorderEndDate(w))} • ${totalSpan}p • ${duration}h • ${peopleText}`;
        return `<button class="calendar-event calendar-status-${statusSlug(w.status)}${totalSpan>1?' multi-day':''} calendar-span-event" style="${style}" data-calendar-edit="${w.id}" data-calendar-drag="${w.id}" data-calendar-start="${esc(w.date||'')}" data-calendar-end="${esc(workorderEndDate(w))}" type="button" title="${esc(workorderCalendarTitle(w))}"><span class="calendar-span-continuation" aria-hidden="true"></span>${daySeparators}<span class="calendar-span-resize calendar-span-resize-left" data-calendar-span-resize="${w.id}" data-resize-side="left" title="Venita alguskuupäeva" aria-hidden="true"></span><span class="calendar-span-resize calendar-span-resize-right" data-calendar-span-resize="${w.id}" data-resize-side="right" title="Venita lõppkuupäeva" aria-hidden="true"></span><span class="calendar-span-ribbon-main"><b>${esc(objectText||titleText)}</b><span>${esc(titleText)}</span></span><span class="calendar-span-ribbon-meta">${esc(spanMeta)}</span></button>`;
      }
      return `<button class="calendar-event calendar-status-${statusSlug(w.status)}${compactClass}${overlap?' overlapping':''}${overlap&&overlap.columns>=3?' narrow':''}${totalSpan>1?' multi-day':''}${spanEvent?' calendar-span-event':''}" style="${style}" data-calendar-edit="${w.id}" data-calendar-drag="${w.id}" data-calendar-start="${esc(w.date||'')}" data-calendar-end="${esc(workorderEndDate(w))}" type="button" title="${esc(workorderCalendarTitle(w))}"><span class="calendar-span-continuation" aria-hidden="true"></span>${daySeparators}<span class="calendar-span-resize calendar-span-resize-left" data-calendar-span-resize="${w.id}" data-resize-side="left" title="Venita alguskuupäeva" aria-hidden="true"></span><span class="calendar-span-resize calendar-span-resize-right" data-calendar-span-resize="${w.id}" data-resize-side="right" title="Venita lõppkuupäeva" aria-hidden="true"></span><span class="calendar-time-resize calendar-time-resize-top" data-calendar-start-resize="${w.id}" title="Muuda alguskellaaega" aria-hidden="true"></span><span class="calendar-move-edge calendar-move-edge-left" title="Lohista vasakule / eelmisele päevale" aria-hidden="true"></span><span class="calendar-move-edge calendar-move-edge-right" title="Lohista paremale / järgmisele päevale" aria-hidden="true"></span><span class="calendar-event-head"><strong><b class="calendar-start-time">${esc(w.time||'')}</b> · ${esc(objectText)}</strong><em class="status ${statusClass(w.status)}">${esc(w.status)}</em></span>${calendarActBadgeHtml(w)}<b class="calendar-work-title">${esc(titleText)}</b>${workorderCalendarPeopleHtml(w)}<span class="calendar-event-footer" aria-label="Töö lõpp ja kestus"><b class="calendar-duration">${duration} h</b><b class="calendar-end-time">${esc(endLabel)}</b></span><span class="calendar-resize-handle" data-calendar-resize="${w.id}" title="Muuda kellalist kestust" aria-hidden="true"></span></button>`;
    };
    const calendarEventMinutes=w=>{
      const [hh,mm]=(w.time||'09:00').split(':').map(Number);
      const start=((Number.isFinite(hh)?hh:9)*60)+(Number.isFinite(mm)?mm:0);
      const duration=Math.max(0.25,Number(workorderHours(w))||1);
      return {start,end:start+duration*60};
    };
    const layoutOverlappingCalendarJobs=jobs=>{
      const sorted=[...jobs].sort((a,b)=>{
        const am=calendarEventMinutes(a), bm=calendarEventMinutes(b);
        return am.start-bm.start || am.end-bm.end || String(a.id).localeCompare(String(b.id));
      });
      const map=new Map();
      let cluster=[];
      let clusterEnd=-1;
      const flush=()=>{
        if(!cluster.length) return;
        const columns=[];
        cluster.forEach(w=>{
          const m=calendarEventMinutes(w);
          let col=columns.findIndex(end=>end<=m.start);
          if(col<0){ col=columns.length; columns.push(m.end); }
          else columns[col]=m.end;
          map.set(w.id,{col,columns:0});
        });
        const count=Math.max(1,columns.length);
        cluster.forEach(w=>{
          const rec=map.get(w.id);
          rec.columns=count;
          rec.width=100/count;
          rec.left=rec.col*rec.width;
        });
        cluster=[];
        clusterEnd=-1;
      };
      sorted.forEach(w=>{
        const m=calendarEventMinutes(w);
        if(cluster.length && m.start>=clusterEnd) flush();
        cluster.push(w);
        clusterEnd=Math.max(clusterEnd,m.end);
      });
      flush();
      return map;
    };
    const spanRows=[];
    const multiDayOverlay=filtered.filter(w=>workorderDaySpan(w)>1 && workorderIntersectsVisibleDays(w)).sort((a,b)=>(a.time||'').localeCompare(b.time||'')).map(w=>{
      const startIdx=visibleDays.findIndex(date=>workorderOccursOnDate(w,date));
      const endIdx=visibleDays.reduce((last,date,idx)=>workorderOccursOnDate(w,date)?idx:last,-1);
      if(startIdx<0||endIdx<startIdx) return '';
      let row=spanRows.findIndex(lastEnd=>lastEnd<startIdx);
      if(row<0){ row=spanRows.length; spanRows.push(endIdx); }
      else spanRows[row]=endIdx;
      return buildCalendarCard(w,{spanEvent:true,spanStartIndex:startIdx,spanDays:endIdx-startIdx+1,spanRow:row});
    }).join('');
    const columns=visibleDays.map(date=>{
      const d=parseDateKey(date);
      const jobs=filtered.filter(w=>workorderOccursOnDate(w,date) && workorderDaySpan(w)<=1).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
      const overlapMap=layoutOverlappingCalendarJobs(jobs);
      const compactClass=jobs.length>=3?' compact':'';
      const cards=jobs.map(w=>{
        const overlap=overlapMap.get(w.id);
        const useOverlap=overlap&&overlap.columns>1?overlap:null;
        return buildCalendarCard(w,{date,compactClass:compactClass||(useOverlap&&useOverlap.columns>=3?' compact':''),overlap:useOverlap});
      }).join('');
      const slots=hours.map(h=>`<button class="calendar-slot" data-add-date="${date}" data-add-time="${String(h).padStart(2,'0')}:00" title="Lisa töö ${date} ${String(h).padStart(2,'0')}:00" type="button"></button>`).join('');
      const dayInfo=estonianCalendarDayInfo(date);
      const specialShade=dayInfo.isHoliday||dayInfo.isWeekend?'<span class="calendar-special-day-shade full" aria-hidden="true"></span>':(dayInfo.isShort?`<span class="calendar-special-day-shade partial" style="top:${shortDayStartPct}%;height:${shortDayHeightPct}%" aria-hidden="true"></span>`:'');
      const workdayMarkers=`${specialShade}<span class="calendar-workday-shade" style="top:${workdayStartPct}%;height:${workdayHeightPct}%" aria-hidden="true"></span><span class="calendar-workday-line calendar-workday-start" style="top:${workdayStartPct}%" aria-hidden="true"></span><span class="calendar-workday-line calendar-workday-end" style="top:${workdayEndPct}%" aria-hidden="true"></span>`;
      const hasJobs=cards || filtered.some(w=>workorderOccursOnDate(w,date));
      const dayNote=calendarDayMarker(date);
      return `<div class="calendar-planner-day ${date===today?'today':''} ${calendarDayClass(date)}"><div class="calendar-planner-day-head"><div class="calendar-day-mainline"><strong>${dayNames[d.getDay()]}</strong><span>${esc(fmtShortDate(date,true))}</span>${dayNote}</div>${calendarDayAvailabilityHtml(date)}</div><div class="calendar-planner-lane" data-calendar-lane="${date}">${workdayMarkers}${slots}${cards || (!hasJobs?'<div class="calendar-empty-note">Töid ei ole</div>':'')}</div></div>`;
    }).join('');
    const nowLabel=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const globalNowLine=showNowLine?`<div class="calendar-now-line calendar-now-line-global" style="top:calc(40px + (100% - 40px) * ${nowTopPct/100})"><span>${nowLabel}</span></div>`:'';
    const stickyDateHeader=`<div class="calendar-date-sticky-header" aria-hidden="true" style="grid-template-columns:54px repeat(${visibleDays.length},minmax(150px,1fr))"><div class="calendar-date-sticky-spacer"></div>${visibleDays.map(date=>{const d=parseDateKey(date);const dayNote=calendarDayMarker(date);return `<div class="calendar-date-sticky-day ${date===today?'today':''} ${calendarDayClass(date)}"><div class="calendar-day-mainline"><strong>${dayNames[d.getDay()]}</strong><span>${esc(fmtShortDate(date,true))}</span>${dayNote}</div>${calendarDayAvailabilityHtml(date)}</div>`;}).join('')}</div>`;
    // Build 20260615_1013: responsive hour height - 24h scroll kept.
    const responsiveHourPx=calendarInitialResponsiveHourPx();
    body=`${stickyDateHeader}<div class="calendar-planner" style="--calendar-hours-count:${hours.length};--calendar-hour-px:${responsiveHourPx}px;--calendar-body-height:${hours.length*responsiveHourPx}px" data-initial-scroll-hour="7">${globalNowLine}<div class="calendar-hours"><div class="calendar-hours-spacer"></div>${hours.map(h=>`<div class="calendar-hour-label">${String(h).padStart(2,'0')}:00</div>`).join('')}</div><div class="calendar-planner-grid" style="--calendar-day-count:${visibleDays.length};grid-template-columns:repeat(${visibleDays.length},minmax(150px,1fr))">${columns}${multiDayOverlay}</div></div>`;
  }else if(mode==='month'){
    body=`<div class="calendar-month-grid">${visibleDays.map(date=>{const jobs=filtered.filter(w=>workorderOccursOnDate(w,date)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));const d=parseDateKey(date);const dayNote=calendarDayMarker(date);return `<div class="calendar-month-day ${date===today?'today':''} ${calendarDayClass(date)}" data-add-date="${date}"><div class="calendar-month-head"><strong>${d.getDate()}</strong><span>${dayNames[d.getDay()]}</span></div>${dayNote}${jobs.slice(0,4).map(w=>`<button class="calendar-mini-event" data-calendar-edit="${w.id}" type="button">${esc(w.time||'')} · ${esc(objectName(w.objectId))}${workorderDaySpan(w)>1?' · '+esc(daysBetweenKeys(w.date,date)+1)+'/'+esc(workorderDaySpan(w)):''}</button>`).join('')}${jobs.length>4?`<span class="muted">+${jobs.length-4} veel</span>`:''}</div>`}).join('')}</div>`;
  }else{
    body=`<div class="calendar-year-grid">${visibleDays.map(month=>{const jobs=filtered.filter(w=>w.date&&w.date.startsWith(month));const label=parseDateKey(month+'-01').toLocaleDateString('et-EE',{month:'long',year:'numeric'});return `<div class="calendar-year-month"><strong>${esc(label)}</strong><span class="muted">${jobs.length} tööd</span>${jobs.slice(0,5).map(w=>`<button class="calendar-mini-event" data-calendar-edit="${w.id}" type="button">${esc(fmtActDate(w.date))} · ${esc(objectName(w.objectId))}</button>`).join('')}</div>`}).join('')}</div>`;
  }
  window.__VECO_ONCALL_CONTEXT_DAYS__ = visibleDays;
  const compactHeader=calendarCompactHeader({rangeLabel:calendarRangeLabel(mode,visibleDays,currentDate),visibleDays,mode,currentDate,calendarTechFilterHtml,hideWeekend,statusFilter});
  const main=compactHeader+`<div class="calendar-planner-wrap">${scopeNotice()}${body}</div>`;
  shell(main,'',{wide:true});
  if(mode==='week'||mode==='day') startCalendarNowLineTicker({visibleDays,startHour:calendarStartHour,endHour:calendarEndHour,mode});
  else stopCalendarNowLineTicker();
  scheduleCalendarLayoutSync({scrollState:calendarScrollState,delay:30});
  document.querySelector('.calendar-planner-grid')?.addEventListener('scroll',()=>syncCalendarStickyHeader(),{passive:true});
  document.querySelector('.calendar-planner-wrap')?.addEventListener('scroll',()=>syncCalendarStickyHeader(),{passive:true});
  $('#calendarWeekStart')?.addEventListener('change',e=>{localStorage.setItem('veco_calendar_week',e.target.value);renderCalendar();}); bindEmployeeMultiFilter('calendar',renderCalendar); $('#calendarStatusFilter')?.addEventListener('change',renderCalendar); $('#calendarViewMode')?.addEventListener('change',renderCalendar);
  $('#calendarHideWeekend')?.addEventListener('click',()=>{localStorage.setItem('veco_calendar_hide_weekend',hideWeekend?'false':'true');renderCalendar();});
  $('#calendarPrevWeekBtn')?.addEventListener('click',()=>{const base=parseDateKey(currentDate); let next;if(mode==='day') next=addDateDays(base,-1); else if(mode==='week') next=addDateDays(base,-7); else if(mode==='month') next=new Date(base.getFullYear(),base.getMonth()-1,1,12,0,0); else next=new Date(base.getFullYear()-1,0,1,12,0,0); localStorage.setItem('veco_calendar_week',dateKeyFromDate(next));renderCalendar();});
  $('#calendarNextWeekBtn')?.addEventListener('click',()=>{const base=parseDateKey(currentDate); let next;if(mode==='day') next=addDateDays(base,1); else if(mode==='week') next=addDateDays(base,7); else if(mode==='month') next=new Date(base.getFullYear(),base.getMonth()+1,1,12,0,0); else next=new Date(base.getFullYear()+1,0,1,12,0,0); localStorage.setItem('veco_calendar_week',dateKeyFromDate(next));renderCalendar();});
  $('#calendarThisWeekBtn')?.addEventListener('click',()=>{localStorage.setItem('veco_calendar_week',mode==='week'?weekStartKeyFrom(''):dateKeyFromDate(new Date()));renderCalendar();});
  $('#newCalendarWorkorderBtn')?.addEventListener('click',()=>openWorkorderModal());
  $('#calendarFiltersToggle')?.addEventListener('click',e=>{
    const head=e.currentTarget.closest('.calendar-compact-head');
    const next=!head?.classList.contains('filters-open');
    localStorage.setItem('veco_calendar_filters_expanded',next?'true':'false');
    if(head){
      head.classList.toggle('filters-open',next);
      head.classList.toggle('filters-closed',!next);
      const panel=head.querySelector('.calendar-filter-panel');
      if(panel) panel.setAttribute('aria-hidden',next?'false':'true');
      e.currentTarget.setAttribute('aria-expanded',next?'true':'false');
      e.currentTarget.innerHTML=`☷ Filtrid ${next?'⌃':'⌄'}`;
    }
    setCalendarLayoutPreparing();
    scheduleCalendarLayoutSync({scrollState:captureCalendarScrollState(),delay:220});
  });
  $('#calendarImportWorkBtn')?.addEventListener('click',()=>openCalendarImportModal(currentDate));
  $$('[data-add-date]').forEach(el=>el.addEventListener('click',e=>{ if(e.target.closest('[data-calendar-edit]')) return; const date=el.dataset.addDate; const time=el.dataset.addTime||'09:00'; openCalendarWorkorderModal(date,time); }));
  bindCalendarResize(calendarStartHour,calendarEndHour);
  bindCalendarSpanResize();
  bindCalendarDragDrop(calendarStartHour,calendarEndHour);
  $$('[data-calendar-edit]').forEach(el=>el.addEventListener('click',e=>{
    e.stopPropagation();
    if(window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__){window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false; return;}
    const id=el.dataset.calendarEdit;
    if(!isStoredWorkorderId(id)){ openMissingWorkorderModal('', 'calendar-event-click'); return; }
    if(!byId(state.workorders,id)){ openMissingWorkorderModal(id, 'calendar-event-click'); return; }
    openWorkorderModal(id,{source:'calendar-event-click'});
  }));
  saveBootHtmlSnapshot();
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
        if(endEl) endEl.textContent=timeLabelFromHour(fixedEnd);
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
  const lanes=()=>Array.from(document.querySelectorAll('[data-calendar-lane]'));
  const laneAtPoint=(x,y,ignoreEl)=>{
    // Prefer the actual element under the pointer, but fall back to X-position.
    // Build 20260625_1024: the fallback also works while the pointer is over
    // the card side handle itself, the day header, the gutter, or another card.
    const oldPointer=ignoreEl?.style.pointerEvents;
    if(ignoreEl) ignoreEl.style.pointerEvents='none';
    const el=document.elementFromPoint(x,y);
    if(ignoreEl) ignoreEl.style.pointerEvents=oldPointer||'';
    const direct=el?.closest?.('[data-calendar-lane]')||null;
    if(direct) return direct;
    const list=lanes();
    if(!list.length) return null;
    const byX=list.find(l=>{const r=l.getBoundingClientRect(); return x>=r.left && x<=r.right;});
    if(byX) return byX;
    return list.reduce((best,l)=>{
      const r=l.getBoundingClientRect();
      const cx=r.left+r.width/2;
      const dist=Math.abs(x-cx);
      return !best||dist<best.dist?{lane:l,dist}:best;
    },null)?.lane||null;
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
      const wasSpanEvent=card.classList.contains('calendar-span-event');
      let nextStart=w.date;
      let nextEnd=workorderEndDate(w);
      let changed=false;
      window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=true;
      window.__VECO_CALENDAR_RESIZING__=true;
      document.body.classList.add('calendar-span-resize-active');
      card.classList.add('span-resizing');
      card.setAttribute('data-span-label',labelFor(nextStart,nextEnd));
      try{ handle.setPointerCapture?.(e.pointerId); }catch(_){ }

      let spanPreview=null;
      const previewDays=()=>lanes().map(l=>l?.dataset?.calendarLane).filter(Boolean);
      const removeSpanPreview=()=>{
        if(spanPreview){
          spanPreview.remove();
          spanPreview=null;
        }
      };
      const ensureSpanPreview=()=>{
        const grid=document.querySelector('.calendar-planner-grid');
        if(!grid) return null;
        if(spanPreview && spanPreview.isConnected) return spanPreview;
        const clone=card.cloneNode(true);
        clone.classList.add('calendar-span-event','calendar-span-preview','span-resizing');
        clone.classList.remove('overlapping','narrow','compact');
        clone.removeAttribute('data-calendar-edit');
        clone.removeAttribute('data-calendar-drag');
        clone.querySelectorAll('[data-calendar-edit],[data-calendar-drag],[data-calendar-span-resize],[data-calendar-resize],[data-calendar-start-resize]').forEach(el=>{
          el.removeAttribute('data-calendar-edit');
          el.removeAttribute('data-calendar-drag');
          el.removeAttribute('data-calendar-span-resize');
          el.removeAttribute('data-calendar-resize');
          el.removeAttribute('data-calendar-start-resize');
        });
        clone.style.top='calc(40px + (7 * var(--calendar-hour-px)))';
        clone.style.height='30px';
        clone.style.minHeight='30px';
        clone.style.pointerEvents='none';
        grid.appendChild(clone);
        spanPreview=clone;
        return spanPreview;
      };
      const cleanup=()=>{
        try{ handle.releasePointerCapture?.(e.pointerId); }catch(_){ }
        document.removeEventListener('pointermove',onMove,true);
        document.removeEventListener('pointerup',onUp,true);
        document.removeEventListener('pointercancel',onCancel,true);
        document.body.classList.remove('calendar-span-resize-active');
        card.classList.remove('span-resizing');
        card.removeAttribute('data-span-label');
        removeSpanPreview();
        setTimeout(()=>{ window.__VECO_CALENDAR_RESIZING__=false; },80);
      };
      const applyPoint=(clientX,clientY)=>{
        const lane=laneAtPoint(clientX,clientY,card);
        if(!lane?.dataset?.calendarLane) return;
        const target=lane.dataset.calendarLane;
        const currentStart=w.date;
        const currentEnd=workorderEndDate(w);
        const oldStart=nextStart;
        const oldEnd=nextEnd;
        if(side==='right'){
          nextStart=currentStart;
          nextEnd=target<currentStart?currentStart:target;
        }else{
          nextEnd=currentEnd;
          nextStart=target>currentEnd?currentEnd:target;
        }
        changed=changed || oldStart!==nextStart || oldEnd!==nextEnd;
        card.setAttribute('data-span-label',labelFor(nextStart,nextEnd));
        // Live preview for single-day cards as they become multi-day.
        // CR-CALENDAR-SPAN-RESIZE-002: bindCalendarSpanResize() is outside renderCalendar(),
        // so renderCalendar()'s local visibleDays is not in scope here. Build the visible day
        // list from the rendered lanes instead; otherwise pointermove throws ReferenceError and
        // the resize never reaches setWorkorderDateRange()/save().
        // Only live-resize cards that were already rendered in the multi-day overlay.
        // Single-day cards are children of one day lane; forcing `calendar-span-event` on them
        // moves them into the overlay positioning model while they are still inside the lane,
        // which makes the card shrink/disappear until the next full render.
        const days=previewDays();
        const startIdx=days.findIndex(date=>date===nextStart);
        const endIdx=days.findIndex(date=>date===nextEnd);
        if(startIdx>=0 && endIdx>=startIdx){
          const previewTarget=wasSpanEvent ? card : ensureSpanPreview();
          previewTarget?.style?.setProperty('--span-start',String(startIdx));
          previewTarget?.style?.setProperty('--span-days',String(endIdx-startIdx+1));
          previewTarget?.setAttribute?.('data-span-label',labelFor(nextStart,nextEnd));
        }
      };
      const onMove=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        applyPoint(ev.clientX,ev.clientY);
      };
      const onUp=(ev)=>{
        if(ev.pointerId!==e.pointerId) return;
        ev.preventDefault();
        ev.stopPropagation();
        applyPoint(ev.clientX,ev.clientY);
        cleanup();
        if(changed || nextStart!==w.date || nextEnd!==workorderEndDate(w)){
          setWorkorderDateRange(w,nextStart,nextEnd);
          save();
          setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;renderCalendar();},0);
        }else{
          setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;},120);
        }
      };
      const onCancel=()=>{ cleanup(); setTimeout(()=>{window.__VECO_CALENDAR_DRAG_CLICK_BLOCK__=false;renderCalendar();},0); };
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
      // Build 20260625_1024: side/date-span and vertical time resize handles must not start card drag.
      if(e.target?.closest?.('[data-calendar-span-resize],[data-calendar-resize],[data-calendar-start-resize]')) return;
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
        ghost.removeAttribute('id');
        ghost.style.position='fixed';
        ghost.style.zIndex='2147483000';
        ghost.style.width=`${cardRect.width}px`;
        ghost.style.height=`${cardRect.height}px`;
        ghost.style.left=`${cardRect.left}px`;
        ghost.style.top=`${cardRect.top}px`;
        ghost.style.right='auto';
        ghost.style.bottom='auto';
        ghost.style.margin='0';
        ghost.style.transform='translateZ(0)';
        ghost.style.pointerEvents='none';
        ghost.style.willChange='left, top';
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
        card.style.zIndex='2147482000';
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
  openModal(`<form id="calendarImportForm"><div class="dialog-head"><h2>Impordi töö</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Kleebi töö tekst või snipilt loetud info<textarea name="importText" placeholder="Näide: klient, objekt, aadress, töö kirjeldus, kuupäev, kellaaeg..."></textarea></label><label>Kuupäev<input class="field" name="date" type="date" value="${esc(defaultDate||dateKeyFromDate(new Date()))}"></label><label>Kell<input class="field" name="time" type="time" value="09:00"></label></div><span class="muted">Praegu teeb import tekstist eeltäidetud töö. Pildi/OCR automaatika jääb hilisemaks etapiks.</span></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Ava eeltäidetud töö</button></div></form>`);
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
  openWorkorderModal('',{date:date||'',time:time||''});
}
function calendarDetailHtml(){ return ''; }



function renderTicker(){
  const sources=[
    ['Tänane valve','Sisemine operatiivinfo valvetest.','Valmis ühendamiseks valvegraafikuga'],
    ['Tänased puudumised','Puhkus, haigus, koolitus ja muu puudumine.','Valmis ühendamiseks puhkuste vaatega'],
    ['Hilinenud tööd','Tööd, mille planeeritud aeg on möödas.','Tulevane klikitav teade'],
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


const deviceTypes=['Vent','Jahutus','Küte','Elektrikäit','VK','Automaatika','Muu'];
const deviceStatuses=['Aktiivne','Reserv','Mahakantud','Peidetud'];
function normalizeDevices(){
  state.devices=Array.isArray(state.devices)?state.devices:[];
  state.devices.forEach(d=>{
    d.id=d.id||uid('D');
    d.objectId=d.objectId||'';
    d.code=d.code||d.tag||d.designation||d.name||'';
    d.name=d.title||d.deviceName||d.model||d.label||d.name||'';
    if(d.name===d.code) d.name=d.title||d.model||'';
    const rawType=String(d.type||'').trim();
    const lower=rawType.toLowerCase();
    if(['ventilatsiooniseade','ventilatsioon','ahu'].includes(lower)) d.type='Vent';
    else if(['jahutusmasin','jahutus','chiller','split'].includes(lower)) d.type='Jahutus';
    else if(['soojussõlm','küte','kute'].includes(lower)) d.type='Küte';
    else if(lower.includes('elektr')) d.type='Elektrikäit';
    else if(['vesi','kanalisatsioon','vk'].includes(lower)) d.type='VK';
    else d.type=deviceTypes.includes(rawType)?rawType:(rawType||'Muu');
    d.location=d.location||'';
    const rawStatus=String(d.status||'').trim();
    const statusLower=rawStatus.toLowerCase();
    if(['ok','attention','active','aktiivne',''].includes(statusLower)) d.status='Aktiivne';
    else if(['reserve','reserv'].includes(statusLower)) d.status='Reserv';
    else if(['retired','mahakantud'].includes(statusLower)) d.status='Mahakantud';
    else if(['hidden','peidetud','archived','arhiveeritud'].includes(statusLower)) d.status='Peidetud';
    else d.status=deviceStatuses.includes(rawStatus)?rawStatus:'Aktiivne';
    d.notes=d.notes||d.note||'';
    d.maintenanceNormId=d.maintenanceNormId||d.hooldusMallId||'';
    d.maintenanceLevel=d.maintenanceLevel||d.hooldusTase||'';
    d.lastService=d.lastService||d.viimaneHooldus||'';
    d.nextService=d.nextService||d.järgmineHooldus||d.jargmineHooldus||'';
  });
}
function renderDevices(){
  normalizeDevices();
  const q=($('#deviceSearch')?.value||'').toLowerCase();
  const objectFilter=$('#deviceObjectFilter')?.value||'all';
  const typeFilter=$('#deviceTypeFilter')?.value||'all';
  const statusFilter=$('#deviceStatusFilter')?.value||'active';
  const list=state.devices.filter(d=>{
    const hay=[d.code,d.name,d.type,d.location,d.notes,objectName(d.objectId),clientName(objectClientId(d.objectId))].join(' ').toLowerCase();
    const okQ=!q||hay.includes(q);
    const okObject=objectFilter==='all'||d.objectId===objectFilter;
    const okType=typeFilter==='all'||d.type===typeFilter;
    const okStatus=statusFilter==='all'||(statusFilter==='active'?d.status!=='Peidetud'&&d.status!=='Mahakantud':d.status===statusFilter);
    return okQ&&okObject&&okType&&okStatus;
  }).sort((a,b)=>objectName(a.objectId).localeCompare(objectName(b.objectId),'et')||String(a.code).localeCompare(String(b.code),'et'));
  const types=Array.from(new Set([...(state.devices||[]).map(d=>d.type).filter(Boolean),...deviceTypes]));
  const filters=`<input class="field" id="deviceSearch" placeholder="Otsi seadet, objekti või asukohta..." value="${esc(q)}"><select class="select" id="deviceObjectFilter"><option value="all">Kõik objektid</option>${state.objects.map(o=>`<option value="${esc(o.id)}" ${objectFilter===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select><select class="select" id="deviceTypeFilter"><option value="all">Kõik liigid</option>${types.map(t=>`<option value="${esc(t)}" ${typeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select><select class="select" id="deviceStatusFilter"><option value="active" ${statusFilter==='active'?'selected':''}>Aktiivsed</option>${deviceStatuses.map(st=>`<option value="${esc(st)}" ${statusFilter===st?'selected':''}>${esc(st)}</option>`).join('')}<option value="all" ${statusFilter==='all'?'selected':''}>Kõik</option></select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn" type="button">Taasta demo</button><button class="btn primary" id="newDeviceBtn" type="button">+ Uus seade</button>`;
  const rows=list.map(d=>`<tr><td><strong>${esc(objectName(d.objectId))}</strong><div class="muted">${esc(clientName(objectClientId(d.objectId)))}</div></td><td><strong>${esc(d.code||'-')}</strong></td><td>${esc(d.name||'')}</td><td>${esc(d.type||'')}</td><td>${esc(d.location||'')}</td><td><span class="status ${d.status==='Aktiivne'?'ok':(d.status==='Reserv'?'warn':'red')}">${esc(d.status||'')}</span></td><td class="nowrap"><button class="btn small ghost" data-edit-device="${esc(d.id)}" type="button">Muuda</button> <button class="btn small ghost" data-toggle-device="${esc(d.id)}" type="button">${d.status==='Peidetud'?'Aktiveeri':'Peida'}</button> <button class="btn small danger" data-delete-device="${esc(d.id)}" type="button">Kustuta</button></td></tr>`).join('')||`<tr><td colspan="7" class="muted">Seadmeid ei leitud.</td></tr>`;
  const intro=`<div class="card"><div class="card-top"><h3>Seadmete register</h3><span class="status ok">MVP</span></div><span class="muted">Seadmed on järgmine aluskiht hooldusprofiilide, tähelepanekute ja hooldusmahu arvutuse jaoks. Esialgu on see admin-vaade seadmete korrastamiseks.</span></div>`;
  const activeCount=state.devices.filter(d=>d.status!=='Peidetud'&&d.status!=='Mahakantud').length;
  const objectCount=new Set(state.devices.map(d=>d.objectId).filter(Boolean)).size;
  const main=header('Seadmed',filters,actions,'SEADED')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Seadmeid',state.devices.length)}${summaryBox('Aktiivseid',activeCount)}${summaryBox('Objekte',objectCount)}${summaryBox('Liike',new Set(state.devices.map(d=>d.type).filter(Boolean)).size)}</div>${intro}<div class="section-title">Seadmete register</div>${table(['Objekt','Tähis','Nimetus','Liik','Asukoht','Staatus','Tegevused'],rows)}<div class="muted">Järgmises etapis seome seadmed hooldusnormidega: seade → hooldusliik/tase → prognoositav hooldusaeg.</div></div>`;
  shell(main,'',{wide:true});
  $('#deviceSearch')?.addEventListener('input',renderDevices);
  $('#deviceObjectFilter')?.addEventListener('change',renderDevices);
  $('#deviceTypeFilter')?.addEventListener('change',renderDevices);
  $('#deviceStatusFilter')?.addEventListener('change',renderDevices);
  $('#newDeviceBtn')?.addEventListener('click',()=>openDeviceModal());
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();normalizeDevices();save();renderDevices();});
  $$('[data-edit-device]').forEach(btn=>btn.addEventListener('click',()=>openDeviceModal(btn.dataset.editDevice)));
  $$('[data-toggle-device]').forEach(btn=>btn.addEventListener('click',()=>{const d=byId(state.devices,btn.dataset.toggleDevice);if(d){d.status=d.status==='Peidetud'?'Aktiivne':'Peidetud';save();renderDevices();}}));
  $$('[data-delete-device]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.deleteDevice;const d=byId(state.devices,id);if(!d)return;openConfirm({title:'Kustuta seade?',message:`${d.code||d.name} · ${objectName(d.objectId)}`,details:'<div class="muted">Kustutamine eemaldab seadme registrist. Kui seade on päriselt kasutusest väljas, kasuta pigem staatust Peidetud või Mahakantud.</div>',confirmText:'Arhiveeri',onConfirm:()=>{state.devices=state.devices.filter(x=>x.id!==id);save();renderDevices();}});}))
}
function openDeviceModal(id=''){
  normalizeDevices();
  const d=id?byId(state.devices,id):{objectId:'',code:'',name:'',type:'',location:'',status:'Aktiivne',notes:''};
  const objectOptions=state.objects.map(o=>`<option value="${esc(o.id)}" ${d.objectId===o.id?'selected':''}>${esc(o.name)} · ${esc(clientName(o.clientId))}</option>`).join('');
  const typeOptions=deviceTypes.map(t=>`<option value="${esc(t)}" ${d.type===t?'selected':''}>${esc(t)}</option>`).join('');
  const statusOptions=deviceStatuses.map(st=>`<option value="${esc(st)}" ${d.status===st?'selected':''}>${esc(st)}</option>`).join('');
  openModal(`<form id="deviceForm"><div class="dialog-head"><h2>${id?'Muuda seadet':'Lisa seade'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Objekt<select class="select" name="objectId" required><option value="">Vali objekt...</option>${objectOptions}</select></label><label>Tähis<input class="field" name="code" required placeholder="Nt AHU-01" value="${esc(d.code||'')}"></label><label>Nimetus<input class="field" name="name" placeholder="Nt Komfovent Verso" value="${esc(d.name||'')}"></label><label>Liik<select class="select" name="type" required><option value="">Vali liik...</option>${typeOptions}</select></label><label>Asukoht<input class="field" name="location" placeholder="Nt katus / tehnoruum" value="${esc(d.location||'')}"></label><label>Staatus<select class="select" name="status" required>${statusOptions}</select></label><label class="full">Märkus<textarea name="notes" placeholder="Lisa vajadusel täpsustus, ligipääsu info või märkused...">${esc(d.notes||'')}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#deviceForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const next={id:id||uid('D'),objectId:f.objectId.value,code:f.code.value.trim(),name:f.name.value.trim(),type:f.type.value,location:f.location.value.trim(),status:f.status.value,notes:f.notes.value||'',maintenanceNormId:d.maintenanceNormId||'',maintenanceLevel:d.maintenanceLevel||'',lastService:d.lastService||'',nextService:d.nextService||''};
    if(id){Object.assign(d,next)}else{state.devices.push(next)}
    save();closeModal();renderDevices();
  });
}

const maintenanceNormTypes=['Vent TH','Jahutus TH','Elektrikäit','VK','Automaatika','Gaas','Muu'];
const maintenanceNormLevels=['Kontroll','Hooldus','Aastahooldus'];
function normalizeMaintenanceNorms(){
  state.maintenanceNorms=Array.isArray(state.maintenanceNorms)?state.maintenanceNorms:[];
  state.maintenanceNorms.forEach(n=>{
    n.id=n.id||uid('MN');
    n.type=n.type||'Muu';
    n.level=n.level||'Hooldus';
    n.hours=Number(n.hours||0);
    n.active=n.active!==false;
    n.notes=n.notes||'';
  });
}
function renderMaintenanceNorms(){
  normalizeMaintenanceNorms();
  const q=($('#maintenanceNormSearch')?.value||'').toLowerCase();
  const type=$('#maintenanceNormTypeFilter')?.value||'all';
  const level=$('#maintenanceNormLevelFilter')?.value||'all';
  const active=$('#maintenanceNormActiveFilter')?.value||'active';
  const list=state.maintenanceNorms.filter(n=>{
    const hay=[n.type,n.level,n.notes,`${n.hours}`].join(' ').toLowerCase();
    const okQ=!q||hay.includes(q);
    const okType=type==='all'||n.type===type;
    const okLevel=level==='all'||n.level===level;
    const okActive=active==='all'||(active==='active'?n.active!==false:n.active===false);
    return okQ&&okType&&okLevel&&okActive;
  }).sort((a,b)=>String(a.type).localeCompare(String(b.type),'et')||maintenanceNormLevels.indexOf(a.level)-maintenanceNormLevels.indexOf(b.level)||Number(a.hours)-Number(b.hours));
  const hoursTotal=list.filter(n=>n.active!==false).reduce((sum,n)=>sum+Number(n.hours||0),0);
  const types=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes]));
  const filters=`<input class="field" id="maintenanceNormSearch" placeholder="Otsi normi, taset või märkust..." value="${esc(q)}"><select class="select" id="maintenanceNormTypeFilter"><option value="all">Kõik hooldusliigid</option>${types.map(t=>`<option value="${esc(t)}" ${type===t?'selected':''}>${esc(t)}</option>`).join('')}</select><select class="select" id="maintenanceNormLevelFilter"><option value="all">Kõik tasemed</option>${maintenanceNormLevels.map(l=>`<option value="${esc(l)}" ${level===l?'selected':''}>${esc(l)}</option>`).join('')}</select><select class="select" id="maintenanceNormActiveFilter"><option value="active" ${active==='active'?'selected':''}>Aktiivsed</option><option value="inactive" ${active==='inactive'?'selected':''}>Peidetud</option><option value="all" ${active==='all'?'selected':''}>Kõik</option></select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn" type="button">Taasta demo</button><button class="btn primary" id="newMaintenanceNormBtn" type="button">+ Uus norm</button>`;
  const rows=list.map(n=>`<tr><td><strong>${esc(n.type)}</strong></td><td>${esc(n.level)}</td><td><strong>${Number(n.hours||0).toFixed(1)} h</strong></td><td><span class="status ${n.active!==false?'ok':'red'}">${n.active!==false?'Aktiivne':'Peidetud'}</span></td><td>${esc(n.notes||'')}</td><td class="nowrap"><button class="btn small ghost" data-edit-maintenance-norm="${esc(n.id)}" type="button">Muuda</button> <button class="btn small ghost" data-toggle-maintenance-norm="${esc(n.id)}" type="button">${n.active!==false?'Peida':'Aktiveeri'}</button> <button class="btn small danger" data-delete-maintenance-norm="${esc(n.id)}" type="button">Kustuta</button></td></tr>`).join('')||`<tr><td colspan="6" class="muted">Hooldusnorme ei leitud.</td></tr>`;
  const intro=`<div class="card"><div class="card-top"><h3>Planeerimisbaas</h3><span class="status ok">MVP</span></div><span class="muted">Hooldusnormid on tulevase hooldusmahu arvutuse alus. Esialgu kasutame lihtsat mudelit: hooldusliik × tase × standardaeg. Järgmises etapis seotakse need objekti hooldusprofiiliga.</span></div>`;
  const main=header('Hooldusnormid',filters,actions,'SEADED')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Norme',state.maintenanceNorms.length)}${summaryBox('Aktiivseid',state.maintenanceNorms.filter(n=>n.active!==false).length)}${summaryBox('Hooldusliike',new Set(state.maintenanceNorms.map(n=>n.type)).size)}${summaryBox('Valitud h summa',`${hoursTotal.toFixed(1)} h`)}</div>${intro}<div class="section-title">Normide register</div>${table(['Hooldusliik','Tase','Standardaeg','Staatus','Märkus','Tegevused'],rows)}<div class="muted">Soovituslik algloogika: Kontroll 1 h, Hooldus 2 h, Aastahooldus 4 h. Täpsustame hiljem päris tööaegade põhjal.</div></div>`;
  shell(main,'',{wide:true});
  $('#maintenanceNormSearch')?.addEventListener('input',renderMaintenanceNorms);
  $('#maintenanceNormTypeFilter')?.addEventListener('change',renderMaintenanceNorms);
  $('#maintenanceNormLevelFilter')?.addEventListener('change',renderMaintenanceNorms);
  $('#maintenanceNormActiveFilter')?.addEventListener('change',renderMaintenanceNorms);
  $('#newMaintenanceNormBtn')?.addEventListener('click',()=>openMaintenanceNormModal());
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();normalizeMaintenanceNorms();save();renderMaintenanceNorms();});
  $$('[data-edit-maintenance-norm]').forEach(btn=>btn.addEventListener('click',()=>openMaintenanceNormModal(btn.dataset.editMaintenanceNorm)));
  $$('[data-toggle-maintenance-norm]').forEach(btn=>btn.addEventListener('click',()=>{const n=byId(state.maintenanceNorms,btn.dataset.toggleMaintenanceNorm);if(n){n.active=n.active===false;save();renderMaintenanceNorms();}}));
  $$('[data-delete-maintenance-norm]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.deleteMaintenanceNorm;const n=byId(state.maintenanceNorms,id);if(!n)return;openConfirm({title:'Kustuta hooldusnorm?',message:`${n.type} · ${n.level} · ${n.hours} h`,details:'<div class="muted">Kustutamine eemaldab normi registrist. Tulevikus objektide hooldusprofiilid hakkavad kasutama ainult olemasolevaid aktiivseid norme.</div>',confirmText:'Arhiveeri',onConfirm:()=>{state.maintenanceNorms=state.maintenanceNorms.filter(x=>x.id!==id);save();renderMaintenanceNorms();}});}));
}
function openMaintenanceNormModal(id=''){
  normalizeMaintenanceNorms();
  const n=id?byId(state.maintenanceNorms,id):{type:'',level:'',hours:'',active:true,notes:''};
  const typeOptions=maintenanceNormTypes.map(t=>`<option value="${esc(t)}" ${n.type===t?'selected':''}>${esc(t)}</option>`).join('');
  const levelOptions=maintenanceNormLevels.map(l=>`<option value="${esc(l)}" ${n.level===l?'selected':''}>${esc(l)}</option>`).join('');
  openModal(`<form id="maintenanceNormForm"><div class="dialog-head"><h2>${id?'Muuda hooldusnormi':'Lisa hooldusnorm'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Hooldusliik<select class="select" name="type" required><option value="">Vali hooldusliik...</option>${typeOptions}</select></label><label>Tase<select class="select" name="level" required><option value="">Vali tase...</option>${levelOptions}</select></label><label>Standardaeg (h)<input class="field" name="hours" type="number" min="0" step="0.25" required value="${esc(n.hours)}"></label><label>Staatus<select class="select" name="active"><option value="true" ${n.active!==false?'selected':''}>Aktiivne</option><option value="false" ${n.active===false?'selected':''}>Peidetud</option></select></label><label class="full">Märkus<textarea name="notes" placeholder="Näiteks: aastahooldus sisaldab filtrivahetust ja põhjalikumat kontrolli.">${esc(n.notes||'')}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#maintenanceNormForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const next={id:id||uid('MN'),type:f.type.value,level:f.level.value,hours:Number(f.hours.value||0),active:f.active.value==='true',notes:f.notes.value||''};
    if(id){Object.assign(n,next)}else{state.maintenanceNorms.push(next)}
    save();closeModal();renderMaintenanceNorms();
  });
}

const maintenanceFrequencies=['Kuu','Kvartal','Poolaasta','Aasta','Ühekordne'];
function normByTypeLevel(type,level){
  normalizeMaintenanceNorms();
  return state.maintenanceNorms.find(n=>n.active!==false&&n.type===type&&n.level===level)||null;
}
function deviceLabel(id){
  const d=byId(state.devices,id);
  if(!d) return '-';
  return `${d.code||d.name||'-'}${d.name&&d.name!==d.code?' · '+d.name:''}`;
}
function profileHours(p){
  const n=normByTypeLevel(p.type,p.level);
  return Number(p.hoursOverride||n?.hours||0);
}
function normalizeMaintenanceProfiles(){
  normalizeDevices();
  normalizeMaintenanceNorms();
  state.maintenanceProfiles=Array.isArray(state.maintenanceProfiles)?state.maintenanceProfiles:[];
  state.maintenanceProfiles.forEach(p=>{
    p.id=p.id||uid('MP');
    p.deviceId=p.deviceId||'';
    p.type=p.type||'';
    p.level=p.level||'Hooldus';
    p.frequency=p.frequency||'Poolaasta';
    p.active=p.active!==false;
    p.notes=p.notes||'';
    p.hoursOverride=Number(p.hoursOverride||0);
  });
}
function renderMaintenanceProfiles(){
  normalizeMaintenanceProfiles();
  const q=($('#maintenanceProfileSearch')?.value||'').toLowerCase();
  const objectFilter=$('#maintenanceProfileObjectFilter')?.value||'all';
  const typeFilter=$('#maintenanceProfileTypeFilter')?.value||'all';
  const activeFilter=$('#maintenanceProfileActiveFilter')?.value||'active';
  const list=state.maintenanceProfiles.filter(p=>{
    const d=byId(state.devices,p.deviceId);
    const objectId=d?.objectId||'';
    const hay=[deviceLabel(p.deviceId),objectName(objectId),clientName(objectClientId(objectId)),p.type,p.level,p.frequency,p.notes].join(' ').toLowerCase();
    return (!q||hay.includes(q)) && (objectFilter==='all'||objectId===objectFilter) && (typeFilter==='all'||p.type===typeFilter) && (activeFilter==='all'||(activeFilter==='active'?p.active!==false:p.active===false));
  }).sort((a,b)=>objectName(byId(state.devices,a.deviceId)?.objectId).localeCompare(objectName(byId(state.devices,b.deviceId)?.objectId),'et')||deviceLabel(a.deviceId).localeCompare(deviceLabel(b.deviceId),'et'));
  const types=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes]));
  const total=list.filter(p=>p.active!==false).reduce((sum,p)=>sum+profileHours(p),0);
  const objectTotals={};
  list.filter(p=>p.active!==false).forEach(p=>{const d=byId(state.devices,p.deviceId); const oid=d?.objectId||''; if(oid) objectTotals[oid]=(objectTotals[oid]||0)+profileHours(p);});
  const topObject=Object.entries(objectTotals).sort((a,b)=>b[1]-a[1])[0];
  const filters=`<input class="field" id="maintenanceProfileSearch" placeholder="Otsi seadet, objekti või hooldusliiki..." value="${esc(q)}"><select class="select" id="maintenanceProfileObjectFilter"><option value="all">Kõik objektid</option>${state.objects.map(o=>`<option value="${esc(o.id)}" ${objectFilter===o.id?'selected':''}>${esc(o.name)}</option>`).join('')}</select><select class="select" id="maintenanceProfileTypeFilter"><option value="all">Kõik hooldusliigid</option>${types.map(t=>`<option value="${esc(t)}" ${typeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select><select class="select" id="maintenanceProfileActiveFilter"><option value="active" ${activeFilter==='active'?'selected':''}>Aktiivsed</option><option value="inactive" ${activeFilter==='inactive'?'selected':''}>Peidetud</option><option value="all" ${activeFilter==='all'?'selected':''}>Kõik</option></select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn" type="button">Taasta demo</button><button class="btn primary" id="newMaintenanceProfileBtn" type="button">+ Uus profiil</button>`;
  const rows=list.map(p=>{const d=byId(state.devices,p.deviceId); const n=normByTypeLevel(p.type,p.level); const h=profileHours(p); return `<tr><td><strong>${esc(objectName(d?.objectId))}</strong><div class="muted">${esc(clientName(objectClientId(d?.objectId)))}</div></td><td><strong>${esc(deviceLabel(p.deviceId))}</strong><div class="muted">${esc(d?.type||'')}</div></td><td>${esc(p.type)}</td><td>${esc(p.level)}</td><td>${esc(p.frequency)}</td><td><strong>${h.toFixed(1)} h</strong>${p.hoursOverride?'<div class="muted">käsitsi</div>':(n?'<div class="muted">normist</div>':'<div class="muted">norm puudub</div>')}</td><td><span class="status ${p.active!==false?'ok':'red'}">${p.active!==false?'Aktiivne':'Peidetud'}</span></td><td class="nowrap"><button class="btn small ghost" data-edit-maintenance-profile="${esc(p.id)}" type="button">Muuda</button> <button class="btn small ghost" data-toggle-maintenance-profile="${esc(p.id)}" type="button">${p.active!==false?'Peida':'Aktiveeri'}</button> <button class="btn small danger" data-delete-maintenance-profile="${esc(p.id)}" type="button">Kustuta</button></td></tr>`}).join('')||'<tr><td colspan="8" class="muted">Hooldusprofiile ei leitud.</td></tr>';
  const intro=`<div class="card"><div class="card-top"><h3>Seade → hooldusnorm</h3><span class="status ok">MVP</span></div><span class="muted">Hooldusprofiil seob seadme hooldusliigi ja tasemega. VECO arvutab normitabelist esialgse hooldusmahu. See on alus tulevasele 30/60/90 päeva ressursivaatele.</span></div>`;
  const main=header('Hooldusprofiil',filters,actions,'SEADED')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Profiile',state.maintenanceProfiles.length)}${summaryBox('Aktiivseid',state.maintenanceProfiles.filter(p=>p.active!==false).length)}${summaryBox('Valitud maht',total.toFixed(1)+' h')}${summaryBox('Suurim objekt',topObject?`${objectName(topObject[0])} · ${topObject[1].toFixed(1)} h`:'-')}</div>${intro}<div class="section-title">Hooldusprofiilide register</div>${table(['Objekt','Seade','Hooldusliik','Tase','Sagedus','Norm','Staatus','Tegevused'],rows)}<div class="muted">Järgmine samm: hooldusmahu arvutus 30/60/90 päeva lõikes ja meeskonna võimekuse võrdlus.</div></div>`;
  shell(main,'',{wide:true});
  $('#maintenanceProfileSearch')?.addEventListener('input',renderMaintenanceProfiles);
  $('#maintenanceProfileObjectFilter')?.addEventListener('change',renderMaintenanceProfiles);
  $('#maintenanceProfileTypeFilter')?.addEventListener('change',renderMaintenanceProfiles);
  $('#maintenanceProfileActiveFilter')?.addEventListener('change',renderMaintenanceProfiles);
  $('#newMaintenanceProfileBtn')?.addEventListener('click',()=>openMaintenanceProfileModal());
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();normalizeMaintenanceProfiles();save();renderMaintenanceProfiles();});
  $$('[data-edit-maintenance-profile]').forEach(btn=>btn.addEventListener('click',()=>openMaintenanceProfileModal(btn.dataset.editMaintenanceProfile)));
  $$('[data-toggle-maintenance-profile]').forEach(btn=>btn.addEventListener('click',()=>{const p=byId(state.maintenanceProfiles,btn.dataset.toggleMaintenanceProfile); if(p){p.active=p.active===false; save(); renderMaintenanceProfiles();}}));
  $$('[data-delete-maintenance-profile]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.deleteMaintenanceProfile; const p=byId(state.maintenanceProfiles,id); if(!p)return; openConfirm({title:'Kustuta hooldusprofiil?',message:`${deviceLabel(p.deviceId)} · ${p.type} · ${p.level}`,details:'<div class="muted">Kustutamine eemaldab seadme ja normi seose, kuid seadet ega hooldusnormi ei kustuta.</div>',confirmText:'Arhiveeri',onConfirm:()=>{state.maintenanceProfiles=state.maintenanceProfiles.filter(x=>x.id!==id); save(); renderMaintenanceProfiles();}})}));
}
function openMaintenanceProfileModal(id=''){
  normalizeMaintenanceProfiles();
  const p=id?byId(state.maintenanceProfiles,id):{deviceId:'',type:'',level:'',frequency:'Poolaasta',hoursOverride:0,active:true,notes:''};
  const deviceOptions=state.devices.filter(d=>d.status!=='Peidetud'&&d.status!=='Mahakantud').map(d=>`<option value="${esc(d.id)}" ${p.deviceId===d.id?'selected':''}>${esc(objectName(d.objectId))} · ${esc(deviceLabel(d.id))}</option>`).join('');
  const typeOptions=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes])).map(t=>`<option value="${esc(t)}" ${p.type===t?'selected':''}>${esc(t)}</option>`).join('');
  const levelOptions=maintenanceNormLevels.map(l=>`<option value="${esc(l)}" ${p.level===l?'selected':''}>${esc(l)}</option>`).join('');
  const frequencyOptions=maintenanceFrequencies.map(f=>`<option value="${esc(f)}" ${p.frequency===f?'selected':''}>${esc(f)}</option>`).join('');
  const currentNorm=normByTypeLevel(p.type,p.level);
  openModal(`<form id="maintenanceProfileForm"><div class="dialog-head"><h2>${id?'Muuda hooldusprofiili':'Lisa hooldusprofiil'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Seade<select class="select" name="deviceId" required><option value="">Vali seade...</option>${deviceOptions}</select></label><label>Hooldusliik<select class="select" name="type" required><option value="">Vali hooldus...</option>${typeOptions}</select></label><label>Tase<select class="select" name="level" required><option value="">Vali tase...</option>${levelOptions}</select></label><label>Sagedus<select class="select" name="frequency" required>${frequencyOptions}</select></label><label>Normi asendus (h)<input class="field" name="hoursOverride" type="number" min="0" step="0.25" value="${esc(p.hoursOverride||'')}"><span class="muted">Tühjaks/0 = kasuta normi${currentNorm?` (${currentNorm.hours} h)`:''}</span></label><label>Staatus<select class="select" name="active"><option value="true" ${p.active!==false?'selected':''}>Aktiivne</option><option value="false" ${p.active===false?'selected':''}>Peidetud</option></select></label><label class="full">Märkus<textarea name="notes" placeholder="Näiteks ligipääs, erisused või hoolduspiirangud...">${esc(p.notes||'')}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#maintenanceProfileForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const next={id:id||uid('MP'),deviceId:f.deviceId.value,type:f.type.value,level:f.level.value,frequency:f.frequency.value,hoursOverride:Number(f.hoursOverride.value||0),active:f.active.value==='true',notes:f.notes.value||''};
    if(id){Object.assign(p,next)}else{state.maintenanceProfiles.push(next)}
    save(); closeModal(); renderMaintenanceProfiles();
  });
}

function normalizeGranlundClassifiers(){
  normalizeMaintenanceNorms();
  state.granlundClassifiers=Array.isArray(state.granlundClassifiers)?state.granlundClassifiers:[];
  state.granlundClassifiers.forEach(c=>{
    c.id=c.id||uid('GCL');
    c.pattern=c.pattern||'';
    c.type=c.type||'Muu';
    c.level=c.level||'Hooldus';
    c.active=c.active!==false;
    c.exclude=c.exclude===true;
    c.notes=c.notes||'';
  });
}
function classifierNormHours(c){
  const n=normByTypeLevel(c.type,c.level);
  return Number(n?.hours||0);
}
function renderGranlundClassifier(){
  normalizeGranlundClassifiers();
  const q=($('#granlundClassifierSearch')?.value||'').toLowerCase();
  const typeFilter=$('#granlundClassifierTypeFilter')?.value||'all';
  const activeFilter=$('#granlundClassifierActiveFilter')?.value||'active';
  const includeFilter=$('#granlundClassifierIncludeFilter')?.value||'all';
  const list=state.granlundClassifiers.filter(c=>{
    const hay=[c.pattern,c.type,c.level,c.notes,c.exclude?'välista':'arvesta'].join(' ').toLowerCase();
    return (!q||hay.includes(q)) && (typeFilter==='all'||c.type===typeFilter) && (activeFilter==='all'||(activeFilter==='active'?c.active!==false:c.active===false)) && (includeFilter==='all'||(includeFilter==='include'?!c.exclude:c.exclude));
  }).sort((a,b)=>String(a.pattern).localeCompare(String(b.pattern),'et'));
  const types=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes]));
  const activeCount=state.granlundClassifiers.filter(c=>c.active!==false).length;
  const includedCount=state.granlundClassifiers.filter(c=>c.active!==false&&!c.exclude).length;
  const excludedCount=state.granlundClassifiers.filter(c=>c.active!==false&&c.exclude).length;
  const filters=`<input class="field" id="granlundClassifierSearch" placeholder="Otsi Granlundi teksti, liiki või märkust..." value="${esc(q)}"><select class="select" id="granlundClassifierTypeFilter"><option value="all">Kõik hooldusliigid</option>${types.map(t=>`<option value="${esc(t)}" ${typeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select><select class="select" id="granlundClassifierIncludeFilter"><option value="all" ${includeFilter==='all'?'selected':''}>Kõik reeglid</option><option value="include" ${includeFilter==='include'?'selected':''}>Arvesse</option><option value="exclude" ${includeFilter==='exclude'?'selected':''}>Välista</option></select><select class="select" id="granlundClassifierActiveFilter"><option value="active" ${activeFilter==='active'?'selected':''}>Aktiivsed</option><option value="inactive" ${activeFilter==='inactive'?'selected':''}>Peidetud</option><option value="all" ${activeFilter==='all'?'selected':''}>Kõik</option></select>`;
  const actions=`<button class="btn ghost" id="resetDataBtn" type="button">Taasta demo</button><button class="btn primary" id="newGranlundClassifierBtn" type="button">+ Uus reegel</button>`;
  const rows=list.map(c=>{const h=classifierNormHours(c); return `<tr><td><strong>${esc(c.pattern)}</strong></td><td>${esc(c.type)}</td><td>${esc(c.level)}</td><td><strong>${h.toFixed(1)} h</strong><div class="muted">normist</div></td><td><span class="status ${c.exclude?'red':'ok'}">${c.exclude?'Välista':'Arvesse'}</span></td><td><span class="status ${c.active!==false?'ok':'red'}">${c.active!==false?'Aktiivne':'Peidetud'}</span></td><td>${esc(c.notes||'')}</td><td class="nowrap"><button class="btn small ghost" data-edit-granlund-classifier="${esc(c.id)}" type="button">Muuda</button> <button class="btn small ghost" data-toggle-granlund-classifier="${esc(c.id)}" type="button">${c.active!==false?'Peida':'Aktiveeri'}</button> <button class="btn small danger" data-delete-granlund-classifier="${esc(c.id)}" type="button">Kustuta</button></td></tr>`}).join('')||'<tr><td colspan="8" class="muted">Granlundi klassifikaatori reegleid ei leitud.</td></tr>';
  const intro=`<div class="card"><div class="card-top"><h3>Granlund → VECO hooldusnorm</h3><span class="status ok">MVP</span></div><span class="muted">Klassifikaator seob Granlundi raporti töö nimetuse VECO hooldusliigi ja tasemega. Järgmises etapis saab import kasutada neid reegleid töömahu arvutamiseks.</span></div>`;
  const main=header('Granlund klassifikaator',filters,actions,'SEADED')+`<div class="detail-body"><div class="summary-grid">${summaryBox('Reegleid',state.granlundClassifiers.length)}${summaryBox('Aktiivseid',activeCount)}${summaryBox('Arvesse',includedCount)}${summaryBox('Välistatud',excludedCount)}</div>${intro}<div class="section-title">Klassifikaatori reeglid</div>${table(['Granlundi tekst','VECO liik','Tase','Norm','Kasutus','Staatus','Märkus','Tegevused'],rows)}<div class="muted">Näide: "PA hooldus" → Vent TH / Hooldus / 2 h. "ATS" või "Firetek" võib märkida välistatuks, kui need tööd ei kuulu sinu planeeritava ressursi hulka.</div></div>`;
  shell(main,'',{wide:true});
  $('#granlundClassifierSearch')?.addEventListener('input',renderGranlundClassifier);
  $('#granlundClassifierTypeFilter')?.addEventListener('change',renderGranlundClassifier);
  $('#granlundClassifierIncludeFilter')?.addEventListener('change',renderGranlundClassifier);
  $('#granlundClassifierActiveFilter')?.addEventListener('change',renderGranlundClassifier);
  $('#newGranlundClassifierBtn')?.addEventListener('click',()=>openGranlundClassifierModal());
  $('#resetDataBtn')?.addEventListener('click',()=>{state=window.VECO_STORAGE.reset();normalizeGranlundClassifiers();save();renderGranlundClassifier();});
  $$('[data-edit-granlund-classifier]').forEach(btn=>btn.addEventListener('click',()=>openGranlundClassifierModal(btn.dataset.editGranlundClassifier)));
  $$('[data-toggle-granlund-classifier]').forEach(btn=>btn.addEventListener('click',()=>{const c=byId(state.granlundClassifiers,btn.dataset.toggleGranlundClassifier); if(c){c.active=c.active===false; save(); renderGranlundClassifier();}}));
  $$('[data-delete-granlund-classifier]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.deleteGranlundClassifier; const c=byId(state.granlundClassifiers,id); if(!c)return; openConfirm({title:'Kustuta Granlundi reegel?',message:`${c.pattern} → ${c.exclude?'välista':c.type+' / '+c.level}`,details:'<div class="muted">Kustutamine eemaldab klassifikaatori reegli. Raporti import ei kasuta seda vastet enam töömahu arvutamisel.</div>',confirmText:'Arhiveeri',onConfirm:()=>{state.granlundClassifiers=state.granlundClassifiers.filter(x=>x.id!==id); save(); renderGranlundClassifier();}})}));
}
function openGranlundClassifierModal(id=''){
  normalizeGranlundClassifiers();
  const c=id?byId(state.granlundClassifiers,id):{pattern:'',type:'',level:'Hooldus',exclude:false,active:true,notes:''};
  const typeOptions=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes])).map(t=>`<option value="${esc(t)}" ${c.type===t?'selected':''}>${esc(t)}</option>`).join('');
  const levelOptions=maintenanceNormLevels.map(l=>`<option value="${esc(l)}" ${c.level===l?'selected':''}>${esc(l)}</option>`).join('');
  openModal(`<form id="granlundClassifierForm"><div class="dialog-head"><h2>${id?'Muuda Granlundi reeglit':'Lisa Granlundi reegel'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label class="full">Granlundi tekst / otsingusõna<input class="field" name="pattern" required placeholder="Näiteks PA hooldus, filtrite vahetus, RVK kuu test..." value="${esc(c.pattern||'')}"></label><label>VECO hooldusliik<select class="select" name="type"><option value="">Vali liik...</option>${typeOptions}</select></label><label>Tase<select class="select" name="level">${levelOptions}</select></label><label>Kasutus<select class="select" name="exclude"><option value="false" ${!c.exclude?'selected':''}>Arvesse</option><option value="true" ${c.exclude?'selected':''}>Välista</option></select></label><label>Staatus<select class="select" name="active"><option value="true" ${c.active!==false?'selected':''}>Aktiivne</option><option value="false" ${c.active===false?'selected':''}>Peidetud</option></select></label><label class="full">Märkus<textarea name="notes" placeholder="Näiteks allhankija töö, Firetek, käsitsi kontrollitav...">${esc(c.notes||'')}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#granlundClassifierForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const exclude=f.exclude.value==='true';
    const next={id:id||uid('GCL'),pattern:f.pattern.value.trim(),type:exclude?'Muu':f.type.value,level:exclude?'Kontroll':f.level.value,exclude,active:f.active.value==='true',notes:f.notes.value||''};
    if(id){Object.assign(c,next)}else{state.granlundClassifiers.push(next)}
    save(); closeModal(); renderGranlundClassifier();
  });
}


function normalizeUnplannedMaintenance(){
  state.unplannedMaintenance=Array.isArray(state.unplannedMaintenance)?state.unplannedMaintenance:[];
  state.unplannedMaintenance.forEach(r=>{
    r.id=r.id||uid('UM');
    r.status=r.status||'Uus';
    r.object=r.object||'';
    r.objectId=r.objectId||'';
    r.task=r.task||'';
    r.due=r.due||'';
    r.type=r.type||'Vent TH';
    r.level=r.level||'Hooldus';
    const n=normByTypeLevel(r.type,r.level);
    r.hours=Number(r.hours||n?.hours||0);
    r.notes=r.notes||'';
  });
}
const unplannedStatuses=['Uus','Kinnitatud','Planeeritud','Töös','Valmis','Välistatud'];
function unplannedStatusClass(status){
  if(status==='Kinnitatud'||status==='Valmis') return 'ok';
  if(status==='Välistatud') return 'red';
  if(status==='Planeeritud'||status==='Töös') return 'info';
  return 'warn';
}
function unplannedObjectName(r){
  return r.objectId?objectName(r.objectId):(r.object||'');
}
function filteredUnplannedMaintenance(){
  normalizeUnplannedMaintenance();
  const q=($('#unplannedSearch')?.value||'').toLowerCase();
  const status=$('#unplannedStatusFilter')?.value||'all';
  const object=$('#unplannedObjectFilter')?.value||'all';
  const type=$('#unplannedTypeFilter')?.value||'all';
  return state.unplannedMaintenance.filter(r=>{
    const obj=unplannedObjectName(r);
    const hay=[r.status,obj,r.task,r.due,r.type,r.level,r.hours,r.notes].join(' ').toLowerCase();
    return (!q||hay.includes(q)) && (status==='all'||r.status===status) && (object==='all'||r.objectId===object||r.object===object) && (type==='all'||r.type===type);
  }).sort((a,b)=>String(a.due||'9999-99-99').localeCompare(String(b.due||'9999-99-99'))||String(unplannedObjectName(a)).localeCompare(String(unplannedObjectName(b)),'et'));
}
function renderUnplannedMaintenance(){
  normalizeUnplannedMaintenance();
  const list=filteredUnplannedMaintenance();
  const today=new Date(); today.setHours(0,0,0,0);
  const confirmed=state.unplannedMaintenance.filter(x=>x.status==='Kinnitatud');
  const confirmedHours=confirmed.reduce((s,x)=>s+Number(x.hours||0),0);
  const excluded=state.unplannedMaintenance.filter(x=>x.status==='Välistatud').length;
  const overdue=state.unplannedMaintenance.filter(x=>x.status!=='Valmis'&&x.status!=='Välistatud'&&x.due&&new Date(x.due)<today).length;
  const types=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes]));
  const objectOptions=(state.objects||[]).map(o=>`<option value="${esc(o.id)}" ${($('#unplannedObjectFilter')?.value||'all')===o.id?'selected':''}>${esc(o.name)}</option>`).join('');
  const typeOptions=types.map(t=>`<option value="${esc(t)}" ${($('#unplannedTypeFilter')?.value||'all')===t?'selected':''}>${esc(t)}</option>`).join('');
  const statusVal=$('#unplannedStatusFilter')?.value||'all';
  const q=$('#unplannedSearch')?.value||'';
  const filters=`<input class="field" id="unplannedSearch" placeholder="Otsi objekti, tööd, liiki või märkust..." value="${esc(q)}"><select class="select" id="unplannedStatusFilter"><option value="all">Kõik staatused</option>${unplannedStatuses.map(st=>`<option value="${esc(st)}" ${statusVal===st?'selected':''}>${esc(st)}</option>`).join('')}</select><select class="select" id="unplannedObjectFilter"><option value="all">Kõik objektid</option>${objectOptions}</select><select class="select" id="unplannedTypeFilter"><option value="all">Kõik liigid</option>${typeOptions}</select>`;
  const actions='<button class="btn primary" id="newUnplannedBtn" type="button">+ Lisa planeerimata hooldus</button><button class="btn ghost" data-open-granlund-import type="button">Impordi Granlund raport</button>';
  const rows=list.map(r=>`<tr><td><input type="checkbox" data-unplanned-select="${esc(r.id)}" aria-label="Vali ${esc(r.task||'kirje')}"></td><td><span class="status ${unplannedStatusClass(r.status)}">${esc(r.status||'Uus')}</span></td><td>${esc(unplannedObjectName(r))}</td><td><strong>${esc(r.task||'-')}</strong>${r.notes?`<div class="muted">${esc(r.notes)}</div>`:''}</td><td>${esc(r.due||'')}</td><td>${esc(r.type||'')}</td><td>${esc(r.level||'')}</td><td><strong>${Number(r.hours||0).toFixed(1)} h</strong></td><td class="nowrap"><button class="btn small ghost" data-edit-unplanned="${esc(r.id)}" type="button">Muuda</button> <button class="btn small ghost" data-confirm-unplanned="${esc(r.id)}" type="button">Kinnita</button> <button class="btn small danger" data-exclude-unplanned="${esc(r.id)}" type="button">Välista</button></td></tr>`).join('')||'<tr><td colspan="9"><div class="empty-state"><strong>Planeerimata hooldusi ei ole.</strong><div class="muted">Alusta Granlundi raporti importimisest või lisa hooldus käsitsi.</div><div class="toolbar"><button class="btn primary" data-open-granlund-import type="button">Impordi Granlund raport</button><button class="btn ghost" data-open-unplanned-manual type="button">Lisa käsitsi</button></div></div></td></tr>';
  const batch=`<div class="toolbar"><button class="btn small ghost" id="selectAllUnplannedBtn" type="button">Vali kõik nähtavad</button><button class="btn small primary" id="confirmSelectedUnplannedBtn" type="button">✓ Kinnita valitud</button><button class="btn small danger" id="excludeSelectedUnplannedBtn" type="button">✕ Välista valitud</button></div>`;
  const cards=`<div class="summary-grid">${summaryBox('Uusi',state.unplannedMaintenance.filter(x=>x.status==='Uus').length)}${summaryBox('Kinnitatud',confirmed.length)}${summaryBox('Välistatud',excluded)}${summaryBox('Kinnitatud maht',confirmedHours.toFixed(1)+' h')}${summaryBox('Hilinenud',overdue)}</div>`;
  const intro=`<div class="card"><div class="card-top"><h3>Kinnitusring</h3><span class="status ok">MVP</span></div><span class="muted">Granlundist või käsitsi lisatud hooldused tulevad esmalt staatusesse Uus. Kinnitatud kirjed lähevad hiljem hooldusvõimekuse arvutusse, välistatud kirjed jäävad arvestusest välja.</span></div>`;
  const importToolbar=`<div class="toolbar"><button class="btn primary" data-open-granlund-import type="button">Impordi Granlund raport</button><button class="btn ghost" data-open-unplanned-manual type="button">Lisa käsitsi</button></div>`;
  const main=header('Planeerimata hooldused',filters,actions,'TÖÖLAUD')+`<div class="detail-body">${cards}${intro}${importToolbar}${batch}${table(['','Staatus','Objekt','Töö','Tähtaeg','Liik','Tase','Maht','Tegevused'],rows)}</div>`;
  shell(main,'',{wide:true});
  $('#unplannedSearch')?.addEventListener('input',renderUnplannedMaintenance);
  $('#unplannedStatusFilter')?.addEventListener('change',renderUnplannedMaintenance);
  $('#unplannedObjectFilter')?.addEventListener('change',renderUnplannedMaintenance);
  $('#unplannedTypeFilter')?.addEventListener('change',renderUnplannedMaintenance);
  $('#newUnplannedBtn')?.addEventListener('click',()=>openUnplannedMaintenanceModal());
  $$('[data-open-unplanned-manual]').forEach(btn=>btn.addEventListener('click',()=>openUnplannedMaintenanceModal()));
  $$('[data-open-granlund-import]').forEach(btn=>btn.addEventListener('click',()=>openGranlundImportModal()));
  $('#selectAllUnplannedBtn')?.addEventListener('click',()=>{$$('[data-unplanned-select]').forEach(cb=>cb.checked=true);});
  $('#confirmSelectedUnplannedBtn')?.addEventListener('click',()=>updateSelectedUnplannedStatus('Kinnitatud'));
  $('#excludeSelectedUnplannedBtn')?.addEventListener('click',()=>updateSelectedUnplannedStatus('Välistatud'));
  $$('[data-edit-unplanned]').forEach(btn=>btn.addEventListener('click',()=>openUnplannedMaintenanceModal(btn.dataset.editUnplanned)));
  $$('[data-confirm-unplanned]').forEach(btn=>btn.addEventListener('click',()=>{const r=byId(state.unplannedMaintenance,btn.dataset.confirmUnplanned); if(r){r.status='Kinnitatud'; save(); renderUnplannedMaintenance();}}));
  $$('[data-exclude-unplanned]').forEach(btn=>btn.addEventListener('click',()=>{const r=byId(state.unplannedMaintenance,btn.dataset.excludeUnplanned); if(r){r.status='Välistatud'; save(); renderUnplannedMaintenance();}}));
}

let granlundImportPreview=[];
function normalizeImportText(v){return String(v||'').replace(/\s+/g,' ').trim();}
function parseEstonianDate(v){
  if(!v) return '';
  if(v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0,10);
  const s=String(v).trim();
  const iso=s.match(/(20\d{2})[-.\/]([01]?\d)[-.\/]([0-3]?\d)/);
  if(iso) return `${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`;
  const ee=s.match(/([0-3]?\d)[-.\/]([01]?\d)[-.\/](20\d{2})/);
  if(ee) return `${ee[3]}-${ee[2].padStart(2,'0')}-${ee[1].padStart(2,'0')}`;
  return '';
}
function objectFromGranlundText(text){
  const row=normalizeImportText(text).toLowerCase();
  const objects=(state.objects||[]).filter(o=>o.name).sort((a,b)=>String(b.name).length-String(a.name).length);
  const found=objects.find(o=>row.includes(String(o.name||'').toLowerCase()));
  return found||null;
}
function classifyGranlundTask(task,serviceArea=''){
  normalizeGranlundClassifiers();
  const hay=normalizeImportText(`${task} ${serviceArea}`).toLowerCase();
  const rules=(state.granlundClassifiers||[]).filter(c=>c.active!==false&&c.pattern).sort((a,b)=>String(b.pattern).length-String(a.pattern).length);
  const rule=rules.find(c=>hay.includes(String(c.pattern).toLowerCase()));
  if(!rule) return {type:'Muu',level:'Hooldus',hours:0,exclude:false,rule:null,matched:false};
  const norm=rule.exclude?null:normByTypeLevel(rule.type,rule.level);
  return {type:rule.type||'Muu',level:rule.level||'Hooldus',hours:Number(norm?.hours||0),exclude:!!rule.exclude,rule,matched:true};
}
function granlundImportKey(row){
  return [row.objectId||row.object||'',row.task||'',row.due||''].map(x=>String(x).trim().toLowerCase()).join('|');
}
function makeGranlundPreviewRow({objectId='',object='',task='',due='',serviceArea='',raw=''}){
  const obj=objectId?byId(state.objects,objectId):objectFromGranlundText(`${object} ${raw}`);
  const cls=classifyGranlundTask(task||raw,serviceArea||raw);
  const taskText=normalizeImportText(task||raw);
  const existing=(state.unplannedMaintenance||[]).find(x=>granlundImportKey(x)===granlundImportKey({objectId:obj?.id||'',object:obj?.name||object,task:taskText,due}));
  return {id:uid('GIMP'),objectId:obj?.id||'',object:obj?.name||object||'',task:taskText,due,serviceArea,raw, type:cls.type, level:cls.level, hours:cls.hours, status:cls.exclude?'Välistatud':'Uus', exclude:cls.exclude, matched:cls.matched, rulePattern:cls.rule?.pattern||'', duplicate:!!existing};
}
function parseGranlundRowsFromText(text){
  const lines=String(text||'').split(/\r?\n/).map(normalizeImportText).filter(Boolean);
  const out=[];
  for(const line of lines){
    if(/Tööpakett\s+Töö\s+Teeninduspiirkond/i.test(line) || /^Granlund Manager/i.test(line)) continue;
    const due=parseEstonianDate(line);
    if(!due) continue;
    const obj=objectFromGranlundText(line);
    let task=line.replace(/\b\d{1,2}[.\/]\d{1,2}[.\/]20\d{2}\b/g,' ').replace(/\b20\d{2}[-\/]\d{1,2}[-\/]\d{1,2}\b/g,' ');
    if(obj) task=task.replace(new RegExp(String(obj.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),' ');
    task=normalizeImportText(task);
    if(task.length<4) continue;
    out.push(makeGranlundPreviewRow({objectId:obj?.id||'',object:obj?.name||'',task,due,raw:line}));
  }
  return out;
}
function parseGranlundRowsFromMatrix(rows){
  const data=(rows||[]).filter(r=>Array.isArray(r)&&r.some(c=>String(c??'').trim()));
  if(!data.length) return [];
  const headerIdx=data.findIndex(r=>r.some(c=>/Tööpakett/i.test(String(c)))&&r.some(c=>/Tähtaeg/i.test(String(c))));
  const header=headerIdx>=0?data[headerIdx].map(c=>String(c||'').trim()):[];
  const idx=(pattern)=>header.findIndex(h=>pattern.test(h));
  const taskI=idx(/^Töö$/i);
  const dueI=idx(/Tähtaeg/i);
  const objectI=idx(/Objekt/i);
  const serviceI=idx(/Teeninduspiirkond/i);
  const body=data.slice(headerIdx>=0?headerIdx+1:0);
  const out=[];
  for(const r of body){
    let due=dueI>=0?parseEstonianDate(r[dueI]):'';
    if(!due){
      const dcell=r.find(c=>parseEstonianDate(c));
      due=parseEstonianDate(dcell);
    }
    if(!due) continue;
    const raw=r.map(c=>String(c??'').trim()).filter(Boolean).join(' ');
    const object=objectI>=0?String(r[objectI]||'').trim():'';
    const obj=object?objectFromGranlundText(object)||objectFromGranlundText(raw):objectFromGranlundText(raw);
    let task=taskI>=0?String(r[taskI]||'').trim():'';
    if(!task){
      const candidates=r.map(c=>String(c??'').trim()).filter(x=>x && !parseEstonianDate(x) && (!obj || x!==obj.name));
      task=candidates.sort((a,b)=>b.length-a.length)[0]||raw;
    }
    const serviceArea=serviceI>=0?String(r[serviceI]||'').trim():'';
    out.push(makeGranlundPreviewRow({objectId:obj?.id||'',object:obj?.name||object,task,due,serviceArea,raw}));
  }
  return out;
}
function renderGranlundImportPreview(){
  const box=$('#granlundImportPreview');
  const importBtn=$('#granlundImportApplyBtn');
  if(!box) return;
  if(!granlundImportPreview.length){
    box.innerHTML='<div class="muted">Eelvaadet pole. Vali fail või kleebi Granlundi raporti tekst ja vajuta "Analüüsi".</div>';
    if(importBtn) importBtn.disabled=true;
    return;
  }
  if(importBtn) importBtn.disabled=false;
  const addCount=granlundImportPreview.filter(x=>!x.duplicate).length;
  const excl=granlundImportPreview.filter(x=>x.status==='Välistatud').length;
  const dup=granlundImportPreview.filter(x=>x.duplicate).length;
  const hours=granlundImportPreview.filter(x=>!x.duplicate&&x.status!=='Välistatud').reduce((s,x)=>s+Number(x.hours||0),0);
  const rows=granlundImportPreview.slice(0,80).map(r=>`<tr><td><span class="status ${r.duplicate?'warn':(r.status==='Välistatud'?'red':'ok')}">${r.duplicate?'Duplikaat':esc(r.status)}</span></td><td>${esc(r.object||'-')}</td><td><strong>${esc(r.task)}</strong><div class="muted">${r.rulePattern?`reegel: ${esc(r.rulePattern)}`:(r.matched?'':'reeglit ei leitud')}</div></td><td>${esc(r.due)}</td><td>${esc(r.type)}</td><td>${esc(r.level)}</td><td><strong>${Number(r.hours||0).toFixed(1)} h</strong></td></tr>`).join('');
  box.innerHTML=`<div class="summary-grid">${summaryBox('Lisatavaid',addCount)}${summaryBox('Välistatud',excl)}${summaryBox('Duplikaate',dup)}${summaryBox('Maht',hours.toFixed(1)+' h')}</div>${table(['Staatus','Objekt','Töö','Tähtaeg','Liik','Tase','Maht'],rows)}`;
}
async function readGranlundImportFile(file){
  if(!file) return '';
  const name=String(file.name||'').toLowerCase();
  if(name.endsWith('.xlsx')||name.endsWith('.xls')){
    if(!window.XLSX) throw new Error('XLSX parser ei ole laaditud. Kontrolli internetiühendust või kleebi raporti tekst käsitsi.');
    const buf=await file.arrayBuffer();
    const wb=window.XLSX.read(buf,{type:'array',cellDates:true});
    const rows=[];
    wb.SheetNames.forEach(sn=>rows.push(...window.XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:''})));
    granlundImportPreview=parseGranlundRowsFromMatrix(rows);
    return 'xlsx';
  }
  const text=await file.text();
  granlundImportPreview=parseGranlundRowsFromText(text);
  return 'text';
}
function applyGranlundImportPreview(){
  let added=0,updated=0,skipped=0;
  granlundImportPreview.forEach(r=>{
    const key=granlundImportKey(r);
    const existing=(state.unplannedMaintenance||[]).find(x=>granlundImportKey(x)===key);
    if(existing){Object.assign(existing,{type:r.type,level:r.level,hours:r.hours,status:existing.status||r.status,source:'Granlund',raw:r.raw||existing.raw||''}); updated++; return;}
    state.unplannedMaintenance.push({id:uid('UM'),source:'Granlund',objectId:r.objectId,object:r.object,task:r.task,due:r.due,type:r.type,level:r.level,hours:Number(r.hours||0),status:r.status||'Uus',notes:r.rulePattern?`Imporditud Granlundist. Reegel: ${r.rulePattern}`:'Imporditud Granlundist. Klassifikaatori vastet ei leitud.',raw:r.raw||''}); added++;
  });
  save();
  const msg=`Lisatud ${added}, uuendatud ${updated}, vahele jäetud ${skipped}.`;
  closeModal();
  renderUnplannedMaintenance();
  setTimeout(()=>alert(msg),50);
}
function openGranlundImportModal(){
  granlundImportPreview=[];
  openModal(`<div><div class="dialog-head"><h2>Impordi Granlund raport</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="card"><div class="card-top"><h3>Import v1</h3><span class="status ok">Eelvaade</span></div><span class="muted">XLSX import töötab brauseris SheetJS parseriga. PDF-i puhul kasuta esialgu raporti teksti kopeerimist/kleepimist, sest PDF-ist teksti lugemine brauseris ei ole veel täielik.</span></div><div class="form-grid"><label class="full">Raporti fail<input class="field" id="granlundImportFile" type="file" accept=".xlsx,.xls,.csv,.tsv,.txt,.pdf"></label><label class="full">Või kleebi raporti tekst<textarea id="granlundImportText" placeholder="Kleebi siia Granlund raporti read..." style="min-height:140px"></textarea></label></div><div class="toolbar"><button class="btn ghost" id="granlundImportAnalyzeBtn" type="button">Analüüsi</button></div><div id="granlundImportPreview" class="section-title"></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" id="granlundImportApplyBtn" type="button" disabled>Lisa planeerimata hooldustesse</button></div></div>`);
  renderGranlundImportPreview();
  $('#granlundImportAnalyzeBtn')?.addEventListener('click',async()=>{
    try{
      const file=$('#granlundImportFile')?.files?.[0];
      const pasted=$('#granlundImportText')?.value||'';
      if(file) await readGranlundImportFile(file); else granlundImportPreview=parseGranlundRowsFromText(pasted);
      renderGranlundImportPreview();
    }catch(err){ alert(err?.message||String(err)); }
  });
  $('#granlundImportApplyBtn')?.addEventListener('click',applyGranlundImportPreview);
}

function selectedUnplannedIds(){return $$('[data-unplanned-select]:checked').map(cb=>cb.dataset.unplannedSelect).filter(Boolean);}
function updateSelectedUnplannedStatus(status){
  const ids=selectedUnplannedIds();
  if(!ids.length){showSyncNotice('Vali vähemalt üks rida'); return;}
  state.unplannedMaintenance.forEach(r=>{if(ids.includes(r.id)) r.status=status;});
  save(); renderUnplannedMaintenance();
}
function openUnplannedMaintenanceModal(id=''){
  normalizeUnplannedMaintenance();
  const r=id?byId(state.unplannedMaintenance,id):{status:'Uus',objectId:'',object:'',task:'',due:'',type:'Vent TH',level:'Hooldus',hours:0,notes:''};
  const objectOptions=(state.objects||[]).map(o=>`<option value="${esc(o.id)}" ${r.objectId===o.id?'selected':''}>${esc(o.name)}</option>`).join('');
  const types=Array.from(new Set([...(state.maintenanceNorms||[]).map(n=>n.type).filter(Boolean),...maintenanceNormTypes]));
  const typeOptions=types.map(t=>`<option value="${esc(t)}" ${r.type===t?'selected':''}>${esc(t)}</option>`).join('');
  const levelOptions=maintenanceNormLevels.map(l=>`<option value="${esc(l)}" ${r.level===l?'selected':''}>${esc(l)}</option>`).join('');
  const statusOptions=unplannedStatuses.map(st=>`<option value="${esc(st)}" ${r.status===st?'selected':''}>${esc(st)}</option>`).join('');
  const norm=normByTypeLevel(r.type,r.level);
  openModal(`<form id="unplannedMaintenanceForm"><div class="dialog-head"><h2>${id?'Muuda planeerimata hooldust':'Lisa planeerimata hooldus'}</h2><button type="button" class="btn ghost" id="modalCloseBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">× Sulge</button></div><div class="detail-body"><div class="form-grid"><label>Staatus<select class="select" name="status">${statusOptions}</select></label><label>Objekt<select class="select" name="objectId"><option value="">Vali objekt...</option>${objectOptions}</select></label><label class="full">Töö<input class="field" name="task" required placeholder="Näiteks Ventilatsioonisüsteemi aastahooldus" value="${esc(r.task||'')}"></label><label>Tähtaeg<input class="field" name="due" type="date" value="${esc(r.due||'')}"></label><label>Liik<select class="select" name="type">${typeOptions}</select></label><label>Tase<select class="select" name="level">${levelOptions}</select></label><label>Maht (h)<input class="field" name="hours" type="number" min="0" step="0.25" value="${esc(r.hours||norm?.hours||0)}"><span class="muted">Vaikimisi normist${norm?` (${norm.hours} h)`:''}</span></label><label class="full">Märkus<textarea name="notes" placeholder="Allikas, täpsustus, Granlundi viide vms...">${esc(r.notes||'')}</textarea></label></div></div><div class="dialog-actions"><button type="button" class="btn ghost" id="cancelModalBtn" onclick="window.vecoCloseModal&&window.vecoCloseModal();return false;">Tühista</button><button class="btn primary" type="submit">Salvesta</button></div></form>`);
  bindClose();
  $('#unplannedMaintenanceForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=e.currentTarget.elements;
    const obj=byId(state.objects,f.objectId.value);
    const n=normByTypeLevel(f.type.value,f.level.value);
    const next={id:id||uid('UM'),status:f.status.value,objectId:f.objectId.value,object:obj?.name||r.object||'',task:f.task.value.trim(),due:f.due.value,type:f.type.value,level:f.level.value,hours:Number(f.hours.value||n?.hours||0),notes:f.notes.value||''};
    if(id){Object.assign(r,next)}else{state.unplannedMaintenance.push(next)}
    save(); closeModal(); renderUnplannedMaintenance();
  });
}

function workorderStatusCounts(){
  const counts={};
  workorderStatusOptions.forEach(st=>counts[st]=0);
  (state.workorders||[]).forEach(w=>{
    const st=String(w.status||'Määramata').trim()||'Määramata';
    counts[st]=(counts[st]||0)+1;
  });
  return counts;
}
function renderDiagnostics(){
  const woStatusCounts=workorderStatusCounts();
  const statusRows=Object.entries(woStatusCounts).map(([k,v])=>`<tr><td><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join('');
  const orphans=orphanWorkorders();
  const orphanRows=orphans.slice(0,60).map(w=>`<tr><td><strong>${esc(w.id||'-')}</strong></td><td>${esc(w.title||'-')}</td><td>${esc(w.objectId||'-')}</td><td>${esc(fmtActDate(w.date))} ${esc(w.time||'')}</td><td>${esc(workorderAssigneeLabel(w))}</td></tr>`).join('')||'<tr><td colspan="5" class="muted">Orvuks jäänud töid ei leitud.</td></tr>';
  const rows=[
    ['Versioon',APP_VERSION],
    ['Build',APP_BUILD],
    ['Build nr kopeerimiseks',`VECO_V3_${APP_BUILD}`],
    ['Keskkond',location.hostname.includes('github.io')?'GitHub Pages / production':'local / preview'],
    ['Leht',pageTitles[page]||page],
    ['Andmerežiim',window.VECO_API?.modeLabel?.()||'lokaalne'],
    ['Kliente aktiivseid',activeClients().length],
    ['Kliente arhiivis',state.clients.filter(c=>isArchivedRecord(c)).length],
    ['Objekte aktiivseid',activeObjects().length],
    ['Objekte arhiivis',state.objects.filter(o=>isArchivedRecord(o)||isArchivedRecord(byId(state.clients,o.clientId))).length],
    ['Töid',state.workorders.length],
    ['Orvuks jäänud töid',orphans.length],
    ['Akte',state.acts.length],
    ['Tehnikuid',state.people.length],
    ['Puudumisi',state.absences.length],
    ['Valvekirjeid',state.oncall.length],
    ['Hooldusnorme',state.maintenanceNorms.length],
    ['Seadmeid',state.devices.length],
    ['Hooldusprofiile',(state.maintenanceProfiles||[]).length],
    ['Granlundi klassifikaatoreid',(state.granlundClassifiers||[]).length],
    ['Planeerimata hooldusi',(state.unplannedMaintenance||[]).length],
    ['Masterdata sync viga',localStorage.getItem('veco_v3_last_masterdata_sync_error')||'-']
  ].map(([k,v])=>`<tr><td><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join('');
  const buildCard=`<div class="diagnostics-build-card"><span class="muted">Hetkel laaditud build</span><strong>VECO_V3_${esc(APP_BUILD)}</strong><code>${esc(location.href)}</code></div>`;
  const main=header('Diagnostika','','','ARENDUS')+`<div class="detail-body">${buildCard}<div class="section-title">Tööde staatused</div>${table(['Staatus','Arv'],statusRows)}<div class="section-title">Orvuks jäänud tööd</div><div class="muted">Need on tööd, mille object_id ei leia vastet objektide tabelist. Kalendris kuvatakse need hoiatusega, et andmeviga oleks nähtav.</div>${table(['WO','Töö','Puuduv objekt','Aeg','Vastutaja'],orphanRows)}<div class="section-title">Üldinfo</div>${table(['Parameeter','Väärtus'],rows)}</div>`;
  shell(main,'',{wide:true});
}


function calendarCurrentViewSignature(data=state){
  try{
    const storedDate=localStorage.getItem('veco_calendar_week')||weekStartKeyFrom('');
    const mode=$('#calendarViewMode')?.value||localStorage.getItem('veco_calendar_view')||'week';
    const hideWeekend=(localStorage.getItem('veco_calendar_hide_weekend')||'false')==='true';
    const statusFilter=$('#calendarStatusFilter')?.value||'all';
    const scopedId=scopedPersonId();
    const techFilter=scopedId?[scopedId]:employeeFilterSelected('calendar');
    const visibleDays=calendarVisibleDays(storedDate,mode,hideWeekend);
    const workorderOccursOnDate=(w,date)=>{
      const start=w.date;
      const end=w.endDate||w.end_date||w.date;
      return !!start && date>=start && date<=end;
    };
    const dateInView=(w)=>{
      if(mode==='year') return w.date && w.date.startsWith(String(parseDateKey(storedDate).getFullYear())+'-');
      return visibleDays.some(date=>workorderOccursOnDate(w,date));
    };
    const rows=(data?.workorders||[])
      .filter(w=>dateInView(w) && employeeFilterMatchesWorkorder(w,techFilter) && (statusFilter==='all'||statusFilter==='open'||w.status===statusFilter))
      .map(w=>[
        w.id,w.status,w.date,w.endDate||w.end_date||'',w.time,w.title,w.technicianId||'',w.responsibleTechnicianId||'',
        Array.isArray(w.participantTechnicianIds)?w.participantTechnicianIds.join(','):'',
        w.objectId||'',w.projectId||'',w.plannedHours||w.durationHours||w.hours||'',w.completedAt||'',w.completedBy||'',w.completionComment||''
      ])
      .sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
    const abs=(data?.absences||[]).filter(a=>visibleDays.some(d=>d>=a.start&&d<=a.end)).map(a=>[a.id,a.personId,a.userName,a.type,a.start,a.end,a.note]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
    const oc=(data?.oncall||[]).filter(o=>visibleDays.some(d=>d>=o.start&&d<=o.end)).map(o=>[o.id,o.personId,o.userName,o.start,o.end,o.note]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
    return JSON.stringify({storedDate,mode,hideWeekend,statusFilter,techFilter,visibleDays,rows,abs,oc});
  }catch(e){
    return `calendar-sig-error-${Date.now()}`;
  }
}


// CR-RENDER-001: lightweight render diagnostics. Enable with localStorage.veco_render_debug = '1'.
let __vecoRenderSeq=0;
function renderDebug(reason, fn){
  const seq=++__vecoRenderSeq;
  const debug=localStorage.getItem('veco_render_debug')==='1';
  const start=performance.now();
  if(debug) console.log(`[VECO render #${seq}] start`, reason||'unknown');
  const result=fn();
  if(debug) console.log(`[VECO render #${seq}] end`, reason||'unknown', `${Math.round(performance.now()-start)}ms`);
  return result;
}

function renderCurrentPage(reason='renderCurrentPage'){
  if(!requireAuthOrRender()) return;
  return renderDebug(reason,()=>({calendar:renderCalendar,activities:renderActivities,team:renderTeam,mobile:renderMobile,technicianV1:renderTechnicianV1,clients:renderClients,objects:renderObjects,projects:renderProjects,workorders:renderWorkorders,callouts:renderCallouts,people:renderPeople,acts:renderActs,oncall:renderOncall,vacations:renderVacations,ticker:renderTicker,maintenanceNorms:renderMaintenanceNorms,devices:renderDevices,maintenanceProfiles:renderMaintenanceProfiles,granlundClassifier:renderGranlundClassifier,unplannedMaintenance:renderUnplannedMaintenance,mobilePreview:renderMobilePreview,demo:renderDemo,diagnostics:renderDiagnostics}[page]||renderCalendar)());
}
function selectInitialIdsFromState(){
  selectedObjectId=state.objects?.[0]?.id||selectedObjectId||'';
  selectedClientId=state.clients?.[0]?.id||selectedClientId||'';
  selectedProjectId=state.projects?.[0]?.id||selectedProjectId||'';
  selectedWorkorderId=state.workorders?.[0]?.id||selectedWorkorderId||'';
  selectedActId=state.acts?.[0]?.id||selectedActId||'';
}
function applyBackgroundState(nextState,reason='background-sync'){
  const previousState=state;
  const beforeCalendarSig=page==='calendar'?calendarCurrentViewSignature(state):'';
  nextState=normalizeStateArrays(nextState||{});
  // Keep the latest remote state in local cache so the next F5 starts from the
  // already-hydrated state, not from an older/stale cache. This is the main
  // anti-rollback guard for refresh flicker.
  try{ window.VECO_STORAGE.save(nextState); }catch(err){ console.warn('VECO background cache save failed',err); }
  state=nextState;
  localStateSnapshot=localStateSignature(state);
  selectInitialIdsFromState();
  if(window.__VECO_CALENDAR_RESIZING__){ showSyncNotice('Uuendus ootel'); return; }
  if(page==='calendar'){
    const afterCalendarSig=calendarCurrentViewSignature(state);
    if(beforeCalendarSig===afterCalendarSig){ saveBootHtmlSnapshot(); return; }
    if(patchCalendarFromRemote(previousState,state)){ showSyncNotice('Andmed uuendatud taustal'); saveBootHtmlSnapshot(); return; }
    // During initial background hydration, avoid a hard calendar rebuild over a
    // visible cache unless there is no usable calendar DOM. This matches Google
    // Calendar style stale-while-revalidate: cache stays visible, remote state is
    // persisted, and the next explicit view/action uses the fresh data.
    if(String(reason||'').includes('bootstrap') && document.querySelector('.calendar-planner-grid')){
      showSyncNotice('Andmed uuendatud taustal');
      saveBootHtmlSnapshot();
      return;
    }
  }
  renderCurrentPageWhenIdle(reason);
  showSyncNotice('Andmed uuendatud taustal');
}
async function bootstrapApp(){
  bindLocalPeerSync();
  if(window.VECO_API?.mode?.()==='supabase'){
    // CR-STATE-001: optimistic/offline-first bootstrap. Render the cached state immediately
    // and let Supabase refresh in the background. This avoids the F5 blank/loading flash.
    try{
      state=window.VECO_STORAGE.load();
      selectInitialIdsFromState();
      renderCurrentPage('bootstrap-local-cache');
      setTimeout(()=>VECO_LOADING?.hide?.({force:true}),420);
    }catch(err){
      console.warn('VECO local bootstrap failed',err);
      renderCurrentPage('bootstrap-local-cache-fallback');
      setTimeout(()=>VECO_LOADING?.hide?.({force:true}),420);
    }
    (async()=>{
      try{
        const remoteState=await window.VECO_API.load();
        await authLoadRemoteIntoLocal();
        applyBackgroundState(remoteState,'bootstrap-background-sync');
        const onRemoteWorkorders=(merged,meta={})=>{
          applyBackgroundState(merged,meta.source==='polling'?'polling-background-sync':'realtime-background-sync');
        };
        const realtimeStarted=window.VECO_API.startWorkorderRealtime?.(onRemoteWorkorders,(status)=>{
          if(status==='SUBSCRIBED') showSyncNotice('Realtime ühendus aktiivne');
        });
        if(!realtimeStarted) window.VECO_API.startWorkorderPolling?.(onRemoteWorkorders);
      }catch(err){
        console.warn('VECO bootstrap Supabase background load failed',err);
        showSyncNotice('Taustasünk ebaõnnestus');
      }
    })();
  }else{
    renderCurrentPage('bootstrap-local');
    setTimeout(()=>VECO_LOADING?.hide?.({force:true}),420);
  }
}
bootstrapApp();


function archiveAct(actId){
  const a=byId(state.acts,actId);
  if(!a) return;
  a.archived=true;
  a.archivedAt=new Date().toISOString();
  if(a.status!=='Arhiveeritud') a.previousStatus=a.status;
  a.status='Arhiveeritud';
  if(selectedActId===actId) detailOpen.acts=false;
  save();
}
function restoreAct(actId){
  const a=byId(state.acts,actId);
  if(!a) return;
  a.archived=false;
  a.restoredAt=new Date().toISOString();
  a.status=a.previousStatus&&a.previousStatus!=='Arhiveeritud'?a.previousStatus:'Mustand';
  delete a.previousStatus;
  selectedActId=actId;
  detailOpen.acts=true;
  save();
}
function deleteActPermanently(actId){
  const a=byId(state.acts,actId);
  if(!a || !a.archived) return;
  if(!confirm('Kas kustutada arhiveeritud akt lõplikult? Seda tegevust ei saa tagasi võtta.')) return;
  state.acts=state.acts.filter(x=>x.id!==actId);
  if(selectedActId===actId){ selectedActId=''; detailOpen.acts=false; }
  save();
}
function activeActs(){ return (state.acts||[]).filter(a=>!a.archived); }
function archivedActs(){ return (state.acts||[]).filter(a=>a.archived); }

// Build 20260612_1049

// Build 20260612_1243
