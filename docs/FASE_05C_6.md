# Fase 05C-6 — Lectura autorizada del inventario Firestore

Fecha: 23-11-2026. Base original: `12a723e60ff2f080749f9e6bc7ae08886d587b93`. Continuación de implementación sobre `20b7b7916b1369e18f2ab2223414787ac2a2b5c8`, que registró el bloqueo administrativo inicial.

**Lector implementado, validado localmente y probado efectivamente con Authentication/Firestore reales del proyecto autorizado.** Las reglas y la ACL fueron publicadas/configuradas por el propietario y confirmadas expresamente por él durante esta fase. No se presentan como operaciones administrativas ejecutadas o verificadas independientemente por Codex.

## Autorización y evidencia administrativa

Solo mi-casa-camilo-test, base (default), Standard/Native, us-east1 y Spark. El propietario autorizó reglas revisadas, exclusivamente la ACL administrativa, lector React y pruebas de lectura. No autoriza productos/datos de ejemplo, compras/gastos, escrituras directas, Blaze, Functions/Hosting, OCR, otras bases o proveedores/usuarios nuevos.

Inicialmente la CLI no aportó una sesión administrativa utilizable y se detuvieron ACL/React. Se proporcionó el procedimiento manual. Después el propietario confirmó:

- Las reglas publicadas corresponden íntegramente a `security/inventory-read.firestore.rules` y al proyecto/base autorizados.
- Existe `_access/inventory` con schemaVersion int64 1, enabled boolean true y ownerUid string del UID de la cuenta Firebase Authentication ya aprobada.
- Se mantiene el estado de proyecto/base/región/plan antes confirmado visualmente. No se comunicaron diferencias inesperadas.

Esa confirmación permitió continuar en el orden autorizado. No se usaron service accounts, claves, APIs administrativas o tokens descargados. No se imprimió/copió el UID a fuente, reglas o documentación; el campo se describe sin su valor. No se volvió a crear o modificar la ACL desde React. El inventario sigue vacío según evidencia del propietario; una ACL administrativa no es un producto.

## Reglas y seguridad

El artefacto permanece sin cambios y conserva SHA-256 `9d2f541808f6135562f715f7b55f08bac859d70467ef56bfa97cd9c02119e37b`. Es referencia local de contenido, no comprobación independiente de la publicación. La declaración del propietario sobre la fuente activa se registra con su procedencia.

Las reglas exigen Auth, UID del token igual a la ruta y ACL válida/habilitada; solo permiten productos propios y list con límite 1–100. Deniegan escrituras de clientes, otras cuentas, ACL, finanzas, subcolecciones y rutas desconocidas. Las pruebas adversariales se ejecutan en Emulator con contextos ficticios, no mediante otra cuenta real. Console/IAM omite las reglas y requiere administración protegida.

El permiso no depende de ocultar botones ni de variables cliente. El indicador local solo selecciona el lector; reglas/ACL y Auth siguen autorizando cada petición en el servidor. No se añadieron métodos de escritura, Firebase Admin o Functions al lector. No se modificó el ejecutor local o financiero.

## Composición React y separación de modos

| Comando | Comportamiento |
| --- | --- |
| npm run dev | Demo en memoria, sin Firebase |
| npm run dev:emulator | Auth/Firestore/Functions locales y contrato consolidado |
| npm run dev:emulator:legacy | Regresión histórica local explícita, sin migración |
| npm run dev:auth-test | Solo Auth real aprobado y prototipo identificado como ejemplo; fuerza desactivada la lectura aunque sobren variables |
| npm run dev:inventory-read | Auth existente y lector real explícito, solo proyecto/base/origen/contrato/aprobación autorizados |

El nuevo comando carga únicamente variables VITE_FIRESTORE_READ_* desde `.env.inventory-read.local` y reutiliza la configuración privada de `.env.auth-test.local`. No modifica o duplica UID/SDK/Auth credentials en ese archivo nuevo. Los dos archivos quedan ignorados; no se publican sus contenidos. El archivo de lectura contiene base, contrato y aprobación independiente por proyecto; el comando selecciona explícitamente VITE_FIRESTORE_READ_ENABLED=true. Auth-only y emulador fuerzan false.

`inventoryReadRequested` y `prepareInventoryReadConfiguration` fallan antes del SDK ante selección inválida, entorno cruzado, proyecto/base/origen/contrato o aprobación incompletos. Sin selección, main no importa la factoría Firestore. Producción y otras ubicaciones web permanecen deshabilitadas; la lectura solo admite localhost/127.0.0.1:5175. No existe fallback remoto, a emuladores o a seed ante error.

La factoría reutiliza la app `mi-casa-auth-test:<proyecto>` con getApp/getAuth, comprueba proyecto/API pública/appId y ausencia de emulador y obtiene exclusivamente Firestore Lite de (default). No inicializa otra identidad. InventorySource permite representar explícitamente el puerto de solo lectura en App/InventoryContext; no se usa un cast o mutate ficticia.

