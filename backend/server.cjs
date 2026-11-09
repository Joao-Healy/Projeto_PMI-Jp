const { createApp } = require('./app.cjs');
const { port, host } = require('./config.cjs');
const server = createApp().listen(port, host, () => console.log(`Zenith: http://${host}:${port}`));
server.on('error', () => { console.error('Não foi possível iniciar o servidor. Verifique HOST e PORT.'); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
