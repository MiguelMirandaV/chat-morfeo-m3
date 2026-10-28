# Iteración 3 — Documentación y experiencia

## Alcance aprobado

Trabajo sobre la versión publicada `27825b0524753fa041f460d8eb5ec412d5f7ae37`, en la rama `feat/matrix-v3`. Esta especificación describe la próxima versión; la aplicación publicada conserva el comportamiento de la iteración 2 hasta la integración y el despliegue.

1. Reescribir el uso de IA en primera persona, con ejemplos puntuales de prompts, respuestas y decisiones verificables. Evitar la bitácora y distinguir las citas de los resúmenes.
2. Sustituir el ciclo global Smith 3+2 por una única intervención por personaje, después de tres intercambios completos con ese personaje.
3. Resolver la intervención mediante el [cuestionario M3](preguntas-smith.md): diez preguntas fijas, dos opciones por pregunta y un acierto para volver.
4. Presentar el rostro de caracteres de Smith a gran escala, con lluvia intensa, conservando legibilidad, teclado y movimiento reducido.
5. Usar emblemas cifrados para todos los personajes del chat. Conservar el rostro de Morfeo en Inicio.
6. Simplificar la terminal: conversación, controles necesarios y contadores breves. Presentar la información del proyecto y del proveedor en Acerca de y documentación.

## Reglas de aceptación

### Intercambios y progreso

- Un intercambio cuenta únicamente al recibir una respuesta completa para un mensaje válido. No cuentan fallos, selección ni cambios de personaje procesados como controles.
- Morfeo, el Oráculo y Trinity acumulan su propio progreso de cero a tres. Cambiar de personaje conserva ese progreso.
- Al completar el tercer intercambio, conservo la respuesta recibida y presento el reto de Smith para ese personaje.
- Un acierto marca el reto de ese personaje como superado y recupera la conversación, su contexto y su borrador. Smith no vuelve a interrumpirlo.
- Borrar una conversación o todos los historiales no borra los retos superados ni reinicia el reto pendiente.
- El progreso persiste en el navegador y origen actuales. No constituye autenticación ni una restricción imposible de alterar desde el cliente.

### Cuestionario

- Cada intervención nueva comienza por la pregunta 1 del banco común.
- Muestro una sola pregunta y dos botones de respuesta; el campo de conversación queda deshabilitado durante el reto.
- Una respuesta incorrecta avanza a la siguiente pregunta; después de la décima vuelve a la primera. El feedback anterior no acumula preguntas en pantalla.
- Una respuesta correcta finaliza la intervención. No hay conversación libre obligatoria con Smith ni retorno automático por tiempo.
- La recarga conserva el personaje del reto y la pregunta pendiente. Un doble clic no debe contestar también la pregunta siguiente.
- Las respuestas se validan localmente con un identificador de opción. No se envían a la API ni se añaden al historial del personaje.
- Las animaciones se pueden pausar o reducir sin completar el reto. Navegar a otra vista tampoco lo completa.

### Migración y fallos de almacenamiento

- Conservo los historiales y borradores válidos de la versión anterior.
- Al estrenar esta versión, inicio los contadores por personaje en cero. No atribuyo a un personaje los intercambios del contador global anterior.
- El antiguo ciclo 3+2 no equivale a superar el nuevo cuestionario. Sus mensajes locales no se incorporan a los historiales normales.
- Versiono y valido el nuevo estado antes de restaurarlo. No utilizo `localStorage.clear()` ni modifico claves ajenas.
- Si el almacenamiento no está disponible, explico que el progreso funciona solo en memoria. Si hay datos inválidos o cambios desde otra pestaña, evito sobrescribirlos silenciosamente.

### Cuotas y terminal

- Mantengo las cuotas de Redis y su tiempo de espera. Un error de cuota no suma intercambios ni vuelve a convocar a Smith después de superar un reto.
- Mantengo acceso con **79**, tres rutas SPA, historiales separados, cambio de personaje solicitado desde el chat, Enter para enviar, Shift+Enter para salto de línea y máximo de 280 grafemas.
- Conservo errores accionables, estado de envío, eliminación de historial con confirmación e indicador de guardado; reduzco su ocupación visual.
- El efecto de Smith no oculta la pregunta, las respuestas ni el foco. Limito el trabajo gráfico en pantallas grandes y suspendo animación cuando la página está oculta.

## Entregas

| Paso | Resultado verificable |
| --- | --- |
| 1. Preparación | Rama, este alcance y diez preguntas contrastadas con el M3. |
| 2. Uso de IA | Relato breve en primera persona; citas y decisiones verificables. |
| 3. Comportamiento | Estado por personaje, migración, cuestionario y pruebas de sus transiciones. |
| 4. Terminal | Emblemas y controles compactos; información técnica fuera de la conversación. |
| 5. Intervención visual | Smith de gran escala con cuestionario legible y accesible en móvil y escritorio. |
| 6. Integración y entrega | Pruebas, build, README y documentación vigentes, Preview, revisión, PR y producción comprobada. |

Ejecuto cada paso individualmente, con explicación y commit coherente. Reutilizo el entorno, GitHub, Redis y Vercel existentes. La revisión de Preview precede a la publicación. La verificación se centra en los cambios y los riesgos de regresión; las preguntas y los casos límite se prueban sin consumir Gemini.

## Comprobaciones necesarias al implementar

1. Dos turnos con Morfeo y dos con Trinity no activan Smith; el siguiente turno de Morfeo sí.
2. Respuesta fallida, transferencia y doble envío no adelantan indebidamente el contador.
3. Diez errores recorren las diez preguntas y vuelven a la primera; un acierto devuelve al personaje correcto.
4. Recargar conserva la pregunta pendiente; superar el reto conserva la exención al recargar, cambiar de personaje y borrar historial.
5. Cada uno de los tres personajes puede activar su propia intervención una sola vez.
6. La migración conserva mensajes y borradores; no presupone progreso por personaje a partir del contador global.
7. Pausa, movimiento reducido, navegación y cuotas no conceden ni revocan un reto superado.
8. Teclado, viewport móvil, estados pendientes y diálogos siguen siendo utilizables; la animación se libera al salir de la vista.

Los ocho objetivos y las recomendaciones del proyecto siguen vigentes: responsive, SPA, asincronía, JSON y separación de responsabilidades, criterio ante IA, contexto de personajes, secretos en servidor y pruebas/despliegue. La evidencia respalda la entrega; la calificación corresponde a Henry.
