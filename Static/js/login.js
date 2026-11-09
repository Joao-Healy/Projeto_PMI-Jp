'use strict';
(() => {
  const form=document.getElementById('login-form'),message=document.getElementById('login-status'),toggle=document.getElementById('alternar-cadastro');
  const name=document.getElementById('login-nome'),password=document.getElementById('login-senha');
  let register=false;
  toggle.addEventListener('click',()=>{
    register=!register;document.getElementById('nome-campo').hidden=!register;name.required=register;
    password.autocomplete=register?'new-password':'current-password';
    form.querySelector('[type=submit]').textContent=register?'Criar conta':'Entrar';
    document.getElementById('login-titulo').textContent=register?'Crie sua conta':'Acesse sua conta';
    toggle.textContent=register?'Já tenho conta':'Criar uma conta';message.textContent='';
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const body={email:document.getElementById('login-email').value.trim(),senha:password.value};
    if(register)body.nome=name.value.trim();
    form.querySelectorAll('input,button').forEach(el=>el.disabled=true);toggle.disabled=true;message.textContent=register?'Criando conta…':'Entrando…';
    try {
      const result=await ZenithAPI.request('/auth/'+(register?'register':'login'),{method:'POST',body});
      ZenithAPI.setCSRF(result.csrf);password.value='';message.textContent='Conta autenticada. Abrindo dashboard…';
      window.location.assign('dashboard.html');
    } catch(error){message.textContent=error.message;}
    finally{form.querySelectorAll('input,button').forEach(el=>el.disabled=false);toggle.disabled=false;}
  });
})();
