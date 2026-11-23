# Mi Casa — Requisitos

Especificación base de fase 1, actualizada el 23-11-2026 en 05C-4: aprobaciones de inventario DP-03/07/08/10 según [registro del propietario](architecture/OWNER_DECISION_REVIEW.md). La evidencia de implementación/pruebas se documenta por fase; esta actualización no conecta servicios reales.

## 1. Convenciones y prioridad

- **O — Obligatorio solicitado:** procede expresamente del encargo y pertenece a V1.
- **D — Derivado necesario:** condición de coherencia, privacidad o verificabilidad para cumplir lo solicitado; no agrega un módulo de producto.
- **P — Propuesta pendiente:** alternativa que requiere aprobación; no se cuenta como requisito obligatorio.
- **F — Futuro opcional:** fuera de V1, sin compromiso de implementación.

Los identificadores RF corresponden a requisitos funcionales; RNF, a no funcionales. Cada fila O/D incluye una condición observable para su futura aceptación. Las decisiones DP se definen exclusivamente en [VISION.md](VISION.md#8-decisiones-pendientes-de-aprobación); los casos CU y las reglas RB están en sus documentos respectivos.

## 2. Inventario y productos

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-INV-01 | O | Incorporar al inventario todos los productos físicos de una compra confirmada | Cada línea física queda vinculada a un producto y produce el efecto correspondiente al modo de control una sola vez. |
| RF-INV-02 | O | Ofrecer control exacto de cantidades, unidades, peso o volumen | Se identifica la unidad del saldo y se actualiza sin sumar magnitudes incompatibles. DP-03 aprobado: unidades individuales enteras, kg/L hasta tres decimales, conversiones explícitas g/kg y ml/L y contenido confirmado de envases. DP-02 monetaria sigue pendiente. |
| RF-INV-03 | O | Ofrecer control sencillo: Hay suficiente, Queda poco y Agotado | Se pueden consultar y cambiar los tres estados, sin exigir una cantidad exacta ficticia. Estados aprobados en DP-03; sin umbrales automáticos. La política de futuras compras no se implementa aquí. |
| RF-INV-04 | O | Buscar productos del inventario | Una búsqueda permite encontrar y seleccionar productos existentes; un resultado vacío permite iniciar su creación. |
| RF-INV-05 | O | Crear y editar productos | Se puede definir y corregir su nombre, categoría y modo de control; no se altera por ello el historial financiero. Nombre/presentación/categoría editables; cambios de base o control con historial exigen migración específica, DP-03. Catálogo aprobado en DP-08. |
| RF-INV-06 | O | Actualizar existencias manualmente | Se puede registrar la cantidad actual o el estado observado sin generar un gasto nuevo. |
| RF-INV-07 | O | Clasificar productos por categorías | El inventario muestra la categoría y permite usarla al registrar productos; catálogo de siete IDs aprobado en DP-08; Sin clasificar por defecto, distinto de Otros, sin pantalla adicional de administración. |
| RF-INV-08 | O | Reconocer productos existentes para evitar duplicaciones innecesarias | Durante revisión y registro manual se ofrecen coincidencias y la posibilidad de seleccionar un producto; una coincidencia dudosa exige confirmación humana, permite presentaciones distintas y nunca fusiona automáticamente. IDs independientes del nombre; reintentos del mismo ID no duplican operaciones, DP-10. |
| RF-INV-09 | D | Separar presentación comercial de unidad del inventario | «2 botellas de 1 L» permite distinguir cantidad de compra y volumen; si falta el contenido, no se inventa. |
| RF-INV-10 | D | Conservar la identidad histórica del producto | Cambiar el nombre o categoría actuales no reescribe lo que describía una compra anterior. Política detallada: RB-PR-04. |

No se registran ubicaciones dentro de la casa. No se aprueba eliminación o fusión de productos con historial por incluir creación y edición.

## 3. Compras y revisión

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-COM-01 | O | Iniciar una compra con una fotografía de recibo | La imagen puede pasar a reconocimiento y revisión sin producir aún gasto o stock. |
| RF-COM-02 | O | Usar varias fotografías de un mismo recibo | Se revisan dentro de una sola compra; repetir el total en otra foto no lo vuelve a sumar. |
| RF-COM-03 | O | Registrar una compra completamente a mano | Se completa y confirma sin fotografía ni ejecución exitosa de OCR. |
| RF-COM-04 | O | Editar productos, cantidades y precios detectados | Los cambios se reflejan en el borrador y su resumen antes de confirmar. |
| RF-COM-05 | O | Eliminar artículos incorrectos durante revisión | Se retiran de los cálculos y no producen efectos en inventario. |
| RF-COM-06 | O | Añadir productos manualmente después del OCR | Se agregan al mismo borrador y al mismo total sin perder las otras correcciones. |
| RF-COM-07 | O | Seleccionar productos existentes durante revisión | Se vincula cada línea física al producto elegido o a uno nuevo confirmado. |
| RF-COM-08 | O | Revisar el total antes de confirmar | Se muestra el importe calculado y cualquier diferencia con el total de recibo conocido; no se ocultan ajustes. |
| RF-COM-09 | O | Actualizar gastos y existencias al confirmar correctamente | Compra, efecto financiero y efecto de inventario quedan coherentes; un fallo no se presenta como compra finalizada. |
| RF-COM-10 | D | Cancelar un borrador sin efectos económicos ni de stock | Cancelar descarta sus líneas e imágenes; no crea productos definitivos por el mero resultado del OCR. |
| RF-COM-11 | D | Evitar duplicación por doble toque, reintentos y respuesta perdida | Repetir el mismo intento produce una sola compra y un solo efecto de reposición. |
| RF-COM-12 | D | Resolver campos necesarios sin inventarlos | No se confirma con importes o cantidades físicas necesarias sin resolver; fecha/establecimiento faltantes se tratan según DP-09. |
| RF-COM-13 | D | Detectar cambios concurrentes al guardar | Otra pestaña o dispositivo no sobrescribe existencias con un saldo obsoleto; si requiere revisión se explica y no se confirma parcialmente. |

La edición aquí exigida corresponde al borrador anterior al guardado. Editar, anular o devolver compras confirmadas está pendiente en DP-05.

## 4. Reconocimiento e interpretación de recibos

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-OCR-01 | O | Intentar identificar establecimiento, fecha, productos, cantidades y precios | Se proponen los campos encontrados y se distinguen los faltantes; no se garantiza su extracción completa. |
| RF-OCR-02 | O | Admitir recibos de cualquier establecimiento | No existe una lista de comercios permitidos que impida registrar la compra; el registro manual sigue disponible con formatos desconocidos. |
| RF-OCR-03 | O | No inventar productos ni precios de baja confianza | Los campos dudosos quedan por revisar o vacíos, con indicación comprensible; no se sustituyen por valores aparentemente ciertos. |
| RF-OCR-04 | O | Continuar manualmente si falla todo el OCR | Tras el error puede completarse la compra sin repetir reconocimiento. |
| RF-OCR-05 | D | Separar confianza del OCR y validez de la compra | Una lectura de texto aparentemente segura no omite validaciones de cantidades, importes, productos y total. |
| RF-OCR-06 | D | Tratar superposiciones y repeticiones sin perder artículos legítimos | Se pueden revisar posibles líneas repetidas; dos líneas iguales no se eliminan solo por tener mismo nombre o precio. |
| RF-OCR-07 | D | Permitir abandonar reconocimiento y resolverlo manualmente | Un OCR lento, cancelado o parcialmente fallido no bloquea el registro manual ni borra las ediciones ya realizadas. |

La selección de umbrales, idiomas, formatos, preprocesamiento y límites de recursos se valida en DP-07. Un parser universal infalible no forma parte del compromiso.

## 5. Fotografías y recursos temporales

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-FOT-01 | O | Tratar las fotografías como temporales | No se almacenan de forma permanente en Firebase Storage, Firestore u otro repositorio. |
| RF-FOT-02 | O | Eliminarlas tras confirmar y guardar correctamente | Después del acuse de guardado, dejan de estar disponibles para la aplicación; no se adjuntan al historial. |
| RF-FOT-03 | O | Descartarlas al cancelar | Cancelar elimina las referencias y recursos temporales del borrador. |
| RF-FOT-04 | O | Contemplar errores e interrupciones | Se especifican los desenlaces de la tabla de ciclo de vida en RB-FT-03, incluyendo cierre inesperado y resultado incierto. |
| RF-FOT-05 | O | No conservar el texto OCR completo después de registrar | El historial conserva solo campos estructurados necesarios; no incluye texto íntegro ni imagen codificada. |
| RF-FOT-06 | D | Limpiar copias y recursos derivados | Se revisan originales, recortes, miniaturas, canvas, object URLs, workers y tareas tardías; ningún recurso vuelve a incorporarse después de cancelar. |

La exclusión del almacenamiento persistente del navegador y el procesamiento exclusivamente local son políticas técnicas propuestas en DP-06. La prohibición de almacenamiento permanente es obligatoria en cualquier alternativa.

## 6. Gastos e historial

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-GAS-01 | O | Registrar el dinero gastado en cada compra confirmada | El gasto corresponde al importe final validado, no al mero resultado del OCR. |
| RF-GAS-02 | O | Consultar por fecha, categoría y establecimiento | Los filtros muestran los registros del criterio elegido y un total consistente para ese mismo conjunto. |
| RF-GAS-03 | O | Conservar historial de precios | Se puede recuperar el importe y contexto de una adquisición anterior sin depender del precio actual del producto; interpretación de precio unitario: DP-12. |
| RF-GAS-04 | O | Registrar gastos sin inventario | Un servicio u otro gasto no físico aumenta el gasto sin crear existencias; los productos físicos no usan esta excepción. |
| RF-GAS-05 | O | Evitar duplicación de importes | El informe no suma simultáneamente total de compra, líneas y movimientos como gastos distintos. |
| RF-GAS-06 | O | Mostrar importes en pesos colombianos | La interfaz identifica COP y emplea formato comprensible; precisión y redondeo pendientes en DP-02. |
| RF-GAS-07 | D | Conservar datos estructurados del historial | Las compras guardan productos o conceptos, cantidades aplicables, importes, fecha y establecimiento según la política acordada, sin fotos ni OCR íntegro. |
| RF-GAS-08 | D | Conciliar categorías con total | Cada importe neto se atribuye una sola vez; descuentos y cargos no desaparecen ni se duplican. Algoritmo propuesto en DP-04. |

La representación de un gasto independiente y una compra mixta se propone en DP-13; no supone añadir un segundo libro contable ni duplicar formularios.

## 7. Lista de compras temporal

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-LIS-01 | O | Crear una lista temporal y añadir artículos | Se pueden anotar artículos para la compra en curso. |
| RF-LIS-02 | O | Marcar lo que se va comprando | Marcar o corregir una marca afecta únicamente la lista. |
| RF-LIS-03 | O | Finalizar y descartar la lista | Al finalizar se elimina su contenido de uso activo sin crear un archivo permanente de listas. |
| RF-LIS-04 | O | Mantener independencia respecto al inventario | Marcar y finalizar no alteran existencias ni registran gastos. |

Persistencia entre recargas o cierres: DP-06. No se aprueban múltiples listas, recomendaciones ni conversión automática de lista a compra.

## 8. Acceso y privacidad

| ID | Tipo | Requisito | Criterio de aceptación |
| --- | --- | --- | --- |
| RF-AUT-01 | O | Autenticar con Firebase Authentication | La cuenta de la usuaria permite acceder a sus datos; proveedor y recuperación pendientes en DP-01. |
| RF-AUT-02 | O | Mantener el alcance de una sola usuaria | No se requieren roles, administración de cuentas ni colaboración. |
| RF-AUT-03 | D | Denegar acceso a datos sin autorización | Una petición directa sin sesión o con otra identidad no puede leer ni modificar los datos de la usuaria. |
| RF-AUT-04 | D | Tratar expiración y cierre de sesión | Si la sesión vence durante guardado, no se anuncia éxito sin comprobarlo; cerrar sesión libera recursos temporales y evita mostrar datos privados residuales. |

## 9. Requisitos no funcionales

| ID | Tipo | Requisito | Verificación prevista |
| --- | --- | --- | --- |
| RNF-UX-01 | O | Mobile-first, con textos grandes y legibles y botones grandes | Revisar tareas en pantalla móvil, lectura y precisión táctil con la usuaria; parámetros en DP-11. |
| RNF-UX-02 | O | Buen contraste y experiencia accesible | Revisar colores, foco, etiquetas y mensajes; el nivel normativo propuesto está en DP-11. |
| RNF-UX-03 | O | Lenguaje cotidiano, navegación evidente y pocos pasos | Prototipar los CU y detectar bloqueos, pasos innecesarios y términos técnicos visibles. |
| RNF-UX-04 | O | Errores comprensibles y confirmaciones claras | Cada error indica qué ocurrió, qué se conservó y cómo continuar; guardado incierto se distingue de éxito. |
| RNF-UX-05 | O | Diseño moderno, elegante y cálido, sin aspecto infantil ni dashboard empresarial | Evaluar propuestas visuales con la usuaria antes de desarrollar pantallas. |
| RNF-ACC-01 | D | Operar sin depender solo de color, gestos o iconos | Estados con texto, controles etiquetados, teclado y foco visibles; probar zoom y lector de pantalla en los recorridos principales. |
| RNF-INT-01 | D | Coherencia del guardado | Verificar todo o nada entre compra y efectos, concurrencia, identidad de operación y conciliación tras errores. |
| RNF-INT-02 | D | Cálculos reproducibles | Verificar cantidades, unidades y dinero con valores exactos y política de redondeo acordada; nunca rellenar desconocidos con cero. |
| RNF-SEG-01 | D | Autorizar y validar fuera de la interfaz | Probar reglas Firestore contra accesos y escrituras directas indebidas; ocultar botones no se considera seguridad. |
| RNF-PRI-01 | D | Minimizar datos y evitar filtraciones de recibos | Inspeccionar tráfico, errores, telemetría, cachés y almacenamiento; no registrar fotos, OCR íntegro ni credenciales. |
| RNF-REN-01 | D | Mantener capacidad de interacción durante OCR | La usuaria ve el estado y puede continuar por otra vía; medir memoria y tiempos en el dispositivo elegido, DP-07/DP-11. |
| RNF-PWA-01 | O | Entregar una PWA en fases posteriores | Validar instalación y comportamiento acordado en navegadores objetivo; no implica funcionamiento completo offline, DP-06. |
| RNF-COS-01 | O | Intentar mantenerse en el plan gratuito Firebase | Estimar y medir consumo de Auth, Firestore y Hosting; documentar límites sin prometer coste cero ilimitado. |
| RNF-ARQ-01 | O | Respetar stack y exclusiones acordados | React/TypeScript/Vite/Tailwind, servicios Firebase previstos y Tesseract.js; sin Django, SQL ni archivo permanente de imágenes. |
| RNF-PRU-01 | O | Prever Vitest, React Testing Library y Playwright | En implementación, separar pruebas de reglas y cálculos, interacción y recorridos completos; no instalar herramientas en fase 1. |

## 10. Propuestas y mejoras futuras

| ID | Tipo | Posible ampliación o decisión | Referencia y condición |
| --- | --- | --- | --- |
| PROP-01 | P | Recuperar borrador estructurado y lista después de un cierre | DP-06; decidir persistencia, privacidad y limpieza, manteniendo imágenes fuera de ella. |
| PROP-02 | P | Repartir descuentos generales proporcionalmente | DP-04; validar residuos y categorías con ejemplos antes de adoptarlo. |
| PROP-03 | P | Definir umbral «Queda poco» en productos exactos | DP-03; no calcular un umbral arbitrario o aprenderlo automáticamente. |
| PROP-04 | P | Adoptar parámetros visuales y objetivo WCAG medible | DP-11; validar tamaños y dispositivo antes del diseño definitivo. |
| FUT-01 | F | Aprender alias de abreviaturas comerciales | DP-10; mejora opcional del reconocimiento, sin sustituir revisión. |
| FUT-02 | F | Fusión asistida de productos y avisos por recibos similares | DP-10; exige reglas para historial y falsos positivos. |
| FUT-03 | F | Rectificación trazable, anulación o devolución de compras guardadas | DP-05; requiere alcance explícito y coherencia financiera y de stock. |
| FUT-04 | F | Sincronización completa de compras offline | DP-06; exige estrategia propia de conflictos y confirmación, no se deriva de ser PWA. |

Las exclusiones de V1 en VISION.md no se convierten en tareas futuras aprobadas por aparecer mencionadas.

## 11. Trazabilidad resumida

| Recorrido | Requisitos principales | Reglas principales | Objetivos |
| --- | --- | --- | --- |
| CU-01 Foto(s) | RF-COM-01, RF-COM-02, RF-OCR-01, RF-COM-09, RF-FOT-02 | RB-CO-01 a RB-CO-07, RB-FT-01 a RB-FT-04 | OBJ-01, OBJ-04, OBJ-05 |
| CU-02 Manual | RF-COM-03, RF-GAS-04, RF-INV-01 | RB-PR-01, RB-CA-01, RB-GA-01 | OBJ-01, OBJ-02, OBJ-03 |
| CU-03 Corrección | RF-COM-04, RF-COM-05, RF-COM-08 | RB-CO-03, RB-IM-01 a RB-IM-04 | OBJ-04 |
| CU-04 Añadidos | RF-COM-06, RF-COM-07, RF-INV-08 | RB-PR-02, RB-CO-05 | OBJ-01, OBJ-02 |
| CU-05 Inventario | RF-INV-02 a RF-INV-07 | RB-CA-01 a RB-CA-04, RB-IN-01 a RB-IN-04 | OBJ-02 |
| CU-06 Gastos | RF-GAS-01 a RF-GAS-08 | RB-GA-01 a RB-GA-04 | OBJ-03 |
| CU-07 Lista | RF-LIS-01 a RF-LIS-04 | RB-LI-01, RB-LI-02 | OBJ-06 |
| CU-08 Error OCR | RF-OCR-03, RF-OCR-04, RF-OCR-07, RF-FOT-04 | RB-CO-02, RB-FT-03 | OBJ-01, OBJ-04, OBJ-05 |
| CU-09 Gasto sin stock | RF-GAS-04, RF-GAS-05 | RB-GA-01, RB-PR-01 | OBJ-03 |
| CU-10 Guardado incierto | RF-COM-11, RF-COM-13, RF-AUT-04 | RB-CO-06, RB-CO-07, RB-FT-03 | OBJ-01, OBJ-05 |

Los intervalos de IDs en esta tabla son referencias de lectura, no requisitos adicionales. Los CU-09 y CU-10 explicitan comportamientos necesarios ya solicitados, sin añadir módulos.

## 12. Estrategia de verificación futura

1. **Reglas y cálculos:** saldos, conversiones autorizadas, descuentos, redondeo, categorías y valores faltantes con Vitest.
2. **Interacción:** revisión, corrección, campos dudosos, adición manual, mensajes accesibles y estados de espera con React Testing Library.
3. **Integración remota:** reglas con emulador Firebase, atomicidad, identidad y concurrencia. Es una validación futura, no configuración realizada en esta fase.
4. **Recorridos completos:** fotos, manual, cancelación, error OCR, sesión vencida y respuesta perdida con Playwright; cámara y rendimiento también requieren pruebas en dispositivo real.
5. **Privacidad:** inspeccionar tráfico, almacenamiento y limpieza de recursos en todos los desenlaces; usar recibos sintéticos o ejemplos autorizados, sin datos sensibles en registros de prueba.
6. **Uso:** validar comprensión y accesibilidad con la usuaria; contrastar métricas acordadas en DP-11.

En fase 1 se verifica cobertura, coherencia entre documentos, identificadores y enlaces locales. No corresponde ejecutar pruebas de una aplicación todavía inexistente.
