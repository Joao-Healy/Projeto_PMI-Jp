const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('node:path');
const { port, host, origins } = require('./config.cjs');
const { createPool, initializeDatabase } = require('./db.cjs');
const { HttpError, errorHandler } = require('./errors.cjs');
const { createAuth } = require('./routes/auth.cjs');
const { tasksRouter } = require('./routes/tasks.cjs');
const { habitsRouter } = require('./routes/habits.cjs');
const { dashboardRouter } = require('./routes/dashboard.cjs');

async function start() {
  const pool = createPool();
  try {
    // O banco já deve existir; as tabelas são criadas sem apagar dados.
    await initializeDatabase(pool);
    const app = express();
    app.disable('x-powered-by');
    app.use(helmet({ contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'], connectSrc: ["'self'", ...origins],
      upgradeInsecureRequests: null,
    } } }));
    app.use(cors({ credentials: true, origin(origin, callback) {
      callback(origin && !origins.includes(origin) ? new HttpError(403, 'Origem não autorizada.', 'ORIGIN_DENIED') : null, true);
    } }));
    app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
    app.use(express.json({ limit: '256kb' }));
    app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));
    app.get('/api/ready', async (req, res) => {
      try { await pool.query('SELECT 1'); res.json({ data: { status: 'ok', database: 'postgresql' } }); }
      catch { throw new HttpError(503, 'Banco indisponível.', 'DATABASE_UNAVAILABLE'); }
    });
    const auth = createAuth(pool, origins);
    app.use('/api/auth', auth.router);
    app.use('/api/tarefas', auth.guard, tasksRouter(pool));
    app.use('/api/habitos', auth.guard, habitsRouter(pool));
    app.use('/api/dashboard', auth.guard, dashboardRouter(pool));
    app.use('/api', (req, res, next) => next(new HttpError(404, 'Rota não encontrada.', 'NOT_FOUND')));

    // Servir somente as páginas públicas e assets. .env e backend não são publicados.
    const root = path.join(__dirname, '..');
    for (const page of ['index.html', 'login.html', 'tarefas.html', 'dashboard.html', 'habitos.html']) {
      app.get(page === 'index.html' ? ['/', '/index.html'] : `/${page}`, (req, res) => res.sendFile(page, { root, dotfiles: 'allow' }));
    }
    app.use('/Static', express.static(path.join(root, 'Static'), { dotfiles: 'deny' }));
    app.use((req, res, next) => next(new HttpError(404, 'Página não encontrada.', 'NOT_FOUND')));
    app.use(errorHandler);

    const server = app.listen(port, host, () => console.log(`Zenith: http://${host}:${port}`));
    server.on('error', async () => {
      console.error('Não foi possível iniciar o servidor. Verifique HOST e PORT.');
      await pool.end(); process.exitCode = 1;
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
    }
  } catch (error) { await pool.end(); throw error; }
}

start().catch(() => {
  console.error('Não foi possível iniciar o Zenith. Verifique DATABASE_URL no .env, o serviço PostgreSQL e as permissões de acesso/criação de tabelas.');
  process.exitCode = 1;
});
