# Mi Casa — Visión del proyecto

Estado: análisis inicial, fase 1. Nombre provisional: **Mi Casa**.

Este documento describe el alcance solicitado. No autoriza implementar la aplicación ni configurar servicios. Las propuestas identificadas como **DP** requieren una decisión antes de convertirse en alcance aprobado.

## 1. Problema y propósito

Administrar productos y gastos del hogar exige recordar qué queda, interpretar recibos y anotar compras. Una aplicación demasiado técnica o con muchos pasos puede añadir trabajo y desanimar a la usuaria.

Mi Casa facilitará esas tareas mediante una PWA sencilla: fotografiar un recibo, revisar una propuesta de compra y confirmar. La compra confirmada actualizará las existencias de los productos físicos y el gasto, sin volver a introducir los mismos datos. El registro manual será una alternativa completa y accesible.

La fotografía ayuda a introducir información; no constituye una compra registrada. La usuaria siempre conserva el control sobre lo que se guarda.

## 2. Usuaria principal

Una mujer mayor que administra las compras de su hogar. Compra varias veces al mes según sus necesidades, sin una periodicidad fija. Necesita textos y controles fáciles de leer, lenguaje cotidiano, pasos evidentes y oportunidades de corregir errores.

No se presupone deterioro cognitivo, experiencia digital concreta, dispositivo específico ni necesidad de ayuda permanente. Estos aspectos deben validarse con ella. Inicialmente habrá una sola cuenta usuaria; no habrá roles ni colaboración familiar.

## 3. Objetivos

| ID | Objetivo | Evidencia de éxito esperada |
| --- | --- | --- |
| OBJ-01 | Facilitar el registro de compras | Completar un registro por foto y uno manual, incluyendo revisión y confirmación. |
| OBJ-02 | Conocer los productos disponibles | Consultar y actualizar tanto cantidades exactas como estados sencillos. |
| OBJ-03 | Entender los gastos | Consultar compras por fecha, categoría y establecimiento, sin sumar dos veces el mismo importe. |
| OBJ-04 | Permitir corregir el reconocimiento | Resolver campos dudosos, eliminar errores y añadir productos sin reiniciar la compra. |
| OBJ-05 | Proteger la privacidad | Conservar datos estructurados del historial, sin fotografías ni texto OCR completo. |
| OBJ-06 | Ofrecer una experiencia clara y cálida | Validar las tareas principales con la usuaria y controles accesibles. |
| OBJ-07 | Mantener una operación económica y sencilla | Diseñar para el plan gratuito previsto, medir consumo y evitar servicios adicionales innecesarios. |

## 4. Alcance de la primera versión

- Inventario de todos los productos físicos comprados, con categorías y controles exacto o sencillo; búsqueda, creación, edición y actualización.
- Compras por una foto, varias fotos del mismo recibo o registro totalmente manual, sin restringirse a cadenas comerciales.
- Intento de identificación de establecimiento, fecha, artículos, cantidades y precios; revisión humana antes de guardar.
- Asociación con productos existentes para reducir duplicados; las coincidencias dudosas no se aceptan automáticamente.
- Confirmación coherente de compra, gasto y existencias; historial estructurado de compras y precios.
- Gastos sin inventario cuando corresponda y consultas por fecha, categoría y establecimiento.
- Una lista de compras temporal, que puede marcarse y finalizarse sin alterar existencias ni gastos.
- Autenticación con Firebase Authentication y datos privados de la usuaria.
- PWA orientada primero a móviles, moderna, elegante, cálida y accesible.

## 5. Límites de alcance

No forman parte de la primera versión: ubicaciones dentro de la casa, roles, administración de usuarios, colaboración familiar, listas permanentes ni recomendaciones automáticas de compra. Tampoco se prevén un backend Django, SQL o archivo de imágenes.

No se han aprobado presupuestos, alertas de caducidad, códigos de barras, integraciones bancarias, exportaciones, notificaciones, devoluciones o automatizaciones de consumo. Si se evalúan después, necesitarán alcance propio; no son compromisos de esta fase.

