# Smith: intervención narrativa 3 + 2

Después de tres turnos normales completos, Smith toma la terminal. Un turno cuenta cuando el usuario obtiene una respuesta completa de Morfeo, el Oráculo o Trinity. Los tres se acumulan entre personajes. Mensajes vacíos, errores, selección inicial y cambios de personaje no cuentan.

Smith responde a dos mensajes válidos mediante textos locales originales, con variantes temáticas. La interfaz lo identifica como **diálogo local sin Gemini**. Su conversación no se mezcla con los historiales normales ni llega a sus prompts. Después de 2/2, el botón Recuperar conexión o un temporizador de 12 segundos devuelve el personaje anterior; sus mensajes y borrador siguen intactos. El plazo permite leer la despedida y puede omitirse con el botón.

Durante Smith no se procesan transferencias. La última respuesta del personaje queda disponible en un desplegable. Se conserva Enter/Shift+Enter y el máximo de 280 grafemas. Los errores de Gemini pueden consumir reserva remota, pero no suman turno narrativo.

## Persistencia

La clave `morfeo.smith-story.v1` contiene versión, turnos normales, personaje de retorno, hasta dos pares de mensajes Smith y su borrador. Se valida antes de cargar. `morfeo.conversations.v1` conserva por separado las conversaciones de los tres personajes.

Recargar en 1/2 recupera esa primera interacción y no la repite. Recargar en 2/2 no genera una tercera: espera restaurar la conexión. Navegar retira la animación y el temporizador; al volver se monta el estado guardado. Borrar una o todas las conversaciones no modifica el ciclo. Si se borraron los mensajes del personaje de retorno, se recupera ese canal vacío.

Si el almacenamiento falla o el registro es inválido, conservo el registro anterior y muestro que el progreso continúa solo en memoria. Otra pestaña que avance el ciclo pausa nuevos envíos en esta pestaña; debe recargarse para recuperar el progreso guardado. Antes de recargar conviene revisar cualquier borrador local y el indicador de conflictos del historial.

La coordinación entre pestañas es de mejor esfuerzo, no una transacción entre ambas claves. El ciclo narrativo es estado cliente y puede alterarse desde las herramientas del navegador; no es una protección de seguridad. Las cuotas reales permanecen en Redis y no se reinician desde esta narrativa.

## Cuotas

La ventana de 15 solicitudes y el máximo diario de 500 son independientes. Una cuota agotada muestra un aviso de espera; no crea otra intervención de Smith. Durante sus dos interacciones locales no se llama al endpoint ni se reserva cuota. Al regresar, si el proveedor sigue sin cupo, el envío normal continúa bloqueado y se conserva el borrador.

La respuesta 15 admitida se muestra completa. Si el servidor anuncia quota.blocked, el cliente prepara la espera para el siguiente envío. No convierte esa respuesta en un error.

## Escena

Canvas dibuja lluvia y un rostro procedural proyectado con gafas, traje y boca que se abre y cierra como una carcajada. Todo se forma con caracteres, sin fotografía ni audio. El cambio de UI anuncia que Smith tomó la señal; no representa una intrusión real.

El bucle se limita a 20 fps y a una densidad de píxeles de 1.5. Se pausa al ocultar la página y se cancela al desmontar la vista. El botón permite detenerlo. Movimiento reducido mantiene una imagen estática y elimina el glitch. Sin Canvas, el diálogo conserva un rótulo de texto. Referencias: [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event).

## Evidencia

254 tests en ocho archivos, con mocks de proveedor y almacenamiento. La lógica cubre el ciclo repetido, aislamiento del contexto, bloqueo de transferencias bajo Smith, errores, recarga, borrado y conflictos. La escena se prueba con un contexto sustituido para movimiento reducido, pausa, visibilidad y retirada de recursos.

En navegador local con API simulada se verificaron 0/3 → 3/3 → Smith 0/2 → recarga 1/2 → 2/2 → retorno al contexto original. Otro escenario agotó la cuota simulada al tercer turno: Smith respondió localmente y devolvió Trinity con el bloqueo intacto. Las capturas corresponden a escenarios simulados. No se usaron nuevas generaciones reales de Gemini en este paso.

Capturas de QA simulado: [Smith a 320 px](capturas/iteracion-2/smith-320.jpg) · [Smith a 1024 px](capturas/iteracion-2/smith-1024.jpg).
