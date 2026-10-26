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
  return `
    <footer class="site-footer">
      <span>© 2026 Miguel Miranda</span>
      <span class="footer-context">PROYECTO ACADÉMICO / HENRY M3</span>
      <div class="footer-links">
        <a href="/about">Acerca del proyecto ${arrow}</a>
        <a href="https://github.com/MiguelMirandaV/chat-morfeo-m3" target="_blank" rel="noopener noreferrer" aria-label="GitHub del proyecto (abre en otra pestaña)">GitHub ${arrow}</a>
      </div>
    </footer>`;
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

/** El efecto pertenece a Home; el router llama a su cleanup antes de cambiar de vista. */
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

const views = {
  '/home': ['home', renderHomeView, 'Inicio'],
  '/chat': ['chat', renderChatView, 'Chat'],
  '/about': ['about', renderAboutView, 'Acerca de'],
};

export function normalizePathname(pathname) {
  const path = pathname.replace(/\/+$/, '');
  return path || '/home';
}

export function resolveRoute(pathname) {
  const path = normalizePathname(pathname);
  const [page, render, title] = views[path] ?? ['not-found', renderNotFoundView, 'Ruta no encontrada'];
  return { path, page, render, title: `${title} · Chat con Morfeo` };
}

/** Devuelve una URL interna solo cuando el click debe pertenecer a la SPA. */
export function getSpaDestination({ href, target, download, button, modified, defaultPrevented }, currentHref) {
  if (defaultPrevented || button !== 0 || modified || download || !href) return null;
  if (target && target.toLowerCase() !== '_self') return null;
  if (href.startsWith('#')) return null;

  const current = new URL(currentHref);
  const destination = new URL(href, current);
  if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== current.origin) return null;

  // La API y los archivos se solicitan al servidor; no representan vistas del cliente.
  if (/^\/(api|_vercel)(\/|$)/.test(destination.pathname) || destination.pathname.includes('.')) return null;
  if (destination.pathname === current.pathname && destination.search === current.search && destination.hash) return null;
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

let cleanupCurrentView = () => {};
let renderedLocation = '';

function renderRoute({ moveFocus = false } = {}) {
  const route = resolveRoute(window.location.pathname);
  if (route.path !== window.location.pathname) {
    // Corrige / y las barras finales sin añadir una entrada al historial.
    window.history.replaceState(null, '', `${route.path}${window.location.search}${window.location.hash}`);
  }

  cleanupCurrentView();
  cleanupCurrentView = () => {};
  document.title = route.title;
  document.body.dataset.page = route.page;
  renderedLocation = `${route.path}${window.location.search}`;
  document.querySelector('#app').innerHTML = `${header(route.page)}${route.render()}${footer()}`;
  if (route.page === 'home') {
    cleanupCurrentView = startMatrixRain(document.querySelector('.matrix-rain'), document.querySelector('.motion-control'));
  } else if (route.page === 'chat') {
    cleanupCurrentView = setupComposerPreview();
  }

  if (moveFocus) {
    document.querySelector('main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (window.location.hash) {
      // getElementById no interpreta el fragmento como un selector CSS.
      let fragment;
      try { fragment = decodeURIComponent(window.location.hash.slice(1)); }
      catch { fragment = window.location.hash.slice(1); }
      document.getElementById(fragment)?.scrollIntoView();
    }
  }
}

export function navigateTo(destination, browserWindow = window, render = renderRoute) {
  const current = new URL(browserWindow.location.href);
  const next = new URL(destination, current);
  if (next.origin !== current.origin || !['http:', 'https:'].includes(next.protocol)) {
    throw new Error('La navegación SPA requiere una ruta del mismo origen.');
  }
  next.pathname = normalizePathname(next.pathname);
  const currentPath = `${current.pathname}${current.search}${current.hash}`;
  const nextPath = `${next.pathname}${next.search}${next.hash}`;
  if (nextPath === currentPath) return;

  browserWindow.history.pushState(null, '', nextPath);
  // pushState no dispara popstate: la navegación programática debe renderizar aquí.
  render({ moveFocus: true });
}

function handleNavigation(event) {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest('a[href]');
  if (!link) return;
  const destination = getSpaDestination({
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    download: link.hasAttribute('download'),
    button: event.button,
    modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
    defaultPrevented: event.defaultPrevented,
  }, window.location.href);
  if (destination === null) return;
  event.preventDefault();
  navigateTo(destination);
}

function initializeApp() {
  document.addEventListener('click', handleNavigation);
  // Un solo listener; renderRoute nunca añade entradas al retroceder o avanzar.
  window.addEventListener('popstate', () => {
    // Los cambios de ancla nativos no deben desmontar una vista que sigue siendo la misma.
    if (`${window.location.pathname}${window.location.search}` === renderedLocation) return;
    renderRoute({ moveFocus: true });
  });
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanupCurrentView();
  });
  renderRoute();
}

// Permite probar las funciones del router en Node sin montar una página ni simular el DOM.
if (typeof document !== 'undefined' && document.querySelector('#app')) initializeApp();
