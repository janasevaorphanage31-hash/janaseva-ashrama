import re

path = r"D:\jana_build\src\lib\seed-data.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    'slug: "meal",\n    name: "Sponsor a Warm Meal (Annadana)",\n    description: "Wholesome hot lunch or dinner - fragrant rice, nutritious lentils (dal), fresh seasonal vegetables, and warm love for 1 child.",\n    unitPrice: 100,\n    icon: "meal",\n    sortOrder: 1,\n    category: "Annadana",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "meal",\n    imageUrl: "/media/food.jpg"':
    'slug: "meal",\n    name: "Sponsor a Warm Meal (Annadana)",\n    description: "Wholesome hot lunch or dinner - fragrant rice, nutritious lentils (dal), fresh seasonal vegetables, and warm love for 1 child.",\n    unitPrice: 100,\n    icon: "meal",\n    sortOrder: 1,\n    category: "Annadana",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "meal",\n    imageUrl: "/media/annadana-hall-hd.jpg"',

    'slug: "fruits",\n    name: "Fresh Fruit & Milk Basket",\n    description: "Fresh seasonal orchard fruits (apples, bananas, oranges) and pure dairy providing vital daily calcium, vitamins, and morning smiles.",\n    unitPrice: 150,\n    icon: "fruits",\n    sortOrder: 2,\n    category: "Annadana",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "basket",\n    imageUrl: "/media/fruits.jpg"':
    'slug: "fruits",\n    name: "Fresh Fruit & Milk Basket",\n    description: "Fresh seasonal orchard fruits (apples, bananas, oranges) and pure dairy providing vital daily calcium, vitamins, and morning smiles.",\n    unitPrice: 150,\n    icon: "fruits",\n    sortOrder: 2,\n    category: "Annadana",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "basket",\n    imageUrl: "/media/banana-leaf-feast.jpg"',

    'slug: "school-kit",\n    name: "Complete School Kit & Bag (Vidya)",\n    description: "Sturdy school backpack, complete set of notebooks, pencil box, geometry tools, and stationery with a child\'s name on it.",\n    unitPrice: 250,\n    icon: "school-kit",\n    sortOrder: 3,\n    category: "Vidya",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "kit",\n    imageUrl: "/media/school-kit.jpg"':
    'slug: "school-kit",\n    name: "Complete School Kit & Bag (Vidya)",\n    description: "Sturdy school backpack, complete set of notebooks, pencil box, geometry tools, and stationery with a child\'s name on it.",\n    unitPrice: 250,\n    icon: "school-kit",\n    sortOrder: 3,\n    category: "Vidya",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "kit",\n    imageUrl: "/media/art-drawings.jpg"',

    'slug: "education",\n    name: "Evening Tutoring & Learning Support",\n    description: "Coursebooks, syllabus reference guides, and dedicated small-group evening tutoring in English, Mathematics, and Science.",\n    unitPrice: 250,\n    icon: "education",\n    sortOrder: 4,\n    category: "Vidya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "learner unit",\n    imageUrl: "/media/education.jpg"':
    'slug: "education",\n    name: "Evening Tutoring & Learning Support",\n    description: "Coursebooks, syllabus reference guides, and dedicated small-group evening tutoring in English, Mathematics, and Science.",\n    unitPrice: 250,\n    icon: "education",\n    sortOrder: 4,\n    category: "Vidya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "learner unit",\n    imageUrl: "/media/abacus-math-class.jpg"',

    'slug: "uniform",\n    name: "School Uniform & Sturdy Footwear",\n    description: "Tailored pair of school uniforms, durable black leather shoes, socks, and comfortable everyday clothes.",\n    unitPrice: 400,\n    icon: "uniform",\n    sortOrder: 5,\n    category: "Vidya",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "uniform set",\n    imageUrl: "/media/learning.jpg"':
    'slug: "uniform",\n    name: "School Uniform & Sturdy Footwear",\n    description: "Tailored pair of school uniforms, durable black leather shoes, socks, and comfortable everyday clothes.",\n    unitPrice: 400,\n    icon: "uniform",\n    sortOrder: 5,\n    category: "Vidya",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "uniform set",\n    imageUrl: "/media/boys-group-red-assembly.jpg"',

    'slug: "health",\n    name: "Pediatric Health & Doctor Care (Arogya)",\n    description: "Preventative pediatric health check-ups, doctor consultations, routine prescription medicines, and first-aid replenishments.",\n    unitPrice: 500,\n    icon: "health",\n    sortOrder: 6,\n    category: "Arogya",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "health checkup",\n    imageUrl: "/media/health.jpg"':
    'slug: "health",\n    name: "Pediatric Health & Doctor Care (Arogya)",\n    description: "Preventative pediatric health check-ups, doctor consultations, routine prescription medicines, and first-aid replenishments.",\n    unitPrice: 500,\n    icon: "health",\n    sortOrder: 6,\n    category: "Arogya",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "health checkup",\n    imageUrl: "/media/yoga-day.jpg"',

    'slug: "health-camp",\n    name: "Rural Health & Eye Screening Camp Kit",\n    description: "Portable diagnostics, blood pressure vitals, eye refraction testing kits, and essential emergency medicines for community outreach.",\n    unitPrice: 1200,\n    icon: "health",\n    sortOrder: 61,\n    category: "Arogya",\n    todayNeed: false,\n    featured: true,\n    unitLabel: "camp kit",\n    imageUrl: "/media/wellness.jpg"':
    'slug: "health-camp",\n    name: "Rural Health & Eye Screening Camp Kit",\n    description: "Portable diagnostics, blood pressure vitals, eye refraction testing kits, and essential emergency medicines for community outreach.",\n    unitPrice: 1200,\n    icon: "health",\n    sortOrder: 61,\n    category: "Arogya",\n    todayNeed: false,\n    featured: true,\n    unitLabel: "camp kit",\n    imageUrl: "/media/yoga-tadasana.jpg"',

    'slug: "clean-water",\n    name: "Safe Drinking Water & Sanitation Unit",\n    description: "Heavy-duty water purification filter replacements, safe drinking dispensers, and child hygiene sanitization units for disease prevention.",\n    unitPrice: 350,\n    icon: "essentials",\n    sortOrder: 62,\n    category: "Arogya",\n    todayNeed: true,\n    featured: false,\n    unitLabel: "filter unit",\n    imageUrl: "/media/wellness.jpg"':
    'slug: "clean-water",\n    name: "Safe Drinking Water & Sanitation Unit",\n    description: "Heavy-duty water purification filter replacements, safe drinking dispensers, and child hygiene sanitization units for disease prevention.",\n    unitPrice: 350,\n    icon: "essentials",\n    sortOrder: 62,\n    category: "Arogya",\n    todayNeed: true,\n    featured: false,\n    unitLabel: "filter unit",\n    imageUrl: "/media/lawn-cheer-circle.jpg"',

    'slug: "essentials",\n    name: "Personal Hygiene & Care Sanctuary",\n    description: "Gentle bath soaps, toothpaste, toothbrush, coconut hair oil, shampoo, clean cotton towel, and grooming toiletries.",\n    unitPrice: 300,\n    icon: "essentials",\n    sortOrder: 7,\n    category: "Ashraya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "care kit",\n    imageUrl: "/media/essentials.jpg"':
    'slug: "essentials",\n    name: "Personal Hygiene & Care Sanctuary",\n    description: "Gentle bath soaps, toothpaste, toothbrush, coconut hair oil, shampoo, clean cotton towel, and grooming toiletries.",\n    unitPrice: 300,\n    icon: "essentials",\n    sortOrder: 7,\n    category: "Ashraya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "care kit",\n    imageUrl: "/media/evening-snacks-gathering.jpg"',

    'slug: "bedding",\n    name: "Cozy Bedding & Warm Blanket Set",\n    description: "Clean cotton mattress bedsheet, soft pillow with cover, and a warm winter fleece blanket for peaceful, restorative sleep.",\n    unitPrice: 600,\n    icon: "bedding",\n    sortOrder: 8,\n    category: "Ashraya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "bedding set",\n    imageUrl: "/media/garden.jpg"':
    'slug: "bedding",\n    name: "Cozy Bedding & Warm Blanket Set",\n    description: "Clean cotton mattress bedsheet, soft pillow with cover, and a warm winter fleece blanket for peaceful, restorative sleep.",\n    unitPrice: 600,\n    icon: "bedding",\n    sortOrder: 8,\n    category: "Ashraya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "bedding set",\n    imageUrl: "/media/evening-satsang.jpg"',

    'slug: "activities",\n    name: "Sports, Arts & Childhood Play Kit",\n    description: "Cricket bats, footballs, carrom boards, drawing sketchbooks, watercolours, and craft supplies for joyful weekends.",\n    unitPrice: 350,\n    icon: "activities",\n    sortOrder: 9,\n    category: "Ashraya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "activity kit",\n    imageUrl: "/media/play.jpg"':
    'slug: "activities",\n    name: "Sports, Arts & Childhood Play Kit",\n    description: "Cricket bats, footballs, carrom boards, drawing sketchbooks, watercolours, and craft supplies for joyful weekends.",\n    unitPrice: 350,\n    icon: "activities",\n    sortOrder: 9,\n    category: "Ashraya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "activity kit",\n    imageUrl: "/media/carrom-play.jpg"',

    'slug: "digital-lab",\n    name: "Digital Literacy & Computer Skills",\n    description: "One month of computer lab access, educational typing software, coding fundamentals, and safe internet research mentoring.",\n    unitPrice: 750,\n    icon: "digital-lab",\n    sortOrder: 10,\n    category: "Vidya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "student month",\n    imageUrl: "/media/poster.jpg"':
    'slug: "digital-lab",\n    name: "Digital Literacy & Computer Skills",\n    description: "One month of computer lab access, educational typing software, coding fundamentals, and safe internet research mentoring.",\n    unitPrice: 750,\n    icon: "digital-lab",\n    sortOrder: 10,\n    category: "Vidya",\n    todayNeed: false,\n    featured: false,\n    unitLabel: "student month",\n    imageUrl: "/media/mentorship-story-circle.jpg"',

    'slug: "memorial-meal",\n    name: "Sacred Remembrance Meal (Smrithi Seva)",\n    description: "Honour the sacred memory of beloved parents or elders by feeding 10 children a wholesome commemorative hot meal.",\n    unitPrice: 1000,\n    icon: "meal",\n    sortOrder: 11,\n    category: "Celebrations",\n    todayNeed: false,\n    featured: true,\n    unitLabel: "10 children feast",\n    imageUrl: "/media/food.jpg"':
    'slug: "memorial-meal",\n    name: "Sacred Remembrance Meal (Smrithi Seva)",\n    description: "Honour the sacred memory of beloved parents or elders by feeding 10 children a wholesome commemorative hot meal.",\n    unitPrice: 1000,\n    icon: "meal",\n    sortOrder: 11,\n    category: "Celebrations",\n    todayNeed: false,\n    featured: true,\n    unitLabel: "10 children feast",\n    imageUrl: "/media/boys-meal-gratitude.jpg"',

    'slug: "birthday-feast",\n    name: "Grand Birthday Celebration Feast (Utsav)",\n    description: "Sponsor a joyous festive lunch with special sweets (Payasam / Laddoo) for all 25 Ashrama children on your birthday or anniversary.",\n    unitPrice: 1500,\n    icon: "birthday-feast",\n    sortOrder: 12,\n    category: "Celebrations",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "ashrama feast",\n    imageUrl: "/media/food.jpg"':
    'slug: "birthday-feast",\n    name: "Grand Birthday Celebration Feast (Utsav)",\n    description: "Sponsor a joyous festive lunch with special sweets (Payasam / Laddoo) for all 25 Ashrama children on your birthday or anniversary.",\n    unitPrice: 1500,\n    icon: "birthday-feast",\n    sortOrder: 12,\n    category: "Celebrations",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "ashrama feast",\n    imageUrl: "/media/birthday-cake-celebration.jpg"',

    'slug: "pantry",\n    name: "Monthly Kitchen Pantry Staples (50kg Rice & Dal)",\n    description: "Wholesale sacks of premium Sona Masoori rice, Toor dal, pure cooking oil, and lentils for the main Ashrama kitchen.",\n    unitPrice: 2500,\n    icon: "pantry",\n    sortOrder: 13,\n    category: "Annadana",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "50kg staples",\n    imageUrl: "/media/pantry.jpg"':
    'slug: "pantry",\n    name: "Monthly Kitchen Pantry Staples (50kg Rice & Dal)",\n    description: "Wholesale sacks of premium Sona Masoori rice, Toor dal, pure cooking oil, and lentils for the main Ashrama kitchen.",\n    unitPrice: 2500,\n    icon: "pantry",\n    sortOrder: 13,\n    category: "Annadana",\n    todayNeed: true,\n    featured: true,\n    unitLabel: "50kg staples",\n    imageUrl: "/media/banana-leaf-feast.jpg"',
}

