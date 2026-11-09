const { Router } = require('express');
const v = require('../validation.cjs');
const { HttpError } = require('../errors.cjs');
const { transaction } = require('../db.cjs');
function notFound() { throw new HttpError(404, 'Tarefa não encontrada.', 'NOT_FOUND'); }
const columns = 'id, nome, categoria, data, concluida, criado_em, atualizado_em';
function tasksRouter(pool) {
  const router = Router();
  router.post('/importar', async (req, res) => {
    const body = v.object(req.body);
    if (!Array.isArray(body.tarefas) || !body.tarefas.length || body.tarefas.length > 500) v.invalid('Importe entre 1 e 500 tarefas por vez.');
    const entries = body.tarefas.map(entry => ({ ...v.task(entry, null, true), legado_id: v.text(entry.id, 'ID legado', 200) }));
    if (new Set(entries.map(t => t.legado_id)).size !== entries.length) v.invalid('Há IDs repetidos no arquivo local. Nenhum registro foi importado.');
    entries.sort((a,b) => a.legado_id.localeCompare(b.legado_id));
    const imported = await transaction(pool, async client => {
      let count = 0;
      for (const t of entries) {
        const ledger = await client.query('INSERT INTO importacoes_tarefas(usuario_id,legado_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING legado_id', [req.user.id,t.legado_id]);
        if (!ledger.rowCount) continue;
        const { rows } = await client.query('INSERT INTO tarefas(usuario_id,nome,categoria,data,concluida) VALUES ($1,$2,$3,$4,$5) RETURNING id', [req.user.id,t.nome,t.categoria,t.data,t.concluida]);
        await client.query('UPDATE importacoes_tarefas SET tarefa_id=$1 WHERE usuario_id=$2 AND legado_id=$3', [rows[0].id,req.user.id,t.legado_id]);
        count++;
      }
      return count;
    });
    res.json({ data: { importadas: imported, ignoradas: entries.length-imported } });
  });
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
