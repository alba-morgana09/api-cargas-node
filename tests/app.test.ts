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

  it('detecta adulteração na verificação da cadeia', async () => {
    const db = makeDb();
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, descricao: 'Caixa', origem: 'SP', destino: 'RJ', criada_em: '2026-01-01T00:00:00.000Z' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, carga_id: 1, tipo: 'CRIADA', criado_em: '2026-01-01T00:00:00.000Z', hash_anterior: null, hash: 'a'.repeat(64) },
          { id: 2, carga_id: 1, tipo: 'EM_TRANSITO', criado_em: '2026-01-01T01:00:00.000Z', hash_anterior: 'a'.repeat(64), hash: 'b'.repeat(64) }
        ]
      });
    const app = createApp(db);
    const resposta = await request(app).get('/cargas/1/verificar');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ carga_id: 1, integra: false });
  });

  it('retorna 404 em verificação para carga inexistente', async () => {
    const db = makeDb();
    db.query.mockResolvedValueOnce({ rows: [] });
    const app = createApp(db);
    const resposta = await request(app).get('/cargas/999/verificar');
    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: 'Carga não encontrada' });
  });

  it('retorna 400 para entrada inválida de id e payload', async () => {
    const db = makeDb();
    const app = createApp(db);
    const idInvalido = await request(app).get('/cargas/abc/verificar');
    expect(idInvalido.status).toBe(400);
    const payloadInvalido = await request(app).post('/cargas').send({ descricao: 'Caixa', origem: 'SP' });
    expect(payloadInvalido.status).toBe(400);
  });

  it('gera relatório com consulta agregada usando JOIN e GROUP BY', async () => {
    const db = makeDb();
    db.query.mockResolvedValueOnce({
      rows: [
        { carga_id: 1, descricao: 'Caixa', total_eventos: 2 },
        { carga_id: 2, descricao: 'Palete', total_eventos: 0 }
      ]
    });
    const app = createApp(db);
    const resposta = await request(app).get('/relatorios/eventos-por-carga');
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([
      { carga_id: 1, descricao: 'Caixa', total_eventos: 2 },
      { carga_id: 2, descricao: 'Palete', total_eventos: 0 }
    ]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LEFT JOIN eventos e ON e.carga_id = c.id'));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('GROUP BY c.id, c.descricao'));
  });
});
