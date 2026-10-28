# Verificación — Iteración 3

## Cuestionario y progreso por personaje

La implementación del paso 3 se comprobó en la rama `feat/matrix-v3`. Esta evidencia no corresponde a un despliegue de producción ni al cierre de los pasos visuales.

- **270 tests en ocho archivos**, todos aprobados. La ejecución bloquea la red salvo mocks explícitos.
- **Build aprobado:** módulos y licencia de Three.js preparados con el script del proyecto.
- **78 casos de Smith y controles:** progreso por personaje, un único reto, errores que no cuentan, diez preguntas cíclicas, acierto, rechazo de respuestas duplicadas, conservación del contexto, migración, recarga, borrado y conflictos.
- **Frontend real con API local simulada:** tercer intercambio → pregunta 1 → error → pregunta 2 → recarga → acierto → conversación original → recarga → siguiente envío con Enter.
- **Cero generaciones Gemini y cero operaciones Redis reales.** El servidor de QA recibió únicamente dos peticiones de generación simulada: la que completó el tercer intercambio y el envío posterior al reto. Las respuestas al cuestionario no llegaron al endpoint.
- **Consola sin errores ni avisos** durante ese recorrido. El foco al recuperar el reto después de validar acceso se corrigió y se volvió a comprobar.

El banco de diez preguntas está en [preguntas de Smith](preguntas-smith.md); las reglas, el formato y sus límites están en [Smith](smith.md).

## Evidencia y límites

[Registro del recorrido y huellas de código](capturas/iteracion-3/cuestionario-local.json).

![Pregunta pendiente conservada tras recargar, con API local simulada](capturas/iteracion-3/cuestionario-local.png)

La captura ilustra la integración funcional del cuestionario con la presentación anterior. La simplificación de terminal y la escena de Smith a gran escala siguen en sus pasos respectivos. No se presenta esta imagen como la interfaz final ni como una prueba móvil.

Los casos de migración y borrado utilizaron almacenamiento ficticio en Vitest; no se borraron conversaciones del usuario. La coordinación de localStorage detecta conflictos conocidos y no ofrece transacciones entre pestañas. No se consumió cuota real para comprobar errores o el cuestionario.
