/** Escena exclusiva de Inicio. Todos los rasgos se dibujan con código, sin retratos. */
const GLYPHS = Array.from('アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789ZION');
const gaussian = (x, center, width) => Math.exp(-(((x - center) / width) ** 2));

function createFace() {
  const points = [];
  for (let y = -1.65; y < 2.05; y += .055) {
    const v = (y - .2) / 1.88;
    const width = 1.23 * Math.sqrt(Math.max(0, 1 - v * v)) * (y < -.6 ? .88 : 1);
    for (let x = -width; x < width; x += .044) {
      const oval = Math.sqrt(Math.max(0, 1 - (x / width) ** 2));
      let z = .58 * oval;
      // Volumen de nariz, pómulos, frente, labios y mentón.
      z += .48 * gaussian(x, 0, .19) * gaussian(y, -.06, .53);
      z += .14 * gaussian(Math.abs(x), .67, .32) * gaussian(y, -.38, .4);
      z += .12 * gaussian(x, 0, .6) * gaussian(y, -1.22, .24);
      z += .13 * gaussian(x, 0, .45) * gaussian(y, -.79, .1);
      const lens = ((Math.abs(x) - .58) / .43) ** 2 + ((y - .44) / .245) ** 2;
      const bridge = Math.abs(x) < .18 && Math.abs(y - .49) < .035;
      const rim = lens > .88 && lens < 1.17;
      const mouth = Math.abs(y + .89) < .035 && Math.abs(x) < .4;
      if (mouth || (lens < .88 && !bridge)) continue;
      const nostril = gaussian(Math.abs(x), .13, .065) * gaussian(y, -.32, .06);
      const noseShadow = gaussian(x, 0, .32) * gaussian(y, -.39, .08);
      const lip = gaussian(x, 0, .38) * gaussian(y, -.78, .055);
      const brightness = rim || bridge ? 4.2 : Math.max(.12,
        (.6 + .85 * oval + .5 * gaussian(x, -.65, .6) + lip * .7 + .6 * gaussian(x, -.055, .11) * gaussian(y, -.05, .4))
        * (1 - nostril * .9) * (1 - noseShadow * .8));
      if (rim || bridge) z += .1;
      points.push({ x, y, z, brightness, phase: Math.random(), glyph: Math.floor(Math.random() * GLYPHS.length) });
    }
  }
  // Cuello y hombros: líneas de código que anclan el rostro al campo de lluvia.
  for (let y = -2.55; y < -1.5; y += .065) {
    const width = .52 + (-y - 1.5) * 1.48;
    for (let x = -width; x < width; x += .055) {
      points.push({ x, y, z: -.22 + .26 * Math.cos(x), brightness: .16, phase: Math.random(), glyph: Math.floor(Math.random() * GLYPHS.length) });
    }
  }
  return points;
}

function drawFallback(canvas, points, time, progress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#000603'; ctx.fillRect(0, 0, w, h);
  const scale = Math.min(w / 3.7, h / 6.8) * (1 + progress * 18);
  ctx.textAlign = 'center'; ctx.font = `${Math.max(7, scale * .04)}px monospace`;
  for (let col = 0; col < w / 16; col++) {
    for (let row = 0; row < h / 19; row++) {
      const band = (row + time * 6 + col * 1.73) % 24;
      ctx.fillStyle = `rgba(24,220,82,${.03 + .2 * band / 24})`;
      ctx.fillText(GLYPHS[(col * 7 + row) % GLYPHS.length], col * 16, row * 19);
    }
  }
  for (const point of points) {
    let y = point.y;
    if (y < -.89) y -= progress * Math.min(1, (-.89 - y) * 5);
    ctx.fillStyle = `rgba(90,255,142,${Math.min(1, point.brightness * (.65 + .3 * Math.sin(time * 2 + point.phase * 7)))})`;
    ctx.fillText(GLYPHS[point.glyph], w / 2 + point.x * scale, h * .36 - y * scale);
  }
}

