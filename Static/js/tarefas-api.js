'use strict';
window.TarefasAPI = {
  listar: () => ZenithAPI.request('/tarefas'),
  criar: body => ZenithAPI.request('/tarefas', { method: 'POST', body }),
  editar: (id,body) => ZenithAPI.request('/tarefas/' + encodeURIComponent(id), { method: 'PUT', body }),
  excluir: id => ZenithAPI.request('/tarefas/' + encodeURIComponent(id), { method: 'DELETE' }),
  limpar: () => ZenithAPI.request('/tarefas/concluidas', { method: 'DELETE' }),
  importar: tarefas => ZenithAPI.request('/tarefas/importar', { method: 'POST', body: { tarefas } }),
};
