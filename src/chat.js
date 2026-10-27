import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from './utils.js';

const requestErrors = {
  NETWORK_ERROR: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
  TIMEOUT: 'La respuesta tardó demasiado. Inténtalo de nuevo.',
  INVALID_HISTORY: 'El historial enviado no es válido. Recarga para iniciar una sesión nueva.',
  HISTORY_TOO_LARGE: 'La conversación supera el límite de 64 KiB. Recarga para iniciar una sesión nueva.',
  RATE_LIMITED: 'Demasiadas solicitudes. Espera un momento y vuelve a intentarlo.',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible. Inténtalo de nuevo.',
  INVALID_RESPONSE: 'El servicio devolvió una respuesta inválida. Inténtalo de nuevo.',
  REQUEST_REJECTED: 'El servidor no pudo aceptar el mensaje. Inténtalo de nuevo.',
};

export class ChatRequestError extends Error {
  constructor(code) {
    super(requestErrors[code] || requestErrors.REQUEST_REJECTED);
    this.name = 'ChatRequestError';
    this.code = code;
  }
}

/** Transporte HTTP separado del estado y del render; los tests inyectan fetch. */
export async function requestReply(messages, { fetchImpl = globalThis.fetch, timeoutMs = 20_000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/functions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const code = response.status === 413 ? 'HISTORY_TOO_LARGE'
        : response.status === 429 ? 'RATE_LIMITED'
        : response.status === 400 ? 'INVALID_HISTORY'
        : response.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'REQUEST_REJECTED';
      throw new ChatRequestError(code);
    }
    let data;
    try { data = await response.json(); }
    catch { throw new ChatRequestError('INVALID_RESPONSE'); }
    if (!data || typeof data.reply !== 'string' || !data.reply.trim()) throw new ChatRequestError('INVALID_RESPONSE');
    return data.reply.trim();
  } catch (error) {
    if (controller.signal.aborted) throw new ChatRequestError('TIMEOUT');
    if (error instanceof ChatRequestError) throw error;
    throw new ChatRequestError('NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
  }
}

/** La sesión no depende del DOM: puede terminar un turno mientras otra vista está abierta. */
export function createChatSession({ respond = requestReply } = {}) {
  let messages = [];
  let draft = '';
  let pending = false;
  let error = '';
  const listeners = new Set();
  const copyMessages = () => messages.map((message) => ({ ...message }));
  const getState = () => ({ messages: copyMessages(), draft, pending, error });
  function notify() {
    for (const listener of listeners) listener(getState());
  }
  function setDraft(text) {
    if (pending || typeof text !== 'string') return;
    draft = text;
    error = '';
    notify();
  }
  async function send() {
    if (pending || getMessageError(draft)) return false;
    const submitted = draft;
    messages.push({ role: 'user', content: submitted });
    draft = '';
    error = '';
    // El bloqueo ocurre antes del primer await, incluso ante dos envíos seguidos.
    pending = true;
    notify();
    try {
      const reply = await respond(copyMessages());
      if (typeof reply !== 'string' || !reply.trim()) throw new Error('Respuesta vacía');
      messages.push({ role: 'assistant', content: reply.trim() });
      return true;
    } catch (cause) {
      // Revierte solo el turno fallido: reenviar no duplica el mensaje ni pierde el texto.
      messages.pop();
      draft = submitted;
      const detail = cause instanceof ChatRequestError ? cause.message : 'No se pudo obtener la respuesta.';
      error = `${detail} Tu mensaje sigue en el campo.`;
      return false;
    } finally {
      pending = false;
      notify();
    }
  }
  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }
  return { getState, setDraft, send, subscribe };
}

// Se crea una sola vez al cargar el módulo; navegar no vuelve a crear la sesión.
const session = createChatSession();

export function mountChat(root, chatSession = session) {
  const log = root.querySelector('.chat-log');
  const emptyState = log.querySelector('.empty-state').cloneNode(true);
  const status = root.querySelector('.chat-status');
  const form = root.querySelector('.composer');
  const input = form.querySelector('textarea');
  const counter = form.querySelector('output');
  const fieldError = form.querySelector('.input-error');
  const submit = form.querySelector('button[type="submit"]');
  let renderedCount = 0;
  let scrollFrame = 0;

  function appendMessage({ role, content }) {
    const message = document.createElement('article');
    message.className = `message message--${role === 'user' ? 'user' : 'morpheus'}`;
    const author = document.createElement('p');
    author.className = 'message-author';
    author.textContent = role === 'user' ? 'TÚ >' : 'MORFEO >';
    const text = document.createElement('p');
    text.className = 'message-content';
    // Texto del usuario y del proveedor nunca se interpreta como HTML.
    text.textContent = content;
    message.append(author, text);
    log.append(message);
  }

  function render(state) {
    const previousCount = renderedCount;
    if (state.messages.length < renderedCount) {
      log.replaceChildren();
      renderedCount = 0;
    }
    if (state.messages.length && !renderedCount) log.replaceChildren();
    for (const message of state.messages.slice(renderedCount)) appendMessage(message);
    renderedCount = state.messages.length;
    if (!renderedCount && !log.firstElementChild) log.append(emptyState.cloneNode(true));
    // Se añaden solo los turnos nuevos: escribir en el campo no recrea el log vivo.
    if (renderedCount !== previousCount) {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    }

    if (input.value !== state.draft) input.value = state.draft;
    input.readOnly = state.pending;
    const length = countCharacters(state.draft);
    const tooLong = length > MAX_MESSAGE_LENGTH;
    counter.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;
    counter.classList.toggle('is-over-limit', tooLong);
    input.setAttribute('aria-invalid', String(tooLong));
    fieldError.hidden = !tooLong;
    fieldError.textContent = tooLong ? getMessageError(state.draft) : '';
    submit.disabled = state.pending || Boolean(getMessageError(state.draft));
    submit.textContent = state.pending ? 'Esperando…' : state.error ? 'Reintentar ↗' : 'Enviar ↗';
    status.classList.toggle('chat-status--loading', state.pending);
    status.classList.toggle('chat-status--error', Boolean(state.error));
    const statusText = state.pending ? 'Morfeo está escribiendo…' : state.error || 'Modo de prueba · Respuestas simuladas.';
    if (status.textContent !== statusText) status.textContent = statusText;
  }

  function handleInput() { chatSession.setDraft(input.value); }
  function handleSubmit(event) {
    event.preventDefault();
    // El botón quedará deshabilitado; conserva el foco en el campo del mismo turno.
    if (!submit.disabled) input.focus({ preventScroll: true });
    void chatSession.send();
  }
  input.addEventListener('input', handleInput);
  form.addEventListener('submit', handleSubmit);
  const unsubscribe = chatSession.subscribe(render);
  return () => {
    unsubscribe();
    cancelAnimationFrame(scrollFrame);
    input.removeEventListener('input', handleInput);
    form.removeEventListener('submit', handleSubmit);
  };
}
