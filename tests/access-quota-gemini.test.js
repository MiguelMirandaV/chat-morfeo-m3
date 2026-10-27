import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApiError, createHandler, createAccessToken, verifyAccessToken, hasAccess, updateQuota,
  pacificDay, nextPacificMidnight, createFileQuotaStore, createRedisQuotaStore, getQuotaStore,
  generateGeminiReply, parseGeminiReply, DEFAULT_GEMINI_MODEL } from '../api/functions.js';
import { getAccessState, postApi, requestReply } from '../src/chat.js';

const now = Date.parse('2026-10-26T19:00:00Z');
const environment = { AUTH_SESSION_SECRET: 'a'.repeat(64), GEMINI_API_KEY: 'test-only', GEMINI_MODEL: DEFAULT_GEMINI_MODEL };
const messages = [{ role: 'user', content: 'Me llamo Ariadna.' }, { role: 'assistant', content: 'Bienvenida.' }, { role: 'user', content: '¿Cómo me llamo?' }];
const body = { character: 'morpheus', messages: [messages[0]] };
function req(bodyValue = body, headers = {}) { return { method: 'POST', headers: { host: 'localhost:3000', 'content-type': 'application/json', ...headers }, body: bodyValue }; }
function res() { return { setHeader: vi.fn(), status: vi.fn(function () { return this; }), json: vi.fn(function (body) { this.body = body; return this; }) }; }
const quotaStore = async (reserve, time) => updateQuota({}, time, reserve);
const authenticated = () => `morfeo_access=${createAccessToken(environment.AUTH_SESSION_SECRET, now)}`;

describe('acceso firmado por cohorte', () => {
  it('no permite consumir Gemini sin cookie válida, aunque se invoque directamente la API', async () => {
    const respond = vi.fn(); const quota = vi.fn(); const response = res();
    await createHandler({ respond, quotaStore: quota, environment, clock: () => now })(req(), response);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(respond).not.toHaveBeenCalled(); expect(quota).not.toHaveBeenCalled();
  });
  it.each(['78', '079', '79.0', '80', '', null, {}, true])('rechaza la cohorte %j sin crear sesión', async (cohort) => {
    const response = res();
    await createHandler({ quotaStore, environment, clock: () => now })(req({ action: 'unlock', cohort }), response);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.setHeader.mock.calls.some(([name]) => name === 'Set-Cookie')).toBe(false);
  });
  it.each(['79', 79])('desbloquea solo 79 y emite una cookie HttpOnly, Strict y Secure en producción: %j', async (cohort) => {
    const response = res();
    await createHandler({ quotaStore, environment: { ...environment, VERCEL_ENV: 'production' }, clock: () => now })(req({ action: 'unlock', cohort }), response);
    expect(response.status).toHaveBeenCalledWith(200);
    const cookie = response.setHeader.mock.calls.find(([name]) => name === 'Set-Cookie')[1];
    expect(cookie).toContain('HttpOnly; SameSite=Strict; Path=/; Secure');
    expect(hasAccess(req(body, { cookie }), environment, now)).toBe(true);
    expect(response.body).toMatchObject({ authenticated: true, quota: { dayUsed: 0 } });
  });
  it('rechaza firmas alteradas, otro secreto, expiración y secretos débiles', () => {
    const token = createAccessToken(environment.AUTH_SESSION_SECRET, now);
    expect(verifyAccessToken(token, environment.AUTH_SESSION_SECRET, now)).toBe(true);
    expect(verifyAccessToken(token.replace('v1.', 'v2.'), environment.AUTH_SESSION_SECRET, now)).toBe(false);
    expect(verifyAccessToken(token, 'b'.repeat(64), now)).toBe(false);
    expect(verifyAccessToken(token, environment.AUTH_SESSION_SECRET, now + 8 * 3600_000)).toBe(false);
    expect(verifyAccessToken('v1.9999999999999.x.bad', environment.AUTH_SESSION_SECRET, now)).toBe(false);
    expect(() => createAccessToken('short', now)).toThrow(ApiError);
  });
  it('consulta el estado sin reservar cuota y bloquea un Origin ajeno', async () => {
    const store = vi.fn(quotaStore); const handler = createHandler({ quotaStore: store, environment, clock: () => now });
    const response = res(); await handler(req({ action: 'session' }, { cookie: authenticated(), origin: 'http://localhost:3000' }), response);
    expect(response.body.authenticated).toBe(true); expect(store).toHaveBeenCalledWith(false, now);
    const foreign = res(); await handler(req({ action: 'unlock', cohort: '79' }, { origin: 'https://other.example' }), foreign);
    expect(foreign.status).toHaveBeenCalledWith(403);
  });
});

