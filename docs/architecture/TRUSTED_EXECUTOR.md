# Ejecutor confiable — Arquitectura experimental 04C

Fecha: 22-11-2026, America/Bogota. **Viabilidad local demostrada para los escenarios ejecutados; arquitectura candidata recomendada, todavía no aprobada para producción.** No hay proyecto real, Blaze, despliegue o frontend conectado. DP-01 a DP-13 siguen pendientes.

## Frontera de confianza y modelo

Flujo ensayado: cliente de laboratorio → Authentication Emulator → callable de Cloud Functions Emulator → Firestore Emulator. React permanece en memoria. El callable recibe `req.auth` verificado por el framework, exige el UID ficticio autorizado y deriva de él todas las rutas. El cuerpo no admite UID, roles, resultado de validación, movimientos ni importes netos calculados por el cliente.

| Ruta | Contenido y responsabilidad |
| --- | --- |
| `users/{uid}/products/{productId}` | Producto independiente: nombre, categoría, modo/unidad, `quantityMilli` o `status`, `version`, `updatedAt`. Metadatos y existencia en un documento, sin un catálogo agregado |
| `users/{uid}/operations/{operationId}`, `kind=purchase` | **Compra financiera canónica**: fecha, comercio, todas las líneas revisadas con netos calculados, movimientos embebidos, `productIds`, total, hash SHA-256 de intención y timestamp. Este documento es a la vez compra y registro de operación |
| Misma colección, `kind=stockAdjust` | Ajuste explícito con versión esperada y movimiento; sin total financiero ni gasto nuevo |

No hay documentos individuales de líneas/movimientos porque los ensayados caben holgadamente dentro de la compra. No existen colecciones duplicadas `purchases` + `expenses`. El historial de precios se consulta desde compras por `kind`, `productIds array-contains` y fecha; la prueba obtuvo dos precios y el gasto canónico de esas dos compras. Se prepara el índice compuesto y exenciones de `lines`/`movements`; el emulador no certifica el índice de producción.

## Validación y confirmación

El contrato exige campos exactos, tipos, IDs acotados, líneas únicas y fecha válida de calendario. Rechaza fotos/OCR y campos extra por lista permitida. El dinero usa enteros COP con cálculo `BigInt`; el servidor aplica el redondeo provisional por línea y descuentos individuales. `reviewedTotalCOP` expresa lo revisado, pero **no es autoridad contable**: debe ser idéntico al total recalculado. El pagado persistido lo genera el servidor.

Para cada producto físico se validan existencia o reserva nueva, identidad/categoría/modo/unidad contra los datos actuales y conversión explícita. Se generan exactamente un movimiento por línea física y ninguno por servicio. Las repeticiones conservan todas sus líneas, encadenan los movimientos y acumulan el saldo; cada producto distinto se escribe solo una vez. El modo sencillo conserva un estado, sin saldo ficticio. Las definiciones repetidas de un producto nuevo deben coincidir.

Los límites provisionales y aperturas sintéticas están en el [README del laboratorio](../../tests/firebase-trusted/README.md). No aprueban dinero, redondeo, unidades, descuentos, categorías, aperturas ni correcciones como políticas finales. Tampoco pueden demostrar si el precio declarado corresponde a un recibo real: un precio válido diferente, con su total coherente, es otra intención manual admisible. El ataque de precio ensayado altera el precio sin actualizar lo revisado y se rechaza por desacuerdo. La clasificación física/servicio exige una entrada estructurada veraz; el servidor no conoce la realidad del recibo.

## Transacción e idempotencia

1. Autenticar, autorizar y validar íntegramente la forma y aritmética sin acceso a datos.
2. Leer `operations/{id}` en transacción. Si existe y el hash coincide, devolver confirmado sin escribir; si difiere, conflicto.
3. Leer por ID **solo los D productos físicos distintos**, incluidos los ausentes que se crearían. No hay consulta de todo el catálogo.
4. Calcular todos los efectos desde los saldos leídos, comprobar metadatos y tamaños. Ninguna escritura se prepara antes de finalizar las lecturas/validaciones.
5. Crear el diario inmutable y escribir los D productos en una sola transacción. Solo devolver confirmado después de que `runTransaction` confirme el commit.

