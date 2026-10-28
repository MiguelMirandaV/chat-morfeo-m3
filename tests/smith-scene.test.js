import { describe, expect, it, vi } from 'vitest';
import { mountSmithScene } from '../src/smith-scene.js';

function setup({ reduced = false, hidden = false, contextAvailable = true, throws = false, width = 220, height = 160 } = {}) {
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const document = Object.assign(new EventTarget(), { hidden });
  const callbacks = new Map();
  let sequence = 0, onResize;
  const raf = vi.fn(callback => { callbacks.set(++sequence, callback); return sequence; });
  const cancel = vi.fn(id => callbacks.delete(id)), disconnect = vi.fn();
  vi.stubGlobal('window', { matchMedia: () => media, devicePixelRatio: 3 });
  vi.stubGlobal('document', document);
  vi.stubGlobal('requestAnimationFrame', raf); vi.stubGlobal('cancelAnimationFrame', cancel);
  vi.spyOn(performance, 'now').mockReturnValue(1000);
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { onResize = callback; }
    observe() {} disconnect() { disconnect(); }
  });
  const context = { setTransform: vi.fn(), fillRect: vi.fn(), fillText: vi.fn() };
  const canvas = {
    getContext: () => { if (throws) throw new Error('Canvas unavailable'); return contextAvailable ? context : null; },
    clientWidth: width, clientHeight: height, width: 0, height: 0, hidden: false,
  };
  const button = Object.assign(new EventTarget(), { setAttribute: vi.fn(), textContent: '', hidden: false });
  const scene = mountSmithScene(canvas, button);
  function advance(now) {
    const pending = [...callbacks]; callbacks.clear();
    for (const [, callback] of pending) callback(now);
  }
  return { media, document, raf, cancel, disconnect, context, canvas, button, scene, callbacks, advance, resize: () => onResize?.() };
}

