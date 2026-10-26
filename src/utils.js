export const MAX_MESSAGE_LENGTH = 280;

// Un grafema incluye emojis compuestos y tildes. El servidor reutilizará este conteo.
const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });

export function countCharacters(text) {
  return Array.from(segmenter.segment(text)).length;
}
