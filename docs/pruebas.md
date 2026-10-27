# Registro de comprobaciones

## Paso 5 — Chat en memoria y respuestas simuladas

- `npm test`: 31 tests pasando en dos archivos (6 de conteo/validación, 13 de routing y 12 de sesión). El proveedor se inyecta en los tests; la espera simulada utiliza temporizadores falsos.
- Se prueban: rechazo de blancos y exceso, aceptación de 280 emojis compuestos, historial completo en orden, conservación de espacios/saltos, bloqueo síncrono de otro envío, finalización sin una vista suscrita y entrega de la sesión al volver.
- Se simula un fallo después de una conversación válida, seguido por un reintento exitoso: borrador restaurado, historial anterior intacto y ningún mensaje duplicado. Se comprueban también respuestas vacías/de tipo incorrecto y aislamiento de copias. Esta comprobación de errores se hizo con Vitest; no se presenta como un fallo real de red o de Gemini.
- En el navegador integrado se comprobaron blancos, 281 caracteres bloqueados, 280 emojis compuestos habilitados y Enter insertando un salto sin enviar. Los estados `aria-invalid` y contador coincidieron.
- Se observó el indicador estático de escritura, botón deshabilitado y campo de solo lectura durante la espera. Tras ajustar el manejo del foco, este permanece en `message-input` durante y después de la respuesta.
- Se salió hacia Acerca de inmediatamente después de enviar y se regresó después: estaban los cuatro mensajes de los dos turnos, incluida la respuesta que finalizó con Chat desmontado.
- Se pegaron etiquetas `<strong>` y dos líneas con un emoji: el contenido se mostró literal, sin elementos strong creados en el log, con `white-space: pre-wrap`.
- Una conversación de cuatro turnos terminó con ocho mensajes tras un doble click. En móvil, el desfase del scroll respecto del final fue de -0,5 px (redondeo subpíxel): el último turno quedó visible dentro del panel.
- Se conservó un borrador sin enviar al navegar entre vistas. Una recarga dejó cero mensajes, borrador vacío y la vista inicial.
- Se revisó Chat a 320×800, 768×1024 y 1024×900: el ancho del documento coincidió con el viewport. Se capturaron los tres tamaños con conversación real de la simulación y se restauró el viewport habitual del navegador.
- La consola consultada no mostró errores ni advertencias. El footer conserva el copyright y el enlace a GitHub.
- La simulación usa únicamente textos predefinidos y un temporizador local. Todavía no se implementaron fetch, la función ni Gemini; no se atribuyen pruebas de integración a este paso.

Capturas: `chat-memoria-320.jpg`, `chat-memoria-768.jpg` y `chat-memoria-1024.jpg` en `docs/capturas/`.

## Preparación del entorno

- Node.js instalado: v24.21.0; npm: 11.19.0; Git: 2.55.0.
- VS Code y el comando `code` están instalados.
- GitHub CLI pudo identificar la cuenta existente como MiguelMirandaV mediante una consulta autenticada.
- El repositorio `MiguelMirandaV/chat-morfeo-m3` no existía al iniciar la preparación.

