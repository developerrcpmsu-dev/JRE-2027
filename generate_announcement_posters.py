import os
import subprocess
import base64

WORKSPACE = r"c:\Users\Lenovo\Desktop\JRE2027"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def b64_img(rel_path):
    full_path = os.path.join(WORKSPACE, rel_path)
    if os.path.exists(full_path):
        ext = os.path.splitext(full_path)[1].lower().replace('.', '')
        if ext == 'jpg': ext = 'jpeg'
        with open(full_path, 'rb') as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')
            return f"data:image/{ext};base64,{encoded}"
    return ""

logo_ratchaphuck = b64_img("public/images/logo/ratchaphuck_logo_transparent.png")
logo_usvn = b64_img("public/images/logo/usvn_logo.png")
logo_four = b64_img("public/images/logo/jre_four_logos_hd.png")
qr_web = b64_img("public/images/qr_rcp_website.png")

# Common styles & fonts
FONT_HEAD = """
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
"""

# -------------------------------------------------------------
# 1. SQUARE POSTER (1080 x 1080 px)
# -------------------------------------------------------------
html_square = f"""<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>ประกาศงดปฏิบัติหน้าที่ชั่วคราว - ชมรมกู้ภัยราชพฤกษ์</title>
{FONT_HEAD}
<style>
* {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}}
body {{
    width: 1080px;
    height: 1080px;
    background-color: #070d18;
    background-image: 
        radial-gradient(ellipse at 50% 0%, #1e3a8a 0%, transparent 65%),
        radial-gradient(circle at 10% 90%, rgba(220, 38, 38, 0.15) 0%, transparent 45%),
        radial-gradient(circle at 90% 90%, rgba(245, 158, 11, 0.15) 0%, transparent 45%);
    color: #ffffff;
    font-family: 'Prompt', sans-serif;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44px 50px 36px;
}}

/* Decorative grid & accents */
body::before {{
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 36px 36px;
    pointer-events: none;
}}

/* Top Warning Hazard Stripe */
.hazard-stripe {{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    background: repeating-linear-gradient(
        45deg,
        #f59e0b,
        #f59e0b 20px,
        #dc2626 20px,
        #dc2626 40px
    );
}}

/* Header */
.header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 14px 24px;
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}}
.logo-box {{
    display: flex;
    align-items: center;
    gap: 16px;
}}
.logo-box img.club-logo {{
    height: 72px;
    filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.4));
}}
.logo-box img.usvn-logo {{
    height: 64px;
    filter: drop-shadow(0 4px 10px rgba(59, 130, 246, 0.4));
}}
.header-titles {{
    flex: 1;
    text-align: center;
    padding: 0 10px;
}}
.header-titles .org-name {{
    font-family: 'Kanit', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
}}
.header-titles .org-sub {{
    font-size: 14px;
    font-weight: 400;
    color: #94a3b8;
    margin-top: 2px;
}}

/* Main Title Section */
.title-section {{
    text-align: center;
    margin-top: 10px;
}}
.notice-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: #ffffff;
    padding: 6px 22px;
    border-radius: 999px;
    font-family: 'Kanit', sans-serif;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3);
}}
.main-heading {{
    font-family: 'Kanit', sans-serif;
    font-size: 48px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.15;
    margin-top: 10px;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
}}
.main-heading span.highlight {{
    color: #f59e0b;
    text-shadow: 0 0 25px rgba(245, 158, 11, 0.6);
}}
.sub-heading {{
    font-size: 17px;
    font-weight: 400;
    color: #cbd5e1;
    margin-top: 4px;
}}

/* Date Highlights Block */
.dates-container {{
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(220, 38, 38, 0.12) 100%);
    border: 2px solid rgba(245, 158, 11, 0.45);
    border-radius: 20px;
    padding: 16px 22px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}}
.calendar-row {{
    display: flex;
    justify-content: center;
    gap: 18px;
    width: 100%;
}}
.cal-card {{
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 14px;
    padding: 10px 24px;
    text-align: center;
    flex: 1;
    max-width: 190px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
}}
.cal-card::before {{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #f59e0b;
}}
.cal-card.middle::before {{
    background: #ef4444;
}}
.cal-day-name {{
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
}}
.cal-number {{
    font-family: 'Kanit', sans-serif;
    font-size: 40px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1;
    margin: 3px 0;
}}
.cal-month {{
    font-size: 14px;
    font-weight: 600;
    color: #fbbf24;
}}
.dates-meta {{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
}}
.badge-total-days {{
    background: #ef4444;
    color: #ffffff;
    font-family: 'Kanit', sans-serif;
    font-weight: 700;
    font-size: 15px;
    padding: 4px 16px;
    border-radius: 999px;
    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4);
}}
.dates-resume {{
    font-size: 14px;
    color: #e2e8f0;
}}
.dates-resume b {{
    color: #34d399;
}}

/* Reason & Event Info Card */
.event-card {{
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 16px;
    padding: 14px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    backdrop-filter: blur(12px);
}}
.event-badge {{
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    border: 1px solid #60a5fa;
    border-radius: 12px;
    padding: 10px 16px;
    text-align: center;
    flex-shrink: 0;
}}
.event-badge .jre-title {{
    font-family: 'Kanit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.5px;
}}
.event-badge .jre-year {{
    font-size: 12px;
    color: #bfdbfe;
    font-weight: 500;
}}
.event-desc {{
    flex: 1;
}}
.event-desc .reason-title {{
    font-family: 'Kanit', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #60a5fa;
    margin-bottom: 3px;
}}
.event-desc .reason-body {{
    font-size: 13.5px;
    color: #cbd5e1;
    line-height: 1.45;
}}
.event-desc .reason-body strong {{
    color: #f1f5f9;
}}

/* Emergency Fallback Section */
.emergency-box {{
    background: rgba(220, 38, 38, 0.08);
    border: 1px dashed rgba(239, 68, 68, 0.5);
    border-radius: 16px;
    padding: 12px 20px;
}}
.emergency-header {{
    font-family: 'Kanit', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #f87171;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
}}
.emergency-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}}
.emg-item {{
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 6px 8px;
    text-align: center;
}}
.emg-num {{
    font-family: 'Kanit', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
}}
.emg-num.green {{ color: #4ade80; }}
.emg-num.red {{ color: #f87171; }}
.emg-num.yellow {{ color: #fbbf24; }}
.emg-num.blue {{ color: #60a5fa; }}
.emg-label {{
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
}}

/* Footer */
.footer {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 10px 18px;
    margin-top: 4px;
}}
.footer-left {{
    display: flex;
    align-items: center;
    gap: 14px;
}}
.footer-left img.qr {{
    width: 52px;
    height: 52px;
    background: white;
    padding: 3px;
    border-radius: 8px;
}}
.footer-links {{
    display: flex;
    flex-direction: column;
    gap: 2px;
}}
.footer-link-item {{
    font-size: 12.5px;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 6px;
}}
.footer-link-item b {{
    color: #f59e0b;
    font-family: 'Kanit', sans-serif;
}}
.footer-right img.four-logos {{
    height: 38px;
    filter: brightness(1.05);
}}
</style>
</head>
<body>
    <div class="hazard-stripe"></div>

    <!-- Header -->
    <div class="header">
        <div class="logo-box">
            <img src="{logo_ratchaphuck}" class="club-logo" alt="ชมรมกู้ภัยราชพฤกษ์">
        </div>
        <div class="header-titles">
            <div class="org-name">ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม</div>
            <div class="org-sub">สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม • RATCHAPHUCK RESCUE CLUB EMS</div>
        </div>
        <div class="logo-box">
            <img src="{logo_usvn}" class="usvn-logo" alt="USVN">
        </div>
    </div>

    <!-- Title Section -->
    <div class="title-section">
        <div class="notice-pill">
            <span>🚨</span> OFFICIAL ANNOUNCEMENT • ประกาศสำคัญ <span>🚨</span>
        </div>
        <h1 class="main-heading">
            ขอแจ้ง<span class="highlight">งดปฏิบัติหน้าที่</span>ชั่วคราว
        </h1>
        <div class="sub-heading">ระงับการออกเหตุและบริการการแพทย์ฉุกเฉินเป็นการชั่วคราว</div>
    </div>

    <!-- Date Highlights Block -->
    <div class="dates-container">
        <div class="calendar-row">
            <div class="cal-card">
                <div class="cal-day-name">วันศุกร์</div>
                <div class="cal-number">13</div>
                <div class="cal-month">พ.ย. 2569</div>
            </div>
            <div class="cal-card middle">
                <div class="cal-day-name">วันเสาร์</div>
                <div class="cal-number">14</div>
                <div class="cal-month">พ.ย. 2569</div>
            </div>
            <div class="cal-card">
                <div class="cal-day-name">วันอาทิตย์</div>
                <div class="cal-number">15</div>
                <div class="cal-month">พ.ย. 2569</div>
            </div>
        </div>
        <div class="dates-meta">
            <span class="badge-total-days">รวมระยะเวลา 3 วัน</span>
            <span class="dates-resume">เริ่ม 13 พ.ย. 69 (08:00 น.) • กลับมาเปิดให้บริการปกติ <b>วันจันทร์ที่ 16 พ.ย. 69 (08:00 น.)</b></span>
        </div>
    </div>

    <!-- Reason & Event Card -->
    <div class="event-card">
        <div class="event-badge">
            <div class="jre-title">JRE 2027</div>
            <div class="jre-year">EXERCISE</div>
        </div>
        <div class="event-desc">
            <div class="reason-title">📌 สาเหตุการงดปฏิบัติหน้าที่ : เข้าร่วมและดำเนินโครงการ</div>
            <div class="reason-body">
                <strong>กิจกรรมโครงการ Joint Response Exercise (JRE 2027)</strong> โครงการฝึกซ้อมการเผชิญเหตุและบรรเทาสาธารณภัยร่วม วันที่ 14 - 15 พ.ย. 2569 ณ อาคารพัฒนานิสิต กองกิจการนิสิต มมส เพื่อพัฒนาศักยภาพทีมกู้ชีพกู้ภัย
            </div>
        </div>
    </div>

    <!-- Emergency Contacts Card -->
    <div class="emergency-box">
        <div class="emergency-header">
            <span>☎️</span> กรณีเกิดอุบัติเหตุ เจ็บป่วยฉุกเฉิน หรือเหตุด่วนในพื้นที่ มมส สามารถติดต่อหน่วยงานฉุกเฉินได้ที่ :
        </div>
        <div class="emergency-grid">
            <div class="emg-item">
                <div class="emg-num green">1669</div>
                <div class="emg-label">การแพทย์ฉุกเฉิน 24 ชม.</div>
            </div>
            <div class="emg-item">
                <div class="emg-num red">199</div>
                <div class="emg-label">ดับเพลิง / กู้ภัยบรรเทาฯ</div>
            </div>
            <div class="emg-item">
                <div class="emg-num blue" style="font-size: 16px; margin-top: 3px;">043-021-021</div>
                <div class="emg-label">รพ.สุทธาเวช มมส</div>
            </div>
            <div class="emg-item">
                <div class="emg-num yellow">191</div>
                <div class="emg-label">เหตุด่วนเหตุร้าย ตำรวจ</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-left">
            <img src="{qr_web}" class="qr" alt="QR Code">
            <div class="footer-links">
                <div class="footer-link-item">
                    <span>🌐 เว็บไซต์ :</span> <b>rcp-msu.web.app</b>
                </div>
                <div class="footer-link-item">
                    <span>📘 เพจ Facebook :</span> <b>ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม</b>
                </div>
            </div>
        </div>
        <div class="footer-right">
            <img src="{logo_four}" class="four-logos" alt="JRE 2027 Partners">
        </div>
    </div>
</body>
</html>
"""

