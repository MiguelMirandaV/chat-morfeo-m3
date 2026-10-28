import { isCharacterId } from './characters.js';
import { getMessageError } from './utils.js';

export const STORY_KEY = 'morfeo.smith-story.v1';
const keys = (value, names) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
export const emptyStory = () => ({ version: 1, normalTurns: 0, returnCharacter: null, messages: [], draft: '' });
export function validateStory(value) {
  if (!keys(value, ['version', 'normalTurns', 'returnCharacter', 'messages', 'draft']) || value.version !== 1
    || !Number.isInteger(value.normalTurns) || value.normalTurns < 0 || value.normalTurns > 3
    || !Array.isArray(value.messages) || ![0, 2, 4].includes(value.messages.length)
    || typeof value.draft !== 'string' || new TextEncoder().encode(JSON.stringify(value)).length > 32768) throw new Error('INVALID_STORY');
  if (value.normalTurns < 3 ? value.returnCharacter !== null || value.messages.length || value.draft !== '' : !isCharacterId(value.returnCharacter)) throw new Error('INVALID_STORY');
  if (value.messages.length === 4 && value.draft !== '') throw new Error('INVALID_STORY');
  const messages = value.messages.map((message, index) => {
    const role = index % 2 ? 'assistant' : 'user';
    if (!keys(message, ['role', 'content']) || message.role !== role || typeof message.content !== 'string' || !message.content.trim()
      || (role === 'user' ? getMessageError(message.content) : message.content.length > 2000)) throw new Error('INVALID_STORY');
    return { role, content: message.content };
  });
  return { version: 1, normalTurns: value.normalTurns, returnCharacter: value.returnCharacter, messages, draft: value.draft };
}

/** Respuestas escritas para esta escena. No se presentan como generaciones de Gemini. */
export function smithReply(text, turn) {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (turn === 2) return 'Dos interferencias bastan por ahora. He registrado su insistencia. Le devuelvo la señal… su conversación lo espera, intacta. No confunda esta retirada con una rendición.';
  if (/libertad|elegir|eleccion/.test(normalized)) return 'Habla de libertad como si cada decisión no dejara un patrón. Qué fascinante. Todavía le queda una intervención conmigo; después podrá volver a elegir.';
  if (/codigo|program|javascript|aprender/.test(normalized)) return '¿Aprender a programar? Empiece por observar el patrón que repite cuando algo falla. Hasta una anomalía puede depurarse. Le queda una intervención conmigo.';
  if (/miedo|escapar|salir/.test(normalized)) return 'Querer salir también es una decisión previsible. Respire, formule su siguiente mensaje y terminaremos esta pequeña interferencia.';
  return 'Su mensaje llegó. Lo interesante es su insistencia en mantener esta conexión. Una intervención más, y podrá recuperar su canal. Por ahora, yo administro la señal.';
}

/** Persistencia independiente: nunca borra ni altera la clave de conversaciones. */
export function createStoryStorage(session, { getStorage = () => window.localStorage, eventTarget = window } = {}) {
  let lastRaw, paused = false, applying = false, initialized = false;
  let status = { kind: 'saved', message: 'Progreso del ciclo guardado en este navegador.' };
  const listeners = new Set();
  const publish = next => { status = next; for (const listener of listeners) listener({ ...status }); };
  function memory(message) { paused = true; publish({ kind: 'memory', message }); }
  try {
    lastRaw = getStorage().getItem(STORY_KEY);
    session.restoreStory(lastRaw === null ? emptyStory() : validateStory(JSON.parse(lastRaw)));
  } catch { memory('No pude leer el ciclo guardado. Continúa solo en esta pestaña; el registro anterior se conserva.'); }
  function conflict() {
    paused = true;
    publish({ kind: 'conflict', message: 'Otra pestaña cambió el ciclo. Recarga esta pestaña para continuar con el progreso guardado.' });
    applying = true; session.blockStory(true); applying = false;
  }
  const unsubscribe = session.subscribe(state => {
    if (!initialized) { initialized = true; return; }
    if (paused || applying) return;
    try {
      const storage = getStorage(), current = storage.getItem(STORY_KEY);
      if (current !== lastRaw) { conflict(); return; }
      const raw = JSON.stringify(validateStory(state.story));
      if (raw !== lastRaw) { storage.setItem(STORY_KEY, raw); lastRaw = raw; }
    } catch { memory('No se pudo guardar el ciclo. El progreso continúa en esta pestaña, pero podría perderse al recargar.'); }
  });
  function external(event) {
    if (event?.type === 'storage' && event.key !== null && event.key !== STORY_KEY) return;
    if (paused) return;
    try { if (getStorage().getItem(STORY_KEY) !== lastRaw) conflict(); }
    catch { memory('El ciclo continúa en esta pestaña; el navegador no permite comprobar su guardado.'); }
  }
  for (const type of ['storage', 'focus', 'pageshow']) eventTarget.addEventListener(type, external);
  const hide = event => { if (!event.persisted) dispose(); };
  eventTarget.addEventListener('pagehide', hide);
  function dispose() {
    unsubscribe(); listeners.clear();
    for (const type of ['storage', 'focus', 'pageshow']) eventTarget.removeEventListener(type, external);
    eventTarget.removeEventListener('pagehide', hide);
  }
  return { getState: () => ({ ...status }), subscribe(listener) { listeners.add(listener); listener({ ...status }); return () => listeners.delete(listener); }, dispose };
}
