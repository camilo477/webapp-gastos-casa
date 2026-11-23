# Fase 05C-6 — Publicación controlada y lectura real de inventario

Fecha: 23-11-2026. Base: `12a723e60ff2f080749f9e6bc7ae08886d587b93`, rama `main`.

**Estado de esta entrega: pendiente de publicación manual de reglas y de su verificación. La integración real permanece bloqueada.** Este informe distingue autorización recibida, operación ejecutada y evidencia verificada; no declara completada la fase por haber preparado instrucciones o ejecutado emuladores.

## Autorización y condiciones

El propietario autorizó expresamente, solo en mi-casa-camilo-test / (default): publicar las reglas revisadas, crear exclusivamente la ACL administrativa de inventario, conectar el lector React y probar lecturas. Se conserva Spark. No autoriza productos/datos de ejemplo, compras/gastos, escrituras directas, Blaze, Functions/Hosting, OCR o nuevas bases.

El orden es obligatorio: comprobar proyecto/reglas actuales → publicar y verificar reglas → crear/verificar ACL → activar lectura → probarla. Si no se verifica una condición, se detienen sus operaciones dependientes. La autorización ya existe; la intervención solicitada es ejecución/verificación manual, no una nueva petición de permiso.

## Estado del entorno

El propietario volvió a confirmar visualmente proyecto mi-casa-camilo-test, (default), Standard, Native, us-east1, Spark, reglas deny-all e inventario vacío. Esa evidencia es del propietario, no una consulta administrativa independiente de Codex.

Se comprobó de nuevo Firebase CLI mediante inventario local de sesiones con salida capturada: no devolvió una lista de cuentas utilizable. gcloud no está instalado y no hay herramienta conectada de Firebase Console. No se inició sesión administrativa, solicitaron/descargaron claves, service accounts o tokens, ni se consultaron datos reales. `.env.auth-test.local` conserva su exclusión de Git y no se mostró su contenido.

Antes de modificar permisos desde Console, el propietario debe volver a comprobar el selector de proyecto y la base concreta, plan Spark y fuente activa deny-all. Si difieren del estado esperado, detenerse y comunicarlo, sin intentar recrear, migrar o corregir recursos automáticamente.

## Publicación de reglas — intervención manual necesaria

El contenido completo de [inventory-read.firestore.rules](../security/inventory-read.firestore.rules) conserva SHA-256 `9d2f541808f6135562f715f7b55f08bac859d70467ef56bfa97cd9c02119e37b`, idéntico al artefacto probado en 05C-5. No se modificó para conseguir acceso. El hash local no prueba qué está publicado.

