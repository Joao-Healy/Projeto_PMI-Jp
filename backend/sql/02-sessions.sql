BEGIN;
CREATE TABLE IF NOT EXISTS sessoes (
  token_hash char(64) PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  csrf char(64) NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessoes_usuario_idx ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS sessoes_expiracao_idx ON sessoes(expira_em);
COMMIT;
