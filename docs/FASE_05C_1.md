# Fase 05C-1 — Inventario React con emuladores locales

Fecha: 23-11-2026, America/Bogota. Alcance exclusivo: inventario ficticio local mediante Authentication, Firestore y Functions Emulator. Base: `eb6258c3c44e0af42e8e39205ea50c72cd45253c`. No habilita recursos reales ni una fase posterior. Las decisiones DP conservan sus aspectos pendientes.

## Implementación y arquitectura

- `src/application/inventory.ts`: puerto independiente del SDK, comandos no financieros, categorías experimentales y errores comprensibles.
- `src/adapters/firebase/inventory.ts`: adaptador exclusivamente emulador, con guards antes de obtener la app, comprobación de proyecto/Auth local, Firestore Lite y callable local. Nunca usa la app de auth-test o la app por defecto.
- `src/state/InventoryContext.tsx`: servicio y estado de guardado separados del dominio demo; el ámbito se desmonta junto con el estado privado al cambiar de sesión/identidad. Generaciones de lectura descartan resultados tardíos. No hay listeners Firestore ni caché persistente que liberar; HMR termina el cliente antes de eliminar Auth.
- `src/features/inventory/LocalInventoryPage.tsx`: variante del mismo inventario para datos locales, con búsqueda, filtro, carga, vacío, error, reintento y continuación. Reutiliza filas y formularios existentes, sin nuevas rutas ni rediseño.
- `useInventorySave`: espera acuse, bloquea doble envío y congela la intención después de un resultado incierto. Reintentar conserva exactamente el ID/contenido, sin anunciar éxito optimista.
- `functions/src/application/inventory.ts`: ejecutor sobre el repositorio transaccional 05A. `mutateInventoryExperimental` recibe identidad verificada desde `req.auth`; no acepta UID del cuerpo. El punto de entrada continúa exigiendo proyecto demo y todos los emuladores locales antes de inicializar Admin.

Cada producto es un documento independiente en `users/{uid}/products/{id}`, con nombre, categoría, control, base, cantidad/estado, versión y timestamp del servidor. Las operaciones idempotentes comparten `users/{uid}/operations/{operationId}` con los laboratorios previos: hash SHA-256 de intención canónica, fecha, producto y movimientos no financieros. La interfaz no lee ese historial para construir el catálogo.

### Comandos

| Comando | Efecto autorizado |
| --- | --- |
| `inventoryCreate` | ID estable reservado, metadatos y existencia inicial explícita. Versión 0. Un movimiento de apertura, sin gasto ni total pagado. El mismo ID de operación/intención no crea otra apertura |
| `inventoryEdit` | Solo nombre y categoría, con versión esperada. Conserva unidad, control y existencia; no recategoriza operaciones históricas |
| `inventoryAdjust` | Añadir, consumir, establecer cantidad o establecer estado sencillo observado. Valida cantidad final y versión; no genera gasto |

Validación de campos exactos y tamaño de solicitud ≤8 KiB; números enteros escalados ×1.000, máximo 1.000.000.000, unidades contables enteras, bases unidad/kg/L. No se admiten saldos negativos, modo/base nuevos en edición ni cantidades numéricas para productos sencillos. Categorías locales del contrato 04C: food/cleaning/service (Alimentos/Limpieza/Servicios); demo conserva su catálogo anterior. Estos límites y categorías son **supuestos experimentales**, no aprobación de DP-03/08.

La transacción lee primero operación y producto, valida y escribe producto + diario atómicamente. Un hash diferente con el mismo ID se rechaza; el reenvío idéntico confirmado devuelve `already-confirmed` sin nuevas escrituras. Una versión obsoleta se rechaza en todas las modificaciones, incluidas sumas/restas: dos pestañas no pierden cambios silenciosamente. La segunda debe refrescar, revisar el nuevo saldo y formular un ajuste nuevo. No se rebasan automáticamente ajustes absolutos.

### Lectura y experiencia

