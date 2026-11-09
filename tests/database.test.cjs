const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isolatedDatabase } = require('./db-helper.cjs');
const { migrate, transaction } = require('../backend/db.cjs');
test('PostgreSQL real: schema idempotente, rollback e restrições', { skip: !process.env.TEST_DATABASE_URL }, async t => {
  const pool = await isolatedDatabase(t);
  await migrate(pool);
  assert.equal((await pool.query('SELECT count(*) FROM tarefas')).rows[0].count, '0');
  await assert.rejects(transaction(pool, async client => {
    await client.query("INSERT INTO usuarios(nome,email,senha_hash) VALUES ('Teste','teste@example.com','hash-teste')");
    throw new Error('rollback');
  }), /rollback/);
  assert.equal((await pool.query('SELECT count(*) FROM usuarios')).rows[0].count, '0');
  await assert.rejects(pool.query("INSERT INTO tarefas(usuario_id,nome,categoria,data) VALUES (gen_random_uuid(),'Tarefa','Estudos','2026-11-09')"), { code: '23503' });
});
