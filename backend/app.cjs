const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('node:path');
const { origins } = require('./config.cjs');
const { HttpError, errorHandler } = require('./errors.cjs');
const { tasksRouter } = require('./tasks.cjs');
const { habitsRouter } = require('./habits.cjs');
const { dashboardRouter } = require('./dashboard.cjs');

function createApp({ installRoutes = () => {}, allowedOrigins = origins, pool, authenticate } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'], connectSrc: ["'self'", ...allowedOrigins],
    upgradeInsecureRequests: null,
  } } }));
  app.use(cors({ credentials: true, origin(origin, callback) {
    callback(origin && !allowedOrigins.includes(origin) ? new HttpError(403, 'Origem não autorizada.', 'ORIGIN_DENIED') : null, true);
  } }));
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));
  if (pool) {
    app.get('/api/ready', async (req, res) => {
      try { await pool.query('SELECT 1'); res.json({ data: { status: 'ok', database: 'postgresql' } }); }
      catch { throw new HttpError(503, 'Banco indisponível.', 'DATABASE_UNAVAILABLE'); }
    });
    // Até a etapa de login não existe acesso anônimo a dados pessoais.
    const requireUser = authenticate || ((req, res, next) => next(new HttpError(401, 'Entre na sua conta.', 'UNAUTHENTICATED')));
    app.use('/api/tarefas', requireUser, tasksRouter(pool));
    app.use('/api/habitos', requireUser, habitsRouter(pool));
    app.use('/api/dashboard', requireUser, dashboardRouter(pool));
  }
  installRoutes(app);
  app.use('/api', (req, res, next) => next(new HttpError(404, 'Rota não encontrada.', 'NOT_FOUND')));
  // Lista explícita: nunca expor .env, SQL, testes ou código do servidor.
  const root = path.join(__dirname, '..');
  for (const page of ['index.html', 'login.html', 'tarefas.html', 'dashboard.html', 'habitos.html']) {
    app.get(page === 'index.html' ? ['/', '/index.html'] : `/${page}`, (req, res) => res.sendFile(page, { root, dotfiles: 'allow' }));
  }
  app.use('/Static', express.static(path.join(root, 'Static'), { dotfiles: 'deny' }));
  app.use((req, res, next) => next(new HttpError(404, 'Página não encontrada.', 'NOT_FOUND')));
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
