import { createHash } from 'node:crypto';

export function calcularHashEvento(
  cargaId: number,
  tipo: string,
  criadoEm: string,
  hashAnterior: string | null
): string {
  const conteudo = [cargaId, tipo, criadoEm, hashAnterior ?? ''].join('|');
  return createHash('sha256').update(conteudo, 'utf8').digest('hex');
}
