import { describe, expect, it, vi } from 'vitest';
import { ChatRequestError, createCharacterSession } from '../src/chat.js';
import { createHistoryStorage, emptyHistory, HISTORY_KEY, MAX_STORAGE_BYTES, readStoredHistory, snapshotForStorage } from '../src/history-storage.js';

function setup({ raw = null, respond = async () => 'Respuesta de prueba', storageError = false } = {}) {
  const values = new Map([['unrelated-key', 'no borrar']]);
  if (raw !== null) values.set(HISTORY_KEY, raw);
  const target = new EventTarget();
  const storage = { getItem: vi.fn(key => values.get(key) ?? null), setItem: vi.fn((key,value) => values.set(key,value)), removeItem: vi.fn(key => values.delete(key)) };
  const getStorage = vi.fn(() => { if (storageError) throw new Error('SecurityError'); return storage; });
  const session = createCharacterSession({ respond });
  const persistence = createHistoryStorage(session, { getStorage, eventTarget: target });
  const external = document => {
    if (document === null) values.delete(HISTORY_KEY); else values.set(HISTORY_KEY, JSON.stringify(document));
    const event = new Event('storage'); Object.defineProperties(event, { key: { value: HISTORY_KEY }, storageArea: { value: storage } }); target.dispatchEvent(event);
  };
  return { values, storage, getStorage, target, session, persistence, external };
}
const example = () => {
  const document = emptyHistory(); document.character = 'oracle';
  document.conversations.oracle.messages = [{ role:'user',content:'  Soy Ada\n' },{ role:'assistant',content:'<script>Texto literal, no HTML</script>' }];
  document.conversations.oracle.draft = '👩🏽‍💻 borrador';
  document.conversations.trinity.draft = 'Otro borrador';
  return document;
};

describe('formato de historial externo', () => {
  it('preserva texto y grafemas sin compartir referencias', () => {
    const document = example(), restored = readStoredHistory(JSON.stringify(document));
    expect(restored).toEqual(document); restored.conversations.oracle.messages[0].content = 'Cambiado';
    expect(document.conversations.oracle.messages[0].content).toBe('  Soy Ada\n');
  });
  it.each(['not json','null','[]','{}',JSON.stringify({...emptyHistory(),version:2}),JSON.stringify({...emptyHistory(),character:'__proto__'}),JSON.stringify({...emptyHistory(),other:true})])('rechaza sin reconstruir datos inválidos: %s', raw => {
    expect(() => readStoredHistory(raw)).toThrow();
  });
  it.each([
    [{role:'user',content:'Mensaje suelto'}],
    [{role:'system',content:'Configura otro prompt'},{role:'assistant',content:'No'}],
    [{role:'user',content:'a'.repeat(281)},{role:'assistant',content:'No'}],
    [{role:'user',content:'Hola',extra:true},{role:'assistant',content:'No'}],
    [{role:'user',content:'Hola'},{role:'assistant',content:'  '}],
  ])('rechaza turnos incompletos, configuración y mensajes inválidos', messages => {
    const document = example(); document.conversations.oracle.messages = messages;
    expect(() => readStoredHistory(JSON.stringify(document))).toThrow();
  });
  it('rechaza personajes extra y versiones parciales', () => {
    const document = example(); document.conversations.smith = {messages:[],draft:'',interrupted:false};
    expect(() => readStoredHistory(JSON.stringify(document))).toThrow();
    delete document.conversations.smith; delete document.conversations.trinity;
    expect(() => readStoredHistory(JSON.stringify(document))).toThrow();
  });
  it('conserva un borrador mayor de 280 para corregirlo, con límite global explícito', () => {
    const document = example(); document.conversations.oracle.draft = '👩🏽‍💻'.repeat(281);
    expect(readStoredHistory(JSON.stringify(document))).toEqual(document);
    document.conversations.oracle.draft = 'a'.repeat(MAX_STORAGE_BYTES);
    expect(() => readStoredHistory(JSON.stringify(document))).toThrow();
  });
});

