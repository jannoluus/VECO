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
check('APP_BUILD 20260626_0955',/APP_BUILD='20260626_0955'/.test(app));
check('HTML cache-bust 0955',!/v=20260626_(?!0955)\d+/.test(index));
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
check('Technician V1 route olemas',fs.existsSync(path.join(root,'technician-v1.html')) && app.includes('function renderTechnicianV1') && app.includes('technicianV1'));
check('Legacy mobile alles',fs.existsSync(path.join(root,'mobile.html')) && fs.readFileSync(path.join(root,'mobile.html'),'utf8').includes('window.VECO_PAGE = "mobile"'));
check('Technician V1 CSS olemas',fs.readFileSync(path.join(root,'assets/css/app.css'),'utf8').includes('VECO Technician V1'));

process.exit(ok?0:1);
