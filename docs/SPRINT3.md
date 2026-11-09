# Sprint 3 — auditoria e bloqueios

Repositório analisado: index.html, login.html, tarefas.html, Static/Style.css e logo.
HTML5, CSS3, JavaScript nativo e Bootstrap 5.3.3 por CDN. Landing page, formulário visual de login e tarefas locais com filtros, conclusão e exclusão. Não existe servidor, banco, dependências de backend, contrato de API ou URL documentada.

## Etapa 1: bloqueada
Não há endpoints reais para consumir com fetch. Nenhuma integração REST ou persistência no servidor foi implementada. O armazenamento legado zenith-tarefas será preservado, identificado como local. Não inventamos endpoints nem criamos um servidor fora do escopo.

## Contrato necessário (a definir pelo backend)
A equipe precisa fornecer URL base, autenticação, CORS, formato de sucesso/erro e métodos/rotas reais para listar, consultar, criar, editar e excluir tarefas e hábitos. Tarefas precisam de identificador, nome, categoria, prazo e conclusão. Hábitos precisam de identificador, nome, frequência e histórico de realizações por data; definir fuso e regra de progresso. Datas de criação/alteração ou histórico são necessários para atividades recentes confiáveis.

Sem esse contrato, CRUD REST, hábitos persistidos no servidor e autenticação permanecem pendentes. Os nomes acima são requisitos de dados, não endpoints existentes.
