import { describe, expect, it, vi } from 'vitest';
import { getSpaDestination, navigateTo, normalizePathname, resolveRoute } from '../src/app.js';

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
