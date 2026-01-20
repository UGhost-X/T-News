import pg from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

const pool = new Pool(config)

async function migrate() {
  try {
    const sqlPath = path.join(process.cwd(), 'db/migration_vector_search.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Running vector search migration...')
    await pool.query(sql)
    console.log('Migration completed successfully.')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await pool.end()
  }
}

migrate()
