import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export const getDb = () => {
  if (!pool) {
    const config = {
      connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
    
    pool = new Pool(config)
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })
  }
  
  return pool
}

export const query = (text: string, params?: any[]) => {
  const db = getDb()
  return db.query(text, params)
}
