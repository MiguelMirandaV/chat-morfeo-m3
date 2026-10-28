import { CHARACTERS, isCharacterId } from './characters.js';
import { getMessageError } from './utils.js';

export const HISTORY_KEY = 'morfeo.conversations.v1';
export const MAX_STORAGE_BYTES = 1024 * 1024;
const bytes = value => new TextEncoder().encode(value).length;
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
export function emptyHistory() {
  return { version: 1, character: null, conversations: Object.fromEntries(CHARACTERS.map(({ id }) => [id, { messages: [], draft: '', interrupted: false }])) };
}

/** Trata el almacenamiento como entrada externa. No recorta ni ejecuta su contenido. */
export function validateStoredHistory(value) {
  if (!exactKeys(value, ['version', 'character', 'conversations']) || value.version !== 1
    || (value.character !== null && !isCharacterId(value.character))
    || !exactKeys(value.conversations, CHARACTERS.map(({ id }) => id))) throw new Error('INVALID_STORAGE');
  const result = emptyHistory(); result.character = value.character;
  for (const { id } of CHARACTERS) {
    const entry = value.conversations[id];
    if (!exactKeys(entry, ['messages', 'draft', 'interrupted']) || typeof entry.draft !== 'string' || typeof entry.interrupted !== 'boolean'
      || !Array.isArray(entry.messages) || entry.messages.length % 2 || entry.messages.length > 4096) throw new Error('INVALID_STORAGE');
    const messages = entry.messages.map((message, index) => {
      const role = index % 2 ? 'assistant' : 'user';
      if (!exactKeys(message, ['role', 'content']) || message.role !== role || typeof message.content !== 'string'
        || !message.content.trim() || (role === 'user' && getMessageError(message.content))) throw new Error('INVALID_STORAGE');
      return { role, content: message.content };
    });
    if (entry.interrupted && !entry.draft.trim()) throw new Error('INVALID_STORAGE');
    result.conversations[id] = { messages, draft: entry.draft, interrupted: entry.interrupted };
  }
  if (bytes(JSON.stringify(result)) > MAX_STORAGE_BYTES) throw new Error('STORAGE_TOO_LARGE');
  return result;
}
export function readStoredHistory(raw) {
  if (typeof raw !== 'string' || bytes(raw) > MAX_STORAGE_BYTES) throw new Error('INVALID_STORAGE');
  return validateStoredHistory(JSON.parse(raw));
}
export function snapshotForStorage(state) {
  const document = emptyHistory(); document.character = state.character;
  for (const { id } of CHARACTERS) {
    const entry = state.conversations[id];
    const messages = entry.messages.map(message => ({ ...message }));
    // Antes de iniciar fetch ya queda guardado un borrador recuperable, sin turno incompleto.
    const draft = entry.pending ? messages.pop()?.content : entry.draft;
    document.conversations[id] = { messages, draft, interrupted: entry.pending || ['NETWORK_ERROR', 'TIMEOUT'].includes(entry.errorCode) };
  }
  return validateStoredHistory(document);
}
const hasData = document => Object.values(document.conversations).some(entry => entry.messages.length || entry.draft.length);
const recovered = document => Object.values(document.conversations).some(entry => entry.interrupted);

