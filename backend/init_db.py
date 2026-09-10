import sqlite3
import os

DB_FILE = 'fluentwave.sqlite'

def init_database():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        role TEXT DEFAULT 'STUDENT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 2. Students Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        nationality TEXT DEFAULT 'Global',
        current_country TEXT DEFAULT 'Global',
        target_country TEXT DEFAULT 'India',
        target_program_level TEXT DEFAULT 'UNDERGRADUATE',
        budget_currency TEXT DEFAULT 'USD',
        budget_max_annual REAL DEFAULT 4500,
        status TEXT DEFAULT 'LEAD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(id) REFERENCES users(id)
    );
    ''')

    # 3. Assessments Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        language_signals TEXT,
        academic_signals TEXT,
        intent_signals TEXT,
        readiness_score REAL,
        rubric_breakdown TEXT,
        ai_confidence REAL DEFAULT 1.0,
        requires_human_gate INTEGER DEFAULT 0,
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id)
    );
    ''')

    # 4. Documents Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        doc_type TEXT NOT NULL,
        file_url TEXT,
        state TEXT DEFAULT 'REQUESTED',
        rejection_reason_code TEXT,
        uploaded_at TIMESTAMP,
        verified_at TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id)
    );
    ''')

    # 5. Case Events Table (Append-Only Audit Log)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS case_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT NOT NULL,
        actor_id TEXT,
        actor_type TEXT DEFAULT 'SYSTEM',
        event_type TEXT NOT NULL,
        from_state TEXT,
        to_state TEXT,
        payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 6. Partners Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        institution_name TEXT NOT NULL,
        country TEXT NOT NULL,
        sla_hours INTEGER DEFAULT 48
    );
    ''')

    # Seed Default Partners if empty
    cursor.execute('SELECT COUNT(*) FROM partners')
    if cursor.fetchone()[0] == 0:
        partners_data = [
            ('p1', 'KIIT University', 'India', 48),
            ('p2', 'Parul University', 'India', 48),
            ('p3', 'Sharda University', 'India', 48),
            ('p4', 'Lovely Professional University (LPU)', 'India', 48),
            ('p5', 'Eastern Mediterranean University', 'Cyprus', 72),
            ('p6', 'Istanbul Aydin University', 'Turkey', 72),
            ('p7', 'RUDN University', 'Russia', 72),
            ('p8', 'University of Mauritius', 'Mauritius', 72)
        ]
        cursor.executemany('INSERT INTO partners (id, institution_name, country, sla_hours) VALUES (?, ?, ?, ?)', partners_data)

    conn.commit()
    conn.close()
    print(f"Successfully initialized persistent database schema in '{DB_FILE}'.")

if __name__ == '__main__':
    init_database()
