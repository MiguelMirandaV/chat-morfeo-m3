# Publicación verificada de la iteración 2

**27 de octubre de 2026 · America/Bogota.** Publiqué la iteración en [chat-morfeo-m3.vercel.app](https://chat-morfeo-m3.vercel.app/home). El código de acceso es **79** y el dominio público abre sin iniciar sesión en Vercel.

## Integración y versión

Integré [el pull request #1](https://github.com/MiguelMirandaV/chat-morfeo-m3/pull/1), con comprobaciones Vercel satisfactorias y el commit revisado `e20efc4268febab4adfe4dad9057e170a1a43cae`. El merge funcional es **`c6659ecc8f4e33d09b0a610aa0aaa26e03164bcf`** en `main`.

Vercel confirmó Production **Ready**, despliegue `dpl_A3bBKUB1TXrKgEMCzX5tpQLudEjS`, con ese SHA y el dominio público. Los cambios posteriores de cierre actualizan documentación y capturas; no cambian `src`, `api` ni la configuración funcional. [Metadatos del despliegue funcional](capturas/iteracion-2/produccion/despliegue-funcional.json).

La primera entrega permanece en `m3-v1-entregado`, sobre `7af140e6c5d204968a085140da6ca6e043d1f3ea`. [Su registro histórico](produccion.md) conserva sus resultados originales.

## Pruebas antes de integrar

Pasaron **258 pruebas en ocho archivos** y el build. La rama estaba limpia, se contrastó el diff y se mantuvieron secretos fuera de Git. La Preview había sido confirmada funcional por Miguel. El proyecto existente usa `main` como rama Production, Node 24.x, raíz del repositorio, instalación npm ci, build npm run build y salida src.

## Verificación HTTPS pública

Completé **36 comprobaciones** con un cliente HTTP independiente:

- Home, Chat y Acerca de responden correctamente sin login Vercel.
- Dieciséis archivos, incluyendo HTML, CSS, módulos, Three.js/licencia y retratos vectoriales, coinciden por SHA-256 con los archivos locales.
- `.env`, `.env.local`, `.data/quota.json`, `.git/config`, package.json, vercel.json y docs/README.md devuelven 404.
- La API exige acceso; rechaza cohorte 78 y admite 79. La cookie tiene HttpOnly, SameSite=Strict y Secure. No se registró su valor.
- Rechaza 281 caracteres, un personaje inválido y un origen ajeno. Durante estas validaciones no aumentó el contador diario observado.
- Dos respuestas reales de Morfeo completaron una conversación; recordó Ada y JavaScript.

[Resultados HTTP y textos ficticios](capturas/iteracion-2/produccion/http.json). Las peticiones de este registro son HTTP reales, distintas de los ensayos de handler de la evaluación de voces.

## Navegador en producción

La Home cargó el renderer WebGL. El código 79 abrió el portal y llegó a la elección de personaje. El chat del navegador estaba vacío al comenzar; no borré conversaciones anteriores.

Elegí el Oráculo y completé **tres respuestas reales**. Se identificó, recordó Lucía/JavaScript y atendió una pregunta sobre comprobar una función. Smith apareció después del tercer turno normal. Sus dos respuestas fueron locales; la recarga en 1/2 conservó el progreso y el retorno automático recuperó los seis mensajes del Oráculo, con foco en el campo y el ciclo en 0/3.

El contador diario se mantuvo en 77 durante las interacciones de Smith. El cambio al canal Trinity y de regreso al Oráculo, con confirmación, conservó sus mensajes. Una nueva recarga restauró los seis mensajes. Acerca de mostró las tres tarjetas. La consola consultada al cierre no mostró errores ni advertencias.

[Estado visible y conversación](capturas/iteracion-2/produccion/navegador.json) · [Home](capturas/iteracion-2/produccion/home.jpg) · [Chat restaurado](capturas/iteracion-2/produccion/chat.jpg) · [Smith 2/2](capturas/iteracion-2/produccion/smith.jpg).

## Consumo y límites

Esta publicación utilizó **cinco generaciones reales**: dos de Morfeo por HTTP y tres del Oráculo en el navegador. El contador diario observado pasó de **72 a 77**. Las dos interacciones locales de Smith y los cambios de personaje no añadieron generaciones. No provoqué 16 solicitudes ni modifiqué límites o credenciales.

La evaluación anterior de tres voces y sus ocho generaciones queda en [su informe](evaluacion-personajes.md). Las pruebas responsive y de fallos de esta iteración están en [verificación](verificacion-iteracion-2.md); no se repitieron todas las combinaciones para este cierre ni se hizo una nueva auditoría de vulnerabilidades.

Las conversaciones son locales a cada origen: Preview y Production no comparten almacenamiento. Los datos ficticios de esta revisión quedaron en el navegador de prueba. Las respuestas futuras pueden variar; los servicios externos pueden fallar y el código 79 no identifica personas.
