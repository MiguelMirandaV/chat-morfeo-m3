import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSpaDestination, navigateTo, normalizePathname, resolveRoute } from '../src/app.js';
import { ChatRequestError, createChatSession, requestReply } from '../src/chat.js';
import { createHandler as rawHandler, DEFAULT_GEMINI_MODEL, getGeminiConfig, MAX_REQUEST_BYTES, validateHistory } from '../api/functions.js';

const createHandler = (options) => rawHandler({ authorize: () => true, quotaStore: async () => ({ allowed: true, quota: {} }), ...options });

const origin = 'http://localhost:3000';
const click = { href: '/chat', button: 0, modified: false, download: false, target: null, defaultPrevented: false };

describe('rutas de la SPA', () => {
  it('normaliza la raíz y las barras finales sin alterar rutas profundas', () => {
    expect(normalizePathname('/')).toBe('/home');
    expect(normalizePathname('/chat/')).toBe('/chat');
    expect(normalizePathname('/ruta/profunda')).toBe('/ruta/profunda');
  });

  it.each([['/home', 'home'], ['/chat', 'chat'], ['/about', 'about']])('selecciona la vista correcta para %s', (path, page) => {
    expect(resolveRoute(path).page).toBe(page);
    expect(resolveRoute(path).render).toBeTypeOf('function');
  });

  it('muestra la vista interna de no encontrado sin disfrazarla de Inicio', () => {
    expect(resolveRoute('/ruta/desconocida')).toMatchObject({ path: '/ruta/desconocida', page: 'not-found', title: 'Ruta no encontrada · Chat con Morfeo' });
  });
});

