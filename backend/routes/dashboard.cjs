
const express = require('express');
const { today } = require('../validation.cjs');

function dashboardRouter(pool) {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const usuarioId = req.user.id;
    const dataHoje = today();

    // 1. Buscar resumo das tarefas
    const tarefas = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE concluida)::int AS concluidas
      FROM tarefas
      WHERE usuario_id = $1
    `, [usuarioId]);

    // 2. Buscar resumo dos hábitos
    const habitos = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM registros_diarios r
            WHERE r.habito_id = h.id
              AND r.data = $2::date
          )
        )::int AS realizados
      FROM habitos h
      WHERE usuario_id = $1
        AND inicio <= $2::date
    `, [usuarioId, dataHoje]);

    // 3. Buscar atividades recentes
    const recentes = await pool.query(`
      SELECT * FROM (
        SELECT id, nome, 'tarefa' AS tipo,
               atualizado_em AS data
        FROM tarefas
        WHERE usuario_id = $1

        UNION ALL

        SELECT id, nome, 'hábito' AS tipo,
               atualizado_em AS data
        FROM habitos
        WHERE usuario_id = $1
      ) atividades
      ORDER BY data DESC, id
      LIMIT 8
    `, [usuarioId]);

    // 4. Calcular indicadores
    const resumo = tarefas.rows[0];
    const total = resumo.total;
    const concluidas = resumo.concluidas;

    const percentual = total > 0
      ? Math.round((concluidas / total) * 100)
      : 0;

    // 5. Enviar dados para o frontend
    res.json({
      data: {
        total,
        concluidas,
        pendentes: total - concluidas,
        percentual,
        habitos: habitos.rows[0],
        recentes: recentes.rows
      }
    });
  });

  return router;
}

module.exports = { dashboardRouter };
