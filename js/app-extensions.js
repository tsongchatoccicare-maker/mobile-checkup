/**
 * app-extensions.js — v4 Compatible Extensions
 * Only features NOT already in app.js:
 *   1. Mobile CSS + Hamburger
 *   2. Nav Role Badges
 *   3. Calendar Page
 *   4. Router patch (calendar + close sidebar + badges)
 *   5. buildNav patch (calendar inject + header avatar)
 *   6. CRM Location (GPS pin)
 *   7. Line Notify Config (in Config page)
 *   8. Line Alert runner (sync)
 */

/* ── 1. MOBILE CSS ─────────────────────────────── */
(function(){
  const s=document.createElement('style');
  s.textContent=`
#sb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:199;backdrop-filter:blur(2px);transition:opacity .3s;}
@media(max-width:900px){
  #sidebar{transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1),box-shadow .3s;}
  #sidebar.sb-open{transform:translateX(0);box-shadow:0 8px 40px rgba(13,33,55,.35);}
  #sb-overlay.sb-open{display:block;}
  #main{margin-left:0!important;}
  #hbg{display:inline-flex!important;}
  #content{padding:14px!important;}
  .ph{flex-direction:column;gap:10px;}
  .ph h2{font-size:18px!important;}
  .g2,.g3{grid-template-columns:1fr!important;}
  .metrics-grid{grid-template-columns:repeat(2,1fr)!important;}
  .fr3{grid-template-columns:1fr 1fr!important;}
  .login-brand{display:none!important;}
  .login-wrap{grid-template-columns:1fr!important;border-radius:20px!important;max-width:440px!important;}
  .mo-box{border-radius:14px 14px 0 0!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;max-height:92vh!important;max-width:100%!important;}
  .mo{align-items:flex-end!important;padding:0!important;}
  .header-user-name,.header-user-role{display:none;}
  table{min-width:460px;}
  .tbl-wrap{-webkit-overflow-scrolling:touch;}
}
@media(max-width:480px){
  .metrics-grid{grid-template-columns:1fr 1fr!important;}
  .metric-value{font-size:20px!important;}
  .fr{grid-template-columns:1fr!important;}
  .fr3{grid-template-columns:1fr!important;}
  #content{padding:10px!important;}
  .btn{padding:8px 12px!important;font-size:12px!important;}
}
.nav-role-badge{background:var(--danger);color:#fff;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:700;margin-left:auto;}
.file-item{display:flex;align-items:center;gap:8px;padding:7px 11px;background:var(--surf2);border:1px solid var(--bdr);border-radius:8px;margin-bottom:5px;font-size:12px;}
.file-zone{border:2px dashed var(--bdr-dk);border-radius:var(--r);padding:13px;text-align:center;cursor:pointer;color:var(--txt-lt);background:var(--surf2);transition:all .2s;}
.file-zone:hover{border-color:var(--navy-lt);background:#EFF6FF;color:var(--navy);}
@media(prefers-color-scheme:dark){
  .file-item{background:#22253A;border-color:#2E3248;}
  .file-zone{background:#22253A;border-color:#2E3248;}
}`;
  document.head.appendChild(s);
})();

/* ── 2. HAMBURGER ──────────────────────────────── */
function _mkHamburger(){
  if(document.getElementById('hbg'))return;
  const hdr=document.getElementById('header');
  if(!hdr)return;
  // overlay
  if(!document.getElementById('sb-overlay')){
    const ov=document.createElement('div');
    ov.id='sb-overlay';
    ov.onclick=closeSB;
    document.body.appendChild(ov);
  }
  const btn=document.createElement('button');
  btn.id='hbg';
  btn.setAttribute('aria-label','เมนู');
  btn.style.cssText='display:none;background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;color:var(--txt-md);margin-right:4px;flex-shrink:0;-webkit-tap-highlight-color:transparent;';
  btn.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  btn.onclick=toggleSB;
  hdr.insertBefore(btn,hdr.firstChild);
}
function toggleSB(){
  const s=document.getElementById('sidebar');
  const o=document.getElementById('sb-overlay');
  const open=s.classList.toggle('sb-open');
  if(o)o.classList.toggle('sb-open',open);
  document.body.style.overflow=open?'hidden':'';
}
function closeSB(){
  document.getElementById('sidebar')?.classList.remove('sb-open');
  const o=document.getElementById('sb-overlay');
  if(o)o.classList.remove('sb-open');
  document.body.style.overflow='';
}
window.closeSB=closeSB;
function _checkLayout(){
  const btn=document.getElementById('hbg');
  const main=document.getElementById('main');
  if(!btn)return;
  if(window.innerWidth<=900){
    btn.style.display='inline-flex';
    if(main)main.style.marginLeft='0';
  }else{
    btn.style.display='none';
    if(main)main.style.marginLeft='var(--sw,260px)';
    closeSB();
  }
}

