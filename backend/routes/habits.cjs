
const { Router } = require('express');
const v = require('../validation.cjs');
const { HttpError } = require('../errors.cjs');
const { transaction } = require('../db.cjs');

function notFound() {
    throw new HttpError(
        404,
        'Hábito não encontrado.',
        'NOT_FOUND'
    );
}

function habitsRouter(pool) {
    const router = Router();

    // GET - Listar hábitos
    router.get('/', async (req, res) => {
        const data = v.date(req.query.data || v.today());

        if (data > v.today()) {
            v.invalid('Não é possível consultar progresso futuro.');
        }

        const { rows } = await pool.query(`
            SELECT
                h.id,
                h.nome,
                h.descricao,
                h.inicio,
                h.criado_em,
                h.atualizado_em,
                COALESCE(r.datas, '[]'::json) AS registros,
                CASE
                    WHEN h.inicio <= $2::date
                    THEN ($2::date - h.inicio + 1)
                    ELSE 0
                END AS dias,
                COALESCE(r.total, 0)::int AS realizados,
                COALESCE(r.hoje, false) AS realizada
            FROM habitos h
            LEFT JOIN LATERAL (
                SELECT
                    json_agg(
                        to_char(data, 'YYYY-MM-DD')
                        ORDER BY data DESC
                    ) AS datas,
                    count(*) AS total,
                    bool_or(data = $2::date) AS hoje
                FROM registros_diarios
                WHERE habito_id = h.id
                  AND data BETWEEN h.inicio AND $2::date
            ) r ON true
            WHERE h.usuario_id = $1
            ORDER BY h.criado_em DESC, h.id
        `, [req.user.id, data]);

        res.json({
            data: rows.map(h => ({
                ...h,
                progresso: h.dias
                    ? Math.round(h.realizados / h.dias * 100)
                    : 0
            }))
        });
    });

    // POST - Cadastrar hábito
    router.post('/', async (req, res) => {
        const body = v.object(req.body);

        const nome = v.text(body.nome, 'Nome', 100);
        const descricao = v.text(
            body.descricao,
            'Descrição',
            500,
            true
        );

        const inicio = v.date(body.inicio || v.today());

        // Nova regra: não permitir início no passado
        if (inicio < v.today()) {
            v.invalid(
                'A data de início deve ser hoje ou uma data futura.'
            );
        }

        const { rows } = await pool.query(`
            INSERT INTO habitos (
                usuario_id,
                nome,
                descricao,
                inicio
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                nome,
                descricao,
                inicio,
                criado_em,
                atualizado_em
        `, [req.user.id, nome, descricao, inicio]);

        res.status(201).json({
            data: rows[0]
        });
    });

    // PUT - Editar hábito
    router.put('/:id', async (req, res) => {
        const body = v.object(req.body);

        const nome = v.text(body.nome, 'Nome', 100);
        const descricao = v.text(
            body.descricao,
            'Descrição',
            500,
            true
        );

        const { rows } = await pool.query(`
            UPDATE habitos
            SET
                nome = $1,
                descricao = $2,
                atualizado_em = clock_timestamp()
            WHERE id = $3
              AND usuario_id = $4
            RETURNING
                id,
                nome,
                descricao,
                inicio,
                criado_em,
                atualizado_em
        `, [
            nome,
            descricao,
            v.id(req.params.id),
            req.user.id
        ]);

        if (!rows[0]) notFound();

        res.json({
            data: rows[0]
        });
    });

    // DELETE - Excluir hábito
    router.delete('/:id', async (req, res) => {
        const result = await pool.query(`
            DELETE FROM habitos
            WHERE id = $1
              AND usuario_id = $2
        `, [
            v.id(req.params.id),
            req.user.id
        ]);

        if (!result.rowCount) notFound();

        res.status(204).end();
    });

    // Registrar ou remover realização diária
    async function record(req, res, remove) {
        const id = v.id(req.params.id);
        const data = v.date(req.params.data);

        if (data > v.today()) {
            v.invalid('Não registre realizações futuras.');
        }

        await transaction(pool, async client => {
            const { rows } = await client.query(`
                SELECT inicio
                FROM habitos
                WHERE id = $1
                  AND usuario_id = $2
                FOR UPDATE
            `, [id, req.user.id]);

            if (!rows[0]) notFound();

            if (data < rows[0].inicio) {
                v.invalid(
                    'A data é anterior ao início do hábito.'
                );
            }

            if (remove) {
                await client.query(`
                    DELETE FROM registros_diarios
                    WHERE habito_id = $1
                      AND data = $2
                `, [id, data]);
            } else {
                await client.query(`
                    INSERT INTO registros_diarios (
                        habito_id,
                        data
                    )
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [id, data]);
            }

            await client.query(`
                UPDATE habitos
                SET atualizado_em = clock_timestamp()
                WHERE id = $1
            `, [id]);
        });

        res.status(204).end();
    }

    router.put(
        '/:id/registros/:data',
        (req, res) => record(req, res, false)
    );

    router.delete(
        '/:id/registros/:data',
        (req, res) => record(req, res, true)
    );

    return router;
}

module.exports = { habitsRouter };
