# Fase 03B — Prototipo interactivo local

## Alcance y estado de la entrega

Esta fase conecta las seis pantallas React existentes con un único estado en memoria. Permite preparar una compra manual o un recibo simulado, revisar sus artículos y confirmar conjuntamente compra, productos, movimientos y existencias. Gastos e Inicio consultan esas mismas compras. Inventario y lista temporal tienen operaciones locales.

Se conserva la identidad visual aprobada y las referencias de `design/preview/`. No se modifican los documentos de requisitos ni se aprueban por anticipado sus decisiones pendientes. No hay Firebase, autenticación, OCR, captura de fotografías, servicios externos, persistencia, despliegue ni implementación de Fase 03C.

Todas las pantallas muestran **Modo demostración**: los cambios se pierden al recargar y no hay respaldo en la nube. Restablecer datos de ejemplo requiere confirmación y vuelve al Inicio con los datos iniciales.

## Funcionalidades operativas

| Módulo | Comportamiento local |
| --- | --- |
| Inventario | Buscar nombres, filtrar categorías, crear y editar productos, establecer/sumar/consumir cantidades y cambiar estados sencillos. Se impiden saldos negativos y nombres normalizados duplicados. |
| Movimientos | Referencias estables, producto, tipo, existencia anterior y posterior, y referencia de compra cuando corresponde. Se inspeccionan en el desplegable al final de Inventario. |
| Compra manual | Establecimiento y fecha; artículos existentes o productos nuevos; cantidad, unidad compatible, precio unitario o total y descuento individual opcional. Añadir, editar y quitar sin tocar existencias. |
| Recibo simulado | Escenarios de 5 y 50 artículos; todos/pendientes; edición de cualquier artículo, resolución explícita de dudas, eliminación y adición manual siempre disponibles. No se exige editar artículos correctos. |
| Confirmación | Operación central atómica en memoria; conserva artículos, crea los productos preparados, repone existencias y genera movimientos. Reintentar el mismo identificador no repite sus efectos. |
| Gastos | Totales derivados de compras confirmadas, agrupación por categoría y establecimiento, filtros de mes/rango inclusivo de fechas y detalle con cantidades, precios e información histórica. |
| Mi lista | Crear, añadir, cambiar cantidades, marcar/desmarcar, quitar y finalizar/descartar. No conserva listas finalizadas ni cambia stock o gastos al marcar. |
| Navegación | Advertencia por cambios sin confirmar al salir de compras, también con Atrás del navegador dentro de la aplicación; continuar o descartar. Aviso nativo al recargar/cerrar si el navegador lo permite. |

Las compras confirmadas son de consulta: no se implementan rectificaciones, devoluciones ni anulaciones. La fecha de ejemplo y el mes inicial son noviembre de 2026; no se atribuyen movimientos de demostración al mes real del dispositivo.

## Arquitectura

```text
src/domain/
  types.ts        Productos, compras, borrador, lista, movimientos y comandos.
  policy.ts       Unidades, escala de cantidades y constantes de demostración.
  validation.ts   Cantidades, dinero, fechas y errores comprensibles.
  inventory.ts    Identificación, creación, ajustes y movimientos.
  purchases.ts    Artículos y confirmación conjunta de la compra.
  finance.ts      Importes y consultas financieras derivadas.
  reducer.ts      Entrada pública de las operaciones del dominio.
  domain.test.ts  Pruebas de reglas y coherencia.
src/state/DemoContext.tsx  Publicación del estado compartido.
src/data/seed.ts           Estado inicial y escenarios estructurados.
src/features/             Formularios y pantallas que consumen el dominio.
```

`DemoProvider` usa Context y un reducer de publicación, sin biblioteca adicional. `run(command)` obtiene la instantánea vigente, llama a `reduceDomain`, actualiza una referencia sincrónica y publica la nueva instantánea completa. La referencia evita que dos eventos antes del siguiente render lean un estado anterior. Los formularios conservan únicamente sus campos de edición; la información confirmada proviene del estado compartido.

`reduceDomain` clona el estado serializable y opera sobre la copia. Si cualquier validación falla, no publica productos, movimientos ni compras parciales. Los auxiliares de inventario y compras trabajan sobre esa copia; las interfaces deben entrar por `run`/`reduceDomain`, no invocarlos como operaciones independientes sobre el estado publicado. La confirmación valida también que los agregados financieros permanezcan dentro de los enteros seguros.

