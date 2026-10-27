import { describe, expect, it } from 'vitest';
import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from '../src/utils.js';

describe('countCharacters', () => {
  it('cuenta los bordes de 279, 280 y 281 caracteres sin recortar', () => {
    expect(MAX_MESSAGE_LENGTH).toBe(280);
    expect(countCharacters('a'.repeat(279))).toBe(279);
    expect(countCharacters('a'.repeat(280))).toBe(280);
    expect(countCharacters('a'.repeat(281))).toBe(281);
  });
  it('cuenta espacios, saltos de línea y texto vacío', () => {
    expect(countCharacters('')).toBe(0);
    expect(countCharacters('a b\nc')).toBe(5);
    expect(countCharacters('   ')).toBe(3);
  });
  it('cuenta igual una tilde compuesta y una descompuesta', () => {
    expect(countCharacters('á')).toBe(1);
    expect(countCharacters('a\u0301')).toBe(1);
    expect(countCharacters('¿Qué?')).toBe(5);
  });
  it('cuenta emojis simples y compuestos como caracteres visibles', () => {
    expect(countCharacters('🙂')).toBe(1);
    expect(countCharacters('👩🏽‍💻')).toBe(1);
    expect(countCharacters('🇨🇴')).toBe(1);
    expect(countCharacters('👩🏽‍💻'.repeat(280))).toBe(280);
  });
});

describe('validación de mensajes', () => {
  it('rechaza tipos incorrectos y contenido formado solo por espacios', () => {
    for (const text of [null, undefined, 12, {}, []]) expect(getMessageError(text)).toContain('texto');
    for (const text of ['', ' \n\t ']) expect(getMessageError(text)).toContain('Escribe');
  });
  it('acepta 280 grafemas y rechaza 281 contando espacios sin recortar', () => {
    expect(getMessageError('👩🏽‍💻'.repeat(280))).toBe('');
    expect(getMessageError('a'.repeat(279) + '\n')).toBe('');
    expect(getMessageError('a'.repeat(280) + ' ')).toContain('280');
    expect(getMessageError('a'.repeat(281))).toContain('280');
  });
});
