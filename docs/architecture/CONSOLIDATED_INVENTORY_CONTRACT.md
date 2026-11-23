# Contrato consolidado de inventario — aprobado en el alcance 05C-4

**Contrato aprobado expresamente por el propietario el 23-11-2026, Fase 05C-4**, en el alcance de inventario registrado en [OWNER_DECISION_REVIEW](OWNER_DECISION_REVIEW.md). Revisión `inventory-candidate-v1`, `schemaVersion: 2`; se conserva el identificador para evitar una migración nominal. La implementación mantiene sus ensayos locales y en 05C-6 añadió lectura real autorizada del proyecto de pruebas, sin escrituras. Los máximos técnicos/económicos, la migración antigua y las políticas financieras no quedan aprobados por aceptar el contrato. Los modelos 05C-1 y 04D permanecen como antecedentes incompatibles. La selección de lectura real de 05C-6 es explícita y conserva los límites del proyecto de pruebas; no autoriza despliegue productivo o escritura financiera.

## Modelo normalizado

Ruta: `users/{uid}/products/{id}`, un documento por producto. La identidad del propietario procede de Auth verificada y autorización del servidor/reglas, nunca del cuerpo. No hay catálogo agregado ni ubicaciones.

| Campo | Contrato del candidato |
| --- | --- |
| `schemaVersion` | Literal 2, diferente de `version` |
| `id` | ID estable idéntico a la ruta; ASCII alfanumérico, guion o guion bajo, 1–64 caracteres; altas UI generan UUID |
| `name` | String no vacío, hasta 160 caracteres; guardar sin espacios extremos |
| `presentation` | String opcional representado explícitamente por null; si existe, no vacío, hasta 240 caracteres |
| `categoryId` | Uno de los siete ID estables de la tabla inferior |
| `control` | exact o simple |
| `baseUnit` | unidad, kg o L; no cambia mediante edición ordinaria |
| `stock` | Exacto: solo `{quantityMilli}`; sencillo: solo `{status}` |
| `version` | Entero desde 1; incrementa en toda edición o ajuste confirmado |
| `updatedAt` | Timestamp Firestore; el conversor produce milisegundos Unix enteros en el DTO interno |

Se rechazan claves extra, campos omitidos, arrays en lugar de strings/objetos, IDs distintos de la ruta, números no finitos/no enteros, timestamps inválidos y documentos con esquema diferente. Un documento simple no acepta ningún campo de cantidad. Un exacto no acepta estado. No existen campos opcionales ambiguos con undefined: presentación ausente es null. Los textos de presentación **no son una fuente de conversiones**.

Ejemplo de DTO interno (el campo updatedAt se convierte a Timestamp antes de escribir):

```json
{
  "schemaVersion": 2,
  "id": "producto-ficticio",
  "name": "Arroz de prueba",
  "presentation": "Bolsa 500 g",
  "categoryId": "food",
  "control": "exact",
  "baseUnit": "kg",
  "stock": { "quantityMilli": 250 },
  "version": 1,
  "updatedAt": 1795478400000
}
```

El saldo es **250 g**, porque esa fue la apertura explícita, aunque la presentación diga 500 g. No se deduce un saldo por nombre/envase. Para aproximado se reemplazan control y stock por `simple` y `{status:"low"}`; no aparece una cantidad.

## Categorías aprobadas

| ID | Etiqueta |
| --- | --- |
| food | Alimentos |
| household-care | Aseo del hogar |
| personal-hygiene | Higiene personal |
| pharmacy | Farmacia |
| pets | Mascotas |
| other | Otros |
| unclassified | Sin clasificar |

Otros es una elección consciente de categoría residual; Sin clasificar expresa que aún no se ha decidido y es el valor inicial aprobado cuando no se ha seleccionado categoría. No se crea una pantalla de administración. Se conservan las etiquetas históricas cuando corresponda. No se convierten automáticamente food/cleaning/service del laboratorio. Incluso food requiere decisión explícita en una vista previa de migración. Cambiar la categoría actual no reescribe el diario previo.

## Cantidades, conversiones y estados

- Representación exacta aprobada: entero ×1.000 de la base; unidad contable solo múltiplos de 1.000 y kg/L hasta tres decimales, sin negativos. El máximo de 1.000.000.000 escalados y los demás topes técnicos siguen siendo **de ensayo**, sujetos a revisión específica.
- Entrada de cantidades: `{unit, amountMilli}` con unidad/kg/g/L/ml. Una entrada 250 g viaja como `{unit:"g",amountMilli:250000}` y se convierte a 250 kg-escalados. 1,25 kg corresponde a 1.250; 750 ml corresponde a 750 L-escalados.
- Solo unidad→unidad, kg↔g y L↔ml. No convertir masa/volumen ni contar botellas como litros por su nombre. Gramos/ml fraccionarios no representables en la escala se rechazan; nunca se redondean silenciosamente.
- Envase explícito: `{unit:"package",count:3,content:{unit:"g",amountMilli:500000}}` produce 1.500 kg-escalados. Count es entero y el contenido debe ser positivo, conocido y compatible con la base kg/L. Sin contenido, no convertir. La multiplicación usa BigInt y comprueba rango; no existe unidad «envase» persistida.
- Aproximado: available → Hay suficiente; low → Queda poco; empty → Agotado. Solo estado observado, sin cantidad inventada, umbral ni reposición automática. Base/presentación permiten describir futuras adquisiciones, pero no sustituyen al estado.
- En la UI, cambiar la unidad de entrada borra la cantidad a revisar; cambiar tipo de ajuste restaura la base antes de prellenar un saldo. No reinterpretar un número escrito en gramos como kg o viceversa.

