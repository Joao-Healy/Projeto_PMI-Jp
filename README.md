# Zenith

Aplicação full-stack para organizar tarefas e hábitos diários, com dashboard e dados separados por usuário.

Frontend em HTML, CSS e JavaScript com Fetch API. Backend em Node.js e Express. Persistência em PostgreSQL com `pg`, configurada pelo `.env`. O Express serve as páginas e a API no mesmo endereço, sem build de frontend.

## Instalação e execução

1. Instale Node.js 22.12 ou superior e PostgreSQL. O pgAdmin 4 pode ser usado para administrar o banco.
2. No pgAdmin, conecte ao seu servidor PostgreSQL e crie o banco **zenith_db**. Defina como proprietário o usuário que a aplicação utilizará. Se o banco já existe, mantenha-o: não exclua nem recrie os dados.
3. Na raiz do Zenith, crie um arquivo **.env** usando `.env.example` como referência. Se já tem um `.env`, preserve a configuração existente. Ajuste a conexão para seu usuário, senha e porta:

   ```dotenv
   DATABASE_URL=postgresql://SEU_USUARIO:SUA_SENHA@127.0.0.1:5432/zenith_db
   PORT=3002
   HOST=127.0.0.1
   NODE_ENV=development
   FRONTEND_ORIGINS=http://127.0.0.1:3002,http://localhost:3002
   ```

   Substitua os valores de exemplo. Se a senha contém caracteres especiais, use codificação de URL nesse componente da conexão. Nunca versione o `.env`.

4. No terminal, dentro da pasta `zenith-sprint3`, execute:

   ```sh
   npm install
   npm run dev
   ```

5. Abra **http://127.0.0.1:3002**. Em **Entrar**, escolha **Criar uma conta** e cadastre seu usuário. A senha deve ter de 10 a 128 caracteres.

O PostgreSQL precisa estar em execução antes do Node. Ao iniciar, o servidor conecta usando `DATABASE_URL` e executa `backend/schema.sql` em uma transação. Esse SQL cria as tabelas e índices que ainda não existem; não apaga nem reinicializa registros. O usuário da conexão precisa ser proprietário das tabelas existentes e ter permissão para criar tabelas no schema. O servidor só abre a porta HTTP depois dessa preparação.

Não é preciso PowerShell 7, Live Server, SQLite, Docker ou um segundo servidor para o frontend. Abra as páginas pelo Express, e não por `file://`, para que cookies, sessão e Fetch funcionem na mesma origem.

Para executar sem reinício automático, use `npm start`. Para encerrar, pressione `Ctrl+C`.

### Banco local já configurado neste projeto

A configuração local anterior utiliza a porta **55433** e mantém o cluster em `.postgres/data`. Esse diretório e o `.env` foram preservados. Não substitua a conexão existente pela porta 5432 se está usando esse cluster. Inicie esse servidor com as ferramentas nativas do PostgreSQL, caso esteja parado, por exemplo com `pg_ctl -D "/caminho/do/Zenith/.postgres/data" -l "/caminho/do/Zenith/.postgres/server.log" start` (ajuste os caminhos; `pg_ctl` pertence à pasta `bin` da instalação PostgreSQL).

No pgAdmin, registre o servidor com host `127.0.0.1`, porta `55433` e banco de manutenção `zenith_db`. Use suas credenciais locais. O pgAdmin administra a conexão; ele não inicia o serviço PostgreSQL. Nenhum script PowerShell faz parte da instalação do Zenith.

## Funcionalidades

- Cadastro, login, sessão persistente e logout.
- Tarefas: criar, consultar, editar, concluir, filtrar, excluir com confirmação e limpar concluídas.
- Hábitos diários: criar, listar, editar, excluir com confirmação, marcar/desmarcar realização por data e acompanhar o progresso.
- Dashboard com total de tarefas, concluídas, pendentes, percentual, hábitos realizados hoje e atualizações recentes.
- Validação de formulários e da API, indicadores de carregamento e mensagens de erro/sucesso.
- Importação explícita das tarefas antigas do navegador, com backup JSON e prevenção de duplicações por conta. A cópia antiga permanece intacta.

**PostgreSQL é a fonte principal dos dados.** `localStorage` é apenas lido para recuperar o legado; tarefas novas, hábitos, senhas e tokens de sessão não são gravados nele. O legado só fica acessível no navegador e na mesma origem/porta em que foi criado. A importação não transfere automaticamente dados entre sites ou navegadores.

O progresso de hábitos corresponde aos dias realizados divididos pelos dias desde o início até a data consultada. As atualizações recentes mostram a última alteração dos registros existentes, não um histórico completo de exclusões.

## Estrutura

```text
zenith-sprint3/
├── backend/
│   ├── server.cjs       Express, segurança, páginas e inicialização
│   ├── db.cjs           Pool pg e transações
│   ├── schema.sql       Tabelas e índices, sem apagar dados
│   ├── config.cjs       Variáveis de ambiente
│   ├── errors.cjs       Respostas de erro padronizadas
│   ├── validation.cjs   Validação dos dados recebidos
│   ├── passwords.cjs    Hash e verificação de senhas
│   └── routes/          Autenticação, tarefas, hábitos e dashboard
├── Static/              CSS, JavaScript e logo
├── docs/API.md          Contrato REST
├── index.html
├── login.html
├── tarefas.html
├── habitos.html
├── dashboard.html
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

`.cjs` identifica módulos JavaScript CommonJS do Node (`require` e `module.exports`). O projeto não possui pasta de testes nem dependências ou scripts de teste.

## API e segurança

A API fica em `/api`. [Contrato completo e exemplos de campos](docs/API.md).

| Recurso | Endpoints principais |
| --- | --- |
| Conta | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Tarefas | `GET/POST /api/tarefas`, `GET/PUT/DELETE /api/tarefas/:id` |
| Tarefas concluídas | `DELETE /api/tarefas/concluidas` |
| Importação | `POST /api/tarefas/importar` |
| Hábitos | `GET/POST /api/habitos`, `PUT/DELETE /api/habitos/:id` |
| Realizações diárias | `PUT/DELETE /api/habitos/:id/registros/:data` |
| Dashboard | `GET /api/dashboard` |
| Saúde | `GET /api/health`, `GET /api/ready` |

Senhas são armazenadas com scrypt e salt individual. Sessões duram sete dias, usam cookies HttpOnly e têm apenas o hash do identificador salvo no banco. Todas as consultas de dados pessoais usam o usuário autenticado. Escritas exigem origem autorizada e token CSRF mantido em memória no frontend. Permanecem consultas SQL parametrizadas, Helmet, CORS restrito, validações e limite de tentativas no login/cadastro.

Para produção, use HTTPS, `NODE_ENV=production` e a origem HTTPS exata em `FRONTEND_ORIGINS`. Produção ativa cookie Secure. O limite de tentativas é por processo; múltiplas instâncias exigem armazenamento compartilhado e configuração consciente do proxy. Não há recuperação de senha por email.

## Se não iniciar

- **Falha ao iniciar o Zenith:** confira se o serviço PostgreSQL está ativo, se o banco existe e se a conexão e as permissões do usuário em `DATABASE_URL` estão corretas.
- **Porta ocupada:** altere `PORT` e atualize `FRONTEND_ORIGINS` com a mesma porta. Reinicie o servidor.
- **Origem não autorizada:** acesse pelo endereço permitido no `.env`, sem Live Server ou outro servidor estático.
- **Erro na sessão:** entre novamente. Não use `NODE_ENV=production` em HTTP local.
