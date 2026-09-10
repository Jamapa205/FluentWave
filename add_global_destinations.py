import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Parul University Image (Use a high-quality verified modern university campus photo)
content = content.replace(
    '<img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80" alt="Parul University" class="uni-banner">',
    '<img src="https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=600&q=80" alt="Parul University Campus" class="uni-banner">'
)

# 2. Expand Destinations Grid to include Russia, Turkey, Cyprus, Mauritius, Italy, etc.
old_dest_grid = """        <div class="destinations-grid">
          <div class="glass dest-card"><span class="dest-flag">🇮🇳</span><div class="dest-name">India</div><div class="dest-sub">Primary corridor</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇫🇷</span><div class="dest-name">France</div><div class="dest-sub">Expanding 2025</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇬🇧</span><div class="dest-name">UK</div><div class="dest-sub">Expanding 2025</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇨🇦</span><div class="dest-name">Canada</div><div class="dest-sub">Expanding 2025</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇩🇪</span><div class="dest-name">Germany</div><div class="dest-sub">Expanding 2026</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇮🇹</span><div class="dest-name">Italy</div><div class="dest-sub">Expanding 2026</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇦🇺</span><div class="dest-name">Australia</div><div class="dest-sub">Expanding 2026</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇺🇸</span><div class="dest-name">USA</div><div class="dest-sub">Future roadmap</div></div>
        </div>"""

new_dest_grid = """        <div class="destinations-grid" style="grid-template-columns: repeat(4, 1fr);">
          <div class="glass dest-card"><span class="dest-flag">🇮🇳</span><div class="dest-name">India</div><div class="dest-sub">Affordable & Scholarships</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇹🇷</span><div class="dest-name">Turkey</div><div class="dest-sub">Türkiye Bursları Hub</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇨🇾</span><div class="dest-name">Cyprus</div><div class="dest-sub">50%-100% Tuition Waivers</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇷🇺</span><div class="dest-name">Russia</div><div class="dest-sub">Govt Subsidized Degrees</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇲🇺</span><div class="dest-name">Mauritius</div><div class="dest-sub">Mauritius-Africa Scheme</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇮🇹</span><div class="dest-name">Italy</div><div class="dest-sub">DSU Income-Based Grants</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇫🇷</span><div class="dest-name">France</div><div class="dest-sub">Campus France Pathway</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇬🇧</span><div class="dest-name">UK</div><div class="dest-sub">Global Talent Degrees</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇨🇦</span><div class="dest-name">Canada</div><div class="dest-sub">Post-Grad Work Streams</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇩🇪</span><div class="dest-name">Germany</div><div class="dest-sub">Zero/Low Tuition Tech</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇦🇺</span><div class="dest-name">Australia</div><div class="dest-sub">Regional Work Visas</div></div>
          <div class="glass dest-card"><span class="dest-flag">🇺🇸</span><div class="dest-name">USA</div><div class="dest-sub">STEM OPT Pathways</div></div>
        </div>"""

content = content.replace(old_dest_grid, new_dest_grid)

# 3. Add 4 more International Destination Cards to the Partner Showcase (Turkey, Cyprus, Russia, Italy/Mauritius)
extra_uni_cards = """
      <!-- 5. Eastern Mediterranean University (North Cyprus) -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80" alt="Cyprus Universities" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Cyprus / Mediterranean</span>
          <div class="uni-title">Eastern Mediterranean Univ (EMU)</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Famagusta, North Cyprus</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> 100% English-taught Degrees</li>
            <li><i class="fa-solid fa-check"></i> Global accreditation (ABET / FIBAA)</li>
            <li><i class="fa-solid fa-check"></i> High visa approval rate</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>Standard 50% International Waiver:</strong> Automatic 50% tuition reduction for all enrolled African students.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for Cyprus →</a>
        </div>
      </div>

      <!-- 6. Istanbul Aydin University (Turkey) -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80" alt="Turkey Universities" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Turkey / Eurasia Hub</span>
          <div class="uni-title">Istanbul Aydin University</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Istanbul, Turkey</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> Biomedical, Civil Eng, Architecture</li>
            <li><i class="fa-solid fa-check"></i> Gateway between Europe & Asia</li>
            <li><i class="fa-solid fa-check"></i> Erasmus+ exchange eligibility</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>Türkiye Bursları & Institutional Grants:</strong> Full and partial tuition grants available based on high school merit.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for Turkey →</a>
        </div>
      </div>

      <!-- 7. Peoples' Friendship University of Russia (RUDN) -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80" alt="Russia Universities" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Russia / State Subsidized</span>
          <div class="uni-title">RUDN University (Moscow)</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Moscow, Russia</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> Medicine (MBBS), Engineering, Law</li>
            <li><i class="fa-solid fa-check"></i> Historic center for African graduates</li>
            <li><i class="fa-solid fa-check"></i> English and Russian medium tracks</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>Russian State Quota Scheme:</strong> 100% government-covered tuition options plus subsidized campus dormitories.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for Russia →</a>
        </div>
      </div>

      <!-- 8. University of Mauritius / Curtin Mauritius -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" alt="Mauritius Universities" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Mauritius / Indian Ocean Hub</span>
          <div class="uni-title">Curtin Mauritius / UoM</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Moka, Mauritius</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> Australian accredited degrees (Curtin)</li>
            <li><i class="fa-solid fa-check"></i> Bilingual English & French environment</li>
            <li><i class="fa-solid fa-check"></i> Financial & FinTech regional capital</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>Mauritius-Africa Scholarship Scheme:</strong> Fully funded government awards covering tuition & living allowance.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for Mauritius →</a>
        </div>
      </div>
"""

# Insert the 4 new cards into .uni-grid right after card 4
content = content.replace("          <a href=\"auth.html\" class=\"uni-btn\">Check Eligibility for LPU →</a>\n        </div>\n      </div>\n    </div>", "          <a href=\"auth.html\" class=\"uni-btn\">Check Eligibility for LPU →</a>\n        </div>\n      </div>\n" + extra_uni_cards + "\n    </div>")

# Update student portal target country options as well
with open('student_portal.html', 'r', encoding='utf-8') as sf:
    sp_content = sf.read()

sp_old_select = """            <select id="target-country">
              <option value="India">India (Affordable Excellence)</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
            </select>"""

sp_new_select = """            <select id="target-country">
              <option value="India">India (High Scholarships & Low Cost)</option>
              <option value="Turkey">Turkey (Türkiye Bursları & Tech Hub)</option>
              <option value="Cyprus">Cyprus (Automatic 50% Tuition Waiver)</option>
              <option value="Russia">Russia (Subsidized Medicine & Engineering)</option>
              <option value="Mauritius">Mauritius (Mauritius-Africa Scheme)</option>
              <option value="Italy">Italy (DSU Income-Based Grants)</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
            </select>"""

sp_content = sp_content.replace(sp_old_select, sp_new_select)

with open('student_portal.html', 'w', encoding='utf-8') as sf:
    sf.write(sp_content)

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Parul image and expanded partner institutions & destinations successfully.")