# Update tiers
tier_maps = {
    'slug: "tier-1-full-day",': ('/media/prayer-meals.jpg', '/media/annadana-hall-hd.jpg'),
    'slug: "tier-1-two-times",': ('/media/prayer-meals.jpg', '/media/annadana-hall-hd.jpg'),
    'slug: "tier-1-one-time",': ('/media/prayer-meals.jpg', '/media/banana-leaf-feast.jpg'),
    'slug: "tier-2-month-4",': ('/media/prayer-meals.jpg', '/media/banana-leaf-feast.jpg'),
    'slug: "tier-2-month-2",': ('/media/prayer-meals.jpg', '/media/prayer-meals.jpg'),
    'slug: "tier-2-month-1",': ('/media/prayer-meals.jpg', '/media/boys-meal-gratitude.jpg'),
    'slug: "tier-3-cloth-8",': ('/media/evening-circle.jpg', '/media/boys-group-red-assembly.jpg'),
    'slug: "tier-3-cloth-6",': ('/media/evening-circle.jpg', '/media/boys-assembly-maroon.jpg'),
    'slug: "tier-3-cloth-3",': ('/media/evening-circle.jpg', '/media/flag-assembly.jpg'),
    'slug: "tier-4-edu-12",': ('/media/art-schooling.jpg', '/media/art-drawings.jpg'),
    'slug: "tier-4-edu-8",': ('/media/art-schooling.jpg', '/media/essay-competition.jpg'),
    'slug: "tier-4-edu-4",': ('/media/art-schooling.jpg', '/media/handprint-workshop.jpg'),
    'slug: "tier-5-edu-year-3",': ('/media/art-schooling.jpg', '/media/excellence-certificates.jpg'),
    'slug: "tier-5-edu-year-2",': ('/media/art-schooling.jpg', '/media/excellence-certificates.jpg'),
    'slug: "tier-5-edu-year-1",': ('/media/art-schooling.jpg', '/media/excellence-certificates.jpg'),
}

for k, v in replacements.items():
    if k in content:
        content = content.replace(k, v)
        print(f"Replaced {k[:30]}...")

# Also replace tier item images
for tier_slug, (old_img, new_img) in tier_maps.items():
    pattern = rf'({re.escape(tier_slug)}[\s\S]*?imageUrl:\s*)"{re.escape(old_img)}"'
    content = re.sub(pattern, rf'\1"{new_img}"', content)
    print(f"Replaced tier image for {tier_slug} -> {new_img}")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated seed-data.ts successfully!")
