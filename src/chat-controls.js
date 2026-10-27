/** Solo peticiones directas del usuario son controles; una mención no cambia el canal. */
export function parseCharacterRequest(text) {
  if (typeof text !== 'string') return null;
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  const aliases = { morfeo: 'morpheus', morpheus: 'morpheus', oraculo: 'oracle', 'el oraculo': 'oracle', oracle: 'oracle', trinity: 'trinity' };
  const command = /^\/hablar(?:\s+(.*))?$/.exec(normalized);
  if (command) return Object.hasOwn(aliases, command[1]) ? { type: 'transfer', target: aliases[command[1]] } : { type: 'help' };
  const direct = normalized.replace(/^(?:morfeo|morpheus|trinity|(?:el )?oraculo),\s*/, '').replace(/^[¿¡]/, '')
    .replace(/(?:,? por favor)?[.!?¡¿]*$/, '').trim();
  const match = /^(?:(?:quiero|quisiera|me gustaria|puedo|podria) hablar con|hablar con|cambiame con|conectame con|pasame con|quiero cambiar a) (morfeo|morpheus|(?:el )?oraculo|oracle|trinity)$/.exec(direct);
  return match ? { type: 'transfer', target: aliases[match[1]] } : null;
}

/** La composición IME termina antes del envío; Shift+Enter conserva el salto nativo. */
export function getComposerKeyAction(event, { composing = false, justComposed = false } = {}) {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return null;
  if (event.isComposing || composing || event.keyCode === 229) return null;
  return event.repeat || justComposed ? 'ignore' : 'submit';
}
