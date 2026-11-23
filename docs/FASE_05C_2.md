# Fase 05C-2 — Preparación segura de lectura Firestore

Fecha: 23-11-2026. Base: `d20bbd2a88c86890e3b0c1ddddcf2464eb9d9f5b`, rama `main`. **Preparación implementada y validada localmente; conexión Firestore real no habilitada ni probada.** No se creó la base, desplegaron reglas/Functions/Hosting, activó Blaze, realizaron escrituras reales o iniciaron fases posteriores.

## Arquitectura preparada

Se conserva 05C-1. Demo funciona en memoria sin solicitudes Firebase; emulador mantiene Auth/Firestore/Functions locales; auth-test mantiene exclusivamente su Authentication real previamente autorizado y datos de ejemplo en memoria. `main.tsx`, rutas, estilos, autenticación real y `SessionContext` no cambian. No se conectan ni migran datos de demostración o de emuladores al proyecto real.

- `src/application/inventory-read.ts`: puerto de lectura con páginas, producto por ID y liberación, **sin mutate**. Errores separados de acceso, conexión, consulta y contrato.
- `src/application/inventory-product.ts`: decodificador estricto compartido del documento plano 05C-1. Mantiene IDs, categorías/unidades, cantidades, versión y timestamp. Se corrigió la aceptación accidental por coerción de arrays como unidades/categorías/estados; ahora exige strings y método de timestamp válido, con regresión. No incorpora el esquema 04D ni categorías nuevas sin aprobación.
- `src/application/inventory-read-configuration.ts`: preparación offline, proyecto previsto explícito, base `(default)`, contrato `experimental-05c1`, aprobación distinta de Auth y rechazo de configuración mezclada. Obtiene el UID desde la configuración Auth privada recibida, sin publicarlo ni duplicarlo en ejemplos.
- `src/adapters/firebase/inventory-reader.ts`: adaptador Firestore Lite sobre una conexión SDK ya configurada/inyectada. Lee únicamente productos propios, lotes de 100 por ID, filtro de categoría, búsqueda por fragmento en cada lote y producto por ID. Verifica `Auth.currentUser` antes/después; descarta resultado de otra sesión incluso si vuelve a entrar el mismo UID. No inicializa apps, extrae tokens, cambia Auth, escribe, importa Functions/Admin o guarda productos en el navegador. Terminarlo impide entregar resultados pendientes.
- `src/adapters/firebase/inventory-read-test.ts`: factoría futura que reutilizaría la app Auth del mismo proyecto, pero llama a **`requireRealInventoryReadRelease()`**, que siempre falla antes de obtener/inicializar servicios SDK en 05C-2. No está importada por main ni conectada a rutas/contextos actuales. No existe flag de pruebas o `.env` que retire el bloqueo.

La vista existente `LocalInventoryPage` acepta también el puerto de lectura: conserva filtros, filas, carga, vacío y errores, sin acciones de crear/editar/ajustar cuando no existe capacidad de modificación. En esa variante retira los productos ante un error de lectura, incluidos permisos revocados. Las filas existentes admiten omitir acciones sin cambiar su presentación en demo/emulador. No hay pantalla ni ruta nueva. Esta capacidad preparada solo se monta con mocks en pruebas; ninguna ruta actual la usa con un lector real. Para una activación posterior se requiere composición explícita dentro del ámbito privado de sesión. No puede sustituirse el puerto local por uno real fingiendo capacidad de modificación. Las escrituras reales continúan dependiendo de un ejecutor confiable aprobado y desplegado posteriormente.

### Consultas y compatibilidad

Las páginas usan cursor estable por ID, igualdad de categoría cuando corresponde y límite 100. La búsqueda filtra cada lote de productos, sin cargar operaciones ni sustituir el resultado vacío por semilla demo. Si una página sin coincidencias tiene continuación, conserva el cursor; no presenta una búsqueda incompleta como ausencia definitiva. Puede recorrer N documentos y no ofrece un snapshot global atómico entre páginas. Las consultas puntuales Lite son al servidor, sin caché offline ni listeners.

