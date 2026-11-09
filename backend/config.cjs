const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const port = Number(process.env.PORT || 3002);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida.');
const origins = (process.env.FRONTEND_ORIGINS || `http://127.0.0.1:${port},http://localhost:${port}`)
  .split(',').map(value => value.trim()).filter(Boolean);
module.exports = { port, origins, host: process.env.HOST || '127.0.0.1', production: process.env.NODE_ENV === 'production' };
