# Contrato REST Zenith

Base: `/api`, mesma origem do frontend (servido pelo Express). JSON: sucesso `{data: ...}`, erro `{error:{code,message}}`. Exclusões: 204 sem corpo. Datas civis `YYYY-MM-DD`; auditoria em UTC. IDs UUID. Todo dado pessoal pertence ao usuário da sessão, nunca a um `usuario_id` enviado no corpo.

`GET /health`: processo; `GET /ready`: conexão PostgreSQL (503 se indisponível).

## Tarefas

- `GET /tarefas`: lista da conta, mais recentes primeiro.
- `GET /tarefas/:id`: consulta individual.
- `POST /tarefas`: cria (201).
- `PUT /tarefas/:id`: substitui campos editáveis.
- `DELETE /tarefas/:id`: exclui (204).
- `DELETE /tarefas/concluidas`: exclui somente concluídas da conta (204).

Corpo POST/PUT: `{nome: string(1..100), categoria: Estudos|Trabalho|Treino|Pessoal, data: YYYY-MM-DD, concluida: boolean}`. Conclusão omitida equivale a false. Prazo novo deve ser hoje ou futuro (America/Sao_Paulo); PUT permite manter um prazo antigo inalterado. Resposta adiciona id, criado_em e atualizado_em. Identificador de outra conta responde 404.

Todos os endpoints de tarefas, hábitos, importação e dashboard exigem sessão. A API utiliza cookies e autenticação PostgreSQL; a identidade da conta não é aceita no corpo da requisição.

## Hábitos diários

- `GET /habitos?data=YYYY-MM-DD`: lista da conta com registros até a data selecionada (hoje por padrão), realizada nessa data, realizados, dias decorridos e progresso percentual.
- `POST /habitos`: `{nome: string(1..100), descricao?: string(0..500), inicio?: YYYY-MM-DD}`; início padrão hoje, não pode ser futuro (201).
- `PUT /habitos/:id`: `{nome,descricao?}` (200). Início é imutável para preservar histórico.
- `DELETE /habitos/:id`: exclui hábito e registros, após confirmação da interface (204).
- `PUT /habitos/:id/registros/:data`: registra realização idempotente (204).
- `DELETE /habitos/:id/registros/:data`: desmarca realização idempotente (204).

Datas de realização devem estar entre início e hoje, no fuso America/Sao_Paulo. Frequência diária. Progresso = dias realizados / dias corridos inclusivos desde o início até a data consultada; zero se a data é anterior ao início. Dados de outra conta respondem 404. Registros duplicados não aumentam o progresso.

## Migração do legado

`POST /tarefas/importar`: `{tarefas:[{id,nome,categoria,data,concluida}]}`. De 1 a 500 itens por transação, validação integral antes de gravar, aceita prazos antigos. Resposta `{data:{importadas,ignoradas}}`. Chave única `(usuario_id,legado_id)` e ledger separado garantem repetição/concorrência sem duplicar, inclusive após exclusão da tarefa importada. IDs repetidos no mesmo lote são rejeitados. Registros já importados são ignorados; não sobrescrevem edições posteriores. A interface pede confirmação, oferece exportação JSON e mantém `zenith-tarefas` intacto. Mais de 500 itens são enviados em lotes; repetir após falha retoma os lotes faltantes. Se o legado foi criado em outra origem/porta, abra o backup na origem antiga; o navegador não permite ler localStorage de outro site.

## Dashboard

`GET /dashboard`: total, concluidas, pendentes, percentual, habitos `{total,realizados}` de hoje e recentes `[{id,nome,tipo,data}]`. Uma consulta SQL garante snapshot consistente. Recentes contém a última atualização dos oito registros de tarefas/hábitos mais recentes, não uma trilha de auditoria de exclusões. Todos os cálculos são restritos à conta da sessão. Percentual sem tarefas: zero.

## Autenticação

- POST /auth/register: {nome,email,senha}, cria conta e sessão (201). Email único, normalizado em minúsculas.
- POST /auth/login: {email,senha}, cria nova sessão (200).
- GET /auth/me: conta atual e token CSRF (200 ou 401).
- POST /auth/logout: revoga a sessão atual e apaga o cookie (204).

Respostas de cadastro/login/me: {data:{usuario:{id,nome,email},csrf}}. Senhas têm 10 a 128 caracteres, hash scrypt (N=32768,r=8,p=3), salt aleatório de 16 bytes. Nenhum hash é retornado ao navegador. Sessões opacas de 256 bits, apenas SHA-256 do token persistido, expiram em sete dias. Cookie HttpOnly, SameSite=Lax, Secure e prefixo __Host- em produção. Cookie de desenvolvimento: zenith_session.

Cadastro/login exigem Origin permitido e limitam 20 tentativas/15 minutos por IP, por instância. Escritas autenticadas exigem também X-CSRF-Token da sessão. O frontend mantém CSRF em memória e restaura a sessão com /auth/me. Não há credenciais em URL ou localStorage. Consulte README para HTTPS, CORS e implantação.