- Se instalaron las herramientas locales: Vitest 5.0.5 y Vercel CLI 65.3.1, compatibles con Node 24. Las versiones ejecutaron sus comandos de identificación correctamente.
- Se comprobó la validez de package.json y vercel.json; los módulos son ES y el directorio estático es src. El comando interno de desarrollo de Vercel se deja vacío para servir el contenido estático directamente.
- Git ignora .env, variantes locales/producción, node_modules y .vercel. .env.example sí es versionable y sus valores están vacíos.
- Los enlaces locales de README y documentación apuntan a archivos existentes. No se encontraron patrones de claves de Gemini o tokens de GitHub en la documentación revisada.
- Se inicializó main y se creó el primer commit de alcance, 0e5b666.
- Miguel creó su cuenta y confirmó el acceso en VS Code. Vercel CLI comprobó la sesión como `miguelmirandav`, en el espacio `miguel-miranda-v`, plan Hobby.
- Se creó/vinculó el proyecto `chat-morfeo-m3` en ese espacio y Vercel conectó el repositorio público existente de GitHub.
- La vinculación generó `.vercel/` y `.env.local` con datos privados de la CLI. Se conservan ignorados, sin registrar sus valores en la documentación.
- El primer arranque produjo `DEV_RECURSIVE_INVOCATION`: Vercel no permite que el script `dev` llame a `vercel dev`, incluso con devCommand vacío. Se corrigió a `npm start`, que ejecuta Vercel Dev enlazado solo a 127.0.0.1:3000. El README refleja el comando real.
- Se simplificó .gitignore tras los cambios automáticos de Vercel: `.env*` queda seguido por `!.env.example`, preservando el ejemplo versionable y las variables reales excluidas.
- Segundo arranque con `npm start`: Vercel Dev quedó listo en `http://127.0.0.1:3000`.
- Comprobación HTTP local: `/`, `/styles.css` y `/app.js` respondieron 200 con sus tipos correctos; el HTML incluyó el texto de preparación esperado.
- `/.env`, `/.env.local`, `/.git/config` y `/package.json` respondieron 404. No se registraron contenidos de archivos privados.
- Se comprobaron las exclusiones con `git check-ignore --no-index`, para no depender de que el archivo ya estuviera versionado: variables y datos privados ignorados, .env.example permitido.
- Resultado: paso 2 completado. Esta verificación valida el entorno inicial; las funcionalidades del chat aún no existen y no se presenta como una prueba de la integración Gemini o del router.

### Revisión de dependencias

La instalación inicial de las herramientas produjo 34 avisos de npm audit. Se evaluó la alternativa Vercel 53.2.0 que sugería npm, pero aumentó los avisos a 39, por lo que no se conservó. Se mantuvo la CLI actual 65.3.1 y se aplicó npm audit fix sin --force y sin ejecutar scripts de instalación: quedaron 33 avisos transitivos de desarrollo (12 moderados, 20 altos y 1 crítico).

Estos avisos pertenecen a dependencias de las herramientas, incluyendo el árbol de Vercel CLI. No se consideran resueltos ni se ocultan con overrides de versiones principales. La auditoría con --omit=dev devolvió cero vulnerabilidades; en esta etapa aún no hay dependencias de aplicación de producción. Este último resultado no equivale a una auditoría limpia de todas las herramientas. Se revisará de nuevo al incorporar dependencias o preparar la publicación.

## Paso 3 — Interfaz y cascada de Inicio

- Se construyeron las vistas visuales de Inicio, Chat y Acerca de. Las URLs conocidas se sirven con rewrites de Vercel; en esta etapa sus enlaces todavía recargan la página.
- Navegador utilizado: navegador integrado de Codex. Se revisaron y capturaron las tres vistas a 320×800, 768×1024 y 1024×900. En las nueve combinaciones, documentElement.scrollWidth coincidió con innerWidth: sin overflow horizontal.
- En cada tamaño, Home tuvo exactamente un contenedor de cascada; Chat y Acerca de no tuvieron ninguno. La cascada usa 28 columnas, con duración y desfase diferentes.
- Se verificó el control real: estado running al comenzar, paused y aria-pressed=true al pausar, y running al reanudar. Después de Inicio → Chat → Atrás hubo 28 columnas activas. Se conservan los recursos al regresar desde la caché de navegación y se dispone de cleanup para el router futuro.
- Se implementó una media query para movimiento reducido y su ajuste de control. La preferencia real del navegador durante esta comprobación era no-preference; no se modificó el ajuste del sistema ni se presenta como una prueba de emulación de reduce.
- Se verificó en el campo real: 279/280, 280/280 y 281/280; solo 281 activó aria-invalid y el mensaje de exceso. Con 280 emojis compuestos el contador mostró 280/280. El botón Enviar permanece deshabilitado porque la lógica de conversación no se implementó aún.
- npm test: un archivo y cuatro tests pasando. Cubren los bordes del límite, espacios y saltos de línea, tildes equivalentes y emojis compuestos. No consumen red.
- Se comprobó la sintaxis de app.js y el formato del diff. La consola del navegador no mostró errores ni advertencias durante las interacciones revisadas.
- Contrastes calculados sobre la superficie #08110b: texto principal 15.68:1, secundario 8.75:1, acento 14.86:1, error 11.29:1 y placeholder 7.27:1. No se aplica esta medición a elementos decorativos ni controles deshabilitados.
- Se guardaron diez capturas reales: nueve combinaciones de vista/tamaño y un caso de 281 caracteres, enlazadas desde el README.

