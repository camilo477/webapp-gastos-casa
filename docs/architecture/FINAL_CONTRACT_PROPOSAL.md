# Propuesta de contratos finales — 04D, revisión 1

**Propuesta completa para revisión, no contrato aprobado ni código implementado.** Fecha: 22-11-2026. Depende de [DP-01 a DP-13](OWNER_DECISION_REVIEW.md). Los tipos siguientes describen intención y persistencia futura; TypeScript por sí solo no valida solicitudes. El ejecutor deberá implementar esquemas cerrados y ensayos nuevos antes de usar estos contratos.

## 1. Invariantes y límites candidatos

- UID exclusivamente desde Authentication verificada; autorización en ejecutor y reglas de lectura. Ningún cuerpo concede identidad, roles o permiso. Todas las mutaciones persistentes propuestas pasan por callables confiables.
- Una compra lógica es la fuente financiera. Original y revisiones inmutables; reportes resuelven una sola versión vigente por `purchaseId`. Inventario/lista/apertura no generan gasto.
- Cada línea física produce su efecto y movimiento; servicios/cargos no tienen producto. Repeticiones legítimas conservan IDs de línea diferentes. Apertura de producto nuevo se distingue de la cantidad comprada y se aplica una sola vez.
- Dinero COP entero no negativo, cantidad escalada ×1.000 no negativa, adquisición física positiva; todos los enteros JSON deben ser seguros. Deltas de auditoría sí pueden ser negativos, nunca el saldo persistido. Productos intermedios y reparto con `BigInt`, convertidos solo tras comprobar rango.
- Candidatos a aprobar: COP por precio/bruto/descuento/neto/total ≤1.000.000.000; cantidad/saldo ≤1.000.000.000 escalados; 100 líneas por compra/revisión, JSON de intención ≤256 KiB y operación calculada ≤900.000 bytes. UUID de 36 caracteres para identidades nuevas, textos de nombre/comercio ≤160 y presentación/motivo ≤240. Versiones enteras positivas que no desborden `Number.MAX_SAFE_INTEGER`. Son **límites propuestos**, no ampliaciones ya ensayadas: 04C limitaba precio a 1.000.000 y textos a 100.
- Presupuesto de documento/solicitud/índices completo debe medirse con estas estructuras, nuevas aperturas y rectificaciones de hasta 200 productos afectados. Ninguna compra se divide para superar un límite. Se rechazan unidades incompatibles, residuos no representables, tipos erróneos y claves extra en cualquier nivel.

El servidor garantiza coherencia del contrato y de los cálculos, no autenticidad de una factura externa: sin una fuente verificable no puede distinguir un precio COP válido inventado de uno realmente pagado, ni inferir que un concepto libre declarado servicio era físicamente un producto. La revisión humana decide esos datos; el ejecutor rechaza importes inválidos, totales inconsistentes y omisiones de stock de líneas declaradas físicas. No se afirma que 04C o estos contratos detecten todo dato falso pero internamente consistente.

## 2. Tipos básicos, producto y existencia

**Revisión local 05C-3:** los tipos de inventario de esta sección quedan como propuesta histórica. El único candidato implementado es el [contrato consolidado schemaVersion=2](CONSOLIDATED_INVENTORY_CONTRACT.md), con una versión de registro, presentación y siete categorías. Sus diferencias están documentadas y no se aprueban unilateralmente. Los tipos financieros siguientes siguen pendientes y deberán adaptar sus referencias/versiones antes de usar ese inventario; no se implementa aquí una compra remota.

Notación documental autocontenida; `ServerTime` viaja como ISO UTC validado y se persiste como Timestamp. Versiones de metadatos y stock son independientes y comienzan en 1. Campos `null` tienen significado explícito; no se usan `undefined`, objetos SDK, URLs, Blob ni valores no finitos en el contrato de red.

