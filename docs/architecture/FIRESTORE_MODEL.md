# Modelo Firestore candidato

**Propuesta pendiente (alternativa B). No hay base creada ni escrituras implementadas.** Depende de la viabilidad descrita en [TRANSACTIONS](TRANSACTIONS.md). Las formas de dinero, cantidades y listas necesitan aprobación de DP-02/03/06/13.

## Estructura y decisiones de almacenamiento

```text
users/{uid}                         perfil mínimo
  state/current                     catálogo + inventario actual
  operations/{operationId}          diario inmutable de operaciones
  shoppingLists/active              reservado; deshabilitado inicialmente
```

No se proponen colecciones independientes de gastos, precios o movimientos: serían copias que deben reconciliarse. Productos, categorías y establecimientos son mapas del estado actual; líneas y movimientos son arreglos dentro de la operación. Una referencia es un ID de cadena, sin dependencia del tipo `DocumentReference`. Los snapshots históricos conservan información aunque se edite el catálogo.

Los IDs deben ser aleatorios opacos (por ejemplo UUID), nunca nombres, correos ni números de recibo. Los IDs de líneas se asignan una vez al editar; los de productos nuevos se reservan antes de enviar, de forma estable en cada reintento. Se mantienen las identidades deterministas de movimientos basadas en operación + línea. El formato exacto requiere aprobación técnica, no cambia su semántica.

## Contratos por documento

| Ruta | Campos y tipos propuestos | Relaciones y validaciones | Operaciones permitidas propuestas |
| --- | --- | --- | --- |
| `users/{uid}` | `schemaVersion:int`, `displayName:string`, `createdAt:timestamp` | UID externo de Auth; sin contraseña, roles, autorización editable ni copia de email por defecto | Leer propio; alta inicial controlada; editar solo nombre. No borrar cuenta desde el cliente en V1. |
| `users/{uid}/state/current` | `schemaVersion:int`, `revision:int`, `lastOperationId:string`, `updatedAt:timestamp`, `products:map<ProductId,Product>`, `categories:map`, `stores:map` | Sin historial ni imágenes. Exactamente una revisión más por operación; todos los cambios justificados por diario; campos permitidos cerrados | Leer propio; crear estado vacío mediante inicialización validada; actualizar solo junto con operación válida. No borrar. |
| `users/{uid}/operations/{id}` | `schemaVersion:int`, `kind:enum`, `beforeRevision:int`, `afterRevision:int`, `createdAt:timestamp`, cuerpo específico | `id` de ruta = identidad estable; `afterRevision=beforeRevision+1`; inmutable, operación emparejada con estado | Crear con transición válida. Leer propio. Denegar update/delete. |
| `users/{uid}/shoppingLists/active` | Si se aprueba: `schemaVersion:int`, `revision:int`, `name:string`, `items:list`, `updatedAt:timestamp` | IDs de artículos, texto, cantidad/unidad y booleano comprado; sin importes, saldos, fotos ni enlaces financieros | **Denegado inicialmente**. Si DP-06 aprueba: leer/crear/actualizar propia, delete explícito al finalizar; nunca cambiar estado financiero. |

`Product` contiene nombre, `categoryId`, modo y unidad base. Variante exacta: `quantityMilli:int >=0`, sin campo de estado. Variante sencilla: `status:'available'|'low'|'empty'`, sin cantidad disponible ficticia. El nombre normalizado es una ayuda de búsqueda, no una identidad ni prueba remota de equivalencia semántica.

Categoría: ID y etiqueta. Establecimiento: ID y etiqueta; para desconocido se propone ID reservado `unspecified`, no un comercio inferido. No hay ubicación doméstica. Cambiar catálogo no reescribe snapshots. Crear categorías/establecimientos arbitrariamente no está aprobado: DP-08 define catálogo y edición; inicialmente usar opciones explícitas acordadas.

Operaciones de diario previstas:

| `kind` | Cuerpo | Efecto permitido |
| --- | --- | --- |
| `purchase` | `purchaseDate`, `storeId`, `storeName`, `source`, `lines`, `productIds`, `movements`, `totalPaidCOP`, productos nuevos necesarios | Stock y desembolso canónico. Todas las líneas financieras permanecen en esta operación. |
| `productCreate` | Producto y apertura confirmada, movimiento inicial si corresponde | Alta sin inventar compra/gasto. |
| `productEdit` | ID, cambios de nombre/categoría | Sin modificar unidades/modo con historial hasta aprobar política; sin gasto. |
| `stockAdjust` | Producto, intención suma/consumo/absoluto/estado, referencia previa, movimiento | Stock válido sin efecto financiero. |

