window.VECO_STORAGE={
  key:'veco_v3_shared_state',
  legacyKeys:['veco_v3_step2_state'],
  version:10,
  clone(value){return JSON.parse(JSON.stringify(value||{}))},
  defaultData(){
    return this.clone(window.VECO_DATA||{});
  },
  isLegacyDemoOnly(data){
    const people=Array.isArray(data?.people)?data.people:[];
    const ids=new Set(people.map(p=>p.id));
    const hasDemo=ids.has('U-DEMO') || people.some(p=>String(p.role||'').toLowerCase()==='demo' || String(p.name||'').toUpperCase()==='DEMO');
    const hasRealExpanded=['U-RICHARD','U-ROMET','U-SERGEI','U-ARTEM'].some(id=>ids.has(id));
    return hasDemo && !hasRealExpanded && people.length<=3;
  },
  sanitizeDemoReferences(result){
    const fallbackTech=(result.people||[]).find(p=>String(p.role||'')==='Tehnik')?.id || (result.people||[])[0]?.id || '';
    const fallbackAdmin=(result.people||[]).find(p=>String(p.role||'')==='Admin')?.id || fallbackTech;
    const replacePerson=id=>id==='U-DEMO'?(fallbackTech||fallbackAdmin||''):id;
    (result.objects||[]).forEach(o=>{ if(o.responsibleTechId==='U-DEMO') o.responsibleTechId=fallbackAdmin; });
    (result.projects||[]).forEach(p=>{ if(p.responsibleTechId==='U-DEMO') p.responsibleTechId=fallbackAdmin; });
    (result.workorders||[]).forEach(w=>{
      if(w.technicianId==='U-DEMO') w.technicianId=fallbackTech;
      if(w.responsibleTechnicianId==='U-DEMO') w.responsibleTechnicianId=fallbackTech;
      w.participantTechnicianIds=(Array.isArray(w.participantTechnicianIds)?w.participantTechnicianIds:[]).map(replacePerson).filter(Boolean);
    });
    (result.absences||[]).forEach(a=>{ if(a.personId==='U-DEMO') a.personId=fallbackTech; });
    (result.oncall||[]).forEach(o=>{ if(o.personId==='U-DEMO') o.personId=fallbackTech; });
    return result;
  },
  normalize(data){
    const base=this.clone(window.VECO_DATA||{});
    const incoming=this.clone(data||{});
    const incomingVersion=Number(incoming?._meta?.version||0);
    let result;
    if(this.isLegacyDemoOnly(incoming)){
      result={...base,_meta:{migratedFrom:'legacy-demo-mobile',previousVersion:incomingVersion}};
      try{ localStorage.removeItem('veco_mobile_user_id'); }catch(e){}
    }else{
      result={...base,...incoming};
      const hasDemo=(result.people||[]).some(p=>p.id==='U-DEMO'||String(p.role||'').toLowerCase()==='demo');
      if(hasDemo){
        result.people=(result.people||[]).filter(p=>p.id!=='U-DEMO' && String(p.role||'').toLowerCase()!=='demo');
        this.sanitizeDemoReferences(result);
        try{ if(localStorage.getItem('veco_mobile_user_id')==='U-DEMO') localStorage.removeItem('veco_mobile_user_id'); }catch(e){}
      }
    }
    ['people','clients','objects','devices','projects','workorders','acts','absences','oncall','maintenanceNorms','maintenanceProfiles','granlundClassifiers'].forEach(key=>{
      result[key]=Array.isArray(result[key])?result[key]:[];
    });
    result._meta={...(result._meta||{}),version:this.version,updatedAt:new Date().toISOString(),build:'VECO_V3_20260611_1139'};
    return result;
  },
  load(){
    try{
      const qs=new URLSearchParams(location.search||'');
      if(qs.has('resetLocal')||qs.has('fresh')){
        localStorage.removeItem(this.key);
        this.legacyKeys.forEach(key=>localStorage.removeItem(key));
        localStorage.removeItem('veco_mobile_user_id');
        localStorage.removeItem('veco_mobile_active_tab');
      }
      let raw=localStorage.getItem(this.key);
      if(!raw){
        for(const legacyKey of this.legacyKeys){
          raw=localStorage.getItem(legacyKey);
          if(raw){ localStorage.setItem(this.key,raw); break; }
        }
      }
      return this.normalize(raw?JSON.parse(raw):window.VECO_DATA);
    }catch(e){
      console.warn('VECO localStorage load failed, using demo data',e);
      return this.normalize(window.VECO_DATA);
    }
  },
  save(data){
    const normalized=this.normalize(data);
    localStorage.setItem(this.key,JSON.stringify(normalized));
    return normalized;
  },
  reset(){
    localStorage.removeItem(this.key);
    this.legacyKeys.forEach(key=>localStorage.removeItem(key));
    return this.normalize(window.VECO_DATA);
  },
  export(){return JSON.stringify(this.load(),null,2)},
  import(json){const data=typeof json==='string'?JSON.parse(json):json;return this.save(data)}
};
