
process.env.DB_HOST='localhost';
process.env.DB_PORT='5432';
process.env.DB_USER='postgres';
process.env.DB_PASSWORD='Sxq599635';
process.env.DB_NAME='t-news';

import { query } from '../server/utils/db';

async function run() {
  try {
    const res = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'tnews' AND table_name = 'news_items'
    `);
    // console.log('Columns:', res.rows.map(r => r.column_name));
    
    // Check if translation_data exists
    const hasTranslation = res.rows.some(r => r.column_name === 'translation_data');
    if (!hasTranslation) {
        console.log('Adding translation_data column...');
        await query('ALTER TABLE tnews.news_items ADD COLUMN translation_data JSONB DEFAULT NULL');
        console.log('Added translation_data column.');
    } else {
        console.log('translation_data column already exists.');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
