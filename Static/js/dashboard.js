'use strict';
(() => {
  const status=document.getElementById('estado'),retry=document.getElementById('dashboard-atualizar');
  let busy=false;
  async function atualizarDashboard() {
    if(busy)return;busy=true;retry.disabled=true;status.textContent='Carregando indicadores…';
    document.getElementById('cards').setAttribute('aria-busy','true');
    try {
      if(window.ZenithReady && !await window.ZenithReady) throw new Error("Entre na sua conta para continuar.");
      const resumo=await ZenithAPI.request('/dashboard');
      for(const chave of ['total','concluidas','pendentes','percentual'])document.getElementById(chave).textContent=resumo[chave]+(chave==='percentual'?'%':'');
      document.getElementById('progresso').value=resumo.percentual;
      document.getElementById('habitos-resumo').textContent=`${resumo.habitos.realizados} de ${resumo.habitos.total} hábito(s) realizados hoje.`;
      const lista=document.getElementById('recentes');lista.replaceChildren();
      for(const activity of resumo.recentes){const item=document.createElement('li');item.textContent=`${activity.tipo}: ${activity.nome} — ${new Date(activity.data).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}`;lista.append(item);}
      status.textContent=resumo.recentes.length?'Indicadores atualizados do servidor.':'Nenhuma tarefa ou hábito cadastrado. Comece pelas páginas de tarefas e hábitos.';
    } catch(error) {
      for(const chave of ['total','concluidas','pendentes','percentual'])document.getElementById(chave).textContent='—';
      document.getElementById('progresso').value=0;document.getElementById('recentes').replaceChildren();document.getElementById('habitos-resumo').textContent='';status.textContent=error.message;
    } finally{busy=false;retry.disabled=false;document.getElementById('cards').setAttribute('aria-busy','false');}
  }
  retry.addEventListener('click',atualizarDashboard);
  window.addEventListener('pageshow',atualizarDashboard);
  atualizarDashboard();
})();
