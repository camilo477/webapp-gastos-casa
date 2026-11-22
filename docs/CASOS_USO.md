# Mi Casa — Casos de uso

Estado: fase 1. Recorridos funcionales para validar requisitos y preparar el diseño; no representan pantallas implementadas.

## 1. Convenciones comunes

Actora principal: la usuaria del hogar. Firebase y el OCR son servicios o componentes de apoyo, no actores que decidan por ella.

Los recorridos de guardado presuponen una sesión válida; el método de acceso está pendiente en DP-01. Una compra solo se considera terminada al verificar su guardado remoto con todos sus efectos. Las alternativas sin conexión o después de cerrar la aplicación dependen de DP-06; no se presuponen por ser una PWA.

La revisión y entrada manual se realizan sobre un mismo borrador. Las políticas marcadas como propuestas en [REGLAS_NEGOCIO.md](REGLAS_NEGOCIO.md) siguen pendientes, aunque el recorrido muestre cómo se usarían. El registro común de decisiones está en [VISION.md](VISION.md#8-decisiones-pendientes-de-aprobación).

Los mensajes entre comillas son propuestas de lenguaje cotidiano para el diseño posterior. No fijan componentes, pasos de navegación definitivos ni una paleta visual.

## CU-01 — Registrar una compra mediante una o varias fotografías

**Objetivo:** registrar lo comprado y su gasto aprovechando un recibo, con revisión humana.

**Referencias:** RF-COM-01, RF-COM-02, RF-COM-07 a RF-COM-13; RF-OCR-01 a RF-OCR-07; RF-FOT-01 a RF-FOT-06. Reglas RB-CO-01 a RB-CO-07 y RB-FT-01 a RB-FT-04.

**Precondiciones:** puede abrirse un borrador nuevo; hay cámara disponible o una imagen que el navegador pueda seleccionar. No se requiere un comercio preconfigurado.

**Flujo principal:**

1. La usuaria elige registrar una compra por foto.
2. Toma o selecciona la primera imagen y comprueba que el recibo sea legible. Puede añadir más imágenes del mismo recibo.
3. Inicia el reconocimiento. La aplicación informa de la espera y permite continuar por la vía manual si es necesario.
4. La aplicación propone establecimiento, fecha y líneas que pudo interpretar. Distingue datos dudosos o faltantes; no rellena productos ni precios inventados.
5. La usuaria revisa las líneas, las posibles repeticiones por superposición y las coincidencias con productos existentes. Puede corregir, eliminar y añadir artículos según CU-03 y CU-04.
6. Revisa cantidades comerciales, unidad o presentación cuando haga falta y el efecto de reposición de cada producto físico. Los conceptos sin inventario quedan identificados.
7. Revisa el total calculado, descuentos y cargos explícitos. Si se conoce el total del recibo, resuelve las diferencias antes de continuar.
8. Confirma la compra. La aplicación valida el conjunto y guarda una sola operación con los efectos correspondientes.
9. Tras comprobar el guardado remoto, muestra «Compra guardada», actualiza la información visible y descarta fotos, derivados y OCR completo de la aplicación.

**Alternativas:**

- **A1. Varias fotografías:** se tratan como partes de una compra; se revisan zonas superpuestas sin sumar encabezados o totales repetidos ni borrar líneas legítimas por similitud.
- **A2. Falta un producto:** pasa a CU-04 y vuelve al mismo resumen.
- **A3. Fecha o establecimiento no reconocido:** la usuaria lo completa; la opción de comercio desconocido y la política de fecha quedan pendientes en DP-09.
- **A4. Parte del recibo falla:** conserva las ediciones válidas y completa esa parte a mano, CU-08.
- **A5. Cámara denegada o inexistente:** se explica el problema y se permite seleccionar una imagen compatible o registrar a mano, sin bloquear el resto del servicio.
- **A6. Fotos de compras diferentes:** se explica que este registro corresponde a una compra; se retiran las fotos ajenas y se registran aparte, sin descartar en silencio datos ya revisados.

**Excepciones:**

- Archivo ilegible, formato incompatible, demasiada memoria o límite de tamaño: explicar cuál imagen no puede procesarse, conservar lo revisado y ofrecer sustituirla o seguir a mano. Los límites requieren DP-07.
- Se cancela antes de enviar: descartar borrador y fotos, sin compra, gasto o reposición definitivos.
- Error de guardado comprobado sin efectos: mantener el borrador activo para corregir o reintentar; cancelar limpia sus recursos.
- Respuesta perdida, sesión vencida o salida durante envío: CU-10. No anunciar fallo definitivo ni crear otra compra automáticamente.

**Postcondición de éxito:** una compra estructurada, un solo gasto y la incorporación de los productos físicos; sin fotografías ni OCR íntegro persistidos. **Sin confirmar:** ningún efecto de compra, gasto o inventario.

**Decisiones que afectan el diseño:** DP-02, DP-03, DP-04, DP-06, DP-07, DP-09 y DP-10.

## CU-02 — Registrar una compra completamente manual

**Objetivo:** registrar una compra sin depender de fotos ni OCR.

**Referencias:** RF-COM-03 a RF-COM-13; RF-INV-01, RF-INV-08; RF-GAS-01, RF-GAS-04 a RF-GAS-08. Reglas RB-CO-01, RB-CO-05 a RB-CO-07, RB-CA-01 y RB-GA-01.

**Precondiciones:** sesión válida para guardar; no es necesario haber permitido la cámara ni tener una foto.

**Flujo principal:**

1. La usuaria elige «Registrar a mano» y abre un borrador vacío.
2. Indica fecha y establecimiento conforme a la política acordada.
3. Busca un producto existente o prepara uno nuevo con nombre, categoría y modo de control.
4. Indica cantidad comprada e importe. Cuando haga falta para el inventario exacto, aclara unidad y presentación; la interfaz distingue precio por unidad e importe de línea.
5. Repite para los demás artículos. Si existe un concepto sin inventario, lo registra como tal sin inventar un producto físico.
6. Revisa los artículos y el total; corrige o retira errores y añade descuentos o cargos con la política que se apruebe.
7. Confirma y espera la comprobación del guardado.
8. La aplicación muestra la compra, el gasto y las existencias actualizadas una sola vez.

**Alternativas:**

- Artículo comprado gratuitamente: permite un importe cero confirmado; no confundirlo con un precio desconocido.
- Varias líneas del mismo producto: conservan sus importes y se acumula su efecto de inventario compatible.
- Solo hay un servicio u otro concepto sin stock: CU-09.

**Excepciones:**

- Cantidad exacta sin unidad compatible, importe no numérico o campo necesario sin resolver: indicar el campo y conservar los demás datos; no confirmar.
- No sabe cuánto había en casa antes de la compra: aplicar la política pendiente DP-03; no asumir un saldo inicial exacto.
- Cancelar antes del envío: descartar el borrador sin efectos.
- Fallo o incertidumbre del guardado: mismo tratamiento de CU-10 que una compra por foto.

**Postcondición de éxito:** efectos equivalentes a una compra por foto, sin ejecutar OCR ni crear imágenes.

**Decisiones:** DP-02, DP-03, DP-04, DP-08, DP-09 y DP-13.

## CU-03 — Corregir una compra reconocida antes de confirmar

**Objetivo:** convertir una propuesta imperfecta en una compra revisada.

**Referencias:** RF-COM-04, RF-COM-05, RF-COM-07, RF-COM-08, RF-COM-12; RF-OCR-03, RF-OCR-05, RF-OCR-06. Reglas RB-CO-02 a RB-CO-05 y RB-IM-01 a RB-IM-04.

**Precondiciones:** borrador reconocido total o parcialmente; todavía no se ha confirmado.

**Flujo principal:**

1. La usuaria abre una línea dudosa o incorrecta desde la revisión.
2. Corrige el producto o selecciona uno existente. Revisa también la presentación para no vincularlo a una unidad incompatible.
3. Corrige cantidad y precio o importe de línea, distinguiendo su significado. Los valores editados por ella tienen prioridad sobre propuestas anteriores.
4. Si la línea no corresponde a un artículo comprado, la elimina del borrador.
5. La aplicación recalcula el resumen y señala datos aún sin resolver o diferencias con el total conocido.
6. La usuaria vuelve a revisar y continúa la confirmación de CU-01.

**Alternativas:**

- Una línea fue leída dos veces por la superposición de fotos: se retira la repetición después de revisar; no se fusiona automáticamente por nombre.
- Dos líneas similares son correctas: se conservan ambas y se suma su efecto una sola vez por línea.
- El OCR confundió subtotal, cambio o dinero entregado con un artículo: se excluye ese concepto; no es un producto ni un gasto adicional.
- Falta una línea completa: CU-04.
- Repetir OCR: se informa antes de sustituir propuestas que puedan afectar datos ya corregidos; se conserva la decisión humana.

**Excepciones:**

- La diferencia con el recibo persiste: revisar descuentos, impuestos incluidos y cantidades; no crear un ajuste oculto para cuadrar.
- La nueva cantidad requiere una conversión desconocida: pedir información; no inventar contenido ni convertir magnitudes incompatibles.
- Se quiere modificar una compra ya confirmada: este recorrido no aplica. La rectificación posterior está pendiente en DP-05; no simularla con un ajuste aislado de stock.

**Postcondición:** el borrador refleja las correcciones; no hay gasto ni reposición hasta guardarlo correctamente.

**Decisiones:** DP-02, DP-03, DP-04, DP-05 y DP-10.

## CU-04 — Añadir productos manualmente después del OCR

**Objetivo:** completar un recibo sin perder lo que ya está revisado.

**Referencias:** RF-COM-06, RF-COM-07, RF-INV-01, RF-INV-05, RF-INV-08, RF-INV-09. Reglas RB-PR-01, RB-PR-02, RB-CO-01 y RB-CO-05.

**Precondiciones:** borrador abierto, aunque el OCR solo haya reconocido una parte.

**Flujo principal:**

1. Desde la revisión, la usuaria elige «Añadir producto».
2. Busca el artículo y examina las coincidencias con productos existentes.
3. Selecciona el producto correcto; si no existe, prepara uno nuevo con nombre, categoría y modo de control.
4. Indica cantidad, precio o importe y presentación cuando sea necesaria para calcular el inventario.
5. Añade la línea al mismo borrador; la aplicación actualiza el resumen sin duplicar la compra ni perder otras correcciones.
6. Repite si hace falta y vuelve a la confirmación de CU-01.

**Alternativas:**

- Un nombre parecido corresponde a otra presentación: no se fuerza la coincidencia; se aclara si es otro producto o una presentación compatible según DP-03.
- Debe añadir un servicio: añade un concepto sin inventario según CU-09, no un producto físico ficticio.
- Ya existe otra línea del mismo producto: se permite la adquisición adicional revisada y se evita inferir que es un duplicado por error.

**Excepciones:**

- Cancela la creación de la línea: vuelve al borrador anterior sin incorporación parcial.
- Cancela toda la compra: ni el OCR ni este alta preparatoria dejan existencias o gasto; la creación definitiva del producto pertenece al guardado coherente.
- Faltan cantidad o precio necesarios: se conserva como pendiente de revisión y no se confirma el conjunto hasta resolverlo.

**Postcondición:** nueva línea en el borrador, con producto elegido o preparado, total recalculado y ningún efecto definitivo todavía.

**Decisiones:** DP-03, DP-08 y DP-10.

## CU-05 — Consultar, crear y actualizar inventario

**Objetivo:** conocer lo que hay y corregir existencias según la realidad del hogar.

**Referencias:** RF-INV-02 a RF-INV-10; RNF-UX-01 a RNF-UX-04. Reglas RB-PR-02 a RB-PR-04, RB-CA-01 a RB-CA-04 y RB-IN-01 a RB-IN-04.

**Precondiciones:** acceso a los datos de la usuaria. La disponibilidad de consulta sin conexión queda pendiente en DP-06.

**Flujo principal:**

1. La usuaria abre su inventario y busca el producto que necesita consultar.
2. La aplicación muestra nombre, categoría y cantidad con su unidad, o el estado sencillo.
3. Si desea actualizarlo, introduce la cantidad que hay ahora o elige «Disponible», «Queda poco» o «Agotado», según el modo del producto.
4. Revisa el resultado y confirma la actualización.
5. Tras guardar, se muestra el inventario actualizado. Las compras y los gastos anteriores mantienen sus importes.

**Alternativas:**

- No existe el producto: puede crearlo de forma explícita, eligiendo nombre, categoría, modo y el saldo o estado inicial según DP-03. Esto no registra una compra ni inventa un gasto.
- Edita nombre o categoría: se actualiza el catálogo, conservando el contexto de adquisiciones anteriores; la política de categoría histórica está pendiente en DP-08.
- Quiere registrar que ha comprado más: inicia una compra, para que el gasto y la entrada queden vinculados; no se considera pagado nada por editar el saldo.
- Quiere cambiar de modo o unidad: se aplica la política que se acuerde en DP-03; «Queda poco» no se convierte en una cantidad ficticia.

**Excepciones:**

- Cantidad incompatible o fuera de la política numérica aprobada: indicar el problema sin descartar los demás datos.
- Otro dispositivo cambió el saldo mientras editaba: actualizar la referencia y pedir revisión cuando el ajuste absoluto ya no sea válido.
- Error de guardado: mantener un resultado claro y permitir corregir o reintentar sin duplicar una suma de existencias.

**Postcondición:** actualización de catálogo o existencias, sin crear gasto por ello. La eliminación o fusión de productos con historial no está incluida.

**Decisiones:** DP-02, DP-03, DP-06 y DP-08.

## CU-06 — Consultar gastos e historial de precios

**Objetivo:** saber cuánto se gastó y consultar adquisiciones anteriores.

**Referencias:** RF-GAS-01 a RF-GAS-08, RF-INV-10. Reglas RB-GA-01 a RB-GA-04 y RB-PR-04.

**Precondiciones:** acceso autenticado a registros confirmados. Borradores y resultados inciertos no se presentan como gastos confirmados.

**Flujo principal:**

1. La usuaria abre sus gastos y selecciona el periodo que desea consultar.
2. Puede acotar por categoría o establecimiento.
3. La aplicación muestra registros y total en COP para ese mismo conjunto, contando cada desembolso una sola vez.
4. La usuaria abre una compra o gasto y consulta fecha, establecimiento, líneas e importes estructurados.
5. Desde el producto o su contexto de compra, puede consultar adquisiciones anteriores y sus precios, con cantidad y presentación suficientes para interpretarlos.

**Alternativas:**

- Sin registros para el filtro: mostrar que no hay gastos en ese conjunto y un total de cero, sin confundirlo con fallo de carga.
- Compra con varias categorías: mostrar solo la parte atribuida a la categoría filtrada; el total general mantiene el importe completo una sola vez.
- Gasto sin inventario: aparece con su categoría e importe, sin saldo físico.
- Comercio desconocido: si se aprueba DP-09, se muestra «Sin especificar» y permanece en el total general.
- Cambio posterior de nombre o categoría del producto: el historial mantiene contexto; la política de clasificación histórica requiere DP-08.

**Excepciones:**

- Error de consulta: explicar que no pudieron cargarse los datos; no mostrar un cero definitivo como si no hubiera gastos.
- Fechas ambiguas o rango inválido: pedir corrección; no cambiar el periodo silenciosamente.
- Precios de unidades incompatibles: mostrar el contexto disponible, sin afirmar una comparación directa ni un ahorro.
- Pide volver a ver la foto: informar que no se conserva; el detalle disponible es estructurado.

**Postcondición:** solo consulta; no modifica dinero, compras o stock.

**Decisiones:** DP-02, DP-04, DP-08, DP-09 y DP-12.

## CU-07 — Crear, usar y finalizar una lista temporal

**Objetivo:** anotar lo que se necesita y marcar lo que se va comprando, sin mantener listas históricas.

**Referencias:** RF-LIS-01 a RF-LIS-04. Reglas RB-LI-01 y RB-LI-02.

**Precondiciones:** acceso a la aplicación; persistencia y recuperación de la lista pendientes en DP-06.

**Flujo principal:**

1. La usuaria crea una lista de compras temporal.
2. Añade artículos que necesita.
3. Durante la compra, marca los artículos adquiridos.
4. Al terminar, elige finalizar la lista.
5. La aplicación comunica que la lista se descartará y, tras la confirmación clara de la usuaria, la retira de uso activo.

**Alternativas:**

- Marca un artículo por error: lo desmarca; no hay reversión de compra ni cambio de stock.
- Quedan artículos sin marcar: puede continuar o finalizar igualmente, entendiendo que se descartan también los pendientes.
- Decide registrar la compra realizada: inicia CU-01 o CU-02. La marca de la lista no sustituye la confirmación del recibo.

**Excepciones:**

- Cancela la finalización: conserva la lista activa sin efectos en dinero o existencias.
- Cierre inesperado: recuperación no definida; DP-06 debe decidir si la lista sobrevive. No se promete sincronización o historial permanente.
- Si se aprueba persistencia y falla el descarte remoto: no afirmar que se eliminó completamente; informar el resultado y permitir reintentar.

**Postcondición de éxito:** lista descartada, sin compra, gasto, reposición ni recomendaciones automáticas.

**Decisión:** DP-06.

## CU-08 — Recuperarse de un error de reconocimiento

**Objetivo:** poder terminar la compra aun cuando el recibo no pueda reconocerse.

**Referencias:** RF-OCR-03 a RF-OCR-07, RF-COM-03, RF-COM-06, RF-FOT-04, RF-FOT-06. Reglas RB-CO-02, RB-CO-04 y RB-FT-02 a RB-FT-04.

**Precondiciones:** existe un borrador con una o varias fotos; OCR fallido, parcial, demasiado lento o datos poco fiables.

**Flujo principal:**

1. La aplicación informa de forma concreta: por ejemplo, «No pudimos leer esta foto. Puedes intentar otra o escribir la compra».
2. Distingue qué partes se reconocieron y cuáles faltan; no descarta correcciones ya hechas.
3. La usuaria elige continuar a mano.
4. Se detiene el trabajo OCR pendiente que ya no sea necesario. Los resultados tardíos no sobrescriben el borrador.
5. La usuaria completa productos, cantidades y precios; conserva o descarta las fotos de apoyo mientras revisa, según la política temporal acordada.
6. Revisa el total y sigue el mismo guardado de CU-02.

**Alternativas:**

- Reintentar con otra foto: libera la retirada y procesa la nueva, conservando los datos revisados salvo cambio explícito.
- Solo falló una parte: añade manualmente los artículos faltantes al mismo borrador, CU-04.
- Baja confianza en todos los precios: deja esos campos sin resolver; no rellena ceros ni precios del catálogo como si fueran los pagados.
- Cancela el registro: descarta fotos y borrador sin efectos financieros o de inventario.

**Excepciones:**

- El dispositivo no soporta OCR o no carga su motor: el registro manual continúa disponible.
- Se agota memoria y el navegador cierra la pestaña: con la política propuesta en memoria no se recuperan las fotos; no se promete ejecutar limpieza de cierre. La recuperación estructurada depende de DP-06.
- Se pierde conexión: no confundir OCR local con guardado confirmado. La propuesta inicial requiere conexión para confirmar.

**Postcondición:** compra manual o parcialmente asistida guardada por el flujo habitual, o cancelación sin efectos. Un fallo OCR nunca constituye una compra confirmada.

**Decisiones:** DP-06 y DP-07.

## CU-09 — Registrar un gasto sin inventario

**Objetivo:** registrar un desembolso que no incorpora productos físicos.

**Referencias:** RF-GAS-04 a RF-GAS-08. Reglas RB-PR-01, RB-IM-02 y RB-GA-01.

**Precondiciones:** el concepto corresponde realmente a un gasto sin stock. La representación y su acceso en la interfaz dependen de DP-13.

**Flujo principal:**

1. La usuaria indica el concepto sin inventario en un registro independiente o como parte de una compra mixta, según la solución que se apruebe.
2. Introduce importe, categoría, fecha y establecimiento conforme a las políticas acordadas. No se exige unidad física ficticia.
3. Revisa el total y confirma.
4. La aplicación comprueba el guardado y muestra el gasto una sola vez en el historial; no modifica existencias por ese concepto.

**Alternativas y excepciones:**

- En la misma compra también hay productos físicos: estos sí se vinculan al inventario y se guardan coherentemente con el conjunto.
- El concepto resulta ser un producto físico: se corrige la clasificación y se vincula al producto; no se permite omitirlo del inventario para simplificar el formulario.
- Falla o se pierde la respuesta: se aplica CU-10, sin crear un segundo gasto para reintentar.

**Postcondición:** un efecto financiero y ningún efecto de stock para las líneas sin inventario.

**Decisiones:** DP-04, DP-08, DP-09 y DP-13.

## CU-10 — Recuperarse de un guardado incierto o interrumpido

**Objetivo:** comprobar si la operación se guardó sin duplicar dinero o existencias.

**Referencias:** RF-COM-09, RF-COM-11, RF-COM-13, RF-AUT-04; RNF-INT-01. Reglas RB-CO-06, RB-CO-07 y RB-FT-03.

**Precondiciones:** la usuaria confirmó y se inició el envío con una identidad estable; falta un resultado fiable, por ejemplo por caída de red o sesión vencida.

**Flujo principal:**

1. La aplicación informa «Estamos comprobando si la compra se guardó» y evita generar otra operación por un segundo toque.
2. Conserva el identificador del mismo intento mientras esté disponible y no cambia su contenido durante la comprobación.
3. Recupera conexión o pide volver a iniciar sesión si es necesario, sin mostrar datos a otra identidad.
4. Consulta el resultado remoto y concilia el envío pendiente.
5. Si ya existe la operación completa, muestra éxito y limpia fotos y OCR íntegro. No repite entradas ni importes.
6. Si se comprueba que no se guardó y no queda un envío que pueda completarse, vuelve al borrador y permite reintentar con la misma identidad.

**Alternativas y excepciones:**

- Sin conexión todavía: mantiene el estado de comprobación; no muestra éxito por un dato local en caché ni por una escritura pendiente.
- La usuaria intenta cancelar durante envío: explica que salir puede descartar fotos, pero no deshacer una compra que ya pudo guardarse. La conciliación sigue siendo necesaria.
- Error de validación o permisos con ausencia de escritura comprobada: muestra el problema y permite corregir o recuperar acceso. Un cambio de contenido requiere que el intento anterior esté resuelto antes de reutilizar o sustituir su identidad.
- Otro proceso modificó inventario: revalidar saldos, unidades y modo. Si el resultado necesita revisión, volver al borrador sin confirmación parcial.
- Se cierra o recarga el navegador: se pierden las fotos bajo la propuesta en memoria. La recuperación del identificador y del borrador estructurado entre sesiones queda pendiente en DP-06; antes de implementar hay que resolverla. No ofrecer registrar de nuevo a ciegas una compra que pudo guardarse.
- El intento previo sigue pendiente o no puede comprobarse: mantener la incertidumbre explícita y permitir consultar historial cuando vuelva el servicio; no interpretar una única búsqueda vacía como prueba suficiente.

**Postcondición:** operación reconocida como confirmada una sola vez, o fallo sin efectos comprobado que permite reintento seguro. Si no puede determinarse, el estado sigue sin resolver; la aplicación no finge una respuesta definitiva.

**Decisiones:** DP-01, DP-06 y DP-07. La estrategia durable de reconciliación es una condición de diseño pendiente, no una funcionalidad ya construida.

## 2. Matriz de excepciones para la siguiente fase

| Situación | Recorridos afectados | Comportamiento que el prototipo debe explicar |
| --- | --- | --- |
| Cámara denegada o archivo incompatible | CU-01, CU-08 | Alternativa manual visible, sin datos inventados. |
| OCR parcial, nulo o cancelado | CU-01, CU-03, CU-04, CU-08 | Mantener correcciones y permitir completar a mano. |
| Fotos superpuestas y líneas repetidas reales | CU-01, CU-03 | Revisar duplicados sin borrado indiscriminado. |
| Cantidad, presentación o precio ambiguos | CU-02, CU-03, CU-04 | Pedir el dato necesario y distinguir vacío de cero. |
| Total diferente del recibo | CU-01, CU-02, CU-03 | Mostrar diferencia y corregir sin ajustes ocultos. |
| Falta conexión o cuota de servicio agotada | CU-01, CU-02, CU-05, CU-06, CU-10 | Diferenciar consulta incompleta, borrador y guardado confirmado; no prometer disponibilidad ilimitada. |
| Sesión vencida o respuesta perdida | CU-01, CU-02, CU-09, CU-10 | Recuperar acceso y conciliar la misma operación. |
| Cancelar antes de enviar frente a salir durante envío | CU-01, CU-02, CU-10 | El primer caso no tiene efectos; el segundo requiere comprobar el resultado. |
| Cierre inesperado | CU-01, CU-07, CU-08, CU-10 | Explicar temporalidad y recuperación que se acuerde en DP-06. |
| Error al consultar frente a ausencia de gastos | CU-06 | No presentar una carga fallida como gasto cero. |

Esta matriz es insumo para un diseño visual posterior autorizado. En esta fase no se han construido prototipos ni ejecutado recorridos de una aplicación.
