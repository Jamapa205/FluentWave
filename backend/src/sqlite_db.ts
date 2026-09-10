import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../fluentwave.sqlite');
export const sqlite = new Database(dbPath);

console.log(`✅ Connected to persistent SQLite database at: ${dbPath}`);
