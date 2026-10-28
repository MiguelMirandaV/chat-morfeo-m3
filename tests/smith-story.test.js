import { describe, expect, it, vi } from 'vitest';
import { ChatRequestError, createCharacterSession } from '../src/chat.js';
import { emptyHistory, createHistoryStorage, HISTORY_KEY } from '../src/history-storage.js';
import { emptyStory, validateStory, createStoryStorage, STORY_KEY, LEGACY_STORY_KEY } from '../src/smith-story.js';
import { SMITH_QUESTIONS } from '../src/smith-questions.js';

async function normalTurn(session, text = 'Una pregunta') { session.setDraft(text); return session.send(); }
async function enterSmith(session, character = 'morpheus') {
  session.selectCharacter(character);
  for (let i = 0; i < 3; i++) await normalTurn(session, `Pregunta ${i + 1}`);
}
function answer(session, option = 'a') { return session.answerSmith(session.getState().smithQuestion?.token, option); }
function setup({ values = new Map([['unrelated', 'conservar']]), raw, failRead = false, withHistory = false } = {}) {
  if (raw !== undefined) values.set(STORY_KEY, raw);
  const storage = {
    getItem: vi.fn(key => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)), removeItem: vi.fn(key => values.delete(key)),
  };
  const eventTarget = new EventTarget(), respond = vi.fn().mockResolvedValue('Respuesta del personaje');
  const session = createCharacterSession({ respond });
  const getStorage = vi.fn(() => { if (failRead) throw Error('Blocked'); return storage; });
  const history = withHistory ? createHistoryStorage(session, { getStorage, eventTarget }) : null;
  const persistence = createStoryStorage(session, { getStorage, eventTarget });
  return { values, storage, eventTarget, respond, session, getStorage, persistence, history };
}

