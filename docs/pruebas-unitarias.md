# Pruebas unitarias

## Iteración 3: cuestionario por personaje

Resultado en la rama de desarrollo: **270 casos en ocho archivos**. El cuestionario sustituye las expectativas del ciclo 3+2 y retira las cuatro pruebas del temporizador eliminado. Cubro contadores independientes, una intervención por personaje, acierto, diez errores y vuelta a la primera, tokens duplicados, recarga, migración, borrado y conflictos con proveedor/almacenamiento sustituidos. [Comportamiento y recorrido de UI simulado](smith.md).

## Iteración 2: integración (histórico)

Resultado de esa versión: **258 casos en ocho archivos**. Cuatro casos nuevos con reloj sustituido verifican disponibilidad para el retorno, un único temporizador pese a varios renders, pausa/reinicio del plazo y retirada al desmontar. No usan Gemini ni esperas reales.

## Registro de Smith

Resultado de esa etapa: **254 casos en ocho archivos**. Agregué 30 casos en smith-story.test.js sobre cadencia, aislamiento, fallos, comandos, recarga, borrado y almacenamiento; y cuatro en smith-scene.test.js sobre movimiento reducido, pausa, visibilidad, límites de resolución, fallback y limpieza. Actualicé el contrato de cuota: la respuesta 15 admitida se conserva y quota.blocked anuncia espera para la siguiente; ya no activa Smith.

## Registro de terminal

Resultado de esa etapa: **220 casos en seis archivos**. `tests/chat-controls.test.js` añade 32 casos sobre solicitudes directas, falsas menciones, comandos inválidos, confirmación/cancelación, restauración, aislamiento del proveedor, concurrencia y reglas de teclado/composición. La prueba de IME usa eventos representados por objetos; no equivale a una sesión física con todos los teclados.

## Registro de persistencia

Resultado de esa etapa: **188 casos en cinco archivos**. `tests/history-storage.test.js` agrega 36 casos de formato externo, límite global, guardado, restauración, envíos interrumpidos, borrado seguro, fallos, conflictos y retirada del controlador al cerrar una página. Usa almacenamiento y proveedor sustituidos; no consume Gemini ni Redis.

## Registro de la etapa de personajes

Resultado de esa etapa: **152 casos en cuatro archivos**. La suite conserva las pruebas de regresión y adapta el contrato de generación a `{character, messages}` y `{character, reply, quota}`.

Agregué `tests/characters.test.js` con 22 casos sobre identificadores permitidos, rechazo antes de reservar cuota, prompts por personaje, identidad de respuesta, cuota compartida, selección inicial, borradores/contextos separados, respuestas pendientes y recuperación de errores. Estos tests sustituyen al proveedor y no certifican el tono de sus generaciones reales.

## Registro de la versión entregada — Paso 9

Fecha: 27 de octubre de 2026. Resultado final: **130 casos aprobados en tres archivos de pruebas**.

## Cómo ejecutarlas

Desde la raíz `chat-morfeo-m3`:

```bash
npm test
```

No requiere arrancar Vercel Dev ni conectarse a Gemini/Redis. Para observar cómo se repiten al guardar cambios:

```bash
npm run test:watch
```

Termina el modo watch con Ctrl+C. No hace falta instalar nuevos paquetes: se usa Vitest 5.0.5 ya fijado en el proyecto.

El resultado `Test Files 8 passed (8)` indica que pasaron los ocho archivos; `Tests 270 passed (270)` cuenta los casos, incluidos los de `it.each`. No representa un porcentaje de cobertura del código.

## Organización vigente

El [mapa de verificación de la iteración 2](verificacion-iteracion-2.md) relaciona los ocho archivos y sus responsabilidades. La tabla siguiente conserva el desglose de la primera entrega.

## Matriz histórica de riesgos de la primera entrega

| Grupo | Casos | Qué protege |
| --- | ---: | --- |
| Conteo y validación | 6 | 279/280/281, emojis, espacios, saltos y tipos. |
| Rutas, enlaces y navegación | 13 | URL/vista, Atrás/Adelante mediante contrato, enlaces externos y normalización. |
| Sesión de conversación | 11 | Historial completo, concurrencia, rollback, borrador y snapshots. |
| Transporte HTTP | 16 | JSON, códigos permitidos, red, timeout y reintento sin duplicados. |
| Configuración de Gemini | 7 | Clave/modelo requeridos y ausencia de secretos en errores. |
| Handler serverless | 29 | Método, Content-Type, tamaño, roles y respuesta segura. |
| Acceso firmado en servidor | 13 | Cohorte79, cookie, firma, caducidad y origen. |
| Cuotas y recuperación | 15 | Minuto/día, DST, archivo concurrente, Redis sustituido y fallo cerrado. |
| Adaptador Gemini | 13 | Historial independiente, parseo, partes nulas, bloqueos y timeout. |
| Acceso y recuperación del cliente | 7 | Sesión compartida pendiente, desbloqueos,401,429 y recuperación tras fallo. |
| **Total** | **130** | |

