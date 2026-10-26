# Registro de comprobaciones

## Preparación del entorno

- Node.js instalado: v24.21.0; npm: 11.19.0; Git: 2.55.0.
- VS Code y el comando `code` están instalados.
- GitHub CLI pudo identificar la cuenta existente como MiguelMirandaV mediante una consulta autenticada.
- El repositorio `MiguelMirandaV/chat-morfeo-m3` no existía al iniciar la preparación.

- Se instalaron las herramientas locales: Vitest 5.0.5 y Vercel CLI 65.3.1, compatibles con Node 24. Las versiones ejecutaron sus comandos de identificación correctamente.
- Se comprobó la validez de package.json y vercel.json; los módulos son ES y el directorio estático es src. El comando interno de desarrollo de Vercel se deja vacío para servir el contenido estático directamente.
- Git ignora .env, variantes locales/producción, node_modules y .vercel. .env.example sí es versionable y sus valores están vacíos.
- Los enlaces locales de README y documentación apuntan a archivos existentes. No se encontraron patrones de claves de Gemini o tokens de GitHub en la documentación revisada.
- Se inicializó main y se creó el primer commit de alcance, 0e5b666.
- Miguel creó su cuenta y confirmó el acceso en VS Code. Vercel CLI comprobó la sesión como `miguelmirandav`, en el espacio `miguel-miranda-v`, plan Hobby.
- Se creó/vinculó el proyecto `chat-morfeo-m3` en ese espacio y Vercel conectó el repositorio público existente de GitHub.
- La vinculación generó `.vercel/` y `.env.local` con datos privados de la CLI. Se conservan ignorados, sin registrar sus valores en la documentación.
- El primer arranque produjo `DEV_RECURSIVE_INVOCATION`: Vercel no permite que el script `dev` llame a `vercel dev`, incluso con devCommand vacío. Se corrigió a `npm start`, que ejecuta Vercel Dev enlazado solo a 127.0.0.1:3000. El README refleja el comando real.
- Se simplificó .gitignore tras los cambios automáticos de Vercel: `.env*` queda seguido por `!.env.example`, preservando el ejemplo versionable y las variables reales excluidas.
- Segundo arranque con `npm start`: Vercel Dev quedó listo en `http://127.0.0.1:3000`.
- Comprobación HTTP local: `/`, `/styles.css` y `/app.js` respondieron 200 con sus tipos correctos; el HTML incluyó el texto de preparación esperado.
- `/.env`, `/.env.local`, `/.git/config` y `/package.json` respondieron 404. No se registraron contenidos de archivos privados.
- Se comprobaron las exclusiones con `git check-ignore --no-index`, para no depender de que el archivo ya estuviera versionado: variables y datos privados ignorados, .env.example permitido.
- Resultado: paso 2 completado. Esta verificación valida el entorno inicial; las funcionalidades del chat aún no existen y no se presenta como una prueba de la integración Gemini o del router.

### Revisión de dependencias

La instalación inicial de las herramientas produjo 34 avisos de npm audit. Se evaluó la alternativa Vercel 53.2.0 que sugería npm, pero aumentó los avisos a 39, por lo que no se conservó. Se mantuvo la CLI actual 65.3.1 y se aplicó npm audit fix sin --force y sin ejecutar scripts de instalación: quedaron 33 avisos transitivos de desarrollo (12 moderados, 20 altos y 1 crítico).

Estos avisos pertenecen a dependencias de las herramientas, incluyendo el árbol de Vercel CLI. No se consideran resueltos ni se ocultan con overrides de versiones principales. La auditoría con --omit=dev devolvió cero vulnerabilidades; en esta etapa aún no hay dependencias de aplicación de producción. Este último resultado no equivale a una auditoría limpia de todas las herramientas. Se revisará de nuevo al incorporar dependencias o preparar la publicación.

## Comprobaciones pendientes

No se han ejecutado pruebas de chat, routing SPA, Gemini, responsive, cascada o producción. Todavía no se han implementado esas funcionalidades. Los tests unitarios se agregarán con la lógica central.
