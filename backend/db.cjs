
const { Pool, types } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
    path: path.join(__dirname, '..', '.env')
});

// Mantém datas no formato YYYY-MM-DD
types.setTypeParser(1082, value => value);

// Cria a conexão com PostgreSQL
function createPool() {
    return new Pool({
        connectionString: process.env.DATABASE_URL
    });
}

// Executa operações dentro de uma transação
async function transaction(pool, callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultado = await callback(client);

        await client.query('COMMIT');
        return resultado;
    } catch (erro) {
        await client.query('ROLLBACK');
        throw erro;
    } finally {
        client.release();
    }
}

// Cria as tabelas necessárias
async function initializeDatabase(pool) {
    const sql = fs.readFileSync(
        path.join(__dirname, 'schema.sql'),
        'utf8'
    );

    await pool.query(sql);
}

module.exports = {
    createPool,
    transaction,
    initializeDatabase
};
