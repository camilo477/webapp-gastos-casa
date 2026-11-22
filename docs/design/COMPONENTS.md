# Mi Casa — Componentes para el prototipo posterior

Estado: especificación ajustada de Fase 02, conservando la identidad aprobada provisionalmente. **No son componentes React implementados**, contratos de datos definitivos ni una nueva arquitectura de negocio.

Referencias: [sistema de diseño](DESIGN_SYSTEM.md), [recorridos](UX_FLOWS.md), [requisitos](../REQUISITOS.md) y [reglas](../REGLAS_NEGOCIO.md). El HTML/CSS de [la vista previa](../../design/preview/index.html) materializa la apariencia, sin lógica ni dependencias.

## 1. Límites de responsabilidad

Los componentes presentarán información y comunicarán intenciones. El formato visual no decide identidad de productos, asignación de descuentos, conversiones, persistencia, autorización ni atomicidad. Esas decisiones se resolverán posteriormente según las DP vigentes.

Las entradas enumeradas abajo son conceptuales. No fijan nombres de propiedades TypeScript, colecciones Firebase ni una biblioteca propia. Reutilizar patrones pequeños y composición; evitar un componente universal con decenas de opciones que mezcle inventario y contabilidad.

En React, separar las páginas que coordinan tareas de los controles de presentación. Usar HTML semántico primero y añadir ARIA solo cuando aporte información que el elemento nativo no expresa.

## 2. Estructura y navegación

| Componente propuesto | Responsabilidad y contenido | Accesibilidad y variantes |
| --- | --- | --- |
| `AppShell` | Cabecera, contenido principal y navegación. Ancho máximo y espaciado compartidos. | Un `main`, enlace de salto y navegación antes del contenido en el DOM; se reserva espacio si está fija. La variante de tarea no incluye barra principal. |
| `Brand` | Marca provisional, símbolo y nombre Mi Casa. | Nombre visible, SVG decorativo oculto al lector; enlace a Inicio. No necesita imagen externa. |
| `PageHeading` | Título, explicación breve y contexto opcional. | Un `h1` por pantalla; subtítulos posteriores sin saltos arbitrarios. Texto adaptable. |
| `BottomNavigation` | Inicio, Inventario, Mi lista y Gastos fuera del registro. | `nav` etiquetado; icono y texto, `aria-current`. Fija solo con espacio suficiente en relación con el texto; en flujo si falta. Sin partir nombres, esconder destinos ni reducir letra. |
| `PurchaseContextNavigation` | Volver y paso actual en elección/captura/revisión. | No ofrece salidas directas por Inicio o navegación global. Con cambios, Volver requiere confirmación ajustada al estado de envío en el prototipo futuro. El ejemplo solo enlaza la muestra visual. |
| `SectionHeading` | Título de grupo y acción relacionada cuando sea necesaria. | `h2`/`h3` según contexto; acciones con área suficiente. Se apila al faltar espacio. |

No crear un menú adicional de administración ni un sidebar obligatorio en escritorio. La marca y el encabezado no incluyen un avatar que sugiera cuentas o colaboración inexistentes.

## 3. Controles básicos

