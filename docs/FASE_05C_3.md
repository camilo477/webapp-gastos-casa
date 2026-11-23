# Fase 05C-3 — Contrato candidato consolidado del inventario

Fecha: 23-11-2026. Base: `38933ec71900bc36715c117d1d0f8dbbcb9da675`, rama `main`.

**Implementado y probado exclusivamente en local.** Existe un único candidato ejecutable: `inventory-candidate-v1`, con productos y comandos `schemaVersion: 2`. Publicarlo no aprueba decisiones pendientes ni habilita Firestore real. No se crearon bases, activó Blaze, desplegaron servicios, conectaron datos reales o iniciaron fases posteriores.

## Contrato candidato probado

La [especificación consolidada](architecture/CONSOLIDATED_INVENTORY_CONTRACT.md) define un documento por producto en `users/{uid}/products/{id}`: ID estable coincidente con la ruta, nombre, presentación string/null, categoría estable, control, unidad base, stock discriminado, versión del registro y Timestamp del servidor. No hay ubicaciones.

- Exacto: base unidad/kg/L, entradas unidad/kg/g/L/ml y conversiones exclusivamente compatibles. Cantidades enteras escaladas ×1.000, sin negativos ni redondeos silenciosos. Las unidades individuales son enteras; kg/L admiten tres decimales. Los límites numéricos siguen siendo de ensayo.
- Envases: conteo entero y contenido positivo explícito, compatible con kg/L. Nombre y presentación nunca determinan automáticamente cantidades. Una bolsa cuya presentación diga 500 g puede tener una apertura observada de 250 g.
- Aproximado: solo Hay suficiente / Queda poco / Agotado. No tiene cantidad escondida, umbral automático ni conversión del estado a un saldo numérico.
- Categorías: food, household-care, personal-hygiene, pharmacy, pets, other y unclassified. Otros y Sin clasificar son elecciones diferentes; el formulario propone Sin clasificar por defecto.
- Apertura: registra existencia inicial sin gasto. Edición: nombre/presentación/categoría, conservando ID/control/base/stock. Ajustes: establecer/añadir/consumir cantidades, o establecer estado sencillo. Toda modificación confirmada incrementa una versión de registro única.

## Implementación y arquitectura

El paquete interno TypeScript `functions/packages/inventory-contract` se importa como `@mi-casa/inventory-contract` desde React y el servidor. Contiene validadores estrictos, tipos, cálculo, conversores, sugerencias, serialización canónica y vista previa de migración; no importa Firebase, Admin ni realiza IO en ejecución. Ambos lockfiles incorporan únicamente esta dependencia local, sin actualizar dependencias externas.

El preflight compila el paquete antes de desarrollo, comprobaciones y pruebas. Su constructor usa hash de fuentes/configuración/compilador y reemplazos atómicos, evitando reescribir módulos idénticos durante otra sesión Vite. El empaquetado `npm pack --dry-run --offline` comprobó los seis archivos esperados, sin publicar un paquete. Los compilados permanecen ignorados.

`functions/src/application/inventory-candidate.ts` reutiliza el repositorio transaccional confiable y el adaptador de errores. La nueva callable local `mutateInventoryCandidate` exige identidad Auth y UID del laboratorio antes de acceder al repositorio; no acepta un UID en el cuerpo. Valida el comando y su tamaño, calcula SHA-256 de la intención completa, consulta operación/producto antes de escribir y confirma producto más diario de forma atómica. El servidor asigna tiempo y versión.

La misma operación con la misma intención devuelve already-confirmed sin repetir el efecto. Otra intención con ese ID genera conflicto. Las versiones impiden sobrescrituras entre pestañas. Documentos antiguos o malformados se rechazan sin repararlos silenciosamente. El diario conserva su sobre versión 1, kind inventoryCandidate y comando versión 2; son objetos con versiones distintas. Apertura tiene before=null; editar metadatos no fabrica un movimiento de existencias ni un gasto.

`src/adapters/firebase/inventory-candidate-reader.ts` recibe Auth/Firestore ya configurados. Lee productos propios por páginas de 100 y cursor por ID, filtra por categoría y busca nombre/presentación por lote; no consulta el historial. Valida todos los documentos y comprueba identidad antes/después de las lecturas. Descarta respuestas de sesiones anteriores y permite liberar el cliente. No tiene escritura, caché offline ni fallback al modelo antiguo o a seed.ts.

`src/adapters/firebase/inventory-candidate.ts` solo compone ese lector con Authentication/Firestore/Functions Emulator, proyecto demo y puertos locales comprobados. Las modificaciones pasan por la callable y solo muestran confirmación después de su respuesta válida. Se conserva el reintento del mismo comando ante respuesta perdida. Un error de contrato/permisos/conexión no se transforma en datos demo ni en guardado confirmado.

