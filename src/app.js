import { MAX_MESSAGE_LENGTH } from './utils.js';
import { mountChat, mountAccess } from './chat.js';
import { mountMatrixScene } from './matrix-scene.js';
import { CHARACTERS } from './characters.js';

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
    <div class="matrix-scene" aria-hidden="true"></div>
    <div class="matrix-vignette" aria-hidden="true"></div>
    <div class="scene-telemetry" aria-hidden="true"><span>ZION MAINFRAME<br>SUBJECT_01 / MORPHEUS</span><span>THE SYSTEM IS A LIE<br>FOLLOW THE WHITE RABBIT</span></div>
    <section class="home-console" aria-labelledby="home-title">
      <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span>SEÑAL ENCONTRADA / CANAL 079</p>
      <h1 id="home-title">Wake up, Neo<span aria-hidden="true">_</span></h1>
      <p class="home-instruction">Introduce el código para establecer acceso seguro.</p>
      ${accessForm('home-cohort')}
      <p class="home-disclaimer">Una puerta. Una elección. Morfeo te espera.</p>
    </section>
    <div class="scene-bottom"><span aria-hidden="true">[ FREE YOUR MIND. ]</span><button class="motion-control" type="button" aria-pressed="false">Pausar animación Ⅱ</button></div>
  </main>`;
}

function renderChatView() {
  return `<main id="main-content" class="chat-view page-width" tabindex="-1">
    <div class="page-heading"><div><p class="eyebrow">ZION / CANAL PRIVADO</p><h1>Más allá del código<span class="text-accent">_</span></h1></div><p class="heading-aside"><span data-channel-name>ELIGE TU CONEXIÓN</span><br>COHORTE HENRY 79</p></div>
    <div class="chat-layout">
      <aside class="signal-panel" aria-label="Estado y solicitudes de esta app">
        <div class="signal-portrait" data-character-portrait><img src="/assets/morpheus-closed.png" alt="Morfeo" width="1024" height="1024"><span>MORPHEUS / 01</span></div>
        <div class="character-emblem" data-character-emblem hidden aria-hidden="true"></div><p class="eyebrow">SOLICITUDES DE ESTA APP</p>
        <div class="quota-item"><p>ÚLTIMO MINUTO <strong data-minute-quota>— / 15</strong></p><div class="quota-bar" data-minute-bar></div></div>
        <div class="quota-item"><p>HOY <strong data-day-quota>— / 500</strong></p><div class="quota-bar" data-day-bar></div></div>
        <p class="quota-note">Contador compartido. El día reinicia a medianoche del Pacífico. Google puede aplicar otros límites.</p>
        <div class="signal-quote" data-character-note>Elige a quien te acompañará.</div>
      </aside>
      <section class="terminal chat-terminal" aria-label="Terminal de conversación">
        <div class="terminal-bar"><span><span class="terminal-square" aria-hidden="true"></span><span data-terminal-name>zion@network:~</span></span><span class="terminal-bar-end">SECURE CHANNEL</span></div>
        <div class="chat-gate" data-chat-gate><span class="gate-symbol" aria-hidden="true">[ × ]</span><p class="eyebrow">IDENTIFICACIÓN REQUERIDA</p><h2>La puerta está cerrada.</h2><p>Introduce el número de tu cohorte de Henry para abrir el canal.</p>${accessForm('chat-cohort')}</div>
        <div class="chat-console" data-chat-console hidden>
          <div class="history-toolbar" data-storage-actions hidden>
            <p data-storage-status role="status"></p>
            <div class="history-buttons"><button type="button" data-history-action="current">Borrar esta conversación</button><button type="button" data-history-action="all">Borrar todos los historiales</button></div>
            <div class="storage-conflict" data-storage-conflict hidden><button type="button" data-history-action="load">Cargar historial guardado</button><button type="button" data-history-action="keep">Conservar esta pestaña</button></div>
          </div>
          <section class="character-picker" data-character-picker aria-labelledby="picker-title">
            <p class="eyebrow">CANAL DESBLOQUEADO</p><h2 id="picker-title">¿Con quién quieres hablar?</h2>
            <p>Cada personaje conserva su propia conversación.</p>
            <div class="character-options">${CHARACTERS.map(character => `<button type="button" data-character="${character.id}"><span aria-hidden="true">${character.emblem}</span><strong>${character.name}</strong><small>${character.description}</small></button>`).join('')}</div>
          </section>
          <div class="chat-log" role="log" tabindex="0" aria-label="Mensajes de la conversación" aria-live="polite" aria-relevant="additions text"><div class="empty-state"><span class="empty-symbol" aria-hidden="true">&gt;_</span><h2>El canal está abierto.</h2><p data-empty-note>Haz tu primera pregunta.</p></div></div>
          <section class="smith-intrusion" aria-label="Intervención de Smith" hidden>
            <div class="smith-signal"><canvas data-smith-canvas aria-hidden="true"></canvas><span class="smith-fallback" aria-hidden="true">[ AGENT_SMITH ]</span><button type="button" data-smith-pause aria-pressed="false">Pausar lluvia</button></div>
            <div class="smith-brief"><p class="eyebrow">SEÑAL TOMADA / AGENTE SMITH</p><h2>Su canal ahora es mío.</h2><p data-smith-progress role="status"></p>
              <div class="smith-quiz" role="group" aria-labelledby="smith-question"><h3 id="smith-question" data-smith-question tabindex="-1"></h3><p data-smith-feedback role="status"></p><div class="smith-options" data-smith-options></div></div>
              <details data-last-normal><summary>Tu última respuesta está guardada</summary><p></p></details>
            </div>
          </section>
          <p class="story-progress" data-story-progress></p><p class="story-storage" data-story-storage role="status"></p>
          <p class="quota-wait" data-quota-wait role="status" hidden>Gemini está en pausa por cuota. Recuperación en <strong data-quota-countdown></strong>. Tu borrador se conserva.</p>
          <p class="chat-status" role="status">CONECTANDO…</p>
          <form class="composer" aria-label="Escribir un mensaje">
            <div class="composer-top"><label for="message-input">TU MENSAJE &gt;</label><output id="character-count" for="message-input" aria-label="Caracteres escritos">0 / ${MAX_MESSAGE_LENGTH}</output></div>
            <textarea id="message-input" name="message" rows="3" placeholder="Escribe a Morfeo…" aria-describedby="message-help message-error" spellcheck="true"></textarea>
            <p id="message-error" class="input-error" role="status" hidden></p>
            <div class="composer-bottom"><p id="message-help">Máximo ${MAX_MESSAGE_LENGTH} caracteres.<br>Enter envía · Shift+Enter agrega una línea.<br><span data-transfer-help>Para cambiar: /hablar trinity</span></p><button class="button button-primary" type="submit" disabled>ENVIAR ↗</button></div>
          </form>
        </div>
      </section>
    </div>
    <dialog class="history-dialog" data-history-dialog aria-labelledby="history-dialog-title" aria-describedby="history-dialog-description"><form><h2 id="history-dialog-title">¿Borrar el historial?</h2><p id="history-dialog-description"></p><div><button type="button" data-history-cancel>Cancelar</button><button type="submit">Confirmar</button></div></form></dialog>
    <dialog class="history-dialog" data-transfer-dialog aria-labelledby="transfer-title" aria-describedby="transfer-description"><form><p class="eyebrow">ENRUTAMIENTO / ZION</p><h2 id="transfer-title">¿Cambiar de personaje?</h2><p id="transfer-description"></p><div><button type="button" data-transfer-cancel>Cancelar</button><button type="submit">Cambiar canal ↗</button></div></form></dialog>
    <p class="chat-caption">IA generativa · Interpretaciones ficticias de Matrix. Historiales guardados en este navegador cuando el almacenamiento está disponible.</p>
  </main>`;
}

function renderAboutView() {
  return `
    <main id="main-content" class="about-view page-width" tabindex="-1">
      <div class="page-heading"><div><p class="eyebrow">DETRÁS DE LA TERMINAL</p><h1>Acerca del proyecto<span class="text-accent">.</span></h1></div><span class="section-index" aria-hidden="true">03 / ABOUT</span></div>
      <p class="about-intro">Tres voces. Tres formas de mirar la misma realidad. Elige tu primera conexión al desbloquear el chat con el código <strong>79</strong>.</p>
      <section class="character-gallery" aria-label="Personajes de la terminal">
        ${CHARACTERS.map((character, index) => `<article class="character-card character-card--${character.id}">
          <div class="character-card-art"><img src="/assets/${character.id}-signal.svg" alt="" width="480" height="420" loading="lazy"><span aria-hidden="true">SIGNAL / 0${index + 1}</span></div>
          <div class="character-card-body"><p class="eyebrow">${character.voice}</p><h2>${character.name}</h2><p>${character.description}</p><p class="character-card-quote">${['La pregunta es el comienzo del camino.', 'Una elección también cuenta tu historia.', 'Da el paso. Estaré al otro lado.'][index]}</p><span class="character-card-label">${character.terminal}@zion</span></div>
        </article>`).join('')}
      </section>
      <div class="about-details about-details--wide">
        <section class="detail-section" aria-labelledby="project-title"><span class="detail-number" aria-hidden="true">01</span><div><h2 id="project-title">Mi terminal de aprendizaje</h2><p>Creé esta experiencia para el Proyecto Integrador del Módulo 3 de Full Stack de Henry, con asistencia de Codex. Me inspiré en <cite>The Matrix (1999)</cite> para explorar una SPA responsive e inteligencia artificial. Los personajes son interpretaciones ficticias.</p></div></section>
        <section class="detail-section" aria-labelledby="tech-title"><span class="detail-number" aria-hidden="true">02</span><div><h2 id="tech-title">Una voz, un contexto</h2><p>Cada personaje tiene sus propias instrucciones en el servidor. Para cambiar, pídeselo desde la conversación: «Quiero hablar con Trinity» o <code>/hablar trinity</code>. Confirma el cambio para recuperar su historial. La petición de cambio no consume Gemini.</p><ul class="tech-list" aria-label="Tecnologías"><li>JavaScript</li><li>Three.js</li><li>Gemini</li><li>Redis</li><li>Vercel</li></ul></div></section>
        <section class="detail-section" aria-labelledby="session-title"><span class="detail-number" aria-hidden="true">03</span><div><h2 id="session-title">Tu señal permanece</h2><p>Guardo mensajes y borradores separados en este navegador cuando localStorage está disponible. Puedes borrarlos con confirmación. Enter envía; Shift+Enter agrega una línea. Cada mensaje admite 280 caracteres. El código 79 abre un acceso compartido; no identifica personas. Después de tres intercambios completos con cada personaje, Smith interviene una sola vez. Un acierto en su cuestionario del M3 recupera la conversación; los errores avanzan por diez preguntas de dos opciones. El progreso se guarda aparte del historial y no consume solicitudes de IA. Las claves y los contadores de solicitudes permanecen en el servidor.</p><a class="text-link" href="/chat">Entrar a la terminal ${arrow}</a></div></section>
      </div>
    </main>`;
}

function renderNotFoundView() {
  return `<main id="main-content" class="not-found page-width" tabindex="-1"><p class="eyebrow">404 / RUTA NO ENCONTRADA</p><h1>Este camino<br>no existe<span class="text-accent">.</span></h1><p>Puedes regresar al inicio y elegir otra dirección.</p><a class="button button-primary" href="/home">Volver a Inicio <span aria-hidden="true">→</span></a></main>`;
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
let homeScene;
/** La cámara entra en la boca del mismo rostro de caracteres. Escape permite omitir. */
function enterPortal(destination) {
  if (document.querySelector('.mouth-portal')) return;
  if (!homeScene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { navigateTo(destination); return; }
  const portal = document.createElement('div');
  portal.className = 'mouth-portal';
  portal.setAttribute('role', 'dialog');
  portal.setAttribute('aria-modal', 'true');
  portal.setAttribute('aria-label', 'Entrando al chat');
  portal.innerHTML = `<p role="status">CRUZANDO EL UMBRAL…</p><button type="button">Omitir transición ↗</button>`;
  document.body.append(portal);
  document.body.classList.add('is-entering');
  const app = document.querySelector('#app');
  const previousInert = app.inert;
  app.inert = true;
  const skip = portal.querySelector('button');
  let timer;
  const finish = () => { cancelPortal(); navigateTo(destination); };
  const skipKey = (event) => {
    if (event.key === 'Escape') finish();
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  };
  document.addEventListener('keydown', skipKey);
  skip.addEventListener('click', finish);
  cancelPortal = () => {
    clearTimeout(timer); document.removeEventListener('keydown', skipKey); app.inert = previousInert;
    homeScene?.cancel(); document.body.classList.remove('is-entering'); portal.remove(); cancelPortal = () => {};
  };
  homeScene.enter();
  skip.focus({ preventScroll: true });
  timer = setTimeout(finish, 2300);
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
    homeScene = mountMatrixScene(document.querySelector('.matrix-scene'), document.querySelector('.motion-control'));
    const cleanAccess = mountAccess(document.querySelector('.access-form'), () => enterPortal('/chat'));
    cleanupCurrentView = () => { cancelPortal(); cleanAccess(); homeScene?.dispose(); homeScene = null; };
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
