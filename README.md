# 🚒 JRE-2027 | ระบบสารสนเทศและรับสมัครโครงการฝึกอบรมเชิงปฏิบัติการกู้ภัยนักศึกษาอีสาน
> **Joint Response Exercise 2027 (JRE 2027)**  
> จัดโดย: **ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม (มมส)**  
> ภาคีเครือข่ายร่วม: **อาสาสมัครปฏิบัติการและสืบสวนพิเศษ มหาวิทยาลัยขอนแก่น (มข.)** และ **ชมรมอาสาสมัครกู้ชีพ ชุดเคลื่อนที่เร็ว มหาวิทยาลัยเกษตรศาสตร์ (มก.)**  
> วันที่จัดกิจกรรม: **7 - 8 พฤศจิกายน 2569 (2 วัน 1 คืน)** ณ มหาวิทยาลัยมหาสารคาม

---

## 🌟 ฟีเจอร์หลักของระบบ (Features)

1. **หน้าแรก (Landing & Home View)**
   - ข้อมูลโครงการ JRE 2027, วัตถุประสงค์, และประธานในพิธี (รศ.ดร.นิตยา วรรณกิตร์ รองอธิการบดีฝ่ายพัฒนานิสิตและภาพลักษณ์องค์กร มมส)
   - ข้อมูลทีมงานผู้ดำเนินการฝึก: **1 - 3 มมส** และ **4 - 7 มข** พร้อมรูปภาพและบทบาทหน้าที่
   - ข้อมูลวิทยากรประจำโครงการ: **1 ถึง 6** พร้อมรูปภาพ สังกัด และหัวข้อการฝึกอบรม
2. **กำหนดการฝึกอบรม (Schedule 2 วัน 1 คืน)**
   - วันที่ 7 - 8 พ.ย. 2569 พร้อมระบุสถานที่ชัดเจน (ห้องประชุมใหญ่ ชั้น 2 อาคารบรมราชกุมารี, สนามหญ้าส่วนกลาง, หอฝึกจำลอง, สระว่ายน้ำ มมส, ลานกิจกรรมกลางแจ้งสำหรับซ้อมแผนกลางคืน, และเรือนนอน 1-2)
3. **ระบบรับสมัคร & คำนวณอายุอัตโนมัติ (Registration)**
   - รองรับการกรอก วัน/เดือน/ปีเกิด (พ.ศ. หรือ ค.ศ.)
   - **คำนวณอายุแบบเรียลไทม์เป็น ปี เดือน วัน อัตโนมัติทันที**
   - กรุ๊ปเลือด, เบอร์โทรศัพท์, ข้อมูลบุคคลที่ติดต่อได้กรณีฉุกเฉิน (ชื่อ สกุล ความสัมพันธ์ เบอร์โทร)
4. **แดชบอร์ดผู้สมัคร (Applicant Dashboard)**
   - แสดงสถานะการสมัคร
   - **แสดงผลการจัดสรรจาก Admin แบบเรียลไทม์**:
     - **กลุ่มฝึกปฏิบัติการ (Group)**
     - **ห้องนอน / ที่พักค้างแรม (Room)**
   - แสดงปุ่มทำแบบทดสอบก่อน-หลัง และแบบประเมินผล (เมื่อ Admin เปิดใช้งาน)
5. **ระบบผู้ดูแลระบบ (Admin Console)**
   - **รหัสผ่านไม่ถูก Hardcode ใน Code** (ใช้งานผ่าน Environment Variable `VITE_ADMIN_PASSWORD` ค่าเริ่มต้น: `adminjre27`)
   - **มีปุ่มลูกตาเปิด/ปิดดูรหัสผ่าน (Show/Hide Password Toggle)**
   - ดูรายชื่อ ค้นหา และกรองผู้สมัครตามกรุ๊ปเลือด พร้อมปุ่มดาวน์โหลดรายงาน CSV
   - **จัดกลุ่ม (Group) และจัดห้องนอน (Room)** ให้ผู้สมัครได้โดยตรง
   - **ระบบจัดการ Google Form (Pre-test, Post-test, Evaluation)**: ใส่ URL และมีปุ่มสวิตช์เปิด/ปิด ให้ผู้สมัครทำแบบทดสอบได้ตามเวลาที่ต้องการ
   - **ระบบประกาศข่าวสาร (Announcements)**: เพิ่ม ลบ แก้ไข ประกาศคำสั่ง, กำหนดการชำระเงินค่าสมัคร, ลิงก์เข้ากลุ่ม Line OpenChat, และแจ้งเตือนด่วน
6. **การเชื่อมต่อ Backend & Cloud**
   - รองรับ **Supabase (PostgreSQL)** พร้อม Database Schema (`supabase_schema.sql`)
   - มีระบบ **LocalStorage Fallback อัตโนมัติ** ทำให้เปิดใช้งานและทดสอบบน Vercel ได้ทันทีโดยระบบไม่ล่มแม้ยังไม่ได้ใส่คีย์ฐานข้อมูล

---

## 🚀 การ Deploy ขึ้น Vercel

