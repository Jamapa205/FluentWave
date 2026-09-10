import re

with open('fluentwave_homepage.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. FAQ & WhatsApp Widget CSS
faq_and_wa_css = """
  /* PARENT & STUDENT FAQ ACCORDION */
  .faq-section {
    background: #ffffff;
    border-top: 1px solid rgba(0,0,0,0.06);
  }
  .faq-grid {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .faq-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
  }
  .faq-card:hover {
    border-color: #cbd5e1;
  }
  .faq-question {
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
    user-select: none;
  }
  .faq-icon {
    font-size: 18px;
    color: #2563eb;
    transition: transform 0.3s ease;
  }
  .faq-answer {
    padding: 0 24px 20px;
    font-size: 15px;
    color: #475569;
    line-height: 1.65;
    display: none;
  }
  .faq-card.open .faq-answer {
    display: block;
  }
  .faq-card.open .faq-icon {
    transform: rotate(180deg);
  }

  /* FLOATING WHATSAPP BUTTON */
  .floating-wa-btn {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    background: #25D366;
    color: #ffffff !important;
    border-radius: 50px;
    padding: 12px 22px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 10px 25px rgba(37, 211, 102, 0.45);
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .floating-wa-btn:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 14px 30px rgba(37, 211, 102, 0.6);
  }
  .wa-icon {
    font-size: 22px;
  }
"""

content = content.replace("  @media (max-width: 900px) {", faq_and_wa_css + "\n  @media (max-width: 900px) {")

# 2. Parent & Student FAQ Section HTML
faq_section_html = """
<!-- PARENT & STUDENT TRUST FAQ -->
<section class="faq-section" id="faq">
  <div class="section-inner">
    <div style="text-align: center; max-width: 700px; margin: 0 auto 50px;">
      <span class="section-eyebrow">Parents & Students Trust Center</span>
      <h2 class="section-title">Frequently Asked Questions</h2>
      <p class="section-sub" style="margin: 0 auto;">Everything Congolese families and students need to know about studying in India, visas, safety, and financing.</p>
    </div>

    <div class="faq-grid">
      <!-- FAQ 1 -->
      <div class="faq-card open">
        <div class="faq-question" onclick="toggleFaq(this)">
          <span>🇨🇩 Is my DRC Diplôme d'État recognized by Indian universities?</span>
          <span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
        <div class="faq-answer">
          Yes, absolutely. The Association of Indian Universities (AIU) grants full academic equivalence to the DRC <em>Diplôme d'État</em> (Humanités). Through FluentWave, our partner universities (like KIIT, Sharda, and Parul) accept your official results directly without requiring additional entrance exams if your score is 50% or above.
        </div>
      </div>

      <!-- FAQ 2 -->
      <div class="faq-card">
        <div class="faq-question" onclick="toggleFaq(this)">
          <span>🛡️ How safe are Indian universities for international students?</span>
          <span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
        <div class="faq-answer">
          All our partner institutions operate gated campuses with 24/7 security, biometric hostel entry, and dedicated International Student Officers. There are thriving African and French-speaking student associations on campus to assist new arrivals from Kinshasa, Lubumbashi, and Goma.
        </div>
      </div>

      <!-- FAQ 3 -->
      <div class="faq-card">
        <div class="faq-question" onclick="toggleFaq(this)">
          <span>💰 What is the true annual cost (Tuition + Food + Hostel)?</span>
          <span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
        <div class="faq-answer">
          Studying in India is one of the most cost-effective global pathways. Top-tier accredited degrees (B.Tech, BBA, Pharmacy) range between <strong>$3,500 and $5,500 USD per year</strong>, which includes university tuition, campus hostel accommodation, and meals. FluentWave students with $>65\%$ on their state exams are eligible for up to 50% tuition scholarships.
        </div>
      </div>

      <!-- FAQ 4 -->
      <div class="faq-card">
        <div class="faq-question" onclick="toggleFaq(this)">
          <span>🗣️ What if my English is basic? Will I struggle with lectures?</span>
          <span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
        <div class="faq-answer">
          Most Congolese students speak French as their primary academic language. Our partner universities offer a mandatory 3-to-6 month intensive English Bridge Program (EAP) right before degree classes begin, ensuring you transition smoothly and graduate completely fluent in English.
        </div>
      </div>

      <!-- FAQ 5 -->
      <div class="faq-card">
        <div class="faq-question" onclick="toggleFaq(this)">
          <span>🛂 How does the Indian Student Visa process work from Kinshasa?</span>
          <span class="faq-icon"><i class="fa-solid fa-chevron-down"></i></span>
        </div>
        <div class="faq-answer">
          Once your FluentWave application is verified and approved, the university issues an official Admission & Visa Letter. Our Kinshasa liaison team assists you and your family with appointment scheduling and document verification at the Indian Embassy in Gombe, Kinshasa.
        </div>
      </div>
    </div>
  </div>
</section>
"""

# Insert FAQ section right before <!-- FINAL CTA -->
content = content.replace("<!-- FINAL CTA -->", faq_section_html + "\n<!-- FINAL CTA -->")

# 3. Floating WhatsApp Button & Accordion JS
floating_wa_html = """
<!-- FLOATING WHATSAPP ADMISSIONS CHAT WIDGET -->
<a href="https://wa.me/243990000000?text=Hello%20FluentWave,%20I%20am%20interested%20in%20studying%20abroad%20in%20India%20and%20would%20like%20admissions%20guidance." 
   target="_blank" 
   class="floating-wa-btn" 
   title="Chat with an Admissions Advisor">
  <i class="fa-brands fa-whatsapp wa-icon"></i>
  <span>Chat with Counselor</span>
</a>

<script>
function toggleFaq(el) {
  const card = el.parentElement;
  card.classList.toggle('open');
}
</script>
"""

content = content.replace("</body>", floating_wa_html + "\n</body>")

with open('fluentwave_homepage.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected Parent FAQ and Floating WhatsApp widget into fluentwave_homepage.html")