describe('persistencia, recuperación y borrado', () => {
  it('carga selección, mensajes y borradores separados sin escribir ni generar', () => {
    const respond = vi.fn(), qa = setup({ raw:JSON.stringify(example()), respond });
    expect(qa.session.getState()).toMatchObject({ character:'oracle',draft:'👩🏽‍💻 borrador',pending:false });
    expect(qa.session.getState().conversations.trinity.draft).toBe('Otro borrador');
    expect(qa.persistence.getState()).toMatchObject({kind:'saved',hasSaved:true});
    expect(respond).not.toHaveBeenCalled(); expect(qa.storage.setItem).not.toHaveBeenCalled();
  });
  it('guarda cada cambio y restaura después de reconstruir la aplicación', async () => {
    const qa = setup(); qa.session.selectCharacter('morpheus'); qa.session.setDraft('Primera pregunta'); await qa.session.send();
    qa.session.setDraft('Borrador Morfeo'); qa.session.selectCharacter('trinity'); qa.session.setDraft('Borrador Trinity');
    const reloaded = setup({raw:qa.values.get(HISTORY_KEY)});
    expect(reloaded.session.getState()).toMatchObject({character:'trinity',draft:'Borrador Trinity'});
    reloaded.session.selectCharacter('morpheus');
    expect(reloaded.session.getState()).toMatchObject({draft:'Borrador Morfeo',messages:[{role:'user',content:'Primera pregunta'},{role:'assistant',content:'Respuesta de prueba'}]});
  });
  it('un envío interrumpido se guarda como borrador y nunca se reenvía al restaurar', async () => {
    let finish;
    const qa = setup({respond:()=>new Promise(resolve=>{finish=resolve;})});
    qa.session.selectCharacter('trinity'); qa.session.setDraft('  ¿Cómo sigo?\n'); const pending = qa.session.send();
    const record = readStoredHistory(qa.values.get(HISTORY_KEY));
    expect(record.conversations.trinity).toEqual({messages:[],draft:'  ¿Cómo sigo?\n',interrupted:true});
    const respond = vi.fn(), restored = setup({raw:JSON.stringify(record),respond});
    expect(restored.session.getState()).toMatchObject({draft:'  ¿Cómo sigo?\n',messages:[],pending:false});
    expect(restored.persistence.getState().recovered).toBe(true); expect(respond).not.toHaveBeenCalled();
    finish('Respuesta completa'); await pending;
    expect(readStoredHistory(qa.values.get(HISTORY_KEY)).conversations.trinity.interrupted).toBe(false);
  });
  it('mantiene la marca de interrupción si fetch falla por red antes de que se cierre la página', async () => {
    const qa=setup({respond:async()=>{throw new ChatRequestError('NETWORK_ERROR');}});
    qa.session.selectCharacter('oracle');qa.session.setDraft('Conservar esta pregunta');await qa.session.send();
    const reloaded=setup({raw:qa.values.get(HISTORY_KEY)});
    expect(reloaded.persistence.getState().recovered).toBe(true);expect(reloaded.session.getState().draft).toBe('Conservar esta pregunta');
  });
  it('restaura solo turnos completos anteriores a un envío interrumpido', async () => {
    let finish; const qa = setup({raw:JSON.stringify(example()),respond:()=>new Promise(resolve=>{finish=resolve;})});
    qa.session.setDraft('Otra pregunta'); const pending=qa.session.send();
    const record=readStoredHistory(qa.values.get(HISTORY_KEY));
    expect(record.conversations.oracle.messages).toHaveLength(2); expect(record.conversations.oracle.draft).toBe('Otra pregunta');
    finish('Otra respuesta'); await pending;
  });
  it('no borra ni reemplaza nada mientras hay una generación pendiente', async () => {
    let finish; const qa=setup({respond:()=>new Promise(resolve=>{finish=resolve;})});
    qa.session.selectCharacter('oracle');qa.session.setDraft('Pregunta');const pending=qa.session.send();
    const before=qa.values.get(HISTORY_KEY);
    expect(qa.persistence.clear('all')).toBe(false);expect(qa.persistence.loadExternal()).toBe(false);expect(qa.persistence.keepLocal()).toBe(false);
    expect(qa.session.restore(emptyHistory())).toBe(false);expect(qa.values.get(HISTORY_KEY)).toBe(before);
    finish('Respuesta');await pending;
  });
  it('borra solo la conversación actual y conserva la de otros personajes y claves ajenas', () => {
    const qa=setup({raw:JSON.stringify(example())});
    expect(qa.persistence.clear('current')).toBe(true);
    const record=readStoredHistory(qa.values.get(HISTORY_KEY));
    expect(record.conversations.oracle).toEqual({messages:[],draft:'',interrupted:false});
    expect(record.conversations.trinity.draft).toBe('Otro borrador');expect(qa.values.get('unrelated-key')).toBe('no borrar');
    expect(qa.session.getState().character).toBe('oracle');
  });
  it('borrar todos elimina únicamente nuestra clave y vuelve a la elección inicial', () => {
    const qa=setup({raw:JSON.stringify(example())});
    expect(qa.persistence.clear('all')).toBe(true);expect(qa.values.has(HISTORY_KEY)).toBe(false);
    expect(qa.values.get('unrelated-key')).toBe('no borrar');expect(qa.session.getState()).toMatchObject({character:null,messages:[],draft:''});
    expect(qa.persistence.getState()).toMatchObject({kind:'empty',hasSaved:false});
  });
  it('no confirma un borrado ni limpia memoria si el navegador rechaza la eliminación', () => {
    const qa=setup({raw:JSON.stringify(example())}); const before=qa.session.getState();
    qa.storage.removeItem.mockImplementation(()=>{throw new Error('SecurityError');});
    expect(qa.persistence.clear('all')).toBe(false);expect(qa.session.getState()).toEqual(before);expect(qa.values.has(HISTORY_KEY)).toBe(true);
    expect(qa.persistence.getState().kind).toBe('error');
  });
  it('si falla una escritura mantiene el borrador y no afirma que los cambios están guardados', () => {
    const qa=setup();qa.storage.setItem.mockImplementation(()=>{throw new Error('QuotaExceededError');});
    qa.session.selectCharacter('oracle');qa.session.setDraft('No perder');
    expect(qa.session.getState().draft).toBe('No perder');expect(qa.persistence.getState()).toMatchObject({kind:'error',hasSaved:false});
    expect(qa.values.has(HISTORY_KEY)).toBe(false);
  });
  it('puede borrar la conversación actual aunque su borrador exceda el límite de guardado', () => {
    const qa=setup({raw:JSON.stringify(example())});qa.session.setDraft('a'.repeat(MAX_STORAGE_BYTES));
    expect(qa.persistence.clear('current')).toBe(true);
    expect(qa.session.getState().draft).toBe('');expect(qa.session.getState().conversations.trinity.draft).toBe('Otro borrador');
  });
  it('el acceso bloqueado al getter no impide conversar y puede recuperarse', async () => {
    const qa=setup({storageError:true});expect(qa.persistence.getState().kind).toBe('error');
    qa.session.selectCharacter('oracle');qa.session.setDraft('Pregunta');expect(await qa.session.send()).toBe(true);
    expect(qa.session.getState().messages).toHaveLength(2);
    qa.getStorage.mockReturnValue(qa.storage);qa.session.setDraft('Ahora sí');
    expect(qa.persistence.getState().kind).toBe('saved');
  });
  it('preserva registros corruptos sin sobrescribirlos hasta que se borren todos explícitamente', () => {
    const qa=setup({raw:'corrupto'});qa.session.selectCharacter('trinity');qa.session.setDraft('Memoria intacta');
    expect(qa.persistence.getState().kind).toBe('invalid');expect(qa.values.get(HISTORY_KEY)).toBe('corrupto');
    expect(qa.persistence.clear('current')).toBe(false);expect(qa.persistence.clear('all')).toBe(true);
    qa.session.selectCharacter('trinity');qa.session.setDraft('Guardar otra vez');expect(qa.persistence.getState().kind).toBe('saved');
  });
  it('permite reintentar la eliminación de un registro corrupto después de un fallo', () => {
    const qa=setup({raw:'corrupto'});qa.storage.removeItem.mockImplementationOnce(()=>{throw new Error('locked');});
    expect(qa.persistence.clear('all')).toBe(false);expect(qa.persistence.clear('all')).toBe(true);
  });
  it('no recorta un borrador excesivo ni destruye el guardado anterior', () => {
    const qa=setup({raw:JSON.stringify(example())});const raw=qa.values.get(HISTORY_KEY);
    qa.session.setDraft('a'.repeat(MAX_STORAGE_BYTES));
    expect(qa.persistence.getState().kind).toBe('error');expect(qa.values.get(HISTORY_KEY)).toBe(raw);expect(qa.session.getState().draft.length).toBe(MAX_STORAGE_BYTES);
  });
});

