# JRE 2027 — Security Audit Report

วันที่ตรวจ: 7–8 ตุลาคม 2569 (2026)
เป้าหมาย: [https://jre-2027.vercel.app/](https://jre-2027.vercel.app/)  
ขอบเขตซอร์ส: `C:\Users\Lenovo\Desktop\JRE2027`

## สรุปผู้บริหาร

รอบนี้เป็นการตรวจแบบ evidence-based สำหรับเว็บของเจ้าของระบบ โดยใช้ static source review, build/dependency checks, production HTTP checks และการอ่าน Supabase metadata แบบ read-only ก่อน จากนั้นเจ้าของระบบยืนยันให้รัน RLS hardening เฉพาะ Supabase staging ผ่าน SQL Editor แล้วตรวจซ้ำด้วย policy inventory และ role `anon` ไม่ได้ลองรหัสผ่านจริง ไม่ได้แก้หรือลบข้อมูล production และไม่ใช่ใบรับรอง penetration test

ผลตรวจพบ 10 ประเด็นที่ต้องแก้:

| ระดับ | จำนวน | สถานะ |
|---|---:|---|
| Critical | 3 | เปิดอยู่ |
| High | 5 | เปิดอยู่ |
| Medium | 1 | เปิดอยู่ |
| Low | 1 | เปิดอยู่ |

ข้อค้นพบที่เร่งด่วนที่สุดคือ public `user_accounts` payload ที่มี `password_hash`/`salt`, RLS policies แบบ `USING (true)`, magic OTP ใน production baseline (`123456`/`999999`) และการโหลด `registrations` ทั้งตารางจาก client ก่อนแยกสิทธิ์ Admin

หลังเก็บหลักฐาน มีการทำแพตช์ใน working tree สำหรับ magic OTP, admin-auth fallback, CORS, scoped registration query และการ redacted credential ใน UI/export แล้ว รวมทั้งเพิ่ม `supabase_security_hardening_v2.sql` สำหรับ review และ `supabase_security_hardening_staging.sql` ที่ตรงกับ schema staging จริง เมื่อวันที่ 8 ตุลาคม 2569 เจ้าของระบบยืนยันให้รันไฟล์ staging-specific และตรวจ policy/anon visibility หลังรันสำเร็จแล้ว แต่ยังไม่ได้รันกับ production จึงคงสถานะ findings เป็น “เปิดอยู่” สำหรับ production

ดังนั้นไม่ควรอ้างว่าแก้ครบทุกประเด็นหรือไม่มีความเสี่ยงเหลือ: production RLS ยังไม่ได้เปลี่ยน, password verification เดิมยังต้องย้ายไป Supabase Auth/server-side KDF, Admin env ยังไม่ครบ และ dependency audit ยังมีรายการเปิดอยู่

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

หลังติดตั้ง lab เพิ่มเติมแล้ว สถานะที่ยืนยันได้คือ WSL2/Kali ทำงาน, Docker Engine ทำงาน และ DVWA เปิดได้ที่ `http://127.0.0.1:8081/login.php` เท่านั้น โดยไม่ผูกกับ production

ภาพ Burp ที่ผู้ใช้แนบมาเป็น snapshot ก่อนส่ง traffic ซึ่งแสดง passive crawl ว่า `0 items`; จึงเก็บเป็น `public/images/security/burp-passive-crawl-before.png` พร้อมคำอธิบายว่าเป็น “ก่อนตรวจ” ไม่ใช่ผลสแกนที่ยืนยันช่องโหว่

ภาพ Burp เพิ่มเติมจากรอบเดียวกัน:

- `public/images/security/burp-http-redirect.png`: request HTTP `GET /security` ได้ `308` และ `Location: https://jre-2027.vercel.app/security` — เป็นการบังคับ HTTPS ที่คาดหวัง ไม่ใช่ช่องโหว่
- `public/images/security/burp-site-map-https.png`: HTTPS `GET /` ได้ `200` และมี security headers หลายรายการ; ภาพนี้เห็น `Access-Control-Allow-Origin: *` บน HTML document แต่ยังไม่ใช่หลักฐานว่า API ที่มีข้อมูลหรือ credential เปิด wildcard CORS จึงต้องแยกตรวจ API ตาม origin และ credential
- `public/images/security/burp-passive-crawl-after.png`: passive crawl หลังเปิด traffic แสดง `50 site-map items`, `13 responses processed` และ `0 responses queued`; ตัวเลขนี้เป็นจำนวนรายการ/response ที่ Burp ประมวลผล ไม่ใช่จำนวนช่องโหว่
- `public/images/security/burp-site-map-dvwa-local.png`: ภาพ session ล่าสุดที่ Burp เห็นทั้ง DVWA lab ที่ `127.0.0.1:8081/login.php` และ production tree; ยืนยันการแยก local lab ออกจาก production ไม่ใช่หลักฐานว่า production มีช่องโหว่ของ DVWA
- `public/images/security/burp-production-root-headers-live.png`: ภาพ session ล่าสุดของ production `GET /` ได้ `200` พร้อม HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` และ headers อื่น ๆ; `Access-Control-Allow-Origin: *` ในภาพอยู่บน HTML document จึงต้องไม่สรุปเป็น API data exposure โดยลำพัง

ภาพหลักฐานรอบล่าสุด:

![Burp site map แสดง DVWA local และ production](/images/security/burp-site-map-dvwa-local.png)

![Burp production root response headers](/images/security/burp-production-root-headers-live.png)

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

## รอบตรวจซ้ำล่าสุด: Burp Suite + MCP + Kali Linux (8 ตุลาคม 2569)

รอบนี้ตรวจ production URL แบบ read-only โดยให้ Kali Linux ทำ HTTP/header/method checks, ใช้ Burp Suite Community เป็น local proxy (`127.0.0.1:8080`) และใช้ MCP เปิดตรวจหน้า `/security` กับ `/presentation` ในเบราว์เซอร์จริงเพื่อยืนยันว่าหน้ารายงาน/หน้าพรีเซนต์โหลดได้ จากนั้นจึงทดสอบ mutation แบบจำกัดขอบเขตกับ canary สังเคราะห์ใน Supabase staging เท่านั้น ไม่ส่ง credential จริง ไม่ทำ active scan และไม่แก้ข้อมูล production

| ระบบ | การใช้งานจริง | ผลที่ยืนยันได้ |
|---|---|---|
| Kali Linux/WSL2 | `curl` ตรวจ production, headers, redirect, API methods และ CORS preflight | Kali Rolling, user `best`, Docker 28.5.2/Compose 2.40.3 และ DVWA `Up` ที่ `127.0.0.1:8081` |
| Burp Suite Community | Burp Browser ส่ง safe GET ผ่าน listener `127.0.0.1:8080` ไปยังหน้าเว็บ, report, API และ security files | Burp Suite Community v2026.9.1 ทำงาน; HTTP `/security` และ `/presentation` ได้ 308 ไป HTTPS; HTTPS ผ่าน Burp Browser ได้ผลหน้าเว็บ/API ตามที่รายงาน |
| MCP | เปิด `/security` และ `/presentation` แล้วอ่าน accessibility tree/ข้อความที่แสดงจริง | หน้า Security แสดง 10 findings และหน้า Presentation แสดงสไลด์ 1/11 พร้อมลิงก์รายงาน Markdown |

ผล production ที่สรุปได้จาก Kali และ Burp:

- `/`, `/security`, `/presentation` และ `SECURITY_AUDIT_REPORT.md` ตอบ `200`; HTTP URL ตอบ `308` พร้อม `Location: https://jre-2027.vercel.app/...`
- หน้าเว็บมี `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` และ `Permissions-Policy`
- `GET /api/admin-auth` และ `POST {}` ตอบ `503` พร้อมข้อความระบบยังไม่พร้อมใช้งาน — เป็น fail-closed แต่ยืนยันว่า `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` ยังไม่ครบ/ยังไม่พร้อมบน Vercel
- `OPTIONS /api/admin-auth` และ `OPTIONS /api/file` จาก origin ภายนอกไม่ถูกสะท้อนกลับ; response คืน official origin `https://jre-2027.vercel.app`
- `GET /api/file` ที่ไม่มี `id` ตอบ `400 Missing file id` และไม่ทำการอ่าน/เขียนไฟล์
- `/.env` และ `/.git/HEAD` ตอบ `200` แต่ `Content-Disposition: inline; filename="index.html"`, `Content-Type: text/html` และ body hash ตรงกับ `/`; จึงเป็น SPA fallback ไม่ใช่การเปิดเผย `.env` หรือ `.git/HEAD` จริง
- Burp Browser สามารถโหลด HTTPS ผ่าน proxy และพบ API response แบบเดียวกับ Kali; ภาพ Burp `0 items` ที่แนบคือหลักฐาน “ก่อนส่ง traffic” ส่วนภาพ passive crawl หลัง traffic ในรายงานเป็นหลักฐานชุดก่อนหน้าที่แสดง `50 site-map items / 13 responses processed`

ข้อจำกัดของรอบนี้: ไม่ล็อกอิน Admin, ไม่ส่ง OTP/credential, ไม่ทำ active scan/Intruder และไม่แก้ข้อมูล production ดังนั้น 10 findings เดิมยังเป็นรายการที่ต้องแก้/ยืนยันต่อ ไม่ใช่ผลรับรองว่าเว็บปลอดภัยทั้งหมด

- `registrations`: ณ เวลาตรวจพบ 0 แถว จึงยังไม่พบ PII ของผู้สมัครจาก endpoint ในช่วงเวลานั้น แต่ source/query และ policy ยังมีความเสี่ยงเมื่อมีข้อมูลจริง
- `project_settings`: พบ 9 records ที่อ่านได้ด้วย anon key
- `project_settings` key `user_accounts`: พบ 1 record ภายในมี 4 account objects และ field names ได้แก่ `password_hash` และ `salt` (ค่าจริงถูก redacted); working-tree patch ไม่ส่ง field เหล่านี้ไปยัง profile/admin list/export แต่ public REST exposure จะปิดได้เมื่อรัน RLS migration และย้าย auth แล้วเท่านั้น
- `announcements`: พบ 7 records ที่อ่านได้ด้วย anon key
- baseline ก่อนแพตช์ `GET /api/admin-auth`: 405 และ `POST {}`: 400; หลัง deploy แพตช์ใหม่ `GET`/`POST {}` ตอบ 503 เพราะยังไม่ยืนยันว่า `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` ถูกตั้งครบใน Vercel — เป็น fail-closed แต่ Admin login ยังใช้ไม่ได้จนกว่าจะตั้งค่า
- preflight จาก origin ภายนอกไม่ถูกสะท้อนกลับเป็น origin ของผู้โจมตี

### ผลการรัน staging RLS hardening (ยืนยันแล้ว 8 ตุลาคม 2569)

- เป้าหมาย: Supabase project `developer... Project` / ref `cksilfcjireystyludav` (staging, `main`) เท่านั้น ไม่ใช่ `JRE-2027` production
- ไฟล์ที่ใช้: `supabase_security_hardening_staging.sql`; migration เปลี่ยน policy และเปิด RLS เท่านั้น ไม่ลบแถวข้อมูล
- ก่อนรันพบ policy แบบ `{public}` และ `USING (true)` ใน `registrations`, `project_settings` และ `announcements`; staging ไม่มีตาราง `user_accounts` หรือ `merchandise_orders` จึงไม่ใช้ migration v2 ที่อ้างถึงตารางเหล่านั้นตรง ๆ
- SQL Editor แสดงผล `Success. No rows returned` หลังยืนยัน dialog destructive-operation ของ Supabase
- หลังรันพบ policy ใหม่ 8 รายการ: registrations 4 (owner/email/admin สำหรับ select/insert/update/delete), project_settings 2 (public read allow-list + admin write) และ announcements 2 (public read + admin write)
- ทดสอบใน transaction ด้วย `SET LOCAL ROLE anon`: `registrations` เห็น 0 แถว, `project_settings` เห็นเฉพาะ key `forms_config`, และ `announcements` เห็น 0 แถวในฐานข้อมูลที่ยังว่าง
- ผลนี้เป็นหลักฐานของ staging เท่านั้น ไม่ใช่การปิด F-01/F-02/F-03 บน production และยังต้องทำ authenticated owner/admin regression test ก่อนพิจารณา deploy production

## Controlled Burp mutation test — staging canary

การทดสอบนี้ทำเพื่อพิสูจน์ว่าการแก้ยอดเงิน/ข้อมูลผู้สมัครที่พยายามส่งผ่าน Burp ไม่สามารถทำให้ข้อมูล staging เปลี่ยนได้ โดยใช้ UUID และอีเมลสังเคราะห์เท่านั้น และลบ canary ออกหลังทดสอบจนตรวจยืนยันเหลือ `0 rows` แล้ว ทั้ง production database และข้อมูลผู้สมัครจริงไม่ได้ถูกเขียน

| ขั้นตอน | หลักฐานผลลัพธ์ |
|---|---|
| Baseline ก่อนทดสอบ | พบว่า UI guard เป็น client-side และ client เขียน Supabase โดยตรง จึงต้องให้ RLS/trigger เป็นด่านบังคับจริง |
| Burp GET ใน staging | `GET /registrations?...canary...` ผ่าน `127.0.0.1:8080` ได้ `200 []` สำหรับ anon เพราะ RLS ไม่เปิดเผยแถว |
| Burp PATCH จำลอง | ส่ง `group_assigned=BURP-HACK`, `room_assigned=BURP-HACK`, `status=cancelled` ได้ `200 []` แต่ไม่มีแถวที่ anon อ่าน/แก้ไขได้ |
| ตรวจด้วย database owner | ค่า canary ยังเป็น `status=confirmed`, `group_assigned=''`, `room_assigned=''` — ไม่เกิดการแก้ไข |
| Trigger regression | transaction ที่ส่งค่า `HACK-*` ถูก sanitize เป็นค่าว่าง/`confirmed` แล้ว `ROLLBACK` ไม่ทิ้งข้อมูล |
| Cleanup | ลบ canary สังเคราะห์สำเร็จ และ query ยืนยัน `remaining_canary_rows = 0` |

![Burp before/traffic baseline](/images/security/burp-site-map-dvwa-local.png)

![Burp after hardening evidence summary](/images/security/burp-canary-after-staging.svg)

ภาพแรกเป็น screenshot จาก Burp จริงที่แนบไว้ ส่วนภาพที่สองเป็นภาพสรุปหลักฐาน after ที่สร้างจาก response และ database re-check ที่บันทึกไว้ ไม่ใช่ภาพหน้าต่าง Burp โดยตรง จึงไม่ควรนำไปอ้างว่าเป็น native Burp screenshot

### สิ่งที่แก้และสิ่งที่ยังต้องทำ

1. เพิ่ม `supabase_financial_integrity_staging.sql` และรันเฉพาะฐานข้อมูล staging เพื่อให้ trigger ป้องกันฟิลด์สถานะ/การเงินที่มีอยู่ใน schema นั้น
2. ปรับ `src/supabase.js` ให้เขียน local cache หลัง Supabase ตอบรับเท่านั้น; หาก RLS/trigger ปฏิเสธหรือคืนศูนย์แถว UI จะได้รับ error ไม่แสดงผลสำเร็จปลอม
3. staging ไม่มีคอลัมน์ payment บางรายการ จึงไม่ใช้ผล `400` จาก payment-field probe เป็นข้อสรุปเรื่อง authorization; ฟิลด์การเงินจริงบน production ยังต้องย้ายไป server-side/Auth และทำ migration ที่ตรวจ schema ก่อน
4. production ยังไม่ได้รัน RLS/auth migration และยังมีความเสี่ยง public `user_accounts`: read-only anon probe ปัจจุบันตอบ `200` พบ 4 account objects และ field names รวม `password_hash`/`salt` (ค่าจริงไม่แสดงในรายงาน) ต้องแก้ก่อนอ้างว่าปลอดภัย

### หลักฐานจากภาพ Burp ที่แนบเพิ่ม

- HTTP `/security` → `308` → HTTPS: เป็น secure redirect ที่คาดหวัง
- HTTPS `/` → `200`: ยืนยันว่า production ตอบกลับและส่ง headers บางรายการจริง; `Access-Control-Allow-Origin: *` บนเอกสาร HTML ไม่ควรถูกสรุปเป็น API data exposure โดยลำพัง
- Passive crawl หลังส่ง traffic: `50 site-map items` และ `13 responses processed`; ไม่มี active scan หรือ credential test ในหลักฐานชุดนี้
- Burp site map รอบล่าสุด: เห็น `127.0.0.1:8081/login.php` ของ DVWA และ `jre-2027.vercel.app` ใน project เดียวกัน; ผลนี้ใช้ยืนยัน workflow/proxy เท่านั้น ไม่ได้นำ traffic ของ DVWA ไปปนกับผล production
- Burp production response รอบล่าสุด: `GET /` ได้ `HTTP/2 200 OK`, `Strict-Transport-Security`, `X-Frame-Options: DENY` และ `X-Content-Type-Options: nosniff`

## Findings และแนวทางแก้

รายละเอียดเดียวกับหน้า `/security` ซึ่งมี filter และขั้นตอนทดสอบ:

### F-01 — Critical — public user_accounts พร้อม password_hash/salt

หลักฐาน: `project_settings?key=user_accounts` ตอบ HTTP 200 และคืน 4 account records พร้อม field `password_hash`, `salt` โดยไม่แสดงค่าจริงในรายงาน

ผลกระทบ: offline password guessing และการเปิดเผยข้อมูลบัญชี

วิธีแก้: working tree redacts hash/salt/OTP จาก client views และ export แล้ว; staging RLS ถูก harden และ anon test ไม่เห็น `user_accounts` เพราะตารางนี้ไม่มีใน staging แต่ production ยังต้องย้ายไป Supabase Auth/server KDF, แยก public/private settings, rotate credentials และตรวจ production endpoint ว่าไม่อ่าน key นี้ได้อีก

### F-02 — Critical — RLS policy แบบ public

หลักฐานเดิม: `supabase_schema.sql`, `migration_v4.sql`, `migration_v5_merchandise.sql` มี `USING (true)`/public full access ขณะที่ hardening script เดิมลบชื่อ policy ไม่ครบ; staging inventory ก่อนรันยืนยัน policy `{public}` 5 รายการ และหลังรันเหลือ policy hardening 8 รายการตาม allow-list

วิธีแก้: ใช้ `supabase_security_hardening_staging.sql` บน staging, inventory `pg_policies`, drop ทุก public policy ที่ไม่จำเป็น, สร้าง owner/admin allow-list, ห้าม `WITH CHECK (true)` กับข้อมูลส่วนบุคคล และทดสอบ anon/applicant/admin แยกกัน; production ยังไม่ถูกรัน

### F-03 — High — โหลด registrations ทั้งตารางจาก client

หลักฐาน baseline: `src/App.jsx` เรียก `DataService.getRegistrations()` ตอนเริ่มระบบ และ `src/supabase.js` ใช้ unscoped `.select('*')`; working tree เปลี่ยนเป็น `admin` หรือ `user_id/email` scoped query แล้ว และ staging RLS ทดสอบด้วย role `anon` เห็น 0 แถว แต่ production/authenticated owner-admin regression ยังต้องยืนยัน

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
- Staging RLS hardening: migration สำเร็จ, policy inventory ได้ 8 policies และ role `anon` เห็น registrations 0 แถว / project_settings เฉพาะ `forms_config` / announcements 0 แถว; production ยังไม่เปลี่ยน
- CORS preflight ไม่สะท้อน origin ภายนอกกลับไปเป็น allow-origin
- File endpoint ที่ไม่มี id ตอบ 400
- `security.txt` และ `robots.txt` ให้บริการจริง
- Burp listener `127.0.0.1:8080` รับ safe GET/OPTIONS 11 requests; ภาพ passive crawl เพิ่มเติมแสดง 50 site-map items และ 13 responses processed; ไม่มี active scan/credential test

## สถานะเครื่องมือและการติดตั้ง

| เครื่องมือ | สถานะ | หมายเหตุ |
|---|---|---|
| Burp Suite Community | ติดตั้งแล้วและใช้ผ่าน proxy | PortSwigger package 2026.9.1; listener `127.0.0.1:8080` รับ safe traffic จาก Burp Browser และ HTTP redirect checks; ภาพ passive crawl ชุดก่อนหน้าแสดง 50 site-map items / 13 responses processed; ยังไม่ได้ทำ active scan หรือ credential test |
| Claude Desktop | มีอยู่แล้ว | เพิ่ม `jre2027-filesystem` MCP server แบบจำกัด path โปรเจกต์ใน `%APPDATA%\\Claude\\claude_desktop_config.json`; restart Claude เพื่อโหลด config |
| MCP | พร้อมใช้งาน | รอบ audit นี้ใช้ MCP tools/local file inspection; ไม่ส่ง `.env` ให้โมเดลโดยอัตโนมัติ |
| Kali Linux | ติดตั้งและใช้งานได้ | WSL2 distribution `kali-linux` อยู่สถานะ Running; Linux user สร้างแล้ว; systemd มี warning เรื่อง user session แต่ shell ใช้งานได้ |
| Docker Engine | ติดตั้งและใช้งานได้ | Docker Engine/CLI/Compose `28.5.2` ทำงานภายใน Kali และเพิ่ม user เข้า `docker` group |
| DVWA | ติดตั้งและรันแล้ว | image `vulnerables/web-dvwa:latest`, container `dvwa`, HTTP `127.0.0.1:8081 -> 80`; ตรวจได้ `302` ไป `login.php` และทดสอบฟอร์มบัญชี lab ไปถึง `index.php`; ไม่เปิดรับจาก network ภายนอก |

## ขั้นตอนติดตั้งและใช้งาน lab อย่างปลอดภัย

1. เปิด PowerShell แบบ Administrator และติดตั้ง WSL2/Kali; สร้าง Linux user แยกสำหรับ lab โดยไม่ส่ง password ออกนอกเครื่อง
2. ติดตั้ง Docker Engine/Compose ใน Kali และตรวจ `docker version` ให้ client/server ทำงาน
3. รัน DVWA ด้วย `-p 127.0.0.1:8081:80` เพื่อจำกัดการเข้าถึงไว้ที่เครื่องนี้
4. เปิด [DVWA local login](http://127.0.0.1:8081/login.php) แล้วใช้เฉพาะบัญชีทดสอบของ DVWA; ห้ามใช้ password จริงของระบบ JRE
5. ตั้ง Burp proxy ให้ชี้เฉพาะ `127.0.0.1`/lab และติดตั้ง CA certificate เฉพาะ profile ทดสอบ
6. ทดสอบ payload กับ DVWA ก่อน แล้วค่อยทำ non-destructive verification กับ staging JRE 2027
7. เก็บ screenshot ของ request/response โดย redaction token, cookie, email, phone และ PII ก่อนแนบรายงาน

### การแก้ปัญหาที่พบระหว่างติดตั้ง lab

- ถ้าเห็น `permission denied ... /var/run/docker.sock` ใน shell เดิม ให้ปิดแล้วเปิด Kali ใหม่ หรือรัน `newgrp docker` จากนั้นตรวจด้วย `id` ว่ามีกลุ่ม `docker` และรัน `docker ps` จาก prompt Linux (`best@...$`)
- ถ้าอยู่ที่ PowerShell (`PS C:\...>`), Docker ของ lab อยู่ใน Kali จึงต้องใช้ `wsl.exe --distribution kali-linux --exec docker ps`; การพิมพ์ `docker ps` ตรง ๆ ใน PowerShell จะขึ้นว่าไม่รู้จักคำสั่ง
- ถ้า DVWA ขึ้น `ERR_EMPTY_RESPONSE` หลัง WSL ถูก terminate/restart ให้ตรวจ `docker ps`; ถ้า container ยัง `Up` แต่ Apache ไม่ตอบ ให้ล้าง stale PID แล้วเริ่ม Apache ใหม่ด้วย `docker exec dvwa sh -lc "rm -f /var/run/apache2/apache2.pid; service apache2 start"`
- บัญชี Kali กับบัญชี DVWA เป็นคนละระบบ การล็อกอิน DVWA ต้องใช้บัญชีทดสอบของ DVWA เท่านั้น และไม่ควรใช้ password ของ Kali/JRE ซ้ำใน lab

## ขั้นตอนแก้ไขฐานข้อมูลที่เพิ่มในรอบนี้

มี migration สองไฟล์เพื่อแยกความเสี่ยง:

- `supabase_security_hardening_v2.sql` เป็นฉบับ review-first สำหรับ schema ที่มี `user_accounts`/`merchandise_orders`; ยังไม่ถูกรันกับ production
- `supabase_security_hardening_staging.sql` เป็นฉบับ staging-specific ที่ตรงกับตารางที่มีอยู่จริง (`registrations`, `project_settings`, `announcements`) และถูกรันสำเร็จบน staging หลังเจ้าของระบบยืนยัน

ขั้นตอนที่ทำจริงบน staging:

1. สำรวจตารางและ `pg_policies` ก่อนรัน เพื่อไม่อ้างถึงตารางที่ไม่มีอยู่
2. ตรวจพบ policy `{public}`/`USING (true)` ในตารางเป้าหมาย และเก็บ baseline row counts
3. รัน migration ใน Supabase SQL Editor ด้วย role database owner หลังยืนยัน dialog ของ Supabase
4. ตรวจ `pg_policies` หลังรัน ได้ policy ใหม่ 8 รายการตาม allow-list
5. ใช้ transaction + `SET LOCAL ROLE anon` ตรวจ visibility: registrations 0, project_settings เฉพาะ `forms_config`, announcements 0
6. ขั้นตอนถัดไปคือ authenticated owner/admin regression test และย้าย password login ไป Supabase Auth/server-side KDF ก่อนพิจารณา production

ยังไม่ได้รันไฟล์ใดกับ production เพราะเป็นการเปลี่ยนสิทธิ์ฐานข้อมูลและอาจทำให้ auth flow แบบเดิมหยุดทำงานถ้ายังไม่ย้ายระบบ

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
