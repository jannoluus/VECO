(function(){
  'use strict';

  const REFRESH_MS=5*60*1000;
  const $=id=>document.getElementById(id);
  const els={
    status:$('oncallStatus'),
    name:$('oncallName'),
    period:$('oncallPeriod'),
    periodDetail:$('oncallPeriodDetail'),
    rotation:$('rotationLine'),
    note:$('rotationNote'),
    updated:$('oncallUpdated')
  };

  function cleanUrl(value){
    return String(value||'').trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
  }
  function client(){
    const url=cleanUrl(window.VECO_SUPABASE_URL);
    const key=String(window.VECO_SUPABASE_KEY||'').trim();
    if(!url||!key||!window.supabase) return null;
    return window.supabase.createClient(url,key);
  }
  function localDateKey(date=new Date()){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,'0');
    const d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function formatDate(value){
    if(!value) return '';
    const parts=String(value).slice(0,10).split('-');
    if(parts.length!==3) return String(value);
    return `${parts[2]}.${parts[1]}`;
  }
  function formatPeriod(row){
    if(!row) return '';
    return `${formatDate(row.start_date)} – ${formatDate(row.end_date)}`;
  }
  function formatPeriodDetail(row){
    if(!row) return '';
    return `Alates ${formatDate(row.start_date)} kell 08:00 kuni ${formatDate(row.end_date)} kell 08:00`;
  }
  function normalizeName(name){
    return String(name||'').trim();
  }
  function setState(kind,title,name,period){
    els.status.className=`public-oncall__status${kind?` ${kind}`:''}`;
    els.status.textContent=title;
    els.name.textContent=name||'—';
    els.period.textContent=period||'';
    els.periodDetail.textContent='';
  }
  function uniqueByName(rows){
    const seen=new Set();
    return rows.filter(row=>{
      const key=normalizeName(row.user_name).toLocaleLowerCase('et');
      if(!key||seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function deriveRotation(shifts,people){
    const configured=(people||[])
      .filter(p=>p.active!==false&&p.on_call_active===true&&normalizeName(p.full_name))
      .sort((a,b)=>(Number(a.on_call_order)||9999)-(Number(b.on_call_order)||9999)||normalizeName(a.full_name).localeCompare(normalizeName(b.full_name),'et'))
      .map(p=>({user_id:p.id,user_name:normalizeName(p.full_name)}));
    if(configured.length) return configured;
    return uniqueByName(shifts.slice().sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date))));
  }
  function renderRotation(rotation,active){
    els.rotation.innerHTML='';
    if(!rotation.length){
      els.note.textContent='Valve rotatsioon ei ole määratud.';
      return;
    }
    const activeId=String(active?.user_id||'');
    const activeName=normalizeName(active?.user_name).toLocaleLowerCase('et');
    rotation.forEach((person,index)=>{
      const name=normalizeName(person.user_name);
      const isActive=(activeId&&String(person.user_id||'')===activeId)||(!activeId&&name.toLocaleLowerCase('et')===activeName);
      const item=document.createElement('span');
      item.className=`rotation-person${isActive?' is-active':''}`;
      item.setAttribute('role','listitem');
      item.textContent=name;
      els.rotation.appendChild(item);
      if(index<rotation.length-1){
        const arrow=document.createElement('span');
        arrow.className='rotation-arrow';
        arrow.setAttribute('aria-hidden','true');
        arrow.textContent='→';
        els.rotation.appendChild(arrow);
      }
    });
    els.note.textContent='';
    const activeEl=els.rotation.querySelector('.is-active');
    if(activeEl) activeEl.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  }
  async function load(){
    const supabaseClient=client();
    if(!supabaseClient){
      setState('is-error','Ühendus puudub','Valveinfo pole saadaval','');
      els.note.textContent='Supabase seadistus puudub.';
      return;
    }
    try{
      const [shiftResult,peopleResult]=await Promise.all([
        supabaseClient.from('oncall_assignments').select('id,user_id,user_name,start_date,end_date,note').order('start_date',{ascending:true}),
        supabaseClient.from('auth_users').select('id,full_name,active,on_call_active,on_call_order').eq('on_call_active',true).order('on_call_order',{ascending:true})
      ]);
      if(shiftResult.error) throw shiftResult.error;
      const shifts=(shiftResult.data||[]).filter(r=>r.start_date&&r.end_date&&normalizeName(r.user_name));
      const people=peopleResult.error?[]:(peopleResult.data||[]);
      const today=localDateKey();
      const active=shifts.filter(r=>r.start_date<=today&&r.end_date>=today);
      const rotation=deriveRotation(shifts,people);

      if(active.length===1){
        setState('is-active','Praegu valves',normalizeName(active[0].user_name),formatPeriod(active[0]));
        els.periodDetail.textContent=formatPeriodDetail(active[0]);
        renderRotation(rotation,active[0]);
      }else if(active.length>1){
        setState('is-error','Valvegraafikus on kattuvus',active.map(r=>normalizeName(r.user_name)).join(' / '),active.map(formatPeriod).join(' · '));
        renderRotation(rotation,active[0]);
        els.periodDetail.textContent='';
        els.note.textContent='Kontrolli kattuvaid valveperioode admini vaates.';
      }else{
        const next=shifts.find(r=>r.start_date>today);
        setState('', 'Praegu pole valvet määratud', next?`Järgmine: ${normalizeName(next.user_name)}`:'—', next?formatPeriod(next):'');
        els.periodDetail.textContent=next?formatPeriodDetail(next):'';
        renderRotation(rotation,null);
      }
      els.updated.textContent=`Uuendatud ${new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
    }catch(err){
      console.error('VECO public on-call load failed',err);
      setState('is-error','Valveinfo laadimine ebaõnnestus','Proovi hetke pärast uuesti','');
      els.note.textContent='Andmeid ei muudetud.';
    }
  }

  load();
  setInterval(load,REFRESH_MS);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) load();});
})();
