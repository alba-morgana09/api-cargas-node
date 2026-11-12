import { z } from 'zod';

export const cargaSchema = z.object({
  descricao: z.string().trim().min(1),
  origem: z.string().trim().min(1),
  destino: z.string().trim().min(1)
}).strict();

export const eventoSchema = z.object({
  tipo: z.string().trim().min(1)
}).strict();

export function idSchema(value: string): number {
  const parsed = z.coerce.number().int().positive().safeParse(value);
  if (!parsed.success) {
    throw new Error('ID inválido');
  }
  return parsed.data;
}
