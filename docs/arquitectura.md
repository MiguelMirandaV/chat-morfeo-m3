# Arquitectura y conceptos del M3

La estructura conserva `/api`, `/src` y `/tests` de la consigna. No hay framework frontend, compilador de interfaz ni servidor Express. El navegador carga módulos ES; Vercel ejecuta la función Node del backend.

## Flujo de una pregunta

```mermaid
sequenceDiagram
    actor Usuario
    participant Vista as Vista Chat
    participant Sesion as Sesión en memoria
    participant API as POST /api/functions
    participant Redis
    participant Gemini
    Usuario->>Vista: Escribe y pulsa Enviar
    Vista->>Sesion: Valida y bloquea otro envío
    Sesion->>API: Historial completo role/content + cookie
    API->>API: Valida origen, acceso, JSON y límites
    API->>Redis: Reserva atómica
    alt Hay cuota
        API->>Gemini: systemInstruction + contents
        Gemini-->>API: Candidato y partes de texto
        API-->>Sesion: reply + quota
        Sesion-->>Vista: Añade respuesta y libera el campo
    else Se alcanzó el límite
        API-->>Sesion: 429 + quota + Retry-After
        Sesion-->>Vista: Recupera borrador y muestra Smith
    end
```

El desbloqueo se hace antes de este recorrido: `{action:"unlock",cohort:"79"}` obtiene una cookie firmada. `{action:"session"}` consulta acceso y cuotas sin reservar una generación. La clave Gemini nunca forma parte del cuerpo enviado por el navegador.

## Responsabilidades

| Archivo | Funciones y trabajo |
| --- | --- |
| `src/app.js` | Vistas, `resolveRoute`, decisiones de navegación, `pushState`/`popstate`, foco y portal; limpia los recursos de la vista anterior. |
| `src/matrix-scene.js` | Geometría procedural, atlas de caracteres, lluvia WebGL, fallback 2D, apertura y cámara; libera recursos al desmontar. |
| `scripts/prepare-assets.js` | Copia los módulos Three.js fijados y su licencia a `src/vendor`, generado e ignorado en Git. |
| `src/chat.js` | `createChatSession` conserva mensajes/borrador/estado; `postApi` gestiona fetch, JSON y errores; `mountChat`/`mountAccess` conectan estado y DOM. |
| `src/utils.js` | `countCharacters` con Intl.Segmenter y `getMessageError`; la función backend reutiliza la validación. |
| `api/functions.js` | `createHandler`, acceso firmado, validación del historial, reserva, adaptador Gemini y parseo. Usa dependencias inyectables para ensayar fallos sin red. |
| `src/styles.css` | Base móvil y adaptaciones 768/1024, Flexbox/Grid, estados, foco y movimiento reducido. |
| `tests/` | Casos de lógica y contratos; configuración restaura mocks y bloquea fetch real no sustituido. |
| `vercel.json` | Build de módulos gráficos, estáticos desde `src`; fallback a index para rutas SPA excluyendo API y archivos. |

## Conceptos que debes poder explicar

- **SPA:** cambiar la URL con pushState y renderizar la vista no vuelve a descargar el HTML. Atrás/Adelante dispara popstate. Cargar directamente `/chat` sí requiere que el servidor entregue index.html.
- **Asincronía:** `pending` cambia antes del primer await para impedir envíos simultáneos. try/catch/finally distingue resultado/error y libera la espera. La respuesta puede terminar aunque Chat esté desmontado porque el estado pertenece al módulo.
- **Fetch y JSON:** primero se interpreta HTTP (`response.ok`), después el contrato. El cliente no muestra excepciones internas. Los errores tienen códigos permitidos y textos controlados.
- **Roles:** el navegador envía user/assistant; `toGeminiContents` transforma assistant a model y content a parts. El system prompt lo añade el servidor como systemInstruction, separado del historial.
- **Tokens y longitud:**280 grafemas limita lo escrito por el usuario;1024 tokens limita el presupuesto de salida del modelo. No equivalen a palabras ni garantizan una longitud exacta. La brevedad se instruye y evalúa con ejemplos reales.
- **Temperature:** controla variación en modelos que la admiten; esta configuración omite temperature/top_p/top_k siguiendo la revisión del modelo realizada en el paso 7. No se trasladan parámetros de otro SDK a ciegas.
- **Rate limiting:** Redis reserva antes de llamar al proveedor mediante Lua atómico. Evita que instancias concurrentes admitan el mismo cupo restante. Un fallo posterior mantiene la reserva porque el proveedor pudo procesarlo.
- **Mocking:** permite reproducir desconexiones,503 o 429 sin gastar cuota. Demuestra lógica de recuperación; no demuestra tono de Morfeo ni disponibilidad real de Google.

## Datos y límites de seguridad

| Dato | Dónde vive | Duración / uso |
| --- | --- | --- |
| Conversación y borrador | Memoria del módulo del navegador | Persisten al navegar; desaparecen al recargar. El historial se envía a la función y a Gemini para generar la respuesta. |
| Cookie de acceso | Navegador, HttpOnly | Token firmado con expiración de 8 horas; Secure en HTTPS, SameSite=Strict. Sin identidad individual. |
| Cantidades y tiempos de solicitudes | Redis compartido, o archivo privado solo en desarrollo sin Redis | Ventana móvil y día del Pacífico, con expiraciones. No guarda mensajes. |
| Claves y secreto de sesión | Entorno del servidor | `.env` local y variables de Vercel, excluidos del código público. |
| Prompt | Constante del backend | Define el personaje; no contiene claves. No se envía como parte de los assets estáticos. |

La app no persiste conversaciones; eso no describe las políticas de tratamiento de datos del proveedor externo. El código 79 es conocido y compartido, por lo que no debe considerarse una cuenta personal ni protección general contra abuso.

## Cómo recorrer el código en VS Code

1. Lee `src/utils.js`: empieza por la validación más pequeña.
2. Abre `createChatSession` en `src/chat.js`: sigue draft → pending → messages/error.
3. Revisa `postApi` y después `createHandler` en el backend.
4. Sigue `validateHistory` → cuota → `generateGeminiReply` → `parseGeminiReply`.
5. Regresa a `mountChat` para ver cómo se convierte el estado en interfaz.
6. Termina con el router y su limpieza en `src/app.js`. Usa los tests como ejemplos de entradas/resultados, sin ejecutarlos contra servicios reales.
