import { createHistoryStorage, validateStoredHistory } from './history-storage.js';
import { CHARACTERS, getCharacter, isCharacterId } from './characters.js';
import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from './utils.js';

const requestErrors = {
  NETWORK_ERROR: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
  TIMEOUT: 'La respuesta tardó demasiado. Inténtalo de nuevo.',
  INVALID_CHARACTER: 'Elige Morfeo, el Oráculo o Trinity.',
  INVALID_HISTORY: 'El historial no es válido. Borra esta conversación para iniciar otra.',
  HISTORY_TOO_LARGE: 'La conversación supera 64 KiB. Borra esta conversación para iniciar otra.',
  RATE_LIMITED: 'Se alcanzó el límite de solicitudes por minuto.',
  DAILY_LIMIT: 'Se alcanzó el límite de solicitudes del día.',
  PROVIDER_RATE_LIMITED: 'La cuota del proveedor está ocupada. Espera antes de reintentar.',
  SERVICE_UNAVAILABLE: 'Se perdió la señal con el personaje. Inténtalo de nuevo.',
  QUOTA_UNAVAILABLE: 'No se pudo comprobar la disponibilidad del canal.',
  CONFIGURATION_ERROR: 'El canal no está disponible temporalmente.',
  INVALID_RESPONSE: 'La respuesta no llegó correctamente. Inténtalo de nuevo.',
  BLOCKED_RESPONSE: 'No se pudo responder a ese mensaje. Prueba con otra pregunta.',
  TRUNCATED_RESPONSE: 'La respuesta quedó incompleta. Prueba con una pregunta más concreta.',
  AUTH_REQUIRED: 'Introduce tu cohorte para desbloquear el chat.',
  INVALID_COHORT: 'Esta cohorte no tiene acceso al canal.',
  REQUEST_REJECTED: 'El servidor no pudo aceptar el mensaje. Inténtalo de nuevo.',
};
export class ChatRequestError extends Error {
  constructor(code) {
    // Solo códigos declarados; las propiedades heredadas no son errores de la app.
    const safeCode = typeof code === 'string' && Object.hasOwn(requestErrors, code) ? code : 'REQUEST_REJECTED';
    super(requestErrors[safeCode]);
    this.name = 'ChatRequestError';
    this.code = safeCode;
  }
}

let access = { authenticated: null, busy: false, error: '', quota: null, interceptedUntil: 0 };
const accessListeners = new Set();
export function getAccessState() { return { ...access, quota: access.quota ? { ...access.quota } : null }; }
function publishAccess() { for (const listener of accessListeners) listener(getAccessState()); }
export function subscribeAccess(listener) { accessListeners.add(listener); listener(getAccessState()); return () => accessListeners.delete(listener); }
function updateQuota(quota, intercepted = false) {
  if (quota && Number.isFinite(quota.minuteUsed) && Number.isFinite(quota.dayUsed)) {
    access.quota = quota;
    if (intercepted) access.interceptedUntil = quota.retryAt || Date.now() + 60_000;
    else if (!quota.blocked) access.interceptedUntil = 0;
    publishAccess();
  }
}

