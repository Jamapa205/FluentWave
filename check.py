
import sys, re
with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()
    b64s = re.findall(r'data:image/[^;]+;base64,[^\"]+', content)
    print(f'Found {len(b64s)} base64 images')
    total_size = sum(len(b) for b in b64s)
    print(f'Total size of base64 images: {total_size} bytes')

