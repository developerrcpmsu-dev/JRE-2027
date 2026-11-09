import os
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BUILDINGS = [
    {"id": 1, "name_th": "สำนักงานอธิการบดี (อาคารบรมราชกุมารี)", "name_en": "President's Office (Borommaratchakumari)", "cat": "admin", "color": "#D32F2F"},
    {"id": 2, "name_th": "สโมสรบุคลากรมหาวิทยาลัยมหาสารคาม", "name_en": "Staff Club", "cat": "admin", "color": "#1976D2"},
    {"id": 3, "name_th": "เส้นทางศึกษาธรรมชาติ (โซนใต้)", "name_en": "Nature Study Trail (South Zone)", "cat": "life", "color": "#2E7D32"},
    {"id": 4, "name_th": "สวนสัตว์มหาวิทยาลัยมหาสารคาม", "name_en": "MSU Mini Zoo / Animal Park", "cat": "life", "color": "#2E7D32"},
    {"id": 5, "name_th": "อาคารแสดงสินค้า (MSU Outlet)", "name_en": "MSU Outlet Center", "cat": "life", "color": "#E65100"},
    {"id": 6, "name_th": "คณะเภสัชศาสตร์", "name_en": "Faculty of Pharmacy", "cat": "health", "color": "#0288D1"},
    {"id": 7, "name_th": "คณะสิ่งแวดล้อมและทรัพยากรศาสตร์", "name_en": "Faculty of Environment & Resource Studies", "cat": "sci", "color": "#388E3C"},
    {"id": 8, "name_th": "คณะพยาบาลศาสตร์", "name_en": "Faculty of Nursing", "cat": "health", "color": "#0288D1"},
    {"id": 9, "name_th": "คณะวิทยาการสารสนเทศ", "name_en": "Faculty of Informatics", "cat": "sci", "color": "#7B1FA2"},
    {"id": 10, "name_th": "คณะวิศวกรรมศาสตร์", "name_en": "Faculty of Engineering", "cat": "sci", "color": "#D84315"},
    {"id": 11, "name_th": "คณะสาธารณสุขศาสตร์", "name_en": "Faculty of Public Health", "cat": "health", "color": "#0288D1"},
    {"id": 12, "name_th": "กองส่งเสริมการวิจัยและบริการวิชาการ (ไหม)", "name_en": "Research & Academic Promotion Division", "cat": "admin", "color": "#1976D2"},
    {"id": 13, "name_th": "ศูนย์ความร่วมมือกับภาคอุตสาหกรรม (UIC)", "name_en": "University-Industry Cooperation Center", "cat": "sci", "color": "#1976D2"},
    {"id": 14, "name_th": "ศูนย์วิจัยและการศึกษาบรรพชีวินวิทยา (PRC)", "name_en": "Palaeontological Research & Education Center", "cat": "sci", "color": "#5D4037"},
    {"id": 15, "name_th": "อาคารชุดอาศัยบุคลากรมหาวิทยาลัย", "name_en": "Staff Residence Complex", "cat": "life", "color": "#546E7A"},
    {"id": 16, "name_th": "โรงงานฟาร์มแคร์ ฟาร์มาซูติคอล", "name_en": "PharmCare Pharmaceutical Factory", "cat": "health", "color": "#00897B"},
    {"id": 17, "name_th": "คณะเทคโนโลยี", "name_en": "Faculty of Technology", "cat": "sci", "color": "#00796B"},
    {"id": 18, "name_th": "คณะวิทยาศาสตร์ (อาคารเรียน)", "name_en": "Faculty of Science (Main Building)", "cat": "sci", "color": "#F57C00"},
    {"id": 19, "name_th": "คณะวิทยาศาสตร์ (อาคารเรียนรวม)", "name_en": "Faculty of Science (Lecture Hall)", "cat": "sci", "color": "#F57C00"},
    {"id": 20, "name_th": "ตึก A สำนักวิทยบริการ (หอสมุดกลาง)", "name_en": "Building A - Academic Resource Center (Library)", "cat": "learn", "color": "#1565C0"},
    {"id": 21, "name_th": "ตึก B สำนักคอมพิวเตอร์", "name_en": "Building B - Computer Center", "cat": "learn", "color": "#0277BD"},
    {"id": 22, "name_th": "ตึก C วิทยาลัยดุริยางคศิลป์", "name_en": "Building C - College of Music", "cat": "hum", "color": "#AD1457"},
    {"id": 23, "name_th": "ตึก D วิทยาลัยการเมืองการปกครอง", "name_en": "Building D - College of Politics & Governance", "cat": "hum", "color": "#C2185B"},
    {"id": 24, "name_th": "ลานอัฐศิลป์ (ลานแปดเหลี่ยม)", "name_en": "Attasin Court (Octagon Pavilion)", "cat": "learn", "color": "#D32F2F"},
    {"id": 25, "name_th": "คณะสถาปัตยกรรมศาสตร์ฯ", "name_en": "Faculty of Architecture, Urban Design & Creative Arts", "cat": "hum", "color": "#6A1B9A"},
    {"id": 26, "name_th": "คณะศิลปกรรมศาสตร์และวัฒนธรรมศาสตร์", "name_en": "Faculty of Fine & Applied Arts", "cat": "hum", "color": "#8E24AA"},
    {"id": 27, "name_th": "คณะการบัญชีและการจัดการ (MBS)", "name_en": "Mahasarakham Business School (MBS)", "cat": "hum", "color": "#E65100"},
    {"id": 28, "name_th": "ศูนย์หนังสือ มหาวิทยาลัยมหาสารคาม", "name_en": "MSU Book Center", "cat": "life", "color": "#1976D2"},
    {"id": 29, "name_th": "กองทะเบียนและประมวลผล", "name_en": "Division of Registrar", "cat": "admin", "color": "#1976D2"},
    {"id": 30, "name_th": "คณะวิทยาศาสตร์ (อาคารปฏิบัติการ)", "name_en": "Faculty of Science (Lab Complex)", "cat": "sci", "color": "#F57C00"},
    {"id": 31, "name_th": "ตลาดน้อย (ศูนย์อาหารและบริการนิสิต)", "name_en": "Talat Noi (Student Food & Services)", "cat": "life", "color": "#E65100"},
    {"id": 32, "name_th": "กองกิจการนิสิต", "name_en": "Division of Student Affairs", "cat": "admin", "color": "#1976D2"},
    {"id": 33, "name_th": "หอพักนิสิตมหาวิทยาลัยมหาสารคาม", "name_en": "Student Dormitory Complex", "cat": "life", "color": "#303F9F"},
    {"id": 34, "name_th": "MSU Plaza (เอ็มเอสยู พลาซ่า)", "name_en": "MSU Plaza Shopping & Service Center", "cat": "life", "color": "#F57C00"},
    {"id": 35, "name_th": "สระว่ายน้ำ มหาวิทยาลัยมหาสารคาม", "name_en": "MSU Swimming Pool", "cat": "life", "color": "#0288D1"},
    {"id": 36, "name_th": "สนามฟุตบอล มหาวิทยาลัยมหาสารคาม", "name_en": "MSU Main Football Stadium", "cat": "life", "color": "#2E7D32"},
    {"id": 37, "name_th": "อาคารพลศึกษาและกีฬา", "name_en": "Gymnasium & Sports Complex", "cat": "life", "color": "#F57C00"},
    {"id": 38, "name_th": "สำนักศึกษาทั่วไป", "name_en": "General Education Building", "cat": "learn", "color": "#1565C0"},
    {"id": 39, "name_th": "คณะมนุษยศาสตร์และสังคมศาสตร์ (HUSOC)", "name_en": "Faculty of Humanities & Social Sciences", "cat": "hum", "color": "#D81B60"},
    {"id": 40, "name_th": "เส้นทางศึกษาธรรมชาติ (โซนตะวันตก)", "name_en": "Nature Trail & Conservation Area", "cat": "life", "color": "#2E7D32"},
    {"id": 41, "name_th": "โรงเรียนสาธิตมหาวิทยาลัยมหาสารคาม (ฝ่ายมัธยม)", "name_en": "MSU Demonstration School (Secondary)", "cat": "learn", "color": "#E65100"},
    {"id": 42, "name_th": "กองอาคารสถานที่", "name_en": "Division of Buildings & Grounds", "cat": "admin", "color": "#455A64"},
    {"id": 43, "name_th": "งานยานยนต์และขนส่ง", "name_en": "Vehicle & Transportation Section", "cat": "admin", "color": "#455A64"},
]