Los identificadores se generan al iniciar la operación, no durante un reintento. Una entrada por compra usa `purchase:<compra>:<artículo>`; la apertura de un producto usa `opening:<producto>`. Una compra ya confirmada retorna el mismo estado. Esto protege la sesión local; **no demuestra** atomicidad, concurrencia ni reintentos de una futura base de datos.

No existen dependencias de Firebase en dominio ni estado. La integración futura debe adaptar la persistencia y definir sus transacciones e identidades sin trasladar reglas financieras a los componentes.

## Reglas aplicadas

- Los importes son enteros COP; no hay un gasto independiente duplicando la compra. Los totales de artículos, compra e informes se calculan desde los mismos campos financieros.
- Las cantidades se representan como enteros en milésimas de su unidad. Así, 1,5 kg son 1500 y diez consumos de 0,1 no dejan residuos binarios. Los campos aceptan coma o punto decimal y hasta tres decimales, sin separador de miles.
- Los saldos físicos nunca pueden ser negativos. Las unidades contables admiten solo cantidades enteras de unidades. Se convierten únicamente kg/g y L/ml; gramos y mililitros deben ser enteros en este prototipo. No se inventa el contenido de paquetes o botellas.
- Precio por unidad: se multiplica por la cantidad indicada. Precio total de la cantidad: se conserva el importe pagado aunque cambie la cantidad, para no reinterpretar un total reconocido como precio unitario. La interfaz identifica ambas modalidades.
- Un descuento individual se resta una sola vez y no puede superar el importe del artículo. Se distingue un cero introducido explícitamente de un campo de precio vacío.
- Los productos nuevos de una compra permanecen dentro del borrador y se crean al confirmar. Su existencia previa es explícita; repetir el mismo producto nuevo en dos líneas compatibles lo crea una sola vez. Datos contradictorios se rechazan.
- Los productos existentes se seleccionan por identidad. La búsqueda normaliza mayúsculas, acentos y espacios; no fusiona nombres parecidos. Cambiar el nombre en una línea no renombra automáticamente el catálogo.
- La compra conserva una instantánea de nombre, categoría, cantidad, unidad y precio. Editar posteriormente el catálogo no reclasifica sus gastos ni reescribe sus precios históricos.
- El control sencillo conserva la cantidad comprada en el historial y registra el estado elegido para las existencias. El consumo manual y los ajustes no cambian los gastos.
- Los artículos pendientes bloquean Guardar compra y tienen acceso directo al filtro. Al cambiar el total del recibo simulado, se muestra la diferencia y se exige aceptar explícitamente el nuevo total; no se crea un ajuste financiero oculto. Editar de nuevo invalida esa aceptación.
- Finalizar una lista descarta también sus pendientes, después de explicar el efecto. No dispara ninguna compra ni reposición.

## Supuestos aislados y decisiones que siguen pendientes

Estas elecciones sirven para probar esta fase; no sustituyen las decisiones de `VISION.md`.

