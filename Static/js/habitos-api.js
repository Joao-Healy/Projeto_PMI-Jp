'use strict';
window.HabitosAPI = {
  listar: data => ZenithAPI.request('/habitos?data=' + encodeURIComponent(data)),
  criar: body => ZenithAPI.request('/habitos', { method: 'POST', body }),
  editar: (id,body) => ZenithAPI.request('/habitos/' + encodeURIComponent(id), { method: 'PUT', body }),
  excluir: id => ZenithAPI.request('/habitos/' + encodeURIComponent(id), { method: 'DELETE' }),
  realizar: (id,data,realizada) => ZenithAPI.request('/habitos/' + encodeURIComponent(id) + '/registros/' + encodeURIComponent(data), { method: realizada ? 'PUT' : 'DELETE' }),
};
