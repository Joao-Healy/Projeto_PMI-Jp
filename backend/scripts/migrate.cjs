const { createPool, migrate } = require('../db.cjs');
(async () => {
  const pool = createPool();
  try { await migrate(pool); console.log('Schema Zenith aplicado.'); }
  finally { await pool.end(); }
})().catch(() => { console.error('Falha na migration. Verifique PostgreSQL, DATABASE_URL e permissões.'); process.exitCode = 1; });
