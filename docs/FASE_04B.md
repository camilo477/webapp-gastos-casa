# Fase 04B — Laboratorio Firebase y resultado de viabilidad

Fecha: 22-11-2026, America/Bogota. Base: `main`, `4e092e19d1cd42d15670b43ce0afd1489bb3e7df`, árbol inicialmente limpio y `origin/main` comprobado. Alcance expresamente autorizado: laboratorio técnico, sin persistencia de producción. **El candidato probado no cumple los criterios de aceptación. La viabilidad completa no se demostró.** Publicar esta investigación no aprueba la arquitectura ni una fase posterior.

## Objetivo y preparación

Se revisaron AGENTS, visión, reglas, los seis documentos de arquitectura y decisiones, Fase 04A, dominio y Context. DP-01 a DP-13 permanecen pendientes; no se reescribieron los documentos originales. El laboratorio está en [tests/firebase-lab](../tests/firebase-lab/README.md), separado de `src/` y de las pruebas anteriores. React sigue funcionando en memoria.

Se utilizaron Node 20.19.5, Java 25.0.5.1, Firebase CLI 15.37.0, Firestore Emulator 1.22.0, SDK Firebase 12.19.0 y rules-unit-testing 5.0.2. Estas tres dependencias nuevas son de desarrollo; el SDK 13/rules-unit-testing 6 requiere Node más reciente y se sustituyó antes de la validación final. El lockfile conserva las versiones de todos los paquetes que ya existían.

El primer intento de socket dentro del sandbox devolvió `EPERM`. El mismo sondeo mediante ejecución autorizada fuera del sandbox abrió loopback correctamente; no se cambiaron permisos, montajes ni seguridad. Auth y Firestore **sí arrancaron y recibieron pruebas**. `ss` verificó `127.0.0.1`/IPv4 mapeada a loopback para 9099, 8186, 4404, 4504 y websocket auxiliar 9150. UI desactivada. Proyecto exclusivo `demo-mi-casa-04b`, identidades ficticias; sin proyecto real, credenciales, despliegues o pagos.

El [README del laboratorio](../tests/firebase-lab/README.md) contiene comandos completos para Ubuntu y el procedimiento cuando los sockets estén bloqueados. `npm run test:firebase:emulator` arranca, ejecuta Node y navegador y apaga los emuladores. Se verificó también el comando completo de arranque/pruebas/apagado. Su primer intento detectó la configuración demo que Firebase CLI inyecta automáticamente; se corrigió la guarda para admitir exclusivamente esa forma ficticia, sin aceptar configuración real. La suite devuelve error cuando falla una capacidad, y no oculta la segunda suite por el fallo de la primera.

## Modelo y reglas experimentales

Rutas `users/{uid}/state/current` y `users/{uid}/operations/{operationId}`. El estado contiene revisión, última operación, timestamp y productos; el diario inmutable contiene una compra financiera canónica, líneas, movimientos, total y testigos intermedios. No existe otro gasto por movimiento.

Para hacer ejecutable la validación propuesta en 04A se ensayó una variante de **B con testigos completos por línea**:

1. `frames[0]` coincide con el catálogo previo y el último con el posterior. Una línea física solo puede modificar su producto; sus metadatos permanecen iguales. Los nuevos abren sin saldo ficticio. Servicios conservan el frame completo.
2. Cada línea tiene esquema cerrado, ID posicional único y neto calculado remotamente. Los prefijos verifican suma y total; el contador físico verifica que no falten ni sobren movimientos. Cada movimiento conserva antes/después, unidad y vínculo con operación/línea.
3. Las comprobaciones por índice se generan hasta 100 líneas, sin fraccionar compras. El journal crea una sola operación y el estado exige una operación nueva simultánea. Se valida el contenido en la regla de creación del diario; la actualización del estado exige esa creación, revisión siguiente y esquema exacto. Una operación existente no autoriza otro saldo.

Las reglas reales están en [firestore.rules](../tests/firebase-lab/firestore.rules), con plantilla y generador reproducible. No hay autorización global por autenticación, función ficticia ni Admin en ataques. Hay inicialización vacía y ajuste absoluto experimental con revisión esperada. Lecturas restringidas a UID autorizado; resto denegado.

Se simplificaron comprobaciones duplicadas y se omitió la proyección opcional `productIds`: no se habilitan consultas de historial por producto. Se conservaron todos los cálculos y movimientos exigidos. **Incluso una línea válida supera el presupuesto de expresiones de esta implementación.** No se ofrece un camino alternativo permisivo para aceptarla.

Supuestos únicamente de prueba: dinero COP entero; escala 1.000; redondeo positivo por línea al peso; conversiones explícitas; estados aproximados; descuentos individuales; historia inmutable; sin fotos, OCR, cargos no representables ni descuento general. Límites numéricos sintéticos y categorías ficticias documentados en el laboratorio. Apertura no nula, fechas/catálogos finales, unicidad semántica y políticas de recuperación requieren decisiones futuras. No se aprueban DP-02/03/04/05/06/13.