No habilitar un `kind` genérico que permita incluir un snapshot arbitrario. Operaciones de catálogo o corrección histórica adicionales requieren contrato y validación propios antes de permitirlas. No se aprueban devoluciones/anulaciones.

## Compra y líneas

Cada línea tiene `id`, `kind:'product'|'expense'`, nombre/categoría históricos, cantidad comprada escalada, unidad presentada, precio, modo de precio, descuento individual y neto verificable. Una línea física incluye `productId`, control/unidad base y efecto sobre existencias. Una línea de servicio **no** tiene producto ni movimiento: el modelo final debe permitir importe total sin exigirle una unidad física ficticia, aunque el prototipo reutilice campos de cantidad (DP-13).

El neto de línea y `totalPaidCOP` son redundancias **verificadas** para lectura; no fuentes financieras independientes. El total es exactamente la suma de netos según DP-02/04; cualquier campo derivado no verificable remotamente se omite, no se acepta por confianza en React. No guardar subtotal por categoría ni acumulado mensual mutable en otra colección.

`productIds` es una proyección única de productos físicos para consulta de precios. Debe coincidir con las líneas, sin IDs extra u omitidos; forma parte de la obligación de validación. Campos de revisión, borrador, object URL y OCR no existen en un confirmado. Precios anteriores no rellenan campos OCR dudosos.

### Ejemplo ficticio de estado

Representación JSON de transporte documental: los timestamps ISO se convertirían a `Timestamp`; no son cadenas en Firestore.

```json
{
  "schemaVersion": 1,
  "revision": 12,
  "lastOperationId": "demo-op-12",
  "updatedAt": "2026-11-21T15:00:00Z",
  "categories": {"food": {"name": "Alimentos"}, "cleaning": {"name": "Limpieza"}},
  "stores": {"shop-demo": {"name": "Tienda del Jardín"}},
  "products": {
    "milk-demo": {"name": "Leche entera", "categoryId": "food", "control": "exact", "unit": "unidad", "quantityMilli": 9000},
    "soap-demo": {"name": "Detergente", "categoryId": "cleaning", "control": "simple", "unit": "unidad", "status": "available"}
  }
}
```

### Ejemplo ficticio de operación

La leche antes tenía 3 unidades; se compran 6 a $4.200 y un detergente a $8.000. Se pagan **$33.200**. El inventario del ejemplo anterior es el resultado, no una segunda fuente del importe.

```json
{
  "schemaVersion": 1,
  "kind": "purchase",
  "beforeRevision": 11,
  "afterRevision": 12,
  "createdAt": "2026-11-21T15:00:00Z",
  "purchaseDate": "2026-11-21",
  "storeId": "shop-demo",
  "storeName": "Tienda del Jardín",
  "source": "manual",
  "productIds": ["milk-demo", "soap-demo"],
  "totalPaidCOP": 33200,
  "lines": [
    {"id": "line-1", "kind": "product", "productId": "milk-demo", "name": "Leche entera", "categoryId": "food", "categoryName": "Alimentos", "quantityMilli": 6000, "unit": "unidad", "priceCOP": 4200, "priceMode": "unit", "discountCOP": 0, "netCOP": 25200},
    {"id": "line-2", "kind": "product", "productId": "soap-demo", "name": "Detergente", "categoryId": "cleaning", "categoryName": "Limpieza", "quantityMilli": 1000, "unit": "unidad", "priceCOP": 8000, "priceMode": "total", "discountCOP": 0, "netCOP": 8000, "stockStatus": "available"}
  ],
  "movements": [
    {"id": "purchase:demo-op-12:line-1", "lineId": "line-1", "productId": "milk-demo", "kind": "purchase", "before": 3000, "after": 9000, "unit": "unidad"},
    {"id": "purchase:demo-op-12:line-2", "lineId": "line-2", "productId": "soap-demo", "kind": "purchase", "before": "low", "after": "available", "unit": "unidad"}
  ]
}
```

