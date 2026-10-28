import { CHARACTERS, isCharacterId } from './characters.js';

// v1 era un contador global 3+2. Su clave se conserva, pero no se reutiliza como progreso por personaje.
export const LEGACY_STORY_KEY = 'morfeo.smith-story.v1';
export const STORY_KEY = 'morfeo.smith-story.v2';
const keys = (value, names) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
export const emptyStory = () => ({
  version: 2,
  characters: Object.fromEntries(CHARACTERS.map(({ id }) => [id, { turns: 0, passed: false }])),
  active: null,
});

/** Valida la versión, los límites y la coherencia entre contador y reto pendiente. */
export function validateStory(value) {
  if (!keys(value, ['version', 'characters', 'active']) || value.version !== 2
    || !keys(value.characters, CHARACTERS.map(({ id }) => id))) throw new Error('INVALID_STORY');
  const result = emptyStory();
  if (value.active !== null) {
    if (!keys(value.active, ['character', 'attempt']) || !isCharacterId(value.active.character)
      || !Number.isSafeInteger(value.active.attempt) || value.active.attempt < 0) throw new Error('INVALID_STORY');
    result.active = { character: value.active.character, attempt: value.active.attempt };
  }
  for (const { id } of CHARACTERS) {
    const progress = value.characters[id];
    if (!keys(progress, ['turns', 'passed']) || !Number.isInteger(progress.turns) || progress.turns < 0 || progress.turns > 3
      || typeof progress.passed !== 'boolean' || (progress.passed && progress.turns !== 3)) throw new Error('INVALID_STORY');
    const pending = progress.turns === 3 && !progress.passed;
    if (pending !== (result.active?.character === id)) throw new Error('INVALID_STORY');
    result.characters[id] = { turns: progress.turns, passed: progress.passed };
  }
  return result;
}

/** Persistencia independiente: nunca borra ni altera la clave de conversaciones. */
export function createStoryStorage(session, { getStorage = () => window.localStorage, eventTarget = window } = {}) {
  let lastRaw, paused = false, applying = false, initialized = false;
  let status = { kind: 'saved', message: 'Progreso de Smith guardado en este navegador.' };
  const listeners = new Set();
  const publish = next => { status = next; for (const listener of listeners) listener({ ...status }); };
  function memory(message) { paused = true; publish({ kind: 'memory', message }); }
  try {
    lastRaw = getStorage().getItem(STORY_KEY);
    session.restoreStory(lastRaw === null ? emptyStory() : validateStory(JSON.parse(lastRaw)));
  } catch { memory('No pude leer el progreso guardado. Continúa solo en esta pestaña; el registro anterior se conserva.'); }
  function conflict() {
    paused = true;
    publish({ kind: 'conflict', message: 'Otra pestaña cambió el progreso. Recarga esta pestaña para continuar con el progreso guardado.' });
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
    } catch { memory('No se pudo guardar el progreso. El progreso continúa en esta pestaña, pero podría perderse al recargar.'); }
  });
  function external(event) {
    if (event?.type === 'storage' && event.key !== null && event.key !== STORY_KEY) return;
    if (paused) return;
    try {
      const storage = getStorage();
      if (event?.storageArea && event.storageArea !== storage) return;
      if (storage.getItem(STORY_KEY) !== lastRaw) conflict();
    }
    catch { memory('El progreso continúa en esta pestaña; el navegador no permite comprobar su guardado.'); }
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
