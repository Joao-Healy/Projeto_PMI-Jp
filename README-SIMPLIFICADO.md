# Zenith — versão demonstrativa

Frontend HTML/CSS/JavaScript, backend Express e PostgreSQL. Login/cadastro são apenas demonstrativos; todas as tarefas e hábitos usam o mesmo usuário local de demonstração.

## Instalação
1. Copie `.env.example` para `.env` e preencha com as credenciais locais (não compartilhe `.env`).
2. No terminal da raiz, execute `npm install` e `npm start`.
3. Abra `http://127.0.0.1:3002/`.
4. Teste `http://127.0.0.1:3002/api/health`, `/api/tarefas` e `/api/dashboard`.

O servidor executa `backend/schema.sql` ao iniciar e cria o usuário demonstrativo se necessário. As tabelas existentes não são apagadas.

## Páginas
- `login.html`: entrada/cadastro visual, sem autenticação real.
- `tarefas.html`: CRUD de tarefas.
- `habitos.html`: CRUD e marcação diária de hábitos.
- `dashboard.html`: indicadores e atividades recentes.

## Atenção
**Uso local apenas.** As rotas não exigem autenticação. Não publique esta versão na internet.

## Sobre o erro anterior
O servidor registra no terminal erros de rotas e arquivos. Se uma página retornar INTERNAL_ERROR, confira o terminal do `npm start`. Se a rota `/api/dashboard` responder mas `tarefas.html` não, verifique se os arquivos HTML estão na raiz do projeto ao lado de `package.json`.