El lector mantiene inventory-candidate-v1/schemaVersion 2, las siete categorías aprobadas, validación estricta, cantidades exactas/estados aproximados, páginas de 100 por ID/cursor y errores traducidos. No consulta operaciones ni mantiene caché offline de productos. La sesión privada conserva comprobación inicial, limpieza por scope al salir/cambiar identidad, descarte de respuestas tardías y protección de rutas.

La pantalla vacía dice «Todavía no tienes productos registrados». No muestra productos demo ni botones de crear/editar/guardar existencias. Se conservan carga, permisos, conexión y sesión vencida. Los avisos de AppShell/LoginPage/SessionActions distinguen cuenta consultada, emulador y ejemplos; compras/gastos siguen siendo ejemplos independientes, sin integración financiera. No se rediseñaron componentes, estilos o navegación.

## Privacidad de registros

Las pruebas mostraron que los errores predeterminados del SDK Firestore incluían la ruta documental (UID) y detalles de solicitud en console, que Vite podía reenviar al terminal. Antes de inicializar el lector real se aplica `setLogLevel('silent')`; la interfaz conserva errores comprensibles mediante el adaptador. Una prueba de navegador provoca permisos/red y comprueba que no se impriman la identidad o clave pública ficticias. No se oculta un error de UI ni se registra el payload.

