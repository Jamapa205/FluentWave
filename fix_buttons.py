import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of href="#assessment" with href="student_portal.html"
content = content.replace('href="#assessment"', 'href="student_portal.html"')

# Also replace any href="#score" or href="#apply" or href="#lead" with student_portal.html
content = content.replace('href="#score"', 'href="student_portal.html"')
content = content.replace('href="#apply"', 'href="student_portal.html"')

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated all #assessment links to student_portal.html")
