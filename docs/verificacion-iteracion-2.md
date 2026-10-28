# Verificación de la iteración 2

## Pruebas automatizadas

**258 casos en ocho archivos** pasan. La última ejecución funcional fue posterior a la corrección del Oráculo; el build también pasó. Los cambios de documentación no añaden casos ni generaciones.

| Área | Pruebas |
| --- | --- |
| Entrada, sesión y transporte | [utils.test.js](../tests/utils.test.js). |
| Routing | [app.test.js](../tests/app.test.js). |
| Acceso, cuota y adaptador Gemini | [access-quota-gemini.test.js](../tests/access-quota-gemini.test.js). |
| Identidad y conversaciones independientes | [characters.test.js](../tests/characters.test.js). |
| Persistencia, borrado y conflictos | [history-storage.test.js](../tests/history-storage.test.js). |
| Transferencias, teclado y retorno disponible | [chat-controls.test.js](../tests/chat-controls.test.js). |
| Cadencia y persistencia narrativa | [smith-story.test.js](../tests/smith-story.test.js). |
| Animación y limpieza | [smith-scene.test.js](../tests/smith-scene.test.js). |

Uso mocks y reloj sustituido; npm test bloquea fetch real no configurado. Estos resultados no equivalen a un porcentaje de cobertura ni demuestran el tono de un modelo.

## Escenarios visuales y datos simulados

- Home con rostro de caracteres, portal, pausa, movimiento reducido y fallback: [diseño y revisión](home-3d.md).
- Selección autenticada, historiales separados y borradores conservados al navegar.
- Restauración al recargar, envío interrumpido sin reenvío, almacenamiento bloqueado o corrupto y conflicto entre pestañas: [persistencia](persistencia.md).
- Cancelar/confirmar transferencias, Escape y retorno del foco; Enter/Shift+Enter y bloqueo de 281 grafemas: [terminal](terminal.md).
- Tres turnos normales → dos locales Smith → personaje anterior; cuota agotada independiente, recarga en 1/2 y contexto intacto: [Smith](smith.md).
- Lectura abierta mantiene Smith en 2/2 pasado el plazo; navegar a Acerca de y volver conserva el estado. Temporizadores cancelados al desmontar y reanudados con un plazo completo cuando la vista está disponible.

El borrado efectivo y sus fallos se ensayaron con almacenamiento sustituido. La composición IME, movimiento reducido y recursos gráficos tienen pruebas de lógica; no se afirma una prueba física de todos los teclados ni un benchmark de GPU/FPS.

## Capturas actuales

| Evidencia | Captura |
| --- | --- |
| Inicio 3D | [Home](capturas/iteracion-2/home-1024.png). |
| Selección de personajes | [Terminal](capturas/iteracion-2/seleccion-1024.png). |
| Galería de Acerca de | [Tarjetas](capturas/iteracion-2/acerca-de-1024.png). |
| Guardado y restauración | [Borrador](capturas/iteracion-2/guardado-1024.png). |
| Transferencia confirmada | [Diálogo](capturas/iteracion-2/cambio-1024.png). |
| Smith en móvil/escritorio | [320 px](capturas/iteracion-2/smith-320.jpg), [1024 px](capturas/iteracion-2/smith-1024.jpg). |
| Pausa de lectura | [Smith 2/2](capturas/iteracion-2/lectura-en-pausa.jpg). |

Las capturas se hicieron localmente y en diferentes momentos de la iteración. Algunas usan respuestas simuladas; no se presentan como resultados de producción.

## Servicios reales

La etapa inicial de personajes incluyó tres respuestas reales desde la UI local. La evaluación final agregó **ocho generaciones** contra el handler real con acceso firmado, Redis y SDK. Comprueba nombre/interés, voz y límites; incluye un ajuste de identidad del Oráculo y su repetición. [Método, textos, hashes y límites](evaluacion-personajes.md).

Miguel confirmó el funcionamiento de la Preview tras el ciclo Smith. Los estados Ready se comprobaron con Vercel CLI. Esa confirmación y los ensayos locales no sustituyen la verificación del dominio público de esta iteración, que se registrará en [publicación](publicacion-iteracion-2.md).

## Qué debe permanecer explícito

La evaluación real es acotada y algunas respuestas superan la orientación de tres frases. El código 79 es compartido. localStorage es estado por origen, sin sincronización y con coordinación de mejor esfuerzo. Un fallo del proveedor puede consumir cuota. Los registros históricos de la primera entrega mantienen sus resultados originales; no son una nueva auditoría de dependencias ni una nueva verificación pública.
