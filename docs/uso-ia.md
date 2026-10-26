# Registro del uso de IA

## 1. Planificación y alcance

**Solicitud de Miguel:** analizar las lectures, la consigna, la guía y la rúbrica de Henry; proponer un plan con la estructura simple, sin extra credit, y desarrollar el código explicando cada etapa y el flujo de herramientas.

**Trabajo de Codex:** revisión del material, conservación de referencias, propuesta de trece pasos y criterios de aceptación asociados a la rúbrica. El plan fue aprobado por Miguel.

**Decisiones de Miguel:** Morfeo como personaje, interfaz inspirada en la terminal de Matrix, máximo de 280 caracteres por mensaje del usuario y desarrollo desde cero.

**Ampliación posterior:** “Solo agrégale una animación tipo cascada de letras verdes tipo matrix en el /home”. Se incorpora exclusivamente a Home como efecto decorativo, respetando movimiento reducido y deteniendo la animación al salir de la vista. Se implementará al construir la interfaz; no se afirma que ya esté funcionando.

**Resultado:** ficha en `alcance.md`, borrador del system prompt y casos de aceptación. El prompt todavía no ha sido evaluado con Gemini.

## 2. Preparación del entorno

**Solicitud de Miguel:** continuar con el plan aprobado.

**Trabajo de Codex:** revisión de herramientas instaladas y compatibilidad de paquetes; creación de carpeta, configuración npm/Vercel/Git, documentación inicial y página mínima para comprobar el entorno. La actividad real de GitHub y las comprobaciones se registran en `pruebas.md`.

**Criterio aplicado:** herramientas locales del proyecto, versiones registradas y secretos ignorados antes del primer commit. Los módulos iniciales no simulan una aplicación terminada. Los tests funcionales se escribirán junto con la lógica a verificar.

**Iteración después del acceso a Vercel:** Miguel creó la cuenta e inició sesión desde VS Code. Codex verificó la sesión, vinculó el proyecto y probó el arranque real. La CLI rechazó el script `dev` que llamaba a `vercel dev`; se sustituyó por `npm start` y se actualizó la documentación. También se corrigió el orden de las reglas de .gitignore que Vercel había modificado, para mantener .env.example como excepción. Se documenta el fallo y su corrección en lugar de presentar la configuración inicial como comprobada.

## 3. Interfaz mobile-first

**Solicitud de Miguel:** avanzar con el plan aprobado, conservando la estética de Matrix, la cascada exclusiva de Home y el máximo de 280 caracteres.

**Trabajo de Codex:** HTML semántico, funciones de las tres vistas, CSS con variables, Flexbox/Grid y breakpoints 768/1024, cascada de columnas animadas con pausa, contador con Intl.Segmenter y cuatro tests de sus casos borde. Se añadieron rewrites puntuales para que las URLs de la maqueta puedan abrirse y revisarse antes de introducir History API.

**Decisiones:** la decoración no recibe eventos ni se anuncia a lectores de pantalla. Se respeta movimiento reducido y se limpian los recursos al descartar la vista. Se usa el conteo por grafemas para que emojis compuestos y tildes descompuestas no produzcan diferencias con el contador. El envío no se simula como funcional: el botón está deshabilitado y la maqueta lo explica.

**Verificación:** Codex revisó las nueve combinaciones de vista y ancho, capturó las pantallas, comprobó pausa/reanudación, retorno con Atrás y el contador en el navegador. Detectó que la limpieza de pagehide debía respetar la caché de navegación y lo corrigió. Los resultados y las limitaciones están en pruebas.md; no se atribuyen estas comprobaciones a Miguel.

**Referencias técnicas consultadas:** [Intl.Segmenter en MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) y [prefers-reduced-motion en MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).