/** Coordina escrituras, fallos y conflictos; no almacena cookies, cuotas ni claves. */
export function createHistoryStorage(session, { getStorage = () => window.localStorage, eventTarget = window } = {}) {
  const listeners = new Set();
  let lastRaw = null, paused = false, invalidRecord = false, externalConflict = false, applying = false, initialized = false;
  let status = { kind: 'empty', hasSaved: false, recovered: false, message: 'Sin historial guardado en este navegador.' };
  const getState = () => ({ ...status, blocked: paused, invalidRecord, conflict: externalConflict });
  const publish = next => { status = { ...status, ...next }; for (const listener of listeners) listener(getState()); };
  function showDocument(document, raw) {
    publish({ kind: hasData(document) ? 'saved' : 'empty', hasSaved: hasData(document), recovered: recovered(document),
      message: recovered(document) ? session.getState().pending ? 'Borrador protegido. La respuesta sigue en curso.' : 'Borrador recuperado de un envío interrumpido. Revísalo; no se reenvió automáticamente.'
        : hasData(document) ? 'Historial y borradores guardados en este navegador.' : 'Sin historial guardado en este navegador.' });
    lastRaw = raw;
  }
  function invalid() {
    paused = true; invalidRecord = true; externalConflict = false;
    publish({ kind: 'invalid', hasSaved: false, recovered: false, message: 'El historial guardado no es compatible o está dañado. No lo sobrescribí. Puedes borrar todos los historiales para volver a guardar.' });
  }
  function conflict() {
    paused = true; invalidRecord = false; externalConflict = true;
    publish({ kind: 'conflict', hasSaved: false, message: 'Otra pestaña cambió el historial. El guardado está pausado: elige qué versión conservar.' });
  }
  function apply(document) {
    applying = true;
    try { return session.restore(document); } finally { applying = false; }
  }
  try { lastRaw = getStorage().getItem(HISTORY_KEY); }
  catch {
    lastRaw = undefined;
    publish({ kind: 'error', message: 'El navegador no permite leer el almacenamiento. La conversación continúa en esta pestaña.' });
  }
  if (lastRaw !== undefined) {
    try {
      const document = lastRaw === null ? emptyHistory() : readStoredHistory(lastRaw);
      apply(document); showDocument(document, lastRaw);
    } catch { invalid(); }
  }

  function commit(document, { overwrite = false } = {}) {
    try {
      const storage = getStorage();
      const current = storage.getItem(HISTORY_KEY);
      if (lastRaw === undefined && current === null) lastRaw = null;
      if (!overwrite && current !== lastRaw) { conflict(); return false; }
      const raw = hasData(document) ? JSON.stringify(document) : null;
      if (raw !== current) { if (raw === null) storage.removeItem(HISTORY_KEY); else storage.setItem(HISTORY_KEY, raw); }
      paused = false; invalidRecord = false; externalConflict = false; showDocument(document, raw); return true;
    } catch {
      publish({ kind: 'error', message: 'No se pudo guardar o borrar el historial. Tus cambios siguen en esta pestaña; el guardado anterior puede seguir en el navegador.' });
      return false;
    }
  }
  const unsubscribe = session.subscribe(state => {
    if (!initialized) { initialized = true; return; }
    if (applying || paused) return;
    try { commit(snapshotForStorage(state)); }
    catch { publish({ kind: 'error', message: 'El historial o borrador es demasiado grande para guardarlo. Se conserva en esta pestaña, sin recortarlo.' }); }
  });
  function checkExternal(event) {
    if (event?.type === 'storage' && event.key !== null && event.key !== HISTORY_KEY) return;
    try {
      const storage = getStorage();
      if (event?.storageArea && event.storageArea !== storage) return;
      if (storage.getItem(HISTORY_KEY) !== lastRaw) conflict();
    } catch { publish({ kind: 'error', message: 'No se pudo acceder al guardado. La conversación continúa en esta pestaña.' }); }
  }
  for (const type of ['storage', 'focus', 'pageshow']) eventTarget.addEventListener(type, checkExternal);
  const onPageHide = event => { if (!event.persisted) dispose(); };
  eventTarget.addEventListener('pagehide', onPageHide);
  function dispose() {
    unsubscribe(); listeners.clear();
    for (const type of ['storage', 'focus', 'pageshow']) eventTarget.removeEventListener(type, checkExternal);
    eventTarget.removeEventListener('pagehide', onPageHide);
  }
  return {
    getState,
    subscribe(listener) { listeners.add(listener); listener(getState()); return () => listeners.delete(listener); },
    clear(scope) {
      const state = session.getState();
      if (state.pending || !['current', 'all'].includes(scope) || (scope === 'current' && !state.character)) return false;
      if (paused && (scope !== 'all' || !invalidRecord)) return false;
      let document;
      try {
        document = scope === 'all' ? emptyHistory() : snapshotForStorage({ ...state, conversations: { ...state.conversations, [state.character]: { messages: [], draft: '', pending: false } } });
      } catch { return false; }
      // Solo se limpia la memoria después de comprobar el cambio en almacenamiento.
      if (!commit(document, { overwrite: invalidRecord && scope === 'all' })) return false;
      return apply(document);
    },
    loadExternal() {
      if (session.getState().pending) return false;
      try {
        const raw = getStorage().getItem(HISTORY_KEY);
        const document = raw === null ? emptyHistory() : readStoredHistory(raw);
        if (!apply(document)) return false;
        paused = false; invalidRecord = false; externalConflict = false; showDocument(document, raw); return true;
      } catch { invalid(); return false; }
    },
    keepLocal() {
      if (session.getState().pending) return false;
      try { return commit(snapshotForStorage(session.getState()), { overwrite: true }); }
      catch { publish({ kind: 'error', message: 'No se pudo guardar esta versión completa. Se conserva en esta pestaña, sin recortarla.' }); return false; }
    },
    dispose,
  };
}