```ts
type Id = string;
type COP = number;              // entero no negativo validado
type DeltaCOP = number;         // entero firmado, solo auditoría
type QuantityMilli = number;    // entero escalado validado
type Version = number;
type ServerTime = string;
type BaseUnit = 'unidad' | 'kg' | 'L';
type Unit = BaseUnit | 'g' | 'ml';
type StockStatus = 'available' | 'low' | 'empty';
type CategorySnapshot = { id: Id | null; label: string };
type StoreSnapshot = { name: string | null; displayName: string; searchKey: string | null };
type Product = {
  id: Id; name: string; presentationText: string | null;
  category: CategorySnapshot; control: 'exact' | 'simple'; baseUnit: BaseUnit;
  metadataVersion: Version; createdAt: ServerTime; updatedAt: ServerTime;
};
type InventoryStock = {
  productId: Id; stockVersion: Version; updatedAt: ServerTime;
} & (
  { control: 'exact'; quantityMilli: QuantityMilli }
  | { control: 'simple'; status: StockStatus }
);
type ProductDefinition = {
  id: Id; name: string; presentationText: string | null;
  categoryId: Id | null; control: 'exact' | 'simple'; baseUnit: BaseUnit;
};
type OpeningStock =
  | { control: 'exact'; quantityMilli: QuantityMilli }
  | { control: 'simple'; status: StockStatus };
type NewProductSpec = { product: ProductDefinition; opening: OpeningStock };
```

Persistencia candidata: un documento `users/{uid}/products/{productId}` con `{schemaVersion:1, product:Product, stock:InventoryStock}`. Los tipos se separan para evitar confundir identidad con saldo; **no obligan a dos documentos ni dos escrituras**. Los IDs internos coinciden con ruta y con modo de control. El ejecutor obtiene etiquetas de categorías, timestamps y versiones; no los acepta como autoridad del cliente.

Unidad contable solo admite múltiplos de 1.000; kg/L admiten milésimas. Una cantidad de g/ml escalada se divide entre 1.000 al convertir a la base y debe dejar un entero exacto; no hay conversión masa↔volumen ni equivalencia por nombre. Un empaque con contenido conocido se representa explícitamente: comprar dos botellas de un litro puede usar 2.000 L-escalados y descripción «2 botellas de 1 L», con precio total verificado. No se calcula precio por botella como si fuera por litro sin conversión y revisión.

`createProduct` independiente genera operación no financiera de creación/apertura; dentro de compra, `newProducts` define cada ID una vez y sus aperturas se incluyen atómicamente, antes de entradas de compra. Ejemplo: apertura 2.000 + compra 3.000 termina 5.000; el gasto solo cubre 3.000 comprados. El producto no nace definitivamente mientras se prepara el borrador. Cambiar nombre/presentación/categoría actuales no reescribe historia. Modificar modo/base con historia requiere migración futura aprobada, no editar una etiqueta.

## 3. Intención y líneas financieras

La categoría de línea es una elección revisada independiente de la categoría predeterminada del producto. Una etiqueta histórica la resuelve el servidor desde el catálogo autorizado; `null` significa «Sin clasificar». El texto abreviado de recibo puede conservarse como etiqueta corta revisada, nunca como OCR completo.

```ts
type LineMoneyInput = {
  id: Id; label: string; categoryId: Id | null;
  priceCOP: COP; lineDiscountCOP: COP; globalDiscountEligible: boolean;
};
type ProductLineInput = LineMoneyInput & {
  kind: 'product'; productId: Id;
  productSource: { kind: 'existing'; expectedMetadataVersion: Version } | { kind: 'new' };
  quantityMilli: QuantityMilli; unit: Unit; priceMode: 'unit' | 'total';
  stockStatusAfter: StockStatus | null; // solo sencillo; obligatorio en ese modo
};
type ExpenseLineInput = LineMoneyInput & {
  kind: 'expense'; expenseType: 'service' | 'charge';
  chargeType: 'delivery' | 'tax' | 'other' | null;
};
type PurchaseLineInput = ProductLineInput | ExpenseLineInput;
type PurchaseBodyInput = {
  purchaseDate: string; storeName: string | null;
  lines: PurchaseLineInput[]; generalDiscountCOP: COP; reviewedTotalCOP: COP;
};
type PurchaseIntent = PurchaseBodyInput & {
  schemaVersion: 1; kind: 'purchase'; operationId: Id; purchaseId: Id;
  newProducts: NewProductSpec[];
};
type PurchaseLine = PurchaseLineInput & {
  categorySnapshot: CategorySnapshot;
  productSnapshot: Pick<Product, 'id' | 'name' | 'presentationText' | 'control' | 'baseUnit' | 'metadataVersion'> | null;
  grossCOP: COP; generalDiscountShareCOP: COP; netPaidCOP: COP;
};
type Purchase = {
  schemaVersion: 1; kind: 'purchase' | 'purchaseRectification'; purchaseId: Id; operationId: Id;
  revision: Version; previousOperationId: Id | null;
  status: 'confirmed' | 'void'; purchaseDate: string; store: StoreSnapshot;
  lines: PurchaseLine[]; generalDiscountCOP: COP; totalPaidCOP: COP;
  productIds: Id[]; movements: StockMovement[];
  intentHash: string; recordedAt: ServerTime; reason: string | null;
};
```

