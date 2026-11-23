# Fase 04C — Prueba local del ejecutor confiable

Fecha: 22-11-2026, America/Bogota. Base `main`: `0779e0b80afca5a437742c39a17fe9accf46d55c`. Se verificaron árbol limpio, rama, remoto y SHA remoto antes de trabajar. **El ejecutor funciona en los tres emuladores y supera los escenarios locales solicitados. Se recomienda como arquitectura candidata; no se declara listo ni aprobado para producción.**

## Alcance y configuración

Se revisaron AGENTS, visión, reglas, decisiones, dominio, estado, Fase 04A, informe y dictamen 04B. No se modifica el prototipo React, identidad visual, reglas funcionales originales ni DP-01 a DP-13. [04B](FASE_04B.md) y su laboratorio negativo permanecen sin cambios; no forman parte del comando de prueba 04C.

Se creó [tests/firebase-trusted](../tests/firebase-trusted/README.md), con funciones callables reales, reglas, modelo normalizado, fixtures, pruebas Node y página de recuperación propia. Solo `demo-mi-casa-04c`, usuario ficticio `demo-owner-04c`, sin claves ni recursos reales. Auth `127.0.0.1:9199`, Firestore `8286`, Functions `5104`, hub `4405`, logging `4505`, websocket `9250`; UI desactivada. Se verificaron interfaces loopback y apagado posterior. El navegador sirve esta carpeta en `127.0.0.1:4187`.

Herramientas: Node 20.19.5, Java 25.0.5.1, Firebase CLI 15.37.0, Firestore Emulator 1.22.0, Functions SDK 7.4.0, Admin SDK 13.10.0 y cliente Firebase 12.19.0. Las dos dependencias nuevas están en desarrollo, con lockfile actualizado y versiones de paquetes anteriores conservadas. `functions/package.json` declara los mismos SDK y resuelve la instalación raíz. `.gitignore` añade `.runtimeconfig.json`; logs, reportes, capturas, cachés, bases y binarios no se versionan.

Se utilizó la ejecución externa autorizada para los servicios locales, sin alterar restricciones del sistema. Se cambió el descubrimiento de Functions a manifiesto temporal por archivo para evitar el listener HTTP auxiliar del SDK. El guard del ejecutor exige proyecto demo y hosts exactos; aborta contra un entorno no emulado.

No hubo `firebase deploy`, Blaze, proyectos/cuentas reales, Hosting, Storage u OCR. El Admin SDK solo se ejecuta en Functions con Firestore Emulator obligatorio, no en React. La excepción privilegiada de los tests se utiliza exclusivamente para preparar/limpiar fixtures.

## Arquitectura implementada

Cliente aislado → Authentication → `confirmPurchase` → transacción Firestore. `lookupOperation` consulta el resultado por ID. `adjustStock` permite probar ajustes absolutos con versión esperada.

- Productos independientes con existencia exacta o estado sencillo, versión y timestamp.
- La operación `kind=purchase` **es la compra canónica**, con artículos y movimientos embebidos, total recalculado, productos referenciados y hash de intención. No hay otra tabla de gastos.
- Se leen primero operación y D productos distintos; después se calcula todo y se escriben D productos y una operación. El tamaño del catálogo completo no interviene en la confirmación.
- Reglas de lectura por UID y denegación total de escritura directa. La validación financiera reside en el ejecutor confiable, sin reproducirla en Security Rules.

Detalles de contratos, transacción, idempotencia y límites: [TRUSTED_EXECUTOR](architecture/TRUSTED_EXECUTOR.md). Los supuestos COP/escala 1.000/redondeo/descuentos/estados/apertura cero son **parámetros de ensayo**. No se aprueban decisiones funcionales por haber pasado estas pruebas.

## Pruebas ejecutadas

| Comando o suite | Resultado final |
| --- | --- |
| `npm run test:firebase:trusted:unit` | **10 correctas** |
| Integración mediante `npm run test:firebase:trusted` | **53 correctas**, cero fallidas/omitidas |
| Recuperación Chromium mediante el mismo comando | **4 correctas**, cero fallidas/omitidas |
| Comando completo de emuladores | Arranque → integración → navegador → apagado; código **0** |
| `npm run typecheck` | Correcto |
| `npm run build` | Correcto, 64 módulos; mismos nombres/hash de assets del prototipo base |
| `npm test` | **61 correctas**, cinco archivos, dominio y componentes |
| `npm run test:e2e` | **143 correctas y una omitida** de 144; omisión previa de zoom real |

No se deshabilitó ninguna prueba. La primera ejecución de recuperación tuvo tres correctas y un fallo de simulación: una petición pausada podía continuar al cerrar la página. Se corrigió abortándola explícitamente antes de cerrar, y se ejecutó de nuevo toda la recuperación y posteriormente el comando completo. No se cambió la expectativa para aceptar un resultado indeterminado. Las 47 pruebas iniciales de integración pasaron; se añadieron cuatro ataques de frontera y una reserva concurrente, y pasaron las 52. La revisión propia añadió una regresión de saldo almacenado malformado y una de colisión de nombres de campos: el total final es 53 de integración y 10 del contrato.

