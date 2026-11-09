const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../backend/app.cjs');
test('HTTP: saúde, CORS, JSON inválido e rotas inexistentes', async () => {
  const app = createApp();
  assert.equal((await request(app).get('/api/health')).body.data.status, 'ok');
  await request(app).get('/api/health').set('Origin', 'https://evil.example').expect(403);
  await request(app).options('/api/health').set('Origin', 'http://localhost:3002').set('Access-Control-Request-Method', 'POST').expect(204);
  const invalid = await request(app).post('/api/unknown').set('Content-Type', 'application/json').send('{').expect(400);
  assert.equal(invalid.body.error.code, 'INVALID_JSON');
  await request(app).get('/api/unknown').expect(404);
  for (const url of ['/.env', '/backend/app.cjs', '/package.json']) await request(app).get(url).expect(404);
});
test('HTTP: erro interno não revela segredos e páginas são servidas', async () => {
  const app = createApp({ installRoutes(app) { app.get('/api/fail', () => { throw new Error('SECRET_DATABASE_PASSWORD'); }); } });
  const response = await request(app).get('/api/fail').expect(500);
  assert.ok(!response.text.includes('SECRET'));
  for (const page of ['/', '/login.html', '/tarefas.html', '/dashboard.html', '/habitos.html']) await request(app).get(page).expect(200);
});