/* ── 3. NAV ROLE BADGES ────────────────────────── */
const NavBadges={
  update(){
    const sess=DB.auth.session();
    if(!sess)return;
    const role=sess.role;
    const counts={};
    try{
      const projs=DB.sales.listProjects();
      const jos=DB.operation.listJobOrders();
      const labPs=DB.lab.listProjects();
      const alts=DB.lab.listAlerts();
      const rps=DB.report.listPlans();
      const invs=DB.billing.listInvoices();
      if(role==='report'||role==='admin'){
        const n=rps.filter(r=>r.status==='pending').length;
        if(n)counts['report']=n;
      }
      if(role==='operation'||role==='admin'){
        const existJO=jos.map(j=>j.project_id);
        const n=projs.filter(p=>p.status==='Closed'&&!existJO.includes(p.id)).length;
        if(n)counts['op_prep']=n;
        const cklPend=projs.filter(p=>p.status==='Onsite').filter(p=>{
          const ckl=JSON.parse(localStorage.getItem('ckl__'+p.id)||'{}');
          return Object.keys(ckl).filter(k=>!k.endsWith('_note')&&ckl[k]).length<10;
        }).length;
        if(cklPend)counts['op_checklist']=cklPend;
      }
      if(role==='lab'||role==='admin'){
        const existLab=labPs.map(l=>l.project_id);
        const n=projs.filter(p=>p.status==='Lab'&&!existLab.includes(p.id)).length;
        const crit=alts.filter(a=>!a.acknowledged).length;
        if(n+crit)counts['lab']=n+crit;
      }
      if(role==='billing'||role==='admin'){
        const existInv=invs.map(i=>i.project_id);
        const n=projs.filter(p=>p.status==='Billing'&&!existInv.includes(p.id)).length;
        if(n)counts['billing']=n;
      }
    }catch(e){}
    document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
      const pg=el.dataset.page;
      let b=el.querySelector('.nav-role-badge');
      const c=counts[pg]||0;
      if(c>0){
        if(!b){b=document.createElement('span');b.className='nav-role-badge';el.appendChild(b);}
        b.textContent=c;b.style.display='inline-block';
      }else if(b)b.style.display='none';
    });
    const total=Object.values(counts).reduce((s,v)=>s+v,0);
    const bell=document.getElementById('alert-count');
    if(bell){bell.textContent=total;bell.style.display=total>0?'inline-block':'none';}
  }
};
window.NavBadges=NavBadges;