Una PWA no implica por sí sola registro de compras sin conexión ni recuperación de borradores después de cerrar el navegador. Ese comportamiento sigue pendiente en DP-06.

## 6. Restricciones y orientación técnica

Stack previsto por el solicitante: React, TypeScript, Vite y Tailwind CSS; Firebase Authentication, Cloud Firestore y Firebase Hosting; Tesseract.js para el OCR inicial; Vitest, React Testing Library y Playwright para pruebas futuras.

La orientación propuesta es procesar las imágenes en el dispositivo y enviar únicamente datos estructurados revisados. El OCR obtiene texto; interpretar productos, precios y líneas de recibo requiere una etapa distinta. No hay garantía de reconocimiento correcto para todos los formatos.

No se utilizará almacenamiento permanente de fotografías, incluidas copias en base64, miniaturas o texto OCR completo. La política técnica detallada de recursos temporales se propone en [REGLAS_NEGOCIO.md](REGLAS_NEGOCIO.md).

La fase actual solo entrega los cuatro documentos solicitados. No incluye código, dependencias, configuración Firebase, servicios de producción, despliegue, commits ni push.

## 7. Criterios de éxito y validación futura

| ID | Criterio | Forma de verificarlo en fases posteriores |
| --- | --- | --- |
| CE-01 | Una compra solo afecta datos al confirmarse y guardarse correctamente | Comparar historial, gasto y existencias antes y después; cancelar no cambia ninguno. |
| CE-02 | Reintentar un guardado no duplica la compra | Simular doble toque, pérdida de respuesta y reconexión con el mismo identificador. |
| CE-03 | El registro manual permite terminar aunque falle el OCR | Probar error total, resultado parcial y fallo de una de varias fotos. |
| CE-04 | Todo producto físico confirmado queda vinculado al inventario | Revisar compras mixtas, artículos nuevos y selección de existentes. |
| CE-05 | El dinero se cuenta una vez | La suma por categorías concuerda con el total del mismo conjunto de compras y gastos. |
| CE-06 | No quedan imágenes ni OCR completo persistidos por la aplicación | Inspeccionar red, almacenamiento del navegador, datos remotos y registros; revisar todos los desenlaces. |
| CE-07 | La lista no produce compras por sí sola | Marcar, desmarcar y finalizar no cambia gasto ni inventario. |
| CE-08 | La usuaria puede completar las tareas principales y recuperarse de errores | Pruebas de uso con ella; tiempos, tamaño de muestra y nivel de ayuda pendientes en DP-11. |
| CE-09 | El diseño tiene una estimación verificable de consumo | Medir lecturas, escrituras, almacenamiento y descargas con un escenario de uso acordado. |

No se fija una tasa de acierto OCR ni un tiempo máximo de reconocimiento sin probar recibos y dispositivos representativos. No se afirma que estos criterios estén verificados todavía.

## 8. Decisiones pendientes de aprobación

Este registro es la referencia común para los otros documentos. Una regla marcada **P** es una propuesta, aunque se describa con detalle para poder revisarla.

