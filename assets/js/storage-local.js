window.VECO_STORAGE={
  key:'veco_v3_shared_state',
  legacyKeys:['veco_v3_step2_state'],
  version:7,
  clone(value){return JSON.parse(JSON.stringify(value||{}))},
  normalize(data){
    const base=this.clone(window.VECO_DATA||{});
    const incoming=this.clone(data||{});
    const result={...base,...incoming};
    ['people','clients','objects','devices','projects','workorders','acts','absences','oncall'].forEach(key=>{
      result[key]=Array.isArray(result[key])?result[key]:[];
    });
    result._meta={...(result._meta||{}),version:this.version,updatedAt:new Date().toISOString()};
    return result;
  },
  load(){
    try{
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
