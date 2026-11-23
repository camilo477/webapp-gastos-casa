# Fase 05C-5 — Verificación y preparación final de lectura Firestore

Fecha: 23-11-2026. Base: `ac3dc8d626e064e8eb475b9ee7bd1dfbe308af1f`, rama `main`. Alcance: verificación disponible, auditoría y pruebas locales, procedimiento administrativo y preparación de activación futura. **Sin conexión del inventario real, publicación de reglas, ACL, escrituras, Blaze o despliegues.**

## Estado real y procedencia de la evidencia

| Configuración | Evidencia disponible en 05C-5 | Verificación independiente de Codex |
| --- | --- | --- |
| Proyecto mi-casa-camilo-test y base (default) | Propietario informa creación manual y capturas de Console | No |
| Spark | Confirmación visual del propietario en la instrucción inicial | No |
| Base vacía | Confirmación visual del propietario; no se sembraron datos | No |
| Reglas activas deny-all | Propietario confirma `allow read, write: if false` | No |
| Edición Standard | Confirmación visual posterior del propietario en Google Cloud Console | No |
| Modo Firestore Native | Confirmación visual posterior del propietario en Google Cloud Console | No |
| Región us-east1 (Carolina del Sur) | Aprobada en 05C-4 y ahora confirmada visualmente por el propietario | No |
| Backups programados deshabilitados | Confirmación visual posterior del propietario | No |
| Cifrado administrado por Google | Confirmación visual posterior del propietario | No |

La región ya no queda pendiente de confirmación visual: el propietario la aportó expresamente durante esta fase. Se distingue de una consulta administrativa desde este entorno. No se adjuntaron ni almacenaron capturas en el repositorio, ni se presentan como imágenes inspeccionadas directamente por Codex.

Se comprobó disponibilidad de herramientas sin mostrar identidades: gcloud no está instalado; una consulta local `firebase login:list` con salida capturada no aportó una cuenta administrativa utilizable/verificable. El primer intento no devolvió un resultado interpretable; se repitió fuera del sandbox y terminó sin obtener una lista de cuentas utilizable. No se imprimieron salidas privadas ni se inició login. No se usaron APIs de administración, service accounts, claves privadas, tokens descargados o credenciales personales para verificar el proyecto. Esto no prueba que no existan sesiones en otros navegadores/herramientas; solo limita esta comprobación.

El [procedimiento reproducible](architecture/FIRESTORE_READ_RELEASE_RUNBOOK.md) permite repetir la consulta visual de todos los valores y, si en otra sesión autorizada ya se dispone de gcloud, consultar solo name/locationId/type/databaseEdition. Esa consulta no certifica Spark, reglas activas o inventario vacío; deben comprobarse por separado. No se ejecutó aquí una consulta remota de metadatos o productos. Las referencias oficiales sirven para preparar el procedimiento, no como evidencia del proyecto privado.

## Seguridad actual y reglas preparadas

La seguridad activa real conocida es deny-all según evidencia del propietario. La aprobación de Auth o del contrato de inventario no concede lecturas. La configuración web no es credencial administrativa, y ocultar controles no autoriza datos.

Se revisó íntegramente `security/inventory-read.firestore.rules`, **sin modificar ni publicar su contenido**. Artefacto listo para revisión/publicación en una fase autorizada, validado solo en Emulator:

- Requiere Auth y UID del token igual a la ruta del producto y a la ACL válida/habilitada.
- La ACL exige schemaVersion=1, enabled=true, ownerUid string y ausencia de campos extra. Ausencia, campos faltantes, tipos incorrectos, deshabilitación o distinto UID deniegan acceso.
- Solo permite get/list de `users/{uid}/products/{productId}`; list exige límite positivo hasta 100.
- Ninguna escritura directa está permitida, ni create/update/delete, lotes o transacciones.
- ACL, historia/operaciones financieras, colecciones raíz, subcolecciones y rutas desconocidas permanecen cerradas. Claims admin/email/ownerUid suministrados por un cliente no sustituyen la política.
- Console/IAM/Admin omiten las reglas de cliente: su acceso debe protegerse y no se valida con identidades ficticias. No hay un permiso general de escritura para el propietario.

SHA-256 del archivo local auditado: `9d2f541808f6135562f715f7b55f08bac859d70467ef56bfa97cd9c02119e37b`. Es una referencia pública de contenido, **no una certificación de reglas activas**. No se confunde con las reglas de laboratorio ni el esqueleto histórico de SECURITY. No se creó configuración de despliegue real.

## Compatibilidad del lector y preparación de React