# -------------------------------------------------------------
# 2. PORTRAIT POSTER (1080 x 1350 px)
# -------------------------------------------------------------
html_portrait = f"""<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>ประกาศงดปฏิบัติหน้าที่ชั่วคราว (Portrait) - ชมรมกู้ภัยราชพฤกษ์</title>
{FONT_HEAD}
<style>
* {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}}
body {{
    width: 1080px;
    height: 1350px;
    background-color: #070d18;
    background-image: 
        radial-gradient(ellipse at 50% 0%, #1e3a8a 0%, transparent 60%),
        radial-gradient(circle at 15% 85%, rgba(220, 38, 38, 0.16) 0%, transparent 45%),
        radial-gradient(circle at 85% 85%, rgba(245, 158, 11, 0.16) 0%, transparent 45%);
    color: #ffffff;
    font-family: 'Prompt', sans-serif;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 56px 44px;
}}

body::before {{
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
}}

.hazard-stripe {{
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: repeating-linear-gradient(
        45deg,
        #f59e0b,
        #f59e0b 24px,
        #dc2626 24px,
        #dc2626 48px
    );
}}

/* Header */
.header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 24px;
    padding: 18px 28px;
    backdrop-filter: blur(16px);
    box-shadow: 0 10px 36px rgba(0, 0, 0, 0.4);
}}
.logo-box {{
    display: flex;
    align-items: center;
    gap: 16px;
}}
.logo-box img.club-logo {{
    height: 84px;
    filter: drop-shadow(0 4px 14px rgba(245, 158, 11, 0.45));
}}
.logo-box img.usvn-logo {{
    height: 76px;
    filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.45));
}}
.header-titles {{
    flex: 1;
    text-align: center;
    padding: 0 14px;
}}
.header-titles .org-name {{
    font-family: 'Kanit', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.5px;
}}
.header-titles .org-sub {{
    font-size: 15px;
    font-weight: 400;
    color: #94a3b8;
    margin-top: 3px;
}}

/* Main Title Section */
.title-section {{
    text-align: center;
    margin: 14px 0 6px;
}}
.notice-pill {{
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: #ffffff;
    padding: 8px 26px;
    border-radius: 999px;
    font-family: 'Kanit', sans-serif;
    font-weight: 700;
    font-size: 17px;
    letter-spacing: 2px;
    text-transform: uppercase;
    box-shadow: 0 6px 24px rgba(220, 38, 38, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.35);
}}
.main-heading {{
    font-family: 'Kanit', sans-serif;
    font-size: 56px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1.15;
    margin-top: 14px;
    text-shadow: 0 4px 28px rgba(0, 0, 0, 0.7);
}}
.main-heading span.highlight {{
    color: #f59e0b;
    text-shadow: 0 0 30px rgba(245, 158, 11, 0.65);
}}
.sub-heading {{
    font-size: 19px;
    font-weight: 400;
    color: #cbd5e1;
    margin-top: 6px;
}}

/* Date Highlights Block */
.dates-container {{
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(220, 38, 38, 0.14) 100%);
    border: 2px solid rgba(245, 158, 11, 0.5);
    border-radius: 24px;
    padding: 24px 28px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45), inset 0 0 24px rgba(245, 158, 11, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}}
.dates-title {{
    font-family: 'Kanit', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #fef08a;
    display: flex;
    align-items: center;
    gap: 8px;
}}
.calendar-row {{
    display: flex;
    justify-content: center;
    gap: 20px;
    width: 100%;
}}
.cal-card {{
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 16px;
    padding: 14px 28px;
    text-align: center;
    flex: 1;
    max-width: 230px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    position: relative;
    overflow: hidden;
}}
.cal-card::before {{
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: #f59e0b;
}}
.cal-card.middle::before {{
    background: #ef4444;
}}
.cal-day-name {{
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
}}
.cal-number {{
    font-family: 'Kanit', sans-serif;
    font-size: 52px;
    font-weight: 900;
    color: #ffffff;
    line-height: 1;
    margin: 4px 0;
}}
.cal-month {{
    font-size: 16px;
    font-weight: 600;
    color: #fbbf24;
}}
.dates-meta {{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
}}
.badge-total-days {{
    background: #ef4444;
    color: #ffffff;
    font-family: 'Kanit', sans-serif;
    font-weight: 700;
    font-size: 17px;
    padding: 6px 20px;
    border-radius: 999px;
    box-shadow: 0 3px 14px rgba(239, 68, 68, 0.45);
}}
.dates-resume {{
    font-size: 16px;
    color: #e2e8f0;
}}
.dates-resume b {{
    color: #34d399;
}}

/* Event Info Card */
.event-card {{
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(59, 130, 246, 0.35);
    border-radius: 20px;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 24px;
    backdrop-filter: blur(14px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}}
.event-badge {{
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    border: 1px solid #60a5fa;
    border-radius: 16px;
    padding: 14px 22px;
    text-align: center;
    flex-shrink: 0;
}}
.event-badge .jre-title {{
    font-family: 'Kanit', sans-serif;
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.5px;
}}
.event-badge .jre-year {{
    font-size: 13px;
    color: #bfdbfe;
    font-weight: 500;
}}
.event-desc {{
    flex: 1;
}}
.event-desc .reason-title {{
    font-family: 'Kanit', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #60a5fa;
    margin-bottom: 5px;
}}
.event-desc .reason-body {{
    font-size: 15px;
    color: #cbd5e1;
    line-height: 1.55;
}}
.event-desc .reason-body strong {{
    color: #ffffff;
}}
.event-meta-tags {{
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
}}
.meta-tag {{
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 6px;
    font-size: 12.5px;
    padding: 3px 10px;
    color: #e2e8f0;
}}

/* Emergency Contacts Section */
.emergency-box {{
    background: rgba(220, 38, 38, 0.08);
    border: 1.5px dashed rgba(239, 68, 68, 0.55);
    border-radius: 20px;
    padding: 18px 24px;
}}
.emergency-header {{
    font-family: 'Kanit', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #f87171;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}}
.emergency-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}}
.emg-item {{
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 10px 10px;
    text-align: center;
}}
.emg-num {{
    font-family: 'Kanit', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
}}
.emg-num.green {{ color: #4ade80; }}
.emg-num.red {{ color: #f87171; }}
.emg-num.yellow {{ color: #fbbf24; }}
.emg-num.blue {{ color: #60a5fa; }}
.emg-label {{
    font-size: 12px;
    color: #94a3b8;
    margin-top: 3px;
}}

/* Footer */
.footer {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 14px 24px;
}}
.footer-left {{
    display: flex;
    align-items: center;
    gap: 18px;
}}
.footer-left img.qr {{
    width: 68px;
    height: 68px;
    background: white;
    padding: 4px;
    border-radius: 10px;
}}
.footer-links {{
    display: flex;
    flex-direction: column;
    gap: 4px;
}}
.footer-link-item {{
    font-size: 14px;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 8px;
}}
.footer-link-item b {{
    color: #f59e0b;
    font-family: 'Kanit', sans-serif;
}}
.footer-right img.four-logos {{
    height: 48px;
    filter: brightness(1.05);
}}
</style>
</head>
<body>
    <div class="hazard-stripe"></div>

    <!-- Header -->
    <div class="header">
        <div class="logo-box">
            <img src="{logo_ratchaphuck}" class="club-logo" alt="ชมรมกู้ภัยราชพฤกษ์">
        </div>
        <div class="header-titles">
            <div class="org-name">ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม</div>
            <div class="org-sub">สังกัดองค์การนิสิต มหาวิทยาลัยมหาสารคาม • RATCHAPHUCK RESCUE CLUB EMS</div>
        </div>
        <div class="logo-box">
            <img src="{logo_usvn}" class="usvn-logo" alt="USVN">
        </div>
    </div>

    <!-- Title Section -->
    <div class="title-section">
        <div class="notice-pill">
            <span>🚨</span> OFFICIAL ANNOUNCEMENT • ประกาศสำคัญ <span>🚨</span>
        </div>
        <h1 class="main-heading">
            ขอแจ้ง<span class="highlight">งดปฏิบัติหน้าที่</span>ชั่วคราว
        </h1>
        <div class="sub-heading">ระงับการออกเหตุและบริการการแพทย์ฉุกเฉินเป็นการชั่วคราว</div>
    </div>

    <!-- Date Highlights Block -->
    <div class="dates-container">
        <div class="dates-title">
            <span>⏳</span> ช่วงเวลาที่งดปฏิบัติหน้าที่
        </div>
        <div class="calendar-row">
            <div class="cal-card">
                <div class="cal-day-name">วันศุกร์</div>
                <div class="cal-number">13</div>
                <div class="cal-month">พ.ย. 2569</div>
            </div>
            <div class="cal-card middle">
                <div class="cal-day-name">วันเสาร์</div>
                <div class="cal-number">14</div>
                <div class="cal-month">พ.ย. 2569</div>
            </div>
            <div class="cal-card">
                <div class="cal-day-name">วันอาทิตย์</div>
                <div class="cal-number">15</div>
                <div class="cal-month">พ.ย. 2569</div>
            </div>
        </div>
        <div class="dates-meta">
            <span class="badge-total-days">รวมระยะเวลา 3 วัน</span>
            <span class="dates-resume">เริ่ม 13 พ.ย. 69 (08:00 น.) • กลับมาเปิดให้บริการปกติ <b>วันจันทร์ที่ 16 พ.ย. 69 (08:00 น.)</b></span>
        </div>
    </div>

    <!-- Reason & Event Card -->
    <div class="event-card">
        <div class="event-badge">
            <div class="jre-title">JRE 2027</div>
            <div class="jre-year">EXERCISE</div>
        </div>
        <div class="event-desc">
            <div class="reason-title">📌 สาเหตุการงดปฏิบัติหน้าที่ : เข้าร่วมและดำเนินงานโครงการ</div>
            <div class="reason-body">
                เข้าร่วมและดำเนินงาน <strong>กิจกรรมโครงการ Joint Response Exercise (JRE 2027)</strong> โครงการฝึกซ้อมการเผชิญเหตุและบรรเทาสาธารณภัยร่วม เพื่อพัฒนาศักยภาพ ทักษะการกู้ชีพ-กู้ภัย และเตรียมความพร้อมรับมืออุบัติภัยร่วมกับเครือข่าย
            </div>
            <div class="event-meta-tags">
                <span class="meta-tag">📅 วันจัดกิจกรรม : 14 – 15 พฤศจิกายน 2569</span>
                <span class="meta-tag">📍 สถานที่ : อาคารพัฒนานิสิต กองกิจการนิสิต มมส</span>
                <span class="meta-tag">🤝 จัดโดย : ชมรมกู้ภัยราชพฤกษ์ มมส</span>
            </div>
        </div>
    </div>

    <!-- Emergency Contacts Card -->
    <div class="emergency-box">
        <div class="emergency-header">
            <span>☎️</span> กรณีเกิดอุบัติเหตุ เจ็บป่วยฉุกเฉิน หรือเหตุด่วนในพื้นที่ มมส สามารถติดต่อหน่วยงานฉุกเฉินได้ที่ :
        </div>
        <div class="emergency-grid">
            <div class="emg-item">
                <div class="emg-num green">1669</div>
                <div class="emg-label">การแพทย์ฉุกเฉิน 24 ชม.</div>
            </div>
            <div class="emg-item">
                <div class="emg-num red">199</div>
                <div class="emg-label">ดับเพลิง / กู้ภัยบรรเทาฯ</div>
            </div>
            <div class="emg-item">
                <div class="emg-num blue" style="font-size: 20px; margin-top: 2px;">043-021-021</div>
                <div class="emg-label">รพ.สุทธาเวช มมส</div>
            </div>
            <div class="emg-item">
                <div class="emg-num yellow">191</div>
                <div class="emg-label">เหตุด่วนเหตุร้าย ตำรวจ</div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="footer-left">
            <img src="{qr_web}" class="qr" alt="QR Code">
            <div class="footer-links">
                <div class="footer-link-item">
                    <span>🌐 เว็บไซต์ชมรม :</span> <b>rcp-msu.web.app</b>
                </div>
                <div class="footer-link-item">
                    <span>📘 เพจ Facebook :</span> <b>ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม</b>
                </div>
            </div>
        </div>
        <div class="footer-right">
            <img src="{logo_four}" class="four-logos" alt="JRE 2027 Partners">
        </div>
    </div>
</body>
</html>
"""