## Paso 4 — History API y footer

- Footer actualizado a `© 2026 Miguel Miranda`, con enlace al repositorio GitHub y atributos target=_blank y rel=noopener noreferrer. Se revisó a 320, 768 y 1024 px sin overflow horizontal; las capturas están en docs/capturas/home-copyright-*.jpg.
- npm test: 17 tests pasando en dos archivos (cuatro de conteo y trece de routing). Los tests comprueban selección de vistas, raíz/barras finales, rutas desconocidas, exclusión de enlaces nativos/externos/recursos, pushState antes del render, destino repetido y destino externo rechazado.
- En el navegador se comprobó Inicio → Chat → Acerca de → Atrás → Atrás → Adelante. URL, título, enlace activo y foco coincidieron con la vista esperada. El foco se movió a main-content. Las columnas de cascada fueron 28 en Inicio y 0 en Chat/Acerca de.
- Un proxy temporal local de QA observó una descarga HTML al abrir Inicio y ninguna descarga HTML adicional durante la navegación SPA, Atrás/Adelante, enlaces repetidos o anclas. Con Cmd+click se abrió otra pestaña en Acerca de y el total pasó a dos documentos, lo esperado para una apertura nativa. El proxy y su pestaña se cerraron al terminar; no se añadió código de instrumentación a la aplicación.
- Pulsar Chat cuando ya era la vista actual conservó el texto de prueba y no eliminó la posibilidad de usar Adelante. Activar Saltar al contenido y volver con Atrás conservó el texto del campo: el popstate de un cambio de ancla no desmonta la misma vista.
- Se verificaron accesos directos a /, /chat, /chat/?tema=eleccion y /ruta-desconocida. La raíz terminó en /home; la barra final se normalizó conservando el query; la ruta desconocida mostró su vista propia. Recargar /chat mantuvo esa vista.
- HTTP: /home, /chat, /about, /chat/ y rutas desconocidas/profundas devolvieron el HTML base con 200. app.js, styles.css y utils.js se sirvieron como recursos reales. /api/functions, /_vercel/ruta-inexistente, /inexistente.js, /.env, /.env.local, /.git/config y /package.json devolvieron 404, sin pasar al fallback.
- La vista de ruta desconocida ofrece regreso a Inicio sin recargar. Su captura está en docs/capturas/ruta-desconocida-1024.jpg. La consola no mostró errores/advertencias durante la verificación.
- El historial de conversación y la persistencia del borrador entre vistas diferentes todavía no están implementados: esta etapa solo conserva el campo cuando no corresponde remontar la misma vista. El paso 5 gestionará el estado del chat en memoria.

## Comprobaciones pendientes

Siguen pendientes la conversación en memoria, fetching, función serverless, Gemini y validación final de producción. Las pruebas actuales cubren conteo y routing; la suite se ampliará al incorporar las funciones restantes.

### Corrección tras la revisión de Miguel

Miguel observó dos respuestas exactamente iguales. Cada tema de la simulación tenía un único texto, por lo que el comportamiento era repetitivo. Se incorporaron tres variantes por tema, selección de las menos usadas y exclusión de la respuesta anterior. Dos tests de regresión cubren cinco turnos del mismo tema y cinco sin palabras clave, incluyendo la reutilización del banco sin repetición consecutiva. Suite: 33 tests pasando. En una pestaña independiente se enviaron dos preguntas sobre aprendizaje y se comprobaron respuestas diferentes. Esto mejora el mock; sigue siendo texto predefinido sin razonamiento de IA.