### Compras y métricas

Una ejecución local registrada, datos ficticios y un intento de callback por caso:

| Productos físicos distintos | Resultado | Lecturas / escrituras | Cuerpo JSON, bytes | Compra, bytes | Productos escritos, bytes | Ejecutor ms / round trip ms |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| 5 | Confirmada | 6 / 6 | 1.500 | 2.407 | 1.020 | 158,92 / 3.216 |
| 50 | Confirmada | 51 / 51 | 13.772 | 21.504 | 10.280 | 73,88 / 432 |
| 100 | Confirmada | 101 / 101 | 27.423 | 42.856 | 20.580 | 65,72 / 541 |

Se consultó Firestore después de cada operación: todas las líneas, movimientos y totales correctos; cada producto pasó de 2.000 a 3.000 unidades escaladas. Las pruebas de nuevos 5/50/100 abrieron en cero y terminaron en 1.000. Ninguna compra se dividió.

Los tiempos son una muestra local, no un benchmark productivo: el primer round trip incluye arranque del worker y framework. Lecturas/escrituras son documentos solicitados/comprometidos por el ejecutor, excluyendo verificaciones del test. Los bytes de compra/productos usan fórmula de almacenamiento, contrastada con el ejemplo oficial de 147 bytes. No son bytes gRPC, índices ni factura observada.

Otros escenarios comprobados:

- **50 repeticiones del mismo producto:** 50 líneas y 50 movimientos, saldo 52.000, gasto 210.000 COP, dos lecturas/dos escrituras, compra 21.249 bytes y solicitud 13.693; tiempo interno 15,09 ms.
- **Compra mixta:** cinco líneas con exacto fraccionario, gramos, nuevo sencillo, servicio y nuevo líquido en ml. Cuatro movimientos, total 12.200 COP, saldo exacto 3.750, líquido 500 y sencillo `available`, sin cantidad ficticia.
- **Servicio solo:** una operación financiera, sin movimiento ni escritura de producto.
- **Catálogos 100/500/1.000:** cinco productos comprados, seis lecturas y seis escrituras en los tres casos; se comprobó que un producto ajeno permanecía idéntico. Tiempo interno 15,28/12,57/12,48 ms. No se descargó ni reescribió el catálogo desde la función.
- **Precios históricos:** dos compras canónicas consultadas por producto/fecha, conservando ambos precios y gasto de 9.200 COP sin fuente financiera adicional.

### Seguridad adversarial

Se ejecutaron **26 mutaciones de intención**, todas rechazadas sin cambiar productos/operaciones: precio alterado frente al total revisado, precio negativo o texto, total incorrecto, cantidades negativas/fraccionarias incompatibles, unidades, descuentos, movimiento enviado vacío, UID o imágenes extra, neto enviado por cliente, producto desconocido, falsa alta nueva, metadatos alterados, compra vacía, fecha inválida, recorrido de ruta, overflow, identidad de línea repetida, payload excesivo, 101 líneas y bandera de producto malformada.

Además, una falla en la última línea dejó sin efectos las líneas válidas y el nuevo producto previos. Un ajuste sobre un saldo almacenado malformado se rechaza sin reparar silenciosamente su historia. Sin Auth y con otro UID, las tres funciones rechazaron acceso antes de leer datos; las reglas rechazaron lecturas/escrituras ajenas. El UID autorizado tampoco pudo escribir productos, compras, movimientos, stock ni borrar/modificar historia directamente, incluida categoría histórica. Cada escenario comparó Firestore antes/después.

El campo de movimientos no forma parte de la intención: no se admite que el cliente elija omitir un efecto. El servidor lo genera y los positivos verifican correspondencia exacta. No se afirma detectar falsedades del recibo real: un precio diferente pero válido con total coherente puede ser una entrada manual legítima. Ese límite de conocimiento sigue existiendo con backend.

### Concurrencia e idempotencia

Pasaron los escenarios de dos compras del mismo producto y de productos diferentes: ambos gastos y ambas entradas persistieron, con dos operaciones. Para el mismo ID, quedó una operación y un incremento; el segundo resultado fue `already-confirmed`, una lectura y cero escrituras. También pasó el mismo ID con productos nuevos: cinco productos, una compra y sin duplicación.

Reutilizar ID con una intención válida diferente produjo `already-exists`, preservando historia. Dos operaciones distintas reservando el mismo ID de producto nuevo tuvieron exactamente una confirmación; la otra se rechazó sin efectos. No se promete deduplicación semántica de nombres con IDs diferentes (DP-10).

Compra contra ajuste absoluto: si ajustó primero, el saldo final conservó ajuste más entrada; si compró primero, el ajuste obsoleto fue rechazado. Dos ajustes sobre la misma versión tuvieron exactamente un éxito y un conflicto. Se comprobó la versión y el diario, sin sobrescritura silenciosa.