describe('contadores compartidos y recuperación', () => {
  it('acepta 15 solicitudes en ventana móvil y rechaza la 16 antes de Gemini', async () => {
    let ledger = {}; const respond = vi.fn().mockResolvedValue('Respuesta');
    const store = async (reserve, time) => { const result = updateQuota(ledger, time, reserve); ledger = result.ledger; return result; };
    const handler = createHandler({ respond, quotaStore: store, environment, clock: () => now });
    for (let i = 0; i < 15; i++) { const response = res(); await handler(req(body, { cookie: authenticated() }), response); expect(response.status).toHaveBeenCalledWith(200); }
    const blocked = res(); await handler(req(body, { cookie: authenticated() }), blocked);
    expect(blocked.status).toHaveBeenCalledWith(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.setHeader).toHaveBeenCalledWith('Retry-After', '60'); expect(respond).toHaveBeenCalledTimes(15);
    expect(updateQuota(ledger, now + 60_000, true)).toMatchObject({ allowed: true, quota: { minuteUsed: 1, dayUsed: 16 } });
  });
  it('permite la 500 y bloquea la 501 hasta el siguiente día del Pacífico', () => {
    const last = updateQuota({ day: pacificDay(now), dayUsed: 499, recent: [] }, now, true);
    expect(last).toMatchObject({ allowed: true, quota: { dayUsed: 500, blocked: true } });
    const blocked = updateQuota(last.ledger, now + 61_000, true);
    expect(blocked.allowed).toBe(false); expect(blocked.quota.retryAt).toBe(nextPacificMidnight(now));
    expect(updateQuota(blocked.ledger, nextPacificMidnight(now), true)).toMatchObject({ allowed: true, quota: { dayUsed: 1 } });
  });
  it.each([
    ['2026-03-08T08:00:00Z', '2026-03-09T07:00:00Z'],
    ['2026-11-01T07:00:00Z', '2026-11-02T08:00:00Z'],
    ['2026-10-27T01:00:00Z', '2026-10-27T07:00:00Z'],
  ])('calcula medianoche incluso con cambio de horario: %s', (input, expected) => {
    expect(new Date(nextPacificMidnight(Date.parse(input))).toISOString()).toBe(new Date(expected).toISOString());
  });
  it('comparte el archivo entre instancias concurrentes y no guarda conversaciones', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'morfeo-quota-test-'));
    try {
      const file = join(dir, 'quota.json'), a = createFileQuotaStore(file), b = createFileQuotaStore(file);
      const results = await Promise.all(Array.from({ length: 20 }, (_, i) => (i % 2 ? a : b)(true, now)));
      expect(results.filter(({ allowed }) => allowed)).toHaveLength(15);
      expect((await createFileQuotaStore(file)(false, now)).quota.dayUsed).toBe(15);
      const saved = JSON.parse(await readFile(file, 'utf8'));
      expect(Object.keys(saved).sort()).toEqual(['day', 'dayUsed', 'recent']);
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it('utiliza un script Redis atómico, sin enviar mensajes ni credenciales del proveedor', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: [1, 15, 100, now + 60_000] })));
    const store = createRedisQuotaStore({ url: 'https://test.upstash.io', token: 'redis-test', fetchImpl });
    expect(await store(true, now)).toMatchObject({ allowed: true, quota: { minuteUsed: 15, dayUsed: 100, blocked: true } });
    const [url, options] = fetchImpl.mock.calls[0], command = JSON.parse(options.body);
    expect(url).toBe('https://test.upstash.io'); expect(options.headers.Authorization).toBe('Bearer redis-test');
    expect(command[0]).toBe('EVAL'); expect(command[2]).toBe(2); expect(command.at(-1)).toBe('1');
    expect(options.body).not.toContain('Me llamo'); expect(options.body).not.toContain(environment.GEMINI_API_KEY);
  });
  it.each([{ result: 'invalid' }, { error: 'sensitive redis failure' }])('falla cerrado cuando Redis no devuelve contadores: %j', async (data) => {
    const store = createRedisQuotaStore({ url: 'https://test.upstash.io', token: 'test', fetchImpl: async () => new Response(JSON.stringify(data)) });
    await expect(store(true, now)).rejects.toMatchObject({ code: 'QUOTA_UNAVAILABLE' });
  });
  it('no permite un archivo local en producción ni una URL Redis ajena', () => {
    expect(() => getQuotaStore({ QUOTA_DRIVER: 'local', VERCEL_ENV: 'production' })).toThrow(ApiError);
    expect(() => createRedisQuotaStore({ url: 'https://other.example', token: 'test' })).toThrow(ApiError);
  });
  it('devuelve el bloqueo diario antes de consumir el proveedor', async () => {
    const respond = vi.fn(), response = res();
    const store = async () => updateQuota({ day: pacificDay(now), dayUsed: 500, recent: [] }, now, true);
    await createHandler({ respond, quotaStore: store, environment, clock: () => now })(req(body, { cookie: authenticated() }), response);
    expect(response.body.error.code).toBe('DAILY_LIMIT'); expect(response.status).toHaveBeenCalledWith(429);
    expect(response.body.quota.retryAt).toBe(nextPacificMidnight(now)); expect(respond).not.toHaveBeenCalled();
  });
  it('no llama a Gemini si no puede comprobar la cuota', async () => {
    const respond = vi.fn(), response = res();
    await createHandler({ respond, environment, clock: () => now, quotaStore: async () => { throw new Error('private Redis detail'); } })(req(body, { cookie: authenticated() }), response);
    expect(response.status).toHaveBeenCalledWith(503); expect(respond).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain('private');
  });
  it('mantiene la reserva y traduce el 429 de Google en espera para Smith', async () => {
    const response = res();
    await createHandler({ quotaStore, environment, clock: () => now, respond: async () => { throw new ApiError(429, 'PROVIDER_RATE_LIMITED', 'Espera.'); } })(req(body, { cookie: authenticated() }), response);
    expect(response.status).toHaveBeenCalledWith(429); expect(response.body.quota).toMatchObject({ minuteUsed: 1, dayUsed: 1, blocked: true, providerLimited: true, retryAt: now + 60_000 });
  });
  it('normaliza errores de red de Redis sin exponerlos', async () => {
    const store = createRedisQuotaStore({ url: 'https://test.upstash.io', token: 'test', fetchImpl: async () => { throw new Error('private token'); } });
    const error = await store(true, now).catch(error => error);
    expect(error.code).toBe('QUOTA_UNAVAILABLE'); expect(error.message).not.toContain('token');
  });
  it('publica el contador de una respuesta 429 y retira la intervención al recuperarse', async () => {
    const quota = { ...updateQuota({}, Date.now()).quota, minuteUsed: 15, blocked: true, retryAt: Date.now() + 60_000 };
    await expect(requestReply(messages, { fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'RATE_LIMITED' }, quota }), { status: 429 }) })).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(getAccessState().quota.minuteUsed).toBe(15); expect(getAccessState().interceptedUntil).toBe(quota.retryAt);
    await postApi({ action: 'session' }, { fetchImpl: async () => new Response(JSON.stringify({ quota: { ...quota, blocked: false, minuteUsed: 0 } })) });
    expect(getAccessState().interceptedUntil).toBe(0);
  });
});

