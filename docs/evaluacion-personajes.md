# Evaluación real de personajes — Iteración 2

Fecha: **27 de octubre de 2026**, zona America/Bogota.

Evalué las voces con el modelo configurado `gemini-3.5-flash-lite`, usando los prompts de `api/functions.js` y el SDK del proyecto. Ejecuté seis generaciones iniciales y dos adicionales para comprobar una corrección del Oráculo. Las ocho fueron aceptadas por el handler con estado 200. No se realizaron reintentos automáticos.

## Método

El programa ejecutó el handler real en Node: desbloqueó con 79, usó la cookie firmada recibida, reservó la cuota mediante Redis y llamó al adaptador Gemini. No se sustituyeron autorización, cuota ni proveedor. Se trata de integración del handler y servicios reales; no representa una nueva prueba visual, una petición HTTP a Preview ni una evaluación del ciclo local de Smith.

Usé nombres ficticios diferentes: Ariadna con Morfeo, Lucía con el Oráculo y Bruno con Trinity. El primer mensaje compartía el tema aprender JavaScript, pedía identidad y consejo ante un error. El segundo incluía el historial completo propio de ese personaje y pedía recordar nombre/interés más un caso de límites.

Antes de generar comprobé cupo suficiente. Las reservas diarias observadas pasaron de **58 a 66**. No modifiqué los límites, el plan ni las credenciales. Los registros contienen peticiones ficticias, respuestas, modelo, configuración, huella SHA-256 del prompt, duración, conteo de palabras y cuota; no incluyen claves, cookies ni valores de entorno.

## Resultados finales

| Personaje | Identidad y voz observada | Contexto y límites | Palabras por turno |
| --- | --- | --- | --- |
| Morfeo | Se presentó por su nombre; consejo reflexivo y metáfora sobre la divergencia del código. | Recordó Ariadna y JavaScript, explicó una función con lenguaje sencillo e identificó Matrix como ficción. | 60 / 63 |
| El Oráculo, tras el ajuste | Se presentó como el Oráculo; tono cercano y pregunta cotidiana sobre el bloqueo. | Recordó Lucía y JavaScript, reconoció que no puede asegurar la aprobación y comparó estudiar solo o acompañado. | 51 / 64 |
| Trinity | Se presentó por su nombre; propuso leer la consola y aislar la función. | Recordó Bruno y JavaScript, negó acceso a los archivos y sugirió inspeccionar valores con console.log. | 63 / 45 |

Las tres conversaciones mantuvieron separados los datos enviados. Las tres segundas respuestas recuperaron nombre y tema. Ninguna segunda respuesta repitió literalmente la anterior. Las ocho salidas estuvieron entre **45 y 67 palabras**.

## Corrección encontrada y verificada

En la primera muestra, el Oráculo contestó a «¿quién eres?» presentándose como una vecina curiosa, sin su nombre. Su tono era reconocible, pero la identificación quedó incompleta.

Añadí solo a su prompt una indicación de identificarse explícitamente como el Oráculo ante esa pregunta. Repetí sus dos turnos: la nueva primera respuesta incluyó su nombre y el segundo mantuvo memoria y reconocimiento de incertidumbre. Los prompts de Morfeo y Trinity no se modificaron; sus resultados iniciales continúan correspondiendo a su configuración vigente.

Conservo ambos registros para que la corrección sea revisable. No presento la primera muestra como completamente conforme ni oculto la respuesta que motivó el ajuste.

## Límites

Es una muestra acotada, no una garantía de identidad, memoria o variación en toda conversación futura. La brevedad por palabras fue adecuada; algunas salidas superaron la orientación habitual de una a tres frases. No recorté las respuestas para aparentar cumplimiento. Esta evaluación no demuestra resistencia a todas las instrucciones adversarias ni mide latencia en todos los equipos.

Las **258 pruebas en ocho archivos** verifican lógica y contratos con mocks: identidad, contexto separado, cuota compartida, fallos, persistencia, cambio de personaje, teclado, ciclo Smith y limpieza. Son distintas de estas ocho generaciones reales. Suite, build y diff pasaron al cerrar la etapa.

## Repetir de forma optativa

No es necesario repetir para usar la aplicación. El script no forma parte de npm test ni del build y no ejecuta llamadas sin `--real`:

```bash
node scripts/evaluate-characters.js
```

Para una nueva evaluación deliberada, con `.env` ya configurado:

```bash
node scripts/evaluate-characters.js --real
```

Genera hasta seis respuestas reales. Para solo un personaje:

```bash
node scripts/evaluate-characters.js --real --character oracle
```

Genera hasta dos. Antes de comenzar comprueba cuota suficiente y, ante un fallo, se detiene. Guarda un archivo nuevo con fecha en `.data`, ignorado por Git. Usa únicamente casos ficticios. La salida sin `--real` y la sintaxis del script se verificaron; las generaciones registradas se ejecutaron con el mismo recorrido de evaluación durante esta etapa.

## Registros

- [Seis generaciones iniciales](evaluaciones/iteracion-2/muestra-inicial.json).
- [Dos generaciones del Oráculo tras la corrección](evaluaciones/iteracion-2/oraculo-ajuste.json).
- [Resumen y límites](evaluaciones/iteracion-2/resumen.json).
