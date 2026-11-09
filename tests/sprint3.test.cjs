const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,5));}throw new Error('Interface não atingiu o estado esperado.');}
function abrir(page='tarefas.html',{legacy,fetch}={}){
 const errors=[];const console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error));
 const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'http://localhost:3002/'+page,runScripts:'outside-only',virtualConsole:console});
 const w=dom.window;w.confirm=()=>true;w.fetch=fetch||(async()=>new Response(JSON.stringify({data:[]}),{headers:{'Content-Type':'application/json'}}));w.AbortSignal=AbortSignal;
 if(legacy!==undefined)w.localStorage.setItem('zenith-tarefas',legacy);
 w.eval([...w.document.querySelectorAll('script[src^="Static/"]')].map(el=>fs.readFileSync(el.getAttribute('src'),'utf8')).join('\n'));
 return {w,errors};
}
const json=data=>new Response(JSON.stringify({data}),{headers:{'Content-Type':'application/json'}});
const task={id:'1',nome:'Estudar',categoria:'Estudos',data:'2099-12-31',concluida:false};
test('Fetch UI: criar, editar, concluir, filtrar e excluir sem alterar legado',async()=>{
 let tasks=[];const calls=[];const legacy=JSON.stringify([{...task,id:'antiga'}]);
 const {w,errors}=abrir('tarefas.html',{legacy,fetch:async(url,options)=>{
  calls.push([url,options]);if(options.method==='GET')return json(tasks);
  const body=options.body&&JSON.parse(options.body);
  if(options.method==='POST')tasks=[{...body,id:'1'}];
  if(options.method==='PUT')tasks=[{...body,id:'1'}];
  if(options.method==='DELETE'){tasks=[];return new Response(null,{status:204});}
  return json(tasks[0]);
 }});
 await until(()=>!w.document.getElementById('nome').disabled);
 const submit=()=>w.document.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 for(const [id,value]of Object.entries({nome:'Estudar',categoria:'Estudos',data:'2099-12-31'}))w.document.getElementById(id).value=value;
 submit();await until(()=>w.document.querySelectorAll('.tarefa').length===1&&!w.document.getElementById('nome').disabled);
 w.document.querySelector('.editar').click();w.document.getElementById('nome').value='Revisar';submit();await until(()=>tasks[0].nome==='Revisar'&&!w.document.getElementById('nome').disabled);
 w.document.querySelector('input[type=checkbox]').click();await until(()=>tasks[0].concluida&&!w.document.getElementById('nome').disabled);
 w.document.querySelector('[data-filtro=pendentes]').click();assert.equal(w.document.querySelectorAll('.tarefa').length,0);
 w.document.querySelector('[data-filtro=todas]').click();w.confirm=()=>false;w.document.querySelector('.excluir').click();assert.equal(tasks.length,1);
 w.confirm=()=>true;w.document.querySelector('.excluir').click();await until(()=>tasks.length===0&&!w.document.getElementById('nome').disabled);
 assert.equal(w.localStorage.getItem('zenith-tarefas'),legacy);assert.equal(calls[0][1].credentials,'include');assert.equal(errors.length,0);w.close();
});
test('Fetch UI: erro HTTP, retry e validação sem sucesso falso',async()=>{
 let fail=true,calls=0;const {w}=abrir('tarefas.html',{fetch:async()=>{calls++;return fail?new Response(JSON.stringify({error:{message:'Banco indisponível'}}),{status:503}):json([]);}});
 await until(()=>w.document.getElementById('mensagem').textContent.includes('Banco indisponível'));assert.equal(w.document.getElementById('nome').disabled,true);
 fail=false;w.document.getElementById('recarregar').click();await until(()=>!w.document.getElementById('nome').disabled);
 w.document.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(calls,2);w.close();
});
test('Fetch UI: importação explícita, confirmação e preservação do JSON local',async()=>{
 const legacy=JSON.stringify([{...task,id:'antiga'}]);let imports=0;
 const {w}=abrir('tarefas.html',{legacy,fetch:async(url)=>{if(url.endsWith('/importar')){imports++;return json({importadas:1,ignoradas:0});}return json([]);}});
 w.confirm=()=>false;w.document.getElementById('importar').click();assert.equal(imports,0);
 w.confirm=()=>true;w.document.getElementById('importar').click();await until(()=>w.document.getElementById('migracao-mensagem').textContent.includes('concluída'));assert.equal(imports,1);assert.equal(w.localStorage.getItem('zenith-tarefas'),legacy);w.close();
});
test('dados locais corrompidos bloqueiam somente a importação',async()=>{const {w}=abrir('tarefas.html',{legacy:'{'});await until(()=>!w.document.getElementById('nome').disabled);assert.equal(w.document.getElementById('importar').disabled,true);assert.equal(w.localStorage.getItem('zenith-tarefas'),'{');w.close();});
test('Fetch UI: hábitos e realização por data usam API',async()=>{
 let realized=false;const requests=[];
 const {w,errors}=abrir('habitos.html',{fetch:async(url,options)=>{requests.push([url,options]);if(options.method==='GET')return json([{id:'1',nome:'Ler',descricao:'Capítulo',inicio:'2020-01-01',realizada:realized,realizados:realized?1:0,dias:2,progresso:realized?50:0}]);realized=true;return new Response(null,{status:204});}});
 await until(()=>w.document.querySelector('#habito-lista button:not(:disabled)'));w.document.querySelector('#habito-lista button').click();await until(()=>w.document.querySelector('#habito-lista button').getAttribute('aria-pressed')==='true');assert.ok(requests.some(([url,o])=>url.includes('/registros/')&&o.method==='PUT'));assert.equal(errors.length,0);w.close();
});
test('páginas têm main único, ids únicos, links e arquivos locais válidos',()=>{
 for(const page of ['index.html','login.html','tarefas.html','dashboard.html','habitos.html']){
 const dom=new JSDOM(fs.readFileSync(page,'utf8'));const w=dom.window;assert.equal(w.document.querySelectorAll('main').length,1);const ids=[...w.document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 for(const el of w.document.querySelectorAll('[href],[src]')){const url=el.getAttribute('href')||el.getAttribute('src');if(/^(https?:|data:)/.test(url))continue;if(url.startsWith('#'))assert.ok(w.document.getElementById(url.slice(1)));else assert.ok(fs.existsSync(url),url);}w.close();
 }
});
module.exports={abrir,until,json};

test('Fetch UI: dashboard usa API e remove indicadores antigos quando há erro',async()=>{
 let fail=false;const {w,errors}=abrir('dashboard.html',{fetch:async()=>fail?new Response(JSON.stringify({error:{message:'Servidor indisponível'}}),{status:503}):json({total:2,concluidas:1,pendentes:1,percentual:50,habitos:{total:1,realizados:1},recentes:[{nome:'<img src=x>',tipo:'tarefa',data:'2026-11-09T12:00:00Z'}]})});
 await until(()=>w.document.getElementById('percentual').textContent==='50%');assert.equal(w.document.querySelector('#recentes img'),null);
 fail=true;w.document.getElementById('dashboard-atualizar').click();await until(()=>w.document.getElementById('estado').textContent==='Servidor indisponível');assert.equal(w.document.getElementById('total').textContent,'—');assert.equal(errors.length,0);w.close();
});
