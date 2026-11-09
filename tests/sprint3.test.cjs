const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function abrir(page='tarefas.html', dados) {
 const dom=new JSDOM(fs.readFileSync(page,'utf8'),{url:'http://localhost/'+page,runScripts:'outside-only'});
 const w=dom.window; w.confirm=()=>true;
 if(dados!==undefined) w.localStorage.setItem('zenith-tarefas',dados);
 w.eval([...w.document.querySelectorAll('script[src^="Static/"]')].map(el => fs.readFileSync(el.getAttribute('src'),'utf8')).join('\n')); 
 return w;
}
function cadastrar(w,nome='Estudar') {
 for(const [id,value] of Object.entries({nome,categoria:'Estudos',data:'2099-12-31'})) w.document.getElementById(id).value=value;
 w.document.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));
}
const registros=w=>JSON.parse(w.localStorage.getItem('zenith-tarefas')||'[]');
test('cadastro, edição, conclusão, filtros, cancelamento e exclusão local',()=>{
 const w=abrir(); cadastrar(w);assert.equal(registros(w).length,1);
 w.document.querySelector('.editar').click();cadastrar(w,'Revisar');assert.equal(registros(w)[0].nome,'Revisar');assert.equal(registros(w).length,1);
 w.document.querySelector('input[type=checkbox]').click();assert.equal(registros(w)[0].concluida,true);
 w.document.querySelector('[data-filtro=pendentes]').click();assert.equal(w.document.querySelectorAll('.tarefa').length,0);
 w.document.querySelector('[data-filtro=todas]').click();w.confirm=()=>false;w.document.querySelector('.excluir').click();assert.equal(registros(w).length,1);
 w.confirm=()=>true;w.document.querySelector('.excluir').click();assert.equal(registros(w).length,0);w.close();
});
test('validação de nome vazio e datas passadas',()=>{const w=abrir();cadastrar(w,'   ');assert.equal(registros(w).length,0);cadastrar(w);w.document.querySelector('.editar').click();w.document.getElementById('data').value='2000-01-01';w.document.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(registros(w)[0].data,'2099-12-31');w.close();});
test('falha de gravação preserva lista e mensagem de erro',()=>{const w=abrir();w.Storage.prototype.setItem=()=>{throw new Error('QuotaExceededError')};cadastrar(w);assert.equal(w.document.querySelectorAll('.tarefa').length,0);assert.match(w.document.getElementById('mensagem').textContent,/Não foi possível salvar/);w.close();});
test('JSON corrompido é preservado e bloqueia sobrescrita',()=>{const w=abrir('tarefas.html','{');assert.equal(w.localStorage.getItem('zenith-tarefas'),'{');assert.equal(w.document.getElementById('nome').disabled,true);w.close();});
test('dashboard calcula dados e mantém nomes como texto seguro',()=>{const w=abrir('dashboard.html',JSON.stringify([{id:'1',nome:'<img src=x>',categoria:'Estudos',data:'2099-01-01',concluida:true},{id:'2',nome:'B',categoria:'Estudos',data:'2099-01-01',concluida:false}]));assert.equal(w.document.getElementById('percentual').textContent,'50%');assert.equal(w.document.getElementById('total').textContent,'2');assert.equal(w.document.querySelector('#recentes img'),null);w.close();});
test('dashboard vazio e erro de leitura são explícitos',()=>{let w=abrir('dashboard.html');assert.equal(w.document.getElementById('percentual').textContent,'0%');w.close();w=abrir('dashboard.html','{');assert.match(w.document.getElementById('estado').textContent,/Não foi possível/);assert.equal(w.document.getElementById('total').textContent,'—');w.close();});
test('páginas têm main único, ids únicos, links e arquivos locais válidos',()=>{
 for(const page of ['index.html','login.html','tarefas.html','dashboard.html','habitos.html']){
 const w=abrir(page);assert.equal(w.document.querySelectorAll('main').length,1);const ids=[...w.document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
 for(const el of w.document.querySelectorAll('[href],[src]')){const url=el.getAttribute('href')||el.getAttribute('src');if(/^(https?:|data:)/.test(url))continue;if(url.startsWith('#'))assert.ok(w.document.getElementById(url.slice(1)));else assert.ok(fs.existsSync(url),url);}
 assert.equal(w.document.querySelector('input[type=password]'),null);w.close();
 }
});
