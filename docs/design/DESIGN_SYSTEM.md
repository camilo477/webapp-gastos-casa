# Mi Casa — Sistema de diseño

Estado: **Fase 02 con identidad y organización aprobadas provisionalmente**. Esta revisión corrige accesibilidad con texto ampliado, compras grandes y navegación de registro. Los ajustes quedan para revisión; la aplicación real sigue sin implementarse.

## 1. Alcance y fuentes

Fuentes funcionales: [visión](../VISION.md), [requisitos](../REQUISITOS.md), [reglas de negocio](../REGLAS_NEGOCIO.md) y [casos de uso](../CASOS_USO.md). El encargo de Fase 02 concreta la navegación en Inicio, Inventario, Mi lista y Gastos, con «Registrar compra» especialmente visible.

Esta fase entrega diseño de las seis pantallas principales, estados y formularios auxiliares, documentación y HTML/CSS estático. No implementa React, OCR, autenticación, Firebase, almacenamiento, cálculos de negocio ni persistencia. Los cuatro documentos originales se mantienen intactos.

El encargo actual confirma WCAG 2.2 AA como objetivo de diseño, texto principal preferentemente de 18 px y objetivos frecuentes de al menos 48 × 48 px. Esto concreta parte de DP-11; siguen pendientes el dispositivo real, las pruebas con la usuaria y la aceptación final del diseño. Las demás DP conservan su estado pendiente.

## 2. Dirección visual: un hogar tranquilo y actual

Marfil cálido, verde profundo, superficies blancas y salvia suave. Tipografía limpia, títulos con carácter, espacio suficiente y alineaciones claras. El dinero tiene jerarquía sin dominar todas las pantallas.

Se usa un bloque destacado para el gasto mensual y superficies solo cuando agrupan una unidad comprensible: resumen de compra, compras recientes o lista activa. El inventario es una lista con separadores, no un conjunto de tarjetas independientes. No hay degradados, sombras decorativas, ilustraciones infantiles ni indicadores empresariales.

La marca provisional combina «Mi Casa» con una casa de trazo sencillo sobre verde. No es un logotipo definitivo ni una decisión sobre registro de marca. La frase «Lo de casa, a tu ritmo» es una propuesta editorial que puede retirarse.

## 3. Color y contraste

Tokens compartidos en [styles.css](../../design/preview/styles.css). Los ratios se calcularon con luminancia relativa sRGB; se redondean aquí a dos decimales. No constituyen una auditoría completa de accesibilidad.

| Token CSS | Valor | Uso |
| --- | --- | --- |
| `--canvas` | `#FAF8F3` | Fondo de la aplicación. |
| `--surface` | `#FFFFFF` | Formularios y grupos de contenido. |
| `--green` | `#256B57` | Acción principal, enlaces e iconos. |
| `--green-dark` | `#174F40` | Énfasis sobre salvia, foco y marca. |
| `--green-soft` | `#E3EEE6` | Resumen mensual y selección de navegación. |
| `--ink` | `#25312D` | Texto principal. |
| `--muted` | `#59665E` | Texto secundario legible. No bajar opacidad. |
| `--line` | `#DCE2DA` | Separadores decorativos; no usar como único límite de un campo. |
| `--control-line` | `#7C8B81` | Contorno reconocible de campos y selectores. |
| `--terracotta` | `#B65F43` | Acento decorativo de la paleta inicial. No usar como texto pequeño sobre blanco. |
| `--warning` | `#93472F` | Texto, icono y borde de advertencias. |
| `--warning-soft` | `#FFF0E8` | Fondo de advertencia. |
| `--error` | `#A13737` | Error o acción destructiva explícita. |
| `--error-soft` | `#FFF0EF` | Fondo de error y estado «Se agotó». |

| Combinación evaluada | Ratio | Criterio de uso |
| --- | --- | --- |
| Texto `#25312D` sobre marfil | 12,72:1 | Texto principal. |
| Texto secundario `#59665E` sobre marfil | 5,67:1 | Texto secundario. |
| Blanco sobre verde `#256B57` | 6,33:1 | Botón principal. |
| Verde `#256B57` sobre salvia | 5,31:1 | Texto e iconos. |
| Advertencia `#93472F` sobre fondo de advertencia | 5,93:1 | Mensajes y etiquetas. |
| Error `#A13737` sobre fondo de error | 6,08:1 | Mensajes y etiquetas. |
| Borde `#7C8B81` sobre blanco | 3,58:1 | Límite de campos. |
| Foco `#174F40` sobre marfil | 8,88:1 | Indicador de foco. |
| Terracota inicial `#B65F43` sobre blanco | 4,46:1 | Insuficiente para texto normal; se sustituye por el tono oscuro en advertencias. |

