# Mapa de evidencias de la entrega

Estado al 27 de octubre de 2026: pasos 1–11 completos en local. Este documento orienta al evaluador; no sustituye la auditoría final del paso 13 ni garantiza la nota.

- Repositorio: [MiguelMirandaV/chat-morfeo-m3](https://github.com/MiguelMirandaV/chat-morfeo-m3).
- URL pública: **pendiente de despliegue y comprobación en el paso 12**.
- Instalación, configuración y tests: [README](../README.md).
- Guía de publicación: [despliegue.md](despliegue.md).
- Registro de decisiones y prompts: [uso-ia.md](uso-ia.md).

## Ocho categorías de la rúbrica

| Categoría | Evidencia disponible | Pendiente al cierre documental |
| --- | --- | --- |
| Responsive | CSS mobile-first, Grid/Flex,768/1024; [12 combinaciones de vistas/tamaños](capturas/paso-10-casos.json) y capturas en README. | Revisión en dominio HTTPS. |
| SPA | Vistas/routing en app.js, tests del router y [verificación de Atrás/Adelante del paso 4](pruebas.md). | Acceso directo/recarga de cada ruta publicada. |
| Asincronía y Fetch | postApi, sesión y tests de estados; [fallos y navegación durante peticiones](revision-ux.md). | Transporte real bajo HTTPS. |
| Gemini | System prompt v3, historial completo, parseo y [evaluación real por versiones](evaluacion-prompt.md); integración real en paso 8. | Dos turnos reales desde producción. |
| Seguridad y serverless | Secretos en servidor, env.example, cookie firmada, validaciones, cuotas atómicas y tests. | Variables remotas, cookie Secure y revisión de assets/Network públicos. |
| Chat y UX | Diferenciación TÚ/MORFEO, log acotado, auto-scroll, escritura, borrador y sesión; [revisión UX](revision-ux.md). | Recorrido final de la versión publicada. |
| Vitest |130 casos en 3 archivos, mocks restaurados, fetch real bloqueado; [matriz de pruebas](pruebas-unitarias.md). | Ejecución desde instalación limpia. |
| Despliegue y documentación | Estructura simple, README, capturas, uso de IA y guía de despliegue. | URL funcional, SHA desplegado y auditoría final. |

## Buenas prácticas de la consigna

- Personaje distintivo y respuestas breves: ficha en alcance.md y prompt evaluado.
- Contexto, preguntas y tono: evaluación real de 20 generaciones entre v1/v2/v3; no son 20 pruebas de la última versión.
- API key privada: backend y entorno; revisión local realizada, revisión pública pendiente.
- Tamaños de pantalla: medidas y capturas locales 320/768/1024, más 600 en revisión UX.
- Historial solo durante la sesión: memoria del módulo; navegación conserva y recarga limpia. Redis solo contiene contadores.
- Debug: sin console.log en el código de src/api al cierre; los escenarios controlados viven fuera del repositorio.
- Función desplegada: se verificará con la URL real en paso 12.

La ampliación de Miguel incluye acceso por cohorte, cuotas y efectos Matrix. No se incorporó el extra credit de historial persistente, galería de personajes, timestamps, copiar respuestas, envío por Enter ni toggle claro/oscuro.

## Guion breve para explicar el trabajo

1. Presenta a Morfeo y la decisión visual; distingue el retrato renderizado de una malla 3D.
2. Muestra las tres rutas y cómo conserva el historial al navegar.
3. Explica el límite 280 en ambos lados y el borrador ante errores.
4. Sigue una petición navegador → función → Redis → Gemini → parseo → vista.
5. Ejecuta npm test y explica un caso de error con mock.
6. Abre el registro de IA y una corrección basada en evidencia, por ejemplo el parseo inválido o la recuperación 401.
7. Cuando esté publicado, presenta URL y commit verificados. Atribuye a Codex el desarrollo/pruebas y a Miguel las decisiones y acciones que realizó.