| Decisión | Supuesto o límite del prototipo |
| --- | --- |
| DP-02 — precisión | COP enteros solicitado en esta fase. Escala física de 1000 y redondeo de importes positivos al peso más cercano, con medio peso hacia arriba, implementado con `BigInt`. El redondeo definitivo y los residuos siguen pendientes. |
| DP-03 — unidades/estados | Unidades base unidad/kg/L, conversiones conocidas, existencia inicial explícita y estado disponible sugerido al reponer, visible y editable en cada artículo sencillo. Sin umbrales automáticos ni cambio de unidad/modo después de crear el producto. |
| DP-04 — descuentos/cargos | Solo descuento individual explícito. Sin descuento general, prorrateo, impuestos ni política de cargos automática. No compensar discrepancias mediante conceptos inventados. |
| DP-05 — correcciones posteriores | Solo lectura de compras confirmadas. No probar anulaciones mediante ajustes de inventario: no son equivalentes. |
| DP-06 — borradores | Un borrador y una lista en memoria por sesión; sin restauración tras recarga ni archivos reales. No hay un guardado remoto incierto que recuperar. |
| DP-07 — límites | Probado con 50 artículos; no es un límite aprobado ni una validación de límites/atomicidad de Firestore. La copia completa es deliberadamente sencilla para una sesión pequeña. |
| DP-08 — catálogos | Categorías de demostración centralizadas y «Sin clasificar». Establecimientos escritos por la usuaria; sin fusión automática de variantes ni administración de catálogos. |
| DP-09 — metadatos | Para confirmar se pide establecimiento no vacío y fecha válida, editable y presentada sin desplazar el día por zona horaria. El comportamiento definitivo para datos desconocidos sigue pendiente. |
| DP-10 — coincidencias | Coincidencia normalizada exacta y selección explícita. Los escenarios conocen sus propios identificadores, incluida la muestra «Huevos» asociada a «Huevos AA»; esto no es OCR ni aprendizaje de alias. |
| DP-12 — precios históricos | Se conservan precio introducido, modalidad y descuento; no se infieren equivalencias comerciales entre presentaciones. |
| DP-13 — sin inventario | Una línea explícita «Gasto sin inventario» en la misma operación financiera; no tiene entrada de stock. No fija todavía el esquema de almacenamiento definitivo. |

DP-01 (acceso) y DP-11 (validación con la usuaria) continúan pendientes. No se implementa autenticación ni se afirma haber validado usabilidad con la usuaria.

Los datos iniciales mantienen los totales aprobados: cuatro compras por $286.400, categorías $182.400/$64.000/$40.000 y recibos simulados de $61.100 y $435.600. Sus artículos históricos se han estructurado para conciliar esos importes; son datos ficticios. Los saldos iniciales son una apertura, no la reproducción de las compras históricas: volver a aplicarlas duplicaría existencias. Para probar el ejemplo solicitado, la leche inicial representa **3 unidades**; en la muestra visual anterior figuraban 3 litros. Es una diferencia de datos de demostración, sin cambio de identidad visual ni conversión automática entre ambas unidades.

## Diseño y accesibilidad

Se mantienen marfil, verde, salvia, terracota, tipografía y navegación aprobados. Los controles anteriormente inactivos muestran ahora su comportamiento local. Los formularios se abren dentro de la pantalla, uno por tarea, con etiquetas y mensajes cotidianos; los pendientes conservan icono y texto además de color. Las acciones destructivas requieren confirmación.

Con texto ampliado, la navegación principal pasa al flujo del documento y distribuye sus cuatro enlaces sin encoger la letra. En compras se mantiene navegación contextual. Para 50 artículos se conservan el resumen superior, filtro de pendientes, edición desplegable, accesos a Añadir y al total, y un acceso al resumen cada diez artículos.

En la verificación se detectó y corrigió un desbordamiento de 7 px al 200 % en el nuevo encabezado «Por establecimiento». Se usa «Dónde compraste», conservando el tamaño del texto. El selector, los formularios y las cifras no se ocultan para resolver el espacio.

## Verificación

Ejecución final del 21 de noviembre de 2026:

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto, sin errores TypeScript. |
| `npm test` | **54 pruebas, 4 archivos, todas correctas.** Incluyen cantidades decimales, conversiones, negativos, duplicados, movimientos, edición de artículos, descuentos, confirmación, rollback de errores tardíos, agregados monetarios seguros, estados sencillos, productos nuevos repetidos, gastos derivados, lista y navegación React. |
| `npm run build` | Correcto; tipos y compilación Vite de producción. |
| `npm run test:e2e` | **82 pruebas Chromium, todas correctas.** 64 combinaciones de ocho vistas × cuatro anchos × dos tamaños de texto, seis recorridos integrados, ocho recorridos con formularios abiertos y cuatro comprobaciones adicionales de teclado, salida y filtros. |
| Consola y distribución | Sin errores de consola en la matriz de pantallas. Sin desbordamientos horizontales superiores a 1 px en las vistas y formularios probados a 360/390/430/768 px, texto 100/200 %. Barra fija cuando hay espacio y en flujo al ampliar texto en móvil; controles finales alcanzables. |
| Teclado | Activación con Tab/Enter, Escape en confirmaciones, foco inicial y retorno de formularios, y conservación del foco al marcar/desmarcar la lista con Espacio. Atrás del navegador comprobado con continuar y descartar. |
| Conservación | Hashes de los ocho documentos aprobados y de las referencias HTML/CSS coinciden con el estado anterior. Sin archivos originales eliminados ni cambios en dependencias. |