La preparación futura `inventory-read-test.ts` exige ahora el mismo candidato y conversor, pero **conserva el bloqueo incondicional anterior antes de obtener cualquier servicio SDK**. Ni variables de entorno ni una aprobación de Auth retiran ese bloqueo. No está conectada a las rutas reales.

## Interfaz y productos repetidos

Se reutilizan ProductForm, StockForm, LocalInventoryPage y las filas existentes. Solo el perfil candidato añade presentación opcional, catálogo de siete categorías, cantidades en unidades compatibles/contenido explícito y revisión de coincidencias. Mantiene colores, tipografía, botones y pantallas aprobadas; no muestra versiones/esquemas ni opciones técnicas a la usuaria.

Las sugerencias consideran nombre normalizado, presentación, unidad base y tipo de control. La usuaria puede usar un producto existente o confirmar uno distinto; nunca se fusionan productos ni se toma el nombre como ID. Se muestran hasta ocho coincidencias tras revisar como máximo 1.000 productos. Una búsqueda incompleta se identifica y exige elección explícita; no garantiza ausencia de duplicados. Un fallo al revisar coincidencias permite reintentar y bloquea la creación hasta completar esa revisión.

Se conservaron carga, vacío, errores comprensibles, guardado pendiente, conflicto y recuperación mediante recarga/reintento. El lector candidato retira productos ante errores y bloquea añadir mientras el contrato no pueda leerse. Elegir un producto existente lleva el foco al formulario de existencias; cerrar devuelve el foco al control de origen. Cambiar la unidad borra la cantidad a revisar; cambiar de tipo de ajuste restaura la base antes de prellenar el saldo, evitando reinterpretaciones de gramos como kg.

## Compatibilidad y migración propuesta

05C-1 tenía documentos planos sin versión de esquema, tres categorías, sin presentación y versión desde 0. La propuesta 04D usaba un wrapper product/stock, versión de esquema 1 y versiones separadas de metadatos/saldo. Ninguno se acepta como si fuera el candidato 2. La comparación completa está en la especificación consolidada.

`npm run dev:emulator` usa el candidato. `npm run dev:emulator:legacy` conserva explícitamente el comportamiento histórico para su regresión y lectura del laboratorio anterior; no es otro candidato activo ni una migración. Ambos perfiles apuntan a la misma base local: no deben mezclarse sus documentos. Ante datos anteriores se informa incompatibilidad, sin borrar o convertir automáticamente. Las suites arrancan emuladores propios con fixtures ficticios y no deben ejecutarse sobre una sesión manual ocupada.

`previewLegacyMigration` solo produce una vista previa pura de un documento experimental válido. Exige revisar categoría y presentación por producto, preserva ID/base/saldo/estado y tiempo de origen para la comparación, y propone una versión nueva. Incluso food requiere revisión; cleaning/service no se mapean por inferencia. No hay comando de migración, importación automática ni escritura de esa vista previa.

Una migración posterior requiere aprobación específica: contrato y mapeos, archivo inmutable del origen/fingerprint, versión esperada, idempotencia, validación y reemplazo transaccional por producto con tiempo de migración. No debe reescribir diarios previos. La recuperación propuesta usa nuevas revisiones comprobadas, evitando restaurar saldos viejos sobre cambios posteriores. No se implementó ni ejecutó esa migración.

Las compras futuras deberán referenciar ID/revisión, conservar snapshot histórico y convertir cantidades con el mismo núcleo dentro del ejecutor confiable. La cantidad comprada de un aproximado podrá existir en el historial financiero sin convertirse en stock exacto. **Esa integración no se implementó:** el ejecutor financiero experimental rechaza documentos candidatos y conserva sus pruebas anteriores. La diferencia entre version y metadataVersion/stockVersion de 04D requiere revisión explícita antes de adaptar compras.

## Seguridad y separación

- Demo conserva su modelo ficticio en memoria, sin inicialización ni solicitudes Firebase. No migra a la cuenta autenticada.
- Emulador usa únicamente Auth/Firestore/Functions locales, UID ficticio autorizado y reglas existentes: lecturas autorizadas, escrituras directas denegadas. No se abrieron reglas temporalmente.
- auth-test conserva Authentication real sin cambios de proveedor, credenciales o rutas. No se inspeccionó, modificó ni publicó `.env.auth-test.local`; se comprobó su exclusión con git check-ignore.
- Las reglas candidatas de lectura futura siguen probándose en Firestore Emulator con ACL administrativa ficticia. No se publicaron reglas/ACL ni UID personal. El frontend no reemplaza la autorización del servidor y las reglas.
- Producción y Firestore real siguen bloqueados. No hay Functions desplegadas, inventario real, OCR, ubicaciones o compras financieras remotas.

## Pruebas ejecutadas

