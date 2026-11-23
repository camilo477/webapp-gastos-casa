# Cuotas, costos y rendimiento estimados

**Fecha de consulta: 21-11-2026 (America/Bogota).** Fuentes oficiales enlazadas; estimaciones de ingeniería, no factura ni medición de Firestore real. Modelo candidato B de [FIRESTORE_MODEL](FIRESTORE_MODEL.md), sujeto a aprobación de seguridad. No se promete gratuidad indefinida ni se contratan servicios.

## Cuotas actuales relevantes

Firestore gratuito: una base por proyecto, almacenamiento 1 GiB, 50.000 lecturas/día, 20.000 escrituras/día, 20.000 eliminaciones/día y salida 10 GiB/mes. Las cuotas diarias se reinician aproximadamente a medianoche del Pacífico; no constituyen una bolsa mensual. TTL, PITR, backups, restauraciones y clonación requieren facturación. [Cuotas oficiales](https://firebase.google.com/docs/firestore/quotas).

Firebase Hosting publica 10 GB de almacenamiento. Hay una discrepancia oficial: la [tabla de precios](https://firebase.google.com/pricing) indica 360 MB/día de transferencia, mientras la [guía de Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing) indica 10 GB/mes y posible suspensión en Spark al excederlo. Se conserva la discrepancia: comprobar consola/condiciones vigentes antes del despliegue, planificar por debajo de ambas y no confundir Hosting con salida de Firestore. Recursos OCR/idiomas y nuevas versiones pueden dominar transferencia/almacenamiento de Hosting.

Authentication tiene límites por proveedor/operación: recuperación por correo 150/día en Spark; enlaces de acceso por correo 5/día; SMS requiere Blaze. No equivale a decir que todo Auth es ilimitado. [Límites de Authentication](https://firebase.google.com/docs/auth/limits). Para una sola usuaria no se prevé presión normal sobre recuperación; abuso o proveedores nuevos cambian el escenario.

## Supuestos reproducibles

- P = 100, 500 o 1.000 productos actuales; M = 10 o 30 compras/mes de 50 artículos.
- Inventario agregado I = P × 512 bytes (producto + proporción de metadatos); operación de compra O = 50 KiB incluyendo líneas y movimientos. Son **presupuestos supuestos**, no tamaños medidos. Si el validador requiere pruebas intermedias, O puede crecer.
- 30 días; dos aperturas/día con lectura de perfil + estado: 120 lecturas/mes. Cada apertura descarga I, sin listener permanente.
- Diez consultas completas del mes: 10M lecturas de compras. El dashboard reutilizaría datos cargados, no otra consulta por tarjeta. No cargar solo una página y presentar un total incompleto.
- Cada compra: dos lecturas explícitas en transacción (ID y estado), dos escrituras (operación y estado), hasta dos documentos dependientes distintos en reglas. Se presupuestan estas lecturas aunque se repitan rutas entre código/reglas; no se descuenta caché para justificar seguridad.
- Lecturas base documentales R = 120 + 10M + 2M + 2M = **120 + 14M**. El conteo de accesos de reglas es 3 llamadas, distinto del cobro por documentos dependientes únicos. [Facturación de lecturas y reglas](https://firebase.google.com/docs/firestore/pricing).
- Con el orden explícito por fecha e ID propuesto, presupuestar además 10 lecturas de entradas de índice/mes para esas diez consultas pequeñas (hasta 1.000 entradas exploradas por consulta). `__name__` cuenta como campo de rango; medir con Query Explain antes de cerrar costos. Si se simplifica a una consulta exenta de cargos de entradas de índice, ese extra puede desaparecer. No se presume la exención.
- Sin reintentos, listeners, ajustes, lista remota, visitas adicionales al detalle o historial de precios en la tabla base. Se cuantifican aparte abajo.

## Seis escenarios del candidato agregado

| P | M | Documentos nuevos/mes | Escrituras/mes | Lecturas documentos/mes | Extra índice estimado | Inventario MiB | Salida aproximada MiB/mes |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 10 | 10 | 20 | 260 | 10 | 0,049 | 8,30 |
| 100 | 30 | 30 | 60 | 540 | 10 | 0,049 | 19,04 |
| 500 | 10 | 10 | 20 | 260 | 10 | 0,244 | 21,97 |
| 500 | 30 | 30 | 60 | 540 | 10 | 0,244 | 36,62 |
| 1.000 | 10 | 10 | 20 | 260 | 10 | 0,488 | 39,06 |
| 1.000 | 30 | 30 | 60 | 540 | 10 | 0,488 | 58,59 |

Se crean una vez perfil + estado (dos documentos/dos escrituras, más cualquier operación explícita de apertura). El documento de estado se actualiza M veces, no se crea M veces. Productos nuevos incluidos en una compra no agregan documentos en B. Cincuenta movimientos embebidos no equivalen a cincuenta escrituras.

Salida de tabla = `(60 + M) × I + 10 × M × O`; incluye lecturas del estado en confirmación y reportes, excluye protocolo, perfil pequeño, respuesta de commit y reintentos. No supone descarga al dispositivo de las lecturas internas de reglas. Es orden de magnitud, no cómputo exacto de mensajes facturables. En P=1.000, la transferencia crece aunque siga siendo un documento leído.

### Crecimiento durante un año sin borrar historial

| P | M | Datos estimados MiB tras 12 meses | Presupuesto con factor 2 para metadatos/índices MiB |
| ---: | ---: | ---: | ---: |
| 100 | 10 | 5,91 | 11,82 |
| 100 | 30 | 17,63 | 35,25 |
| 500 | 10 | 6,10 | 12,21 |
| 500 | 30 | 17,82 | 35,64 |
| 1.000 | 10 | 6,35 | 12,70 |
| 1.000 | 30 | 18,07 | 36,13 |

Fórmula datos = `I + 12 × M × O`. El factor 2 es una reserva de planificación, **no una cota garantizada**. Exenciones de índices son importantes. Documento, almacenamiento total e índices son límites distintos; una base de 36 MiB todavía puede contener un estado individual demasiado grande. El crecimiento histórico continúa después del año.

### Consumos adicionales

| Situación adicional | Consumo aproximado |
| --- | --- |
| 30 ajustes/creaciones/ediciones con diario al mes | +30 documentos, +60 escrituras, hasta +120 lecturas explícitas/dependientes; tamaño según payload |
| Cuatro consultas de precios con límite 20 | Hasta +80 lecturas de compras y unos 3,91 MiB si todas pesan O, más entradas de índice según consulta |
| Comprobar un resultado incierto | +1 lectura puntual por comprobación al servidor; los reintentos completos vuelven a leer/evaluar reglas |
| Diez pantallas de detalle no cacheadas | +10 lecturas y unos 0,49 MiB |
| Reintentos por contención | Multiplicar las lecturas de transacción/reglas por intentos; no multiplicar efectos confirmados |
| Listener/reconexiones | Nuevas lecturas y evaluación de reglas según cambios/reconexión; fuera de base. Evitar montar un listener por componente |
| Lista temporal en memoria | 0 lecturas/escrituras remotas; persistirla necesita nueva estimación DP-06 |
| Consultas vacías/rechazadas | Las vacías tienen mínimo de lectura; rechazos pueden consumir lecturas dependientes. No asumir costo cero |

Incluso concentrando las 30 compras en un día, serían 60 escrituras y aproximadamente 120 lecturas de transacción/reglas, más consultas y aperturas del día; están lejos de las cuotas nominales. No inferir de ello que las reglas o el documento individual sean viables. El riesgo inicial es integridad y tamaño, más que volumen normal de una usuaria.

## Comparación con documentos normalizados

Con 50 líneas físicas distintas: `1+D+N = 101` escrituras/compra para compra embebida + productos + movimientos. Son 1.010/3.030 escrituras mensuales para M=10/30 y 51 documentos nuevos/compra si todos los productos ya existían (compra + movimientos). Artículos separados añaden otras 50 escrituras/documentos por compra y lecturas de detalle. Precios derivados no requieren más documentos.

Esto también podría caber por volumen en Spark, pero **no resuelve la seguridad remota** señalada en [TRANSACTIONS](TRANSACTIONS.md). La comparación de costos no autoriza ese diseño. No sumar estas cifras a las del candidato B ni prometer que el ejecutor confiable de una alternativa futura sea gratuito.

## Rendimiento y cuándo reconsiderar Spark

Medir antes de aprobar: tamaño Firestore real, catálogo de nombres extensos, índices efectivos, carga móvil con red lenta, contención de dos pestañas, latencia/región, callback reejecutado y consumo de memoria. Hacer lecturas por periodo/cursor, no offsets ni recorrido del diario completo. Una agregación `sum` no corrige datos canónicos falsificados ni produce por sí sola agrupaciones arbitrarias por categoría.

Reconsiderar Blaze al necesitar superar cuotas, backend confiable/Functions, SMS, backups/PITR/TTL administrados u otros servicios que requieran facturación. Los límites de documento/reglas no desaparecen al pagar; Blaze no es una solución automática para B. Presupuestos y alertas no son un límite duro de gasto. No se habilitarán pagos ni servicios en 04A.

Las referencias actuales distinguen transformaciones por documento de número de documentos escritos: la cifra 500 en la tabla de cuotas es de **transformaciones de campos en un documento**, no una prueba de que nuestra compra sea segura por tener menos de 500 escrituras. Verificar el SDK elegido, tamaño de solicitud y límites vigentes en la prueba técnica; el prototipo todavía no depende del SDK Firebase.

## Extensión 04C — ejecutor confiable local (22-11-2026)

Esta sección añade la estimación de la prueba autorizada 04C; las tablas anteriores conservan los supuestos históricos del candidato B. **No autoriza Blaze ni aprueba decisiones pendientes.** [Arquitectura y límites](TRUSTED_EXECUTOR.md), [resultados medidos](../FASE_04C.md).

### Modelo de consumo

M compras al mes, N líneas físicas de productos distintos ya existentes, D=N. Cada confirmación hace una invocación Functions, D+1 lecturas transaccionales y D+1 escrituras: productos independientes y compra/operación con movimientos embebidos. No añade un documento por línea o movimiento ni otro gasto. Sin reintentos en la base de la tabla. Productos nuevos tienen el mismo número de lecturas solicitadas/escrituras, aunque las lecturas encuentren documentos ausentes. Cincuenta repeticiones de un producto reducen D a uno.

| Compras/mes | Artículos/compra | Invocaciones | Lecturas | Escrituras | CPU-s / GiB-s supuestos | Costo bruto de estos componentes, USD/mes |
| ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 10 | 50 | 10 | 510 | 510 | 10 / 2,5 | 0,00086225 |
| 30 | 50 | 30 | 1.530 | 1.530 | 30 / 7,5 | 0,00258675 |
| 10 | 100 | 10 | 1.010 | 1.010 | 10 / 2,5 | 0,00146225 |
| 30 | 100 | 30 | 3.030 | 3.030 | 30 / 7,5 | 0,00438675 |

Ejemplo orientativo en `us-central1`, por petición, sin descuentos/cuota gratuita: CPU 0,000024 USD/vCPU-s; memoria 0,0000025 USD/GiB-s; peticiones 0,40 USD/millón. Se supone **1 segundo facturable, 1 vCPU y 256 MiB por invocación**; no se deduce ese segundo de la latencia del emulador. [Tarifas de Cloud Run por petición](https://cloud.google.com/run/pricing). Firestore regional: 0,03 USD/100.000 lecturas y 0,09 USD/100.000 escrituras. [Tarifas Firestore por región](https://cloud.google.com/firestore/pricing). Fórmula: `M*(0,000024 + 0,25*0,0000025 + 0,40/1000000) + M*(D+1)*(0,03+0,09)/100000`.

Las cifras son el componente marginal de confirmar, **no un presupuesto total ni una garantía de factura menor de un centavo**. No incluyen arranque/apagado, Cloud Build, imágenes de contenedor/Artifact Registry, red, almacenamiento/índices, logging, impuestos, conversión a COP, otros proyectos o abuso. Una región distinta, duración mayor o CPU/configuración diferente cambia el cálculo. No se eligió una región de producción.

### Cuotas gratuitas y servicios auxiliares

El nivel gratuito por petición de Cloud Run contempla 2 millones de peticiones, 180.000 vCPU-s y 360.000 GiB-s al mes, compartidos por cuenta de facturación. Los cuatro escenarios de confirmación quedan muy por debajo; podrían tener componente incremental de cómputo cero si queda cuota elegible. No se suma automáticamente la cuota histórica de Functions 1.ª generación a la de 2.ª generación. [Cloud Run pricing](https://cloud.google.com/run/pricing).

Firestore mantiene 50.000 lecturas/día, 20.000 escrituras/día, 1 GiB almacenado y 10 GiB de salida/mes para la base elegible. Aun concentrando las 30 compras de 100 distintos en un día, las 3.030 escrituras/lecturas de confirmación no las agotan por sí solas. [Cuotas oficiales](https://firebase.google.com/docs/firestore/quotas). No es una reserva exclusiva: otros usos comparten cuotas.

Añadir al plan real:

- Cada consulta de resultado: una invocación y una lectura. Reenviar una intención ya confirmada: una invocación, una lectura y cero escrituras. El rechazo de un ID con contenido distinto consume invocación/lectura; un error detectado antes de transacción no lee documentos, pero consume ejecución.
- Los reintentos por contención vuelven a leer; las escrituras comprometidas siguen siendo D+1. Esta ejecución observó cero reintentos de callback en los escenarios medidos, sin garantizarlo en producción.
- Inventario normalizado: abrir todo un catálogo P cuesta P lecturas, no una. Sesenta aperturas mensuales de P=1.000 sumarían 60.000 lecturas/mes repartidas entre días, más transferencia. La implementación futura deberá decidir carga, caché, paginación y listeners.
- Diez consultas completas del mes sumarían hasta 10M lecturas de compras, más posibles entradas de índice según consulta. Historial de precios descarga compras, no solo sus líneas coincidentes. Estado o reportes no se descargan al confirmar una compra normal.
- La operación de 100 líneas del ensayo ocupa 42.856 bytes por fórmula, y la de 50 ocupa 21.504: 30 compras añadirían aproximadamente 1,23/0,62 MiB de datos canónicos mensuales, antes de índices y metadatos. No hay testigos del catálogo completo ni fotografías.

### Blaze, controles y límites de gasto

Desplegar Functions requiere Blaze y cuenta de facturación; la emulación no los requiere. Cloud Build y Artifact Registry pueden producir costos independientes de las invocaciones. La documentación describe 500 MB gratuitos iniciales de Artifact Registry, con cobro posterior. [FAQ oficial de Functions](https://firebase.google.com/docs/functions/faq-and-troubleshooting). En esta fase no se desplegó, no se creó cuenta/proyecto y no se activaron servicios de pago.

Configuración experimental declarada: `minInstances:0`, `maxInstances:2`, concurrencia 8, 256 MiB, 1 CPU y timeout 60 s **por función**. Evita una propuesta con instancias mínimas siempre activas, pero el emulador no prueba escalado ni límites de costo. Máximos de instancias/concurrencia no son un tope monetario mensual. Deben evaluarse autenticación/UID, App Check (no exigido en el laboratorio), límites de payload, protección de abuso/cuotas, IAM y alertas; incluso peticiones rechazadas por la lógica pueden consumir recursos. [Administración de Functions](https://firebase.google.com/docs/functions/manage-functions).

A fecha de consulta existen **spend caps en Preview** para Cloud Functions for Firebase, entre algunos servicios elegibles; Firestore no aparece en esa lista. Pueden pausar el servicio al alcanzar un presupuesto mensual. No son hard caps: el retraso de medición/enforcement puede generar exceso facturable, y el servicio vuelve a habilitarse el mes siguiente. Las alertas de presupuesto por sí solas no pausan servicios. [Spend caps oficiales y limitaciones](https://firebase.google.com/docs/projects/billing/spend-caps). No se configuró ningún presupuesto, alerta o cap. Una eventual pausa debe conservar incertidumbre e identidad de operación, sin provocar nuevas compras al reintentar.

Antes de aprobar producción se requiere una decisión económica explícita, un runtime soportado, validación de cuotas/índices/región, políticas de limpieza de artefactos y una prueba controlada de facturación autorizada. El laboratorio demuestra corrección local, no costo cero ni disponibilidad ilimitada.
