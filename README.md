# 🏥 Mobile Checkup — Web Application

ระบบบริหารธุรกิจตรวจสุขภาพเคลื่อนที่ (Mobile Checkup) แบบครบวงจร
รองรับ 5 ทีม: Sales | Operation | Lab | Report | Billing

---

## 📁 โครงสร้างไฟล์

```
mobile-checkup/
├── index.html          ← หน้าหลัก (เปิดไฟล์นี้)
├── css/
│   └── style.css       ← CSS ทั้งหมด
├── js/
│   ├── database.js     ← Database Layer (6 DBs)
│   └── app.js          ← Logic + Pages ทั้งหมด
└── README.md           ← คู่มือนี้
```

---

## 🗄️ Database Architecture (6 Logical DBs)

ระบบใช้ **localStorage** แยกเป็น 6 Database:

| Database | ตาราง | หน้าที่ |
|----------|-------|---------|
| `customer_db` | customers, contacts, sales_logs | ข้อมูลลูกค้า CRM |
| `sales_db` | projects, packages, internal_handover | การขายและเอกสารเวียน |
| `operation_db` | events, manpower, onsite_logs, specimen_tracking | งานออกหน่วย |
| `lab_db` | lab_projects, qc_logs, critical_alerts, tat_tracking | ห้องปฏิบัติการ |
| `report_db` | project_plan, patient_list, raw_data, validation_logs | ทำผลตรวจ |
| `billing_db` | invoices, cost_tracking, profit_summary | การเงิน |

ทุก Table เชื่อมกันด้วย `project_id`

---

## 🚀 วิธีใช้งาน (Local)

1. **แตกไฟล์ ZIP** ไปยังโฟลเดอร์ที่ต้องการ
2. **ดับเบิลคลิก `index.html`** เปิดด้วย Browser (Chrome/Edge/Firefox)
3. ระบบจะโหลด **Mock Data** อัตโนมัติ

> ⚠️ **หมายเหตุ**: ข้อมูลเก็บใน localStorage ของ Browser
> ถ้าเปิดแบบ `file://` บาง Browser อาจมีข้อจำกัด
> แนะนำใช้ VS Code + Live Server หรือ Deploy ออนไลน์

---

## 🌐 วิธี Deploy ออนไลน์ฟรี (Netlify — แนะนำ)

### ✅ วิธีที่ 1: Netlify Drop (ง่ายที่สุด — 2 นาที)

1. ไปที่ **https://netlify.com** → Sign Up ฟรี (ใช้ Email หรือ GitHub)
2. หน้า Dashboard → คลิก **"Add new site"** → **"Deploy manually"**
3. **ลากโฟลเดอร์ `mobile-checkup/` ทั้งโฟลเดอร์** วางในกล่อง Drop Zone
4. รอ 30 วินาที → ได้ URL เช่น `https://abc-xyz-123.netlify.app`
5. ✅ เปิดใช้งานได้ทันที

**เปลี่ยนชื่อ Domain:**
- Site settings → Site information → Change site name
- เช่น `mobile-checkup-demo.netlify.app`

---

### ✅ วิธีที่ 2: GitHub + Netlify (แนะนำสำหรับอัปเดตบ่อย)

**ขั้นตอนที่ 1: สร้าง GitHub Repository**
```
1. ไปที่ github.com → Sign Up/Login
2. คลิก "New repository"
3. ชื่อ: mobile-checkup
4. Public ✓ → Create repository
```

**ขั้นตอนที่ 2: Upload ไฟล์ขึ้น GitHub**
```
วิธีง่าย (ไม่ต้องใช้ Terminal):
1. เปิด Repo ที่สร้าง → คลิก "uploading an existing file"
2. ลากไฟล์ทั้งหมดขึ้น (index.html, css/, js/)
3. Commit changes
```

