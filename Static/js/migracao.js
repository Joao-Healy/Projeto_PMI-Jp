'use strict';
(() => {
  const panel = document.getElementById('migracao');
  if (!panel) return;
  const message = document.getElementById('migracao-mensagem');
  const button = document.getElementById('importar');
  let legacy;
  try { legacy = lerTarefas(); }
  catch (error) { panel.hidden = false; message.textContent = 'Backup local preservado. Importação bloqueada: ' + error.message; button.disabled = true; return; }
  if (!legacy.length) return;
  panel.hidden = false;
  message.textContent = `${legacy.length} tarefa(s) antiga(s) neste navegador. A cópia local será preservada.`;
  document.getElementById('exportar').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(legacy,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href=url; link.download='zenith-tarefas-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  });
  button.addEventListener('click', async () => {
    if(window.ZenithReady && !await window.ZenithReady) { message.textContent="Entre na sua conta antes de importar.";return; }
    if (!confirm(`Importar para ${window.ZenithUser?.email || "a conta conectada"}? IDs já importados serão ignorados. A cópia local será mantida.`)) return;
    button.disabled = true; message.textContent = 'Importando…';
    try {
      let importadas=0, ignoradas=0;
      for (let start=0; start<legacy.length; start+=500) {
        const result=await TarefasAPI.importar(legacy.slice(start,start+500));
        importadas+=result.importadas; ignoradas+=result.ignoradas;
      }
      message.textContent=`Importação concluída: ${importadas} nova(s), ${ignoradas} já importada(s). Backup local preservado.`;
      window.dispatchEvent(new Event('zenith:imported'));
    } catch (error) { message.textContent=error.message + ' A cópia local foi preservada; repetir a importação não duplica registros já importados.'; }
    finally { button.disabled=false; }
  });
})();
