import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def get_fonts(scale_factor=1.0):
    def f(name, size):
        sz = max(10, int(size * scale_factor))
        for font_path in [
            f"C:/Windows/Fonts/{name}.ttf",
            "C:/Windows/Fonts/LeelaUIb.ttf" if "b" in name.lower() else "C:/Windows/Fonts/LeelawUI.ttf",
            "C:/Windows/Fonts/tahomabd.ttf" if "b" in name.lower() else "C:/Windows/Fonts/tahoma.ttf",
            "C:/Windows/Fonts/arialbd.ttf" if "b" in name.lower() else "C:/Windows/Fonts/arial.ttf"
        ]:
            if os.path.exists(font_path):
                try:
                    return ImageFont.truetype(font_path, sz)
                except Exception:
                    continue
        return ImageFont.load_default()

    return {
        "title": f("LeelaUIb", 78),
        "subtitle_en": f("arialbd", 40),
        "subtitle_th": f("LeelaUIb", 32),
        "pin_label": f("LeelaUIb", 26),
        "pin_sub": f("LeelawUI", 20),
        "grid_label": f("arial", 22),
        "meta": f("LeelawUI", 24),
        "meta_bold": f("LeelaUIb", 25),
        "footer": f("LeelawUI", 22),
        "scale": f("arialbd", 22)
    }

