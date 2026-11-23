# Plan incremental de integración — Propuesta 04D

**Solo planificación. Cada etapa necesita alcance autorizado y sus decisiones previas aprobadas.** Fecha: 22-11-2026. La base es [04C](../FASE_04C.md), no el agregado 04B. No hay código de persistencia productiva ni pantallas nuevas en 04D. [Tabla del propietario](OWNER_DECISION_REVIEW.md), [contratos](FINAL_CONTRACT_PROPOSAL.md), [persistencia](PERSISTENCE_POLICY.md).

## Estado vigente de inventario — 05C-4

El propietario aprobó el 23-11-2026 el inventario inventory-candidate-v1/esquema 2 y el alcance DP-03/07/08/10 del [registro](OWNER_DECISION_REVIEW.md): versión única, siete categorías, Standard/Native, (default), us-east1, mi-casa-camilo-test y Spark. El permiso manual de creación de base es independiente de lectura, reglas/ACL, Functions/Hosting y Blaze, que no se autorizan aquí. Los apartados A–I inferiores conservan el plan histórico 04D; sus versiones separadas o contratos financieros no sustituyen el inventario aprobado. Los cambios exactos para una futura lectura están en [FASE_05C_4](../FASE_05C_4.md); no se ejecutan en esta fase.

## Preparación técnica antes de A

| Área | Estado observado | Preparación propuesta y comprobación requerida |
| --- | --- | --- |
| Runtime | Laboratorio Node 20.19.5; runtime productivo Node 20 retirado | Preferir **Node 24 LTS**, parche compatible con SDK (≥24.12 cuando lo exija); Node 22 solo alternativa temporal evaluada. Probar CI/emuladores con el runtime elegido. No cambiar el laboratorio histórico ni llamar compatible a un runtime no ejecutado |
| SDK | Instalados Admin 13.10.0, Functions 7.4.0, cliente 12.19.0, CLI 15.37.0, rules testing 5.0.2 | Consulta npm de esta fase: Admin 14.5.1 (Node≥22), Functions 7.4.0 (≥18), cliente 13.4.0, `@firebase/app` 0.16.7 y rules testing 6.0.0 (estos dos ≥24.12). Son candidatos, **no actualizaciones aprobadas ni compatibilidad demostrada**. Elegir versiones parcheadas y lockfile por entorno/runtime |
| Vulnerabilidades | Auditoría raíz: 26 entradas dev, 21 moderadas/cinco altas; app `--omit=dev`: cero | Clasificar por grafo de cliente, ejecutor y CLI; corregir dependencias alcanzables, no ejecutar `audit fix --force`. «Cero prod» actual solo cubre dependencias React: Admin/Functions están como dev en el laboratorio, pero serían producción del ejecutor real |
| Código experimental | MJS, guards demo, UID fijo, métricas, aperturas cero y reglas de laboratorio | Extraer dominio puro probado a módulos tipados y un paquete de servidor independiente, con su propio lockfile/auditoría. No importar Admin en React ni convertir el fixture en semilla real. Mantener 04B/04C reproducibles e intactos |
| Entornos | Único proyecto ficticio 04C; ninguna credencial real | Demo, emulator, futuro staging y futuro producción explícitos. SDK cliente/ejecutor rechazan proyecto/endpoint cruzados; no fallback remoto. Config pública no autoriza. Secretos solo en mecanismo administrativo apropiado tras autorización, jamás en repo/logs/URLs |
| Auth/autorización | UID ficticio validado por callable; emulador acepta tokens de prueba | UID permitido por configuración administrada del servidor/reglas; nunca tomado del cuerpo, email editable o primer login. Probar proveedor, recuperación/vinculación, revocación y cuenta deshabilitada, sin reasignación automática |
| Registro | Sin UI de registro no equivale a bloqueo de altas por API | Confirmar significado en DP-01. Si exige bloqueo global, evaluar `client.permissions.disabledUserSignup` de Identity Platform y aprovisionamiento administrativo del proveedor; verificar compatibilidad/costo y que no impida acceso de la usuaria. No activarlo por defecto |
| App Check | `enforceAppCheck:false` solo para 04C | Probar métricas en entorno autorizado y proveedor web compatible con dispositivo; exigir App Check al habilitar funciones productivas, además de Auth/UID. Debug tokens solo locales. Evaluar consumo de tokens antirreplay por separado; un reintento usa token fresco y **mismo operationId** |
| IAM | Admin omite Security Rules | Cuenta de ejecución dedicada con mínimo acceso Firestore y Auth necesario; despliegue separado, sin Owner/Editor en runtime ni claves descargadas en frontend. IAM de base no sustituye autorización por UID del código. Token Firebase del navegador no es una credencial IAM de invocación Cloud Run; probar entrada callable con Auth/App Check sin confundir ambas capas |
| Escalado/costos | 04C declara min0/max2, concurrencia8, 256 MiB/1CPU/60s | Candidatos para medir por función, no límite monetario global. Payload acotado, protección de abuso, cuotas y alertas. Revisar [costos 04C](COST_ESTIMATION.md); heads/control/rectificaciones añadirán lecturas/escrituras, invalidando usar D+1 como costo definitivo |
| Errores/logs | Validación remota y mensajes fijos de compra; falta ensayo exhaustivo de infraestructura | Códigos estables sin valores privados; convertir timeout/indisponibilidad a resultado incierto. Capturar errores de todos los endpoints, incluida consulta de resultado, sin volcar requests, JWT, nombres, comercio, importes o fotos. Correlación mínima y retención operativa acordada |

