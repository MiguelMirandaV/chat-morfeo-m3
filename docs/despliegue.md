# Desplegar Chat con Morfeo en Vercel

**Preparación documental del paso 11. Publicación y verificación pendientes del paso 12.** Esta guía describe qué configurar; no demuestra que ya esté configurado en la cuenta ni que exista una URL pública operativa.

## 1. Comprobar el repositorio

En la terminal de la carpeta del proyecto:

```bash
git status
git log -1 --oneline
npm test
```

Espera 130 tests aprobados. Sube solo archivos revisados mediante un commit descriptivo y `git push origin main`. `.env`, `.env.local`, `.data/`, `node_modules/` y `.vercel/` no se versionan. El repositorio a conectar es [MiguelMirandaV/chat-morfeo-m3](https://github.com/MiguelMirandaV/chat-morfeo-m3).

## 2. Usar el proyecto de Vercel

La carpeta de Miguel ya está vinculada con la CLI. En el dashboard, abre el proyecto existente `chat-morfeo-m3` y revisa **Settings → Git**. Conecta ese repositorio si aún no aparece conectado. Si GitHub solicita autorizar la integración, Miguel completa ese acceso en su cuenta. No crees otro proyecto si ya existe el correcto. La integración puede desplegar nuevos pushes; revisa cuál es la rama de producción antes de usarlos. [Documentación de GitHub–Vercel](https://vercel.com/docs/git/vercel-for-github).

En una cuenta nueva, importa tu fork o repositorio propio desde **Add New → Project** y aplica la configuración siguiente.

## 3. Configuración del proyecto

| Ajuste | Valor de este repositorio |
| --- | --- |
| Framework Preset | Other; `framework:null` en vercel.json. |
| Root Directory | Raíz del repositorio, no `src`. Allí están package.json y api. |
| Output Directory | `src`, declarado en vercel.json. |
| Build Command | Sin compilación; `buildCommand:""` ya declarado. |
| Install Command | `npm ci`, para respetar package-lock.json. |
| Node.js | 24.x, también declarado en engines. |
| Production Branch | `main`, a comprobar en el proyecto. |

Conserva `vercel.json`. La raíz y el directorio publicado cumplen funciones distintas: publicar solo `src` evita servir documentos y configuración privada como estáticos, mientras `/api/functions.js` sigue en la raíz para ser detectada como función. [Configuración de Vercel](https://vercel.com/docs/project-configuration/vercel-json).

## 4. Variables privadas

En **Settings → Environment Variables**, agrega las siguientes al proyecto para **Production** y **Preview**. No publiques sus valores en Git, capturas, comandos de shell ni el chat. Marca credenciales como **Secret** cuando la consola lo permita; modelo como configuración.

| Nombre | Valor que debes introducir |
| --- | --- |
| GEMINI_API_KEY | Tu clave privada ya guardada localmente. |
| GEMINI_MODEL | `gemini-3.5-flash-lite`. |
| AUTH_SESSION_SECRET | El secreto privado de al menos 32 caracteres. No copies el ejemplo vacío. |
| UPSTASH_REDIS_REST_URL | URL REST HTTPS de la base conectada. |
| UPSTASH_REDIS_REST_TOKEN | Token REST privado con escritura. |

`QUOTA_DRIVER=local` no habilita archivos en Vercel y no hace falta agregarlo allí. El runtime aporta VERCEL_ENV; no lo definas manualmente. Para mantener un cupo compartido, Preview y Production usan la misma base si consumen el mismo proyecto de Google. [Detalles de Redis](redis.md).

En una copia nueva, crea tus credenciales propias. Para Miguel, se conservarán las existentes; no es necesario regenerarlas. El archivo local no carga automáticamente las variables remotas de Production. Cada cambio remoto exige un nuevo despliegue; no modifica uno anterior. [Variables de entorno de Vercel](https://vercel.com/docs/environment-variables).

## 5. Crear el despliegue

Con las variables guardadas y el commit correcto en main, utiliza el flujo Git del proyecto o **Redeploy** en su dashboard. Comprueba que el despliegue nuevo corresponda al commit que vas a entregar. La alternativa CLI, desde una carpeta ya vinculada, es:

```bash
npm exec -- vercel deploy --prod
```

No ejecutes ambos caminos para el mismo cambio sin necesidad. Espera a que termine y copia el dominio de producción asignado que muestre Vercel, sin inventar un dominio a partir del nombre.

Para la evaluación, la URL debe abrir sin una cuenta de Vercel. Comprueba el **dominio de producción** desde una sesión sin login; una URL específica de preview puede estar protegida aunque el dominio productivo sea público. Si solicita login, revisa Deployment Protection antes de modificarla. [Alcance de la protección](https://vercel.com/docs/deployment-protection).

## 6. Verificación de aceptación

1. Abre el dominio HTTPS sin sesión de Vercel. Debe mostrar Home con CSS e imágenes.
2. Abre y recarga directamente `/home`, `/chat` y `/about`; prueba la navegación y Atrás/Adelante.
3. Verifica que 78 no abre el chat y 79 sí. Confirma cookie HttpOnly/Secure/SameSite en las herramientas del navegador, sin copiar su valor.
4. Envía una pregunta genérica y luego una que requiera recordar un dato ficticio del primer turno. Comprueba ambos resultados y el incremento del contador. No uses datos personales para esta prueba.
5. En Network revisa `POST /api/functions`: contiene historial y recibe reply/quota, sin GEMINI_API_KEY ni el secreto de sesión. El navegador recibe la cookie automáticamente; no pegues sus valores en evidencia.
6. Comprueba que solicitudes a archivos privados o de configuración no entreguen su contenido. Un alias de API puede ejecutarse; importa el contenido y el tipo de respuesta, no asumir que todo alias tiene que dar 404.
7. Revisa 320/768/1024 y la consola. No provoques 16 generaciones reales para activar Smith: ese caso ya tiene evidencia controlada.
8. Registra fecha, dominio, SHA del commit desplegado, pruebas y capturas. Actualiza el enlace de la aplicación en README y entrega.md con el dominio verificado.

El paso 12 se cierra cuando funcionen frontend y función real bajo HTTPS. La instalación desde copia limpia y el contraste final con toda la rúbrica se cierran en el paso 13.
