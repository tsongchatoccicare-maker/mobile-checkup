/* Mobile Checkup App v2 */
/* ===== CONSTANTS ===== */
const STATIONS=[
  {code:'ST-01',name:'ลงทะเบียน'},{code:'ST-02',name:'ตรวจเพิ่ม'},{code:'ST-03',name:'ชั่งน้ำหนัก & วัดส่วนสูง'},
  {code:'ST-04',name:'ซักประวัติ & วัดความดัน'},{code:'ST-05',name:'เจาะเลือด'},{code:'ST-06',name:'ฉีดวัคซีน'},
  {code:'ST-07',name:'ปัสสาวะ/อุจจาระ'},{code:'ST-08',name:'สมรรถภาพการได้ยิน'},{code:'ST-09',name:'สมรรถภาพกล้ามเนื้อมือและแขน'},
  {code:'ST-10',name:'สมรรถภาพกล้ามเนื้อขาและหลัง'},{code:'ST-11',name:'สมรรถภาพปอด'},{code:'ST-12',name:'คลื่นไฟฟ้าหัวใจ'},
  {code:'ST-13',name:'ตรวจสายตาคอม/ตาบอดสี'},{code:'ST-14',name:'เอกซเรย์ Digital'},{code:'ST-15',name:'รันคิวแพทย์'},
  {code:'ST-16',name:'แพทย์ผู้ตรวจ'},{code:'ST-17',name:'คืนเอกสาร'},{code:'ST-18',name:'อื่นๆ'}
];
const JOB_TYPES=['ตรวจสุขภาพ','OS XRAY','ตรวจซ้ำ','เก็บอาหาร ตย','อบรม First Aid','Consult','อื่นๆ'];
const VEHICLES=['รถยนต์กะบะขาว','รถยนต์กะบะทึบ','รถ Xray ขาว','รถ Xray เขียว','รถตรวจการได้ยิน','เช่ารถตู้'];
const PROFESSIONS=['เจ้าหน้าที่','RN','MT','แพทย์','เจ้าหน้าที่ ใบ Cer','อื่นๆ'];
const STAFF_TYPES=['ในองค์กร','Part-time','Out Source'];
const STATUS_FLOW=['Prospect','Closed','Onsite','Lab','Report','Billing','Completed'];
const MODULES={dashboard:'Dashboard',customers:'CRM',sales:'Sales',op_prep:'Operation-Prep',op_onsite:'Operation-Onsite',lab:'Lab',report:'Report',billing:'Billing',config:'Config'};
const MODULES={dashboard:'Dashboard',navi_calendar:'Navi Calendar',customers:'CRM',sales:'Sales',op_prep:'Operation-Prep',op_onsite:'Operation-Onsite',lab:'Lab',report:'Report',billing:'Billing',config:'Config'};
const PAGE_PERMISSIONS={navi_calendar:'dashboard'};

