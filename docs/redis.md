# Conectar el contador compartido de Upstash

Estado al 27 de octubre de 2026: credenciales guardadas por Miguel, conexión real verificada y servidor local usando Redis. Se comprobó el script Lua real en claves aisladas y una solicitud real a Gemini con reserva en Redis. Falta configurar las variables y verificar HTTPS en Vercel durante el paso 12. Los pasos de conexión siguientes quedan como referencia para una copia nueva.

## Por qué se necesita

Una función de Vercel puede ejecutarse en varias instancias. Un array en memoria o un archivo de una instancia no puede imponer un límite global. Redis conserva la reserva compartida de 15/60 s y 500/día con un único script atómico. No almacena el historial del chat.

## Acciones de Miguel

1. Abre [Upstash Console](https://console.upstash.com/) y crea tu cuenta o inicia sesión. Completa personalmente cualquier aceptación de términos.
2. En **Redis**, pulsa **Create Database**. Nombre sugerido: `morfeo-cuotas`.
3. Selecciona una región próxima a la función de Vercel. Para el proyecto académico, elige el plan **Free** si está disponible en tu cuenta. Comprueba que indica $0; no selecciones pago por uso ni agregados de pago para este paso. La [tarifa oficial](https://upstash.com/pricing/redis) publicada al revisar ofrece un nivel gratuito; las condiciones de tu consola prevalecen.
4. Abre la base. Busca **REST API** o **Connect**: copia la **REST URL** HTTPS y el token REST normal con escritura. No uses la URL `redis://`, la contraseña TCP ni el token de solo lectura. [Referencia oficial](https://upstash.com/docs/redis/features/restapi).
5. En VS Code, abre la carpeta local `chat-morfeo-m3` y edita su archivo `.env`. Completa únicamente:

   ```dotenv
   UPSTASH_REDIS_REST_URL=https://TU-BASE.upstash.io
   UPSTASH_REDIS_REST_TOKEN=TU_TOKEN_PRIVADO
   ```

   Conserva `GEMINI_API_KEY`, `GEMINI_MODEL`, `AUTH_SESSION_SECRET` y el resto. `QUOTA_DRIVER=local` puede permanecer: Redis tiene prioridad si están ambas credenciales.
6. Guarda con Cmd+S. No pegues el token en el chat ni envíes una captura con él visible. Basta confirmar «Redis guardado en .env».
7. Codex reiniciará el servidor de desarrollo y verificará la conexión, la persistencia y la reserva real de forma controlada. No se considerará conectado antes de ese resultado.
8. En el paso de publicación se agregarán estas mismas variables privadas en **Vercel → proyecto → Settings → Environment Variables**, junto con las de Gemini y el secreto de sesión. Se hará un nuevo despliegue y una prueba bajo HTTPS. No se usa ningún prefijo que exponga variables al frontend.

Si ya tienes una base Redis de Upstash, reutilízala si corresponde a este proyecto y tienes permiso para escribir las claves `morfeo:quota:*`. No hace falta crear otra. Preview y producción con el mismo proyecto de Gemini deben compartir esta base. Las llamadas realizadas fuera de esta app no aparecen en su contador.

## Cómo funciona el código

`getQuotaStore` selecciona Redis con las dos credenciales, o el archivo privado exclusivamente en desarrollo. Una configuración parcial se rechaza. En preview/producción la ausencia de Redis produce 503 y no consume Gemini.

Cada consulta o reserva ejecuta EVAL por REST: elimina tiempos de más de 60 segundos, consulta la cantidad y el contador diario, y reserva solo si ambos están por debajo del límite. El contador diario usa la fecha de Los Ángeles y expira en su siguiente medianoche, respetando horario de verano. Los miembros de la ventana tienen UUID para evitar colisiones entre solicitudes concurrentes.

Un envío fallido se mantiene contabilizado: el proveedor puede haberlo procesado aunque el cliente no recibiera respuesta. Un 429 de Google activa la misma experiencia Smith con una espera conservadora de un minuto; si Google aún rechaza el reintento, se informa de nuevo sin bucles automáticos. La app no puede saber el consumo externo ni garantizar que ese 429 se resuelva en un minuto.

## Alcance de las pruebas

Vitest comprueba el contrato REST y que un fallo no habilite llamadas al proveedor. La concurrencia y persistencia se probaron con el archivo local y, después de conectar, con el script Lua real en la base de Upstash. Se enviaron 20 reservas concurrentes a claves temporales de QA: 15 admitidas y 5 rechazadas. Otro cliente leyó las mismas reservas; se comprobaron ventana móvil, reservas 500/501 y expiraciones. Las dos claves de QA se eliminaron al finalizar; el contador real no cambió por estas pruebas. [Resultados](capturas/redis-real.json).
