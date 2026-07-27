(function(){
  'use strict';

  const REFRESH_MS=5*60*1000;
  const $=id=>document.getElementById(id);
  const els={rows:$('oncallRows'),note:$('oncallNote'),updated:$('oncallUpdated')};

  function cleanUrl(value){return String(value||'').trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');}
  function client(){
    const url=cleanUrl(window.VECO_SUPABASE_URL);
    const key=String(window.VECO_SUPABASE_KEY||'').trim();
    if(!url||!key||!window.supabase) return null;
    return window.supabase.createClient(url,key);
  }
  function normalizeName(name){return String(name||'').trim();}
  function localDateKey(date=new Date()){
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,'0');
    const d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function parseDate(value){
    const [y,m,d]=String(value||'').slice(0,10).split('-').map(Number);
    return new Date(Date.UTC(y,m-1,d));
  }
  function dateKey(date){return date.toISOString().slice(0,10);}
  function addDays(value,days){const d=parseDate(value);d.setUTCDate(d.getUTCDate()+days);return dateKey(d);}
  function inclusiveDays(start,end){return Math.round((parseDate(end)-parseDate(start))/86400000)+1;}
  function formatDate(value){
    if(!value) return '';
    const parts=String(value).slice(0,10).split('-');
    return parts.length===3?`${parts[2]}.${parts[1]}`:String(value);
  }
  function formatPeriod(row){return `${formatDate(row.start_date)} – ${formatDate(row.end_date)}`;}
  function isoWeek(value){
    const date=parseDate(value);
    const day=date.getUTCDay()||7;
    date.setUTCDate(date.getUTCDate()+4-day);
    const yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date-yearStart)/86400000)+1)/7);
  }
  function uniqueByName(rows){
    const seen=new Set();
    return rows.filter(row=>{
      const key=normalizeName(row.user_name).toLocaleLowerCase('et');
      if(!key||seen.has(key)) return false;
      seen.add(key);return true;
    });
  }
  function deriveRotation(shifts,people){
    const configured=(people||[])
      .filter(p=>p.active!==false&&p.on_call_active===true&&normalizeName(p.full_name))
      .sort((a,b)=>(Number(a.on_call_order)||9999)-(Number(b.on_call_order)||9999)||normalizeName(a.full_name).localeCompare(normalizeName(b.full_name),'et'))
      .map(p=>({user_id:p.id,user_name:normalizeName(p.full_name)}));
    return configured.length?configured:uniqueByName(shifts.slice().sort((a,b)=>String(a.start_date).localeCompare(String(b.start_date))));
  }
  function samePerson(a,b){
    if(a?.user_id&&b?.user_id) return String(a.user_id)===String(b.user_id);
    return normalizeName(a?.user_name).toLocaleLowerCase('et')===normalizeName(b?.user_name).toLocaleLowerCase('et');
  }
  function rotateFrom(rotation,person){
    const index=rotation.findIndex(item=>samePerson(item,person));
    return index>0?rotation.slice(index).concat(rotation.slice(0,index)):rotation.slice();
  }
  function buildCycle(rotation,shifts,anchor){
    const ordered=rotateFrom(rotation,anchor);
    if(!ordered.length) return [];
    const duration=anchor?.start_date&&anchor?.end_date?Math.max(1,inclusiveDays(anchor.start_date,anchor.end_date)):7;
    let cursor=anchor?.start_date||localDateKey();
    return ordered.map((person,index)=>{
      let match=null;
      if(index===0&&anchor&&samePerson(person,anchor)) match=anchor;
      if(!match){
        match=shifts.find(row=>samePerson(row,person)&&row.start_date>=cursor) || null;
      }
      if(!match){
        match={user_id:person.user_id,user_name:person.user_name,start_date:cursor,end_date:addDays(cursor,duration-1),inferred:true};
      }
      cursor=addDays(match.end_date,1);
      return match;
    });
  }
  function renderRows(cycle,active){
    els.rows.innerHTML='';
    if(!cycle.length){
      const row=document.createElement('div');
      row.className='oncall-row is-message';row.setAttribute('role','listitem');
      row.textContent='Valvegraafik ei ole määratud.';els.rows.appendChild(row);return;
    }
    cycle.forEach(item=>{
      const row=document.createElement('div');
      const isActive=active&&samePerson(item,active)&&item.start_date===active.start_date;
      row.className=`oncall-row${isActive?' is-active':''}`;
      row.setAttribute('role','listitem');

      const name=document.createElement('span');
      name.className='oncall-row__name';name.textContent=normalizeName(item.user_name);

      const period=document.createElement('span');
      period.className='oncall-row__period';
      const dates=document.createElement('span');dates.textContent=formatPeriod(item);
      const dot=document.createElement('span');dot.className='oncall-row__separator';dot.setAttribute('aria-hidden','true');dot.textContent='●';
      const week=document.createElement('span');week.className='oncall-row__week';week.textContent=`N${isoWeek(item.start_date)}`;
      period.append(dates,dot,week);
      row.append(name,period);els.rows.appendChild(row);
    });
  }
  function renderMessage(text,isError){
    els.rows.innerHTML='';
    const row=document.createElement('div');
    row.className=`oncall-row is-message${isError?' is-error':''}`;
    row.setAttribute('role','listitem');row.textContent=text;els.rows.appendChild(row);
  }
  async function load(){
    const supabaseClient=client();
    if(!supabaseClient){renderMessage('Valveinfo pole saadaval.',true);els.note.textContent='Supabase seadistus puudub.';return;}
    try{
      const [shiftResult,peopleResult]=await Promise.all([
        supabaseClient.from('oncall_assignments').select('id,user_id,user_name,start_date,end_date,note').order('start_date',{ascending:true}),
        supabaseClient.from('auth_users').select('id,full_name,active,on_call_active,on_call_order').eq('on_call_active',true).order('on_call_order',{ascending:true})
      ]);
      if(shiftResult.error) throw shiftResult.error;
      const shifts=(shiftResult.data||[]).filter(r=>r.start_date&&r.end_date&&normalizeName(r.user_name));
      const people=peopleResult.error?[]:(peopleResult.data||[]);
      const today=localDateKey();
      const activeRows=shifts.filter(r=>r.start_date<=today&&r.end_date>=today);
      const next=shifts.find(r=>r.start_date>today)||null;
      const anchor=activeRows[0]||next;
      const rotation=deriveRotation(shifts,people);
      const cycle=buildCycle(rotation,shifts,anchor);
      renderRows(cycle,activeRows.length===1?activeRows[0]:null);
      if(activeRows.length>1) els.note.textContent='Valvegraafikus on kattuvus. Kontrolli admini vaadet.';
      else if(!activeRows.length&&next) els.note.textContent='Praegu pole aktiivset valvet; kuvatud on järgmine rotatsioon.';
      else els.note.textContent='';
      els.updated.textContent=`Uuendatud ${new Intl.DateTimeFormat('et-EE',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
    }catch(err){
      console.error('VECO public on-call load failed',err);
      renderMessage('Valveinfo laadimine ebaõnnestus.',true);
      els.note.textContent='Proovi hetke pärast uuesti.';
    }
  }
  load();setInterval(load,REFRESH_MS);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) load();});
})();