## Paso 6 — HTTP y función de Vercel con mock

- Se creó api/functions.js y se trasladó allí la simulación, manteniendo la corrección de variantes solicitada por Miguel. src/chat.js utiliza requestReply como proveedor predeterminado; el banco de respuestas dejó de estar en el módulo del navegador.
- npm test: 76 tests pasando en los dos archivos previstos. Distribución: 6 de utils, 13 de routing, 14 de sesión/simulación, 14 de fetch y 29 del handler. Se usan mocks y relojes falsos, sin red.
- Fetch probado: historial completo y sin mutaciones, POST/JSON, normalización de reply, comprobación de response.ok antes de parsear, HTTP 400/413/429/503/405, JSON de éxito inválido, desconexión, aborto y limpieza de timers. Un 429 seguido de éxito restaura el borrador y no duplica mensajes.
- Handler probado: método/Allow, tipo de contenido, error del getter JSON de Vercel, roles y alternancia, campos extra, blancos/tipos/límite del usuario, 280 emojis compuestos, mensajes de assistant mayores de 280, errores internos sin filtración y respuestas vacías. Se comprueba el presupuesto con bytes multibyte, sin depender de Content-Length, y se acepta exactamente 64 KiB.
- Vercel Dev detectó la nueva función sin cambiar vercel.json ni agregar dependencias. GET /api/functions devolvió 405 JSON con Allow: POST.
- Verificación HTTP real: 17 comprobaciones exitosas en total. Incluyen JSON malformado (400), Content-Type incorrecto (415), rol system/281 caracteres/blancos rechazados (400), exceso de tamaño (413), dos turnos con historial y respuestas distintas (200), 280 emojis compuestos aceptados (200), las tres vistas (200) y privados/API desconocida (404).
- El primer script esperaba 404 en /api/functions.js; la observación real fue 405 JSON porque Vercel Dev lo trata como alias ejecutable de la función. Se ajustó la comprobación para confirmar que ejecuta el handler y no entrega el código fuente. Es comportamiento local observado, pendiente de verificar por separado en producción.
- Prueba del navegador con proxy temporal de QA en 127.0.0.1:3001: el primer POST devolvió un 503 controlado; la vista restauró el texto, retiró el turno incompleto, quitó la espera y habilitó Reintentar. Al reintentar, la petición llegó a la función real de 3000 y produjo exactamente dos mensajes.
- El registro de transporte mostró tres POST: historial [user] → 503 controlado; historial [user] → 200 real; historial [user, assistant, user] → 200 real. El proxy solo registró método, ruta, roles, cantidad y estado, sin cabeceras ni contenidos. Se retiraron proxy y pestaña temporal al finalizar; no forman parte de la aplicación.
- En la tercera petición se salió hacia Acerca de y se regresó después: cuatro mensajes, sin espera atascada. Se probó también la aplicación directamente en 127.0.0.1:3000 y a 320 px no hubo overflow horizontal. La consola consultada después de la navegación a la aplicación directa no mostró errores ni advertencias.
- Se guardaron capturas reales de éxito móvil/escritorio, error y recuperación. Se restauró el viewport habitual y se conservaron las pestañas originales del usuario.
- No se configuró ni consumió Gemini en este paso. La simulación permite probar transporte y estados; la voz generada, el contexto de IA, las cuotas y el funcionamiento productivo siguen pendientes.

Evidencias en docs/capturas: chat-api-1024.jpg, chat-api-320.jpg, chat-error-http-1024.jpg, red-api-paso-6.json y http-api-paso-6.json.

## Paso 7 — Preparación de Gemini (evaluación real pendiente)

