# Alcance histórico v1 — Alcance de la versión entregada de Chat con Morfeo

Ficha de la versión entregada, conservada en el tag `m3-v1-entregado`. Las ampliaciones aprobadas se definen en [Iteración 2](iteracion-2.md); las exclusiones de esta ficha no limitan esa nueva versión. Se conserva la estructura simple del Proyecto Integrador M3: `/api`, `/src`, `/tests` y documentación. El estado de ejecución y publicación está en [README](../README.md); los resultados históricos están en [pruebas.md](pruebas.md).

## Personaje y objetivo

SPA para conversar en español con una interpretación de Morfeo de *The Matrix (1999)*. Es sereno, firme, paciente y reflexivo; trata al usuario de tú y normalmente responde en una a tres frases. Explora elección, percepción, libertad y aprendizaje, sin asumir que quien escribe se llama Neo ni que puede acceder a su equipo. Las respuestas son originales generadas por Gemini.

[Prompt evaluado](evaluacion-prompt.md); la fuente vigente es `MORPHEUS_SYSTEM_PROMPT` en [api/functions.js](../api/functions.js). No se mantiene un segundo prompt activo en la interfaz.

## Decisiones expresas de Miguel

1. Morfeo, terminal inspirada en Matrix y desarrollo desde cero.
2. Mensajes del usuario de hasta 280 caracteres, con regla compartida de grafemas.
3. Lluvia de caracteres verdes exclusivamente en Home.
4. Footer ©2026 Miguel Miranda con enlace al repositorio GitHub.
5. Ampliación posterior: estética cyberpunk intensa, retrato 3D de Morfeo, transición por su boca al chat, cuotas 15/min y 500/día con intervención de Smith y acceso exclusivo con cohorte 79.

Estas últimas instrucciones ampliaron el alcance inicial. Redis persiste contadores, pero la conversación sigue solo en memoria. No se implementan cuentas individuales ni múltiples personajes conversacionales.

## Tres vistas

| Ruta | Contenido y acción |
| --- | --- |
| `/home` | Presentación, acceso con cohorte, lluvia, retrato y entrada al chat. |
| `/chat` | Acceso si falta sesión, historial, estados, cuotas, textarea y Enviar. |
| `/about` | Personaje, proyecto, tecnologías, datos y funcionamiento de la sesión. |

La navegación usa History API sin recargar. Atrás/Adelante y render inicial se contemplan; el fallback de Vercel entrega index.html en rutas de la SPA.

## Reglas de conversación

- Cuenta espacios y saltos de línea. Un emoji compuesto cuenta como un grafema.
- Vacío o solo blancos: bloqueado. Exactamente 280: permitido. Más de 280: conserva todo, explica el error y bloquea el envío. Cliente y servidor validan.
- Enter inserta una línea; el botón envía. No hay truncado silencioso.
- El historial completo va en cada petición, en orden. No se guarda en localStorage ni Redis. Navegar conserva conversación y borrador; recargar los borra.
- Un envío en curso bloquea otro; el indicador de escritura es estático. Al fallar, se retira solo el turno fallido y vuelve el borrador.
- El log distingue TÚ/MORFEO con etiquetas, alineación y bordes; tiene scroll interno y auto-scroll al agregar turnos.
- El cuerpo admite hasta 64 KiB; se rechaza el exceso sin recortar el historial.

## Ampliación Matrix

- Morfeo es un retrato CGI prerenderizado con perspectiva CSS. La apertura usa imágenes alineadas, crossfade y zoom; no una malla 3D articulada.
- Portal de 1,8 s con botón para omitir y Escape; foco contenido y fondo inactivo mientras aparece.
- Lluvia decorativa con pausa, limpieza al salir de Home y reglas de movimiento reducido. No aparece en Chat/Acerca de.
- Smith es una intervención visual al recibir 429, con cuenta atrás y borrador conservado. No responde como segundo personaje ni reenvía automáticamente.
- Cohorte 79 validada en servidor; cookie firmada de 8 horas. Es un código compartido, no identidad personal.
- Servidor impone 15 reservas en 60 s móviles y 500 por día del Pacífico. Redis tiene prioridad con ambas credenciales; el archivo privado sirve solo de alternativa local sin Redis. En Vercel Redis es obligatorio.

## Entorno y exclusiones

HTML/CSS/JavaScript ES modules, Vercel Function Node 24, Gemini SDK y Vitest. No se requiere React, Express ni PostgreSQL. No se implementa el extra credit de historial persistente, galería de personajes, timestamps, indicador animado de escritura, copiar respuestas, envío por Enter ni selector claro/oscuro.

## Aceptación y límites

[Mapa de las ocho categorías](entrega.md), [revisión UX](revision-ux.md) y [tests](pruebas-unitarias.md) relacionan requisitos con evidencia. Gemini y Redis se verificaron localmente. La publicación HTTPS se verificó en el paso 12; la auditoría desde una copia limpia quedó completada en el paso 13. El criterio Excelente orienta la revisión; Henry determina la calificación final.

El modelo puede fallar o repetirse. La cuota de esta app no mide llamadas externas ni tokens. La revisión responsive cubre tamaños concretos, sin certificar todos los dispositivos o lectores de pantalla.