1. Abrir [Firebase Console del proyecto](https://console.firebase.google.com/project/mi-casa-camilo-test/firestore), seleccionar (default) → Reglas y comprobar proyecto, Spark y reglas actuales antes de editar. No crear otra base.
2. Si el estado coincide, copiar íntegramente el archivo autorizado. Puede abrirse también la [fuente pública fijada al commit base](https://github.com/camilo477/webapp-gastos-casa/blob/12a723e60ff2f080749f9e6bc7ae08886d587b93/security/inventory-read.firestore.rules). Sustituir toda la fuente del editor; no añadir reglas permisivas ni UID personal.
3. Publicar solo esas reglas, volver a abrir/recargar la pestaña y consultar la versión activa. Facilitar a Codex el texto completo de las reglas publicadas y confirmar proyecto/base para compararlo con el artefacto. No enviar UID, tokens, credenciales o capturas privadas. Un borrador en el editor no demuestra publicación.
4. Esperar propagación antes de ensayos de acceso. Mientras no se compruebe la publicación, **no crear ACL ni desbloquear React**. [Procedimiento oficial de Console](https://firebase.google.com/docs/rules/manage-deploy#use_the_firebase_console).

Las reglas exigen Auth, igualdad del UID del token con la ruta y ACL administrativa habilitada/válida; permiten únicamente productos propios con list limitado a 100. Escrituras, otras cuentas, ACL, finanzas y rutas desconocidas permanecen denegadas. Console/IAM no depende de abrir reglas para crear la futura ACL.

## ACL — detenida hasta verificar reglas

No se creó ni se comprobó `_access/inventory`. Una vez comprobada la publicación, aplicar el [procedimiento administrativo](architecture/FIRESTORE_READ_RELEASE_RUNBOOK.md#3-acl-administrativa-futura--no-crear-en-05c-5) ya autorizado: obtener el UID de la cuenta Auth aprobada, compararlo privadamente con la configuración existente, inspeccionar cualquier ACL previa antes de modificar y detenerse ante diferencias. Si no existe, crear únicamente schemaVersion number entero 1, enabled boolean true y ownerUid string con ese UID, y volver a consultar los campos/tipos.

El valor real no se copia a Git, ejemplos, reglas o logs; tampoco se sustituye por correo o UID ficticio. No se crea otro usuario ni producto para probar el acceso. La creación de ACL no equivale a habilitar un ejecutor de modificaciones.

## React y pruebas reales — detenidas hasta verificar reglas y ACL

El bloqueo `requireRealInventoryReadRelease` sigue incondicional y la factoría no se importa desde main. No se añadió un flag que lo retire ni se configuró una conexión remota nueva. Demo sigue independiente; emuladores conservan endpoints ficticios y auth-test sigue Auth-only. No hay mutate ficticia o fallback de inventario real a seed.

Tras verificar reglas y ACL, se podrá implementar y probar el lector schemaVersion=2 / inventory-candidate-v1, mismas categorías y Auth existentes, composición de solo lectura en sesión privada y vacío comprensible sin botones de modificación. El [plan de composición](FASE_05C_5.md#compatibilidad-del-lector-y-preparación-de-react) sigue disponible; no se ejecuta por saltarse esas verificaciones.

No se probaron inicio de sesión real de esta fase, lectura vacía, recarga, logout, rutas o fallos de red contra Firestore real. La evidencia histórica de Authentication no demuestra una lectura actual. Si se necesita contraseña, el propietario deberá escribirla directamente en su navegador; no se solicitará ni registrará en herramientas.

## Regresiones locales

Se ejecutaron de nuevo estas comprobaciones, sin eliminar ni deshabilitar pruebas:

| Suite | Resultado |
| --- | --- |
| TypeScript React y build | Correctos; build incluye typecheck |
| TypeScript/build servidor y contrato | Correctos con Node 24 |
| Unitarias/componentes/configuración/adaptadores React | 172 correctas en 18 archivos |
| Unitarias servidor y contrato | 26 correctas, con detalle individual además del reporte por archivo |
| Reglas preparadas con Firestore Emulator | 23 correctas |
| Lectores SDK Auth/Firestore Emulator | 5 correctas |
| Contrato consolidado Auth/Firestore/Functions Emulator | 9 correctas |
| Playwright contrato consolidado | 14 correctas |
| Regresión servidor 05C-1/05A con emuladores | 34 correctas |
| Playwright inventario histórico | 16 correctas |
| Playwright Authentication Emulator | 24 correctas |
| Reglas deny-all auth-test con emulador | 4 correctas |
| Playwright demo/regresión | 144 correctas; una omisión histórica de zoom real headless, sin nuevas omisiones |

Comandos: npm run build, npm test, npm run typecheck:server, npm run test:server, npm run test:inventory:read, npm run test:inventory:candidate, npm run test:inventory:emulator, npm run test:auth:emulator y npm run test:e2e. Se ejecutaron también los tres archivos del servidor con Node --test --test-reporter=spec --test-isolation=none para detallar sus 26 casos. Las suites con puertos compartidos se ejecutaron secuencialmente sobre el proyecto demo y terminaron sus emuladores.

Se mantienen casos de otras identidades, ACL inválida/revocada, rutas cerradas, escrituras/lotes/transacciones denegados, esquema malformado, cantidades/estados/categorías, 100/500/1.000 productos, concurrencia/idempotencia, recarga, aislamiento de sesión y demo sin solicitudes Firebase. Playwright conserva teclado/foco, axe, responsive y texto al 200 %. Son resultados locales, no evidencia de reglas publicadas, ACL real o lecturas actuales del proyecto autorizado.

Se revisaron artefacto completo, compatibilidad, documentación, diff y archivos. Gemini se omitió en esta entrega: no hay cambios de aplicación, reglas o arquitectura, solo registro documental del bloqueo y su intervención manual necesaria. La revisión no reemplaza las pruebas ni se atribuye a un revisor que no participó.

## Git y límites

La revisión inicial confirmó main, árbol limpio, remoto esperado y commit base coincidente con origin/main. No se sobrescribieron cambios existentes. La documentación conserva las operaciones administrativas como pendientes hasta su comprobación. Publicar este informe en GitHub no publica reglas en Firebase ni completa la activación.

No se inicia otra fase. Si permanece sin evidencia la publicación o la ACL, la integración se entrega bloqueada con los pasos manuales pendientes indicados, sin atribuir éxito a operaciones no verificadas.
