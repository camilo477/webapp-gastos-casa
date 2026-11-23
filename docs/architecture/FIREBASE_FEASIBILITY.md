# Viabilidad Firebase después de Fase 04B

**Dictamen: no se ha demostrado viabilidad completa para producción con React + Authentication + Firestore, sin ejecutor confiable.** Fecha: 22-11-2026. [Resultados y comandos de la Fase 04B](../FASE_04B.md). Las decisiones DP-01 a DP-13 siguen pendientes; este documento añade evidencia y no modifica sus recomendaciones originales.

## Arquitectura evaluada y alcance del descarte

Se implementó B: `users/{uid}/state/current` y `users/{uid}/operations/{operationId}`, con diario inmutable y transacción del SDK cliente. Para verificar el contenido se añadió una prueba intermedia completa del inventario por línea, prefijos financieros y contadores físicos. Las reglas reales comprueban cada paso, no solo la presencia de dos documentos. El estado agregado no incluye historial; los movimientos permanecen en la operación financiera única.

**Se descarta para producción la variante implementada de B con mapas completos intermedios.** El validador llega al máximo de 1.000 expresiones incluso con una compra válida de una línea; 5 y 50 también fallan. Con 100 productos/líneas o un catálogo de 1.000 y cinco líneas aparece el límite de memoria de variables del evaluador (5.242.880 bytes). Son errores observados en el emulador, no una estimación de que dos escrituras resulten económicas.