Se usa el [control oficial de registros de Firestore Lite](https://firebase.google.com/docs/reference/js/firestore_lite#setloglevel). No se capturan contraseñas, headers, tokens, respuestas Auth, storageState, HAR, trazas o capturas privadas durante pruebas reales. La persistencia de sesión corresponde al mecanismo oficial existente de Firebase Auth, no a un almacenamiento de contraseñas.

## Prueba real ejecutada

Se inició npm run dev:inventory-read en http://localhost:5175/acceso y una ventana propia de Chromium sin perfil personal. El monitor permite solo localhost, Auth del proyecto y lecturas Firestore de mi-casa-camilo-test/(default); registra contadores/booleanos, nunca URL con UID, headers o cuerpos Auth. Bloquea escrituras, Functions y otros proyectos/servicios antes de enviarlos.

El propietario ingresó la cuenta y contraseña directamente en esa ventana y avisó que había terminado. No se solicitaron o leyeron esos campos desde las herramientas. El recorrido real usó respuestas de red de Firebase, sin route.fulfill, tokens ficticios o fixtures; las rutas permitidas se continuaron y las no permitidas se bloquearían antes de enviarse. Se utilizó el proveedor existente de correo/contraseña, no Google. Las ventanas se cerraron temporalmente durante suites que compartían puerto; el recorrido definitivo se ejecutó con el servidor real restaurado y sin configuración ficticia.

| Recorrido real solicitado | Estado |
| --- | --- |
| Inicio de sesión autorizado y UID | Correcto: controlador de sesión validó la identidad configurada y el token del proyecto; se abrió la ruta privada y el servidor permitió la consulta propia. No se imprimió UID o token |
| Lectura del inventario vacío y ausencia de seed | HTTP exitoso de RunQuery real y «Todavía no tienes productos registrados»; cero filas, cero botones de alta/guardado |
| Recarga y restauración | Correctas sin volver a escribir contraseña; nueva consulta exitosa y mismo estado vacío |
| Cierre de sesión y rutas protegidas | Logout regresó a /acceso; navegar otra vez a /inventario permaneció en acceso, sin pantalla privada ni consultas adicionales |
| Error de conexión y recuperación | Desconexión controlada del navegador: error comprensible, sin seed. Restablecer conexión y reintentar produjo otra consulta real exitosa |
| Ausencia de escrituras, Functions u otro proyecto | Cero intentos durante todo el recorrido autenticado, recarga, desconexión/recuperación y logout/ruta protegida |

Contadores finales saneados: cinco solicitudes Auth; cuatro intentos de consulta Firestore, de los cuales tres tuvieron respuesta exitosa y uno correspondió al navegador desconectado. Cero intentos de escritura/Functions/otro proyecto/servicio imprevisto y cero errores de página. Tras logout y navegación protegida, los cuatro intentos permanecieron sin aumentar. No hubo un nuevo ingreso desde herramientas. La consulta permitida confirma autorización efectiva de esa sesión; no sustituye una inspección administrativa del texto completo de reglas o ACL.

No se intentó escribir para probar un rechazo real, crear productos, sembrar una colección o usar otra cuenta. Los negativos de servidor se prueban en Emulator. Se comprobó que la salida del servidor de desarrollo no contenía rutas de usuario, patrones de API key real o tokens, sin mostrar su salida cruda. Al terminar se cerró la sesión y la ventana temporal de pruebas; la aplicación queda disponible en localhost:5175. No se certifican reinicio completo del dispositivo, índices/latencia/costos, revocación real o proveedores no probados.

## Pruebas locales

Todas las suites siguientes se ejecutaron sobre la implementación de esta continuación. No se eliminaron o deshabilitaron pruebas anteriores:

| Suite | Resultado |
| --- | --- |
| TypeScript React y build | Correctos; build incluye typecheck |
| TypeScript/build servidor y contrato compartido | Correctos con Node 24 |
| Unitarias/componentes/configuración/adaptadores React | 177 correctas en 19 archivos |
| Unitarias servidor | 26 correctas, confirmadas individualmente además del reporte por archivo |
| Reglas Firestore Emulator | 23 correctas |
| Lectores SDK Auth/Firestore Emulator | 5 correctas |
| Contrato consolidado con Auth/Firestore/Functions Emulator | 9 correctas en la repetición íntegra con emuladores nuevos |
| Playwright inventario consolidado | 14 correctas |
| Regresión servidor 05C-1/05A con emuladores | 34 correctas |
| Playwright inventario histórico | 16 correctas |
| Playwright Authentication Emulator | 24 correctas |
| Reglas auth-test deny-all en emulador | 4 correctas |
| Nuevos Playwright lector/Auth-only con servicios interceptados | 8 de lectura + 1 Auth-only correctas |
| Playwright demo/regresión | 144 correctas; una omisión histórica de zoom real headless, sin nuevas omisiones |

Comandos: npm run build, npm test, npm run typecheck:server, npm run test:server, npm run test:inventory:read, npm run test:inventory:candidate, npm run test:inventory:emulator, npm run test:auth:emulator, npm run test:inventory:read:browser y npm run test:e2e. Se ejecutaron también los tres archivos del servidor con Node --test --test-reporter=spec --test-isolation=none para detallar sus 26 casos. Las suites que comparten puertos se ejecutaron secuencialmente y cerraron sus emuladores/servidores.

Se conservan 100/500/1.000 productos, unidades/conversiones/envases, apertura sin gasto, estados sencillos, duplicados, concurrencia/idempotencia, documentos incompatibles, categorías, reglas negativas, rutas/sesiones y ausencia de Firebase en demo. Los nuevos componentes verifican que no se lea durante checking/anonymous, que logout/restauración del mismo UID descarten respuestas viejas, vacío sin escritores y permisos/red/expiración sin seed.

Los nueve recorridos nuevos usan valores y tokens **ficticios generados en memoria** y todas las solicitudes Auth/Firestore se cumplen o abortan en Playwright antes de salir a la red. Comprueban main/factoría/sesión oficiales del SDK, vacío, recarga, logout, protección, permisos/red/expiración, UI sin aviso de emulador o botones de escritura, registros sin identidad y responsive 360/390/430/768 px al 200 % con axe/teclado. El perfil Auth-only recibe a propósito flags completos de lectura pero el comando los desactiva; no obtiene el adaptador Firestore. No se presenta ninguna de esas respuestas simuladas como autenticación o lectura reales.

## Problemas encontrados y revisión

Se adaptaron las expectativas de pruebas del bloqueo histórico a la selección explícita autorizada; los casos que exigen defaults cerrados y rechazan flags/aprobaciones ajenos se conservan y amplían. No se eliminan casos para lograr positivos. Se corrigió el aviso de laboratorio en la variante real y la exposición de rutas en registros del SDK.

La primera ejecución de la suite candidata falló al cargar el worker local confirmPurchaseExperimental: el emulador registró timeout de inicialización y el cliente recibió deadline-exceeded, en vez del rechazo de validación esperado. No se tocó el código servidor ni se omitió ese caso; se cerró esa ejecución y se repitió íntegra con emuladores nuevos. El segundo ensayo pasó los 9 casos de servidor y 14 Playwright, incluido el rechazo del ejecutor financiero antiguo sobre documentos candidatos. No se atribuye al reinicio una causa interna que no se pudo demostrar.

Un ensayo de la regresión general terminó con salida 143 después de informar 144 casos correctos y la omisión histórica; se repitió en solitario y finalizó con código 0 y los mismos resultados. No se cambiaron sus casos, timeouts o criterios de éxito para conseguirlo.

Se intentó revisión Gemini del plan en un directorio aislado con solo contexto público; faltó autenticación y la carpeta no confiable no mantuvo modo plan. No hubo revisión efectiva, cambios de confianza o reintentos de autenticación. Se realizó revisión propia de fronteras, diff y pruebas, incluida la privacidad de errores y los avisos de UI.

## Documentación, Git y límites

Se actualizan este informe, README, guía Firebase, runbook, preparación/seguridad y registro de decisiones para distinguir autorización, confirmación del propietario y pruebas efectivas. `.gitignore` conserva configuración privada, datos, capturas, logs y compilados fuera del índice; no hubo nuevas dependencias o cambios de reglas/Functions. Se auditan contenido y diff antes del commit/push.

No se activa Blaze, crea otra base/usuario/producto/dato de ejemplo, habilita escritura, despliega Functions/Hosting o implementa OCR/compras. DP pendientes, máximos experimentales, presupuesto, migración, IAM, índices/latencia reales y pruebas nativas de uso conservan sus límites. El alcance termina en 05C-6; la validación real descrita se completó y no autoriza otra fase automáticamente.
