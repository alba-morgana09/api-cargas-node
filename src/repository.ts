import type { Carga, Db, Evento } from './types.js';

export async function criarCarga(db: Db, input: { descricao: string; origem: string; destino: string }): Promise<Carga> {
  const result = await db.query<Carga>(
    'INSERT INTO cargas (descricao, origem, destino) VALUES ($1, $2, $3) RETURNING id, descricao, origem, destino, criada_em',
    [input.descricao, input.origem, input.destino]
  );
  return result.rows[0];
}

export async function listarCargas(db: Db): Promise<Carga[]> {
  const result = await db.query<Carga>('SELECT id, descricao, origem, destino, criada_em FROM cargas ORDER BY id');
  return result.rows;
}

export async function buscarCarga(db: Db, id: number): Promise<Carga | undefined> {
  const result = await db.query<Carga>(
    'SELECT id, descricao, origem, destino, criada_em FROM cargas WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

export async function buscarUltimoEvento(db: Db, cargaId: number): Promise<Evento | undefined> {
  const result = await db.query<Evento>(
    'SELECT id, carga_id, tipo, criado_em, hash_anterior, hash FROM eventos WHERE carga_id = $1 ORDER BY criado_em DESC, id DESC LIMIT 1',
    [cargaId]
  );
  return result.rows[0];
}

export async function criarEvento(
  db: Db,
  input: { cargaId: number; tipo: string; criadoEm: string; hashAnterior: string | null; hash: string }
): Promise<Evento> {
  const result = await db.query<Evento>(
    `INSERT INTO eventos (carga_id, tipo, criado_em, hash_anterior, hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, carga_id, tipo, criado_em, hash_anterior, hash`,
    [input.cargaId, input.tipo, input.criadoEm, input.hashAnterior, input.hash]
  );
  return result.rows[0];
}

export async function listarEventos(db: Db, cargaId: number): Promise<Evento[]> {
  const result = await db.query<Evento>(
    'SELECT id, carga_id, tipo, criado_em, hash_anterior, hash FROM eventos WHERE carga_id = $1 ORDER BY criado_em, id',
    [cargaId]
  );
  return result.rows;
}

export async function relatorioEventosPorCarga(db: Db): Promise<Array<{ carga_id: number; descricao: string; total_eventos: number }>> {
  const result = await db.query<{ carga_id: number; descricao: string; total_eventos: number }>(
    `SELECT c.id AS carga_id, c.descricao, COUNT(e.id)::int AS total_eventos
     FROM cargas c
     LEFT JOIN eventos e ON e.carga_id = c.id
     GROUP BY c.id, c.descricao
     ORDER BY c.id`
  );
  return result.rows;
}
