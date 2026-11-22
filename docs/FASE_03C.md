# Fase 03C — Auditoría funcional, accesibilidad y preparación de usabilidad

## Alcance

Auditoría del prototipo React local de Fase 03B, conservando identidad visual, seis rutas, datos simulados y estado compartido en memoria. Se revisaron visión, requisitos, reglas, casos de uso, diseño y entregas anteriores, así como dominio, Context, componentes y pruebas existentes.

Esta entrega corrige comportamiento existente y prepara la prueba con la usuaria. No añade Firebase, autenticación, OCR, fotografías, servicios externos, almacenamiento persistente, despliegue ni funcionalidades de otra fase. No se han modificado los documentos aprobados ni sus decisiones de negocio pendientes.

## Auditoría y hallazgos

| ID | Hallazgo y evidencia | Corrección |
| --- | --- | --- |
| A-01 | Guardar compra seguía habilitado al abrir un artículo y cambiar su precio. Los campos locales todavía no estaban en el borrador; el total anterior podía confirmarse. Reproducido con una prueba de navegador fallida antes de corregir. | Bloquear confirmación con un formulario abierto, explicar por qué y ofrecer Volver al formulario. Mantener una comprobación adicional en el manejador de confirmación. |
| A-02 | Añadir producto, editar otro o abrir metadatos podía sustituir un editor de artículo abierto y perder sus campos locales. | Conservar el editor y sus valores, explicar que debe terminarlo o volver sin cambios y dirigir el foco al formulario. Se aplica también al cambio de editor en Inventario y Mi lista. |
| A-03 | Los formularios mostraban errores en un resumen, pero no vinculaban los errores de lectura/validación con el campo correspondiente. | Resumen enfocable conservado; errores de cantidad, precio, descuento, nombre y metadatos asociados mediante `aria-invalid` y descripción visible cuando se identifica el campo. Los errores de dominio generales siguen en el resumen. |
| A-04 | Guardar inventario o lista cerraba el formulario sin confirmar expresamente el resultado. Una compra vacía no explicaba el bloqueo junto al guardado final. | Regiones de estado persistentes para creación/actualización, artículos añadidos/corregidos/retirados, finalización y restablecimiento. Mensajes de sesión y sin promesa de respaldo; explicación visible para la compra vacía. |
| A-05 | Enlaces del historial medidos en 24 px de alto, por debajo del objetivo propio de 48 px. | Objetivo de al menos 48 × 48 px sin reducir texto ni alterar colores. Es una mejora respecto al objetivo del proyecto; no se interpreta automáticamente como infracción del mínimo AA de 24 px con excepciones. |
| A-06 | El detalle aparecía al final de Gastos, pero un cambio solo de consulta no recibía foco ni desplazamiento. Podía parecer que el enlace no había respondido. | Foco y desplazamiento explícitos al detalle, confirmación local dentro de ese contexto y enlaces a Inventario y al resumen de gastos. Los saltos internos no vuelven a enfocarlo por error. |
| A-07 | Un rango Desde posterior a Hasta mostraba aviso, pero también total cero e historial vacío. | Identificar el campo y pedir corregir las fechas; ocultar el informe inválido hasta que el rango permita una consulta. No confundir un filtro inválido con ausencia de gastos. |
| A-08 | Los enlaces nativos a fragmentos producían una advertencia de React Router sobre entradas del historial ajenas al router; afectaba la protección al volver. | `InPageLink` conserva ruta/filtro, usa navegación del router con reemplazo y enfoca el destino. Prueba de salto al total, Atrás y conservación del borrador sin advertencias. |
| A-09 | Comprobación adicional: Inventario desbordaba 8 px a 320 px con texto al 200 %, por palabras largas en el título y descripción. | Separación silábica automática en español solo con espacio extremadamente reducido (`9em` del contenedor). Sin disminuir letra, ocultar contenido o partir arbitrariamente caracteres. Se conserva el comportamiento previo en los tamaños habituales. |
| A-10 | Algunas lecturas mostraban «1 litros», «1 artículos» o «1 compras». | Formato compartido de cantidades con singular/plural y redacción concordante de contadores y pendientes. Solo presentación; no cambia unidades ni cálculos. |

