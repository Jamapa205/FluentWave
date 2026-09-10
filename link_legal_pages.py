import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace dummy footer links with real links
content = content.replace('<li><a href="#">Privacy Policy</a></li>', '<li><a href="privacy.html">Privacy Policy</a></li>')
content = content.replace('<li><a href="#">Terms</a></li>', '<li><a href="terms.html">Terms of Service</a></li>')
content = content.replace('<li><a href="#">Terms of Service</a></li>', '<li><a href="terms.html">Terms of Service</a></li>')
content = content.replace('<li><a href="#">FAQ</a></li>', '<li><a href="#faq">Frequently Asked Questions</a></li>')

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Linked privacy.html, terms.html, and #faq in footer.")
