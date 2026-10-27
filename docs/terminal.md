# Terminal: transferencias y teclado

## Uso

Desbloqueo con **79** y elijo mi primera conexión. Para cambiar de personaje escribo una petición directa, por ejemplo:

- `Quiero hablar con Trinity`
- `Morfeo, me gustaría hablar con el Oráculo, por favor.`
- `¿Puedo hablar con Morfeo?`
- `/hablar trinity`, `/hablar oráculo` o `/hablar morfeo`

La aplicación muestra origen y destino y pide confirmar. Cancelar o Escape conserva la petición y devuelve el foco al campo. Confirmar elimina únicamente el comando del borrador de origen, conserva los mensajes y recupera mensajes/borrador del destino. No agrega un turno ni reserva cuota. Si ya hablo con ese personaje, informa sin llamar a Gemini.

Reconozco un conjunto conservador de frases directas en `src/chat-controls.js`; no es un clasificador de lenguaje general. Una mención como «¿Qué piensa Trinity?» sigue siendo una pregunta. Si otra redacción no abre el diálogo, uso `/hablar nombre`. Un comando `/hablar` desconocido muestra ayuda local. Solo interpreto texto escrito y enviado por el usuario, nunca una respuesta de la IA.

No guardo una confirmación pendiente en localStorage. Recargar conserva el comando como borrador, sin ejecutarlo; debo solicitar y confirmar otra vez. Restaurar otro historial invalida el diálogo anterior. Al salir de Chat cancelo la intención y retiro listeners. Los mensajes continúan separados y los controles no se añaden al contexto.

## Teclado

**Enter envía**, **Shift+Enter agrega una línea** y el botón sigue disponible. El máximo continúa siendo 280 grafemas. Durante una respuesta no puedo enviar otra pregunta ni cambiar de personaje. Una tecla mantenida no reenvía.

La composición IME tiene seguimiento de compositionstart/compositionend; además compruebo isComposing y keyCode 229. Un margen de 80 ms tras compositionend impide que el Enter que confirma un carácter también envíe el texto. Si una pulsación ocurre en ese margen, puedo volver a pulsar Enter o usar el botón. La lógica se prueba con eventos representados por objetos; no afirmo haber ensayado todos los teclados IME físicos. Referencias: [isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing), [compositionend](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event).

Una transferencia local puede solicitarse durante una espera por cuota; el siguiente mensaje a Gemini continúa bloqueado hasta que el servidor admita solicitudes. Cambiar de canal no reinicia el contador. La intervención narrativa de Smith se implementará en la siguiente etapa.

## Acerca de

Conservé las tres rutas SPA. Diseñé tres tarjetas con SVG originales y estáticos: Morfeo, el Oráculo y Trinity. Las imágenes son decorativas; nombre, voz y descripción están en texto accesible. No funcionan como selector para saltarse una petición desde el chat. Las tarjetas se presentan en una columna móvil y tres desde 768 px.

## Evidencia del paso 5

- 220 pruebas en seis archivos; build y diff sin errores.
- Navegador: Enter envía una vez; Shift+Enter conserva el salto; Escape devuelve foco y borrador; 281 caracteres impiden envío.
- Entorno simulado: dos generaciones ficticias para dos mensajes; las transferencias no generan llamadas. Regreso al historial correcto y recarga con personaje/borrador restaurados.
- Acerca de: imágenes cargadas y sin desbordamiento horizontal a 320, 768 y 1024 px.
- Nuevas solicitudes reales a Gemini: **0**. Operaciones de cuota Redis para estos ensayos: **0**.
- [Tarjetas](capturas/iteracion-2/acerca-de-1024.png) · [Confirmación de cambio](capturas/iteracion-2/cambio-1024.png).
