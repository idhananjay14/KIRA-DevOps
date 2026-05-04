const { Pool } = require('pg');
let pool;
const connectDB = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};
const query = (text, params) => {
  if (!pool) throw new Error('Database not connected');
  return pool.query(text, params);
};
module.exports = { connectDB, query };