- Se revisaron las fuentes oficiales actuales de modelos, claves, cuotas, precios, thinking, cambios de API y SDK. gemini-3.5-flash-lite se propone como modelo estable con nivel gratuito publicado; no se asume que la cuenta ya tenga acceso o una cuota concreta.
- Se detectó que la guía específica de 3.5 Flash-Lite declara temperature/top_p/top_k obsoletos. Se retiró temperature de la preparación antes de integrarla, en lugar de conservar el parámetro de los ejemplos de lectures o inferir compatibilidad de una guía general.
- Se añadió MORPHEUS_SYSTEM_PROMPT con identidad, voz, brevedad, uso de contexto, variación y límites de la ficción. La matriz evaluacion-prompt.md conserva todos los resultados reales como pendientes.
- getGeminiConfig requiere GEMINI_API_KEY y GEMINI_MODEL en el entorno del servidor, valida la selección revisada y devuelve una configuración nueva. Valores iniciales: salida máxima 1024 tokens y thinking minimal, sujetos a evaluación real. El handler sigue usando la simulación.
- Se creó .env solo si no existía, mediante escritura exclusiva y permisos 0600, con clave vacía. No se leyó ni editó .env.local. git check-ignore --no-index confirmó .env y .env.local ignorados; .env.example continúa versionable y su clave está vacía. El nombre de modelo público se incluye en el ejemplo.
- npm test: 83 tests aprobados, siete nuevos de configuración. Comprueban clave ausente/inválida, modelo explícito y revisado, normalización sin alterar el entorno, independencia de configuración y errores sin valores sensibles. Estos tests no hacen peticiones ni validan la voz de Gemini.
- Miguel confirmó que necesita crear la clave. Codex abrió AI Studio en una pestaña nueva; la bienvenida requiere confirmar edad/uso y aceptar términos. Esos pasos se dejaron a Miguel. Se proporcionaron instrucciones para crear la clave y pegarla directamente en el .env local.
- Pendientes: confirmación de clave guardada, acceso real al modelo, cuota del proyecto y evaluación del prompt. No se afirma que Gemini esté integrado o que el paso 7 esté cerrado.

### Cierre del paso 7 — Acceso y evaluación reales

Miguel confirmó “Clave guardada en .env”. Codex la cargó en el proceso local mediante --env-file=.env y comprobó únicamente presencia/configuración, sin imprimir su valor. GET del modelo configurado devolvió 200 y anunció generateContent entre sus métodos.

Se revisó la vista Rate Limit de AI Studio: Free tier, 15 RPM, 250.000 TPM de entrada y 500 RPD para el modelo del proyecto. La vista mostraba 3 solicitudes de uso al revisar y avisa de demora de actualización. Son límites observados, no una garantía general ni permanente. No se habilitó facturación. Se cerró la pestaña temporal de consulta y se conservó la pestaña original del usuario.

Evaluación REST independiente del chat: 11 generaciones con prompt v1, 6 con v2 y 3 con v3; las 20 devolvieron HTTP 200 y finishReason STOP, con 20–57 palabras. No hubo errores HTTP ni reintentos. Se envió el system prompt exacto del servidor y el historial completo de cada caso, adaptando assistant a model en el transporte. El SHA-256 del prompt se conserva en cada registro.

Hallazgos: v1 suponía falta de crecimiento profesional no mencionada por el usuario, podía explicar su papel y situaba la ficción de forma implícita. v2 corrigió la suposición y recordó de nuevo Ariadna/programación, pero necesitó un ajuste de marco ficticio y de preámbulo. v3 verificó esos casos afectados: definición explícita en la película, aclaración de ficción y respuesta breve centrada en libertad. Dos presentaciones de versiones anteriores tuvieron cuatro frases, aunque 40 y 49 palabras: se registra como límite de estilo y no se trunca salida para forzar el objetivo habitual de 1–3 frases.

Los resultados por versión y la matriz están en evaluacion-prompt.md y docs/capturas/prompt-v*.json; no son 20 pruebas de la versión final. Se mantuvieron maxOutputTokens=1024 y thinking minimal, sin parámetros de muestreo obsoletos.

Suite final: 83 tests pasando. El chat continúa usando el mock del handler; el SDK, el flujo real desde la interfaz y los fallos del proveedor corresponden al paso 8. El paso 7 queda completo con evaluación y limitaciones documentadas.