Validaciones futuras obligatorias: IDs de línea únicos; definición nueva única y referenciada; producto existente y versión de metadatos conocida; snapshot de producto compatible con unidad; `stockStatusAfter=null` en exacto y enum en sencillo. Líneas repetidas de un mismo producto sencillo deben indicar el mismo estado final revisado; no decide el orden accidental de las líneas. Servicio/cargo no lleva cantidad, unidad, precio unitario ni referencia física. En servicios `chargeType=null`; cargos exigen tipo y `globalDiscountEligible=false` en esta propuesta inicial. No se acepta `netPaidCOP`, snapshot, reparto o movimiento suministrado por el cliente: son salida servidor. Las variantes de `PurchaseLine` deberán validar `productSnapshot` no nulo en físico y nulo en gasto, aunque la notación TypeScript no exprese esa dependencia.

En rectificaciones se conservan IDs de líneas que continúan. Si línea y producto no cambian, el servidor reutiliza el snapshot de producto de la revisión anterior; cambiar solo precio no actualiza silenciosamente el nombre/presentación históricos al catálogo actual. Igual regla para etiqueta de categoría si su ID no cambia. Una línea nueva, cambio de producto o de categoría obtiene el snapshot autorizado correspondiente. Se valida la compatibilidad con el producto actual, sin convertir la historia a sus metadatos nuevos. Esta diferencia debe ensayarse con ediciones del catálogo entre dos rectificaciones.

`purchaseDate` es día de calendario ISO validado, sin conversión implícita por zona horaria; `recordedAt` es UTC servidor. `storeName` admite cualquier comercio; `null` es desconocido confirmado y produce «Sin especificar». Fecha vacía/ambigua bloquea confirmar; el borrador puede proponer hoy, visible y revisable. El servidor produce `searchKey` sin fusionar comercios, conserva el nombre mostrado y no impone lista de tiendas.

Compra original: `kind=purchase`, revisión 1, predecesor/motivo nulos. Revisión corregida: `kind=purchaseRectification`, siguiente versión, predecesor exacto y motivo requerido. `confirmed` exige ≥1 línea. `void` es exclusivamente una anulación trazable de registro erróneo propuesta en DP-05 y pendiente de aprobación: líneas vacías, descuento/total cero; conserva fecha/comercio de la revisión anulada para auditoría. No modela devolución comercial ni dinero de vuelta real.

## 4. Dinero, descuentos y facturas ficticias

Precio unitario: `gross = floor((priceCOP*quantityMilli + 500)/1000)` usando `BigInt`. Precio total o servicio/cargo: `gross=priceCOP`; no multiplicar otra vez. `base = gross-lineDiscountCOP`, con descuento entre cero y bruto. Redondear solo ese bruto por línea, antes del descuento; no redondear cantidades ni aceptar diferencias ocultas en el total. Precio desconocido sigue sin resolver; cero requiere revisión explícita, no un reemplazo automático.

Descuento general G: conjunto de líneas elegibles revisado, pesos `w_i=base_i`, `W=sum(w_i)`. Si G>0, exigir W>0 y G≤W. Asignar `floor(G*w_i/W)` y distribuir los pesos restantes a los mayores residuos `(G*w_i)%W`, empate por ID de línea ascendente por código, independiente del locale. Líneas con base cero reciben cero; G=0 admite W=0. El servidor comprueba suma de asignaciones=G, cada asignación≤base y netos≥0. `netPaid=base-share`; `total=sum(netPaid)`, incluyendo cargos visibles. `reviewedTotalCOP` debe coincidir exactamente; no se persiste como fuente paralela.

