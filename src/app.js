import { MAX_MESSAGE_LENGTH } from './utils.js';
import { mountChat, mountAccess } from './chat.js';

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

function accessForm(id) {
  return `<form class="access-form" aria-label="Desbloquear el canal">
    <div data-access-fields><label for="${id}">CÓDIGO DE ACCESO / COHORTE HENRY</label>
    <div class="access-input"><span aria-hidden="true">&gt;_</span><input id="${id}" name="cohort" inputmode="numeric" pattern="[0-9]+" required autocomplete="off" placeholder="Tu número de cohorte" aria-describedby="${id}-error"></div></div>
    <p class="input-error" id="${id}-error" data-access-error role="status" hidden></p>
    <button class="button button-primary" type="submit">DESBLOQUEAR ↗</button>
  </form>`;
}

function renderHomeView() {
  return `<main id="main-content" class="home-view" tabindex="-1">
    <div class="matrix-rain" aria-hidden="true"></div>
    <div class="home-grid page-width">
      <section class="hero-copy" aria-labelledby="home-title">
        <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span>TRANSMISIÓN ENCRIPTADA / HENRY M3</p>
        <p class="boot-line">Wake up, Neo<span aria-hidden="true">_</span></p>
        <h1 id="home-title">LA REALIDAD<br>ES UNA<br><span>ELECCIÓN.</span></h1>
        <p class="hero-description">Has encontrado la señal. Morfeo te espera al otro lado. Introduce tu cohorte y cruza el umbral.</p>
        ${accessForm('home-cohort')}
        <p class="hero-caption">ACCESO RESTRINGIDO · UNA CONVERSACIÓN CON MORFEO</p>
      </section>
      <figure class="morpheus-stage" aria-label="Retrato tridimensional de Morfeo">
        <div class="portrait-target" aria-hidden="true"></div>
        <div class="portrait-depth"><img class="morpheus-portrait" src="/assets/morpheus-closed.png" alt="Morfeo con gafas oscuras, iluminado por la lluvia de código verde" width="1024" height="1024" fetchpriority="high"></div>
        <figcaption><span>SUBJECT / MORPHEUS</span><span>LINK ESTABLISHED <b>●</b></span></figcaption>
        <span class="portrait-coordinate" aria-hidden="true">ZION_NET // 079<br>35° 41′ 22″ N</span>
      </figure>
    </div>
    <div class="home-bottom page-width"><span class="home-note">[ FOLLOW THE WHITE RABBIT. ]<br>Tu historial desaparece al recargar.</span><button class="motion-control" type="button" aria-pressed="false">Pausar animación Ⅱ</button></div>
  </main>`;
}