Los JSON ilustran campos y aritmética, **no son cargas cuya aceptación por reglas esté probada**. Una compra mixta añadiría una línea `expense` sin `productId`, con neto incluido en el mismo total y sin movimiento. Un gasto independiente es la misma operación con solo líneas `expense`; no se crea un gasto adicional.

## Consultas e índices propuestos

| Necesidad | Consulta | Índice / coste de lectura esperado |
| --- | --- | --- |
| Perfil, inventario, categorías | Lectura puntual perfil + `state/current` | 2 documentos en arranque; búsqueda/filtro local sobre catálogo cargado |
| Compras del mes o rango | `operations`: `kind == purchase`, `purchaseDate >= inicio`, `< siguiente`, orden fecha DESC y ID DESC; páginas de 30 | Compuesto `kind ASC, purchaseDate DESC, __name__ DESC`; leer 10/30 compras, no todo el diario |
| Gasto por categoría/comercio | Agrupar líneas de las compras del mismo periodo con cálculo de dominio | Sin consultas por cada línea ni N consultas por categorías. Cargar todas las páginas del periodo antes de mostrar total definitivo |
| Recientes | Misma consulta, `limit(5)` | No confundir esas cinco compras con gasto mensual completo |
| Detalle / reconciliación | Lectura puntual `operations/{id}` al servidor | 1 documento; no una búsqueda por importe/fecha |
| Historial de precios de un producto | `kind == purchase`, `productIds array-contains id`, orden fecha DESC/ID DESC, límite 20 y cursor | Compuesto `kind ASC, productIds ARRAY, purchaseDate DESC, __name__ DESC`; filtrar líneas de ese producto en cada resultado |
| Movimientos antiguos | Diario por `afterRevision DESC`, paginado | Índice simple `afterRevision`; no necesario para mostrar gasto mensual |

Los nombres de índices son una propuesta que deberá verificarse con consultas reales y, después, entorno no productivo autorizado. El emulador no demuestra todos los índices ni límites de producción. No añadir simultáneamente filtros de array incompatibles. El total filtrado por categoría incluye únicamente sus líneas, no toda la compra.

Exenciones propuestas: mapas `products`, `categories`, `stores`; arreglos `lines`, `movements`; payloads de ajuste/nuevos productos; textos que no se consultan. Mantener únicamente índices de campos de consulta y el arreglo `productIds` acotado. Los descendientes de los mapas no deben generar miles de índices accidentales. No indexar fotos: ni siquiera son campos válidos.

## 5, 50 y 100 artículos: documento o subcolección

| Distribución | 5 líneas | 50 líneas | 100 líneas | Consecuencias |
| --- | --- | --- | --- | --- |
| Compra embebida + estado agregado (B) | 2 escrituras | 2 | 2 | Solo sirve si cabe **cada** documento y se verifica su contenido completo en reglas. No elimina trabajo por línea. |
| Compra embebida + productos separados + movimientos separados (A) | Hasta 11 escrituras | 101 | 201 | Fórmula `1+D+N`, D productos distintos, N movimientos físicos; creación del producto incluida en su write. Reglas raíz no escalan por producto. |
| A más artículos en subcolección | Hasta 16 | 151 | 301 | Añade N escrituras y lecturas de detalle; más relaciones que validar, no resuelve accesos de reglas. |

La operación B crece por las líneas y movimientos; el estado por **todos** los productos actuales. No duplica el inventario entero en cada compra. La comparación asume N líneas físicas distintas; servicios y repetidos cambian D/movimientos, no se deben descartar.

El límite de documento hace necesaria una medición serializada con nombres largos, productos nuevos y metadatos reales; contar artículos no basta. La [guía de tamaño de almacenamiento](https://firebase.google.com/docs/firestore/storage-size) incluye nombres de documentos/campos y tipos; longitud de JSON es solo una aproximación. No se han medido documentos Firestore reales. Para 1.000 productos, estimar 512 bytes/producto da aproximadamente 500 KiB; no es prueba de que cualquier catálogo de 1.000 quepa. Si no cabe, no fragmentar silenciosamente la atomicidad: volver a evaluar DP-07 y el esquema.

Una división en shards fijos podría reducir tamaño del inventario, pero recupera accesos entre documentos, contención por shard y verificación exhaustiva. No se presenta como solución demostrada ni se fija un número arbitrario de shards.
