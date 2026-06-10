window.VECO_DATA={
  people:[
    {id:'U-JANNO',name:'Janno',role:'Admin',phone:'',email:'janno@veco.ee',region:'Tallinn / Harjumaa',skills:'Hooldusjuht, planeerimine',active:true,onCallActive:false,onCallOrder:1},
    {id:'U-ALEKSEI',name:'Aleksei',role:'Tehnik',phone:'+372 5551 1001',email:'aleksei@veco.ee',region:'Tallinn',skills:'HVAC, automaatika',active:true,onCallActive:false,onCallOrder:2},
    {id:'U-RICHARD',name:'Richard Pärni',role:'Tehnik',phone:'',email:'',region:'Tallinn / Harjumaa',skills:'',active:true,onCallActive:true,onCallOrder:1},
    {id:'U-ROMET',name:'Romet Liiv',role:'Tehnik',phone:'',email:'',region:'Tallinn / Harjumaa',skills:'',active:true,onCallActive:true,onCallOrder:2},
    {id:'U-SERGEI',name:'Sergei Sokolov',role:'Tehnik',phone:'',email:'',region:'Tallinn / Harjumaa',skills:'',active:true,onCallActive:true,onCallOrder:3},
    {id:'U-ARTEM',name:'Artem Kalenjuk',role:'Tehnik',phone:'',email:'',region:'Tallinn / Harjumaa',skills:'',active:true,onCallActive:false,onCallOrder:4}
  ],
  clients:[
    {id:'C-01',name:'OÜ Vamos Automaatika',regNo:'12345678',contact:'Aleksei',phone:'+372 5551 2211',email:'vamos@example.ee',invoiceEmail:'arved@vamos.ee',active:true,notes:'Peamine hooldusklient. Aiandi 13A objekt ja seotud hooldusprojektid.'},
    {id:'C-02',name:'OÜ Kapitel Logistics',regNo:'11223344',contact:'Kaur Lepp',phone:'+372 5666 9080',email:'kaur@kapitel.ee',invoiceEmail:'invoice@kapitel.ee',active:true,notes:'Logistika- ja laohooned. Vana-Narva maantee objektid.'},
    {id:'C-03',name:'Bauhof Group AS',regNo:'10998877',contact:'Liina Saar',phone:'+372 5888 1020',email:'liina@bauhof.ee',invoiceEmail:'raamatupidamine@bauhof.ee',active:true,notes:'Väiksemad hooldused ja remondid.'}
  ],
  objects:[
    {id:'O-01',clientId:'C-01',name:'Aiandi 13A',address:'Aiandi 13A, Tallinn',mainContact:'Aleksei',responsibleTechId:'U-JANNO',contract:'Jah',status:'active',notes:'Fookusobjekt. Ventilatsioon, jahutus ja hoolduskava tööd.',contacts:[{name:'Aleksei',role:'Objekti kontakt',phone:'+372 5551 2211',email:'aleksei@example.ee'}]},
    {id:'O-02',clientId:'C-02',name:'Vana-Narva mnt 30/1',address:'Vana-Narva maantee 30/1, Maardu',mainContact:'Kaur Lepp',responsibleTechId:'U-JANNO',contract:'Jah',status:'active',notes:'Elektrikäidu ja tehnosüsteemide hooldustööd.',contacts:[{name:'Kaur Lepp',role:'Haldur',phone:'+372 5666 9080',email:'kaur@kapitel.ee'}]},
    {id:'O-03',clientId:'C-03',name:'Bauhof',address:'Tallinn / Harjumaa',mainContact:'Liina Saar',responsibleTechId:'U-ALEKSEI',contract:'Ei',status:'active',notes:'Väike hulk hooldusi ja üks remonditöö.',contacts:[{name:'Liina Saar',role:'Kontakt',phone:'+372 5888 1020',email:'liina@bauhof.ee'}]}
  ],
  devices:[
    {id:'D-01',objectId:'O-01',name:'AHU-JANNO',type:'Ventilatsiooniseade',location:'Katus',serviceInterval:'Poolaasta',status:'ok'},
    {id:'D-02',objectId:'O-01',name:'AHU-ALEKSEI',type:'Ventilatsiooniseade',location:'Katus',serviceInterval:'Poolaasta',status:'ok'},
    {id:'D-03',objectId:'O-01',name:'CH-01',type:'Jahutusmasin',location:'Tehnoruum',serviceInterval:'Kvartal',status:'attention'},
    {id:'D-04',objectId:'O-02',name:'RVK grupid',type:'Elektrikäit',location:'Jaotuskeskused',serviceInterval:'Kuu',status:'ok'},
    {id:'D-05',objectId:'O-02',name:'Turvavalgustus',type:'Elektrikäit',location:'Hoone',serviceInterval:'Kuu',status:'ok'},
    {id:'D-06',objectId:'O-03',name:'Split süsteem',type:'Jahutus',location:'Müügisaal',serviceInterval:'Aasta',status:'attention'}
  ],
  projects:[
    {id:'PRJ-01',objectId:'O-01',name:'Ventilatsiooni hooldus 2026',responsibleTechId:'U-JANNO',status:'Töös',deadline:'2026-06-30',description:'Poolaasta hooldused, filtrid, rihmad ja automaatika kontroll.'},
    {id:'PRJ-02',objectId:'O-01',name:'Jahutustorustike isolatsiooni taastamine',responsibleTechId:'U-JANNO',status:'Töös',deadline:'2026-06-12',description:'Katuse jahutustorustike isolatsiooni kahjustuste kaardistus ja taastamine.'},
    {id:'PRJ-03',objectId:'O-02',name:'Elektrikäidu kuu hooldus',responsibleTechId:'U-JANNO',status:'Planeeritud',deadline:'2026-06-10',description:'RVK test, turvavalgustus ja jaotuskeskuste kontroll.'},
    {id:'PRJ-04',objectId:'O-03',name:'Jahutuse remont',responsibleTechId:'U-ALEKSEI',status:'Ootel',deadline:'2026-06-14',description:'Remonditöö ja hoolduste koondamine ühele päevale.'}
  ],
  workorders:[
    {id:'WO-001',projectId:'PRJ-01',objectId:'O-01',title:'Ventilatsiooni poolaasta hooldus',date:'2026-06-03',time:'09:00',technicianId:'U-RICHARD',responsibleTechnicianId:'U-RICHARD',participantTechnicianIds:['U-ALEKSEI'],status:'Planeeritud',description:'AHU seadmete hooldus ja filtrite kontroll.'},
    {id:'WO-002',projectId:'PRJ-02',objectId:'O-01',title:'Isolatsiooni kahjustuste taastamine',date:'2026-06-03',time:'11:00',technicianId:'U-RICHARD',responsibleTechnicianId:'U-RICHARD',participantTechnicianIds:[],status:'Töös',description:'Katuse torustike isolatsiooni taastamine.'},
    {id:'WO-003',projectId:'PRJ-03',objectId:'O-02',title:'RVK kuu test ja turvavalgustus',date:'2026-06-04',time:'09:00',technicianId:'U-JANNO',responsibleTechnicianId:'U-JANNO',participantTechnicianIds:[],status:'Planeeritud',description:'Elektrikäidu kuu kontroll.'},
    {id:'WO-004',projectId:'PRJ-04',objectId:'O-03',title:'Jahutuse remont ja hooldus',date:'2026-06-05',time:'09:00',technicianId:'U-ALEKSEI',responsibleTechnicianId:'U-ALEKSEI',participantTechnicianIds:['U-ROMET'],status:'Ootel',description:'Remont võtab ligikaudu terve päeva.'}
  ],
  acts:[
    {id:'ACT-001',workorderId:'WO-001',objectId:'O-01',date:'2026-06-03',title:'Ventilatsiooni hooldusakt',status:'Mustand'},
    {id:'ACT-002',workorderId:'WO-003',objectId:'O-02',date:'2026-06-04',title:'Elektrikäidu kontrollakt',status:'Mustand'}
  ],
  absences:[
    {id:'EV-01',personId:'U-ALEKSEI',type:'Puhkus',start:'2026-06-18',end:'2026-06-22',note:'Kevadine puhkus'},
    {id:'EV-02',personId:'U-SERGEI',type:'Koolitus',start:'2026-06-15',end:'2026-06-15',note:'Automaatika täiendkoolitus'}
  ],
  oncall:[
    {id:'OC-01',personId:'U-JANNO',start:'2026-06-01',end:'2026-06-07',note:'Telefonivalve'},
    {id:'OC-02',personId:'U-RICHARD',start:'2026-06-08',end:'2026-06-14',note:'Telefonivalve'}
  ],
  maintenanceNorms:[
    {id:'MN-001',type:'Vent TH',level:'Kontroll',hours:1,active:true,notes:'Kiire ülevaatus ja põhilised kontrollid.'},
    {id:'MN-002',type:'Vent TH',level:'Hooldus',hours:2,active:true,notes:'Standardne ventilatsiooni tehnohooldus.'},
    {id:'MN-003',type:'Vent TH',level:'Aastahooldus',hours:4,active:true,notes:'Põhjalikum hooldus, filtrid ja lisatööde potentsiaali kaardistus.'},
    {id:'MN-004',type:'Jahutus TH',level:'Kontroll',hours:1,active:true,notes:'Kiire tööparameetrite kontroll.'},
    {id:'MN-005',type:'Jahutus TH',level:'Hooldus',hours:2,active:true,notes:'Standardne jahutusseadme hooldus.'},
    {id:'MN-006',type:'Jahutus TH',level:'Aastahooldus',hours:4,active:true,notes:'Põhjalikum hooldus ja remondivajaduste kaardistus.'},
    {id:'MN-007',type:'Elektrikäit',level:'Kontroll',hours:1,active:true,notes:'Kiire kontroll või kuu test.'},
    {id:'MN-008',type:'Elektrikäit',level:'Hooldus',hours:2,active:true,notes:'Standardne elektrikäidu hooldus.'},
    {id:'MN-009',type:'Elektrikäit',level:'Aastahooldus',hours:4,active:true,notes:'Põhjalikum kontroll ja dokumenteerimine.'},
    {id:'MN-010',type:'VK',level:'Kontroll',hours:1,active:true,notes:'Kiire VK kontroll.'},
    {id:'MN-011',type:'VK',level:'Hooldus',hours:2,active:true,notes:'Standardne VK hooldus.'},
    {id:'MN-012',type:'VK',level:'Aastahooldus',hours:4,active:true,notes:'Põhjalikum hooldus ja lisatööde kaardistus.'}
  ],
  maintenanceProfiles:[
    {id:'MP-001',deviceId:'D-01',type:'Vent TH',level:'Hooldus',frequency:'Poolaasta',hoursOverride:0,active:true,notes:'Demo: AHU hooldusprofiil'},
    {id:'MP-002',deviceId:'D-02',type:'Vent TH',level:'Hooldus',frequency:'Poolaasta',hoursOverride:0,active:true,notes:'Demo: AHU hooldusprofiil'},
    {id:'MP-003',deviceId:'D-03',type:'Jahutus TH',level:'Hooldus',frequency:'Aasta',hoursOverride:0,active:true,notes:'Demo: jahutusmasina hooldusprofiil'},
    {id:'MP-004',deviceId:'D-04',type:'Elektrikäit',level:'Kontroll',frequency:'Kuu',hoursOverride:0,active:true,notes:'Demo: RVK kuu kontroll'},
    {id:'MP-005',deviceId:'D-05',type:'Elektrikäit',level:'Kontroll',frequency:'Kuu',hoursOverride:0,active:true,notes:'Demo: turvavalgustuse kontroll'},
    {id:'MP-006',deviceId:'D-06',type:'Jahutus TH',level:'Hooldus',frequency:'Aasta',hoursOverride:0,active:true,notes:'Demo: split süsteemi hooldus'}
  ],
  granlundClassifiers:[
    {id:'GCL-001',pattern:'PA hooldus',type:'Vent TH',level:'Hooldus',exclude:false,active:true,notes:'Ventilatsiooniseadme poolaasta hooldus'},
    {id:'GCL-002',pattern:'filtrite vahetus',type:'Vent TH',level:'Hooldus',exclude:false,active:true,notes:'Filtrivahetus käsitletakse esialgu hooldusena'},
    {id:'GCL-003',pattern:'Ventilatsioonisüsteemi aastahooldus',type:'Vent TH',level:'Aastahooldus',exclude:false,active:true,notes:'Objekti ventilatsiooni aastahooldus'},
    {id:'GCL-004',pattern:'Jahutussüsteemi aasta hooldus',type:'Jahutus TH',level:'Aastahooldus',exclude:false,active:true,notes:'Jahutuse aastahooldus'},
    {id:'GCL-005',pattern:'Veesõlme',type:'VK',level:'Hooldus',exclude:false,active:true,notes:'VK hooldus'},
    {id:'GCL-006',pattern:'Kaevude',type:'VK',level:'Hooldus',exclude:false,active:true,notes:'VK välisvõrk'},
    {id:'GCL-007',pattern:'Liiva-, mudapüüdurite',type:'VK',level:'Hooldus',exclude:false,active:true,notes:'VK püüdurid'},
    {id:'GCL-008',pattern:'Sadevee',type:'VK',level:'Hooldus',exclude:false,active:true,notes:'Sadevee hooldus'},
    {id:'GCL-009',pattern:'RVK kuu test',type:'Elektrikäit',level:'Kontroll',exclude:false,active:true,notes:'Elektrikäidu kuu kontroll'},
    {id:'GCL-010',pattern:'Hädavalgustuse kuu',type:'Elektrikäit',level:'Kontroll',exclude:false,active:true,notes:'Turvavalgustuse kuu kontroll'},
    {id:'GCL-011',pattern:'ATS',type:'Muu',level:'Kontroll',exclude:true,active:true,notes:'Välistatav allhankija / Firetek'},
    {id:'GCL-012',pattern:'Firetek',type:'Muu',level:'Kontroll',exclude:true,active:true,notes:'Välistatav allhankija'}
  ]
};
