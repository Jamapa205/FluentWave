import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

seo_meta_tags = """<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FluentWave — Unified Operating System for Global Education Mobility</title>
<meta name="description" content="FluentWave guides international students from the DRC to top global universities in India, UK, and Canada with AI-assisted bilingual readiness assessments and verified admissions routing.">
<meta name="keywords" content="study abroad DRC, international students India, university admissions Kinshasa, study in India from Congo, FluentWave, Examen d'Etat university admission">
<link rel="canonical" href="https://fluentwave.org/">

<!-- Open Graph / Facebook / WhatsApp Preview -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://fluentwave.org/">
<meta property="og:title" content="FluentWave | Your Gateway to Global Education">
<meta property="og:description" content="AI-powered education mobility and admissions routing from Central Africa to top world institutions.">
<meta property="og:image" content="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="FluentWave — Global Education Mobility">
<meta name="twitter:description" content="Take your free bilingual readiness assessment and match with partner universities worldwide.">
<meta name="twitter:image" content="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80">
"""

content = content.replace('<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>FluentWave — Your Gateway to Global Education</title>', seo_meta_tags)

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected production SEO & Open Graph meta tags into homepage.")
