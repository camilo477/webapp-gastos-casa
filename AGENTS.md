# Mi Casa — Flujo permanente de desarrollo

Este repositorio contiene el prototipo validado hasta Fase 03C. No iniciar otra fase ni integrar Firebase/OCR sin autorización expresa para ese alcance.

En el entorno que originó esta copia, la raíz Git válida es `/mnt/Datos/mi-casa/versionado`. La carpeta anterior `/mnt/Datos/mi-casa` conserva una entrada `.git` vacía montada como solo lectura. No borrarla, reemplazarla ni modificar su montaje. En otros clones, usar su propia raíz Git válida.

## Antes de cada fase

- Comprobar `git status --short --branch`, la rama y cambios anteriores.
- Confirmar `main` y `origin = https://github.com/camilo477/webapp-gastos-casa.git`.
- Inspeccionar el estado remoto; no sobrescribir historia ni descartar cambios previos.
- Leer requisitos, decisiones pendientes y documentación de las fases relacionadas.

## Durante el trabajo

- Mantener `.gitignore`; conservar `package-lock.json` y los recursos legítimos.
- No añadir secretos, credenciales, fotografías privadas, inventarios reales, dependencias, builds ni reportes generados al índice.
- Conservar cambios existentes y las pruebas correspondientes. No modificar reglas de negocio pendientes por suposición.

## Al terminar una fase

El usuario autorizó permanentemente crear un commit descriptivo y hacer push a `origin/main` al cerrar cada fase validada. Esta autorización no permite iniciar una fase nueva, desplegar, usar force push ni publicar datos sensibles.

1. Ejecutar comprobación de tipos, build, pruebas unitarias/componentes y Playwright apropiadas.
2. Revisar `git diff`, `git diff --cached`, `git status` y `git ls-files`; comprobar realmente el contenido preparado.
3. Comprobar de nuevo el remoto y su historia antes de publicar.
4. Crear commit y push sin `--force`; verificar que GitHub recibió el mismo SHA y los archivos esperados.
5. Comunicar SHA, resultados de pruebas, publicación y cualquier bloqueo real. No declarar publicada una fase si no se verificó.

Si el transporte Git está bloqueado por el entorno, documentar el fallo. Cualquier alternativa debe conservar objetos/historia y verificar el resultado remoto; no confundir un fallo del comando con una publicación exitosa. No exponer tokens en URLs, comandos, logs ni archivos versionados.

GitHub y despliegue son operaciones diferentes. No configurar despliegues automáticos sin autorización.
