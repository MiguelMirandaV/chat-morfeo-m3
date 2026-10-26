# Chat con Morfeo

Proyecto Integrador del Módulo 3 de Full Stack de Henry. Aplicación en desarrollo para conversar en español con Morfeo de Matrix, con estética de terminal.

## Estado del proyecto

El alcance y el personaje están definidos. Esta versión prepara el entorno y una página inicial de comprobación. El routing, la interfaz final, la cascada de Home, el chat, Gemini y los tests funcionales se implementarán en los próximos pasos. Aún no hay URL productiva.

## Alcance acordado

- Vistas SPA: `/home`, `/chat` y `/about`, usando History API.
- HTML, CSS mobile-first y JavaScript con módulos ES.
- Un único personaje: Morfeo, con tono sereno, reflexivo y respuestas breves.
- Máximo de 280 caracteres por mensaje del usuario, validado en navegador y servidor.
- Historial en memoria durante la sesión; se pierde al recargar.
- Gemini mediante `api/functions.js`, con API key solo en servidor.
- Cascada decorativa de caracteres verdes únicamente en `/home`, respetando movimiento reducido.
- Indicador estático de escritura, estados de error y scroll automático.
- Tests con Vitest y despliegue en Vercel.

No se incorporan persistencia, varios personajes, timestamps, envío con Enter, copiar respuestas ni cambio de tema. Enter insertará una nueva línea en el textarea.

## Requisitos

- Node.js 24.x y npm.
- Git para control de versiones.
- Cuenta de Vercel para utilizar su CLI y las funciones locales.
- Cuenta de Google AI Studio y una clave de Gemini en la etapa de integración.

Vitest y Vercel CLI son dependencias de desarrollo del proyecto. Los scripts de npm ejecutan sus versiones locales; no hace falta instalarlas globalmente.

## Instalación

Desde una terminal situada en la raíz del proyecto:

```bash
npm ci
```

Este comando instala las versiones registradas en `package-lock.json`. Para la primera instalación durante la preparación se utiliza `npm install`; las siguientes copias utilizarán `npm ci`.

## Variables de entorno

Cuando se integre Gemini, copia el ejemplo:

```bash
cp .env.example .env
```

Completa `GEMINI_API_KEY` y `GEMINI_MODEL` en el archivo local. La elección del modelo se verificará en AI Studio. `.env` está ignorado por Git y no debe compartirse. La página de preparación actual no consume Gemini ni requiere una clave.

## Desarrollo local

Comprueba la sesión de Vercel:

```bash
npm run vercel:whoami
```

Si no hay sesión, inicia sesión:

```bash
npm run vercel:login
```

Luego ejecuta:

```bash
npm run dev
```

Abre la URL que muestre la terminal. En el primer uso, Vercel puede pedir vincular la carpeta con un proyecto; se usará el nombre `chat-morfeo-m3`, la raíz `.` y el preset Other. La configuración está versionada en `vercel.json`: contenido estático desde `src/`, sin compilación ni proceso de desarrollo adicional. Las reglas SPA se incorporarán al implementar el router. Detén el servidor con Ctrl+C.

## Tests

Los comandos previstos son:

```bash
npm test
npm run test:watch
```

En esta etapa todavía no existen tests de funcionalidad: Vitest informará que no encontró archivos de prueba. Los tests se incorporarán con las validaciones, transformaciones y lógica del proyecto. La entrega deberá incluir al menos cuatro tests significativos con todos los casos pasando.

## Organización

```text
api/              Función de Vercel; se implementará en su etapa
src/index.html    Documento inicial
src/styles.css    Estilos
src/app.js        Entrada, vistas y routing
src/chat.js       Estado y lógica del chat
src/utils.js      Validaciones y transformaciones
tests/            Tests unitarios pendientes de implementación
docs/             Alcance, registro de IA, pruebas y capturas
```

La ficha del personaje y los criterios completos están en [docs/alcance.md](docs/alcance.md).

## Despliegue

Se conectará este repositorio a Vercel en la etapa de publicación. Se configurarán las variables del servidor y se verificará tanto la SPA como la función real. La URL productiva y las instrucciones finales se documentarán después de comprobar ese despliegue.

## Evidencias y uso de IA

- [Registro de uso de IA](docs/uso-ia.md)
- [Registro de comprobaciones](docs/pruebas.md)
- Las capturas reales se agregarán a `docs/capturas/` cuando exista la interfaz.

Miguel definió el personaje, la dirección visual, el máximo de caracteres y aprobó el plan. Codex apoya la planificación, el desarrollo y las verificaciones. Los registros distinguen acciones realizadas de funcionalidades pendientes.
