# Publicación verificada — Paso 12

27 de octubre de 2026. [Abrir Chat con Morfeo](https://chat-morfeo-m3.vercel.app/home). Código de acceso: **79**.

## Configuración comprobada

- Proyecto existente chat-morfeo-m3, conectado a MiguelMirandaV/chat-morfeo-m3, rama main; despliegue automático por push.
- Raíz del repositorio, Node 24.x, estáticos src, instalación npm ci, sin build de frontend.
- Cinco variables configuradas en Production y Preview; cuatro credenciales como Secret y modelo como Config. Valores excluidos de la evidencia.
- Redis real compartido; cookie HttpOnly, Secure y SameSite=Strict bajo HTTPS.
- Código funcional probado: `6b73ce13d3e9207171236e37c3dfaee3cd344b47`. El despliegue con esa referencia quedó READY. Los commits documentales posteriores mantienen ese código funcional.

## Hallazgos corregidos antes del cierre

1. La inspección `vercel deploy --dry --json` mostró que la subida CLI incluía .env y .data. No se ejecutó ese despliegue CLI. Se agregó .vercelignore y la siguiente inspección confirmó cero entradas privadas incluidas. El Git remoto ya excluía esos archivos.
2. Dos envíos de navegador y una medición HTTP agotaron el plazo anterior de 16 s. La medición devolvió JSON de la app con TIMEOUT a 16223 ms, no un error de duración de la plataforma. Un diagnóstico SDK local respondió en 13422 ms y REST en 1108 ms. No se atribuye esa diferencia a una causa de red demostrada.
3. Se amplió el plazo del proveedor a 30 s, el cliente a 40 s y el máximo de función a 60 s. Se conservó un intento y ausencia de reenvíos automáticos. La prueba verifica que ya no aborte a 16 s y sí lo haga a 30 s; 130/130 tests pasan.

## Resultado final

- `/home`, `/chat` y `/about`: HTTP 200 público sin login de Vercel; CSS, módulos e imágenes coinciden por SHA256 con el código local.
- `.env`, `.env.local`, `.data/quota.json`, package.json, vercel.json, .git/config y docs: HTTP 404, sin credenciales en respuestas.
- API sin acceso 401, cohorte 78 rechazada 403, cohorte 79 admitida 200. Rechaza 281 caracteres 400, origen ajeno 403, GET 405 y texto no JSON 415.
- Dos turnos finales de Gemini desde el navegador respondieron correctamente. Morfeo recordó **Ariadna / JavaScript**, con cuatro mensajes visibles. Contador diario 10→12, conservado en Redis.
- Navegación a Acerca de y Atrás/Adelante conservó los cuatro mensajes. Consola consultada de la pestaña final: cero errores/advertencias.
- Home/Chat/Acerca de a 320/768/1024: nueve combinaciones con ancho igual a scrollWidth e imágenes cargadas. Override restaurado al terminar.

![Gemini real bajo HTTPS](capturas/paso-12-chat-gemini.jpg)

[Pruebas HTTP](capturas/paso-12-http.json) · [Navegador, mensajes y tamaños](capturas/paso-12-navegador.json) · [Paquete sin privados](capturas/paso-12-paquete.json).

## Consumo y límites de la evidencia

El trabajo de diagnóstico/verificación hizo siete generaciones: tres de producción terminaron en timeout, dos diagnósticos locales respondieron (SDK/REST) y dos turnos finales de producción respondieron. Todas reservaron cuota; no se devolvieron reservas fallidas. Los rechazos HTTP y las consultas de sesión no generaron respuestas Gemini.

La revisión comprobó assets y contratos HTTP con un cliente independiente; no se capturó el panel Network del navegador. No se provocaron cuotas reales para Smith: se conserva su prueba controlada del paso 10. El margen mayor no garantiza que el proveedor siempre responda. La instalación desde una copia limpia y la auditoría completa de la rúbrica corresponden al paso 13.
