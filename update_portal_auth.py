import re

with open('student_portal.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Auto-fill from localStorage if signed in, or redirect to auth.html if not signed in
auth_check_code = """
  <script>
    const API_BASE = 'http://localhost:4000/api/v1';
    let currentStudentId = null;

    // Check if user is logged in
    const storedUser = localStorage.getItem('fluentwave_user');
    const storedStudent = localStorage.getItem('fluentwave_student');
    
    if (!storedUser) {
      window.location.href = 'auth.html';
    } else {
      const u = JSON.parse(storedUser);
      const s = storedStudent ? JSON.parse(storedStudent) : null;
      if (s) {
        currentStudentId = s.id;
        document.getElementById('first-name').value = s.firstName || '';
        document.getElementById('last-name').value = s.lastName || '';
        document.getElementById('phone').value = s.phone || '';
        document.getElementById('email').value = s.email || '';
      }
    }
"""

content = content.replace("<script>\n    const API_BASE = 'http://localhost:4000/api/v1';\n    let currentStudentId = null;", auth_check_code)

# Add logout button in header
header_btn = """
    <div style="display: flex; gap: 16px; align-items: center;">
      <span id="user-display" style="font-size: 13px; color: var(--text-muted);"></span>
      <button onclick="logout()" style="background: none; border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">Sign Out</button>
    </div>
  </header>
"""
content = content.replace("    <div style=\"font-size: 13px; color: var(--text-muted);\">\n      Corridor: <strong>DRC ➔ India / Global</strong>\n    </div>\n  </header>", header_btn)

# Add logout function
logout_func = """
    function logout() {
      localStorage.removeItem('fluentwave_user');
      localStorage.removeItem('fluentwave_student');
      window.location.href = 'auth.html';
    }
    if (storedUser) {
      const u = JSON.parse(storedUser);
      document.getElementById('user-display').innerText = u.email;
    }
"""
content = content.replace("    // 1. Submit Intake Form", logout_func + "\n    // 1. Submit Intake Form")

with open('student_portal.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated student_portal.html with session validation and sign-out.")