El recorrido manual comprueba una sola compra tras doble clic, leche de 3 a 9 unidades, consumo posterior a 7 sin alterar $311.600 de gastos. También se verifican adición manual después de reconocimiento, creación al confirmar, cancelación sin efectos, compra de 50 productos por $435.600, lista temporal y restablecimiento.

Se inspeccionaron capturas renderizadas de Inventario, revisión pequeña, resumen de pendientes de compra grande, Inicio al 200 % y formulario de artículo al 200 %. El resto de la matriz se verificó mediante mediciones y aserciones del navegador. No se afirma inspección visual manual de cada artículo de las 50 líneas.

Las pruebas verifican reglas de dominio y comportamientos observables de React y Chromium. El texto ampliado se simula duplicando el tamaño de la raíz tipográfica; no equivale a haber comprobado zoom nativo, ajustes de texto de Android/iPhone o todos los navegadores.

Las capturas nuevas se guardan en `artifacts/phase-03b/`; se conservan las de Fase 03A. No contienen imágenes de recibos reales. Los registros de movimientos están disponibles en el desplegable de Inventario, sin añadir una pantalla avanzada de auditoría.

- [Revisión de compra pequeña](../artifacts/phase-03b/390-100-compras-revisar.png).
- [Inventario](../artifacts/phase-03b/390-100-inventario.png).
- [Inicio con texto al 200 %](../artifacts/phase-03b/360-200-inicio.png).
- [Formulario con texto al 200 %](../artifacts/phase-03b/360-200-formulario-articulo.png).

Gemini se omitió como revisor: el CLI está instalado, pero las fases anteriores registraron falta de autenticación y no se repitió la solicitud sin credenciales configuradas. Consultar su ayuda no constituye una revisión. Se realizó revisión propia de reglas, publicación del estado, validaciones, recorridos y conservación de archivos. No fue posible inspeccionar un diff Git contra un commit por la limitación descrita abajo.

## Archivos creados o modificados

Nuevos:

```text
docs/FASE_03B.md
src/data/seed.ts
src/domain/types.ts
src/domain/policy.ts
src/domain/validation.ts
src/domain/inventory.ts
src/domain/purchases.ts
src/domain/finance.ts
src/domain/reducer.ts
src/domain/domain.test.ts
src/state/DemoContext.tsx
src/hooks/useValidatedForm.tsx
src/features/inventory/ProductForm.tsx
src/features/inventory/StockForm.tsx
src/features/purchases/PurchaseMetadataForm.tsx
src/features/purchases/PurchaseLineEditor.tsx
src/features/expenses/PurchaseDetail.tsx
src/features/shopping-list/ListItemForm.tsx
tests/e2e/business.spec.ts
tests/e2e/forms.spec.ts
```

Modificados:

```text
README.md
vite.config.ts
src/main.tsx
src/app/App.tsx
src/app/AppShell.tsx
src/app/App.test.tsx
src/components/Button.tsx
src/components/ConfirmationDialog.tsx
src/components/Feedback.tsx
src/components/Navigation.tsx
src/components/PurchaseHistory.tsx
src/components/SpendingSummary.tsx
src/lib/format.ts
src/styles/app.css
src/features/home/HomePage.tsx
src/features/inventory/InventoryPage.tsx
src/features/inventory/InventoryProductRow.tsx
src/features/purchases/NewPurchasePage.tsx
src/features/purchases/ReviewPurchasePage.tsx
src/features/purchases/PurchaseLineItem.tsx
src/features/purchases/PurchaseOverview.tsx
src/features/purchases/PurchaseSummary.tsx
src/features/expenses/ExpensesPage.tsx
src/features/shopping-list/ShoppingListPage.tsx
tests/e2e/app.spec.ts
```

