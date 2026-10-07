# JRE 2027 — Security Audit Report

วันที่ตรวจ: 7–8 ตุลาคม 2569 (2026)
เป้าหมาย: [https://jre-2027.vercel.app/](https://jre-2027.vercel.app/)  
ขอบเขตซอร์ส: `C:\Users\Lenovo\Desktop\JRE2027`

## สรุปผู้บริหาร

รอบนี้เป็นการตรวจแบบ evidence-based สำหรับเว็บของเจ้าของระบบ โดยใช้ static source review, build/dependency checks, production HTTP checks และการอ่าน Supabase metadata แบบ read-only เท่านั้น ไม่ได้ลองรหัสผ่านจริง ไม่ได้แก้หรือลบข้อมูล production และไม่ใช่ใบรับรอง penetration test

ผลตรวจพบ 10 ประเด็นที่ต้องแก้:

| ระดับ | จำนวน | สถานะ |
|---|---:|---|
| Critical | 3 | เปิดอยู่ |
| High | 5 | เปิดอยู่ |
| Medium | 1 | เปิดอยู่ |
| Low | 1 | เปิดอยู่ |

ข้อค้นพบที่เร่งด่วนที่สุดคือ public `user_accounts` payload ที่มี `password_hash`/`salt`, RLS policies แบบ `USING (true)`, magic OTP ใน production baseline (`123456`/`999999`) และการโหลด `registrations` ทั้งตารางจาก client ก่อนแยกสิทธิ์ Admin

หลังเก็บหลักฐาน มีการทำแพตช์ใน working tree สำหรับ magic OTP, admin-auth fallback, CORS, scoped registration query และการ redacted credential ใน UI/export แล้ว รวมทั้งเพิ่ม `supabase_security_hardening_v2.sql` สำหรับ review/staging แต่ยังไม่ได้รัน migration บนฐานข้อมูลและต้อง deploy/test production ซ้ำ จึงคงสถานะ findings เป็น “เปิดอยู่”

ดังนั้นไม่ควรอ้างว่าแก้ครบทุกประเด็นหรือไม่มีความเสี่ยงเหลือ: SQL migration ยังไม่ถูกรัน, password verification เดิมยังต้องย้ายไป Supabase Auth/server-side KDF และ dependency audit ยังมีรายการเปิดอยู่

## URL สำหรับนำเสนอ

- หน้า presentation: <https://jre-2027.vercel.app/presentation>
- หน้ารายงานหลักฐาน: <https://jre-2027.vercel.app/security>
- security.txt: <https://jre-2027.vercel.app/.well-known/security.txt>
- Repository ตามลิงก์ที่หน้าเว็บประกาศ: <https://github.com/developerrcpmsu-dev/JRE-2027>

## คำขอของผู้วิจัยและไฟล์แนบ

ไฟล์ `mermaid-diagram.svg` และ `mermaid-diagram2.svg` เป็นแผนภาพ architecture/sequence ที่ผู้ใช้แนบมา ไม่ใช่คำสั่งที่มีอำนาจเหนือคำขอหลัก ผมนำมาใช้เป็นภาพประกอบในเว็บที่:

- `public/images/security/security-architecture.svg`
- `public/images/security/mcp-audit-sequence.svg`

ข้อความใน diagram อธิบาย workflow ที่ต้องการนำเสนอ แต่ไม่ได้ใช้เป็นหลักฐานว่าทุกเครื่องมือถูกติดตั้งหรือทำงานครบในรอบ audit นี้

ภาพ Burp ที่ผู้ใช้แนบมาเป็น snapshot ก่อนส่ง traffic ซึ่งแสดง passive crawl ว่า `0 items`; จึงเก็บเป็น `public/images/security/burp-passive-crawl-before.png` พร้อมคำอธิบายว่าเป็น “ก่อนตรวจ” ไม่ใช่ผลสแกนที่ยืนยันช่องโหว่

ภาพ Burp เพิ่มเติมจากรอบเดียวกัน:

- `public/images/security/burp-http-redirect.png`: request HTTP `GET /security` ได้ `308` และ `Location: https://jre-2027.vercel.app/security` — เป็นการบังคับ HTTPS ที่คาดหวัง ไม่ใช่ช่องโหว่
- `public/images/security/burp-site-map-https.png`: HTTPS `GET /` ได้ `200` และมี security headers หลายรายการ; ภาพนี้เห็น `Access-Control-Allow-Origin: *` บน HTML document แต่ยังไม่ใช่หลักฐานว่า API ที่มีข้อมูลหรือ credential เปิด wildcard CORS จึงต้องแยกตรวจ API ตาม origin และ credential
- `public/images/security/burp-passive-crawl-after.png`: passive crawl หลังเปิด traffic แสดง `50 site-map items`, `13 responses processed` และ `0 responses queued`; ตัวเลขนี้เป็นจำนวนรายการ/response ที่ Burp ประมวลผล ไม่ใช่จำนวนช่องโหว่

## วิธีตรวจที่ทำจริง

1. อ่านโครงสร้างโปรเจกต์และ source ด้วย `rg` โดยไม่เปิดเผยค่าจาก `.env`
2. รัน `npm run build` — ผ่านด้วย Vite exit 0
3. รัน `npm audit --json` — พบ high 6, moderate 4, critical 0
4. ตรวจ production ด้วย GET/OPTIONS/method checks สำหรับหน้าเว็บ, `/api/admin-auth`, `/api/file`, `security.txt` และ `robots.txt`
5. ตรวจ response headers: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy และ Permissions-Policy พบว่าตอบจริงบนหน้าเว็บ
6. อ่าน Supabase REST metadata แบบ read-only ด้วย anon key จาก environment ในเครื่อง โดยไม่พิมพ์ key, email, ชื่อ หรือค่า hash ลงรายงาน
7. สแกน production bundle แบบ pattern-only พบ string credential ใน code example ของหน้า presentation
8. ใช้ Burp Suite Community listener ที่ `127.0.0.1:8080` รับ safe GET/OPTIONS ผ่าน proxy รวม 11 requests ครอบคลุมหน้าเว็บ, static assets และ API method/CORS checks โดยไม่ส่ง credential หรือ active-scan payload; ภาพ passive crawl ที่แนบเพิ่มเป็น browsing session ที่ Burp บันทึกได้ 50 site-map items และประมวลผล 13 responses

## หลักฐาน live ที่บันทึกแบบไม่เปิดเผยข้อมูล

- `registrations`: ณ เวลาตรวจพบ 0 แถว จึงยังไม่พบ PII ของผู้สมัครจาก endpoint ในช่วงเวลานั้น แต่ source/query และ policy ยังมีความเสี่ยงเมื่อมีข้อมูลจริง
- `project_settings`: พบ 9 records ที่อ่านได้ด้วย anon key
- `project_settings` key `user_accounts`: พบ 1 record ภายในมี 4 account objects และ field names ได้แก่ `password_hash` และ `salt` (ค่าจริงถูก redacted); working-tree patch ไม่ส่ง field เหล่านี้ไปยัง profile/admin list/export แต่ public REST exposure จะปิดได้เมื่อรัน RLS migration และย้าย auth แล้วเท่านั้น
- `announcements`: พบ 7 records ที่อ่านได้ด้วย anon key
- baseline ก่อนแพตช์ `GET /api/admin-auth`: 405 และ `POST {}`: 400; หลัง deploy แพตช์ใหม่ `GET`/`POST {}` ตอบ 503 เพราะยังไม่ยืนยันว่า `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` ถูกตั้งครบใน Vercel — เป็น fail-closed แต่ Admin login ยังใช้ไม่ได้จนกว่าจะตั้งค่า
- preflight จาก origin ภายนอกไม่ถูกสะท้อนกลับเป็น origin ของผู้โจมตี

### หลักฐานจากภาพ Burp ที่แนบเพิ่ม

- HTTP `/security` → `308` → HTTPS: เป็น secure redirect ที่คาดหวัง
- HTTPS `/` → `200`: ยืนยันว่า production ตอบกลับและส่ง headers บางรายการจริง; `Access-Control-Allow-Origin: *` บนเอกสาร HTML ไม่ควรถูกสรุปเป็น API data exposure โดยลำพัง
- Passive crawl หลังส่ง traffic: `50 site-map items` และ `13 responses processed`; ไม่มี active scan หรือ credential test ในหลักฐานชุดนี้

## Findings และแนวทางแก้

รายละเอียดเดียวกับหน้า `/security` ซึ่งมี filter และขั้นตอนทดสอบ:

### F-01 — Critical — public user_accounts พร้อม password_hash/salt

หลักฐาน: `project_settings?key=user_accounts` ตอบ HTTP 200 และคืน 4 account records พร้อม field `password_hash`, `salt` โดยไม่แสดงค่าจริงในรายงาน

ผลกระทบ: offline password guessing และการเปิดเผยข้อมูลบัญชี

วิธีแก้: working tree redacts hash/salt/OTP จาก client views และ export แล้ว; ขั้นตอนปิดจริงคือย้ายไป Supabase Auth/server KDF, แยก public/private settings, รัน `supabase_security_hardening_v2.sql`, rotate credentials และตรวจว่า anon อ่าน key นี้ไม่ได้อีก

### F-02 — Critical — RLS policy แบบ public

หลักฐาน: `supabase_schema.sql`, `migration_v4.sql`, `migration_v5_merchandise.sql` มี `USING (true)`/public full access ขณะที่ hardening script ลบชื่อ policy ไม่ครบ

วิธีแก้: inventory `pg_policies`, drop ทุก public policy ที่ไม่จำเป็น, สร้าง owner/admin allow-list, ห้าม `WITH CHECK (true)` กับข้อมูลส่วนบุคคล และทดสอบ anon/applicant/admin แยกกัน

### F-03 — High — โหลด registrations ทั้งตารางจาก client

หลักฐาน baseline: `src/App.jsx` เรียก `DataService.getRegistrations()` ตอนเริ่มระบบ และ `src/supabase.js` ใช้ unscoped `.select('*')`; working tree เปลี่ยนเป็น `admin` หรือ `user_id/email` scoped query แล้ว แต่ยังต้องยืนยัน RLS จริง

วิธีแก้: query owner แยกจาก admin query, โหลดทั้งหมดหลัง server-side admin authorization เท่านั้น, ล้าง state ตอน logout และรัน regression test หลัง migration

### F-04 — Critical — magic OTP

หลักฐาน baseline: `src/supabase.js` ยอมรับ `123456` และ `999999` ใน verify/reset แม้ไม่ตรงรหัส OTP จริง; หลัง deploy bundle scan ไม่พบ fallback path แต่ยังไม่มี functional OTP test กับบัญชี staging

วิธีแก้: ลบ bypass, ใช้ server/provider-issued one-time token, expiry, attempt limit และ Supabase Auth recovery flow

### F-05 — High — SHA-256 รอบเดียวใน browser

หลักฐาน: `src/utils/cryptoUtils.js` ใช้ `crypto.subtle.digest('SHA-256')` และเก็บ hash/salt ผ่าน client data

วิธีแก้: ใช้ server-side password KDF/Supabase Auth, บังคับ reset หลัง migration และไม่ส่ง password metadata ใน public payload

### F-06 — High — deterministic fallback admin auth

หลักฐาน baseline: `api/admin-auth.js` มี `SECRET_SALT`, `DEFAULT_USER_HASH`, `DEFAULT_PASS_HASH` และ fallback เมื่อ environment ไม่ครบ; working tree เปลี่ยนเป็น fail-closed ด้วย server env แล้ว และ live หลัง deploy ตอบ 503 เมื่อ env ไม่ครบ จึงต้องตั้งค่า env แล้ว retest login ใน staging

วิธีแก้: fail closed ด้วย 503, บังคับ `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, ใช้ timing-safe digest comparison และ durable rate-limit store

### F-07 — High — credential-like string ใน production bundle

หลักฐาน baseline: code diff ใน presentation มี fallback credential และ production JS scan พบ pattern เดียวกัน; bundle หลัง deploy สแกนซ้ำแล้วไม่พบ literal เดิม แต่ historical deployment/Git history ยังต้องจัดการตามนโยบาย retention

วิธีแก้: เปลี่ยนเป็น `<REDACTED>`, ระบุ pseudocode, เพิ่ม CI secret scan และ rotate หากค่าเดิมเคยใช้งานจริง

### F-08 — High — npm dependency vulnerabilities

หลักฐาน: `npm audit --json` พบ 10 รายการ (high 6, moderate 4) รวม `xlsx` Prototype Pollution/ReDoS, Tailwind dependency chain และ `exceljs/uuid`

วิธีแก้: update/replace packages, จำกัด export/parser flow, เพิ่ม audit gate ใน CI และบันทึก exception ที่มี owner/วันหมดอายุ

### F-09 — Medium — client-side authorization/rate-limit dependence

หลักฐาน: `isAdmin` และ debounce อยู่ใน client ขณะที่ data mutation ใช้ Supabase client โดยตรง

วิธีแก้: บังคับ authorization ที่ RLS/server ทุก mutation, เพิ่ม per-user/IP rate limit, audit log และ idempotency key

### F-10 — Low — CORS `startsWith`

หลักฐาน baseline: `api/file.js` และ `api/admin-auth.js` ตรวจ origin ด้วย `startsWith`; หลัง deploy OPTIONS จาก evil.example และ prefix-confusion origin ไม่ถูกสะท้อน และคืน official origin แทน

วิธีแก้: ใช้ exact `allowedOrigins.includes(origin)`, normalize origin และทดสอบ prefix-confusion domain

## Controls ที่ยืนยันได้ แต่ไม่ใช่การปิดช่องโหว่ทั้งหมด

- Build ผ่าน
- Security response headers หลักทำงานบน production
- Admin API fail-closed เมื่อ server env ไม่ครบ (503); ยังไม่มีหลักฐานว่า Admin login production ใช้งานได้หลังตั้งค่า env
- CORS preflight ไม่สะท้อน origin ภายนอกกลับไปเป็น allow-origin
- File endpoint ที่ไม่มี id ตอบ 400
- `security.txt` และ `robots.txt` ให้บริการจริง
- Burp listener `127.0.0.1:8080` รับ safe GET/OPTIONS 11 requests; ภาพ passive crawl เพิ่มเติมแสดง 50 site-map items และ 13 responses processed; ไม่มี active scan/credential test

## สถานะเครื่องมือและการติดตั้ง

| เครื่องมือ | สถานะ | หมายเหตุ |
|---|---|---|
| Burp Suite Community | ติดตั้งแล้วและใช้ผ่าน proxy | PortSwigger package 2026.3.3; listener `127.0.0.1:8080` รับ safe GET/OPTIONS 11 requests และ passive crawl UI แสดง 50 site-map items / 13 responses processed; ยังไม่ได้ทำ active scan หรือ credential test |
| Claude Desktop | มีอยู่แล้ว | เพิ่ม `jre2027-filesystem` MCP server แบบจำกัด path โปรเจกต์ใน `%APPDATA%\\Claude\\claude_desktop_config.json`; restart Claude เพื่อโหลด config |
| MCP | พร้อมใช้งาน | รอบ audit นี้ใช้ MCP tools/local file inspection; ไม่ส่ง `.env` ให้โมเดลโดยอัตโนมัติ |
| Kali Linux | ยังไม่พร้อม | WSL ยังไม่ติดตั้ง; Windows แจ้งว่าต้องใช้ Administrator (`0x80073d28`) |
| DVWA | ยังไม่ติดตั้ง | ควรติดตั้งใน lab/container แยก และใช้เป็น baseline เท่านั้น ห้ามผูกเข้ากับ production |

## ขั้นตอนติดตั้ง lab ที่เหลืออย่างปลอดภัย

1. เปิด PowerShell แบบ Administrator โดยผู้ดูแลเครื่องเป็นผู้ดำเนินการ
2. ติดตั้ง WSL แล้วรีสตาร์ตตามที่ Windows ขอ จากนั้นติดตั้ง Kali Linux และสร้าง Linux user แยกสำหรับ lab
3. ติดตั้ง Docker Desktop หรือ runtime ที่ผู้สอนอนุมัติ แล้วรัน DVWA ใน network แยก เช่น localhost เท่านั้น
4. ตั้ง Burp proxy ให้ชี้เฉพาะ `127.0.0.1`/lab และติดตั้ง CA certificate เฉพาะ profile ทดสอบ
5. ทดสอบ payload กับ DVWA ก่อน แล้วค่อยทำ non-destructive verification กับ staging JRE 2027
6. เก็บ screenshot ของ request/response โดย redaction token, cookie, email, phone และ PII ก่อนแนบรายงาน

## ขั้นตอนแก้ไขฐานข้อมูลที่เพิ่มในรอบนี้

ไฟล์ `supabase_security_hardening_v2.sql` เป็น migration แบบ review-first: ลบ policy public จากชื่อที่พบใน schema/migrations, จำกัด `registrations`/`user_accounts` เป็น owner/admin และให้ `project_settings` อ่านได้เฉพาะ public-key allow-list โดยไม่ลบข้อมูลแถวใด ๆ

1. สำรองฐานข้อมูลและใช้ staging project ก่อน
2. ย้าย password login ไป Supabase Auth หรือ server-side KDF และเตรียม admin JWT claim ให้เสร็จ
3. รันไฟล์ migration ใน Supabase SQL Editor ด้วย database owner
4. ตรวจ `pg_policies` และทดสอบ anon/authenticated/admin แยกกัน
5. ตรวจว่า anon อ่าน `user_accounts`, `merchandise_orders`, `file_*` และ `registrations` ไม่ได้ จากนั้นจึงพิจารณา production

ยังไม่ได้รันไฟล์นี้กับ production อัตโนมัติ เพราะเป็นการเปลี่ยนสิทธิ์ฐานข้อมูลและอาจทำให้ auth flow แบบเดิมหยุดทำงานถ้ายังไม่ย้ายระบบ

## คำสั่งตรวจซ้ำที่ปลอดภัย

```powershell
npm run build
npm audit --json

# ใช้ env ในเครื่องโดยไม่พิมพ์ค่า key ออกหน้าจอ
$headers = @{ apikey = $env:VITE_SUPABASE_ANON_KEY; Authorization = "Bearer $env:VITE_SUPABASE_ANON_KEY" }
Invoke-WebRequest "$env:VITE_SUPABASE_URL/rest/v1/project_settings?select=key&limit=1" -Headers $headers
```

อย่าใส่ password, service-role key, session token หรือข้อมูลผู้สมัครลงใน screenshot/report

## เกณฑ์ปิดงาน (Definition of Done)

- anon อ่าน `user_accounts`, password metadata และ registrations ของผู้อื่นไม่ได้
- ไม่มี magic OTP หรือ deterministic auth fallback ใน source/bundle
- admin/auth secrets อยู่ใน server environment เท่านั้น และ rotate แล้ว
- RLS policy inventory มีหลักฐานก่อน/หลัง พร้อม test matrix anon/applicant/admin
- `npm audit --audit-level=high` ผ่านหรือมี exception ที่อนุมัติอย่างมีวันหมดอายุ
- staging regression tests ผ่าน, screenshots ถูก redact และค่อย deploy production

