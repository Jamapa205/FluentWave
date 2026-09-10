import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Partner Universities Showcase CSS
uni_catalog_css = """
  /* PARTNER UNIVERSITIES & SCHOLARSHIPS SHOWCASE */
  .uni-section {
    background: #f8fafc;
    border-top: 1px solid rgba(0,0,0,0.06);
    border-bottom: 1px solid rgba(0,0,0,0.06);
  }
  .uni-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    margin-top: 40px;
  }
  .uni-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .uni-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
  .uni-banner {
    height: 140px;
    width: 100%;
    object-fit: cover;
    background: #e2e8f0;
  }
  .uni-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .uni-tag {
    display: inline-block;
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    background: #eff6ff;
    color: #2563eb;
    margin-bottom: 12px;
  }
  .uni-title {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
    line-height: 1.3;
  }
  .uni-loc {
    font-size: 13px;
    color: #64748b;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .uni-highlights {
    list-style: none;
    font-size: 13px;
    color: #334155;
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .uni-highlights li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .uni-highlights li i {
    color: #16a34a;
    font-size: 12px;
  }
  .uni-scholarship {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
    color: #15803d;
    font-weight: 600;
    margin-top: auto;
    margin-bottom: 16px;
  }
  .uni-btn {
    display: block;
    width: 100%;
    text-align: center;
    padding: 10px;
    border-radius: 6px;
    background: #2563eb;
    color: #ffffff !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
  }
  .uni-btn:hover { background: #1d4ed8; }

  @media (max-width: 1100px) {
    .uni-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 650px) {
    .uni-grid { grid-template-columns: 1fr; }
  }
"""

content = content.replace("  /* PARENT & STUDENT FAQ ACCORDION */", uni_catalog_css + "\n  /* PARENT & STUDENT FAQ ACCORDION */")

# 2. Partner Universities & Scholarships Showcase HTML
uni_catalog_html = """
<!-- FEATURED PARTNER UNIVERSITIES & SCHOLARSHIPS -->
<section class="uni-section" id="partners">
  <div class="section-inner">
    <div style="text-align: center; max-width: 750px; margin: 0 auto;">
      <span class="section-eyebrow">Verified Partner Institutions</span>
      <h2 class="section-title">Premier Universities with Guaranteed Scholarships</h2>
      <p class="section-sub" style="margin: 0 auto;">FluentWave partners directly with accredited institutions in India and globally offering dedicated tuition waivers and international student support.</p>
    </div>

    <div class="uni-grid">
      <!-- 1. KIIT University -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80" alt="KIIT University" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Top Ranked (NIRF #16)</span>
          <div class="uni-title">KIIT University</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Bhubaneswar, Odisha, India</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> Computer Science, AI, Nursing, MBA</li>
            <li><i class="fa-solid fa-check"></i> 30,000+ Students · Gated Campus</li>
            <li><i class="fa-solid fa-check"></i> Active African Student Union</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>KUISP International Award:</strong> Up to 50% tuition reduction for qualified high school grades.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for KIIT →</a>
        </div>
      </div>

      <!-- 2. Parul University -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80" alt="Parul University" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Flat 50% International Waiver</span>
          <div class="uni-title">Parul University</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Vadodara, Gujarat, India</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> IT, Pharmacy, Business, Biotech</li>
            <li><i class="fa-solid fa-check"></i> 2,500+ International Students</li>
            <li><i class="fa-solid fa-check"></i> Dedicated French & African Liaisons</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>Flat 50% Tuition Waiver:</strong> Guaranteed tuition reduction for approved international applicants.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for Parul →</a>
        </div>
      </div>

      <!-- 3. Sharda University -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80" alt="Sharda University" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Delhi NCR Hub</span>
          <div class="uni-title">Sharda University</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Greater Noida (Delhi NCR), India</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> Software Eng, Healthcare, Media</li>
            <li><i class="fa-solid fa-check"></i> Metro connectivity to Delhi airports</li>
            <li><i class="fa-solid fa-check"></i> Intensive English Foundations</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>Global Ambassador Grant:</strong> 20% to 50% merit-based scholarship on tuition fees.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for Sharda →</a>
        </div>
      </div>

      <!-- 4. Lovely Professional University (LPU) -->
      <div class="uni-card">
        <img src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&q=80" alt="Lovely Professional University" class="uni-banner">
        <div class="uni-body">
          <span class="uni-tag">Largest Indian Campus</span>
          <div class="uni-title">Lovely Professional Univ (LPU)</div>
          <div class="uni-loc"><i class="fa-solid fa-location-dot"></i> Punjab, India</div>
          <ul class="uni-highlights">
            <li><i class="fa-solid fa-check"></i> Cyber Security, Data Science, Design</li>
            <li><i class="fa-solid fa-check"></i> 600-acre smart campus & labs</li>
            <li><i class="fa-solid fa-check"></i> Global placement track record</li>
          </ul>
          <div class="uni-scholarship">
            🎓 <strong>LPUIST International Test:</strong> 40% to 60% fee reductions based on academic evaluation.
          </div>
          <a href="auth.html" class="uni-btn">Check Eligibility for LPU →</a>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="glow-line"></div>
"""

# Insert Partner Showcase right after </section> of destinations
dest_end = '</section>\n\n<div class="glow-line"></div>\n\n<!-- READINESS SCORE DEEP DIVE -->'
content = content.replace(dest_end, '</section>\n\n<div class="glow-line"></div>\n\n' + uni_catalog_html + '\n<!-- READINESS SCORE DEEP DIVE -->')

# Update Nav links in header
content = content.replace('<li><a href="#destinations">Destinations</a></li>', '<li><a href="#partners">Scholarships</a></li>\n    <li><a href="#destinations">Destinations</a></li>')

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected Partner Universities & Scholarships Showcase into fluentwave_homepage.html")
