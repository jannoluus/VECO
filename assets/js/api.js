(function(){
  const URL_KEY='veco_supabase_url';
  const KEY_KEY='veco_supabase_key';
  const TABLE='workorders';
  const AUTH_TABLE='auth_users';
  const ONCALL_TABLE='oncall_assignments';
  const AVAILABILITY_TABLE='availability_entries';
  const CLIENTS_TABLE='clients';
  const OBJECTS_TABLE='objects';
  let pollingTimer=null;
  let realtimeChannel=null;
  let realtimeDebounce=null;
  let syncing=false;
  let pendingWorkorders=null;
  let lastLocalWriteAt=0;
  const REMOTE_ECHO_SUPPRESS_MS=60000;
  function markLocalWrite(){
    lastLocalWriteAt=Date.now();
    try{
      window.__VECO_LAST_LOCAL_WRITE_AT__=lastLocalWriteAt;
      window.__VECO_REMOTE_SUPPRESS_UNTIL__=Date.now()+REMOTE_ECHO_SUPPRESS_MS;
    }catch(_){ }
  }
  function isLikelyOwnRemoteEcho(){
    const until=Number(window.__VECO_REMOTE_SUPPRESS_UNTIL__||0)||0;
    if(until && Date.now()<until) return true;
    const t=Math.max(lastLocalWriteAt||0, Number(window.__VECO_LAST_LOCAL_WRITE_AT__||0)||0);
    return t && (Date.now()-t)<REMOTE_ECHO_SUPPRESS_MS;
  }
  let supabaseSupportsPlannedHours=true;
  let supabaseSupportsCompletedFields=true;
  let supabaseSupportsTimestampFields=true;
  let supabaseSupportsParticipantFields=true;
  let supabaseSupportsEndDate=true;
  let supabaseSupportsTaskFields=true;
  let lastMasterDataSyncSignature='';
  let lastOncallSyncSignature='';
  let lastAvailabilitySyncSignature='';
  function stableListSignature(value){
    try{return JSON.stringify(value||[]);}catch(_){return String(Date.now());}
  }
  const syncedWorkorderRowSignatures=new Map();
  function stableWorkorderRowSignature(row={}){
    const normalized={...row};
    delete normalized.updated_at;
    return JSON.stringify(Object.keys(normalized).sort().map(k=>[k,normalized[k]]));
  }
  function rememberSyncedWorkorder(w){
    if(!w) return;
    const row=toDb(w);
    if(row.workorder_no) syncedWorkorderRowSignatures.set(String(row.workorder_no),stableWorkorderRowSignature(row));
  }
  function rememberSyncedWorkorders(workorders=[]){
    (workorders||[]).forEach(rememberSyncedWorkorder);
  }

  function cleanUrl(value){
    return String(value||'').trim().replace(/\/rest\/v1\/?$/,'').replace(/\/+$/,'');
  }
  function getClient(){
    const configuredUrl=window.VECO_SUPABASE_URL || localStorage.getItem(URL_KEY);
    const configuredKey=window.VECO_SUPABASE_KEY || localStorage.getItem(KEY_KEY);
    const url=cleanUrl(configuredUrl);
    const key=String(configuredKey||'').trim();
    if(!url||!key||!window.supabase) return null;
    if(!window.__VECO_SUPABASE_CLIENT__||window.__VECO_SUPABASE_URL__!==url||window.__VECO_SUPABASE_KEY__!==key){
      window.__VECO_SUPABASE_URL__=url;
      window.__VECO_SUPABASE_KEY__=key;
      window.__VECO_SUPABASE_CLIENT__=window.supabase.createClient(url,key);
    }
    return window.__VECO_SUPABASE_CLIENT__;
  }
  function toDb(w){
    const row={
      workorder_no:String(w.id||w.workorder_no||'').trim()||null,
      project_id:w.projectId||w.project_id||null,
      object_id:w.objectId||w.object_id||null,
      title:w.title||'Töö',
      description:w.description||null,
      technician_id:w.technicianId||w.technician_id||null,
      technician:w.technician||w.technicianName||null,
      status:w.status||'Planeeritud',
      date:w.date||null,
      time:w.time||null,
      updated_at:new Date().toISOString()
    };
    if(w.createdAt||w.created_at){
      row.created_at=w.createdAt||w.created_at;
    }
    if(supabaseSupportsPlannedHours){
      row.planned_hours=Number(w.plannedHours||w.durationHours||w.hours||2)||2;
    }
    if(supabaseSupportsCompletedFields){
      row.completed_at=w.completedAt||w.completed_at||null;
      row.completed_by=w.completedBy||w.completed_by||null;
      row.completion_comment=w.completionComment||w.completion_comment||null;
    }
    if(supabaseSupportsTimestampFields){
      row.started_at=w.startedAt||w.started_at||null;
      row.paused_at=w.pausedAt||w.paused_at||null;
      row.started_by=w.startedByUuid||w.started_by||null;
    }
    if(supabaseSupportsEndDate){
      row.end_date=w.endDate||w.end_date||null;
    }
    if(supabaseSupportsTaskFields){
      row.workflow=w.workflow||w.workflowType||w.taskWorkflow||'kontroll';
      row.requires_act=!!(w.requiresAct||w.actRequired);
      row.is_billable=!!w.isBillable;
      row.track_time=!!w.trackTime;
      row.uses_materials=!!w.usesMaterials;
      row.requires_signature=!!w.requiresSignature;
    }
    if(supabaseSupportsParticipantFields){
      row.participant_technician_ids=Array.isArray(w.participantTechnicianIds)
        ? w.participantTechnicianIds.filter(Boolean)
        : (typeof w.participantTechnicianIds==='string'
            ? w.participantTechnicianIds.split(',').map(x=>x.trim()).filter(Boolean)
            : []);
    }
    return row;
  }
  function fromDb(row){
    return {
      id:row.workorder_no||`WO-DB-${row.id}`,
      projectId:row.project_id||'',
      objectId:row.object_id||'',
      title:row.title||'Töö',
      description:row.description||'',
      technicianId:row.technician_id||'',
      status:row.status||'Planeeritud',
      date:row.date||'',
      time:row.time ? String(row.time).slice(0,5) : '',
      endDate:row.end_date||'',
      plannedHours:Number(row.planned_hours||2)||2,
      durationHours:Number(row.planned_hours||2)||2,
      hours:Number(row.planned_hours||2)||2,
      completedAt:row.completed_at||'',
      completedBy:row.completed_by||'',
      completionComment:row.completion_comment||'',
      startedAt:row.started_at||'',
      pausedAt:row.paused_at||'',
      startedByUuid:row.started_by||'',
      updatedAt:row.updated_at||'',
      updated_at:row.updated_at||'',
      createdAt:row.created_at||'',
      created_at:row.created_at||'',
      workflow:row.workflow||'kontroll',
      workflowType:row.workflow||'kontroll',
      requiresAct:row.requires_act===true,
      actRequired:row.requires_act===true,
      isBillable:row.is_billable===true,
      trackTime:row.track_time===true,
      usesMaterials:row.uses_materials===true,
      requiresSignature:row.requires_signature===true,
      participantTechnicianIds:Array.isArray(row.participant_technician_ids)
        ? row.participant_technician_ids.filter(Boolean)
        : (typeof row.participant_technician_ids==='string'
            ? row.participant_technician_ids.split(',').map(x=>x.trim()).filter(Boolean)
            : [])
    };
  }
  function mergeWorkorders(localData, remoteRows){
    const data=window.VECO_STORAGE.normalize(localData||window.VECO_STORAGE.load());
    const localById=new Map((data.workorders||[]).map(w=>[String(w.id||w.workorder_no||''),w]));
    const remote=(remoteRows||[]).map(fromDb);
    const now=Date.now();
    const freshMs=5*60*1000;
    // Supabase remains the normal source of truth, but keep a very recent local
    // date-range edit if the user refreshes before the Supabase write has returned.
    data.workorders=remote.map(r=>{
      const local=localById.get(String(r.id||''));
      const lt=Date.parse(local?.updatedAt||local?.updated_at||'')||0;
      const rt=Date.parse(r.updatedAt||r.updated_at||'')||0;
      if(local && lt>rt+250 && now-lt<freshMs){
        return {...r,...local,updatedAt:local.updatedAt||local.updated_at,updated_at:local.updatedAt||local.updated_at};
      }
      return r;
    });
    rememberSyncedWorkorders(data.workorders||[]);
    return data;
  }

  function oncallPersonIdFromName(name,people){
    const clean=String(name||'').trim().toLowerCase();
    if(!clean) return '';
    const found=(people||[]).find(p=>String(p.name||'').trim().toLowerCase()===clean);
    return found?.id||'';
  }
  function oncallPersonNameFromId(id,people){
    const found=(people||[]).find(p=>String(p.id||'')===String(id||''));
    return found?.name||'';
  }
  function oncallFromDb(row,people){
    const personId=row.user_id||oncallPersonIdFromName(row.user_name,people);
    return {
      id:row.id||`OC-DB-${row.start_date}-${row.end_date}`,
      personId:personId||'',
      userName:row.user_name||oncallPersonNameFromId(personId,people)||'',
      start:row.start_date||'',
      end:row.end_date||'',
      note:row.note||'',
      remoteId:row.id||'',
      manualOverride:true
    };
  }
  function oncallToDb(o,people){
    const userName=o.userName||oncallPersonNameFromId(o.personId,people)||o.user_name||'';
    return {
      user_id:o.personId||o.user_id||null,
      user_name:userName||'Valveisik',
      start_date:o.start||o.start_date||null,
      end_date:o.end||o.end_date||null,
      note:o.note||null
    };
  }
  async function loadOncallAssignments(people=[]){
    const client=getClient();
    if(!client) return null;
    const {data,error}=await client.from(ONCALL_TABLE).select('id,user_id,user_name,start_date,end_date,note,created_at').order('start_date',{ascending:true});
    if(error) throw error;
    return (data||[]).map(row=>oncallFromDb(row,people)).filter(o=>o.start&&o.end);
  }
  async function syncOncallAssignments(oncall=[],people=[]){
    const client=getClient();
    if(!client) return false;
    const rows=(oncall||[]).map(o=>oncallToDb(o,people)).filter(r=>r.user_name&&r.start_date&&r.end_date);
    const del=await client.from(ONCALL_TABLE).delete().not('id','is',null);
    if(del.error) throw del.error;
    if(rows.length){
      const {error}=await client.from(ONCALL_TABLE).insert(rows);
      if(error) throw error;
    }
    return true;
  }
  let oncallSyncTimer=null;
  function scheduleOncallSync(oncall,people){
    if(!getClient()) return;
    clearTimeout(oncallSyncTimer);
    const snapshot=JSON.parse(JSON.stringify(oncall||[]));
    const peopleSnapshot=JSON.parse(JSON.stringify(people||[]));
    oncallSyncTimer=setTimeout(()=>{
      syncOncallAssignments(snapshot,peopleSnapshot).catch(err=>console.warn('VECO on-call Supabase sync failed',err));
    },200);
  }


  function availabilityPersonNameFromId(id,people){
    const found=(people||[]).find(p=>String(p.id||'')===String(id||''));
    return found?.name||'';
  }
  function availabilityPersonIdFromName(name,people){
    const clean=String(name||'').trim().toLowerCase();
    if(!clean) return '';
    const found=(people||[]).find(p=>String(p.name||'').trim().toLowerCase()===clean);
    return found?.id||'';
  }
  function availabilityFromDb(row,people){
    const personId=row.user_id||availabilityPersonIdFromName(row.user_name,people);
    return {
      id:row.id||`AV-DB-${row.start_date}-${row.end_date}`,
      personId:personId||'',
      userName:row.user_name||availabilityPersonNameFromId(personId,people)||'',
      type:row.status||row.type||'Puudumine',
      start:row.start_date||'',
      end:row.end_date||'',
      note:row.note||'',
      remoteId:row.id||''
    };
  }
  function availabilityToDb(a,people){
    const userName=a.userName||availabilityPersonNameFromId(a.personId,people)||a.user_name||'';
    return {
      user_id:a.personId||a.user_id||null,
      user_name:userName||'Töötaja',
      start_date:a.start||a.start_date||null,
      end_date:a.end||a.end_date||null,
      status:a.type||a.status||'Puudumine',
      note:a.note||null,
      updated_at:a.updatedAt||a.updated_at||new Date().toISOString()
    };
  }
  async function loadAvailabilityEntries(people=[]){
    const client=getClient();
    if(!client) return null;
    const {data,error}=await client.from(AVAILABILITY_TABLE).select('id,user_id,user_name,start_date,end_date,status,note,created_at,updated_at').order('start_date',{ascending:true});
    if(error) throw error;
    return (data||[]).map(row=>availabilityFromDb(row,people)).filter(a=>a.start&&a.end);
  }
  async function syncAvailabilityEntries(absences=[],people=[]){
    const client=getClient();
    if(!client) return false;
    const rows=(absences||[]).map(a=>availabilityToDb(a,people)).filter(r=>r.user_name&&r.start_date&&r.end_date&&r.status);
    const del=await client.from(AVAILABILITY_TABLE).delete().not('id','is',null);
    if(del.error) throw del.error;
    if(rows.length){
      const {error}=await client.from(AVAILABILITY_TABLE).insert(rows);
      if(error) throw error;
    }
    return true;
  }
  let availabilitySyncTimer=null;
  function scheduleAvailabilitySync(absences,people){
    if(!getClient()) return;
    clearTimeout(availabilitySyncTimer);
    const snapshot=JSON.parse(JSON.stringify(absences||[]));
    const peopleSnapshot=JSON.parse(JSON.stringify(people||[]));
    availabilitySyncTimer=setTimeout(()=>{
      syncAvailabilityEntries(snapshot,peopleSnapshot).catch(err=>console.warn('VECO availability Supabase sync failed',err));
    },200);
  }

  function normalizeTextId(value,prefix){
    const raw=String(value||'').trim();
    if(raw) return raw;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
  }
  function clientToDb(c){
    return {
      client_no:normalizeTextId(c.id||c.client_no,'C'),
      name:c.name||'Klient',
      reg_no:c.regNo||c.reg_no||null,
      contact:c.contact||null,
      phone:c.phone||null,
      email:c.email||null,
      invoice_email:c.invoiceEmail||c.invoice_email||null,
      active:c.active!==false,
      notes:c.notes||null,
      is_deleted:c.isDeleted===true||c.is_deleted===true,
      deleted_at:c.deletedAt||c.deleted_at||null,
      deleted_by:c.deletedBy||c.deleted_by||null,
      updated_at:c.updatedAt||c.updated_at||new Date().toISOString()
    };
  }
  function clientFromDb(row){
    return {
      id:row.client_no||row.id||'',
      remoteId:row.id||'',
      name:row.name||'Klient',
      regNo:row.reg_no||'',
      contact:row.contact||'',
      phone:row.phone||'',
      email:row.email||'',
      invoiceEmail:row.invoice_email||'',
      active:row.active!==false,
      notes:row.notes||'',
      isDeleted:row.is_deleted===true,
      deletedAt:row.deleted_at||'',
      deletedBy:row.deleted_by||''
    };
  }
  function objectToDb(o){
    return {
      object_no:normalizeTextId(o.id||o.object_no,'O'),
      client_no:o.clientId||o.client_no||null,
      name:o.name||'Objekt',
      address:o.address||null,
      main_contact:o.mainContact||o.main_contact||null,
      responsible_tech_id:o.responsibleTechId||o.responsible_tech_id||null,
      contract:o.contract||null,
      status:o.status||'active',
      notes:o.notes||null,
      contacts:Array.isArray(o.contacts)?o.contacts:[],
      is_deleted:o.isDeleted===true||o.is_deleted===true,
      deleted_at:o.deletedAt||o.deleted_at||null,
      deleted_by:o.deletedBy||o.deleted_by||null,
      updated_at:o.updatedAt||o.updated_at||new Date().toISOString()
    };
  }
  function objectFromDb(row){
    return {
      id:row.object_no||row.id||'',
      remoteId:row.id||'',
      clientId:row.client_no||row.client_id||'',
      name:row.name||'Objekt',
      address:row.address||'',
      mainContact:row.main_contact||'',
      responsibleTechId:row.responsible_tech_id||'',
      contract:row.contract||'',
      status:row.status||'active',
      notes:row.notes||'',
      contacts:Array.isArray(row.contacts)?row.contacts:[],
      isDeleted:row.is_deleted===true,
      deletedAt:row.deleted_at||'',
      deletedBy:row.deleted_by||''
    };
  }
  function mergeById(localRows,remoteRows){
    const byId=new Map((localRows||[]).map(x=>[String(x.id||''),x]));
    (remoteRows||[]).forEach(x=>{ if(x?.id) byId.set(String(x.id),{...(byId.get(String(x.id))||{}),...x}); });
    return Array.from(byId.values()).filter(x=>x&&x.id);
  }
  async function loadClients(){
    const client=getClient();
    if(!client) return null;
    const {data,error}=await client.from(CLIENTS_TABLE).select('id,client_no,name,reg_no,contact,phone,email,invoice_email,active,notes,is_deleted,deleted_at,deleted_by,created_at,updated_at').order('name',{ascending:true});
    if(error) throw error;
    return (data||[]).map(clientFromDb).filter(c=>c.id&&c.name);
  }
  async function loadObjects(){
    const client=getClient();
    if(!client) return null;
    const {data,error}=await client.from(OBJECTS_TABLE).select('id,object_no,client_no,name,address,main_contact,responsible_tech_id,contract,status,notes,contacts,is_deleted,deleted_at,deleted_by,created_at,updated_at').order('name',{ascending:true});
    if(error) throw error;
    return (data||[]).map(objectFromDb).filter(o=>o.id&&o.name);
  }
  async function syncClients(clients=[]){
    const client=getClient();
    if(!client) return false;
    const rows=(clients||[]).map(clientToDb).filter(r=>r.client_no&&r.name);
    if(!rows.length) return true;
    const {error}=await client.from(CLIENTS_TABLE).upsert(rows,{onConflict:'client_no'});
    if(error) throw error;
    return true;
  }
  async function syncObjects(objects=[]){
    const client=getClient();
    if(!client) return false;
    const rows=(objects||[]).map(objectToDb).filter(r=>r.object_no&&r.name);
    if(!rows.length) return true;
    const {error}=await client.from(OBJECTS_TABLE).upsert(rows,{onConflict:'object_no'});
    if(error) throw error;
    return true;
  }

  async function archiveClient(clientNo,deletedBy='VECO'){
    const client=getClient();
    if(!client) return false;
    const key=String(clientNo||'').trim();
    if(!key) return false;
    const patch={is_deleted:true,deleted_at:new Date().toISOString(),deleted_by:deletedBy||'VECO',updated_at:new Date().toISOString()};
    const {error}=await client.from(CLIENTS_TABLE).update(patch).eq('client_no',key);
    if(error) throw error;
    return true;
  }
  async function archiveObject(objectNo,deletedBy='VECO'){
    const client=getClient();
    if(!client) return false;
    const key=String(objectNo||'').trim();
    if(!key) return false;
    const patch={is_deleted:true,deleted_at:new Date().toISOString(),deleted_by:deletedBy||'VECO',updated_at:new Date().toISOString()};
    const {error}=await client.from(OBJECTS_TABLE).update(patch).eq('object_no',key);
    if(error) throw error;
    return true;
  }
  async function restoreClient(clientNo){
    const client=getClient();
    if(!client) return false;
    const key=String(clientNo||'').trim();
    if(!key) return false;
    const patch={is_deleted:false,deleted_at:null,deleted_by:null,updated_at:new Date().toISOString()};
    const {error}=await client.from(CLIENTS_TABLE).update(patch).eq('client_no',key);
    if(error) throw error;
    return true;
  }
  async function restoreObject(objectNo){
    const client=getClient();
    if(!client) return false;
    const key=String(objectNo||'').trim();
    if(!key) return false;
    const patch={is_deleted:false,deleted_at:null,deleted_by:null,updated_at:new Date().toISOString()};
    const {error}=await client.from(OBJECTS_TABLE).update(patch).eq('object_no',key);
    if(error) throw error;
    return true;
  }
  let masterDataSyncTimer=null;
  function scheduleMasterDataSync(clients,objects){
    if(!getClient()) return;
    clearTimeout(masterDataSyncTimer);
    const clientsSnapshot=JSON.parse(JSON.stringify(clients||[]));
    const objectsSnapshot=JSON.parse(JSON.stringify(objects||[]));
    masterDataSyncTimer=setTimeout(async()=>{
      try{
        await syncClients(clientsSnapshot);
        await syncObjects(objectsSnapshot);
      }catch(err){
        console.warn('VECO clients/objects Supabase sync failed',err);
        try{ localStorage.setItem('veco_v3_last_masterdata_sync_error',String(err?.message||err||'')); }catch(_){ }
      }
    },200);
  }
  async function loadWorkorders(){
    const client=getClient();
    if(!client) return [];
    const {data,error}=await client.from(TABLE).select('*').order('date',{ascending:true}).order('time',{ascending:true});
    if(error) throw error;
    return data||[];
  }
  function stripUnsupportedColumns(row,error){
    const fallback={...row};
    const msg=String(error?.message||'');
    if(msg.includes('planned_hours')){
      supabaseSupportsPlannedHours=false;
      delete fallback.planned_hours;
    }
    if(msg.includes('completed_at')||msg.includes('completed_by')||msg.includes('completion_comment')){
      supabaseSupportsCompletedFields=false;
      delete fallback.completed_at;
      delete fallback.completed_by;
      delete fallback.completion_comment;
    }
    if(msg.includes('started_at')||msg.includes('paused_at')||msg.includes('started_by')){
      supabaseSupportsTimestampFields=false;
      delete fallback.started_at;
      delete fallback.paused_at;
      delete fallback.started_by;
    }
    if(msg.includes('end_date')){
      supabaseSupportsEndDate=false;
      delete fallback.end_date;
    }
    if(msg.includes('workflow')||msg.includes('requires_act')||msg.includes('is_billable')||msg.includes('track_time')||msg.includes('uses_materials')||msg.includes('requires_signature')){
      supabaseSupportsTaskFields=false;
      delete fallback.workflow;
      delete fallback.requires_act;
      delete fallback.is_billable;
      delete fallback.track_time;
      delete fallback.uses_materials;
      delete fallback.requires_signature;
    }
    if(msg.includes('participant_technician_ids')){
      supabaseSupportsParticipantFields=false;
      delete fallback.participant_technician_ids;
    }
    return fallback;
  }
  async function syncWorkorders(workorders){
    const client=getClient();
    if(!client) return;
    const allSnapshot=JSON.parse(JSON.stringify(workorders||[]));
    const snapshot=allSnapshot.filter(w=>{
      const row=toDb(w);
      if(!row.workorder_no) return false;
      const sig=stableWorkorderRowSignature(row);
      return syncedWorkorderRowSignatures.get(String(row.workorder_no))!==sig;
    });
    if(!snapshot.length) return;
    if(syncing){
      pendingWorkorders=allSnapshot;
      return;
    }
    syncing=true;
    try{
      for(const w of snapshot){
        const row=toDb(w);
        if(!row.workorder_no) continue;
        const found=await client.from(TABLE).select('id').eq('workorder_no',row.workorder_no).maybeSingle();
        if(found.error && found.error.code!=='PGRST116') throw found.error;
        if(found.data?.id){
          let {error}=await client.from(TABLE).update(row).eq('id',found.data.id);
          if(error && /planned_hours|completed_at|completed_by|completion_comment|started_at|paused_at|started_by|participant_technician_ids|end_date|workflow|requires_act|is_billable|track_time|uses_materials|requires_signature/.test(String(error.message||''))){
            const fallback=stripUnsupportedColumns(row,error);
            ({error}=await client.from(TABLE).update(fallback).eq('id',found.data.id));
          }
          if(error) throw error;
          rememberSyncedWorkorder(w);
        }else{
          let {error}=await client.from(TABLE).insert(row);
          if(error && /planned_hours|completed_at|completed_by|completion_comment|started_at|paused_at|started_by|participant_technician_ids|end_date|workflow|requires_act|is_billable|track_time|uses_materials|requires_signature/.test(String(error.message||''))){
            const fallback=stripUnsupportedColumns(row,error);
            ({error}=await client.from(TABLE).insert(fallback));
          }
          if(error) throw error;
          rememberSyncedWorkorder(w);
        }
      }
    }catch(err){
      console.warn('VECO Supabase sync failed',err);
    }finally{
      syncing=false;
      if(pendingWorkorders){
        const next=pendingWorkorders;
        pendingWorkorders=null;
        setTimeout(()=>syncWorkorders(next),0);
      }
    }
  }



  function authRoleToDb(role){
    const r=String(role||'').trim().toLowerCase();
    if(r==='admin') return 'admin';
    if(r==='supervisor'||r==='hooldusjuht'||r==='vanemtehnik') return 'supervisor';
    return 'technician';
  }
  function authRoleToApp(role){
    const r=String(role||'').trim().toLowerCase();
    if(r==='admin') return 'admin';
    if(r==='supervisor'||r==='hooldusjuht'||r==='vanemtehnik') return 'supervisor';
    return 'technician';
  }

  function authUsernameFromId(id){
    return String(id||'').trim().replace(/^U-/i,'').toLowerCase();
  }
  function authUsernameClean(value){
    return String(value||'')
      .trim()
      .toLowerCase()
      .split('@')[0]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/õ/g,'o').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u')
      .replace(/[^a-z0-9]+/g,'.')
      .replace(/^\.+|\.+$/g,'');
  }
  function authIdFromUsername(username){
    const value=String(username||'').trim();
    if(!value) return '';
    return value.toUpperCase().startsWith('U-')?value.toUpperCase():`U-${value.toUpperCase()}`;
  }
  function authRowFromUser(u){
    const username=authUsernameClean(u.username) || authUsernameClean(u.email) || authUsernameClean(u.name||u.full_name) || authUsernameFromId(u.id);
    if(!username) return null;
    return {
      username,
      full_name:u.name||u.full_name||u.id||username,
      role:authRoleToDb(u.role),
      active:u.active!==false,
      pin_hash:u.pinHash||null,
      pin_reset_required:u.pinResetRequired===true,
      on_call_active:u.onCallActive===true,
      on_call_order:u.onCallActive===true ? (Number(u.onCallOrder)||null) : null,
      availability_status:u.availabilityStatus||u.availability_status||'available',
      phone:u.phone||'',
      email:u.email||'',
      region:u.region||'',
      created_at:u.createdAt||u.created_at||new Date().toISOString(),
      updated_at:new Date().toISOString()
    };
    if(w.createdAt||w.created_at){
      row.created_at=w.createdAt||w.created_at;
    }
  }
  function authUserFromRow(row){
    const username=row.username||'';
    return {
      id:authIdFromUsername(username),
      dbId:row.id||'',
      username,
      name:row.full_name||username,
      role:authRoleToApp(row.role),
      active:row.active!==false,
      pinHash:row.pin_hash||'',
      pinSetAt:row.updated_at||'',
      pinResetRequired:row.pin_reset_required===true,
      onCallActive:row.on_call_active===true,
      onCallOrder:Number(row.on_call_order||0)||0,
      availabilityStatus:row.availability_status||'available',
      phone:row.phone||'',
      email:row.email||'',
      region:row.region||''
    };
  }
  function authDedupeKey(row){
    const username=String(row.username||'').trim().toLowerCase();
    if(username) return `u:${username}`;
    return `n:${authUsernameClean(row.full_name||'')}`;
  }
  function authRowRank(row){
    let score=0;
    if(row.active!==false) score+=100;
    if(row.pin_hash) score+=50;
    if(row.pin_reset_required===false) score+=20;
    if(String(row.role||'').toLowerCase()==='admin') score+=10;
    if(String(row.role||'').toLowerCase()==='supervisor') score+=5;
    score+=Date.parse(row.updated_at||row.created_at||0)/1e13 || 0;
    return score;
  }
  async function loadAuthUsers(){
    const client=getClient();
    if(!client) return null;
    const {data,error}=await client.from(AUTH_TABLE).select('id,username,full_name,role,pin_hash,pin_reset_required,active,on_call_active,on_call_order,availability_status,phone,email,region,created_at,updated_at').order('full_name',{ascending:true});
    if(error) throw error;
    const byKey=new Map();
    (data||[]).forEach(row=>{
      const key=authDedupeKey(row);
      if(!key) return;
      const current=byKey.get(key);
      if(!current || authRowRank(row)>authRowRank(current)) byKey.set(key,row);
    });
    const auth={users:{},superadmin:{role:'superadmin',pinHash:'',pinSetAt:''}};
    Array.from(byKey.values()).forEach(row=>{
      const u=authUserFromRow(row);
      if(!u.id) return;
      if(u.username==='superadmin') auth.superadmin={role:'superadmin',pinHash:u.pinHash||'',pinSetAt:u.pinSetAt||''};
      else auth.users[u.id]=u;
    });
    return auth;
  }
  async function saveAuthUsers(auth){
    const client=getClient();
    if(!client||!auth) return false;
    const rows=Object.values(auth.users||{}).map(authRowFromUser).filter(Boolean);
    if(!rows.length) return true;
    const {error}=await client.from(AUTH_TABLE).upsert(rows,{onConflict:'username'});
    if(error) throw error;
    return true;
  }

  async function saveAuthUser(user){
    const client=getClient();
    if(!client||!user) return false;
    const row=authRowFromUser(user);
    if(!row) return false;
    const {error}=await client.from(AUTH_TABLE).upsert(row,{onConflict:'username'});
    if(error) throw error;
    return true;
  }

  async function deactivateAuthUser(userId){
    const client=getClient();
    if(!client) return false;
    const username=authUsernameFromId(userId);
    if(!username) return false;
    const {error}=await client.from(AUTH_TABLE).update({active:false,updated_at:new Date().toISOString()}).eq('username',username);
    if(error) throw error;
    return true;
  }

  async function deleteAuthUser(userId){
    // Hard delete is kept for future admin tools, but the VECO UI uses soft deactivate.
    return deactivateAuthUser(userId);
  }


  function partialWorkorderDbPatch(fields={}){
    const row={updated_at:new Date().toISOString()};
    const set=(k,v)=>{ if(v!==undefined) row[k]=v; };
    if(Object.prototype.hasOwnProperty.call(fields,'title')) set('title',fields.title||'Töö');
    if(Object.prototype.hasOwnProperty.call(fields,'description') || Object.prototype.hasOwnProperty.call(fields,'problemDescription')) set('description',fields.description ?? fields.problemDescription ?? null);
    if(Object.prototype.hasOwnProperty.call(fields,'objectId')) set('object_id',fields.objectId||null);
    if(Object.prototype.hasOwnProperty.call(fields,'projectId')) set('project_id',fields.projectId||null);
    if(Object.prototype.hasOwnProperty.call(fields,'technicianId')) set('technician_id',fields.technicianId||null);
    if(Object.prototype.hasOwnProperty.call(fields,'status')) set('status',fields.status||'Planeeritud');
    if(Object.prototype.hasOwnProperty.call(fields,'date')) set('date',fields.date||null);
    if(Object.prototype.hasOwnProperty.call(fields,'time')) set('time',fields.time||null);
    if(Object.prototype.hasOwnProperty.call(fields,'plannedHours') || Object.prototype.hasOwnProperty.call(fields,'durationHours') || Object.prototype.hasOwnProperty.call(fields,'hours')) set('planned_hours',Number(fields.plannedHours||fields.durationHours||fields.hours||2)||2);
    if(Object.prototype.hasOwnProperty.call(fields,'completedAt')) set('completed_at',fields.completedAt||null);
    if(Object.prototype.hasOwnProperty.call(fields,'completedBy')) set('completed_by',fields.completedBy||null);
    if(Object.prototype.hasOwnProperty.call(fields,'completionComment') || Object.prototype.hasOwnProperty.call(fields,'performedWork') || Object.prototype.hasOwnProperty.call(fields,'workDone') || Object.prototype.hasOwnProperty.call(fields,'done')) set('completion_comment',fields.completionComment||fields.performedWork||fields.workDone||fields.done||null);
    if(Object.prototype.hasOwnProperty.call(fields,'startedAt')) set('started_at',fields.startedAt||null);
    if(Object.prototype.hasOwnProperty.call(fields,'pausedAt')) set('paused_at',fields.pausedAt||null);
    if(Object.prototype.hasOwnProperty.call(fields,'startedByUuid')) set('started_by',fields.startedByUuid||null);
    if(Object.prototype.hasOwnProperty.call(fields,'endDate')) set('end_date',fields.endDate||null);
    if(Object.prototype.hasOwnProperty.call(fields,'workflow') || Object.prototype.hasOwnProperty.call(fields,'workflowType')) set('workflow',fields.workflow||fields.workflowType||'kontroll');
    if(Object.prototype.hasOwnProperty.call(fields,'requiresAct') || Object.prototype.hasOwnProperty.call(fields,'actRequired')) set('requires_act',!!(fields.requiresAct||fields.actRequired));
    if(Object.prototype.hasOwnProperty.call(fields,'isBillable')) set('is_billable',!!fields.isBillable);
    if(Object.prototype.hasOwnProperty.call(fields,'trackTime')) set('track_time',!!fields.trackTime);
    if(Object.prototype.hasOwnProperty.call(fields,'usesMaterials')) set('uses_materials',!!fields.usesMaterials);
    if(Object.prototype.hasOwnProperty.call(fields,'requiresSignature')) set('requires_signature',!!fields.requiresSignature);
    if(Object.prototype.hasOwnProperty.call(fields,'participantTechnicianIds')) set('participant_technician_ids',Array.isArray(fields.participantTechnicianIds)?fields.participantTechnicianIds.filter(Boolean):[]);
    return row;
  }

  async function patchWorkorderFields(workorderNo,fields={}){
    const client=getClient();
    const no=String(workorderNo||'').trim();
    if(!client||!no) return false;
    const row=partialWorkorderDbPatch(fields);
    markLocalWrite();
    try{
      const found=await client.from(TABLE).select('id').eq('workorder_no',no).maybeSingle();
      if(found.error && found.error.code!=='PGRST116') throw found.error;
      if(found.data?.id){
        let {error}=await client.from(TABLE).update(row).eq('id',found.data.id);
        if(error && /planned_hours|completed_at|completed_by|completion_comment|started_at|paused_at|started_by|participant_technician_ids|end_date|workflow|requires_act|is_billable|track_time|uses_materials|requires_signature/.test(String(error.message||''))){
          const fallback=stripUnsupportedColumns({...row},error);
          ({error}=await client.from(TABLE).update(fallback).eq('id',found.data.id));
        }
        if(error) throw error;
        const local=(window.VECO_STORAGE?.load?.()||{}).workorders?.find?.(w=>String(w.id||w.workorder_no||'')===no);
        if(local) rememberSyncedWorkorder({...local,...fields,updatedAt:row.updated_at,updated_at:row.updated_at});
        return true;
      }
    }catch(err){
      console.warn('VECO Supabase partial workorder update failed',err);
    }
    return false;
  }

  function signature(data){
    return JSON.stringify((data?.workorders||[]).map(w=>[w.id,w.status,w.date,w.endDate||w.end_date||'',w.time,w.title,w.technicianId,w.objectId,w.projectId,w.description,w.plannedHours||w.durationHours||w.hours,(w.participantTechnicianIds||[]).join(','),w.startedAt||'',w.pausedAt||'',w.completedAt||'',w.startedByUuid||'',w.completedBy||'',w.completionComment||'']));
  }
  async function pullAndNotify(onChange){
    try{
      const before=signature(window.VECO_STORAGE.load());
      const merged=await window.VECO_API.refreshWorkorders(window.VECO_STORAGE.load());
      const after=signature(merged);
      if(before!==after && typeof onChange==='function'){
        if(isLikelyOwnRemoteEcho()){
          // Local save already updated the UI. Avoid repainting the whole calendar when Supabase echoes our own write back.
          return;
        }
        onChange(merged,{source:'realtime'});
      }
    }catch(err){
      console.warn('VECO Supabase realtime refresh failed',err);
    }
  }

  window.VECO_API={
    loadAuthUsers,
    saveAuthUsers,
    saveAuthUser,
    deactivateAuthUser,
    deleteAuthUser,
    loadOncallAssignments,
    syncOncallAssignments,
    loadAvailabilityEntries,
    syncAvailabilityEntries,
    loadClients,
    loadObjects,
    syncClients,
    syncObjects,
    archiveClient,
    archiveObject,
    restoreClient,
    restoreObject,
    mode(){return getClient()?'supabase':'local'},
    modeLabel(){return this.mode()==='supabase'?'Supabase':'lokaalne'},
    configure(){
      const currentUrl=cleanUrl(window.VECO_SUPABASE_URL || localStorage.getItem(URL_KEY));
      const url=prompt('Supabase Project URL', currentUrl || 'https://bjiuqghslbdwhcdinocv.supabase.co');
      if(url===null) return false;
      const currentKey=window.VECO_SUPABASE_KEY || localStorage.getItem(KEY_KEY)||'';
      const key=prompt('Supabase publishable / anon key', currentKey);
      if(key===null) return false;
      localStorage.setItem(URL_KEY,cleanUrl(url));
      localStorage.setItem(KEY_KEY,String(key).trim());
      return true;
    },
    async load(){
      const local=window.VECO_STORAGE.load();
      if(this.mode()!=='supabase') return local;
      try{
        const base=window.VECO_STORAGE.normalize(local);
        try{
          const remoteClients=await loadClients();
          if(Array.isArray(remoteClients)) base.clients=mergeById(base.clients||[],remoteClients);
        }catch(clientErr){
          console.warn('VECO clients Supabase load failed, using local clients',clientErr);
        }
        try{
          const remoteObjects=await loadObjects();
          if(Array.isArray(remoteObjects)) base.objects=mergeById(base.objects||[],remoteObjects);
        }catch(objectErr){
          console.warn('VECO objects Supabase load failed, using local objects',objectErr);
        }
        const rows=await loadWorkorders();
        const merged=mergeWorkorders(base,rows);
        try{
          const remoteOncall=await loadOncallAssignments(merged.people||[]);
          if(Array.isArray(remoteOncall)) merged.oncall=remoteOncall;
        }catch(oncallErr){
          console.warn('VECO on-call Supabase load failed, using local on-call data',oncallErr);
        }
        try{
          const remoteAvailability=await loadAvailabilityEntries(merged.people||[]);
          if(Array.isArray(remoteAvailability)) merged.absences=remoteAvailability;
        }catch(availabilityErr){
          console.warn('VECO availability Supabase load failed, using local availability data',availabilityErr);
        }
        window.VECO_STORAGE.save(merged);
        scheduleMasterDataSync(merged.clients,merged.objects);
        // Do not push all loaded remote workorders back to Supabase on startup.
        // That creates a realtime storm and repaints the calendar repeatedly (flicker).
        // Workorders are synced only after an actual local save.
        return merged;
      }catch(err){
        console.warn('VECO Supabase load failed, using local data',err);
        return local;
      }
    },
    save(data){
      const saved=window.VECO_STORAGE.save(data);
      if(this.mode()==='supabase'){
        markLocalWrite();

        // CR-RENDER-002: avoid background sync noise after every work edit.
        // Master data / valve / availability are synced only when their own payload changed.
        const masterSig=stableListSignature([saved.clients||[],saved.objects||[]]);
        if(masterSig!==lastMasterDataSyncSignature){
          lastMasterDataSyncSignature=masterSig;
          scheduleMasterDataSync(saved.clients,saved.objects);
        }

        syncWorkorders(saved.workorders);

        const oncallSig=stableListSignature([saved.oncall||[],(saved.people||[]).map(p=>[p.id,p.name,p.username])]);
        if(oncallSig!==lastOncallSyncSignature){
          lastOncallSyncSignature=oncallSig;
          scheduleOncallSync(saved.oncall,saved.people);
        }

        const availabilitySig=stableListSignature([saved.absences||[],(saved.people||[]).map(p=>[p.id,p.name,p.username])]);
        if(availabilitySig!==lastAvailabilitySyncSignature){
          lastAvailabilitySyncSignature=availabilitySig;
          scheduleAvailabilitySync(saved.absences,saved.people);
        }
      }
      return saved;
    },
    patchWorkorderFields,
    async deleteWorkorder(workorderNo){
      const client=getClient();
      if(!workorderNo) return false;
      if(this.mode()!=='supabase'||!client) return false;
      try{
        const {error}=await client.from(TABLE).delete().eq('workorder_no',workorderNo);
        if(error) throw error;
        return true;
      }catch(err){
        console.warn('VECO Supabase delete failed',err);
        return false;
      }
    },
    async refreshWorkorders(currentState){
      if(this.mode()!=='supabase') return currentState;
      const base=window.VECO_STORAGE.normalize(currentState||window.VECO_STORAGE.load());
      try{
        const remoteClients=await loadClients();
        if(Array.isArray(remoteClients)) base.clients=mergeById(base.clients||[],remoteClients);
      }catch(clientErr){ console.warn('VECO clients Supabase refresh failed',clientErr); }
      try{
        const remoteObjects=await loadObjects();
        if(Array.isArray(remoteObjects)) base.objects=mergeById(base.objects||[],remoteObjects);
      }catch(objectErr){ console.warn('VECO objects Supabase refresh failed',objectErr); }
      const rows=await loadWorkorders();
      const merged=mergeWorkorders(base,rows);
      window.VECO_STORAGE.save(merged);
      return merged;
    },
    startWorkorderPolling(onChange){
      if(this.mode()!=='supabase'||pollingTimer) return;
      const tick=async()=>{
        try{
          const before=signature(window.VECO_STORAGE.load());
          const merged=await this.refreshWorkorders(window.VECO_STORAGE.load());
          const after=signature(merged);
          if(before!==after && typeof onChange==='function'){
            if(isLikelyOwnRemoteEcho()) return;
            onChange(merged,{source:'polling'});
          }
        }catch(err){console.warn('VECO Supabase polling failed',err);}
      };
      pollingTimer=setInterval(tick,2000);
      setTimeout(tick,500);
    },
    startWorkorderRealtime(onChange,onStatus){
      const client=getClient();
      if(this.mode()!=='supabase'||!client) return false;
      if(realtimeChannel) return true;
      realtimeChannel=client
        .channel('veco-workorders-realtime')
        .on('postgres_changes',{event:'*',schema:'public',table:TABLE},()=>{
          clearTimeout(realtimeDebounce);
          realtimeDebounce=setTimeout(()=>pullAndNotify(onChange),250);
        })
        .subscribe((status)=>{
          if(typeof onStatus==='function') onStatus(status);
          if(status==='SUBSCRIBED'){
            // Realtime is active; do not start parallel polling, because it causes unnecessary refresh/repaint cycles.
          }
          if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
            console.warn('VECO Supabase realtime status',status);
            this.startWorkorderPolling(onChange);
          }
        });
      return true;
    }
  };
})();
