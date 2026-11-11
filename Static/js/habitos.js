
'use strict';

(() => {
    const form = document.getElementById('habito-form');
    const nome = document.getElementById('habito-nome');
    const descricao = document.getElementById('habito-descricao');
    const inicio = document.getElementById('habito-inicio');

    const dia = document.getElementById('habito-dia');
    const lista = document.getElementById('habito-lista');
    const status = document.getElementById('habito-status');
    const cancelar = document.getElementById('habito-cancelar');
    const recarregar = document.getElementById('habito-recarregar');

    function dataHoje() {
        const partes = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());

        const obter = tipo => partes.find(p => p.type === tipo).value;

        return `${obter('year')}-${obter('month')}-${obter('day')}`;
    }

    let editing = null;
    let busy = false;
    let ready = false;

    function atualizarDatas() {
        const hoje = dataHoje();

        // Cadastro: hoje ou futuro
        inicio.min = hoje;
        inicio.removeAttribute('max');

        // Histórico: não consultar o futuro
        dia.max = hoje;

        if (!dia.value || dia.value > hoje) {
            dia.value = hoje;
        }

        if (!editing && (!inicio.value || inicio.value < hoje)) {
            inicio.value = hoje;
        }
    }

    atualizarDatas();

    function lock(value) {
        busy = value;

        lista.setAttribute('aria-busy', String(value));

        document.querySelectorAll(
            '#habito-form input, #habito-form textarea, ' +
            '#habito-form button, #habito-lista button, #habito-dia'
        ).forEach(elemento => {
            elemento.disabled = value || !ready;
        });

        inicio.disabled = value || !!editing || !ready;
        recarregar.disabled = value;
    }

    function cancel() {
        editing = null;
        form.reset();

        inicio.disabled = false;
        cancelar.hidden = true;

        form.querySelector('[type=submit]').textContent =
            'Cadastrar hábito';

        atualizarDatas();
    }

    async function read() {
        atualizarDatas();

        const habits = await HabitosAPI.listar(dia.value);

        lista.replaceChildren();
        ready = true;

        if (!habits.length) {
            const p = document.createElement('p');
            p.textContent = 'Nenhum hábito cadastrado.';
            lista.append(p);
        }

        for (const h of habits) {
            const article = document.createElement('article');
            article.className = 'painel';

            const title = document.createElement('h3');
            title.textContent = h.nome;

            const detail = document.createElement('p');
            detail.textContent = h.descricao || '';

            const progress = document.createElement('progress');
            progress.max = 100;
            progress.value = h.progresso;
            progress.setAttribute(
                'aria-label',
                'Progresso de ' + h.nome
            );

            const summary = document.createElement('p');
            summary.textContent =
                `${h.realizados} de ${h.dias} dia(s) realizados — ` +
                `${h.progresso}% até ` +
                `${dia.value.split('-').reverse().join('/')}`;

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.textContent = h.realizada
                ? 'Desmarcar realização'
                : 'Marcar como realizado';

            toggle.dataset.unavailable = String(dia.value < h.inicio);
            toggle.setAttribute('aria-pressed', String(h.realizada));

            toggle.addEventListener('click', () =>
                mutate(
                    () => HabitosAPI.realizar(
                        h.id,
                        dia.value,
                        !h.realizada
                    ),
                    'Realização atualizada.'
                )
            );

            const edit = document.createElement('button');
            edit.type = 'button';
            edit.textContent = 'Editar';

            edit.addEventListener('click', () => {
                editing = h.id;

                nome.value = h.nome;
                descricao.value = h.descricao || '';
                inicio.value = h.inicio;

                inicio.disabled = true;
                cancelar.hidden = false;

                form.querySelector('[type=submit]').textContent =
                    'Salvar alterações';

                nome.focus();
            });

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'excluir';
            remove.textContent = 'Excluir';

            remove.addEventListener('click', () => {
                if (confirm('Excluir este hábito e todo seu histórico?')) {
                    mutate(
                        () => HabitosAPI.excluir(h.id),
                        'Hábito excluído.'
                    );
                }
            });

            const actions = document.createElement('div');
            actions.className = 'filtros';
            actions.append(toggle, edit, remove);

            article.append(
                title,
                detail,
                progress,
                summary,
                actions
            );

            lista.append(article);
        }
    }

    function unlock() {
        lock(false);

        lista.querySelectorAll('[data-unavailable=true]')
            .forEach(elemento => {
                elemento.disabled = true;
            });
    }

    async function load() {
        if (busy) return;

        lock(true);
        status.textContent = 'Carregando hábitos…';

        try {
            await read();
            status.textContent = 'Hábitos atualizados do servidor.';
        } catch (error) {
            ready = false;
            status.textContent = error.message;
        } finally {
            unlock();
        }
    }

    async function mutate(work, message) {
        if (busy || !ready) return;

        lock(true);
        status.textContent = 'Salvando…';

        let saved = false;

        try {
            await work();
            saved = true;

            cancel();
            await read();

            status.textContent = message;
        } catch (error) {
            if (saved) ready = false;

            status.textContent =
                (saved ? 'Operação salva. Recarregue a lista. ' : '') +
                error.message;
        } finally {
            unlock();
        }
    }

    form.addEventListener('submit', event => {
        event.preventDefault();

        atualizarDatas();

        if (!form.reportValidity()) return;

        if (!nome.value.trim()) {
            status.textContent = 'Preencha o nome.';
            return;
        }

        if (!editing && inicio.value < dataHoje()) {
            status.textContent =
                'A data de início deve ser hoje ou uma data futura.';
            return;
        }

        const body = {
            nome: nome.value.trim(),
            descricao: descricao.value,
            inicio: inicio.value
        };

        const idEmEdicao = editing;

        mutate(
            () => idEmEdicao
                ? HabitosAPI.editar(idEmEdicao, body)
                : HabitosAPI.criar(body),
            'Hábito salvo no servidor.'
        );
    });

    cancelar.addEventListener('click', cancel);
    dia.addEventListener('change', load);
    recarregar.addEventListener('click', load);

    load();
})();
