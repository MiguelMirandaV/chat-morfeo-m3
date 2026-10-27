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
