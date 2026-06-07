(function(){
  const URL_KEY='veco_supabase_url';
  const KEY_KEY='veco_supabase_key';
  const TABLE='workorders';
  let pollingTimer=null;
  let realtimeChannel=null;
  let realtimeDebounce=null;
  let syncing=false;
  let supabaseSupportsPlannedHours=true;

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
      title:w.title||'Töökäsk',
      description:w.description||null,
      technician_id:w.technicianId||w.technician_id||null,
      technician:w.technician||w.technicianName||null,
      status:w.status||'Planeeritud',
      date:w.date||null,
      time:w.time||null,
      updated_at:new Date().toISOString()
    };
    if(supabaseSupportsPlannedHours){
      row.planned_hours=Number(w.plannedHours||w.durationHours||w.hours||2)||2;
    }
    return row;
  }
  function fromDb(row){
    return {
      id:row.workorder_no||`WO-DB-${row.id}`,
      projectId:row.project_id||'',
      objectId:row.object_id||'',
      title:row.title||'Töökäsk',
      description:row.description||'',
      technicianId:row.technician_id||'',
      status:row.status||'Planeeritud',
      date:row.date||'',
      time:row.time ? String(row.time).slice(0,5) : '',
      plannedHours:Number(row.planned_hours||2)||2,
      durationHours:Number(row.planned_hours||2)||2,
      hours:Number(row.planned_hours||2)||2
    };
  }
  function mergeWorkorders(localData, remoteRows){
    const data=window.VECO_STORAGE.normalize(localData||window.VECO_STORAGE.load());
    const remote=(remoteRows||[]).map(fromDb);
    const byId=new Map((data.workorders||[]).map(w=>[w.id,w]));
    remote.forEach(w=>byId.set(w.id,{...(byId.get(w.id)||{}),...w}));
    data.workorders=Array.from(byId.values());
    return data;
  }
  async function loadWorkorders(){
    const client=getClient();
    if(!client) return [];
    const {data,error}=await client.from(TABLE).select('*').order('date',{ascending:true}).order('time',{ascending:true});
    if(error) throw error;
    return data||[];
  }
  async function syncWorkorders(workorders){
    const client=getClient();
    if(!client||syncing) return;
    syncing=true;
    try{
      for(const w of (workorders||[])){
        const row=toDb(w);
        if(!row.workorder_no) continue;
        const found=await client.from(TABLE).select('id').eq('workorder_no',row.workorder_no).maybeSingle();
        if(found.error && found.error.code!=='PGRST116') throw found.error;
        if(found.data?.id){
          let {error}=await client.from(TABLE).update(row).eq('id',found.data.id);
          if(error && String(error.message||'').includes('planned_hours')){
            supabaseSupportsPlannedHours=false;
            const fallback={...row};
            delete fallback.planned_hours;
            ({error}=await client.from(TABLE).update(fallback).eq('id',found.data.id));
          }
          if(error) throw error;
        }else{
          let {error}=await client.from(TABLE).insert(row);
          if(error && String(error.message||'').includes('planned_hours')){
            supabaseSupportsPlannedHours=false;
            const fallback={...row};
            delete fallback.planned_hours;
            ({error}=await client.from(TABLE).insert(fallback));
          }
          if(error) throw error;
        }
      }
    }catch(err){
      console.warn('VECO Supabase sync failed',err);
    }finally{
      syncing=false;
    }
  }

  function signature(data){
    return JSON.stringify((data?.workorders||[]).map(w=>[w.id,w.status,w.date,w.time,w.title,w.technicianId,w.objectId,w.projectId,w.description,w.plannedHours||w.durationHours||w.hours]));
  }
  async function pullAndNotify(onChange){
    try{
      const before=signature(window.VECO_STORAGE.load());
      const merged=await window.VECO_API.refreshWorkorders(window.VECO_STORAGE.load());
      const after=signature(merged);
      if(before!==after && typeof onChange==='function') onChange(merged,{source:'realtime'});
    }catch(err){
      console.warn('VECO Supabase realtime refresh failed',err);
    }
  }

  window.VECO_API={
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
        const rows=await loadWorkorders();
        const merged=mergeWorkorders(local,rows);
        window.VECO_STORAGE.save(merged);
        return merged;
      }catch(err){
        console.warn('VECO Supabase load failed, using local data',err);
        return local;
      }
    },
    save(data){
      const saved=window.VECO_STORAGE.save(data);
      if(this.mode()==='supabase') syncWorkorders(saved.workorders);
      return saved;
    },
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
      const rows=await loadWorkorders();
      const merged=mergeWorkorders(currentState,rows);
      window.VECO_STORAGE.save(merged);
      return merged;
    },
    startWorkorderPolling(onChange){
      if(this.mode()!=='supabase'||pollingTimer) return;
      pollingTimer=setInterval(async()=>{
        try{
          const before=signature(window.VECO_STORAGE.load());
          const merged=await this.refreshWorkorders(window.VECO_STORAGE.load());
          const after=signature(merged);
          if(before!==after && typeof onChange==='function') onChange(merged,{source:'polling'});
        }catch(err){console.warn('VECO Supabase polling failed',err);}
      },15000);
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
            if(pollingTimer){ clearInterval(pollingTimer); pollingTimer=null; }
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
