# 🌐 คู่มือ Deploy ออนไลน์ + เชื่อม Database ฟรี
# Mobile Checkup System — Production Setup Guide

---

## 📋 สารบัญ
1. Deploy บน Netlify (Free Domain)
2. เชื่อมต่อ Supabase (Free Database)
3. ตั้งค่า Custom Domain ฟรี
4. บำรุงรักษาและ Backup

---

## ส่วนที่ 1 — Deploy บน Netlify (ฟรี)

### ✅ วิธีที่ 1: Netlify Drop (ง่ายที่สุด — 2 นาที)

**ขั้นตอน:**
```
1. ไปที่  https://app.netlify.com/drop
2. ลากโฟลเดอร์ mobile-checkup/ ทั้งโฟลเดอร์วางลง
3. รอ 30 วินาที
4. ได้ URL เช่น  https://abc-123-xyz.netlify.app
```

**เปลี่ยนชื่อ URL:**
```
1. เข้า Netlify Dashboard → เลือก site ที่สร้าง
2. Site configuration → Site details → Change site name
3. เปลี่ยนเป็น mobile-checkup-yourname
4. URL ใหม่: https://mobile-checkup-yourname.netlify.app
```

---

### ✅ วิธีที่ 2: GitHub + Netlify (Auto-deploy ทุกครั้งที่แก้ไข)

**ขั้นตอนที่ 1: สร้าง GitHub Account**
```
1. ไปที่ https://github.com/signup
2. สมัครด้วย Email
3. ยืนยัน Email
```

**ขั้นตอนที่ 2: Upload ไฟล์ขึ้น GitHub**
```
วิธีง่าย (ไม่ต้องใช้ Terminal):
1. ไปที่ github.com → Login → กด + → "New repository"
2. Repository name: mobile-checkup
3. Public → Create repository
4. คลิก "uploading an existing file"
5. ลากไฟล์ทั้งหมดจากโฟลเดอร์ mobile-checkup/ ขึ้น:
   - index.html
   - css/ (โฟลเดอร์)
   - js/ (โฟลเดอร์)
6. Commit message: "Initial upload"
7. Commit changes
```

**ขั้นตอนที่ 3: Connect Netlify**
```
1. ไปที่ https://netlify.com → Sign up (ใช้ GitHub account)
2. Add new site → Import an existing project
3. Connect to GitHub → เลือก repo mobile-checkup
4. Build settings:
   - Base directory: (เว้นว่าง)
   - Build command: (เว้นว่าง)
   - Publish directory: . (จุด)
5. Deploy site
6. รอ ~1 นาที → ได้ URL ทันที
```

**Auto-deploy:**
ทุกครั้งที่แก้ไขไฟล์ใน GitHub → Netlify Deploy ให้อัตโนมัติภายใน 1 นาที

---
------------------------------------------------------------------------------------------------------------------------------------------------------
## ส่วนที่ 2 — เชื่อมต่อ Supabase Database ฟรี

> **ทำไมต้องใช้ Supabase?**
> - ปัจจุบันข้อมูลเก็บใน localStorage (เฉพาะ Browser เดียว)
> - Supabase = PostgreSQL ฟรี บน Cloud
> - หลายคนใช้พร้อมกัน ข้อมูลไม่หาย
> - ฟรี 500MB ข้อมูล, 50,000 requests/เดือน

### ขั้นตอนที่ 1: สร้าง Supabase Project

```
1. ไปที่ https://supabase.com → Sign Up ฟรี (ใช้ GitHub)
2. "New Project"
3. Organization: Personal
4. Project name: mobile-checkup
5. Database Password: ตั้งรหัสแข็งแกร่ง (จด เก็บไว้!)
6. Region: Southeast Asia (Singapore)
7. Create new project (รอ ~2 นาที)
```

### ขั้นตอนที่ 2: สร้าง Database Tables

ไปที่ **SQL Editor** แล้วรัน SQL นี้:

```sql
-- ตาราง users (auth)
create table if not exists mck_users (
  id serial primary key,
  username text unique not null,
  password text not null,
  name text not null,
  role text not null,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ตาราง customers
create table if not exists mck_customers (
  id serial primary key,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ตาราง projects
create table if not exists mck_projects (
  id serial primary key,
  project_code text unique,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ตาราง generic (ใช้สำหรับทุก table อื่น)
create table if not exists mck_store (
  id serial primary key,
  db_name text not null,
  table_name text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on mck_store(db_name, table_name);

-- Enable Row Level Security
alter table mck_users enable row level security;
alter table mck_customers enable row level security;
alter table mck_projects enable row level security;
alter table mck_store enable row level security;

-- Policy: allow all (สำหรับ demo — production ควรแก้)
create policy "allow_all" on mck_users for all using (true);
create policy "allow_all" on mck_customers for all using (true);
create policy "allow_all" on mck_projects for all using (true);
create policy "allow_all" on mck_store for all using (true);
```

