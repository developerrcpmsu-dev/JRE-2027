import cv2
import numpy as np
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

print("Loading images...")
up = cv2.imread('C:/Users/Lenovo/.gemini/antigravity/brain/ab7e3245-660e-4b26-82ac-761ab86858c5/.user_uploaded/media_1791461520101.jpg')
st = cv2.imread('msu_district_ultra_wide.jpg')

# 1. SIFT Matching
print("Computing SIFT homography...")
sift = cv2.SIFT_create(5000)
kp1, des1 = sift.detectAndCompute(up, None)
kp2, des2 = sift.detectAndCompute(st, None)
bf = cv2.BFMatcher()
matches = bf.knnMatch(des1, des2, k=2)
good = [m for m, n in matches if m.distance < 0.72 * n.distance]

src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

# 2. Warp Exact User View (4096 x 1716)
scale_4x = 4.0
w_4x = int(up.shape[1] * scale_4x)
h_4x = int(up.shape[0] * scale_4x)
S_4x = np.array([[scale_4x, 0, 0], [0, scale_4x, 0], [0, 0, 1]], dtype=np.float32)
H_4x = H @ np.linalg.inv(S_4x)
inv_H_4x = np.linalg.inv(H_4x)
warped_exact = cv2.warpPerspective(st, inv_H_4x, (w_4x, h_4x), flags=cv2.INTER_CUBIC)
cv2.imwrite('public/msu_exact_district_view.jpg', warped_exact, [cv2.IMWRITE_JPEG_QUALITY, 95])
print("Saved public/msu_exact_district_view.jpg!")

# 3. Full-Bleed 75 x 45 cm (5:3 aspect ratio)
# Width covers exact user horizontal span (0 to 1024)
# Height extends vertically to 614.4 (ratio 1024 / 614.4 = 5:3)
# Centered around user y = 214.5
# We define 4 corner points in destination (W_out, H_out) mapping to 4 points in st!

def render_75x45_fullbleed(dpi=300):
    scale_dpi = dpi / 300.0
    W_out = int(8858 * scale_dpi)
    H_out = int(5315 * scale_dpi)
    
    # Destination corners (0,0), (W,0), (W,H), (0,H)
    dst_corners = np.float32([
        [0, 0],
        [W_out, 0],
        [W_out, H_out],
        [0, H_out]
    ])
    
    # Corresponding points in user space:
    # x: 0 to 1024
    # y: 214.5 - 307.2 = -92.7 to 214.5 + 307.2 = 521.7
    u_corners = np.float32([
        [0, -92.7],
        [1024, -92.7],
        [1024, 521.7],
        [0, 521.7]
    ]).reshape(-1, 1, 2)
    
    # Map u_corners to st space using H
    st_corners = cv2.perspectiveTransform(u_corners, H).reshape(-1, 2)
    
    # Perspective transform from st to dst
    M_st_to_dst = cv2.getPerspectiveTransform(st_corners, dst_corners)
    
    # Warp st to dst
    warped = cv2.warpPerspective(st, M_st_to_dst, (W_out, H_out), flags=cv2.INTER_CUBIC)
    return warped

print("Rendering 150 DPI Full-Bleed (4429 x 2657)...")
fb_150 = render_75x45_fullbleed(dpi=150)
cv2.imwrite('public/msu_satellite_full_district_75x45cm_150dpi.jpg', fb_150, [cv2.IMWRITE_JPEG_QUALITY, 93])
print("Saved public/msu_satellite_full_district_75x45cm_150dpi.jpg!")

print("Rendering 300 DPI Full-Bleed (8858 x 5315)...")
fb_300 = render_75x45_fullbleed(dpi=300)
cv2.imwrite('public/msu_satellite_full_district_75x45cm_300dpi.jpg', fb_300, [cv2.IMWRITE_JPEG_QUALITY, 94])
print("Saved public/msu_satellite_full_district_75x45cm_300dpi.jpg!")