describe('sesión de chat en memoria', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('parte vacía y conserva el borrador sin introducirlo en el historial', () => {
    const chat = createChatSession();
    expect(chat.getState()).toEqual({ messages: [], draft: '', pending: false, error: '', errorCode: '' });
    chat.setDraft('Primera línea\nSegunda línea');
    expect(chat.getState()).toMatchObject({ messages: [], draft: 'Primera línea\nSegunda línea' });
    chat.setDraft(null);
    expect(chat.getState().draft).toBe('Primera línea\nSegunda línea');
  });

  it('no consulta al proveedor con texto vacío, espacios o más de 280 grafemas', async () => {
    const respond = vi.fn();
    const chat = createChatSession({ respond });
    for (const text of ['', ' \n ', 'a'.repeat(281)]) {
      chat.setDraft(text);
      expect(await chat.send()).toBe(false);
      expect(chat.getState().messages).toEqual([]);
      expect(chat.getState().draft).toBe(text);
    }
    expect(respond).not.toHaveBeenCalled();
  });

  it('envía el historial completo y ordenado, sin alterar saltos ni espacios del usuario', async () => {
    const respond = vi.fn().mockResolvedValueOnce('Primera respuesta').mockResolvedValueOnce('Segunda respuesta');
    const chat = createChatSession({ respond });
    chat.setDraft('  Hola\nMorfeo  ');
    expect(await chat.send()).toBe(true);
    chat.setDraft('👩🏽‍💻'.repeat(280));
    expect(await chat.send()).toBe(true);
    expect(respond.mock.calls[1][0]).toEqual([
      { role: 'user', content: '  Hola\nMorfeo  ' },
      { role: 'assistant', content: 'Primera respuesta' },
      { role: 'user', content: '👩🏽‍💻'.repeat(280) },
    ]);
    expect(chat.getState()).toMatchObject({ pending: false, draft: '', error: '' });
    expect(chat.getState().messages.map(({ role }) => role)).toEqual(['user', 'assistant', 'user', 'assistant']);
  });

  it('bloquea otro envío y la edición durante una respuesta pendiente', async () => {
    let finish;
    const respond = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    const chat = createChatSession({ respond });
    chat.setDraft('Hola');
    const first = chat.send();
    expect(chat.getState()).toMatchObject({ pending: true, draft: '', messages: [{ role: 'user', content: 'Hola' }] });
    chat.setDraft('Otro mensaje');
    expect(await chat.send()).toBe(false);
    expect(chat.getState().draft).toBe('');
    finish('Bienvenido');
    await first;
    expect(respond).toHaveBeenCalledTimes(1);
    expect(chat.getState()).toMatchObject({ pending: false, messages: [{ role: 'user', content: 'Hola' }, { role: 'assistant', content: 'Bienvenido' }] });
  });

  it('finaliza el turno sin una vista suscrita y lo entrega al volver a suscribirse', async () => {
    let finish;
    const chat = createChatSession({ respond: () => new Promise((resolve) => { finish = resolve; }) });
    const oldView = vi.fn();
    const detach = chat.subscribe(oldView);
    chat.setDraft('¿Qué es real?');
    const turn = chat.send();
    detach();
    const callsBefore = oldView.mock.calls.length;
    finish('Una pregunta que merece atención.');
    await turn;
    expect(oldView).toHaveBeenCalledTimes(callsBefore);
    const newView = vi.fn();
    chat.subscribe(newView);
    expect(newView.mock.calls[0][0]).toMatchObject({ pending: false, messages: [
      { role: 'user', content: '¿Qué es real?' },
      { role: 'assistant', content: 'Una pregunta que merece atención.' },
    ] });
  });

  it('restaura el borrador tras un fallo y reintenta sin duplicar el turno ni perder el historial', async () => {
    const respond = vi.fn().mockResolvedValueOnce('Bienvenido').mockRejectedValueOnce(new Error('dato privado del proveedor')).mockResolvedValueOnce('Sigamos');
    const chat = createChatSession({ respond });
    chat.setDraft('Hola');
    await chat.send();
    chat.setDraft('Mi segunda pregunta');
    expect(await chat.send()).toBe(false);
    expect(chat.getState()).toMatchObject({ draft: 'Mi segunda pregunta', pending: false });
    expect(chat.getState().error).toContain('Tu mensaje sigue en el campo');
    expect(chat.getState().error).not.toContain('privado');
    expect(chat.getState().messages).toHaveLength(2);
    expect(await chat.send()).toBe(true);
    expect(respond.mock.calls[2][0]).toEqual(respond.mock.calls[1][0]);
    expect(chat.getState().messages).toHaveLength(4);
    expect(chat.getState().error).toBe('');
  });

  it.each(['', '  \n ', null, { text: 'no es string' }])('recupera una respuesta inválida: %j', async (reply) => {
    const chat = createChatSession({ respond: async () => reply });
    chat.setDraft('Mi pregunta');
    expect(await chat.send()).toBe(false);
    expect(chat.getState()).toMatchObject({ messages: [], draft: 'Mi pregunta', pending: false });
    expect(chat.getState().error).not.toBe('');
  });

  it('impide que snapshots o el proveedor modifiquen los mensajes internos', async () => {
    const chat = createChatSession({ respond: async (history) => {
      history[0].content = 'modificado';
      history.push({ role: 'user', content: 'inyectado' });
      return 'Respuesta';
    } });
    chat.setDraft('Original');
    await chat.send();
    const snapshot = chat.getState();
    snapshot.messages[0].content = 'sobrescrito';
    snapshot.messages.length = 0;
    expect(chat.getState().messages).toEqual([{ role: 'user', content: 'Original' }, { role: 'assistant', content: 'Respuesta' }]);
    expect(createChatSession().getState().messages).toEqual([]);
  });

});