async function createWebGL(canvas, points) {
  const THREE = await import('./vendor/three/three.module.js');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000402);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .03, 50);
  camera.position.set(0, -.15, 8);
  const head = new THREE.Group(); scene.add(head);
  head.position.y = .78;
  const atlasCanvas = document.createElement('canvas'); atlasCanvas.width = 1024; atlasCanvas.height = 32;
  const context = atlasCanvas.getContext('2d');
  context.fillStyle = '#fff'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.font = '24px monospace';
  GLYPHS.slice(0, 32).forEach((glyph, i) => context.fillText(glyph, i * 32 + 16, 16));
  const atlas = new THREE.CanvasTexture(atlasCanvas);
  atlas.minFilter = THREE.LinearFilter; atlas.magFilter = THREE.LinearFilter;
  const uniforms = { time: { value: 0 }, opening: { value: 0 }, pixelScale: { value: 800 }, atlas: { value: atlas } };
  const vertexShader = `
    uniform float time; uniform float opening; uniform float pixelScale;
    attribute float brightness; attribute float phase; attribute float glyph;
    varying float vLight; varying float vGlyph;
    void main() {
      vec3 p = position;
      if(p.y < -.88) p.y -= opening * smoothstep(0., .23, -.88-p.y) * 1.15;
      p.z += sin(p.y*5. + time*1.4 + p.x*2.) * .09;
      p.x += sin(p.y*4. + time*.8) * .025;
      vec4 mv = modelViewMatrix * vec4(p,1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(pixelScale * .062 / max(.05, -mv.z), 1., 70.);
      float stream = fract(p.y*.24 + phase*.2 + time*.21);
      vLight = brightness * (.46 + .54*smoothstep(.15,1.,stream));
      vGlyph = mod(glyph + floor(time*1.7 + phase*6.), 32.);
    }`;
  const fragmentShader = `
    uniform sampler2D atlas; varying float vLight; varying float vGlyph;
    void main(){
      vec2 uv = vec2((vGlyph + gl_PointCoord.x)/32., 1.-gl_PointCoord.y);
      float ink = texture2D(atlas,uv).a;
      if(ink < .08) discard;
      vec3 color = mix(vec3(.05,.9,.26), vec3(.65,1.,.78), clamp(vLight-1.,0.,1.));
      gl_FragColor = vec4(color * vLight, ink);
    }`;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap(p => [p.x,p.y,p.z]), 3));
  for (const field of ['brightness','phase','glyph']) geometry.setAttribute(field, new THREE.Float32BufferAttribute(points.map(p => p[field]), 1));
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false });
  const face = new THREE.Points(geometry, material); head.add(face);
  // El volumen negro oculta la lluvia posterior, conservando huecos oscuros en las gafas.
  const maskGeometry = new THREE.SphereGeometry(1, 32, 24);
  const maskMaterial = new THREE.MeshBasicMaterial({ color: 0x000502 });
  const mask = new THREE.Mesh(maskGeometry, maskMaterial); mask.scale.set(1.16, 1.82, .43); mask.position.set(0, .2, -.1); head.add(mask);
  const rainPositions = [], rainSeeds = [];
  for (let column = 0; column < 180; column++) {
    const x = (Math.random() - .5) * 23, z = -1.5 - Math.random() * 7;
    for (let row = 0; row < 36; row++) { rainPositions.push(x, row * .36 - 6, z); rainSeeds.push(column * 1.73); }
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainPositions, 3));
  rainGeometry.setAttribute('seed', new THREE.Float32BufferAttribute(rainSeeds, 1));
  const rainMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `uniform float time; uniform float pixelScale; attribute float seed; varying float vLight; varying float vGlyph;
      void main(){ vec3 p=position; p.y=mod(p.y-time*(.65+fract(seed)*1.8)+seed,13.)-6.5;
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(pixelScale*.16/-mv.z,2.,23.);
        float trail=fract(position.y*.27+seed);
        vLight=.14+pow(trail,4.)*1.1; vGlyph=mod(floor(seed*5.+position.y*3.+time*2.),32.); }`,
    fragmentShader,
  });
  scene.add(new THREE.Points(rainGeometry, rainMaterial));
  return {
    resize(width, height) {
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
      uniforms.pixelScale.value = height * renderer.getPixelRatio();
    },
    render(time, progress) {
      uniforms.time.value = time; uniforms.opening.value = Math.min(1, progress * 3);
      const zoom = Math.max(0, (progress - .3) / .7) ** 2.5;
      const baseZ = camera.aspect < .7 ? 11.3 : 8;
      camera.position.set(0, -.15 + zoom * .15, baseZ * (1 - zoom) + .72 * zoom);
      head.rotation.y = Math.sin(time * .42) * .24 * (1 - progress);
      head.rotation.z = Math.sin(time * .31) * .025 * (1 - progress);
      head.position.y = .78 + zoom * .27;
      mask.scale.y = 1.82 + Math.min(1, progress * 3) * .35;
      renderer.render(scene, camera);
    },
    dispose() {
      [geometry, material, maskGeometry, maskMaterial, rainGeometry, rainMaterial, atlas].forEach(resource => resource.dispose());
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
}

export function mountMatrixScene(container, control) {
  let canvas = document.createElement('canvas'); container.append(canvas);
  const points = createFace();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let engine, disposed = false, paused = false, frame = 0, last = 0, elapsed = 0, portalStart = null;
  let width = 1, height = 1;
  const contextLost = event => {
    event.preventDefault();
    engine?.dispose(); engine = null;
    canvas.removeEventListener('webglcontextlost', contextLost);
    const replacement = document.createElement('canvas'); canvas.replaceWith(replacement); canvas = replacement;
    container.dataset.renderer = 'fallback'; resize(); sync();
  };
  function resize() {
    const rect = container.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    if (engine) engine.resize(width, height);
    else { canvas.width = Math.round(width); canvas.height = Math.round(height); }
    draw();
  }
  function draw() {
    const progress = portalStart === null ? 0 : Math.min(1, (performance.now() - portalStart) / 2200);
    if (engine) engine.render(elapsed, progress); else drawFallback(canvas, points, elapsed, progress);
  }
  function tick(now) {
    frame = 0;
    if (disposed || document.hidden || ((paused || reducedMotion.matches) && portalStart === null)) return;
    if (now - last >= 1000 / (engine ? 30 : 12)) {
      elapsed += Math.min(.06, (now - last) / 1000); last = now; draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = performance.now();
    control.disabled = reducedMotion.matches;
    control.setAttribute('aria-pressed', String(paused));
    control.textContent = reducedMotion.matches ? 'Movimiento reducido' : paused ? 'Reanudar animación ▶' : 'Pausar animación Ⅱ';
    draw();
    if (!document.hidden && ((!paused && !reducedMotion.matches) || portalStart !== null)) frame = requestAnimationFrame(tick);
  }
  const toggle = () => { paused = !paused; sync(); };
  const observer = new ResizeObserver(resize); observer.observe(container);
  control.addEventListener('click', toggle); reducedMotion.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  container.dataset.renderer = 'loading'; resize(); sync();
  // Se carga únicamente al entrar a Inicio. Si la ruta ya cambió, se libera sin montar.
  const webglCanvas = document.createElement('canvas');
  createWebGL(webglCanvas, points).then(result => {
    if (disposed) { result.dispose(); return; }
    canvas.replaceWith(webglCanvas); canvas = webglCanvas;
    engine = result; canvas.addEventListener('webglcontextlost', contextLost);
    container.dataset.renderer = 'webgl'; resize(); sync();
  }).catch(() => {
    if (disposed) return;
    // Un canvas que intentó crear WebGL no siempre admite luego un contexto 2D.
    const replacement = document.createElement('canvas'); canvas.replaceWith(replacement); canvas = replacement;
    container.dataset.renderer = 'fallback'; resize(); sync();
  });
  return {
    enter() { portalStart = performance.now(); sync(); },
    cancel() { portalStart = null; sync(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost);
      control.removeEventListener('click', toggle); reducedMotion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync);
      engine?.dispose(); container.replaceChildren();
    },
  };
}
