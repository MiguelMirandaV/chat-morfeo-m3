import { countCharacters, MAX_MESSAGE_LENGTH } from './utils.js';

const arrow = '<span aria-hidden="true">↗</span>';

function header(activePage) {
  const links = [['home', '01', 'Inicio'], ['chat', '02', 'Chat'], ['about', '03', 'Acerca de']];
  return `
    <header class="site-header">
      <a class="brand" href="/home" aria-label="Morfeo, ir a Inicio">
        <span class="brand-mark" aria-hidden="true">M<span>_</span></span>
        <span class="brand-name">MORFEO<span>THE MATRIX</span></span>
      </a>
      <nav class="site-nav" aria-label="Navegación principal">
        ${links.map(([page, number, label]) => `
          <a href="/${page}" ${page === activePage ? 'aria-current="page"' : ''}>
            <span class="nav-number" aria-hidden="true">${number}</span>${label}
          </a>`).join('')}
      </nav>
    </header>`;
}

function footer() {
  return `<footer class="site-footer"><span>PROYECTO ACADÉMICO <span aria-hidden="true">/</span> HENRY M3</span><a href="/about">Acerca del proyecto ${arrow}</a></footer>`;
}

function renderHomeView() {
  return `
    <main id="main-content" class="home-view" tabindex="-1">
      <div class="matrix-rain" aria-hidden="true"></div>
      <div class="home-grid page-width">
        <section class="hero-copy" aria-labelledby="home-title">
          <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span>EL OTRO LADO DE LA PANTALLA</p>
          <h1 id="home-title">Cuestiona<br>lo que <span>ves.</span></h1>
          <p class="hero-description">Una conversación con Morfeo sobre la realidad, la libertad y el poder de elegir.</p>
          <a class="button button-primary" href="/chat">Iniciar conversación <span aria-hidden="true">→</span></a>
          <p class="hero-caption">Tú haces la primera pregunta.</p>
        </section>
        <aside class="terminal home-terminal" aria-label="Ejemplo ilustrativo de una conversación con Morfeo">
          <div class="terminal-bar"><span><span class="terminal-square" aria-hidden="true"></span>morpheus / terminal</span><span class="terminal-bar-end" aria-hidden="true">[ _ ]</span></div>
          <div class="terminal-intro"><span class="eyebrow">UNA PRIMERA PREGUNTA</span><span class="terminal-line" aria-hidden="true"></span></div>
          <div class="sample-transcript">
            <article class="message message--morpheus"><p class="message-author">MORFEO <span aria-hidden="true">&gt;</span></p><p>Toda elección comienza con una pregunta.</p></article>
            <article class="message message--user"><p class="message-author">TÚ <span aria-hidden="true">&gt;</span></p><p>¿Por dónde empiezo?</p></article>
            <article class="message message--morpheus"><p class="message-author">MORFEO <span aria-hidden="true">&gt;</span></p><p>Por aquello que das por cierto.</p></article>
          </div>
          <div class="terminal-footnote"><span aria-hidden="true">&gt;_</span> Ejemplo ilustrativo</div>
        </aside>
      </div>
      <div class="home-bottom page-width">
        <span class="home-note"><span aria-hidden="true">[</span> La conversación dura hasta que recargues. <span aria-hidden="true">]</span></span>
        <button class="motion-control" type="button" aria-pressed="false">Pausar animación <span aria-hidden="true">Ⅱ</span></button>
      </div>
    </main>`;
}