// Casos de negocio: los tres historiales permanecen ajenos al cuestionario local.
describe('Smith una vez por personaje', () => {
  it('entra al tercer intercambio, exige un acierto y conserva el contexto para la siguiente petición', async () => {
    const respond = vi.fn().mockResolvedValue('Respuesta'), s = createCharacterSession({ respond, initialCharacter: 'oracle' });
    await normalTurn(s, 'Soy Ada'); await normalTurn(s, 'Aprendo JS');
    expect(s.getState()).toMatchObject({ smithActive: false, story: { characters: { oracle: { turns: 2, passed: false } } } });
    await normalTurn(s, '¿Qué sabes de mí?');
    expect(s.getState()).toMatchObject({ character: 'oracle', smithActive: true, smithQuestion: { number: 1 }, story: { active: { character: 'oracle', attempt: 0 } } });
    expect(s.getState().messages).toHaveLength(6);
    expect(s).not.toHaveProperty('finishSmith');
    expect(await normalTurn(s, 'Texto libre no desbloquea')).toBe(false);
    expect(answer(s, 'b')).toBe(true); expect(s.getState().smithQuestion.number).toBe(2);
    expect(answer(s, 'b')).toBe(true);
    expect(s.getState()).toMatchObject({ character: 'oracle', smithActive: false, smithQuestion: null, story: { active: null, characters: { oracle: { turns: 3, passed: true } } } });
    expect(respond).toHaveBeenCalledTimes(3);
    await normalTurn(s, 'Continúo');
    const sent = respond.mock.calls[3][0];
    expect(sent.map(message => message.content)).toEqual(['Soy Ada', 'Respuesta', 'Aprendo JS', 'Respuesta', '¿Qué sabes de mí?', 'Respuesta', 'Continúo']);
    expect(respond.mock.calls[3][1]).toEqual({ character: 'oracle' });
  });
  it('mantiene contadores independientes y las transferencias no suman', async () => {
    const s = createCharacterSession({ respond: async () => 'Sí', initialCharacter: 'morpheus' });
    await normalTurn(s); await normalTurn(s);
    s.setDraft('/hablar trinity'); await s.send(); s.cancelTransfer(); await s.send(); s.confirmTransfer();
    await normalTurn(s); await normalTurn(s);
    expect(s.getState()).toMatchObject({ smithActive: false, story: { characters: { morpheus: { turns: 2 }, trinity: { turns: 2 }, oracle: { turns: 0 } } } });
    s.setDraft('/hablar morfeo'); await s.send(); s.confirmTransfer(); await normalTurn(s);
    expect(s.getState()).toMatchObject({ smithActive: true, character: 'morpheus' });
    answer(s); s.selectCharacter('trinity'); await normalTurn(s);
    expect(s.getState()).toMatchObject({ smithActive: true, character: 'trinity' });
  });
  it.each(['morpheus', 'oracle', 'trinity'])('no vuelve a intervenir con %s después de superarlo', async character => {
    const s = createCharacterSession({ respond: async () => 'Sí' }); await enterSmith(s, character); answer(s);
    for (let i = 0; i < 7; i++) expect(await normalTurn(s)).toBe(true);
    expect(s.getState()).toMatchObject({ smithActive: false, story: { characters: { [character]: { turns: 3, passed: true } } } });
    s.selectCharacter(character === 'oracle' ? 'trinity' : 'oracle'); s.selectCharacter(character); await normalTurn(s);
    expect(s.getState().smithActive).toBe(false);
  });
  it.each(['TIMEOUT', 'RATE_LIMITED', 'DAILY_LIMIT', 'SERVICE_UNAVAILABLE'])('un fallo %s no cuenta y el reintento exitoso sí', async code => {
    const respond = vi.fn().mockResolvedValueOnce('Sí').mockRejectedValueOnce(new ChatRequestError(code)).mockResolvedValueOnce('Ahora sí');
    const s = createCharacterSession({ respond, initialCharacter: 'oracle' }); await normalTurn(s);
    expect(await normalTurn(s)).toBe(false); expect(s.getState().story.characters.oracle.turns).toBe(1);
    await s.send(); expect(s.getState().story.characters.oracle.turns).toBe(2);
  });
  it('un fallo de cuota tras superar el reto no vuelve a convocar a Smith', async () => {
    const respond = vi.fn().mockResolvedValue('Sí'), s = createCharacterSession({ respond }); await enterSmith(s); answer(s);
    respond.mockRejectedValueOnce(new ChatRequestError('RATE_LIMITED'));
    expect(await normalTurn(s, 'Borrador protegido')).toBe(false);
    expect(s.getState()).toMatchObject({ smithActive: false, draft: 'Borrador protegido', story: { characters: { morpheus: { passed: true } } } });
  });
  it('vacíos y controles no cuentan; Smith bloquea texto libre, selección y transferencias', async () => {
    const s = createCharacterSession({ respond: async () => 'Sí', initialCharacter: 'morpheus' });
    for (const text of ['', '  ', '/hablar smith', '/hablar morfeo', 'a'.repeat(281)]) expect(await normalTurn(s, text)).toBe(false);
    expect(s.getState().story.characters.morpheus.turns).toBe(0); await enterSmith(s);
    expect(await normalTurn(s, '/hablar trinity')).toBe(false); expect(s.selectCharacter('trinity')).toBe(false); expect(s.confirmTransfer()).toBe(false);
    expect(s.getState().draft).toBe('');
  });
  it('cuenta antes de liberar pending y rechaza doble envío y respuesta prematura al reto', async () => {
    let finish;
    const s = createCharacterSession({ respond: () => new Promise(resolve => { finish = resolve; }), initialCharacter: 'trinity' });
    const snapshots = []; s.subscribe(state => snapshots.push(state)); const sending = normalTurn(s);
    expect(await s.send()).toBe(false); expect(answer(s)).toBe(false);
    expect(s.restoreStory(emptyStory())).toBe(false); finish('Respuesta'); await sending;
    expect(snapshots.at(-1)).toMatchObject({ pending: false, story: { characters: { trinity: { turns: 1 } } } });
  });
});

