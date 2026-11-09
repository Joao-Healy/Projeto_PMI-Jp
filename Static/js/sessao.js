'use strict';
(() => {
  const status=document.getElementById('sessao-status'),main=document.querySelector('main'),logout=document.getElementById('sair'),login=document.getElementById('entrar');
  main.hidden=true;
  function clear(message) {
    window.ZenithUser=null;window.ZenithSessionExpired=true;window.ZenithReady=Promise.resolve(false);
    status.textContent=message;logout.hidden=true;login.hidden=false;main.hidden=true;
    document.querySelectorAll('#lista,#habito-lista,#recentes').forEach(el=>el.replaceChildren());
  }
  window.addEventListener('zenith:unauthorized',()=>clear('Entre na sua conta para continuar.'));
  window.ZenithReady=(async()=>{
    try {
      const session=await ZenithAPI.request('/auth/me');ZenithAPI.setCSRF(session.csrf);window.ZenithUser=session.usuario;window.ZenithSessionExpired=false;
      status.textContent=session.usuario.nome+' — '+session.usuario.email;main.hidden=false;logout.hidden=false;login.hidden=true;return true;
    } catch(error){clear(error.message);return false;}
  })();
  logout.addEventListener('click',async()=>{
    logout.disabled=true;
    try{await ZenithAPI.request('/auth/logout',{method:'POST'});ZenithAPI.setCSRF(null);clear('Você saiu da conta.');}
    catch(error){status.textContent=error.message;}
    finally{logout.disabled=false;}
  });
})();
