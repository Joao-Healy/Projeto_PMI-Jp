

        const formulario = document.getElementById("formulario");
        const nomeInput = document.getElementById("nome");
        const categoriaInput = document.getElementById("categoria");
        const dataInput = document.getElementById("data");
        const lista = document.getElementById("lista");
        const contador = document.getElementById("contador");
        const mensagem = document.getElementById("mensagem");
        const botaoLimpar = document.getElementById("limpar");


        const agora = new Date();

        agora.setMinutes(
            agora.getMinutes() - agora.getTimezoneOffset()
        );

        const hoje = agora.toISOString().split("T")[0];

        dataInput.min = hoje;

        // Recupera as tarefas salvas no navegador

        let tarefas = [];

        let armazenamentoDisponivel = true;
        try { tarefas = lerTarefas(); }
        catch (erro) { armazenamentoDisponivel = false; mostrarMensagem('Não foi possível ler os dados locais. Nenhum registro será sobrescrito. ' + erro.message, true); }
        let editando = null;
        let filtroAtual = "todas";


        function salvarTarefas(anteriores) {
            if (!armazenamentoDisponivel) { tarefas = anteriores; return false; }
            try {
                localStorage.setItem(
                    "zenith-tarefas",
                    JSON.stringify(tarefas)
                );

                return true;

            } catch (erro) {
                mostrarMensagem(
                    "Não foi possível salvar as tarefas.",
                    true
                );

                return false;
            }
        }


        function mostrarMensagem(texto, erro = false) {
            mensagem.textContent = texto;
            mensagem.style.color = erro ? "#ff8b8b" : "#10b981";
        }

        // Formata a data para o padrão brasileiro

        function formatarData(data) {
            const partes = data.split("-");

            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        // Mostra as tarefas na tela

        function renderizarTarefas() {
            lista.replaceChildren();

            const tarefasVisiveis = tarefas.filter(tarefa => {
                if (filtroAtual === "pendentes") {
                    return !tarefa.concluida;
                }

                if (filtroAtual === "concluidas") {
                    return tarefa.concluida;
                }

                return true;
            });

            if (tarefasVisiveis.length === 0) {
                const vazio = document.createElement("p");

                vazio.className = "vazio";

                vazio.textContent = "Nenhuma tarefa encontrada.";

                lista.appendChild(vazio);
            }

            tarefasVisiveis.forEach(tarefa => {
                const item = document.createElement("div");

                item.className = tarefa.concluida
                    ? "tarefa concluida"
                    : "tarefa";


                const checkbox = document.createElement("input");

                checkbox.type = "checkbox";
                checkbox.checked = tarefa.concluida;
                checkbox.setAttribute(
                    "aria-label",
                    "Marcar tarefa como concluída"
                );

                checkbox.addEventListener("change", () => {
                    alternarConclusao(tarefa.id);
                });

                const informacoes = document.createElement("div");

                informacoes.className = "informacoes";

                const titulo = document.createElement("h3");

                titulo.textContent = tarefa.nome;

                const detalhes = document.createElement("p");

                detalhes.textContent =
                    tarefa.categoria +
                    " | Prazo: " +
                    formatarData(tarefa.data);

                informacoes.append(titulo, detalhes);

                const excluir = document.createElement("button");

                excluir.type = "button";
                excluir.className = "excluir";
                excluir.textContent = "Excluir";

                excluir.addEventListener("click", () => {
                    excluirTarefa(tarefa.id);
                });

                const editar = document.createElement('button');
                editar.type = 'button'; editar.className = 'editar'; editar.textContent = 'Editar';
                editar.addEventListener('click', () => {
                    editando = tarefa.id; nomeInput.value = tarefa.nome; categoriaInput.value = tarefa.categoria; dataInput.value = tarefa.data;
                    dataInput.min = tarefa.data < hoje ? tarefa.data : hoje;
                    formulario.querySelector('[type="submit"]').textContent = 'Salvar alterações';
                    document.getElementById('cancelar').hidden = false;
                    nomeInput.focus();
                });
                item.append(checkbox, informacoes, editar, excluir);

                lista.appendChild(item);
            });


            const pendentes = tarefas.filter(
                tarefa => !tarefa.concluida
            ).length;

            contador.textContent =
                tarefas.length + " tarefa(s) | " +
                pendentes + " pendente(s)";
        }


        formulario.addEventListener("submit", function(evento) {
            evento.preventDefault();

            const nome = nomeInput.value.trim();
            const categoria = categoriaInput.value;
            const data = dataInput.value;

            if (!nome || nome.length > 100 || !categoria || !data) {
                mostrarMensagem(
                    "Preencha todos os campos.",
                    true
                );

                return;
            }

            if (data < hoje && (!editando || tarefas.find(t => t.id === editando)?.data !== data)) {
                mostrarMensagem(
                    "Escolha hoje ou uma data futura.",
                    true
                );

                return;
            }

            const novaTarefa = {
                id: Date.now().toString() +
                    Math.random().toString(16).slice(2),
                nome: nome,
                categoria: categoria,
                data: data,
                concluida: false
            };

            const anteriores = tarefas;
            tarefas = editando ? tarefas.map(t => t.id === editando ? {...t, nome, categoria, data} : t) : [novaTarefa, ...tarefas];

            if (!salvarTarefas(anteriores)) return;
            if (editando && !tarefas.some(t => t.id === editando)) cancelarEdicao();

            cancelarEdicao();
            filtroAtual = "todas";

            atualizarFiltros();

            renderizarTarefas();

            formulario.reset();

            dataInput.min = hoje;

            mostrarMensagem("Tarefa salva neste navegador!");

            nomeInput.focus();
        });


        function alternarConclusao(id) {
            const anteriores = tarefas;
            tarefas = tarefas.map(tarefa => {
                if (tarefa.id === id) {
                    return {
                        ...tarefa,
                        concluida: !tarefa.concluida
                    };
                }

                return tarefa;
            });

            if (!salvarTarefas(anteriores)) return;
            if (editando && !tarefas.some(t => t.id === editando)) cancelarEdicao();

            renderizarTarefas();
        }

        function excluirTarefa(id) {
            if (!confirm("Excluir esta tarefa?")) return;
            const anteriores = tarefas;
            tarefas = tarefas.filter(
                tarefa => tarefa.id !== id
            );

            if (!salvarTarefas(anteriores)) return;
            if (editando && !tarefas.some(t => t.id === editando)) cancelarEdicao();

            renderizarTarefas();

            mostrarMensagem("Tarefa excluída.");
        }

        function atualizarFiltros() {
            document.querySelectorAll("[data-filtro]").forEach(botao => {
                const ativo = botao.dataset.filtro === filtroAtual;

                botao.classList.toggle("ativo", ativo);

                botao.setAttribute(
                    "aria-pressed",
                    String(ativo)
                );
            });
        }


        document.querySelectorAll("[data-filtro]").forEach(botao => {
            botao.addEventListener("click", function() {
                filtroAtual = botao.dataset.filtro;

                atualizarFiltros();

                renderizarTarefas();
            });
        });


        botaoLimpar.addEventListener("click", function() {
            if (!tarefas.some(t => t.concluida) || !confirm("Excluir todas as tarefas concluídas?")) return;
            const anteriores = tarefas;
            tarefas = tarefas.filter(
                tarefa => !tarefa.concluida
            );

            if (!salvarTarefas(anteriores)) return;
            if (editando && !tarefas.some(t => t.id === editando)) cancelarEdicao();

            renderizarTarefas();

            mostrarMensagem("Tarefas concluídas removidas.");
        });

        function cancelarEdicao() {
            editando = null; formulario.reset(); dataInput.min = hoje;
            formulario.querySelector('[type="submit"]').textContent = '+ Adicionar tarefa';
            document.getElementById('cancelar').hidden = true;
        }
        document.getElementById('cancelar').addEventListener('click', cancelarEdicao);
        if (!armazenamentoDisponivel) {
            formulario.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
            botaoLimpar.disabled = true;
        }
        atualizarFiltros();
        renderizarTarefas();
