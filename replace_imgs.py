
import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# The generic URL we want to replace
generic_url = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80'

# List of replacements in order of appearance
replacements = [
    'logo.jpeg',
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
    'collage.jpeg',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80'
]

# Split by the generic url and re-join with replacements
parts = content.split(generic_url)
if len(parts) == len(replacements) + 1:
    new_content = parts[0]
    for i in range(len(replacements)):
        new_content += replacements[i] + parts[i+1]
    
    with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Images replaced successfully.')
else:
    print(f'Error: Found {len(parts)-1} instances, expected {len(replacements)}')