Objetivo: al menos 4,5:1 para texto normal y 3:1 para texto grande, según la [explicación oficial de contraste WCAG](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Para límites e indicadores esenciales, revisar también contraste no textual; los separadores decorativos no sustituyen esos indicadores.

Estados, categorías y procedencia siempre llevan texto. El color de las barras de gastos es complementario: nombre e importe contienen la información completa.

## 4. Tipografía

La vista previa usa `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`, sin descargas ni peticiones externas. Esto garantiza disponibilidad local, aunque el dibujo concreto cambia entre sistemas.

Inter es una candidata para una identidad más uniforme. Atkinson Hyperlegible es una candidata para validar caracteres y reconocimiento. No se ha instalado, elegido definitivamente ni probado ninguna con la usuaria; si se acuerda una fuente propia, alojarla localmente y revisar licencia, pesos y tiempos de carga.

| Nivel | Tamaño base de referencia | Uso |
| --- | --- | --- |
| Texto principal | `1.125rem` = 18 px con raíz predeterminada de 16 px | Párrafos, campos, botones, importes y fechas de compras. |
| Texto secundario | `1rem` = 16 px | Ayuda breve, categoría, procedencia y etiquetas auxiliares. No ocultar información decisiva aquí. |
| Nombre de producto destacado | `1.25rem` = 20 px | Líneas de revisión. |
| Subtítulo | `1.375rem` = 22 px | Secciones. |
| Título móvil | `2rem` = 32 px | Una sola cabecera principal por pantalla. |
| Título amplio | `2.5rem` = 40 px | Pantallas con espacio suficiente. |
| Total mensual | 32–44 px mediante `clamp` | Un importe principal, sin saturar. |

Texto a interlineado 1,5; títulos a 1,2; botones a 1,4. Pesos 400 para lectura y 600–700 para jerarquía. Alineación izquierda; cifras con `tabular-nums`. No usar párrafos en mayúsculas, texto justificado ni fuentes de trazo fino.

La raíz permanece al 100 % de la preferencia del navegador. La maqueta no impide zoom. Usar `rem` y permitir que títulos, nombres, importes y botones aumenten su altura al crecer el texto.

## 5. Espaciado y superficies

Escala de referencia basada en 4 px: 4, 8, 12, 16, 20, 24, 32 y 48. Tipografía en `rem`; alturas de contenido naturales. El margen de página usa `clamp(12px, 5vw, 24px)` y el relleno de superficies se acota a 16–24 px: al ampliar la letra no se duplica también todo el espacio vacío. Entre secciones, 24–32 px de referencia; entre elementos relacionados, 8–12 px. No se reduce la letra para compensar falta de espacio.

Radio de superficies 18 px, campos 12 px y botones 14 px. Bordes de 1 px y ninguna sombra en la propuesta inicial. El borde más oscuro se reserva a controles y avisos. No encerrar cada párrafo en una tarjeta.

Los avisos son bloques de contenido de altura natural, con icono de 24 px, título descriptivo y siguiente acción cuando corresponde. No usar notificaciones que desaparezcan antes de poder leerlas para errores importantes o resultados de guardado.

## 6. Botones y enlaces

- **Principal:** verde sólido, blanco, mínimo 56 px de alto y ancho disponible para «Registrar compra» o «Guardar compra».
- **Secundario:** blanco con borde verde; por ejemplo «Añadir producto». Mantiene contraste y tamaño.
- **Suave:** salvia para una acción de menor prioridad; no sustituye la explicación de consecuencias.
- **Destructivo:** rojo oscuro y texto explícito para una confirmación de descarte. Sin icono aislado de papelera.
- **Acción por fila:** «Editar», «Revisar», «Quitar» o «Actualizar», con objetivo mínimo de 48 px de alto y ancho. Nombre accesible que incluya el producto.
- **Enlace:** para cambiar de pantalla o abrir un detalle; subrayado fuera de la navegación. El prototipo estático solo enlaza ejemplos, no ejecuta acciones.

Una sola acción primaria por contexto de tarea. En revisión se usa «Guardar compra» como confirmación final, sin una segunda confirmación redundante por defecto. Un dato pendiente deshabilita el guardado y muestra el motivo junto al botón, sin obligar a deducirlo de su color.

En la vista previa, los botones de muestra tienen `aria-disabled="true"` y no realizan acciones; algunos muestran `disabled` para ilustrar impedimentos reales. Esto es una limitación declarada del catálogo. En React, no usar `aria-disabled` como sustituto de impedir activación: comprobar también teclado y eventos.

Estados futuros: reposo, foco, hover para puntero, pulsación, deshabilitado y espera. No bajar opacidad de textos para simular estados inactivos. La vista previa representa reposo, foco y ejemplos inactivos; no hay un ciclo de interacción implementado.

## 7. Formularios y edición progresiva

Etiqueta visible sobre cada campo, contenido de 18 px y altura mínima de 56 px. Ayuda debajo, no dentro del placeholder como única explicación. Buscar y filtrar están a la vista; categorías en selector con etiqueta para evitar una tira horizontal que oculte opciones.

Un producto se lee primero como resumen. «Editar» o «Revisar» abre solo su formulario, propuesto como pantalla breve en móvil; el formulario se muestra como referencia en [estados.html](../../design/preview/estados.html#editar-producto). Tras «Listo, volver a la compra», se vuelve a la misma línea y se conserva la posición. El formulario auxiliar no guarda la compra completa.

La edición distingue producto existente/nuevo, cantidad comercial, presentación y precio o importe de línea. El ejemplo usa un precio por caja conocido. Cuando solo se conozca importe de línea, no exigir un precio unitario inventado. Las conversiones y la precisión siguen pendientes en DP-02/DP-03/DP-12.

Actualizar inventario propone «¿Cuánto hay ahora?» para cantidad absoluta, y selección de tres estados para control sencillo. No exige cantidades ficticias ni genera un gasto.

Errores con texto específico, `aria-invalid` y relación `aria-describedby` en el futuro componente. Tras una validación fallida, dirigir el foco al resumen de errores o al primer campo afectado según extensión; conservar los demás datos. No validar destructivamente en cada pulsación.

## 8. Navegación y jerarquía por pantalla

Barra inferior con Inicio, Inventario, Mi lista y Gastos, icono más etiqueta. La sección actual tiene fondo salvia y `aria-current="page"`. En tareas de registro no se marca una sección falsa. No se añaden perfiles, estadísticas ni menús ocultos.

La barra se fija abajo solo si el contenedor dispone de al menos `20em`, medidos con su tamaño de texto. Si no, aparece antes del contenido, dentro del flujo normal, con destinos visibles que se acomodan en filas sin partir sus nombres. Su DOM está también antes de `main`: no se usa reordenamiento visual que contradiga teclado o lectura. Con texto al 200 % en móvil estrecho se espera esta variante en flujo; no tapa contenido ni requiere ocultar destinos en un menú.

Los iconos de navegación permanecen en 24 px y su separación geométrica es acotada; las etiquetas sí crecen con el texto. Se sustituye la rejilla anterior, cuyo mínimo en `rem` pasaba a varias filas manteniéndose fijo, origen de la altura excesiva comunicada en la revisión externa. El contenido reserva espacio inferior solamente cuando existe barra fija. Navegadores sin consultas de contenedor conservan por defecto la navegación en flujo.

Durante elección, captura y revisión se usa **navegación contextual**, sin barra principal inferior y sin enlace de marca a Inicio: «Volver» y el paso actual. En captura/revisión, el ejemplo de Volver lleva a la confirmación visual de salida sin guardar; en una aplicación futura se decidirá según el estado real del borrador. No se ha implementado intercepción de salida ni recuperación.

«Registrar compra» domina Inicio. En las otras secciones se encuentra regresando a Inicio con una acción; no se apila un botón flotante adicional sobre contenido o formularios. El catálogo y sus enlaces de exploración son herramientas de diseño, no salidas que deba copiar el producto durante un registro.

| Pantalla | Jerarquía propuesta |
| --- | --- |
| A · Inicio | Marca y saludo → gasto mensual → Registrar compra → Inventario/Mi lista → compras recientes. |
| B · Inventario | Título → buscar/categoría → añadir producto → lista con cantidades o estados y Actualizar. |
| C · Registrar compra | Dos alternativas claramente descritas: foto y manual. Elegir una imagen es alternativa secundaria a la cámara. |
| D · Revisar compra | Comercio, fecha, total y contadores → Añadir producto / Ir al total → Todos o Por revisar → líneas desplegables → confirmación final. No hay barra flotante que compita con el contenido. |
| E · Mi lista | Nombre de la lista temporal → pendientes → comprados → Añadir producto → finalizar con explicación del descarte. |
| F · Gastos | Periodo/establecimiento → total → categorías → historial y categoría. Sin porcentajes financieros obligatorios ni presupuesto añadido. |

## 9. Iconografía y lenguaje

Iconos SVG integrados en el HTML, dibujados con el mismo trazo y un `viewBox` de 24 × 24. No hay biblioteca ni recurso remoto. Casa, caja, lista y cartera acompañan etiquetas de navegación; cámara, lápiz y más acompañan acciones cuando ayudan.

Iconos decorativos con `aria-hidden="true"` y sin foco. La marca tiene texto visible. Un aviso no depende únicamente de triángulos, puntos o colores.

| Situación | Texto visible |
| --- | --- |
| Control exacto | «Cantidad», junto al valor: «2 kg», «12 unidades». |
| Disponible en control sencillo | «Hay suficiente». Es la etiqueta de presentación solicitada en Fase 02 para el estado «Disponible» de Fase 01. |
| Control sencillo bajo/agotado | «Queda poco» / «Se agotó», correspondientes a «Queda poco» / «Agotado». No cambia reglas de reposición. |
| Línea reconocida | Icono de recibo + «Leído del recibo». No significa confirmación humana ni acierto garantizado. |
| Línea dudosa | Triángulo + «Por revisar» + explicación concreta. |
| Adición manual | Lápiz + «Añadido a mano». |

Usar «cuánto queda», «registrar compra» y «guardar compra». En producto, evitar OCR, transacción, persistencia, sincronización técnica y códigos de error. El catálogo de diseño puede explicar limitaciones fuera del área de mensajes destinados a la usuaria.

## 10. Estados especiales

Los 13 ejemplos visuales están en [estados.html](../../design/preview/estados.html), junto con formularios de referencia. No son resultados reales de una operación.

| Estado | Tratamiento |
| --- | --- |
| Inventario vacío | «Tu inventario empieza aquí» y Añadir producto. |
| Sin compras | «Aún no hay compras guardadas» y Registrar compra. |
| Sin lista | «¿Qué necesitas comprar?» y Crear mi lista. |
| Procesando foto | Aviso persistente y alternativa manual. El indicador estático del catálogo es ilustrativo; en React usar estado indeterminado, sin porcentaje ficticio. |
| Lectura parcial | «Hay productos por revisar», líneas identificadas y adición manual. |
| Fallo total | Ofrecer otra foto y registro manual sin perder lo revisado. |
| Total distinto | Mostrar suma, total de recibo y diferencia concreta; no añadir ajustes ocultos. |
| Sin conexión antes de enviar | Indicar que no se ha enviado; no prometer persistencia local. Copy condicionado a DP-06. |
| Guardando | Espera y prevención de reenvío; no decir todavía «guardada». |
| Éxito comprobado | «Compra guardada» solo después de comprobar todos los efectos y limpiar fotos. |
| Fallo de guardado comprobado | «La compra no se guardó» solo si se conoce que no tuvo efectos; ofrecer reintento. |
| Resultado incierto | «Estamos comprobando tu compra»; no invitar a registrar otra igual. |
| Error de consulta | No presentar un error de carga como gasto cero. |

Anuncios futuros mediante `role="status"`/`aria-live="polite"` para progreso y éxito, y alertas oportunas para errores que requieren acción. No mover foco por cada actualización ni anunciar todo el catálogo estático al cargar.

## 11. Responsive y accesibilidad

- Diseñar primero para 360–430 px, y revisar también reflujo a 320 px CSS. Sin ancho mínimo que obligue a desplazar horizontalmente.
- Contenido principal con ancho máximo de 1.088 px de referencia. Las distribuciones amplias de Inicio y gastos necesitan `42em` del contenedor; así un viewport de 768 px con texto duplicado puede mantener una sola columna. La revisión permanece en secuencia para que los filtros y saltos conserven un orden claro.
- Formularios en una columna, grillas con `minmax(0, 1fr)`, controles `min-width: 0` y alturas naturales. Se retira `overflow-wrap: anywhere` de encabezados, navegación, botones y texto corriente: se envuelven frases en espacios, sin cortar arbitrariamente palabras. Las cifras monetarias no se parten; puede saltar la línea entre símbolo, cifra y moneda.
- Botones en formato de texto en línea con icono de tamaño acotado: al envolver etiquetas no compiten con una caja de icono que se duplique innecesariamente. Cabecera con `flex-wrap`, sin esconder el lema para resolver ancho.
- Los selectores inactivos de esta maqueta conservan su control nativo etiquetado y muestran una copia visual del valor que permite varias líneas, oculta al lector para evitar duplicación. Es una solución para valores estáticos, no un selector productivo: al implementar selección real deberá mantenerse sincronizado el texto visible o elegirse un control probado que admita ampliación, sin copia desactualizada.
- No bloquear orientación, zoom o tamaño de letra. Revisar 200 % de texto, 400 % de zoom en escritorio y espaciado de texto personalizado.
- La referencia de [reflujo WCAG](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) usa 320 px CSS como anchura de referencia; no equivale a afirmar que 360 px ya verifica todo el criterio.
- El objetivo propio de 48 × 48 px supera el mínimo de 24 × 24 px con excepciones del [criterio 2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Medir las áreas reales, no solo el dibujo del icono.
- Orden de tabulación natural, enlace «Ir al contenido», encabezados jerárquicos, listas semánticas, etiquetas y nombres accesibles. La barra fija no puede ocultar el foco; referencia: [foco no oculto](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- Sin animaciones necesarias para entender; se respeta movimiento reducido y se incluyen ajustes para colores forzados. Falta probarlos en un navegador.
- No declarar conformidad WCAG completa sin auditoría de la aplicación real y prueba asistiva.

## 12. Supuestos, decisiones y aprobación

| Tema | Estado en esta fase |
| --- | --- |
| Navegación de cuatro secciones, prioridad de Registrar compra y objetivo WCAG | Indicados por el encargo de Fase 02. La propuesta concreta sigue por evaluar. |
| Paleta, marca provisional, tipografía de sistema y estructura general | Aprobación provisional comunicada por el solicitante. Se conservan; los ajustes específicos de esta revisión siguen por evaluar. |
| COP sin decimales en ejemplos | Solo datos ficticios enteros; no resuelve precisión, DP-02. |
| Cantidades y presentaciones de ejemplo | Datos ficticios; no aprueban conversiones, umbrales ni reposición, DP-03. |
| Sin descuentos en la compra principal | Permite evaluar lectura; el estado de diferencia contempla descuentos, cuyo reparto sigue pendiente, DP-04. |
| Edición después de guardar | No diseñada como acción disponible; alcance pendiente, DP-05. |
| Borrador temporal y conexión al guardar | Hipótesis para mensajes, no promesa de conservación o recuperación; DP-06 pendiente. |
| Categorías, comercios y fechas concretos | Ejemplos, no catálogos aprobados; DP-08/DP-09 pendientes. |
| Coincidencia de productos y precios históricos | Se define el lugar de revisión, sin implementar ni cerrar DP-10/DP-12. |
| Gasto sin stock | Recorrido definido en UX; representación pendiente en DP-13. |
| Límites técnicos, acceso y recuperación | DP-07 y DP-01 pendientes; no se configura ningún servicio. |

## 13. Compras grandes y formulario que faltaba

La [compra grande](../../design/preview/revisar-compra-grande.html) contiene 50 líneas: 47 reconocidas y 3 manuales, por $435.600. Seis líneas necesitan revisión. Los contadores describen procedencia y validación por separado: no se suman 47 + 6 como si fueran productos distintos.

«Todos (50)» y [«Por revisar (6)»](../../design/preview/revisar-pendientes.html) son dos vistas HTML del mismo ejemplo, con establecimiento y total idénticos. El filtro no retira artículos de la compra ni cambia su gasto. Hay una variante equivalente del ejemplo de cinco productos, con un pendiente. Esto representa el diseño del filtro, no un motor de reconocimiento ni filtrado sobre datos reales.

Cada fila muestra procedencia/duda, nombre, cantidad, importe y «Ver y editar». Un `details/summary` nativo despliega precio o explicación, Editar producto y Quitar de esta compra. Los reconocidos siguen teniendo acceso a edición; los controles de negocio continúan sin ejecutar acciones. Se conserva letra de 18 px en lectura y 20 px en nombre/importe, sin encoger para incluir más líneas.

En la cabecera de revisión se ven comercio, fecha editable, total completo, contadores y Añadir producto. «Ir al total y guardar» salta al resumen final; se repite después de cada diez productos en la muestra larga. No confirma nada por sí mismo. El guardado final permanece bloqueado con una explicación mientras hay datos necesarios pendientes; dispone de acceso de vuelta a pendientes y de Añadir producto. No se usa un pie fijo alto durante la revisión.

El [formulario de artículo no detectado](../../design/preview/estados.html#anadir-producto) muestra búsqueda de existentes y una opción desplegable de creación con nombre, categoría y forma de control. Luego presenta cantidad, unidad, precio y «Guardar artículo en la compra». Este último nombre distingue completar la línea de guardar la compra completa. Se muestra un ejemplo de 0,5 kg a $9.800 por kg, importe $4.900, sin cálculo real. Crear o reponer no presupone saldo inicial ni aprueba DP-02/DP-03.

La [salida con cambios sin guardar](../../design/preview/estados.html#salir-compra) permite evaluar «Seguir revisando» frente a «Descartar compra y salir», con pérdida explícita de borrador/fotos. Un mensaje separado recuerda que salir durante un envío no lo anula. No se guarda ni recupera un borrador.

## 14. Verificación realizada y límites

El solicitante comunicó una revisión externa de la entrega anterior a 360, 390 y 768 px, sin desbordamiento horizontal a tamaño normal, y problemas al 200 % en 360 px. Es evidencia reportada por él, no un renderizado realizado por Codex ni una aprobación de esta corrección.

En esta revisión se comprueban estructura, referencias, etiquetas, contadores, importes y conservación de los requisitos originales. Las doce vistas HTML de diseño siguen sin JavaScript ni recursos externos. El [comprobador separado](../../design/preview/comprobar-diseno.html) contiene JavaScript exclusivamente de QA, para medir 11 vistas en 88 combinaciones. No pertenece al producto ni agrega lógica de compras.

Se intentó nuevamente abrir el ejemplo con el navegador headless instalado. Terminó antes de cargar con `shutdown: Operation not permitted`. No se instalaron dependencias, se solicitaron permisos ni se buscaron vías para eludir esa restricción. La limitación anterior de renderizado permanece.

| Ancho CSS | Texto 100 % | Texto 200 % |
| --- | --- | --- |
| 360 px | Preparado en comprobador; no ejecutado aquí | Preparado; no ejecutado aquí |
| 390 px | Preparado en comprobador; no ejecutado aquí | Preparado; no ejecutado aquí |
| 430 px | Preparado en comprobador; no ejecutado aquí | Preparado; no ejecutado aquí |
| 768 px | Preparado en comprobador; no ejecutado aquí | Preparado; no ejecutado aquí |

El comprobador simula `html { font-size: 200% }`, compara ancho de documento y viewport, señala elementos que salen del ancho, mide posición/altura de navegación, busca solapamientos de foco programático y verifica etiquetas y datos de la muestra. Permite copiar resultados. No puede sustituir tabulación real, lector de pantalla, inspección visual, ajustes de texto del sistema o zoom completo. Requiere un servidor local por la política de origen de los iframes; las vistas individuales sí abren como archivos.

**No se afirma que estén comprobados visualmente desbordamientos, superposiciones o alturas finales de esta revisión**, ni que la prueba de teclado o WCAG esté superada. La aceptación de esos resultados queda pendiente de ejecutar la matriz en un navegador accesible y revisar el dispositivo real. No se generan capturas ficticias.

Las consultas de tamaño usan unidades relativas al texto del contenedor para adaptar la distribución; véase la [definición de consultas de contenedor del CSSWG](https://drafts.csswg.org/css-conditional-5/#size-container). Se conserva como objetivo la [ampliación al 200 % sin pérdida de contenido o funcionalidad](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).

Gemini no se utilizó: el intento de Fase 01 ya había fallado por falta de autenticación y no se repitió. La revisión de esta fase fue propia. Git no permite obtener diff o rama: la carpeta `.git` visible está vacía y es de solo lectura. No se inicializó ni sustituyó.

No avanzar a Fase 03 hasta la autorización del solicitante y la resolución de las decisiones que afecten al prototipo que se apruebe.