El callback no emite notificaciones, logs de compra ni otros efectos externos, y no genera identidades nuevas. Sus contadores son locales a la invocación. La SDK dispone de hasta cinco intentos; los tiempos y saldos se recalculan cuando corresponda. La compra aditiva utiliza el saldo actual. El ajuste absoluto exige una versión esperada, y un cambio concurrente produce conflicto en lugar de sobrescribirlo.

No se usa un hash proporcionado por el cliente: el servidor calcula SHA-256 de la representación canónica de **toda la intención validada**, incluidos dinero, líneas y metadatos. El ID por sí solo no concede éxito a otra intención. La misma identidad de operación cubre compras y ajustes, evitando reutilizaciones cruzadas.

Antes de implementar se verificaron los límites vigentes: documento de 1 MiB, solicitud API de 10 MiB, transacción de 270 s con 60 s de inactividad; el laboratorio admite hasta 101 escrituras y limita el tamaño antes de preparar el commit. [Cuotas actuales](https://firebase.google.com/docs/firestore/quotas). El antiguo máximo de 500 escrituras por Commit/transacción fue eliminado en marzo de 2023; no debe confundirse con las 500 transformaciones por documento ni con límites de SDK antiguos. [Notas oficiales](https://docs.cloud.google.com/firestore/docs/release-notes#March_29_2023). Persisten tamaño, tiempo, índices y contención; no se deduce capacidad ilimitada.

## Seguridad

Las [reglas reales](../../tests/firebase-trusted/firestore.rules) solo permiten lectura bajo `products` y `operations` al UID autorizado, y deniegan **todas** las escrituras del cliente. Rutas no previstas también quedan cerradas. La regla ya no reproduce los cálculos de compra ni enlaza cien documentos. Los ataques usan el SDK cliente o el callable autenticado; los privilegios de preparación no se utilizan para simular al atacante.

Admin SDK omite reglas, por lo que el ejecutor es una frontera de seguridad real: un fallo suyo no será corregido por Firestore Rules. Deberán revisarse su cuenta de servicio/IAM, cambios administrativos, autenticación real, App Check, errores y protección de invocaciones antes de producción. La entrada del laboratorio contiene un bloqueo explícito que exige proyecto demo y emuladores en loopback. No hay claves administrativas en React ni en los fixtures.

No se registra el contenido financiero recibido. Errores de validación tienen mensajes fijos; errores de base se traducen sin exponer su payload. Se revisaron stdout de Functions y debug de CLI sin encontrar nombres/comercio ficticios. Esto acredita los caminos ensayados, no todos los sistemas de logging de una futura infraestructura.

No se impone unicidad semántica de nombre a través de todo el catálogo: dos IDs diferentes pueden describir productos parecidos. Se evita duplicar por reenvío de la **misma operación** y se rechaza una reserva nueva del mismo ID desde dos operaciones distintas. Resolver coincidencias o nombres normalizados requiere DP-10 y otro diseño/prueba; no se fusiona silenciosamente el catálogo.

## Recuperación

`lookupOperation` consulta Firestore desde el ejecutor, con identidad autenticada y un ID válido, y devuelve estado, hash y total. Se probó también leer el resultado con clientes nuevos. La página aislada conserva temporalmente un comprobante estructurado, valida UID/ID/hash y reintenta exactamente la misma intención. Una ausencia remota es una observación, no una orden de cancelar un envío aún pendiente.

Las cuatro pruebas de Chromium incluyen desconexión antes de enviar, cierre pendiente antes del envío efectivo, nueva pestaña tras éxito y pérdida de una respuesta HTTP **200 con `status=confirmed`**. En esta última se verificó además directamente el inventario/diario antes de descartar la respuesta. Tras cerrar la pestaña, otra recuperó la operación y el reintento devolvió `already-confirmed`, manteniendo un solo incremento y gasto.

El primer simulador de cierre dejaba una solicitud pausada sin abortarla: el cierre permitió que llegara al servidor. Se corrigió haciendo explícito el aborto antes de cerrar, en lugar de asumir que cerrar cancela una compra. No se promete cancelación tras enviar. Cierre completo de navegador/SO, corrupción/borrado de almacenamiento, pérdida del ACK entre Admin SDK y Firestore, caducidad de sesión y agotamiento de reintentos necesitan pruebas posteriores. No se incorpora esta política a React; DP-06 permanece abierta.

## Consumo y costos

Sin reintentos, una compra con D productos físicos distintos solicita **D+1 lecturas y D+1 escrituras**; una consulta de resultado solicita una lectura, y el reenvío ya confirmado una lectura y cero escrituras. Servicios solos requieren una lectura y una escritura. Cincuenta líneas repetidas del mismo producto requieren dos y dos. El catálogo total no interviene en esa fórmula.

Las métricas de código contabilizan documentos solicitados/comprometidos, no cargos de una factura. Excluyen verificación de tests, UI, consultas históricas, índices y costos de infraestructura. La transferencia registrada es cuerpo callable JSON, no headers/TLS/gRPC. El tamaño documental se calcula con la [fórmula oficial](https://firebase.google.com/docs/firestore/storage-size), contrastada con su ejemplo de 147 bytes. Los tiempos locales no predicen latencia regional o p99.

La [estimación actualizada](COST_ESTIMATION.md#extensión-04c--ejecutor-confiable-local-22-11-2026) detalla cuatro escenarios, tarifas, cuotas y controles. Functions real exige Blaze; la prueba local no lo requiere. El costo marginal estimado de las confirmaciones domésticas puede quedar dentro de las cuotas gratuitas, pero **no hay costo cero garantizado** ni factura medida. Se deben incluir arranques, otros servicios, almacenamiento de imágenes de contenedor, red, abuso y consumos compartidos.

## Diferencia respecto de 04B y dictamen

| Garantía | 04B | 04C ejecutada |
| --- | --- | --- |
| Compras válidas 5/50/100 | Rechazadas por presupuestos del validador | Aceptadas y verificadas en Firestore |
| Estado y testigos | Mapas completos por paso, crecimiento `O(catálogo×líneas)` | Documentos independientes y compra embebida, `O(D+N)` |
| Validación remota | Lenguaje y presupuesto de Security Rules | Código de función confiable con esquema cerrado |
| Seguridad negativa | Rechazos con control financiero positivo fallido | Ataques rechazados junto a controles positivos aceptados |
| Concurrencia/idempotencia | Confirmaciones válidas no admitidas | Mismo/distinto producto, mismo ID, reservas y ajustes verificados |
| Respuesta perdida | No llegó a producirse un commit exitoso | HTTP 200 confirmado, respuesta perdida y conciliación sin duplicación |
| Producción | No apta la variante ensayada | Viable técnicamente en laboratorio; implementación/operación productiva todavía no aprobadas |

Se recomienda continuar con esta arquitectura como candidata y abandonar el intento de resolver 04B con reglas más complejas. Las pruebas fundamentales del recorrido local solicitado pasaron. Faltan aprobación de DP, runtime soportado, identidad real/IAM/App Check/abuso, privacidad durable, índices, cuotas y facturación reales, resiliencia adicional y validación de uso. Node 20 se usó por disponibilidad local; su runtime está retirado desde 30-10-2026. Antes de una fase de producción habrá que elegir y probar Node 22/24 soportado. [Ciclo de runtimes](https://docs.cloud.google.com/functions/docs/runtime-support).

No se declara el paquete listo para producción. Gemini fue omitido como revisor efectivo por la falta de autenticación ya comprobada en 04B; se aplicó revisión propia y validación ejecutada, sin reintentar credenciales fallidas.