describe('adaptador Gemini real con proveedor sustituido en tests', () => {
  afterEach(() => vi.useRealTimers());
  const success = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '  Ariadna. ' }] } }] };
  it('envía todos los turnos, system prompt, límite y un único intento', async () => {
    const generateContent = vi.fn().mockResolvedValue(success);
    const factory = vi.fn(() => ({ models: { generateContent } }));
    expect(await generateGeminiReply(messages, { environment, clientFactory: factory })).toBe('Ariadna.');
    expect(factory.mock.calls[0][0].httpOptions.retryOptions.attempts).toBe(1);
    const options = generateContent.mock.calls[0][0];
    expect(options.contents).toEqual([
      { role: 'user', parts: [{ text: 'Me llamo Ariadna.' }] },
      { role: 'model', parts: [{ text: 'Bienvenida.' }] },
      { role: 'user', parts: [{ text: '¿Cómo me llamo?' }] },
    ]);
    options.contents[0].parts[0].text = 'mutado';
    expect(messages[0].content).toBe('Me llamo Ariadna.');
    expect(options.config.systemInstruction).toContain('Morfeo'); expect(options.config.maxOutputTokens).toBe(1024);
    expect(options.config).not.toHaveProperty('temperature'); expect(generateContent).toHaveBeenCalledTimes(1);
  });
  it.each([
    undefined,
    {},
    { candidates: [] },
    { candidates: [{ finishReason: 'STOP', content: { parts: {} } }] },
  ])('normaliza datos ausentes o mal formados como INVALID_RESPONSE: %j', response => {
    expect(() => parseGeminiReply(response)).toThrow(expect.objectContaining({ code: 'INVALID_RESPONSE', status: 502 }));
  });
  it('combina solo texto público e ignora partes ajenas o nulas', () => {
    const response = { candidates: [{ finishReason: 'STOP', content: { parts: [
      null, { functionCall: { name: 'no-text' } }, { text: 'pensamiento privado', thought: true },
      { text: ' Hola, ' }, { text: 'Ariadna. ' },
    ] } }] };
    expect(parseGeminiReply(response)).toBe('Hola, Ariadna.');
  });
  it.each([
    [{ promptFeedback: { blockReason: 'SAFETY' } }, 'BLOCKED_RESPONSE'],
    [{ candidates: [{ finishReason: 'MAX_TOKENS' }] }, 'TRUNCATED_RESPONSE'],
    [{ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'private thought', thought: true }] } }] }, 'INVALID_RESPONSE'],
    [{ candidates: [{ finishReason: 'SAFETY' }] }, 'BLOCKED_RESPONSE'],
  ])('rechaza respuestas incompletas o vacías: %j', (response, code) => {
    try { parseGeminiReply(response); throw new Error('Expected rejection'); } catch (error) { expect(error.code).toBe(code); }
  });
  it.each([[429, 'PROVIDER_RATE_LIMITED'], [503, 'SERVICE_UNAVAILABLE']])('traduce el error %s sin filtrar información', async (status, code) => {
    const result = generateGeminiReply(messages, { environment, clientFactory: () => ({ models: { generateContent: async () => { throw Object.assign(new Error('private-key-content'), { status }); } } }) });
    const error = await result.catch((error) => error); expect(error.code).toBe(code); expect(error.message).not.toContain('private');
  });
  it('aborta después de 30 segundos sin reintentar automáticamente', async () => {
    vi.useFakeTimers();
    const generateContent = vi.fn(({ config }) => new Promise((_, reject) => config.abortSignal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))));
    const result = generateGeminiReply(messages, { environment, clientFactory: () => ({ models: { generateContent } }) });
    const check = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(16_000);
    expect(generateContent.mock.calls[0][0].config.abortSignal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(14_000); await check; expect(generateContent).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });
});