/** Contrato JSON compartido por sesión, desbloqueo y conversación. No muestra errores internos. */
export async function postApi(payload, { fetchImpl = globalThis.fetch, timeoutMs = 40_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/functions', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    const ok = response.ok;
    let data;
    try { data = await response.json(); } catch { if (ok) throw new ChatRequestError('INVALID_RESPONSE'); }
    updateQuota(data?.quota, response.status === 429);
    if (!ok) {
      const fallback = response.status === 401 ? 'AUTH_REQUIRED' : response.status === 413 ? 'HISTORY_TOO_LARGE'
        : response.status === 429 ? 'RATE_LIMITED' : response.status === 400 ? 'INVALID_HISTORY'
        : response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'REQUEST_REJECTED';
      const code = typeof data?.error?.code === 'string' && Object.hasOwn(requestErrors, data.error.code) ? data.error.code : fallback;
      if (code === 'AUTH_REQUIRED') { access.authenticated = false; access.error = requestErrors.AUTH_REQUIRED; publishAccess(); }
      throw new ChatRequestError(code);
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new ChatRequestError('TIMEOUT');
    if (error instanceof ChatRequestError) throw error;
    throw new ChatRequestError('NETWORK_ERROR');
  } finally { clearTimeout(timer); }
}
export async function requestReply(messages, { character = 'morpheus', ...options } = {}) {
  if (!isCharacterId(character)) throw new ChatRequestError('INVALID_CHARACTER');
  const data = await postApi({ character, messages }, options);
  if (!data || data.character !== character || typeof data.reply !== 'string' || !data.reply.trim()) throw new ChatRequestError('INVALID_RESPONSE');
  return data.reply.trim();
}
let accessRequest;
export function refreshAccess() {
  if (accessRequest) return accessRequest;
  access.busy = true; publishAccess();
  accessRequest = postApi({ action: 'session' }).then((data) => {
    access.authenticated = data?.authenticated === true;
    access.error = '';
  }).catch((error) => { access.error = error.message; if (access.authenticated === null) access.authenticated = false; })
    .finally(() => { access.busy = false; accessRequest = null; publishAccess(); });
  return accessRequest;
}
export async function unlockCohort(cohort) {
  if (access.busy) return false;
  access.busy = true; access.error = ''; publishAccess();
  try {
    const data = await postApi({ action: 'unlock', cohort });
    if (data?.authenticated !== true) throw new ChatRequestError('INVALID_RESPONSE');
    access.authenticated = true;
    return true;
  } catch (error) { access.error = error.message; return false; }
  finally { access.busy = false; publishAccess(); }
}
export function mountAccess(form, onUnlocked) {
  const fields = form.querySelector('[data-access-fields]');
  const input = form.querySelector('input');
  const button = form.querySelector('button');
  const feedback = form.querySelector('[data-access-error]');
  let mounted = true;
  const unsubscribe = subscribeAccess((state) => {
    fields.hidden = state.authenticated === true;
    input.disabled = state.busy || state.authenticated === true;
    input.required = state.authenticated !== true;
    button.disabled = state.busy;
    button.textContent = state.busy ? 'VERIFICANDO…' : state.authenticated ? 'ENTRAR AL CANAL ↗' : 'DESBLOQUEAR ↗';
    feedback.textContent = state.error;
    feedback.hidden = !state.error;
    input.setAttribute('aria-invalid', String(Boolean(state.error)));
  });
  async function submit(event) {
    event.preventDefault();
    if (access.busy) return;
    if (access.authenticated === true || await unlockCohort(input.value)) {
      if (mounted) onUnlocked();
    } else if (mounted) input.focus();
  }
  form.addEventListener('submit', submit);
  void refreshAccess();
  return () => { mounted = false; unsubscribe(); form.removeEventListener('submit', submit); };
}

/** La sesión de conversación es volátil; los contadores y el acceso se comprueban en servidor. */
export function createChatSession({ respond = requestReply, character = 'morpheus', initialState } = {}) {
  if (!isCharacterId(character)) throw new TypeError('Personaje no permitido.');
  let messages = initialState ? initialState.messages.map(message => ({ ...message })) : [];
  let draft = initialState?.draft ?? '', pending = false, error = '', errorCode = '';
  const listeners = new Set();
  const copyMessages = () => messages.map((message) => ({ ...message }));
  const getState = () => ({ character, messages: copyMessages(), draft, pending, error, errorCode });
  function notify() { for (const listener of listeners) listener(getState()); }
  function setDraft(text) {
    if (pending || typeof text !== 'string' || (text === draft && !error)) return;
    draft = text; error = ''; errorCode = ''; notify();
  }
  async function send() {
    if (pending || getMessageError(draft)) return false;
    const submitted = draft;
    messages.push({ role: 'user', content: submitted });
    draft = ''; error = ''; errorCode = ''; pending = true; notify();
    try {
      const reply = await respond(copyMessages(), { character });
      if (typeof reply !== 'string' || !reply.trim()) throw new Error('Respuesta vacía');
      messages.push({ role: 'assistant', content: reply.trim() });
      return true;
    } catch (cause) {
      messages.pop(); draft = submitted;
      errorCode = cause instanceof ChatRequestError ? cause.code : 'SERVICE_UNAVAILABLE';
      error = `${cause instanceof ChatRequestError ? cause.message : 'No se pudo obtener la respuesta.'} Tu mensaje sigue en el campo.`;
      return false;
    } finally { pending = false; notify(); }
  }
  function subscribe(listener) { listeners.add(listener); listener(getState()); return () => listeners.delete(listener); }
  return { getState, setDraft, send, subscribe };
}
/** Cada conversación posee mensajes, borrador y errores propios. Un envío fija su destino. */
export function createCharacterSession({ respond = requestReply, initialCharacter = null } = {}) {
  if (initialCharacter !== null && !isCharacterId(initialCharacter)) throw new TypeError('Personaje no permitido.');
  let conversations = new Map(CHARACTERS.map(({ id }) => [id, createChatSession({ respond, character: id })]));
  const listeners = new Set();
  let character = initialCharacter, revision = 0, batching = false;
  let childSubscriptions = [];
  const isPending = () => [...conversations.values()].some(session => session.getState().pending);
  function getState() {
    const snapshots = Object.fromEntries([...conversations].map(([id, session]) => [id, session.getState()]));
    const current = character ? snapshots[character] : { messages: [], draft: '', pending: false, error: '', errorCode: '' };
    return { ...current, character, revision, pending: Object.values(snapshots).some(session => session.pending), conversations: snapshots };
  }
  function notify() { if (!batching) for (const listener of listeners) listener(getState()); }
  function connectChildren() { childSubscriptions = [...conversations.values()].map(session => session.subscribe(notify)); }
  connectChildren();
  function restore(value) {
    if (isPending()) return false;
    let document;
    try { document = validateStoredHistory(value); } catch { return false; }
    batching = true;
    for (const unsubscribe of childSubscriptions) unsubscribe();
    conversations = new Map(CHARACTERS.map(({ id }) => [id, createChatSession({ respond, character: id, initialState: document.conversations[id] })]));
    character = document.character; revision += 1; connectChildren();
    batching = false; notify(); return true;
  }
  function selectCharacter(id) {
    if (!isCharacterId(id) || isPending()) return false;
    character = id; notify(); return true;
  }
  return {
    getState, selectCharacter, restore,
    setDraft(text) { if (character) conversations.get(character).setDraft(text); },
    send() { return character && !isPending() ? conversations.get(character).send() : Promise.resolve(false); },
    subscribe(listener) { listeners.add(listener); listener(getState()); return () => listeners.delete(listener); },
  };
}
const session = createCharacterSession();
const historyStorage = typeof window === 'undefined' ? null : createHistoryStorage(session);

export function mountChat(root, chatSession = session, storage = chatSession === session ? historyStorage : null) {
  const log = root.querySelector('.chat-log');
  const empty = log.querySelector('.empty-state').cloneNode(true);
  const status = root.querySelector('.chat-status');
  const consoleView = root.querySelector('[data-chat-console]');
  const gate = root.querySelector('[data-chat-gate]');
  const form = root.querySelector('.composer');
  const input = form.querySelector('textarea');
  const count = form.querySelector('output');
  const fieldError = form.querySelector('.input-error');
  const button = form.querySelector('button');
  const smith = root.querySelector('.smith-intrusion');
  const terminal = root.querySelector('.chat-terminal');
  const picker = root.querySelector('[data-character-picker]');
  const storageStatus = root.querySelector('[data-storage-status]');
  const storageActions = root.querySelector('[data-storage-actions]');
  const dialog = root.querySelector('[data-history-dialog]');
  let renderedCharacter, renderedRevision, confirmedAction;
  let renderedCount = 0, scrollFrame = 0, focusFrame = 0, lastIntercepted = false;
  let wasAuthenticated = access.authenticated === true;
  let state = chatSession.getState();
  let refreshing = false, mounted = true, refreshedAt = 0;
  function append({ role, content }) {
    const article = document.createElement('article');
    article.className = `message message--${role === 'user' ? 'user' : 'morpheus'}`;
    const author = document.createElement('p'); author.className = 'message-author'; author.textContent = role === 'user' ? 'TÚ >' : `${getCharacter(state.character)?.name.toUpperCase() ?? 'MORFEO'} >`;
    const text = document.createElement('p'); text.className = 'message-content'; text.textContent = content;
    article.append(author, text); log.append(article);
  }
  function writeText(node, text) { if (node.textContent !== text) node.textContent = text; }
  function render() {
    if (!mounted) return;
    const authenticated = access.authenticated === true;
    consoleView.hidden = !authenticated;
    gate.hidden = authenticated;
    if (wasAuthenticated && !authenticated) {
      if (dialog.open) dialog.close();
      // Espera a que el formulario haya habilitado su input al cambiar la sesión.
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => { if (mounted && access.authenticated !== true) gate.querySelector('input').focus(); });
    }
    wasAuthenticated = authenticated;
    const character = getCharacter(state.character);
    const selected = Boolean(character);
    picker.hidden = !authenticated || selected;
    form.hidden = !selected;
    log.hidden = !selected;
    if (renderedCharacter !== state.character || renderedRevision !== state.revision || !authenticated) {
      log.replaceChildren(); renderedCount = 0; renderedCharacter = state.character; renderedRevision = state.revision;
    }
    const previous = renderedCount;
    const visibleMessages = authenticated && selected ? state.messages : [];
    while (visibleMessages.length < renderedCount) { log.lastElementChild?.remove(); renderedCount -= 1; }
    if (visibleMessages.length && !renderedCount) log.replaceChildren();
    for (const message of visibleMessages.slice(renderedCount)) append(message);
    renderedCount = visibleMessages.length;
    if (!renderedCount && !log.firstElementChild) {
      const welcome = empty.cloneNode(true);
      welcome.querySelector('[data-empty-note]').textContent = character ? character.description : 'Elige un personaje para comenzar.';
      log.append(welcome);
    }
    if (renderedCount !== previous) { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
    writeText(root.querySelector('[data-channel-name]'), character ? `CONEXIÓN CON ${character.name.toUpperCase()}` : 'ELIGE TU CONEXIÓN');
    writeText(root.querySelector('[data-terminal-name]'), `${character?.terminal ?? 'zion'}@zion:~`);
    writeText(root.querySelector('[data-character-note]'), character ? `${character.description} / ${character.voice}` : 'Elige a quien te acompañará.');
    root.querySelector('[data-character-portrait]').hidden = character?.id !== 'morpheus';
    const emblem = root.querySelector('[data-character-emblem]'); emblem.hidden = !selected || character.id === 'morpheus';
    writeText(emblem, character?.emblem ?? '');
    input.placeholder = character ? `Escribe a ${character.name}…` : 'Elige un personaje…';
    terminal.setAttribute('aria-label', character ? `Conversación con ${character.name}` : 'Terminal de conversación');
    if (input.value !== (authenticated ? state.draft : '')) input.value = authenticated ? state.draft : '';
    renderStorage(authenticated);
    input.readOnly = state.pending;
    const length = countCharacters(state.draft), tooLong = length > MAX_MESSAGE_LENGTH;
    writeText(count, `${length} / ${MAX_MESSAGE_LENGTH}`);
    count.classList.toggle('is-over-limit', tooLong);
    input.setAttribute('aria-invalid', String(tooLong));
    fieldError.hidden = !tooLong;
    writeText(fieldError, tooLong ? getMessageError(state.draft) : '');
    const intercepted = access.interceptedUntil > Date.now();
    button.disabled = !authenticated || !selected || state.pending || intercepted || Boolean(getMessageError(state.draft));
    writeText(button, state.pending ? 'TRANSMITIENDO…' : intercepted ? 'CANAL BLOQUEADO' : state.error ? 'REINTENTAR ↗' : 'ENVIAR ↗');
    status.classList.toggle('chat-status--loading', state.pending);
    status.classList.toggle('chat-status--error', Boolean(state.error));
    const statusText = !selected ? 'CANAL ABIERTO · Selecciona un personaje para comenzar.' : state.pending ? `${character.name} está escribiendo…` : intercepted ? 'SEÑAL INTERCEPTADA · Tu mensaje está a salvo.' : state.error || `CANAL ABIERTO · ${character.name} está al otro lado.`;
    if (status.textContent !== statusText) status.textContent = statusText;
    smith.hidden = !intercepted;
    terminal.classList.toggle('is-intercepted', intercepted);
    if (intercepted && !lastIntercepted) {
      terminal.classList.remove('smith-glitch');
      void terminal.offsetWidth;
      terminal.classList.add('smith-glitch');
    }
    lastIntercepted = intercepted;
    const seconds = Math.max(0, Math.ceil((access.interceptedUntil - Date.now()) / 1000));
    writeText(root.querySelector('[data-smith-countdown]'), seconds >= 3600 ? `${Math.ceil(seconds / 3600)} h` : seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`);
    const quota = access.quota;
    writeText(root.querySelector('[data-minute-quota]'), quota ? `${quota.minuteUsed} / ${quota.minuteLimit}` : '— / 15');
    writeText(root.querySelector('[data-day-quota]'), quota ? `${quota.dayUsed} / ${quota.dayLimit}` : '— / 500');
    root.querySelector('[data-minute-bar]').style.setProperty('--usage', `${quota ? Math.min(100, quota.minuteUsed / quota.minuteLimit * 100) : 0}%`);
    root.querySelector('[data-day-bar]').style.setProperty('--usage', `${quota ? Math.min(100, quota.dayUsed / quota.dayLimit * 100) : 0}%`);
  }
  function renderStorage(authenticated) {
    const saved = storage?.getState();
    storageActions.hidden = !authenticated || !saved;
    if (!saved) return;
    writeText(storageStatus, saved.message);
    storageStatus.dataset.kind = saved.kind;
    const entries = Object.values(state.conversations ?? {});
    const anyData = entries.some(entry => entry.messages.length || entry.draft.length);
    root.querySelector('[data-history-action="current"]').disabled = state.pending || !state.character || !(state.messages.length || state.draft.length) || saved.blocked;
    root.querySelector('[data-history-action="all"]').disabled = state.pending || (!anyData && !['invalid', 'error'].includes(saved.kind) && !saved.hasSaved) || saved.conflict;
    root.querySelector('[data-storage-conflict]').hidden = !saved.conflict;
    for (const choice of root.querySelectorAll('[data-storage-conflict] button')) choice.disabled = state.pending;
  }
  function historyAction(event) {
    const action = event.target.closest('button[data-history-action]')?.dataset.historyAction;
    if (!action || !storage || access.authenticated !== true || state.pending) return;
    const descriptions = {
      current: `Se borrarán los mensajes y el borrador de ${getCharacter(state.character)?.name}. Las otras conversaciones se conservarán.`,
      all: 'Se borrarán los mensajes y borradores de los tres personajes guardados en este navegador. Las cuotas del canal se conservan.',
      load: 'Se reemplazará lo que tienes en esta pestaña por el último historial guardado. Los cambios que solo estén aquí se perderán.',
      keep: 'Se guardará la versión de esta pestaña, reemplazando el historial que guardó la otra pestaña.',
    };
    if (!Object.hasOwn(descriptions, action)) return;
    confirmedAction = action;
    writeText(dialog.querySelector('h2'), ['current', 'all'].includes(action) ? '¿Borrar el historial?' : '¿Conservar esta versión?');
    writeText(dialog.querySelector('p'), descriptions[action]);
    dialog.showModal(); dialog.querySelector('[data-history-cancel]').focus();
  }
  function confirmHistory(event) {
    event.preventDefault();
    if (access.authenticated !== true || state.pending) { dialog.close(); return; }
    const success = confirmedAction === 'load' ? storage.loadExternal() : confirmedAction === 'keep' ? storage.keepLocal() : storage.clear(confirmedAction);
    dialog.close(); confirmedAction = null;
    if (success) { if (chatSession.getState().character) input.focus(); else picker.querySelector('button').focus(); }
  }
  storageActions.addEventListener('click', historyAction);
  dialog.querySelector('form').addEventListener('submit', confirmHistory);
  const cancelHistory = () => { confirmedAction = null; dialog.close(); };
  dialog.querySelector('[data-history-cancel]').addEventListener('click', cancelHistory);
  dialog.addEventListener('cancel', cancelHistory);
  function handleInput() { chatSession.setDraft(input.value); }
  function handleSubmit(event) { event.preventDefault(); if (button.disabled) return; input.focus({ preventScroll: true }); void chatSession.send(); }
  function chooseCharacter(event) {
    const choice = event.target.closest('button[data-character]');
    if (!choice || access.authenticated !== true) return;
    if (chatSession.selectCharacter(choice.dataset.character)) input.focus();
  }
  picker.addEventListener('click', chooseCharacter);
  input.addEventListener('input', handleInput); form.addEventListener('submit', handleSubmit);
  const unsubscribeChat = chatSession.subscribe((next) => { state = next; render(); });
  const unsubscribeAccess = subscribeAccess(render);
  const unsubscribeStorage = storage?.subscribe(render) ?? (() => {});
  const cleanGate = mountAccess(gate.querySelector('form'), () => {
    if (state.errorCode === 'AUTH_REQUIRED') chatSession.setDraft(state.draft);
    render();
    if (state.character) input.focus(); else picker.querySelector('button').focus();
  });
  const tick = setInterval(() => {
    render();
    const quota = access.quota;
    const expired = (access.interceptedUntil && access.interceptedUntil <= Date.now()) || (quota?.minuteUsed > 0 && quota.minuteResetAt <= Date.now());
    if (authenticatedNow() && expired && !refreshing && Date.now() - refreshedAt > 5000) {
      refreshing = true; refreshedAt = Date.now();
      void refreshAccess().finally(() => { refreshing = false; });
    }
  }, 1000);
  function authenticatedNow() { return access.authenticated === true; }
  return () => { mounted = false; clearInterval(tick); unsubscribeChat(); unsubscribeAccess(); unsubscribeStorage(); cleanGate(); if (dialog.open) dialog.close(); storageActions.removeEventListener('click', historyAction); dialog.querySelector('form').removeEventListener('submit', confirmHistory); dialog.querySelector('[data-history-cancel]').removeEventListener('click', cancelHistory); dialog.removeEventListener('cancel', cancelHistory); cancelAnimationFrame(scrollFrame); cancelAnimationFrame(focusFrame); input.removeEventListener('input', handleInput); form.removeEventListener('submit', handleSubmit); picker.removeEventListener('click', chooseCharacter); };
}
