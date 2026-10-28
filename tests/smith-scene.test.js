import { describe, expect, it, vi } from 'vitest';
import { mountSmithScene } from '../src/smith-scene.js';
function setup({ reduced = false, contextAvailable = true } = {}) {
  const media = Object.assign(new EventTarget(), { matches: reduced });
  const document = Object.assign(new EventTarget(), { hidden: false });
  const raf = vi.fn(()=>79),cancel=vi.fn(),disconnect=vi.fn();
  vi.stubGlobal('window',{ matchMedia:()=>media,devicePixelRatio:3 });vi.stubGlobal('document',document);
  vi.stubGlobal('requestAnimationFrame',raf);vi.stubGlobal('cancelAnimationFrame',cancel);
  vi.stubGlobal('ResizeObserver',class { observe(){} disconnect(){disconnect();} });
  const context={setTransform:vi.fn(),fillRect:vi.fn(),fillText:vi.fn()};
  const canvas={getContext:()=>contextAvailable?context:null,clientWidth:220,clientHeight:160,width:0,height:0,hidden:false};
  const button=Object.assign(new EventTarget(),{setAttribute:vi.fn(),textContent:'',hidden:false});
  const scene=mountSmithScene(canvas,button);
  return {media,document,raf,cancel,disconnect,context,canvas,button,scene};
}
describe('animación Smith y ciclo de vida',()=>{
  it('no anima antes de entrar y limita resolución; retirar la vista cancela recursos',()=>{
    const f=setup();expect(f.raf).not.toHaveBeenCalled();f.scene.setActive(true);expect(f.raf).toHaveBeenCalledTimes(1);expect(f.canvas.width).toBe(330);
    f.scene.dispose();expect(f.cancel).toHaveBeenCalledWith(79);expect(f.disconnect).toHaveBeenCalled();const count=f.raf.mock.calls.length;f.document.dispatchEvent(new Event('visibilitychange'));expect(f.raf).toHaveBeenCalledTimes(count);
  });
  it('movimiento reducido pinta una imagen estática sin bucle',()=>{
    const f=setup({reduced:true});f.scene.setActive(true);expect(f.context.fillText).toHaveBeenCalled();expect(f.raf).not.toHaveBeenCalled();f.scene.dispose();
  });
  it('pausa y reanuda por botón; oculta y recupera por visibilidad',()=>{
    const f=setup();f.scene.setActive(true);f.button.dispatchEvent(new Event('click'));expect(f.button.textContent).toBe('Reanudar lluvia');
    const count=f.raf.mock.calls.length;f.document.hidden=true;f.document.dispatchEvent(new Event('visibilitychange'));expect(f.raf).toHaveBeenCalledTimes(count);
    f.button.dispatchEvent(new Event('click'));expect(f.raf).toHaveBeenCalledTimes(count);f.document.hidden=false;f.document.dispatchEvent(new Event('visibilitychange'));expect(f.raf).toHaveBeenCalledTimes(count+1);f.scene.dispose();
  });
  it('permite el diálogo cuando Canvas no está disponible',()=>{
    const f=setup({contextAvailable:false});expect(f.canvas.hidden).toBe(true);expect(f.button.hidden).toBe(true);expect(()=>f.scene.setActive(true)).not.toThrow();f.scene.dispose();
  });
});