Consulta autorizada de hasta 100 productos por lote, orden estable por ID y cursor; categoría filtrada en servidor. Búsqueda por fragmento sin distinguir acentos sobre cada lote. Si no hay coincidencias pero queda cursor, se informa que la búsqueda continúa, sin presentar un catálogo parcial como completo. No se almacena una proyección de búsqueda nueva ni se añade un servicio externo. Puede recorrer N productos; se documenta como límite local. Las páginas no prometen un snapshot global atómico bajo concurrencia.

Se refresca al entrar, confirmar, recuperar foco sin editor abierto o solicitar Actualizar productos. Se conserva la copia/version con la que se abrió el formulario para detectar conflictos. El aviso de laboratorio identifica los datos ficticios y la persistencia local; la interfaz solo anuncia guardado después del acuse confiable. Los datos visibles tras un error de actualización pueden corresponder a la última carga confirmada, nunca a un cambio optimista.

## Separación y seguridad

| Modo | Identidad | Inventario | Compras/gastos/lista/Inicio |
| --- | --- | --- | --- |
| Demo | Sin cuenta ni SDK inicializado | Semilla ficticia, memoria React | Ejemplos anteriores en memoria |
| Emulador | Auth Emulator, único UID ficticio autorizado | Firestore Emulator; cambios solo Functions Emulator | Ejemplos independientes en memoria; no modifican el inventario local |
| auth-test | Authentication real previamente aprobado | Ejemplos en memoria; no se importa adaptador de datos | Ejemplos en memoria |
| Producción/staging | Bloqueados | Bloqueados | Sin integración remota |

Las reglas conservan **todas** las escrituras cliente denegadas. Solo el propietario local puede leer sus productos/operaciones. Admin permanece exclusivamente en servidor y preparación de fixtures. El servidor es la autoridad de identidad, validación, versión y cálculo; ocultar controles en React no es seguridad. No se añade registro público; sigue siendo posible crear usuarios mediante la API Auth Emulator, pero esos UID no autorizados no obtienen acceso a datos ni funciones. El correo no sustituye al UID.

Firestore Lite usa consultas al servidor, sin offline persistence, cola de escrituras ni listeners; errores de permiso/autenticación invalidan la sesión local. Los formularios no guardan contraseñas, tokens ni datos de inventario en almacenamiento del navegador. La persistencia oficial de Auth permanece como en 05B. Se conserva la protección inicial de rutas sin mostrar datos privados antes de verificar identidad.

`.env.auth-test.local` no fue leído, modificado ni preparado para Git en esta fase; `git check-ignore` confirma su exclusión. Se detuvo el servidor auth-test dejado en la fase anterior para liberar 5175 y ejecutar pruebas negativas sin conexiones reales. No hubo accesos nuevos al proyecto real, Firestore real, Blaze, Hosting, Functions desplegadas, OCR, ubicaciones o datos financieros reales.

## Persistencia y resultados inciertos

Los cambios confirmados se recuperan desde Firestore local al navegar, recargar, cerrar/reabrir la pestaña y salir/volver a ingresar con la misma cuenta ficticia. Logout y sustitución de identidad desmontan estados/formularios privados; respuestas de lecturas anteriores no rellenan la interfaz siguiente.

Esto solo se promete **mientras el emulador y sus datos estén disponibles**. Las suites arrancan limpias y descartan fixtures al detener los emuladores. No hay exportación/importación automática ni persistencia de producción.

Los intentos pendientes viven en RAM. Reintentar una respuesta perdida usa la misma intención/ID y no duplica el cambio. Se advierte al navegar o recargar con un guardado pendiente, pero cerrar pestaña o sesión pierde la referencia. No se promete cancelación de un envío; revisar el inventario antes de crear otra operación. No se implementan borradores financieros durables ni la política DP-06 propuesta.

## Verificación

Resultados ejecutados, no pruebas de producción:

