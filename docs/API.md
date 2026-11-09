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

O acesso aos dados permanece fechado (401) até a implementação de sessões na etapa 7; testes internos injetam identidade exclusivamente na construção da aplicação de teste.

## Hábitos diários

- `GET /habitos?data=YYYY-MM-DD`: lista da conta com registros até a data selecionada (hoje por padrão), realizada nessa data, realizados, dias decorridos e progresso percentual.
- `POST /habitos`: `{nome: string(1..100), descricao?: string(0..500), inicio?: YYYY-MM-DD}`; início padrão hoje, não pode ser futuro (201).
- `PUT /habitos/:id`: `{nome,descricao?}` (200). Início é imutável para preservar histórico.
- `DELETE /habitos/:id`: exclui hábito e registros, após confirmação da interface (204).
- `PUT /habitos/:id/registros/:data`: registra realização idempotente (204).
- `DELETE /habitos/:id/registros/:data`: desmarca realização idempotente (204).

Datas de realização devem estar entre início e hoje, no fuso America/Sao_Paulo. Frequência diária. Progresso = dias realizados / dias corridos inclusivos desde o início até a data consultada; zero se a data é anterior ao início. Dados de outra conta respondem 404. Registros duplicados não aumentam o progresso.