# Write HTML files
html_square_path = os.path.join(WORKSPACE, "public/images/announcement_square.html")
html_portrait_path = os.path.join(WORKSPACE, "public/images/announcement_portrait.html")

with open(html_square_path, "w", encoding="utf-8") as f:
    f.write(html_square)

with open(html_portrait_path, "w", encoding="utf-8") as f:
    f.write(html_portrait)

print("HTML files written successfully!")

# Render with Chrome
out_square_png = os.path.join(WORKSPACE, "public/images/announcement_duty_suspension_square_1080x1080.png")
out_portrait_png = os.path.join(WORKSPACE, "public/images/announcement_duty_suspension_portrait_1080x1350.png")

# Also copy into Artifact directory so artifacts can display it cleanly if needed
print("Rendering Square (1080x1080)...")
cmd_square = [
    CHROME_PATH,
    '--headless',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=3500',
    f'--screenshot={out_square_png}',
    '--window-size=1080,1080',
    html_square_path
]
subprocess.run(cmd_square, check=True)

print("Rendering Portrait (1080x1350)...")
cmd_portrait = [
    CHROME_PATH,
    '--headless',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=3500',
    f'--screenshot={out_portrait_png}',
    '--window-size=1080,1350',
    html_portrait_path
]
subprocess.run(cmd_portrait, check=True)

print("Both posters generated successfully!")
print("Square size:", os.path.getsize(out_square_png))
print("Portrait size:", os.path.getsize(out_portrait_png))
