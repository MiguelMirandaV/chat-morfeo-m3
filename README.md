# Chat con Morfeo

Proyecto Integrador del Módulo 3 de Full Stack de Henry. Aplicación en desarrollo para conversar en español con Morfeo de Matrix, con estética de terminal.

## Estado del proyecto

Los pasos 1–7 están completos: definición, entorno, interfaz responsive, routing SPA, chat en memoria, transporte HTTP con simulación y preparación/evaluación real del prompt de Gemini. Inicio, Chat y Acerca de se renderizan sin recargar, con Atrás/Adelante, carga directa, normalización de rutas y vista interna de no encontrado. Home incluye una cascada de caracteres verdes con pausa. El chat valida el máximo de 280 caracteres, muestra la espera y conserva conversación y borrador entre vistas. Pasan 83 tests unitarios. El proyecto está vinculado a GitHub y al espacio Hobby de Vercel de Miguel.

El prompt v3 se evaluó por REST con respuestas reales; acceso y cuota están verificados. El chat continúa usando la simulación hasta conectar el SDK en el paso 8.

El envío utiliza POST /api/functions y permanece en modo de prueba: el servidor devuelve textos predefinidos, con una espera simulada de 1,1 segundos. La simulación prioriza variantes menos usadas y evita repetir la respuesta inmediatamente anterior, incluso al agotar su banco finito de textos. Gemini se integrará en las siguientes etapas. La URL de entrega se documentará después de validar la aplicación completa.

## Alcance acordado

- Vistas SPA: `/home`, `/chat` y `/about`, usando History API.
- HTML, CSS mobile-first y JavaScript con módulos ES.
- Un único personaje: Morfeo, con tono sereno, reflexivo y respuestas breves.
- Máximo de 280 caracteres por mensaje del usuario, validado en navegador y servidor.
- Historial en memoria durante la sesión; se pierde al recargar.
- Gemini mediante `api/functions.js`, con API key solo en servidor.
- Cascada decorativa de caracteres verdes únicamente en `/home`, respetando movimiento reducido.
- Indicador estático de escritura, estados de error y scroll automático.
- Tests con Vitest y despliegue en Vercel.

No se incorporan persistencia, varios personajes, timestamps, envío con Enter, copiar respuestas ni cambio de tema. Enter insertará una nueva línea en el textarea.

## Requisitos

- Node.js 24.x y npm.
- Git para control de versiones.
- Cuenta de Vercel para utilizar su CLI y las funciones locales.
- Cuenta de Google AI Studio y una clave de Gemini en la etapa de integración.
- Navegador reciente con soporte para Intl.Segmenter, utilizado para contar caracteres visibles, incluidas tildes y emojis compuestos.

Vitest y Vercel CLI son dependencias de desarrollo del proyecto. Los scripts de npm ejecutan sus versiones locales; no hace falta instalarlas globalmente.

## Instalación

Desde una terminal situada en la raíz del proyecto:

```bash
npm ci
```

Este comando instala las versiones registradas en `package-lock.json`. Para la primera instalación durante la preparación se utiliza `npm install`; las siguientes copias utilizarán `npm ci`.

## Variables de entorno

En una copia nueva, crea el archivo local si aún no existe:

```bash
cp -n .env.example .env
```

Completa `GEMINI_API_KEY` únicamente en el archivo local. El ejemplo propone `GEMINI_MODEL=gemini-3.5-flash-lite`; la documentación lo publica estable y con nivel gratuito. Se comprobaron acceso y Free tier del proyecto; las cuotas vigentes se revisan en AI Studio. En la carpeta de Miguel, `.env` tiene permisos privados y él guardó su clave directamente allí; el valor se conserva exclusivamente local. Conserva su contenido si ya agregaste una clave. `.env` está ignorado por Git y no debe compartirse. `.env.local`, creado por Vercel CLI, se conserva sin editar. La simulación actual no consume Gemini ni cambia de proveedor por el hecho de guardar estas variables.

