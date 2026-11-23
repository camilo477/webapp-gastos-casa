# Persistencia y limpieza — Propuesta 04D

**Política para aprobar en DP-06; no implementada.** Fecha: 22-11-2026. Se conserva la prohibición de archivo permanente de fotos/OCR y la idempotencia ensayada en 04C. La preferencia por recuperar una lista activa con acuse se incorpora como recomendación, sin cambiar el estado de [REQUISITOS](../REQUISITOS.md) ni [DECISIONS](DECISIONS.md).

## Matriz por tipo de información

| Información | Destino propuesto | Duración/limpieza | Garantía y limitación |
| --- | --- | --- | --- |
| **Fotos, recortes, canvas, miniaturas, OCR íntegro** | Solo RAM del borrador/worker; nunca red de persistencia, Storage, Firestore, base64 en estado durable, IndexedDB o Cache API | Liberar tras confirmación, cancelación, sustitución, abandono/logout. Detener cámara/worker, revocar URLs y referencias; resultados tardíos no reviven el borrador | Cierre pierde las copias de la app. No implica borrar el original de galería, cámara del sistema, RAM física/swap o copias ajenas |
| **Borrador estructurado** | IndexedDB local separada por UID y esquema, sin imágenes ni OCR íntegro. No borrador remoto inicialmente | Propuesta: eliminar al confirmar/descartar/logout; caduca siete días desde última edición, comprobado al abrir/guardar | Recuperación solo en ese dispositivo; tras cierre no reaparece la foto. La caducidad es limpieza al ejecutar la app, no borrado físico garantizado mientras está cerrada |
| **Operación financiera pendiente** | Registro local durable `PendingOperation` escrito/verificado antes de enviar. Diario remoto solo después del commit | Conservar sin TTL mientras sea incierta. Al verificar resultado terminal, retirar intención/comprobante completo en la misma sesión o siguiente inicio. Logout personal no borra un pendiente incierto | Sobrevive cierre normal si el navegador conserva almacenamiento; no garantiza recuperación tras borrar datos del sitio, perder dispositivo o fallo de disco. Contiene datos financieros estructurados privados |
| **Lista activa** | Documento remoto único `shoppingLists/active`, solo lectura autorizada y mutaciones por ejecutor; copia local en memoria | Persiste mientras esté activa. Finalizar elimina contenido en transacción y avanza generación; logout retira copia visible local | Solo se promete recuperar cambios con acuse de servidor. Modificar offline no equivale a sincronizar. No hay biblioteca ni historial de listas finalizadas |
| **Compras confirmadas y revisiones** | Firestore, operaciones inmutables y heads/control derivados; sin fotos | Conservación sin caducidad automática propuesta para mantener historial. Rectificación/anulación no borra el original. Supresión de cuenta/datos exige contrato administrativo específico | Confirmado requiere acuse/consulta de servidor, no evento de caché. Retención indefinida y eliminación futura requieren aprobación; «inmutable» no impide una política de privacidad posterior autorizada |

Datos estructurados permitidos: IDs opacos, cantidades/unidades revisadas, nombre corto de artículo/concepto, categorías, fecha, comercio e importes necesarios. Borradores y comprobantes se particionan por proyecto, entorno, UID y esquema, evitando reenviar datos de emulador/staging a producción. No guardar texto de recibo íntegro dentro de una nota genérica para eludir la prohibición. El comprobante no es un archivo de recibos.

## Envío, resultado incierto y autenticación

1. Separar borrador editable de intención congelada. Reservar IDs fuera de la transacción y calcular hash canónico de la versión de contrato; el servidor vuelve a calcularlo.
2. Escribir y leer de vuelta el comprobante en IndexedDB antes del primer envío. Si falla almacenamiento/cuota, no enviar una confirmación real que prometa recuperación tras cierre. El borrador manual/demostración puede seguir en memoria. No abrir una cola offline de compras por ser PWA.
3. Enviar con Authentication, autorización de UID y controles remotos. Marcar enviando; no editar ni regenerar ID mientras se concilia. Cerrar pestaña no cancela la solicitud ni revierte un commit.
4. Ante error de transporte, timeout, `aborted` o cierre: conservar `unknown`. Tras reconectar/autenticar el **mismo UID**, consultar por ID al servidor y comparar hash. Si está confirmada, cargar su revisión/resultados y limpiar el pendiente; un reintento idéntico es seguro.
5. Si no se encuentra, registrar «no encontrada al consultar», sin declarar cancelación: un emisor puede seguir activo. Reintentar únicamente ID/intención idénticos; nunca «resolver» creando un ID distinto. Si hay conflicto de hash, no sobrescribir; mostrar el resultado existente y pedir revisión.
6. Un rechazo de esa solicitud no prueba que otro envío previo incierto no haya confirmado. Conciliar antes de borrar/cambiar un pendiente con historial de envío. Un cambio de sesión detiene nuevos envíos y oculta datos, sin reasignar la operación a otro UID.

