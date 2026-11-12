import type { Pool, QueryResultRow } from 'pg';

export type Db = Pick<Pool, 'query'>;

export interface Carga {
  id: number;
  descricao: string;
  origem: string;
  destino: string;
  criada_em: string;
}

export interface Evento {
  id: number;
  carga_id: number;
  tipo: string;
  criado_em: string;
  hash_anterior: string | null;
  hash: string;
}

export interface Queryable {
  query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}