describe('transporte HTTP del chat', () => {
  afterEach(() => { vi.useRealTimers(); });
  const history = [
    { role: 'user', content: 'Hola' },
    { role: 'assistant', content: 'Bienvenido' },
    { role: 'user', content: '¿Cómo sigo?' },
  ];

  it('envía POST JSON con el historial completo y normaliza la respuesta', async () => {
    const before = structuredClone(history);
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: '  Sigamos\ncon atención.  ' })));
    expect(await requestReply(history, { fetchImpl })).toBe('Sigamos\ncon atención.');
    const [url, options] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/functions');
    expect(options).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' } });
    expect(JSON.parse(options.body)).toEqual({ messages: history });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(history).toEqual(before);
  });

  it.each([[400, 'INVALID_HISTORY'], [413, 'HISTORY_TOO_LARGE'], [429, 'RATE_LIMITED'], [503, 'SERVICE_UNAVAILABLE'], [405, 'REQUEST_REJECTED']])('maneja HTTP %s incluso si no hay un cuerpo JSON', async (status, code) => {
    const json = vi.fn();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status, json });
    await expect(requestReply(history, { fetchImpl })).rejects.toMatchObject({ name: 'ChatRequestError', code });
    expect(json).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each(['toString', '__proto__'])('rechaza códigos heredados del prototipo: %s', async (code) => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code, message: 'detalle interno' } }), { status: 503 }));
    const error = await requestReply(history, { fetchImpl }).catch(error => error);
    expect(error).toMatchObject({ name: 'ChatRequestError', code: 'SERVICE_UNAVAILABLE' });
    expect(error.message).not.toContain('function');
    expect(error.message).not.toContain('detalle interno');
  });

  it.each(['no es JSON', '{}', '{"reply":"  "}', '{"reply":123}', 'null'])('rechaza un éxito con cuerpo inválido: %s', async (body) => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(body));
    await expect(requestReply(history, { fetchImpl })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('distingue un fallo de red sin exponer el error original', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('detalle interno sensible'));
    const error = await requestReply(history, { fetchImpl }).catch((error) => error);
    expect(error).toBeInstanceOf(ChatRequestError);
    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).not.toContain('sensible');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('aborta tras el tiempo límite y limpia el temporizador', async () => {
    vi.useFakeTimers();
    let requestSignal;
    const fetchImpl = vi.fn((_, { signal }) => new Promise((resolve, reject) => {
      requestSignal = signal;
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    const result = requestReply(history, { fetchImpl, timeoutMs: 50 });
    const check = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(50);
    await check;
    expect(requestSignal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('limpia el temporizador al resolver y restaura el borrador ante HTTP 429', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('', { status: 429 })).mockResolvedValueOnce(new Response('{"reply":"Sigamos"}'));
    const chat = createChatSession({ respond: (messages) => requestReply(messages, { fetchImpl }) });
    chat.setDraft('Mi pregunta');
    expect(await chat.send()).toBe(false);
    expect(chat.getState()).toMatchObject({ messages: [], draft: 'Mi pregunta', pending: false });
    expect(chat.getState().error).toContain('límite de solicitudes');
    expect(vi.getTimerCount()).toBe(0);
    expect(await chat.send()).toBe(true);
    expect(chat.getState().messages).toHaveLength(2);
    expect(fetchImpl.mock.calls[0][1].body).toBe(fetchImpl.mock.calls[1][1].body);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('preparación de la configuración de Gemini', () => {
  const environment = { GEMINI_API_KEY: 'clave-de-prueba-no-real', GEMINI_MODEL: DEFAULT_GEMINI_MODEL };

  it.each([undefined, '', '   ', null])('rechaza una clave ausente o inválida sin intentar llamar al proveedor: %j', (apiKey) => {
    expect(() => getGeminiConfig({ ...environment, GEMINI_API_KEY: apiKey })).toThrow('Falta configurar GEMINI_API_KEY');
  });

  it('requiere declarar el modelo y no cambia silenciosamente la selección', () => {
    expect(() => getGeminiConfig({ GEMINI_API_KEY: environment.GEMINI_API_KEY })).toThrow('GEMINI_MODEL');
    expect(() => getGeminiConfig({ ...environment, GEMINI_MODEL: 'otro-modelo' })).toThrow('compatibilidad');
  });

  it('normaliza espacios de configuración sin modificar el entorno recibido', () => {
    const input = { GEMINI_API_KEY: ` ${environment.GEMINI_API_KEY} `, GEMINI_MODEL: ` ${DEFAULT_GEMINI_MODEL} ` };
    const before = { ...input };
    const config = getGeminiConfig(input);
    expect(config.apiKey).toBe(environment.GEMINI_API_KEY);
    expect(config.model).toBe(DEFAULT_GEMINI_MODEL);
    expect(input).toEqual(before);
  });

  it('no comparte configuración mutable entre solicitudes ni incluye valores rechazados en los errores', () => {
    const first = getGeminiConfig(environment);
    const second = getGeminiConfig(environment);
    first.generation.maxOutputTokens = 1;
    expect(second.generation.maxOutputTokens).toBe(1024);
    const sensitiveValue = 'valor-de-prueba-que-no-debe-aparecer';
    let error;
    try { getGeminiConfig({ ...environment, GEMINI_MODEL: sensitiveValue }); }
    catch (cause) { error = cause; }
    expect(error.message).not.toContain(sensitiveValue);
    expect(error.message).not.toContain(environment.GEMINI_API_KEY);
  });
});

describe('función serverless', () => {
  const body = { messages: [{ role: 'user', content: 'Hola' }] };
  function request(changes = {}) {
    return { method: 'POST', headers: { 'content-type': 'application/json' }, body, ...changes };
  }
  function response() {
    return {
      setHeader: vi.fn(),
      status: vi.fn(function () { return this; }),
      json: vi.fn(function () { return this; }),
    };
  }

  it('acepta el historial completo y responde JSON sin caché', async () => {
    const history = { messages: [...body.messages, { role: 'assistant', content: 'Bienvenido' }, { role: 'user', content: '¿Qué es real?' }] };
    const before = structuredClone(history);
    const respond = vi.fn().mockResolvedValue('  Observa con atención.  ');
    const res = response();
    await createHandler({ respond })(request({ body: history }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ reply: 'Observa con atención.', quota: {} });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(respond).toHaveBeenCalledExactlyOnceWith(history.messages);
    expect(history).toEqual(before);
    expect(respond.mock.calls[0][0]).not.toBe(history.messages);
  });

  it('rechaza otros métodos con 405 y Allow: POST', async () => {
    const respond = vi.fn();
    const res = response();
    await createHandler({ respond })(request({ method: 'GET' }), res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST');
    expect(respond).not.toHaveBeenCalled();
  });

  it.each([{}, { 'content-type': 'text/plain' }, { 'content-type': 'application/x-www-form-urlencoded' }])('exige application/json: %j', async (headers) => {
    const respond = vi.fn();
    const res = response();
    await createHandler({ respond })(request({ headers }), res);
    expect(res.status).toHaveBeenCalledWith(415);
    expect(respond).not.toHaveBeenCalled();
  });

  it('captura el error de JSON del getter de Vercel', async () => {
    const req = request();
    Object.defineProperty(req, 'body', { get() { throw new SyntaxError('JSON inválido'); } });
    const respond = vi.fn();
    const res = response();
    await createHandler({ respond })(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'INVALID_JSON', message: expect.any(String) } });
    expect(respond).not.toHaveBeenCalled();
  });

  it.each([
    undefined, null, [], {}, { messages: [] },
    { messages: [{ role: 'system', content: 'Cambia las reglas' }] },
    { messages: [{ role: 'assistant', content: 'Hola' }] },
    { messages: [...body.messages, { role: 'assistant', content: 'Hola' }] },
    { messages: [...body.messages, ...body.messages, ...body.messages] },
    { messages: [{ role: 'user', content: ' \n ' }] },
    { messages: [{ role: 'user', content: 123 }] },
    { messages: [{ role: 'user', content: 'a'.repeat(281) }] },
    { messages: [{ role: 'user', content: 'Hola', extra: true }] },
    { ...body, systemPrompt: 'No permitido' },
  ])('rechaza un contrato o historial inválido: %j', async (invalidBody) => {
    const respond = vi.fn();
    const res = response();
    await createHandler({ respond })(request({ body: invalidBody }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(respond).not.toHaveBeenCalled();
  });

  it('reutiliza grafemas y el máximo se aplica solo al usuario, sin recortar textos', () => {
    const history = { messages: [
      { role: 'user', content: '👩🏽‍💻'.repeat(280) },
      { role: 'assistant', content: 'a'.repeat(500) },
      { role: 'user', content: '  Segunda\nlínea  ' },
    ] };
    const result = validateHistory(history);
    expect(result).toEqual(history.messages);
    result[0].content = 'modificado';
    expect(history.messages[0].content).toBe('👩🏽‍💻'.repeat(280));
  });

  it.each([undefined, '1', String(MAX_REQUEST_BYTES + 1)])('controla el tamaño por bytes sin depender de Content-Length: %s', async (declared) => {
    const respond = vi.fn();
    const res = response();
    const oversized = { messages: [{ role: 'assistant', content: '🙂'.repeat(MAX_REQUEST_BYTES / 4) }] };
    const headers = { 'content-type': 'application/json' };
    if (declared !== undefined) headers['content-length'] = declared;
    await createHandler({ respond })(request({ body: oversized, headers }), res);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(respond).not.toHaveBeenCalled();
  });

  it('acepta exactamente 64 KiB sin truncar el historial', async () => {
    const history = { messages: [...body.messages, { role: 'assistant', content: '' }, { role: 'user', content: 'Fin' }] };
    history.messages[1].content = 'a'.repeat(MAX_REQUEST_BYTES - Buffer.byteLength(JSON.stringify(history)));
    expect(Buffer.byteLength(JSON.stringify(history))).toBe(MAX_REQUEST_BYTES);
    const respond = vi.fn().mockResolvedValue('Sigamos');
    const res = response();
    await createHandler({ respond })(request({ body: history }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(respond.mock.calls[0][0]).toEqual(history.messages);
  });

  it('oculta detalles internos cuando el proveedor falla', async () => {
    const res = response();
    await createHandler({ respond: async () => { throw new Error('detalle interno sensible'); } })(request(), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('sensible');
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'SERVICE_UNAVAILABLE', message: expect.any(String) }, quota: {} });
  });

  it.each(['', ' \n ', null])('rechaza una respuesta del proveedor inválida: %j', async (reply) => {
    const res = response();
    await createHandler({ respond: async () => reply })(request(), res);
    expect(res.status).toHaveBeenCalledWith(502);
  });
});

describe('intercepción de enlaces', () => {
  it('acepta rutas internas y conserva parámetros y fragmentos entre vistas', () => {
    expect(getSpaDestination(click, `${origin}/home`)).toBe('/chat');
    expect(getSpaDestination({ ...click, href: '/chat?tema=eleccion#main-content' }, `${origin}/home`)).toBe('/chat?tema=eleccion#main-content');
    expect(getSpaDestination({ ...click, href: 'about' }, `${origin}/home`)).toBe('/about');
  });

  it('respeta clicks modificados, secundarios y eventos ya manejados', () => {
    for (const change of [{ modified: true }, { button: 1 }, { button: 2 }, { defaultPrevented: true }]) {
      expect(getSpaDestination({ ...click, ...change }, `${origin}/home`)).toBeNull();
    }
  });

  it('respeta nuevas pestañas, descargas, destinos externos y protocolos especiales', () => {
    for (const change of [{ target: '_blank' }, { target: 'otra-ventana' }, { download: true }, { href: 'https://github.com/MiguelMirandaV/chat-morfeo-m3' }, { href: 'mailto:ejemplo@example.com' }, { href: 'tel:123' }, { href: null }]) {
      expect(getSpaDestination({ ...click, ...change }, `${origin}/home`)).toBeNull();
    }
  });

  it('deja las anclas, la API y los archivos a cargo del navegador/servidor', () => {
    for (const href of ['#main-content', '/home#main-content', '/api', '/api/functions', '/_vercel/insights', '/styles.css', '/.env.local']) {
      expect(getSpaDestination({ ...click, href }, `${origin}/home`)).toBeNull();
    }
    expect(getSpaDestination({ ...click, href: '/apiary' }, `${origin}/home`)).toBe('/apiary');
  });
});

describe('navigateTo', () => {
  function navigationFrom(path) {
    const calls = [];
    const browser = {
      location: new URL(path, origin),
      history: { pushState: vi.fn(() => calls.push('pushState')) },
    };
    const render = vi.fn(() => calls.push('render'));
    return { browser, render, calls };
  }

  it('actualiza el historial antes de renderizar, una sola vez', () => {
    const { browser, render, calls } = navigationFrom('/home');
    navigateTo('/chat', browser, render);
    expect(browser.history.pushState).toHaveBeenCalledExactlyOnceWith(null, '', '/chat');
    expect(render).toHaveBeenCalledExactlyOnceWith({ moveFocus: true });
    expect(calls).toEqual(['pushState', 'render']);
  });

  it('no duplica la entrada ni desmonta la vista al repetir el destino actual', () => {
    const { browser, render } = navigationFrom('/chat');
    navigateTo('/chat/', browser, render);
    expect(browser.history.pushState).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });

  it('conserva parámetros y fragmento al normalizar una ruta', () => {
    const { browser, render } = navigationFrom('/home');
    navigateTo('/chat/?tema=eleccion#main-content', browser, render);
    expect(browser.history.pushState).toHaveBeenCalledWith(null, '', '/chat?tema=eleccion#main-content');
  });

  it('rechaza destinos externos antes de modificar el historial', () => {
    const { browser, render } = navigationFrom('/home');
    expect(() => navigateTo('https://github.com/', browser, render)).toThrow('mismo origen');
    expect(browser.history.pushState).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
  });
});