function renderChatView() {
  return `
    <main id="main-content" class="chat-view page-width" tabindex="-1">
      <div class="page-heading"><div><p class="eyebrow">DEL OTRO LADO, MORFEO</p><h1>Tu conversación<span class="text-accent">.</span></h1></div><p class="heading-aside">Un mensaje puede<br>abrir otra perspectiva.</p></div>
      <section class="terminal chat-terminal" aria-label="Conversación con Morfeo">
        <div class="terminal-bar"><span><span class="terminal-square" aria-hidden="true"></span>morpheus / chat</span><span class="terminal-bar-end">SESIÓN EN MEMORIA</span></div>
        <div class="chat-log" role="log" aria-label="Mensajes de la conversación" aria-live="polite" aria-relevant="additions text">
          <div class="empty-state"><span class="empty-symbol" aria-hidden="true">&gt;_</span><h2>Todo empieza con una pregunta.</h2><p>Escribe lo que tienes en mente.<br>Este espacio será tu conversación con Morfeo.</p></div>
        </div>
        <p class="chat-status" role="status">Vista previa · El envío aún no está disponible.</p>
        <form class="composer" aria-label="Escribir un mensaje">
          <div class="composer-top"><label for="message-input">TU MENSAJE <span aria-hidden="true">&gt;</span></label><output id="character-count" for="message-input" aria-label="Caracteres escritos">0 / ${MAX_MESSAGE_LENGTH}</output></div>
          <textarea id="message-input" name="message" rows="3" placeholder="¿Qué te gustaría preguntarle a Morfeo?" aria-describedby="message-help message-error" spellcheck="true"></textarea>
          <p id="message-error" class="input-error" role="status" hidden></p>
          <div class="composer-bottom"><p id="message-help">Máximo ${MAX_MESSAGE_LENGTH} caracteres.<br>Enter agrega una nueva línea.</p><button class="button button-primary" type="submit" disabled>Enviar <span aria-hidden="true">↗</span></button></div>
        </form>
      </section>
      <p class="chat-caption">El historial permanece al navegar y se borra al recargar la página.</p>
    </main>`;
}

function renderAboutView() {
  return `
    <main id="main-content" class="about-view page-width" tabindex="-1">
      <div class="page-heading"><div><p class="eyebrow">DETRÁS DE LA TERMINAL</p><h1>Acerca del proyecto<span class="text-accent">.</span></h1></div><span class="section-index" aria-hidden="true">03 / ABOUT</span></div>
      <div class="about-grid">
        <section class="about-character" aria-labelledby="character-title">
          <p class="eyebrow">EL PERSONAJE</p><h2 id="character-title">Morfeo<span class="text-accent">_</span></h2>
          <p>Sereno, firme y convencido de que aprender comienza por cuestionar. Morfeo guía a Neo a través de una realidad que nunca había imaginado.</p>
          <p>Esta interpretación se inspira en el personaje de <cite>The Matrix (1999)</cite>: su manera de hacer preguntas, sus metáforas y su confianza en la libertad de elegir.</p>
          <div class="character-facts"><div><span>UNIVERSO</span><strong>The Matrix</strong></div><div><span>VOZ</span><strong>Español · Reflexiva</strong></div></div>
          <a class="text-link" href="/chat">Volver a las preguntas ${arrow}</a>
        </section>
        <div class="about-details">
          <section class="detail-section" aria-labelledby="project-title"><span class="detail-number" aria-hidden="true">01</span><div><h2 id="project-title">Una experiencia de aprendizaje</h2><p>Proyecto Integrador del Módulo 3 de Full Stack de Henry. Desarrollado por Miguel Miranda con asistencia de Codex para explorar interfaces responsive, navegación SPA e integración de inteligencia artificial.</p></div></section>
          <section class="detail-section" aria-labelledby="tech-title"><span class="detail-number" aria-hidden="true">02</span><div><h2 id="tech-title">Cómo está construido</h2><p>HTML, CSS y JavaScript con módulos. El proyecto integra Gemini a través de una función de Vercel para mantener la clave en el servidor, y utiliza Vitest para probar su lógica.</p><ul class="tech-list" aria-label="Tecnologías"><li>JavaScript</li><li>Gemini</li><li>Vercel</li><li>Vitest</li></ul></div></section>
          <section class="detail-section" aria-labelledby="session-title"><span class="detail-number" aria-hidden="true">03</span><div><h2 id="session-title">Una conversación, una sesión</h2><p>Los mensajes se conservan en memoria hasta que recargas la aplicación. Cada mensaje tuyo admite hasta 280 caracteres. Las respuestas son una interpretación del personaje generada por IA.</p></div></section>
        </div>
      </div>
    </main>`;
}

