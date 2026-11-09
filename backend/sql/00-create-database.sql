-- Execute no Query Tool do pgAdmin, conectado ao banco postgres,
-- com auto-commit habilitado (CREATE DATABASE não aceita transação).
-- Crie previamente o login zenith_app pela interface Login/Group Roles,
-- definindo a senha localmente; nunca grave a senha em um script versionado.
CREATE DATABASE zenith_db OWNER zenith_app ENCODING 'UTF8' TEMPLATE template0;
-- Opcional, somente para testes automatizados isolados:
CREATE DATABASE zenith_test OWNER zenith_app ENCODING 'UTF8' TEMPLATE template0;