| Componente propuesto | Entradas conceptuales | Estados y comportamiento esperado |
| --- | --- | --- |
| `Button` | Texto, icono opcional, variante, tamaño y disponibilidad. | Principal, secundario, suave y destructivo; reposo, foco, hover, pulsado, bloqueado y ocupado. Sin disparos duplicados. No usar flechas decorativas. |
| `TextAction` | Acción breve y nombre del elemento al que afecta. | Editar, Revisar, Quitar o Actualizar; objetivo de 48 px como mínimo. El nombre accesible incluye producto. |
| `TextField` | Etiqueta, valor, ayuda, error y modo de entrada. | Etiqueta persistente, 56 px de alto de referencia, `aria-invalid`/`aria-describedby` cuando proceda. No depender del placeholder. |
| `SearchField` | Etiqueta, consulta y estado de resultados. | Búsqueda visible con icono decorativo. Diferenciar sin resultados y carga fallida. No afirmar coincidencia por solo texto. |
| `SelectField` | Etiqueta, opciones y selección. | Categoría, unidad, establecimiento y periodo. El valor debe ser completamente legible al ampliar letra; no recortarlo silenciosamente. En esta maqueta inactiva se muestra un valor multilínea junto al select nativo, sin duplicación accesible; no copiar un espejo estático en un selector productivo. |
| `ChoiceGroup` | Pregunta, opciones y selección única. | Estados del inventario mediante `fieldset`, `legend` y radios con etiquetas amplias. No tres botones que permitan selección contradictoria. |
| `CheckboxRow` | Nombre, marca y descripción. | Toda la etiqueta es activable; estado nativo y texto Pendiente/Comprado. Desmarcar es posible en el prototipo posterior. No cambia stock ni gasto. |
| `MoneyText` | Importe ya validado y moneda. | COP, cifra legible y numeración tabular. La cifra permanece unida; puede saltar entre símbolo, cifra y moneda. No transforma desconocido en cero ni implementa redondeo. DP-02 pendiente. |
| `QuantityText` | Cantidad y unidad conocidas o estado sencillo. | Unidades compatibles y formato legible; sin inventar presentación o equivalencias. DP-02/DP-03 pendientes. |
| `StatusLabel` | Texto, icono y tono semántico. | Cantidad/Estado, procedencia, duda o disponibilidad. Texto siempre visible; icono decorativo si lo repite. |

En el catálogo HTML, los campos están en solo lectura, los selectores y marcas están deshabilitados y las acciones no se ejecutan. El prototipo real necesitará controles operables, validación y gestión de eventos; nada de eso se considera construido aquí.

## 4. Presentación de información

| Componente propuesto | Contenido | Restricciones |
| --- | --- | --- |
| `MonthlySpending` | Periodo, total en COP y acceso a Gastos cuando corresponda. | Una cifra principal; sin presupuestos ni comparación porcentual inventada. Distinto de un estado sin cargar. |
| `QuickAccess` | Inventario y Mi lista desde Inicio. | Enlace con icono y texto; no una tarjeta por funcionalidad secundaria. |
| `PurchaseRow` | Establecimiento, fecha e importe confirmado. | En el prototipo podrá abrir el detalle. No anunciar que contiene una foto conservada. |
| `PurchaseHistory` | Conjunto de compras confirmadas y estado de consulta. | Vacío, cargando, error y datos. No sumar líneas como gastos adicionales. |
| `InventoryRow` | Nombre, categoría, cantidad o estado y Actualizar. | Lista con separadores. Control exacto muestra Cantidad; sencillo muestra Estado. Sin umbrales automáticos ni recomendaciones. |
| `CategorySpending` | Categoría e importe neto atribuido. | Barras decorativas complementarias, ocultas al lector si duplican datos. Los importes suman el total del mismo conjunto. |
| `PurchaseMetadata` | Fecha y establecimiento revisables. | Separar fecha de compra de guardado técnico. Política de dato desconocido pendiente DP-09. |
| `PurchaseDetail` | Líneas históricas, cantidades, presentaciones e importes. | Lectura de información estructurada; edición posterior pendiente DP-05. No fotografías ni OCR íntegro. |
| `PriceHistory` | Adquisiciones pasadas de un producto con contexto. | Reutilizar filas y formato monetario. No comparar unidades incompatibles; semántica pendiente DP-12. No exige un gráfico nuevo. |

Las barras de categoría de la maqueta son proporciones ilustrativas de datos ficticios conciliados. No contienen un cálculo dinámico ni un informe de backend. Márgenes e iconos se acotan sin impedir que la tipografía aumente; distribución amplia y navegación dependen de consultas de contenedor relativas a su texto.

## 5. Componentes de registro y revisión

### `PurchaseMethodChoice`

Dos opciones de tarea: foto del recibo y registro manual, cada una con descripción breve. «Elegir una foto» es alternativa secundaria a abrir cámara, no un requisito de subir documentos remotamente.

