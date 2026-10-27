export const MAX_MESSAGE_LENGTH = 280;

// Un grafema incluye emojis compuestos y tildes. El servidor reutilizará este conteo.
const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });

export function countCharacters(text) {
  return Array.from(segmenter.segment(text)).length;
}

export function getMessageError(text) {
  if (typeof text !== 'string') return 'El mensaje debe ser texto.';
  if (countCharacters(text) > MAX_MESSAGE_LENGTH) {
    return `Tu mensaje supera el límite de ${MAX_MESSAGE_LENGTH} caracteres.`;
  }
  if (!text.trim()) return 'Escribe un mensaje antes de enviarlo.';
  return '';
}