คุณสามารถกด Deploy เข้าทีมของคุณได้ทันทีผ่านลิงก์:
👉 **[Deploy to Vercel (rcp-msu)](https://vercel.com/new?teamSlug=rcp-msu)**

### Environment Variables ที่ต้องตั้งค่าใน Vercel:
| Variable Name | รายละเอียด | ค่าเริ่มต้น / แนะนำ |
|---|---|---|
| `VITE_ADMIN_USERNAME` | ชื่อผู้ใช้สำหรับเข้าสู่ระบบ Admin | `admin` |
| `VITE_ADMIN_PASSWORD` | รหัสผ่าน Admin (ห้ามฝังในโค้ด) | `adminjre27` |
| `VITE_SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anon Key | `your-anon-key` |

---

## 🗄️ การตั้งค่า Supabase (PostgreSQL Backend)

1. เข้าไปที่ [Supabase](https://supabase.com) แล้วสร้างโปรเจกต์ใหม่
2. ไปที่เมนู **SQL Editor**
3. คัดลอกเนื้อหาจากไฟล์ `supabase_schema.sql` แล้วกด **RUN**
4. ไปที่ **Settings > API** คัดลอก `Project URL` และ `anon public key` นำไปใส่ใน Vercel หรือไฟล์ `.env`

---

## 🎨 Prompt สำหรับ Canva AI (Website Builder Prompt)

หากต้องการนำไปสร้างเลย์เอาต์หรือภาพกราฟิกประกอบด้วย **Canva AI Website Builder** สามารถคัดลอก Prompt ด้านล่างนี้ไปสั่งงานได้ทันที:

### ภาษาไทย (Thai Prompt):
```text
สร้างเว็บไซต์สำหรับโครงการฝึกอบรมเชิงปฏิบัติการกู้ภัยฉุกเฉินระดับมหาวิทยาลัย ชื่อ "JRE 2027 (Joint Response Exercise 2027)" 
จัดโดย "ชมรมกู้ภัยราชพฤกษ์ สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม (มมส)" ร่วมกับ มหาวิทยาลัยขอนแก่น (มข.) 
โทนสีหลัก: สีน้ำเงินเข้มเนวี่ (Dark Navy Blue #0b0f19), สีส้มกู้ภัยฉุกเฉิน (Rescue Orange #f97316), และสีแดงฉุกเฉิน (Emergency Red #dc2626) 
ดีไซน์สไตล์ Modern Emergency, Professional Rescue, มีความปลอดภัย น่าเชื่อถือ และทรงพลัง

โครงสร้างหน้าเว็บประกอบด้วย:
1. Header & Hero Section: โลโก้ JRE 2027, หัวข้อใหญ่ "มมส จัด JRE 2027 ติวเข้มเครือข่ายกู้ภัยนักศึกษาอีสาน ยกระดับทักษะรับมือเหตุฉุกเฉิน", ประธานเปิดงาน รศ.ดร.นิตยา วรรณกิตร์, พร้อมปุ่ม "เข้าสู่ระบบด้วย Google" และ "สมัครเข้าร่วมโครงการ"
2. Section ทีมงานผู้ดำเนินการ: แสดงการ์ดรูปภาพทีมงาน 7 ท่าน (1-3 มมส และ 4-7 มข) พร้อมตำแหน่งและสถาบัน
3. Section คณะวิทยากร: แสดงการ์ดรูปภาพวิทยากร 6 ท่าน (แพทย์เวชศาสตร์ฉุกเฉิน, ผู้เชี่ยวชาญกู้ภัยทางน้ำ, เชือกกู้ภัยในที่สูง, กู้ชีพชั้นสูง, เครื่องตัดถ่าง, และระบบบัญชาการ ICS)
4. Section กำหนดการ 2 วัน 1 คืน: วันที่ 7 - 8 พ.ย. 2569 แสดงไทม์ไลน์พร้อมสถานที่ชัดเจน (ห้องประชุมใหญ่ ชั้น 2 อาคารบรมราชกุมารี, สนามหญ้าส่วนกลาง, สระว่ายน้ำ, หอนอน 1-2)
5. Section ระบบรับสมัคร & แดชบอร์ด: ฟอร์มคำนวณอายุอัตโนมัติ (ปี เดือน วัน), กรุ๊ปเลือด, ติดต่อฉุกเฉิน, และการ์ดแสดงผลการจัดสรรกลุ่มฝึก (Group) และห้องพัก (Room)
6. Section กระดานประกาศข่าวสาร: ประกาศคำสั่ง, การชำระเงินค่าสมัคร, ลิงก์เข้ากลุ่ม Line OpenChat
7. Footer: ข้อมูลชมรมกู้ภัยราชพฤกษ์ มมส, เบอร์ติดต่อฉุกเฉิน, ลิงก์ GitHub และ Vercel
```

### English Prompt:
```text
Design a modern, high-impact landing page and portal for "JRE 2027 (Joint Response Exercise 2027)" - Northeast University Student Emergency Rescue Network Training organized by Rajapruek Rescue Club, Mahasarakham University (MSU) and Khon Kaen University (KKU).
Theme & Palette: Tactical Dark Navy (#0b0f19), Rescue High-Vis Orange (#f97316), Alert Red, and Crisp White.
Sections:
- Hero banner with MSU logo, event dates (Nov 7-8, 2026 / 2569), Google Sign-In call to action.
- Organizing Committee Cards (3 MSU Officers, 4 KKU Officers with avatar photos).
- Expert Instructors Grid (6 Doctors and Rescue Specialists).
- 2-Day 1-Night Timetable with specific locations (Convention Hall, Tactical Grounds, Rescue Pool, Dormitories).
- Registration Form with automatic Real-time Age calculation (Years/Months/Days), Blood Group, Emergency Contacts.
- Applicant Dashboard displaying Admin-assigned Training Group & Sleeping Dormitory.
- Announcement Board (Payment deadline, Line OpenChat QR, Exercise Orders) and Google Form testing toggles.
- Footer with rescue hotline and Mahasarakham University credits.
```

---

## 💻 การทดสอบและรันในเครื่อง (Local Development)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เริ่มรัน Development Server
npm run dev

# 3. Build ตรวจสอบความถูกต้องก่อนขึ้น Production
npm run build
```
