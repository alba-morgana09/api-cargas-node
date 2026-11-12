import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { ZodError } from 'zod';
import { calcularHashEvento } from './hash.js';
import { buscarCarga, buscarUltimoEvento, criarCarga, criarEvento, listarCargas, listarEventos, relatorioEventosPorCarga } from './repository.js';
import { cargaSchema, eventoSchema, idSchema } from './validation.js';
import type { Db } from './types.js';

function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function createApp(db: Db) {
  const app = express();
  app.use(express.json());

  app.post('/cargas', asyncHandler(async (req, res) => {
    const input = cargaSchema.parse(req.body);
    res.status(201).json(await criarCarga(db, input));
  }));

  app.get('/cargas', asyncHandler(async (_req, res) => {
    res.json(await listarCargas(db));
  }));

  app.get('/cargas/:id', asyncHandler(async (req, res) => {
    const carga = await buscarCarga(db, idSchema(String(req.params.id)));
    if (!carga) return res.status(404).json({ erro: 'Carga não encontrada' });
    return res.json(carga);
  }));

  app.post('/cargas/:id/eventos', asyncHandler(async (req, res) => {
    const cargaId = idSchema(String(req.params.id));
    if (!await buscarCarga(db, cargaId)) return res.status(404).json({ erro: 'Carga não encontrada' });
    const input = eventoSchema.parse(req.body);
    const anterior = await buscarUltimoEvento(db, cargaId);
    const criadoEm = new Date().toISOString();
    const hashAnterior = anterior?.hash ?? null;
    const hash = calcularHashEvento(cargaId, input.tipo, criadoEm, hashAnterior);
    res.status(201).json(await criarEvento(db, { cargaId, tipo: input.tipo, criadoEm, hashAnterior, hash }));
  }));

  app.get('/cargas/:id/eventos', asyncHandler(async (req, res) => {
    const cargaId = idSchema(String(req.params.id));
    if (!await buscarCarga(db, cargaId)) return res.status(404).json({ erro: 'Carga não encontrada' });
    return res.json(await listarEventos(db, cargaId));
  }));

  app.get('/cargas/:id/verificar', asyncHandler(async (req, res) => {
    const cargaId = idSchema(String(req.params.id));
    if (!await buscarCarga(db, cargaId)) return res.status(404).json({ erro: 'Carga não encontrada' });
    const eventos = await listarEventos(db, cargaId);
    let hashAnterior: string | null = null;
    const integra = eventos.every((evento) => {
      const hashCalculado = calcularHashEvento(cargaId, evento.tipo, evento.criado_em, hashAnterior);
      const valido = evento.hash_anterior === hashAnterior && evento.hash === hashCalculado;
      hashAnterior = evento.hash;
      return valido;
    });
    return res.json({ carga_id: cargaId, integra });
  }));

  app.get('/relatorios/eventos-por-carga', asyncHandler(async (_req, res) => {
    res.json(await relatorioEventosPorCarga(db));
  }));

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError || error instanceof Error && error.message === 'ID inválido') {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: error instanceof ZodError ? error.flatten() : error.message });
    }
    console.error(error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  };
  app.use(errorHandler);
  return app;
}
