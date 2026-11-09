const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../backend/app.cjs');
const { isolatedDatabase } = require('./db-helper.cjs');
async function fixture(t) {
  const pool = await isolatedDatabase(t);
  const { rows } = await pool.query("INSERT INTO usuarios(nome,email,senha_hash) VALUES ('A','a@example.com','test-only'),('B','b@example.com','test-only') RETURNING id");
  const clients = rows.map(user => request(createApp({ pool, authenticate(req, res, next) { req.user = user; next(); } })));
  return { pool, clients };
}
const valid = { nome: 'Estudar', categoria: 'Estudos', data: '2099-12-31', concluida: false };
test('PostgreSQL + HTTP: CRUD de tarefas, validação e isolamento de proprietário', { skip: !process.env.TEST_DATABASE_URL }, async t => {
  const { pool, clients: [a,b] } = await fixture(t);
  await request(createApp({pool})).get('/api/tarefas').expect(401);
  const created = (await a.post('/api/tarefas').send(valid).expect(201)).body.data;
  assert.equal((await a.get('/api/tarefas').expect(200)).body.data.length,1);
  assert.equal((await b.get('/api/tarefas').expect(200)).body.data.length,0);
  await b.get('/api/tarefas/'+created.id).expect(404);
  await b.put('/api/tarefas/'+created.id).send(valid).expect(404);
  await b.delete('/api/tarefas/'+created.id).expect(404);
  const updated = (await a.put('/api/tarefas/'+created.id).send({...valid,nome:'Revisar',concluida:true}).expect(200)).body.data;
  assert.equal(updated.nome,'Revisar'); assert.equal(updated.concluida,true);
  assert.equal((await pool.query('SELECT nome FROM tarefas WHERE id=$1',[created.id])).rows[0].nome,'Revisar');
  for (const body of [{...valid,nome:' '},{...valid,categoria:'Outro'},{...valid,data:'2099-02-30'},{...valid,data:'2000-01-01'},{...valid,concluida:'true'}]) await a.post('/api/tarefas').send(body).expect(400);
  await a.get('/api/tarefas/invalido').expect(400);
  await a.delete('/api/tarefas/'+created.id).expect(204);
  await a.get('/api/tarefas/'+created.id).expect(404);
  assert.equal((await pool.query('SELECT count(*) FROM tarefas')).rows[0].count,'0');
});
module.exports = { fixture, valid };
