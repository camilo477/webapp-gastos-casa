# Mi Casa — Entrega de Fase 03A

## Alcance implementado

Estructura React con TypeScript, Vite y React Router, seis rutas principales y datos ficticios. Se conserva la identidad visual aprobada: marfil, verde, salvia, terracota, tipografía de sistema y geometría accesible. No se cambian los requisitos ni las decisiones de negocio pendientes.

Funcionan la navegación, los cambios de muestra pequeña/grande, la vista Todos/Por revisar, los desplegables de artículos y la confirmación contextual de salida. No se implementan compra manual, captura, OCR, edición de artículos, confirmación de compras, actualizaciones de inventario/gastos/lista, autenticación, Firebase ni almacenamiento. Ninguna acción muestra «Compra guardada» o afirma haber descartado fotos.

La confirmación de salida es exclusivamente navegación del prototipo. No representa un borrador real, no intercepta Atrás/recarga y no recupera datos. Las funciones posteriores conservan su estado pendiente.

## Arquitectura y componentes

`src/app/` contiene rutas y estructura. `src/features/` agrupa páginas y componentes propios de inventario, compras, lista, gastos e Inicio. `src/components/` contiene elementos compartidos. `src/data/` reúne todos los datos de demostración, con tipos de presentación en `src/types/`; no se inventa una capa Firebase vacía ni un contrato remoto definitivo.

Componentes: Header, BottomNavigation, ContextNavigation, Button/UnavailableButton, TextField/SelectField, Card/PageHeading, Money/SpendingSummary, PurchaseHistory, InventoryProductRow, PurchaseLineItem, PurchaseOverview/PurchaseSummary, Notice, EmptyState, LoadingIndicator y ConfirmationDialog.

El filtro y el tamaño de muestra se expresan en parámetros de la misma ruta, sin HTML independientes: `/compras/revisar?ejemplo=grande&vista=pendientes`. Son estado de navegación de demostración; no contienen compras de la usuaria ni producen efectos económicos. Los cambios de filtro conservan el total del conjunto completo y no vuelven a enfocar el contenido principal; el cambio de pantalla sí ajusta título y foco.

Los datos de revisión se transcribieron de las referencias aprobadas. Las compras pequeñas y grandes son borradores separados del gasto histórico. Los cuatro desembolsos y las categorías suman $286.400; la compra breve suma $61.100 y la de 50 productos $435.600. Se comprueba esa coherencia en pruebas, sin introducir cálculos financieros definitivos en el producto.

## Dependencias y compatibilidad

| Uso | Versiones fijadas |
| --- | --- |
| Interfaz | React y React DOM 19.3.1. |
| Navegación | React Router 7.18.6. |
| Compilación y tipos | Vite 8.3.8, plugin React 6.3.0, TypeScript 6.0.3. |
| Pruebas DOM | Vitest 4.1.12, React Testing Library 16.3.3, user-event 14.6.13, jest-dom 6.9.1, jsdom 27.4.0. |
| Navegador | Playwright Test 1.65.1 y Chromium instalado previamente. |

Se verificaron versiones estables y sus motores mediante metadatos del registro npm. React Router 8.5.2 exige Node >=22.22 y Vitest 5.1.1 exige Node 22.12 o ramas posteriores compatibles; se eligen sus ramas estables anteriores compatibles con Node 20.19.5. No se usan versiones prerelease. `package-lock.json` fija el árbol completo.

