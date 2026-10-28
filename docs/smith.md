# Smith: un reto del M3 por personaje

Después de tres intercambios completos con un personaje, Smith toma su terminal una sola vez. Morfeo, el Oráculo y Trinity tienen contadores independientes. Un intercambio requiere mensaje válido y respuesta completa; errores, selección y transferencias no cuentan. La respuesta del tercer intercambio queda guardada antes de mostrar el reto.

## Cuestionario y retorno

Muestro una pregunta del [banco del M3](preguntas-smith.md) con dos opciones. Un error muestra una explicación breve y avanza a la siguiente; después de diez errores se vuelve a la primera. Un acierto recupera el personaje y su conversación y marca su reto como superado. Smith no vuelve a intervenir en ese canal.

El banco vive en `src/smith-questions.js`. Es educativo y local: no consulta la API ni agrega las opciones elegidas a los historiales de IA. La corrección está en el código del cliente y puede inspeccionarse; no es un examen seguro.

Durante el reto oculto el formulario de conversación y bloqueo envíos y transferencias. La última respuesta del personaje permanece disponible en un desplegable. No hay botón para omitir el cuestionario ni temporizador que lo complete. Cada intento tiene un token distinto para rechazar respuestas duplicadas o de una pregunta anterior. La UI evita doble clic y repetición de Enter; una protección de 500 ms entre respuestas no completa el reto por tiempo.

## Persistencia y migración

`morfeo.smith-story.v2` guarda:

- `version: 2`.
- `characters`: los tres identificadores, cada uno con `turns` entre 0 y 3 y `passed` booleano.
- `active`: `null` o el personaje del reto y su número de intento. El resto de dividir ese número por diez determina la pregunta.

Valido claves, tipos y coherencia: solo puede existir un reto pendiente; un reto superado requiere tres intercambios; un contador de tres sin superar debe corresponder al reto activo. La recarga conserva la pregunta pendiente o la exención ya obtenida.

La migración conserva `morfeo.conversations.v1` y sus borradores. Inicio los contadores nuevos en cero y dejo intacta `morfeo.smith-story.v1`; el contador global anterior no permite reconstruir progreso por personaje. Sus diálogos locales no se incorporan a las conversaciones normales.

Borrar uno o todos los historiales no modifica el reto ni sus exenciones. Si se borró la conversación durante Smith, el acierto devuelve ese canal vacío. El progreso pertenece al navegador y origen actuales, no a una cuenta sincronizada.

Si el registro es inválido o el almacenamiento falla, conservo el registro anterior y aviso que el progreso continúa solo en memoria. Ante cambios externos conocidos, pauso las respuestas y escrituras hasta recargar. La comparación previa a guardar y los eventos detectan conflictos, pero no son una transacción entre pestañas ni entre las claves de conversación y progreso.

## Cuotas y escena

Los límites de solicitudes siguen en Redis. Una cuota agotada muestra espera sin convocar otro Smith. Resolver el reto no reinicia cuotas; al volver, el envío normal puede seguir esperando disponibilidad.

La escena toma todo el viewport con lluvia y un rostro grande de caracteres: gafas rectangulares, cabello, nariz con relieve, mandíbula, traje y carcajada visual. El rostro ocupa la izquierda en escritorio y la parte superior en móvil. El cuestionario usa un panel oscuro con scroll propio; la navegación permanece encima para salir sin resolver ni perder el reto.

El render se ajusta a una superficie lógica máxima de 1100 × 900 y densidad de píxeles máxima de 1.5. La cuadrícula de lluvia y la superficie del rostro están acotadas: los tests de pantallas enormes comprueban menos de 5000 trazos de glifos por dibujo. El bucle de animación dibuja como máximo cada 50 ms. Es un presupuesto de implementación, no una medición de FPS en todos los equipos.

Pausar congela el instante actual. Con movimiento reducido aparece una imagen estática y el control indica «Movimiento reducido». Una página oculta no dibuja ni programa nuevos frames. Desmontar cancela y retira los recursos; un callback tardío no puede reactivarlos. Si Canvas falla, conservo el rótulo de Smith y el cuestionario.

Durante la toma de pantalla oculto las barras normales, pero los avisos de guardado y las acciones para resolver conflictos quedan disponibles en el panel. Cancelar su diálogo devuelve foco al cuestionario. Al acertar, salir del chat o perder acceso retiro la clase global y recupero la presentación normal.

## Verificación de esta implementación

La suite completa pasa **275 casos en ocho archivos**, sin llamadas reales a Gemini o Redis. Los casos de Smith cubren independencia, una intervención por personaje, diez errores y vuelta al inicio, acierto, tokens antiguos, fallos de API, migración, recarga, borrado y conflictos de almacenamiento. Se retiraron los cuatro casos del temporizador eliminado y se sustituyeron las expectativas del antiguo ciclo por las reglas nuevas.

Con frontend real y API local simulada comprobé: tercer intercambio → pregunta 1 → error → pregunta 2 → recarga → acierto → seis mensajes originales recuperados → recarga → envío con Enter sin nueva intervención. La revisión detectó y corrigió el foco al recuperar un reto tras validar acceso. No hubo errores o avisos de consola en ese recorrido. No es una prueba del proveedor ni una certificación de todos los dispositivos.

La revisión de la escena comprobó pausa, navegación a Acerca de y vuelta a la pregunta pendiente, acciones de conflicto y cancelación con foco, y acierto con seis mensajes recuperados. Los viewports CSS embebidos de 320 y 768 px no desbordan; ambas opciones de la pregunta inicial quedan dentro del panel de 320 × 640. Movimiento reducido y fallo de Canvas se simularon explícitamente en fixtures locales; no se cambió la preferencia del sistema. [Evidencia y límites](verificacion-iteracion-3.md).