describe('cuestionario educativo local', () => {
  it('ofrece diez preguntas distintas, dos opciones y reparto equilibrado de respuestas', () => {
    expect(SMITH_QUESTIONS).toHaveLength(10); expect(new Set(SMITH_QUESTIONS.map(q => q.id)).size).toBe(10);
    expect(SMITH_QUESTIONS.filter(q => q.correctOption === 'a')).toHaveLength(5);
    for (const q of SMITH_QUESTIONS) { expect(q.options).toHaveLength(2); expect(q.options[0]).not.toBe(q.options[1]); expect(q.explanation.length).toBeGreaterThan(0); }
  });
  it('recorre las diez preguntas al fallar, vuelve a la primera y acepta un acierto', async () => {
    const f = setup(); await enterSmith(f.session);
    const initialToken = f.session.getState().smithQuestion.token;
    const wrong = ['b', 'a', 'b', 'a', 'a', 'b', 'a', 'b', 'a', 'b'];
    for (let index = 0; index < 10; index++) {
      const state = f.session.getState(); expect(state.smithQuestion.number).toBe(index + 1);
      expect(state.smithQuestion.options).toHaveLength(2); expect(state.smithQuestion).not.toHaveProperty('correctOption');
      expect(answer(f.session, wrong[index])).toBe(true);
      expect(f.session.getState().controlMessage).toContain('Incorrecto.');
    }
    expect(f.session.getState().smithQuestion).toMatchObject({ number: 1, id: 'm3-mobile-first' });
    expect(f.session.answerSmith(initialToken, 'a')).toBe(false);
    expect(answer(f.session)).toBe(true); expect(f.session.getState().smithActive).toBe(false);
    expect(f.respond).toHaveBeenCalledTimes(3);
  });
  it('rechaza opciones inválidas y la reutilización del token anterior', async () => {
    const s = createCharacterSession({ respond: async () => 'Sí' }); await enterSmith(s);
    const first = s.getState().smithQuestion.token;
    for (const option of ['', 'A', 'c', '__proto__', null, {}, true]) expect(s.answerSmith(first, option)).toBe(false);
    expect(s.answerSmith('oracle:0', 'a')).toBe(false); expect(s.answerSmith(first, 'b')).toBe(true);
    expect(s.answerSmith(first, 'b')).toBe(false); expect(s.getState().smithQuestion.number).toBe(2);
  });
  it('no desaparece por esperar y solo el acierto recupera el canal', async () => {
    vi.useFakeTimers(); const s = createCharacterSession({ respond: async () => 'Sí' }); await enterSmith(s);
    vi.advanceTimersByTime(120_000); expect(s.getState().smithActive).toBe(true);
    answer(s, 'b'); vi.advanceTimersByTime(120_000); expect(s.getState().smithActive).toBe(true);
    answer(s, 'b'); expect(s.getState().smithActive).toBe(false);
  });
  it('los snapshots no permiten mutar el progreso, las opciones ni los historiales', async () => {
    const s = createCharacterSession({ respond: async () => 'Sí' }); await enterSmith(s);
    const state = s.getState(); state.story.characters.morpheus.passed = true; state.story.active.attempt = 9;
    state.smithQuestion.options[0].text = 'Ajeno'; state.messages[0].content = 'Ajeno'; state.conversations.morpheus.messages.length = 0;
    expect(s.getState()).toMatchObject({ smithQuestion: { number: 1 }, story: { characters: { morpheus: { passed: false } } } });
    expect(s.getState().messages).toHaveLength(6); expect(s.getState().messages[0].content).toBe('Pregunta 1');
    expect(s.getState().smithQuestion.options[0].text).not.toBe('Ajeno');
  });
});

