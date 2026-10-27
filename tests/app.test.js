import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSpaDestination, navigateTo, normalizePathname, resolveRoute } from '../src/app.js';
import { createChatSession, simulateReply } from '../src/chat.js';

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
    expect(chat.getState()).toEqual({ messages: [], draft: '', pending: false, error: '' });
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
    expect(chat.getState().error).toContain('vuelve a enviarlo');
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

  it('simula una espera asíncrona sin consumir una API', async () => {
    vi.useFakeTimers();
    const chat = createChatSession({ respond: simulateReply });
    chat.setDraft('Quiero aprender a programar');
    const turn = chat.send();
    await vi.advanceTimersByTimeAsync(1099);
    expect(chat.getState().pending).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(await turn).toBe(true);
    expect(chat.getState().messages.at(-1).content).toContain('Aprender');
    expect(chat.getState().pending).toBe(false);
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