El formato aceptado es el **experimental 05C-1**, no una aprobación de producción: categorías food/cleaning/service, cantidades escaladas, versión inicial 0 y documento plano. Las siete categorías sugeridas, presentación y estructura anidada/versiones separadas de 04D son propuestas diferentes: el lector rechaza documentos incompatibles en vez de reinterpretarlos silenciosamente. Es necesaria una revisión de contrato aprobada antes de cargar datos reales; no se ejecutan migraciones.

## Reglas y configuración administrativa

Nuevo artefacto: `security/inventory-read.firestore.rules`, **no desplegado**. `security/auth-test.firestore.rules` conserva deny-all; `functions/firestore.rules` conserva la seguridad del laboratorio. No se añaden reglas permisivas temporales ni configuración/comando de despliegue real.

Las reglas candidatas exigen Auth y que el UID del token coincida con la ruta y con una ACL administrativa `_access/inventory`: `schemaVersion=1`, `enabled=true`, `ownerUid` string. Solo admiten productos propios, get y list con límite 1–100. No permiten escrituras, lectura/modificación de ACL, datos de otros UID, historial financiero, subcolecciones, consultas globales o rutas imprevistas. ACL ausente, inválida o deshabilitada deniega; los controles de Auth/ruta se evalúan antes de consultar la ACL.

Un administrador IAM autorizado configuraría el UID real dentro de la base, sin incluirlo en reglas/repositorio. Esa provisión es una **escritura administrativa futura, todavía no autorizada ni realizada**. Console/Admin puede omitir las reglas; proteger ese acceso y futuras Functions también es imprescindible. El correo, claims suministrados por un cliente y ocultar botones no conceden autorización.

Las pruebas de reglas usan únicamente identidades ficticias locales. Authentication Emulator permite simular identidades; esto valida la política, no la criptografía, IAM, App Check o despliegue de un proyecto real. Ver reglas en Git, completar una variable de aprobación o proporcionar un booleano «rules verified» no demuestra que estén activas en Firebase.

## Contratos y decisiones pendientes

La [propuesta concreta de inventario](architecture/INVENTORY_CONTRACT_REVIEW.md) mantiene pendientes:

- **DP-03:** unidad/kg/L, g/ml mediante conversión explícita; enteros para unidades, milésimas kg/L, rechazo de residuos/subgramos no representables, aperturas sin gasto, no negativos y cambios de base/control restringidos. Estados Hay suficiente/Queda poco/Agotado observados, sin umbrales automáticos.
- **DP-07:** contrato definitivo, arquitectura confiable futura, región, edición, cuota, residencia y presupuesto; una autorización de lectura no permite Blaze ni Functions reales.
- **DP-08:** Alimentos, Aseo del hogar, Higiene personal, Farmacia, Mascotas, Otros y Sin clasificar, con IDs candidatos. Confirmar catálogo, defaults y administración; elegir entre ID explícito o null para Sin clasificar antes de revisar 04D.
- **DP-10:** IDs estables, sugerencias por nombre/presentación y confirmación humana de coincidencias dudosas; ninguna fusión automática. Confirmar presentación y criterio de advertencia.

No se aprueba unilateralmente ninguna DP ni se modifica el comportamiento válido del catálogo demo/local. También siguen pendientes los aspectos no aprobados de las demás decisiones, incluyendo privacidad durable y futuros contratos financieros.

## Preparación del entorno real

La [guía manual del propietario](architecture/FIRESTORE_READ_PREPARATION.md) propone **Standard edition / Native mode**, `(default)` y región **`us-east1`**, todavía para aprobación. Explica alternativas en Santiago/São Paulo/Querétaro/Iowa, compatibilidad con futuras Functions, ubicación irreversible, cuotas Spark, consumo de reglas/consultas, índices y condiciones de seguridad.

La región recomendada es una decisión de ingeniería, **no un benchmark desde Colombia**; la estimación de orden de cientos de milisegundos está identificada como hipótesis. No se crearon recursos para medir latencia ni se certifican tarifas futuras. Spark admite cuotas limitadas; agotar cuota puede suspender el servicio. Las lecturas de la ACL consumen cuota adicional cuando se evalúan; buscar por fragmento puede recorrer el catálogo completo. La guía enlaza las fuentes oficiales revisadas, sin prometer costo cero ilimitado.