หรือใช้ Git:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/mobile-checkup.git
git push -u origin main
```

**ขั้นตอนที่ 3: Deploy บน Netlify**
```
1. netlify.com → Add new site → Import an existing project
2. Connect to GitHub → เลือก Repo "mobile-checkup"
3. Build settings:
   - Base directory: (ว่าง)
   - Publish directory: . (จุด)
   - Build command: (ว่าง)
4. Deploy site
```

ทุกครั้งที่ Push ขึ้น GitHub → Netlify Auto-Deploy ให้อัตโนมัติ

---

### ✅ วิธีที่ 3: Vercel

```
1. vercel.com → Sign Up (ใช้ GitHub)
2. New Project → Import Git Repository
3. เลือก Repo → Framework: Other
4. Deploy → ได้ URL ทันที
```

---

### ✅ วิธีที่ 4: GitHub Pages (ฟรี 100%)

```
1. Upload ไฟล์ขึ้น GitHub Repository
2. Settings → Pages → Source: Deploy from branch
3. Branch: main, Folder: / (root)
4. Save → URL: https://USERNAME.github.io/mobile-checkup
```

---

## 📱 วิธีใช้งาน VS Code + Live Server (Offline)

```
1. ติดตั้ง VS Code: https://code.visualstudio.com
2. Extensions → ค้นหา "Live Server" → Install
3. เปิดโฟลเดอร์ mobile-checkup ใน VS Code
4. คลิกขวาที่ index.html → "Open with Live Server"
5. Browser เปิดที่ http://localhost:5500
```

---

## 🎯 Demo Scenario สำหรับผู้บริหาร

| ลำดับ | หน้า | สิ่งที่แสดง | เวลา |
|-------|------|-------------|------|
| 1 | Dashboard | ภาพรวม Project, Alert แดง, สถิติ | 2 นาที |
| 2 | CRM → Customers | รายชื่อลูกค้า, เพิ่มใหม่, บันทึก Log | 2 นาที |
| 3 | Sales → Project | สร้าง Project ใหม่, เอกสารเวียน | 2 นาที |
| 4 | Operation → Prep | ใบแจ้งงาน, อัตรากำลัง, Specimen | 2 นาที |
| 5 | Lab | TAT Tracker, Critical Alert สีแดง | 2 นาที |
| 6 | Report | Project Plan, รายชื่อ, SLA | 2 นาที |
| 7 | Billing | Invoice, กำไร, Margin % | 2 นาที |

**Demo Script:**
```
"ระบบนี้เชื่อมทุกทีมด้วย Project Code เดียว
 ทีมขายปิดงาน → ระบบสร้าง Project อัตโนมัติ
 ทุกทีมเห็นข้อมูลเดียวกัน Real-time
 Alert แจ้งเตือนอัตโนมัติเมื่อ TAT ใกล้ครบ"
```

---

## 🔧 Customize ระบบ

**เพิ่ม Package ตรวจสุขภาพ:**
ไปที่ Sales → คลิก "จัดการ Package"

**เพิ่ม/แก้ไขลูกค้า:**
ไปที่ CRM → เพิ่มลูกค้าใหม่

**รีเซ็ต Demo Data:**
Dashboard → ปุ่ม "🔄 รีเซ็ต Demo Data"

**แก้ไข TAT Policy:**
แก้ไขในไฟล์ `js/database.js` ส่วน `closeUnit()`:
```javascript
const tat = p.headcount > 2000 ? 20 : 15; // เปลี่ยนตรงนี้
```

---

## 🛡️ Security สำหรับ Production

หากต้องการใช้งานจริงในองค์กร แนะนำ:
1. ย้าย Database จาก localStorage → **Supabase** (ฟรี)
2. เพิ่ม **Authentication** (Login/Role)
3. Deploy บน **Vercel** หรือ **Netlify** พร้อม Custom Domain

Contact: ติดต่อทีม IT สำหรับ Production Setup

---

*Mobile Checkup System v1.0.0 — Built for Demo*
