
import re

with open('fluentwave_homepage_4.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace massive base64 strings with Unsplash placeholders
content = re.sub(r'data:image/[^;]+;base64,[^\"]+', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', content)

# Extract CSS
css_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
if css_match:
    css = css_match.group(1)
    
    # 1. Root variables
    css = css.replace('--glass-bg: rgba(0,32,63,0.72);', '--glass-bg: rgba(255,255,255,0.95);')
    css = css.replace('--glass-border: rgba(0,109,176,0.32);', '--glass-border: rgba(0,0,0,0.08);')
    css = css.replace('--off-white: rgba(255,255,255,0.9);', '--off-white: rgba(15,23,42,0.9);')
    css = css.replace('--muted: rgba(255,255,255,0.6);', '--muted: rgba(15,23,42,0.6);')
    css = css.replace('--white: #ffffff;', '--white: #0f172a;')
    
    # 2. Body
    css = css.replace('background: #000e1a;', 'background: #f8fafc;')
    css = css.replace('color: #fff;', 'color: #0f172a;')
    
    # 3. Nav
    css = css.replace('background: rgba(0,14,26,0.85);', 'background: rgba(255,255,255,0.95);')
    css = css.replace('border-bottom: 1px solid rgba(0,109,176,0.2);', 'border-bottom: 1px solid rgba(0,0,0,0.1);')
    css = re.sub(r'\.nav-logo-text\s*{[^}]*color:\s*#fff;[^}]*}', '.nav-logo-text { font-family: \'Space Grotesk\', sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: 0.02em; }', css)
    
    # Nav links
    css = css.replace('color: rgba(255,255,255,0.75);', 'color: #475569;')
    css = css.replace('color: #fff;\n    border-color: rgba(0,109,176,0.5);\n    background: rgba(0,109,176,0.15);', 'color: #0f172a; border-color: rgba(0,0,0,0.1); background: rgba(0,0,0,0.03);')
    css = css.replace('color: #fff;\n    border-color: rgba(56,182,255,0.6);\n    background: rgba(0,109,176,0.2);', 'color: #2563eb; border-color: rgba(37,99,235,0.3); background: rgba(37,99,235,0.05);')
    
    # 4. Sections backgrounds
    css = css.replace('background: linear-gradient(180deg, #000e1a 0%, #001428 100%);', 'background: #ffffff;')
    css = css.replace('background: linear-gradient(180deg, #000e1a 0%, #001428 60%, #000e1a 100%);', 'background: #ffffff;')
    css = css.replace('background: linear-gradient(180deg, #000e1a 0%, #001020 100%);', 'background: #f8fafc;')
    css = css.replace('background: linear-gradient(135deg, #001428 0%, #002244 50%, #001428 100%);', 'background: #ffffff; border-top: 1px solid rgba(0,0,0,0.05);')
    
    # Typography colors fixes
    css = css.replace('color: rgba(255,255,255,0.65);', 'color: #475569;')
    css = css.replace('color: rgba(255,255,255,0.95);', 'color: #0f172a;')
    css = css.replace('color: rgba(255,255,255,0.8);', 'color: #334155;')
    css = css.replace('color: rgba(255,255,255,0.72);', 'color: #475569;')
    css = css.replace('color: rgba(255,255,255,0.6);', 'color: #475569;')
    css = css.replace('color: rgba(255,255,255,0.85);', 'color: #1e293b;')
    css = css.replace('color: rgba(255,255,255,0.75);', 'color: #475569;')
    
    # Pill styles
    css = css.replace('background: rgba(56,182,255,0.08);', 'background: rgba(37,99,235,0.05);')
    css = css.replace('border: 1px solid rgba(56,182,255,0.35);', 'border: 1px solid rgba(37,99,235,0.2);')
    css = css.replace('background: rgba(0,109,176,0.4);', 'background: #2563eb;')
    css = css.replace('color: #fff;', 'color: #0f172a;') # General text flip
    css = css.replace('.pill.active {\n    background: #2563eb;\n    border-color: var(--blue-mid);\n    color: #0f172a;\n  }', '.pill.active { background: #2563eb; border-color: #2563eb; color: #fff; }')
    
    # Criteria items
    css = css.replace('background: rgba(0,109,176,0.1);', 'background: rgba(0,0,0,0.02);')
    css = css.replace('border: 1px solid rgba(0,109,176,0.2);', 'border: 1px solid rgba(0,0,0,0.08);')
    
    # Score section
    css = css.replace('background: rgba(255,255,255,0.08);', 'background: rgba(0,0,0,0.08);')
    
    # Footer - keep it dark but fix border
    css = css.replace('background: #000814;', 'background: #020617; color: #cbd5e1;')
    css = css.replace('border-top: 1px solid rgba(0,109,176,0.15);', 'border-top: 1px solid rgba(255,255,255,0.1);')
    css = css.replace('color: rgba(255,255,255,0.5);', 'color: #94a3b8;')
    css = css.replace('border-top: 1px solid rgba(255,255,255,0.06);', 'border-top: 1px solid rgba(255,255,255,0.1);')
    css = css.replace('color: rgba(255,255,255,0.35);', 'color: #64748b;')
    
    content = content.replace(css_match.group(1), css)

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done rewriting CSS and HTML.')

