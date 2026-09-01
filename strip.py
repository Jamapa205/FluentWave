
import re
with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()
content_stripped = re.sub(r'data:image/[^;]+;base64,[^\"]+', 'data:image/...', content)
with open('fluentwave_homepage_stripped.html', 'w', encoding='utf-8') as f:
    f.write(content_stripped)
print('Done. Wrote stripped HTML.')

