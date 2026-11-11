-- Estrutura idempotente: cria apenas o que ainda não existe; não apaga registros.
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar(100) NOT NULL CHECK (length(trim(nome)) > 0),
  email varchar(254) NOT NULL UNIQUE CHECK (email = lower(email)),
  senha_hash text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome varchar(100) NOT NULL CHECK (length(trim(nome)) > 0),
  categoria varchar(30) NOT NULL CHECK (categoria IN ('Estudos', 'Trabalho', 'Treino', 'Pessoal')),
  data date NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tarefas_usuario_data_idx ON tarefas(usuario_id, criado_em DESC);
CREATE TABLE IF NOT EXISTS habitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome varchar(100) NOT NULL CHECK (length(trim(nome)) > 0),
  descricao varchar(500) NOT NULL DEFAULT '',
  inicio date NOT NULL DEFAULT current_date,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS habitos_usuario_idx ON habitos(usuario_id);
CREATE TABLE IF NOT EXISTS registros_diarios (
  habito_id uuid NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
  data date NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habito_id, data)
);
-- Ledger separado: repetir importação nunca recria tarefas já excluídas.
CREATE TABLE IF NOT EXISTS importacoes_tarefas (
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  legado_id varchar(200) NOT NULL,
  tarefa_id uuid REFERENCES tarefas(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, legado_id)
);

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash char(64) PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  csrf char(64) NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sessoes_usuario_idx ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS sessoes_expiracao_idx ON sessoes(expira_em);



-- Usuário utilizado apenas na apresentação do Zenith
INSERT INTO usuarios (nome, email, senha_hash)
VALUES (
    'Usuário Demo',
    'demo@zenith.local',
    'conta-demonstrativa-sem-login'
)
ON CONFLICT (email) DO NOTHING;
