import os
import subprocess
import json
import glob
import re

SOURCE_DIR = "/Users/tanishqpandey/Movies/Top Tier Photos"
FULL_DIR = "assets/images/full"
THUMB_DIR = "assets/images/thumbs"

os.makedirs(FULL_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)

files = sorted(os.listdir(SOURCE_DIR))
valid_files = [f for f in files if f.lower().endswith(('.heic', '.jpg', '.jpeg', '.png')) and not f.startswith('.')]

print(f"Found {len(valid_files)} photos in source directory.")

def get_metadata(filepath):
    meta = {
        "camera": "Pro Mobile Camera",
        "lens": "Wide Prime",
        "focal": "24mm equivalent",
        "aperture": "f/1.8",
        "shutter": "1/250s",
        "iso": "ISO 50",
        "date": "2025"
    }
    
    # Run sips
    try:
        sips_out = subprocess.check_output(["sips", "-g", "make", "-g", "model", filepath], text=True)
        make, model = "", ""
        for line in sips_out.splitlines():
            line = line.strip()
            if line.startswith("make:"):
                make = line.split(":", 1)[1].strip()
            elif line.startswith("model:"):
                model = line.split(":", 1)[1].strip()
        if model:
            if make and make.lower() not in model.lower():
                meta["camera"] = f"{make} {model}"
            else:
                meta["camera"] = model
    except Exception as e:
        pass

    # Run mdls
    try:
        mdls_cmd = [
            "mdls",
            "-name", "kMDItemFocalLength",
            "-name", "kMDItemISOSpeed",
            "-name", "kMDItemExposureTimeSeconds",
            "-name", "kMDItemFNumber",
            "-name", "kMDItemContentCreationDate",
            filepath
        ]
        mdls_out = subprocess.check_output(mdls_cmd, text=True)
        for line in mdls_out.splitlines():
            line = line.strip()
            if "kMDItemFocalLength" in line and "(null)" not in line:
                val = line.split("=")[-1].strip()
                try:
                    fval = float(val)
                    meta["focal"] = f"{round(fval, 1)}mm"
                except:
                    pass
            elif "kMDItemISOSpeed" in line and "(null)" not in line:
                val = line.split("=")[-1].strip()
                try:
                    meta["iso"] = f"ISO {int(float(val))}"
                except:
                    pass
            elif "kMDItemExposureTimeSeconds" in line and "(null)" not in line:
                val = line.split("=")[-1].strip()
                try:
                    exp = float(val)
                    if exp < 1.0 and exp > 0:
                        denom = round(1.0 / exp)
                        meta["shutter"] = f"1/{denom}s"
                    else:
                        meta["shutter"] = f"{round(exp, 1)}s"
                except:
                    pass
            elif "kMDItemFNumber" in line and "(null)" not in line:
                val = line.split("=")[-1].strip()
                try:
                    meta["aperture"] = f"f/{round(float(val), 1)}"
                except:
                    pass
            elif "kMDItemContentCreationDate" in line and "(null)" not in line:
                val = line.split("=")[-1].strip()
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', val)
                if date_match:
                    meta["date"] = date_match.group(1)
    except Exception as e:
        pass

    return meta

categories = ["Editorial", "Street & Nocturne", "Architecture & Form", "Nature & Landscape", "Analog & Film"]
titles_pool = [
    "Golden Mirage", "Luminescence", "Solitude in Concrete", "Prism Drift",
    "Nocturnal Echoes", "Subtle Horizons", "Atmospheric Haze", "Vivid Resonance",
    "Transient Lights", "Silent Geometry", "Urban Reverie", "Chroma Flare",
    "Shadow Play", "Velvet Dusk", "Morning Cascade", "Monochrome Pulse",
    "Ephemeral Bloom", "Drifting Solitude", "Reflective Solace", "Midnight Glow",
    "Prismatic Flow", "Static Whispers", "Architectonic Void", "Ethereal Ray",
    "Candid Vignette", "Subterranean Radiance", "Sunlight Fragment", "Quietude",
    "Parallel Dimensions", "Neon Mirage", "Wandering Shadows", "Aperture Dreams",
    "Fluid Contours", "Golden Hour Study", "Symmetry & Silence", "Velvet Echoes",
    "Urban Solace", "Kinetic Light", "Oblique Horizon", "Chroma Horizon",
    "Minimalist Form", "Gilded Reflection", "Prism Horizon", "Twilight Cadence",
    "Spectral Drift", "Solitary Vision", "Luminous Stillness", "Radiant Passage"
]

