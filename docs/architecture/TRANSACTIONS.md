# Confirmación, atomicidad y recuperación

**Diseño propuesto, pendiente de DP-02/03/04/05/06/07/13.** No hay transacciones remotas implementadas. Las pruebas de Fase 03C validan el reducer en memoria, no este protocolo.

## Invariante que se exige

Para cada operación de compra confirmada debe existir un único desembolso, sus líneas completas, todos los productos físicos vinculados, sus efectos exactos/sencillos y sus movimientos. Ningún efecto del borrador aparece antes de confirmar. No hay consumo que modifique el desembolso histórico. Una operación válida se aplica una vez o no se aplica.

La transacción debe ser indivisible y **su contenido también debe ser válido ante un cliente modificado**. Idempotencia significa una aplicación por ID, no reconocer automáticamente dos recibos iguales con IDs diferentes; eso último es una mejora DP-10 no aprobada.

## Por qué no basta el esquema normalizado ingenuo

Sea N el número de líneas físicas y D el de productos distintos. Una escritura de compra cuyo validador necesita consultar `getAfter(producto)` para cada uno requiere D accesos distintos. Con D=50 ya supera el presupuesto de una escritura; compartir una transacción no elimina ese límite. Comprobar además movimientos añade dependencias. Los [presupuestos oficiales](https://firebase.google.com/docs/firestore/quotas) son 10 por evaluación individual y 20 para toda la operación múltiple, con posibles cachés que no convierten rutas distintas en una sola.

Contraejemplo: reglas que permiten crear la compra válida y solo comprueban, al escribir un producto, que exista su compra. El cliente envía **solo la compra**. La regla de producto nunca se ejecuta; hay gasto sin entrada. Lo mismo ocurre si omite uno de los movimientos. `writeBatch` no obliga a enviar documentos que sus reglas no exigen.

Para A con 5 productos podría construirse una validación bidireccional que quepa; no se ha ejecutado. 50 y 100 productos **distintos** invalidan esa estrategia concreta por el límite anterior. Cincuenta líneas del mismo producto no equivalen a cincuenta rutas: deben agregarse sus deltas o encadenar movimientos correctamente, conservando las líneas. No generalizar el contraejemplo a todos los modelos posibles de Firestore.

Tampoco usar un lote por diez productos: tras un fallo intermedio quedarían dinero/stock parciales. Un esquema de estados `pending/confirmed` puede ocultar resultados, pero no revierte por sí solo stock parcialmente actualizado ni impide lecturas concurrentes de ese stock.

## Protocolo candidato B

Documentos: `state/current` y `operations/{operationId}` del [modelo](FIRESTORE_MODEL.md). El diario incluye líneas/movimientos; no hay escrituras aparte de gasto o precio.

1. Crear una **intención estable** en el servicio de aplicación: ID, IDs de líneas y productos nuevos, cantidades/precios revisados, fecha/comercio, consentimiento del total. Bloquear edición mientras el intento no esté resuelto. No generar IDs dentro del callback.
2. Iniciar transacción online. Leer primero la operación por ID y el inventario actual; ninguna lectura después de iniciar escrituras.
3. Si ya existe la operación, comprobar que corresponde a la misma intención y devolver su resultado confirmado. Comparar campos canónicos de intención; excluir timestamp de servidor y efectos derivados de la revisión. Mismo ID con distinta intención es conflicto, no éxito.
4. Si no existe, validar contra el inventario leído y calcular una transición pura. No producir notificaciones, modificar Context, reservar nuevos IDs ni ejecutar OCR dentro del callback: puede repetirse.
5. Para compra aditiva, recalcular desde el último saldo leído. Si cambió unidad, modo, identidad o datos que exigen consentimiento, abortar y pedir revisión. Para ajustes absolutos, exigir la revisión/saldo de referencia: no sobrescribir un cambio concurrente por un reintento automático.
6. Escribir operación completa e inventario con `revision+1`, `lastOperationId=id` y timestamp remoto. Las reglas deben comprobar tanto el emparejamiento como todo el efecto de negocio.
7. Solo al resolver la transacción con confirmación del servidor publicar compra/stock/gasto confirmado en la interfaz y limpiar fotos/OCR. No tratar un evento local de listener con escrituras pendientes como confirmación.

La [guía de transacciones](https://firebase.google.com/docs/firestore/manage-data/transactions) documenta reejecución por concurrencia, lecturas antes de escrituras y fallo sin conexión. Un lote permite escrituras sin leer/revalidar el saldo y puede quedar pendiente offline; por ello no es la recomendación para este guardado.

## Demostración conceptual de emparejamiento

No es código desplegable. Usando `S` estado previo, `S'` posterior y `O` operación nueva:

```text
al crear O:
  O.beforeRevision == get(S).revision
  O.afterRevision == O.beforeRevision + 1
  getAfter(S).revision == O.afterRevision
  getAfter(S).lastOperationId == id(O)
  transiciónCompletaVálida(S, O, getAfter(S))

al actualizar S:
  getAfter(O de S'.lastOperationId).beforeRevision == S.revision
  getAfter(O).afterRevision == S'.revision == S.revision + 1
  O pertenece a este UID y a esta operación
  transiciónCompletaVálida(S, O, S')
```

El ID nuevo, diario inmutable y revisiones impiden reutilizar una operación antigua para alterar otra vez el estado. Crear solo O sin S no cumple revisión; cambiar solo S sin O nuevo tampoco. Dos operaciones competidoras con la misma revisión obligan a reintentar una de ellas.

Presupuesto conservador de envoltura: regla de O lee S y `getAfter(S)` (2 llamadas), regla de S lee `getAfter(O)` (1): total 3; ninguna supera 10, conjunto menor que 20. No se presupone caché para ese conteo. Dos rutas dependientes distintas para la estimación de facturación; las lecturas de reglas pueden cobrarse incluso al rechazar. [Condiciones y `getAfter`](https://firebase.google.com/docs/firestore/security/rules-conditions).

**La demostración anterior solo cubre el emparejamiento.** Si `transiciónCompletaVálida` fuera `true`, una dueña con cliente alterado podría sumar $1 a una línea sin ajustar el total, introducir una entrada extra o cambiar productos ajenos. Eso sería una vulnerabilidad, aunque la escritura fuera atómica. No se habilitará tal helper sin implementarlo.

## Obligación de prueba para una operación grande

El validador completo debe demostrar, para cada línea y para todo el resultado:

- Campos/tipos/longitudes válidos; IDs únicos; cantidad/precio/modo/descuento y neto correctos; ningún pendiente.
- Total igual a suma de todos los netos, sin desbordamiento; proyección `productIds` exacta y comercio/fecha válidos.
- Producto existente compatible o alta nueva autorizada; líneas repetidas legítimas conservadas y definiciones nuevas coincidentes resueltas una sola vez.
- Transición ordenada de cada producto repetido: el `before` del siguiente movimiento coincide con el `after` previo del mismo producto. El último coincide con el saldo final. Apertura nueva explícita, sin sumar el saldo inicial dos veces.
- Correspondencia exacta entre líneas físicas y movimientos; servicios sin movimientos; inventario sencillo sin cantidad disponible inventada.
- Productos no tocados idénticos; ninguna eliminación/adición/cambio de metadatos extra. Las claves modificadas deben ser exactamente las autorizadas por la operación.

Las reglas no ofrecen bucles generales para plegar 100 líneas. Una alternativa a ensayar es un validador generado/acotado que expanda comprobaciones por índice y use pruebas intermedias verificables de acumulación de importes/saldos. Las pruebas intermedias enviadas por el cliente también deben verificarse, y no pueden ocultar claves ajenas. Pueden aumentar mucho tamaño/expresiones. Esta es una hipótesis, **no un algoritmo de reglas validado**.

El presupuesto de expresiones (1.000), profundidad, tamaño compilado y documento finito puede descartar B aun con solo tres accesos. No se ha demostrado que quepa para 50 ni 100; no se fija un máximo arbitrario para evitar averiguarlo. Si no cabe, opciones a aprobar: otro modelo con demostración equivalente, o ejecutor confiable/Blaze y nueva revisión de seguridad. Mantener escrituras denegadas mientras tanto. No sustituir esta prueba por confianza en el reducer.

## Concurrencia, idempotencia y resultados inciertos

| Situación | Respuesta del protocolo |
| --- | --- |
| Dos clics / dos pestañas, mismo ID | Una crea; la otra reintenta, encuentra el diario y devuelve el mismo resultado. No duplica stock ni gasto. |
| Dos compras distintas del mismo producto | Serialización sobre el estado; la segunda recalcula desde la revisión nueva. No sobrescribir stock leído antes. |
| Compras de productos distintos | También compiten por el agregado. Es un costo de B; medir latencia/reintentos. |
| Mismo ID, otra intención | Rechazar como conflicto y reconciliar; no sobrescribir ni mostrar éxito de otra compra. |
| Se corta antes de enviar | Borrador conservado mientras viva la sesión; no afirmar que hay respaldo. |
| Se corta después de enviar / timeout | Estado `unknown`; conservar ID e intención. Una ausencia en caché no prueba que falló. |
| Reintento con red recuperada | Consultar ID **al servidor** y/o reejecutar la transacción idempotente con el mismo ID. Una escritura tardía con ese ID y la nueva compiten sin duplicarse. |
| Cancelación con resultado incierto | Puede limpiar fotos/salir, pero no deshacer una compra posiblemente confirmada ni comenzar otra copia a ciegas. Conciliación pendiente. |
| Cierre o recarga durante incertidumbre | Memoria no conserva ID. DP-06 debe aprobar un recibo mínimo durable de intento (ID, UID, estado y, si hace falta, intención estructurada), o una recuperación alternativa demostrada. Nunca fotos/OCR. Sin ello no se garantiza idempotencia entre sesiones. |

Un hash local ayuda a detectar diferencia de intención; por sí solo no valida negocio ni evita colisiones/alteraciones de un cliente malicioso. Preferir comparación canónica de campos ya guardados; no confiar solo en un hash suministrado por ese mismo cliente.

## Estados y mensajes propuestos

| Estado verificable | Mensaje / acción |
| --- | --- |
| Offline antes de enviar | «No hay conexión. Puedes seguir revisando. Para guardar, necesitas conexión». |
| Envío en curso | «Estamos guardando la compra. Espera un momento». Evitar segundo envío. |
| Resultado incierto | «Estamos comprobando si la compra se guardó. No vuelvas a registrarla». Acción Comprobar cuando haya red. |
| Confirmación remota | «Compra guardada». Mostrar total y accesos a inventario/gastos; limpiar fotos/OCR. |
| Rechazo definitivo sin efectos | «No pudimos guardar la compra. Tus cambios siguen aquí». Corregir o reintentar según causa. |
| Otra revisión cambió dato relevante | «El inventario cambió desde que empezaste. Revisa esta cantidad». No mostrar un saldo antiguo como actual. |
| Sesión vencida | «Vuelve a entrar para guardar tu compra». Conservar contexto mientras sea seguro y la pestaña siga abierta. |
| Permisos denegados | «No tienes acceso para guardar. Revisa tu cuenta». No reintento infinito. |
| Límite técnico | «Esta compra no se puede guardar todavía. Conserva el recibo y contacta a quien te ayuda con la aplicación». No dividir sin explicar ni fingir éxito. |

No mapear todos los fallos a «sin conexión». Clasificar errores de dominio, permisos, conflicto, límite, transporte e incertidumbre en el adaptador; conservar detalles técnicos sanitizados para diagnóstico, fuera de mensajes a la usuaria y sin recibos.

## Matriz de viabilidad y aceptación

**Todas las filas remotas están pendientes de ejecución.** Se intentó arrancar el emulador y el entorno lo bloqueó; no hay resultados positivos de reglas.

| ID | Ensayo previo a aprobación | Resultado exigido |
| --- | --- | --- |
| V-01 | 5, 50 y 100 líneas físicas distintas; medir bytes, accesos, expresiones y latencia | Transición completa o rechazo técnico explícito; ningún parcial; documentar métricas por tamaño |
| V-02 | Productos repetidos intercalados y nuevos coincidentes | Deltas acumulados exactos; una alta por definición; líneas/movimientos conservados |
| V-03 | Exactos, sencillos y servicios en una compra | Cantidades/estados correctos, solo físicos con stock; dinero contado una vez |
| V-04 | Precios unitarios/totales, fracciones, descuentos individuales y fronteras numéricas | Igualdad con dominio aprobado; descuento inválido rechazado |
| V-05 | Descuento general/cargo | Rechazar mientras no haya política aprobada; después probar reparto/residuos/categorías |
| V-06 | Dos pestañas suman al mismo producto | Suma final de ambas compras; dos operaciones, sin pérdida |
| V-07 | Ajuste absoluto concurrente con compra | Conflicto visible; no sobrescritura automática |
| V-08 | Doble confirmación y misma intención/ID en paralelo | Un diario y una transición |
| V-09 | Mismo ID con otro importe o nuevas líneas | Conflicto; confirmado original inmutable |
| V-10 | Cortar red antes, durante y después de commit/ack | Ningún éxito anticipado; reconciliación por ID sin duplicación |
| V-11 | Reintentar respuesta incierta y cerrar/abrir pestaña | Resultado recuperado con mecanismo DP-06 aprobado; no asumir recuperación en memoria |
| V-12 | Sin Auth y UID distinto, todos los accesos | Denegación completa; datos privados |
| V-13 | Negativos, floats, unidad incompatible, null y overflow | Denegación remota; sin cambios |
| V-14 | Alterar total, omitir stock/movimiento o escribir producto extra | Denegación remota, aun siendo UID autorizado |
| V-15 | Crear solo diario, solo estado, saltar revisión o reutilizar operación antigua | Denegación; emparejamiento obligatorio |
| V-16 | Lista marcada/finalizada y consumo manual | Ningún gasto nuevo; lista sin movimientos |
| V-17 | Catálogo 100/500/1.000 y 100 líneas con nombres largos | Medir documento/índices/request; sin truncar ni cambiar semántica |
| V-18 | Intento update/delete de confirmado y edición de catálogo | Confirmado denegado; snapshots históricos intactos |

Protocolo aislado futuro: proyecto `demo-mi-casa-04a`, interfaces loopback, Auth/Firestore Emulator, datos inventados, contextos de prueba con UID, sin Admin en los ataques. Usar Admin solo para preparar escenarios. Ejecutar tests negativos además de felices, inspeccionar cobertura/trazas de reglas y comparar todos los documentos antes/después. No conectar al proyecto real si falta la variable de emulador. La [guía de conexión al emulador](https://firebase.google.com/docs/emulator-suite/connect_firestore) explica su aislamiento; límites de producción e índices deben corroborarse aparte.
