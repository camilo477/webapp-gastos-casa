# Fase 05C-4 — Aprobación del inventario y configuración prevista de Firestore

Fecha de aprobación: **23 de noviembre de 2026**. Base: `2f243a61eee7520783042653fb960c1a230aeda5`, rama `main`.

Se registró la aprobación expresa del propietario y se revisó la compatibilidad del código existente. **Esta fase modifica únicamente documentación; no conecta Firestore real ni modifica Authentication, reglas, aplicación o ejecutores.** La autorización de creación manual por el propietario se distingue de la evidencia de que la base exista y de los permisos futuros de lectura/despliegue.

## Aprobaciones del propietario

Fuente: instrucción expresa del propietario para 05C-4, con fecha 23-11-2026. Alcance íntegro en [OWNER_DECISION_REVIEW](architecture/OWNER_DECISION_REVIEW.md).

| Decisión | Aprobación registrada |
| --- | --- |
| DP-03 — Inventario | Exacto y aproximado; unidades individuales enteras; kg/L hasta tres decimales; g/kg y ml/L explícitos; envases con contenido confirmado, nunca inferido del nombre; aperturas sin gasto; sin saldos negativos; Hay suficiente/Queda poco/Agotado; sin umbrales automáticos. Base/control con historial exigen migración específica. |
| DP-07 — Arquitectura del inventario | Firestore Standard/Native, documentos independientes por producto, ejecutor confiable y Functions como mecanismo futuro de modificación, lecturas Auth + Security Rules; inventory-candidate-v1/schemaVersion 2, versión única, (default), us-east1, mi-casa-camilo-test y Spark. Demo independiente. |
| DP-08 — Categorías | food: Alimentos; household-care: Aseo del hogar; personal-hygiene: Higiene personal; pharmacy: Farmacia; pets: Mascotas; other: Otros; unclassified: Sin clasificar. Sin clasificar por defecto si no se eligió; distinto de Otros; sin pantalla adicional de administración; etiquetas históricas conservadas cuando corresponda. |
| DP-10 — Duplicados | IDs estables independientes del nombre; sugerencias por nombre/presentación y confirmación humana; nunca fusión automática; presentaciones distintas permitidas; mismo identificador de operación no repite efectos; sin promesa de deduplicación semántica perfecta. Criterios técnicos ajustables mediante nuevas pruebas, respetando estas reglas. |

El nombre inventory-candidate-v1 permanece para compatibilidad: el contrato está aprobado en ese alcance aunque el identificador conserve candidate. No se renombra el esquema ni se migran documentos para reflejar una aprobación documental. Máximos económicos/técnicos, migración antigua y contratos financieros no se aprueban por extensión.

## Configuración de Firestore autorizada y evidencia disponible

| Dato | Configuración aprobada para creación manual |
| --- | --- |
| Proyecto | mi-casa-camilo-test |
| Edición / modo | Standard / Native |
| Base | (default), única base prevista; no crear bases adicionales |
| Región | us-east1 |
| Plan | Spark, sin activar Blaze ni vincular facturación |
| Seguridad inicial | Modo de producción con todas las lecturas y escrituras denegadas |
| Contenido | Sin datos de ejemplo, inventario real o ACL administrativa |

**Evidencia disponible:** existe autorización expresa para que el propietario cree la base manualmente. No se dispone de acceso a Firebase Console ni se utilizaron credenciales administrativas, API de administración, SDK real de Firestore o conexiones de prueba remotas para certificarla. La configuración pública de Auth y la documentación local no demuestran que la base exista, su región/edición, plan o reglas activas.

Se solicitó al propietario comprobar visualmente en Console proyecto, Standard/Native, (default), us-east1, Spark y deny-all, sin compartir UID, credenciales o datos personales. **Al redactar este registro, esa confirmación visual está pendiente: la base real no se declara verificada.** No se crearon recursos, intentaron creaciones adicionales ni introdujeron documentos. La aprobación del propietario no se confunde con una confirmación de ejecución.

Una respuesta visual posterior debe indicar qué puntos comprobó y su procedencia: sería evidencia aportada por el propietario, no una verificación remota independiente de Codex. No versionar capturas, UID, facturas, cuentas o detalles personales. Si algún dato difiere, detener cualquier preparación de conexión y revisar el alcance; no recrear/migrar la base automáticamente.

## Compatibilidad revisada en código

