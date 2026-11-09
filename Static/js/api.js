'use strict';
window.ZenithAPI = (() => {
  let csrf = null;
  async function request(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf) headers['X-CSRF-Token'] = csrf;
    let response;
    try {
      response = await fetch('/api' + path, {
        method, headers, credentials: 'include', body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch { throw new Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.'); }
    if (response.status === 204) return null;
    let result;
    try { result = await response.json(); } catch { throw new Error('O servidor retornou uma resposta inválida.'); }
    if (!response.ok) {
      const error = new Error(result.error?.message || 'Não foi possível concluir a operação.');
      error.status = response.status;
      if (response.status === 401) { csrf = null; window.dispatchEvent(new Event('zenith:unauthorized')); }
      throw error;
    }
    return result.data;
  }
  return { request, setCSRF(value) { csrf = value; } };
})();
