import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from './utils.js';

/** Simulación temporal: no llama a un proveedor ni pretende razonar con IA. */
export async function simulateReply(messages) {
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const question = messages.at(-1).content.toLocaleLowerCase('es');
  let replies;
  if (/\b(hola|buenas|saludos)\b/.test(question)) {
    replies = [
      'Bienvenido. Antes de buscar una respuesta, detente en tu pregunta. ¿Qué te ha traído hasta aquí?',
      'Aquí puedes empezar con una inquietud. ¿Hay algo que quieras mirar desde otra perspectiva?',
      'Te escucho. No necesitas tener todo claro para comenzar. ¿Qué deseas preguntar?',
    ];
  } else if (/miedo|duda|difícil/.test(question)) {
    replies = [
      'La duda no cierra el camino. Te invita a mirar con atención. ¿Qué pequeño paso puedes dar, aun con ese miedo?',
      'Equivocarte puede mostrarte un límite que todavía no comprendías. ¿Qué podrías intentar en un espacio donde el error sea parte del aprendizaje?',
      'Observa ese temor: ¿nace de algo que ya ocurrió o de algo que imaginas? Distinguirlos puede ayudarte a elegir el siguiente paso.',
    ];
  } else if (/aprender|estudi|program|código/.test(question)) {
    replies = [
      'Aprender exige poner a prueba lo que crees comprender. Elige una idea, construye algo pequeño y observa qué ocurre. ¿Qué quieres explorar primero?',
      'Intenta explicar una sola idea con tus palabras y después comprobarla con un ejemplo. ¿En qué parte de esa explicación aparece una duda?',
      'Divide el problema hasta encontrar una acción que puedas probar. Un resultado pequeño te dará algo concreto que observar. ¿Cuál sería esa primera prueba?',
    ];
  } else if (/realidad|matrix|libertad|elegir/.test(question)) {
    replies = [
      'Lo familiar puede parecer la única posibilidad. Cuestionarlo es el comienzo de una elección. ¿Qué estás dando por cierto?',
      'Una elección empieza por reconocer las posibilidades que tienes delante. ¿Qué opción has descartado sin examinarla?',
      'Tus sentidos ofrecen una parte de lo que conoces. También interpretas y supones. ¿Qué evidencia te ayudaría a revisar esa interpretación?',
    ];
  } else {
    replies = [
      'Puedo acompañarte en la pregunta. Mira lo que sabes, lo que supones y lo que aún puedes comprobar. ¿Cuál de esas partes te inquieta?',
      'Elige un aspecto concreto de esa inquietud. ¿Qué observación te permitiría comprenderlo mejor?',
      'Considera qué cambiaría si revisaras una de tus suposiciones. ¿Qué pregunta podrías hacer para ponerla a prueba?',
    ];
  }

  // Prioriza las variantes menos usadas y excluye la respuesta anterior, incluso al agotar el banco.
  const previousReplies = messages.filter(({ role }) => role === 'assistant').map(({ content }) => content);
  const candidates = replies.filter((reply) => reply !== previousReplies.at(-1));
  const usage = (reply) => previousReplies.filter((previous) => previous === reply).length;
  return candidates.reduce((selected, reply) => usage(reply) < usage(selected) ? reply : selected);
}

/** La sesión no depende del DOM: puede terminar un turno mientras otra vista está abierta. */
export function createChatSession({ respond = simulateReply } = {}) {
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
    } catch {
      // Revierte solo el turno fallido: reenviar no duplica el mensaje ni pierde el texto.
      messages.pop();
      draft = submitted;
      error = 'No se pudo obtener la respuesta. Tu mensaje sigue en el campo; vuelve a enviarlo.';
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
