/** Banco educativo local: no hace peticiones ni añade respuestas al contexto de IA. */
export const SMITH_QUESTIONS = Object.freeze([
  {
    id: 'm3-mobile-first', prompt: '¿Cómo comienzas una interfaz mobile-first?',
    options: ['Con estilos base para pantallas pequeñas y mejoras para anchos mayores.', 'Con estilos base para escritorio y reducción de todos los elementos al final.'],
    correctOption: 'a', explanation: 'La base funciona en móvil; las media queries agregan mejoras cuando hay más espacio.',
  },
  {
    id: 'm3-flex-column', prompt: 'En un contenedor Flexbox, ¿qué propiedad coloca sus elementos en una columna?',
    options: ['justify-content: column', 'flex-direction: column'],
    correctOption: 'b', explanation: 'flex-direction define la dirección del eje principal; column no es un valor válido de justify-content.',
  },
  {
    id: 'm3-history-render', prompt: 'Después de llamar a history.pushState() para ir a /chat, ¿qué debe hacer tu aplicación?',
    options: ['Renderizar la vista correspondiente; pushState() no dispara popstate.', 'Esperar a que pushState() dispare automáticamente popstate para renderizar.'],
    correctOption: 'a', explanation: 'pushState cambia la URL; el router debe actualizar la vista. popstate atiende la navegación por el historial.',
  },
  {
    id: 'm3-await', prompt: 'Dentro de una función async, ¿qué ocurre cuando await espera una promesa pendiente?',
    options: ['Se bloquea todo el hilo de JavaScript hasta que la promesa se resuelve.', 'Se suspende esa función y el navegador puede atender otras tareas.'],
    correctOption: 'b', explanation: 'await suspende la continuación de esa función sin bloquear por sí mismo el hilo principal.',
  },
  {
    id: 'm3-fetch-http', prompt: 'Si fetch() recibe una respuesta HTTP 404, ¿cómo detectas el fallo HTTP?',
    options: ['Confías en que fetch() rechazará siempre la promesa por ese estado.', 'Compruebas response.ok y manejas el estado de error.'],
    correctOption: 'b', explanation: 'Un HTTP 404 no rechaza por sí solo la promesa de fetch; response.ok es falso.',
  },
  {
    id: 'm3-json-storage', prompt: 'Para guardar un objeto en localStorage y recuperarlo como objeto, ¿qué combinación usas?',
    options: ['JSON.stringify() al guardar y JSON.parse() al recuperar.', 'JSON.parse() al guardar y JSON.stringify() al recuperar.'],
    correctOption: 'a', explanation: 'localStorage guarda cadenas: stringify serializa y parse interpreta el JSON. También hay que validar los datos.',
  },
  {
    id: 'm3-system-prompt', prompt: '¿Para qué sirve el system/context prompt de un personaje?',
    options: ['Para sustituir el historial completo en cualquier conversación.', 'Para definir su identidad, tono, límites y forma de responder.'],
    correctOption: 'b', explanation: 'Las instrucciones definen el comportamiento; el historial aporta el contexto de los intercambios.',
  },
  {
    id: 'm3-api-secret', prompt: '¿Dónde debe usarse la clave privada de la API de IA?',
    options: ['En la función del servidor, leyéndola desde variables de entorno.', 'En un módulo JavaScript enviado al navegador, aunque su nombre esté oculto.'],
    correctOption: 'a', explanation: 'El código del navegador es inspeccionable; el servidor realiza la petición sin entregar la clave al cliente.',
  },
  {
    id: 'm3-finally', prompt: 'En un flujo try/catch/finally de una petición, ¿dónde puedes desactivar la carga tanto ante éxito como ante error?',
    options: ['Solamente en catch.', 'En finally.'],
    correctOption: 'b', explanation: 'finally permite limpiar el estado de carga al salir del flujo tanto con éxito como con error.',
  },
  {
    id: 'm3-fetch-mock', prompt: '¿Cómo pruebas respuestas exitosas y fallidas de una petición sin depender de una API real?',
    options: ['Sustituyendo fetch por un mock con resultados controlados.', 'Llamando a la API real cada vez y esperando que responda igual.'],
    correctOption: 'a', explanation: 'Un mock reproduce resultados sin red ni cuota; debe restaurarse entre pruebas.',
  },
].map(question => Object.freeze({ ...question, options: Object.freeze(question.options) })));

/** Un token distinto por intento impide aplicar dos veces una respuesta a la misma pregunta. */
export function getSmithQuestion(story) {
  if (!story.active) return null;
  const index = story.active.attempt % SMITH_QUESTIONS.length;
  const question = SMITH_QUESTIONS[index];
  return {
    id: question.id, token: `${story.active.character}:${story.active.attempt}`, number: index + 1,
    total: SMITH_QUESTIONS.length, prompt: question.prompt,
    options: question.options.map((text, index) => ({ id: index === 0 ? 'a' : 'b', text })),
  };
}
