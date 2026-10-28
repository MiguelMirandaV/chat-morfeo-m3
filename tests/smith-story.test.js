import { describe, expect, it, vi } from 'vitest';
import { ChatRequestError, createCharacterSession } from '../src/chat.js';
import { emptyHistory, createHistoryStorage, HISTORY_KEY } from '../src/history-storage.js';
import { emptyStory, validateStory, createStoryStorage, STORY_KEY, smithReply } from '../src/smith-story.js';
const normalTurn = async (session, text = '¿Qué camino sigo?') => { session.setDraft(text); return session.send(); };
async function enterSmith(session) { session.selectCharacter('morpheus'); for (let i=0;i<3;i++) await normalTurn(session,`Pregunta ${i+1}`); }
function setup({ raw = null, failRead = false } = {}) {
  const values = new Map([['unrelated', 'conservar']]); if (raw !== null) values.set(STORY_KEY,raw);
  const storage = { getItem:vi.fn(key=>values.get(key)??null), setItem:vi.fn((key,value)=>values.set(key,value)),removeItem:vi.fn(key=>values.delete(key)) };
  const eventTarget = new EventTarget(), getStorage=()=>{if(failRead)throw Error('blocked');return storage;};
  const respond=vi.fn().mockResolvedValue('Respuesta normal'),session=createCharacterSession({respond});
  const persistence=createStoryStorage(session,{getStorage,eventTarget});
  return {values,storage,eventTarget,getStorage,respond,session,persistence};
}
describe('Smith: tres turnos normales y dos locales',()=>{
  it('interviene exactamente tras el tercer par completo y recupera el contexto sin Smith',async()=>{
    const respond=vi.fn().mockResolvedValue('Respuesta normal'),s=createCharacterSession({respond,initialCharacter:'oracle'});
    await normalTurn(s,'Soy Ada'); await normalTurn(s,'Aprendo JS'); expect(s.getState()).toMatchObject({smithActive:false,story:{normalTurns:2}});
    await normalTurn(s,'¿Qué sabes de mí?'); expect(s.getState()).toMatchObject({character:'oracle',smithActive:true,messages:[],story:{normalTurns:3,returnCharacter:'oracle'}});
    expect(s.finishSmith()).toBe(false);
    await normalTurn(s,'Quiero elegir');expect(s.getState().messages).toHaveLength(2);expect(s.finishSmith()).toBe(false);
    await normalTurn(s,'Devuelve la señal'); expect(s.getState().messages).toHaveLength(4);expect(respond).toHaveBeenCalledTimes(3);
    expect(await normalTurn(s,'No admite una tercera')).toBe(false);
    expect(s.finishSmith()).toBe(true);expect(s.getState()).toMatchObject({character:'oracle',smithActive:false,story:emptyStory()});
    expect(s.getState().messages).toHaveLength(6);await normalTurn(s,'Continúo');
    const history=respond.mock.calls[3][0];expect(history).toHaveLength(7);expect(JSON.stringify(history)).not.toContain('Devuelve la señal');
  });
  it('acumula entre personajes; transferencias y cancelaciones no cuentan',async()=>{
    const s=createCharacterSession({respond:async()=> 'Sí',initialCharacter:'morpheus'});
    await normalTurn(s);s.setDraft('/hablar trinity');await s.send();s.cancelTransfer();await s.send();s.confirmTransfer();
    expect(s.getState().story.normalTurns).toBe(1);await normalTurn(s);await normalTurn(s);
    expect(s.getState()).toMatchObject({smithActive:true,character:'trinity',story:{returnCharacter:'trinity'}});
  });
  it.each(['TIMEOUT','RATE_LIMITED','SERVICE_UNAVAILABLE'])('un fallo %s no cuenta ni reinicia el ciclo',async code=>{
    const respond=vi.fn().mockResolvedValueOnce('Sí').mockRejectedValueOnce(new ChatRequestError(code)).mockResolvedValueOnce('Ahora sí');
    const s=createCharacterSession({respond,initialCharacter:'oracle'});await normalTurn(s);expect(await normalTurn(s)).toBe(false);
    expect(s.getState().story.normalTurns).toBe(1);await s.send();expect(s.getState().story.normalTurns).toBe(2);
  });
  it('no cuenta vacíos, comandos desconocidos o destino actual; bloquea transferencias bajo Smith',async()=>{
    const s=createCharacterSession({respond:async()=> 'Sí',initialCharacter:'morpheus'});
    for(const text of ['','  ','/hablar smith','/hablar morfeo'])expect(await normalTurn(s,text)).toBe(false);
    expect(s.getState().story.normalTurns).toBe(0);await enterSmith(s);
    expect(await normalTurn(s,'Quiero hablar con Trinity')).toBe(false);expect(s.selectCharacter('trinity')).toBe(false);expect(s.confirmTransfer()).toBe(false);
    expect(s.getState().story.messages).toEqual([]);expect(s.getState().controlMessage).toContain('Smith');
  });
  it('cuenta antes de notificar el cierre; un doble envío pendiente no adelanta el ciclo',async()=>{
    let finish; const s=createCharacterSession({respond:()=>new Promise(resolve=>{finish=resolve;}),initialCharacter:'trinity'});
    const snapshots=[];s.subscribe(state=>snapshots.push(state));const sending=normalTurn(s);
    expect(await s.send()).toBe(false);expect(s.getState().story.normalTurns).toBe(0);finish('Respuesta');await sending;
    expect(snapshots.at(-1)).toMatchObject({pending:false,story:{normalTurns:1}});
  });
  it('borrar todos los historiales conserva intervención, borrador Smith y personaje de retorno',async()=>{
    const f=setup(),history=createHistoryStorage(f.session,{getStorage:f.getStorage,eventTarget:f.eventTarget});
    await enterSmith(f.session);await normalTurn(f.session,'Primera local');f.session.setDraft('Borrador Smith');
    const saved=f.values.get(STORY_KEY);expect(history.clear('all')).toBe(true);
    expect(f.values.has(HISTORY_KEY)).toBe(false);expect(f.values.get(STORY_KEY)).toBe(saved);
    expect(f.session.getState()).toMatchObject({smithActive:true,character:'morpheus',draft:'Borrador Smith'});
    expect(f.session.getState().conversations.morpheus.messages).toEqual([]);
    await f.session.send();f.session.finishSmith();expect(f.session.getState()).toMatchObject({character:'morpheus',smithActive:false,messages:[]});
    expect(f.values.get('unrelated')).toBe('conservar');
  });
  it('restaurar o borrar historial antes de Smith no reinicia la cuenta',async()=>{
    const s=createCharacterSession({respond:async()=> 'Sí',initialCharacter:'oracle'});await normalTurn(s);await normalTurn(s);
    s.restore(emptyHistory());s.selectCharacter('trinity');expect(s.getState().story.normalTurns).toBe(2);await normalTurn(s);expect(s.getState().smithActive).toBe(true);
  });
  it('snapshots independientes y validación de longitud también bajo Smith',async()=>{
    const s=createCharacterSession({respond:async()=> 'Sí'});await enterSmith(s);
    expect(await normalTurn(s,'a'.repeat(281))).toBe(false);await normalTurn(s,'Hola');const state=s.getState();state.story.messages[0].content='Ajeno';state.messages.length=0;
    expect(s.getState().story.messages[0].content).toBe('Hola');expect(s.restoreStory({...emptyStory(),normalTurns:4})).toBe(false);
  });
});
describe('formato y persistencia narrativa',()=>{
  it.each([null,[],{}, {...emptyStory(),version:2},{...emptyStory(),normalTurns:-1},{...emptyStory(),normalTurns:1.5},{...emptyStory(),normalTurns:4},{...emptyStory(),returnCharacter:'morpheus'},{...emptyStory(),normalTurns:3},{...emptyStory(),draft:'Inesperado'},{...emptyStory(),extra:true},{...emptyStory(),normalTurns:3,returnCharacter:'smith'}])('rechaza un documento inválido sin ejecutarlo: %j',value=>expect(()=>validateStory(value)).toThrow());
  it('restaura tras una interacción Smith con mensajes, borrador y destino íntegros',async()=>{
    const f=setup();await enterSmith(f.session);await normalTurn(f.session,'Primera');f.session.setDraft('Segunda pendiente');
    const reloaded=setup({raw:f.values.get(STORY_KEY)});expect(reloaded.session.getState()).toMatchObject({character:'morpheus',smithActive:true,draft:'Segunda pendiente',story:{normalTurns:3}});
    expect(reloaded.session.getState().messages).toHaveLength(2);expect(reloaded.respond).not.toHaveBeenCalled();
    await reloaded.session.send();expect(reloaded.respond).not.toHaveBeenCalled();expect(reloaded.session.finishSmith()).toBe(true);
    expect(JSON.parse(reloaded.values.get(STORY_KEY))).toEqual(emptyStory());
  });
  it('restaura 2/2 sin generar una tercera respuesta y espera recuperar señal',async()=>{
    const f=setup();await enterSmith(f.session);await normalTurn(f.session);await normalTurn(f.session);
    const r=setup({raw:f.values.get(STORY_KEY)});expect(await r.session.send()).toBe(false);expect(r.session.finishSmith()).toBe(true);expect(r.respond).not.toHaveBeenCalled();
  });
  it('preserva datos corruptos y permite modo memoria con aviso honesto',async()=>{
    const f=setup({raw:'corrupto'});await enterSmith(f.session);expect(f.values.get(STORY_KEY)).toBe('corrupto');expect(f.persistence.getState().kind).toBe('memory');
    const blocked=setup({failRead:true});await enterSmith(blocked.session);expect(blocked.session.getState().smithActive).toBe(true);expect(blocked.persistence.getState().kind).toBe('memory');
  });
  it('no afirma guardar cuando falla la escritura',async()=>{
    const f=setup();f.storage.setItem.mockImplementation(()=>{throw Error('QuotaExceeded');});await enterSmith(f.session);
    expect(f.persistence.getState().kind).toBe('memory');expect(f.values.has(STORY_KEY)).toBe(false);expect(f.session.getState().smithActive).toBe(true);
  });
  it('detecta otra pestaña, evita sobrescribir y bloquea nuevas interacciones',async()=>{
    const f=setup();await enterSmith(f.session);const other={...emptyStory(),normalTurns:1};f.values.set(STORY_KEY,JSON.stringify(other));
    const event=new Event('storage');Object.defineProperty(event,'key',{value:STORY_KEY});f.eventTarget.dispatchEvent(event);
    expect(f.persistence.getState().kind).toBe('conflict');expect(await normalTurn(f.session,'No enviar')).toBe(false);
    expect(f.session.finishSmith()).toBe(false);expect(f.values.get(STORY_KEY)).toBe(JSON.stringify(other));
  });
  it('comprueba conflictos antes de escribir, aunque no llegue storage',async()=>{
    const f=setup();await enterSmith(f.session);f.values.set(STORY_KEY,JSON.stringify(emptyStory()));f.session.setDraft('Nuevo borrador');
    expect(f.persistence.getState().kind).toBe('conflict');expect(f.session.getState().storyBlocked).toBe(true);
  });
  it('retira listeners al cerrar; una clave ajena no provoca conflicto',async()=>{
    const f=setup();const event=new Event('storage');Object.defineProperty(event,'key',{value:'unrelated'});f.eventTarget.dispatchEvent(event);expect(f.persistence.getState().kind).toBe('saved');
    const listen=vi.fn(),unsubscribe=f.persistence.subscribe(listen);unsubscribe();f.persistence.dispose();await enterSmith(f.session);
    expect(f.values.has(STORY_KEY)).toBe(false);expect(listen).toHaveBeenCalledTimes(1);
  });
  it('el diálogo local contempla temas y no genera HTML',()=>{
    for(const text of ['libertad','JavaScript','miedo','<script>alert(1)</script>']){expect(smithReply(text,1)).toBeTypeOf('string');expect(smithReply(text,2)).toContain('devuelvo la señal');expect(smithReply(text,1)).not.toContain('<script>');}
  });
});
