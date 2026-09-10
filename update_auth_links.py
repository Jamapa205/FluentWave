import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace links targeting student_portal.html directly with auth.html so students must sign in / sign up first
content = content.replace('href="student_portal.html"', 'href="auth.html"')

# Add an Admissions Portal link in the footer
if 'Admissions Staff' not in content:
    content = content.replace('<li><a href="#">Partner Portal</a></li>', '<li><a href="#">Partner Portal</a></li>\n                        <li><a href="admin_portal.html" style="color: #38b6ff;"><i class="fa-solid fa-lock"></i> Admissions Admin</a></li>')

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Homepage updated to route students through auth.html and added admin link.")