Fuentes: [utils.test.js](../tests/utils.test.js), [app.test.js](../tests/app.test.js), [access-quota-gemini.test.js](../tests/access-quota-gemini.test.js).

## Aislamiento de las pruebas

[vitest.config.js](../vitest.config.js) selecciona únicamente `tests/**/*.test.js`, usa Node y carga [setup.js](../tests/setup.js) antes de cada archivo.

Antes de cada caso, `fetch` se sustituye por una función que rechaza llamadas. Si una prueba necesita una respuesta HTTP, debe proporcionar su propio mock. El teardown comprueba que nadie haya usado por accidente el fetch de bloqueo, incluso si esa prueba hubiera atrapado su rechazo como un fallo de red esperado. La suite no hace peticiones reales a Gemini ni a Redis.

Las variables privadas de proveedor/acceso se sustituyen por valores vacíos dentro del proceso de pruebas; no se editan `.env` ni `.env.local`. Los casos de configuración utilizan entornos ficticios explícitos. Vitest limpia/restaura mocks, globals y variables de entorno entre casos. El teardown restaura los temporizadores incluso si una aserción falla.

El módulo del cliente guarda acceso en memoria. Los siete casos de acceso importan una instancia nueva después de `vi.resetModules()`, evitando heredar una sesión de otro caso. Los tests de conversación ya crean una sesión por caso.

No se añadió una dependencia para medir líneas ni se fijó un porcentaje arbitrario: el criterio de cierre es comprobar los comportamientos y fallos que importan al proyecto. Las pruebas no contienen claves reales.

## Hallazgos y correcciones demostradas

Se añadieron primero siete casos de regresión y se ejecutaron contra el código anterior: **7 fallaron y los116 existentes pasaron**. Se conservaron los resultados para distinguir hallazgos observados de mejoras hipotéticas.

### 1. Respuestas incompletas o mal formadas de Gemini

Una respuesta sin candidato se clasificaba como bloqueada aunque no hubiese evidencia de bloqueo. Un `parts` que no fuera array, o una entrada nula entre las partes, podía generar un TypeError.

Se verifica ahora candidato/terminación y el tipo array antes de extraer texto. Las partes nulas o sin texto se ignoran; el texto marcado como pensamiento no se muestra. Los datos ausentes/inválidos producen `502 INVALID_RESPONSE`, mientras un bloqueo explícito sigue siendo `422 BLOCKED_RESPONSE` y MAX_TOKENS sigue siendo `502 TRUNCATED_RESPONSE`.

### 2. Códigos de error heredados de Object

El acceso `requestErrors[code]` también encontraba propiedades heredadas como `toString`. Un JSON mal formado podía provocar un mensaje interno de JavaScript en pantalla.

Se aceptan únicamente nombres propios del mapa mediante `Object.hasOwn`, y el resto utiliza un error controlado. No se muestra el mensaje bruto recibido del servidor. Esto no era una vía de acceso a claves; era un fallo de clasificación/presentación reproducido por las pruebas.

### 3. Comprobaciones adicionales del acceso

Se verifica que dos consultas simultáneas de sesión compartan una petición, que un segundo desbloqueo no se envíe mientras el primero está pendiente, que401 cierre el acceso conservando conversación/borrador y que un fallo de sesión permita consultar de nuevo. También se distingue la solicitud15 admitida del primer rechazo y se comprueba que un límite diario no se levante tras un minuto ni reenvíe el mensaje por sí solo.

La expectativa del formato Gemini se escribió de manera independiente: no se compara el resultado con la misma transformación usada por el código. Se verifica además que el proveedor no pueda modificar el historial original.

## Ejecuciones y evidencia

- Ejecución inicial de regresión: 7 fallos,116 aprobados,123 casos.
- Tras correcciones y siete pruebas del cliente: 130/130.
- Orden mezclado con semilla79: 130/130, sin fallos por orden.
- Ejecución final normal: 130/130.

Para reproducir el orden mezclado:

```bash
npm test -- --sequence.shuffle --sequence.seed=79
```

[Resumen reproducible](capturas/paso-9-resultados.json). Los logs completos se entregaron a Miguel en la guía del paso9. No se volvieron a ejecutar llamadas reales a Gemini/Redis para este paso.

## Lo que se comprueba por separado

La suite comprueba lógica y contratos con dobles de prueba. No certifica las animaciones, el foco del navegador, la apariencia responsive, la conducta lingüística de Gemini o el despliegue público. La conexión real de Redis y Gemini de la primera entrega se verificó en el paso8, su interfaz en el paso10 y su despliegue en el12. La evidencia de la iteración actual está en [verificación](verificacion-iteracion-2.md) y [evaluación de voces](evaluacion-personajes.md).