Los siguientes ejemplos son **ficticios, no ejemplos fiscales ni políticas tributarias aprobadas**. «Impuestos incluidos» solo informa que ya están dentro de los importes; no se agrega otro IVA ni se infiere una tasa. Un impuesto adicional conocido se representa como cargo visible con categoría, sin calcular normativa fiscal. Si descuento/cargo no es representable o está sin resolver, impedir confirmar y pedir revisión manual.

| Ejemplo | Líneas y descuentos revisados | Resultado exacto esperado |
| --- | --- | --- |
| **F-01 Supermercado, compra mixta** | Arroz 2 unidades ×4.200=8.400, descuento línea 400 →8.000; leche 3×3.000=9.000; detergente total 7.000 con descuento 1.000 →6.000. Las tres elegibles. G=2.300 sobre W=23.000. Domicilio 3.000 no elegible | Reparto 800/900/600. Netos 7.200/8.100/5.400 + domicilio 3.000 = **23.700 COP**. Alimentos 15.300, limpieza 5.400, cargos 3.000; impuestos ya incluidos no se añaden |
| **F-02 Cupón con residuo** | Líneas A/B/C con bases 3.333/3.333/3.334. G=1.000. Empate por ID A antes de B | Pisos 333/333/333; peso restante para C por mayor residuo. Asignaciones 333/333/334; netos 3.000/3.000/3.000; total **9.000 COP** |
| **F-03 Fracción y cargo** | Fruta 1.500 kg-escalados a 4.201/kg → bruto 6.302; descuento línea 100 →6.202. Servicio 2.000; G=0; cargo adicional explícito 800 | Total **9.002 COP**, inventario +1.500 kg-escalados; fruta y servicio/cargo se clasifican una vez. Precio efectivo de fruta 6.202 por 1,5 kg, distinto del precio impreso |

Otro borde: dos bases de 1 COP y G=1 empatan; recibe 1 el menor ID. No se usa orden accidental del arreglo. Cupones porcentuales se convierten a un monto COP revisado antes de confirmar; no se inventa su elegibilidad ni se aprueba otro algoritmo de porcentaje.

## 5. Movimientos y rectificaciones trazables

```ts
type MovementComponent = {
  source: 'opening' | 'purchase' | 'purchaseCorrection' | 'reconciliation' | 'adjustment' | 'consumption';
  deltaMilli: number; // entero firmado, magnitud acotada
};
type StockMovement = {
  id: Id; operationId: Id; productId: Id; purchaseId: Id | null; lineId: Id | null;
  kind: 'opening' | 'purchase' | 'rectification' | 'adjustment' | 'consumption';
  beforeStockVersion: Version | null; afterStockVersion: Version;
  recordedAt: ServerTime; reason: string | null;
} & (
  { control: 'exact'; unit: BaseUnit; beforeMilli: QuantityMilli; afterMilli: QuantityMilli; components: MovementComponent[] }
  | { control: 'simple'; before: StockStatus; after: StockStatus; observed: boolean }
);
type StockResolution =
  | { productId: Id; expectedStockVersion: Version; control: 'exact'; observedQuantityMilli: QuantityMilli; reason: string }
  | { productId: Id; expectedStockVersion: Version; control: 'simple'; observedStatus: StockStatus; reason: string };
type RectificationIntent = {
  schemaVersion: 1; kind: 'purchaseRectification'; operationId: Id; purchaseId: Id;
  expectedRevision: Version; reason: string;
  replacement: PurchaseBodyInput | null; // null significa anulación explícita
  newProducts: NewProductSpec[]; stockResolutions: StockResolution[];
};
```

Una entrada física produce un movimiento por línea; una apertura nueva añade su propio movimiento no financiero una sola vez. Una rectificación calcula por producto sobre **la revisión vigente anterior**, no sobre la compra original: `deltaCompra = adquirido_nuevo - adquirido_anterior`, convertidos a la misma base. Cambios solo financieros/categoría/comercio/fecha no tocan stock ni fabrican movimientos. Una rectificación puede agrupar por producto, con trazabilidad a las líneas de ambas revisiones y operación; no cuenta como otra compra.