En la pantalla futura de captura, mostrar imágenes temporales del mismo recibo, añadir o retirar una y comenzar la lectura. No conectar cámara ni procesar archivos en Fase 02. Límites y memoria requieren DP-07.

### `PurchaseLineRow`

Entradas conceptuales: nombre, producto asociado si existe, cantidad comercial, presentación, precio unitario conocido, importe de línea, procedencia y necesidades de revisión. Acciones: Editar/Revisar y Quitar.

| Variante visual | Etiqueta | Comportamiento previsto |
| --- | --- | --- |
| Detectada sin impedimento señalado | Recibo + «Leído del recibo» | Permite editar; no significa acierto garantizado. |
| Dato pendiente | Triángulo + «Por revisar» y descripción | Fondo cálido, borde identificable y prioridad de revisión. Impide guardar cuando afecta datos necesarios. |
| Nueva línea manual | Lápiz + «Añadido a mano» | Aspecto neutro; no se presenta como error. |

Procedencia y revisión deben representarse por separado en el futuro modelo del formulario: una línea detectada puede corregirse sin perder su origen; una línea manual también puede quedar incompleta. La variante Por revisar tiene prioridad visual y nunca depende solo del color.

No borrar dos líneas por similitud sin confirmación. No introducir efectos de stock al renderizar o editar una fila.

La revisión usa ahora una fila con `details/summary`: el resumen contiene estado, nombre, cantidad e importe; «Ver y editar» permite desplegar precio/explicación y las acciones. No anidar botones dentro de `summary`. La expansión nativa funciona con teclado y conserva los datos esenciales a la vista. No virtualizar, paginar o reducir tamaño de texto por defecto solo para comprimir 50 productos.

### `ReviewCounters` y `ReviewViewFilter`

El resumen muestra total de artículos, reconocidos del recibo y pendientes de corrección, con una nota de que estos últimos son un subconjunto. Las adiciones manuales se distinguen de procedencia OCR; una línea manual también podría necesitar revisión en el prototipo posterior.

El filtro ofrece Todos y Por revisar con sus cantidades. Afecta solo a la vista, nunca a la pertenencia de artículos ni al total. En esta entrega se representan mediante enlaces entre dos HTML del mismo ejemplo; no se usan roles de pestañas con interacciones de teclado que no estén implementadas. Ambos estados conservan establecimiento, total y Añadir producto.

El ejemplo grande usa 50 productos, 47 reconocidos, 3 manuales y 6 pendientes; total $435.600. En el futuro, un filtro sin pendientes debe explicar el resultado y ofrecer Todos/resumen, sin confirmar automáticamente la compra. Conservar filtro, foco y posición al volver del editor sigue siendo comportamiento de prototipo pendiente, no recuperación de borrador implementada.

### `PurchaseLineEditor`

Pantalla breve o región dedicada a una línea. Campos progresivos: buscar/elegir producto, crear si no existe, cantidad, presentación necesaria y precio o importe de línea. Categoría y modo aparecen cuando se crea un producto, sin forzar definición repetida de productos existentes.

El ejemplo auxiliar muestra una caja de leche de 1 L elegida explícitamente. No debe usarse ese valor como supuesto para todos los recibos. Mostrar importe de línea y precio unitario con etiquetas diferentes. Si solo se conoce el importe de línea, permitir esa base sin generar un unitario falso.

Salida «Listo, volver a la compra» modifica el borrador; no confirma la compra completa. Cancelar la edición mantiene lo anterior. Después de volver, restaurar el foco y la posición de la línea. La fuente de datos futura seguirá condicionada a DP-02/DP-03/DP-10/DP-12.

### `MissingPurchaseProductForm`

Muestra específica para lo no detectado, disponible también tras un reconocimiento sin errores. Reutiliza búsqueda de productos y un bloque Crear producto nuevo que se despliega solo si hace falta. Luego muestra cantidad, unidad, precio y «Guardar artículo en la compra», sin confundir este paso con Guardar compra.