CATEGORIES = [
    {"key": "admin", "name_th": "อาคารบริหารและบริการกลาง", "name_en": "Administration & Central Services", "color": "#1565C0", "icon": "🏛️", "bids": [1, 2, 12, 29, 32, 42, 43]},
    {"key": "sci", "name_th": "วิทยาศาสตร์ เทคโนโลยี และวิศวกรรม", "name_en": "Science, Technology & Engineering", "color": "#D84315", "icon": "🔬", "bids": [7, 9, 10, 13, 14, 17, 18, 19, 30]},
    {"key": "health", "name_th": "วิทยาศาสตร์สุขภาพและการแพทย์", "name_en": "Health Sciences & Medicine", "color": "#00897B", "icon": "🩺", "bids": [6, 8, 11, 16]},
    {"key": "hum", "name_th": "มนุษยศาสตร์ สังคมศาสตร์ และศิลปะ", "name_en": "Humanities, Social Sciences & Arts", "color": "#8E24AA", "icon": "📚", "bids": [22, 23, 25, 26, 27, 39]},
    {"key": "learn", "name_th": "ศูนย์วิทยบริการ คอมพิวเตอร์ และการเรียนรู้", "name_en": "Academic Resources, IT & Learning", "color": "#283593", "icon": "📖", "bids": [20, 21, 24, 38, 41]},
    {"key": "life", "name_th": "กีฬา สันทนาการ หอพัก และชีวิตนิสิต", "name_en": "Sports, Recreation, Housing & Life", "color": "#2E7D32", "icon": "⚽", "bids": [3, 4, 5, 15, 28, 31, 33, 34, 35, 36, 37, 40]},
]

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
        "title": f("LeelaUIb", 88),
        "subtitle_en": f("arialbd", 44),
        "subtitle_th": f("LeelaUIb", 36),
        "badge_tag": f("LeelaUIb", 26),
        "badge_sub": f("LeelawUI", 23),
        "cat_title": f("LeelaUIb", 28),
        "item_bold": f("LeelaUIb", 24),
        "item_reg": f("LeelawUI", 20),
        "badge_num": f("arialbd", 22),
        "scale_font": f("arialbd", 24),
        "footer": f("LeelawUI", 24),
        "footer_bold": f("LeelaUIb", 25),
        "legend_font": f("LeelawUI", 23)
    }

