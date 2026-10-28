# Cuestionario de Smith — Módulo 3

Banco de la iteración 3, implementado en `src/smith-questions.js` y conectado al reto local de Smith.

Preparé estas preguntas a partir de las lectures proporcionadas en `M3.md` y los objetivos del Proyecto Integrador. Son formulaciones propias sobre los conceptos del curso. La columna de corrección sirve para implementar y revisar el banco; no se muestra antes de responder en la interfaz.

Cada pregunta tiene un identificador estable, dos opciones y una única respuesta correcta. Hay cinco respuestas correctas A y cinco B. El orden es fijo: un error avanza; después de la décima se vuelve a la primera; un acierto finaliza el reto. Cada intervención nueva comienza en la primera.

## 1. Diseño mobile-first — `m3-mobile-first`

**¿Cómo comienzas una interfaz mobile-first?**

- **A.** Con estilos base para pantallas pequeñas y mejoras para anchos mayores.
- **B.** Con estilos base para escritorio y reducción de todos los elementos al final.

**Correcta: A.** La base debe funcionar en móvil; las media queries agregan mejoras cuando hay más espacio.

## 2. Flexbox — `m3-flex-column`

**En un contenedor Flexbox, ¿qué propiedad coloca sus elementos en una columna?**

- **A.** `justify-content: column`.
- **B.** `flex-direction: column`.

**Correcta: B.** `flex-direction` define la dirección del eje principal. `column` no es un valor válido de `justify-content`.

## 3. Navegación SPA — `m3-history-render`

**Después de llamar a `history.pushState()` para ir a `/chat`, ¿qué debe hacer tu aplicación?**

- **A.** Renderizar la vista correspondiente; `pushState()` no dispara `popstate`.
- **B.** Esperar a que `pushState()` dispare automáticamente `popstate` para renderizar.

**Correcta: A.** `pushState()` cambia la URL y añade una entrada. El router debe actualizar la vista; el listener de `popstate` atiende la navegación por el historial.

## 4. Asincronía — `m3-await`

**Dentro de una función `async`, ¿qué ocurre cuando `await` espera una promesa pendiente?**

- **A.** Se bloquea todo el hilo de JavaScript hasta que la promesa se resuelve.
- **B.** Se suspende esa función y el navegador puede atender otras tareas.

**Correcta: B.** La continuación de la función espera el resultado sin bloquear por sí misma el hilo principal.

## 5. Fetch y errores HTTP — `m3-fetch-http`

**Si `fetch()` recibe una respuesta HTTP 404, ¿cómo detectas el fallo HTTP?**

- **A.** Confías en que `fetch()` rechazará siempre la promesa por ese estado.
- **B.** Compruebas `response.ok` y manejas el estado de error.

**Correcta: B.** Una respuesta HTTP 404 no rechaza por sí sola la promesa de `fetch`. Su propiedad `ok` es falsa.

## 6. JSON y almacenamiento — `m3-json-storage`

**Para guardar un objeto en localStorage y recuperarlo como objeto, ¿qué combinación usas?**

- **A.** `JSON.stringify()` al guardar y `JSON.parse()` al recuperar.
- **B.** `JSON.parse()` al guardar y `JSON.stringify()` al recuperar.

**Correcta: A.** El almacenamiento guarda cadenas. `stringify` serializa y `parse` interpreta el JSON; además debo validar los datos recuperados y manejar posibles errores.

## 7. Contexto del personaje — `m3-system-prompt`

**¿Para qué sirve el system/context prompt de un personaje?**

- **A.** Para sustituir el historial completo en cualquier conversación.
- **B.** Para definir su identidad, tono, límites y forma de responder.

**Correcta: B.** Las instrucciones definen el comportamiento. El historial aporta el contexto de los intercambios; son responsabilidades distintas.

## 8. Claves y servidor — `m3-api-secret`

**¿Dónde debe usarse la clave privada de la API de IA?**

- **A.** En la función del servidor, leyéndola desde variables de entorno.
- **B.** En un módulo JavaScript enviado al navegador, aunque su nombre esté oculto.

**Correcta: A.** El código enviado al navegador es inspeccionable. La función del servidor realiza la petición sin entregar la clave al cliente.

## 9. Estados de carga — `m3-finally`

**En un flujo `try/catch/finally` de una petición, ¿dónde puedes desactivar el estado de carga tanto ante éxito como ante error?**

- **A.** Solamente en `catch`.
- **B.** En `finally`.

**Correcta: B.** `finally` se ejecuta al salir del flujo con éxito o error, por lo que permite limpiar ese estado en ambos casos.

## 10. Pruebas con Vitest — `m3-fetch-mock`

**¿Cómo pruebas respuestas exitosas y fallidas de una petición sin depender de una API real?**

- **A.** Sustituyendo `fetch` por un mock con resultados controlados.
- **B.** Llamando a la API real cada vez y esperando que responda igual.

**Correcta: A.** El mock permite reproducir éxito, errores HTTP y fallos de red sin consumir cuota. Debo restaurarlo entre pruebas.

## Correspondencia con el curso

| Preguntas | Contenido de M3 |
| --- | --- |
| 1–2 | Responsive, mobile-first y herramientas de layout. |
| 3 | SPA, History API y sincronización entre URL y vista. |
| 4–5 y 9 | Promesas, async/await, Fetch y estados de UI. |
| 6 | JSON y persistencia de datos. |
| 7 | Prompting, identidad y contexto conversacional. |
| 8 | Seguridad de claves y proxy serverless. |
| 10 | Vitest, mocks y pruebas sin red. |

Este banco es un reto educativo local. La solución estará en el código del cliente: no pretende ser un examen seguro ni sustituir la evaluación del curso.
