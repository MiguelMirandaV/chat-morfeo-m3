# Registro del uso de IA

## Cómo leer este registro

Conservo el registro de la versión entregada y la preparación de la iteración 2. Cada sección describe lo ocurrido en su etapa; el README resume el producto disponible y el alcance de iteración distingue las funcionalidades aprobadas de las implementadas. Las secciones numeradas conservan la cronología: “pendiente” o “se implementará” describe lo que faltaba en aquella etapa, no el estado actual. Consulta [README](../README.md) y [mapa de evidencias](entrega.md) para el estado de entrega.

Miguel definió personaje, requisitos y dirección visual, creó las cuentas y guardó las credenciales. Codex realizó el desarrollo, los retratos, las pruebas y esta documentación. No se atribuyen a Miguel acciones técnicas de Codex.

## Prompts recibidos y efecto en la implementación

Los fragmentos entre comillas son instrucciones reales de Miguel conservadas en esta conversación. La columna de efecto resume decisiones posteriores; no es una transcripción literal de una respuesta de la IA.

| Fragmento de la solicitud | Efecto y evidencia |
| --- | --- |
| “Role: eres un senior full stack dev, tech lead, que es mi tutor durante el curso de full stack de henry.” | Plan por etapas, explicaciones de herramientas y código desarrollado por Codex. |
| “Utiliza la estructura sugerida del proyecto "simple" para desarrollar el proyecto” | Módulos src/app.js, chat.js, utils.js; función api/functions.js; sin framework frontend añadido. |
| “El personaje con el cual chatearemos es Morfeo de Matrix.” / “Debe haber un límite de 280 caracteres en la respuesta del usuario.” | Ficha de personaje, prompt del servidor y validación de grafemas en cliente/backend. |
| “Solo agrégale una animación tipo cascada de letras verdes tipo matrix en el "/home ".” | Lluvia decorativa con pausa, limpieza y movimiento reducido. |
| “Solo corrige el footer agregando mi copyright y link a github.” | Footer con nombre/año y enlace al repositorio. |
| “todo funciona bien menos las respuestas, Morfeo mi dio la misma respuesta exactamente a dos interacciones” | Se revisó la limitación del mock de aquella fase; después se sustituyó por Gemini y se evaluaron variación/contexto. |
| “El usuario debe autenticarse para "desbloquear" el chat con Morfeo, debe introducir el número de la cohorte de Henry (solo el número 79 habilita el chat)” | Validación backend y cookie firmada; no se presentó como identidad individual. |
| “continúa cuando hayas corregido los puntos identificados” | Correcciones de foco, acceso vencido y teclado, con evidencia de navegador y 130 tests aprobados. |

El mensaje ampliado también solicitó 15/min y 500/día, intervención de Smith, retrato 3D, portal por la boca y estética cyberpunk. Su desarrollo y los briefs visuales constan en la sección 8.

### Prompts de la aplicación y de los retratos

- **Chat:** fuente completa y vigente en [MORPHEUS_SYSTEM_PROMPT](../api/functions.js). Personalidad, brevedad, contexto, límites y manejo de intentos de cambio de personaje. [Versiones evaluadas y respuestas reales](evaluacion-prompt.md).
- **Retratos:** briefs de Morfeo y prompt completo de Smith conservados en la sección 8. Los briefs resumidos están identificados como resúmenes, sin presentarlos como texto literal de una llamada.
- **Revisión del trabajo generado:** se contrastaron sugerencias con documentación técnica, tests y navegador. Ejemplos concretos: script dev recursivo corregido; clasificación de respuestas ausentes y partes malformadas corregida tras siete regresiones fallidas; recuperación 401 y foco del portal corregidos tras QA. Los resultados y límites constan en pruebas.md.

No se reconstruyen como si fueran literales prompts internos del agente que no se conservaron. La evidencia diferencia solicitudes de Miguel, decisiones de Codex, respuestas del modelo y verificaciones de código.

## 1. Planificación y alcance

**Solicitud de Miguel:** analizar las lectures, la consigna, la guía y la rúbrica de Henry; proponer un plan con la estructura simple, sin extra credit, y desarrollar el código explicando cada etapa y el flujo de herramientas.