| ID | Decisión pendiente | Propuesta inicial y motivo | Resolver antes de |
| --- | --- | --- | --- |
| DP-01 | Acceso, alta inicial y recuperación de cuenta | Elegir con la usuaria un método de Authentication sencillo, compatible con el presupuesto; restringir los datos a su identidad, sin registro público por defecto. | Diseñar acceso y seguridad. |
| DP-02 | Precisión del dinero, cantidades y redondeo | Representación decimal exacta o enteros con escala; COP como única moneda. Definir decimales admitidos, redondeo y reparto de residuos; no usar aritmética binaria aproximada como fuente contable. | Diseñar contratos de datos y cálculos. |
| DP-03 | Unidades, contenido de empaques y estados | Proponer unidad base por producto, conversiones explícitas, saldo inicial confirmado, ausencia de negativos; al reponer un producto sencillo proponer «Disponible» para revisión. Definir umbrales y cambios de modo sin inventar cantidades. | Diseñar edición de productos e inventario. |
| DP-04 | Descuentos globales, impuestos y cargos | Descuentos por línea explícitos; proponer reparto proporcional de descuentos generales y registrar cargos aparte con categoría explícita. Validar qué formatos reales se necesitan. | Diseñar el resumen de compra. |
| DP-05 | Correcciones después de confirmar | Proponer que una compra confirmada no se modifique directamente en V1. Si se requiere rectificación, definir una operación trazable que ajuste dinero y stock juntos; devoluciones y anulaciones no están aprobadas. | Cerrar alcance del historial. |
| DP-06 | Borradores, desconexión e interrupciones | Proponer imágenes y OCR solo en memoria; sin confirmación offline. Proponer lista y borrador estructurado solo durante la sesión inicial. Decidir si deben sobrevivir cierres y cómo recuperar un intento de guardado incierto sin guardar fotos. | Diseñar navegación, recuperación y PWA. |
| DP-07 | Límites y viabilidad sin backend propio | Medir fotos, resolución, memoria, artículos y tamaño de operación; demostrar atomicidad y validación en reglas Firestore antes de elegir esquema. No fijar límites arbitrarios ni fraccionar un guardado visible como si fuera atómico. | Aprobar arquitectura de datos. |
| DP-08 | Categorías y establecimientos | Acordar catálogo inicial y si puede editarse; proponer categorías sencillas y «Sin clasificar» explícito. No crear administradores de catálogos por defecto. | Diseñar formularios y filtros. |
| DP-09 | Fecha o establecimiento faltante | Proponer fecha confirmada por la usuaria y establecimiento «Sin especificar» si no lo conoce. Fecha de compra separada de fecha de guardado; no deducir fechas ambiguas. Validar uso de fecha local colombiana. | Diseñar validación de compra. |
| DP-10 | Coincidencias y nombres abreviados | Proponer sugerencias por nombre y presentación, confirmadas por la usuaria. Aprender alias, fusionar productos y avisar por recibos similares son mejoras opcionales. | Diseñar selección de productos. |
| DP-11 | Parámetros visuales y pruebas con la usuaria | Proponer WCAG 2.2 AA como objetivo, texto base cercano a 18 px y controles táctiles de al menos 48 × 48 px, validándolo en su dispositivo. Acordar métricas de uso y navegadores. | Autorizar diseño visual. |
| DP-12 | Interpretación del historial de precios | Conservar cantidad comprada, presentación e importe de línea; proponer distinguir precio unitario del recibo y precio efectivo tras descuentos, comparando solo unidades compatibles. No implica gráficos o predicciones. | Diseñar detalle e historial. |
| DP-13 | Representación de gastos sin inventario | Proponer un mismo registro financiero canónico para compras mixtas y gastos independientes, con líneas que indiquen si afectan inventario. Evita dos registros financieros para un mismo desembolso. | Diseñar modelo conceptual definitivo. |

Son prioritarias DP-02, DP-03, DP-04, DP-06, DP-07 y DP-13 por su impacto en coherencia y viabilidad. La autorización de la siguiente fase no implica aceptar automáticamente todas estas propuestas.

## 9. Riesgos y fundamentos técnicos

