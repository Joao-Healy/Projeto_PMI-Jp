const { randomUUID } = require('node:crypto');
const { createPool, migrate } = require('../backend/db.cjs');
async function isolatedDatabase(t) {
  const connection = process.env.TEST_DATABASE_URL;
  if (!connection) throw new Error('Configure TEST_DATABASE_URL para executar testes reais.');
  const name = new URL(connection).pathname.slice(1);
  if (!name.includes('test')) throw new Error('TEST_DATABASE_URL deve apontar para banco com nome contendo test.');
  if (connection === process.env.DATABASE_URL) throw new Error('Não use o banco da aplicação para testes.');
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const admin = createPool(connection);
  await admin.query(`CREATE SCHEMA "${schema}"`);
  const url = new URL(connection);
  url.searchParams.set('options', `-c search_path=${schema}`);
  const pool = createPool(url.toString());
  t.after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.end();
  });
  await migrate(pool);
  return pool;
}
module.exports = { isolatedDatabase };
