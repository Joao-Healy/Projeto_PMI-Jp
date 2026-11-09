'use strict';
function lerTarefas() {
 const dados = JSON.parse(localStorage.getItem('zenith-tarefas') || '[]');
 if (!Array.isArray(dados) || dados.some(t => !t || typeof t.id !== 'string' || typeof t.nome !== 'string' || typeof t.categoria !== 'string' || typeof t.data !== 'string' || typeof t.concluida !== 'boolean')) throw new Error('Os dados locais não possuem o formato esperado. Seus registros foram preservados.');
 return dados;
}