/* ── 4. CALENDAR PAGE ──────────────────────────── */
const CalendarPage={
  _y:new Date().getFullYear(),
  _m:new Date().getMonth(),
  COLORS:{Prospect:'#8B5CF6',Closed:'#06B6D4',Onsite:'#3B82F6',Lab:'#F59E0B',Report:'#8B5CF6',Billing:'#10B981',Completed:'#6B7280'},
  render(){
    document.getElementById('content').innerHTML=`
    <div class="ph">
      <div><h2>📅 ปฏิทินงาน</h2><p>ตารางงานตรวจสุขภาพทั้งหมด</p></div>
      <div class="btn-grp">
        <button class="btn btn-out btn-sm" onclick="CalendarPage._prev()">◀</button>
        <button class="btn btn-out btn-sm" onclick="CalendarPage._today()">วันนี้</button>
        <button class="btn btn-out btn-sm" onclick="CalendarPage._next()">▶</button>
      </div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div id="cal-hd" style="background:linear-gradient(90deg,var(--navy),var(--navy-lt));color:#fff;padding:14px 20px;font-family:'Prompt',sans-serif;font-size:15px;font-weight:600"></div>
      <div id="cal-body" style="padding:12px"></div>
    </div>
    <div id="cal-leg" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"></div>`;
    this._draw();
  },
  _draw(){
    const projs=DB.sales.listProjects();
    const y=this._y,m=this._m;
    const MN=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const hd=document.getElementById('cal-hd');
    if(hd)hd.textContent=`📅 ${MN[m]}  ${y+543}`;
    const ev={};
    projs.forEach(p=>{
      if(!p.onsite_date)return;
      const d=p.onsite_date.substr(0,10);
      (ev[d]=ev[d]||[]).push(p);
    });
    const firstDay=new Date(y,m,1).getDay();
    const dim=new Date(y,m+1,0).getDate();
    const now=new Date();
    const ts=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    let html=`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px">`;
    ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(d=>{html+=`<div style="text-align:center;font-size:10px;font-weight:700;color:var(--txt-lt);padding:5px 0">${d}</div>`;});
    html+=`</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">`;
    for(let i=0;i<firstDay;i++)html+=`<div></div>`;
    for(let day=1;day<=dim;day++){
      const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const evs=ev[ds]||[];
      const isT=ds===ts;
      const du=Math.ceil((new Date(ds)-now)/86400000);
      const near=du>=0&&du<=3&&evs.length>0;
      html+=`<div onclick="CalendarPage._openDay('${ds}')" style="min-height:62px;padding:3px 4px;border-radius:7px;cursor:pointer;position:relative;background:${isT?'var(--navy)':near?'#FFFBEB':'var(--surf2)'};border:1.5px solid ${isT?'var(--navy)':near?'#FDE68A':'var(--bdr)'};transition:all .15s">
        <div style="font-size:11px;font-weight:${isT?700:500};color:${isT?'#fff':'var(--txt)'};text-align:right;margin-bottom:2px">${day}</div>
        ${near&&!isT?`<div style="position:absolute;top:3px;left:4px;width:5px;height:5px;border-radius:50%;background:#F59E0B"></div>`:''}
        ${evs.slice(0,2).map(p=>`<div onclick="event.stopPropagation();CalendarPage._openProj(${p.id})" style="font-size:9px;padding:2px 4px;border-radius:3px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;background:${this.COLORS[p.status]||'#888'}20;color:${this.COLORS[p.status]||'#888'};border-left:2px solid ${this.COLORS[p.status]||'#888'}">${p.company_name.length>9?p.company_name.substr(0,9)+'…':p.company_name}</div>`).join('')}
        ${evs.length>2?`<div style="font-size:9px;color:var(--txt-lt)">+${evs.length-2}</div>`:''}
      </div>`;
    }
    html+=`</div>`;
    document.getElementById('cal-body').innerHTML=html;
    const leg=document.getElementById('cal-leg');
    if(leg){
      const sts=[...new Set(projs.map(p=>p.status))];
      leg.innerHTML=sts.map(s=>`<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--txt-md)"><div style="width:8px;height:8px;border-radius:50%;background:${this.COLORS[s]||'#888'}"></div>${s}</div>`).join('');
    }
  },
  _openDay(ds){
    const evs=DB.sales.listProjects().filter(p=>p.onsite_date===ds);
    if(!evs.length)return;
    if(evs.length===1){this._openProj(evs[0].id);return;}
    Modal.open(evs.map(p=>`<div style="padding:10px;border:1px solid var(--bdr);border-radius:8px;cursor:pointer;margin-bottom:8px" onclick="Modal.close();CalendarPage._openProj(${p.id})"><div class="fw6">${U.esc(p.project_code)}</div><div class="t-sm t-muted">${U.esc(p.company_name)}</div></div>`).join(''),`งานวันที่ ${ds}`);
  },
  _openProj(id){
    const p=DB.sales.getProject(id);if(!p)return;
    const jo=DB.operation.getJobOrder(p.id);
    const lp=DB.lab.getLabProject(p.id);
    const rp=DB.report.getPlan(p.id);
    const inv=DB.billing.getInvoice(p.id);
    const h=DB.sales.getHandover(p.id);
    const col=this.COLORS[p.status]||'#888';
    const dL=p.onsite_date?Math.ceil((new Date(p.onsite_date)-new Date())/86400000):null;
    Modal.open(`
    <div style="background:${col}18;border-radius:10px;padding:13px;margin-bottom:13px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div style="font-family:'Prompt',sans-serif;font-size:15px;font-weight:700;color:var(--navy)">${U.esc(p.project_code)}</div>
          <div style="font-size:12px;color:var(--txt-md);margin-top:2px">${U.esc(p.company_name)}</div></div>
        <span class="badge" style="background:${col}22;color:${col};border:1px solid ${col}44">${p.status}</span>
      </div>
    </div>
    ${dL!==null&&dL>=0&&dL<=3?`<div class="ab warning mb4">⚠️ วันตรวจอีก ${dL} วัน!</div>`:''}
    <div class="sr"><span>วันตรวจ</span><span class="fw6">${U.fmtD(p.onsite_date)} ${p.onsite_time||''}</span></div>
    <div class="sr"><span>สถานที่</span><span>${U.esc(p.location||'-')}</span></div>
    <div class="sr"><span>จำนวน</span><span>${(p.headcount||0).toLocaleString()} คน</span></div>
    <div class="sr"><span>กำหนดส่งผล</span><span>${U.fmtD(p.due_date)||'-'}</span></div>
    <div class="sr"><span>ผู้ประสานงาน</span><span>${U.esc((p.coordinator_name||'-')+' '+(p.coordinator_phone||''))}</span></div>
    <div class="divider"></div>
    <div class="sec-title">สถานะแต่ละขั้นตอน</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px">
      ${[{l:'Handover',done:!!h,icon:'💼'},{l:'ใบแจ้งงาน',done:!!jo,icon:'📋'},{l:'ส่ง Lab',done:!!lp,icon:'🔬'},{l:'Report',done:!!rp,icon:'📄'},{l:'TAT OK',done:lp?.status==='reported',icon:'⏱'},{l:'ส่งผล',done:rp?.status==='sent',icon:'✅'},{l:'Invoice',done:!!inv,icon:'💰'},{l:'ชำระแล้ว',done:inv?.status==='Paid',icon:'🏦'}].map(s=>`
        <div style="text-align:center;padding:8px 4px;border-radius:8px;background:${s.done?'#F0FDF4':'var(--surf2)'};border:1px solid ${s.done?'#86EFAC':'var(--bdr)'}">
          <div style="font-size:15px">${s.icon}</div>
          <div style="font-size:9px;font-weight:600;color:${s.done?'var(--suc)':'var(--txt-lt)'};margin-top:2px">${s.l}</div>
          <div style="font-size:13px">${s.done?'✅':'⬜'}</div>
        </div>`).join('')}
    </div>`,`Project — ${p.project_code}`);
  },
  _prev(){this._m--;if(this._m<0){this._m=11;this._y--;}this._draw();},
  _next(){this._m++;if(this._m>11){this._m=0;this._y++;}this._draw();},
  _today(){this._y=new Date().getFullYear();this._m=new Date().getMonth();this._draw();},
};
window.CalendarPage=CalendarPage;

