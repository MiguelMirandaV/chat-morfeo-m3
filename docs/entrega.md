# Mapa de evidencias de la entrega

Estado al 27 de octubre de 2026: pasos 1–12 completos, con publicación verificada. Este documento orienta al evaluador; no sustituye la auditoría final del paso 13 ni garantiza la nota.

- Repositorio: [MiguelMirandaV/chat-morfeo-m3](https://github.com/MiguelMirandaV/chat-morfeo-m3).
- URL pública: [chat-morfeo-m3.vercel.app](https://chat-morfeo-m3.vercel.app/home).
- Instalación, configuración y tests: [README](../README.md).
- Guía de publicación: [despliegue.md](despliegue.md).
- Registro de decisiones y prompts: [uso-ia.md](uso-ia.md).

Publicación: [evidencia HTTPS y conversación real](produccion.md). Las comprobaciones de producción de la tabla siguiente ya se realizaron en el paso 12; queda contrastar la entrega completa y la instalación limpia en el paso 13.

## Ocho categorías de la rúbrica

| Categoría | Evidencia disponible | Estado después de publicar |
| --- | --- | --- |
| Responsive | CSS mobile-first, Grid/Flex,768/1024; [12 combinaciones de vistas/tamaños](capturas/paso-10-casos.json) y capturas en README. | Verificado en paso 12. |
| SPA | Vistas/routing en app.js, tests del router y [verificación de Atrás/Adelante del paso 4](pruebas.md). | Rutas directas verificadas; revisión final pendiente. |
| Asincronía y Fetch | postApi, sesión y tests de estados; [fallos y navegación durante peticiones](revision-ux.md). | Verificado en paso 12. |
| Gemini | System prompt v3, historial completo, parseo y [evaluación real por versiones](evaluacion-prompt.md); integración real en paso 8. | Verificados, con recuerdo de nombre/lenguaje. |
| Seguridad y serverless | Secretos en servidor, env.example, cookie firmada, validaciones, cuotas atómicas y tests. | Variables, cookies, assets y respuestas HTTP verificados; no se capturó Network del navegador. |
| Chat y UX | Diferenciación TÚ/MORFEO, log acotado, auto-scroll, escritura, borrador y sesión; [revisión UX](revision-ux.md). | Conversación, navegación y nueve tamaños/vistas verificados. |
| Vitest |130 casos en 3 archivos, mocks restaurados, fetch real bloqueado; [matriz de pruebas](pruebas-unitarias.md). | Ejecución desde instalación limpia. |
| Despliegue y documentación | Estructura simple, README, capturas, uso de IA y guía de despliegue. | URL y SHA verificados; auditoría final pendiente. |

## Buenas prácticas de la consigna

- Personaje distintivo y respuestas breves: ficha en alcance.md y prompt evaluado.
- Contexto, preguntas y tono: evaluación real de 20 generaciones entre v1/v2/v3; no son 20 pruebas de la última versión.
- API key privada: backend y entorno; assets y respuestas públicas revisados sin valores privados.
- Tamaños de pantalla: medidas y capturas locales 320/768/1024, más 600 en revisión UX.
- Historial solo durante la sesión: memoria del módulo; navegación conserva y recarga limpia. Redis solo contiene contadores.
- Debug: sin console.log en el código de src/api al cierre; los escenarios controlados viven fuera del repositorio.
- Función desplegada: verificada por HTTPS con Gemini y Redis reales en paso 12.

La ampliación de Miguel incluye acceso por cohorte, cuotas y efectos Matrix. No se incorporó el extra credit de historial persistente, galería de personajes, timestamps, copiar respuestas, envío por Enter ni toggle claro/oscuro.

## Guion breve para explicar el trabajo

1. Presenta a Morfeo y la decisión visual; distingue el retrato renderizado de una malla 3D.
2. Muestra las tres rutas y cómo conserva el historial al navegar.
3. Explica el límite 280 en ambos lados y el borrador ante errores.
4. Sigue una petición navegador → función → Redis → Gemini → parseo → vista.
5. Ejecuta npm test y explica un caso de error con mock.
6. Abre el registro de IA y una corrección basada en evidencia, por ejemplo el parseo inválido o la recuperación 401.
7. Cuando esté publicado, presenta URL y commit verificados. Atribuye a Codex el desarrollo/pruebas y a Miguel las decisiones y acciones que realizó.