Las pruebas de regresión se mantienen junto a las existentes; no se eliminaron pruebas para obtener resultados positivos. Axe no descubrió infracciones automáticas en las vistas iniciales, pero eso no detectaba A-01, A-02, A-04 o A-06: la revisión funcional y de interacción fue necesaria.

## Coherencia funcional y financiera

La arquitectura sigue separando dominio (`src/domain/`), publicación compartida (`src/state/`), datos de ejemplo (`src/data/seed.ts`) y componentes de cada función. No se cambiaron la confirmación central, los cálculos, la escala, el reducer ni la estructura del estado. En validación de dominio solo se permite identificar el precio o descuento en el mensaje; no cambia qué importes se aceptan.

Se revisaron las invariantes:

- Editar, añadir o retirar artículos de un borrador no repone existencias ni genera gastos.
- Confirmar publica una instantánea completa o ningún efecto; conserva identificadores de operación y evita duplicar una compra por reintento.
- Todos los artículos físicos confirmados se asocian a productos; los nuevos se crean al confirmar. Los sencillos conservan cantidad comprada sin inventar un saldo exacto.
- Los gastos derivan únicamente de las líneas financieras de compras confirmadas. El consumo, los ajustes y la lista no agregan ni restan gastos históricos.
- Cantidades, precios por unidad y precios totales conservan su significado. El descuento individual se aplica una sola vez.
- La suma por categorías y establecimientos concilia con el total del mismo conjunto; los filtros no suman el total completo de una compra a cada categoría.

Se añadió una prueba mixta con arroz fraccionario, leche, detergente sencillo, un concepto sin inventario y descuentos individuales. Su compra suma $31.200; total de sesión $317.600; categorías y comercios concilian, hay tres entradas físicas y el consumo posterior no modifica el historial financiero.

El escenario de prueba con la usuaria se verifica también por navegador: corregir arroz a $7.800, resolver la leche y añadir un café de $9.000 deja una compra de $70.100 y gasto mensual de $356.500. Son resultados automatizados con datos ficticios, **no resultados de una prueba humana**.

## Accesibilidad y experiencia

