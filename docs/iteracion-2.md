# Iteración 2 — Alcance aprobado y criterios de aceptación

## Punto de partida y control de versiones

La versión entregada queda identificada por el tag `m3-v1-entregado`, sobre el commit `7af140e6c5d204968a085140da6ca6e043d1f3ea`. La iteración se desarrolla en `feat/matrix-v2`. `main` continúa representando la versión publicada; la integración se realizará al completar la revisión de Preview.

Este documento describe funcionalidades aprobadas. Su presencia aquí no significa que estén implementadas. Las etapas 1 y 2 están implementadas en la rama: preparación y prototipo de Home. Los personajes, persistencia y Smith 3+2 corresponden a las siguientes etapas.

## Decisiones aprobadas

- Código de acceso **79**, validado en servidor antes de mostrar el chat o una conversación guardada.
- Tres personajes: Morfeo, el Oráculo y Trinity; cada uno tendrá su prompt de servidor e historial independiente.
- Persistencia de conversaciones y borradores en localStorage, indicador real de guardado y borrado de una conversación o de todas, con confirmación.
- Inicio de pantalla completa: lluvia intensa y rostro tridimensional de Morfeo formado por caracteres, con deformación, movimiento y apertura de boca hacia el chat.
- Inicio, Chat y Acerca de conservan sus rutas SPA. Acerca de tendrá tarjetas de los tres personajes.
- Tras desbloquear, la terminal preguntará con quién quieres hablar. Para transferirse a otro personaje se solicitará desde la conversación, con confirmación.
- Enter envía; Shift+Enter agrega una línea. Se conserva el botón y el máximo de 280 grafemas, con composición IME y bloqueo de doble envío.
- README en primera persona, centrado en producto, uso e instalación. Bitácora, decisiones y pruebas quedan en sus documentos correspondientes.

## Smith: ciclo narrativo 3 + 2

La corrección de Miguel sustituye la regla propuesta de cinco interacciones tras agotar cuota. **Después de cada tres turnos completos con los personajes, Smith interviene durante dos turnos completos.**

### Qué cuenta como turno

Un turno consiste en un mensaje válido del usuario y una respuesta completa. No cuentan mensajes vacíos, errores, reintentos fallidos, selección inicial, confirmaciones ni solicitudes de cambio de personaje procesadas como controles.

Los tres turnos normales se acumulan entre Morfeo, el Oráculo y Trinity. Cambiar de personaje no reinicia el contador. Así el ciclo mantiene su cadencia aunque el usuario cambie de conversación. Después de dos turnos con Smith, el contador normal vuelve a cero.

### Ejemplo de aceptación

1. Usuario/Morfeo: turno completo 1.
2. Usuario/Morfeo: turno completo 2.
3. Transferencia a Trinity: no suma turno.
4. Usuario/Trinity: turno completo 3; se muestra la intervención de Smith.
5. Usuario/Smith: turno completo 1 de 2.
6. Usuario/Smith: turno completo 2 de 2; se recupera Trinity y su conversación intacta.
7. Usuario/Trinity: comienza un nuevo ciclo, turno 1 de 3.

### Presentación y contexto

- La terminal se degrada al entrar Smith; su rostro está formado por lluvia densa con una carcajada visual animada.
- El progreso muestra 0/2, 1/2 y 2/2. El usuario vuelve al personaje que estaba activo al iniciarse la intervención.
- La conversación de Smith se mantiene fuera de los tres historiales de personajes y no se envía a sus prompts.
- Conservo la modalidad de diálogo local planteada en el plan aprobado: las dos respuestas de Smith no consumen Gemini. Se documentará esta diferencia; no se presentarán como generaciones del modelo.
- La recarga o la navegación conserva el ciclo y su progreso. Borrar historial no se usa para reiniciar cuota ni para saltar la intervención activa.
- No se procesa un cambio de personaje mientras Smith controla la terminal.

### Relación con las cuotas

El ciclo narrativo 3+2 es independiente de las cuotas. Smith aparecerá al tercer turno normal completado, sin tener que provocar 16 solicitudes.

Se mantienen 15 reservas de Gemini por 60 s móviles y 500 al día, compartidas entre personajes e instancias mediante Redis. El intento 16 se rechaza. Un fallo de generación puede consumir reserva sin sumar un turno narrativo completo.

Al terminar Smith, si Gemini sigue sin cuota, la aplicación conserva personaje, contexto y borrador y explica la espera restante. No reinicia el contador remoto. Los errores 429 no crean otro requisito de cinco interacciones ni reemplazan la cadencia aprobada.

## Persistencia y acceso

Los datos de localStorage son del navegador y origen actuales. Se validarán estructura, versión, personajes y contenido antes de restaurarlos. Se conservarán únicamente claves propias; no se usará localStorage.clear para borrar datos ajenos.

Se manejarán JSON corrupto, almacenamiento bloqueado/lleno y cambios desde otra pestaña. Un envío interrumpido al recargar se recuperará como borrador sin reenvío automático. No se guardarán credenciales ni cookies en localStorage.

Se restaurará el historial correspondiente al personaje seleccionado; una respuesta pendiente seguirá asociada a su conversación. El texto siempre se renderizará de forma segura y se mantendrá íntegro dentro de los límites permitidos por el servidor.

## Desarrollo por etapas

| Etapa | Entrega y criterio de cierre |
| --- | --- |
| 1. Preparación | Tag de la versión entregada, rama propia, README de producto y reglas aprobadas. |
| 2. Prototipo visual | Lluvia volumétrica y rostro de caracteres; Home, formulario y portal ejecutables. |
| 3. Personajes y estado | Identificadores permitidos, tres prompts, contrato de API e historiales separados. |
| 4. Persistencia | Guardado, restauración, borrado e indicador, con manejo de fallos. |
| 5. Terminal y teclado | Selección, cambio solicitado, tarjetas de Acerca de, Enter/Shift+Enter. |
| 6. Smith | Ciclo 3+2, intervención animada, progreso y retorno íntegro al personaje. |
| 7. Integración visual | Acceso y portal conectados con los estados; rendimiento, foco, limpieza y adaptación. |
| 8. Verificación | Tests por riesgos, QA con fallos/cuotas controlados y muestra real acotada por personaje. |
| 9. Documentación | README final vigente, arquitectura, capturas, pruebas y uso de IA actualizados. |
| 10. Publicación | Preview comprobada, integración a main, producción y commit final verificados. |

Cada etapa tendrá explicación, instrucciones concretas, evidencia y commit. Las cuotas y los fallos se ensayarán con escenarios aislados para no desperdiciar solicitudes reales. La animación se revisará en móvil, tablet, escritorio, movimiento reducido y sin soporte gráfico suficiente.

## Conexiones y alcance técnico

Reutilizo el repositorio, el proyecto Vercel y Redis actuales. El desarrollo de Preview comparte las cuotas cuando usa el mismo proyecto de Gemini. No se necesitan otras cuentas para esta preparación.

Mantengo HTML/CSS/JavaScript con módulos ES, Node en Vercel y Vitest. El prototipo gráfico usa Three.js 0.186.1 fijado, con módulos y licencia locales preparados durante el build. [Diseño y verificación de Home](home-3d.md). Se conservarán la estructura simple, la exclusión de secretos, los commits y la documentación del uso de IA.

La calificación final corresponde a Henry. Los criterios de Excelente se verificarán con código, pruebas y evidencia de la versión realmente implementada.