## Comandos y ejecutor confiable

Todos llevan `schemaVersion:2`, `operationId` y `productId`, sin UID, resultado/hash suministrado por cliente o campos financieros:

| kind | Datos y efecto |
| --- | --- |
| create | definition (nombre/presentación/categoría/control/base), opening (quantity o status) y duplicateDecision=reviewed-new. Reserva ID, versión 1, apertura no financiera una sola vez |
| edit | expectedVersion, nombre/presentación/categoría. No acepta base/control/stock |
| adjust | expectedVersion, action=set/add/consume y change con quantity compatible; en sencillo solo set+status |

Validación y cálculo compartidos en el paquete interno `@mi-casa/inventory-contract`, sin SDK ni IO en tiempo de ejecución. El servidor es la autoridad: copia la solicitud, exige autenticación/UID local, limita el JSON a 8 KiB, calcula SHA-256 de intención canónica completa y usa el repositorio transaccional existente. Lee operación y producto antes de escribir producto+diario. Timestamp y versión los calcula en el servidor. El callback es puro salvo el puerto transaccional y puede reintentarse por Firestore.

Diario `users/{uid}/operations/{operationId}`: sobre inmutable de versión 1 y kind=inventoryCandidate, comando con esquema 2, hash, referencia al producto y movimientos. Son versiones de objetos diferentes, sin ambigüedad con el esquema del producto. Apertura registra before=null (el producto no existía), after=cantidad/estado; nunca inventa un estado anterior. Editar metadatos no crea movimiento de stock. No hay total pagado ni gasto. El UID no se almacena como autoridad del comando.

Misma operación/intención confirmada devuelve already-confirmed sin repetir efectos, incluso si después cambió el saldo. Mismo ID con otro contenido produce conflicto. Toda edición/ajuste requiere versión exacta: dos pestañas no se sobrescriben; la segunda revisa y reintenta una operación nueva tras refrescar. Un error de validación, incompatibilidad, negativo o versión no deja escrituras parciales.

## Duplicados y experiencia

La lógica compartida usa nombre normalizado (sin diferencia de acentos/mayúsculas/espacios), presentación, base y tipo de control. Presentación conocida idéntica y control/base compatibles es una sugerencia fuerte; ausencia/diferencia de presentación es dudosa; base/control incompatibles se indican y no se combinan. Se muestran hasta ocho candidatos. No hay fusión, ID derivado del nombre ni unicidad semántica automática.

La creación permite elegir un existente o confirmar «Es un producto distinto; quiero añadirlo». Un similar confirmado puede conservar otro ID y stock independiente. La decisión viaja con la intención, pero es declaración humana, no prueba de identidad física. Se buscan coincidencias en hasta 1.000 documentos, por páginas de 100; si queda cursor se informa que la revisión es parcial y se exige elección explícita. No se promete haber encontrado todo duplicado ni se recorre el historial.

La edición conserva IDs/saldos y no fusiona por cambiar un texto. No se incluyen procesos de fusión de duplicados ya registrados. Nombre/presentación y confirmación humana están aprobados; límites de lectura/costo y criterios técnicos de coincidencia siguen sujetos a medición y ajuste sin cambiar esas reglas funcionales.

## Diferencias resueltas respecto de los antecedentes

| Aspecto | 05C-1 experimental | Propuesta 04D | Candidato 05C-3 probado |
| --- | --- | --- | --- |
| Esquema | Documento plano sin schemaVersion | schemaVersion=1 con product/stock anidados | schemaVersion=2, metadatos raíz y stock discriminado |
| Identidad | Solo en ruta | ID repetido en producto/stock | ID raíz idéntico a ruta |
| Presentación | Ausente | presentationText opcional | presentation string/null |
| Categorías | Tres ID experimentales | Catálogo pendiente, null posible | Siete ID candidatos, unclassified explícito |
| Versión | Una desde 0 | Metadata y stock separados desde 1 | Una versión de registro desde 1 |
| Tiempo | Timestamp | ISO de red/Timestamp | Milisegundos internos/Timestamp con conversores estrictos |
| Validación | Servidor y conversor frontend separados | Tipos documentales no ejecutados | Una implementación portable para ambos |

