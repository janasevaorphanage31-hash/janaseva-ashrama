import os
import json

CURATED_CATALOG = [
    {
        "id": "gallery-1",
        "semanticName": "annadana-hall-hd.jpg",
        "url": "/media/annadana-hall-hd.jpg",
        "title": "Morning Annadana Meal Prayer (Full Hall)",
        "kannada": "ಊಟಕ್ಕೂ ಮುನ್ನ ಸಾಮೂಹಿಕ ಅನ್ನದಾನ ಪ್ರಾರ್ಥನೆ",
        "category": "Annadana & Meals",
        "type": "image",
        "featured": True,
        "description": "All 25 resident boys folding hands before steel meal plates, chanting shlokas of gratitude before breakfast in our main hall."
    },
    {
        "id": "gallery-2",
        "semanticName": "banana-leaf-feast.jpg",
        "url": "/media/banana-leaf-feast.jpg",
        "title": "Traditional Festival Banana Leaf Feast (Bale Ele Oota)",
        "kannada": "ಸಾಂಪ್ರದಾಯಿಕ ಬಾಳೆ ಎಲೆ ಹಬ್ಬದ ಊಟ",
        "category": "Annadana & Meals",
        "type": "image",
        "featured": True,
        "description": "Festival Annadana served on fresh green plantain leaves with rice, sambar, seasonal vegetables, sweets, and fresh fruit slices."
    },
    {
        "id": "gallery-3",
        "semanticName": "prayer-meals.jpg",
        "url": "/media/prayer-meals.jpg",
        "title": "Boys in Royal Blue Chanting Shlokas Before Lunch",
        "kannada": "ಮಕ್ಕಳ ಭಕ್ತಿಪೂರ್ವಕ ಪ್ರಾರ್ಥನೆ",
        "category": "Annadana & Meals",
        "type": "image",
        "featured": True,
        "description": "Two neat rows of boys cross-legged on the floor, hands in namaskara mudra reciting universal peace shlokas before lunch."
    },
    {
        "id": "gallery-4",
        "semanticName": "annadana-leaves-prayer.jpg",
        "url": "/media/annadana-leaves-prayer.jpg",
        "title": "Folded Hands Prayer Before Fresh Banana Leaf Lunch",
        "kannada": "ಬಾಳೆ ಎಲೆ ಊಟದ ಮುನ್ನ ಪ್ರಾರ್ಥನೆ",
        "category": "Annadana & Meals",
        "type": "image",
        "featured": False,
        "description": "Devotion and discipline: boys in matching orange uniforms giving thanks for donor support before their festive meal."
    },
    {
        "id": "gallery-5",
        "semanticName": "birthday-cake-celebration.jpg",
        "url": "/media/birthday-cake-celebration.jpg",
        "title": "Birthday Cake Cutting with Well-Wisher & Rose Petals",
        "kannada": "ದಾನಿಗಳ ಜೊತೆ ಹುಟ್ಟುಹಬ್ಬದ ಸಂಭ್ರಮ ಹಾಗೂ ಕೇಕ್ ಕತ್ತರಿಸುವಿಕೆ",
        "category": "Birthdays & Celebrations",
        "type": "image",
        "featured": True,
        "description": "A Bangalore well-wisher celebrating his special day with all 25 boys around a table decorated with fresh red rose petals."
    },
    {
        "id": "gallery-6",
        "semanticName": "birthday-donor-roses.jpg",
        "url": "/media/birthday-donor-roses.jpg",
        "title": "Boys Presenting Red Roses of Gratitude to Birthday Sponsor",
        "kannada": "ಹುಟ್ಟುಹಬ್ಬದ ದಾನಿಗೆ ಗುಲಾಬಿ ಹೂವು ನೀಡಿ ಹಾರೈಸಿದ ಮಕ್ಕಳು",
        "category": "Birthdays & Celebrations",
        "type": "image",
        "featured": True,
        "description": "Smiling faces and pure gratitude as boys hand red roses to their birthday sponsor wishing him long life and prosperity."
    },
    {
        "id": "gallery-7",
        "semanticName": "birthday-candle-lighting.jpg",
        "url": "/media/birthday-candle-lighting.jpg",
        "title": "Lighting the Birthday Candle with Cheering Boys",
        "kannada": "ಮಕ್ಕಳೊಂದಿಗೆ ಹುಟ್ಟುಹಬ್ಬದ ಮೇಣದಬತ್ತಿ ಬೆಳಗಿಸುವ ಕ್ಷಣ",
        "category": "Birthdays & Celebrations",
        "type": "image",
        "featured": False,
        "description": "Celebration time at the Ashrama with balloons, party poppers, birthday cake, and happy songs of blessing."
    },
    {
        "id": "gallery-8",
        "semanticName": "birthday-wishes-orange.jpg",
        "url": "/media/birthday-wishes-orange.jpg",
        "title": "Happy Birthday Banner & Smiling Boys in Orange",
        "kannada": "ಜನ್ಮದಿನದ ಶುಭಾಶಯ ಕೋರಿದ ಮುದ್ದು ಮಕ್ಕಳು",
        "category": "Birthdays & Celebrations",
        "type": "image",
        "featured": False,
        "description": "Boys standing in celebration formation beneath the colorful HAPPY BIRTHDAY garland."
    },
    {
        "id": "gallery-9",
        "semanticName": "video-chant-prayer.mp4",
        "url": "/media/video-chant-prayer.mp4",
        "title": "Live Video: Collective Chanting of Blessings & Shlokas",
        "kannada": "ನೇರ ವಿಡಿಯೋ: ಸಾಮೂಹಿಕ ಶಾಂತಿ ಮಂತ್ರ ಹಾಗೂ ಪ್ರಾರ್ಥನೆ",
        "category": "Live Videos",
        "type": "video",
        "featured": True,
        "description": "Real video of the 25 boys chanting blessings with their caretakers in the Ashrama hall in Bangalore."
    },
    {
        "id": "gallery-10",
        "semanticName": "video-chess-boys.mp4",
        "url": "/media/video-chess-boys.mp4",
        "title": "Live Video: Boys Playing Chess in Pairs on the Floor",
        "kannada": "ನೇರ ವಿಡಿಯೋ: ಚದುರಂಗ ಆಟದಲ್ಲಿ ನಿರತರಾದ ಬಾಲಕರು",
        "category": "Live Videos",
        "type": "video",
        "featured": True,
        "description": "Real footage of resident boys engaged in thoughtful chess matches during weekend recreation."
    },
    {
        "id": "gallery-11",
        "semanticName": "boys-group-altar.jpg",
        "url": "/media/boys-group-altar.jpg",
        "title": "All 25 Resident Boys at the Festive Altar",
        "kannada": "ಪೂಜಾ ಮಂಟಪದ ಮುಂದೆ ಎಲ್ಲಾ 25 ಬಾಲಕರು",
        "category": "Our 25 Boys",
        "type": "image",
        "featured": True,
        "description": "All 25 boys in matching orange uniforms with sacred tilaka standing united before the decorated festive altar."
    },
    {
        "id": "gallery-12",
        "semanticName": "boys-group-red-assembly.jpg",
        "url": "/media/boys-group-red-assembly.jpg",
        "title": "Boys Assembly with National Flag Wall Mural",
        "kannada": "ರಾಷ್ಟ್ರಧ್ವಜ ಭಿತ್ತಿಚಿತ್ರದ ಮುಂದೆ ಬಾಲಕರ ಸಾಲು",
        "category": "Our 25 Boys",
        "type": "image",
        "featured": False,
        "description": "Smart red polo shirts, disciplined assembly lines, and bright smiles under the Indian tricolour mural."
    },
    {
        "id": "gallery-13",
        "semanticName": "flag-hoisting-rangoli.jpg",
        "url": "/media/flag-hoisting-rangoli.jpg",
        "title": "Independence Day Flag Hoisting & Bharat Map Rangoli",
        "kannada": "ಸ್ವಾತಂತ್ರ್ಯ ದಿನಾಚರಣೆ ಹಾಗೂ ತ್ರಿವರ್ಣ ಭಾರತ ನಕಾಶೆ ರಂಗೋಲಿ",
        "category": "Patriotic & National",
        "type": "image",
        "featured": True,
        "description": "Outdoor flag hoisting celebration with handcrafted tricolour map rangoli and boys saluting the national flag."
    },
    {
        "id": "gallery-14",
        "semanticName": "flag-assembly.jpg",
        "url": "/media/flag-assembly.jpg",
        "title": "'India Is Great - Jai Hind' Patriotic Wave",
        "kannada": "'ಭಾರತ ಮಹಾನ್ - ಜೈ ಹಿಂದ್' ಧ್ವಜ ವಂದನೆ",
        "category": "Patriotic & National",
        "type": "image",
        "featured": True,
        "description": "Boys and teachers waving Indian tricolour flags, wearing matching caps and tri-colour wristbands."
    },
    {
        "id": "gallery-15",
        "semanticName": "kannada-rajyotsava.jpg",
        "url": "/media/kannada-rajyotsava.jpg",
        "title": "Karnataka Rajyotsava Yellow-Red Flag Hoisting",
        "kannada": "ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಧ್ವಜಾರೋಹಣ ಹಾಗೂ ಸಂಭ್ರಮಾಚರಣೆ",
        "category": "Patriotic & National",
        "type": "image",
        "featured": True,
        "description": "Celebrating Karnataka pride with yellow-red flags, Bhuvaneshwari pooja, and all children raising fists in unity."
    },
    {
        "id": "gallery-16",
        "semanticName": "quit-india-assembly.jpg",
        "url": "/media/quit-india-assembly.jpg",
        "title": "Quit India Memorial Assembly & Official Banner",
        "kannada": "ಕ್ವಿಟ್ ಇಂಡಿಯಾ ಚಳುವಳಿ ನೆನಪು ಹಾಗೂ ಸಾಲು ಪ್ರಾರ್ಥನೆ",
        "category": "Patriotic & National",
        "type": "image",
        "featured": False,
        "description": "All 20+ boys in matching blue polos saluting the flag before the official Janaseva Samruddhi Society registration banner."
    },
    {
        "id": "gallery-17",
        "semanticName": "constitution-day.jpg",
        "url": "/media/constitution-day.jpg",
        "title": "Samvidhana Dina (Constitution Day) Learning Circle",
        "kannada": "ಸಂವಿಧಾನ ದಿನಾಚರಣೆ ಹಾಗೂ ಮೌಲ್ಯ ಶಿಕ್ಷಣ",
        "category": "Patriotic & National",
        "type": "image",
        "featured": False,
        "description": "Boys and youth mentors sitting in a large U-shape assembly learning constitutional duties, rights, and ethical values."
    },
    {
        "id": "gallery-18",
        "semanticName": "gandhi-jayanti.jpg",
        "url": "/media/gandhi-jayanti.jpg",
        "title": "Gandhi Jayanti Memorial Altar with Brass Deepas",
        "kannada": "ಗಾಂಧಿ ಜಯಂತಿ ಪುಷ್ಪ ನಮನ ಹಾಗೂ ದೀಪ ಬೆಳಗಿಸುವಿಕೆ",
        "category": "Patriotic & National",
        "type": "image",
        "featured": False,
        "description": "Floral tribute, marigold garlands, and traditional brass lamps honouring the Father of the Nation."
    },
    {
        "id": "gallery-19",
        "semanticName": "diwali-deepas.jpg",
        "url": "/media/diwali-deepas.jpg",
        "title": "Diwali Deepotsava: 25 Boys Holding Glowing Clay Oil Lamps",
        "kannada": "ದೀಪಾವಳಿ ದೀಪೋತ್ಸವ: ಹಣತೆ ಹಿಡಿದು ನಗುತ್ತಿರುವ ಮಕ್ಕಳು",
        "category": "Festivals & Spiritual",
        "type": "image",
        "featured": True,
        "description": "Warm yellow festival tees and glowing earthen diyas held in cupped palms, lighting up the children's faces."
    },
    {
        "id": "gallery-20",
        "semanticName": "ganesha-chaturthi.jpg",
        "url": "/media/ganesha-chaturthi.jpg",
        "title": "Lord Ganesha Festival Procession with Saffron Om Flags",
        "kannada": "ಗಣೇಶ ಚತುರ್ಥಿ ಉತ್ಸವ ಹಾಗೂ ಕೇಸರಿ ಧ್ವಜ ಮೆರವಣಿಗೆ",
        "category": "Festivals & Spiritual",
        "type": "image",
        "featured": True,
        "description": "Boys in saffron headbands carrying sacred Om flags in dual columns before the illuminated Lord Ganesha deity."
    },
    {
        "id": "gallery-21",
        "semanticName": "sri-rama-pooja.jpg",
        "url": "/media/sri-rama-pooja.jpg",
        "title": "Sri Rama Pooja Pandal with Saffron Om Stoles",
        "kannada": "ಶ್ರೀ ರಾಮ ಪೂಜಾ ಮಹೋತ್ಸವ ಹಾಗೂ ಕೇಸರಿ ಶಾಲು",
        "category": "Festivals & Spiritual",
        "type": "image",
        "featured": False,
        "description": "Community pooja ceremony with boys and caretakers wearing sacred Om stoles in front of the festive pandal."
    },
    {
        "id": "gallery-22",
        "semanticName": "shivaratri-pooja.jpg",
        "url": "/media/shivaratri-pooja.jpg",
        "title": "Maha Shivaratri Shiva Lingam Altar & Vibhooti Tilak",
        "kannada": "ಮಹಾ ಶಿವರಾತ್ರಿ ಶಿವಲಿಂಗ ಪೂಜೆ ಹಾಗೂ ವಿಭೂತಿ ಧಾರಣೆ",
        "category": "Festivals & Spiritual",
        "type": "image",
        "featured": False,
        "description": "Boys in two rows with sacred vibhooti and kumkuma on forehead praying before the flower-decked Shiva Lingam."
    },
    {
        "id": "gallery-23",
        "semanticName": "saraswathi-library-pooja.jpg",
        "url": "/media/saraswathi-library-pooja.jpg",
        "title": "Ayudha & Saraswathi Library Books Pooja",
        "kannada": "ಸರಸ್ವತಿ ಗ್ರಂಥ ಪೂಜೆ ಹಾಗೂ ಹಣ್ಣು-ಕಾಯಿ ನೈವೇದ್ಯ",
        "category": "Festivals & Spiritual",
        "type": "image",
        "featured": True,
        "description": "Blessing the Ashrama library with banana trees, marigolds, Bhagavad Gita, textbooks, and fruit offerings."
    },
    {
        "id": "gallery-24",
        "semanticName": "yoga-day.jpg",
        "url": "/media/yoga-day.jpg",
        "title": "International Yoga Day: Sukhasana & Chin Mudra Meditation",
        "kannada": "ಅಂತರರಾಷ್ಟ್ರೀಯ ಯೋಗ ದಿನ: ಸುಖಾಸನ ಹಾಗೂ ಧ್ಯಾನ",
        "category": "Yoga & Health",
        "type": "image",
        "featured": True,
        "description": "Boys in blue polos seated in deep meditation with eyes closed and Chin Mudra on colorful striped mats."
    },
    {
        "id": "gallery-25",
        "semanticName": "yoga-tadasana.jpg",
        "url": "/media/yoga-tadasana.jpg",
        "title": "Tadasana Palm Tree Pose Upward Stretch",
        "kannada": "ತಾಡಾಸನ ಯೋಗಾಭ್ಯಾಸ",
        "category": "Yoga & Health",
        "type": "image",
        "featured": False,
        "description": "Boys practicing vertical spinal stretches with interlaced fingers during morning yoga drills."
    },
    {
        "id": "gallery-26",
        "semanticName": "yoga-sarvangasana.jpg",
        "url": "/media/yoga-sarvangasana.jpg",
        "title": "Sarvangasana Shoulderstand Pose on Striped Mats",
        "kannada": "ಸರ್ವಾಂಗಾಸನ ಸಮತೋಲನ ಅಭ್ಯಾಸ",
        "category": "Yoga & Health",
        "type": "image",
        "featured": True,
        "description": "Remarkable flexibility and balance: boys in shoulderstands with feet straight up, smiling during Yoga Day."
    },
    {
        "id": "gallery-27",
        "semanticName": "yoga-padahastasana.jpg",
        "url": "/media/yoga-padahastasana.jpg",
        "title": "Padahastasana Standing Forward Bend Yoga Asana",
        "kannada": "ಪಾದಹಸ್ತಾಸನ ಯೋಗ ಪ್ರದರ್ಶನ",
        "category": "Yoga & Health",
        "type": "image",
        "featured": False,
        "description": "Forward bending postures building flexibility and physical stamina."
    },
    {
        "id": "gallery-28",
        "semanticName": "abacus-math-class.jpg",
        "url": "/media/abacus-math-class.jpg",
        "title": "Abacus & Mental Arithmetic Learning Session",
        "kannada": "ಅಬಾಕಸ್ ಗಣಿತ ತರಬೇತಿ ಹಾಗೂ ಮಾನಸಿಕ ಲೆಕ್ಕಾಚಾರ",
        "category": "Vidya & Education",
        "type": "image",
        "featured": True,
        "description": "Dedicated teacher conducting abacus math class with each boy solving arithmetic problems on their own tool."
    },
    {
        "id": "gallery-29",
        "semanticName": "essay-competition.jpg",
        "url": "/media/essay-competition.jpg",
        "title": "Children's Day Essay Writing Competition",
        "kannada": "ಪ್ರಬಂಧ ಸ್ಪರ್ಧೆಯಲ್ಲಿ ಭಾಗವಹಿಸಿದ ಮಕ್ಕಳು",
        "category": "Vidya & Education",
        "type": "image",
        "featured": True,
        "description": "Boys seated cross-legged writing thoughtful essays on exam clipboards in the learning hall."
    },
    {
        "id": "gallery-30",
        "semanticName": "art-drawings.jpg",
        "url": "/media/art-drawings.jpg",
        "title": "Creative Drawing & Sketching Competition Winners",
        "kannada": "ಚಿತ್ರಕಲೆ ಸ್ಪರ್ಧೆ ಹಾಗೂ ಕಲಾಕೃತಿಗಳ ಪ್ರದರ್ಶನ",
        "category": "Vidya & Education",
        "type": "image",
        "featured": True,
        "description": "Boys proudly presenting their hand-drawn sketches, scenery paintings, and cartoon portraits."
    },
    {
        "id": "gallery-31",
        "semanticName": "handprint-workshop.jpg",
        "url": "/media/handprint-workshop.jpg",
        "title": "Eco-Art Handprint Tree Painting Workshop Collage",
        "kannada": "ಪರಿಸರ ಚಿತ್ರಕಲೆ ಹಾಗೂ ಹಸಿರು ಹಸ್ತಮುದ್ರೆ ಕಾರ್ಯಾಗಾರ",
        "category": "Vidya & Education",
        "type": "image",
        "featured": False,
        "description": "Collage of green handprint art on large poster sheets and boys sketching with mentors."
    },
    {
        "id": "gallery-32",
        "semanticName": "excellence-certificates.jpg",
        "url": "/media/excellence-certificates.jpg",
        "title": "Bangalore Forum Competition Achievement Certificates",
        "kannada": "ಬೆಂಗಳೂರು ಸ್ಪರ್ಧೆಯಲ್ಲಿ ಪ್ರತಿಭಾ ಪ್ರಶಸ್ತಿ ಪತ್ರಗಳು",
        "category": "Vidya & Education",
        "type": "image",
        "featured": True,
        "description": "Boys holding official Certificates of Participation from Bengaluru cultural events with pride."
    },
    {
        "id": "gallery-33",
        "semanticName": "mentorship-story-circle.jpg",
        "url": "/media/mentorship-story-circle.jpg",
        "title": "Value Education & Storytelling Circle with Mentor",
        "kannada": "ಮಕ್ಕಳ ಕಥಾ ಸಮಯ ಹಾಗೂ ನೈತಿಕ ಶಿಕ್ಷಣ",
        "category": "Vidya & Education",
        "type": "image",
        "featured": False,
        "description": "Female educator sitting with boys in learning circle discussing life lessons, moral tales, and stories."
    },
    {
        "id": "gallery-34",
        "semanticName": "carrom-play.jpg",
        "url": "/media/carrom-play.jpg",
        "title": "Carrom Board Strike Match in the Hall",
        "kannada": "ಕ್ಯಾರಮ್ ಬೋರ್ಡ್ ಆಟ ಹಾಗೂ ಮಕ್ಕಳ ಸಡಗರ",
        "category": "Sports & Play",
        "type": "image",
        "featured": True,
        "description": "Four boys huddled around the carrom board, striker poised for a corner pocket shot."
    },
    {
        "id": "gallery-35",
        "semanticName": "sports-race.jpg",
        "url": "/media/sports-race.jpg",
        "title": "Outdoor Running Sprint Race on Playground",
        "kannada": "ಓಟದ ಸ್ಪರ್ಧೆ ಹಾಗೂ ಕ್ರೀಡಾ ದಿನ",
        "category": "Sports & Play",
        "type": "image",
        "featured": True,
        "description": "Fast-paced outdoor running race with boys sprinting towards the finish line under blue skies."
    },
    {
        "id": "gallery-36",
        "semanticName": "swimming-pool-full.jpg",
        "url": "/media/swimming-pool-full.jpg",
        "title": "Summer Holiday Swimming Pool Excursion",
        "kannada": "ಬೇಸಿಗೆ ಈಜುಕೊಳ ಪ್ರವಾಸ ಹಾಗೂ ಸಂತಸದ ಕ್ಷಣಗಳು",
        "category": "Sports & Play",
        "type": "image",
        "featured": True,
        "description": "A memorable summer holiday excursion: boys sitting by the cool blue water smiling with caregivers."
    },
    {
        "id": "gallery-37",
        "semanticName": "lawn-cheer-circle.jpg",
        "url": "/media/lawn-cheer-circle.jpg",
        "title": "Lawn Cheer Circle: Boys Raising Hands in Pure Joy",
        "kannada": "ಹಸಿರು ಹುಲ್ಲುಹಾಸಿನ ಮೇಲೆ ಮಕ್ಕಳ ಹರ್ಷೋದ್ಗಾರ",
        "category": "Sports & Play",
        "type": "image",
        "featured": True,
        "description": "Boys standing in a green circle on the grass, throwing their hands up with giant smiles of pure happiness."
    },
    {
        "id": "gallery-38",
        "semanticName": "evening-satsang.jpg",
        "url": "/media/evening-satsang.jpg",
        "title": "Evening Sanskrit Shloka Chanting & Elder Guidance",
        "kannada": "ಸಂಜೆ ಸತ್ಸಂಗ ಹಾಗೂ ಶಾಂತಿ ಮಂತ್ರ ಪಠಣ",
        "category": "Our 25 Boys",
        "type": "image",
        "featured": False,
        "description": "Quiet evening reflection and peaceful camaraderie after a long, active day of study and play."
    },
    {
        "id": "gallery-39",
        "semanticName": "evening-snacks-gathering.jpg",
        "url": "/media/evening-snacks-gathering.jpg",
        "title": "Evening Milk & Refreshment Gathering",
        "kannada": "ಸಂಜೆಯ ಪೌಷ್ಟಿಕ ಉಪಹಾರ ಹಾಗೂ ಹಾಲಿನ ಸಮಯ",
        "category": "Annadana & Meals",
        "type": "image",
        "featured": False,
        "description": "Wholesome evening snacks, milk cups, and treats enjoyed together in the assembly hall."
    }
]

dest = r"D:\jana_build\public\media\ashrama-curated-gallery.json"
with open(dest, "w", encoding="utf-8") as f:
    json.dump(CURATED_CATALOG, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(CURATED_CATALOG)} curated items to {dest}!")