## Pruebas ejecutadas y resultados

| Suite o escenario | Resultado observado |
| --- | --- |
| Modelo puro y guardas (`test:firebase:unit`) | **11 correctas**, incluidos 5/50/100 productos, 50 repeticiones, nuevos repetidos, servicio, aritmética y tamaños |
| Reglas reproducibles (`test:firebase:rules-check`) | Correcto; fuente de reglas real compilada/cargada por emulador |
| Node con emuladores | **57 ejecutadas: 34 correctas, 23 fallidas**, ninguna omitida |
| Navegador aislado con emuladores | **4 ejecutadas, 4 fallidas**; no hay recuperación completa aprobada |
| Ajuste explícito de stock sin compra | Admitido con diario y revisión; ajuste obsoleto rechazado, sin gasto financiero |
| Auth SDK → Auth Emulator → Firestore | UID ficticio admitido para lectura propia; intruso rechazado para lectura/escritura |
| Compra de 5 productos distintos | Rechazada, `permission-denied`, máximo de 1.000 expresiones; cero efectos parciales |
| Compra de 50 productos distintos | Rechazada por expresiones; cero efectos parciales |
| Compra de 100 productos distintos | Rechazada por memoria máxima de variables **5.242.880 bytes** del evaluador; cero efectos parciales |
| 2 y 50 líneas del mismo producto | Rechazadas; conservación y acumulación correctas solo en cálculo puro, no confirmadas remotamente |
| Mixta, nueva, fraccionaria kg, conversiones g/ml y control sencillo | Intentos ejecutados y fallidos por presupuesto de reglas; sus efectos remotos correctos no quedaron demostrados |
| Catálogos 100/500 con compra de 5 líneas | Rechazo por expresiones |
| Catálogo 1.000 con compra de 5 líneas | Rechazo por memoria de variables |

Las pruebas positivas fallidas permanecen con sus expectativas originales de aceptación y código de salida distinto de cero. Las primeras iteraciones del validador también fallaron, y una comparación de claves lista/set se corrigió durante el desarrollo. No se cuentan pruebas escritas o iteraciones selectivas como resultados completos adicionales.

### Seguridad adversarial

Se ejecutaron 23 mutaciones de compra, omisión de uno entre dos movimientos, diario sin estado, estado sin diario y reutilización hostil de ID existente: **27 intentos transaccionales rechazados** comprobando inventario y diario antes/después. Incluyen total falso, omisión de stock, producto adicional, cantidades negativas/fraccionarias inválidas, precio negativo/texto/overflow, descuento alterado, unidades incompatibles, campos inesperados, categoría/identidad alteradas, movimiento incorrecto/extra/faltante, revisión y suma de prefijos incorrectas y compra vacía.

Dos de esos 27 rechazos incluyeron agotamiento de presupuesto; los otros 25 no informaron ese límite. Esto **no acredita un validador de negocio completo**, porque la compra válida de control tampoco pasa. Se comprobaron además contextos sin sesión, UID diferente, rutas ajenas y Auth Emulator real. Un historial ficticio preparado privilegiadamente permitió ejecutar ataques update/delete y reutilización de su operación: rechazados con reglas activas. La preparación no se cuenta como una confirmación remota exitosa.

### Concurrencia, idempotencia y recuperación

Dos clientes independientes intentaron confirmar el mismo ID, dos compras distintas del mismo producto y ajuste absoluto contra compra. **Las tres pruebas fallaron al intentar confirmar compras válidas**; no se verificaron las sumas finales ni la serialización de compras aceptadas. No debe deducirse idempotencia del mero hecho de que ambas peticiones fueran rechazadas.

Con una operación existente preparada como fixture, el adaptador reconoce la misma intención, devuelve `already-confirmed`, detecta otra intención como conflicto y rechaza la reescritura maliciosa mediante reglas. Esto verifica reconciliación de identidad sobre historial preparado, no la primera confirmación concurrente.

En Chromium se ejecutaron desconexión antes de enviar, corte HTTP durante `documents:commit`, cierre real de pestaña tras iniciar y recuperación del recibo local ficticio desde otra pestaña. Las etapas de incertidumbre, conservación de ID e intención, ausencia remota y reintento se alcanzaron; **el reintento válido fue rechazado por reglas**. Para perder una respuesta posterior al commit, el interceptor recibió **HTTP 403**, no 200: no existió commit exitoso cuya respuesta pudiera perderse. Esa garantía queda bloqueada por una precondición del modelo, no por falta de sockets. Tampoco se probó un cierre completo del navegador/SO tras un commit exitoso.

El recibo mínimo de demostración conserva UID, operationId, confirmación e intención estructurada, sin fotos. `getDocFromServer` consulta el diario con un cliente nuevo; una ausencia no se interpreta como cancelación mientras pueda existir un emisor pendiente. DP-06 sigue pendiente y el prototipo no incorpora esta persistencia.

