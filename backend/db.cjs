require('./config.cjs');
const { Pool, types } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
// DATE financeira/civil permanece YYYY-MM-DD sem conversão de fuso.
types.setTypeParser(1082, value => value);
function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('Configure DATABASE_URL no .env.');
  const pool = new Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  pool.on('error', () => console.error('Conexão PostgreSQL indisponível.'));
  return pool;
}
async function transaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
async function migrate(pool) {
  await pool.query(fs.readFileSync(path.join(__dirname, 'sql/01-schema.sql'), 'utf8'));
}
module.exports = { createPool, transaction, migrate };
