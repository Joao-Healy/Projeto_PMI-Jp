
const formulario = document.getElementById('login-form');
const titulo = document.getElementById('login-titulo');
const botaoCadastro = document.getElementById('alternar-cadastro');
const campoNome = document.getElementById('nome-campo');
const botaoEntrar = formulario.querySelector('button[type="submit"]');

let cadastro = false;

// Alternar entre login e cadastro
botaoCadastro.addEventListener('click', () => {
    cadastro = !cadastro;

    campoNome.hidden = !cadastro;
    titulo.textContent = cadastro ? 'Criar uma conta' : 'Acesse sua conta';

    botaoEntrar.textContent = cadastro ? 'Cadastrar' : 'Entrar';
    botaoCadastro.textContent = cadastro ? 'Já tenho uma conta' : 'Criar uma conta';

    document.getElementById('login-nome').required = cadastro;
});

// Simular login ou cadastro
formulario.addEventListener('submit', (event) => {
    event.preventDefault();

    if (cadastro) {
        alert('Cadastro realizado com sucesso!');

        botaoCadastro.click();
        formulario.reset();
    } else {
        window.location.href = 'tarefas.html';
    }
});
