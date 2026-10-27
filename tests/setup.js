import { afterEach, beforeEach, expect, vi } from 'vitest';

let blockedFetch;
beforeEach(() => {
  // Un mock olvidado debe fallar; nunca llegar a Gemini o Redis reales.
  blockedFetch = vi.fn(async () => { throw new Error('Sustituye fetch en esta prueba: la suite no utiliza la red.'); });
  vi.stubGlobal('fetch', blockedFetch);
  for (const name of ['GEMINI_API_KEY', 'AUTH_SESSION_SECRET', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'QUOTA_DRIVER']) {
    vi.stubEnv(name, '');
  }
});
afterEach(() => {
  try { expect(blockedFetch, 'Una prueba intentó usar fetch sin un mock explícito.').not.toHaveBeenCalled(); }
  finally { vi.useRealTimers(); }
});