Fuentes oficiales consultadas 22-11-2026: [runtimes](https://docs.cloud.google.com/functions/docs/runtime-support), [App Check en callables](https://firebase.google.com/docs/app-check/cloud-functions), [sesiones Auth](https://firebase.google.com/docs/auth/admin/manage-sessions), [restricción de altas](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/Config), [vinculación de proveedores](https://firebase.google.com/docs/auth/web/account-linking). Node 24 figura soportado hasta 2028; no se eligió Node 26 Preview. La compatibilidad con versiones futuras se debe volver a verificar al implementarlas.

La auditoría incluye `@grpc/grpc-js` (<1.13.6), OpenTelemetry Core, glob/minimatch, re2 y uuid, además de entradas propagadas. Verificar presencia y exposición en el artefacto real, por ejemplo Node gRPC no equivale al transporte del bundle web. Las últimas versiones por sí solas no garantizan resolver todo el grafo. No se instaló ni actualizó ningún paquete en 04D; los datos provienen de `npm view` y `npm audit`.

## Separación de modos y orden de trabajo

Mantener un adaptador de demostración basado en `reduceDomain`/semilla, sin llamadas Firebase. Futuros puertos de aplicación: sesión, inventario, confirmar/reconciliar compra, rectificar, informes y lista. El adaptador remoto traduce DTO/versiones/errores; los componentes conservan diseño y comportamiento. Configuración de build/entorno distingue modos; ningún ejemplo se copia automáticamente a una base real. Cambiar de modo limpia vistas/listeners sin borrar ni reenviar pendientes de otra identidad/entorno.

Las etapas siguientes definen implementación futura, **no permiso de ejecución**. A se divide en preparación local y configuración real solo tras aprobación explícita de recursos, región y presupuesto.

### A. Configuración segura de Firebase

- **Depende de:** DP-07, runtime/SDK y política de entornos; autorización separada antes de cualquier proyecto real/Blaze.
- **Implementar:** primero módulos, esquemas y tests locales con guards; después, si se autoriza, proyectos separados, configuración pública por entorno, reglas cerradas, índices, cuenta de servicio/IAM, límites y presupuesto. No automatizar despliegue por un push.
- **Probar:** cruces de proyecto/UID, ausencia de credenciales, imports del bundle, negativos de reglas y todos los nuevos documentos; analizar funciones y auditorías por paquete.
- **Riesgos:** copiar UID demo, runtime retirado, servicio equivocado, dependencia vulnerable o Admin en cliente.
- **Aceptación:** demo sin red, entorno local reproducible, sin secretos; inventario de recursos y autorización concreta para su futura creación. Configuración real no se declara terminada desde emuladores.

### B. Autenticación

- **Depende de:** A y DP-01/06; identidad/proveedor y dispositivo acordados.
- **Implementar:** puerto de sesión y adaptador, alta inicial controlada, acceso/recuperación sin registro público UI, logout y vínculo opcional al mismo UID; nunca aplicar datos por email coincidente.
- **Probar:** Google y/o password elegidos, reset, popup/redirección en dispositivo, UID incorrecto, revocación/expiración durante envío, permisos locales y separación demo.
- **Riesgos:** cuenta nueva accidental, altas API, bloqueo de proveedor o pérdida del UID durable.
- **Aceptación:** recuperar la misma identidad, datos ajenos denegados, comportamiento de pendientes al salir explícito; ninguna compra real habilitada todavía.

### C. Consulta de inventario

- **Depende de:** A/B y forma Product/InventoryStock aprobada.
- **Implementar:** lectura propia y carga/paginación con adaptador, conversores con esquema, ausencia/errores/reintentos; no cargar todo el historial.
- **Probar:** 100/500/1.000 productos, datos malformados, consulta sin Auth/otro UID, reconexión y costos de abrir catálogo; snapshots de UI vigentes.
- **Riesgos:** N lecturas de apertura, caché de otra cuenta, resultados parciales tratados como inventario completo.
- **Aceptación:** saldo/unidad/estado correctos, ninguna escritura ni datos de semilla enviados al servidor; regresión visual intacta.

### D. Creación y actualización de productos

- **Depende de:** C y DP-02/03/08/10.
- **Implementar:** callables tipados para crear/apertura, editar metadatos, ajuste/consumo; versiones separadas. Sugerencias de existentes y confirmación de coincidencias; ninguna fusión automática.
- **Probar:** apertura no nula sin gasto, apertura repetida idempotente, cantidades fraccionarias/unidades/envases, negativos, modo/base con historia, alta concurrente y cambios absolutos obsoletos.
- **Riesgos:** sumar apertura dos veces, perder ajuste, crear productos duplicados por nombre o cambiar unidades sin conversión.
- **Aceptación:** una alta por ID, movimientos trazables y saldos válidos, catálogo histórico no reescrito; escritura directa de cliente denegada.

### E. Confirmación real de compras

- **Depende de:** A–D; DP-02/03/04/05/06/07/09/13. **Rectificación aprobada y ensayada antes de habilitar el primer guardado financiero real.**
- **Implementar:** servicio de aplicación con intento durable/congelado, callable de compra, operaciones/head/control, reparto visible y apertura de nuevos; consulta de resultado. Preparar también el ejecutor de rectificación aprobado y su recorrido de revisión sin rediseñar pantallas por iniciativa técnica.
- **Probar:** 5/50/100, repetidos/nuevos/mixtos, F-01/02/03, sumas por categorías, desconocidos, todas las escrituras directas/ataques, doble envío, corrupción de almacenamiento, HTTP 200 perdido y cierre completo; rectificaciones siguientes, consumo y sencillo, cambio de producto/fecha/etiquetas, anulación, dos rectificaciones concurrentes.
- **Riesgos:** dar por probados descuentos/rectificaciones por 04C, IDs nuevos al reintentar, estado simple restaurado, conciliación invisible o gasto duplicado.
- **Aceptación:** una compra lógica y todos sus efectos o ninguno, corrección segura disponible, resultado incierto recuperable; límites y costo **del contrato nuevo** medidos. Si falta esta aceptación, mantener demo y no habilitar compras reales.

### F. Gastos e historial

- **Depende de:** E y DP-08/09/12/13.
- **Implementar:** consultas por head vigente/fecha y cargas de versión canónica, categorías/comercio e historial de precios. Control de revisión para informes completos y paginación estable.
- **Probar:** suma de categorías=total, servicios/cargos una vez, cambio de fecha entre meses, categoría corregida y auditoría original, metadatos de catálogo modificados entre revisiones, corrección durante paginación, anulación cero y precios compatibles.
- **Riesgos:** sumar revisiones, incluir precio supersedido como nueva compra, descargar solo primera página y presentar total definitivo.
- **Aceptación:** misma compra vigente contada una vez, totales consistentes, contexto y costo de consultas conocidos; resultado en actualización si cambia el control.

### G. Lista temporal persistente

- **Depende de:** B/D y DP-06; contrato de generación/acuse aprobado.
- **Implementar:** única lista activa remota, marcas, comandos versionados y finalización que borra contenido; control mínimo sin historial de listas.
- **Probar:** cerrar tras acuse y recuperar; cerrar antes de acuse sin promesa falsa; dos pestañas, finalizar/respuesta perdida, reintento antiguo contra lista nueva, logout y limpieza de caché.
- **Riesgos:** nueva lista borrada por un finalizado viejo, confundir marca con compra, archivo permanente accidental de items.
- **Aceptación:** acuse real recuperable, contenido finalizado retirado, historial financiero/stock invariantes, sin biblioteca de listas.

### H. OCR y fotografías temporales

- **Depende de:** E, políticas de recursos/DP-06/07 y aprobación de alcance OCR posterior.
- **Implementar:** controlador de recursos en RAM, worker/parser cancelables y revisión manual existente. OCR solo propone; añadir artículos manualmente sigue disponible.
- **Probar:** varias fotos y zonas superpuestas sin borrar repeticiones legítimas, baja confianza, fallos/latencia, abandonar/sustituir, resultado tardío y campos corregidos, almacenamiento/red/logs tras todos los desenlaces y galería original.
- **Riesgos:** persistir Blob/base64/OCR por caché o diagnóstico, memoria excesiva, confundir liberar RAM con borrar foto del celular.
- **Aceptación:** ninguna imagen/OCR íntegro persistido/enviado, recursos liberados, manual completo y sin campos inventados; uso en dispositivo real validado.

### I. Pruebas finales y despliegue

- **Depende de:** A–H aceptadas, DP resueltas para el alcance, propietario autoriza **por separado** recursos/pagos y despliegue.
- **Implementar:** automatización de checks, auditoría del artefacto final, proceso de releases/rollback compatible con esquemas/pendientes, runbook de recuperación/incidentes/costos y evaluación con la usuaria. Desplegar solo el resultado concreto autorizado.
- **Probar:** TypeScript/build/unitarias/componentes/Playwright, reglas/callables, dispositivo/Safari/lector de pantalla/zoom real, seguridad, privacidad, recuperación, regresión demo, límites y factura controlada autorizada.
- **Riesgos:** tomar emulador por IAM/latencia/factura reales, rollback que desconoce pendientes/versiones, activar publicación automática no autorizada.
- **Aceptación:** evidencia por criterio, riesgos aceptados expresamente, soporte de recuperación y presupuesto; SHA/artefactos/entorno verificables. Ningún despliegue se deriva de aprobar 04D ni de su push.

## Puerta de aprobación y riesgos abiertos

Antes de E hay que resolver DP-05 con sus efectos económicos y de stock, no posponer indefinidamente correcciones mientras se guardan compras reales. Antes de A real se necesita decisión económica independiente: Functions requiere Blaze; alertas y spend caps existentes no garantizan factura cero ni un hard cap global. Conservar el demo hasta pasar los criterios del alcance autorizado. No hay fechas de ejecución comprometidas ni fase siguiente iniciada por este plan.

El contrato final propuesto añade heads/control y más datos a las compras; 04C sigue siendo evidencia de su **núcleo**, no validación de descuentos generales, rectificaciones o persistencia de lista. Esas pruebas son puertas previas de implementación autorizada, no pruebas «ya correctas» en 04D.
