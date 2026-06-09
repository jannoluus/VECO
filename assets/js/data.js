window.VECO_DATA={
  people:[
    {id:'U-JANNO',name:'Janno',role:'Admin',phone:'',email:'janno@veco.ee',region:'Tallinn / Harjumaa',skills:'Hooldusjuht, planeerimine',active:true,onCallActive:true,onCallOrder:1},
    {id:'U-ALEKSEI',name:'Aleksei',role:'Tehnik',phone:'+372 5551 1001',email:'aleksei@veco.ee',region:'Tallinn',skills:'HVAC, automaatika',active:true,onCallActive:false,onCallOrder:2},
    {id:'U-DEMO',name:'DEMO',role:'Demo',phone:'',email:'demo@veco.ee',region:'Test',skills:'Demo kasutaja',active:true,onCallActive:true,onCallOrder:3}
  ],
  clients:[
    {id:'C-01',name:'OÜ Vamos Automaatika',regNo:'12345678',contact:'Aleksei',phone:'+372 5551 2211',email:'vamos@example.ee',invoiceEmail:'arved@vamos.ee',active:true,notes:'Peamine hooldusklient. Aiandi 13A objekt ja seotud hooldusprojektid.'},
    {id:'C-02',name:'OÜ Kapitel Logistics',regNo:'11223344',contact:'Kaur Lepp',phone:'+372 5666 9080',email:'kaur@kapitel.ee',invoiceEmail:'invoice@kapitel.ee',active:true,notes:'Logistika- ja laohooned. Vana-Narva maantee objektid.'},
    {id:'C-03',name:'Bauhof Group AS',regNo:'10998877',contact:'Liina Saar',phone:'+372 5888 1020',email:'liina@bauhof.ee',invoiceEmail:'raamatupidamine@bauhof.ee',active:true,notes:'Väiksemad hooldused ja remondid.'}
  ],
  objects:[
    {id:'O-01',clientId:'C-01',name:'Aiandi 13A',address:'Aiandi 13A, Tallinn',mainContact:'Aleksei',responsibleTechId:'U-DEMO',contract:'Jah',status:'active',notes:'Fookusobjekt. Ventilatsioon, jahutus ja hoolduskava tööd.',contacts:[{name:'Aleksei',role:'Objekti kontakt',phone:'+372 5551 2211',email:'aleksei@example.ee'}]},
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
    {id:'PRJ-01',objectId:'O-01',name:'Ventilatsiooni hooldus 2026',responsibleTechId:'U-DEMO',status:'Töös',deadline:'2026-06-30',description:'Poolaasta hooldused, filtrid, rihmad ja automaatika kontroll.'},
    {id:'PRJ-02',objectId:'O-01',name:'Jahutustorustike isolatsiooni taastamine',responsibleTechId:'U-DEMO',status:'Töös',deadline:'2026-06-12',description:'Katuse jahutustorustike isolatsiooni kahjustuste kaardistus ja taastamine.'},
    {id:'PRJ-03',objectId:'O-02',name:'Elektrikäidu kuu hooldus',responsibleTechId:'U-JANNO',status:'Planeeritud',deadline:'2026-06-10',description:'RVK test, turvavalgustus ja jaotuskeskuste kontroll.'},
    {id:'PRJ-04',objectId:'O-03',name:'Jahutuse remont',responsibleTechId:'U-ALEKSEI',status:'Ootel',deadline:'2026-06-14',description:'Remonditöö ja hoolduste koondamine ühele päevale.'}
  ],
  workorders:[
    {id:'WO-001',projectId:'PRJ-01',objectId:'O-01',title:'Ventilatsiooni poolaasta hooldus',date:'2026-06-03',time:'09:00',technicianId:'U-DEMO',responsibleTechnicianId:'U-DEMO',participantTechnicianIds:['U-ALEKSEI'],status:'Planeeritud',description:'AHU seadmete hooldus ja filtrite kontroll.'},
    {id:'WO-002',projectId:'PRJ-02',objectId:'O-01',title:'Isolatsiooni kahjustuste taastamine',date:'2026-06-03',time:'11:00',technicianId:'U-DEMO',responsibleTechnicianId:'U-DEMO',participantTechnicianIds:[],status:'Töös',description:'Katuse torustike isolatsiooni taastamine.'},
    {id:'WO-003',projectId:'PRJ-03',objectId:'O-02',title:'RVK kuu test ja turvavalgustus',date:'2026-06-04',time:'09:00',technicianId:'U-JANNO',responsibleTechnicianId:'U-JANNO',participantTechnicianIds:[],status:'Planeeritud',description:'Elektrikäidu kuu kontroll.'},
    {id:'WO-004',projectId:'PRJ-04',objectId:'O-03',title:'Jahutuse remont ja hooldus',date:'2026-06-05',time:'09:00',technicianId:'U-ALEKSEI',responsibleTechnicianId:'U-ALEKSEI',participantTechnicianIds:['U-DEMO'],status:'Ootel',description:'Remont võtab ligikaudu terve päeva.'}
  ],
  acts:[
    {id:'ACT-001',workorderId:'WO-001',objectId:'O-01',date:'2026-06-03',title:'Ventilatsiooni hooldusakt',status:'Mustand'},
    {id:'ACT-002',workorderId:'WO-003',objectId:'O-02',date:'2026-06-04',title:'Elektrikäidu kontrollakt',status:'Mustand'}
  ],
  absences:[
    {id:'EV-01',personId:'U-ALEKSEI',type:'Puhkus',start:'2026-06-18',end:'2026-06-22',note:'Kevadine puhkus'},
    {id:'EV-02',personId:'U-DEMO',type:'Koolitus',start:'2026-06-15',end:'2026-06-15',note:'Automaatika täiendkoolitus'}
  ],
  oncall:[
    {id:'OC-01',personId:'U-JANNO',start:'2026-06-01',end:'2026-06-07',note:'Telefonivalve'},
    {id:'OC-02',personId:'U-DEMO',start:'2026-06-08',end:'2026-06-14',note:'Telefonivalve'}
  ]
};