def create_satellite_poster(dpi=300):
    scale = dpi / 300.0
    W = int(8858 * scale)
    H = int(5315 * scale)
    fonts = get_fonts(scale)
    
    # Load stitched satellite
    sat = Image.open("msu_satellite_stitched.jpg") # (3584, 2816)
    
    # Target aspect ratio is 5:3
    # Crop to 5:3 around center
    target_aspect = 5.0 / 3.0
    curr_aspect = sat.width / sat.height
    
    if curr_aspect < target_aspect:
        # height needs to be reduced
        crop_h = int(sat.width / target_aspect)
        crop_y = (sat.height - crop_h) // 2
        cropped_sat = sat.crop((0, crop_y, sat.width, crop_y + crop_h))
    else:
        crop_w = int(sat.height * target_aspect)
        crop_x = (sat.width - crop_w) // 2
        cropped_sat = sat.crop((crop_x, 0, crop_x + crop_w, sat.height))
        
    # Resize to W x H
    sat_resampled = cropped_sat.resize((W, H), Image.Resampling.LANCZOS)
    if scale >= 0.8:
        sat_resampled = sat_resampled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=2))
        
    poster = sat_resampled.copy()
    draw = ImageDraw.Draw(poster, "RGBA")
    
    # 1. Overlay Header HUD Banner
    header_h = int(480 * scale)
    draw.rectangle([0, 0, W, header_h], fill=(10, 15, 30, 215)) # Dark translucent slate
    draw.rectangle([0, 0, W, int(15 * scale)], fill=(212, 175, 55, 255)) # Gold line
    draw.line([0, header_h, W, header_h], fill=(212, 175, 55, 180), width=int(3 * scale))
    
    # 2. Outer Frame & Coordinate Ticks
    margin = int(45 * scale)
    draw.rectangle([margin, margin, W - margin, H - margin], outline=(255, 255, 255, 160), width=int(2 * scale))
    
    for i in range(16):
        cm = i * 5
        x_pos = int(margin + (W - 2 * margin) * (i / 15.0))
        draw.line([x_pos, margin - int(10 * scale), x_pos, margin + int(10 * scale)], fill=(255, 255, 255, 200), width=int(2 * scale))
        draw.line([x_pos, H - margin - int(10 * scale), x_pos, H - margin + int(10 * scale)], fill=(255, 255, 255, 200), width=int(2 * scale))
        draw.text((x_pos - int(16 * scale), margin - int(34 * scale)), f"{cm}cm", fill=(255, 255, 255, 220), font=fonts["grid_label"])

    # Header Titles
    pad_left = int(90 * scale)
    draw.text((pad_left, int(45 * scale)), "มหาวิทยาลัยมหาสารคาม (เขตพื้นที่ขามเรียง)", fill=(255, 255, 255, 255), font=fonts["title"])
    draw.text((pad_left, int(155 * scale)), "MAHASARAKHAM UNIVERSITY • SATELLITE ORTHOPHOTO EDITION", fill=(212, 175, 55, 255), font=fonts["subtitle_en"])
    draw.text((pad_left, int(225 * scale)), "ภาพถ่ายดาวเทียมความละเอียดสูง (HIGH-RESOLUTION SATELLITE IMAGERY 75 × 45 CM)", fill=(203, 213, 225, 255), font=fonts["subtitle_th"])
    
    # Header Badges on Right
    badge_x = int(5400 * scale)
    badges = [
        ("ขนาดจริง (Physical Size):", "75.0 cm × 45.0 cm (Ratio 5:3)"),
        ("ความละเอียดภาพ (Resolution):", f"{dpi} DPI Ultra HD ({W} × {H} px)"),
        ("พิกัดกึ่งกลาง (Center GPS):", "16°14'58.2\"N, 103°15'03.6\"E (WGS84)"),
        ("ดาวเทียมและข้อมูล (Sensor):", "ESRI World Imagery / GIS Ortho Map")
    ]
    for idx, (label, val) in enumerate(badges):
        bx = badge_x + (idx % 2) * int(1650 * scale)
        by = int(60 * scale) + (idx // 2) * int(100 * scale)
        draw.rounded_rectangle([bx, by, bx + int(1580 * scale), by + int(85 * scale)], radius=int(12 * scale), fill=(15, 23, 42, 230), outline=(212, 175, 55, 180), width=int(2 * scale))
        draw.text((bx + int(30 * scale), by + int(14 * scale)), label, fill=(148, 163, 184, 255), font=fonts["meta"])
        draw.text((bx + int(30 * scale), by + int(46 * scale)), val, fill=(255, 255, 255, 255), font=fonts["meta_bold"])

    # 3. Coordinate Grid Overlay
    grid_lines_x = [int(W * 0.25), int(W * 0.5), int(W * 0.75)]
    grid_lines_y = [int(H * 0.35), int(H * 0.65)]
    for gx in grid_lines_x:
        draw.line([gx, header_h, gx, H - int(150 * scale)], fill=(255, 255, 255, 45), width=int(1 * scale))
    for gy in grid_lines_y:
        draw.line([margin, gy, W - margin, gy], fill=(255, 255, 255, 45), width=int(1 * scale))

    # 4. Landmark Annotations on Satellite (Pins with Callout Cards)
    # Positions relative to cropped sat image:
    # Campus circular ring is near (W*0.48, H*0.42)
    # Stadium is near (W*0.38, H*0.28)
    # Chi river is near (W*0.82, H*0.88)
    # Tha Khon Yang road extends south-east
    landmarks = [
        {"x": int(W * 0.495), "y": int(H * 0.440), "th": "วงเวียน มมส ขามเรียง (ลานอัฐศิลป์)", "en": "Attasin Court / Octagon Pavilion", "clr": "#D32F2F"},
        {"x": int(W * 0.450), "y": int(H * 0.485), "th": "สำนักงานอธิการบดี (อาคารบรมราชกุมารี)", "en": "President's Office (Admin Center)", "clr": "#1976D2"},
        {"x": int(W * 0.440), "y": int(H * 0.380), "th": "คณะการบัญชีและการจัดการ (MBS)", "en": "Mahasarakham Business School", "clr": "#E65100"},
        {"x": int(W * 0.540), "y": int(H * 0.390), "th": "คณะวิทยาศาสตร์ / คณะวิศวกรรมศาสตร์", "en": "Faculties of Science & Engineering", "clr": "#7B1FA2"},
        {"x": int(W * 0.435), "y": int(H * 0.270), "th": "หอพักนิสิต & ตลาดน้อย มมส", "en": "Student Dorms & Talat Noi", "clr": "#0288D1"},
        {"x": int(W * 0.360), "y": int(H * 0.280), "th": "สนามฟุตบอล & อาคารพลศึกษา", "en": "MSU Football Stadium & Gym", "clr": "#2E7D32"},
        {"x": int(W * 0.580), "y": int(H * 0.520), "th": "ถนน ขามเรียง-ท่าขอนยาง (ไปเมือง มหาสารคาม)", "en": "Kham Riang - Tha Khon Yang Arterial", "clr": "#455A64"},
        {"x": int(W * 0.810), "y": int(H * 0.870), "th": "ลำน้ำชี (Chi River)", "en": "Chi River Meander", "clr": "#0288D1"}
    ]
    
    for lm in landmarks:
        lx, ly = lm["x"], lm["y"]
        # Glow circle
        draw.ellipse([lx - int(36 * scale), ly - int(36 * scale), lx + int(36 * scale), ly + int(36 * scale)], fill=(255, 255, 255, 70))
        draw.ellipse([lx - int(24 * scale), ly - int(24 * scale), lx + int(24 * scale), ly + int(24 * scale)], fill=lm["clr"])
        draw.ellipse([lx - int(8 * scale), ly - int(8 * scale), lx + int(8 * scale), ly + int(8 * scale)], fill=(255, 255, 255, 255))
        
        # Callout card
        cw = int(720 * scale)
        ch = int(88 * scale)
        cx = lx + int(40 * scale)
        cy = ly - int(44 * scale)
        
        # Adjust if too close to right edge
        if cx + cw > W - margin:
            cx = lx - cw - int(40 * scale)
            
        draw.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=int(10 * scale), fill=(10, 15, 30, 225), outline=(212, 175, 55, 200), width=int(2 * scale))
        draw.text((cx + int(25 * scale), cy + int(12 * scale)), lm["th"], fill=(255, 255, 255, 255), font=fonts["pin_label"])
        draw.text((cx + int(25 * scale), cy + int(48 * scale)), lm["en"], fill=(212, 175, 55, 255), font=fonts["pin_sub"])

    # 5. Scale Bar on Bottom Left
    sb_x = int(120 * scale)
    sb_y = H - int(240 * scale)
    sb_w = int(800 * scale)
    draw.rounded_rectangle([sb_x - int(25 * scale), sb_y - int(30 * scale), sb_x + sb_w + int(90 * scale), sb_y + int(70 * scale)], radius=int(12 * scale), fill=(10, 15, 30, 230), outline=(212, 175, 55, 180), width=int(2 * scale))
    draw.text((sb_x, sb_y - int(25 * scale)), "SCALE / มาตราส่วนภาคพื้นดิน", fill=(203, 213, 225, 255), font=fonts["meta"])
    bar_y = sb_y + int(12 * scale)
    bar_h = int(14 * scale)
    draw.rectangle([sb_x, bar_y, sb_x + int(200 * scale), bar_y + bar_h], fill=(212, 175, 55, 255))
    draw.rectangle([sb_x + int(200 * scale), bar_y, sb_x + int(400 * scale), bar_y + bar_h], fill=(255, 255, 255, 255))
    draw.rectangle([sb_x + int(400 * scale), bar_y, sb_x + int(600 * scale), bar_y + bar_h], fill=(212, 175, 55, 255))
    draw.rectangle([sb_x + int(600 * scale), bar_y, sb_x + int(800 * scale), bar_y + bar_h], fill=(255, 255, 255, 255))
    draw.text((sb_x - int(6 * scale), bar_y + int(20 * scale)), "0", fill=(255, 255, 255, 255), font=fonts["scale"])
    draw.text((sb_x + int(185 * scale), bar_y + int(20 * scale)), "250m", fill=(255, 255, 255, 255), font=fonts["scale"])
    draw.text((sb_x + int(385 * scale), bar_y + int(20 * scale)), "500m", fill=(255, 255, 255, 255), font=fonts["scale"])
    draw.text((sb_x + int(585 * scale), bar_y + int(20 * scale)), "750m", fill=(255, 255, 255, 255), font=fonts["scale"])
    draw.text((sb_x + int(765 * scale), bar_y + int(20 * scale)), "1.0km", fill=(255, 255, 255, 255), font=fonts["scale"])

    # 6. Bottom Footer Bar
    footer_h = int(140 * scale)
    draw.rectangle([0, H - footer_h, W, H], fill=(10, 15, 30, 240))
    draw.line([0, H - footer_h, W, H - footer_h], fill=(212, 175, 55, 255), width=int(4 * scale))
    
    ft_y = H - footer_h + int(30 * scale)
    draw.text((int(90 * scale), ft_y), "มหาวิทยาลัยมหาสารคาม (มมส) ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม 44150 | ระบบพิกัด WGS84 Geographic Projection", fill=(226, 232, 240, 255), font=fonts["footer"])
    draw.text((int(90 * scale), ft_y + int(46 * scale)), "แผนผังภาพถ่ายดาวเทียมความคมชัดสูง ขนาด 75.0 cm × 45.0 cm สำหรับงานผังเมือง ประชาสัมพันธ์ และพิมพ์โปสเตอร์ขนาดใหญ่", fill=(148, 163, 184, 255), font=fonts["footer"])
    
    right_note = "MAHASARAKHAM UNIVERSITY SATELLITE ATLAS • 75 CM × 45 CM ULTRA HD EDITION"
    r_bbox = fonts["footer"].getbbox(right_note)
    draw.text((W - int(90 * scale) - (r_bbox[2] - r_bbox[0]), ft_y + int(25 * scale)), right_note, fill=(212, 175, 55, 255), font=fonts["footer"])
    
    # Convert RGBA back to RGB for JPEG/PNG saving
    rgb_poster = poster.convert("RGB")
    return rgb_poster

print("Building Satellite 150 DPI Poster...")
s150 = create_satellite_poster(dpi=150)
s150.save("public/msu_satellite_75x45cm_150dpi.jpg", quality=93, optimize=True)
s150.save("public/msu_satellite_75x45cm_150dpi.png", optimize=True)

print("Building Satellite 300 DPI Poster...")
s300 = create_satellite_poster(dpi=300)
s300.save("public/msu_satellite_75x45cm_300dpi.jpg", quality=94, optimize=True)
s300.save("public/msu_satellite_75x45cm_300dpi.png")
print("Finished saving satellite posters!")