/* ── 5. INJECT CALENDAR NAV ───────────────────── */
function _injectCalNav(){
  const nav=document.getElementById('sidebar-nav');
  if(!nav||nav.querySelector('[data-page="calendar"]'))return;
  const dash=nav.querySelector('[data-page="dashboard"]');
  if(!dash)return;
  const a=document.createElement('a');
  a.className='nav-item';a.dataset.page='calendar';
  a.setAttribute('onclick',"Router.navigate('calendar')");
  a.innerHTML='<span class="icon">📅</span>ปฏิทินงาน';
  dash.insertAdjacentElement('afterend',a);
}

/* ── 6. PATCH Router.navigate ─────────────────── */
(function(){
  const _orig=Router.navigate.bind(Router);
  Router.navigate=function(page){
    if(!Pages['calendar'])Pages['calendar']=CalendarPage;
    const extra={calendar:'ปฏิทินงาน'};
    if(extra[page]){
      document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
      document.getElementById('pt').textContent=extra[page];
      Pages[page]?.render?.();
      closeSB();
      setTimeout(()=>NavBadges.update(),300);
      window.scrollTo(0,0);
      return;
    }
    _orig(page);
    closeSB();
    setTimeout(()=>NavBadges.update(),300);
  };
})();

/* ── 7. PATCH buildNav ────────────────────────── */
(function(){
  const _orig=window.buildNav;
  window.buildNav=function(){
    _orig&&_orig();
    setTimeout(()=>{
      _injectCalNav();
      NavBadges.update();
      _mkHamburger();
      _checkLayout();
      // Update header avatar
      const sess=DB.auth.session();
      if(sess){
        const av=document.getElementById('user-avatar');
        const hn=document.getElementById('header-user-name');
        const hr=document.getElementById('header-user-role');
        if(av)av.textContent=(sess.name||'U')[0].toUpperCase();
        if(hn)hn.textContent=sess.name;
        if(hr)hr.textContent=sess.role;
      }
    },80);
  };
})();

