# Mi Casa — Vista previa visual de Fase 02

Solo HTML y CSS. No requiere instalación, compilación, conexión ni servidor.

## Abrir

Abre con tu navegador este archivo:

`/mnt/Datos/mi-casa/design/preview/index.html`

Para comparar las tres pantallas principales, abre:

`/mnt/Datos/mi-casa/design/preview/galeria.html`

La galería incluye enlaces a las seis pantallas y al catálogo de estados/formularios. Los enlaces solo cambian de ejemplo visual. Los botones y campos de la aplicación no realizan acciones, no hay búsqueda, cámara, OCR, cálculos, guardado ni almacenamiento.

## Archivos

| Archivo | Contenido |
| --- | --- |
| [index.html](index.html) | Inicio. |
| [inventario.html](inventario.html) | Inventario exacto y sencillo. |
| [registrar-compra.html](registrar-compra.html) | Elección entre foto y registro manual. |
| [revisar-compra.html](revisar-compra.html) | Compra ficticia de cinco productos; total $61.100 y un dato por revisar. |
| [mi-lista.html](mi-lista.html) | Lista temporal con pendientes y comprados. |
| [gastos.html](gastos.html) | Total mensual de $286.400, categorías, filtros e historial. |
| [estados.html](estados.html) | Trece estados y formularios auxiliares, sin interacción real. |
| [galeria.html](galeria.html) | Comparación de Inicio, Inventario y Revisión. |
| [styles.css](styles.css) | Tokens y estilos comunes. |

Las cifras son ficticias. La compra en revisión todavía no forma parte del total histórico. La galería usa marcos de página desplazables; para evaluar teclado y reflujo, abre cada pantalla completa.

## Revisión recomendada

Usa las herramientas responsive de tu navegador a 360, 390 y 430 px. Revisa también 320 px, texto al 200 %, zoom del navegador, tabulación, foco en los últimos controles y pantallas amplias. La tipografía es de sistema: puede variar según dispositivo.

El renderizado no pudo verificarse en el entorno de trabajo: Chromium y headless terminaron por operaciones bloqueadas del sistema antes de cargar las páginas. No se han comprobado visualmente desbordamientos o superposiciones. Sí se revisaron contraste por cálculo, enlaces, referencias y estructura HTML.

La documentación y los supuestos pendientes están en [DESIGN_SYSTEM.md](../../docs/design/DESIGN_SYSTEM.md), [UX_FLOWS.md](../../docs/design/UX_FLOWS.md) y [COMPONENTS.md](../../docs/design/COMPONENTS.md). Nada de esta vista previa autoriza o implementa la Fase 03.
