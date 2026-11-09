const { Router } = require('express');
const { today } = require('../validation.cjs');
function dashboardRouter(pool) {
  const router = Router();
  router.get('/', async (req, res) => {
    const { rows } = await pool.query(`WITH resumo AS (
      SELECT count(*)::int AS total, count(*) FILTER (WHERE concluida)::int AS concluidas
      FROM tarefas WHERE usuario_id=$1
    ), habitos_resumo AS (
      SELECT count(*)::int AS total, count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM registros_diarios r WHERE r.habito_id=h.id AND r.data=$2::date
      ))::int AS realizados FROM habitos h WHERE usuario_id=$1 AND inicio<=$2::date
    ), recentes AS (
      SELECT * FROM (
        SELECT id,nome,'tarefa' AS tipo,atualizado_em AS data FROM tarefas WHERE usuario_id=$1
        UNION ALL SELECT id,nome,'hábito' AS tipo,atualizado_em AS data FROM habitos WHERE usuario_id=$1
      ) mudancas ORDER BY data DESC,id LIMIT 8
    ) SELECT resumo.*, (SELECT row_to_json(habitos_resumo) FROM habitos_resumo) AS habitos,
      COALESCE((SELECT json_agg(recentes ORDER BY data DESC,id) FROM recentes),'[]'::json) AS recentes
      FROM resumo`, [req.user.id,today()]);
    const result = rows[0];
    res.json({ data: { ...result, pendentes: result.total-result.concluidas, percentual: result.total ? Math.round(result.concluidas/result.total*100) : 0 } });
  });
  return router;
}
module.exports = { dashboardRouter };
