/** Rostro procedural proyectado: solo caracteres, sin fotografías ni dependencias. */
export function mountSmithScene(canvas, pauseButton) {
  let context;
  try { context = canvas.getContext('2d'); } catch { context = null; }
  if (!context) { canvas.hidden = true; pauseButton.hidden = true; return { setActive() {}, dispose() {} }; }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = '01シネハマテラ79';
  let frame = 0, previous = -Infinity, active = false, paused = false, disposed = false;
  function draw(ms) {
    const width = canvas.clientWidth || 220, height = canvas.clientHeight || 180;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#010a05'; context.fillRect(0, 0, width, height);
    const time = ms / 1000, scale = Math.min(width / 2.8, height / 2.5), cx = width / 2, cy = height * .48;
    context.font = '10px monospace'; context.textAlign = 'center';
    // Lluvia densa con cabeza luminosa; avanza por tiempo, no por número de frames.
    for (let column = 0; column < width / 9; column++) {
      const head = ((time * (65 + column % 7 * 9) + column * 47) % (height + 90)) - 45;
      for (let row = 0; row < height / 11; row++) {
        const y = row * 11, distance = (head - y + height + 90) % (height + 90);
        context.fillStyle = distance < 14 ? '#b0ffd1' : `rgba(23,224,112,${distance < 80 ? .28 : .1})`;
        context.fillText(glyphs[(column * 3 + row + Math.floor(time * 8)) % glyphs.length], column * 9, y);
      }
    }
    const laugh = .09 + .13 * (.5 + .5 * Math.sin(time * 6));
    const yaw = Math.sin(time * .85) * .15, lift = Math.sin(time * 6) * .025;
    context.font = `${Math.max(7, scale * .105)}px monospace`;
    for (let row = 0; row < 26; row++) for (let column = 0; column < 23; column++) {
      const x = (column - 11) / 12, y = (row - 12) / 12;
      if (x*x + y*y > 1 || (y > .5 && Math.abs(x) > .62)) continue;
      const z = Math.sqrt(Math.max(0, 1 - x*x - y*y));
      // Las gafas y la boca son vacíos del mismo campo de caracteres.
      const glasses = y > -.26 && y < -.02 && Math.abs(x) > .12 && Math.abs(x) < .78;
      const mouth = Math.abs(x) < .38 && y > .38 - laugh && y < .38 + laugh;
      if (glasses || mouth) continue;
      const hair = y < -.68 + x * .12;
      const bright = hair ? .4 : .45 + z * .5;
      context.fillStyle = y > .27 && y < .34 && Math.abs(x) < .39 ? '#d0ffe0' : `rgba(${hair ? 20 : 80},255,${hair ? 95 : 156},${bright})`;
      const px = cx + (x * Math.cos(yaw) + z * Math.sin(yaw)) * scale;
      const py = cy + (y + lift) * scale * 1.1;
      context.fillText(glyphs[(row * 7 + column + Math.floor(time * 12)) % glyphs.length], px, py);
    }
    // Cuello, traje y corbata también se trazan con glifos.
    context.fillStyle = '#37d980';
    for (let row = 0; row < 5; row++) for (let column = -8-row; column <= 8+row; column++) {
      const x = column * scale * .08, y = cy + scale * (1.02 + row * .095);
      if (Math.abs(column) < 2 || Math.abs(column) > 4 + row) context.fillText(glyphs[(row + column + 40) % glyphs.length], cx+x, y);
    }
  }
  function tick(now) {
    if (!active || paused || reduced.matches || document.hidden || disposed) { frame = 0; return; }
    if (now - previous >= 50) { previous = now; draw(now); }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0;
    pauseButton.textContent = paused ? 'Reanudar lluvia' : 'Pausar lluvia';
    pauseButton.setAttribute('aria-pressed', String(paused));
    if (!active) return;
    draw(reduced.matches || paused ? 0 : performance.now());
    if (!paused && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function toggle() { paused = !paused; sync(); }
  pauseButton.addEventListener('click', toggle);
  reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  const observer = new ResizeObserver(() => { if (active) draw(reduced.matches || paused ? 0 : performance.now()); }); observer.observe(canvas);
  const control = {
    setActive(next) { if (next === active) return; active = next; sync(); },
    dispose() { disposed = true; active = false; cancelAnimationFrame(frame); observer.disconnect(); pauseButton.removeEventListener('click', toggle); reduced.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); },
  };
  return control;
}