No se instala Tailwind ni otra biblioteca visual: el CSS aprobado reproduce la interfaz con menor cambio y sin nuevas dependencias de diseño. Referencias técnicas: [guía oficial de Vite](https://vite.dev/guide/), [React Router en modo declarativo](https://reactrouter.com/7.18.6/start/declarative/installation), [versionado de React](https://react.dev/versions) y [Vitest](https://vitest.dev/guide/). Para la instalación exacta prevalecen las versiones y motores del archivo de bloqueo.

## Diferencias visuales justificadas

- Se retiran «Propuesta visual», la barra de exploración de archivos HTML, la galería y sus enlaces técnicos de la aplicación React.
- Se añade un aviso breve de datos ficticios y falta de guardado, necesario para no aparentar operaciones implementadas.
- Las acciones pendientes usan controles nativos deshabilitados y explicación accesible; por ello se ven más neutras que algunos botones verdes inactivos de las referencias.
- Se añade un selector etiquetado de compra de 5/50 productos; reemplaza los enlaces de exploración de ejemplos y permite evaluar ambas muestras sin cambiar de pantalla.
- Los valores visuales de selectores dependen de sus propiedades React y se actualizan con la selección; no se reutiliza el espejo estático del HTML como estado independiente.
- Se conserva la navegación adaptativa por espacio relativo al texto y la navegación contextual del registro. La confirmación usa un diálogo nativo, con Escape y restauración del foco.
- El historial muestra fecha completa con año para hacer explícito el periodo de los datos ficticios. No implica elegir otra política de fechas reales.

No se ha introducido una identidad nueva ni una plantilla de dashboard.

## Validación realizada

Se ejecutaron comprobación TypeScript, build de producción y 20 pruebas Vitest/Testing Library. Estas últimas cubren rutas, navegación, foco DOM, controles inactivos, datos conciliados, selección de muestra, filtro, etiquetas, errores de campo, estados y confirmación de salida. La preparación de jsdom simula solo apertura/cierre del diálogo; no se presenta esa simulación como una prueba de foco modal del navegador.

También pasaron **66 pruebas en Chromium real**: 64 combinaciones de ocho vistas (seis rutas, más compra grande y su vista de pendientes), cuatro anchos —360, 390, 430 y 768 px— y dos escalas de raíz tipográfica —100 % y 200 %—, más dos recorridos de teclado/confirmación. Se verificaron:

- Carga directa de cada ruta y presencia de su encabezado.
- Ausencia de errores de ejecución o mensajes de consola de nivel error en las 64 combinaciones.
- Ausencia de desbordamiento horizontal del documento en esas combinaciones.
- Texto principal de 18/36 px según la simulación.
- Navegación en flujo al 200 % en los tres móviles estrechos; altura acotada de la barra cuando se mantiene fija.
- Acceso al último enlace de contenido sin quedar bajo la barra fija en las páginas que lo contienen.
- Conteos de 50/6 productos y total completo en ambas vistas de compra grande.
- Tabulación hasta Registrar compra, activación por Enter, apertura de un artículo por teclado, Escape de la confirmación y restauración del foco.

Se hizo una ejecución adicional de nueve casos para conservar capturas explícitas, además de las mediciones de la matriz. Tras completar el icono de búsqueda del campo de inventario se repitieron y pasaron los ocho casos afectados de esa pantalla, las comprobaciones de tipos, el build y las 20 pruebas DOM. Las capturas son datos ficticios de interfaz, no fotografías de recibos.

## Evidencia visual

Se generaron capturas de las seis pantallas a 390 px, dos vistas de compra grande y de Inicio a 360 px con texto al 200 %. Se inspeccionaron las capturas de Inicio, Inventario, Revisión breve e Inicio ampliado. El marco de foco visible en una captura refleja el control enfocado por la prueba. Una captura de página completa puede mostrar la barra fija en el límite del viewport original; el contenido real puede desplazarse y tiene reserva inferior.

- [Inicio, 390 px](../artifacts/phase-03a/390-100-inicio.png).
- [Inventario, 390 px](../artifacts/phase-03a/390-100-inventario.png).
- [Revisión, 390 px](../artifacts/phase-03a/390-100-compras-revisar.png).
- [Compra grande](../artifacts/phase-03a/390-100-compras-revisar-ejemplo-grande.png).
- [Pendientes de compra grande](../artifacts/phase-03a/390-100-compras-revisar-ejemplo-grande-vista-pendientes.png).
- [Inicio, 360 px, texto 200 %](../artifacts/phase-03a/360-200-inicio.png).

## Límites y decisiones pendientes

No se verificaron Safari, Firefox, dispositivos físicos Android/iPhone, lectores de pantalla, ajustes nativos de texto ni zoom completo. Las comprobaciones descritas no constituyen certificación WCAG. Los filtros de inventario y gastos, las marcas de lista y toda operación de escritura siguen inactivos; la navegación y el filtro de revisión no deben confundirse con lógica de compra terminada.

DP-01 a DP-13 conservan las decisiones pendientes que no haya resuelto expresamente el solicitante: acceso, precisión, unidades, descuentos, corrección posterior, recuperación, límites, catálogos, fechas, coincidencias, validación con la usuaria, precios históricos y gastos sin inventario. Los tipos de demostración y las cifras enteras no las aprueban por adelantado.

Gemini se omitió: en las fases anteriores falló por falta de autenticación y no se repitió el intento sin credenciales configuradas. Se hizo revisión propia del código, contratos de componentes y resultados de pruebas.

Git no permite consultar rama, estado o diff: la `.git` visible está vacía y es de solo lectura. No se inicializó ni modificó, no hubo commits ni push. Se guardaron huellas antes del trabajo y se comprobó que los documentos originales, las referencias visuales y los ZIP existentes permanecen intactos.

Para ejecutar, consultar [README.md](../README.md). La implementación de Fase 03B queda pendiente de autorización.