**Trabajo de Codex:** revisión del material, conservación de referencias, propuesta de trece pasos y criterios de aceptación asociados a la rúbrica. El plan fue aprobado por Miguel.

**Decisiones de Miguel:** Morfeo como personaje, interfaz inspirada en la terminal de Matrix, máximo de 280 caracteres por mensaje del usuario y desarrollo desde cero.

**Ampliación posterior:** “Solo agrégale una animación tipo cascada de letras verdes tipo matrix en el /home”. Se incorpora exclusivamente a Home como efecto decorativo, respetando movimiento reducido y deteniendo la animación al salir de la vista. Se implementará al construir la interfaz; no se afirma que ya esté funcionando.

**Resultado:** ficha en `alcance.md`, borrador del system prompt y casos de aceptación. El prompt todavía no ha sido evaluado con Gemini.

## 2. Preparación del entorno

**Solicitud de Miguel:** continuar con el plan aprobado.

**Trabajo de Codex:** revisión de herramientas instaladas y compatibilidad de paquetes; creación de carpeta, configuración npm/Vercel/Git, documentación inicial y página mínima para comprobar el entorno. La actividad real de GitHub y las comprobaciones se registran en `pruebas.md`.

**Criterio aplicado:** herramientas locales del proyecto, versiones registradas y secretos ignorados antes del primer commit. Los módulos iniciales no simulan una aplicación terminada. Los tests funcionales se escribirán junto con la lógica a verificar.

**Iteración después del acceso a Vercel:** Miguel creó la cuenta e inició sesión desde VS Code. Codex verificó la sesión, vinculó el proyecto y probó el arranque real. La CLI rechazó el script `dev` que llamaba a `vercel dev`; se sustituyó por `npm start` y se actualizó la documentación. También se corrigió el orden de las reglas de .gitignore que Vercel había modificado, para mantener .env.example como excepción. Se documenta el fallo y su corrección en lugar de presentar la configuración inicial como comprobada.

## 3. Interfaz mobile-first

**Solicitud de Miguel:** avanzar con el plan aprobado, conservando la estética de Matrix, la cascada exclusiva de Home y el máximo de 280 caracteres.

**Trabajo de Codex:** HTML semántico, funciones de las tres vistas, CSS con variables, Flexbox/Grid y breakpoints 768/1024, cascada de columnas animadas con pausa, contador con Intl.Segmenter y cuatro tests de sus casos borde. Se añadieron rewrites puntuales para que las URLs de la maqueta puedan abrirse y revisarse antes de introducir History API.

**Decisiones:** la decoración no recibe eventos ni se anuncia a lectores de pantalla. Se respeta movimiento reducido y se limpian los recursos al descartar la vista. Se usa el conteo por grafemas para que emojis compuestos y tildes descompuestas no produzcan diferencias con el contador. El envío no se simula como funcional: el botón está deshabilitado y la maqueta lo explica.

**Verificación:** Codex revisó las nueve combinaciones de vista y ancho, capturó las pantallas, comprobó pausa/reanudación, retorno con Atrás y el contador en el navegador. Detectó que la limpieza de pagehide debía respetar la caché de navegación y lo corrigió. Los resultados y las limitaciones están en pruebas.md; no se atribuyen estas comprobaciones a Miguel.

