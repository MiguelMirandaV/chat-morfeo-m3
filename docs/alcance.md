# Alcance funcional de Chat con Morfeo

Creé una SPA en español para conversar con tres interpretaciones ficticias de Matrix. Conservo HTML, CSS y JavaScript con módulos ES, una función Node en Vercel y la estructura simple `/src`, `/api` y `/tests` del M3.

## Recorrido y rutas

| Ruta | Experiencia |
| --- | --- |
| `/home` | Lluvia volumétrica, rostro procedural de caracteres y acceso con **79**. La cámara entra por la boca hacia el chat; incluye pausa, omisión y fallback 2D. |
| `/chat` | Acceso validado, elección inicial de Morfeo, el Oráculo o Trinity, historial propio, envío y recuperación de errores. |
| `/about` | Presentación del proyecto, tres tarjetas de personajes y explicación de uso y datos. |

History API mantiene URL y vista sin recargar. Atrás/Adelante y la carga directa se resuelven mediante el router y el fallback estático de Vercel.

## Conversaciones

- Entrada de hasta **280 grafemas**: espacios, saltos y emojis compuestos cuentan. Un texto vacío o excesivo no se envía; se conserva para corregirlo.
- **Enter envía**, **Shift+Enter** agrega una línea; también existe un botón. La composición IME y las repeticiones de tecla no deben provocar envíos involuntarios.
- Mensajes del usuario y personaje diferenciados, estado de escritura, scroll al último turno y borrador recuperable ante error.
- Un envío pendiente bloquea otro envío y un cambio de personaje. La respuesta queda asociada al personaje que la solicitó aunque se navegue a otra vista.
- Para cambiar se escribe una petición directa o `/hablar trinity`, `/hablar oráculo`, `/hablar morfeo` y se confirma. Los comandos no se añaden al contexto ni consumen Gemini.
- Cada petición normal envía el historial completo de su personaje, hasta 64 KiB. El servidor rechaza el exceso; no recorta mensajes.

## Extra credit incorporado

| Grupo | Implementación |
| --- | --- |
| Historial persistente | Conversaciones y borradores separados en localStorage; restauración, indicador real de guardado, borrado confirmado y manejo de fallos/conflictos. |
| Múltiples personajes | Tres prompts de servidor, elección inicial, cambio solicitado y tres tarjetas visuales en Acerca de. |
| Envío con teclado | Enter y botón para enviar; Shift+Enter conserva el salto de línea. |

La persistencia amplía expresamente el comportamiento mínimo del M3 que conservaba historial solo hasta recargar. No incorporé timestamps, copiar respuestas, toggle claro/oscuro ni un indicador animado de escritura como extras de esta iteración.

## Ampliaciones propias

Smith aparece **una sola vez por personaje**, después de tres intercambios completos con ese personaje. Su rostro de caracteres invade la pantalla y presenta una pregunta del M3 con dos opciones. Un error avanza a la siguiente de las diez preguntas, en ciclo; un acierto devuelve la conversación y evita nuevas intervenciones en ese canal. El cuestionario es local y no consume Gemini ni modifica las cuotas.

Guardo contadores, pregunta pendiente y retos superados en una clave independiente. Borrar historiales conserva ese progreso. Durante Smith no se procesan transferencias. La escena permite pausa, respeta movimiento reducido y conserva el cuestionario si falla Canvas; no hay retorno por temporizador. La terminal normal usa emblemas, mensajes y controles esenciales, sin fotografías ni explicaciones del proyecto.

## Acceso, datos y cuotas

El código **79** abre una sesión compartida mediante cookie firmada de ocho horas; no identifica personas. La clave de Gemini y los prompts permanecen en el servidor. El historial se envía a Gemini para responder y se guarda localmente cuando el navegador lo permite. El texto recibido se muestra con textContent.

Redis guarda cantidades y tiempos, no conversaciones. Reserva hasta **15 solicitudes por 60 segundos móviles y 500 por día del Pacífico**, compartidas entre personajes y despliegues que usan la misma base. Un fallo posterior puede consumir reserva. El ciclo narrativo no modifica esos contadores.

localStorage pertenece al origen y no sincroniza dispositivos. Sus fallos, registros inválidos o cambios de otra pestaña se anuncian; no prometo almacenamiento infalible ni coordinación transaccional. [Detalle de persistencia](persistencia.md) y [Smith](smith.md).

## Evidencia y límites

[Entrega y rúbrica](entrega.md) relaciona los ocho objetivos con el código y las verificaciones. [Verificación de esta iteración](verificacion-iteracion-3.md) distingue tests, escenarios simulados y generaciones reales. La publicación pública está documentada con su commit y resultados; [estado de publicación](publicacion-iteracion-3.md).

La calificación corresponde a Henry. Los prompts pueden fallar o repetirse, los servicios pueden no estar disponibles y la revisión de tamaños concretos no certifica todos los dispositivos. El rostro es procedural, sin garantía de semejanza fotorrealista con un actor.

[Alcance histórico de la primera entrega](alcance-v1.md) · [Decisiones y etapas aprobadas](iteracion-3.md).
