import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// If DATABASE_URL is provided, connect to live PostgreSQL (Supabase/Neon/Render)
// Otherwise, gracefully fallback to in-memory store for local testing
const connectionString = process.env.DATABASE_URL;

export const pool = connectionString 
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase.co') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
    })
  : null;

if (pool) {
  pool.on('connect', () => {
    console.log('✅ Connected to live PostgreSQL database.');
  });
  pool.on('error', (err) => {
    console.error('❌ Unexpected database error on idle client', err);
  });
} else {
  console.log('ℹ️ No DATABASE_URL provided. Running with in-memory store for local dev.');
}
