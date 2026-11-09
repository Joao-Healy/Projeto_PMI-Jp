# Sprint 3 — auditoria e bloqueios

Repositório analisado: index.html, login.html, tarefas.html, Static/Style.css e logo.
HTML5, CSS3, JavaScript nativo e Bootstrap 5.3.3 por CDN. Landing page, formulário visual de login e tarefas locais com filtros, conclusão e exclusão. Não existe servidor, banco, dependências de backend, contrato de API ou URL documentada.

## Etapa 1: bloqueada
Não há endpoints reais para consumir com fetch. Nenhuma integração REST ou persistência no servidor foi implementada. O armazenamento legado zenith-tarefas será preservado, identificado como local. Não inventamos endpoints nem criamos um servidor fora do escopo.

## Contrato necessário (a definir pelo backend)
A equipe precisa fornecer URL base, autenticação, CORS, formato de sucesso/erro e métodos/rotas reais para listar, consultar, criar, editar e excluir tarefas e hábitos. Tarefas precisam de identificador, nome, categoria, prazo e conclusão. Hábitos precisam de identificador, nome, frequência e histórico de realizações por data; definir fuso e regra de progresso. Datas de criação/alteração ou histórico são necessários para atividades recentes confiáveis.

Sem esse contrato, CRUD REST, hábitos persistidos no servidor e autenticação permanecem pendentes. Os nomes acima são requisitos de dados, não endpoints existentes.

## Resultado das etapas restantes
- Etapa 2: semântica, navegação e scripts separados; formulário que expunha senha por GET substituído por aviso e acesso local.
- Etapa 3: dashboard dinâmico local, explicitamente identificado. Atividades recentes limitadas à ordem de cadastro, sem histórico fictício.
- Etapa 4: página de hábitos e requisitos visíveis; gerenciamento bloqueado pela ausência de backend.
- Etapa 5: regras CSS para cartões, menu flexível, foco, formulários e telas estreitas; validação visual ainda pendente.
- Etapa 6: sete testes JSDOM aprovados, sintaxe JS e diff verificados; edição local e cancelamento, confirmação de exclusão e rollback em falhas de armazenamento. Não houve testes reais de REST ou inspeção em navegador.
- Etapa 7: README atualizado com execução, arquitetura, recursos reais e limitações.

A mensagem do commit da etapa 1 descreve o bloqueio, em vez de afirmar falsamente uma integração concluída; o mesmo vale para hábitos. Nenhum push realizado.
