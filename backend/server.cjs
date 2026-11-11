
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { port, host, origins } = require('./config.cjs');
const { createPool, initializeDatabase } = require('./db.cjs');

const { tasksRouter } = require('./routes/tasks.cjs');
const { habitsRouter } = require('./routes/habits.cjs');
const { dashboardRouter } = require('./routes/dashboard.cjs');

const { errorHandler } = require('./errors.cjs');

const app = express();
const pool = createPool();

// Configurações
app.use(cors({ origin: origins }));
app.use(express.json());

// Usuário demonstrativo
async function usuarioDemo(req, res, next) {
    try {
        const resultado = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            ['demo@zenith.local']
        );

        if (resultado.rows.length === 0) {
            return res.status(500).json({
                error: {
                    code: 'DEMO_USER_NOT_FOUND',
                    message: 'Usuário demonstrativo não encontrado.'
                }
            });
        }

        req.user = {
            id: resultado.rows[0].id
        };

        next();
    } catch (erro) {
        next(erro);
    }
}

// API REST
app.use('/api/tarefas', usuarioDemo, tasksRouter(pool));
app.use('/api/habitos', usuarioDemo, habitsRouter(pool));
app.use('/api/dashboard', usuarioDemo, dashboardRouter(pool));

// Verificar servidor
app.get('/api/health', (req, res) => {
    res.json({
        data: {
            status: 'ok'
        }
    });
});

// FRONTEND
const pastaPrincipal = path.resolve(__dirname, '..');

// Arquivos CSS, JavaScript e imagens
app.use('/Static', express.static(
    path.join(pastaPrincipal, 'Static')
));

// Páginas HTML
const paginas = [
    'index.html',
    'login.html',
    'tarefas.html',
    'habitos.html',
    'dashboard.html'
];

paginas.forEach((pagina) => {
    const rota = pagina === 'index.html'
        ? '/'
        : `/${pagina}`;

    app.get(rota, (req, res, next) => {
        const arquivo = path.join(pastaPrincipal, pagina);

        if (!fs.existsSync(arquivo)) {
            return res.status(404).send(
                `Arquivo não encontrado: ${pagina}`
            );
        }
fs.readFile(arquivo, 'utf8', (erro, html) => {
    if (erro) {
        console.error('Erro ao ler HTML:', erro);
        return next(erro);
    }

    res.type('html').send(html);
});
    });
});

// Acesso direto ao index.html
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(pastaPrincipal, 'index.html'));
});

// Tratamento de erros
app.use((erro, req, res, next) => {
    console.error(
        `Erro em ${req.method} ${req.originalUrl}:`,
        erro
    );

    next(erro);
});

app.use(errorHandler);

// Inicializar servidor
async function iniciarServidor() {
    try {
        await initializeDatabase(pool);

        app.listen(port, host, () => {
            console.log(`Zenith: http://${host}:${port}`);
            console.log('Pasta do frontend:', pastaPrincipal);
        });

    } catch (erro) {
        console.error('Erro ao iniciar o Zenith:', erro);
        await pool.end();
        process.exitCode = 1;
    }
}

iniciarServidor();