/* ===== UTILS ===== */
const U={
  fmt:n=>Number(n||0).toLocaleString('th-TH'),
  fmtD:s=>{if(!s)return'-';const d=new Date(s);return d.toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric'});},
  fmtDT:s=>{if(!s)return'-';const d=new Date(s);return d.toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric'})+' '+d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});},
  daysLeft:d=>d?Math.ceil((new Date(d)-new Date())/86400000):null,
  badge(s){const m={'Prospect':'b-prospect','Follow up':'b-follow','Negotiation':'b-nego','Closed':'b-closed','Onsite':'b-onsite','Lab':'b-lab','Report':'b-report','Billing':'b-billing','Completed':'b-completed','Pending':'b-pending','Paid':'b-paid','analyzing':'b-analyzing','reported':'b-closed','sent':'b-completed','interpreting':'b-interpreting','Confirmed':'b-confirmed','Completed':'b-completed','Draft':'b-draft'};return`<span class="badge ${m[s]||'b-pending'}">${s}</span>`;},
  tatBadge(d){const n=this.daysLeft(d);if(n===null)return'<span class="badge b-pending">ไม่ระบุ</span>';if(n<0)return`<span class="badge b-danger">เกิน ${Math.abs(n)} วัน</span>`;if(n<=3)return`<span class="badge" style="background:#FEF5E7;color:#D35400;">⚠ ${n} วัน</span>`;return`<span class="badge b-closed">${n} วัน</span>`;},
  toast(msg,t='success'){const el=document.createElement('div');el.className=`ab ${t}`;el.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;min-width:280px;box-shadow:0 4px 12px rgba(0,0,0,.15);';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200);},
  confirm:msg=>window.confirm(msg),
  esc:s=>String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
  sel:(opts,val,placeholder='-- เลือก --')=>`<option value="">${placeholder}</option>`+opts.map(o=>typeof o==='object'?`<option value="${o.v}" ${o.v==val?'selected':''}>${o.l}</option>`:`<option ${o==val?'selected':''}>${o}</option>`).join(''),
  stationOpts:(val='')=>STATIONS.map(s=>`<option value="${s.code}" ${s.code==val?'selected':''}>${s.code} ${s.name}</option>`).join('')
};

/* ===== MODAL ===== */
const Modal={
  open(html,title,onSave,wide=false){
    document.getElementById('mo-title').textContent=title;
    document.getElementById('mo-body').innerHTML=html;
    const box=document.querySelector('.mo-box');
    box.style.maxWidth=wide?'900px':'700px';
    document.getElementById('mo').classList.add('open');
    if(onSave){document.getElementById('mo-save').style.display='inline-flex';document.getElementById('mo-save').onclick=onSave;}
    else document.getElementById('mo-save').style.display='none';
  },
  close(){document.getElementById('mo').classList.remove('open');}
};

/* ===== ROUTER ===== */
const Router={
  current:'dashboard',
  pages:{},
  navigate(page){
    const sess=DB.auth.session();
    if(!sess){showLogin();return;}
    if(!DB.auth.can('view',page)){U.toast('⛔ ไม่มีสิทธิ์เข้าถึงหน้านี้','danger');return;}
    const permissionModule=PAGE_PERMISSIONS[page]||page;
    if(!DB.auth.can('view',permissionModule)){U.toast('⛔ ไม่มีสิทธิ์เข้าถึงหน้านี้','danger');return;}
    this.current=page;
    document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
    document.getElementById('pt').textContent={dashboard:'Dashboard',customers:'CRM — ลูกค้า',sales:'Sales — Project & Handover',op_checklist:'Operation — เตรียมงาน',op_prep:'Operation — ใบแจ้งงาน',op_onsite:'Operation — Onsite',lab:'Lab — ห้องปฏิบัติการ',report:'Report — ทีมทำผล',billing:'Billing — Invoice',config:'Config — ตั้งค่าระบบ'}[page]||page;
    document.getElementById('pt').textContent={dashboard:'Dashboard',navi_calendar:'Navi Calendar',customers:'CRM — ลูกค้า',sales:'Sales — Project & Handover',op_checklist:'Operation — เตรียมงาน',op_prep:'Operation — ใบแจ้งงาน',op_onsite:'Operation — Onsite',lab:'Lab — ห้องปฏิบัติการ',report:'Report — ทีมทำผล',billing:'Billing — Invoice',config:'Config — ตั้งค่าระบบ'}[page]||page;
    Pages[page]&&Pages[page].render();
    updateAlerts();
    window.scrollTo(0,0);
  }
};

/* ===== AUTH UI ===== */
function showLogin(){
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
}
function showApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  buildNav();
}
function buildNav(){
  const sess=DB.auth.session();
  const navEl=document.getElementById('sidebar-nav');
  const items=[
    {page:'dashboard',icon:'📊',label:'Dashboard',mod:'dashboard'},
    {page:'navi_calendar',icon:'🗓️',label:'Navi Calendar',mod:'dashboard'},
    {section:'ทีมขาย (Sales)'},
    {page:'customers',icon:'👥',label:'CRM — ลูกค้า',mod:'customers'},
    {page:'sales',icon:'💼',label:'Project & Handover',mod:'sales'},
    {section:'Operation'},
    {page:'op_checklist',icon:'✅',label:'เตรียมงาน (Checklist)',mod:'op_prep'},
    {page:'op_prep',icon:'📋',label:'ใบแจ้งงาน',mod:'op_prep'},
    {page:'op_onsite',icon:'🚑',label:'Onsite',mod:'op_onsite'},
    {section:'ห้องปฏิบัติการ'},
    {page:'lab',icon:'🔬',label:'Lab & TAT',mod:'lab'},
    {section:'ทีมทำผล (Report)'},
    {page:'report',icon:'📄',label:'Report & Plan',mod:'report'},
    {section:'การเงิน'},
    {page:'billing',icon:'💰',label:'Billing & Invoice',mod:'billing'},
    {section:'ระบบ'},
    {page:'config',icon:'⚙',label:'ตั้งค่าระบบ',mod:'config'}
  ];
  let html='';
  items.forEach(it=>{
    if(it.section){html+=`<div class="nav-section">${it.section}</div>`;return;}
    if(!DB.auth.can('view',it.mod))return;
    html+=`<a class="nav-item" data-page="${it.page}" onclick="Router.navigate('${it.page}')"><span class="icon">${it.icon}</span>${it.label}</a>`;
  });
  navEl.innerHTML=html;
  document.getElementById('user-name').textContent=sess.name;
  document.getElementById('user-role').textContent=sess.role;
@@ -209,50 +212,84 @@ Pages.dashboard={
  <div class="card mt4">
    <div class="card-header">
      <span class="card-title">📁 Project ล่าสุด ${this._filter!=='all'?`<span class="badge b-lab" style="margin-left:6px">${this._filter}</span>`:''}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="t-sm t-muted">${filtered.length} รายการ</span>
        <select onchange="Pages.dashboard.filterStatus(this.value)" style="padding:5px 10px;border:1px solid var(--bdr);border-radius:6px;font-size:12px;background:var(--surf)">
          ${statusOpts}
        </select>
        ${this._filter!=='all'?`<button class="btn btn-out btn-xs" onclick="Pages.dashboard.filterStatus('all')">✕ ล้าง</button>`:''}
      </div>
    </div>
    <div class="tbl-wrap"><table><thead><tr><th>Code</th><th>บริษัท</th><th>คน</th><th>วันตรวจ</th><th>สถานะ</th><th></th></tr></thead>
    <tbody>${rows||`<tr><td colspan="6" class="empty">ไม่พบ Project ${this._filter!=='all'?`สถานะ "${this._filter}"`:''}` }</tbody></table></div>
  </div>`;
},
filterStatus(s){this._filter=s;this.render();},
showAlerts(){
  const alerts=DB.checkAlerts();
  if(!alerts.length){U.toast('✅ ไม่มีการแจ้งเตือน');return;}
  const html=alerts.map(a=>`<div class="ab ${a.type}" style="margin-bottom:6px">${a.msg}</div>`).join('');
  Modal.open(`<div>${html}</div>`,'การแจ้งเตือนทั้งหมด');
},
reset(){if(U.confirm('รีเซ็ต Mock Data ทั้งหมด?')){['auth_db','customer_db','sales_db','operation_db','lab_db','report_db','billing_db'].forEach(db=>{Object.keys(localStorage).filter(k=>k.startsWith(db+'__')).forEach(k=>localStorage.removeItem(k));});DB.seedMockData();buildNav();this.render();U.toast('✅ รีเซ็ตแล้ว');}}
};

/* ── NAVI CALENDAR ── */
Pages.navi_calendar={render(){
  const projects=DB.sales.listProjects().slice().sort((a,b)=>new Date(a.onsite_date)-new Date(b.onsite_date));
  const rows=projects.map(p=>`<tr>
    <td class="fw6">${U.fmtD(p.onsite_date)}</td>
    <td>${p.project_code}</td>
    <td>${U.esc(p.company_name)}</td>
    <td>${(p.headcount||0).toLocaleString()}</td>
    <td>${U.badge(p.status)}</td>
    <td><button class="btn btn-out btn-xs" onclick="Router.navigate('sales')">ดูรายละเอียด</button></td>
  </tr>`).join('');
  document.getElementById('content').innerHTML=`
  <div class="ph">
    <div>
      <h2>🗓️ Navi Calendar</h2>
      <p>ปฏิทินกำหนดการออกตรวจ (เรียงตามวันตรวจสุขภาพ)</p>
    </div>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="card-title">ตารางนัดหมายทั้งหมด</span>
      <span class="t-sm t-muted">${projects.length} รายการ</span>
    </div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr><th>วันตรวจ</th><th>Project Code</th><th>บริษัท</th><th>จำนวนคน</th><th>สถานะ</th><th></th></tr>
        </thead>
        <tbody>${rows||'<tr><td colspan="6" class="empty">ยังไม่มีกำหนดการ</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}};

/* ── CUSTOMERS ── */
Pages.customers={render(){
  const custs=DB.customer.listCustomers();
  const canAdd=DB.auth.can('add','customers'),canEdit=DB.auth.can('edit','customers'),canDel=DB.auth.can('delete','customers');
  const rows=custs.map(c=>`<tr><td class="fw6">${c.company_name}</td><td>${c.contact_name}<br><span class="t-sm t-muted">${c.contact_role||''}</span></td><td>${c.phone||''}</td><td>${(c.employee_count||0).toLocaleString()}</td><td>${U.badge(c.sales_status)}</td><td>${U.fmtD(c.last_contact)}</td><td>
    ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.customers.edit(${c.id})">แก้ไข</button>`:''}
    <button class="btn btn-out btn-xs" onclick="Pages.customers.logs(${c.id})">Log</button>
    ${canDel?`<button class="btn btn-danger btn-xs" onclick="Pages.customers.del(${c.id})">ลบ</button>`:''}
  </td></tr>`).join('');
  document.getElementById('content').innerHTML=`<div class="ph"><div><h2>👥 CRM — ลูกค้า</h2><p>จัดการข้อมูลบริษัทและประวัติการติดต่อ</p></div>${canAdd?`<button class="btn btn-pri" onclick="Pages.customers.edit(null)">+ เพิ่มลูกค้า</button>`:''}</div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>บริษัท</th><th>ผู้ติดต่อ</th><th>เบอร์</th><th>พนักงาน</th><th>สถานะ</th><th>ติดต่อล่าสุด</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty">ยังไม่มีข้อมูล</td></tr>'}</tbody></table></div></div>`;
},
edit(id){
  const c=id?DB.customer.getCustomer(id):{};
  const f=(k,d='')=>U.esc(c[k]||d);
  const sOpts=U.sel(['Prospect','Follow up','Negotiation','Closed'],f('sales_status'));
  Modal.open(`<div class="fr"><div class="fg"><label class="req">ชื่อบริษัท/องค์กร</label><input id="fc_co" value="${f('company_name')}"/></div><div class="fg"><label>จำนวนพนักงาน</label><input id="fc_emp" type="number" value="${f('employee_count',0)}"/></div></div>
  <div class="fg"><label>ที่อยู่</label><textarea id="fc_addr">${f('address')}</textarea></div>
  <div class="fr"><div class="fg"><label>เบอร์</label><input id="fc_ph" value="${f('phone')}"/></div><div class="fg"><label>อีเมล</label><input id="fc_em" value="${f('email')}"/></div></div>
  <div class="fr"><div class="fg"><label class="req">ผู้ติดต่อหลัก</label><input id="fc_cn" value="${f('contact_name')}"/></div><div class="fg"><label>ตำแหน่ง</label><input id="fc_cr" value="${f('contact_role')}"/></div></div>
  <div class="fr"><div class="fg"><label>สถานะการขาย</label><select id="fc_st">${sOpts}</select></div><div class="fg"><label>วันที่ติดต่อล่าสุด</label><input id="fc_lc" type="date" value="${f('last_contact')}"/></div></div>
  <div class="fg"><label>Note</label><textarea id="fc_nt">${f('note')}</textarea></div>`,
  id?'แก้ไขลูกค้า':'เพิ่มลูกค้าใหม่',()=>{
    const co=document.getElementById('fc_co').value.trim();
    if(!co)return U.toast('กรุณาใส่ชื่อบริษัท','danger');
    DB.customer.saveCustomer({id:id||undefined,company_name:co,address:document.getElementById('fc_addr').value.trim(),phone:document.getElementById('fc_ph').value.trim(),email:document.getElementById('fc_em').value.trim(),contact_name:document.getElementById('fc_cn').value.trim(),contact_role:document.getElementById('fc_cr').value.trim(),employee_count:parseInt(document.getElementById('fc_emp').value)||0,sales_status:document.getElementById('fc_st').value,last_contact:document.getElementById('fc_lc').value,note:document.getElementById('fc_nt').value.trim()});
    Modal.close();this.render();U.toast(id?'✅ อัปเดตแล้ว':'✅ เพิ่มลูกค้าแล้ว');
  });
},
del(id){if(U.confirm('ลบลูกค้านี้?')){DB.customer.deleteCustomer(id);this.render();U.toast('✅ ลบแล้ว');}},
logs(cid){
  const c=DB.customer.getCustomer(cid);
  const logs=DB.customer.listSalesLogs(cid);
  let html=`<p class="fw6 mb4">${c.company_name}</p><div class="mb4" style="max-height:200px;overflow-y:auto">`;
  if(!logs.length)html+='<p class="t-muted">ยังไม่มีบันทึก</p>';
  else logs.forEach(l=>{html+=`<div style="padding:8px 0;border-bottom:1px solid var(--bdr)"><div class="fw6 t-sm">${l.note}</div><div class="t-sm t-muted">${U.fmtDT(l.created_at)}</div></div>`;});
  html+=`</div><div class="fg"><label>เพิ่มบันทึก</label><textarea id="nl" placeholder="บันทึกการติดต่อ..."></textarea></div>`;
  Modal.open(html,'บันทึกการติดต่อ',()=>{const n=document.getElementById('nl').value.trim();if(!n)return;DB.customer.addSalesLog({customer_id:cid,note:n});Modal.close();U.toast('✅ บันทึกแล้ว');});
}};

/* ── SALES ── */
Pages.sales={render(){
  const projs=DB.sales.listProjects();
  const canAdd=DB.auth.can('add','sales'),canEdit=DB.auth.can('edit','sales');
  const rows=projs.slice().reverse().map(p=>`<tr><td class="fw6">${p.project_code}</td><td>${p.company_name}</td><td>${p.package_code||''}</td><td>${(p.headcount||0).toLocaleString()}</td><td>${U.fmtD(p.onsite_date)}</td><td>${U.badge(p.status)}</td><td>
    ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.sales.editProject(${p.id})">แก้ไข</button>`:''}
    <button class="btn btn-out btn-xs" onclick="Pages.sales.viewHandover(${p.id})">เอกสาร</button>
  </td></tr>`).join('');
  document.getElementById('content').innerHTML=`<div class="ph"><div><h2>💼 Sales — Project & Handover</h2><p>ปิดการขายและส่งเอกสารเวียน</p></div>${canAdd?`<button class="btn btn-pri" onclick="Pages.sales.addProject()">+ ปิดการขาย / สร้าง Project</button>`:''}</div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Project Code</th><th>บริษัท</th><th>Package</th><th>จำนวน</th><th>วันตรวจ</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty">ยังไม่มี Project</td></tr>'}</tbody></table></div></div>`;
},
addProject(){
  Modal.open(`
  <div class="fg"><label class="req">บริษัท/ลูกค้า (พิมพ์เพื่อค้นหา)</label>
    <div class="ac-wrap"><input id="ac_co_txt" placeholder="พิมพ์ชื่อบริษัท..."/><input type="hidden" id="ac_co_id"/></div>
  </div>
  <div class="fr"><div class="fg"><label class="req">วันที่ออกตรวจ</label><input id="sp_date" type="date"/></div>
    <div class="fg"><label>เวลาเริ่ม</label><input id="sp_ts" type="time" value="07:00"/></div>
    <div class="fg"><label>เวลาสิ้นสุด</label><input id="sp_te" type="time" value="16:00"/></div>
  </div>
  <div class="fr"><div class="fg"><label class="req">จำนวนคน</label><input id="ac_head" type="number"/></div>
    <div class="fg"><label>Package</label><input id="sp_pkg" placeholder="PKG-B"/></div>
  </div>
  <div class="fg"><label class="req">สถานที่</label><input id="ac_loc" placeholder="ที่อยู่เต็ม"/></div>
  <div class="fr"><div class="fg"><label class="req">ชื่อผู้ประสานงาน</label><input id="ac_coord"/></div>
    <div class="fg"><label class="req">เบอร์โทรผู้ประสานงาน</label><input id="ac_cphone"/></div>
  </div>
  <div class="fr"><div class="fg"><label>เงื่อนไขพิเศษ</label><textarea id="sp_cond"></textarea></div>
    <div class="fg"><label>สร้างโดย</label><input id="sp_by"/></div>
  </div>`,
  'ปิดการขาย / สร้าง Project ใหม่',()=>{
    const cid=parseInt(document.getElementById('ac_co_id').value);
    const cust=DB.customer.getCustomer(cid);
    if(!cid||!cust)return U.toast('กรุณาเลือกบริษัท','danger');
    const head=parseInt(document.getElementById('ac_head').value)||0;
    const date=document.getElementById('sp_date').value;
    if(!head||!date)return U.toast('กรุณากรอกข้อมูลให้ครบ','danger');
    const proj=DB.sales.saveProject({customer_id:cid,company_name:cust.company_name,package_code:document.getElementById('sp_pkg').value,headcount:head,onsite_date:date,onsite_time:document.getElementById('sp_ts').value,onsite_time_end:document.getElementById('sp_te').value,location:document.getElementById('ac_loc').value.trim(),coordinator_name:document.getElementById('ac_coord').value.trim(),coordinator_phone:document.getElementById('ac_cphone').value.trim(),status:'Closed',created_by:document.getElementById('sp_by').value.trim()});
    DB.sales.saveHandover({project_id:proj.id,conditions:document.getElementById('sp_cond').value.trim(),sent_at:DB._now()});
    DB.customer.saveCustomer({...cust,sales_status:'Closed',closed_at:DB._now()});
    Modal.close();this.render();U.toast(`✅ สร้าง Project ${proj.project_code} สำเร็จ`);
  });
  setTimeout(()=>acCustomer('ac_co_txt','ac_co_id'),100);
},
editProject(id){
  const p=DB.sales.getProject(id);
  const sOpts=U.sel(STATUS_FLOW.map(s=>({v:s,l:s})),p.status);
  Modal.open(`<div class="fg"><label>Project Code</label><input value="${p.project_code}" disabled/></div>
  <div class="fr"><div class="fg"><label>จำนวนคน</label><input id="ep_h" type="number" value="${p.headcount}"/></div>
    <div class="fg"><label>วันตรวจ</label><input id="ep_d" type="date" value="${p.onsite_date}"/></div></div>
  <div class="fr"><div class="fg"><label>เวลาเริ่ม</label><input id="ep_ts" type="time" value="${p.onsite_time||'07:00'}"/></div>
    <div class="fg"><label>เวลาสิ้นสุด</label><input id="ep_te" type="time" value="${p.onsite_time_end||'16:00'}"/></div></div>
  <div class="fg"><label>สถานที่</label><input id="ep_loc" value="${U.esc(p.location||'')}"/></div>
  <div class="fr"><div class="fg"><label>ผู้ประสานงาน</label><input id="ep_co" value="${U.esc(p.coordinator_name||'')}"/></div>
    <div class="fg"><label>เบอร์ประสานงาน</label><input id="ep_cp" value="${U.esc(p.coordinator_phone||'')}"/></div></div>
  <div class="fg"><label>สถานะ</label><select id="ep_st">${sOpts}</select></div>`,
  'แก้ไข Project',()=>{
    DB.sales.saveProject({...p,headcount:parseInt(document.getElementById('ep_h').value)||p.headcount,onsite_date:document.getElementById('ep_d').value,onsite_time:document.getElementById('ep_ts').value,onsite_time_end:document.getElementById('ep_te').value,location:document.getElementById('ep_loc').value,coordinator_name:document.getElementById('ep_co').value,coordinator_phone:document.getElementById('ep_cp').value,status:document.getElementById('ep_st').value});
    Modal.close();this.render();U.toast('✅ อัปเดต Project แล้ว');
  });
},
viewHandover(id){
  const p=DB.sales.getProject(id),h=DB.sales.getHandover(id);
  Modal.open(`<div class="ab success mb4">📄 Internal Handover Document</div>
  <div class="sr"><span>Project Code</span><span class="fw6">${p.project_code}</span></div>
  <div class="sr"><span>บริษัท</span><span class="fw6">${p.company_name}</span></div>
  <div class="sr"><span>วันตรวจ</span><span>${U.fmtD(p.onsite_date)} เวลา ${p.onsite_time||'-'} – ${p.onsite_time_end||'-'}</span></div>
  <div class="sr"><span>สถานที่</span><span>${p.location||'-'}</span></div>
  <div class="sr"><span>จำนวน</span><span class="fw6">${(p.headcount||0).toLocaleString()} คน</span></div>
  <div class="sr"><span>Package</span><span>${p.package_code||'-'}</span></div>
  <div class="sr"><span>ผู้ประสานงาน</span><span>${p.coordinator_name||'-'} โทร ${p.coordinator_phone||'-'}</span></div>
  <div class="divider"></div>
  <div class="sr"><span>เงื่อนไขพิเศษ</span><span>${h?.conditions||'-'}</span></div>
  <div class="sr"><span>ไฟล์ Layout</span><span class="tag">${h?.layout_file||'ยังไม่มี'}</span></div>
  <div class="sr"><span>ไฟล์รายชื่อ</span><span class="tag">${h?.name_list_file||'ยังไม่มี'}</span></div>
  <div class="sr"><span>ใบเสนอราคา</span><span class="tag">${h?.quotation_file||'ยังไม่มี'}</span></div>`,
  'เอกสารเวียนภายใน');
}};

/* ── OP CHECKLIST (เตรียมงาน) ── */
Pages.op_checklist={
  render(){
    const projs=DB.sales.listProjects();
    const canEdit=DB.auth.can('edit','op_prep');
    const pOpts=`<option value="">-- เลือก Project --</option>`+projs.map(p=>`<option value="${p.id}">${p.project_code} — ${p.company_name} (${U.fmtD(p.onsite_date)})</option>`).join('');
    document.getElementById('content').innerHTML=`
    <div class="ph"><div><h2>✅ Operation — เตรียมงาน (Checklist)</h2><p>บันทึกสถานะการเตรียมงานก่อนออกหน่วย</p></div></div>
    <div class="card mb4">
      <div class="fg"><label>เลือก Project</label>
        <select id="ckl_sel" onchange="Pages.op_checklist.loadProject(parseInt(this.value))">
          ${pOpts}
        </select>
      </div>
    </div>
    <div id="ckl_detail"><div class="empty"><div class="icon">📋</div><p>กรุณาเลือก Project เพื่อดู Checklist</p></div></div>`;
  },
  loadProject(pid){
    if(!pid){document.getElementById('ckl_detail').innerHTML='<div class="empty"><div class="icon">📋</div><p>กรุณาเลือก Project</p></div>';return;}
    const p=DB.sales.getProject(pid);
    if(!p)return;
    document.getElementById('ckl_sel').value=pid;
    const jo=DB.operation.getJobOrder(pid);
    const saved=this._load(pid);
    const canEdit=DB.auth.can('edit','op_prep');
    const ITEMS=[
      {key:'select_company', group:'ก่อนออกหน่วย', label:'เลือกบริษัท / ยืนยันข้อมูลลูกค้า', icon:'🏢', note:p.company_name},
      {key:'job_order',      group:'ก่อนออกหน่วย', label:'จัดทำใบแจ้งงาน', icon:'📋', note:jo?`สร้างแล้ว — สถานะ: ${jo.status||'Draft'}`:'ยังไม่ได้สร้าง', warn:!jo},
      {key:'manpower',       group:'ก่อนออกหน่วย', label:'จัดอัตรากำลัง (แพทย์ / พยาบาล / MT / Part-time)', icon:'👥', note:saved.manpower_note||''},
      {key:'equipment',      group:'ก่อนออกหน่วย', label:'เตรียมอุปกรณ์ตามใบแจ้งงาน', icon:'🧰', note:saved.equipment_note||''},
      {key:'vehicle',        group:'ก่อนออกหน่วย', label:'จัดยานพาหนะ / ตรวจสอบรถ', icon:'🚑', note:saved.vehicle_note||''},
      {key:'specimen_kit',   group:'ก่อนออกหน่วย', label:'เตรียม Kit เจาะเลือด / อุปกรณ์แล็บ', icon:'🧪', note:saved.specimen_kit_note||''},
      {key:'xray_ready',     group:'ก่อนออกหน่วย', label:'เตรียมเครื่อง X-Ray / ตรวจสอบสภาพ', icon:'📡', note:saved.xray_ready_note||''},
      {key:'doc_ready',      group:'เอกสาร',        label:'เตรียมเอกสารลงทะเบียน (ใบตรวจ / ฟอร์ม)', icon:'📄', note:saved.doc_ready_note||''},
      {key:'briefing',       group:'วันออกหน่วย',   label:'ประชุม Brief ทีมก่อนออก', icon:'🗣', note:saved.briefing_note||''},
      {key:'depart_check',   group:'วันออกหน่วย',   label:'ตรวจสอบการออกเดินทาง (เวลา/ทะเบียนรถ)', icon:'🚀', note:saved.depart_check_note||''},
    ];
    const groups=[...new Set(ITEMS.map(i=>i.group))];
    const doneCount=ITEMS.filter(i=>saved[i.key]).length;
    const pct=Math.round(doneCount/ITEMS.length*100);
    let html=`
    <div class="metrics-grid">
      <div class="metric-card acc"><div class="metric-label">รายการทั้งหมด</div><div class="metric-value">${ITEMS.length}</div></div>
      <div class="metric-card suc"><div class="metric-label">ทำแล้ว</div><div class="metric-value">${doneCount}</div></div>
      <div class="metric-card ${doneCount<ITEMS.length?'warn':'suc'}"><div class="metric-label">ความคืบหน้า</div><div class="metric-value">${pct}%</div></div>
    </div>
    <!-- progress bar -->
    <div style="background:var(--bdr);border-radius:8px;height:10px;margin-bottom:20px;overflow:hidden">
      <div style="background:${pct===100?'var(--suc)':'var(--acc)'};height:100%;width:${pct}%;transition:width .4s;border-radius:8px"></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">📋 Checklist — ${p.project_code} | ${p.company_name}</span>
        <div class="btn-grp">
          ${canEdit?`<button class="btn btn-suc btn-sm" onclick="Pages.op_checklist.saveAll(${pid})">💾 บันทึกทั้งหมด</button>`:''}
          <button class="btn btn-out btn-sm" onclick="Pages.op_checklist.printChecklist(${pid})">🖨 พิมพ์</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px">วันตรวจ: ${U.fmtD(p.onsite_date)} | สถานที่: ${p.location||'-'} | จำนวน: ${(p.headcount||0).toLocaleString()} คน</div>`;
    groups.forEach(g=>{
      html+=`<div class="sec-title" style="margin-top:16px">${g}</div>`;
      ITEMS.filter(i=>i.group===g).forEach(item=>{
        const checked=!!saved[item.key];
        const warnStyle=item.warn?'border-left:3px solid var(--warn);':'';
        html+=`<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border-radius:8px;margin-bottom:6px;background:${checked?'#EAFAF1':'var(--surf2)'};border:1px solid ${checked?'#A9DFBF':'var(--bdr)'};${warnStyle}">
          <input type="checkbox" id="ck_${item.key}" ${checked?'checked':''} ${canEdit?'':`disabled`}
            style="width:18px;height:18px;cursor:pointer;flex-shrink:0;margin-top:2px"
            onchange="Pages.op_checklist.toggle(${pid},'${item.key}',this.checked)"/>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:${checked?'600':'400'};color:${checked?'var(--suc)':'var(--txt)'}">
              ${item.icon} ${item.label}${item.warn&&!checked?' <span style="color:var(--warn);font-size:11px">(⚠ ยังไม่ดำเนินการ)</span>':''}
            </div>
            ${item.note?`<div style="font-size:12px;color:var(--muted);margin-top:2px">${item.note}</div>`:''}
            ${canEdit?`<input type="text" id="ck_note_${item.key}" value="${U.esc(saved[item.key+'_note']||'')}" placeholder="บันทึกเพิ่มเติม..."
              style="margin-top:6px;padding:4px 8px;border:1px solid var(--bdr);border-radius:5px;font-size:12px;width:100%;max-width:400px;font-family:Sarabun,sans-serif"/>`:
              (saved[item.key+'_note']?`<div style="font-size:12px;color:var(--muted);font-style:italic;margin-top:4px">"${saved[item.key+'_note']}"</div>`:'')}
          </div>
          <div style="font-size:18px;flex-shrink:0">${checked?'✅':'⬜'}</div>
        </div>`;
      });
    });
    html+=`</div>`;
    if(doneCount===ITEMS.length){
      html+=`<div class="ab success mt4">🎉 เตรียมงานครบทุกรายการแล้ว พร้อมออกหน่วย!</div>`;
    }
    document.getElementById('ckl_detail').innerHTML=html;
  },
  _key(pid){return`op_checklist_${pid}`;},
  _load(pid){try{return JSON.parse(localStorage.getItem(this._key(pid))||'{}')}catch{return{};}},
  _save(pid,data){localStorage.setItem(this._key(pid),JSON.stringify(data));},
  toggle(pid,key,val){
    const d=this._load(pid);d[key]=val;this._save(pid,d);
    // update icon instantly
    const box=document.getElementById('ck_'+key)?.closest('div[style]');
    if(box){
      box.style.background=val?'#EAFAF1':'var(--surf2)';
      box.style.borderColor=val?'#A9DFBF':'var(--bdr)';
      box.querySelector('div[style*="font-size:14px"]').style.color=val?'var(--suc)':'var(--txt)';
      box.querySelector('div[style*="font-size:14px"]').style.fontWeight=val?'600':'400';
      box.lastElementChild.textContent=val?'✅':'⬜';
    }
    // update progress without full re-render
    const TOTAL=10;const d2=this._load(pid);const done=Object.keys(d2).filter(k=>!k.endsWith('_note')&&d2[k]).length;
    const pct=Math.round(done/TOTAL*100);
    const bar=document.querySelector('[style*="transition:width"]');
    if(bar)bar.style.width=pct+'%';
  },
  saveAll(pid){
    const d=this._load(pid);
    const ITEMS=['select_company','job_order','manpower','equipment','vehicle','specimen_kit','xray_ready','doc_ready','briefing','depart_check'];
    ITEMS.forEach(k=>{
      const noteEl=document.getElementById('ck_note_'+k);
      if(noteEl)d[k+'_note']=noteEl.value;
    });
    this._save(pid,d);
    this.loadProject(pid);
    U.toast('✅ บันทึก Checklist แล้ว');
  },
  printChecklist(pid){
    const p=DB.sales.getProject(pid);
    const saved=this._load(pid);
    const ITEMS=[
      {key:'select_company',group:'ก่อนออกหน่วย',label:'เลือกบริษัท / ยืนยันข้อมูลลูกค้า'},
      {key:'job_order',group:'ก่อนออกหน่วย',label:'จัดทำใบแจ้งงาน'},
      {key:'manpower',group:'ก่อนออกหน่วย',label:'จัดอัตรากำลัง'},
      {key:'equipment',group:'ก่อนออกหน่วย',label:'เตรียมอุปกรณ์'},
      {key:'vehicle',group:'ก่อนออกหน่วย',label:'จัดยานพาหนะ'},
      {key:'specimen_kit',group:'ก่อนออกหน่วย',label:'เตรียม Kit เจาะเลือด / แล็บ'},
      {key:'xray_ready',group:'ก่อนออกหน่วย',label:'เตรียมเครื่อง X-Ray'},
      {key:'doc_ready',group:'เอกสาร',label:'เตรียมเอกสารลงทะเบียน'},
      {key:'briefing',group:'วันออกหน่วย',label:'ประชุม Brief ทีม'},
      {key:'depart_check',group:'วันออกหน่วย',label:'ตรวจสอบการออกเดินทาง'},
    ];
    const rows=ITEMS.map(i=>`<tr><td style="text-align:center;font-size:16px">${saved[i.key]?'☑':'☐'}</td><td>${i.group}</td><td>${i.label}</td><td>${saved[i.key+'_note']||''}</td></tr>`).join('');
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Checklist เตรียมงาน</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    body{font-family:'Sarabun',sans-serif;font-size:13px;margin:20px;}h2{text-align:center;font-size:16px;font-weight:700;margin-bottom:4px;}
    table{width:100%;border-collapse:collapse;margin-top:12px;}th,td{border:1px solid #999;padding:6px 10px;font-size:13px;}
    th{background:#e8f0fe;font-weight:600;}@media print{button{display:none!important;}}</style></head><body>
    <h2>Checklist เตรียมงาน — ก่อนออกหน่วย</h2>
    <p style="text-align:center;color:#555;margin-bottom:8px">${p.project_code} — ${p.company_name}<br>วันตรวจ: ${U.fmtD(p.onsite_date)} | สถานที่: ${p.location||'-'}</p>
    <table><thead><tr><th style="width:40px">✓</th><th style="width:120px">หมวด</th><th>รายการ</th><th>บันทึก</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p style="margin-top:12px;font-size:11px;color:#888">พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
    <div style="text-align:right;margin-top:12px"><button onclick="window.print()" style="padding:8px 20px;background:#0F4C75;color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:Sarabun,sans-serif;font-size:13px">🖨 พิมพ์</button></div>
    </body></html>`);
    w.document.close();w.focus();
  }
};

/* ── OP PREP (ใบแจ้งงาน) ── */
Pages.op_prep={
  currentJO:null,
  render(){
    const jos=DB.operation.listJobOrders();
    const canAdd=DB.auth.can('add','op_prep'),canEdit=DB.auth.can('edit','op_prep'),canDel=DB.auth.can('delete','op_prep');
    const rows=jos.slice().reverse().map(jo=>{
      const p=DB.sales.getProject(jo.project_id);
      return`<tr><td class="fw6">${p?.project_code||'-'}</td><td>${jo.company_name}</td><td>${U.fmtD(jo.onsite_date)}</td><td>${(jo.headcount||0).toLocaleString()}</td><td>${U.badge(jo.status||'Draft')}</td><td>
        ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.op_prep.editJO(${jo.id})">แก้ไข</button>`:''}
        <button class="btn btn-pri btn-xs" onclick="Pages.op_prep.viewJO(${jo.id})">ดู/พิมพ์</button>
        ${canDel?`<button class="btn btn-danger btn-xs" onclick="Pages.op_prep.delJO(${jo.id})">ลบ</button>`:''}
      </td></tr>`;
    }).join('');
    document.getElementById('content').innerHTML=`<div class="ph"><div><h2>📋 Operation — ใบแจ้งงาน</h2><p>สร้างและจัดการใบแจ้งงาน พร้อมพิมพ์ A4</p></div>${canAdd?`<button class="btn btn-pri" onclick="Pages.op_prep.createJO()">+ สร้างใบแจ้งงาน</button>`:''}</div>
    <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Project</th><th>บริษัท</th><th>วันตรวจ</th><th>จำนวน</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="empty">ยังไม่มีใบแจ้งงาน</td></tr>'}</tbody></table></div></div>`;
  },
  createJO(){
    const projs=DB.sales.listProjects().filter(p=>['Closed','Onsite'].includes(p.status));
    if(!projs.length)return U.toast('ไม่มี Project ที่พร้อม','warning');
    const pOpts=U.sel(projs.map(p=>({v:p.id,l:`${p.project_code} — ${p.company_name}`})),'');
    Modal.open(`<div class="ab info mb4">สร้างใบแจ้งงานจาก Project ที่ปิดการขายแล้ว</div>
    <div class="fg"><label class="req">เลือก Project</label><select id="cjo_p" onchange="Pages.op_prep._fillFromProject(this.value)">${pOpts}</select></div>
    <div class="fr"><div class="fg"><label>เวลาออกเดินทาง</label><input id="cjo_dep" type="time" value="05:30"/></div>
      <div class="fg"><label>เวลาเริ่มตรวจ</label><input id="cjo_st" type="time" value="07:00"/></div>
      <div class="fg"><label>เวลาสิ้นสุด</label><input id="cjo_et" type="time" value="16:00"/></div></div>
    <div class="fr"><div class="fg"><label>Director</label><input id="cjo_dir"/></div>
      <div class="fg"><label>ประเภทงาน</label><select id="cjo_jt">${U.sel(JOB_TYPES,'ตรวจสุขภาพ')}</select></div></div>
    <div class="fr"><div class="fg"><label>กะทำงาน</label><input id="cjo_sh" value="เช้า"/></div>
      <div class="fg"><label>หมายเหตุ</label><input id="cjo_rm"/></div></div>
    <div class="divider"></div><div class="sec-title">ลายเซ็นผู้รับผิดชอบ</div>
    <div class="fr3"><div class="fg"><label>ผู้จัดทำ</label><input id="cjo_s1"/></div>
      <div class="fg"><label>หัวหน้าแผนก</label><input id="cjo_s2"/></div>
      <div class="fg"><label>HR</label><input id="cjo_s3"/></div></div>`,
    'สร้างใบแจ้งงาน',()=>{
      const pid=parseInt(document.getElementById('cjo_p').value);
      if(!pid)return U.toast('กรุณาเลือก Project','danger');
      const p=DB.sales.getProject(pid);
      const jo=DB.operation.saveJobOrder({project_id:pid,company_name:p.company_name,location:p.location||'',onsite_date:p.onsite_date,headcount:p.headcount,depart_time:document.getElementById('cjo_dep').value,start_time:document.getElementById('cjo_st').value,end_time:document.getElementById('cjo_et').value,director:document.getElementById('cjo_dir').value,job_type:document.getElementById('cjo_jt').value,shift:document.getElementById('cjo_sh').value,remark:document.getElementById('cjo_rm').value,signer_creator:document.getElementById('cjo_s1').value,signer_head:document.getElementById('cjo_s2').value,signer_hr:document.getElementById('cjo_s3').value,status:'Draft'});
      Modal.close();this.render();U.toast(`✅ สร้างใบแจ้งงานแล้ว`);
      setTimeout(()=>this.viewJO(jo.id),300);
    });
  },
  _fillFromProject(pid){if(!pid)return;const p=DB.sales.getProject(parseInt(pid));if(!p)return;},
  editJO(id){
    const jo=DB.operation.getJobOrderById(id);
    Modal.open(`<div class="tabs"><div class="tab active" onclick="switchTab(this,'jt1')">ข้อมูลทั่วไป</div><div class="tab" onclick="switchTab(this,'jt2')">Station & อัตรากำลัง</div><div class="tab" onclick="switchTab(this,'jt3')">ยานพาหนะ</div><div class="tab" onclick="switchTab(this,'jt4')">ลายเซ็น</div></div>
    <div id="jt1" class="tp active">${this._generalForm(jo)}</div>
    <div id="jt2" class="tp">${this._stationTable(id)}</div>
    <div id="jt3" class="tp">${this._vehicleTable(id)}</div>
    <div id="jt4" class="tp">${this._signForm(jo)}</div>`,
    'แก้ไขใบแจ้งงาน',()=>{
      this._saveGeneral(jo);this._saveSign(jo);
      Modal.close();this.render();U.toast('✅ บันทึกแล้ว');
    },true);
  },
  _generalForm(jo){return`
  <div class="fr"><div class="fg"><label>ชื่อบริษัท</label><input id="jo_co" value="${U.esc(jo.company_name||'')}"/></div>
    <div class="fg"><label>วันที่ออกหน่วย</label><input id="jo_dt" type="date" value="${jo.onsite_date||''}"/></div></div>
  <div class="fg"><label>สถานที่</label><input id="jo_loc" value="${U.esc(jo.location||'')}"/></div>
  <div class="fr3"><div class="fg"><label>จำนวนพนักงาน</label><input id="jo_hc" type="number" value="${jo.headcount||0}"/></div>
    <div class="fg"><label>เวลาออกเดินทาง</label><input id="jo_dep" type="time" value="${jo.depart_time||'05:30'}"/></div>
    <div class="fg"><label>เวลาเริ่มตรวจ</label><input id="jo_st" type="time" value="${jo.start_time||'07:00'}"/></div></div>
  <div class="fr3"><div class="fg"><label>เวลาสิ้นสุด</label><input id="jo_et" type="time" value="${jo.end_time||'16:00'}"/></div>
    <div class="fg"><label>Director</label><input id="jo_dir" value="${U.esc(jo.director||'')}"/></div>
    <div class="fg"><label>ประเภทงาน</label><select id="jo_jt">${U.sel(JOB_TYPES,jo.job_type||'ตรวจสุขภาพ')}</select></div></div>
  <div class="fr"><div class="fg"><label>กะทำงาน</label><input id="jo_sh" value="${U.esc(jo.shift||'')}"/></div>
    <div class="fg"><label>หมายเหตุ</label><input id="jo_rm" value="${U.esc(jo.remark||'')}"/></div></div>`;},
  _signForm(jo){return`<div class="fr3"><div class="fg"><label>ผู้จัดทำ</label><input id="jo_s1" value="${U.esc(jo.signer_creator||'')}"/></div>
    <div class="fg"><label>หัวหน้าแผนก</label><input id="jo_s2" value="${U.esc(jo.signer_head||'')}"/></div>
    <div class="fg"><label>HR</label><input id="jo_s3" value="${U.esc(jo.signer_hr||'')}"/></div></div>`;},
  _saveGeneral(jo){DB.operation.saveJobOrder({...jo,company_name:document.getElementById('jo_co')?.value||jo.company_name,onsite_date:document.getElementById('jo_dt')?.value||jo.onsite_date,location:document.getElementById('jo_loc')?.value||jo.location,headcount:parseInt(document.getElementById('jo_hc')?.value)||jo.headcount,depart_time:document.getElementById('jo_dep')?.value||jo.depart_time,start_time:document.getElementById('jo_st')?.value||jo.start_time,end_time:document.getElementById('jo_et')?.value||jo.end_time,director:document.getElementById('jo_dir')?.value||jo.director,job_type:document.getElementById('jo_jt')?.value||jo.job_type,shift:document.getElementById('jo_sh')?.value||jo.shift,remark:document.getElementById('jo_rm')?.value||jo.remark,status:'Confirmed'});},
  _saveSign(jo){DB.operation.saveJobOrder({...DB.operation.getJobOrderById(jo.id),signer_creator:document.getElementById('jo_s1')?.value||jo.signer_creator,signer_head:document.getElementById('jo_s2')?.value||jo.signer_head,signer_hr:document.getElementById('jo_s3')?.value||jo.signer_hr});},
  _stationTable(joid){
    const sts=DB.operation.listStations(joid);
    const rows=sts.map((s,i)=>`<tr>
      <td>${s.order_no}</td><td>${s.station_code} ${s.station_name}</td>
      <td>${s.staff_count}</td><td>${s.profession}</td><td>${s.staff_name}</td><td>${s.staff_type}</td><td>${s.remark||''}</td>
      <td><button class="btn btn-danger btn-xs" onclick="Pages.op_prep.delStation(${s.id},${joid})">ลบ</button></td>
    </tr>`).join('');
    return`<div class="mb4 btn-grp"><button class="btn btn-pri btn-sm" onclick="Pages.op_prep.addStation(${joid})">+ เพิ่ม Station</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>#</th><th>Station</th><th>คน</th><th>วิชาชีพ</th><th>ชื่อ-สกุล</th><th>ประเภท</th><th>หมายเหตุ</th><th></th></tr></thead>
    <tbody id="st_tbody">${rows||'<tr><td colspan="8" class="empty t-sm">ยังไม่มี Station</td></tr>'}</tbody></table></div>`;
  },
  _vehicleTable(joid){
    const vs=DB.operation.listVehicles(joid);
    const rows=vs.map(v=>`<tr><td>${v.order_no}</td><td>${v.vehicle_name}</td><td>${v.staff_type}</td><td>${v.responsible_name}</td><td>${v.phone}</td><td>${v.remark||''}</td>
    <td><button class="btn btn-danger btn-xs" onclick="Pages.op_prep.delVehicle(${v.id},${joid})">ลบ</button></td></tr>`).join('');
    return`<div class="mb4 btn-grp"><button class="btn btn-pri btn-sm" onclick="Pages.op_prep.addVehicle(${joid})">+ เพิ่มยานพาหนะ</button></div>
    <div class="tbl-wrap"><table><thead><tr><th>#</th><th>ยานพาหนะ</th><th>ประเภท</th><th>ผู้รับผิดชอบ</th><th>เบอร์</th><th>หมายเหตุ</th><th></th></tr></thead>
    <tbody>${rows||'<tr><td colspan="7" class="empty t-sm">ยังไม่มี</td></tr>'}</tbody></table></div>`;
  },
  addStation(joid){
    const sts=DB.operation.listStations(joid);
    const nextNo=sts.length>0?Math.max(...sts.map(s=>s.order_no))+1:1;
    Modal.open(`<div class="fr"><div class="fg"><label class="req">Station</label><select id="as_code">${U.stationOpts()}</select></div>
      <div class="fg"><label>จำนวนคน</label><input id="as_cnt" type="number" value="1"/></div></div>
    <div class="fr"><div class="fg"><label>วิชาชีพ</label><select id="as_prof">${U.sel(PROFESSIONS,'เจ้าหน้าที่')}</select></div>
      <div class="fg"><label>ชื่อ-สกุล</label><input id="as_name"/></div></div>
    <div class="fr"><div class="fg"><label>ประเภท</label><select id="as_type">${U.sel(STAFF_TYPES,'ในองค์กร')}</select></div>
      <div class="fg"><label>หมายเหตุ</label><input id="as_rm"/></div></div>`,
    'เพิ่ม Station',()=>{
      const sel=document.getElementById('as_code');
      const code=sel.value,name=sel.options[sel.selectedIndex]?.text.replace(code+' ','');
      DB.operation.saveStation({job_order_id:joid,order_no:nextNo,station_code:code,station_name:name,staff_count:parseInt(document.getElementById('as_cnt').value)||1,profession:document.getElementById('as_prof').value,staff_name:document.getElementById('as_name').value,staff_type:document.getElementById('as_type').value,remark:document.getElementById('as_rm').value});
      Modal.close();this.editJO(joid);U.toast('✅ เพิ่ม Station แล้ว');
    });
  },
  delStation(id,joid){if(U.confirm('ลบ Station นี้?')){DB.operation.deleteStation(id);this.editJO(joid);}},
  addVehicle(joid){
    const vs=DB.operation.listVehicles(joid);const nextNo=vs.length>0?Math.max(...vs.map(v=>v.order_no))+1:1;
    Modal.open(`<div class="fr"><div class="fg"><label class="req">ยานพาหนะ</label><select id="av_veh">${U.sel(VEHICLES,'')}</select></div>
      <div class="fg"><label>ประเภท</label><select id="av_type">${U.sel(STAFF_TYPES,'ในองค์กร')}</select></div></div>
    <div class="fr"><div class="fg"><label>ชื่อ-สกุล ผู้รับผิดชอบ</label><input id="av_name"/></div>
      <div class="fg"><label>เบอร์โทร</label><input id="av_ph"/></div></div>
    <div class="fg"><label>หมายเหตุ</label><input id="av_rm"/></div>`,
    'เพิ่มยานพาหนะ',()=>{
      DB.operation.saveVehicle({job_order_id:joid,order_no:nextNo,vehicle_name:document.getElementById('av_veh').value,staff_type:document.getElementById('av_type').value,responsible_name:document.getElementById('av_name').value,phone:document.getElementById('av_ph').value,remark:document.getElementById('av_rm').value});
      Modal.close();this.editJO(joid);U.toast('✅ เพิ่มยานพาหนะแล้ว');
    });
  },
  delVehicle(id,joid){if(U.confirm('ลบ?')){DB.operation.deleteVehicle(id);this.editJO(joid);}},
  delJO(id){if(U.confirm('ลบใบแจ้งงานนี้?')){/* delete stations & vehicles */DB.operation.listStations(id).forEach(s=>DB.operation.deleteStation(s.id));DB.operation.listVehicles(id).forEach(v=>DB.operation.deleteVehicle(v.id));DB._set('operation_db','job_orders',DB._get('operation_db','job_orders').filter(r=>r.id!==id));this.render();U.toast('✅ ลบแล้ว');}},
  viewJO(id){
    const jo=DB.operation.getJobOrderById(id);
    const p=DB.sales.getProject(jo.project_id);
    Modal.open(`<div class="no-print btn-grp mb4">
      <button class="btn btn-pri" onclick="Pages.op_prep.printJO(${id})">🖨 พิมพ์ A4</button>
      <button class="btn btn-out" onclick="Modal.close();Pages.op_prep.editJO(${id})">✏️ แก้ไข</button>
    </div>
    <div id="jo-preview-wrap"></div>`,'ใบแจ้งงาน — ดูตัวอย่าง',null,true);
    setTimeout(()=>{
      const wrap=document.getElementById('jo-preview-wrap');
      if(wrap)wrap.innerHTML=Pages.op_prep._buildJOHTML(id);
    },50);
  },
  _buildJOHTML(id){
    const jo=DB.operation.getJobOrderById(id);
    const sts=DB.operation.listStations(id);
    const vs=DB.operation.listVehicles(id);
    const p=DB.sales.getProject(jo.project_id);
    const today=new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'});
    const stRows=sts.map(s=>`<tr><td style="text-align:center">${s.order_no}</td><td><span style="background:#EFF6FF;color:#1E40AF;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700">${s.station_code}</span></td><td>${s.station_name}</td><td style="text-align:center">${s.staff_count}</td><td>${s.profession}</td><td style="font-weight:600">${s.staff_name}</td><td>${s.staff_type}</td><td style="color:#8896A8">${s.remark||''}</td></tr>`).join('');
    const vRows=vs.map(v=>`<tr><td style="text-align:center">${v.order_no}</td><td style="font-weight:600">${v.vehicle_name}</td><td>${v.staff_type}</td><td>${v.responsible_name}</td><td style="font-family:monospace">${v.phone}</td><td style="color:#8896A8">${v.remark||''}</td></tr>`).join('');
    return `<div class="jo-print-doc">
      <div class="jo-doc-header">
        <div class="jo-doc-brand">
          <div class="brand-mark">🏥</div>
          <div class="brand-text">
            <h1>Mobile Checkup System</h1>
            <p>ใบแจ้งงานออกหน่วยตรวจสุขภาพ</p>
          </div>
        </div>
        <div class="jo-doc-meta">
          <div class="doc-no">${p?.project_code||'-'}</div>
          <div class="doc-date">วันที่พิมพ์: ${today}</div>
          <div class="doc-badge">${jo.job_type||'ตรวจสุขภาพ'}</div>
        </div>
      </div>
      <div class="jo-section-title">ข้อมูลทั่วไป</div>
      <div class="jo-info-grid">
        <div class="jo-info-cell"><div class="lbl">ชื่อบริษัท / องค์กร</div><div class="val">${jo.company_name}</div></div>
        <div class="jo-info-cell highlight"><div class="lbl">วันที่ออกหน่วย</div><div class="val">${U.fmtD(jo.onsite_date)}</div></div>
        <div class="jo-info-cell" style="grid-column:span 2"><div class="lbl">สถานที่</div><div class="val">${jo.location||'-'}</div></div>
        <div class="jo-info-cell"><div class="lbl">จำนวนพนักงาน</div><div class="val">${(jo.headcount||0).toLocaleString()} คน</div></div>
        <div class="jo-info-cell"><div class="lbl">Director</div><div class="val">${jo.director||'-'}</div></div>
        <div class="jo-info-cell"><div class="lbl">เวลาออกเดินทาง</div><div class="val">${jo.depart_time||'-'}</div></div>
        <div class="jo-info-cell"><div class="lbl">เวลาเริ่มตรวจ — สิ้นสุด</div><div class="val">${jo.start_time||'-'} — ${jo.end_time||'-'}</div></div>
        <div class="jo-info-cell"><div class="lbl">กะทำงาน</div><div class="val">${jo.shift||'-'}</div></div>
        <div class="jo-info-cell"><div class="lbl">หมายเหตุ</div><div class="val">${jo.remark||'-'}</div></div>
      </div>
      <div class="jo-section-title">จุดตรวจ Station และอัตรากำลัง</div>
      <table class="jo-table">
        <thead><tr><th>#</th><th>Code</th><th>จุดตรวจ Station</th><th>คน</th><th>วิชาชีพ</th><th>ชื่อ-สกุล</th><th>ประเภท</th><th>หมายเหตุ</th></tr></thead>
        <tbody>${stRows||'<tr><td colspan="8" style="text-align:center;padding:16px;color:#8896A8">ยังไม่มีรายการ Station</td></tr>'}</tbody>
      </table>
      <div class="jo-section-title">ยานพาหนะ</div>
      <table class="jo-table">
        <thead><tr><th>#</th><th>รายการ</th><th>ประเภท</th><th>ผู้รับผิดชอบ</th><th>เบอร์โทร</th><th>หมายเหตุ</th></tr></thead>
        <tbody>${vRows||'<tr><td colspan="6" style="text-align:center;padding:16px;color:#8896A8">ยังไม่มีรายการยานพาหนะ</td></tr>'}</tbody>
      </table>
      <div class="jo-sign-section">
        <div class="jo-sign-box"><div class="sign-line"></div><div class="sign-label">ผู้จัดทำ</div><div class="sign-name">${jo.signer_creator||'..................................'}</div></div>
        <div class="jo-sign-box"><div class="sign-line"></div><div class="sign-label">หัวหน้าแผนก</div><div class="sign-name">${jo.signer_head||'..................................'}</div></div>
        <div class="jo-sign-box"><div class="sign-line"></div><div class="sign-label">HR</div><div class="sign-name">${jo.signer_hr||'..................................'}</div></div>
      </div>
      <div class="jo-footer">
        <span>Mobile Checkup System — ใบแจ้งงานออกหน่วย</span>
        <span>พิมพ์: ${today}</span>
      </div>
    </div>`;
  },
  printJO(id){
    const html=this._buildJOHTML(id);
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ใบแจ้งงาน</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@600;700&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
    <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sarabun',sans-serif;color:#1A2332;padding:24px;background:#fff;font-size:13px;}
    .jo-print-doc{max-width:760px;margin:0 auto;}
    .jo-doc-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;margin-bottom:14px;border-bottom:3px solid #0D2137;}
    .jo-doc-brand{display:flex;align-items:center;gap:12px;}
    .brand-mark{width:44px;height:44px;background:#0D2137;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;}
    .brand-text h1{font-family:'Prompt',sans-serif;font-size:15px;font-weight:700;color:#0D2137;margin-bottom:2px;}
    .brand-text p{font-size:11px;color:#8896A8;}
    .jo-doc-meta{text-align:right;}
    .doc-no{font-family:'IBM Plex Mono',monospace;font-size:17px;font-weight:700;color:#0D2137;}
    .doc-date{font-size:10px;color:#8896A8;margin-top:2px;}
    .doc-badge{display:inline-block;margin-top:5px;padding:2px 12px;border-radius:20px;background:linear-gradient(90deg,#C9A84C,#E8C97A);color:#fff;font-size:10px;font-weight:700;}
    .jo-section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#8896A8;margin:12px 0 7px;display:flex;align-items:center;gap:8px;}
    .jo-section-title::after{content:'';flex:1;height:1px;background:#E4E9F0;}
    .jo-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;}
    .jo-info-cell{background:#F9FAFB;border-radius:6px;padding:7px 10px;border:1px solid #E4E9F0;}
    .jo-info-cell .lbl{font-size:9px;font-weight:700;color:#8896A8;text-transform:uppercase;letter-spacing:.06em;}
    .jo-info-cell .val{font-size:12px;font-weight:600;color:#1A2332;margin-top:1px;}
    .jo-info-cell.highlight{background:#F0FDF4;border-color:#86EFAC;}
    .jo-info-cell.highlight .val{color:#065F46;}
    .jo-table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:11px;}
    .jo-table thead tr{background:#0D2137;}
    .jo-table th{padding:7px 9px;font-size:9px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em;text-align:left;border:none;}
    .jo-table td{padding:7px 9px;border-bottom:1px solid #E4E9F0;vertical-align:middle;}
    .jo-table tr:last-child td{border-bottom:none;}
    .jo-table tbody tr:nth-child(even) td{background:#F9FAFB;}
    .jo-sign-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:24px;padding-top:14px;border-top:1px solid #E4E9F0;}
    .jo-sign-box{text-align:center;}
    .sign-line{height:55px;border-bottom:1px solid #C8D0DC;margin-bottom:7px;}
    .sign-label{font-size:10px;color:#8896A8;font-weight:600;}
    .sign-name{font-size:11px;color:#1A2332;font-weight:600;margin-top:2px;}
    .jo-footer{margin-top:14px;padding-top:8px;border-top:1px solid #E4E9F0;display:flex;justify-content:space-between;font-size:9px;color:#B0BAC8;}
    @media print{@page{size:A4;margin:15mm;} button{display:none!important;}}
    .no-print{display:flex;gap:8px;margin-bottom:16px;}
    .btn-p{padding:8px 18px;background:#0D2137;color:#fff;border:none;border-radius:7px;font-family:Sarabun,sans-serif;font-size:13px;cursor:pointer;}
    </style></head><body>
    <div class="no-print"><button class="btn-p" onclick="window.print()">🖨 พิมพ์ A4</button></div>
    ${html}</body></html>`);
    w.document.close();w.focus();
  }
};

/* ── OP ONSITE ── */
Pages.op_onsite={
  currentPid:null,
  render(){
    const projs=DB.sales.listProjects();
    const canAdd=DB.auth.can('add','op_onsite');
    const pOpts=`<option value="">-- เลือก Project --</option>`+projs.map(p=>`<option value="${p.id}" ${this.currentPid===p.id?'selected':''}>${p.project_code} — ${p.company_name} (${U.fmtD(p.onsite_date)})</option>`).join('');
    document.getElementById('content').innerHTML=`
    <div class="ph"><div><h2>🚑 Operation — Onsite</h2><p>บันทึกสรุปยอดหน้างานแต่ละ Station</p></div></div>
    <div class="card mb4">
      <div class="fg"><label>เลือก Project</label>
        <select id="ons_sel" onchange="Pages.op_onsite.loadProject(parseInt(this.value))">
          ${pOpts}
        </select>
      </div>
    </div>
    <div id="ons_detail"></div>`;
    if(this.currentPid)this.loadProject(this.currentPid);
  },
  loadProject(pid){
    if(!pid){document.getElementById('ons_detail').innerHTML='';this.currentPid=null;return;}
    const p=DB.sales.getProject(pid);
    if(!p)return;
    this.currentPid=pid;
    document.getElementById('ons_sel').value=pid;
    const logs=DB.operation.listOnsiteLogs(pid);
    const jo=DB.operation.getJobOrder(pid);
    const canAdd=DB.auth.can('add','op_onsite'),canDel=DB.auth.can('delete','op_onsite');
    const totalDone=logs.reduce((s,l)=>s+(l.total_done||0),0);
    const totalMiss=logs.reduce((s,l)=>s+(l.missing||0),0);
    const totalRef=logs.reduce((s,l)=>s+(l.refused||0),0);
    const pct=p.headcount>0?Math.round(totalDone/p.headcount*100):0;
    const canEdit=DB.auth.can('edit','op_onsite');
    const files=Pages.op_onsite._getFiles(pid);
    const fileChips=files.map((f,i)=>`<span class="file-item" style="display:inline-flex;margin:2px 4px 2px 0">
      <span class="file-icon">${Pages.op_onsite._fileIcon(f.type)}</span>
      <span class="file-name">${U.esc(f.name)}</span>
      <span class="file-size">${f.size}</span>
      ${canEdit?`<button class="file-remove" onclick="Pages.op_onsite.removeFile(${pid},${i})">✕</button>`:''}
    </span>`).join('');
    const logRows=logs.map(l=>`<tr>
      <td><span class="badge b-onsite" style="font-family:monospace;font-size:10px">${l.station_code||''}</span></td>
      <td class="fw6">${l.station_name}</td>
      <td class="t-center">${l.total_expected}</td>
      <td class="t-center t-success fw6">${l.total_done}</td>
      <td class="t-center t-warn">${l.missing}</td>
      <td class="t-center t-danger">${l.refused}</td>
      <td class="t-sm t-muted">${l.note||'-'}</td>
      <td>
        ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.op_onsite.editLog(${l.id},${pid})" style="margin-right:4px">แก้ไข</button>`:''}
        ${canDel?`<button class="btn btn-danger btn-xs" onclick="Pages.op_onsite.delLog(${l.id})">ลบ</button>`:''}
      </td>
    </tr>`).join('');
    document.getElementById('ons_detail').innerHTML=`
    <div class="metrics-grid">
      <div class="metric-card acc"><div class="metric-label">เป้าหมาย</div><div class="metric-value">${(p.headcount||0).toLocaleString()}</div><div class="metric-sub">คน</div></div>
      <div class="metric-card suc"><div class="metric-label">ตรวจสำเร็จ</div><div class="metric-value">${totalDone.toLocaleString()}</div><div class="metric-sub">${pct}%</div></div>
      <div class="metric-card warn"><div class="metric-label">เก็บตก/ลา</div><div class="metric-value">${totalMiss}</div></div>
      <div class="metric-card danger"><div class="metric-label">ปฏิเสธ</div><div class="metric-value">${totalRef}</div></div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title">📊 สรุปยอด — ${p.project_code} | ${p.company_name}</span>
        <div class="btn-grp">
          ${canAdd?`<button class="btn btn-pri btn-sm" onclick="Pages.op_onsite.addLog(${pid})">+ บันทึก Station</button>`:''}
          <button class="btn btn-out btn-sm" onclick="Pages.op_onsite.printSummary(${pid})">🖨 พิมพ์</button>
          <button class="btn btn-out btn-sm" onclick="Pages.op_onsite.exportCSV(${pid})">📥 Excel</button>
        </div>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Code</th><th>Station</th><th style="text-align:center">เป้าหมาย</th><th style="text-align:center">สำเร็จ</th><th style="text-align:center">เก็บตก</th><th style="text-align:center">ปฏิเสธ</th><th>หมายเหตุ</th><th></th></tr></thead>
        <tbody>${logRows||'<tr><td colspan="8" class="empty"><div class="icon">📋</div><p>ยังไม่มีบันทึก กด "+ บันทึก Station"</p></td></tr>'}</tbody>
        ${logs.length>0?`<tfoot><tr>
          <td colspan="2" class="fw6">รวมทั้งหมด</td>
          <td class="fw6 t-center">${logs.reduce((s,l)=>s+l.total_expected,0)}</td>
          <td class="fw6 t-center t-success">${totalDone}</td>
          <td class="fw6 t-center t-warn">${totalMiss}</td>
          <td class="fw6 t-center t-danger">${totalRef}</td>
          <td colspan="2"></td>
        </tr></tfoot>`:''}
      </table></div>
      ${canEdit?`<div class="divider"></div>
      <div class="card-title" style="margin-bottom:10px;font-size:13px">📎 ไฟล์แนบ</div>
      <div id="ons_files">${fileChips||'<span class="t-sm t-muted">ยังไม่มีไฟล์แนบ</span>'}</div>
      <div class="mt2">
        <input type="file" id="ons_file_inp" multiple style="display:none" onchange="Pages.op_onsite.attachFiles(${pid},this)"/>
        <button class="btn btn-out btn-sm" onclick="document.getElementById('ons_file_inp').click()">📎 แนบไฟล์</button>
        <span class="t-xs t-muted" style="margin-left:8px">รองรับทุกประเภทไฟล์</span>
      </div>`:''}
      ${logs.length>0&&canAdd?`<div class="divider"></div><div class="btn-grp">
        <button class="btn btn-suc" onclick="Pages.op_onsite.closeUnit(${pid})">✅ ปิดหน่วย + ส่งข้อมูล Lab & Report</button>
        <button class="btn btn-out btn-sm" onclick="Pages.op_onsite.manageSigner(${pid})">✍️ ลายเซ็น</button>
      </div>`:''}
    </div>`;
  },
  addLog(pid){
    const jo=DB.operation.getJobOrder(pid);
    const sts=jo?DB.operation.listStations(jo.id):[];
    const existCodes=DB.operation.listOnsiteLogs(pid).map(l=>l.station_code);
    const available=sts.length>0
      ? sts.filter(s=>!existCodes.includes(s.station_code))
      : STATIONS.filter(s=>!existCodes.includes(s.code));
    let stOpts='';
    if(sts.length>0){
      stOpts=available.length>0
        ? available.map(s=>`<option value="${s.station_code}">${s.station_code} ${s.station_name}</option>`).join('')
        : U.stationOpts();
    } else {
      stOpts=U.stationOpts();
    }
    // also allow "รวมทุก Station"
    stOpts=`<option value="รวม">รวมทุก Station</option>`+stOpts;
    const p=DB.sales.getProject(pid);
    Modal.open(`
    <div class="fr">
      <div class="fg"><label class="req">Station</label><select id="ol_st">${stOpts}</select></div>
      <div class="fg"><label>เป้าหมาย (คน)</label><input id="ol_exp" type="number" value="${p?.headcount||0}"/></div>
    </div>
    <div class="fr3">
      <div class="fg"><label>ตรวจสำเร็จ</label><input id="ol_done" type="number" placeholder="0"/></div>
      <div class="fg"><label>เก็บตก/ลา</label><input id="ol_miss" type="number" value="0"/></div>
      <div class="fg"><label>ปฏิเสธ</label><input id="ol_ref" type="number" value="0"/></div>
    </div>
    <div class="fg"><label>หมายเหตุ</label><textarea id="ol_nt" placeholder="บันทึกปัญหาหรือเหตุการณ์พิเศษ..."></textarea></div>`,
    'บันทึกผล Onsite',()=>{
      const sel=document.getElementById('ol_st');
      const code=sel.value;
      const stName=code==='รวม'?'รวมทุก Station':sel.options[sel.selectedIndex]?.text.replace(code+' ','').trim()||code;
      DB.operation.saveOnsiteLog({
        project_id:pid, station_code:code, station_name:stName,
        total_expected:parseInt(document.getElementById('ol_exp').value)||0,
        total_done:parseInt(document.getElementById('ol_done').value)||0,
        missing:parseInt(document.getElementById('ol_miss').value)||0,
        refused:parseInt(document.getElementById('ol_ref').value)||0,
        note:document.getElementById('ol_nt').value
      });
      Modal.close();this.loadProject(pid);U.toast('✅ บันทึกแล้ว');
    });
  },
  editLog(id,pid){
    const l=DB.operation.listOnsiteLogs(pid).find(x=>x.id===id);
    if(!l)return;
    Modal.open(`
    <div class="fr">
      <div class="fg"><label>Station</label><input value="${U.esc(l.station_code+' '+l.station_name)}" disabled/></div>
      <div class="fg"><label>เป้าหมาย</label><input id="el_exp" type="number" value="${l.total_expected}"/></div>
    </div>
    <div class="fr3">
      <div class="fg"><label>ตรวจสำเร็จ</label><input id="el_done" type="number" value="${l.total_done}"/></div>
      <div class="fg"><label>เก็บตก/ลา</label><input id="el_miss" type="number" value="${l.missing}"/></div>
      <div class="fg"><label>ปฏิเสธ</label><input id="el_ref" type="number" value="${l.refused}"/></div>
    </div>
    <div class="fg"><label>หมายเหตุ</label><textarea id="el_nt">${U.esc(l.note||'')}</textarea></div>`,
    'แก้ไขบันทึก Onsite',()=>{
      DB.operation.saveOnsiteLog({...l,
        total_expected:parseInt(document.getElementById('el_exp').value)||0,
        total_done:parseInt(document.getElementById('el_done').value)||0,
        missing:parseInt(document.getElementById('el_miss').value)||0,
        refused:parseInt(document.getElementById('el_ref').value)||0,
        note:document.getElementById('el_nt').value
      });
      Modal.close();this.loadProject(pid);U.toast('✅ แก้ไขแล้ว');
    });
  },
  delLog(id){
    if(U.confirm('ลบรายการนี้?')){DB.operation.deleteOnsiteLog(id);this.loadProject(this.currentPid);}
  },
  _filesKey(pid){return`onsite_files_${pid}`;},
  _getFiles(pid){try{return JSON.parse(localStorage.getItem(this._filesKey(pid))||'[]')}catch{return[];}},
  _saveFiles(pid,files){localStorage.setItem(this._filesKey(pid),JSON.stringify(files));},
  _fileIcon(type){const t=type||'';if(t.includes('image'))return'🖼';if(t.includes('pdf'))return'📄';if(t.includes('sheet')||t.includes('excel'))return'📊';if(t.includes('word')||t.includes('doc'))return'📝';return'📎';},
  attachFiles(pid,inp){
    const existing=this._getFiles(pid);
    Array.from(inp.files).forEach(f=>{
      existing.push({name:f.name,size:f.size>1024*1024?`${(f.size/1024/1024).toFixed(1)}MB`:`${Math.round(f.size/1024)}KB`,type:f.type,added_at:new Date().toISOString()});
    });
    this._saveFiles(pid,existing);
    this.loadProject(pid);
    U.toast(`✅ แนบไฟล์ ${inp.files.length} ไฟล์แล้ว`);
  },
  removeFile(pid,idx){
    if(!U.confirm('ลบไฟล์แนบนี้?'))return;
    const files=this._getFiles(pid);files.splice(idx,1);
    this._saveFiles(pid,files);this.loadProject(pid);
  },
  manageSigner(pid){
    const key=`onsite_signer_${pid}`;
    let sg={};try{sg=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
    Modal.open(`
    <div class="ab info mb4">ลายเซ็นจะแสดงในใบสรุปยอดเมื่อพิมพ์</div>
    <div class="fg"><label>ผู้จัดทำ / ผู้บันทึก</label><input id="sg_a" value="${U.esc(sg.signer_a||'')}"/></div>
    <div class="fg"><label>ผู้ตรวจสอบ</label><input id="sg_b" value="${U.esc(sg.signer_b||'')}"/></div>
    <div class="fg"><label>หัวหน้างาน / Supervisor</label><input id="sg_c" value="${U.esc(sg.signer_c||'')}"/></div>`,
    'กำหนดลายเซ็นใบสรุปยอด',()=>{
      localStorage.setItem(key,JSON.stringify({signer_a:document.getElementById('sg_a').value,signer_b:document.getElementById('sg_b').value,signer_c:document.getElementById('sg_c').value}));
      Modal.close();U.toast('✅ บันทึกลายเซ็นแล้ว');
    });
  },
  closeUnit(pid){
    const p=DB.sales.getProject(pid);
    if(!U.confirm(`ปิดหน่วย ${p.project_code}\nและส่งข้อมูลให้ Lab + Report?`))return;
    DB.sales.saveProject({...p,status:'Lab'});
    const tat=DB.config.getTAT();
    const tatDays=(p.headcount||0)>tat.threshold?tat.large:tat.small;
    const td=new Date();td.setDate(td.getDate()+tatDays);
    const sd=new Date(td);sd.setDate(sd.getDate()+DB.config.getSLA().days_after_tat);
    if(!DB.lab.getLabProject(pid))DB.lab.saveLabProject({project_id:pid,received_at:DB._now(),headcount:p.headcount,tat_days:tatDays,tat_deadline:td.toISOString(),status:'analyzing'});
    if(!DB.report.getPlan(pid))DB.report.savePlan({project_id:pid,program_code:p.package_code,headcount:p.headcount,onsite_date:p.onsite_date,created_by:'Operation',tat_deadline:td.toISOString(),sla_deadline:sd.toISOString(),status:'pending'});
    this.render();U.toast('✅ ปิดหน่วยสำเร็จ — ส่ง Specimen + Raw Data แล้ว');
  },
  exportCSV(pid){
    const p=DB.sales.getProject(pid);
    const logs=DB.operation.listOnsiteLogs(pid);
    let csv='\uFEFF';
    csv+=`"สรุปยอด Onsite — ${p?.project_code} ${p?.company_name}"\n`;
    csv+=`"วันตรวจ: ${U.fmtD(p?.onsite_date)}","สถานที่: ${p?.location||''}"\n\n`;
    csv+='Code,Station,เป้าหมาย,สำเร็จ,เก็บตก,ปฏิเสธ,หมายเหตุ\n';
    logs.forEach(l=>{csv+=`${l.station_code||''},${l.station_name},${l.total_expected},${l.total_done},${l.missing},${l.refused},"${l.note||''}"\n`;});
    csv+=`,รวม,${logs.reduce((s,l)=>s+l.total_expected,0)},${logs.reduce((s,l)=>s+l.total_done,0)},${logs.reduce((s,l)=>s+l.missing,0)},${logs.reduce((s,l)=>s+l.refused,0)},\n`;
    const a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download=`Onsite_${p?.project_code||pid}.csv`;a.click();
    U.toast('✅ Export สำเร็จ');
  },
  printSummary(pid){
    const p=DB.sales.getProject(pid);
    const logs=DB.operation.listOnsiteLogs(pid);
    const files=this._getFiles(pid);
    const sgKey=`onsite_signer_${pid}`;
    let sg={};try{sg=JSON.parse(localStorage.getItem(sgKey)||'{}')}catch{}
    const totalExp=logs.reduce((s,l)=>s+l.total_expected,0);
    const totalDone=logs.reduce((s,l)=>s+(l.total_done||0),0);
    const totalMiss=logs.reduce((s,l)=>s+(l.missing||0),0);
    const totalRef=logs.reduce((s,l)=>s+(l.refused||0),0);
    const pct=p.headcount>0?Math.round(totalDone/p.headcount*100):0;
    const today=new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'});
    const rows=logs.map((l,i)=>`<tr>
      <td style="text-align:center;color:#8896A8;font-size:11px">${i+1}</td>
      <td><span style="background:#EFF6FF;color:#1E40AF;padding:1px 7px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace">${l.station_code||'-'}</span></td>
      <td style="font-weight:600">${l.station_name}</td>
      <td style="text-align:center">${l.total_expected}</td>
      <td style="text-align:center;color:#065F46;font-weight:700">${l.total_done}</td>
      <td style="text-align:center;color:#92400E">${l.missing}</td>
      <td style="text-align:center;color:#991B1B">${l.refused}</td>
      <td style="color:#8896A8;font-size:11px">${l.note||''}</td>
    </tr>`).join('');
    const fileList=files.length>0?files.map(f=>`<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:#F9FAFB;border:1px solid #E4E9F0;border-radius:5px;font-size:10px;margin:2px">${this._fileIcon(f.type)} ${f.name}</span>`).join(''):'<span style="font-size:11px;color:#8896A8">ไม่มีไฟล์แนบ</span>';
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>สรุปยอด Onsite — ${p.project_code}</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@600;700&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
    <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sarabun',sans-serif;color:#1A2332;background:#fff;padding:0;}
    .doc{max-width:780px;margin:0 auto;padding:24px;}
    /* Header */
    .doc-header{background:linear-gradient(135deg,#0D2137 0%,#1A3A5C 100%);color:#fff;padding:24px 28px;border-radius:12px 12px 0 0;margin:-0px;}
    .doc-header-inner{display:flex;justify-content:space-between;align-items:flex-start;}
    .doc-brand{display:flex;align-items:center;gap:14px;}
    .doc-brand .icon{width:48px;height:48px;background:rgba(201,168,76,.25);border:2px solid rgba(201,168,76,.4);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;}
    .doc-brand h1{font-family:'Prompt',sans-serif;font-size:18px;font-weight:700;margin-bottom:3px;}
    .doc-brand p{font-size:11px;color:rgba(255,255,255,.6);}
    .doc-meta{text-align:right;}
    .doc-code{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:700;letter-spacing:.02em;}
    .doc-date{font-size:10px;color:rgba(255,255,255,.55);margin-top:3px;}
    .doc-type{display:inline-block;margin-top:6px;padding:3px 14px;border-radius:20px;background:linear-gradient(90deg,#C9A84C,#E8C97A);font-size:10px;font-weight:700;}
    /* Stats bar */
    .stats-bar{background:#142D4C;display:grid;grid-template-columns:repeat(4,1fr);padding:16px 28px;border-radius:0;margin-bottom:0;}
    .stat-item{text-align:center;padding:0 12px;border-right:1px solid rgba(255,255,255,.08);}
    .stat-item:last-child{border-right:none;}
    .stat-val{font-family:'Prompt',sans-serif;font-size:24px;font-weight:700;color:#fff;}
    .stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.45);margin-top:3px;}
    .stat-sub{font-size:10px;font-weight:600;color:rgba(255,255,255,.6);margin-top:2px;}
    .stat-item.suc .stat-val{color:#6EE7B7;}
    .stat-item.warn .stat-val{color:#FCD34D;}
    .stat-item.danger .stat-val{color:#FCA5A5;}
    /* Body */
    .doc-body{padding:20px 28px;border:1px solid #E4E9F0;border-top:none;border-radius:0 0 12px 12px;}
    .info-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;}
    .info-cell{background:#F9FAFB;border-radius:7px;padding:8px 12px;border:1px solid #E4E9F0;}
    .info-cell .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#8896A8;margin-bottom:2px;}
    .info-cell .val{font-size:12px;font-weight:600;color:#1A2332;}
    .sec-hd{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#8896A8;margin:14px 0 8px;display:flex;align-items:center;gap:8px;}
    .sec-hd::after{content:'';flex:1;height:1px;background:#E4E9F0;}
    .prog-wrap{background:#E4E9F0;border-radius:100px;height:7px;margin:8px 0 16px;overflow:hidden;}
    .prog-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,#0D2137,#00C4B4);transition:width .5s;}
    table{width:100%;border-collapse:collapse;margin-bottom:10px;}
    thead tr{background:#0D2137;}
    th{padding:9px 10px;font-size:9.5px;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em;text-align:left;border:none;}
    th:first-child{border-radius:6px 0 0 0;}th:last-child{border-radius:0 6px 0 0;}
    td{padding:9px 10px;border-bottom:1px solid #E4E9F0;font-size:12px;vertical-align:middle;}
    tr:last-child td{border-bottom:none;}
    tbody tr:nth-child(even) td{background:#F9FAFB;}
    tfoot td{background:#F0F4F8;font-weight:700;border-top:2px solid #C8D0DC;font-size:12px;}
    /* Signatures */
    .sign-section{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:24px;padding-top:16px;border-top:1px solid #E4E9F0;}
    .sign-box{text-align:center;}
    .sign-line{height:56px;border-bottom:1px dashed #C8D0DC;background:linear-gradient(transparent 90%,rgba(13,33,55,.04) 100%);margin-bottom:8px;}
    .sign-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#8896A8;}
    .sign-name{font-size:12px;font-weight:600;color:#1A2332;margin-top:3px;min-height:16px;}
    .doc-footer{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid #E4E9F0;font-size:9px;color:#B0BAC8;}
    .no-print{display:flex;gap:8px;padding:12px 24px;background:#F9FAFB;border-bottom:1px solid #E4E9F0;}
    .btn-p{padding:8px 20px;background:linear-gradient(135deg,#0D2137,#1A3A5C);color:#fff;border:none;border-radius:7px;cursor:pointer;font-family:'Sarabun',sans-serif;font-size:13px;font-weight:600;}
    @media print{.no-print{display:none!important;}@page{size:A4;margin:12mm;}}
    </style></head><body>
    <div class="no-print">
      <button class="btn-p" onclick="window.print()">🖨 พิมพ์ A4</button>
    </div>
    <div class="doc">
      <div class="doc-header">
        <div class="doc-header-inner">
          <div class="doc-brand">
            <div class="icon">🏥</div>
            <div>
              <h1>สรุปยอดออกหน่วย Onsite</h1>
              <p>Mobile Checkup Health Management System</p>
            </div>
          </div>
          <div class="doc-meta">
            <div class="doc-code">${p.project_code}</div>
            <div class="doc-date">${today}</div>
            <div class="doc-type">${p.package_code||'HEALTH CHECK'}</div>
          </div>
        </div>
      </div>
      <div class="stats-bar">
        <div class="stat-item"><div class="stat-val">${(p.headcount||0).toLocaleString()}</div><div class="stat-lbl">เป้าหมาย</div></div>
        <div class="stat-item suc"><div class="stat-val">${totalDone.toLocaleString()}</div><div class="stat-lbl">ตรวจสำเร็จ</div><div class="stat-sub">${pct}%</div></div>
        <div class="stat-item warn"><div class="stat-val">${totalMiss}</div><div class="stat-lbl">เก็บตก / ลา</div></div>
        <div class="stat-item danger"><div class="stat-val">${totalRef}</div><div class="stat-lbl">ปฏิเสธ</div></div>
      </div>
      <div class="doc-body">
        <div class="info-row">
          <div class="info-cell"><div class="lbl">บริษัท</div><div class="val">${p.company_name}</div></div>
          <div class="info-cell"><div class="lbl">วันที่ออกตรวจ</div><div class="val">${U.fmtD(p.onsite_date)}</div></div>
          <div class="info-cell"><div class="lbl">สถานที่</div><div class="val">${p.location||'-'}</div></div>
        </div>
        <div class="sec-hd">ความคืบหน้า ${pct}%</div>
        <div class="prog-wrap"><div class="prog-fill" style="width:${pct}%"></div></div>
        <div class="sec-hd">รายการตรวจแต่ละ Station</div>
        <table>
          <thead><tr><th>#</th><th>Code</th><th>Station</th><th style="text-align:center">เป้าหมาย</th><th style="text-align:center">สำเร็จ</th><th style="text-align:center">เก็บตก</th><th style="text-align:center">ปฏิเสธ</th><th>หมายเหตุ</th></tr></thead>
          <tbody>${rows||'<tr><td colspan="8" style="text-align:center;padding:20px;color:#8896A8">ไม่มีข้อมูล</td></tr>'}</tbody>
          <tfoot><tr><td colspan="3" style="font-weight:700">รวมทั้งหมด</td><td style="text-align:center">${totalExp}</td><td style="text-align:center;color:#065F46">${totalDone}</td><td style="text-align:center;color:#92400E">${totalMiss}</td><td style="text-align:center;color:#991B1B">${totalRef}</td><td></td></tr></tfoot>
        </table>
        ${files.length>0?`<div class="sec-hd">ไฟล์แนบ</div><div style="margin-bottom:14px">${fileList}</div>`:''}
        <div class="sign-section">
          <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้จัดทำ / ผู้บันทึก</div><div class="sign-name">${sg.signer_a||''}</div></div>
          <div class="sign-box"><div class="sign-line"></div><div class="sign-label">ผู้ตรวจสอบ</div><div class="sign-name">${sg.signer_b||''}</div></div>
          <div class="sign-box"><div class="sign-line"></div><div class="sign-label">หัวหน้างาน / Supervisor</div><div class="sign-name">${sg.signer_c||''}</div></div>
        </div>
        <div class="doc-footer">
          <span>Mobile Checkup System — สรุปยอด Onsite</span>
          <span>พิมพ์: ${today}</span>
        </div>
      </div>
    </div></body></html>`);
    w.document.close();w.focus();
  }
};

/* ── LAB ── */
Pages.lab={render(){
  const lps=DB.lab.listProjects();const alts=DB.lab.listAlerts();const unc=alts.filter(a=>!a.acknowledged);
  const canAdd=DB.auth.can('add','lab'),canEdit=DB.auth.can('edit','lab');
  const rows=lps.map(lp=>{
    const p=DB.sales.getProject(lp.project_id);
    return`<tr><td class="fw6">${p?.project_code||'-'}</td><td>${p?.company_name||'-'}</td><td>${(lp.headcount||0).toLocaleString()}</td><td>${U.fmtD(lp.received_at)}</td><td>${U.tatBadge(lp.tat_deadline)}</td><td>${U.badge(lp.status)}</td><td>
      ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.lab.editLab(${lp.id})">อัปเดต</button>`:''}
      ${canAdd?`<button class="btn btn-danger btn-xs" onclick="Pages.lab.addCritical(${lp.project_id})">Critical</button>`:''}
    </td></tr>`;}).join('');
  const canDelLab=DB.auth.can('delete','lab');
  const aRows=alts.map(a=>`<tr>
    <td class="fw6 mono">${a.hn||'-'}</td>
    <td>${a.patient_name}</td>
    <td>${a.test_name}</td>
    <td class="t-danger fw6">${a.value}</td>
    <td class="t-muted">${a.normal_range}</td>
    <td class="t-sm">${a.note||'-'}</td>
    <td>${a.acknowledged?U.badge('reported'):'<span class="badge b-danger">ยังไม่รับทราบ</span>'}</td>
    <td>
      <div class="btn-grp">
        ${!a.acknowledged?`<button class="btn btn-suc btn-xs" onclick="Pages.lab.ackAlert(${a.id})">รับทราบ</button>`:''}
        ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.lab.editAlert(${a.id})">แก้ไข</button>`:''}
        ${canDelLab?`<button class="btn btn-danger btn-xs" onclick="Pages.lab.delAlert(${a.id})">ลบ</button>`:''}
      </div>
    </td>
  </tr>`).join('');
  document.getElementById('content').innerHTML=`<div class="ph"><div><h2>🔬 Lab — ห้องปฏิบัติการ</h2><p>ติดตาม TAT, QC, Critical Values</p></div>${canAdd?`<button class="btn btn-pri" onclick="Pages.lab.addLabProject()">+ รับ Specimen</button>`:''}</div>
  ${unc.length>0?`<div class="ab critical mb4">🚨 มีค่าวิกฤต ${unc.length} ราย ต้องแจ้ง Sales + Report ทันที!</div>`:''}
  <div class="card mb4"><div class="tbl-wrap"><table><thead><tr><th>Project</th><th>บริษัท</th><th>จำนวน</th><th>รับตัวอย่าง</th><th>TAT</th><th>สถานะ</th><th></th></tr></thead>
  <tbody>${rows||'<tr><td colspan="7" class="empty">ยังไม่มีข้อมูล</td></tr>'}</tbody></table></div></div>
  <div class="card"><div class="card-header"><span class="card-title">🚨 Critical Value Alerts</span></div>
  <div class="tbl-wrap"><table><thead><tr><th>HN</th><th>ชื่อ-สกุล</th><th>รายการ</th><th>ค่าที่พบ</th><th>ค่าปกติ</th><th>หมายเหตุ</th><th>สถานะ</th><th>Actions</th></tr></thead>
  <tbody>${aRows||'<tr><td colspan="8" class="empty">ไม่มีค่าวิกฤต</td></tr>'}</tbody></table></div></div>`;
},
editLab(id){
  const lp=DB.lab.listProjects().find(r=>r.id===id);
  Modal.open(`<div class="fr"><div class="fg"><label>วันที่ Approve</label><input id="la_ap" type="date" value="${lp.approved_at?lp.approved_at.substr(0,10):''}"/></div>
    <div class="fg"><label>วันที่รายงานผล</label><input id="la_rp" type="date" value="${lp.reported_at?lp.reported_at.substr(0,10):''}"/></div></div>
  <div class="fg"><label>สถานะ</label><select id="la_st">${U.sel(['analyzing','approved','reported'],lp.status)}</select></div>`,
  'อัปเดต Lab',()=>{
    const ap=document.getElementById('la_ap').value;const rp=document.getElementById('la_rp').value;const st=document.getElementById('la_st').value;
    DB.lab.saveLabProject({...lp,approved_at:ap?new Date(ap).toISOString():lp.approved_at,reported_at:rp?new Date(rp).toISOString():lp.reported_at,status:st});
    if(st==='reported'){const p=DB.sales.getProject(lp.project_id);if(p&&p.status==='Lab')DB.sales.saveProject({...p,status:'Report'});}
    Modal.close();this.render();U.toast('✅ อัปเดตแล้ว');
  });
},
addCritical(pid){
  const p=DB.sales.getProject(pid);
  Modal.open(`<div class="ab danger mb4">⚠ กรอกค่าวิกฤต — จะแจ้งเตือน Sales + Report ทันที</div>
  <div class="fr"><div class="fg"><label>HN</label><input id="cv_hn"/></div><div class="fg"><label>ชื่อ-สกุล</label><input id="cv_nm"/></div></div>
  <div class="fr"><div class="fg"><label>รายการตรวจ</label><input id="cv_ts"/></div><div class="fg"><label>ค่าที่พบ</label><input id="cv_vl"/></div></div>
  <div class="fr"><div class="fg"><label>ค่าปกติ</label><input id="cv_nr"/></div><div class="fg"><label>หมายเหตุ</label><input id="cv_nt"/></div></div>`,
  `Critical Value — ${p?.company_name}`,()=>{
    DB.lab.saveAlert({project_id:pid,hn:document.getElementById('cv_hn').value,patient_name:document.getElementById('cv_nm').value,test_name:document.getElementById('cv_ts').value,value:document.getElementById('cv_vl').value,normal_range:document.getElementById('cv_nr').value,note:document.getElementById('cv_nt').value,acknowledged:false,alerted_at:DB._now()});
    Modal.close();this.render();U.toast('🚨 บันทึก Critical Alert แล้ว','danger');
  });
},
ackAlert(id){DB.lab.ackAlert(id);this.render();U.toast('✅ รับทราบแล้ว');},
editAlert(id){
  const a=DB.lab.listAlerts().find(r=>r.id===id);
  if(!a)return;
  Modal.open(`
  <div class="ab danger mb4">🚨 แก้ไขข้อมูล Critical Value Alert</div>
  <div class="fr"><div class="fg"><label>HN</label><input id="ea_hn" value="${U.esc(a.hn||'')}"/></div>
    <div class="fg"><label>ชื่อ-สกุล</label><input id="ea_nm" value="${U.esc(a.patient_name||'')}"/></div></div>
  <div class="fr"><div class="fg"><label>รายการตรวจ</label><input id="ea_ts" value="${U.esc(a.test_name||'')}"/></div>
    <div class="fg"><label>ค่าที่พบ</label><input id="ea_vl" value="${U.esc(a.value||'')}"/></div></div>
  <div class="fr"><div class="fg"><label>ค่าปกติ</label><input id="ea_nr" value="${U.esc(a.normal_range||'')}"/></div>
    <div class="fg"><label>สถานะรับทราบ</label>
      <select id="ea_ack">
        <option value="false" ${!a.acknowledged?'selected':''}>ยังไม่รับทราบ</option>
        <option value="true" ${a.acknowledged?'selected':''}>รับทราบแล้ว</option>
      </select></div></div>
  <div class="fg"><label>หมายเหตุ</label><textarea id="ea_nt">${U.esc(a.note||'')}</textarea></div>`,
  'แก้ไข Critical Alert',()=>{
    const rows=DB.lab.listAlerts();
    const idx=rows.findIndex(r=>r.id===id);
    if(idx<0)return;
    rows[idx]={...rows[idx],
      hn:document.getElementById('ea_hn').value,
      patient_name:document.getElementById('ea_nm').value,
      test_name:document.getElementById('ea_ts').value,
      value:document.getElementById('ea_vl').value,
      normal_range:document.getElementById('ea_nr').value,
      note:document.getElementById('ea_nt').value,
      acknowledged:document.getElementById('ea_ack').value==='true'
    };
    DB._set('lab_db','critical_alerts',rows);
    Modal.close();this.render();U.toast('✅ แก้ไข Alert แล้ว');
  });
},
delAlert(id){
  if(U.confirm('ลบ Critical Alert นี้?')){
    const rows=DB.lab.listAlerts().filter(r=>r.id!==id);
    DB._set('lab_db','critical_alerts',rows);
    this.render();U.toast('✅ ลบแล้ว');
  }
},
addLabProject(){
  const projs=DB.sales.listProjects().filter(p=>p.status==='Lab');
  const existing=DB.lab.listProjects().map(l=>l.project_id);
  const avail=projs.filter(p=>!existing.includes(p.id));
  if(!avail.length)return U.toast('ไม่มี Project พร้อม','warning');
  const pOpts=U.sel(avail.map(p=>({v:p.id,l:`${p.project_code} — ${p.company_name}`})),'');
  Modal.open(`<div class="fg"><label>Project</label><select id="lp_p">${pOpts}</select></div>
  <div class="fg"><label>วันที่รับตัวอย่าง</label><input id="lp_rv" type="date" value="${new Date().toISOString().substr(0,10)}"/></div>`,
  'รับ Specimen เข้า Lab',()=>{
    const pid=parseInt(document.getElementById('lp_p').value);
    const p=DB.sales.getProject(pid);
    const tat=DB.config.getTAT();const td=(p?.headcount||0)>tat.threshold?tat.large:tat.small;
    const recv=new Date(document.getElementById('lp_rv').value);
    const dd=new Date(recv);dd.setDate(dd.getDate()+td);
    DB.lab.saveLabProject({project_id:pid,received_at:recv.toISOString(),headcount:p?.headcount||0,tat_days:td,tat_deadline:dd.toISOString(),status:'analyzing'});
    Modal.close();this.render();U.toast('✅ รับ Specimen เข้า Lab แล้ว');
  });
}};

/* ── REPORT ── */
Pages.report={render(){
  const plans=DB.report.listPlans();
  const canAdd=DB.auth.can('add','report'),canEdit=DB.auth.can('edit','report');
  /* Project & Handover section */
  const projs=DB.sales.listProjects();
  const projRows=projs.slice().reverse().map(p=>`<tr><td class="fw6">${p.project_code}</td><td>${p.company_name}</td><td>${(p.headcount||0).toLocaleString()}</td><td>${U.fmtD(p.onsite_date)}</td><td>${U.badge(p.status)}</td><td>
    ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.sales.editProject(${p.id})">แก้ไข</button>`:''}
    <button class="btn btn-out btn-xs" onclick="Pages.sales.viewHandover(${p.id})">เอกสาร</button>
  </td></tr>`).join('');
  const rows=plans.map(rp=>{const p=DB.sales.getProject(rp.project_id);return`<tr><td class="fw6">${p?.project_code||'-'}</td><td>${p?.company_name||'-'}</td><td>${rp.program_code}</td><td>${(rp.headcount||0).toLocaleString()}</td><td>${U.fmtD(rp.onsite_date)}</td><td>${U.tatBadge(rp.sla_deadline)}</td><td>${U.badge(rp.status)}</td><td>
    <button class="btn btn-out btn-xs" onclick="Pages.report.viewPlan(${rp.project_id})">ดูแผน</button>
    ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.report.editPlan(${rp.id})">แก้ไข</button>`:''}
    <button class="btn btn-out btn-xs" onclick="Pages.report.viewPatients(${rp.project_id})">รายชื่อ</button>
  </td></tr>`;}).join('');
  document.getElementById('content').innerHTML=`<div class="ph"><div><h2>📋 Report — ทีมทำผล</h2><p>Project & Handover + Project Plan + แปลผล</p></div>${canAdd?`<button class="btn btn-pri" onclick="Pages.report.addPlan()">+ สร้าง Project Plan</button>`:''}</div>
  <div class="tabs"><div class="tab active" onclick="switchTab(this,'rt1')">📁 Project & Handover</div><div class="tab" onclick="switchTab(this,'rt2')">📋 Project Plan & Report</div></div>
  <div id="rt1" class="tp active"><div class="card"><div class="tbl-wrap"><table><thead><tr><th>Project Code</th><th>บริษัท</th><th>จำนวน</th><th>วันตรวจ</th><th>สถานะ</th><th></th></tr></thead><tbody>${projRows||'<tr><td colspan="6" class="empty">ยังไม่มี Project</td></tr>'}</tbody></table></div></div></div>
  <div id="rt2" class="tp"><div class="card"><div class="tbl-wrap"><table><thead><tr><th>Project</th><th>บริษัท</th><th>Program</th><th>จำนวน</th><th>วันตรวจ</th><th>SLA</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="8" class="empty">ยังไม่มี Plan</td></tr>'}</tbody></table></div></div></div>`;
},
viewPlan(pid){
  const rp=DB.report.getPlan(pid),p=DB.sales.getProject(pid);
  Modal.open(`<div class="sr"><span>Project</span><span class="fw6">${p?.project_code}</span></div>
  <div class="sr"><span>บริษัท</span><span>${p?.company_name}</span></div>
  <div class="sr"><span>Program</span><span>${rp.program_code}</span></div>
  <div class="sr"><span>จำนวน</span><span>${(rp.headcount||0).toLocaleString()} คน</span></div>
  <div class="sr"><span>วันตรวจ</span><span>${U.fmtD(rp.onsite_date)}</span></div>
  <div class="sr"><span>สร้างโดย</span><span>${rp.created_by||'-'}</span></div>
  <div class="sr"><span>ตรวจสอบโดย</span><span class="${rp.verified_by?'t-success fw6':'t-danger'}">${rp.verified_by||'⚠ ยังไม่ได้ Verify'}</span></div>
  <div class="divider"></div>
  <div class="sr"><span>TAT Deadline</span><span>${U.tatBadge(rp.tat_deadline)} — ${U.fmtD(rp.tat_deadline)}</span></div>
  <div class="sr"><span>SLA Deadline</span><span>${U.tatBadge(rp.sla_deadline)} — ${U.fmtD(rp.sla_deadline)}</span></div>
  <div class="sr"><span>สถานะ</span><span>${U.badge(rp.status)}</span></div>
  <div class="sr"><span>วันที่ส่งผล</span><span>${U.fmtD(rp.sent_at)||'ยังไม่ส่ง'}</span></div>`,
  'Project Plan Details');
},
editPlan(id){
  const rp=DB.report.listPlans().find(r=>r.id===id);
  Modal.open(`<div class="fr"><div class="fg"><label>ตรวจสอบโดย (Verify)</label><input id="rv_vf" value="${U.esc(rp.verified_by||'')}"/></div>
    <div class="fg"><label>สถานะ</label><select id="rv_st">${U.sel(['pending','interpreting','reviewing','sent'],rp.status)}</select></div></div>
  <div class="fr"><div class="fg"><label>TAT Deadline</label><input id="rv_tat" type="date" value="${rp.tat_deadline?rp.tat_deadline.substr(0,10):''}"/></div>
    <div class="fg"><label>SLA Deadline</label><input id="rv_sla" type="date" value="${rp.sla_deadline?rp.sla_deadline.substr(0,10):''}"/></div></div>
  <div class="fg"><label>วันที่ส่งผล</label><input id="rv_st_d" type="date" value="${rp.sent_at?rp.sent_at.substr(0,10):''}"/></div>`,
  'แก้ไข Project Plan',()=>{
    const st=document.getElementById('rv_st').value;const rv_d=document.getElementById('rv_sla').value;const ta_d=document.getElementById('rv_tat').value;
    DB.report.savePlan({...rp,verified_by:document.getElementById('rv_vf').value,status:st,tat_deadline:ta_d?new Date(ta_d).toISOString():rp.tat_deadline,sla_deadline:rv_d?new Date(rv_d).toISOString():rp.sla_deadline,sent_at:st==='sent'?(document.getElementById('rv_st_d').value?new Date(document.getElementById('rv_st_d').value).toISOString():DB._now()):rp.sent_at});
    if(st==='sent'){const p=DB.sales.getProject(rp.project_id);if(p)DB.sales.saveProject({...p,status:'Billing'});}
    Modal.close();this.render();U.toast('✅ อัปเดต Plan แล้ว');
  });
},
addPlan(){
  const projs=DB.sales.listProjects().filter(p=>['Lab','Report'].includes(p.status));
  const exist=DB.report.listPlans().map(r=>r.project_id);
  const avail=projs.filter(p=>!exist.includes(p.id));
  if(!avail.length)return U.toast('ไม่มี Project พร้อม','warning');
  const pOpts=U.sel(avail.map(p=>({v:p.id,l:`${p.project_code} — ${p.company_name}`})),'');
  Modal.open(`<div class="fg"><label>Project</label><select id="np_p">${pOpts}</select></div>
  <div class="fr"><div class="fg"><label>สร้างโดย</label><input id="np_cb"/></div><div class="fg"><label>ตรวจสอบโดย (คนละคน!)</label><input id="np_vb"/></div></div>
  <div class="fr"><div class="fg"><label>TAT Deadline</label><input id="np_tat" type="date"/></div><div class="fg"><label>SLA Deadline</label><input id="np_sla" type="date"/></div></div>`,
  'สร้าง Project Plan',()=>{
    const pid=parseInt(document.getElementById('np_p').value);const p=DB.sales.getProject(pid);
    DB.report.savePlan({project_id:pid,program_code:p.package_code,headcount:p.headcount,onsite_date:p.onsite_date,created_by:document.getElementById('np_cb').value,verified_by:document.getElementById('np_vb').value,tat_deadline:new Date(document.getElementById('np_tat').value).toISOString(),sla_deadline:new Date(document.getElementById('np_sla').value).toISOString(),status:'pending'});
    Modal.close();this.render();U.toast('✅ สร้าง Plan แล้ว');
  });
},
viewPatients(pid){
  const pts=DB.report.listPatients(pid),p=DB.sales.getProject(pid);
  let html=`<div class="flex-between mb4"><span class="fw6">${p?.company_name} — ${pts.length} ราย</span><button class="btn btn-pri btn-sm" onclick="Pages.report.addPatient(${pid})">+ เพิ่ม</button></div>`;
  html+='<div class="tbl-wrap"><table><thead><tr><th>HN</th><th>ชื่อ-สกุล</th><th>แผนก</th><th>Package</th><th>สถานะ</th></tr></thead><tbody>';
  pts.slice(0,30).forEach(pt=>{html+=`<tr><td>${pt.hn}</td><td>${pt.name}</td><td>${pt.department||'-'}</td><td>${pt.package}</td><td>${U.badge(pt.status)}</td></tr>`;});
  if(pts.length>30)html+=`<tr><td colspan="5" class="empty t-sm">...และอีก ${pts.length-30} ราย</td></tr>`;
  html+='</tbody></table></div>';
  Modal.open(html,'รายชื่อผู้เข้าตรวจ',null,true);
},
addPatient(pid){
  Modal.open(`<div class="fr"><div class="fg"><label>HN</label><input id="pt_hn"/></div><div class="fg"><label>ชื่อ-สกุล</label><input id="pt_nm"/></div></div>
  <div class="fr"><div class="fg"><label>แผนก</label><input id="pt_dp"/></div><div class="fg"><label>Package</label><input id="pt_pk" value="PKG-B"/></div></div>`,
  'เพิ่มรายชื่อ',()=>{DB.report.savePatient({project_id:pid,hn:document.getElementById('pt_hn').value,name:document.getElementById('pt_nm').value,department:document.getElementById('pt_dp').value,package:document.getElementById('pt_pk').value,status:'pending'});Modal.close();U.toast('✅ เพิ่มแล้ว');});
}};

/* ── BILLING ── */
Pages.billing={render(){
  const invs=DB.billing.listInvoices();const canAdd=DB.auth.can('add','billing'),canEdit=DB.auth.can('edit','billing');
  const rev=invs.reduce((s,i)=>s+(i.revenue||0),0);const prf=invs.reduce((s,i)=>s+(i.profit||0),0);
  const rows=invs.map(inv=>{const p=DB.sales.getProject(inv.project_id);return`<tr><td class="fw6">${inv.invoice_no}</td><td>${p?.project_code||'-'}</td><td>${p?.company_name||'-'}</td><td>฿${U.fmt(inv.revenue)}</td><td>฿${U.fmt(Math.round(inv.total))}</td><td class="t-success fw6">฿${U.fmt(inv.profit)}</td><td>${(inv.margin||0).toFixed(1)}%</td><td>${U.badge(inv.status)}</td><td>
    <button class="btn btn-out btn-xs" onclick="Pages.billing.viewInv(${inv.id})">ดู</button>
    ${canEdit?`<button class="btn btn-out btn-xs" onclick="Pages.billing.editInv(${inv.id})">แก้ไข</button>`:''}
  </td></tr>`;}).join('');
  document.getElementById('content').innerHTML=`<div class="ph"><div><h2>💰 Billing — Invoice & กำไร</h2></div>${canAdd?`<button class="btn btn-pri" onclick="Pages.billing.createInv()">+ ออก Invoice</button>`:''}</div>
  <div class="metrics-grid">
    <div class="metric-card acc"><div class="metric-label">รายได้รวม</div><div class="metric-value">฿${U.fmt(Math.round(rev/1000))}K</div></div>
    <div class="metric-card suc"><div class="metric-label">กำไรรวม</div><div class="metric-value">฿${U.fmt(Math.round(prf/1000))}K</div></div>
    <div class="metric-card"><div class="metric-label">Margin</div><div class="metric-value">${rev>0?((prf/rev)*100).toFixed(1):0}%</div></div>
    <div class="metric-card warn"><div class="metric-label">Invoice ทั้งหมด</div><div class="metric-value">${invs.length}</div></div>
  </div>
  <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Invoice No.</th><th>Project</th><th>บริษัท</th><th>รายได้</th><th>รวม(VAT)</th><th>กำไร</th><th>Margin</th><th>สถานะ</th><th></th></tr></thead>
  <tbody>${rows||'<tr><td colspan="9" class="empty">ยังไม่มี Invoice</td></tr>'}</tbody></table></div></div>`;
},
createInv(){
  const projs=DB.sales.listProjects().filter(p=>['Billing','Completed'].includes(p.status));
  const exist=DB.billing.listInvoices().map(i=>i.project_id);
  const avail=projs.filter(p=>!exist.includes(p.id));
  if(!avail.length)return U.toast('ไม่มี Project พร้อม','warning');
  const pOpts=U.sel(avail.map(p=>({v:p.id,l:`${p.project_code} — ${p.company_name}`})),'');
  Modal.open(`<div class="fg"><label>Project</label><select id="bi_p">${pOpts}</select></div>
  <div class="fr"><div class="fg"><label>รายได้ (ไม่รวม VAT)</label><input id="bi_rv" type="number" oninput="Pages.billing._calc()"/></div>
    <div class="fg"><label>ต้นทุนรวม</label><input id="bi_ct" type="number" oninput="Pages.billing._calc()"/></div></div>
  <div id="bi_pv" class="ab info mt4"></div>
  <div class="fg mt4"><label>เงื่อนไขชำระ</label><select id="bi_tm">${U.sel(['ชำระภายใน 30 วัน','ชำระภายใน 45 วัน','ชำระทันที'],'ชำระภายใน 30 วัน')}</select></div>`,
  'ออก Invoice',()=>{
    const pid=parseInt(document.getElementById('bi_p').value);const rv=parseFloat(document.getElementById('bi_rv').value)||0;const ct=parseFloat(document.getElementById('bi_ct').value)||0;
    const vat=rv*.07;const tot=rv+vat;const prf=rv-ct;const mg=rv>0?(prf/rv*100).toFixed(1):0;
    const inv=DB.billing.saveInvoice({project_id:pid,revenue:rv,vat,total:tot,cost:ct,profit:prf,margin:parseFloat(mg),payment_terms:document.getElementById('bi_tm').value,status:'Pending',issued_at:DB._now()});
    const p=DB.sales.getProject(pid);if(p)DB.sales.saveProject({...p,status:'Billing'});
    Modal.close();this.render();U.toast(`✅ ออก ${inv.invoice_no} แล้ว`);
  });
},
_calc(){
  const rv=parseFloat(document.getElementById('bi_rv')?.value)||0;const ct=parseFloat(document.getElementById('bi_ct')?.value)||0;
  const p=document.getElementById('bi_pv');if(p&&rv>0){const prf=rv-ct;const mg=((prf/rv)*100).toFixed(1);p.textContent=`รายได้: ฿${U.fmt(rv)} | VAT: ฿${U.fmt(Math.round(rv*.07))} | รวม: ฿${U.fmt(Math.round(rv*1.07))} | กำไร: ฿${U.fmt(prf)} (${mg}%)`;}},
viewInv(id){
  const inv=DB.billing.listInvoices().find(i=>i.id===id);const p=DB.sales.getProject(inv.project_id);
  const costs=DB.billing.listCostTracking(inv.project_id);
  let cHtml=costs.map(c=>`<div class="sr"><span>${c.category} — ${c.description}</span><span>฿${U.fmt(c.amount)}</span></div>`).join('');
  Modal.open(`<div class="ab info mb4">📄 ${inv.invoice_no} — ${U.fmtD(inv.issued_at)}</div>
  <div class="sr"><span>Project</span><span class="fw6">${p?.project_code}</span></div><div class="sr"><span>บริษัท</span><span>${p?.company_name}</span></div>
  <div class="sr"><span>รายได้ (ไม่รวม VAT)</span><span>฿${U.fmt(inv.revenue)}</span></div>
  <div class="sr"><span>VAT 7%</span><span>฿${U.fmt(Math.round(inv.vat))}</span></div>
  <div class="sr"><span class="fw6">รวมทั้งสิ้น</span><span class="fw6 t-success" style="font-size:16px">฿${U.fmt(Math.round(inv.total))}</span></div>
  <div class="divider"></div><div class="sec-title">รายการต้นทุน</div>${cHtml||'<p class="t-muted t-sm">ยังไม่มี</p>'}
  <div class="divider"></div>
  <div class="sr"><span>ต้นทุนรวม</span><span class="t-danger">฿${U.fmt(inv.cost)}</span></div>
  <div class="sr"><span class="fw6">กำไร</span><span class="fw6 t-success">฿${U.fmt(inv.profit)}</span></div>
  <div class="sr"><span>Margin</span><span class="fw6">${(inv.margin||0).toFixed(1)}%</span></div>
  <div class="divider"></div><div class="sr"><span>เงื่อนไข</span><span>${inv.payment_terms}</span></div>
  <div class="sr"><span>สถานะ</span><span>${U.badge(inv.status)}</span></div>`,
  `Invoice — ${inv.invoice_no}`);
},
editInv(id){
  const inv=DB.billing.listInvoices().find(i=>i.id===id);
  Modal.open(`<div class="fr"><div class="fg"><label>สถานะ</label><select id="ei_st">${U.sel(['Pending','Partial','Paid'],inv.status)}</select></div>
    <div class="fg"><label>รายได้จริง</label><input id="ei_rv" type="number" value="${inv.revenue}"/></div></div>
  <div class="fg"><label>ต้นทุนจริง</label><input id="ei_ct" type="number" value="${inv.cost}"/></div>`,
  'แก้ไข Invoice',()=>{
    const rv=parseFloat(document.getElementById('ei_rv').value)||inv.revenue;const ct=parseFloat(document.getElementById('ei_ct').value)||inv.cost;
    const st=document.getElementById('ei_st').value;const vat=rv*.07;const tot=rv+vat;const prf=rv-ct;
    DB.billing.saveInvoice({...inv,revenue:rv,vat,total:tot,cost:ct,profit:prf,margin:rv>0?prf/rv*100:0,status:st});
    if(st==='Paid'){const p=DB.sales.getProject(inv.project_id);if(p)DB.sales.saveProject({...p,status:'Completed'});}
    Modal.close();this.render();U.toast('✅ อัปเดตแล้ว');
  });
}};

/* ── CONFIG ── */
Pages.config={render(){
  if(!DB.auth.can('view','config'))return;
  const tat=DB.config.getTAT(),sla=DB.config.getSLA(),ad=DB.config.getAlertDays();
  const users=DB.auth.listUsers();
  const canEditCfg=DB.auth.can('edit','config');
  const uRows=users.map(u=>`<tr><td>${u.username}</td><td>${u.name}</td><td>${U.badge(u.role)}</td><td>${u.active?'<span class="badge b-closed">ใช้งาน</span>':'<span class="badge b-danger">ระงับ</span>'}</td><td>
    ${canEditCfg?`<button class="btn btn-out btn-xs" onclick="Pages.config.editUser(${u.id})">แก้ไข</button>`:''}
    ${DB.auth.can('delete','config')&&u.id!==1?`<button class="btn btn-danger btn-xs" onclick="Pages.config.delUser(${u.id})">ลบ</button>`:''}
  </td></tr>`).join('');
  const roles=DB.auth.listRoles();
  const rp=roles.map(r=>{
    const mods=Object.entries(MODULES).map(([k,label])=>{const m=r.modules[k]||{};return`<span class="tag" style="margin:2px" title="${Object.entries(m).filter(([_,v])=>v).map(([a])=>a).join(',')||'ไม่มีสิทธิ์'}">${label}${m.view?'✓':''}</span>`;}).join('');
    return`<tr><td class="fw6">${r.role}</td><td>${mods}</td><td>${canEditCfg?`<button class="btn btn-out btn-xs" onclick="Pages.config.editRole('${r.role}')">แก้ไขสิทธิ์</button>`:''}</td></tr>`;
  }).join('');
  document.getElementById('content').innerHTML=`<div class="ph"><h2>⚙ Config — ตั้งค่าระบบ</h2></div>
  <div class="g2 mb4">
    <div class="card"><div class="card-header"><span class="card-title">⏱ TAT & SLA Config</span>${canEditCfg?`<button class="btn btn-pri btn-sm" onclick="Pages.config.editTAT()">แก้ไข</button>`:''}</div>
      <div class="sr"><span>TAT (≤ Threshold)</span><span class="fw6">${tat.small} วัน</span></div>
      <div class="sr"><span>TAT (> Threshold)</span><span class="fw6">${tat.large} วัน</span></div>
      <div class="sr"><span>Threshold จำนวนคน</span><span class="fw6">${(tat.threshold).toLocaleString()} คน</span></div>
      <div class="sr"><span>SLA หลัง TAT</span><span class="fw6">+${sla.days_after_tat} วัน</span></div>
      <div class="sr"><span>แจ้งเตือนก่อนครบ</span><span class="fw6">${ad} วัน</span></div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">🔑 สิทธิ์ตาม Role</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>Role</th><th>Module</th><th></th></tr></thead><tbody>${rp}</tbody></table></div>
    </div>
  </div>
  <div class="card"><div class="card-header"><span class="card-title">👤 จัดการผู้ใช้งาน</span>${canEditCfg?`<button class="btn btn-pri btn-sm" onclick="Pages.config.addUser()">+ เพิ่มผู้ใช้</button>`:''}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Username</th><th>ชื่อ</th><th>Role</th><th>สถานะ</th><th></th></tr></thead><tbody>${uRows}</tbody></table></div>
  </div>`;
},
editTAT(){
  const tat=DB.config.getTAT(),sla=DB.config.getSLA(),ad=DB.config.getAlertDays();
  Modal.open(`<div class="fr3"><div class="fg"><label>TAT (คนน้อย) วัน</label><input id="ct_s" type="number" value="${tat.small}"/></div>
    <div class="fg"><label>TAT (คนเยอะ) วัน</label><input id="ct_l" type="number" value="${tat.large}"/></div>
    <div class="fg"><label>Threshold คน</label><input id="ct_th" type="number" value="${tat.threshold}"/></div></div>
  <div class="fr"><div class="fg"><label>SLA หลัง TAT (วัน)</label><input id="ct_sla" type="number" value="${sla.days_after_tat}"/></div>
    <div class="fg"><label>แจ้งเตือนก่อนครบ (วัน)</label><input id="ct_ad" type="number" value="${ad}"/></div></div>`,
  'แก้ไข TAT & SLA',()=>{
    DB.config.setTAT({small:parseInt(document.getElementById('ct_s').value)||15,large:parseInt(document.getElementById('ct_l').value)||20,threshold:parseInt(document.getElementById('ct_th').value)||2000});
    DB.config.setSLA({days_after_tat:parseInt(document.getElementById('ct_sla').value)||7});
    DB.config.setAlertDays(parseInt(document.getElementById('ct_ad').value)||3);
    Modal.close();this.render();U.toast('✅ บันทึก Config แล้ว');
  });
},
addUser(){this.editUser(null);},
editUser(id){
  const u=id?DB.auth.getUser(id):{};
  const rOpts=U.sel(['admin','sales','operation','lab','report','billing'].map(r=>({v:r,l:r})),u.role||'sales');
  Modal.open(`<div class="fr"><div class="fg"><label class="req">Username</label><input id="eu_un" value="${U.esc(u.username||'')}"/></div>
    <div class="fg"><label class="${id?'':'req'}">Password${id?' (เว้นว่างถ้าไม่เปลี่ยน)':''}</label><input id="eu_pw" type="password"/></div></div>
  <div class="fr"><div class="fg"><label class="req">ชื่อ-นามสกุล</label><input id="eu_nm" value="${U.esc(u.name||'')}"/></div>
    <div class="fg"><label>Role</label><select id="eu_rl">${rOpts}</select></div></div>
  <div class="fg"><label>สถานะ</label><select id="eu_ac">${U.sel([{v:'true',l:'ใช้งาน'},{v:'false',l:'ระงับ'}],String(u.active!==false))}</select></div>`,
  id?'แก้ไขผู้ใช้':'เพิ่มผู้ใช้',()=>{
    const pw=document.getElementById('eu_pw').value;
    if(!id&&!pw)return U.toast('กรุณาใส่ Password','danger');
    const d={id:id||undefined,username:document.getElementById('eu_un').value.trim(),name:document.getElementById('eu_nm').value.trim(),role:document.getElementById('eu_rl').value,active:document.getElementById('eu_ac').value==='true'};
    if(pw)d.password=pw;else if(id)d.password=u.password;
    if(!d.username||!d.name)return U.toast('กรุณากรอกข้อมูลให้ครบ','danger');
    DB.auth.saveUser(d);Modal.close();this.render();U.toast(id?'✅ แก้ไขแล้ว':'✅ เพิ่มผู้ใช้แล้ว');
  });
},
delUser(id){if(U.confirm('ลบผู้ใช้นี้?')){DB.auth.deleteUser(id);this.render();U.toast('✅ ลบแล้ว');}},
editRole(role){
  const rp=DB.auth.getRolePermission(role)||{role,modules:{}};
  const actions=['view','add','edit','delete'];
  let html=`<div class="mb4"><span class="badge b-lab">${role}</span></div>`;
  html+='<div class="tbl-wrap"><table><thead><tr><th>Module</th>';
  actions.forEach(a=>{html+=`<th>${a}</th>`;});
  html+='</tr></thead><tbody>';
  Object.entries(MODULES).forEach(([k,label])=>{
    html+=`<tr><td class="fw6">${label}</td>`;
    actions.forEach(a=>{const checked=rp.modules[k]&&rp.modules[k][a];html+=`<td><input type="checkbox" id="rp_${k}_${a}" ${checked?'checked':''}/></td>`;});
    html+='</tr>';
  });
  html+='</tbody></table></div>';
  Modal.open(html,`แก้ไขสิทธิ์ — ${role}`,()=>{
    const modules={};
    Object.keys(MODULES).forEach(k=>{modules[k]={};actions.forEach(a=>{modules[k][a]=document.getElementById(`rp_${k}_${a}`)?.checked||false;});});
    DB.auth.saveRolePermission({role,modules});
    Modal.close();this.render();U.toast('✅ บันทึกสิทธิ์แล้ว');
  },true);
}};

/* ===== TAB HELPER ===== */
function switchTab(el,targetId){
  const container=el.closest('.tabs').parentElement||el.parentElement;
  el.closest('.tabs').querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  container.querySelectorAll('.tp').forEach(p=>p.classList.remove('active'));
  const tp=document.getElementById(targetId);
  if(tp)tp.classList.add('active');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded',()=>{
  DB.seedMockData();
  document.getElementById('login-form').addEventListener('submit',e=>{
    e.preventDefault();
    const u=document.getElementById('l_user').value.trim();
    const p=document.getElementById('l_pass').value;
    const sess=DB.auth.login(u,p);
    if(sess){showApp();Router.navigate('dashboard');}
    else{document.getElementById('l_err').style.display='block';document.getElementById('l_err').textContent='Username หรือ Password ไม่ถูกต้อง';}
  });
  const sess=DB.auth.session();
  if(sess){showApp();Router.navigate('dashboard');}
  else showLogin();
  setInterval(updateAlerts,30000);
});