IDs de movimientos son deterministas y derivados de operación más línea/producto (por ejemplo UUID derivado); no se sortean en el callback. Varios movimientos del mismo producto en un commit encadenan saldos, pero comparten las versiones de stock previa/final del documento: no representan varias escrituras físicas ni versiones intermedias persistidas.

### Alternativas y recomendación DP-05

| Alternativa | Efectos y problema | Decisión propuesta |
| --- | --- | --- |
| Editar original | Pierde evidencia, puede dejar movimientos sin correspondencia | Rechazar |
| Impedir correcciones permanentemente | Conserva integridad técnica, deja errores de uso sin solución | Rechazar como producto definitivo |
| Anular y volver a confirmar por separado | Riesgo de fallo intermedio, stock insuficiente y doble gasto | Rechazar dos confirmaciones independientes |
| Diario de compensaciones puras | Financiero aditivo posible; dificulta reconstruir líneas/precios y explicar versiones | Alternativa válida si se diseñan proyecciones y casos aparte; no elegida |
| **Revisión inmutable completa + deltas atómicos** | Más bytes por corrección, pero conserva contexto, consultas y una interpretación financiera vigente | **Recomendada, pendiente de aprobación y ensayo** |

| Error corregido | Efecto financiero/histórico | Inventario actual |
| --- | --- | --- |
| Precio/descuento | Recalcular bruto, reparto, netos y total de toda la nueva revisión | Sin delta de cantidades |
| Cantidad | Recalcular precio unitario/neto y reparto si corresponde | Diferencia nueva−anterior por producto |
| Producto | Nueva asociación y snapshot autorizado; nuevo producto opcional explícito | Restar al anterior y sumar al correcto atómicamente, sujeto a conciliación |
| Categoría | Mover solo el neto de línea a otra categoría en informes vigentes; conservar clasificación original en auditoría | Sin cambio por reclasificación |
| Establecimiento | Corregir nombre/grupo en la revisión vigente | Sin cambio |
| Fecha | Trasladar la compra completa al periodo del día corregido, no del día de rectificación | Sin cambio |

**Producto ya consumido:** no aplicar inversamente el saldo antiguo. Ejemplo: compra registrada 5 unidades, saldo actual 1 por consumo de 4; se corrige compra a 2. Delta −3 no cabe en saldo 1. No persistir −2, no fingir una reposición y no bloquear para siempre la corrección del gasto. La propuesta solicita conteo actual y motivo; si se confirma que queda 1, una conciliación explícita de +3 acompaña el delta de compra −3, dejando saldo final 1. Es una corrección de consistencia del registro de inventario, no una compra de tres unidades: no altera los consumos históricos ni añade dinero. Auditoría muestra ambos componentes; no se oculta ese ajuste.

Si se rechaza proporcionar la conciliación, esa rectificación queda sin confirmar y con explicación/acción pendiente; precio/fecha/categoría sin delta de stock siguen siendo corregibles. Para dos productos, cada saldo insuficiente necesita su resolución. En sencillo no se puede restar un estado: cualquier corrección que altere adquisiciones físicas de ese producto exige estado observado actual y versión, sin recuperar automáticamente el estado histórico. Corrección puramente financiera no exige inventario nuevo.

Las resoluciones son únicas por producto y solo se aceptan para productos cuyo efecto físico cambia o que se abren en esa operación. También pueden conciliar una diferencia positiva: al cambiar el producto A por B ya consumido parcialmente, contar B evita sumar como disponibles todas las unidades originalmente adquiridas. Una corrección de precio/categoría/fecha no puede incluir ajustes de productos ajenos ni modificar stock a escondidas; para ello existe el comando explícito no financiero. En sencillo, los cambios solo financieros conservan el estado histórico de la línea, sin aplicarlo al estado actual.