La sesión Auth puede persistir de forma independiente de las compras. Logout no revoca por sí solo tokens ya emitidos ni borra copias leídas; el ejecutor deberá tratar revocación/cuenta deshabilitada y conservar el resultado de solicitudes en curso. [Gestión oficial de sesiones](https://firebase.google.com/docs/auth/admin/manage-sessions). Tampoco se promete anular un commit porque la cuenta se revocó después de autorizar el envío.

### Privacidad del dispositivo y cierre de sesión

Propuesta principal: dispositivo personal acordado con la usuaria. Logout elimina fotos, OCR, borradores, listeners y vistas/cachés de datos; **retiene únicamente pendientes financieros inciertos bajo su UID** para no perder la recuperación. Solo se muestran/reenvían tras autenticar al mismo UID. Eso no cifra IndexedDB ni protege frente a otra persona con acceso al navegador/SO o a un XSS: debe aprobarse este compromiso.

«Olvidar datos de este dispositivo» debe distinguir pendientes sin resolver; no destruirlos automáticamente por limpieza rutinaria. Si el propietario exige borrar también esos datos al salir, habrá que aprobar otra solución durable antes de habilitar guardado real; RAM exclusivamente no cubre el cierre incierto. No se bloqueará indefinidamente el cierre de sesión para esperar red. En equipo compartido no se habilitará la misma garantía de escritura hasta resolver privacidad y durabilidad; consulta/demo pueden conservar una política temporal explícita.

Persistencia offline general del SDK Firestore deshabilitada inicialmente. Vistas se vuelven a verificar al servidor; caché estática PWA solo para recursos públicos. El mecanismo de pending/draft es explícito y separado, no una copia automática de toda la base ni una cola de escrituras financieras. Cifrar con una clave embebida en JavaScript no resolvería acceso local; no se propone como protección ficticia.

## Lista activa y finalización sin historial

La lista sincronizada incluye `instanceId`, generación y revisión; toda mutación exige esos valores y un `commandId`. Hasta recibir acuse se muestra pendiente, sin afirmar que sobrevivirá al cierre. Se conserva la lista remota anterior confirmada si el último cambio no llegó; recuperar la app consulta la activa y su versión.

El servidor aplica snapshots completos con control de versión, sin mezclar silenciosamente dos pestañas. Marcar un artículo modifica únicamente un booleano de lista. Al finalizar se borran nombre/items y se avanza `shoppingListControl/current`. Ese control conserva generación y **solo el último comando** (ID, hash, instancia y revisión/resultado; sin contenido de lista), reemplazado por el siguiente. Es metadato mínimo antirrepetición, no historial de listas.

Un reintento reconocido devuelve el resultado sin borrar nada de nuevo. Si ya no es el último comando, revisión/generación obsoletas impiden reaplicar cambios o eliminar una lista nueva; se consulta la instancia actual y se presenta conflicto, no un éxito histórico inventado. No se promete consultar cualquier comando antiguo de lista para siempre como sí se conserva una operación financiera. No se añade el contenido ni cada finalización al diario financiero permanente. Esta retención mínima de control también requiere confirmación del propietario.

## Limpieza y pruebas necesarias

- Éxito, error definitivo, cancelación y sustitución: revocar URLs, cerrar bitmaps, soltar File/Blob/buffers, limpiar canvas, detener tracks y worker cuando dejen de ser necesarios; limpieza idempotente.
- Borrador recuperado sin foto: conservar campos revisados y señalar que la imagen/OCR no se recuperó; permitir nueva captura/manual sin sobreescribir correcciones.
- Operación incierta: fotos pueden liberarse al abandonar; eso no borra el comprobante ni cancela el servidor. Un callback de cierre no es condición para evitar persistencia de fotos: no deben haberse escrito nunca.
- Pruebas futuras: almacenamiento lleno/borrado/corrupto, app cerrada antes/durante/después de commit, nueva sesión/UID, varios emisores, logout sin red, limpieza cruzada entre pestañas y migración de esquema del pendiente.
- Lista: cierre solo después del acuse, marca/finalización concurrente, respuesta perdida y reintento sobre una instancia nueva; verificar que stock, gasto y compras no cambian y que no sobreviven items finalizados en cachés de la app.
- Privacidad: inspeccionar red, IDB, localStorage, Cache API, service worker y logs tras cada desenlace; usar únicamente fixtures. La limpieza lógica no demuestra borrado físico del dispositivo ni afecta la galería.

04C verificó un comprobante ficticio en localStorage y respuesta 200 perdida; **no probó** esta política completa, IndexedDB, borradores durables, logout ni lista remota. Antes de producción hay que implementar/ensayar la propuesta aprobada, no atribuir esas garantías al laboratorio existente.