Se usa una sola versión para simplificar coherencia doméstica y no combinar metadatos/saldo de revisiones diferentes, como parte del contrato de inventario aprobado en DP-07. Puede producir más conflictos que versiones separadas y debe seguir midiéndose. El contrato financiero 04D no queda implementado, aprobado ni automáticamente compatible por compartir nombres de campos.

## Compatibilidad con compras futuras

Una compra futura deberá referenciar el ID estable y la versión/revisión del producto, conservar snapshot histórico de nombre/presentación/categoría/base, convertir su cantidad con el mismo núcleo y confirmar efectos en la misma transacción confiable. Su cantidad adquirida puede guardarse en la historia financiera incluso para un producto simple, sin convertirla en saldo exacto. Apertura se cuenta por separado y no genera gasto.

No se ha implementado esa integración. El ejecutor financiero experimental anterior **rechaza** documentos candidatos; la prueba garantiza que no los modifica por error. Antes de compras reales deben revisarse tipos de referencia/versión, actualizaciones aditivas, estados revisados, descuentos/rectificaciones y demás DP financieras. No sustituir metadataVersion/stockVersion de 04D por version sin revisar ese contrato.

## Migración propuesta, no ejecutada

1. Inventariar formatos/versiones y conservar respaldo original verificable; no borrar ni sobreescribir para que un lector deje de avisar.
2. `previewLegacyMigration` es una función pura: acepta un producto experimental válido, ID de ruta y decisión **explícita por producto** de categoría/presentación; devuelve una vista previa, jamás escribe. Preserva ID, saldo/estado/base y tiempo original para revisión; incrementa la versión propuesta de 0 a 1 (o previa+1). No aprueba una migración por recibir confirmed=true.
3. DP-03/07/08/10 están aprobadas solo para el inventario descrito; **la estrategia de migración y cada correspondencia ambigua requieren aprobación específica**. cleaning no se transforma automáticamente en household-care y service no se transforma en Otros/Sin clasificar. Revisar presentación desconocida como null, no inventarla.
4. Solo en una fase autorizada, preparar un ejecutor específico con copia original inmutable, fingerprint/version esperada e idempotencia por producto; crear archivo de origen+operación y reemplazar el documento **en una transacción**, usando timestamp real de migración. La vista previa no es un comando de escritura listo para enviar.
5. Comparar cantidades/estados/IDs antes/después; no modificar operaciones históricas ni hash de intenciones anteriores. Ante concurrencia/incompatibilidad, detener ese producto, sin conversión parcial silenciosa. Diseñar rollback mediante revisiones nuevas y control de versión, no restaurar un saldo viejo sobre cambios posteriores.

No hay script que aplique migraciones, lote destructivo, borrado de datos ni importación/exportación automática. El lector candidato falla ante formatos anteriores; el perfil histórico explícito conserva el acceso de laboratorio a esos documentos. No se acepta el wrapper 04D como si fuera un producto 05C-1.

## Aprobaciones y entorno

El candidato se usa por defecto en **dev:emulator**. El perfil **dev:emulator:legacy** mantiene las regresiones históricas, sin ser otra propuesta de contrato. Comparten laboratorio/persistencia: si hay documentos anteriores, el candidato avisa; no cambiarlos ni limpiar datos manuales para ocultar la advertencia. Para ensayos reproducibles, las suites arrancan emuladores propios vacíos y solo preparan fixtures ficticios. No ejecutar suites sobre un emulador manual ya ocupado.

Demo sigue en RAM con su modelo anterior; no se presenta como cuenta real. Auth real sigue siendo solo Auth, sin cambios de proveedor/credenciales. En 05C-6 la factoría se compone solo con selección explícita, aprobación independiente y validación de proyecto/base/origen, exigiendo inventory-candidate-v1 con el mismo conversor probado. Auth-only no importa el lector. El propietario confirmó reglas y ACL, y se probó lectura real vacía, recarga, desconexión/recuperación, logout y ruta protegida sin escrituras/Functions. Ver FASE_05C_6; las operaciones administrativas se atribuyen al propietario, no a una inspección Admin independiente. El UID real no se publica. En 05C-4 se autoriza únicamente al propietario a crear manualmente Firestore Standard/Native, `(default)`, us-east1 en mi-casa-camilo-test, Spark y deny-all. La evidencia posterior está en FASE_05C_5/05C_6: el propietario confirmó creación, configuración y publicación de reglas/ACL. Codex conectó únicamente el lector autorizado y verificó el acceso; no creó productos/datos, activó Blaze o desplegó servicios.

Pendiente: máximos técnicos/económicos, estados por defecto en futuras compras, compatibilidad financiera, estrategia de migración y mapeos antiguos, medición de consultas/coincidencias y condiciones de habilitación de lectura. Las reglas funcionales de unidades/envases/estados, versión/arquitectura de inventario, catálogo/default y duplicados sí están aprobadas con el alcance registrado. DP-01/02/04/05/06/09/11/12/13 no reciben una nueva aprobación. La política de retención y las demás condiciones productivas conservan sus aspectos pendientes.