Stock exacto final debe satisfacer `after = before + sum(components.deltaMilli) ≥0`; todo saldo persistido y todo `before/after` es válido. El intermedio matemático que motivó conciliación no se guarda como existencia. Cliente no envía componentes: el servidor los deriva de revisión anterior, nueva intención y observación explícita. Cada observación usa `expectedStockVersion`; si cambió durante revisión se rechaza y se vuelve a conciliar, sin reaplicar silenciosamente un conteo obsoleto. No se modifica el modo/base para que una rectificación «pase».

### Almacenamiento, consulta y concurrencia nuevos

Propuesta de rutas, siempre bajo `users/{uid}`:

- `operations/{operationId}`: compra original o revisión completa inmutable, o evento no financiero. El cuerpo `Purchase` es autoridad monetaria. Los originales nunca se borran/reescriben.
- `purchaseHeads/{purchaseId}`: puntero autorizado `{revision, operationId, status, purchaseDate, storeSearchKey, categoryIds, productIds}`. **Sin total financiero**. Proyección reconstruible para elegir versión y buscar; no otra compra ni otro libro de gastos.
- `financialControl/current`: contador monotónico `revision`, incrementado con toda compra/rectificación financiera, sin importes ni catálogo. Permite detectar lecturas de informes que mezclan versiones mientras se pagina.

Índices futuros según consultas aceptadas: heads por fecha/estado y filtros de comercio, categoría o producto; paginación con desempate estable por ID. No proponer un índice compuesto con dos campos array ni prometer todos los filtros simultáneos sin medir consultas. Excluir de indexación los cuerpos grandes de líneas/movimientos y otros campos sin consulta para no multiplicar entradas ni superar sus límites. Índices, tamaño almacenado real y costo de informes necesitan ensayos propios.

Confirmación: leer operación, head ausente, control y D productos; validar todo; crear operación, head y escribir control/productos en una transacción. Estimación explícita: D+3 lecturas y D+3 escrituras, **distinta de D+1 de 04C**. Rectificar: además leer la revisión anterior; D es unión de productos referenciados antes/después, hasta 200 al reemplazar todos los de una compra de 100; W≤D son productos con efectos/aperturas que se escriben. D+4 lecturas y W+3 escrituras orientativas, sin reintentos ni lecturas adicionales del catálogo de categorías. Una corrección solo financiera puede leer metadatos y escribir cero stocks. El contador introduce contención financiera global para una usuaria; se debe medir, no ocultarlo ni confundirlo con el catálogo agregado 04B.

La consulta de informes lee control al servidor antes y después de todas las páginas/heads/versiones: si cambia, reinicia el cálculo o muestra «actualizando», nunca un total definitivo mezclado. Todas las mutaciones que afecten la vista incrementan el control, incluso fecha/categoría sin cambio de dinero. Los originales y revisiones antiguas solo aparecen en auditoría; sumar todos los documentos `kind=purchase*` sería incorrecto. Historial de precios normal usa revisiones vigentes; anular aporta cero y no crea otro punto de precio. Lectura de detalle puede mostrar una revisión identificada sin prometer que sea la última.

Un `expectedRevision` del head evita bifurcaciones: dos correcciones concurrentes no se aceptan sobre la misma base; una pierde y requiere revisión explícita. Reintento idéntico busca primero su operación y devuelve el resultado ya confirmado antes de comprobar revisiones antiguas. El hash servidor cubre todo el comando, incluso aperturas, observaciones y versiones esperadas. Normalización/canonicalización y versión de esquema quedan fijas para reintentos; nunca reasignar IDs dentro del callback. Se deben leer todos los documentos antes de escribir; sin efectos externos repetibles.

Canonicalización propuesta: UUID en minúsculas; textos conocidos con trim y Unicode NFC, sin cambiar mayúsculas/espacios interiores del texto mostrado; fechas ISO exactas; nulos explícitos; enteros seguros en representación JSON normal; claves ordenadas por código y arreglos en su orden original. Hash SHA-256 hexadecimal de los bytes UTF-8 del JSON canónico. La función pura compartida normaliza **antes** de congelar/guardar el pendiente; el servidor aplica la misma versión y vuelve a hashear. Nunca quitar campos desconocidos para «normalizar»: se rechazan. `searchKey`, timestamps, resultados y otros derivados servidor no pertenecen a la intención. Equivalencia navegador/servidor, Unicode, orden y compatibilidad de esquemas necesitan pruebas específicas.