## Tamaños medidos y límites

Los siguientes cuerpos JSON REST **se enviaron realmente**, con token Auth Emulator no administrativo. Los tres devolvieron 403 y dejaron ambos documentos intactos:

| Productos/líneas distintos | Catálogo inicial | Cuerpo REST enviado, bytes |
| ---: | ---: | ---: |
| 5 | 5 | 13.355 |
| 50 | 50 | 618.127 |
| 100 | 100 | 2.335.331 |

El comando de medición usa la [fórmula oficial de tamaño almacenado](https://firebase.google.com/docs/firestore/storage-size), contrastada con el ejemplo oficial de 147 bytes. Esta tabla es **cálculo de tamaño de documentos**, no tamaños protobuf capturados ni almacenamiento/facturación de producción:

| Catálogo | Líneas distintas | Estado, bytes | Operación con testigos, bytes | Operación ≤1 MiB |
| ---: | ---: | ---: | ---: | --- |
| 100 | 5 | 12.788 | 78.250 | Sí |
| 100 | 50 | 12.789 | 665.967 | Sí |
| 100 | 100 | 12.790 | 1.319.119 | **No** |
| 500 | 5 | 63.988 | 385.450 | Sí |
| 500 | 50 | 63.989 | 3.277.167 | **No** |
| 500 | 100 | 63.990 | 6.490.319 | **No** |
| 1.000 | 5 | 127.989 | 769.457 | Sí |
| 1.000 | 50 | 127.990 | 6.541.219 | **No** |
| 1.000 | 100 | 127.991 | 12.954.421 | **No** |

Con 1.000 productos de nombres UTF-8 largos y 100 líneas: estado 307.101 bytes, operación 31.062.541 y cuerpo REST calculado 41.002.676. Con catálogo 100 y 50 repeticiones: operación 665.847 bytes. Los IDs de estos fixtures difieren de los de envío real y explican pequeñas variaciones de bytes. No se extrapola el JSON a un rechazo observado por tamaño de solicitud.

El emulador informó expresiones/memoria antes de validar otros límites: no se atribuye a esta ejecución un error de documento de 1 MiB que no emitió. El crecimiento de los testigos es `O(catálogo × líneas)`; el estado por sí solo cabe en estos ejemplos, pero esa observación no salva el diario ni garantiza cualquier catálogo. La fuente de reglas ocupa unos 14 KiB; no se midió tamaño compilado de producción, coste exacto por expresión ni punto mínimo de saturación.

## Regresión, revisión y riesgos

- `npm run typecheck`: correcto.
- `npm run build`: correcto, 64 módulos; bundle del prototipo sin Firebase.
- `npm test`: **61 correctas, cinco archivos**, dominio y componentes.
- `npm run test:e2e`: **143 correctas, una omitida**, 144 casos. Hubo un primer timeout de arranque Vite; la ejecución posterior terminó sin modificar la suite. La omisión de zoom real ya existía.
- Revisión propia de contratos, reglas, privilegios, diff y archivos. Gemini CLI se ejecutó en modo `--approval-mode plan`; terminó sin autenticación (`GEMINI_API_KEY` ausente). **Gemini fue omitido como revisor efectivo**, sin reintentos ni afirmación de revisión independiente.
- `npm audit` informó **21 vulnerabilidades de desarrollo (16 moderadas, cinco altas)** en el árbol añadido del laboratorio, incluidas dependencias transitivas grpc/CLI. No se aplicó un downgrade mayor sugerido por audit ni cambios indiscriminados. No se añaden al bundle productivo; siguen siendo deuda del laboratorio y deben resolverse antes de reutilizarlo en un servicio. No hay credenciales ni entradas no confiables reales en estos escenarios.
- `npm audit --omit=dev`: **cero vulnerabilidades** en las dependencias de producción.

Se preservan `.gitignore`, recursos y lockfile; se excluyen logs, screenshots, resultados Playwright, cachés, JARs y bases/exportaciones. No se modifican código React, diseño, dominio, estado ni tests anteriores. Los fallos del laboratorio son resultados de investigación, no fallos resueltos de persistencia productiva.

## Recomendación y publicación

Ver [FIREBASE_FEASIBILITY](architecture/FIREBASE_FEASIBILITY.md): descartar esta variante de B para producción. No hay arquitectura que haya demostrado todas las garantías bajo las restricciones actuales. Evaluar un ejecutor confiable como siguiente alternativa técnica **solo con autorización de nuevo alcance y presupuesto**, o exigir otra prueba de reglas plenamente válida para conservar Spark sin backend. No partir compras ni confiar en React para autorizar contenido remoto.

La fase se versiona sobre la base indicada, auditando índice e historia y publicando sin force push; el SHA y la verificación remota se comunican en la entrega para evitar autorreferencia. Ninguna publicación de código implica despliegue, aprobación de DP o avance a otra fase.
