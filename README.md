# Zenith — Sprint 3

Organizador de rotina com identidade visual escura e destaque azul. Esta entrega evolui o projeto existente sem substituir sua base.

## Estado real da entrega

- Landing page preservada e identificada como prévia ilustrativa.
- Tarefas locais: cadastrar, listar, editar, cancelar edição, concluir, filtrar, excluir com confirmação e limpar concluídas com confirmação.
- Validação de campos e prazo; erros de armazenamento preservam a lista anterior e não geram sucesso falso. Dados corrompidos bloqueiam gravação para evitar perda.
- Dashboard com total, concluídas, pendentes, percentual e cinco cadastros recentes, calculados dos registros reais deste navegador.
- Hábitos: página informativa com dependências do backend. Cadastro, edição, exclusão e realizações de hábitos **não implementados** por falta de API.
- Login: acesso explícito ao modo local, sem solicitar credenciais. O formulário anterior enviava senha por GET; não existia autenticação real.
- Navegação, estrutura semântica, foco visível, cartões e ajustes de responsividade.

**Não existe API ou persistência no servidor neste repositório.** Não foi criado CRUD REST fictício. O armazenamento `zenith-tarefas` é legado local e não equivale à integração pedida na Sprint. Metas, treinos, contas e sincronização permanecem propostas do produto.

## Tecnologias e estrutura

HTML5, CSS3 e JavaScript nativo. Bootstrap 5.3.3 por CDN nas páginas originais, Inter por Google Fonts. Node.js 22+ e JSDOM somente para desenvolvimento/testes, sem bibliotecas novas de execução no frontend.

```text
index.html              Landing page
login.html              Aviso de autenticação indisponível e acesso local
tarefas.html            Gerenciamento local de tarefas
dashboard.html          Indicadores locais
habitos.html            Situação e dependências da funcionalidade
Static/Style.css        Identidade visual e responsividade
Static/img/logo.png     Logo original
Static/js/dados.js      Leitura e validação do legado, indicadores
Static/js/tarefas.js    Formulário, filtros e operações locais
Static/js/dashboard.js Atualização dos cards e lista recente
tests/                  Testes DOM e verificação de links
docs/SPRINT3.md          Auditoria, bloqueios e contrato necessário
```

## Executar o frontend

Sirva esta pasta com um servidor estático, por exemplo a extensão Live Server do VS Code, e abra `index.html`. Nenhum build é necessário. Use sempre a mesma origem e porta para acessar as mesmas tarefas locais; não há transferência automática entre navegadores ou origens. Não é recomendado abrir por `file://`, cujo comportamento de armazenamento depende do navegador.

Bootstrap e Google Fonts precisam de internet; a fonte tem fallback sans-serif. As páginas de tarefas, dashboard e hábitos não dependem do JavaScript Bootstrap.

## Backend e endpoints

Não há backend para instalar ou executar, arquivo de ambiente ou URL base configurável. Nenhum endpoint foi utilizado e nenhuma requisição fetch foi inventada. Consulte [o bloqueio e requisitos do contrato](docs/SPRINT3.md). Para concluir a integração, a equipe deve fornecer o servidor, instruções de execução, banco e endpoints documentados. Só então será possível implementar e verificar HTTP, carregamento assíncrono, autenticação e persistência real.

## Testes

```sh
npm ci
npm test
```

Sete testes automatizados aprovados com Node Test Runner e JSDOM: operações locais e filtros; campos e prazo; falha de gravação; dados corrompidos; indicadores e texto seguro; dashboard vazio/erro; estrutura e links locais das cinco páginas. Sintaxe JavaScript e `git diff --check` verificados. Instalação das dependências reportou zero vulnerabilidades.

JSDOM não valida layout ou renderização real. Responsividade em celulares/tablets/desktops, console de um navegador real e funcionamento do CDN ainda exigem conferência visual. CRUD REST e hábitos persistidos não puderam ser testados porque não há API.

## Limitações e continuidade

O dashboard não registra histórico de atividades: mostra os últimos cadastros na ordem do legado. Não há usuários, autorização, sincronização, backup remoto ou recuperação de senha. Não apague os dados do navegador sem backup. A conclusão integral da Sprint depende do backend e da validação visual. Commits foram separados por etapa, usando a identidade Git já configurada, sem push.
