# Chat con Morfeo

Proyecto Integrador M3 de Full Stack de Henry. SPA en español para conversar con una interpretación ficticia de Morfeo de *The Matrix (1999)*.

## Estado

Pasos 1–9 completos en el entorno local, con Gemini y Redis reales. Se incorporó la ampliación solicitada por Miguel: entrada cyberpunk, retrato CGI, transición por la boca, acceso por cohorte y cuotas con intervención de Smith. **Redis de Upstash conectado y verificado el 27 de octubre de 2026.** Continúan pendientes la revisión final y el despliegue público del plan.

![Inicio](docs/capturas/paso-8-home-1024.jpg)

## Funciones

- `/home`, `/chat`, `/about`: History API, Atrás/Adelante, carga directa y fallback de Vercel.
- Home con lluvia de código intensa, pausa, CRT y retrato 3D renderizado. La transición abre la boca y acerca la cámara hasta entrar en la terminal; se puede omitir con el botón o Escape. Movimiento reducido evita la transición.
- Acceso con cohorte **79**, validada en servidor. Cookie firmada, HttpOnly, SameSite=Strict y Secure bajo HTTPS; expira a las ocho horas. Es una puerta con código compartido, sin identidad individual.
- Gemini real mediante el SDK oficial `@google/genai`; API key y system prompt exclusivamente en servidor.
- Historial completo en cada solicitud. Se conserva en memoria al navegar y se borra al recargar. No se guarda en Redis, archivos ni localStorage.
- Máximo **280 grafemas** por mensaje, contando espacios/saltos y emojis compuestos. No trunca el texto pegado; Enter inserta una línea.
- Indicador estático, bloqueo de envíos simultáneos, scroll del historial y recuperación del borrador ante errores.
- Límite compartido de **15 solicitudes en 60 segundos móviles y 500 al día**. La reserva ocurre antes de llamar a Gemini, también si falla. La siguiente solicitud se rechaza con 429/Retry-After y activa Smith. Al terminar la espera, se comprueba la cuota y se permite reintentar.
- Footer © 2026 Miguel Miranda y [GitHub](https://github.com/MiguelMirandaV/chat-morfeo-m3).

El contador representa solicitudes **de esta app**, no toda la actividad del proyecto de Google. Google aplica sus propias cuotas por proyecto, incluyendo tokens y llamadas externas. El día reinicia a medianoche del Pacífico, con cambio de horario contemplado. [Límites de Gemini](https://ai.google.dev/gemini-api/docs/rate-limits).

## Instalación y ejecución

Requiere Node.js 24.x, npm, Git y cuenta de Vercel. Vitest y Vercel CLI están fijados como dependencias locales.

```bash
npm ci
cp -n .env.example .env
```

Completa `.env` en VS Code. Si ya existe, conserva sus valores. No compartas el archivo ni pegues secretos en el chat.

| Variable del servidor | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Clave de Google AI Studio. |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite`, verificado con llamadas reales. |
| `AUTH_SESSION_SECRET` | Secreto aleatorio privado de al menos 32 caracteres. |
| `QUOTA_DRIVER` | `local` permite archivo privado solo en desarrollo. |
| `UPSTASH_REDIS_REST_URL` | URL HTTPS de tu base Redis, requerida en Vercel. |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST con escritura, requerido en Vercel. |

Para generar el secreto en una copia nueva: `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y guárdalo directamente en `.env`. No vuelvas a generar el secreto existente sin motivo: invalidaría las sesiones abiertas.

```bash
npm run vercel:login
npm run vercel:whoami
npm start
```

Abre [la home local](http://127.0.0.1:3000/home), introduce **79** y desbloquea. `npm start` ejecuta `vercel dev` sobre 127.0.0.1:3000; detén con Ctrl+C. Reinicia tras cambiar `.env`. `.env.local`, gestionado por Vercel, se conserva sin editar. No se utiliza un script `dev` que invoque recursivamente Vercel.

## Contadores locales y Redis

En desarrollo, sin credenciales Redis y con `QUOTA_DRIVER=local`, se utiliza `.data/quota.json`, ignorado por Git y privado. El archivo contiene fecha, cantidad y tiempos de solicitudes; un bloqueo entre procesos y escritura atómica evitan reservas simultáneas incorrectas. Reiniciar el servidor no reinicia el contador.

En Vercel, el archivo local **no está permitido**. Debes configurar una base persistente de Upstash: URL REST y token privado. El servidor ejecuta un script Lua atómico con ventana móvil y contador diario, con expiraciones. No requiere SDK adicional. [Configuración y pasos](docs/redis.md).

Si faltan las credenciales o no se puede comprobar la cuota, se bloquea el canal sin llamar al proveedor. El acceso compartido por cohorte y las cuotas no constituyen un sistema general contra abuso o cuentas individuales. Preview y producción deben compartir la misma base si usan el mismo proyecto de Google; el desarrollo con archivo local no suma sus solicitudes a Redis.

## Arquitectura simple

```text
api/functions.js       Handler, acceso, cuotas, prompt y adaptador Gemini
src/index.html         Documento inicial
src/app.js             Vistas, History API, lluvia y transición
src/chat.js            Estado volátil, fetching y render del chat/acceso
src/utils.js           Conteo y validación de grafemas
src/styles.css         CSS mobile-first, 768/1024 y movimiento reducido
src/assets/            Retratos generados para esta interfaz
tests/                 Vitest: lógica, transporte, acceso, cuotas y proveedor
docs/                  Alcance, pruebas, uso de IA y capturas
.env.example           Nombres y ejemplos sin secretos
vercel.json            Estáticos desde src y función desde api
```

Sin React, Express ni PostgreSQL. Redis persiste exclusivamente contadores; Smith es un estado visual, no un segundo personaje conversacional.

## API

Un endpoint: `POST /api/functions`, con `Content-Type: application/json` y sin caché.

```json
{"action":"session"}
```

Devuelve `{authenticated, quota}`. Sin sesión no consulta el contador. Para abrir la sesión:

```json
{"action":"unlock","cohort":"79"}
```

Devuelve `{authenticated:true, quota}` y emite la cookie. Después, el navegador la adjunta automáticamente:

```json
{"messages":[{"role":"user","content":"Hola, Morfeo"}]}
```

Éxito: `{reply, quota}`. Error: `{error:{code,message}, quota?}`. El historial alterna user/assistant, empieza y termina en user y no admite campos extra ni instrucciones system del cliente. Máximo de entrada: 64 KiB; se rechaza íntegro, sin recortar turnos.

| HTTP | Situación |
| --- | --- |
| 400 / 413 / 415 | Entrada, tamaño o tipo de contenido incorrectos. |
| 401 / 403 | Sesión requerida, cohorte incorrecta u origen ajeno. |
| 405 | Método distinto de POST. |
| 422 | Generación bloqueada. |
| 429 | Límite local, diario o del proveedor; incluye Retry-After. |
| 502 | Texto vacío, inválido o truncado. |
| 503 / 504 | Configuración, cuota/proveedor no disponibles o timeout. |

El SDK tiene un solo intento, timeout de 16 s y AbortController; el frontend espera hasta 20 s. No hay reenvíos automáticos. Un aborto local no garantiza cancelar el cómputo remoto, por lo que la reserva no se devuelve. Los mensajes usan `textContent`, no HTML del usuario. Los detalles internos y secretos no se devuelven al cliente.

## Modelo y prompt

`gemini-3.5-flash-lite`, 1024 tokens de salida y thinking minimal; se omiten los parámetros de muestreo obsoletos para esa versión. El prompt v3 está en `MORPHEUS_SYSTEM_PROMPT`. [Evaluación real del paso 7](docs/evaluacion-prompt.md): 20 generaciones repartidas entre tres versiones, con correcciones documentadas. En el paso 8 se verificaron dos turnos reales desde la interfaz, con recuerdo del nombre y del tema. La muestra no garantiza ausencia de repeticiones o errores futuros.

## Pruebas

```bash
npm test
npm run test:watch
```

**130 tests en tres archivos**, sin llamadas reales ni consumo de Gemini. Incluyen grafemas, router, historial, concurrencia, rollback, transporte, timeouts, respuestas bloqueadas/truncadas, firma/expiración, cohorte, origen, cuotas y archivo concurrente entre instancias. El contrato Redis se prueba con fetch sustituido. Además, se verificó el script Lua contra Redis real con claves aisladas: concurrencia, persistencia, ventana móvil, límite diario y expiraciones; véase el registro de pruebas.

La configuración de Vitest restaura mocks, globals y entorno entre casos. Un setup bloquea cualquier fetch no sustituido y aísla las variables privadas dentro del proceso de pruebas, sin editar archivos de entorno. La suite pasó también con orden mezclado y semilla79. [Matriz, hallazgos y explicación del paso9](docs/pruebas-unitarias.md).

Las comprobaciones de navegador se registran en [pruebas.md](docs/pruebas.md), distinguiendo Gemini real del entorno aislado usado para provocar 429 y verificar Smith sin gastar cuota. Los tests antiguos del banco de respuestas simuladas se retiraron al sustituirlo por Gemini.

## Publicación

Proyecto vinculado a GitHub y Vercel Hobby. En el paso 12 se configurarán las variables privadas en Vercel, Redis compartido, Node 24 y las rutas. Se probarán HTTPS, cookies, cuotas y Gemini en la URL pública antes de documentarla como entregada. Las variables nuevas requieren un nuevo despliegue. No se ha verificado un despliegue público de esta versión durante el paso 8.

## Documentación y atribución

- [Alcance y decisiones](docs/alcance.md).
- [Registro de IA y prompts visuales](docs/uso-ia.md).
- [Verificaciones](docs/pruebas.md).
- [Pruebas unitarias consolidadas](docs/pruebas-unitarias.md).
- [Redis](docs/redis.md).

Miguel eligió personaje, dirección visual, requisitos y creó/guardó la clave. Codex implementó el código, los retratos generados y las pruebas. El uso de Matrix es una interpretación académica; no es un producto oficial.