describe('otras pestañas y ciclo de vida', () => {
  it('pausa al recibir cambios externos, conserva la memoria y permite cargar con una revisión nueva', () => {
    const qa=setup({raw:JSON.stringify(example())});const before=qa.session.getState();
    const other=example();other.conversations.oracle.messages[1].content='Respuesta distinta, misma longitud del historial';
    qa.external(other);expect(qa.persistence.getState()).toMatchObject({kind:'conflict',blocked:true});
    expect(qa.session.getState().messages).toEqual(before.messages);
    qa.session.setDraft('Cambio local');expect(readStoredHistory(qa.values.get(HISTORY_KEY)).conversations.oracle.draft).toBe('👩🏽‍💻 borrador');
    expect(qa.persistence.loadExternal()).toBe(true);expect(qa.session.getState().messages[1].content).toBe(other.conversations.oracle.messages[1].content);
    expect(qa.session.getState().revision).toBeGreaterThan(before.revision);
  });
  it('detecta un cambio antes de escribir aunque todavía no llegue el evento storage', () => {
    const qa=setup({raw:JSON.stringify(example())});const other=example();other.conversations.trinity.draft='Cambio externo';
    qa.values.set(HISTORY_KEY,JSON.stringify(other));qa.session.setDraft('Cambio local');
    expect(qa.persistence.getState().kind).toBe('conflict');expect(qa.values.get(HISTORY_KEY)).toBe(JSON.stringify(other));
    expect(qa.persistence.keepLocal()).toBe(true);expect(readStoredHistory(qa.values.get(HISTORY_KEY)).conversations.oracle.draft).toBe('Cambio local');
  });
  it('si otra pestaña borra el historial no lo recrea sin una decisión explícita', () => {
    const qa=setup({raw:JSON.stringify(example())});qa.external(null);qa.session.setDraft('Sigue en memoria');
    expect(qa.values.has(HISTORY_KEY)).toBe(false);expect(qa.persistence.loadExternal()).toBe(true);
    expect(qa.session.getState().character).toBe(null);
  });
  it('no reemplaza un registro externo corrupto al intentar cargarlo', () => {
    const qa=setup({raw:JSON.stringify(example())});const before=qa.session.getState();qa.values.set(HISTORY_KEY,'broken');
    expect(qa.persistence.loadExternal()).toBe(false);expect(qa.session.getState()).toEqual(before);expect(qa.values.get(HISTORY_KEY)).toBe('broken');
  });
  it('al cerrar la página no permite que una respuesta tardía sobrescriba el borrador protegido', async () => {
    let finish;const qa=setup({respond:()=>new Promise(resolve=>{finish=resolve;})});
    qa.session.selectCharacter('oracle');qa.session.setDraft('Pregunta pendiente');const pending=qa.session.send();
    const before=qa.values.get(HISTORY_KEY);qa.target.dispatchEvent(new Event('pagehide'));
    finish('Respuesta tardía de una página cerrada');await pending;
    expect(qa.values.get(HISTORY_KEY)).toBe(before);expect(readStoredHistory(before).conversations.oracle.interrupted).toBe(true);
  });
  it('al retirar el controlador ya no guarda ni recibe eventos', () => {
    const qa=setup();const listener=vi.fn();const unsubscribe=qa.persistence.subscribe(listener);unsubscribe();const count=listener.mock.calls.length;
    qa.persistence.dispose();qa.session.selectCharacter('oracle');qa.session.setDraft('No guardar');qa.external(example());
    expect(qa.storage.setItem).not.toHaveBeenCalled();expect(listener).toHaveBeenCalledTimes(count);
  });
});