/* ── 8. CRM — ปักหมุด Location ────────────────── */
(function(){
  if(!Pages.customers)return;
  // Override edit with location fields added
  // Use correct field IDs matching v4 app.js (fc_*, not cc_*)
  const _orig=Pages.customers.edit;
  Pages.customers.edit=function(id){
    const c=id?DB.customer.getCustomer(id):{};
    const f=(k,d='')=>U.esc(c[k]||d);
    const sOpts=U.sel(['Prospect','Follow up','Negotiation','Closed'].map(s=>({v:s,l:s})),c.sales_status||'Prospect');
    const lat=c.lat||'',lng=c.lng||'';
    Modal.open(`
    <div class="fr"><div class="fg"><label class="req">ชื่อบริษัท/องค์กร</label><input id="fc_co" value="${f('company_name')}"/></div>
      <div class="fg"><label>จำนวนพนักงาน</label><input id="fc_emp" type="number" value="${c.employee_count||0}"/></div></div>
    <div class="fg"><label>ที่อยู่</label><textarea id="fc_addr">${f('address')}</textarea></div>
    <div class="fr"><div class="fg"><label>เบอร์ติดต่อ</label><input id="fc_ph" value="${f('phone')}"/></div>
      <div class="fg"><label>อีเมล</label><input id="fc_em" value="${f('email')}"/></div></div>
    <div class="fr"><div class="fg"><label class="req">ผู้ติดต่อหลัก</label><input id="fc_cn" value="${f('contact_name')}"/></div>
      <div class="fg"><label>ตำแหน่ง</label><input id="fc_cr" value="${f('contact_role')}"/></div></div>
    <div class="fr"><div class="fg"><label>สถานะการขาย</label><select id="fc_st"><option value="">-- เลือก --</option>${sOpts}</select></div>
      <div class="fg"><label>วันที่ติดต่อล่าสุด</label><input id="fc_lc" type="date" value="${f('last_contact')}"/></div></div>
    <div class="fg"><label>Note (บันทึกการคุย)</label><textarea id="fc_nt">${f('note')}</textarea></div>
    <div class="divider"></div>
    <div class="sec-title">📍 ปักหมุด Location</div>
    <div class="fr"><div class="fg"><label>Latitude</label><input id="fc_lat" value="${lat}" placeholder="เช่น 13.7563"/></div>
      <div class="fg"><label>Longitude</label><input id="fc_lng" value="${lng}" placeholder="เช่น 100.5018"/></div></div>
    <div class="btn-grp mb4">
      <button type="button" class="btn btn-out btn-sm" onclick="EXT.crm.gps()">📍 ตำแหน่งปัจจุบัน</button>
      <button type="button" class="btn btn-out btn-sm" onclick="EXT.crm.maps()">🗺 Google Maps</button>
    </div>
    ${lat&&lng?`<div style="border-radius:8px;overflow:hidden;height:160px;border:1px solid var(--bdr)">
      <iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed" style="width:100%;height:100%;border:none" loading="lazy"></iframe>
    </div>`:'<p class="t-sm t-muted">ใส่ Lat/Lng หรือกด ตำแหน่งปัจจุบัน</p>'}`,
    id?'แก้ไขข้อมูลลูกค้า':'เพิ่มลูกค้าใหม่',()=>{
      const co=document.getElementById('fc_co').value.trim();
      if(!co)return U.toast('กรุณาใส่ชื่อบริษัท','danger');
      DB.customer.saveCustomer({
        id:id||undefined,
        company_name:co,
        address:document.getElementById('fc_addr').value.trim(),
        phone:document.getElementById('fc_ph').value.trim(),
        email:document.getElementById('fc_em').value.trim(),
        contact_name:document.getElementById('fc_cn').value.trim(),
        contact_role:document.getElementById('fc_cr').value.trim(),
        employee_count:parseInt(document.getElementById('fc_emp').value)||0,
        sales_status:document.getElementById('fc_st').value,
        last_contact:document.getElementById('fc_lc').value,
        note:document.getElementById('fc_nt').value.trim(),
        lat:document.getElementById('fc_lat').value.trim(),
        lng:document.getElementById('fc_lng').value.trim(),
      });
      Modal.close();Pages.customers.render();U.toast(id?'✅ อัปเดตแล้ว':'✅ เพิ่มลูกค้าแล้ว');
    },true);
  };
})();