function renderChatView() {
  return `<main id="main-content" class="chat-view page-width" tabindex="-1">
    <div class="page-heading"><div><p class="eyebrow">ZION / CANAL PRIVADO</p><h1>Más allá del código<span class="text-accent">_</span></h1></div><p class="heading-aside">CONEXIÓN CON MORFEO<br>COHORTE HENRY 79</p></div>
    <div class="chat-layout">
      <aside class="signal-panel" aria-label="Estado y solicitudes de esta app">
        <div class="signal-portrait"><img src="/assets/morpheus-closed.png" alt="Morfeo" width="1024" height="1024"><span>MORPHEUS / 01</span></div>
        <p class="eyebrow">SOLICITUDES DE ESTA APP</p>
        <div class="quota-item"><p>ÚLTIMO MINUTO <strong data-minute-quota>— / 15</strong></p><div class="quota-bar" data-minute-bar></div></div>
        <div class="quota-item"><p>HOY <strong data-day-quota>— / 500</strong></p><div class="quota-bar" data-day-bar></div></div>
        <p class="quota-note">Contador compartido. El día reinicia a medianoche del Pacífico. Google puede aplicar otros límites.</p>
        <div class="signal-quote">“Free your mind.”<span>— MORPHEUS</span></div>
      </aside>
      <section class="terminal chat-terminal" aria-label="Conversación con Morfeo">
        <div class="terminal-bar"><span><span class="terminal-square" aria-hidden="true"></span>morpheus@zion:~</span><span class="terminal-bar-end">SECURE CHANNEL</span></div>
        <div class="chat-gate" data-chat-gate><span class="gate-symbol" aria-hidden="true">[ × ]</span><p class="eyebrow">IDENTIFICACIÓN REQUERIDA</p><h2>La puerta está cerrada.</h2><p>Introduce el número de tu cohorte de Henry para abrir el canal.</p>${accessForm('chat-cohort')}</div>
        <div class="chat-console" data-chat-console hidden>
          <div class="chat-log" role="log" aria-label="Mensajes de la conversación" aria-live="polite" aria-relevant="additions text"><div class="empty-state"><span class="empty-symbol" aria-hidden="true">&gt;_</span><h2>Te estaba esperando.</h2><p>Hay una diferencia entre conocer el camino<br>y recorrerlo. Haz tu primera pregunta.</p></div></div>
          <div class="smith-intrusion" hidden><img class="smith-face" loading="lazy" src="/assets/agent-smith.png" alt="" width="1024" height="1024"><div><p class="eyebrow">INTRUSIÓN DETECTADA / AGENTE SMITH</p><h2>Señor Anderson…</h2><p>El canal ha alcanzado su límite.<br>Recuperación en <strong data-smith-countdown>60 s</strong>.</p><small>Efecto visual de la historia. Tu mensaje sigue en el campo.</small></div></div>
          <p class="chat-status" role="status">CONECTANDO…</p>
          <form class="composer" aria-label="Escribir un mensaje">
            <div class="composer-top"><label for="message-input">TU MENSAJE &gt;</label><output id="character-count" for="message-input" aria-label="Caracteres escritos">0 / ${MAX_MESSAGE_LENGTH}</output></div>
            <textarea id="message-input" name="message" rows="3" placeholder="Escribe a Morfeo…" aria-describedby="message-help message-error" spellcheck="true"></textarea>
            <p id="message-error" class="input-error" role="status" hidden></p>
            <div class="composer-bottom"><p id="message-help">Máximo ${MAX_MESSAGE_LENGTH} caracteres.<br>Enter agrega una nueva línea.</p><button class="button button-primary" type="submit" disabled>ENVIAR ↗</button></div>
          </form>
        </div>
      </section>
    </div>
    <p class="chat-caption">IA generativa · Interpretación ficticia de Morfeo. Historial en memoria: se borra al recargar.</p>
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
          <section class="detail-section" aria-labelledby="tech-title"><span class="detail-number" aria-hidden="true">02</span><div><h2 id="tech-title">Cómo está construido</h2><p>HTML, CSS y JavaScript con módulos, con pruebas de lógica en Vitest. El chat se comunica con una función de Vercel. Gemini genera las respuestas; su clave permanece en el servidor. El acceso se valida con una cookie firmada y los límites se comprueban antes de cada solicitud.</p><ul class="tech-list" aria-label="Tecnologías"><li>JavaScript</li><li>Gemini</li><li>Vercel</li><li>Vitest</li></ul></div></section>
          <section class="detail-section" aria-labelledby="session-title"><span class="detail-number" aria-hidden="true">03</span><div><h2 id="session-title">Una conversación, una sesión</h2><p>Los mensajes se conservan en memoria hasta que recargas la aplicación. Cada mensaje tuyo admite hasta 280 caracteres. Gemini recibe el historial completo para responder con contexto. El código de cohorte abre una sesión compartida de acceso: no identifica personas. Los contadores guardan cantidades y tiempos, nunca conversaciones.</p></div></section>
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
  for (let column = 0; column < 64; column += 1) {
    const stream = document.createElement('span');
    stream.className = 'matrix-stream';
    stream.textContent = Array.from({ length: 14 + Math.floor(Math.random() * 14) }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    stream.style.setProperty('--column', `${((column + 0.5) / 64) * 100}%`);
    stream.style.setProperty('--duration', `${3 + Math.random() * 5}s`);
    stream.style.setProperty('--delay', `${-Math.random() * 8}s`);
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

let cancelPortal = () => {};
/** Crossfade de la boca y cámara hacia su centro; el cleanup evita navegar tras salir. */
function enterPortal(destination) {
  if (document.querySelector('.mouth-portal')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { navigateTo(destination); return; }
  const source = document.querySelector('.morpheus-portrait');
  if (!source) { navigateTo(destination); return; }
  const rect = source.getBoundingClientRect();
  const portal = document.createElement('div');
  portal.className = 'mouth-portal';
  portal.innerHTML = `<div class="portal-camera"><img class="portal-closed" src="/assets/morpheus-closed.png" alt=""><img class="portal-open" src="/assets/morpheus-open.png" alt=""><div class="portal-mouth"></div></div><p role="status">CRUZANDO EL UMBRAL…</p><button type="button">Omitir transición ↗</button>`;
  const camera = portal.querySelector('.portal-camera');
  Object.assign(camera.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  camera.style.setProperty('--portal-x', `${window.innerWidth / 2 - (rect.left + rect.width * .51)}px`);
  camera.style.setProperty('--portal-y', `${window.innerHeight / 2 - (rect.top + rect.height * .59)}px`);
  camera.style.setProperty('--portal-scale', Math.max(window.innerWidth, window.innerHeight) / Math.max(1, rect.width) * 28);
  document.body.append(portal);
  let timer;
  const skipKey = (event) => { if (event.key === 'Escape') finish(); };
  document.addEventListener('keydown', skipKey);
  const finish = () => { cancelPortal(); navigateTo(destination); };
  portal.querySelector('button').addEventListener('click', finish);
  cancelPortal = () => { clearTimeout(timer); document.removeEventListener('keydown', skipKey); portal.remove(); cancelPortal = () => {}; };
  timer = setTimeout(finish, 1800);
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
    const openPortrait = new Image(); openPortrait.src = '/assets/morpheus-open.png';
    const cleanRain = startMatrixRain(document.querySelector('.matrix-rain'), document.querySelector('.motion-control'));
    const cleanAccess = mountAccess(document.querySelector('.access-form'), () => enterPortal('/chat'));
    cleanupCurrentView = () => { cleanRain(); cleanAccess(); cancelPortal(); };
  } else if (route.page === 'chat') {
    cleanupCurrentView = mountChat(document.querySelector('.chat-view'));
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
  if (document.body.dataset.page === 'home' && normalizePathname(new URL(destination, window.location.href).pathname) === '/chat') enterPortal(destination);
  else navigateTo(destination);
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