describe('animación Smith y ciclo de vida', () => {
  it('no dibuja antes de entrar y limita la densidad de píxeles', () => {
    const f = setup();
    expect(f.raf).not.toHaveBeenCalled(); expect(f.context.fillText).not.toHaveBeenCalled();
    f.resize(); expect(f.context.fillText).not.toHaveBeenCalled();
    f.scene.setActive(true);
    expect(f.canvas.width).toBe(330); expect(f.canvas.height).toBe(240);
    expect(f.callbacks.size).toBe(1);
    f.scene.setActive(false); expect(f.callbacks.size).toBe(0);
    f.context.fillText.mockClear(); f.resize(); expect(f.context.fillText).not.toHaveBeenCalled();
    f.scene.dispose();
  });

  it('acota superficie y glifos por frame incluso en una pantalla enorme', () => {
    const f = setup({ width: 3840, height: 2160 });
    f.scene.setActive(true);
    const count4k = f.context.fillText.mock.calls.length;
    expect(count4k).toBeGreaterThan(3000); expect(count4k).toBeLessThan(5000);
    expect(f.canvas.width).toBeLessThanOrEqual(1650); expect(f.canvas.height).toBeLessThanOrEqual(1350);
    for (const [, x, y] of f.context.fillText.mock.calls) {
      expect(Number.isFinite(x)).toBe(true); expect(Number.isFinite(y)).toBe(true);
    }
    f.context.fillText.mockClear();
    f.canvas.clientWidth *= 10; f.canvas.clientHeight *= 10; f.resize();
    expect(f.context.fillText.mock.calls.length).toBe(count4k);
    expect(f.canvas.width).toBeLessThanOrEqual(1650); expect(f.canvas.height).toBeLessThanOrEqual(1350);
    f.scene.dispose();
  });

  it('pinta como máximo un frame cada 50 ms', () => {
    const f = setup(); f.scene.setActive(true); f.context.fillRect.mockClear();
    for (const now of [1016, 1032, 1049]) f.advance(now);
    expect(f.context.fillRect).not.toHaveBeenCalled();
    f.advance(1050); expect(f.context.fillRect).toHaveBeenCalledTimes(1);
    f.advance(1099); expect(f.context.fillRect).toHaveBeenCalledTimes(1);
    f.advance(1100); expect(f.context.fillRect).toHaveBeenCalledTimes(2);
    expect(f.callbacks.size).toBe(1); f.scene.dispose();
  });

  it('movimiento reducido mantiene una imagen estática y atiende cambios de preferencia', () => {
    const f = setup({ reduced: true }); f.scene.setActive(true);
    expect(f.context.fillText).toHaveBeenCalled(); expect(f.raf).not.toHaveBeenCalled();
    expect(f.button.disabled).toBe(true); expect(f.button.textContent).toBe('Movimiento reducido');
    f.media.matches = false; f.media.dispatchEvent(new Event('change'));
    expect(f.button.disabled).toBe(false);
    expect(f.callbacks.size).toBe(1);
    f.media.matches = true; f.media.dispatchEvent(new Event('change'));
    expect(f.callbacks.size).toBe(0);
    f.scene.dispose();
  });

  it('pausa y reanuda, sin animar mientras conserva la pausa', () => {
    const f = setup(); f.scene.setActive(true);
    f.button.dispatchEvent(new Event('click'));
    expect(f.button.textContent).toBe('Reanudar lluvia');
    expect(f.button.setAttribute).toHaveBeenLastCalledWith('aria-pressed', 'true');
    expect(f.callbacks.size).toBe(0);
    f.resize(); expect(f.callbacks.size).toBe(0);
    f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
    f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange'));
    expect(f.callbacks.size).toBe(0);
    f.button.dispatchEvent(new Event('click'));
    expect(f.button.textContent).toBe('Pausar lluvia'); expect(f.callbacks.size).toBe(1);
    f.scene.dispose();
  });

  it('no dibuja oculto, tampoco al activarse, redimensionarse o recibir callbacks pendientes', () => {
    const f = setup({ hidden: true }); f.scene.setActive(true); f.resize();
    f.media.dispatchEvent(new Event('change'));
    expect(f.context.fillRect).not.toHaveBeenCalled(); expect(f.raf).not.toHaveBeenCalled();
    f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange'));
    expect(f.context.fillRect).toHaveBeenCalledTimes(1); expect(f.callbacks.size).toBe(1);
    const pending = [...f.callbacks.values()][0];
    f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
    f.context.fillRect.mockClear(); f.context.fillText.mockClear();
    f.resize(); pending(2000);
    expect(f.context.fillText).not.toHaveBeenCalled(); expect(f.context.fillRect).not.toHaveBeenCalled();
    expect(f.callbacks.size).toBe(0);
    f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange'));
    expect(f.callbacks.size).toBe(1); f.scene.dispose();
  });

  it('desmonta una sola vez y ningún callback tardío puede reactivarla', () => {
    const f = setup(); f.scene.setActive(true);
    const pending = [...f.callbacks.values()][0];
    f.scene.dispose(); f.scene.dispose();
    expect(f.callbacks.size).toBe(0); expect(f.disconnect).toHaveBeenCalledTimes(1);
    f.context.fillText.mockClear(); f.raf.mockClear();
    f.scene.setActive(true); pending(2000); f.resize();
    f.button.dispatchEvent(new Event('click'));
    f.document.dispatchEvent(new Event('visibilitychange')); f.media.dispatchEvent(new Event('change'));
    expect(f.context.fillText).not.toHaveBeenCalled(); expect(f.raf).not.toHaveBeenCalled();
  });

  it.each([{ contextAvailable: false }, { throws: true }])('conserva el cuestionario cuando Canvas falla (%j)', options => {
    const f = setup(options);
    expect(f.canvas.hidden).toBe(true); expect(f.button.hidden).toBe(true);
    expect(() => { f.scene.setActive(true); f.scene.dispose(); f.scene.dispose(); }).not.toThrow();
    expect(f.raf).not.toHaveBeenCalled(); expect(f.context.fillText).not.toHaveBeenCalled();
  });
});
