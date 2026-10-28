/** Smith ocupa la pantalla con un rostro de glifos; no utiliza fotografías. */
export function mountSmithScene(canvas, pauseButton) {
  let context;
  try { context = canvas.getContext('2d'); } catch { context = null; }
  if (!context) {
    canvas.hidden = true; pauseButton.hidden = true;
    return { setActive() {}, dispose() {} };
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const glyphs = '01シネハマテラ79';
  let frame = 0, previous = -Infinity, sceneTime = 0;
  let active = false, paused = false, disposed = false;

  function draw(ms) {
    if (disposed || !active || document.hidden) return;
    const cssWidth = canvas.clientWidth || 220, cssHeight = canvas.clientHeight || 180;
    // El navegador escala esta superficie: 4K no multiplica ni píxeles ni glifos.
    const fit = Math.min(1, 1100 / cssWidth, 900 / cssHeight);
    const width = cssWidth * fit, height = cssHeight * fit;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth; canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#000703'; context.fillRect(0, 0, width, height);

    sceneTime = ms;
    const time = ms / 1000, landscape = width > height * 1.1;
    // El panel está a la derecha en escritorio y debajo del rostro en móvil.
    const cx = width * (landscape ? .35 : .5);
    const cy = height * (landscape ? .48 : .33);
    const scale = landscape ? Math.min(width * .43, height * .49) : Math.min(width * .72, height * .33);
    const columns = Math.min(64, Math.max(18, Math.ceil(width / 13)));
    const rows = Math.min(42, Math.max(18, Math.ceil(height / 16)));
    const stepX = width / columns, stepY = height / rows;
    context.textAlign = 'center';
    context.font = `${Math.max(8, Math.min(16, stepX * .8))}px monospace`;

    // Dos velocidades de caída y cabezas blancas producen profundidad sin más capas.
    for (let column = 0; column < columns; column++) {
      const head = ((time * (5 + column % 7) + column * 2.71) % (rows + 9));
      for (let row = 0; row < rows; row++) {
        const x = (column + .5) * stepX, y = (row + .5) * stepY;
        const distance = (head - row + rows + 9) % (rows + 9);
        const withinFace = ((x - cx) / (scale * .87)) ** 2 + ((y - cy) / (scale * 1.15)) ** 2 < 1;
        const alpha = (distance < 1.1 ? .95 : distance < 7 ? .48 - distance * .045 : .075) * (withinFace ? .18 : 1);
        context.fillStyle = distance < 1.1 && !withinFace ? '#bbffce' : `rgba(25,235,104,${alpha})`;
        context.fillText(glyphs[(column * 3 + row * 5 + Math.floor(time * 11)) % glyphs.length], x, y);
      }
    }

    const laugh = .5 + .5 * Math.sin(time * 5.8);
    const yaw = Math.sin(time * .72) * .11, lift = Math.sin(time * 5.8) * .014;
    const mouthY = .47, mouthHeight = .035 + laugh * .13, mouthWidth = .34 + laugh * .025;
    context.font = `${Math.max(7, Math.min(32, scale * .068))}px monospace`;

    // Una superficie de profundidad fija mantiene el presupuesto gráfico estable.
    for (let row = 0; row < 47; row++) for (let column = 0; column < 35; column++) {
      const x = (column - 17) / 20, y = row / 46 * 2.22 - 1.12;
      let halfWidth;
      if (y < -.72) halfWidth = .73 * Math.sqrt(Math.max(0, 1 - ((y + .72) / .44) ** 2));
      else if (y < .22) halfWidth = .78 - Math.max(0, -y - .35) * .13;
      else halfWidth = .78 - (y - .22) * .48;
      if (halfWidth <= 0 || Math.abs(x) > halfWidth) continue;
      const dome = Math.sqrt(Math.max(0, 1 - (x / halfWidth) ** 2));
      const nose = Math.exp(-x * x / .016) * Math.exp(-((y + .005) ** 2) / .12);
      const z = dome * .62 + nose * .27;
      const hair = y < -.76 + x * .10;
      const glasses = y > -.44 && y < -.15 && Math.abs(x) > .11 && Math.abs(x) < .71;
      const frameEdge = glasses && (y < -.39 || y > -.21 || Math.abs(x) < .17 || Math.abs(x) > .65);
      const bridge = Math.abs(x) < .13 && y > -.34 && y < -.27;
      const mouth = (x / mouthWidth) ** 2 + ((y - mouthY) / mouthHeight) ** 2 < 1;
      const teeth = mouth && y < mouthY - mouthHeight * .24 && y > mouthY - mouthHeight * .72;
      const jaw = y > .22 && halfWidth - Math.abs(x) < .065;
      const ridge = (Math.abs(x) < .065 && y > -.18 && y < .19) || (y > .18 && y < .23 && Math.abs(x) < .19);
      const alpha = .30 + dome * .59 + Math.max(0, -x) * .12;
      let color = `rgba(66,255,135,${alpha})`;
      if (hair) color = `rgba(13,159,72,${.24 + dome * .32})`;
      if (glasses) color = frameEdge ? '#80ffae' : (x > .3 && y < -.3 ? '#176f3c' : '#021609');
      if (bridge || jaw || ridge) color = '#9affbc';
      if (mouth) color = teeth ? '#e2ffe8' : '#001007';
      const px = cx + (x * Math.cos(yaw) + z * Math.sin(yaw)) * scale;
      const py = cy + (y + lift) * scale;
      context.fillStyle = color;
      context.fillText(glyphs[(row * 7 + column * 3 + Math.floor(time * 12)) % glyphs.length], px, py);
    }

    // Cuello, cuello de camisa, solapas y corbata completan la silueta del agente.
    for (let row = 0; row < 12; row++) for (let column = -22; column <= 22; column++) {
      const x = column * .055, y = .88 + row * .065;
      if (Math.abs(x) > .28 + row * .085) continue;
      const neck = row < 3 && Math.abs(x) < .25;
      const collar = row >= 2 && row < 6 && Math.abs(Math.abs(x) - (row - 1) * .047) < .08;
      const tie = row >= 4 && Math.abs(x) < .075;
      context.fillStyle = tie ? '#a4ffbf' : collar ? '#64dd92' : neck ? '#3cbf75' : '#0c542b';
      context.fillText(glyphs[(row + column + 44) % glyphs.length], cx + x * scale, cy + y * scale);
    }
  }

  function tick(now) {
    frame = 0;
    if (disposed || !active || paused || reduced.matches || document.hidden) return;
    if (now - previous >= 50) { previous = now; draw(now); }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (disposed) return;
    cancelAnimationFrame(frame); frame = 0;
    pauseButton.disabled = reduced.matches;
    pauseButton.textContent = reduced.matches ? 'Movimiento reducido' : paused ? 'Reanudar lluvia' : 'Pausar lluvia';
    pauseButton.setAttribute('aria-pressed', String(paused || reduced.matches));
    if (!active || document.hidden) return;
    const now = reduced.matches ? 0 : paused ? sceneTime : performance.now();
    draw(now); previous = now;
    if (!paused && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function toggle() { if (!disposed) { paused = !paused; sync(); } }
  pauseButton.addEventListener('click', toggle);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  const observer = new ResizeObserver(sync); observer.observe(canvas);
  return {
    setActive(next) { if (disposed || next === active) return; active = next; sync(); },
    dispose() {
      if (disposed) return;
      disposed = true; active = false;
      cancelAnimationFrame(frame); frame = 0;
      observer.disconnect();
      pauseButton.removeEventListener('click', toggle);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    },
  };
}
