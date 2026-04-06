/**
 * Line Notify Integration — Mobile Checkup System
 * ส่งการแจ้งเตือนผ่าน Line Notify API
 */
const LineNotify = {
  _token: null,
  
  init() {
    this._token = localStorage.getItem('line_notify_token') || null;
  },
  
  setToken(token) {
    this._token = token;
    localStorage.setItem('line_notify_token', token);
  },
  
  getToken() { return this._token; },
  
  async send(message) {
    if (!this._token) return { ok: false, msg: 'ไม่ได้ตั้งค่า Line Notify Token' };
    try {
      // Note: ต้อง CORS proxy เพราะ Line API ไม่รองรับ direct browser request
      // ใช้ Netlify Function หรือ Supabase Edge Function เป็น proxy
      const proxyUrl = localStorage.getItem('line_proxy_url');
      if (!proxyUrl) return { ok: false, msg: 'ไม่ได้ตั้งค่า Proxy URL' };
      
      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this._token, message })
      });
      const data = await res.json();
      return { ok: res.ok, msg: data.message || 'ส่งแล้ว' };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  },
  
  async notifyTAT(projectCode, company, daysLeft) {
    const icon = daysLeft < 0 ? '🔴' : '🟡';
    const msg = daysLeft < 0
      ? `${icon} [MCK Alert] TAT เกินกำหนด!\n📋 Project: ${projectCode}\n🏢 ${company}\n⏰ เกินมาแล้ว ${Math.abs(daysLeft)} วัน\n🔗 กรุณาดำเนินการด่วน`
      : `${icon} [MCK Alert] TAT ใกล้ครบกำหนด!\n📋 Project: ${projectCode}\n🏢 ${company}\n⏰ เหลืออีก ${daysLeft} วัน`;
    return this.send(msg);
  },
  
  async notifySLA(projectCode, company, daysLeft) {
    const icon = daysLeft < 0 ? '🔴' : '🟠';
    const msg = daysLeft < 0
      ? `${icon} [MCK Alert] SLA เกินกำหนด!\n📋 Project: ${projectCode}\n🏢 ${company}\n⏰ เกินมาแล้ว ${Math.abs(daysLeft)} วัน`
      : `${icon} [MCK Alert] SLA ใกล้ครบ!\n📋 Project: ${projectCode}\n🏢 ${company}\n⏰ เหลืออีก ${daysLeft} วัน`;
    return this.send(msg);
  },
  
  async notifyOnsiteApproaching(projectCode, company, date, daysLeft) {
    const msg = `📅 [MCK] ใกล้ถึงวันตรวจ!\n📋 Project: ${projectCode}\n🏢 ${company}\n📆 วันตรวจ: ${date}\n⏰ อีก ${daysLeft} วัน\n✅ กรุณาตรวจสอบความพร้อม`;
    return this.send(msg);
  },
  
  async notifyStatusChange(projectCode, company, oldStatus, newStatus) {
    const icons = { Closed:'💼', Onsite:'🚑', Lab:'🔬', Report:'📋', Billing:'💰', Completed:'✅' };
    const msg = `${icons[newStatus]||'📌'} [MCK] Project อัปเดตสถานะ\n📋 ${projectCode}\n🏢 ${company}\n${icons[oldStatus]||'📌'} ${oldStatus} → ${icons[newStatus]||'📌'} ${newStatus}`;
    return this.send(msg);
  },
  
  // เช็คและส่งแจ้งเตือนทั้งหมด
  async runAlertCheck(alertDays = 3) {
    if (!this._token) return;
    const sentKey = 'line_sent_alerts';
    let sent = {};
    try { sent = JSON.parse(localStorage.getItem(sentKey) || '{}'); } catch {}
    const today = new Date().toDateString();
    if (sent.date !== today) sent = { date: today, keys: {} };
    
    const send = async (key, fn) => {
      if (sent.keys[key]) return;
      const res = await fn();
      if (res.ok) { sent.keys[key] = true; localStorage.setItem(sentKey, JSON.stringify(sent)); }
    };
    
    // TAT alerts
    const lps = await DB.lab.listProjects();
    for (const lp of lps) {
      if (lp.status === 'reported') continue;
      const d = Math.ceil((new Date(lp.tat_deadline) - new Date()) / 86400000);
      const p = await DB.project.get(lp.project_id);
      if (!p) continue;
      if (d < 0) await send(`tat_over_${lp.project_id}`, () => LineNotify.notifyTAT(p.project_code, p.company_name, d));
      else if (d <= alertDays) await send(`tat_warn_${lp.project_id}_${d}`, () => LineNotify.notifyTAT(p.project_code, p.company_name, d));
    }
    
    // SLA alerts
    const rps = await DB.report.listPlans();
    for (const rp of rps) {
      if (rp.status === 'sent') continue;
      const d = Math.ceil((new Date(rp.sla_deadline) - new Date()) / 86400000);
      const p = await DB.project.get(rp.project_id);
      if (!p) continue;
      if (d < 0) await send(`sla_over_${rp.project_id}`, () => LineNotify.notifySLA(p.project_code, p.company_name, d));
      else if (d <= alertDays) await send(`sla_warn_${rp.project_id}_${d}`, () => LineNotify.notifySLA(p.project_code, p.company_name, d));
    }
    
    // Onsite approaching alerts
    const projs = await DB.project.list();
    for (const p of projs) {
      if (!p.onsite_date) continue;
      const d = Math.ceil((new Date(p.onsite_date) - new Date()) / 86400000);
      if (d >= 0 && d <= alertDays) {
        await send(`onsite_${p.id}_${d}`, () => LineNotify.notifyOnsiteApproaching(p.project_code, p.company_name, p.onsite_date, d));
      }
    }
  }
};

window.LineNotify = LineNotify;
