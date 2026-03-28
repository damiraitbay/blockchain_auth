import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL in .env (e.g. postgresql://USER:PASS@localhost:5432/blockchain_auth)');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '../migrations');
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Applied: ${file}`);
  }
  console.log('All migrations finished.');
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await pool.end();
}