def create_master_poster(dpi=300):
    scale = dpi / 300.0
    W = int(8858 * scale)
    H = int(5315 * scale)
    fonts = get_fonts(scale)
    
    poster = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(poster)
    
    # 1. Top Header Banner
    banner_h = int(520 * scale)
    # MSU Gold Accent line
    draw.rectangle([0, 0, W, int(24 * scale)], fill="#D4AF37")
    draw.rectangle([0, int(24 * scale), W, banner_h], fill="#F8FAFC")
    draw.line([0, banner_h, W, banner_h], fill="#CBD5E1", width=int(4 * scale))
    
    # Bottom footer background
    footer_h = int(150 * scale)
    draw.rectangle([0, H - footer_h, W, H], fill="#0A192F") # Prestige Deep Navy
    draw.line([0, H - footer_h, W, H - footer_h], fill="#D4AF37", width=int(5 * scale))
    
    # Border with ruler ticks
    margin = int(45 * scale)
    draw.rectangle([margin, margin, W - margin, H - margin], outline="#94A3B8", width=int(3 * scale))
    draw.rectangle([margin + int(12 * scale), margin + int(12 * scale), W - margin - int(12 * scale), H - margin - int(12 * scale)], outline="#E2E8F0", width=int(2 * scale))
    
    # Rulers ticks (0 to 75 cm)
    for i in range(16):
        cm = i * 5
        x_pos = int(margin + (W - 2 * margin) * (i / 15.0))
        draw.line([x_pos, margin - int(12 * scale), x_pos, margin + int(12 * scale)], fill="#475569", width=int(2 * scale))
        draw.line([x_pos, H - margin - int(12 * scale), x_pos, H - margin + int(12 * scale)], fill="#475569", width=int(2 * scale))
        draw.text((x_pos - int(18 * scale), margin - int(38 * scale)), f"{cm}cm", fill="#475569", font=fonts["scale_font"])

    # Header Texts
    pad_left = int(90 * scale)
    draw.text((pad_left, int(55 * scale)), "มหาวิทยาลัยมหาสารคาม (เขตพื้นที่ขามเรียง)", fill="#0F2942", font=fonts["title"])
    draw.text((pad_left, int(175 * scale)), "MAHASARAKHAM UNIVERSITY • KHAM RIANG CAMPUS", fill="#D49B0E", font=fonts["subtitle_en"])
    draw.text((pad_left, int(250 * scale)), "แผนผังแม่บทมหาวิทยาลัยและสารบัญอาคารสัญจร • MASTER PLAN & CAMPUS DIRECTORY", fill="#334155", font=fonts["subtitle_th"])
    
    # Header Specification Badges
    badge_x = int(5250 * scale)
    spec_cards = [
        ("ขนาดโปสเตอร์ (Size):", "75.0 cm × 45.0 cm (Ratio 5:3)", "#0F2942"),
        ("ความละเอียด (DPI):", f"{dpi} DPI Ultra HD ({W} × {H} px)", "#D97706"),
        ("พิกัดแผนที่ (GPS):", "16°14'58.2\"N, 103°15'03.6\"E (WGS84)", "#0F2942"),
        ("มาตราส่วน (Scale):", "1 : 5,000 (ประมาณการภาคสนาม)", "#059669")
    ]
    for idx, (label, val, clr) in enumerate(spec_cards):
        bx = badge_x + (idx % 2) * int(1720 * scale)
        by = int(65 * scale) + (idx // 2) * int(105 * scale)
        draw.rounded_rectangle([bx, by, bx + int(1640 * scale), by + int(92 * scale)], radius=int(14 * scale), fill="#FFFFFF", outline="#CBD5E1", width=int(2 * scale))
        draw.text((bx + int(35 * scale), by + int(16 * scale)), label, fill="#64748B", font=fonts["badge_sub"])
        draw.text((bx + int(35 * scale), by + int(48 * scale)), val, fill=clr, font=fonts["badge_tag"])

    # Main Campus Map Graphic
    orig_img = Image.open("msu_plan_wikimedia.jpg")
    crop_map = orig_img.crop((180, 320, 1660, 1720)) # (1480, 1400)
    
    target_map_h = int(4450 * scale)
    map_scale = target_map_h / crop_map.height
    target_map_w = int(crop_map.width * map_scale)
    
    resampled_map = crop_map.resize((target_map_w, target_map_h), Image.Resampling.LANCZOS)
    if scale >= 0.8:
        resampled_map = resampled_map.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110, threshold=2))
        
    map_pos_x = int(70 * scale)
    map_pos_y = int(520 * scale)
    poster.paste(resampled_map, (map_pos_x, map_pos_y))
    
    # Scale Bar
    sb_x = int(220 * scale)
    sb_y = int(4840 * scale)
    sb_w = int(750 * scale)
    draw.rounded_rectangle([sb_x - int(25 * scale), sb_y - int(32 * scale), sb_x + sb_w + int(90 * scale), sb_y + int(75 * scale)], radius=int(12 * scale), fill="#FFFFFF", outline="#CBD5E1", width=int(2 * scale))
    draw.text((sb_x, sb_y - int(26 * scale)), "GRAPHIC SCALE / มาตราส่วนแผนผัง", fill="#334155", font=fonts["badge_sub"])
    bar_y = sb_y + int(12 * scale)
    bar_h = int(16 * scale)
    draw.rectangle([sb_x, bar_y, sb_x + int(150 * scale), bar_y + bar_h], fill="#0F2942")
    draw.rectangle([sb_x + int(150 * scale), bar_y, sb_x + int(300 * scale), bar_y + bar_h], fill="#FFFFFF", outline="#0F2942")
    draw.rectangle([sb_x + int(300 * scale), bar_y, sb_x + int(525 * scale), bar_y + bar_h], fill="#0F2942")
    draw.rectangle([sb_x + int(525 * scale), bar_y, sb_x + int(750 * scale), bar_y + bar_h], fill="#FFFFFF", outline="#0F2942")
    draw.text((sb_x - int(6 * scale), bar_y + int(22 * scale)), "0", fill="#0F2942", font=fonts["scale_font"])
    draw.text((sb_x + int(140 * scale), bar_y + int(22 * scale)), "100m", fill="#0F2942", font=fonts["scale_font"])
    draw.text((sb_x + int(290 * scale), bar_y + int(22 * scale)), "200m", fill="#0F2942", font=fonts["scale_font"])
    draw.text((sb_x + int(515 * scale), bar_y + int(22 * scale)), "350m", fill="#0F2942", font=fonts["scale_font"])
    draw.text((sb_x + int(720 * scale), bar_y + int(22 * scale)), "500m", fill="#0F2942", font=fonts["scale_font"])

    # Right Legend Directory Panel
    dir_x = int(5200 * scale)
    dir_y = int(530 * scale)
    dir_w = int(3570 * scale)
    dir_h = int(4550 * scale)
    
    # Outer panel
    draw.rounded_rectangle([dir_x, dir_y, dir_x + dir_w, dir_y + dir_h], radius=int(20 * scale), fill="#FFFFFF", outline="#94A3B8", width=int(3 * scale))
    
    # Header of Directory
    header_box_h = int(125 * scale)
    draw.rounded_rectangle([dir_x, dir_y, dir_x + dir_w, dir_y + header_box_h], radius=int(20 * scale), fill="#0F2942")
    draw.rectangle([dir_x, dir_y + header_box_h - int(25 * scale), dir_x + dir_w, dir_y + header_box_h], fill="#0F2942")
    draw.text((dir_x + int(45 * scale), dir_y + int(22 * scale)), "สารบัญอาคารและสถานที่สำคัญ (CAMPUS DIRECTORY)", fill="#FFFFFF", font=fonts["subtitle_th"])
    draw.text((dir_x + int(45 * scale), dir_y + int(74 * scale)), "จำแนกตามกลุ่มหน่วยงานและคณะวิชาทั้ง 43 แห่งในเขตพื้นที่ขามเรียง", fill="#94A3B8", font=fonts["item_reg"])

    # Two columns for 43 items
    col1_x = dir_x + int(40 * scale)
    col2_x = dir_x + int(1800 * scale)
    col_w = int(1710 * scale)
    
    # Group items by category to make it clean & readable
    curr_y1 = dir_y + header_box_h + int(22 * scale)
    curr_y2 = curr_y1
    row_height = int(98 * scale)
    
    for b in BUILDINGS:
        bid = b["id"]
        if bid <= 22:
            bx = col1_x
            by = curr_y1
            curr_y1 += row_height
        else:
            bx = col2_x
            by = curr_y2
            curr_y2 += row_height
            
        draw.rounded_rectangle([bx, by, bx + col_w, by + int(88 * scale)], radius=int(10 * scale), fill="#F8FAFC", outline="#E2E8F0", width=int(1 * scale))
        
        # Badge
        badge_r = int(30 * scale)
        badge_cx = bx + int(48 * scale)
        badge_cy = by + int(44 * scale)
        draw.ellipse([badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r], fill=b["color"])
        
        num_str = str(bid)
        bbox = fonts["badge_num"].getbbox(num_str)
        nw = bbox[2] - bbox[0]
        nh = bbox[3] - bbox[1]
        draw.text((badge_cx - nw // 2, badge_cy - nh // 2 - int(2 * scale)), num_str, fill="#FFFFFF", font=fonts["badge_num"])
        
        tx = bx + int(96 * scale)
        draw.text((tx, by + int(12 * scale)), b["name_th"], fill="#0F172A", font=fonts["item_bold"])
        draw.text((tx, by + int(50 * scale)), b["name_en"], fill="#64748B", font=fonts["item_reg"])

    # Symbols block at bottom of directory
    sym_y = dir_y + dir_h - int(235 * scale)
    draw.line([dir_x + int(40 * scale), sym_y, dir_x + dir_w - int(40 * scale), sym_y], fill="#CBD5E1", width=int(2 * scale))
    draw.text((dir_x + int(40 * scale), sym_y + int(16 * scale)), "สัญลักษณ์แผนผังและประเภทพื้นที่ (MAP LEGEND)", fill="#0F2942", font=fonts["cat_title"])
    
    symbols = [
        ("#E57842", "อาคารเรียนและคณะวิชา (Faculties & Lecture Buildings)"),
        ("#1976D2", "อาคารบริหารและบริการกลาง (Administration & Support)"),
        ("#A8C599", "สวนธรรมชาติและพื้นที่สีเขียว (Green Spaces & Trails)"),
        ("#BCD2E8", "สระน้ำและแหล่งน้ำธรรมชาติ (Water Bodies & Reservoirs)"),
        ("#3D4043", "ถนนสายหลักและวงเวียนสัญจร (Main Arterials & Roundabout)")
    ]
    sym_col1 = dir_x + int(40 * scale)
    sym_col2 = dir_x + int(1800 * scale)
    for s_idx, (color, desc) in enumerate(symbols):
        sx = sym_col1 if s_idx < 3 else sym_col2
        sy = sym_y + int(70 * scale) + (s_idx % 3 if s_idx < 3 else s_idx - 3) * int(48 * scale)
        draw.rounded_rectangle([sx, sy, sx + int(38 * scale), sy + int(24 * scale)], radius=int(4 * scale), fill=color, outline="#64748B", width=int(1 * scale))
        draw.text((sx + int(52 * scale), sy - int(2 * scale)), desc, fill="#334155", font=fonts["legend_font"])

    # Footer
    ft_y = H - footer_h + int(32 * scale)
    draw.text((int(90 * scale), ft_y), "มหาวิทยาลัยมหาสารคาม (มมส) ต.ขามเรียง อ.กันทรวิชัย จ.มหาสารคาม 44150 | โทรศัพท์: 0-4375-4333 | เว็บไซต์: www.msu.ac.th", fill="#E2E8F0", font=fonts["footer_bold"])
    draw.text((int(90 * scale), ft_y + int(48 * scale)), "จัดพิมพ์ในอัตราส่วนมาตรฐาน 75.0 cm × 45.0 cm (5:3) สำหรับโปสเตอร์ บอร์ดประชาสัมพันธ์ และแผนผังติดผนังอาคาร", fill="#94A3B8", font=fonts["footer"])
    
    right_note = "MAHASARAKHAM UNIVERSITY OFFICIAL MASTER PLAN • 75 CM × 45 CM PRINT EDITION"
    r_bbox = fonts["footer_bold"].getbbox(right_note)
    draw.text((W - int(90 * scale) - (r_bbox[2] - r_bbox[0]), ft_y + int(28 * scale)), right_note, fill="#D4AF37", font=fonts["footer_bold"])
    
    return poster

print("Re-rendering 150 DPI...")
p150 = create_master_poster(dpi=150)
p150.save("public/msu_map_75x45cm_150dpi.jpg", quality=94, optimize=True)
p150.save("public/msu_map_75x45cm_150dpi.png", optimize=True)

print("Re-rendering 300 DPI...")
p300 = create_master_poster(dpi=300)
p300.save("public/msu_map_75x45cm_300dpi.jpg", quality=95, optimize=True)
p300.save("public/msu_map_75x45cm_300dpi.png")
print("Finished re-rendering master posters!")