Se conserva `inventory-candidate-v1`, schemaVersion=2, aprobado para inventario en DP-03/07/08/10. El mismo paquete compartido valida metadatos/stock, unidades y categorías en frontend y ejecutor local. No se cambian contrato, máximos experimentales o políticas pendientes.

`createCandidateReader` recibe Auth/Firestore de la misma app; comprueba UID antes/después y descarta respuestas de otra identidad o tras dispose. Usa el conversor de esquema 2, las siete categorías aprobadas, exactos con milésimas y aproximados con solo estado. Lee páginas de 100 por ID/cursor, categoría y búsqueda por nombre/presentación; no consulta operaciones ni añade mutate. Vacío es vacío, sin seed ficticio. El SDK y la traducción de errores gestionan permisos/unauthenticated/red; las pruebas de sesión existentes verifican vencimiento/restauración y rutas privadas.

`createPreparedInventoryRead` reutilizaría Auth real, pero sigue llamando al bloqueo incondicional `requireRealInventoryReadRelease` **antes de obtener SDK**. La configuración exige proyecto/base/origen/contrato y aprobación independiente de lectura; ni variables completas ni flags de prueba desbloquean el código. `main.tsx` no importa esa factoría y auth-test permanece Auth-only. No se modifican SessionContext, Authentication, UI, modelos, reglas, scripts o dependencias.

Preparación concreta para otra fase, documentada sin implementarla:

| Archivo/capa | Cambio futuro necesario, tras autorización |
| --- | --- |
| inventory-read-configuration / factoría preparada | Revisar la retirada explícita del bloqueo solo después de verificar reglas activas y ACL; conservar validaciones y aprobación independiente. |
| main.tsx | Selección explícita de lectura, reutilizando app Auth; Auth-only por defecto y cero fallback entre demo/emulador/real. No tocar los puertos locales para apuntarlos al proyecto real. |
| App / InventoryContext | Aceptar InventoryReadPort expresamente o usar un ámbito de lectura equivalente, sin casts ni mutate ficticia. Montar dentro de sesión privada y limpiar/liberar de forma comprobada. |
| InventoryPage / LocalInventoryPage | Componer la variante de solo lectura existente; evitar que error/configuración ausente se interpreten como permiso para mostrar demo. Conservar carga, vacío, permisos y sesión vencida. |
| LoginPage / SessionActions | Ajustar los mensajes Auth-only/emulador para identificar lectura real autorizada, sin insinuar que puede guardar ni presentar ejemplos como inventario de la cuenta. Mantener diseño. |
| Pruebas de activación | Demostrar base vacía o datos compatibles, consultas/índices/permisos/sesiones/red y ausencia de escrituras/Functions, con cuentas aprobadas. No crear datos o usuarios para suplir un caso sin permiso. |

La compatibilidad local no demuestra índices reales, IAM, latencia, cuota o presupuesto. No se habilita Cloud Functions real ni se aprueba la adaptación financiera.

## Procedimiento para publicar reglas y configurar ACL posteriormente

El [runbook](architecture/FIRESTORE_READ_RELEASE_RUNBOOK.md) contiene los pasos exactos y las fuentes oficiales revisadas. Secuencia condicionada, **no ejecutada**:

1. Obtener autorización separada para reglas, ACL y lectura; verificar proyecto, base, región, plan y commit/artefacto que se publicaría. No crear otra base.
2. Publicar manualmente solo las reglas aprobadas para (default), comparando toda la fuente y comprobando publicación/propagación. Mantener React bloqueado y sin ACL todavía; el acceso de productos permanece denegado.
3. Con autorización de escritura administrativa, consultar el UID de la cuenta Auth previamente aprobada y compararlo privadamente con la configuración existente. Sin usar correo, UID de emulador, nueva cuenta o identidad recibida de React.
4. Crear `_access/inventory` únicamente si no existe y tras revisar el destino: schemaVersion number entero 1, enabled boolean true y ownerUid string con ese UID consultado. El valor personal solo se introduce en Console; no figura en ejemplos, reglas o Git. No sobreescribir una ACL existente automáticamente. No abrir reglas para permitir su creación desde React.
5. Reconsultar configuración y ACL, verificar permisos con herramientas/identidades expresamente autorizadas y revisar el cambio de React antes de retirar el bloqueo. Sin contenido, mostrar inventario vacío; la creación de ACL no autoriza sembrar productos.

No se creó el documento. La base vacía descrita por el propietario corresponde al estado actual; una futura ACL haría que la base tuviera un documento administrativo aunque su inventario siguiera vacío.

## Pruebas de esta fase

Todas las comprobaciones siguientes se ejecutaron en esta fase, sin eliminar ni deshabilitar pruebas anteriores:

| Suite | Resultado |
| --- | --- |
| TypeScript React y build Vite | Correctos; npm run build incluye typecheck |
| TypeScript/build servidor y contrato compartido | Correctos con Node 24 |
| Unitarias/componentes/configuración/adaptadores React | 172 correctas en 18 archivos; cuatro casos nuevos del lector |
| Unitarias servidor/contrato | 26 correctas; detalle confirmado además del reporte habitual por tres archivos |
| Reglas futuras con Firestore Emulator | 23 correctas, incluidas las 16 anteriores y siete casos adicionales |
| Lectores con SDK Auth/Firestore Emulator | 5 correctas |
| Contrato consolidado con Auth/Firestore/Functions Emulator | 9 correctas |
| Playwright contrato consolidado | 14 correctas |
| Regresión servidor 05C-1/05A con emuladores | 34 correctas |
| Playwright inventario histórico | 16 correctas |
| Playwright Authentication Emulator | 24 correctas |
| Reglas auth-test deny-all con emulador | 4 correctas |
| Playwright demo/regresión | 144 correctas; una omisión histórica de zoom real headless, sin nuevas omisiones |

Comandos: npm run build, npm test, npm run typecheck:server, npm run test:server, npm run test:inventory:read, npm run test:inventory:candidate, npm run test:inventory:emulator, npm run test:auth:emulator y npm run test:e2e. También se ejecutaron los tres archivos del servidor con Node --test --test-reporter=spec --test-isolation=none para obtener los 26 casos individuales. Las suites de emuladores se ejecutaron secuencialmente sobre el proyecto demo/loopback y se detuvieron al terminar.

Los nuevos ataques comprueban consultas acotadas a finanzas/ACL/colecciones raíz/subcolecciones, actualizaciones SDK, lotes y transacciones rechazados sin efectos parciales, ACL con campos faltantes/tipos inválidos y cambio administrativo de UID sin acceso a rutas ajenas. Se verifican tanto get como list ante ACL inválida. No se modificó la regla para facilitar las pruebas.

Los casos nuevos del lector verifican las siete categorías y cantidades exactas fraccionarias, inventario vacío/ID ausente sin seed ni mutate, errores de permisos/sesión/red sin exponer mensajes internos y cancelación de respuestas al liberar el servicio. Se conservan pruebas de estado aproximado sin cantidad, cambio de identidad, compatibilidad y lectura paginada. El bloqueo real se prueba incluso con configuración ficticia completa y flags de aprobación: no obtiene getApp/getAuth/initializeFirestore.

Las regresiones conservan 100/500/1.000 productos, apertura sin gasto, conversiones/envases, duplicados, concurrencia/idempotencia, recarga, rutas privadas, teclado/foco, axe, 360/390/430/768 px y texto al 200 %. Demo no contacta Firebase ni persiste datos financieros; la aplicación no incorpora ninguna nueva ruta de conexión y main/factoría/guards conservan su contenido. No se ensayó login real de nuevo, ni lectura/índices/consultas de Firestore real, dispositivos nativos o lector de pantalla.

Se intentó una revisión Gemini CLI en un directorio aislado con solo reglas/lector/pruebas públicos copiados como contexto, sin archivos locales privados. No pudo ejecutarse por falta de autenticación disponible en ese entorno; además, la carpeta no confiable no mantuvo su modo de planificación. No hubo revisión efectiva ni uso de herramientas de modificación; no se cambiaron confianza/credenciales ni se reintentó. Se completó revisión propia del código, pruebas y diff.

## Documentación, riesgos y límites

Se crea este informe y el runbook; se actualizan SECURITY, FIRESTORE_READ_PREPARATION, FIREBASE_IMPLEMENTATION_GUIDE, OWNER_DECISION_REVIEW y README para reflejar la evidencia nueva y preservar antecedentes históricos. Los únicos cambios de código son pruebas: se amplían ataques de reglas y comprobaciones del lector, sin modificar la política ni la aplicación.

Persisten ausencia de verificación administrativa independiente, cuotas/costos y protección de abuso, índices/latencia reales, gestión IAM y pruebas nativas con la usuaria. La evidencia visual describe lo observado por el propietario; no garantiza que la configuración no cambie después. Las reglas deben verificarse de nuevo al activarlas. No hay garantía de eliminación de datos ya leídos por revocar acceso.

Límites técnicos/económicos, migración y adaptación financiera siguen sujetos a revisión. DP-01/02/04/05/06/09/11/12/13 no reciben nueva aprobación. No hay Blaze, bases adicionales, reglas/ACL reales nuevas, datos reales, conexión de inventario, escrituras, Functions/Hosting, OCR o compras financieras. El alcance termina en 05C-5.