| Comprobación | Resultado |
| --- | --- |
| TypeScript y build frontend | Correctos; build por defecto demo |
| TypeScript/build servidor Node 24 | Correctos |
| Vitest, dominio/componentes/auth/configuración/inventario | 142 pruebas, 12 archivos, correctas |
| Servidor unitario | 15 correctas: 10 anteriores + 5 inventario |
| Laboratorio local 05A ampliado | 34 correctas: 30 anteriores + 4 inventario con Auth/Firestore/Functions reales del emulador |
| Playwright demo | 144 correctas y una omisión histórica de zoom real headless, sin nuevas omisiones |
| Playwright Auth Emulator | 24 correctas |
| Reglas de frontera auth-test (local, deny-all) | 4 correctas |
| Contrato histórico 04C unitario | 10 correctas |
| Laboratorio histórico 04C completo | Intentado; bloqueado por puerto 9199 ocupado por un emulador de otro proyecto. No se detuvo ni modificó ese servicio; no se declara esta ejecución aprobada |
| Playwright inventario | 16 correctas, incluidas limpieza entre cuentas, expiración y respuestas tardías tras logout |

Inventario comprobado: apertura no nula sin gasto; creación concurrente idéntica una sola vez; login UID ficticio; navegación/recarga/pestaña reabierta/logout-login; edición, búsqueda y categorías; suma/consumo/corrección, negativos rechazados y estado sencillo; dos pestañas con versión obsoleta; HTTP 200 realmente confirmado cuya respuesta se descarta y reintenta sin duplicar; conexión Firestore rechazada sin fallback; demo sin SDK/red Firebase; paginación y búsqueda con 100/500/1.000 documentos. Accesibilidad: teclado, foco, axe y ausencia de desbordamiento a 360/390/430/768 px con texto 100/200 %. No equivale a validación nativa Android/iOS, zoom real, lector de pantalla o prueba con la usuaria.

### Problemas encontrados y resueltos

- El sandbox impide abrir sockets locales (EPERM). Las suites de emuladores/Playwright se ejecutaron con permiso fuera de esa restricción, manteniendo endpoints loopback.
- Las pruebas antiguas de custom token creaban el UID sin correo y el seed posterior rechazaba la identidad del fixture. Se corrigió el orden de preparación; se mantuvo la comprobación de identidad y todas las pruebas anteriores.
- Al simular fallo de red, WebChannel del SDK Firestore completo intentó consultar una imagen de diagnóstico externa. La prueba bloqueó el intento y falló. Se reemplazó por Firestore Lite oficial; la misma prueba pasó sin relajar el bloqueo externo.
- Se ajustó el guard de la suite Auth para permitir lecturas locales de productos, conservando la prohibición de escrituras directas y callables financieros. No se eliminó ni omitió ningún caso anterior.

Gemini CLI se intentó como revisor de solo lectura; devolvió errores 503 hasta el límite de tiempo. No completó una revisión; se aplicaron revisión propia y pruebas efectivas. No se le proporcionaron archivos locales privados ni credenciales.

## Límites y decisiones pendientes

Sin inventario productivo, despliegue, índices/cuotas/costos/IAM/App Check certificados, funcionamiento offline ni búsqueda remota eficiente. No se ensayó otra vez Authentication real ni Google real. Se conserva el adaptador real previo, limitado a Auth, sin modificar proveedor ni configuración.

Continúan pendientes los aspectos no aprobados de DP-01 a DP-13, especialmente escala/aperturas definitivas, categorías, unicidad/fusión por nombre, retención de intentos y futuros contratos financieros/rectificaciones. No se implementaron las propuestas 04D financieras. Cualquier integración real o fase siguiente requiere autorización expresa.

Los cambios se limitan a adaptador/puerto/contexto de inventario, formularios y avisos compartidos, composición emulator en App/main, ejecutor y callable local, pruebas y documentación. No hay nuevas dependencias ni cambios de lockfiles, reglas abiertas, semilla React enviada al servidor ni archivo privado preparado para publicar.
