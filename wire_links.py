import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace primary CTA links
content = content.replace('href="#" class="nav-cta"', 'href="student_portal.html" class="nav-cta"')
content = content.replace('href="#">Start Free Assessment</a>', 'href="student_portal.html">Start Free Assessment</a>')
content = content.replace('href="#">Get Your Readiness Score', 'href="student_portal.html">Get Your Readiness Score')
content = content.replace('href="#">Start Assessment</a>', 'href="student_portal.html">Start Assessment</a>')
content = content.replace('href="#" class="hero-cta-btn"', 'href="student_portal.html" class="hero-cta-btn"')

# Also replace generic CTA button classes
content = re.sub(r'href="#"([^>]*class="[^"]*btn-primary[^"]*")', r'href="student_portal.html"\1', content)
content = re.sub(r'class="btn btn-primary" href="#"', r'class="btn btn-primary" href="student_portal.html"', content)

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Linked homepage buttons to student_portal.html successfully.")
