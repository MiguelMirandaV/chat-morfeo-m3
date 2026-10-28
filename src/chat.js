import { emptyStory, validateStory, createStoryStorage } from './smith-story.js';
import { getSmithQuestion, SMITH_QUESTIONS } from './smith-questions.js';
import { mountSmithScene } from './smith-scene.js';
import { parseCharacterRequest, getComposerKeyAction } from './chat-controls.js';
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
    if (intercepted || quota.blocked) access.interceptedUntil = quota.retryAt || Date.now() + 60_000;
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

/** Estado de un personaje. El coordinador conecta su persistencia; el servidor comprueba acceso y cuotas. */
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
  async function send(onCompleted = () => {}) {
    if (pending || getMessageError(draft)) return false;
    const submitted = draft;
    messages.push({ role: 'user', content: submitted });
    draft = ''; error = ''; errorCode = ''; pending = true; notify();
    try {
      const reply = await respond(copyMessages(), { character });
      if (typeof reply !== 'string' || !reply.trim()) throw new Error('Respuesta vacía');
      messages.push({ role: 'assistant', content: reply.trim() });
      onCompleted();
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
  let character = initialCharacter, revision = 0, batching = false, transfer = null, controlMessage = '';
  let childSubscriptions = [];
  let story = emptyStory(), storyBlocked = false;
  const isPending = () => [...conversations.values()].some(session => session.getState().pending);
  function getState() {
    const snapshots = Object.fromEntries([...conversations].map(([id, session]) => [id, session.getState()]));
    const normal = character ? snapshots[character] : { messages: [], draft: '', pending: false, error: '', errorCode: '' };
    return { ...normal, character, revision, story: validateStory(story), smithQuestion: getSmithQuestion(story), storyBlocked,
      smithActive: Boolean(story.active), transfer: transfer ? { from: transfer.from, to: transfer.to } : null,
      controlMessage, pending: Object.values(snapshots).some(session => session.pending), conversations: snapshots };
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
    character = story.active ? story.active.character : document.character; transfer = null; controlMessage = ''; revision += 1; connectChildren();
    batching = false; notify(); return true;
  }
  function selectCharacter(id) {
    if (!isCharacterId(id) || isPending() || transfer || story.active || storyBlocked) return false;
    character = id; controlMessage = ''; notify(); return true;
  }
  return {
    getState, selectCharacter, restore,
    restoreStory(value) {
      if (isPending()) return false;
      let restored;
      try { restored = validateStory(value); } catch { return false; }
      story = restored; storyBlocked = false; transfer = null;
      if (story.active) character = story.active.character;
      revision += 1; notify(); return true;
    },
    blockStory(blocked) { storyBlocked = Boolean(blocked); notify(); },
    answerSmith(token, option) {
      const question = getSmithQuestion(story);
      if (storyBlocked || isPending() || !question || token !== question.token || !['a', 'b'].includes(option)) return false;
      const answer = SMITH_QUESTIONS[question.number - 1];
      if (option === answer.correctOption) {
        character = story.active.character;
        story.characters[character].passed = true;
        story.active = null; revision += 1;
        controlMessage = `Respuesta correcta. ${answer.explanation} Señal recuperada con ${getCharacter(character).name}.`;
      } else {
        // El índice se deriva del intento: 10 errores vuelven a la primera sin reutilizar su token.
        if (story.active.attempt === Number.MAX_SAFE_INTEGER) return false;
        story.active.attempt += 1;
        controlMessage = `Incorrecto. ${answer.explanation} Prueba la siguiente pregunta.`;
      }
      notify(); return true;
    },
    setDraft(text) {
      if (storyBlocked || story.active || isPending() || transfer || typeof text !== 'string') return;
      if (character) { controlMessage = ''; conversations.get(character).setDraft(text); }
    },
    async send() {
      if (storyBlocked || !character || isPending() || transfer) return false;
      if (story.active) return false;
      const draft = conversations.get(character).getState().draft;
      if (getMessageError(draft)) return false;
      const request = parseCharacterRequest(draft);
      if (!request) {
        controlMessage = '';
        // Cuenta dentro del cierre del turno, antes de notificar pending=false y permitir otro envío.
        const destination = character;
        return conversations.get(destination).send(() => {
          const progress = story.characters[destination];
          if (progress.passed) return;
          progress.turns += 1;
          if (progress.turns === 3) { story.active = { character: destination, attempt: 0 }; revision += 1; }
        });
      }
      if (request.type === 'help') controlMessage = 'Usa /hablar morfeo, /hablar oráculo o /hablar trinity.';
      else if (request.target === character) controlMessage = `Ya estás hablando con ${getCharacter(character).name}.`;
      else { transfer = { from: character, to: request.target, draft, revision }; controlMessage = 'Confirma el cambio de canal.'; }
      notify(); return false;
    },
    confirmTransfer() {
      if (storyBlocked || story.active || !transfer || isPending() || transfer.from !== character || transfer.revision !== revision || conversations.get(character).getState().draft !== transfer.draft) return false;
      const target = transfer.to;
      batching = true;
      conversations.get(character).setDraft('');
      character = target; transfer = null; controlMessage = `Conexión restablecida con ${getCharacter(target).name}.`;
      batching = false; notify(); return true;
    },
    cancelTransfer() {
      if (!transfer) return false;
      transfer = null; controlMessage = 'Cambio cancelado. Conservé tu mensaje.'; notify(); return true;
    },
    subscribe(listener) { listeners.add(listener); listener(getState()); return () => listeners.delete(listener); },
  };
}
const session = createCharacterSession();
const historyStorage = typeof window === 'undefined' ? null : createHistoryStorage(session);
const storyStorage = typeof window === 'undefined' ? null : createStoryStorage(session);

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
  const historyMenu = root.querySelector('[data-history-menu]');
  const dialog = root.querySelector('[data-history-dialog]');
  const transferDialog = root.querySelector('[data-transfer-dialog]');
  let composing = false, compositionEndedAt = -Infinity;
  let renderedCharacter, renderedRevision, confirmedAction;
  const quizOptions = root.querySelector('[data-smith-options]');
  const quizQuestion = root.querySelector('[data-smith-question]');
  let renderedQuestionToken = null, quizUnlockAt = 0, quizUnlockTimer = null;
  const narrativeStorage = chatSession === session ? storyStorage : null;
  let narrativeStatus = narrativeStorage?.getState();
  const smithScene = mountSmithScene(root.querySelector('[data-smith-canvas]'), root.querySelector('[data-smith-pause]'));
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
    root.querySelector('[data-terminal-metrics]').hidden = !authenticated;
    if (!authenticated) historyMenu.open = false;
    if (wasAuthenticated && !authenticated) {
      if (dialog.open) dialog.close();
      chatSession.cancelTransfer();
      // Espera a que el formulario haya habilitado su input al cambiar la sesión.
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => { if (mounted && access.authenticated !== true) gate.querySelector('input').focus(); });
    }
    wasAuthenticated = authenticated;
    const character = !authenticated ? null : state.smithActive ? { id: 'smith', name: 'Smith', terminal: 'agent_smith', emblem: '[ S ]' } : getCharacter(state.character);
    const displayKey = state.smithActive ? 'smith' : state.character;
    const selected = Boolean(character);
    picker.hidden = !authenticated || selected;
    form.hidden = !selected || state.smithActive;
    log.hidden = !selected || state.smithActive;
    if (renderedCharacter !== displayKey || renderedRevision !== state.revision || !authenticated) {
      log.replaceChildren(); renderedCount = 0; renderedCharacter = displayKey; renderedRevision = state.revision;
    }
    const previous = renderedCount;
    const visibleMessages = authenticated && selected ? state.messages : [];
    while (visibleMessages.length < renderedCount) { log.lastElementChild?.remove(); renderedCount -= 1; }
    if (visibleMessages.length && !renderedCount) log.replaceChildren();
    for (const message of visibleMessages.slice(renderedCount)) append(message);
    renderedCount = visibleMessages.length;
    if (!renderedCount && !log.firstElementChild) {
      const welcome = empty.cloneNode(true);
      welcome.querySelector('h2').textContent = state.smithActive ? 'He encontrado su señal.' : 'El canal está abierto.';
      welcome.querySelector('[data-empty-note]').textContent = state.smithActive ? 'Un acierto recupera tu conversación.' : 'Escribe tu primera pregunta.';
      log.append(welcome);
    }
    if (renderedCount !== previous) { cancelAnimationFrame(scrollFrame); scrollFrame = requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; }); }
    writeText(root.querySelector('[data-channel-name]'), character ? character.name.toUpperCase() : authenticated ? 'ELIGE TU CONEXIÓN' : 'CANAL CERRADO');
    writeText(root.querySelector('[data-terminal-name]'), `${character?.terminal ?? 'network'}@zion:~`);
    const emblem = root.querySelector('[data-character-emblem]'); emblem.hidden = !selected;
    writeText(emblem, character?.emblem ?? '');
    writeText(root.querySelector('[data-transfer-help]'), state.smithActive ? 'Cambiar de personaje estará disponible al recuperar la señal.' : `Cambiar: /hablar ${state.character === 'trinity' ? 'morfeo' : 'trinity'}`);
    input.placeholder = character ? `Escribe a ${character.name}…` : 'Elige un personaje…';
    terminal.setAttribute('aria-label', character ? `Conversación con ${character.name}` : 'Terminal de conversación');
    if (input.value !== (authenticated ? state.draft : '')) input.value = authenticated ? state.draft : '';
    renderStorage(authenticated);
    input.readOnly = state.pending || Boolean(state.transfer) || state.smithActive || state.storyBlocked;
    if (authenticated && state.transfer) {
      writeText(transferDialog.querySelector('#transfer-description'), `Pasarás de ${getCharacter(state.transfer.from).name} a ${getCharacter(state.transfer.to).name}. Recuperarás su historial y borrador. El cambio no consume solicitudes.`);
      if (!transferDialog.open) { transferDialog.showModal(); transferDialog.querySelector('[data-transfer-cancel]').focus(); }
    } else if (transferDialog.open) transferDialog.close();
    const length = countCharacters(state.draft), tooLong = length > MAX_MESSAGE_LENGTH;
    writeText(count, `${length} / ${MAX_MESSAGE_LENGTH}`);
    count.classList.toggle('is-over-limit', tooLong);
    input.setAttribute('aria-invalid', String(tooLong));
    fieldError.hidden = !tooLong;
    writeText(fieldError, tooLong ? getMessageError(state.draft) : '');
    const intercepted = access.interceptedUntil > Date.now();
    const isControl = Boolean(parseCharacterRequest(state.draft));
    button.disabled = !authenticated || !selected || state.pending || state.smithActive || state.storyBlocked || Boolean(state.transfer) || (intercepted && !isControl && !state.smithActive) || Boolean(getMessageError(state.draft));
    writeText(button, state.storyBlocked ? 'PROGRESO EN OTRA PESTAÑA' : state.pending ? 'TRANSMITIENDO…' : isControl && !state.smithActive ? 'SOLICITAR CAMBIO ↗' : intercepted && !state.smithActive ? 'CANAL BLOQUEADO' : state.error ? 'REINTENTAR ↗' : 'ENVIAR ↗');
    status.classList.toggle('chat-status--loading', state.pending);
    status.classList.toggle('chat-status--error', Boolean(state.error && !state.controlMessage));
    const statusText = state.storyBlocked ? 'Otra pestaña actualizó el progreso. Recarga para continuar.' : state.smithActive ? '' : state.controlMessage || (state.pending ? `${character?.name ?? 'Tu personaje'} está escribiendo…` : state.error);
    status.hidden = !authenticated || !statusText;
    if (status.textContent !== statusText) status.textContent = statusText;
    const takeover = authenticated && state.smithActive;
    smith.hidden = !takeover;
    root.classList.toggle('has-smith', takeover);
    document.body.classList.toggle('smith-takeover', takeover);
    if (takeover) historyMenu.open = false;
    // El tamaño de pantalla completa debe aplicarse antes del primer dibujo del canvas.
    smithScene.setActive(takeover);
    const enteringSmith = takeover && !lastIntercepted;
    lastIntercepted = takeover;
    renderQuiz(authenticated);
    if (enteringSmith && authenticated) {
      cancelAnimationFrame(focusFrame);
      focusFrame = requestAnimationFrame(() => { if (mounted && access.authenticated === true && state.smithActive) quizOptions.querySelector('button')?.focus(); });
    }
    const progress = state.story.characters[state.character];
    writeText(root.querySelector('[data-story-progress]'), !progress ? '' : state.smithActive
      ? 'Smith: reto pendiente.' : progress.passed
        ? 'Smith: superado · No vuelve a este canal.' : `Smith: ${progress.turns} / 3 · Una intervención por personaje.`);
    const lastNormal = state.conversations[state.character]?.messages.at(-1);
    const details = root.querySelector('[data-last-normal]');
    details.hidden = !lastNormal;
    writeText(details.querySelector('p'), lastNormal?.role === 'assistant' ? lastNormal.content : '');
    const seconds = Math.max(0, Math.ceil((access.interceptedUntil - Date.now()) / 1000));
    root.querySelector('[data-quota-wait]').hidden = !authenticated || !intercepted;
    writeText(root.querySelector('[data-quota-countdown]'), seconds >= 3600 ? `${Math.ceil(seconds / 3600)} h` : seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`);
    const quota = access.quota;
    writeText(root.querySelector('[data-minute-quota]'), quota ? `${quota.minuteUsed} / ${quota.minuteLimit}` : '— / 15');
    writeText(root.querySelector('[data-day-quota]'), quota ? `${quota.dayUsed} / ${quota.dayLimit}` : '— / 500');
    const storyNotice = root.querySelector('[data-story-storage]');
    storyNotice.hidden = !authenticated || !narrativeStatus || narrativeStatus.kind === 'saved';
    writeText(storyNotice, narrativeStatus?.message ?? '');
    storyNotice.dataset.kind = narrativeStatus?.kind ?? '';
    // La toma de pantalla oculta las barras normales; sus avisos accionables siguen visibles aquí.
    const warnings = [];
    if (state.storyBlocked) warnings.push('Otra pestaña actualizó el progreso. Recarga para continuar.');
    else if (narrativeStatus && narrativeStatus.kind !== 'saved') warnings.push(narrativeStatus.message);
    const saved = storage?.getState();
    if (saved && ['error', 'invalid', 'conflict'].includes(saved.kind)) warnings.push(saved.message);
    const smithWarning = root.querySelector('[data-smith-warning]');
    writeText(smithWarning, warnings.join(' '));
    smithWarning.hidden = !takeover || !warnings.length;
    const smithConflict = root.querySelector('[data-smith-history-conflict]');
    smithConflict.hidden = !takeover || !saved?.conflict;
    for (const choice of smithConflict.querySelectorAll('button')) choice.disabled = state.pending;
  }
  function renderStorage(authenticated) {
    const saved = storage?.getState();
    storageActions.hidden = !authenticated || !saved;
    if (!saved) return;
    writeText(storageStatus, saved.kind === 'saved' && !saved.recovered ? 'Historial guardado' : saved.kind === 'empty' ? 'Sin historial guardado' : saved.message);
    storageStatus.dataset.kind = saved.kind;
    const entries = Object.values(state.conversations ?? {});
    const anyData = entries.some(entry => entry.messages.length || entry.draft.length);
    const currentConversation = state.conversations[state.character];
    root.querySelector('[data-history-action="current"]').disabled = state.pending || !state.character || !(currentConversation?.messages.length || currentConversation?.draft.length) || saved.blocked;
    root.querySelector('[data-history-action="all"]').disabled = state.pending || (!anyData && !['invalid', 'error'].includes(saved.kind) && !saved.hasSaved) || saved.conflict;
    root.querySelector('[data-storage-conflict]').hidden = !saved.conflict;
    for (const choice of root.querySelectorAll('[data-storage-conflict] button')) choice.disabled = state.pending;
  }
  function historyAction(event) {
    const action = event.target.closest('button[data-history-action]')?.dataset.historyAction;
    if (!action || !storage || access.authenticated !== true || state.pending || state.transfer) return;
    const descriptions = {
      current: `Se borrarán los mensajes y el borrador de ${getCharacter(state.character)?.name}. Las otras conversaciones y el progreso de Smith se conservarán.`,
      all: 'Se borrarán los mensajes y borradores de los tres personajes guardados en este navegador. Las cuotas y el progreso de Smith se conservan.',
      load: 'Se reemplazará lo que tienes en esta pestaña por el último historial guardado. Los cambios que solo estén aquí se perderán.',
      keep: 'Se guardará la versión de esta pestaña, reemplazando el historial que guardó la otra pestaña.',
    };
    if (!Object.hasOwn(descriptions, action)) return;
    historyMenu.open = false;
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
    if (success) focusConversation();
  }
  root.addEventListener('click', historyAction);
  dialog.querySelector('form').addEventListener('submit', confirmHistory);
  const cancelHistory = () => { confirmedAction = null; dialog.close(); if (state.smithActive) focusConversation(); else historyMenu.querySelector('summary').focus(); };
  dialog.querySelector('[data-history-cancel]').addEventListener('click', cancelHistory);
  dialog.addEventListener('cancel', cancelHistory);
  function closeHistoryMenu(event) {
    if (event.type === 'keydown') {
      if (event.key !== 'Escape' || !historyMenu.open) return;
      event.preventDefault(); historyMenu.open = false; historyMenu.querySelector('summary').focus();
    } else if (!historyMenu.contains(event.target)) historyMenu.open = false;
  }
  historyMenu.addEventListener('keydown', closeHistoryMenu);
  root.addEventListener('pointerdown', closeHistoryMenu);
  function renderQuiz(authenticated) {
    const question = state.smithQuestion;
    if (!question) { renderedQuestionToken = null; quizOptions.replaceChildren(); return; }
    writeText(root.querySelector('[data-smith-progress]'), `Pregunta ${question.number} / ${question.total} · Un acierto para volver`);
    writeText(quizQuestion, question.prompt);
    writeText(root.querySelector('[data-smith-feedback]'), state.controlMessage);
    if (renderedQuestionToken !== question.token) {
      quizOptions.replaceChildren(...question.options.map(option => {
        const choice = document.createElement('button');
        choice.type = 'button'; choice.dataset.quizToken = question.token; choice.dataset.quizOption = option.id;
        choice.textContent = `${option.id.toUpperCase()}. ${option.text}`;
        return choice;
      }));
      renderedQuestionToken = question.token;
    }
    for (const choice of quizOptions.querySelectorAll('button')) {
      choice.disabled = !authenticated || state.storyBlocked || state.pending || performance.now() < quizUnlockAt;
    }
  }
  function answerQuiz(event) {
    const choice = event.target.closest('button[data-quiz-option]');
    if (!choice || choice.disabled || event.detail > 1 || access.authenticated !== true || performance.now() < quizUnlockAt) return;
    const restoreFocus = smith.contains(document.activeElement);
    quizUnlockAt = performance.now() + 500;
    if (!chatSession.answerSmith(choice.dataset.quizToken, choice.dataset.quizOption)) { quizUnlockAt = 0; render(); return; }
    clearTimeout(quizUnlockTimer);
    if (!state.smithActive) { quizUnlockAt = 0; if (restoreFocus) input.focus(); return; }
    if (restoreFocus) quizQuestion.focus();
    // Solo evita que un doble clic/Enter repetido conteste también la pregunta siguiente.
    // Nunca completa ni retira el reto por tiempo.
    quizUnlockTimer = setTimeout(() => {
      if (!mounted) return;
      quizUnlockAt = 0; render();
      if (state.smithActive && access.authenticated === true && document.activeElement === quizQuestion) quizOptions.querySelector('button')?.focus();
    }, 500);
  }
  function guardQuizRepeat(event) {
    if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
  }
  function focusConversation() {
    if (state.smithActive) quizOptions.querySelector('button')?.focus();
    else if (state.character) input.focus();
    else picker.querySelector('button').focus();
  }
  function resumeView() { if (mounted) render(); }
  quizOptions.addEventListener('click', answerQuiz);
  quizOptions.addEventListener('keydown', guardQuizRepeat);
  document.addEventListener('visibilitychange', resumeView);
  function handleInput() { chatSession.setDraft(input.value); }
  function handleKey(event) {
    const action = getComposerKeyAction(event, { composing, justComposed: performance.now() - compositionEndedAt < 80 });
    if (!action) return;
    event.preventDefault();
    if (action === 'submit' && !button.disabled) form.requestSubmit();
  }
  function compositionStart() { composing = true; }
  function compositionEnd() { composing = false; compositionEndedAt = performance.now(); }
  function cancelTransfer(event) { event?.preventDefault(); chatSession.cancelTransfer(); input.focus(); }
  function confirmTransfer(event) {
    event.preventDefault();
    if (access.authenticated === true && chatSession.confirmTransfer()) input.focus();
    else chatSession.cancelTransfer();
  }
  transferDialog.addEventListener('cancel', cancelTransfer);
  transferDialog.querySelector('[data-transfer-cancel]').addEventListener('click', cancelTransfer);
  transferDialog.querySelector('form').addEventListener('submit', confirmTransfer);
  input.addEventListener('keydown', handleKey);
  input.addEventListener('compositionstart', compositionStart);
  input.addEventListener('compositionend', compositionEnd);
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
  const unsubscribeStory = narrativeStorage?.subscribe(saved => {
    narrativeStatus = saved; render();
  }) ?? (() => {});
  const cleanGate = mountAccess(gate.querySelector('form'), () => {
    if (state.errorCode === 'AUTH_REQUIRED') chatSession.setDraft(state.draft);
    render();
    focusConversation();
  });
  const tick = setInterval(() => {
    if (document.hidden) return;
    if (access.interceptedUntil) render();
    const quota = access.quota;
    const expired = (access.interceptedUntil && access.interceptedUntil <= Date.now()) || (quota?.minuteUsed > 0 && quota.minuteResetAt <= Date.now());
    if (authenticatedNow() && expired && !refreshing && Date.now() - refreshedAt > 5000) {
      refreshing = true; refreshedAt = Date.now();
      void refreshAccess().finally(() => { refreshing = false; });
    }
  }, 1000);
  function authenticatedNow() { return access.authenticated === true; }
  return () => { mounted = false; clearTimeout(quizUnlockTimer);
    document.body.classList.remove('smith-takeover'); root.classList.remove('has-smith');
    document.removeEventListener('visibilitychange', resumeView);
    historyMenu.removeEventListener('keydown', closeHistoryMenu); root.removeEventListener('pointerdown', closeHistoryMenu);
    smithScene.dispose(); unsubscribeStory(); quizOptions.removeEventListener('click', answerQuiz); quizOptions.removeEventListener('keydown', guardQuizRepeat); chatSession.cancelTransfer(); if (transferDialog.open) transferDialog.close();
    transferDialog.removeEventListener('cancel', cancelTransfer);
    transferDialog.querySelector('[data-transfer-cancel]').removeEventListener('click', cancelTransfer);
    transferDialog.querySelector('form').removeEventListener('submit', confirmTransfer);
    input.removeEventListener('keydown', handleKey); input.removeEventListener('compositionstart', compositionStart); input.removeEventListener('compositionend', compositionEnd);
    clearInterval(tick); unsubscribeChat(); unsubscribeAccess(); unsubscribeStorage(); cleanGate(); if (dialog.open) dialog.close(); root.removeEventListener('click', historyAction); dialog.querySelector('form').removeEventListener('submit', confirmHistory); dialog.querySelector('[data-history-cancel]').removeEventListener('click', cancelHistory); dialog.removeEventListener('cancel', cancelHistory); cancelAnimationFrame(scrollFrame); cancelAnimationFrame(focusFrame); input.removeEventListener('input', handleInput); form.removeEventListener('submit', handleSubmit); picker.removeEventListener('click', chooseCharacter); };
}