El bloque de creación contiene nombre, categoría y control por cantidad o estado, según las reglas por acordar; no calcula ni presupone saldo inicial. El ejemplo selecciona kilogramo, cantidad 0,5 y precio $9.800 por kg, con importe ilustrativo $4.900. No se implementa búsqueda, alta ni guardado real. Los controles de muestra mantienen etiquetas visibles y el bloque desplegable puede explorarse con teclado.

### `ProductPicker`

Permite buscar productos existentes y decidir la coincidencia por nombre y presentación; incluye una salida explícita de creación. Una sugerencia no se guarda como asociación definitiva sin decisión de la usuaria cuando hay duda. No incluye fusión ni aprendizaje de alias por defecto.

### `PurchaseSummary`

Recibe importes ya interpretados, diferencias e impedimentos para confirmar. Muestra total, comparación con recibo si se conoce, Añadir producto y Guardar compra en el contexto adecuado. No calcula reparto de descuentos dentro del componente visual.

La acción Añadir producto sigue visible aunque haya un dato dudoso y aunque no lo haya. La cabecera muestra comercio, fecha editable, total y contadores. El botón Guardar explica su bloqueo cerca de sí mismo. El resumen final conserva el total de todas las líneas aunque el filtro solo muestre pendientes. No usar un pie flotante que tape artículos o compita con texto ampliado.

### `ReviewJumpLinks`

Enlaces visibles a Añadir producto y al total/confirmación final desde arriba. En la muestra larga, acceso al total después de cada diez productos; la cifra no fija un límite del recibo. El destino tiene encabezado y foco de fragmento posible. Ir al total nunca activa Guardar ni omite validaciones. No agrega lógica de negocio ni una barra persistente de altura creciente.

### `InventoryUpdateForm`

Dos variantes excluyentes según el producto: «¿Cuánto hay ahora?» más unidad, o tres radios de estado. Mostrar el valor anterior y explicar que no registra gasto. No cambiar unidad, modo o saldo inicial automáticamente. Revalidar ante modificaciones concurrentes en la fase correspondiente.

## 6. Lista temporal

`ShoppingList` agrupa título de lista activa, pendientes, comprados, Añadir producto y Finalizar y descartar. Reutiliza `CheckboxRow` y `Button`; no necesita un componente de recomendaciones ni archivo de listas.

`FinishListConfirmation` explica que desaparecerán los artículos, también los pendientes, y ofrece Seguir con mi lista como salida clara. Si se implementa como diálogo, debe recibir foco, limitarlo al diálogo mientras esté abierto, permitir cancelación por teclado y devolverlo al control de origen. La maqueta muestra solo su contenido estático; no ha implementado un diálogo ni un focus trap.

Persistencia entre sesiones y nombre editable de la lista no se deducen del ejemplo. El nombre ficticio solo permite evaluar cómo se verá una lista activa. DP-06 sigue pendiente.

## 7. Mensajes y estados

| Componente | Propósito y contrato de experiencia |
| --- | --- |
| `EmptyState` | Explicar ausencia conocida de productos, compras o lista y ofrecer una acción adecuada. No sustituye error de carga. |
| `InlineNotice` | Título, explicación y posible siguiente acción. Tonos informativo, advertencia o error con texto e icono. |
| `ReceiptProcessingStatus` | Espera indeterminada y alternativa manual. Sin porcentaje ficticio ni animación obligatoria. |
| `SaveStatus` | Distinguir sin enviar, guardando, éxito comprobado, fallo comprobado e incertidumbre. El estado lo comunica una capa de tarea futura, no se deduce de un temporizador. |
| `ErrorSummary` | Agrupar errores que bloquean un formulario y enlazar campos cuando haya varios. No borrar entradas correctas. |
| `DiscardConfirmation` | Confirmar pérdida de un borrador o lista con mensajes ajustados al momento; salir durante envío no promete anulación. |

La confirmación de compra sin guardar ya tiene muestra específica: Seguir revisando y Descartar compra y salir, con explicación de artículos y fotos que se perderían antes de enviar. El estado durante envío tiene mensaje separado de resultado por comprobar. Los ejemplos no interceptan navegación, no implementan un diálogo modal ni recuperan datos. El prototipo futuro deberá tratar foco, cancelación y salida real según DP-06.

