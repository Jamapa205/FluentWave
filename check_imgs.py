
import re
with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()
    # Find all img tags
    imgs = re.findall(r'<img[^>]+>', content)
    for img in imgs:
        print(img)