function renderNotFoundView() {
  return `<main id="main-content" class="not-found page-width" tabindex="-1"><p class="eyebrow">404 / RUTA NO ENCONTRADA</p><h1>Este camino<br>no existe<span class="text-accent">.</span></h1><p>Puedes regresar al inicio y elegir otra dirección.</p><a class="button button-primary" href="/home">Volver a Inicio <span aria-hidden="true">→</span></a></main>`;
}

/** El efecto pertenece a Home; su cleanup podrá reutilizarse con el router SPA. */
function startMatrixRain(container, control) {
  const characters = Array.from('アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pausedByUser = false;
  for (let column = 0; column < 28; column += 1) {
    const stream = document.createElement('span');
    stream.className = 'matrix-stream';
    stream.textContent = Array.from({ length: 14 + Math.floor(Math.random() * 14) }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    stream.style.setProperty('--column', `${((column + 0.5) / 28) * 100}%`);
    stream.style.setProperty('--duration', `${10 + Math.random() * 14}s`);
    stream.style.setProperty('--delay', `${-Math.random() * 24}s`);
    container.append(stream);
  }
  const observer = new ResizeObserver(([entry]) => {
    container.style.setProperty('--rain-travel', `${entry.contentRect.height}px`);
  });
  observer.observe(container);
  function syncMotion() {
    container.classList.toggle('is-paused', pausedByUser || document.hidden);
    control.disabled = reducedMotion.matches;
    control.setAttribute('aria-pressed', String(pausedByUser));
    control.textContent = reducedMotion.matches ? 'Movimiento reducido' : pausedByUser ? 'Reanudar animación ▶' : 'Pausar animación Ⅱ';
  }
  function toggleMotion() { pausedByUser = !pausedByUser; syncMotion(); }
  control.addEventListener('click', toggleMotion);
  reducedMotion.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  syncMotion();
  return () => {
    observer.disconnect();
    control.removeEventListener('click', toggleMotion);
    reducedMotion.removeEventListener('change', syncMotion);
    document.removeEventListener('visibilitychange', syncMotion);
    container.replaceChildren();
  };
}

function setupComposerPreview() {
  const form = document.querySelector('.composer');
  const input = form.querySelector('textarea');
  const counter = form.querySelector('output');
  const error = form.querySelector('.input-error');
  function updateCounter() {
    const length = countCharacters(input.value);
    const tooLong = length > MAX_MESSAGE_LENGTH;
    counter.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;
    counter.classList.toggle('is-over-limit', tooLong);
    input.setAttribute('aria-invalid', String(tooLong));
    error.hidden = !tooLong;
    error.textContent = tooLong ? `Tu mensaje supera el límite de ${MAX_MESSAGE_LENGTH} caracteres.` : '';
  }
  function preventPreviewSubmit(event) { event.preventDefault(); }
  input.addEventListener('input', updateCounter);
  form.addEventListener('submit', preventPreviewSubmit);
  return () => { input.removeEventListener('input', updateCounter); form.removeEventListener('submit', preventPreviewSubmit); };
}

// La maqueta usa enlaces nativos. La intercepción con History API llega en el paso 4.
const views = {
  '/': ['home', renderHomeView, 'Inicio'],
  '/home': ['home', renderHomeView, 'Inicio'],
  '/chat': ['chat', renderChatView, 'Chat'],
  '/about': ['about', renderAboutView, 'Acerca de'],
};

function mountPreview() {
  const [page, render, title] = views[window.location.pathname] ?? ['not-found', renderNotFoundView, 'Ruta no encontrada'];
  document.title = `${title} · Chat con Morfeo`;
  document.body.dataset.page = page;
  document.querySelector('#app').innerHTML = `${header(page)}${render()}${footer()}`;
  let cleanup = () => {};
  if (page === 'home') cleanup = startMatrixRain(document.querySelector('.matrix-rain'), document.querySelector('.motion-control'));
  if (page === 'chat') cleanup = setupComposerPreview();
  // El navegador puede conservar la página al usar Atrás: en ese caso preservamos el efecto.
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanup();
  });
}

mountPreview();
