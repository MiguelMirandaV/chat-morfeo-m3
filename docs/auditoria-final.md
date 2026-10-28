# Auditoría final — Paso 13

> Registro histórico de la primera entrega, identificada por `m3-v1-entregado`. Sus cifras y capturas no certifican la iteración actual. Consulta [entrega.md](entrega.md) para la información vigente.

27 de octubre de 2026. Revisión de la consigna, sus ocho objetivos, las buenas prácticas y las ocho categorías de la rúbrica aportada por Miguel. El criterio Excelente se usó como guía de aceptación; la calificación corresponde a Henry.

## Enlaces de entrega

- [Repositorio público de GitHub](https://github.com/MiguelMirandaV/chat-morfeo-m3).
- [Aplicación pública en Vercel](https://chat-morfeo-m3.vercel.app/home).
- Cohorte de acceso: **79**. No hace falta cuenta de Vercel para visitar la app.

## Resultado por categoría

| Categoría | Resultado y evidencia |
| --- | --- |
| 1. Responsive mobile-first | Conforme: base móvil, unidades relativas, Flexbox/Grid, media queries 768/1024 y las tres vistas medidas a 320/768/1024 bajo HTTPS. [Evidencia del navegador](capturas/paso-12-navegador.json). |
| 2. SPA / History API | Conforme: vistas separadas, pushState+render, popstate, normalización, URL inicial y navegación Atrás/Adelante. Tests del router y comprobación pública conservando los cuatro mensajes. |
| 3. Asincronía / Fetch | Conforme: async/await, response.ok, JSON controlado, try/catch/finally, espera estática, bloqueo de doble envío y borrador recuperado. [Revisión de errores](revision-ux.md). |
| 4. Gemini | Conforme: prompt de servidor con voz/límites, historial íntegro transformado a roles Gemini, parseo validado y respuestas reales con contexto. [Evaluación](evaluacion-prompt.md) y [producción](produccion.md). |
| 5. Seguridad / serverless | Conforme al alcance: claves en entorno, proxy Node, variables Production/Preview, cookie firmada, validación de entrada, cuotas atómicas, privados 404 y ausencia de valores privados en assets/respuestas. [HTTP](capturas/paso-12-http.json). |
| 6. Chat / UX | Conforme: TÚ/MORFEO diferenciados, log con scroll y auto-scroll, estados, historial/borrador en memoria, foco/teclado y recuperación 401/429. [UX](revision-ux.md). |
| 7. Vitest | Conforme: 130 tests en 3 archivos, funciones clave y casos borde, mocks/restauración/fetch bloqueado. Instalación limpia y suite final aprobadas sin .env ni servicios externos. |
| 8. Deploy / documentación | Conforme: repositorio público, GitHub/main conectado, aplicación HTTPS real, estructura simple, README reproducible, capturas y registro de IA. La referencia final publicada se conserva en el informe de cierre entregado a Miguel. |

## Objetivos y recomendaciones

1. **Responsive:** documentado y medido en tres tamaños; se mantiene evidencia del ancho intermedio 600.
2. **SPA:** Home/Chat/About, cambios sin recarga y URL coherente.
3. **Promises y Fetch:** espera, errores y respuestas fuera de la vista activa probados.
4. **JSON y responsabilidades:** postApi/requestReply, transformaciones Gemini y render separados dentro de los módulos simples.
5. **Prompting y criterio:** solicitudes reales, efectos, correcciones y verificaciones en uso-ia.md. No se atribuyen a Miguel pruebas realizadas por Codex.
6. **AI, roles y parámetros:** prompt v3, historial completo, límite de tokens y rate limiting. Se explica por qué no se copian parámetros incompatibles de otro modelo.
7. **Secretos:** env.example vacío para privados, Git/Vercel ignorando secretos, variables remotas y función real.
8. **Tests, GitHub y Vercel:** instalación desde clon, lockfile, mocks, commits y publicación verificadas.

Se confirmó personaje distintivo, prompt breve/contextual, preguntas variadas evaluadas, API key fuera del cliente, tres tamaños, historial solo en memoria, ausencia de logs debug en src/api y funcionamiento de la función publicada. Smith sigue siendo visual; no se agregó un segundo personaje conversacional ni el extra credit de historial persistente, timestamps, copiar respuestas, envío con Enter o selector de temas.

## Instalación reproducible

Se clonó el repositorio por HTTPS en una carpeta temporal sin `.env`, `.env.local` ni `.vercel`. `npm ci` instaló 353 paquetes y 130 tests pasaron. Después del parche de dependencia se repitió `npm ci`: 352 paquetes, 130 aprobados y 0 fallos. Los hashes del package.json/lockfile probado están en [la evidencia de instalación](capturas/paso-13-instalacion.json).

Se comprobó instalación y tests; no se copió una credencial ni se arrancó otra instancia del servidor vinculada a la cuenta dentro del clon. El flujo real de la función está verificado en la aplicación publicada. npm mostró avisos de scripts de instalación pendientes de aprobación en este entorno; no se cambiaron permisos globales para suprimirlos.

## Secretos, enlaces y paquete

El examen inicial incluyó 18 commits y 192 blobs únicos: cero coincidencias de las cuatro credenciales actuales, cero coincidencias del patrón de clave Google y ningún archivo privado de entorno/datos en el historial. La validación del cierre volvió a examinar los archivos y enlaces de la entrega. Este examen tiene reglas concretas; no es una garantía universal de detección de cualquier secreto histórico desconocido.

La CLI empaqueta sin .env/.env.local/.data/.git/.vercel/node_modules. `env.example` conserva vacíos los cuatro privados. Las rutas privadas revisadas responden 404 y las tres rutas públicas 200. [Auditoría estática](capturas/paso-13-estatica.json) · [Paquete](capturas/paso-13-paquete.json) · [GitHub público](capturas/paso-13-github.json).

## Dependencias: corrección y avisos pendientes

- Producción: **0 vulnerabilidades reportadas** por npm audit --omit=dev.
- La auditoría completa inicial mostró 34 avisos, incluido uno crítico en tar 7.5.11, utilizado por la CLI de Vercel.
- Se fijó `overrides.tar=7.5.22`, parche dentro de la misma serie 7.5. La fuente del mantenedor identifica el problema de descompresión y una versión corregida. [Aviso original](https://github.com/isaacs/node-tar/security/advisories/GHSA-23hp-3jrh-7fpw).
- Se verificaron instalación limpia, 130 tests, arranque de CLI y empaquetado con esa resolución. No cambió la versión del SDK Gemini ni el código funcional.
- Resultado completo: **0 críticos, 21 altos y 12 moderados**, todos en la cadena de herramientas de desarrollo. Se registran como mantenimiento pendiente; no se aplicó npm audit fix --force ni un cambio mayor automático de herramientas para ocultarlos. [Detalle](capturas/paso-13-dependencias.json).

## Límites conservados

La auditoría cierra el alcance funcional y documental del integrador. No garantiza disponibilidad futura de Gemini/Vercel, respuestas infalibles del personaje ni ausencia de toda vulnerabilidad. El código 79 es acceso compartido, sin identidad individual. La revisión visual se hizo en un navegador y tamaños definidos, sin certificación de lector de pantalla real. El panel Network del navegador no se capturó: se verificaron contratos HTTP y assets con un cliente independiente.

No se repitieron generaciones en este paso: los dos turnos reales con memoria del paso 12 siguen siendo la evidencia del comportamiento del modelo. Los avisos de herramientas descritos quedan visibles como limitación de mantenimiento.