/* ── 9. LINE NOTIFY CONFIG in Config page ─────── */
(function(){
  if(!Pages.config)return;
  const _orig=Pages.config.render;
  Pages.config.render=function(){
    _orig.call(this);
    setTimeout(()=>{
      const c=document.getElementById('content');
      if(!c||c.querySelector('#ext-line-card'))return;
      const tok=typeof LineNotify!=='undefined'?LineNotify.getToken()||'':'';
      const prx=localStorage.getItem('line_proxy_url')||'';
      const card=document.createElement('div');
      card.id='ext-line-card';card.className='card mt4';
      card.innerHTML=`
      <div class="card-header">
        <span class="card-title">💬 Line Notify</span>
        <button class="btn btn-suc btn-sm" onclick="EXT.line.test()">ทดสอบส่ง</button>
      </div>
      <div class="ab info mb4">แจ้งเตือน TAT/SLA ใกล้ครบ, วันตรวจใกล้ถึง (3 วัน) ผ่าน Line</div>
      <div class="fr">
        <div class="fg"><label>Line Notify Token</label>
          <input id="cfg_lt" type="password" placeholder="eyJhbGci..." value="${tok?'••••••':''}"/>
          <div class="t-xs t-muted mt2"><a href="https://notify-bot.line.me/th/" target="_blank" style="color:var(--info)">รับ Token ที่นี่ →</a></div>
        </div>
        <div class="fg"><label>Proxy URL (Netlify Function)</label>
          <input id="cfg_px" value="${U.esc(prx)}" placeholder="https://xxx.netlify.app/.netlify/functions/line-proxy"/>
          <div class="t-xs t-muted mt2">Line API ไม่รองรับ Browser โดยตรง ต้องการ Proxy</div>
        </div>
      </div>
      <button class="btn btn-pri btn-sm" onclick="EXT.line.save()">💾 บันทึก</button>`;
      c.appendChild(card);
    },120);
  };
})();