Además, por fórmula de almacenamiento, 100 líneas con catálogo de 100 producen una operación de 1.319.119 bytes. Para catálogo de 1.000 y 100 líneas son 12.954.421 bytes. Los mapas finales de esos catálogos sí caben en los ejemplos; son los testigos repetidos los que crecen en `O(P×N)`. El límite documental no desaparece mediante exenciones de índices. [Tamaño de almacenamiento](https://firebase.google.com/docs/firestore/storage-size), [cuotas de Firestore](https://firebase.google.com/docs/firestore/quotas).

Esto **no es una demostración de imposibilidad de cualquier representación agregada**. Un verificador más compacto y otro contrato podrían dar otro resultado. No se encontró ni se verificó aquí un diseño que satisfaga todas las garantías para 50/100 líneas. Bajo el criterio de aceptación de esta fase, B permanece no apta para producción hasta aportar esa prueba positiva. No se fija un máximo pequeño para ocultar el fallo ni se habilita una ruta de escritura menos validada.

## Evidencia comprobada y garantías pendientes

| Garantía | Evidencia real | Alcance de la conclusión |
| --- | --- | --- |
| Aislamiento local | Auth/Firestore arrancaron; proyecto demo y todos los puertos en loopback; guardas contra endpoint/proyecto real | Laboratorio ejecutable; no implica seguridad operativa de un proyecto real |
| Autorización | Reglas con UID fijo, contextos sin Auth/intruso rechazados; token emitido por Auth Emulator | Lecturas/escrituras de estos escenarios privadas; proveedor/alta/recuperación de cuenta reales pendientes |
| Negativos atómicos | 27 ataques de contenido rechazados con estado y diario intactos; historial preparado no editable/borrable | Ningún ataque ensayado alteró datos; dos rechazos agotaron presupuesto. Falta un control positivo aceptado para demostrar selectividad completa |
| Dinero e inventario | 11 pruebas puras pasan con 5/50/100, repeticiones, nuevos, servicio y unidades | Contrato local calculable; no equivale a validación remota ni a contrato aprobado |
| Tamaños remotos | Cuerpos REST de 13.355 / 618.127 / 2.335.331 bytes enviados y rechazados con 403 | Transferencia de esos mensajes medida; no son tamaños protobuf ni cuotas productivas verificadas |
| Ajuste explícito | Operación de ajuste admitida con estado y diario, sin campos financieros; revisión obsoleta rechazada | La validación de emparejamiento tiene un control positivo, aunque la confirmación financiera falla |
| Confirmación completa | Compra válida de control rechazada; también 5/50/100, mixtas, nuevos, fracciones y sencillo | **No demostrada** |
| Concurrencia | Ensayos mismo ID, dos IDs y ajuste concurrente fallan al confirmar compras válidas | No demostradas suma de entradas ni ausencia de sobrescrituras de compras aceptadas |
| Idempotencia | Con fixture ya confirmado: misma intención reconocida; otra intención genera conflicto y no puede reescribir historia | Comparación y rechazo comprobados sobre fixture; aplicación única de un commit concurrente no demostrada |
| Recuperación | Corte de red real e interrupción de pestaña conservan recibo ficticio y permiten consultar ausencia al servidor; reintento rechazado | Recuperación de un commit exitoso sin ACK **no demostrada**: servidor devolvió 403 en su precondición |

Las pruebas de recuperación usan una página propia del laboratorio, no la aplicación React. Se emplean clientes nuevos y `getDocFromServer`, sin atribuir confirmación a caché ni escrituras pendientes. Cerrar la pestaña antes de escribir no prueba un cierre después de confirmar. Las cuatro pruebas completas de recuperación fallan y se conservan así en la suite.

El protocolo provisional de recibo mínimo guarda UID, ID, estado e intención estructurada sin fotografías. Conservar ID sin la intención impide detectar conflictos de contenido al conciliar; conservarlos solo en memoria no cubre una interrupción. Una ausencia del diario no cancela por sí sola otro envío pendiente. DP-06 debe aprobar un mecanismo durable y su privacidad antes de cualquier persistencia real.

## Comparación de alternativas

La siguiente tabla combina evidencia de B con análisis de A/C; **A y C no se implementaron ni se ejecutaron** en esta fase.

| Criterio | A: documentos normalizados + reglas | B: agregado + diario del laboratorio | C: ejecutor confiable + Firestore |
| --- | --- | --- | --- |
| Seguridad | Necesita comprobación bidireccional exhaustiva; validar solo documentos enviados permite omitir otros | UID y rechazo cerrado efectivos; verificador completo no ejecutable dentro del presupuesto ensayado | Código remoto puede recorrer y validar todas las líneas; requiere autenticar/autorizar cada comando y cerrar escritura financiera directa del cliente |
| Atomicidad | Transacción posible en principio; no basta un batch con documentos opcionales | Dos writes intentados juntos; se comprobó rechazo sin parciales, ninguna compra completa admitida | Una transacción remota para toda la compra, sujeta a tamaños/contención y a prueba posterior |
| Complejidad | Muchas relaciones, reglas distribuidas y dependencia del manifiesto de compra | Pocas rutas, reglas complejas y testigos muy costosos | Un servicio adicional y contrato explícito, lógica de negocio programable/testeable |
| Costos | Con N físicos distintos: `1+D+N` writes; 101 para 50 y 201 para 100 | Dos writes teóricos; catálogo completo y testigos multiplican bytes. No se midió facturación | Coste del ejecutor más Firestore; depende de su implementación. Ningún servicio contratado |
| Escala | Menor contención global; sigue pendiente exigir todos los productos y movimientos en reglas | Contención global y tamaño del diario/inventario; no resolvió ni el caso pequeño | Puede usar productos normalizados y reducir contención ajena; límite de documento/solicitud sigue vigente |
| Mantenimiento | Fácil introducir huecos entre reglas de compra, producto y movimiento | Modelo fuente pequeño, verificador difícil de ampliar; duplicación de mapas históricos | Permite reutilizar contratos y pruebas de dominio; añade despliegue, IAM, observabilidad y operación |
| Spark | Firestore admite ese uso por volumen, pero seguridad de compras grandes no demostrada | Cabe en cuota nominal de writes; **no cumple la viabilidad del negocio** | Cloud Functions requiere Blaze. Un ejecutor externo no implica por sí solo cambiar el plan de Firestore, pero añade infraestructura y queda fuera del alcance autorizado |
| Recuperación | ID estable y comando inmutable necesarios; protocolo completo pendiente | Intento durable de demostración; conciliación posterior a commit exitoso pendiente | Endpoint idempotente y consulta de resultado duradero viables conceptualmente; deben probarse pérdidas de respuesta/cierres |

En A, la estrategia ingenua de que la regla de compra consulte un documento por cada producto distinto necesita 50/100 accesos y excede el presupuesto de una evaluación. Invertir el vínculo no obliga a enviar los documentos ausentes. No se demuestra imposibilidad universal de todos los esquemas normalizados; se rechaza esa estrategia concreta. Los [límites de reglas](https://firebase.google.com/docs/firestore/security/rules-structure) incluyen accesos por operación, expresiones y ausencia de recursión; las [condiciones con `getAfter`](https://firebase.google.com/docs/firestore/security/rules-conditions) permiten comprobar resultados, sin reemplazar su validación.

En B, las reglas realizan conservadoramente cuatro accesos de documento entre ambas escrituras: estado previo/posterior y existencia previa/estado posterior de la operación. Las dos lecturas del callback transaccional son adicionales. No se midió el cobro real ni se supone que la caché elimine esos costos. El problema demostrado ocurre antes de que el bajo número de rutas pueda justificar una elección.

En C se recomienda **evaluar**, con autorización nueva, un único comando de confirmación con validación confiable, ID e intención estables, diario inmutable, stock y gasto en una transacción. No se propone confirmar parcialmente ni validar después de hacer visibles efectos incompletos. Las [transacciones oficiales](https://firebase.google.com/docs/firestore/manage-data/transactions) ofrecen atomicidad y reintentos, mientras que la corrección del comando sigue a cargo de su verificador. [Requisito Blaze de Cloud Functions](https://firebase.google.com/docs/functions/get-started).

## Decisiones antes de producción

1. Decidir DP-07: mantener la restricción sin backend exige otro verificador íntegro y una nueva prueba positiva; aceptar un ejecutor confiable cambia alcance/operación y puede cambiar presupuesto. No hay autorización de implementarlo aquí.
2. Acordar DP-02/03/04/13: dinero, precisión, conversión, aperturas, límites, descuentos y líneas sin inventario. Los parámetros sintéticos actuales no son políticas de producción.
3. Resolver DP-06: durabilidad mínima, borrado, protección en dispositivo compartido, emisores pendientes, estados inciertos y conciliación comprobada al servidor. Probar commit real aceptado con respuesta perdida y cierre completo.
4. Cerrar acceso/recuperación DP-01 e historia DP-05, además de categorías, fecha, identidad y precios DP-08/09/10/12. Las reglas no pueden conocer la veracidad física del recibo ni determinar semánticamente si un concepto era realmente un servicio.
5. Resolver deuda de dependencias del laboratorio, repetir positivos/adversariales y concurrencia, medir índices, tamaños reales, latencia y contención. El emulador no acredita cuotas, facturación o comportamiento idéntico de producción.

La recomendación actual es conservar el prototipo validado sin persistencia y usar este resultado negativo para decidir el siguiente alcance. No se aprobó ninguna arquitectura de producción, no se creó servicio de pago y no se avanzó de fase.
