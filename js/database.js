/** Mobile Checkup DB v2 — auth_db + config_db + 6 logical DBs */
const DB={
  _get(db,t){return JSON.parse(localStorage.getItem(`${db}__${t}`)||'[]');},
  _set(db,t,d){localStorage.setItem(`${db}__${t}`,JSON.stringify(d));},
  _nextId(db,t){const r=this._get(db,t);return r.length>0?Math.max(...r.map(x=>x.id))+1:1;},
  _now(){return new Date().toISOString();},

  auth:{
    listUsers(){return DB._get('auth_db','users');},
    getUser(id){return DB._get('auth_db','users').find(r=>r.id===id)||null;},
    saveUser(data){
      const rows=DB._get('auth_db','users');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('auth_db','users');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('auth_db','users',rows);return data;
    },
    deleteUser(id){DB._set('auth_db','users',DB._get('auth_db','users').filter(r=>r.id!==id));},
    login(username,password){
      const u=DB._get('auth_db','users').find(r=>r.username===username&&r.password===password&&r.active);
      if(u)localStorage.setItem('mck_session',JSON.stringify({userId:u.id,role:u.role,name:u.name,ts:Date.now()}));
      return u||null;
    },
    logout(){localStorage.removeItem('mck_session');},
    session(){
      const s=localStorage.getItem('mck_session');
      if(!s)return null;
      const d=JSON.parse(s);
      if(Date.now()-d.ts>8*3600*1000){localStorage.removeItem('mck_session');return null;}
      return d;
    },
    listRoles(){return DB._get('auth_db','role_permissions');},
    getRolePermission(role){return DB._get('auth_db','role_permissions').find(r=>r.role===role)||null;},
    saveRolePermission(data){
      const rows=DB._get('auth_db','role_permissions');
      const i=rows.findIndex(r=>r.role===data.role);
      if(i>=0)rows[i]={...rows[i],...data,updated_at:DB._now()};
      else{data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('auth_db','role_permissions',rows);return data;
    },
    can(action,module){
      const s=this.session();if(!s)return false;
      if(s.role==='admin')return true;
      const rp=this.getRolePermission(s.role);
      if(!rp||!rp.modules)return false;
      const m=rp.modules[module];
      return !!(m&&m[action]);
    }
  },

  config:{
    get(key,def=null){const v=localStorage.getItem(`config__${key}`);return v!==null?JSON.parse(v):def;},
    set(key,val){localStorage.setItem(`config__${key}`,JSON.stringify(val));},
    getTAT(){return this.get('tat',{small:15,large:20,threshold:2000});},
    setTAT(v){this.set('tat',v);},
    getSLA(){return this.get('sla',{days_after_tat:7});},
    setSLA(v){this.set('sla',v);},
    getAlertDays(){return this.get('alert_days',3);},
    setAlertDays(v){this.set('alert_days',v);}
  },

  customer:{
    listCustomers(){return DB._get('customer_db','customers');},
    getCustomer(id){return DB._get('customer_db','customers').find(r=>r.id===id)||null;},
    saveCustomer(data){
      const rows=DB._get('customer_db','customers');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('customer_db','customers');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('customer_db','customers',rows);return data;
    },
    deleteCustomer(id){DB._set('customer_db','customers',DB._get('customer_db','customers').filter(r=>r.id!==id));},
    listSalesLogs(cid){return DB._get('customer_db','sales_logs').filter(r=>r.customer_id===cid);},
    addSalesLog(data){const rows=DB._get('customer_db','sales_logs');data.id=DB._nextId('customer_db','sales_logs');data.created_at=DB._now();rows.push(data);DB._set('customer_db','sales_logs',rows);return data;}
  },

  sales:{
    listProjects(){return DB._get('sales_db','projects');},
    getProject(id){return DB._get('sales_db','projects').find(r=>r.id===id)||null;},
    saveProject(data){
      const rows=DB._get('sales_db','projects');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('sales_db','projects');if(!data.project_code){const d=new Date();data.project_code=`MCK-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(data.id).padStart(3,'0')}`;}data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('sales_db','projects',rows);return data;
    },
    deleteProject(id){DB._set('sales_db','projects',DB._get('sales_db','projects').filter(r=>r.id!==id));},
    listHandovers(){return DB._get('sales_db','internal_handover');},
    getHandover(pid){return DB._get('sales_db','internal_handover').find(r=>r.project_id===pid)||null;},
    saveHandover(data){
      const rows=DB._get('sales_db','internal_handover');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('sales_db','internal_handover');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('sales_db','internal_handover',rows);return data;
    }
  },

  operation:{
    listJobOrders(){return DB._get('operation_db','job_orders');},
    getJobOrder(pid){return DB._get('operation_db','job_orders').find(r=>r.project_id===pid)||null;},
    getJobOrderById(id){return DB._get('operation_db','job_orders').find(r=>r.id===id)||null;},
    saveJobOrder(data){
      const rows=DB._get('operation_db','job_orders');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('operation_db','job_orders');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('operation_db','job_orders',rows);return data;
    },
    listStations(joid){return DB._get('operation_db','job_stations').filter(r=>r.job_order_id===joid);},
    saveStation(data){
      const rows=DB._get('operation_db','job_stations');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('operation_db','job_stations');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('operation_db','job_stations',rows);return data;
    },
    deleteStation(id){DB._set('operation_db','job_stations',DB._get('operation_db','job_stations').filter(r=>r.id!==id));},
    listVehicles(joid){return DB._get('operation_db','job_vehicles').filter(r=>r.job_order_id===joid);},
    saveVehicle(data){
      const rows=DB._get('operation_db','job_vehicles');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('operation_db','job_vehicles');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('operation_db','job_vehicles',rows);return data;
    },
    deleteVehicle(id){DB._set('operation_db','job_vehicles',DB._get('operation_db','job_vehicles').filter(r=>r.id!==id));},
    listOnsiteLogs(pid){return DB._get('operation_db','onsite_logs').filter(r=>r.project_id===pid);},
    saveOnsiteLog(data){
      const rows=DB._get('operation_db','onsite_logs');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('operation_db','onsite_logs');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('operation_db','onsite_logs',rows);return data;
    },
    deleteOnsiteLog(id){DB._set('operation_db','onsite_logs',DB._get('operation_db','onsite_logs').filter(r=>r.id!==id));},
    listSpecimens(pid){return DB._get('operation_db','specimen_tracking').filter(r=>r.project_id===pid);},
    saveSpecimen(data){
      const rows=DB._get('operation_db','specimen_tracking');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('operation_db','specimen_tracking');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('operation_db','specimen_tracking',rows);return data;
    }
  },

  lab:{
    listProjects(){return DB._get('lab_db','lab_projects');},
    getLabProject(pid){return DB._get('lab_db','lab_projects').find(r=>r.project_id===pid)||null;},
    saveLabProject(data){
      const rows=DB._get('lab_db','lab_projects');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('lab_db','lab_projects');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('lab_db','lab_projects',rows);return data;
    },
    listAlerts(){return DB._get('lab_db','critical_alerts');},
    listAlertsByProject(pid){return DB._get('lab_db','critical_alerts').filter(r=>r.project_id===pid);},
    saveAlert(data){const rows=DB._get('lab_db','critical_alerts');data.id=DB._nextId('lab_db','critical_alerts');data.created_at=DB._now();rows.push(data);DB._set('lab_db','critical_alerts',rows);return data;},
    ackAlert(id){const rows=DB._get('lab_db','critical_alerts');const a=rows.find(r=>r.id===id);if(a)a.acknowledged=true;DB._set('lab_db','critical_alerts',rows);},
    listQCLogs(pid){return DB._get('lab_db','qc_logs').filter(r=>r.project_id===pid);},
    saveQCLog(data){const rows=DB._get('lab_db','qc_logs');data.id=DB._nextId('lab_db','qc_logs');data.created_at=DB._now();rows.push(data);DB._set('lab_db','qc_logs',rows);return data;}
  },

  report:{
    listPlans(){return DB._get('report_db','project_plan');},
    getPlan(pid){return DB._get('report_db','project_plan').find(r=>r.project_id===pid)||null;},
    savePlan(data){
      const rows=DB._get('report_db','project_plan');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('report_db','project_plan');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('report_db','project_plan',rows);return data;
    },
    listPatients(pid){return DB._get('report_db','patient_list').filter(r=>r.project_id===pid);},
    savePatient(data){
      const rows=DB._get('report_db','patient_list');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('report_db','patient_list');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('report_db','patient_list',rows);return data;
    },
    listRawData(pid){return DB._get('report_db','raw_data').filter(r=>r.project_id===pid);},
    saveRawData(data){
      const rows=DB._get('report_db','raw_data');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('report_db','raw_data');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('report_db','raw_data',rows);return data;
    }
  },

  billing:{
    listInvoices(){return DB._get('billing_db','invoices');},
    getInvoice(pid){return DB._get('billing_db','invoices').find(r=>r.project_id===pid)||null;},
    saveInvoice(data){
      const rows=DB._get('billing_db','invoices');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('billing_db','invoices');if(!data.invoice_no){const d=new Date();data.invoice_no=`INV-${d.getFullYear()}-${String(data.id).padStart(4,'0')}`;}data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('billing_db','invoices',rows);return data;
    },
    listCostTracking(pid){return DB._get('billing_db','cost_tracking').filter(r=>r.project_id===pid);},
    saveCostItem(data){
      const rows=DB._get('billing_db','cost_tracking');
      if(data.id){const i=rows.findIndex(r=>r.id===data.id);rows[i]={...rows[i],...data,updated_at:DB._now()};}
      else{data.id=DB._nextId('billing_db','cost_tracking');data.created_at=DB._now();data.updated_at=DB._now();rows.push(data);}
      DB._set('billing_db','cost_tracking',rows);return data;
    },
    deleteCostItem(id){DB._set('billing_db','cost_tracking',DB._get('billing_db','cost_tracking').filter(r=>r.id!==id));}
  },

  checkAlerts(){
    const alerts=[];const today=new Date();
    const ad=DB.config.getAlertDays();
    DB.lab.listProjects().forEach(lp=>{
      if(!lp.tat_deadline||lp.status==='reported')return;
      const d=Math.ceil((new Date(lp.tat_deadline)-today)/86400000);
      const p=DB.sales.getProject(lp.project_id);const nm=p?p.company_name:`#${lp.project_id}`;
      if(d<0)alerts.push({type:'danger',msg:`⚠ TAT เกินกำหนด: ${nm} (${Math.abs(d)} วัน)`,project_id:lp.project_id});
      else if(d<=ad)alerts.push({type:'warning',msg:`🕐 TAT ใกล้ครบ ${d} วัน: ${nm}`,project_id:lp.project_id});
    });
    DB.report.listPlans().forEach(rp=>{
      if(!rp.sla_deadline||rp.status==='sent')return;
      const d=Math.ceil((new Date(rp.sla_deadline)-today)/86400000);
      const p=DB.sales.getProject(rp.project_id);const nm=p?p.company_name:`#${rp.project_id}`;
      if(d<0)alerts.push({type:'danger',msg:`⚠ SLA เกินกำหนด: ${nm}`,project_id:rp.project_id});
      else if(d<=ad)alerts.push({type:'warning',msg:`📋 SLA ใกล้ครบ ${d} วัน: ${nm}`,project_id:rp.project_id});
    });
    DB.lab.listAlerts().filter(a=>!a.acknowledged).forEach(a=>{
      alerts.push({type:'critical',msg:`🚨 Critical: ${a.patient_name} — ${a.test_name}=${a.value}`,project_id:a.project_id});
    });
    return alerts;
  },

  seedMockData(){
    if(DB._get('auth_db','users').length>0)return;
    DB._set('auth_db','users',[
      {id:1,username:'admin',password:'admin1234',name:'ผู้ดูแลระบบ',role:'admin',active:true,created_at:DB._now(),updated_at:DB._now()},
      {id:2,username:'sales01',password:'sales1234',name:'นางสาวพิมพ์ใจ ดีงาม',role:'sales',active:true,created_at:DB._now(),updated_at:DB._now()},
      {id:3,username:'op01',password:'op1234',name:'นายวิชัย สุขใจ',role:'operation',active:true,created_at:DB._now(),updated_at:DB._now()},
      {id:4,username:'lab01',password:'lab1234',name:'นางสาวรัตนา ใจดี',role:'lab',active:true,created_at:DB._now(),updated_at:DB._now()},
      {id:5,username:'report01',password:'rpt1234',name:'นายสมชาย วงศ์ดี',role:'report',active:true,created_at:DB._now(),updated_at:DB._now()},
      {id:6,username:'billing01',password:'bill1234',name:'นางมาลี รักไทย',role:'billing',active:true,created_at:DB._now(),updated_at:DB._now()}
    ]);
    const viewOnly={view:true,add:false,edit:false,delete:false};
    const full={view:true,add:true,edit:true,delete:true};
    const fullNoDel={view:true,add:true,edit:true,delete:false};
    const none={view:false,add:false,edit:false,delete:false};
    DB._set('auth_db','role_permissions',[
      {role:'admin',modules:{dashboard:full,customers:full,sales:full,op_prep:full,op_onsite:full,lab:full,report:full,billing:full,config:full},created_at:DB._now(),updated_at:DB._now()},
      {role:'sales',modules:{dashboard:viewOnly,customers:fullNoDel,sales:fullNoDel,op_prep:none,op_onsite:none,lab:none,report:none,billing:none,config:none},created_at:DB._now(),updated_at:DB._now()},
      {role:'operation',modules:{dashboard:viewOnly,customers:viewOnly,sales:viewOnly,op_prep:full,op_onsite:full,lab:none,report:none,billing:none,config:none},created_at:DB._now(),updated_at:DB._now()},
      {role:'lab',modules:{dashboard:viewOnly,customers:none,sales:viewOnly,op_prep:viewOnly,op_onsite:viewOnly,lab:fullNoDel,report:none,billing:none,config:none},created_at:DB._now(),updated_at:DB._now()},
      {role:'report',modules:{dashboard:viewOnly,customers:viewOnly,sales:fullNoDel,op_prep:viewOnly,op_onsite:viewOnly,lab:viewOnly,report:fullNoDel,billing:none,config:none},created_at:DB._now(),updated_at:DB._now()},
      {role:'billing',modules:{dashboard:viewOnly,customers:viewOnly,sales:viewOnly,op_prep:none,op_onsite:none,lab:none,report:viewOnly,billing:fullNoDel,config:none},created_at:DB._now(),updated_at:DB._now()}
    ]);
    DB._set('customer_db','customers',[
      {id:1,company_name:'บริษัท ABC Manufacturing จำกัด',address:'123 ถนนอุตสาหกรรม นิคมอมตะ ชลบุรี 20000',phone:'038-123456',email:'hr@abc-mfg.co.th',contact_name:'คุณสมใจ วงศ์ดี',contact_role:'HR Manager',employee_count:480,last_contact:'2025-11-01',note:'ลูกค้าประจำ ตรวจทุกปี',sales_status:'Closed',closed_at:'2025-11-05',created_at:DB._now(),updated_at:DB._now()},
      {id:2,company_name:'บริษัท XYZ Logistics จำกัด',address:'456 ถนนสุขุมวิท บางนา กรุงเทพ 10260',phone:'02-456789',email:'safety@xyz-log.co.th',contact_name:'คุณวิรัตน์ ใจดี',contact_role:'Safety Officer',employee_count:320,last_contact:'2025-11-10',note:'ราคาต่อรอง',sales_status:'Negotiation',closed_at:null,created_at:DB._now(),updated_at:DB._now()},
      {id:3,company_name:'โรงงาน TechParts Co., Ltd.',address:'789 เขตอุตสาหกรรม อ.พานทอง ชลบุรี 20160',phone:'038-789012',email:'admin@techparts.th',contact_name:'คุณมาลี รักไทย',contact_role:'Owner',employee_count:150,last_contact:'2025-10-28',note:'PKG-C ผู้บริหาร + PKG-B พนักงาน',sales_status:'Closed',closed_at:'2025-10-30',created_at:DB._now(),updated_at:DB._now()},
      {id:4,company_name:'บริษัท Green Energy จำกัด',address:'321 ถนนพระราม 9 ห้วยขวาง กรุงเทพ 10320',phone:'02-321654',email:'hr@greenenergy.co.th',contact_name:'คุณอนันต์ สุขสม',contact_role:'HR Director',employee_count:200,last_contact:'2025-11-15',note:'Prospect ใหม่',sales_status:'Follow up',closed_at:null,created_at:DB._now(),updated_at:DB._now()}
    ]);
    DB._set('customer_db','sales_logs',[
      {id:1,customer_id:1,note:'คุยโทรศัพท์ครั้งแรก สนใจ PKG-B',created_at:'2025-10-25T09:00:00.000Z'},
      {id:2,customer_id:1,note:'ส่งใบเสนอราคา PKG-B 480 คน',created_at:'2025-10-28T14:00:00.000Z'},
      {id:3,customer_id:1,note:'ปิดการขาย ยืนยันวันออกตรวจ 15 ธ.ค.',created_at:'2025-11-05T10:30:00.000Z'}
    ]);
    DB._set('sales_db','projects',[
      {id:1,project_code:'MCK-20251115-001',customer_id:1,company_name:'บริษัท ABC Manufacturing จำกัด',package_code:'PKG-B',package_name:'อาชีวอนามัย + Lab',headcount:480,onsite_date:'2025-12-15',onsite_time:'07:00',onsite_time_end:'16:00',location:'โรงงาน ABC นิคมอมตะ ชลบุรี',coordinator_name:'คุณสมใจ วงศ์ดี',coordinator_phone:'038-123456',status:'Report',created_by:'นางสาวพิมพ์ใจ',created_at:'2025-11-15T08:00:00.000Z',updated_at:DB._now()},
      {id:2,project_code:'MCK-20251030-002',customer_id:3,company_name:'โรงงาน TechParts Co., Ltd.',package_code:'PKG-B/C',package_name:'PKG-C+PKG-B',headcount:150,onsite_date:'2025-11-20',onsite_time:'08:00',onsite_time_end:'15:00',location:'โรงงาน TechParts พานทอง ชลบุรี',coordinator_name:'คุณมาลี รักไทย',coordinator_phone:'038-789012',status:'Lab',created_by:'นายสมชาย',created_at:'2025-10-30T09:00:00.000Z',updated_at:DB._now()}
    ]);
    DB._set('sales_db','internal_handover',[
      {id:1,project_id:1,layout_file:'Layout_ABC_20251215.pdf',name_list_file:'รายชื่อ_ABC_480คน.xlsx',quotation_file:'QT-2025-0123.pdf',conditions:'แยกผลตรวจแพทย์',sent_at:'2025-11-15T08:30:00.000Z',created_at:'2025-11-15T08:30:00.000Z',updated_at:DB._now()},
      {id:2,project_id:2,layout_file:'Layout_TechParts_20251120.pdf',name_list_file:'รายชื่อ_TechParts_150คน.xlsx',quotation_file:'QT-2025-0098.pdf',conditions:'PKG-C เสร็จก่อนบ่าย',sent_at:'2025-10-30T10:00:00.000Z',created_at:'2025-10-30T10:00:00.000Z',updated_at:DB._now()}
    ]);
    DB._set('operation_db','job_orders',[
      {id:1,project_id:1,company_name:'บริษัท ABC Manufacturing จำกัด',location:'โรงงาน ABC นิคมอมตะ ชลบุรี',onsite_date:'2025-12-15',headcount:480,depart_time:'05:30',start_time:'07:00',end_time:'16:00',director:'ผอ.วิชัย สุขสม',job_type:'ตรวจสุขภาพ',shift:'เช้า',remark:'จอดรถหน้าโรงงาน A',signer_creator:'นายวิชัย สุขใจ',signer_head:'หน.สมศักดิ์ ใจดี',signer_hr:'HR สมใจ วงศ์ดี',status:'Confirmed',created_at:'2025-11-17T09:00:00.000Z',updated_at:DB._now()},
      {id:2,project_id:2,company_name:'โรงงาน TechParts Co., Ltd.',location:'โรงงาน TechParts พานทอง',onsite_date:'2025-11-20',headcount:150,depart_time:'06:00',start_time:'08:00',end_time:'15:00',director:'ผอ.วิชัย สุขสม',job_type:'ตรวจสุขภาพ',shift:'เช้า',remark:'',signer_creator:'นายวิชัย สุขใจ',signer_head:'หน.สมศักดิ์ ใจดี',signer_hr:'HR มาลี รักไทย',status:'Completed',created_at:'2025-11-01T08:00:00.000Z',updated_at:DB._now()}
    ]);
    DB._set('operation_db','job_stations',[
      {id:1,job_order_id:1,order_no:1,station_code:'ST-01',station_name:'ลงทะเบียน',staff_count:2,profession:'เจ้าหน้าที่',staff_name:'นางสาวมณี แสงทอง',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:2,job_order_id:1,order_no:2,station_code:'ST-03',station_name:'ชั่งน้ำหนัก & วัดส่วนสูง',staff_count:1,profession:'เจ้าหน้าที่',staff_name:'นายสมชาย ทองดี',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:3,job_order_id:1,order_no:3,station_code:'ST-04',station_name:'ซักประวัติ & วัดความดัน',staff_count:2,profession:'RN',staff_name:'นางสาวรัตนา ใจดี',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:4,job_order_id:1,order_no:4,station_code:'ST-05',station_name:'เจาะเลือด',staff_count:3,profession:'MT',staff_name:'นายสุรชัย วงศ์ดี',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:5,job_order_id:1,order_no:5,station_code:'ST-14',station_name:'เอกซเรย์ Digital',staff_count:2,profession:'เจ้าหน้าที่ ใบ Cer',staff_name:'นายอนันต์ สุขสม',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:6,job_order_id:1,order_no:6,station_code:'ST-16',station_name:'แพทย์ผู้ตรวจ',staff_count:1,profession:'แพทย์',staff_name:'นพ.วิชัย สุขใจ',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:7,job_order_id:1,order_no:7,station_code:'ST-17',station_name:'คืนเอกสาร',staff_count:1,profession:'เจ้าหน้าที่',staff_name:'นางสาวพิมพ์ใจ ดีงาม',staff_type:'Part-time',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:8,job_order_id:2,order_no:1,station_code:'ST-01',station_name:'ลงทะเบียน',staff_count:1,profession:'เจ้าหน้าที่',staff_name:'นางสาวมณี',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:9,job_order_id:2,order_no:2,station_code:'ST-05',station_name:'เจาะเลือด',staff_count:2,profession:'MT',staff_name:'นายสุรชัย',staff_type:'ในองค์กร',remark:'',created_at:DB._now(),updated_at:DB._now()}
    ]);
    DB._set('operation_db','job_vehicles',[
      {id:1,job_order_id:1,order_no:1,vehicle_name:'รถยนต์กะบะขาว',staff_type:'ในองค์กร',responsible_name:'นายสมชาย ทองดี',phone:'081-234-5678',remark:'',created_at:DB._now(),updated_at:DB._now()},
      {id:2,job_order_id:1,order_no:2,vehicle_name:'รถ Xray ขาว',staff_type:'ในองค์กร',responsible_name:'นายอนันต์ สุขสม',phone:'089-876-5432',remark:'',created_at:DB._now(),updated_at:DB._now()}
    ]);
    DB._set('operation_db','onsite_logs',[
      {id:1,project_id:1,station_code:'ST-01',station_name:'ลงทะเบียน',total_expected:480,total_done:472,missing:5,refused:3,note:'มีพนักงานลา 5 คน',created_at:'2025-12-15T16:30:00.000Z',updated_at:DB._now()},
      {id:2,project_id:2,station_code:'รวม',station_name:'รวมทุก Station',total_expected:150,total_done:148,missing:1,refused:1,note:'ครบเกือบทั้งหมด',created_at:'2025-11-20T15:00:00.000Z',updated_at:DB._now()}
    ]);
    DB._set('operation_db','specimen_tracking',[
      {id:1,project_id:1,barcode:'SPC-2025-00001',type:'เลือด',collected_at:'2025-12-15T08:00:00.000Z',sent_to_lab_at:'2025-12-15T17:00:00.000Z',qc_status:'ผ่าน',temperature:'4°C',created_at:DB._now(),updated_at:DB._now()}
    ]);
    const today=new Date();
    const t1=new Date(today);t1.setDate(t1.getDate()+2);
    const t2=new Date(today);t2.setDate(t2.getDate()+8);
    DB._set('lab_db','lab_projects',[
      {id:1,project_id:1,received_at:'2025-12-15T18:00:00.000Z',approved_at:null,reported_at:null,headcount:472,tat_days:15,tat_deadline:t1.toISOString(),status:'analyzing',created_at:DB._now(),updated_at:DB._now()},
      {id:2,project_id:2,received_at:'2025-11-20T17:00:00.000Z',approved_at:'2025-11-28T10:00:00.000Z',reported_at:'2025-11-29T09:00:00.000Z',headcount:148,tat_days:9,tat_deadline:t2.toISOString(),status:'reported',created_at:DB._now(),updated_at:DB._now()}
    ]);
    DB._set('lab_db','critical_alerts',[{id:1,project_id:1,hn:'HN001234',patient_name:'นายกิตติ สมบูรณ์',test_name:'FBS',value:'420 mg/dL',normal_range:'70-100 mg/dL',note:'ค่าสูงวิกฤต',acknowledged:false,alerted_at:DB._now(),created_at:DB._now()}]);
    DB._set('lab_db','qc_logs',[{id:1,project_id:1,qc_type:'รับตัวอย่าง',result:'ผ่าน',note:'472 ราย 4°C',created_at:'2025-12-15T18:30:00.000Z'}]);
    const s1=new Date(today);s1.setDate(s1.getDate()+4);
    DB._set('report_db','project_plan',[
      {id:1,project_id:1,program_code:'PKG-B',headcount:472,onsite_date:'2025-12-15',created_by:'นางสาวพิมพ์ใจ',verified_by:'นายสมชาย',tat_deadline:t1.toISOString(),sla_deadline:s1.toISOString(),status:'interpreting',sent_at:null,created_at:'2025-12-16T09:00:00.000Z',updated_at:DB._now()},
      {id:2,project_id:2,program_code:'PKG-B/C',headcount:148,onsite_date:'2025-11-20',created_by:'นายสมชาย',verified_by:'นางสาวพิมพ์ใจ',tat_deadline:t2.toISOString(),sla_deadline:t2.toISOString(),status:'sent',sent_at:'2025-12-01T10:00:00.000Z',created_at:'2025-11-21T09:00:00.000Z',updated_at:DB._now()}
    ]);
    const pts=[];const fn=['สมชาย','สมหญิง','วิชัย','มาลี','อนันต์','รัตนา','สุรชัย','มณี','กิตติ','วิรัตน์'];const ln=['สุขใจ','วงศ์ดี','ใจดี','รักไทย','สมบูรณ์','แสงทอง','ทองดี','ศรีสุข','พรมมา','บุญมา'];
    for(let i=1;i<=20;i++)pts.push({id:i,project_id:1,hn:`HN${String(i).padStart(6,'0')}`,name:`นาย${fn[i%10]} ${ln[(i+3)%10]}`,dob:`${1970+(i%20)}-${String((i%12)+1).padStart(2,'0')}-15`,gender:i%3===0?'หญิง':'ชาย',department:`แผนก ${String.fromCharCode(64+(i%8)+1)}`,package:'PKG-B',status:i<=15?'complete':'pending',created_at:DB._now(),updated_at:DB._now()});
    DB._set('report_db','patient_list',pts);
    DB._set('report_db','raw_data',[{id:1,project_id:1,hn:'HN000001',weight:72,height:170,bmi:24.9,bp_sys:125,bp_dia:82,pulse:78,fbs:95,cholesterol:210,created_at:DB._now(),updated_at:DB._now()}]);
    DB._set('billing_db','invoices',[
      {id:1,project_id:1,invoice_no:'INV-2025-0001',revenue:566400,vat:39648,total:606048,cost:320000,profit:246400,margin:43.5,payment_terms:'ชำระภายใน 30 วัน',status:'Pending',issued_at:'2025-12-20T09:00:00.000Z',created_at:DB._now(),updated_at:DB._now()},
      {id:2,project_id:2,invoice_no:'INV-2025-0002',revenue:247500,vat:17325,total:264825,cost:140000,profit:107500,margin:43.4,payment_terms:'ชำระภายใน 30 วัน',status:'Paid',issued_at:'2025-12-05T09:00:00.000Z',created_at:DB._now(),updated_at:DB._now()}
    ]);
    DB._set('billing_db','cost_tracking',[
      {id:1,project_id:1,category:'Lab',description:'ค่าวิเคราะห์ Lab 472 ราย',amount:189000,created_at:DB._now(),updated_at:DB._now()},
      {id:2,project_id:1,category:'บุคลากร',description:'ค่าแพทย์+พยาบาล+MT',amount:35000,created_at:DB._now(),updated_at:DB._now()},
      {id:3,project_id:1,category:'อุปกรณ์',description:'อุปกรณ์เจาะเลือด',amount:28000,created_at:DB._now(),updated_at:DB._now()},
      {id:4,project_id:1,category:'X-Ray',description:'ค่า X-Ray 472 ราย',amount:56000,created_at:DB._now(),updated_at:DB._now()},
      {id:5,project_id:1,category:'ขนส่ง',description:'ค่าเดินทาง+Specimen',amount:12000,created_at:DB._now(),updated_at:DB._now()}
    ]);
    console.log('✅ Seed done');
  }
};
window.DB=DB;
