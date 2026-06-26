#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'assets/js/app.js'),'utf8');
const api=fs.readFileSync(path.join(root,'assets/js/api.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
let ok=true;
function check(name,pass,detail=''){
  const line=`${pass?'✅':'❌'} ${name}${detail?' — '+detail:''}`;
  console.log(line);
  if(!pass) ok=false;
}
check('APP_BUILD 20260626_0938',/APP_BUILD='20260626_0938'/.test(app));
check('HTML cache-bust 0926',!/v=20260626_(?!0926)\d+/.test(index));
check('CR-STATE-002 boot restore script olemas',index.includes('veco_boot_html_'+ 'calendar') || index.includes("veco_boot_html_"));
check('boot snapshot save funktsioon olemas',app.includes('function saveBootHtmlSnapshot'));
check('shell hydration guard olemas',app.includes('__VECO_BOOT_RESTORED__')&&app.includes('__VECO_BOOT_HYDRATED__'));
check('boot scroll default/restore olemas',app.includes('calendarDefaultScrollState')&&app.includes('forceWorkdayStart')&&app.includes('veco_boot_scroll_top_calendar'));
check('boot hydration ignoreerib snapshot scrollTop=0',app.includes('isBootHydrating?calendarDefaultScrollState():captureCalendarScrollState()'));

const problemLine=(app.match(/const problemDescriptionText=\(w=\{\}\)=>[^;]+;/)||[''])[0];
check('description enne fallbacke',problemLine.includes('w?.description'));
check('title ei ole description fallbackis',!problemLine.includes('w?.title'));
check('Supabase load salvestab merged state cache’i',api.includes('window.VECO_STORAGE.save(merged)'));
check('own realtime echo suppress olemas',api.includes('isLikelyOwnRemoteEcho'));
check('sidebar handler guard olemas',app.includes('__VECO_SIDEBAR_GLOBAL_BOUND__') || app.includes('document-level sidebar handlers only once'));
check('calendar technician badges olemas',app.includes('function techInitials')&&app.includes('calendar-tech-badge'));

process.exit(ok?0:1);