| Riesgo | Consecuencia | Orientación a validar |
| --- | --- | --- |
| Recibos heterogéneos, deteriorados o con abreviaturas | Campos incorrectos o ausentes | OCR como ayuda, revisión completa y alternativa manual; conjunto de prueba diverso y autorizado. |
| Fotos superpuestas del mismo recibo | Duplicación de líneas y del gasto | Revisar coincidencias sin borrar automáticamente repeticiones legítimas. |
| Dispositivos con poca memoria | Reconocimiento lento o pestaña cerrada | Procesamiento acotado y cancelable; límites medidos, DP-07. |
| Respuesta remota perdida o dos pestañas abiertas | Doble ingreso o saldo sobrescrito | Identidad estable de operación, reconciliación y control de concurrencia. |
| Validación únicamente en la interfaz | Acceso indebido o datos inconsistentes | Autorización y restricciones remotas; pruebas con emulador en fase de implementación. |
| Cuotas gratuitas y consultas crecientes | Interrupción del servicio o necesidad de revisar alcance | Consultas acotadas, evitar lecturas completas repetidas y medir consumo; sin promesa de coste cero ilimitado. |
| Pérdida de memoria al cerrar | Imágenes y borradores irrecuperables | Explicar el comportamiento y decidir recuperación estructurada en DP-06. |
| Sin archivo del recibo | No puede reprocesarse ni cotejarse luego desde la aplicación | Validar bien antes de confirmar y conservar datos estructurados suficientes. |

Referencias oficiales consultadas para orientar este análisis; sus límites deben verificarse de nuevo al diseñar la arquitectura:

- Firestore ofrece operaciones atómicas, reintentos por concurrencia y transacciones que requieren conexión; las reglas tienen presupuestos de acceso a documentos. Esto fundamenta evaluar DP-06 y DP-07, sin elegir todavía esquema. [Transacciones y escrituras por lotes](https://firebase.google.com/docs/firestore/manage-data/transactions).
- El tamaño de documentos y solicitudes está limitado. Evitar imágenes no elimina la necesidad de dimensionar compras grandes. [Límites de Firestore](https://firebase.google.com/docs/firestore/quotas).
- Spark y las cuotas gratuitas tienen restricciones; son referencias de presupuesto, no garantías de disponibilidad ilimitada. [Planes de Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [uso gratuito de Firestore](https://firebase.google.com/docs/firestore/pricing) y [precios por servicio](https://firebase.google.com/pricing).
- Tesseract.js ejecuta OCR en navegador; su documentación recomienda reutilizar workers y acotar su número por memoria. Esto orienta el procesamiento local propuesto, no demuestra precisión en recibos. [Proyecto Tesseract.js](https://github.com/naptha/tesseract.js), [rendimiento](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md).
- La accesibilidad medible propuesta en DP-11 se apoyará en la [referencia WCAG 2.2 del W3C](https://www.w3.org/WAI/WCAG22/quickref/).

## 10. Preparación de la fase visual

Después de recibir autorización, validar dispositivo, lectura y forma de iniciar sesión con la usuaria. Acordar las decisiones que afectan pantallas antes de dibujar flujos definitivos.

Proponer una navegación breve alrededor de «Mi inventario», «Registrar compra», «Mis gastos» y «Lista de compras», sujeta a prueba. Priorizar el recorrido foto → revisión → confirmación, con «Añadir producto» y «Registrar a mano» siempre visibles en el momento adecuado.

Explorar tonos cálidos, fondos claros, tipografía legible y jerarquía sencilla. La calidez no debe reducir el contraste. Prototipar también espera, vacío, OCR parcial, permisos de cámara denegados, errores numéricos, falta de conexión y resultado de guardado incierto. Evitar estética de panel empresarial y ayudas con tono infantil.

No se han creado pantallas, prototipos ni componentes en esta fase.

## 11. Documentación relacionada y revisión

- [Requisitos y criterios de aceptación](REQUISITOS.md).
- [Reglas de negocio e invariantes](REGLAS_NEGOCIO.md).
- [Casos de uso, alternativas y excepciones](CASOS_USO.md).

La carpeta de trabajo estaba sin archivos de aplicación visibles. La consulta Git no encontró un repositorio válido accesible; no se pudo obtener rama ni diff. No se inicializó ni alteró Git.

Se comprobó la disponibilidad de Gemini CLI y se intentó una revisión del análisis en modo de planificación. La ejecución terminó sin autenticación configurada; además, el directorio no confiable impidió mantener ese modo. No hubo revisión Gemini efectiva ni se reintentó. La revisión documental queda a cargo de Codex; no hay código que probar en esta fase.
