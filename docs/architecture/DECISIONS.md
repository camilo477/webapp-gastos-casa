# Recomendaciones DP-01 a DP-13

**Antecedente de propuestas de 04A (21-11-2026), actualizado en 05C-4 (23-11-2026).** DP-03/07/08/10 están aprobadas solo para el inventario según [OWNER_DECISION_REVIEW](OWNER_DECISION_REVIEW.md). Las demás DP y las partes excluidas conservan sus pendientes. En los bloques históricos, «Aprobación: sí» significa que requerían aprobación, no una aprobación recibida. Los IDs y problemas proceden de [VISION](../VISION.md#8-decisiones-pendientes-de-aprobación); no se sustituyen sus reglas. La aprobación de Fase 04A autoriza el análisis, no la adopción de estas recomendaciones. El diseño visual ya aprobado se conserva; sus métricas de uso real siguen pendientes.

## DP-01 — Acceso y recuperación

- **Problema:** una sola usuaria, sin registro público ni riesgo de perder su historial por cambiar de cuenta.
- **Alternativas:** Google; email/contraseña provisionados de forma controlada; enlace por correo; teléfono; anónimo.
- **Recomendación:** elegir con ella Google si ya lo utiliza, o email/contraseña y recuperación por correo si resulta más cómodo. Fijar UID autorizado en reglas, sin alta en la interfaz. La recuperación conserva UID. Documentar acceso administrativo de emergencia sin incorporarlo a la app.
- **Ventajas:** proveedor conocido, sin sistema propio de contraseñas ni roles.
- **Riesgos:** acceso al correo/proveedor, redirección en iPhone, confundir ausencia de UI de registro con bloqueo de creación de cuentas Auth. Si se exige ese bloqueo estricto, revisar infraestructura adicional.
- **Modelo:** perfil mínimo por UID; propietario implícito en ruta; sin `isOwner` editable ni secretos.
- **UX:** probar inicio/recuperación con ella; acceso persistente solo en dispositivo personal, cierre de sesión evidente.
- **Aprobación:** **sí**, proveedor, custodia/recuperación y política de sesión antes de Auth. Detalle en [SECURITY](SECURITY.md).

## DP-02 — Dinero, cantidades y redondeo

- **Problema:** exactitud entre precio, cantidad fraccionaria, descuento y total; mismo resultado en JS y reglas.
- **Alternativas:** decimales como cadenas; enteros con escala; librería decimal. COP enteros o admitir fracciones monetarias.
- **Recomendación:** COP enteros para pagado/descuento; cantidades físicas enteras escaladas a 1.000 como el prototipo. Conservar `priceMode:unit|total`: un total leído no se reconstruye inventando un unitario. Proponer redondeo positivo al peso por línea, antes del descuento individual, solo cuando se calcula desde precio unitario. Es el supuesto actual, todavía sujeto a recibos reales.
- **Ventajas:** evita errores binarios, conserva importes efectivamente pagados y reutiliza pruebas.
- **Riesgos:** fracciones/residuos, límites enteros distintos entre JS/reglas, multiplicaciones intermedias. No adoptar redondeo global o por banco sin aprobación.
- **Modelo:** `quantityMilli`, `priceCOP`, `discountCOP`, neto/total verificables y escala/versionado explícitos. Límites numéricos medidos, no importes comerciales arbitrarios impuestos aquí.
- **UX:** pesos colombianos legibles; cantidad decimal solo donde tenga sentido; explicar diferencias con recibo para confirmar, sin precios dudosos en cero.
- **Aprobación:** **sí**, escala, fronteras y orden/regla de redondeo antes de persistencia. Los descuentos generales necesitan DP-04 separadamente.

## DP-03 — Unidades, apertura y control sencillo

**Estado 05C-4:** aprobados exacto/aproximado, unidades enteras, kg/L con tres decimales, g/kg y ml/L explícitos, contenido confirmado de envases, apertura sin gasto, no negativos y los tres estados sin umbrales automáticos. Base/control con historial requieren migración específica. Máximos técnicos y compras/reposición no se aprueban por extensión.

Antecedente de recomendación 04A:

- **Problema:** equivalencias físicas, saldo inicial y reposición sin convertir estados en cantidades ficticias.
- **Alternativas:** unidad libre por compra; base por producto con conversiones explícitas; controlar todo con cantidades; mantener control mixto.
- **Recomendación:** conservar control mixto y base por producto (`unidad`, `kg`, `L`), conversiones exactas `g/kg` y `ml/L`; unidades contables enteras. No interpretar un paquete como N unidades sin confirmación. Apertura explícita sin gasto. Para sencillo, proponer «Hay suficiente» al comprar y permitir elegir el estado; guardar cantidad comprada en historial.
- **Ventajas:** consistencia con dominio y experiencia actual; no obliga a pesar todo.
- **Riesgos:** presentación/envase ambiguos; apertura de producto nuevo sumada dos veces; cambio de modo con historia. No introducir umbrales automáticos.
- **Modelo:** unión exacto/sencillo; movimientos con antes/después; nueva definición separada del efecto de compra. Bloquear cambio de modo/unidad con historial hasta acordar migración.
- **UX:** cantidad/unidad o tres estados; confirmar saldo inicial y no pedir una equivalencia deducida por OCR.
- **Aprobación:** **sí**, escala/unidades, apertura, reposición sencilla y cambios de modo. No se añaden ubicaciones.

## DP-04 — Descuentos generales y cargos

- **Problema:** atribuir lo pagado a categorías sin contabilizar dos veces descuentos, impuestos o cargos.
- **Alternativas:** solo descuentos por línea; repartir descuento general; línea negativa; registrar solo total sin atribución.
- **Recomendación:** primer alcance persistente con descuentos individuales explícitos, como el prototipo. No guardar silenciosamente una compra con descuento global/cargo no representable. Para una ampliación aprobada, estudiar reparto proporcional sobre netos elegibles con cálculo entero y asignación determinista de residuos, y cargos como líneas sin inventario/categoría explícita. No descontar de nuevo un impuesto ya incluido.
- **Ventajas:** trazabilidad y conciliación; un solo total canónico.
- **Riesgos:** artículos excluidos de promoción, bases de prorrateo y residuos no acordados. No se define aquí una política contable definitiva.
- **Modelo:** mantener descuentos por línea; futura extensión versionada con importe global, elegibilidad y asignaciones verificables, nunca una tabla de gastos paralela.
- **UX:** mostrar diferencia pendiente y pedir corrección comprensible; no convertir descuentos globales a mano en una política invisible.
- **Aprobación:** **sí**, incluso para ratificar el alcance inicial limitado; prorrateo/cargos requieren aprobación específica y ejemplos de recibos.

## DP-05 — Correcciones posteriores

- **Problema:** editar un confirmado puede alterar dinero/stock sin rastro ni considerar consumo posterior.
- **Alternativas:** edición directa; anulación y nueva compra; operación compensatoria; solo corrección antes de confirmar en V1.
- **Recomendación:** confirmado inmutable en primera integración. Corregir durante revisión; si la usuaria necesita rectificaciones posteriores, diseñar una operación trazable y atómica aparte, sin permitir borrado directo.
- **Ventajas:** conserva historial e idempotencia; reduce riesgos de stock negativo al deshacer entradas ya consumidas.
- **Riesgos:** un error confirmado no tendrá arreglo financiero autónomo hasta aprobarlo; no sugerir un ajuste de stock como si corrigiera también el pago.
- **Modelo:** reglas create-only para compras; futura referencia a operación original si se aprueba compensación, fuera del esquema habilitado inicialmente.
- **UX:** revisión clara antes de guardar; explicar limitación sin crear un botón de «corregir» que solo cambie inventario.
- **Aprobación:** **sí**, alcance de inmutabilidad y necesidad real de correcciones. Devoluciones/anulaciones continúan sin aprobar.

## DP-06 — Borradores, desconexión y recuperación

- **Problema:** perder borrador no equivale a saber si se confirmó; un cierre puede perder el único ID que evita duplicación.
- **Alternativas:** todo en memoria; persistencia estructurada local; borrador remoto; cola offline de confirmaciones.
- **Recomendación:** fotos/OCR solo memoria y confirmación solo online; lista/borrador en memoria como alcance inicial propuesto. **Excepción a decidir antes de guardar de verdad:** recibo mínimo durable del intento incierto (ID, UID, estado y eventualmente intención estructurada) o recuperación alternativa demostrada. No prometer idempotencia entre cierres con memoria únicamente.
- **Ventajas:** privacidad y menor complejidad; incertidumbre tratada explícitamente.
- **Riesgos:** dispositivo compartido y cachés privadas; perder identificador; cancelación cuando el servidor ya guardó. Si se rechaza toda durabilidad, falta una garantía entre sesiones que debe resolverse, no omitirse.
- **Modelo:** diario remoto por ID; sin fotos. Lista remota deshabilitada; persistencia Firestore en disco apagada inicialmente. El recibo mínimo no es historial de recibos ni almacenamiento de imágenes.
- **UX:** conexión requerida para guardar, advertencia al salir; comprobación por ID, ningún éxito por caché local.
- **Aprobación:** **sí y bloqueante**, especialmente recuperación tras cierre. [Protocolo](TRANSACTIONS.md).

## DP-07 — Límites y atomicidad

**Estado 05C-4:** arquitectura de inventario aprobada: Standard/Native, documentos por producto, inventory-candidate-v1/esquema 2 con versión única, (default), us-east1, mi-casa-camilo-test, Spark; lecturas Auth/reglas y escrituras futuras por ejecutor confiable/Functions, demo independiente. El agregado recomendado históricamente abajo no es el contrato vigente. Solo el propietario tiene permiso para crear manualmente la base con deny-all; conexión, reglas/ACL y despliegues siguen sin autorización. Límites económicos/técnicos y migración permanecen sujetos a revisión.

Antecedente de recomendación 04A:

- **Problema:** 50/100 líneas necesitan validación segura además de escrituras atómicas.
- **Alternativas:** documentos normalizados; estado agregado + diario; shards; ejecutor confiable; fraccionar compras.
- **Recomendación:** ensayar el candidato agregado en emulador antes de elegirlo. No aprobar el normalizado ingenuo ni fraccionar el guardado. Si no cabe la validación completa, volver a decisión de arquitectura y considerar backend confiable con autorización.
- **Ventajas:** reduce dependencias remotas y conserva una confirmación indivisible.
- **Riesgos:** tamaño del agregado, expresiones de reglas, contención y verificador sin bucles. 100 líneas no está garantizado por una estimación de bytes.
- **Modelo:** dos documentos escritos por compra candidata; diario inmutable/revisiones. Cambiar esquema requiere revisión, no un parche frontend.
- **UX:** no reducir texto ni obligar a confirmar en partes. Si se supera un límite demostrado, explicarlo sin fingir guardado.
- **Aprobación:** **sí y bloqueante**, tras matriz 5/50/100 y métricas; no se fija ahora un máximo arbitrario.

## DP-08 — Categorías y establecimientos

**Estado 05C-4:** aprobados los siete IDs/etiquetas del contrato, Sin clasificar por defecto, distinto de Otros, sin pantalla administrativa y conservando etiquetas históricas cuando corresponda. Mapeos antiguos, ampliaciones de catálogo y políticas de establecimientos/finanzas quedan fuera.

Antecedente de recomendación 04A:

- **Problema:** catálogos consistentes y consultas históricas pese a cambiar nombres actuales.
- **Alternativas:** texto libre; catálogo fijo; catálogo editable; administración completa.
- **Recomendación:** catálogo inicial corto acordado con ella y «Sin clasificar» explícito; establecimientos seleccionables con nombre confirmado. Guardar ID + etiqueta histórica en compra; no construir administración adicional por defecto. Decidir edición de catálogos por separado.
- **Ventajas:** filtros comprensibles y menos duplicados por variantes de escritura.
- **Riesgos:** categorías demasiado generales; reclasificar el pasado silenciosamente; comercios homónimos.
- **Modelo:** mapas pequeños actuales y snapshots históricos; los reportes usan clasificación del momento. Si se quiere reclasificar historia, nueva decisión y operación.
- **UX:** opciones conocidas, sin formularios administrativos; corrección explícita de comercio sugerido.
- **Aprobación:** **sí**, catálogo, edición y política histórica. Las opciones de `seed.ts` no se convierten automáticamente en catálogo de producción.

## DP-09 — Fechas y comercios desconocidos

- **Problema:** OCR no fiable y diferencia entre fecha de compra y guardado remoto.
- **Alternativas:** inferir siempre hoy; exigir información completa; aceptar fecha confirmada y comercio desconocido explícito.
- **Recomendación:** fecha de compra confirmada por la usuaria como calendario local colombiano, comercio «Sin especificar» cuando no lo conoce; timestamp remoto separado. No deducir fechas ambiguas ni usar hora UTC como día doméstico.
- **Ventajas:** informes por mes comprensibles; no inventa metadatos.
- **Riesgos:** desplazamiento de fecha por zona horaria, formatos ambiguos, rangos/calendarios inválidos.
- **Modelo:** `purchaseDate:AAAA-MM-DD`, `createdAt:Timestamp`, ID reservado para comercio desconocido; límites de periodo por fecha de compra.
- **UX:** fecha visible y corregible; desconocido permitido de forma explícita, no como error técnico.
- **Aprobación:** **sí**, criterio local y datos faltantes antes de validación final.

## DP-10 — Identificación de productos

**Estado 05C-4:** aprobados IDs estables, sugerencias por nombre/presentación, confirmación humana, presentaciones distintas permitidas, nunca fusión automática y reintentos sin efectos duplicados. No se promete deduplicación perfecta; criterios técnicos pueden ajustarse mediante pruebas. Alias, fusión asistida y comparación de recibos continúan fuera.

Antecedente de recomendación 04A:

- **Problema:** evitar altas duplicadas sin confundir productos parecidos ni eliminar líneas legítimas repetidas.
- **Alternativas:** nombre como ID; coincidencia exacta normalizada; sugerencias por nombre/presentación; fusión automática.
- **Recomendación:** ID estable independiente del nombre, búsqueda/sugerencias confirmadas por la usuaria. Mantener la detección normalizada del prototipo como ayuda y ensayar altas concurrentes. No fusión automática, alias aprendidos ni deduplicación de recibos en alcance inicial.
- **Ventajas:** renombrar no rompe historia; evita inferencias físicas equivocadas.
- **Riesgos:** normalización de acentos/locale JS no es una prueba de equivalencia ejecutable idénticamente en reglas; dos IDs nuevos con nombres equivalentes. No afirmar unicidad semántica remota sin mecanismo probado.
- **Modelo:** IDs de producto/línea distintos; definición nueva estable en intención; snapshots y referencias históricas. Un eventual índice de unicidad requiere nueva prueba de reglas/accesos.
- **UX:** «Ya existe un producto parecido. ¿Quieres usarlo?» según similitud, sin unir presentaciones a escondidas.
- **Aprobación:** **sí**, criterio de coincidencia y comportamiento ante duplicado concurrente. Repetir líneas del mismo producto no es duplicar el catálogo.

## DP-11 — Accesibilidad y prueba real

- **Problema:** una suite automática no demuestra que la usuaria comprenda acceso, revisión y recuperación.
- **Alternativas:** solo tests técnicos; prueba supervisada en su dispositivo; varias rondas con medidas de ayuda/tiempo.
- **Recomendación:** conservar diseño aprobado, objetivo WCAG 2.2 AA, base cercana a 18 px y táctiles 48 px; ejecutar [PRUEBA_USABILIDAD](../PRUEBA_USABILIDAD.md) y añadir evaluación del futuro acceso/resultado incierto cuando existan. Acordar sus navegadores y criterio de ayuda aceptable.
- **Ventajas:** valida tareas reales sin rediseñar ni infantilizar.
- **Riesgos:** resultados aún inexistentes, zoom real/Safari/lector de pantalla pendientes; no atribuir cumplimiento AA total a axe.
- **Modelo:** sin nuevos datos domésticos; notas de prueba anonimizadas fuera del repositorio público si son personales.
- **UX:** probar texto ampliado, foco, lenguaje de errores y pocas decisiones por tarea.
- **Aprobación:** **sí** para métricas/dispositivo/prueba y adaptaciones; la identidad visual ya aprobada no se reabre aquí.

## DP-12 — Historial de precios

- **Problema:** un precio unitario de etiqueta puede diferir del precio efectivo y no es comparable entre presentaciones incompatibles.
- **Alternativas:** precio último en catálogo; tabla aparte por línea; derivar historial desde compras inmutables.
- **Recomendación:** derivar desde las líneas de compras del producto, paginadas. Conservar modo de precio, cantidad, unidad, descuentos e importe efectivo; comparar solo bases compatibles, sin predicciones ni gráficos nuevos.
- **Ventajas:** evita una segunda fuente y escrituras adicionales; conserva evidencia estructurada.
- **Riesgos:** leer compras completas para pocas líneas; un precio por paquete no equivale a precio por unidad; cambio de unidad no autorizado.
- **Modelo:** `productIds` indexado para localizar compras, snapshots de líneas; proyección exacta comprobada remotamente. Sin colección de precios en V1.
- **UX:** mostrar fecha, cantidad/presentación y pagado; etiqueta clara si se calcula un efectivo unitario.
- **Aprobación:** **sí**, interpretación/comparación y consulta final antes de implementar historial persistente.

## DP-13 — Representación financiera canónica

- **Problema:** compras físicas, mixtas y gastos de servicios deben sumarse una vez, sin dinero en movimientos.
- **Alternativas:** tabla de gastos separada enlazada a compras; total global sin líneas; un documento financiero con líneas tipadas.
- **Recomendación:** una operación `purchase` canónica con líneas `product|expense`; solo las primeras afectan inventario. Un gasto independiente usa el mismo documento financiero. Reportes derivados de netos; total redundante solo si se verifica exactamente.
- **Ventajas:** conserva el modelo validado y evita doble contabilización. Consumo y lista quedan fuera del dinero.
- **Riesgos:** clasificar un producto físico como servicio para omitir stock; frontend/rules discrepantes; gastos no representables por decisiones DP-04.
- **Modelo:** sin tabla `expenses` duplicada; tipos específicos sin campos de producto en servicios; snapshots/categoría por línea.
- **UX:** concepto sin inventario sin pedir unidades físicas ficticias; pago mixto aparece una vez en historial.
- **Aprobación:** **sí y bloqueante**, forma final y reglas remotas; el soporte provisional del prototipo no equivale a aprobación de contrato persistente.

## Orden recomendado de aprobación

Primero DP-06/07 (garantías de recuperación/seguridad) y DP-02/03/04/13 (contratos). Después cerrar DP-01/08/09/10/12 con ejemplos reales anonimizados y DP-05/11 con la usuaria. Si cambian premisas, actualizar propuestas y pruebas; nunca editar silenciosamente `REGLAS_NEGOCIO.md` para acomodar un esquema más fácil.
