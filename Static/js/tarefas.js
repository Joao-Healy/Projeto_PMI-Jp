'use strict';
(() => {
  const form=document.getElementById('formulario');
  const nome=document.getElementById('nome'), categoria=document.getElementById('categoria'), data=document.getElementById('data');
  const lista=document.getElementById('lista'), mensagem=document.getElementById('mensagem'), cancelar=document.getElementById('cancelar');
  const retry=document.getElementById('recarregar');
  const hoje=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let tarefas=[], editando=null, filtro='todas', busy=false, ready=false;
  data.min=hoje;
  function feedback(text,error=false) { mensagem.textContent=text; mensagem.style.color=error?'#ffb4b4':'#10b981'; }
  function lock(value) {
    busy=value; form.setAttribute('aria-busy',String(value)); lista.setAttribute('aria-busy',String(value));
    document.querySelectorAll('#formulario input,#formulario select,#formulario button,#lista button,#lista input,#limpar').forEach(el=>el.disabled=busy||!ready);
    retry.disabled=busy;
  }
  function cancel() { editando=null; form.reset(); data.min=hoje; cancelar.hidden=true; form.querySelector('[type=submit]').textContent='+ Adicionar tarefa'; }
  cancelar.addEventListener('click',cancel);
  function render() {
    lista.replaceChildren();
    const visible=tarefas.filter(t=>filtro==='todas'||(filtro==='concluidas'?t.concluida:!t.concluida));
    if (!visible.length) { const p=document.createElement('p'); p.className='vazio';p.textContent='Nenhuma tarefa encontrada.';lista.append(p); }
    for (const task of visible) {
      const item=document.createElement('div');item.className='tarefa'+(task.concluida?' concluida':'');
      const check=document.createElement('input');check.type='checkbox';check.checked=task.concluida;check.setAttribute('aria-label',`Concluir ${task.nome}`);
      check.addEventListener('change',()=>mutate(()=>TarefasAPI.editar(task.id,{...task,concluida:check.checked}),'Conclusão atualizada.'));
      const info=document.createElement('div');info.className='informacoes';const title=document.createElement('h3');title.textContent=task.nome;
      const detail=document.createElement('p');detail.textContent=task.categoria+' | Prazo: '+task.data.split('-').reverse().join('/');info.append(title,detail);
      const edit=document.createElement('button');edit.type='button';edit.className='editar';edit.textContent='Editar';edit.addEventListener('click',()=>{
        editando=task.id;nome.value=task.nome;categoria.value=task.categoria;data.value=task.data;data.min=task.data<hoje?task.data:hoje;
        cancelar.hidden=false;form.querySelector('[type=submit]').textContent='Salvar alterações';nome.focus();
      });
      const remove=document.createElement('button');remove.type='button';remove.className='excluir';remove.textContent='Excluir';remove.addEventListener('click',()=>{
        if(confirm(`Excluir a tarefa “${task.nome}”?`)) mutate(()=>TarefasAPI.excluir(task.id),'Tarefa excluída.');
      });
      item.append(check,info,edit,remove);lista.append(item);
    }
    document.getElementById('contador').textContent=`${tarefas.length} tarefa(s) | ${tarefas.filter(t=>!t.concluida).length} pendente(s)`;
    document.querySelectorAll('[data-filtro]').forEach(b=>{b.classList.toggle('ativo',b.dataset.filtro===filtro);b.setAttribute('aria-pressed',String(b.dataset.filtro===filtro));});
    lock(busy);
  }
  async function read() { if(window.ZenithReady && !await window.ZenithReady) throw new Error("Entre na sua conta para continuar."); tarefas=await TarefasAPI.listar();ready=true; if(editando&&!tarefas.some(t=>t.id===editando))cancel();render(); }
  async function load() {
    if(busy)return;lock(true);feedback('Carregando tarefas…');
    try {await read();feedback('Tarefas atualizadas do servidor.');}
    catch(error){ready=false;feedback(error.message,true);}
    finally{lock(false);}
  }
  async function mutate(work,success) {
    if(busy||!ready)return;lock(true);feedback('Salvando…');let saved=false;
    try{await work();saved=true;cancel();await read();feedback(success);}
    catch(error){if(saved)ready=false;render();feedback((saved?'Operação salva, mas a lista não foi atualizada. Recarregue. ':'')+error.message,true);}
    finally{lock(false);}
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();if(!form.reportValidity())return;
    if(!nome.value.trim()){feedback('Preencha o nome da tarefa.',true);return;}
    const previous=tarefas.find(t=>t.id===editando);
    const body={nome:nome.value.trim(),categoria:categoria.value,data:data.value,concluida:previous?.concluida||false};
    mutate(()=>editando?TarefasAPI.editar(editando,body):TarefasAPI.criar(body),'Tarefa salva no servidor.');
  });
  document.querySelectorAll('[data-filtro]').forEach(b=>b.addEventListener('click',()=>{filtro=b.dataset.filtro;render();}));
  document.getElementById('limpar').addEventListener('click',()=>{if(tarefas.some(t=>t.concluida)&&confirm('Excluir todas as tarefas concluídas?'))mutate(()=>TarefasAPI.limpar(),'Concluídas excluídas.');});
  retry.addEventListener('click',load);window.addEventListener('zenith:imported',load);
  load();
})();