| Área | Evidencia local y conclusión |
| --- | --- |
| Contrato y categorías | `functions/packages/inventory-contract/src/index.ts` exporta inventory-candidate-v1, esquema 2, siete IDs aprobados, exacto/simple y versión única. `ProductForm` usa Sin clasificar por defecto solo en el perfil consolidado. No requiere cambio de código para registrar esta aprobación. |
| Lector preparado | `inventory-candidate-reader.ts` utiliza los mismos validadores/conversores; páginas de 100 por ID, categoría y búsqueda por nombre/presentación. Rechaza documentos antiguos o malformados; no escribe ni recorre el diario. |
| Configuración futura | `inventory-read-configuration.ts` exige proyecto previsto, (default), contrato consolidado, origen local permitido y aprobación de lectura independiente de Auth. Rechaza mezclas con emuladores. No certifica reglas ni autoriza conexiones por sí misma. |
| Bloqueo real | `createPreparedInventoryRead` llama a `requireRealInventoryReadRelease()` antes de getApp/getAuth/initializeFirestore. El bloqueo sigue incondicional; main no importa esa factoría ni crea un lector Firestore en auth-test. |
| Authentication existente | `auth-test.ts` inicializa solo Auth y valida audiencia/emisor/sujeto; el controlador de sesión verifica el UID permitido y expiración, sin copiar tokens al estado React. No se reprobó el login real ni cambió proveedor/credenciales. |
| UID autorizado | El lector futuro recibe ownerUid de la misma configuración Auth privada y comprueba Auth.currentUser antes/después. El valor personal no se inspeccionó, imprimió o publicó; tampoco se comprobó aquí su correspondencia remota. La futura ACL debe configurarse administrativamente con ese UID real, nunca con LOCAL_AUTH_UID del laboratorio ni el correo. |
| Reglas iniciales | `security/auth-test.firestore.rules` conserva deny-all. Revisar este archivo no prueba que sus reglas sean las activas en Console. No se despliega. |
| Reglas futuras | `security/inventory-read.firestore.rules` permite únicamente get/list propios con Auth + UID de ruta + ACL válida/habilitada; list exige límite 1–100. Deniega escrituras, ACL, operaciones, subcolecciones y rutas imprevistas. La ACL real no existe como resultado de esta fase y no se aprovisiona. |
| Composición de UI | LocalInventoryPage ya acepta InventoryReadPort sin mutate y oculta controles de modificación. App/InventoryContext aún tipan el servicio como InventoryService con mutate; no basta asignar la factoría real a la composición existente. |
| Región | Firestore Lite selecciona proyecto/base, sin parámetro de región en el lector. La ubicación debe verificarse administrativamente. Los emuladores y Functions locales conservan us-central1; futuras Functions reales deberán usar la región aprobada tras autorización propia. |

La compatibilidad del contrato, lector y reglas se demuestra en local; no prueba IAM, reglas activas, índices, cuotas, latencia o acceso de la cuenta en el proyecto real.

## Cambios exactos para una fase posterior de lectura

Los puntos siguientes son preparación documentada, **no permiso ni implementación en 05C-4**:

1. Obtener confirmación de la base y autorización separada para publicar reglas personalizadas, aprovisionar ACL y conectar **solo lectura**. Verificar el artefacto de reglas activo y ausencia de allow adicionales; registrar evidencia sin datos personales. Mantener Spark. La aprobación del contrato no sustituye esas autorizaciones.
2. Solo tras ese permiso, publicar las reglas de lectura revisadas y configurar administrativamente `_access/inventory` con schemaVersion 1, enabled y el UID real de Auth aprobado. Comprobar coincidencia entre identidad Auth/configuración privada/ruta/ACL sin exponer el valor. Denegar clientes sobre ACL y todas las escrituras. Ningún UID enviado por React concede autorización.
3. Completar configuración local ignorada de lectura por proyecto/base/origen/contrato y autorización independiente. Preservar `.env.auth-test.local` y el modo Auth-only; no tratar la configuración web como credencial administrativa ni inicializar Admin en React. Las variables preparadas no retiran hoy el bloqueo.
4. Revisar y cambiar explícitamente `requireRealInventoryReadRelease` y la composición de `src/main.tsx` para crear el lector solo cuando estén cumplidas las condiciones autorizadas. Reutilizar la app Auth del mismo proyecto. Mantener demo sin Firebase, emuladores sin endpoints reales y auth-test sin inventario por defecto. No activar por detectar una variable o porque falle el emulador.
5. Ampliar los tipos de composición App/InventoryContext para aceptar de forma expresa InventoryReadPort, o añadir un ámbito de lectura equivalente sin inventar mutate mediante casts. Montarlo únicamente dentro del ámbito privado de sesión; limpiar al salir/cambiar identidad y liberar servicios al cerrar la aplicación, descartando respuestas tardías. El controlador de sesión y protección de rutas se reutilizan.
6. Mantener LocalInventoryPage sin creación/edición/ajustes cuando no haya puerto de escritura. Evitar que una configuración/lectura fallida caiga al inventario de demostración por un servicio undefined. Revisar los mensajes de SessionActions/LoginPage: hoy describen Auth-only o persistencia en el emulador; una futura lectura real debe identificar inventario consultado, vacío y datos demo separados sin insinuar guardados disponibles. Sin rediseño ni pantallas adicionales innecesarias.
7. Verificar consultas/índices reales autorizados, permisos positivos/negativos con identidades ya aprobadas, vacío, formatos inválidos, recarga, paginación, sesión vencida, revocación y red. Mantener ausencia de llamadas de escritura/Functions y regresión demo. Una base vacía debe verse vacía: no sembrarla ni importar fixtures para demostrar una lectura. Crear datos requeriría otro permiso específico.

