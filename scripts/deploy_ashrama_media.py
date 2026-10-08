import os
import shutil
import json

SOURCE_DIR = r"D:\jana_build\public\media\ashrama"
DEST_DIR = r"D:\jana_build\public\media"

# Semantic mappings
FILE_MAP = {
    # 1. Annadana & Meals
    "WhatsApp Image 2026-10-08 at 5.49.53 PM (1).jpeg": "annadana-hall-hd.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.38 PM.jpeg": "prayer-meals.jpg",
    "WhatsApp Image 2026-10-08 at 5.50.03 PM.jpeg": "banana-leaf-feast.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.50 PM (1).jpeg": "annadana-leaves-prayer.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.54 PM (1).jpeg": "ganesha-annadana-feast.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.37 PM.jpeg": "boys-meal-gratitude.jpg",

    # 2. Master Group Photos
    "WhatsApp Image 2026-10-08 at 5.50.01 PM.jpeg": "boys-group-altar.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.39 PM (1).jpeg": "boys-group-red-assembly.jpg",
    "WhatsApp Image 2026-10-08 at 5.50.00 PM.jpeg": "boys-assembly-maroon.jpg",

    # 3. Celebrations & Birthday
    "WhatsApp Image 2026-10-08 at 5.49.57 PM.jpeg": "birthday-cake-celebration.jpg",
    "WhatsApp Image 2026-10-08 at 5.50.02 PM.jpeg": "birthday-donor-roses.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.59 PM.jpeg": "birthday-candle-lighting.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.56 PM.jpeg": "birthday-wishes-orange.jpg",
    "WhatsApp Image 2026-10-08 at 5.50.02 PM (1).jpeg": "birthday-feast-annadana.jpg",

    # 4. National & Cultural Celebrations
    "WhatsApp Image 2026-10-08 at 5.49.52 PM (1).jpeg": "flag-hoisting-rangoli.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.41 PM.jpeg": "flag-assembly.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.58 PM (1).jpeg": "flag-salute-tall.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.37 PM (1).jpeg": "kannada-rajyotsava.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.51 PM (1).jpeg": "quit-india-assembly.jpg",
    "WhatsApp Image 2026-10-08 at 5.50.02 PM (2).jpeg": "freedom-fighters-tribute.jpg",
    "WhatsApp Image 2026-10-06 at 3.26.15 PM.jpeg": "gandhi-jayanti.jpg",
    "WhatsApp Image 2026-10-06 at 3.29.09 PM.jpeg": "constitution-day.jpg",

    # 5. Religious & Spiritual Festivals
    "WhatsApp Image 2026-10-08 at 5.49.47 PM.jpeg": "diwali-deepas.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.40 PM (1).jpeg": "ganesha-chaturthi.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.49 PM.jpeg": "sri-rama-pooja.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.46 PM.jpeg": "shivaratri-pooja.jpg",
    "WhatsApp Image 2026-10-06 at 3.29.33 PM.jpeg": "saraswathi-library-pooja.jpg",

    # 6. Yoga, Wellness & Health
    "WhatsApp Image 2026-10-08 at 5.49.54 PM.jpeg": "yoga-day.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.58 PM (2).jpeg": "yoga-tadasana.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.58 PM.jpeg": "yoga-sarvangasana.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.55 PM.jpeg": "yoga-padahastasana.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.40 PM.jpeg": "morning-assembly-pt.jpg",

    # 7. Education, Vidya & Art
    "WhatsApp Image 2026-10-08 at 5.49.50 PM.jpeg": "abacus-math-class.jpg",
    "WhatsApp Image 2026-10-06 at 3.28.00 PM.jpeg": "essay-competition.jpg",
    "WhatsApp Image 2026-10-06 at 3.29.45 PM.jpeg": "art-drawings.jpg",
    "WhatsApp Image 2026-10-06 at 3.28.13 PM.jpeg": "handprint-workshop.jpg",
    "WhatsApp Image 2026-10-08 at 5.50.01 PM (1).jpeg": "excellence-certificates.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.53 PM (2).jpeg": "mentorship-story-circle.jpg",

    # 8. Sports & Childhood Joy
    "WhatsApp Image 2026-10-06 at 3.26.17 PM.jpeg": "sports-race.jpg",
    "WhatsApp Image 2026-10-06 at 3.29.55 PM.jpeg": "swimming-pool-full.jpg",
    "WhatsApp Image 2026-10-06 at 3.28.46 PM.jpeg": "lawn-cheer-circle.jpg",
    "WhatsApp Image 2026-10-06 at 3.28.57 PM.jpeg": "carrom-play.jpg",
    "WhatsApp Image 2026-10-06 at 3.28.24 PM.jpeg": "carrom-tournament.jpg",
    "WhatsApp Image 2026-10-06 at 3.26.18 PM.jpeg": "evening-satsang.jpg",
    "WhatsApp Image 2026-10-08 at 5.49.38 PM (1).jpeg": "evening-snacks-gathering.jpg",

    # 9. Videos
    "WhatsApp Video 2026-10-06 at 3.26.05 PM.mp4": "video-chess-boys.mp4",
    "WhatsApp Video 2026-10-06 at 3.26.12 PM.mp4": "video-chant-prayer.mp4",
}

