# Guía de entrega y mapa de evidencias

Desarrollé Chat con Morfeo como Proyecto Integrador M3 de Henry, con asistencia de Codex. Esta guía describe la iteración con persistencia, tres personajes, teclado y un reto del M3 de Smith por personaje. El código de acceso es **79**.

- [Repositorio](https://github.com/MiguelMirandaV/chat-morfeo-m3).
- [Aplicación pública](https://chat-morfeo-m3.vercel.app/home), código **79**, sin cuenta Vercel.
- [Instalación y uso](../README.md), [alcance](alcance.md), [verificación](verificacion-iteracion-3.md) y [publicación](publicacion-iteracion-3.md).

La iteración 3 está disponible en [Preview](https://chat-morfeo-m3-git-feat-matrix-v3-miguel-miranda-v.vercel.app/home) para revisión antes de integrarse a `main`. Registro su despliegue y límites en el [informe de publicación](publicacion-iteracion-3.md). La [publicación de la iteración 2](publicacion-iteracion-2.md) es evidencia histórica y corresponde al dominio público hasta aprobar esta revisión.

## Ocho objetivos del M3

| Objetivo | Código y evidencia |
| --- | --- |
| 1. Responsive, mobile-first y estados de chat | [CSS](../src/styles.css), Grid/Flex y tamaños revisados; [capturas y límites](verificacion-iteracion-3.md). |
| 2. SPA con History API | [Router](../src/app.js), Home/Chat/About, pushState/popstate, [tests](../tests/app.test.js) y reglas de Vercel. |
| 3. Promises, async/await y Fetch | [postApi y sesiones](../src/chat.js), espera/error, finally y borrador; [tests de sesión/transporte](../tests/utils.test.js). |
| 4. JSON y separación de responsabilidades | [Backend](../api/functions.js): validateHistory, toGeminiContents y parseGeminiReply; render separado en mountChat. |
| 5. Prompting y criterio ante la IA | [Prompts de servidor](../api/functions.js), [evaluación y corrección del Oráculo](evaluacion-personajes.md), [cómo utilicé la IA](uso-ia.md). |
| 6. APIs de IA, roles, tokens y cuotas | Historial completo propio, assistant → model, systemInstruction, presupuesto de salida y reserva; [arquitectura](arquitectura.md). |
| 7. Secretos y función proxy | Variables privadas, cookie firmada, validación y Redis; [.env.example](../.env.example), [.vercelignore](../.vercelignore), [tests](../tests/access-quota-gemini.test.js). |
| 8. Vitest, mocks, GitHub y Vercel | 275 casos en ocho archivos, [pruebas](pruebas-unitarias.md), [despliegue](despliegue.md) y [cierre de publicación](publicacion-iteracion-3.md). |

## Ocho categorías de evaluación

| Categoría | Evidencia de esta iteración |
| --- | --- |
| Responsive | Home, selección y chat revisados en móvil/escritorio; Acerca de en 320/768/1024; intervención Smith cabe a 320. No se certifica cada combinación en todos los navegadores. |
| SPA | Tres vistas, URL coherente, enlaces internos, atrás/adelante y restauración de estado sin reenviar mensajes. |
| Asincronía y Fetch | Bloqueo de doble envío, errores controlados, timeout y recuperación; escenarios de fallo con mocks. |
| Gemini | Tres prompts propios; ocho generaciones reales de evaluación, tres recuerdos correctos y corrección de identidad verificada. |
| Seguridad y serverless | Acceso y cuotas de servidor, contrato validado antes de reservar, render de texto y exclusión de archivos privados. |
| Chat y UX | 280 grafemas, estados y scroll; historiales separados, transferencias confirmadas y cuestionario local de Smith una sola vez por personaje. |
| Tests | 275 pruebas en ocho archivos, sin servicios reales; ocho generaciones reales documentadas aparte. |
| Despliegue/documentación | Rama GitHub y documentación actualizados; el informe distingue Preview de Production y registra las comprobaciones realizadas. |

## Buenas prácticas

Elegí voces distintas y evalué contexto, tono y límites con datos ficticios. Mantuve claves fuera del cliente, responsabilidades separadas, commits descriptivos, comentarios sobre decisiones y pruebas sin red. Las revisiones de UI usan tamaños concretos; los casos de cuota/fallo se simulan para no agotar solicitudes reales.

La regla mínima de historial en sesión fue ampliada por el extra credit aprobado de localStorage. Conservo la estructura simple y registro cuándo una evidencia pertenece a la primera entrega. No atribuyo a una simulación las propiedades del proveedor real ni uso una auditoría histórica como prueba actual de seguridad.

## Guion para presentar el proyecto

1. Abre la aplicación con **79** y presenta las tres rutas y voces.
2. Envía un mensaje; explica los 280 grafemas, Enter/Shift+Enter y la espera.
3. Solicita un cambio de personaje y confirma; muestra su historial separado y recuperación al recargar.
4. Completa tres intercambios con un personaje. Falla una pregunta de Smith y acierta la siguiente; explica que el reto es local, se conserva al recargar y no reinicia la cuota.
5. Sigue una pregunta: navegador → función → Redis → Gemini → respuesta validada → vista.
6. Ejecuta npm test y explica un caso de error o restauración con mock.
7. Presenta la corrección del Oráculo basada en respuestas reales y reconoce los límites observados.
8. Muestra el commit y despliegue públicos verificados en el informe de publicación. Explica mi dirección del producto y el trabajo realizado con asistencia de Codex.

La rúbrica orienta la evidencia; Henry decide la calificación.
