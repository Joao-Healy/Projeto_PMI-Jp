const { Router } = require('express');
const v = require('./validation.cjs');
const { HttpError } = require('./errors.cjs');
function notFound() { throw new HttpError(404, 'Tarefa não encontrada.', 'NOT_FOUND'); }
const columns = 'id, nome, categoria, data, concluida, criado_em, atualizado_em';
function tasksRouter(pool) {
  const router = Router();
  router.get('/', async (req, res) => {
    const { rows } = await pool.query(`SELECT ${columns} FROM tarefas WHERE usuario_id=$1 ORDER BY criado_em DESC, id`, [req.user.id]);
    res.json({ data: rows });
  });
  router.post('/', async (req, res) => {
    const t = v.task(req.body);
    const { rows } = await pool.query(`INSERT INTO tarefas(usuario_id,nome,categoria,data,concluida) VALUES ($1,$2,$3,$4,$5) RETURNING ${columns}`, [req.user.id, t.nome, t.categoria, t.data, t.concluida]);
    res.status(201).json({ data: rows[0] });
  });
  router.delete('/concluidas', async (req, res) => {
    await pool.query('DELETE FROM tarefas WHERE usuario_id=$1 AND concluida=true', [req.user.id]);
    res.status(204).end();
  });
  router.get('/:id', async (req, res) => {
    const { rows } = await pool.query(`SELECT ${columns} FROM tarefas WHERE id=$1 AND usuario_id=$2`, [v.id(req.params.id), req.user.id]);
    if (!rows[0]) notFound();
    res.json({ data: rows[0] });
  });
  router.put('/:id', async (req, res) => {
    const id = v.id(req.params.id);
    const previous = await pool.query('SELECT data FROM tarefas WHERE id=$1 AND usuario_id=$2', [id, req.user.id]);
    if (!previous.rows[0]) notFound();
    const t = v.task(req.body, previous.rows[0]);
    const { rows } = await pool.query(`UPDATE tarefas SET nome=$1,categoria=$2,data=$3,concluida=$4,atualizado_em=clock_timestamp() WHERE id=$5 AND usuario_id=$6 RETURNING ${columns}`, [t.nome, t.categoria, t.data, t.concluida, id, req.user.id]);
    if (!rows[0]) notFound();
    res.json({ data: rows[0] });
  });
  router.delete('/:id', async (req, res) => {
    const result = await pool.query('DELETE FROM tarefas WHERE id=$1 AND usuario_id=$2', [v.id(req.params.id), req.user.id]);
    if (!result.rowCount) notFound();
    res.status(204).end();
  });
  return router;
}
module.exports = { tasksRouter };
