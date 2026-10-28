# Cómo utilicé la IA en este proyecto

Usé Codex como tutor y asistente de desarrollo para mi Proyecto Integrador M3 de Henry. Le compartí las lectures, la consigna, la guía y los criterios de evaluación para trabajar sobre lo aprendido en el curso. Definí el producto, sus personajes y la dirección visual; aprobé los planes, probé la aplicación y señalé los cambios que quería realizar.

Delegué en Codex la escritura del código, la creación de recursos visuales, las pruebas técnicas y la preparación de documentación. Por mi parte, creé las cuentas y guardé las claves en el archivo local, sin compartirlas en el chat. Mi participación se centró en dirigir el producto y comprender las decisiones mediante explicaciones por pasos.

## Definir el alcance antes de desarrollar

**Mi prompt, fragmento literal:**

> Utiliza la estructura sugerida del proyecto "simple" para desarrollar el proyecto

**Respuesta de Codex, en síntesis:** propuso un plan por etapas con HTML, CSS y JavaScript modular, una función de servidor para acceder a la IA y pruebas de la lógica. Relacionó el trabajo con los objetivos y la rúbrica del M3.

**Mi decisión:** aprobé ese plan y elegí a Morfeo, la estética de terminal de Matrix y el máximo de 280 caracteres por mensaje del usuario. Mantuve la estructura simple para poder relacionar el proyecto con las lectures, sin añadir un framework frontend.

## Cuestionar una respuesta que no funcionaba

**Mi prompt, literal:**

> todo funciona bien menos las respuestas, Morfeo mi dio la misma respuesta exactamente a dos interacciones

**Respuesta de Codex, en síntesis:** explicó que aquella fase utilizaba respuestas predefinidas y detectó que una categoría devolvía siempre el mismo texto. Añadió variantes para esa simulación y aclaró que eso todavía no era una conversación generada por Gemini.

**Mi decisión:** acepté la explicación y pedí continuar con el plan de integración real. Distinguí entre comprobar que la interfaz funciona y evaluar si un modelo conserva contexto y responde con la voz del personaje. Las variantes del mock no demostraban esas capacidades.

## Evaluar los prompts mediante sus resultados

**Mi prompt, fragmento literal:**

> Cada personaje debe tener su propio system/context prompt único

Para desarrollar Morfeo, el Oráculo y Trinity, utilicé Codex para preparar instrucciones distintas y evaluar respuestas con datos ficticios. Una entrada de prueba enviada al Oráculo fue:

> Me llamo Lucía. Estoy aprendiendo JavaScript. ¿Quién eres y qué me aconsejas si me bloqueo con un error?

**Respuesta real de Gemini, fragmento:**

> Soy una vecina curiosa

La evaluación realizada con Codex detectó que el tono era cercano, pero el personaje no se identificaba por su nombre. Se precisó esa instrucción en su prompt y se repitió el caso. La nueva respuesta comenzó:

> Hola, Lucía. Yo soy el Oráculo.

**Mi criterio:** no doy por bueno un prompt solo porque su redacción parece completa. Considero las respuestas observadas, el recuerdo del contexto y sus límites. Los [registros de esta evaluación](evaluacion-personajes.md) permiten revisar el ejemplo; estas respuestas pertenecen a Gemini dentro de la aplicación, no a Codex como asistente de desarrollo.

## Cómo valoro el trabajo asistido

Pedí explicaciones, correcciones y comprobaciones durante el desarrollo, y confirmé el funcionamiento del Preview antes de continuar con la entrega. No atribuyo a mi escritura manual el código generado con asistencia ni presento una prueba simulada como una respuesta real. Uso los resultados técnicos y mi revisión de la experiencia para decidir qué conservar o cambiar, sin asumir que la IA garantiza respuestas correctas o una calificación determinada.