Antes de conectar faltan: aprobación de edición/región/contrato, autorización específica para crear la base, publicar reglas y aprovisionar ACL, verificación administrativa de reglas **activas**/UID/base, autorización expresa de lectura y una modificación posterior revisada para retirar el bloqueo e integrar la vista de lectura. Mantener Spark; no añadir credenciales administrativas al frontend, nuevos usuarios/proveedores o contenido financiero real.

`.env.example` solo documenta variables ficticias/comentadas; `.env.auth-test.local` sigue ignorado. No se inspeccionó ni mostró su contenido ni se modificó en esta fase. No se publican UID real, tokens, credenciales, exportaciones, builds, capturas o logs. `.gitignore` existente ya cubre esos artefactos y no necesitó excepciones nuevas.

## Pruebas ejecutadas

| Comprobación | Resultado |
| --- | --- |
| TypeScript raíz y build React | Correctos; build demo, adaptador futuro fuera del arranque |
| TypeScript/build paquete servidor Node 24 | Correctos |
| Unitarias/componentes/configuración/adaptadores | 157 correctas en 15 archivos, incluidas las 142 anteriores y la variante preparada de vista de solo lectura |
| Unitarias servidor | 15 correctas, sin eliminar casos anteriores |
| Reglas candidatas, Firestore Emulator | 16 correctas: owner, anónimo/otro UID, claims falsos, límites, rutas, escrituras y ACL ausente/inválida/revocada |
| Adaptador con SDK Auth/Firestore Emulator | 3 correctas: 205 productos paginados, categoría/búsqueda/ID, logout-login y cliente nuevo, contrato incompatible y revocación |
| Suite 05C-1 Auth/Firestore/Functions Emulator | 34 correctas, incluidas las 30 previas 05A |
| Playwright inventario 05C-1 | 16 correctas, sin cambios de expectativas |
| Playwright Authentication Emulator | 24 correctas |
| Reglas deny-all auth-test existentes | 4 correctas |
| Playwright demostración/regresión | 144 correctas; una omisión histórica de zoom real headless, sin nuevas omisiones |

Mocks comprueban bloqueo de la factoría antes de SDK incluso con aprobación/flags completos, aislamiento de proyecto/origen/identidad, permisos/red sin payload interno, formato inválido, continuación de búsquedas sin coincidencias, ausencia de mutate, cancelación lógica de lecturas tardías y liberación. No se declaran pruebas reales de Firestore/Google o proveedor distinto.

Se mantienen pruebas de ausencia de solicitudes Firebase en demo, recarga y aislamiento entre entornos. Los recorridos existentes comprueban teclado, foco, axe, ausencia de desbordamientos a 360/390/430/768 px y texto 100/200 %. No equivale a ensayos nativos Android/iOS/lector de pantalla ni validación presencial con la usuaria.

Comandos: `npm run typecheck`, `npm run build`, `npm test`, `npm run typecheck:server`, `npm run test:server`, `npm run test:inventory:read`, `npm run test:inventory:emulator`, `npm run test:auth:emulator`, `npm run test:e2e`. Las suites de emuladores se ejecutan separadamente porque comparten puertos; cada una carga solo sus reglas locales y descarta datos al terminar. Los sockets/procesos requieren el permiso del entorno fuera del sandbox; todos los servicios siguen en loopback.

### Revisión y límites de verificación

Se revisaron diff, archivos y límites de confianza. Gemini CLI se intentó como revisor de solo lectura, sin archivos privados, pero no completó la revisión en el límite de 50 segundos. Se continuó con revisión propia y pruebas; no se presenta como revisión efectiva de Gemini. No se reintentó una herramienta que ya estaba tardando sin resultado.

No hay evidencia de reglas activas, índices, permisos IAM, consumos/factura o latencia de Firestore real. El código mantiene esa integración cerrada. No se modificó el ejecutor de inventario local ni la lógica de compras/gastos. No se añadieron dependencias o cambios a lockfiles. El alcance termina en 05C-2; cualquier conexión, escritura, recurso o fase posterior requiere autorización expresa.
