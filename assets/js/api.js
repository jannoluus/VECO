window.VECO_API={
  mode(){return localStorage.getItem('veco_supabase_url')&&localStorage.getItem('veco_supabase_key')?'supabase':'local'},
  async load(){return window.VECO_STORAGE.load()},
  async save(data){return window.VECO_STORAGE.save(data)}
};
