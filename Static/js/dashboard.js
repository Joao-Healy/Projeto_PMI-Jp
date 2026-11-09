'use strict';
function atualizarDashboard() {
 try {
 const tarefas = lerTarefas(); const resumo = indicadores(tarefas);
 for (const [chave, valor] of Object.entries(resumo)) document.getElementById(chave).textContent = valor + (chave === 'percentual' ? '%' : '');
 document.getElementById('progresso').value = resumo.percentual;
 const lista = document.getElementById('recentes'); lista.replaceChildren();
 for (const tarefa of tarefas.slice(0, 5)) { const item = document.createElement('li'); item.textContent = tarefa.nome + (tarefa.concluida ? ' — Concluída' : ' — Pendente'); lista.append(item); }
 document.getElementById('estado').textContent = tarefas.length ? 'Dados locais atualizados.' : 'Nenhuma tarefa cadastrada neste navegador.';
 } catch (erro) { document.getElementById('estado').textContent = 'Não foi possível ler as tarefas: ' + erro.message; }
}
atualizarDashboard();
window.addEventListener('storage', atualizarDashboard);
window.addEventListener('pageshow', atualizarDashboard);