### ขั้นตอนที่ 3: ดึง API Keys

```
1. Supabase Dashboard → Project Settings → API
2. คัดลอก:
   - Project URL: https://xxxx.supabase.co
   - anon public key: eyJhbGci....
```

### ขั้นตอนที่ 4: เพิ่ม Supabase ลงในโปรเจกต์

สร้างไฟล์ **js/supabase-config.js**:
```javascript
// ใส่ค่าจาก Supabase Dashboard
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

เพิ่มใน **index.html** ก่อน `<script src="js/database.js">`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

สร้างไฟล์ **js/db-cloud.js** (แทนที่ localStorage):
```javascript
// Cloud Database Layer — ใช้แทน localStorage
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CloudDB = {
  async getAll(dbName, tableName) {
    const { data, error } = await supabase
      .from('mck_store')
      .select('data')
      .eq('db_name', dbName)
      .eq('table_name', tableName)
      .single();
    if (error || !data) return [];
    return data.data || [];
  },

  async setAll(dbName, tableName, rows) {
    const { data: existing } = await supabase
      .from('mck_store')
      .select('id')
      .eq('db_name', dbName)
      .eq('table_name', tableName)
      .single();

    if (existing) {
      await supabase
        .from('mck_store')
        .update({ data: rows, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('mck_store')
        .insert({ db_name: dbName, table_name: tableName, data: rows });
    }
  }
};

// Override DB._get and DB._set to use Supabase
// Note: ต้องเปลี่ยน DB ให้ใช้ async/await ทั้งหมด
// สำหรับ production ดูเอกสาร Supabase: https://supabase.com/docs
```

> ⚠️ **หมายเหตุสำคัญ:** การเปลี่ยนจาก localStorage เป็น Supabase ต้องแก้ DB layer ทั้งหมดให้เป็น async/await ซึ่งต้องใช้เวลาพัฒนาพอสมควร แนะนำให้ทำเป็น Phase:
> - **Phase 1 (ตอนนี้):** ใช้ localStorage ทดสอบฟีเจอร์ก่อน
> - **Phase 2:** Migration ไป Supabase ทีละ module

---

## ส่วนที่ 3 — Custom Domain ฟรี

### วิธีที่ 1: Freenom (.tk, .ml, .ga, .cf)

```
1. ไปที่ https://www.freenom.com
2. ค้นหา domain ที่ต้องการ เช่น mobilecheckup.tk
3. Get it Free → สั่งซื้อ (ฟรี 1 ปี)
4. ไป Netlify → Domain management → Add custom domain
5. ใส่ domain ที่ได้ → Verify
6. ไป Freenom → Manage DNS → เพิ่ม CNAME record:
   Name: www
   Target: [your-site].netlify.app
```

### วิธีที่ 2: Cloudflare + Netlify (แนะนำ)

```
1. สมัคร Cloudflare ฟรี: https://cloudflare.com
2. ซื้อ .com จาก Cloudflare Registrar ~$10/ปี (ราคา cost)
3. Netlify → Domain settings → Add custom domain
4. ใน Cloudflare → DNS → เพิ่ม CNAME:
   Name: @
   Target: [your-site].netlify.app
   Proxy: DNS only
5. รอ 5-10 นาที → ใช้งานได้
```

---

## ส่วนที่ 4 — แนวทาง Production ที่แนะนำ (Architecture)

```
Frontend (HTML/CSS/JS)
  └── Netlify CDN (ฟรี / ~$19/เดือน Pro)
      └── Custom Domain (Cloudflare)

Backend/Database
  └── Supabase (PostgreSQL)
      ├── Authentication (JWT)
      ├── Row Level Security
      └── Real-time subscriptions

Storage (ไฟล์แนบ)
  └── Supabase Storage (ฟรี 1GB)
      หรือ Cloudflare R2 (ฟรี 10GB)
```

### ต้นทุนรวม (ฟรีทั้งหมด สำหรับองค์กรขนาดเล็ก)

| บริการ | Plan ฟรี | ขีดจำกัด |
|--------|----------|----------|
| Netlify | Starter | 100GB bandwidth/เดือน |
| Supabase | Free | 500MB DB, 50K requests |
| Domain | Freenom | .tk/.ml ฟรี 1 ปี |
| SSL/HTTPS | Let's Encrypt | ฟรีตลอด |

---

## ✅ Checklist ก่อน Go-Live

- [ ] ทดสอบ Login ทุก Role
- [ ] ทดสอบสร้าง Project ตลอด Workflow
- [ ] ทดสอบพิมพ์ ใบแจ้งงาน และสรุปยอด
- [ ] เปลี่ยน Default Password ของ admin
- [ ] Backup ข้อมูล (Export localStorage เป็น JSON)
- [ ] ตั้ง Custom Domain
- [ ] ทดสอบบน Mobile

---

*Mobile Checkup System — Deploy Guide v3*
*สอบถามเพิ่มเติมได้ที่ทีม IT*
