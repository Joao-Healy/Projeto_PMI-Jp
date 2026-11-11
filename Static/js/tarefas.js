
const formulario = document.getElementById('formulario');
const nome = document.getElementById('nome');
const categoria = document.getElementById('categoria');
const data = document.getElementById('data');
const lista = document.getElementById('lista');
const mensagem = document.getElementById('mensagem');
const cancelar = document.getElementById('cancelar');
const recarregar = document.getElementById('recarregar');

const hoje = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

let tarefas = [];
let editando = null;
let filtro = 'todas';
let carregando = false;
let pronto = false;

data.min = hoje;

// Mostrar mensagens
function mostrarMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.style.color = erro ? '#ffb4b4' : '#10b981';
}

// Bloquear botões durante operações
function bloquear(valor) {
    carregando = valor;

    document.querySelectorAll(
        '#formulario input, #formulario select, #formulario button, #lista button, #lista input, #limpar'
    ).forEach(elemento => {
        elemento.disabled = carregando || !pronto;
    });

    recarregar.disabled = carregando;
}

// Limpar formulário
function limparFormulario() {
    editando = null;
    formulario.reset();
    data.min = hoje;
    cancelar.hidden = true;
    formulario.querySelector('[type="submit"]').textContent = '+ Adicionar tarefa';
}

// Buscar tarefas no PostgreSQL
async function carregarTarefas() {
    if (carregando) return;

    carregando = true;
    bloquear(true);

    try {
        tarefas = await TarefasAPI.listar();
        pronto = true;
        mostrarTarefas();
        mostrarMensagem('Tarefas carregadas!');
    } catch (erro) {
        pronto = false;
        mostrarMensagem(erro.message, true);
    } finally {
        carregando = false;
        bloquear(false);
    }
}

// Exibir tarefas na página
function mostrarTarefas() {
    lista.innerHTML = '';

    const filtradas = tarefas.filter(tarefa => {
        if (filtro === 'concluidas') return tarefa.concluida;
        if (filtro === 'pendentes') return !tarefa.concluida;
        return true;
    });

    if (filtradas.length === 0) {
        const vazio = document.createElement('p');
        vazio.className = 'vazio';
        vazio.textContent = 'Nenhuma tarefa encontrada.';
        lista.appendChild(vazio);
    }

    filtradas.forEach(tarefa => {
        const item = document.createElement('div');
        item.className = 'tarefa';

        if (tarefa.concluida) {
            item.classList.add('concluida');
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = tarefa.concluida;
        checkbox.setAttribute('aria-label', `Concluir ${tarefa.nome}`);

        checkbox.addEventListener('change', () => {
            salvarOperacao(() =>
                TarefasAPI.editar(tarefa.id, {
                    nome: tarefa.nome,
                    categoria: tarefa.categoria,
                    data: tarefa.data,
                    concluida: checkbox.checked
                })
            );
        });

        const informacoes = document.createElement('div');
        informacoes.className = 'informacoes';

        const titulo = document.createElement('h3');
        titulo.textContent = tarefa.nome;

        const detalhes = document.createElement('p');
        detalhes.textContent =
            `${tarefa.categoria} | Prazo: ${tarefa.data.split('-').reverse().join('/')}`;

        informacoes.append(titulo, detalhes);

        const editar = document.createElement('button');
        editar.type = 'button';
        editar.className = 'editar';
        editar.textContent = 'Editar';

        editar.addEventListener('click', () => {
            editando = tarefa.id;

            nome.value = tarefa.nome;
            categoria.value = tarefa.categoria;
            data.value = tarefa.data;
            data.min = tarefa.data < hoje ? tarefa.data : hoje;

            cancelar.hidden = false;
            formulario.querySelector('[type="submit"]').textContent =
                'Salvar alterações';

            nome.focus();
        });

        const excluir = document.createElement('button');
        excluir.type = 'button';
        excluir.className = 'excluir';
        excluir.textContent = 'Excluir';

        excluir.addEventListener('click', () => {
            if (confirm(`Excluir a tarefa "${tarefa.nome}"?`)) {
                salvarOperacao(() => TarefasAPI.excluir(tarefa.id));
            }
        });

        item.append(checkbox, informacoes, editar, excluir);
        lista.appendChild(item);
    });

    document.getElementById('contador').textContent =
        `${tarefas.length} tarefa(s) | ${tarefas.filter(t => !t.concluida).length} pendente(s)`;

    document.querySelectorAll('[data-filtro]').forEach(botao => {
        const ativo = botao.dataset.filtro === filtro;
        botao.classList.toggle('ativo', ativo);
        botao.setAttribute('aria-pressed', String(ativo));
    });

    bloquear(carregando);
}

// Salvar alterações no banco
async function salvarOperacao(operacao) {
    if (carregando || !pronto) return;

    carregando = true;
    bloquear(true);

    try {
        await operacao();

        tarefas = await TarefasAPI.listar();
        limparFormulario();
        mostrarTarefas();

        mostrarMensagem('Operação realizada com sucesso!');
    } catch (erro) {
        mostrarMensagem(erro.message, true);
        await carregarDepoisDoErro();
    } finally {
        carregando = false;
        bloquear(false);
    }
}

async function carregarDepoisDoErro() {
    try {
        tarefas = await TarefasAPI.listar();
        mostrarTarefas();
    } catch {
        pronto = false;
    }
}

// Criar ou editar tarefa
formulario.addEventListener('submit', event => {
    event.preventDefault();

    if (!formulario.reportValidity()) return;

    const tarefa = {
        nome: nome.value.trim(),
        categoria: categoria.value,
        data: data.value,
        concluida: tarefas.find(t => t.id === editando)?.concluida || false
    };

    if (!tarefa.nome) {
        mostrarMensagem('Digite o nome da tarefa.', true);
        return;
    }

    if (editando) {
        salvarOperacao(() => TarefasAPI.editar(editando, tarefa));
    } else {
        salvarOperacao(() => TarefasAPI.criar(tarefa));
    }
});

// Cancelar edição
cancelar.addEventListener('click', limparFormulario);

// Filtrar tarefas
document.querySelectorAll('[data-filtro]').forEach(botao => {
    botao.addEventListener('click', () => {
        filtro = botao.dataset.filtro;
        mostrarTarefas();
    });
});

// Excluir tarefas concluídas
document.getElementById('limpar').addEventListener('click', () => {
    if (tarefas.some(t => t.concluida) &&
        confirm('Excluir todas as tarefas concluídas?')) {
        salvarOperacao(() => TarefasAPI.limpar());
    }
});

// Recarregar tarefas
recarregar.addEventListener('click', carregarTarefas);

window.addEventListener('zenith:imported', carregarTarefas);

// Iniciar página
carregarTarefas();
