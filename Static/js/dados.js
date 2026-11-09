'use strict';
function lerTarefas() {
 const dados = JSON.parse(localStorage.getItem('zenith-tarefas') || '[]');
 if (!Array.isArray(dados) || dados.some(t => !t || typeof t.id !== 'string' || typeof t.nome !== 'string' || typeof t.categoria !== 'string' || typeof t.data !== 'string' || typeof t.concluida !== 'boolean')) throw new Error('Os dados locais não possuem o formato esperado. Seus registros foram preservados.');
 return dados;
}
function indicadores(tarefas) {
 const concluidas = tarefas.filter(t => t.concluida).length;
 return {total: tarefas.length, concluidas, pendentes: tarefas.length - concluidas, percentual: tarefas.length ? Math.round(concluidas / tarefas.length * 100) : 0};
}
