import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function run() {
  try {
    // Check if column exists
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'tnews' 
      AND table_name = 'users' 
      AND column_name = 'avatar_url'
    `);

    if (checkRes.rows.length === 0) {
      console.log('Adding avatar_url column to tnews.users table...');
      await pool.query('ALTER TABLE tnews.users ADD COLUMN avatar_url text');
      console.log('Column added successfully');
    } else {
      console.log('Column avatar_url already exists');
    }
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

run();