En los casos instrumentados el callback tuvo **un intento y cero reintentos**: la serialización/contención observada no exigió su reejecución. Esto no prueba que nunca haya `ABORTED` ni agotamiento de reintentos en producción. El SDK tiene máximo de cinco intentos y el callback vuelve a derivar el resultado desde las lecturas.

### Recuperación y privacidad

Las cuatro pruebas de Chromium pasaron: desconexión antes de enviar y reintento; nueva pestaña después de éxito; cierre con intento estructurado pendiente antes de envío efectivo; y respuesta perdida **después de una confirmación real**.

En el último escenario, el interceptor verificó HTTP **200** y `status=confirmed`, y el test consultó el inventario/diario antes de descartar la respuesta. Tras cerrar la pestaña y abrir otra, `lookupOperation` devolvió el hash confirmado; reintentar el mismo ID devolvió `already-confirmed`. Se mantuvieron una operación, un incremento y gasto de 4.200 COP. No se utilizó un rechazo 403 para aparentar éxito.

El comprobante temporal guarda UID, ID, estado, intención estructurada y hash en localStorage del origen del laboratorio. No contiene fotografías, base64 ni OCR, ni se integra en React. Una ausencia no cancela un emisor todavía pendiente. El almacenamiento durable, su eliminación y privacidad requieren DP-06. No se ensayaron cierre completo del SO/navegador, corrupción del comprobante, caducidad real de cuenta ni pérdida del ACK entre SDK Admin y Firestore.

El ejecutor no imprime payloads financieros. Se inspeccionaron logs de Functions/CLI sin nombres/comercio de los fixtures; los diagnósticos de las pruebas registran métricas y etiquetas sintéticas. No se conservaron datos privados ni se publican logs/capturas generadas.

## Límites, costos y problemas pendientes

La [estimación extendida](architecture/COST_ESTIMATION.md#extensión-04c--ejecutor-confiable-local-22-11-2026) compara 10/30 compras y 50/100 artículos. En el ejemplo regional, las confirmaciones requieren entre 510 y 3.030 lecturas/escrituras mensuales. Su componente bruto de cómputo/peticiones/lecturas/escrituras, sin aplicar cuotas, es aproximadamente **0,00086–0,00439 USD/mes**, bajo supuestos explícitos. No incluye todos los servicios/cargos ni garantiza ese total de factura. Las cuotas disponibles podrían cubrir ese componente doméstico; Blaze sigue siendo necesario para Functions real.

Se investigaron alertas, App Check, IAM, límites de instancias, concurrencia y spend caps actuales en Preview. Los caps de Functions pueden tener exceso por retrasos y no cubren todo Firestore; no son un límite monetario duro. No se activó ni configuró facturación, alertas o caps.

Otros límites y verificaciones pendientes:

- 100 líneas, 256 KiB de JSON, documento canónico hasta 900.000 bytes y fronteras numéricas son parámetros del laboratorio. No prueban cualquier tamaño ni decisiones funcionales definitivas.
- El emulador no acredita índices, IAM, escalado, cuota/facturación, latencia regional o disponibilidad productiva. App Check no se exige en este laboratorio.
- Node 20 permite ejecutar el laboratorio existente, pero está retirado como runtime de Functions real a fecha de consulta. Debe seleccionarse y probarse un runtime soportado antes de producción; no basta copiar esta configuración.
- `npm audit`: **26 entradas vulnerables de desarrollo (21 moderadas, cinco altas)**; cinco moderadas adicionales respecto de 04B. No se aplicaron cambios mayores indiscriminados. `npm audit --omit=dev`: **cero**. Debe resolverse la deuda antes de reutilizar estas dependencias en un servicio real.
- Gemini: CLI disponible, autenticación previamente fallida en 04B. Se omitió la revisión efectiva, sin reintentar credenciales fallidas; se realizó revisión propia del contrato, transacciones, privilegios y diff. Se reprodujo y corrigió una colisión en la comparación de claves concatenadas (ahora se exige cantidad y pertenencia exactas), y se añadió validación del producto previo antes de un ajuste. Ambas correcciones tienen regresión ejecutada.

## Recomendación y publicación

El resultado local es positivo y resuelve los bloqueos del verificador de 04B sin añadir complejidad a sus reglas. Se recomienda **esta arquitectura como candidata para una futura implementación autorizada**, conservando dominio puro, servidor confiable, compra canónica, IDs estables y reglas de escritura cerradas.

No se declara aptitud de producción: faltan decisiones DP, runtime soportado, seguridad/operación real, recuperación adicional, privacidad durable y aprobación económica. No se configura ni despliega infraestructura y no se inicia otra fase.

La fase se publica mediante commit sobre la base verificada y push normal a `origin/main`, conservando historia y auditando archivos preparados. El SHA definitivo se comunica en la entrega después de comprobar el remoto; publicar el laboratorio no equivale a desplegar servicios.