`vite.config.ts` permite `requestAnimationFrame` en jsdom para comprobar el foco de los formularios; no cambia la compilación de producción. Se añadieron diez capturas PNG en `artifacts/phase-03b/`: ocho vistas a 390 px, Inicio a 360 px/200 % y formulario a 360 px/200 %. Los resultados temporales de ejecución se mantienen en las carpetas ya ignoradas por el proyecto.

## Recorridos para revisión manual

1. Restablecer los ejemplos. Comprobar leche: 3 unidades y gastos: $286.400.
2. Inicio → Registrar compra → Registrar compra manualmente. Escribir establecimiento, revisar fecha y continuar.
3. Añadir producto → buscar Leche → seleccionar Leche entera → cantidad 6 → precio por unidad 4200 → Guardar artículo en la compra. El total es $25.200. Abrir sus detalles y editar cantidad o precio si se desea; el inventario aún no cambia.
4. Guardar compra. En Gastos aparecen cinco compras y $311.600; en Inventario, 9 unidades de leche. Registrar consumo de 2 deja 7 y los gastos siguen en $311.600.
5. Restablecer. Simular recibo de 5 productos. Filtrar Por revisar, abrir el pendiente, corregirlo o marcarlo revisado. Añadir un producto manual, incluido uno nuevo. Si cambia el total, revisar y aceptar la diferencia; confirmar. El producto aparece en Inventario solamente después de confirmar.
6. Restablecer. Simular 50 productos. Resolver los seis pendientes; los otros 44 siguen editables y no necesitan confirmaciones individuales. Guardar añade $435.600: acumulado $722.000.
7. Iniciar otra compra, introducir datos y pulsar Volver o Atrás. Probar Seguir revisando y luego Descartar y salir. No deben cambiar inventario ni gastos.
8. Mi lista → finalizar la muestra → crear otra lista → añadir/cambiar cantidades → marcar/desmarcar → quitar → finalizar. Verificar que inventario y gastos no cambian.
9. Gastos: filtrar categoría, establecimiento y fechas; abrir una compra en el historial. El importe filtrado por categoría es solo esa parte; el detalle explica la compra completa.

## Ejecución

Desde `/mnt/Datos/mi-casa`, con las dependencias existentes: `npm run dev`. Abrir `http://127.0.0.1:5173` o el puerto anunciado por Vite. En una copia sin dependencias ejecutar primero `npm ci`. No requiere credenciales ni variables de entorno.

Validación: `npm run typecheck`, `npm test`, `npm run build` y `npm run test:e2e`. Playwright inicia y detiene su servidor en 4173; no ejecutar otro servidor en ese puerto simultáneamente. No se añadieron dependencias.

## Diagnóstico no destructivo de Git

- Directorio físico: `/mnt/Datos/mi-casa`; el shell puede mostrar su alias `/home/camiska/z/mi-casa`.
- `.git` visible está vacío y montado como solo lectura. `/proc/self/mountinfo` muestra un montaje específico `ro` para esa ruta, sin `HEAD`, configuración u objetos visibles.
- `git status` no reconoce un repositorio. Esto impide revisar un diff contra un commit; no demuestra por sí solo pérdida o corrupción del repositorio original.
- Causa probable: el entorno expone metadatos Git vacíos/restringidos mediante el montaje administrado. Recomendación: abrir el checkout original con sus metadatos o corregir ese montaje fuera de este entorno; comprobar el repositorio real antes de cualquier reparación.
- No se inicializó Git, no se modificó `.git`, no se cambiaron ramas y no se realizaron commits ni push. Para revisar los cambios se comparan archivos y hashes del estado previo disponibles durante la sesión.

## Riesgos y siguiente fase

No hay persistencia ni recuperación de datos tras recargar; el aviso nativo al cerrar depende del navegador y de la interacción previa. No hay concurrencia entre pestañas, sincronización, almacenamiento offline ni service worker. La atomicidad e idempotencia son exclusivamente locales. Las pantallas de carga existentes no simulan una espera de red: las operaciones son sincrónicas en memoria.

Antes de una integración posterior deben aprobarse las políticas pendientes, validar el diseño con la usuaria y comprobar otros navegadores/dispositivos, lectores de pantalla, teclado virtual y zoom real. La persistencia, transacciones remotas, reglas de seguridad, fotografías temporales y OCR requieren diseño y pruebas propios. La Fase 03C no se inicia en esta entrega.
