# Git y publicación del prototipo hasta Fase 03C

## Directorio de trabajo

En este entorno, trabajar en **`/mnt/Datos/mi-casa/versionado`**. Contiene un repositorio Git escribible, rama `main` y remoto `https://github.com/camilo477/webapp-gastos-casa.git`.

La carpeta anterior `/mnt/Datos/mi-casa` se conserva sin eliminar ni reemplazar su aplicación. Su `.git` es un directorio vacío de modo 555, expuesto por un montaje `tmpfs` de solo lectura; no contiene `HEAD`, objetos ni configuración. Git no podía reconocerlo como repositorio. No se intentó borrar ese directorio, cambiar sus permisos o desmontarlo. Se añadió únicamente un `AGENTS.md` de orientación en la carpeta superior para dirigir el trabajo futuro a la copia versionada.

Se compararon por SHA-256 los 95 archivos originales de código, pruebas, configuración, documentación y diseño con la copia antes de editar: ninguno faltaba ni difería. Los cambios de preparación se limitan a Git, documentación e instrucciones; no hay Fase 04 ni cambios de aplicación, reglas de negocio o identidad visual. Se normalizaron a 644 los archivos de la copia, pues el original los exponía como ejecutables. En FASE_03C.md se retiró una línea vacía final para superar `git diff --cached --check`.

Git dispone de una identidad ya configurada; no se inventó nombre ni correo. Cuando se crea un commit mediante el conector, se utiliza la identidad autenticada que GitHub asigna a esa operación, y se conserva el mismo objeto en la copia local. Una regla global transformaba HTTPS de GitHub en SSH. El repositorio nuevo tiene una excepción específica para conservar su URL HTTPS; no se cambiaron las preferencias globales.

## Contenido y exclusiones

Se versionan `src/`, `tests/`, `docs/`, `design/preview/`, `public/favicon.svg`, configuraciones, README, `AGENTS.md`, `.gitignore`, `package.json` y **`package-lock.json`**.

Se excluyen dependencias, cachés, compilaciones, resultados de pruebas, capturas/vídeos/trazas, `artifacts/`, logs, temporales, archivos comprimidos de trabajo, preferencias locales de editor, `.env` privados, credenciales, claves administrativas, exportaciones de emuladores y carpetas reservadas a recibos/datos privados. No se ignoran indiscriminadamente imágenes: los iconos y recursos de aplicación permanecen versionables. Los futuros `firebase.json`, `.firebaserc` y reglas pueden versionarse; no se ha implementado Firebase.

Se permite `.env.example`, sujeto a contener solo nombres y valores ficticios. Un patrón de exclusión no puede detectar cualquier secreto con nombre arbitrario: antes de cada publicación se debe revisar el índice real y el contenido.

Las evidencias bajo `artifacts/` se regeneran al ejecutar las pruebas. Los enlaces históricos a estas evidencias se consultan localmente; no implican que las capturas se hayan subido a GitHub.

## Auditoría previa

Se revisan `git status`, `git diff --cached`, `git diff --cached --check`, `git ls-files --stage` y el contenido exacto del índice. Se comprobó ausencia de claves privadas, formatos de tokens conocidos, credenciales en URLs, credenciales administrativas JSON y asignaciones sospechosas de secretos. El lockfile no contiene credenciales en URLs de descarga.

No se detectaron secretos en los archivos preparados. Todos son texto UTF-8 y no hay enlaces simbólicos preparados; la única imagen es el favicon SVG de la aplicación. Los productos, comercios e importes son escenarios ficticios; la guía de usabilidad conserva registros vacíos, no observaciones personales. La identidad del autor de Git es metadato de publicación, no un dato de compras.

Se probaron 38 rutas representativas contra `.gitignore`: todas las exclusiones esperadas se aplicaron y `package-lock.json`, `.env.example`, código, diseños, iconos y configuración pública futura permanecieron permitidos.

## Verificación de la copia

La instalación inicial con `npm ci` encontró restricciones de escritura en la caché personal y de DNS del registro. Se completó la instalación con una caché escribible en `/tmp/mi-casa-npm-cache` y después se ejecutó satisfactoriamente **`npm ci --offline --cache /tmp/mi-casa-npm-cache --no-audit --no-fund`**, reconstruyendo las dependencias desde el lockfile. El lockfile original no cambió. Dependencias y caché no se publican.

El primer intento de Playwright se inició antes de completar la instalación y falló por un paquete incompleto. No se cuenta como validación: las comprobaciones se repitieron después de terminar la instalación.

En la copia terminaron correctamente `npm run typecheck`, `npm run build` y `npm test` (**61 pruebas en 5 archivos**). `npm run test:e2e` terminó con **143 pruebas correctas y 1 no disponible**, de 144 casos. El caso de zoom real de Fase 03C conserva su limitación: Chromium headless no aplica el atajo de zoom, por lo que no se presenta como superado. Las pruebas no se eliminaron ni desactivaron para publicar.

## Transporte y publicación

Al comenzar, el conector confirmó un remoto público de tamaño cero, sin ramas y con permisos de escritura. El acceso Git/`gh` por terminal encontró restricciones de DNS; `gh auth token` confirmó que no había token OAuth exportable disponible. No se introdujeron tokens en URLs, comandos, archivos versionados o respuestas.

El conector de GitHub sí dispone de autorización. GitHub rechazó crear un árbol directamente en el repositorio vacío con HTTP 409. Por ello se conserva un commit técnico de inicialización del README, seguido del commit con la instantánea completa validada y el mensaje `feat: initial Mi Casa prototype through phase 03C`. No se reescribe ni elimina ese historial de inicialización.

La publicación utiliza el conector/API; **no equivale a que el comando convencional `git push` haya funcionado**. Se comparan el árbol y los archivos remotos con el índice auditado, y la copia local conserva los mismos commits y seguimiento de `origin/main`. El SHA definitivo se comunica después de verificar GitHub. El transporte CLI sigue requiriendo resolver DNS y habilitar autenticación en el entorno para utilizar normalmente `git fetch`/`git push`.

No se permite force push, eliminar el repositorio remoto, reemplazar historia ni presentar una subida fallida como éxito. Si cualquier paso de publicación o verificación falla, debe comunicarse expresamente.

## Flujo permanente

Leer [AGENTS.md](../AGENTS.md): comprobar rama, remoto y cambios antes de trabajar; mantener `.gitignore` y pruebas; revisar datos sensibles; al cerrar cada fase autorizada y validada, crear commit descriptivo, publicar en `origin/main`, verificar recepción y comunicar SHA. La autorización de publicar no autoriza iniciar otra fase ni desplegar.

Para uso normal fuera de las restricciones de este entorno, configurar GitHub CLI/SSH/gestor de credenciales localmente y comprobar acceso a GitHub. No guardar credenciales administrativas en el proyecto. La publicación del código y cualquier despliegue son operaciones independientes.

Gemini no participa en esta preparación: no se cambian reglas ni arquitectura de la aplicación; se realiza revisión del índice, conservación de archivos y ejecución de las pruebas existentes.
