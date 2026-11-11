'use strict';
window.ZenithAPI = {
  async request(rota, opcoes = {}) {
    let resposta;
    try {
      resposta = await fetch('/api' + rota, {
        method: opcoes.method || 'GET',
        headers: { Accept: 'application/json', ...(opcoes.body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body: opcoes.body === undefined ? undefined : JSON.stringify(opcoes.body)
      });
    } catch {
      throw new Error('Não foi possível conectar ao servidor.');
    }
    if (resposta.status === 204) return null;
    const resultado = await resposta.json().catch(() => null);
    if (!resultado) throw new Error('Resposta inválida do servidor.');
    if (!resposta.ok) throw new Error(resultado.error?.message || resultado.erro || 'Erro na API.');
    return resultado.data;
  },
  setCSRF() {} // Compatibilidade com código legado
};
