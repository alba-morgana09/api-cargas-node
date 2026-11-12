CREATE TABLE IF NOT EXISTS cargas (
  id BIGSERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eventos (
  id BIGSERIAL PRIMARY KEY,
  carga_id BIGINT NOT NULL REFERENCES cargas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hash_anterior CHAR(64),
  hash CHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eventos_carga_id ON eventos(carga_id);
CREATE INDEX IF NOT EXISTS idx_eventos_carga_criado_em ON eventos(carga_id, criado_em, id);