| Suite | Resultado |
| --- | --- |
| TypeScript React y build | Correctos; npm run build incluye comprobación de tipos |
| TypeScript/build servidor y paquete compartido | Correctos con Node 24 |
| Unitarias/componentes/configuración/adaptadores React | 168 correctas, 18 archivos |
| Unitarias servidor | 26 correctas, incluidas 11 del candidato |
| Candidato con Authentication/Firestore/Functions Emulator | 9 correctas |
| Playwright candidato | 14 correctas |
| Reglas futuras de lectura, Firestore Emulator | 16 correctas |
| Lectores SDK con Auth/Firestore Emulator | 5 correctas, incluidos 2 recorridos del candidato |
| Regresión servidor 05C-1/05A con tres emuladores | 34 correctas |
| Playwright inventario histórico 05C-1 | 16 correctas, mismas expectativas anteriores |
| Playwright autenticación | 24 correctas |
| Reglas deny-all auth-test | 4 correctas |
| Playwright demo/regresión | 144 correctas; una omisión histórica del zoom real headless |

El candidato comprueba aperturas, fracciones, g/kg y ml/L, envases conocidos, rechazo de conversiones incompatibles/unidades fraccionarias/negativos, estados simples sin cantidades, edición de presentación/categoría, IDs distintos para nombres repetidos, elección humana, concurrencia sobre un producto, disputa de creación del mismo ID, idempotencia y respuesta perdida. Documentos malformados/05C-1/04D se rechazan sin escrituras parciales; el ejecutor anterior no modifica productos candidatos.

Con fixtures de **100, 500 y 1.000 productos** se recorren todas las páginas y se busca el último producto por nombre/presentación, sin historial de operaciones. Esto valida funcionalidad y tamaño de ensayo, no establece un benchmark ni una garantía de costos de producción. Las sugerencias tienen el límite explícito descrito arriba.

Playwright verifica 360/390/430/768 px, texto al 200 %, teclado/foco, axe y ausencia de desbordamiento horizontal, incluso con nombre de 160 y presentación de 240 caracteres continuos. La regresión demo cubre también otras anchuras y texto al 100 %. Permanecen los recorridos de recarga, protección de rutas, cierre/reinicio de sesión, aislamiento de identidad y ausencia de solicitudes externas en demo. No equivale a pruebas manuales con la usuaria, dispositivos móviles nativos o lectores de pantalla.

Comandos ejecutados: npm run build, npm test, npm run typecheck:server, npm run test:server, npm run test:inventory:candidate, npm run test:inventory:read, npm run test:inventory:emulator, npm run test:auth:emulator y npm run test:e2e. Las suites con puertos compartidos se ejecutaron secuencialmente y detuvieron sus emuladores al terminar. Compilados, capturas, logs y resultados permanecen ignorados y fuera del commit.

## Problemas encontrados y revisión

Se corrigió la posible reinterpretación de una cantidad al cambiar de acción/unidad del formulario, el foco al elegir un producto existente y el ajuste de palabras largas. Los documentos candidatos inválidos reciben un error de revisión, sin permitir que un ajuste ordinario los repare. Una aserción nueva esperaba el mensaje literal, pero la respuesta callable recibida por el SDK añadía el sufijo de transporte [400]; se corrigió para comprobar el código de negocio y su estado sin retirar el caso de rechazo.

Gemini CLI se intentó como revisor independiente de solo lectura, sin archivos privados. Devolvió indisponibilidad 503 y no completó la revisión en el límite de 50 segundos; se continuó con revisión propia, diff y pruebas. No se presenta como revisión efectiva de Gemini ni se reintentó reiteradamente.

## Decisiones pendientes y límites

**DP-03:** precisión/límites, contenido explícito de envases y estados/defaults. **DP-07:** forma/versiones del contrato, coherencia con compras, migración, costo de búsquedas/lecturas y habilitación de servicios. **DP-08:** catálogo, Sin clasificar por defecto y mapeos del esquema anterior. **DP-10:** presentación, criterios/límites de coincidencias y confirmación humana. Las demás DP conservan sus aspectos no aprobados.

La versión única simplifica la consistencia, pero puede generar más conflictos que versiones separadas. Las páginas no garantizan un snapshot atómico global; buscar por fragmento o sugerir puede recorrer muchos documentos. No hay fusión de productos ni migración aplicada. El contenido por envase sirve para esa operación y no constituye un catálogo aprobado de equivalencias de presentación.

Para Firestore real siguen faltando aprobación del contrato/migración, autorización para crear base/región, reglas y ACL activas verificadas, autorización de lectura e integración posterior revisada que retire el bloqueo. Las escrituras necesitan un ejecutor real autorizado y desplegado en otra fase. No se probó ninguna conexión Firestore real en 05C-3 y no se afirma compatibilidad financiera completa o preparación de despliegue productivo.

El alcance termina en 05C-3. No se autoriza ni inicia otra fase.