/* ── 10. EXT namespace ────────────────────────── */
window.EXT={
  crm:{
    gps(){
      if(!navigator.geolocation){U.toast('Browser ไม่รองรับ GPS','warning');return;}
      navigator.geolocation.getCurrentPosition(pos=>{
        const lat=document.getElementById('fc_lat');
        const lng=document.getElementById('fc_lng');
        if(lat)lat.value=pos.coords.latitude.toFixed(6);
        if(lng)lng.value=pos.coords.longitude.toFixed(6);
        U.toast('✅ ได้ตำแหน่งปัจจุบันแล้ว');
      },()=>U.toast('ไม่สามารถดึงตำแหน่งได้','warning'));
    },
    maps(){
      const lat=document.getElementById('fc_lat')?.value;
      const lng=document.getElementById('fc_lng')?.value;
      const addr=document.getElementById('fc_addr')?.value;
      const q=(lat&&lng)?`${lat},${lng}`:encodeURIComponent(addr||'');
      window.open(`https://maps.google.com/maps?q=${q}`,'_blank');
    },
  },
  line:{
    save(){
      const t=document.getElementById('cfg_lt')?.value;
      const p=document.getElementById('cfg_px')?.value.trim();
      if(t&&!t.includes('•')&&typeof LineNotify!=='undefined')LineNotify.setToken(t);
      if(p)localStorage.setItem('line_proxy_url',p);
      U.toast('✅ บันทึก Line Config แล้ว');
    },
    async test(){
      if(typeof LineNotify==='undefined'){U.toast('Line Notify ไม่พร้อม','warning');return;}
      const r=await LineNotify.send('🧪 [MCK Test] ทดสอบแจ้งเตือน Mobile Checkup ✅');
      U.toast(r.ok?'✅ ส่ง Line สำเร็จ':'❌ '+r.msg,r.ok?'success':'danger');
    },
  },
};

/* ── 11. LINE ALERT RUNNER (sync) ─────────────── */
function _runLineAlerts(){
  if(typeof LineNotify==='undefined'||!LineNotify.getToken())return;
  const ad=DB.config.getAlertDays();
  const sk='line_sent';
  let sent={};
  try{sent=JSON.parse(localStorage.getItem(sk)||'{}');}catch{}
  const today=new Date().toDateString();
  if(sent.date!==today)sent={date:today,keys:{}};
  const go=async(key,fn)=>{
    if(sent.keys[key])return;
    try{const r=await fn();if(r?.ok){sent.keys[key]=true;localStorage.setItem(sk,JSON.stringify(sent));}}catch{}
  };
  DB.lab.listProjects().forEach(lp=>{
    if(!lp.tat_deadline||lp.status==='reported')return;
    const d=Math.ceil((new Date(lp.tat_deadline)-new Date())/86400000);
    const p=DB.sales.getProject(lp.project_id);if(!p)return;
    if(d<0)go('to_'+p.id,()=>LineNotify.notifyTAT(p.project_code,p.company_name,d));
    else if(d<=ad)go('tw_'+p.id+'_'+d,()=>LineNotify.notifyTAT(p.project_code,p.company_name,d));
  });
  DB.report.listPlans().forEach(rp=>{
    if(!rp.sla_deadline||rp.status==='sent')return;
    const d=Math.ceil((new Date(rp.sla_deadline)-new Date())/86400000);
    const p=DB.sales.getProject(rp.project_id);if(!p)return;
    if(d<0)go('so_'+p.id,()=>LineNotify.notifySLA(p.project_code,p.company_name,d));
    else if(d<=ad)go('sw_'+p.id+'_'+d,()=>LineNotify.notifySLA(p.project_code,p.company_name,d));
  });
  DB.sales.listProjects().forEach(p=>{
    if(!p.onsite_date)return;
    const d=Math.ceil((new Date(p.onsite_date)-new Date())/86400000);
    if(d>=0&&d<=3)go('ons_'+p.id+'_'+d,()=>LineNotify.notifyOnsiteApproaching(p.project_code,p.company_name,p.onsite_date,d));
  });
}

/* ── 12. INIT on window load ──────────────────── */
window.addEventListener('load',()=>{
  if(typeof Pages!=='undefined')Pages['calendar']=CalendarPage;
  _mkHamburger();
  _checkLayout();
  window.addEventListener('resize',_checkLayout);
  _injectCalNav();
  NavBadges.update();
  setInterval(()=>NavBadges.update(),30000);
  if(typeof LineNotify!=='undefined'){
    LineNotify.init();
    setTimeout(_runLineAlerts,3500);
    setInterval(_runLineAlerts,3600000);
  }
  console.log('✅ Extensions loaded');
});