**Referencias técnicas consultadas:** [Intl.Segmenter en MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) y [prefers-reduced-motion en MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

## 4. Footer y routing SPA

**Solicitud de Miguel:** “Solo corrige el footer agregando mi copyright y link a github. Avanza con el siguiente paso del plan”.

**Trabajo de Codex:** copyright con nombre/año, enlace al repositorio, navegación con History API, funciones pequeñas exportables para tests, listener único de popstate, limpieza de vistas y fallback de Vercel con exclusiones de recursos/API. Se escribieron trece tests del router, dejando la suite en 17 casos pasando.

**Decisiones y correcciones:** evitar duplicar la ruta actual; mantener anclas, clicks modificados y enlaces externos a cargo del navegador; usar replaceState al normalizar; limpiar la cascada antes de desmontar Home. Se añadió una guardia al popstate para no destruir el campo de escritura al cambiar solo el fragmento de la URL.

**Verificación:** Codex comprobó navegación, Atrás/Adelante, foco, acceso directo, recarga y rutas desconocidas en el navegador. Para comprobar descargas de documentos utilizó un proxy temporal de observación HTTP, porque la herramienta del navegador no exponía la medición de rendimiento intentada inicialmente. El proxy no modifica la app, no registra cabeceras ni cuerpos y se cerró al terminar. Se observaron cero descargas HTML adicionales durante los cambios SPA. El footer se revisó y capturó en tres anchos.

**Referencia técnica consultada:** [Configuración y negative lookahead en Vercel](https://vercel.com/docs/project-configuration/vercel-json#negative-lookahead).

## 5. Chat en memoria

**Solicitud de Miguel:** “Avanza”, continuando el plan aprobado por pasos.

**Trabajo de Codex:** sesión única en `chat.js`, array de mensajes, borrador y estados de espera/error; respuestas predefinidas asíncronas; montaje y limpieza de suscripciones; render seguro con textContent, validación compartida y scroll acotado. Se amplió la suite a 31 tests.

**Decisiones:** separar el estado de la vista para conservar respuestas que terminan fuera de Chat; bloquear envíos antes del primer await; copiar el historial para el proveedor; revertir solo el turno fallido y restaurar el borrador. El futuro proveedor HTTP podrá sustituir la simulación manteniendo el contrato de la sesión.

**Iteración:** la comprobación visual detectó pérdida del foco al deshabilitar el botón. Se movió al campo al enviar y se verificó que permaneciera allí durante/después de la respuesta. Se acotó la altura móvil del panel para que el historial largo tenga scroll interno. Acerca de explica el estado actual de simulación.

**Verificación:** Codex comprobó la conversación, estados, navegación durante la espera, borrador, recarga, doble click, texto literal y tres tamaños en el navegador. Los fallos y reintentos se probaron con un proveedor inyectado en Vitest. Las respuestas de esta etapa no fueron generadas por Gemini y no demuestran comprensión contextual del personaje.

**Corrección solicitada por Miguel:** señaló respuestas idénticas en dos interacciones. Codex identificó un único texto por categoría y añadió variantes seleccionadas mediante el historial, sin repetir la respuesta previa. Se añadieron dos tests de regresión y se comprobó en navegador. Miguel comprendió el motivo de la simulación y pidió continuar al paso 6.

## 6. Función serverless y transporte HTTP

**Solicitud de Miguel:** comprendió el motivo de las respuestas predefinidas y pidió continuar al siguiente paso.

**Trabajo de Codex:** handler de Vercel con contrato POST/JSON, validación de historial, respuestas estructuradas y límite de bytes; requestReply con fetch, response.ok, timeout y errores seguros. Se trasladó la simulación al servidor y se mantuvo el historial de sesión independiente del DOM.

**Decisiones:** reutilizar la validación por grafemas en el servidor, exigir roles alternados y campos explícitos, enviar el historial completo y rechazar el exceso sin truncarlo. El cliente muestra mensajes controlados según el estado HTTP, sin mostrar excepciones originales ni reintentar automáticamente. No se añadieron dependencias.

**Verificación e iteración:** 76 tests sin red; 17 comprobaciones HTTP reales; un error 503 provocado mediante proxy local temporal, seguido de reintento y navegación durante la petición. Se corrigió la expectativa del script sobre /api/functions.js al comprobar que Vercel Dev ejecuta ese alias en vez de servir su fuente. El proxy se retiró al terminar. Las acciones de desarrollo y QA son de Codex; no se atribuyen a Miguel.

**Referencia consultada:** [Runtime Node.js y helpers de Vercel](https://vercel.com/docs/functions/runtimes/node-js), comprobado junto con las definiciones de la CLI local. El SDK y el prompt de Gemini se evaluarán en las etapas siguientes.

## 7. Prompt y configuración preparados; acceso pendiente

**Solicitud de Miguel:** continuar. Al consultar el estado de AI Studio, indicó que necesita crear la clave.

**Trabajo de Codex:** revisión de documentación oficial vigente, propuesta de modelo estable con nivel gratuito, prompt v1 bajo control del servidor, validación de configuración y matriz de evaluación. Se creó el archivo local ignorado con clave vacía y permisos privados. Se prepararon instrucciones de AI Studio y VS Code.

**Criterio aplicado:** distinguir la ficha inicial y una configuración revisada de una evaluación real. No se presentan ejemplos ni tests de código como resultados de Gemini. Se eligió omitir los parámetros de muestreo obsoletos al encontrar la guía específica del modelo. El máximo de tokens se tratará como presupuesto técnico; la brevedad y el contexto requieren observar respuestas reales.

**Intervención de Miguel:** la bienvenida observada de AI Studio solicita declaraciones personales y aceptación de términos; quedó a su cargo, junto con crear y guardar su clave directamente en el archivo local. Codex no recibió ni mostró una clave, no habilitó facturación y no cambió el chat del mock al proveedor real.

**Verificación:** 83 tests aprobados, incluyendo siete de configuración; exclusión de .env y ejemplo público sin clave. La preparación es revisable; el acceso/cuota y la evaluación del prompt permanecen pendientes de la clave local. Referencias y criterios están en evaluacion-prompt.md.

### Evaluación real y revisión del prompt

**Confirmación de Miguel:** “Clave guardada en .env”. Codex consumió esa variable local para consultar el modelo y evaluar el prompt, sin mostrarla ni versionarla.

**Trabajo realizado:** consulta del modelo (200), lectura de cuota en AI Studio y 20 generaciones REST. El piloto probó identidad y recuerdo de dos datos ficticios; después se probaron las otras entradas previstas. El prompt v1 produjo resultados útiles, pero también una suposición sobre el empleo y respuestas que hablaban de su papel. Codex revisó esas salidas, ajustó el prompt y volvió a ejecutar los casos afectados con v2 y v3.

**Resultado verificable:** v3 en el servidor; 11/6/3 respuestas conservadas por versión con historial, parámetros, longitud y terminación. Se verificaron memoria y respuestas distintas, y se corrigieron las referencias implícitas a ficción y los preámbulos sobre brevedad. Las respuestas son de Gemini; la revisión e implementación son de Codex; la creación y almacenamiento de la clave fueron de Miguel.

**Límites:** no se atribuye una garantía de obediencia o ausencia de repeticiones a esta muestra, y no se presenta la evaluación REST como una integración del chat. No se agregaron pruebas que intenten certificar voz de IA mediante comprobar palabras del prompt. La suite de código permanece en 83 tests; el paso 8 conectará el SDK y verificará el flujo completo.

## 8. Gemini real, ampliación Matrix y cuotas

**Solicitud de Miguel:** continuar e incorporar contador 15/min y 500/día, intervención Smith, estética cyberpunk, cara 3D de Morfeo, transición por la boca y acceso exclusivo para cohorte 79. Aportó dos capturas y [la referencia de The Guru Fox](https://dribbble.com/shots/27387438-Direct-Message-Daily-UI-013).

**Trabajo de Codex:** SDK oficial @google/genai 2.31.0, historial completo, prompt v3 ya evaluado, parseo de terminación y errores, timeout sin reintentos automáticos; cookie firmada y validación de cohorte/origen en servidor; contador atómico local y adaptador Redis para Vercel; formulario de acceso, cuotas, intervención Smith, transición, nuevos retratos y CSS. No se recibió ni mostró la clave. El secreto de sesión local se generó de forma privada. La clave existente se conservó.

**Ampliación del alcance:** la decisión posterior de Miguel prevalece sobre la exclusión inicial de acceso/persistencia. Se documentó que el código 79 es una puerta compartida, sin identidad individual; los únicos datos persistidos son contadores y tiempos, nunca conversación. La producción queda cerrada hasta conectar Redis. No se crea una base externa temporal ni se acepta un plan pago implícitamente.

**Imágenes:** herramienta integrada imagegen, fondo transparente, archivos PNG propios de esta interfaz. Morfeo cerrado y abierto comparten encuadre frontal para crossfade; una tercera generación produjo Smith. Se conservaron los originales y se copiaron los assets finales al repositorio. No se copiaron imágenes de Dribbble ni de las capturas del usuario.

Briefs aplicados (resumen de las indicaciones visuales):

1. Morfeo: busto CGI cinematográfico de alta calidad, frontal y simétrico; calvo, gafas negras redondas, abrigo negro, luz de borde verde, rostro claramente iluminado, fondo transparente, sin texto. Cabeza y torso centrados, cara dominante para animación.
2. Edición de Morfeo: preservar identidad, encuadre, pose, gafas y luz; abrir ampliamente la boca con cavidad oscura para convertirla en un portal. Mantener transparencia y alineación de ojos/cabeza.
3. Smith, prompt completo: “Create an original high-end cinematic 3D CGI bust of Agent Smith from The Matrix (1999), recognizable stern male agent, short slick dark brown hair, black rectangular sunglasses, black suit, white shirt and black narrow tie, frontal symmetrical view looking directly at camera, intimidating impassive expression, subtle amber-red rim light on the right and green rim light on the left, face and chest clearly illuminated and detailed, realistic sculpted skin and fabric, centered square portrait, head almost touches top edge, cropped at mid chest. Transparent background, isolated character cutout, no environment, no symbols, no text, no typography, no watermark. This is a character portrait asset for a cyberpunk terminal intrusion overlay.”

**Límite de la técnica visual:** retratos 3D renderizados, animados con CSS; no se atribuye al proyecto una malla WebGL o sincronización labial que no implementa.

**Verificación:** 116 tests sin red; dos turnos reales de Gemini desde la interfaz con datos ficticios Ariadna/programación y memoria correcta. El escenario Smith se verificó en un servidor QA aislado con proveedor sustituido, 429, borrador, espera y reintento: no consumió cuota real. Se revisaron las tres vistas a 320/768/1024 con medidas reales y sin overflow horizontal. Se retiraron tres tests del banco simulado al retirar ese banco; se agregaron pruebas de los nuevos riesgos. Auditoría de dependencias de producción: cero vulnerabilidades reportadas. El contador Redis está probado por contrato con mocks, pendiente de conexión real; esto no equivale a haber validado una base externa.


### Conexión real de Redis — 27 de octubre de 2026

Miguel creó/reutilizó la base e introdujo personalmente sus credenciales en .env; confirmó el guardado. Codex comprobó presencia y conexión sin revelar valores, reinició el servidor y verificó el Lua real en claves temporales aisladas. Se probaron20 reservas concurrentes, persistencia entre clientes, ventana móvil,500/501 y expiraciones; se eliminaron solo las dos claves de QA. El contador real no se alteró por esas pruebas. Una solicitud real desde la interfaz a Gemini incrementó el contador diario a1, que permaneció después de reiniciar Vercel Dev y coincidió con una lectura de un proceso nuevo. No fue necesario cambiar código ni instalar paquetes. Se actualizaron documentación y evidencias sin guardar credenciales.


## 9. Consolidación de pruebas unitarias

Miguel pidió continuar. Codex revisó los116 casos, detectó huecos concretos en el parseo de respuestas y en el acceso del cliente y añadió primero siete regresiones. La ejecución produjo siete fallos reales; se corrigieron la clasificación de respuestas ausentes, el manejo de partes mal formadas/nulas y la aceptación accidental de propiedades heredadas como códigos de error. Después se añadieron siete pruebas del acceso y su recuperación.

Se introdujo configuración de Vitest y un setup con fetch bloqueado salvo sustitución explícita, entorno de pruebas aislado y restauración entre casos. Se evitó una expectativa que usaba la misma transformación de la implementación para comprobar su resultado. Resultado final130/130 en orden normal y mezclado con semilla79. No se agregaron paquetes, porcentajes arbitrarios de cobertura, llamadas a Google/Redis ni cambios de diseño. La revisión visual y la prueba pública siguen en sus pasos del plan.


## 10. Revisión UX y correcciones

Miguel pidió continuar cuando se corrigieran los puntos identificados. Codex corrigió el foco del portal, la recuperación del formulario al vencer el acceso y el scroll con teclado. También evitó reconstruir mensajes anteriores ante errores y reescribir textos idénticos cada segundo. Codex verificó los cambios con respuestas/cuotas controladas, documentó veinte comprobaciones y doce combinaciones de viewport/vista y volvió a ejecutar130 tests. No se consumieron Gemini/Redis reales ni se cambiaron dependencias. La preferencia del sistema y un lector de pantalla real no se probaron activamente; los límites se registran en revision-ux.md.


## 11. Consolidación de documentación

Miguel pidió continuar. Codex contrastó README y documentos con la consigna/rúbrica conservadas y con el código real. Se completaron clonación, instalación, uso, arquitectura, despliegue, variables y problemas frecuentes; se agregaron capturas identificadas como reales o controladas y un mapa de evidencia. Se sustituyó la ficha de alcance desactualizada por el alcance vigente y se aclaró la cronología de este registro.

Se consultaron las ayudas de la CLI instalada y las guías oficiales de Vercel para Git, configuración, variables y protección. La guía de publicación es preparación; no se afirmó una URL productiva ni acciones remotas no ejecutadas. No se cambió código funcional, no se hicieron nuevas generaciones Gemini ni operaciones Redis. La validación documental se registra en pruebas.md.


## 12. Publicación real

Miguel pidió continuar y después solicitó estado por la demora. Codex configuró las cinco variables en Vercel por stdin y comprobó la conexión GitHub/main, sin mostrar valores. La inspección previa detectó .env en la subida CLI: se agregó .vercelignore antes de desplegar. La prueba real detectó timeouts de 16 s; se midieron, se ampliaron plazos y se volvió a comprobar la lógica y dos turnos públicos correctos. Se registran también intentos fallidos, consumo y límites; no se presenta una respuesta simulada como Gemini. La recarga de una pestaña con posible borrador fue rechazada por revisión automática; se usó una pestaña nueva sin perder estado. Evidencia final en produccion.md.


## 13. Auditoría final

Miguel pidió continuar. Codex clonó el repositorio público, instaló desde el lockfile sin secretos y ejecutó 130 tests. Revisó la consigna/rúbrica, código, historial Git, enlaces y contratos públicos. Al detectar un aviso crítico de tar en herramientas, consultó el aviso del mantenedor, validó el parche 7.5.22 primero en el clon y después lo aplicó al proyecto. Se repitieron npm ci, tests y empaquetado. Se registraron también los 33 avisos no críticos de herramientas, 0 de producción y los límites de las pruebas. No se generaron nuevas respuestas Gemini. Se completó el informe de entrega sin atribuir una calificación otorgada por Henry.


## Iteración 2 — Preparación y reglas aprobadas

Miguel aprobó el plan, eligió historiales separados y sustituyó la regla de Smith por una intervención después de cada tres turnos normales, durante dos turnos con Smith. Codex conservó la versión entregada con un tag, creó la rama feat/matrix-v2 y reescribió el README en primera persona, con el código 79 explícito y sin una bitácora de pasos.

El alcance define los turnos, la acumulación entre personajes, el retorno a la conversación anterior y la independencia respecto de las cuotas. Se mantiene la modalidad local de diálogo de Smith propuesta en el plan aprobado. El código de la aplicación aún conserva el comportamiento de la versión entregada; las nuevas funciones se implementarán en las etapas siguientes. No se instalaron dependencias ni se generaron respuestas Gemini para esta preparación.


## Iteración 2 — Prototipo de Inicio

Codex implementó el rostro procedural de caracteres, lluvia volumétrica y transición de mandíbula/cámara usando Three.js 0.186.1. No generó ni utilizó una fotografía para la nueva Home. El chat conserva por ahora su retrato y comportamiento anteriores. La biblioteca y su licencia se copian localmente durante el build.

Se corrigieron durante el desarrollo un error de sintaxis en la función gaussiana, la competencia entre contextos 2D/WebGL del mismo canvas y una primera lluvia demasiado tenue. La revisión de navegador comprobó WebGL real, tamaños 320/768/1024, pausa, transición completa, Escape y desmontaje. Los escenarios sin WebGL y con movimiento reducido se sirvieron con fixtures locales identificados, sin presentarlos como pruebas del proveedor real. Los códigos 78/79 se comprobaron contra la función local. Las 130 pruebas pasan; la auditoría de producción reporta cero avisos. No se generaron respuestas Gemini en esta etapa.


## Iteración 2 — Personajes, contrato y conversaciones

Codex implementó identificadores públicos permitidos, prompts de servidor distintos para Morfeo, el Oráculo y Trinity, y el contrato explícito de personaje. Refactorizó la sesión en tres conversaciones en memoria, con borradores/errores separados y bloqueo de cambio durante un envío. Incluyó una elección inicial mínima para revisar los tres personajes; el cambio solicitado dentro del chat sigue pendiente de su etapa.

La suite suma 152 casos. Al actualizar el contrato se corrigieron expectativas y un fixture antiguo sin identidad en la respuesta; no se eliminó la prueba de recuperación que lo detectó. Se comprobaron tres respuestas reales mediante la interfaz local, una por personaje, con preguntas y nombres ficticios. Redis pasó de 30 a 33 reservas diarias. La consulta inicial de disponibilidad falló de forma transitoria; el reintento de desbloqueo y la lectura posterior funcionaron, sin sustituir las cuotas reales por contadores locales. La muestra confirma integración, no una evaluación exhaustiva de personalidad o seguridad.

La revisión visual comprobó la selección tras autenticar, etiquetas de autor/canal, tamaños 320/1024 sin desbordamiento y conservación de personaje/borrador al navegar entre Chat y Acerca de. No se modificaron credenciales ni configuración de Redis, y no se presentó persistencia tras recarga como si ya existiera.


## Iteración 2 — Persistencia

Codex implementó la clave versionada morfeo.conversations.v1, validación externa, guardado de historiales/borradores, restauración, indicador y borrado actual/todos con diálogo. El controlador conserva registros inválidos hasta una decisión explícita, informa fallos de lectura/escritura y pausa al detectar cambios externos. No cambió credenciales, dependencias, API de generación ni cuotas.

La revisión detectó dos situaciones que se corrigieron: el callback de un envío podía escribir al cerrar la página, y el aborto de fetch podía retirar la marca de interrupción antes de pagehide. Se añadió limpieza del controlador y se conserva la marca ante errores de red/timeout. También se corrigió el borrado de una conversación cuyo borrador excedía el límite de almacenamiento.

Se usaron escenarios locales con datos ficticios y proveedor/cuotas simulados para revisar recarga, interrupción sin reenvío, diálogo y cancelación, conflicto entre pestañas, guardado bloqueado y contenido oculto antes de 79. El borrado efectivo y sus fallos se comprobaron en tests con almacenamiento sustituido. La suite alcanza 188 casos. Se reinició la instancia Vercel Dev propia porque su manifiesto inicial no incluía history-storage.js; se comprobó después que respondía 200 con el tipo JavaScript correcto. No se generaron respuestas Gemini para esta etapa.

## Iteración 2 — Terminal y teclado

Usé Codex para implementar peticiones directas de transferencia con confirmación, Enter/Shift+Enter y tres tarjetas con SVG originales. Revisé el cambio como un control local, separado del contexto del modelo: cancelar conserva el comando, confirmar recupera solo el historial del destino y las intenciones no se guardan. Se corrigió el selector del texto descriptivo del diálogo y se usó Object.hasOwn para rechazar nombres heredados como constructor.

La suite alcanza 220 casos; las pruebas de UI usaron respuestas simuladas en un puerto propio, sin nuevas generaciones Gemini ni operaciones Redis. Se comprobaron Enter, Shift+Enter, Escape/foco, bloqueo de 281 caracteres, transferencias, restauración y tarjetas a 320/768/1024 px. La composición IME se verificó como lógica de eventos, no con teclado físico. Smith 3+2 sigue pendiente de su etapa.

## Iteración 2 — Smith 3+2

Usé Codex para implementar la cadencia, persistencia independiente y el rostro procedural proyectado en Canvas con lluvia de caracteres. Las respuestas locales se identifican en la UI; no se atribuyen a Gemini. El cierre del turno se cuenta antes de liberar pending para impedir carreras; transferencias y errores no cuentan. Las pruebas verifican borrado de historial sin reiniciar el ciclo y conflictos entre pestañas.

La suite alcanza 254 casos. Se comprobó en UI simulada la entrada al tercer turno, recarga tras 1/2, respuesta 2/2 y retorno automático; en un escenario con cuota agotada, Smith siguió funcionando y devolvió Trinity con las tres respuestas y el bloqueo de cuota intactos. Se corrigió un temporizador que debía cancelarse al usar el botón de retorno. No hubo nuevas generaciones reales de Gemini.

## Iteración 2 — Integración de lectura, foco y temporizadores

Con la Preview de Smith confirmada por Miguel, revisé problemas concretos del ciclo de vida. Incorporé un controlador de retorno que pausa ante ocultamiento, diálogos o lectura desplegada, y se cancela al desmontar. El foco vuelve al campo si desaparece un control de Smith. Eliminé renders cada segundo cuando no hay cuenta atrás de cuota y consultas periódicas de la vista oculta. La suite pasa 258 casos, incluidos cuatro de este controlador con reloj sustituido. El QA visual usa una API simulada; no se generaron nuevas respuestas reales. No se presenta como un benchmark de GPU/FPS.

## Iteración 2 — Evaluación real de voces y contexto

Usé Codex para ejecutar una muestra acotada contra el handler real, con acceso firmado, Redis y Gemini configurados. Seis generaciones iniciales comprobaron voz, memoria y límites. Detecté que el Oráculo describía su personaje sin nombrarse al responder quién era. Se precisó únicamente esa instrucción y se verificó con dos generaciones adicionales, sin cambiar otros prompts. Conservo ambos registros con sus hashes y textos completos.

Ocho respuestas aceptadas; memoria de nombre/interés correcta para los tres personajes; 45–67 palabras. Algunas superan la guía habitual de una a tres frases: se registra como límite y no se recorta la salida. La cuota diaria observada pasó de 58 a 66. La suite continúa en 258 casos; no se confunden con llamadas reales. El script optativo requiere --real, respeta la cuota y guarda solo casos ficticios en .data. No se expusieron claves, cookies ni variables privadas. [Informe](evaluacion-personajes.md).

## Iteración 2 — Consolidación documental

Con asistencia de Codex consolidé el README en primera persona, con acceso 79, funciones vigentes, capturas actuales y enlace de Preview identificable. Actualicé alcance, mapa de objetivos/rúbrica, arquitectura, persistencia y despliegue; este último ahora refleja npm run build y Three.js. Separé los resultados históricos de la primera entrega de la evidencia de esta iteración, sin convertir cifras antiguas en verificaciones nuevas.

Agregué un índice documental, una síntesis de verificación y el documento de publicación con el cierre de producción aún pendiente. Corregí que borrar todos los historiales conserva a Smith si está activo y documenté su clave separada. La revisión de esta etapa comprueba enlaces locales y coherencia con la configuración; no genera nuevas respuestas ni afirma una nueva auditoría de vulnerabilidades.

## Iteración 2 — Integración y publicación

Con la Preview aprobada y el plan autorizado, integré el pull request #1 a main tras comprobar rama limpia, Vercel satisfactorio, 258 tests y build. Conservé el tag de la primera entrega. Vercel publicó el merge funcional c6659ecc8f4e33d09b0a610aa0aaa26e03164bcf en Production.

La revisión pública completó 36 comprobaciones HTTPS, incluida igualdad de archivos por hash, privados 404, acceso/cookie y rechazo de entradas inválidas. Dos generaciones reales de Morfeo verificaron contexto por HTTP. En el navegador, tres del Oráculo comprobaron identidad y memoria y activaron Smith; sus dos respuestas locales, recarga 1/2 y retorno automático conservaron el historial. Los cambios de canal y la recarga final mantuvieron seis mensajes. El contador diario pasó de 72 a 77 y no aumentó con Smith.

Actualicé README y documentos al dominio público y conservé la evidencia con datos ficticios. Los intentos de accionar el botón de retorno durante la despedida coincidieron con el cambio de estado del temporizador; se confirmó el retorno automático, sin presentarlos como una comprobación nueva del botón en producción. No se borraron conversaciones anteriores, no se cambiaron credenciales y no se provocó agotamiento real de cuota. [Registro de publicación](publicacion-iteracion-2.md).
