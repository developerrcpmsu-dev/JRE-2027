import json
import base64

with open("public/msu_buildings_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

buildings = data["buildings"]

# Read the 150dpi map jpg as base64 for embedding so SVG is 100% self-contained
with open("public/msu_map_75x45cm_150dpi.jpg", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="750mm" height="450mm" viewBox="0 0 7500 4500" style="background:#ffffff; font-family:'Sarabun', 'Prompt', 'Leelawadee UI', Tahoma, sans-serif;">
  <defs>
    <style>
      .title {{ font-size: 72px; font-weight: bold; fill: #0f2942; }}
      .sub-en {{ font-size: 34px; font-weight: bold; fill: #d49b0e; letter-spacing: 1px; }}
      .sub-th {{ font-size: 28px; fill: #334155; }}
      .meta-lbl {{ font-size: 20px; fill: #64748b; }}
      .meta-val {{ font-size: 22px; font-weight: bold; fill: #0f2942; }}
      .badge-txt {{ font-size: 20px; font-weight: bold; fill: #ffffff; text-anchor: middle; dominant-baseline: central; font-family: Arial, sans-serif; }}
      .dir-title {{ font-size: 30px; font-weight: bold; fill: #ffffff; }}
      .dir-sub {{ font-size: 20px; fill: #94a3b8; }}
      .b-name-th {{ font-size: 20px; font-weight: bold; fill: #0f172a; }}
      .b-name-en {{ font-size: 16px; fill: #64748b; }}
      .footer-txt {{ font-size: 19px; fill: #cbd5e1; }}
      .footer-gold {{ font-size: 20px; font-weight: bold; fill: #d4af37; text-anchor: end; }}
      .scale-txt {{ font-size: 20px; font-weight: bold; fill: #0f2942; }}
    </style>
  </defs>

  <!-- Base High-Resolution Raster Render -->
  <image x="0" y="0" width="7500" height="4500" xlink:href="data:image/jpeg;base64,{img_b64}" preserveAspectRatio="none" />

  <!-- Vector Precision Border & Ticks Overlay (75cm x 45cm) -->
  <rect x="38" y="38" width="7424" height="4424" fill="none" stroke="#94a3b8" stroke-width="3" />
  <rect x="48" y="48" width="7404" height="4404" fill="none" stroke="#e2e8f0" stroke-width="2" />
</svg>'''

with open("public/msu_map_75x45cm.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

print("Saved public/msu_map_75x45cm.svg successfully!")
