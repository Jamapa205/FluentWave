import re

files_to_update = [
    'fluentwave_homepage.html',
    'auth.html',
    'student_portal.html',
    'admin_portal.html',
    'sitemap.xml',
    'backend/src/app.ts'
]

# 1. Update fluentwave_homepage.html
with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    hp = f.read()

hp = hp.replace("through a structured, human-reviewed pathway built for the DRC-to-India corridor and beyond.", "through a structured, human-reviewed pathway built for students across Africa and globally.")
hp = hp.replace("built for the DRC-to-India corridor and beyond.", "built for ambitious students across Africa and international corridors worldwide.")
hp = hp.replace("🇨🇩 Is my DRC Diplôme d'État recognized by Indian universities?", "🌍 Are African and international high school diplomas recognized globally?")
hp = hp.replace("Yes, absolutely. The Association of Indian Universities (AIU) grants full academic equivalence to the DRC <em>Diplôme d'État</em> (Humanités). Through FluentWave, our partner universities (like KIIT, Sharda, and Parul) accept your official results directly without requiring additional entrance exams if your score is 50% or above.", "Yes, absolutely. Partner universities grant full international equivalence to national certificates, including West African WASSCE/WAEC, Central & East African Diplômes d'État, Baccalauréat, KCSE, and Cambridge A-Levels. FluentWave verifies and translates your qualification directly so you avoid unnecessary entrance exams.")
hp = hp.replace("There are thriving African and French-speaking student associations on campus to assist new arrivals from Kinshasa, Lubumbashi, and Goma.", "There are thriving international and African student associations on campus to welcome and mentor new arrivals from day one.")
hp = hp.replace("FluentWave students with $>65\%$ on their state exams are eligible for up to 50% tuition scholarships.", "Merit-based scholarships covering 20% to 50% of tuition are awarded to students with strong high school academic records.")
hp = hp.replace("Most Congolese students speak French as their primary academic language.", "For students from non-English speaking or bilingual backgrounds (French, Portuguese, Arabic),")
hp = hp.replace("Our partner universities offer a mandatory 3-to-6 month intensive English Bridge Program (EAP) right before degree classes begin, ensuring you transition smoothly and graduate completely fluent in English.", "Our partner universities offer structured English Bridge Programs (EAP) and intensive foundations before degree classes begin, ensuring you transition with confidence and graduate fully fluent.")
hp = hp.replace("🛂 How does the Indian Student Visa process work from Kinshasa?", "🛂 How does the Student Visa & embassy process work in my country?")
hp = hp.replace("Once your FluentWave application is verified and approved, the university issues an official Admission & Visa Letter. Our Kinshasa liaison team assists you and your family with appointment scheduling and document verification at the Indian Embassy in Gombe, Kinshasa.", "Once your FluentWave application is approved, the university issues an official Admission & Visa Invitation Letter. Our admissions team provides full document verification packages and guides you step-by-step through your local embassy appointment.")
hp = hp.replace("AI-powered education onboarding for students navigating the path from the DRC to the world's top universities.", "The unified operating system for international student mobility, empowering students across Africa and emerging markets to access world-class universities.")
hp = hp.replace("🇨🇩 → 🇮🇳 · Kinshasa–DRC to India Corridor", "🌍 Global Education Mobility OS · Africa, Asia & Worldwide")
hp = hp.replace("Everything Congolese families and students need to know", "Everything prospective international students and families need to know")
hp = hp.replace("from the DRC to top global universities", "from Africa and across the globe to world-class universities")

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(hp)

# 2. Update student_portal.html
with open('student_portal.html', 'r', encoding='utf-8') as f:
    sp = f.read()

sp = sp.replace("Corridor: <strong>DRC ➔ India / Global</strong>", "Global Mobility: <strong>Africa & Worldwide ➔ Top Universities</strong>")
sp = sp.replace("High School / State Exam Score (Examen d'État %)", "High School Graduation / National Exam Score (%)")
sp = sp.replace("Beginner (French dominant, basic English words)", "Beginner (Non-English background, basic English words)")
sp = sp.replace('placeholder="e.g. Jean-Luc"', 'placeholder="e.g. Samuel"')
sp = sp.replace('placeholder="e.g. Kambale"', 'placeholder="e.g. Mensah"')
sp = sp.replace('placeholder="+243 99 123 4567"', 'placeholder="+234 / +254 / +243 / +1..."')

with open('student_portal.html', 'w', encoding='utf-8') as f:
    f.write(sp)

# 3. Update admin_portal.html
with open('admin_portal.html', 'r', encoding='utf-8') as f:
    ap = f.read()

ap = ap.replace("Active Candidate Dossiers (DRC ➔ India / Global)", "Active Candidate Dossiers (Pan-African & Global Mobility)")
with open('admin_portal.html', 'w', encoding='utf-8') as f:
    f.write(ap)

# 4. Update auth.html
with open('auth.html', 'r', encoding='utf-8') as f:
    au = f.read()

au = au.replace('placeholder="+243 99 123 4567"', 'placeholder="+234 / +254 / +243 / +..."')
with open('auth.html', 'w', encoding='utf-8') as f:
    f.write(au)

print("Broadened scope to pan-African and global across all files successfully.")