# 4. Poster Atlas Edition (with Title, Scale Bar, Landmarks, Ruler Ticks)
def create_annotated_poster(base_cv2_img, dpi=300):
    scale = dpi / 300.0
    W = int(8858 * scale)
    H = int(5315 * scale)
    
    # Convert cv2 BGR to PIL RGB
    pil_img = Image.fromarray(cv2.cvtColor(base_cv2_img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img, "RGBA")
    
    def get_font(name, sz):
        s = max(10, int(sz * scale))
        for p in [f"C:/Windows/Fonts/{name}.ttf", "C:/Windows/Fonts/LeelaUIb.ttf", "C:/Windows/Fonts/tahomabd.ttf", "C:/Windows/Fonts/arialbd.ttf"]:
            if os.path.exists(p):
                try: return ImageFont.truetype(p, s)
                except: pass
        return ImageFont.load_default()
        
    f_title = get_font("LeelaUIb", 76)
    f_sub_en = get_font("arialbd", 38)
    f_sub_th = get_font("LeelaUIb", 32)
    f_pin = get_font("LeelaUIb", 25)
    f_pin_en = get_font("arialbd", 20)
    f_meta = get_font("LeelawUI", 24)
    f_meta_b = get_font("LeelaUIb", 25)
    f_scale = get_font("arialbd", 22)
    f_tick = get_font("arial", 22)
    f_footer = get_font("LeelawUI", 22)
    
    # Header HUD Banner
    header_h = int(480 * scale)
    draw.rectangle([0, 0, W, header_h], fill=(10, 15, 30, 215))
    draw.rectangle([0, 0, W, int(16 * scale)], fill=(212, 175, 55, 255))
    draw.line([0, header_h, W, header_h], fill=(212, 175, 55, 180), width=int(3 * scale))
    
    # Outer Border with 75cm x 45cm ruler ticks
    margin = int(45 * scale)
    draw.rectangle([margin, margin, W - margin, H - margin], outline=(255, 255, 255, 160), width=int(2 * scale))
    
    for i in range(16):
        cm = i * 5
        x_pos = int(margin + (W - 2 * margin) * (i / 15.0))
        draw.line([x_pos, margin - int(10 * scale), x_pos, margin + int(10 * scale)], fill=(255, 255, 255, 220), width=int(2 * scale))
        draw.line([x_pos, H - margin - int(10 * scale), x_pos, H - margin + int(10 * scale)], fill=(255, 255, 255, 220), width=int(2 * scale))
        draw.text((x_pos - int(16 * scale), margin - int(34 * scale)), f"{cm}cm", fill=(255, 255, 255, 230), font=f_tick)

    # Header Titles
    pad_left = int(90 * scale)
    draw.text((pad_left, int(45 * scale)), "แผนที่ภาพถ่ายทางอากาศ มหาวิทยาลัยมหาสารคาม (ขามเรียง - ท่าขอนยาง)", fill=(255, 255, 255, 255), font=f_title)
    draw.text((pad_left, int(155 * scale)), "MAHASARAKHAM UNIVERSITY • REGIONAL AERIAL ORTHOPHOTO ATLAS", fill=(212, 175, 55, 255), font=f_sub_en)
    draw.text((pad_left, int(225 * scale)), "ครอบคลุมเขตพื้นที่มหาวิทยาลัย ชุมชนโดยรอบ และแนวลุ่มน้ำชี (ขนาด 75.0 cm × 45.0 cm)", fill=(203, 213, 225, 255), font=f_sub_th)

    # Header Badges
    badge_x = int(5400 * scale)
    badges = [
        ("ขนาดพิมพ์จริง (Size):", "75.0 cm × 45.0 cm (Ratio 5:3)"),
        ("ความละเอียด (DPI):", f"{dpi} DPI Ultra HD ({W} × {H} px)"),
        ("พิกัดกึ่งกลาง (GPS):", "16°14'58.2\"N, 103°15'03.6\"E (WGS84)"),
        ("ข้อมูลภาพ (Source):", "High-Resolution Satellite Orthophoto")
    ]
    for idx, (label, val) in enumerate(badges):
        bx = badge_x + (idx % 2) * int(1650 * scale)
        by = int(60 * scale) + (idx // 2) * int(100 * scale)
        draw.rounded_rectangle([bx, by, bx + int(1580 * scale), by + int(85 * scale)], radius=int(12 * scale), fill=(15, 23, 42, 230), outline=(212, 175, 55, 180), width=int(2 * scale))
        draw.text((bx + int(30 * scale), by + int(14 * scale)), label, fill=(148, 163, 184, 255), font=f_meta)
        draw.text((bx + int(30 * scale), by + int(46 * scale)), val, fill=(255, 255, 255, 255), font=f_meta_b)

    # Landmark Annotations across the entire district:
    # Based on our full bleed coordinates:
    # Campus circular ring is near (W*0.449, H*0.595)
    # Tha Khon Yang bridge is near (W*0.688, H*0.655)
    # Ban Kham Riang village is near (W*0.200, H*0.535)
    # Stadium is near (W*0.355, H*0.490)
    # Chi River oxbow loop is near (W*0.860, H*0.640)
    # North-South Highway 213 is near (W*0.670, H*0.350)
    landmarks = [
        {"x": int(W * 0.449), "y": int(H * 0.595), "th": "มหาวิทยาลัยมหาสารคาม (เขตพื้นที่ขามเรียง)", "en": "Mahasarakham University (Kham Riang)", "clr": "#D32F2F"},
        {"x": int(W * 0.428), "y": int(H * 0.625), "th": "อาคารบรมราชกุมารี (สำนักงานอธิการบดี)", "en": "President's Office (Borommaratchakumari)", "clr": "#1976D2"},
        {"x": int(W * 0.415), "y": int(H * 0.535), "th": "คณะการบัญชีและการจัดการ (MBS)", "en": "Mahasarakham Business School", "clr": "#E65100"},
        {"x": int(W * 0.470), "y": int(H * 0.540), "th": "คณะวิทยาศาสตร์ & วิศวกรรมศาสตร์", "en": "Science & Engineering Complex", "clr": "#7B1FA2"},
        {"x": int(W * 0.405), "y": int(H * 0.460), "th": "กลุ่มหอพักนิสิต & ตลาดน้อย มมส", "en": "Student Dormitories & Talat Noi", "clr": "#0288D1"},
        {"x": int(W * 0.355), "y": int(H * 0.485), "th": "สนามกีฬากลาง & ศูนย์ออกกำลังกาย", "en": "Main Stadium & Sports Complex", "clr": "#2E7D32"},
        {"x": int(W * 0.190), "y": int(H * 0.525), "th": "ชุมชนบ้านขามเรียง (Ban Kham Riang)", "en": "Kham Riang Community & Outskirts", "clr": "#455A64"},
        {"x": int(W * 0.620), "y": int(H * 0.660), "th": "ชุมชนบ้านท่าขอนยาง (Tha Khon Yang)", "en": "Tha Khon Yang District Center", "clr": "#D97706"},
        {"x": int(W * 0.705), "y": int(H * 0.655), "th": "สะพานข้ามแม่น้ำชี (ท่าขอนยาง)", "en": "Tha Khon Yang Chi River Bridge", "clr": "#0288D1"},
        {"x": int(W * 0.865), "y": int(H * 0.640), "th": "ลำน้ำชี & คุ้งน้ำชีเก่า (Oxbow Lake)", "en": "Chi River & Ancient Oxbow Meander", "clr": "#0288D1"},
        {"x": int(W * 0.670), "y": int(H * 0.320), "th": "ทางหลวงแผ่นดิน 213 (ไป อ.กันทรวิชัย)", "en": "Highway 213 (To Kantharawichai)", "clr": "#475569"}
    ]
    
    for lm in landmarks:
        lx, ly = lm["x"], lm["y"]
        draw.ellipse([lx - int(32 * scale), ly - int(32 * scale), lx + int(32 * scale), ly + int(32 * scale)], fill=(255, 255, 255, 75))
        draw.ellipse([lx - int(20 * scale), ly - int(20 * scale), lx + int(20 * scale), ly + int(20 * scale)], fill=lm["clr"])
        draw.ellipse([lx - int(7 * scale), ly - int(7 * scale), lx + int(7 * scale), ly + int(7 * scale)], fill=(255, 255, 255, 255))
        
        cw = int(680 * scale)
        ch = int(82 * scale)
        cx = lx + int(32 * scale)
        cy = ly - int(41 * scale)
        
        if cx + cw > W - margin:
            cx = lx - cw - int(32 * scale)
        if cy < header_h + int(10 * scale):
            cy = ly + int(32 * scale)
            
        draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=int(10 * scale), fill=(10, 15, 30, 225), outline=(212, 175, 55, 200), width=int(2 * scale))
        draw.text((cx + int(22 * scale), cy + int(10 * scale)), lm["th"], fill=(255, 255, 255, 255), font=f_pin)
        draw.text((cx + int(22 * scale), cy + int(44 * scale)), lm["en"], fill=(212, 175, 55, 255), font=f_pin_en)

    # Scale Bar (0 - 500m - 1km - 2km)
    sb_x = int(120 * scale)
    sb_y = H - int(220 * scale)
    sb_w = int(900 * scale)
    draw.rounded_rectangle([sb_x - int(25 * scale), sb_y - int(30 * scale), sb_x + sb_w + int(90 * scale), sb_y + int(70 * scale)], radius=int(12 * scale), fill=(10, 15, 30, 230), outline=(212, 175, 55, 180), width=int(2 * scale))
    draw.text((sb_x, sb_y - int(25 * scale)), "GRAPHIC SCALE / มาตราส่วนภาคพื้นดิน", fill=(203, 213, 225, 255), font=f_meta)
    bar_y = sb_y + int(12 * scale)
    bar_h = int(14 * scale)
    draw.rectangle([sb_x, bar_y, sb_x + int(225 * scale), bar_y + bar_h], fill=(212, 175, 55, 255))
    draw.rectangle([sb_x + int(225 * scale), bar_y, sb_x + int(450 * scale), bar_y + bar_h], fill=(255, 255, 255, 255))
    draw.rectangle([sb_x + int(450 * scale), bar_y, sb_x + int(675 * scale), bar_y + bar_h], fill=(212, 175, 55, 255))
    draw.rectangle([sb_x + int(675 * scale), bar_y, sb_x + int(900 * scale), bar_y + bar_h], fill=(255, 255, 255, 255))
    draw.text((sb_x - int(6 * scale), bar_y + int(20 * scale)), "0", fill=(255, 255, 255, 255), font=f_scale)
    draw.text((sb_x + int(210 * scale), bar_y + int(20 * scale)), "500m", fill=(255, 255, 255, 255), font=f_scale)
    draw.text((sb_x + int(435 * scale), bar_y + int(20 * scale)), "1.0km", fill=(255, 255, 255, 255), font=f_scale)
    draw.text((sb_x + int(660 * scale), bar_y + int(20 * scale)), "1.5km", fill=(255, 255, 255, 255), font=f_scale)
    draw.text((sb_x + int(865 * scale), bar_y + int(20 * scale)), "2.0km", fill=(255, 255, 255, 255), font=f_scale)

    # Footer
    footer_h = int(130 * scale)
    draw.rectangle([0, H - footer_h, W, H], fill=(10, 15, 30, 240))
    draw.line([0, H - footer_h, W, H - footer_h], fill=(212, 175, 55, 255), width=int(4 * scale))
    
    ft_y = H - footer_h + int(28 * scale)
    draw.text((int(90 * scale), ft_y), "มหาวิทยาลัยมหาสารคาม (มมส) ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม 44150 | ระบบพิกัด WGS84 Orthophoto Projection", fill=(226, 232, 240, 255), font=f_footer)
    draw.text((int(90 * scale), ft_y + int(44 * scale)), "แผนที่ภาพถ่ายทางอากาศครอบคลุมทั้งเขตวิทยาเขตและชุมชนโดยรอบ ขนาด 75.0 cm × 45.0 cm (อัตราส่วน 5:3) สำหรับพิมพ์โปสเตอร์ขนาดใหญ่", fill=(148, 163, 184, 255), font=f_footer)
    
    right_note = "MAHASARAKHAM UNIVERSITY REGIONAL ORTHOPHOTO ATLAS • 75 CM × 45 CM EDITION"
    r_bbox = f_footer.getbbox(right_note)
    draw.text((W - int(90 * scale) - (r_bbox[2] - r_bbox[0]), ft_y + int(25 * scale)), right_note, fill=(212, 175, 55, 255), font=f_footer)

    return pil_img

print("Creating Annotated Poster 150 DPI...")
poster_150 = create_annotated_poster(fb_150, dpi=150)
poster_150.save('public/msu_satellite_poster_75x45cm_150dpi.jpg', quality=93)
print("Saved public/msu_satellite_poster_75x45cm_150dpi.jpg!")

print("Creating Annotated Poster 300 DPI...")
poster_300 = create_annotated_poster(fb_300, dpi=300)
poster_300.save('public/msu_satellite_poster_75x45cm_300dpi.jpg', quality=94)
print("Saved public/msu_satellite_poster_75x45cm_300dpi.jpg!")
print("ALL FULL-DISTRICT POSTERS GENERATED SUCCESSFULLY!")