describe('acceso y recuperación en el cliente', () => {
  let client;
  const quota = { minuteUsed: 0, minuteLimit: 15, dayUsed: 0, dayLimit: 500,
    minuteResetAt: now + 60_000, dayResetAt: nextPacificMidnight(now), blocked: false, retryAt: now + 60_000, scope: 'app' };
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

  beforeEach(async () => {
    // El módulo guarda una sesión; cada caso empieza con su propio estado.
    vi.resetModules();
    client = await import('../src/chat.js');
  });

  it('comparte una consulta de sesión pendiente y retira la suscripción', async () => {
    let finish;
    const fetchMock = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const listener = vi.fn();
    const unsubscribe = client.subscribeAccess(listener);
    const first = client.refreshAccess(), second = client.refreshAccess();
    expect(second).toBe(first);
    expect(client.getAccessState()).toMatchObject({ busy: true, authenticated: null });
    unsubscribe(); const calls = listener.mock.calls.length;
    finish(json({ authenticated: true, quota })); await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'session' });
    expect(client.getAccessState()).toMatchObject({ busy: false, authenticated: true, error: '' });
    expect(listener).toHaveBeenCalledTimes(calls);
  });

  it('bloquea un segundo desbloqueo mientras el primero está pendiente', async () => {
    let finish;
    const fetchMock = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    vi.stubGlobal('fetch', fetchMock);
    const pending = client.unlockCohort('79');
    expect(await client.unlockCohort('79')).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const options = fetchMock.mock.calls[0][1];
    expect(JSON.parse(options.body)).toEqual({ action: 'unlock', cohort: '79' });
    expect(options.credentials).toBe('same-origin');
    finish(json({ authenticated: true, quota }));
    expect(await pending).toBe(true);
    expect(client.getAccessState()).toMatchObject({ authenticated: true, busy: false });
  });

  it('deniega una cohorte incorrecta y permite corregirla sin conservar el error', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ error: { code: 'INVALID_COHORT', message: 'detalle privado' } }, 403))
      .mockResolvedValueOnce(json({ authenticated: true, quota }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await client.unlockCohort('78')).toBe(false);
    expect(client.getAccessState().authenticated).not.toBe(true);
    expect(client.getAccessState()).toMatchObject({ busy: false, error: 'Esta cohorte no tiene acceso al canal.' });
    expect(await client.unlockCohort('79')).toBe(true);
    expect(client.getAccessState()).toMatchObject({ authenticated: true, busy: false, error: '' });
  });

  it('pierde el acceso ante 401 y conserva conversación y borrador para volver a entrar', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ authenticated: true, quota }))
      .mockResolvedValueOnce(json({ character: 'morpheus', reply: 'Bienvenida.', quota }))
      .mockResolvedValueOnce(json({ error: { code: 'AUTH_REQUIRED' } }, 401));
    vi.stubGlobal('fetch', fetchMock);
    await client.unlockCohort('79');
    const chat = client.createChatSession();
    chat.setDraft('Hola'); expect(await chat.send()).toBe(true);
    chat.setDraft('Mi siguiente pregunta'); expect(await chat.send()).toBe(false);
    expect(client.getAccessState().authenticated).toBe(false);
    expect(client.getAccessState().error).toContain('cohorte');
    expect(chat.getState()).toMatchObject({ pending: false, draft: 'Mi siguiente pregunta', errorCode: 'AUTH_REQUIRED',
      messages: [{ role: 'user', content: 'Hola' }, { role: 'assistant', content: 'Bienvenida.' }] });
  });

  it('muestra la solicitud 15 admitida sin activar Smith antes del primer rechazo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ character: 'morpheus', reply: 'Sigamos.', quota: { ...quota, minuteUsed: 15, dayUsed: 15, blocked: true } }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await client.requestReply([messages[0]])).toBe('Sigamos.');
    expect(client.getAccessState()).toMatchObject({ quota: { minuteUsed: 15 }, interceptedUntil: 0 });
  });

  it('mantiene el bloqueo diario tras un minuto sin reenviar mensajes automáticamente', async () => {
    vi.useFakeTimers(); vi.setSystemTime(now);
    const daily = { ...quota, dayUsed: 500, blocked: true, retryAt: nextPacificMidnight(now) };
    const fetchMock = vi.fn().mockResolvedValue(json({ error: { code: 'DAILY_LIMIT' }, quota: daily }, 429));
    vi.stubGlobal('fetch', fetchMock);
    const chat = client.createChatSession(); chat.setDraft('No perder esta pregunta');
    expect(await chat.send()).toBe(false);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(client.getAccessState().interceptedUntil).toBe(daily.retryAt);
    expect(client.getAccessState().interceptedUntil).toBeGreaterThan(Date.now());
    expect(chat.getState()).toMatchObject({ draft: 'No perder esta pregunta', pending: false, messages: [], errorCode: 'DAILY_LIMIT' });
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });

  it('libera el estado ocupado tras un fallo de sesión y permite consultar otra vez', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('detalle privado'))
      .mockResolvedValueOnce(json({ authenticated: true, quota }));
    vi.stubGlobal('fetch', fetchMock);
    await client.refreshAccess();
    expect(client.getAccessState()).toMatchObject({ authenticated: false, busy: false });
    expect(client.getAccessState().error).not.toContain('privado');
    await client.refreshAccess();
    expect(client.getAccessState()).toMatchObject({ authenticated: true, busy: false, error: '' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