describe('validación y persistencia por personaje', () => {
  it.each([
    null, [], {}, { ...emptyStory(), version: 1 }, { ...emptyStory(), extra: true },
    { ...emptyStory(), active: { character: 'smith', attempt: 0 } },
    { ...emptyStory(), active: { character: 'morpheus', attempt: 0 } },
  ])('rechaza un estado incoherente: %j', value => expect(() => validateStory(value)).toThrow());
  it.each([-1, 1.5, 4, '3', null])('rechaza un contador inválido: %j', turns => {
    const state = emptyStory(); state.characters.oracle.turns = turns; expect(() => validateStory(state)).toThrow();
  });
  it('rechaza retos superados antes de tres turnos, pendientes sin destino o varios pendientes', () => {
    const state = emptyStory(); state.characters.oracle.passed = true; expect(() => validateStory(state)).toThrow();
    state.characters.oracle.passed = false; state.characters.oracle.turns = 3; expect(() => validateStory(state)).toThrow();
    state.active = { character: 'oracle', attempt: 0 }; expect(validateStory(state)).toEqual(state);
    state.characters.trinity.turns = 3; expect(() => validateStory(state)).toThrow();
  });
  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, '0', null])('rechaza un intento inválido: %j', attempt => {
    const state = emptyStory(); state.characters.oracle.turns = 3; state.active = { character: 'oracle', attempt };
    expect(() => validateStory(state)).toThrow();
  });
  it('restaura la pregunta pendiente, las conversaciones y el borrador sin pedir IA', async () => {
    const f = setup({ withHistory: true });
    f.session.selectCharacter('trinity'); f.session.setDraft('Borrador de Trinity'); await enterSmith(f.session, 'oracle');
    answer(f.session, 'b'); answer(f.session, 'a');
    const reloaded = setup({ values: new Map(f.values), withHistory: true });
    expect(reloaded.session.getState()).toMatchObject({ character: 'oracle', smithActive: true, smithQuestion: { number: 3 }, story: { active: { character: 'oracle', attempt: 2 } } });
    expect(reloaded.session.getState().messages).toHaveLength(6);
    expect(reloaded.session.getState().conversations.trinity.draft).toBe('Borrador de Trinity');
    expect(reloaded.respond).not.toHaveBeenCalled(); expect(answer(reloaded.session, 'a')).toBe(true);
    const again = setup({ values: new Map(reloaded.values), withHistory: true });
    expect(again.session.getState()).toMatchObject({ character: 'oracle', smithActive: false, story: { characters: { oracle: { passed: true } } } });
    await normalTurn(again.session); expect(again.session.getState().smithActive).toBe(false);
  });
  it('migra conservando mensajes, borradores y clave antigua; inicia contadores nuevos en cero', () => {
    const history = emptyHistory(); history.character = 'oracle';
    history.conversations.oracle.messages = [{ role: 'user', content: 'Soy Lucía' }, { role: 'assistant', content: 'Hola, Lucía' }];
    history.conversations.trinity.draft = 'Borrador anterior';
    const legacy = JSON.stringify({ version: 1, normalTurns: 3, returnCharacter: 'morpheus', messages: [], draft: 'Texto antiguo' });
    const values = new Map([[HISTORY_KEY, JSON.stringify(history)], [LEGACY_STORY_KEY, legacy], ['unrelated', 'conservar']]);
    const f = setup({ values, withHistory: true });
    expect(f.session.getState()).toMatchObject({ character: 'oracle', smithActive: false, story: emptyStory() });
    expect(f.session.getState().conversations.trinity.draft).toBe('Borrador anterior');
    expect(f.session.getState().messages).toEqual(history.conversations.oracle.messages);
    expect(f.values.get(HISTORY_KEY)).toBe(JSON.stringify(history)); expect(f.values.get(LEGACY_STORY_KEY)).toBe(legacy);
    expect(f.values.get('unrelated')).toBe('conservar');
  });
  it('borrar todos los historiales conserva el reto pendiente y después la exención', async () => {
    const f = setup({ withHistory: true }); await enterSmith(f.session); answer(f.session, 'b');
    const pending = f.values.get(STORY_KEY); expect(f.history.clear('all')).toBe(true);
    expect(f.values.get(STORY_KEY)).toBe(pending); expect(f.values.has(HISTORY_KEY)).toBe(false);
    expect(f.session.getState()).toMatchObject({ character: 'morpheus', smithActive: true, smithQuestion: { number: 2 }, messages: [] });
    answer(f.session, 'b'); const passed = f.values.get(STORY_KEY);
    await normalTurn(f.session); expect(f.history.clear('all')).toBe(true); expect(f.values.get(STORY_KEY)).toBe(passed);
    f.session.selectCharacter('morpheus'); await normalTurn(f.session); expect(f.session.getState().smithActive).toBe(false);
    expect(f.values.get('unrelated')).toBe('conservar');
  });
  it('borrar solo el historial actual y restaurarlo no reinicia el progreso', async () => {
    const f = setup({ withHistory: true }); f.session.selectCharacter('oracle'); await normalTurn(f.session); await normalTurn(f.session);
    expect(f.history.clear('current')).toBe(true); expect(f.session.getState().story.characters.oracle.turns).toBe(2);
    await normalTurn(f.session); answer(f.session); expect(f.history.clear('current')).toBe(true);
    expect(f.session.getState().story.characters.oracle.passed).toBe(true);
    f.session.restore(emptyHistory()); f.session.selectCharacter('oracle'); await normalTurn(f.session);
    expect(f.session.getState().smithActive).toBe(false);
  });
  it('conserva datos corruptos y funciona en memoria con aviso', async () => {
    const f = setup({ raw: 'corrupto' }); await enterSmith(f.session); answer(f.session);
    expect(f.values.get(STORY_KEY)).toBe('corrupto'); expect(f.persistence.getState().kind).toBe('memory');
    const blocked = setup({ failRead: true }); await enterSmith(blocked.session); expect(blocked.session.getState().smithActive).toBe(true);
    expect(blocked.persistence.getState().kind).toBe('memory');
  });
  it('no afirma guardar cuando falla la escritura', async () => {
    const f = setup(); f.storage.setItem.mockImplementation(() => { throw Error('QuotaExceeded'); }); await enterSmith(f.session);
    expect(f.persistence.getState().kind).toBe('memory'); expect(f.values.has(STORY_KEY)).toBe(false);
  });
  it.each(['storage', 'focus', 'pageshow'])('detecta cambios de otra pestaña al recibir %s y bloquea respuestas', async type => {
    const f = setup(); await enterSmith(f.session); const other = emptyStory(); other.characters.trinity.turns = 1;
    f.values.set(STORY_KEY, JSON.stringify(other)); const event = new Event(type);
    if (type === 'storage') Object.defineProperty(event, 'key', { value: STORY_KEY });
    f.eventTarget.dispatchEvent(event);
    expect(f.persistence.getState().kind).toBe('conflict'); expect(answer(f.session)).toBe(false);
    expect(f.session.selectCharacter('oracle')).toBe(false); expect(f.values.get(STORY_KEY)).toBe(JSON.stringify(other));
  });
  it('evita sobrescribir una escritura externa aunque no llegue el evento storage', async () => {
    const f = setup(); await enterSmith(f.session); const other = JSON.stringify(emptyStory()); f.values.set(STORY_KEY, other);
    answer(f.session, 'b'); expect(f.persistence.getState().kind).toBe('conflict'); expect(f.session.getState().storyBlocked).toBe(true);
    expect(f.values.get(STORY_KEY)).toBe(other); expect(answer(f.session, 'b')).toBe(false);
  });
  it('ignora claves y áreas ajenas y retira sus listeners al cerrar', async () => {
    const f = setup(); f.values.set(STORY_KEY, 'otro valor');
    const foreignKey = new Event('storage'); Object.defineProperty(foreignKey, 'key', { value: 'unrelated' }); f.eventTarget.dispatchEvent(foreignKey);
    const foreignArea = new Event('storage'); Object.defineProperties(foreignArea, { key: { value: STORY_KEY }, storageArea: { value: {} } }); f.eventTarget.dispatchEvent(foreignArea);
    expect(f.persistence.getState().kind).toBe('saved'); f.values.delete(STORY_KEY);
    const listener = vi.fn(); const unsubscribe = f.persistence.subscribe(listener); unsubscribe();
    f.eventTarget.dispatchEvent(new Event('pagehide')); await enterSmith(f.session); expect(f.values.has(STORY_KEY)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