Progreso y éxito futuros: región `role="status"` con anuncios moderados. Un error relevante puede usar alerta cuando aparece; no envolver todos los elementos del catálogo en `role="alert"`. Reutilizar los textos y distinciones definidos en [UX_FLOWS.md](UX_FLOWS.md#6-guardado-falta-de-conexión-y-salida).

## 8. Relación con el HTML de referencia

| Patrón CSS | Componente o grupo orientativo |
| --- | --- |
| `.app-shell`, `.app-header`, `.app-main`, `.bottom-nav` | Estructura, marca y navegación. |
| `.btn`, `.btn-secondary`, `.btn-soft`, `.btn-danger`, `.text-btn` | Botones y acciones. |
| `.field`, `.input`, `.select-wrap`, `.search-wrap` | Campos, selectores y búsqueda. |
| `.panel`, `.record-list`, `.record` | Agrupación y filas históricas. |
| `.inventory-list`, `.inventory-item`, `.quantity` | Inventario. |
| `.review-list`, `.review-item`, `.needs-review`, `.line-price` | Líneas de compra. |
| `.badge`, `.notice`, `.empty-state` | Etiquetas y estados. |
| `.receipt-meta`, `.review-footer`, `.total-line` | Metadatos y resumen. |
| `.list-row`, `.radio-choice` | Lista y estados sencillos. |
| `.monthly`, `.category-list`, `.category-bar` | Gasto principal y categorías. |
| `.context-nav`, `.task-shell` | Navegación contextual y registro sin barra global. |
| `.review-overview`, `.review-counts`, `.review-filter` | Cabecera, contadores y vistas Todos/Por revisar. |
| `.compact-review-list`, `.compact-review-item`, `.line-details` | Filas desplegables para compras breves y grandes. |
| `.review-shortcuts`, `.review-waypoint`, `.review-confirmation` | Accesos a añadir y confirmar sin flotar sobre el contenido. |
| `.new-product`, `.existing-product`, `.design-sample` | Muestra de artículo no detectado y creación progresiva. |

`.preview-note`, `.preview-links`, `.gallery-*`, las muestras estáticas y las restricciones de controles pertenecen exclusivamente a la revisión de diseño. No trasladarlas como parte del producto real. El HTML repetido entre páginas permite abrirlas sin compilación; no propone duplicar React ni convertir cada clase en un componente independiente.

## 9. Recomendaciones de verificación para React, después de autorización

1. Reutilizar tokens y geometría aprobados; comenzar por estructura, navegación, botones, campos y filas, sin introducir un framework visual adicional por defecto.
2. Hacer interactivo primero el recorrido revisión → editar → añadir → volver, con datos ficticios y sin servicios, si ese es el alcance autorizado para el siguiente prototipo.
3. Validar con teclado, texto 200 %, 320/360/390/430 px, zoom, orientación y lector de pantalla. Comprobar reservas de barra inferior y errores con foco.
4. Probar que los controles bloqueados no se activen con teclado o puntero y que su motivo sea comprensible. Revisar también largas etiquetas, importes y nombres de comercio.
5. Acordar estados, precisión y persistencia antes de conectar lógica. No tratar el dinero de ejemplo como especificación de almacenamiento.
6. Usar las herramientas previstas de pruebas solo en la fase autorizada y con pruebas de comportamiento: etiquetas, navegación, vuelta al editor, validación y conservación de datos revisados.

No se han ejecutado pruebas React, Playwright ni de servicios. Esta fase no los instala, configura ni implementa. [El comprobador](../../design/preview/comprobar-diseno.html) permite medir 11 vistas a cuatro anchos y dos escalas de texto, pero no pudo ejecutarse aquí por el bloqueo de renderizado. Su JavaScript se limita a QA y no se importa en las pantallas. Foco programático no equivale a probar tabulación real ni lector de pantalla; ambas verificaciones siguen pendientes. Los límites completos se registran en DESIGN_SYSTEM.md.