## Preparación de Gemini (paso 7)

El prompt único está en `MORPHEUS_SYSTEM_PROMPT`, dentro de api/functions.js. `getGeminiConfig` lee únicamente el entorno del servidor: requiere clave y modelo, limpia espacios de configuración y rechaza un modelo no revisado. Los errores de configuración no incluyen valores sensibles. El handler todavía utiliza el mock; el prompt ya se evaluó de forma independiente y la conexión real se implementará en el paso 8.

La propuesta usa `gemini-3.5-flash-lite`, salida máxima inicial de 1024 tokens y thinking minimal. No envía temperature/top_p/top_k, obsoletos para esta versión según su [guía específica](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.6#api-changes-and-parameter-updates). El presupuesto técnico no sustituye la instrucción de responder normalmente en una a tres frases cortas. Se confirmó acceso al modelo y las 20 generaciones de evaluación terminaron con STOP (sin corte por el límite de salida).

La [matriz de evaluación](docs/evaluacion-prompt.md) registra resultados reales e iteraciones: v1 (11 generaciones), v2 (6) y v3 (3). Todas devolvieron HTTP 200 y 20–57 palabras. Se corrigieron suposiciones no aportadas, el marco ficticio y preámbulos innecesarios. También se registran las limitaciones: no son 20 pruebas de la versión final ni una garantía de conducta futura. Los tests unitarios son independientes de las llamadas reales.

## Desarrollo local

Comprueba la sesión de Vercel:

```bash
npm run vercel:whoami
```

Si no hay sesión, inicia sesión:

```bash
npm run vercel:login
```

Luego ejecuta:

```bash
npm start
```

Abre la URL que muestre la terminal: el comando está configurado para escuchar únicamente en `http://127.0.0.1:3000`. Se utiliza el nombre `chat-morfeo-m3`, la raíz `.` y el preset Other. La configuración está versionada en `vercel.json`: contenido estático desde `src/`, sin compilación ni proceso de desarrollo adicional. El script se llama `start` porque Vercel rechaza que un script llamado `dev` invoque de nuevo `vercel dev`. El fallback entrega index.html para las rutas de vistas, excluyendo /api, /_vercel y rutas con puntos para mantener los archivos y endpoints a cargo del servidor. Detén el servidor con Ctrl+C.

## Tests

Los comandos previstos son:

```bash
npm test
npm run test:watch
```

Actualmente pasan 83 tests en dos archivos:

- `utils.test.js`: seis casos de conteo y validación, incluyendo bordes 279/280/281, espacios/saltos de línea, tildes equivalentes, emojis compuestos y tipos incorrectos.
- `app.test.js`: 13 casos de routing, 14 de sesión/simulación, 14 de transporte HTTP, 29 del handler y 7 de configuración de Gemini. Cubren historial completo, concurrencia, fallos, reintentos, timeout, validación de entradas y presupuesto de bytes.

Los tests importan funciones sin montar un DOM y utilizan mocks para History API, proveedores, fetch y respuesta de Vercel. Hay casos de éxito, HTTP 400/413/429/503, fallo de red, timeout, JSON inválido, roles/orden incorrectos y bordes de tamaño. La suite no usa la red ni consume Gemini. La integración local real se verifica por separado y está registrada en docs/pruebas.md.

## Chat en memoria

1. Abre `/chat`, escribe un mensaje y pulsa **Enviar**. Enter inserta una línea.
2. Durante la espera, se muestra **Morfeo está escribiendo…**; el botón queda deshabilitado y el campo conserva el foco, temporalmente de solo lectura.
3. Cambia a Inicio o Acerca de y regresa: los turnos y el borrador permanecen. Una respuesta pendiente puede finalizar fuera de Chat.
4. Recarga la página para empezar con una sesión vacía.

`chat.js` mantiene una sola sesión fuera del render. El router suscribe cada vista y la desuscribe al desmontarla, sin cancelar el turno. El historial contiene exclusivamente objetos `{ role, content }`; ni la espera ni los errores son mensajes. Cada solicitud recibe una copia del historial completo. En un fallo, se revierte el turno incompleto y se restaura el texto para reintentar sin duplicados. Los snapshots también son copias, para impedir cambios externos sobre el estado.

El render añade solo mensajes nuevos y utiliza `textContent`, de modo que etiquetas pegadas en el chat se muestran como texto. El panel tiene altura acotada y scroll propio; cada mensaje nuevo desplaza la conversación al final. El contador usa grafemas y no trunca el contenido pegado.

Evidencias del paso 5: [móvil 320 px](docs/capturas/chat-memoria-320.jpg), [tablet 768 px](docs/capturas/chat-memoria-768.jpg) y [escritorio 1024 px](docs/capturas/chat-memoria-1024.jpg).

## Función serverless y contrato HTTP

El flujo actual es navegador → `requestReply` (fetch) → `POST /api/functions` → simulación en servidor → JSON → sesión/render. La función utiliza Node.js y los helpers req/res de Vercel, sin framework adicional. Referencia: [Node.js y request.body en Vercel](https://vercel.com/docs/functions/runtimes/node-js#request-body).

Petición (`Content-Type: application/json`):

```json
{"messages":[{"role":"user","content":"Hola, Morfeo"}]}
```

Respuesta exitosa (HTTP 200):

```json
{"reply":"Bienvenido…"}
```

Error controlado:

```json
{"error":{"code":"INVALID_HISTORY","message":"Descripción del problema."}}
```

El historial comienza/termina en user y alterna user/assistant; cada mensaje contiene únicamente role/content. El servidor rechaza roles system, campos extra, blancos, tipos incorrectos y cualquier turno del usuario de más de 280 grafemas. Conserva espacios y saltos del contenido válido. El presupuesto de entrada es 64 KiB: se comprueba Content-Length cuando está disponible y el tamaño UTF-8 del JSON serializado. Si se supera, se rechaza toda la petición con 413, sin recortar el historial. La conversación anterior sigue en memoria y el aviso propone recargar para una sesión nueva.

| Estado | Situación |
| --- | --- |
| 200 | Respuesta válida con reply. |
| 400 | JSON, contrato o mensajes inválidos. |
| 405 | Método distinto de POST; incluye Allow: POST. |
| 413 | Se supera el presupuesto de entrada. |
| 415 | Content-Type distinto de application/json. |
| 502 | El proveedor devuelve texto vacío o inválido. |
| 503 | Fallo interno/proveedor no disponible, sin detalles sensibles. |

Todas las respuestas del handler llevan Cache-Control: no-store. El cliente revisa response.ok antes de interpretar el éxito; también controla 429, fallos de red, respuestas inválidas y un timeout de 20 segundos con AbortController. No hay reintentos automáticos. El texto vuelve al campo tras fallar y el botón permite reintentar; se mantiene el bloqueo de concurrencia. El handler simulado todavía no aplica un rate limit propio ni consume Gemini.

La comprobación del flujo con historial, error 503 controlado y reintento está registrada en [pruebas.md](docs/pruebas.md). Capturas: [éxito en escritorio](docs/capturas/chat-api-1024.jpg), [móvil](docs/capturas/chat-api-320.jpg) y [error HTTP controlado](docs/capturas/chat-error-http-1024.jpg).

## Navegación SPA

`navigateTo` actualiza la URL con pushState y llama al render de inmediato; un único listener popstate refleja Atrás/Adelante sin crear entradas nuevas. La raíz `/` se normaliza a `/home` y las barras finales se corrigen con replaceState. Se mantienen los parámetros y fragmentos.

El router respeta Cmd/Ctrl-click, enlaces externos, target, descargas, protocolos especiales y anclas de la misma página. Al cambiar de vista mueve el foco al contenido y ejecuta la limpieza de la vista anterior. Así, la cascada y sus listeners solo existen en Inicio.

Se comprobó la navegación real mediante un proxy temporal de QA: la carga inicial produjo una descarga de documento HTML; los cambios de vista y Atrás/Adelante no añadieron otra. Cmd+click abrió una nueva pestaña y produjo la segunda descarga esperada. El proxy fue retirado al terminar la comprobación y no forma parte de la aplicación.

Una ruta desconocida muestra la vista de no encontrado con enlace de regreso. Su documento base se entrega con HTTP 200 por ser el fallback de la SPA; el contenido representa la ruta inexistente. Los recursos estáticos inexistentes y las rutas API desconocidas siguen devolviendo 404 del servidor. GET /api/functions devuelve 405 con Allow: POST; las peticiones válidas se envían mediante POST.

## Interfaz y comprobaciones responsive

El CSS parte de 320 px, agrega una distribución de tablet a 768 px y dos columnas de Inicio a 1024 px. Se comprobaron las tres vistas en esos tres anchos, sin desbordamiento horizontal. El fondo de Home tiene un control para pausar/reanudar, se detiene al ocultar la pestaña y respeta `prefers-reduced-motion`. Chat y Acerca de no crean la cascada.

La conversación del panel de Inicio es un ejemplo ilustrativo escrito para la maqueta; no procede de una llamada a Gemini.

El footer incluye `© 2026 Miguel Miranda` y un enlace al repositorio en GitHub.

![Inicio en escritorio con copyright](docs/capturas/home-copyright-1024.jpg)

| Vista | Móvil | Tablet | Escritorio |
| --- | --- | --- | --- |
| Inicio | [320 px](docs/capturas/home-320.jpg) | [768 px](docs/capturas/home-768.jpg) | [1024 px](docs/capturas/home-1024.jpg) |
| Chat | [320 px](docs/capturas/chat-320.jpg) | [768 px](docs/capturas/chat-768.jpg) | [1024 px](docs/capturas/chat-1024.jpg) |
| Acerca de | [320 px](docs/capturas/about-320.jpg) | [768 px](docs/capturas/about-768.jpg) | [1024 px](docs/capturas/about-1024.jpg) |

El estado de exceso de caracteres también está [documentado con una captura real](docs/capturas/chat-limite-281.jpg).

El footer actualizado está capturado a [320 px](docs/capturas/home-copyright-320.jpg), [768 px](docs/capturas/home-copyright-768.jpg) y [1024 px](docs/capturas/home-copyright-1024.jpg). La [vista de ruta desconocida](docs/capturas/ruta-desconocida-1024.jpg) también está documentada.

## Organización

```text
api/functions.js  Handler de Vercel y simulación temporal del proveedor
src/index.html    Documento inicial
src/styles.css    Estilos
src/app.js        Entrada, vistas y routing
src/chat.js       Estado y lógica del chat
src/utils.js      Validaciones y transformaciones
tests/            Tests de conteo, validación, routing, sesión, fetch y handler
docs/             Alcance, registro de IA, pruebas y capturas
```

La ficha del personaje y los criterios completos están en [docs/alcance.md](docs/alcance.md).

## Despliegue

El repositorio ya está vinculado al proyecto de Vercel. En la etapa de publicación se configurarán las variables del servidor y se verificará tanto la SPA como la función real. La URL productiva y las instrucciones finales se documentarán después de comprobar ese despliegue.

## Evidencias y uso de IA

- [Registro de uso de IA](docs/uso-ia.md)
- [Registro de comprobaciones](docs/pruebas.md)
- Las capturas reales de esta etapa están en `docs/capturas/`.

Miguel definió el personaje, la dirección visual, el máximo de caracteres y aprobó el plan. Codex apoya la planificación, el desarrollo y las verificaciones. Los registros distinguen acciones realizadas de funcionalidades pendientes.