# Also update existing general names with authentic photos
FALLBACK_REPLACEMENTS = {
    "food.jpg": "WhatsApp Image 2026-10-08 at 5.49.53 PM (1).jpeg",
    "meals.jpg": "WhatsApp Image 2026-10-08 at 5.50.03 PM.jpeg",
    "nutrition.jpg": "WhatsApp Image 2026-10-08 at 5.49.38 PM.jpeg",
    "art-schooling.jpg": "WhatsApp Image 2026-10-06 at 3.29.45 PM.jpeg",
    "learning.jpg": "WhatsApp Image 2026-10-06 at 3.28.00 PM.jpeg",
    "education.jpg": "WhatsApp Image 2026-10-08 at 5.49.50 PM.jpeg",
    "activities.jpg": "WhatsApp Image 2026-10-06 at 3.28.57 PM.jpeg",
    "play.jpg": "WhatsApp Image 2026-10-06 at 3.26.17 PM.jpeg",
    "swimming-outing.jpg": "WhatsApp Image 2026-10-06 at 3.29.55 PM.jpeg",
    "festival-pooja.jpg": "WhatsApp Image 2026-10-08 at 5.49.40 PM (1).jpeg",
    "evening-circle.jpg": "WhatsApp Image 2026-10-06 at 3.26.18 PM.jpeg",
    "community.jpg": "WhatsApp Image 2026-10-08 at 5.49.41 PM.jpeg",
    "poster.jpg": "WhatsApp Image 2026-10-08 at 5.49.53 PM (1).jpeg",
    "poster-desktop.jpg": "WhatsApp Image 2026-10-08 at 5.49.53 PM (1).jpeg",
    "ashrama_video.mp4": "WhatsApp Video 2026-10-06 at 3.26.12 PM.mp4",
    "ashrama_journey.mp4": "WhatsApp Video 2026-10-06 at 3.26.05 PM.mp4",
}

copied_count = 0

print("1. Deploying semantic media files...")
for src_name, dst_name in FILE_MAP.items():
    src_path = os.path.join(SOURCE_DIR, src_name)
    dst_path = os.path.join(DEST_DIR, dst_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        copied_count += 1
        print(f"  [OK] {src_name} -> {dst_name}")
    else:
        print(f"  [WARN] Source not found: {src_name}")

print("\n2. Updating legacy fallback names with authentic photos...")
for legacy_name, src_name in FALLBACK_REPLACEMENTS.items():
    src_path = os.path.join(SOURCE_DIR, src_name)
    dst_path = os.path.join(DEST_DIR, legacy_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"  [OK] Updated legacy {legacy_name} from {src_name}")

# Now build a comprehensive gallery catalog JSON
meta_data_file = r"D:\jana_build\scripts\ashrama_media_meta.json"
meta_list = json.load(open(meta_data_file, "r"))

# Invert FILE_MAP to get dst_name from src_name
src_to_dst = {k: v for k, v in FILE_MAP.items()}

gallery_items = []
for idx, item in enumerate(meta_list):
    if item.get("is_dup"):
        continue
    name = item["name"]
    is_video = name.endswith(".mp4")
    semantic_name = src_to_dst.get(name, name)
    url = f"/media/{semantic_name}" if semantic_name in FILE_MAP.values() else f"/media/ashrama/{name}"
    
    # Categorization logic
    cat = "Moments"
    title = "Ashrama Boy Daily Life"
    if "prayer" in semantic_name or "meal" in semantic_name or "annadana" in semantic_name or "feast" in semantic_name:
        cat = "Annadana & Meals"
        title = "Nutritious Meals & Gratitude Prayer"
    elif "birthday" in semantic_name or "cake" in semantic_name:
        cat = "Celebrations"
        title = "Birthday Celebration & Well-Wisher Feast"
    elif "flag" in semantic_name or "india" in semantic_name or "rajyotsava" in semantic_name or "gandhi" in semantic_name or "constitution" in semantic_name:
        cat = "National Festivals"
        title = "National Pride & Patriotic Celebration"
    elif "pooja" in semantic_name or "diwali" in semantic_name or "ganesha" in semantic_name or "rama" in semantic_name or "shiva" in semantic_name:
        cat = "Spiritual & Festive"
        title = "Traditional Festival & Cultural Pooja"
    elif "yoga" in semantic_name:
        cat = "Yoga & Health"
        title = "International Yoga Day & Physical Wellness"
    elif "draw" in semantic_name or "art" in semantic_name or "math" in semantic_name or "essay" in semantic_name or "school" in semantic_name or "cert" in semantic_name:
        cat = "Vidya & Education"
        title = "Academic Learning, Art & Skill Building"
    elif "race" in semantic_name or "carrom" in semantic_name or "swim" in semantic_name or "lawn" in semantic_name or "chess" in semantic_name:
        cat = "Sports & Play"
        title = "Courtyard Games, Sports & Joyful Recreation"

    gallery_items.append({
        "id": f"ashrama-media-{idx+1}",
        "fileName": name,
        "semanticName": semantic_name,
        "url": url,
        "type": "video" if is_video else "image",
        "category": cat,
        "title": title,
        "width": item.get("dims")[0] if item.get("dims") else None,
        "height": item.get("dims")[1] if item.get("dims") else None,
        "sizeBytes": item["size"]
    })

gallery_json_path = os.path.join(DEST_DIR, "ashrama-gallery.json")
with open(gallery_json_path, "w", encoding="utf-8") as f:
    json.dump(gallery_items, f, indent=2)

print(f"\n3. Created ashrama-gallery.json with {len(gallery_items)} unique authentic items at {gallery_json_path}!")
