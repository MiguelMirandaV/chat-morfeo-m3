/** Metadatos públicos. Las instrucciones de cada personaje viven solo en el servidor. */
export const CHARACTERS = Object.freeze([
  Object.freeze({ id: 'morpheus', name: 'Morfeo', terminal: 'morpheus', emblem: 'M', description: 'Cuestiona lo que das por hecho.', voice: 'Sereno · Reflexivo' }),
  Object.freeze({ id: 'oracle', name: 'el Oráculo', terminal: 'oracle', emblem: '◎', description: 'Explora tus decisiones y posibilidades.', voice: 'Cálida · Perspicaz' }),
  Object.freeze({ id: 'trinity', name: 'Trinity', terminal: 'trinity', emblem: '△', description: 'Convierte la intención en un siguiente paso.', voice: 'Directa · Resolutiva' }),
]);
export function isCharacterId(value) {
  return typeof value === 'string' && CHARACTERS.some(character => character.id === value);
}
export function getCharacter(id) { return CHARACTERS.find(character => character.id === id) ?? null; }