portfolio_items = []

for idx, fname in enumerate(valid_files):
    src_path = os.path.join(SOURCE_DIR, fname)
    base_name = os.path.splitext(fname)[0].replace(" ", "_").replace("(", "").replace(")", "")
    full_jpg = f"{base_name}.jpg"
    thumb_jpg = f"{base_name}_thumb.jpg"
    
    full_dest = os.path.join(FULL_DIR, full_jpg)
    thumb_dest = os.path.join(THUMB_DIR, thumb_jpg)
    
    # Convert to full if not exists
    if not os.path.exists(full_dest):
        print(f"Converting [{idx+1}/{len(valid_files)}] {fname} -> {full_jpg}...")
        subprocess.run(["sips", "-s", "format", "jpeg", src_path, "-Z", "1920", "--out", full_dest], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    # Convert to thumb if not exists
    if not os.path.exists(thumb_dest):
        subprocess.run(["sips", "-s", "format", "jpeg", src_path, "-Z", "720", "--out", thumb_dest], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
    meta = get_metadata(src_path)
    title = titles_pool[idx % len(titles_pool)]
    cat = categories[idx % len(categories)]
    
    item = {
        "id": idx + 1,
        "filename": fname,
        "title": title,
        "category": cat,
        "image": f"assets/images/full/{full_jpg}",
        "thumb": f"assets/images/thumbs/{thumb_jpg}",
        "exif": meta
    }
    portfolio_items.append(item)

print(f"Successfully processed {len(portfolio_items)} photos.")

# Save portfolio-data.js
js_content = f"""/**
 * Tanishq Pandey - Photography Portfolio Data Catalog
 * Automatically extracted from high-resolution photo archive
 */

export const PORTFOLIO_CONFIG = {{
  photographer: "Tanishq Pandey",
  tagline: "Fine Art, Editorial & Documentary Photography",
  location: "New Delhi & Worldwide",
  bio: "Capturing the interplay between artificial illumination, geometric symmetry, and intimate human stillness. Specializing in editorial campaigns, brutalist urban studies, and luminous chromatic experimentation.",
  year: "2024–2026",
  socials: {{
    instagram: "https://www.instagram.com/taxisxhqqq/",
    email: "pandeytanish53@gmail.com"
  }},
  gear: [
    {{ name: "Apple iPhone 16 Plus", desc: "48MP Fusion Camera, 24mm f/1.6, Sensor-shift OIS" }},
    {{ name: "Samsung Galaxy S23", desc: "50MP Dual Pixel, 3x Telephoto f/2.4, Nightography" }},
    {{ name: "Apple iPhone 12", desc: "Ultra-wide 13mm f/2.4, Deep Fusion" }},
    {{ name: "Prime Glass & Filters", desc: "Prism dispersion filters, CPL & Black Mist diffusion" }}
  ]
}};

// Centerpiece 12 Featured Photos for the Interactive Scroll Fan Cards
export const FAN_CARDS_DATA = {json.dumps(portfolio_items[:12], indent=2)};

// Complete Catalog of Works for the Curated Gallery & Lightbox
export const ALL_PHOTOS_DATA = {json.dumps(portfolio_items, indent=2)};
"""

with open("assets/js/portfolio-data.js", "w") as f:
    f.write(js_content)

print("assets/js/portfolio-data.js generated successfully!")