Cloud Functions reales, compras y toda escritura quedan fuera. No adaptar el ejecutor de laboratorio quitando sus guards. La estrategia de migración desde 05C-1/04D continúa sin aprobar y sin ejecutar.

## Documentación actualizada

Registro del propietario, contrato consolidado, revisión del inventario, VISION, REQUISITOS y REGLAS_NEGOCIO reflejan el alcance aprobado. DECISIONS, FINAL_CONTRACT_PROPOSAL e INTEGRATION_PLAN identifican sus recomendaciones históricas y las partes sustituidas solo para inventario. FIRESTORE_READ_PREPARATION, FIREBASE_IMPLEMENTATION_GUIDE y README distinguen creación manual de habilitaciones futuras. Los informes de fases anteriores conservan su evidencia histórica.

No se modifican fuentes de React/servidor, reglas, scripts, configuración de ejecución, dependencias o lockfiles. `.env.auth-test.local`, outputs, capturas, logs y datos de emuladores continúan ignorados. La auditoría Git se realiza antes del commit; no publica identidades personales o secretos.

## Pruebas ejecutadas

Todas las suites siguientes se ejecutaron de nuevo en 05C-4, sin eliminar ni deshabilitar casos. No se presentan resultados históricos como ejecución actual.

| Comprobación | Resultado |
| --- | --- |
| TypeScript React + build | Correctos; npm run build ejecuta typecheck antes de Vite |
| TypeScript + build servidor/contrato | Correctos con Node 24 |
| Unitarias/componentes/configuración/adaptadores React | 168 correctas en 18 archivos |
| Unitarias servidor, incluidos contrato y regresiones | 26 correctas; el comando habitual reportó tres archivos, y una ejecución con detalle confirmó los 26 casos |
| Candidato con Auth/Firestore/Functions Emulator | 9 correctas |
| Playwright candidato consolidado | 14 correctas |
| Security Rules futuras en Firestore Emulator | 16 correctas |
| Lectores SDK con Auth/Firestore Emulator | 5 correctas |
| Regresión servidor 05C-1/05A con emuladores | 34 correctas |
| Playwright inventario histórico | 16 correctas |
| Playwright Authentication Emulator | 24 correctas |
| Reglas deny-all auth-test en emulador | 4 correctas |
| Playwright demo y regresión | 144 correctas; una omisión histórica de zoom real headless, sin nuevas omisiones |

Comandos: npm run build, npm test, npm run typecheck:server, npm run test:server, npm run test:inventory:candidate, npm run test:inventory:read, npm run test:inventory:emulator, npm run test:auth:emulator y npm run test:e2e. Para el detalle del servidor se ejecutó también Node 24 con --test --test-reporter=spec --test-isolation=none sobre los tres archivos originales del script, sin cambiar las pruebas. Las suites de emuladores compartidos se ejecutaron secuencialmente y cerraron sus procesos al finalizar.

Se preservan ensayos de 100/500/1.000 productos, conversiones/envases, fracciones, estados, duplicados humanos, saldos iniciales, concurrencia/idempotencia, documentos inválidos, compatibilidad de esquemas/categorías, rutas/sesiones y demo sin solicitudes externas. Playwright conserva teclado/foco, axe, responsive 360/390/430/768 px y texto al 200 %. No certifica dispositivos móviles nativos, uso presencial, IAM o reglas reales.

Revisión propia de documentación, trazabilidad de aprobaciones, código de integración y diff. Gemini se omitió: no hay cambio de código, contrato ejecutable o reglas; es una actualización documental de decisiones expresas con regresión íntegra. No se atribuye una revisión independiente no realizada.

## Pendientes y restricciones

DP-01, DP-02, DP-04, DP-05, DP-06, DP-09, DP-11, DP-12 y DP-13 no reciben aprobación automática. Permanecen pendientes máximos económicos/técnicos experimentales, migración y mapeos antiguos, adaptación a compras e historia financiera y cualquier ampliación del catálogo. Los parámetros de coincidencia se ajustan con pruebas sin cambiar las reglas funcionales aprobadas.

Sin Blaze, Functions/Hosting desplegados, reglas personalizadas publicadas, ACL real, datos de ejemplo, escrituras remotas, conexión de inventario real, OCR o compras financieras. La comprobación remota depende de la evidencia visual pendiente; no se declara terminada por revisar mocks/emuladores. No se inicia otra fase automáticamente.