## 6. Lista, resultados y comprobantes

```ts
type ShoppingList = {
  schemaVersion: 1; instanceId: Id; generation: Version; revision: Version;
  name: string; items: { id: Id; label: string; productId: Id | null;
    quantityMilli: QuantityMilli | null; unit: Unit | null; purchased: boolean }[];
  updatedAt: ServerTime; lastCommandId: Id;
};
type OperationResult =
  | { status: 'confirmed'; operationId: Id; intentHash: string; kind: 'purchase' | 'purchaseRectification' | 'nonFinancial';
      purchaseId: Id | null; revision: Version | null; totalPaidCOP: COP | null; recordedAt: ServerTime }
  | { status: 'notFoundAtServer'; operationId: Id; observedAt: ServerTime }
  | { status: 'rejectedAttempt'; operationId: Id; code: 'validation' | 'unauthorized' | 'conflict' | 'limit'; retryable: false }
  | { status: 'unknown'; operationId: Id; code: 'network' | 'timeout' | 'unavailable' };
type PendingOperation = {
  schemaVersion: 1; projectId: string; environment: 'emulator' | 'staging' | 'production';
  uid: Id; operationId: Id; kind: 'purchase' | 'purchaseRectification';
  intent: PurchaseIntent | RectificationIntent; intentHash: string;
  state: 'prepared' | 'sending' | 'unknown' | 'confirmed' | 'rejected';
  preparedAt: string; lastAttemptAt: string | null; attempts: number;
  serverResult: OperationResult | null;
};
```

Lista: una instancia activa, IDs estables, marcas booleanas; cantidad/unidad ambas nulas o conocidas/compatibles. Producto opcional facilita sugerencia, nunca reposición. Generación diferencia una lista nueva de la anterior, aunque la ruta fija sea `shoppingLists/active`. Comandos con operación/versión esperada y snapshot completo; conflicto en lugar de sobrescribir otra pestaña. Finalizar borra contenido activo y avanza control. Retener solo el último ID/hash/resultado de comando en un control sin nombre/items permite confirmar reintento reciente; uno antiguo no reconocido se rechaza por generación/revisión. No se crea un diario permanente de listas dentro de operaciones financieras. Ver [persistencia](PERSISTENCE_POLICY.md).

En `OperationResult`, `unknown` lo produce el adaptador al perder transporte, no una confirmación ficticia del servidor. `notFoundAtServer` es una observación no terminal: un envío aún activo puede confirmar después. `rejectedAttempt` rechaza esa solicitud, no prueba por sí solo que otro envío previo del mismo ID no haya confirmado; antes de limpiar un pendiente incierto se concilia por ID/hash. Un error `aborted`/timeout nunca se transforma automáticamente en rechazo definitivo global. Revocación/UID distinto detiene envíos, sin reasignar el comprobante a otra cuenta.

`PendingOperation` se guarda de forma durable **antes** de enviar. La intención queda congelada; editarla requiere reconciliar primero y una identidad nueva solo cuando sea inequívoco que no se aplicó, o una rectificación de la ya confirmada. `intentHash` local comprueba integridad, pero el servidor recalcula su propio hash y no confía en él. Proyecto, entorno y UID particionan el comprobante; el adaptador solo lo envía al destino configurado coincidente, nunca al indicado libremente por ese registro. No se autoriza desde esos campos ni se transforma un pendiente demo en producción. Comprobante, borrador e imágenes tienen ciclos distintos.

## 7. Cobertura pendiente y adaptación

04C prueba el protocolo base, no este contrato ampliado. Antes de habilitar escrituras reales: esquemas runtime, propiedades del reparto, aperturas no nulas, rectificaciones sucesivas/anulación/consumo, sencillo, control de vistas y paginación bajo cambios concurrentes, lista por generaciones y limpieza privada. Migrar el algoritmo de comparación/hash requiere compatibilidad por `schemaVersion`, no reinterpretar un pendiente antiguo. Los laboratorios siguen intactos, el prototipo no recibe estos tipos y no se ejecutan migraciones.
