# Publicación de la iteración 2

## Estado de publicación

La iteración se revisa en [la Preview estable](https://chat-morfeo-m3-git-feat-matrix-v2-miguel-miranda-v.vercel.app/home), desde la rama `feat/matrix-v2`. El código interno de acceso es **79**; la Preview puede solicitar además una sesión Vercel.

El dominio [chat-morfeo-m3.vercel.app](https://chat-morfeo-m3.vercel.app/home) sigue asociado a `main`. La integración y la verificación pública de esta iteración corresponden a la etapa 10; este documento no las da por realizadas.

La primera entrega queda identificada por `m3-v1-entregado` sobre `7af140e6c5d204968a085140da6ca6e043d1f3ea`. [Su registro de producción](produccion.md) conserva la evidencia anterior.

## Cierre previsto

1. Revisar árbol limpio, rama y cambios acumulados; confirmar los tests y el build del código a integrar.
2. Integrar la rama revisada a main mediante el flujo Git del repositorio y conservar una referencia recuperable de la primera entrega.
3. Esperar el despliegue Production y verificar dominio, estado Ready y commit. Las credenciales existentes se conservan; no se copian a documentación.
4. Comprobar HTTPS público, `/home`, `/chat`, `/about`, recursos estáticos y respuestas controladas de la API; el código 79 debe abrir el canal.
5. Realizar una muestra funcional breve sin agotar cuota ni borrar conversaciones del usuario. Confirmar preservación de historia por origen y que Smith no requiere provocar 429.
6. Registrar resultados y límites de lo observado; actualizar el enlace principal de README al dominio público de la nueva versión.

Preview y Production son orígenes diferentes: sus conversaciones locales no se transfieren al publicar. El historial guardado por una visita anterior al mismo dominio se interpreta según su formato válido; no se borra para probar un despliegue.

## Configuración del repositorio

Root Directory en la raíz, Node 24.x, instalación npm ci, build npm run build y salida src. El build prepara módulos Three.js y licencia. La función permanece en `/api/functions.js` y las variables se configuran en el servidor. [Guía reproducible](despliegue.md).

La verificación de publicación debe registrar su propia fecha, commit y evidencia; no se completan estas casillas con resultados heredados.
