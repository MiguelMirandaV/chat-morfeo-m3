import { getMessageError } from '../src/utils.js';

export const MAX_REQUEST_BYTES = 64 * 1024;

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Valida sin recortar ni alterar los turnos recibidos. Solo acepta el contrato acordado. */
export function validateHistory(body) {
  const invalid = () => new ApiError(400, 'INVALID_HISTORY', 'Envía un historial alternado de mensajes user y assistant, terminado en user.');
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Array.isArray(body.messages)) throw invalid();
  const { messages } = body;
  if (!messages.length || messages.length % 2 !== 1) throw invalid();
  return messages.map((message, index) => {
    if (!message || typeof message !== 'object' || Array.isArray(message) || Object.keys(message).length !== 2) throw invalid();
    const expectedRole = index % 2 === 0 ? 'user' : 'assistant';
    if (message.role !== expectedRole || typeof message.content !== 'string' || !message.content.trim()) throw invalid();
    if (message.role === 'user' && getMessageError(message.content)) {
      throw new ApiError(400, 'INVALID_MESSAGE', 'Cada mensaje del usuario debe contener texto y tener como máximo 280 caracteres.');
    }
    return { role: message.role, content: message.content };
  });
}

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

/** La dependencia respond permite probar fallos sin consumir servicios externos. */
export function createHandler({ respond = simulateReply } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Utiliza POST para enviar la conversación.');
      }
      const contentType = req.headers['content-type'];
      if (typeof contentType !== 'string' || contentType.split(';')[0].trim().toLowerCase() !== 'application/json') {
        throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'El cuerpo debe enviarse como application/json.');
      }
      const tooLarge = () => new ApiError(413, 'HISTORY_TOO_LARGE', 'La conversación supera el límite de 64 KiB. Inicia una sesión nueva.');
      if (Number(req.headers['content-length']) > MAX_REQUEST_BYTES) throw tooLarge();
      let body;
      try {
        // Vercel procesa JSON al acceder a este getter; un JSON malformado puede lanzar aquí.
        body = req.body;
      } catch {
        throw new ApiError(400, 'INVALID_JSON', 'El cuerpo no contiene JSON válido.');
      }
      const serialized = JSON.stringify(body);
      if (serialized && Buffer.byteLength(serialized, 'utf8') > MAX_REQUEST_BYTES) throw tooLarge();
      const messages = validateHistory(body);
      const reply = await respond(messages);
      if (typeof reply !== 'string' || !reply.trim()) {
        throw new ApiError(502, 'INVALID_RESPONSE', 'El servicio devolvió una respuesta vacía o inválida.');
      }
      return res.status(200).json({ reply: reply.trim() });
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.status).json({ error: { code: error.code, message: error.message } });
      }
      // No devolver excepciones del proveedor, claves ni datos del historial.
      return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'El servicio no está disponible. Inténtalo de nuevo.' } });
    }
  };
}

export default createHandler();
