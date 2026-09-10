import re

with open('backend/src/app.ts', 'r', encoding='utf-8') as f:
    content = f.read()

google_auth_endpoint = """
// POST /api/v1/auth/google
// Handles Google OAuth 2.0 Sign In & Sign Up
app.post('/api/v1/auth/google', (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google account.' });
    }

    // Check if user already exists
    let existingUser: UserAccount | null = null;
    for (const u of store.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        existingUser = u;
        break;
      }
    }

    if (existingUser) {
      const student = store.students.get(existingUser.id);
      return res.json({
        message: 'Google Sign In successful.',
        user: { id: existingUser.id, email: existingUser.email, phone: existingUser.phone, role: existingUser.role },
        student: student || null
      });
    }

    // Otherwise create new student from Google profile
    const userId = uuidv4();
    const newUser: UserAccount = {
      id: userId,
      email: email.toLowerCase(),
      phone: req.body.phone || '+243990000000',
      passwordHash: 'GOOGLE_OAUTH_' + (googleId || 'USER'),
      role: 'STUDENT',
      createdAt: new Date()
    };

    store.users.set(userId, newUser);

    const newStudent: Student = {
      id: userId,
      firstName: firstName || 'Student',
      lastName: lastName || 'User',
      phone: newUser.phone,
      email: email.toLowerCase(),
      nationality: 'DRC',
      currentCountry: 'DRC',
      targetCountry: 'India',
      targetProgramLevel: 'UNDERGRADUATE',
      budgetCurrency: 'USD',
      budgetMaxAnnual: 4500,
      status: 'LEAD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.students.set(userId, newStudent);
    store.logEvent(userId, 'USER_REGISTERED_GOOGLE', undefined, 'LEAD', { email }, 'STUDENT', userId);

    res.status(201).json({
      message: 'Account created with Google successfully.',
      user: { id: newUser.id, email: newUser.email, phone: newUser.phone, role: newUser.role },
      student: newStudent
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
"""

# Insert google_auth_endpoint right after /api/v1/auth/login
content = content.replace(
    "    res.json({\n      message: 'Login successful.',\n      user: { id: foundUser.id, email: foundUser.email, phone: foundUser.phone, role: foundUser.role },\n      student: student || null\n    });\n  } catch (err: any) {\n    res.status(500).json({ error: err.message });\n  }\n});",
    "    res.json({\n      message: 'Login successful.',\n      user: { id: foundUser.id, email: foundUser.email, phone: foundUser.phone, role: foundUser.role },\n      student: student || null\n    });\n  } catch (err: any) {\n    res.status(500).json({ error: err.message });\n  }\n});\n" + google_auth_endpoint
)

with open('backend/src/app.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Google OAuth endpoint to backend/src/app.ts")