WCAG 2.2 AA sigue siendo el objetivo, sin declaración de conformidad completa. Se combinaron inspección de código, navegación con teclado, mediciones, capturas y axe. Las herramientas automatizadas detectan solo una parte de los problemas; véase la [documentación de Playwright sobre accesibilidad](https://playwright.dev/docs/accessibility-testing).

| Área | Evidencia y alcance |
| --- | --- |
| Contraste | Comprobación de tokens calculados del CSS: texto principal/marfil 12,72:1; secundario/marfil 5,67:1; blanco/verde 6,33:1; advertencia/fondo 5,93:1; error/fondo 6,08:1; borde de campo/blanco 3,58:1. Se mantiene terracota como acento, no como texto pequeño insuficiente. |
| Objetivos táctiles | Botones y campos existentes conservan mínimos; historial ampliado a 48 px. La lista permite pulsar también su etiqueta asociada. Se requiere validar comodidad de toque con la usuaria, no solo tamaños geométricos. |
| Formularios | Etiquetas visibles, selectores nativos etiquetados y valor visual sincronizado. Errores de entrada identificables, foco en resumen y conservación de datos. Sin validar destructivamente cada tecla. |
| Foco y teclado | Tab/Enter, Escape en diálogos, retorno al origen, conservación del foco al marcar la lista, salto al contenido/total y protección al volver. El detalle recibe foco al solicitarse; un simple cambio de filtro no reenfoca toda la pantalla. |
| Estados | Mensajes de éxito y resultado con `role="status"`, errores con alertas y resumen enfocable; pendientes, procedencia y existencias incluyen texto/iconos además de color. No se usan notificaciones que desaparezcan por tiempo. |
| Semántica | Encabezados, listas, regiones y nombres de controles conservados. Confirmaciones con diálogo nativo, título y descripción. No se añaden menús ocultos ni iconos sin texto para tareas esenciales. |
| Compras grandes | Contadores 50/6, filtro de pendientes, artículos correctos editables, Añadir visible arriba/abajo y acceso al total cada diez artículos. Guardado bloqueado por pendientes, sin obligar a editar los otros 44. |
| Texto y movimiento | Navegación en flujo con texto ampliado en móvil, contenedores apilados, letra sin reducir; espaciado personalizado y preferencia de movimiento reducido comprobados. Separación silábica adicional solo en anchura extrema. |

Los 48 px son el objetivo propio del proyecto, distinto del [mínimo AA 2.5.8 con excepciones](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Las regiones de estado siguen la intención de [4.1.3, mensajes identificables sin exigir foco](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). El reflujo a 320 px se comprueba como referencia de [1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), sin equipararlo a zoom real.

## Verificación final

Resultados del 21 de noviembre de 2026; los comandos se ejecutan desde `/mnt/Datos/mi-casa`:

| Verificación | Resultado |
| --- | --- |
| `npm run build` | Correcto; incluye comprobación de tipos TypeScript y build Vite de producción. |
| `npm test` | **61 pruebas correctas en 5 archivos**, incluyendo dominio, componentes, navegación, errores accesibles y formato de cantidades. |
| `npm run test:e2e` | **143 pruebas correctas y 1 no disponible**, de 144 casos. La no disponible corresponde exclusivamente al intento de zoom real por teclado. Sin fallos; incluye las 15 pruebas de accesibilidad/contraste. |
| axe | 17 análisis de estados, sin infracciones automáticas detectadas. Reglas WCAG A/AA 2.0/2.1/2.2 disponibles en axe, más buenas prácticas. No se deshabilitaron reglas para ocultar hallazgos. |
| Contraste | Once pares calculados a partir de los tokens reales del CSS cumplen los umbrales usados de texto/control. |

Axe dejó **una comprobación incompleta** de contraste en la descripción del diálogo de salida. Se conserva en el informe, sin convertirla en una prueba automática superada. La captura y los colores calculados del diálogo (`#25312D` sobre `#FFFFFF`, 13,50:1) corroboran su legibilidad en este estado; falta la validación asistiva real.

Se inspeccionaron capturas renderizadas de revisión de compra, diálogo de descarte, Inventario a 320 px/200 % y compra grande en escritorio. Las otras combinaciones se comprobaron mediante mediciones y aserciones del navegador. No se afirma inspección visual individual de cada una de las 50 líneas.

Evidencias:

- [Informe axe](../artifacts/phase-03c/axe-report.json), [contrastes](../artifacts/phase-03c/contrast-report.json) y [colores del diálogo](../artifacts/phase-03c/modal-colors.json).
- [Revisión móvil](../artifacts/phase-03c/390-100-compras-revisar.png) y [confirmación de descarte](../artifacts/phase-03c/confirmacion-salida.png).
- [Inventario a 320 px con texto al 200 %](../artifacts/phase-03c/320-200-inventario.png) y [compra grande en escritorio](../artifacts/phase-03c/1440-compra-grande.png).

La matriz mide 320, 360, 390, 430, 768 y 1280 px con raíz tipográfica 100/200 %, ocho vistas por combinación. Los formularios y la confirmación se ejercitan a 360/390/430/768 px, también a ambas escalas. Hay una comprobación adicional de compra grande a 1440 px. El umbral geométrico de las pruebas de desbordamiento es como máximo 1 px de tolerancia de redondeo.

Se añaden espaciado de texto personalizado, movimiento reducido, contraste, errores, edición abierta, nombre corregido, retirada de artículos, estados sencillos, filtros inválidos y protección tras saltos internos. Los recorridos anteriores de compra manual, adición tras recibo, doble confirmación, gastos, cancelación, lista y restablecimiento se conservan.

**Zoom real:** se intentó aumentar mediante `Control+Equal` en Chromium headless. No cambió `innerWidth` ni `devicePixelRatio`; esa prueba se marca como no disponible, no como superada. No se sustituyó por zoom CSS ni emulación de píxeles presentada como zoom de navegador.

**Persistencia/red:** la sesión de prueba no contiene localStorage, sessionStorage, IndexedDB ni Cache Storage; la lista vuelve al ejemplo al recargar. No se detectan solicitudes a servicios externos en ese recorrido. Además se revisaron los fuentes para comprobar ausencia de servicios, OCR y fotografías. Esto describe el prototipo probado, no una garantía sobre servicios futuros.

Capturas e informes se generan en `artifacts/phase-03c/`; se conservan las evidencias anteriores. Los resultados temporales de Playwright permanecen en `test-results/`, ya ignorado por el proyecto.

Se conservaron trece capturas PNG y tres informes JSON. La comparación de hashes confirma que requisitos, documentos previos, diseño estático, estado compartido y operaciones/cálculos de dominio permanecen intactos. No se eliminó ningún archivo original.

## Dependencias y ejecución

Se añadió únicamente `@axe-core/playwright` **4.13.0** como dependencia de desarrollo, fijada en el lockfile. Su instalación añadió cuatro paquetes al árbol y no informó vulnerabilidades en esa comprobación; no es una auditoría de seguridad exhaustiva. No se introduce en el bundle de la aplicación.

Comandos: `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e`. Para repetir solo axe y contraste: `npm run test:a11y`. Playwright gestiona su servidor local en 4173; no ejecutar otro servidor en ese puerto simultáneamente. Las instrucciones de dispositivo real están en la guía y no requieren desplegar ni servicios externos.

## Limitaciones y riesgos pendientes

- No hay lector de pantalla real disponible para esta auditoría: no se han probado TalkBack, VoiceOver, NVDA u Orca. Tener etiquetas y regiones correctas no demuestra cómo se anunciarán en todas sus combinaciones.
- No se probaron dispositivos físicos, teclado virtual, selectores nativos móviles, Safari, Firefox o preferencias nativas de texto. El motor probado es Chromium; el zoom real queda pendiente.
- La adecuación del lenguaje, pasos, separación silábica extrema, cantidad de desplazamiento en compras grandes y comodidad táctil requieren la prueba real. No se presupone que la usuaria entenderá todo por pasar pruebas automáticas.
- Los campos locales de inventario/lista no se recuperan tras abandonar su pantalla. Solo el registro de compra tiene advertencia de abandono, conforme al alcance actual. No hay recuperación tras cerrar o recargar.
- Las operaciones siguen siendo sincrónicas y en memoria. No se simulan retrasos de red ni errores de un servidor inexistente. El bloqueo de recarga/cierre depende del navegador; no se garantiza que un proceso terminado emita callbacks.
- La instantánea clonada y la referencia sincrónica son apropiadas para este prototipo pequeño; no prueban concurrencia, atomicidad remota, autorización o consumo de cuotas.

## Decisiones todavía pendientes

Se mantienen las DP de Visión y los supuestos aislados de Fase 03B. COP enteros fue solicitado para el prototipo, pero el redondeo positivo al peso más cercano y la escala física de milésimas siguen siendo políticas provisionales, no aprobaciones definitivas.

Antes de persistir: acordar unidades/empaques, saldos iniciales y reposición de sencillos (DP-03); descuentos generales, impuestos/cargos y prorrateos (DP-04); correcciones posteriores (DP-05); borradores, desconexión y resultado incierto (DP-06); límites y validación de operaciones grandes (DP-07). También siguen pendientes acceso/recuperación, catálogo, metadatos desconocidos, coincidencias/alias y presentación de precios históricos (DP-01/08/09/10/12/13).

DP-11 requiere ejecutar la prueba con la usuaria y registrar sus observaciones. Esta auditoría no la resuelve. Cambios importantes derivados de ella deben proponerse para aprobación, sin convertir preferencias observadas en reglas financieras.

## Recomendaciones para una arquitectura posterior con Firebase

Recomendaciones para evaluar y aprobar; **no implementadas**:

1. Mantener dominio y componentes separados del adaptador de persistencia. Definir resultados explícitos: confirmado, rechazado sin efectos o incierto; no mostrar respaldo remoto por una publicación local.
2. Conservar la identidad de la compra y sus movimientos entre reintentos. Definir una confirmación remota indivisible para compra, productos y existencias; las pruebas locales no sustituyen transacciones ni control de concurrencia. Firestore puede reintentar funciones de transacción y sus transacciones requieren conexión: [documentación oficial](https://firebase.google.com/docs/firestore/manage-data/transactions). No publicar efectos visuales o financieros desde una función que pueda repetirse.
3. Diseñar autorización y validación remota por identidad, con pruebas en emulador de permisos, importes, unidades, duplicados y consistencia cruzada. Las reglas deben poder comprobar el contrato real, no confiar en la interfaz: [condiciones de Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions).
4. Demostrar viabilidad con compras de 50 o más líneas dentro de límites actuales de documentos, solicitudes y acceso de reglas antes de aprobar el esquema. No dividir un guardado aparentando atomicidad ni fijar un límite arbitrario aprobado. Medir lecturas/escrituras y consultas de gastos para evaluar el plan gratuito, sin prometer coste cero ilimitado.
5. Conservar una sola fuente financiera y sus instantáneas históricas; definir migración/versionado de cantidades y redondeo antes de almacenar datos reales. Los agregados, si fueran necesarios, necesitarían reconciliación explícita.
6. Acordar política offline/recuperación antes de activar cachés persistentes. Las imágenes y texto OCR completos continúan fuera del almacenamiento permanente; su ciclo temporal requerirá pruebas propias cuando se autorice esa función.

## Preparación de la prueba real

Guía: [PRUEBA_USABILIDAD.md](PRUEBA_USABILIDAD.md). Incluye siete tareas, instrucciones cotidianas, preparación reproducible, resultados esperados y registro vacío de dificultades, tiempos, ayudas y comentarios. El facilitador prepara en la misma pestaña el recibo con arroz de precio incorrecto y leche pendiente, sin añadir nuevas funcionalidades ni utilizar fotografías.

El prototipo queda preparado para una **sesión guiada de evaluación**, no validado por una usuaria ni listo para producción. Registrar los hallazgos y revisar su prioridad antes de autorizar otra fase. La guía no inventa resultados ni tiempos de aceptación.

## Git y revisión independiente

Diagnóstico no destructivo: directorio físico `/mnt/Datos/mi-casa`, alias visible `/home/camiska/z/mi-casa`. `.git` sigue vacío y de solo lectura; Git no reconoce un repositorio. La evidencia anterior de montaje administrado explica probablemente la exposición vacía, sin demostrar corrupción del checkout original.

Recomendación existente: acceder al checkout real con sus metadatos o corregir el montaje fuera de esta fase; verificarlo antes de reparar. No se inicializó Git ni se modificó `.git`; no hubo commits, cambio de rama, push ni despliegue. La conservación se comprueba mediante hashes de archivos previos; no se afirma disponer de un diff contra un commit.

Gemini se omitió: CLI instalado, sin clave ni credencial OAuth disponible, y el intento anterior falló por falta de autenticación. Se respetó el procedimiento de no reintentar sin credenciales. La revisión fue propia, apoyada en código, pruebas y navegador.


## Archivos creados o modificados

Nuevos:

```text
src/components/InPageLink.tsx
src/hooks/useStatusMessage.tsx
src/lib/format.test.ts
docs/FASE_03C.md
docs/PRUEBA_USABILIDAD.md
tests/e2e/accessibility.spec.ts
tests/e2e/audit.spec.ts
tests/e2e/environment.spec.ts
```

Modificados:

```text
src/app/App.test.tsx
src/app/AppShell.tsx
src/components/Feedback.tsx
src/domain/domain.test.ts
src/domain/validation.ts
src/hooks/useValidatedForm.tsx
src/lib/format.ts
src/styles/app.css
src/features/expenses/ExpensesPage.tsx
src/features/expenses/PurchaseDetail.tsx
src/features/inventory/InventoryPage.tsx
src/features/inventory/InventoryProductRow.tsx
src/features/inventory/ProductForm.tsx
src/features/inventory/StockForm.tsx
src/features/purchases/PurchaseLineEditor.tsx
src/features/purchases/PurchaseLineItem.tsx
src/features/purchases/PurchaseMetadataForm.tsx
src/features/purchases/PurchaseOverview.tsx
src/features/purchases/PurchaseSummary.tsx
src/features/purchases/ReviewPurchasePage.tsx
src/features/shopping-list/ListItemForm.tsx
src/features/shopping-list/ShoppingListPage.tsx
tests/e2e/app.spec.ts
tests/e2e/forms.spec.ts
README.md
package.json
package-lock.json
```

Los cambios de pruebas conservan los casos anteriores, amplían la matriz y separan regresiones funcionales, axe y entorno. Los trece PNG y tres JSON nuevos se encuentran en `artifacts/phase-03c/`; no son fotografías de recibos.
