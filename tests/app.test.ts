import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

function makeDb() {
  const query = vi.fn();
  return { query };
}

describe('endpoints principais', () => {
  it('cria uma carga e valida a entrada', async () => {
    const db = makeDb();
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, descricao: 'Caixa', origem: 'SP', destino: 'RJ', criada_em: '2026-01-01T00:00:00.000Z' }] });
    const app = createApp(db);
    const criada = await request(app).post('/cargas').send({ descricao: 'Caixa', origem: 'SP', destino: 'RJ' });
    expect(criada.status).toBe(201);
    expect(criada.body.id).toBe(1);
    expect((await request(app).post('/cargas').send({ descricao: '' })).status).toBe(400);
  });

  it('encadeia eventos e verifica a cadeia', async () => {
    const db = makeDb();
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, descricao: 'Caixa', origem: 'SP', destino: 'RJ', criada_em: '2026-01-01T00:00:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1, carga_id: 1, tipo: 'CRIADA', criado_em: '2026-01-01T00:00:00.000Z', hash_anterior: null, hash: 'x'.repeat(64) }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, descricao: 'Caixa', origem: 'SP', destino: 'RJ', criada_em: '2026-01-01T00:00:00.000Z' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, carga_id: 1, tipo: 'CRIADA', criado_em: '2026-01-01T00:00:00.000Z', hash_anterior: null, hash: 'x'.repeat(64) }] });
    const app = createApp(db);
    const evento = await request(app).post('/cargas/1/eventos').send({ tipo: 'CRIADA' });
    expect(evento.status).toBe(201);
    expect(evento.body.hash_anterior).toBeNull();
    expect((await request(app).get('/cargas/1/verificar')).status).toBe(200);
  });
});
