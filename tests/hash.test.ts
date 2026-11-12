import { describe, expect, it } from 'vitest';
import { calcularHashEvento } from '../src/hash.js';

describe('encadeamento de hash', () => {
  it('gera hashes determinísticos e diferentes quando a referência anterior muda', () => {
    const primeiro = calcularHashEvento(1, 'CRIADA', '2026-01-01T00:00:00.000Z', null);
    const repetido = calcularHashEvento(1, 'CRIADA', '2026-01-01T00:00:00.000Z', null);
    const segundo = calcularHashEvento(1, 'EM_TRANSITO', '2026-01-01T01:00:00.000Z', primeiro);
    expect(primeiro).toHaveLength(64);
    expect(repetido).toBe(primeiro);
    expect(segundo).not.toBe(primeiro);
  });
});
