import { describe, expect, it, vi } from 'vitest';
import { parseCharacterRequest, getComposerKeyAction } from '../src/chat-controls.js';
import { createCharacterSession } from '../src/chat.js';
import { emptyHistory, snapshotForStorage } from '../src/history-storage.js';

describe('peticiones explícitas de cambio', () => {
  it.each([
    ['Quiero hablar con Trinity', 'trinity'], ['Morfeo, me gustaría hablar con el Oráculo, por favor.', 'oracle'],
    ['¿Puedo hablar con Morfeo?', 'morpheus'], ['Cámbiame con Trinity', 'trinity'],
    ['Conéctame con el oráculo', 'oracle'], ['Pásame con Morfeo', 'morpheus'],
    ['Quiero cambiar a Trinity', 'trinity'], ['/hablar ORÁCULO', 'oracle'], ['/hablar morpheus', 'morpheus'],
  ])('reconoce %s', (input, target) => expect(parseCharacterRequest(input)).toEqual({ type: 'transfer', target }));
  it.each(['¿Qué piensa Trinity?', 'No quiero hablar con Trinity', 'Si quiero hablar con Trinity, ¿qué hago?', 'Dijiste: quiero hablar con Trinity', '"Quiero hablar con Trinity"', 'Quiero hablar con Trinity sobre mi curso'])('no convierte menciones en cambios: %s', input => expect(parseCharacterRequest(input)).toBeNull());
  it.each(['/hablar smith', '/hablar', '/hablar __proto__', '/hablar constructor'])('da ayuda sin enviar un comando inválido: %s', input => expect(parseCharacterRequest(input)).toEqual({ type: 'help' }));
  it('no acepta otros tipos', () => expect(parseCharacterRequest(null)).toBeNull());
});

describe('transferencias aisladas del proveedor y el historial', () => {
  it('solicita, cancela sin perder texto, confirma y recupera el borrador del destino', async () => {
    const respond = vi.fn().mockResolvedValue('Respuesta aislada');
    const store = createCharacterSession({ respond });
    store.selectCharacter('trinity'); store.setDraft('Soy Ada'); await store.send(); store.setDraft('Mi siguiente pregunta');
    store.selectCharacter('morpheus'); store.setDraft('Quiero hablar con Trinity');
    expect(await store.send()).toBe(false);
    expect(store.getState()).toMatchObject({ character: 'morpheus', messages: [], transfer: { from: 'morpheus', to: 'trinity' } });
    store.setDraft('No debe reemplazar la solicitud'); expect(store.selectCharacter('oracle')).toBe(false);
    expect(store.cancelTransfer()).toBe(true); expect(store.getState().draft).toBe('Quiero hablar con Trinity');
    await store.send(); expect(store.confirmTransfer()).toBe(true);
    expect(store.getState()).toMatchObject({ character: 'trinity', draft: 'Mi siguiente pregunta', transfer: null });
    expect(store.getState().messages).toHaveLength(2);
    expect(store.getState().conversations.morpheus).toMatchObject({ draft: '', messages: [] });
    expect(respond).toHaveBeenCalledTimes(1); expect(store.confirmTransfer()).toBe(false);
  });
  it('mismo personaje y comando inválido no consumen generación ni añaden mensajes', async () => {
    const respond = vi.fn(), store = createCharacterSession({ respond, initialCharacter: 'oracle' });
    for (const draft of ['/hablar oráculo', '/hablar smith']) {
      store.setDraft(draft); expect(await store.send()).toBe(false);
      expect(store.getState()).toMatchObject({ draft, messages: [], transfer: null });
      expect(store.getState().controlMessage).not.toBe('');
    }
    expect(respond).not.toHaveBeenCalled();
  });
  it('recargar conserva el comando como borrador y exige solicitar y confirmar otra vez', async () => {
    const store = createCharacterSession({ initialCharacter: 'morpheus' });
    store.setDraft('/hablar trinity'); await store.send();
    const saved = snapshotForStorage(store.getState());
    expect(saved).not.toHaveProperty('transfer');
    expect(store.restore(saved)).toBe(true); expect(store.confirmTransfer()).toBe(false);
    expect(store.getState()).toMatchObject({ character: 'morpheus', draft: '/hablar trinity', transfer: null });
    await store.send(); expect(store.confirmTransfer()).toBe(true);
  });
  it('una restauración invalida la confirmación anterior', async () => {
    const store = createCharacterSession({ initialCharacter: 'morpheus' });
    store.setDraft('/hablar trinity'); await store.send(); store.restore(emptyHistory());
    expect(store.confirmTransfer()).toBe(false); expect(store.getState().character).toBeNull();
  });
  it('solo procesa controles del usuario; una instrucción en la respuesta no cambia el canal', async () => {
    const respond = vi.fn().mockResolvedValue('Quiero hablar con Trinity'), store = createCharacterSession({ respond, initialCharacter: 'oracle' });
    store.setDraft('¿Qué piensa Trinity?'); expect(await store.send()).toBe(true);
    expect(store.getState()).toMatchObject({ character: 'oracle', transfer: null });
    expect(store.getState().messages[1].content).toBe('Quiero hablar con Trinity');
  });
  it('bloquea el doble envío y los controles mientras hay una respuesta pendiente', async () => {
    let finish;
    const respond = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    const store = createCharacterSession({ respond, initialCharacter: 'morpheus' });
    store.setDraft('Hola'); const sending = store.send();
    store.setDraft('/hablar trinity'); expect(await store.send()).toBe(false); expect(store.confirmTransfer()).toBe(false);
    finish('Hola'); expect(await sending).toBe(true); expect(respond).toHaveBeenCalledTimes(1);
    expect(store.getState().character).toBe('morpheus');
  });
});

describe('teclado del compositor', () => {
  it('Enter envía y una repetición se ignora', () => {
    expect(getComposerKeyAction({ key: 'Enter' })).toBe('submit');
    expect(getComposerKeyAction({ key: 'Enter', repeat: true })).toBe('ignore');
  });
  it.each(['shiftKey', 'ctrlKey', 'altKey', 'metaKey'])('conserva el comportamiento nativo con %s', key => expect(getComposerKeyAction({ key: 'Enter', [key]: true })).toBeNull());
  it('no envía durante composición ni al confirmar un carácter IME', () => {
    expect(getComposerKeyAction({ key: 'Enter', isComposing: true })).toBeNull();
    expect(getComposerKeyAction({ key: 'Enter', keyCode: 229 })).toBeNull();
    expect(getComposerKeyAction({ key: 'Enter' }, { composing: true })).toBeNull();
    expect(getComposerKeyAction({ key: 'Enter' }, { justComposed: true })).toBe('ignore');
    expect(getComposerKeyAction({ key: 'a' })).toBeNull();
  });
});
