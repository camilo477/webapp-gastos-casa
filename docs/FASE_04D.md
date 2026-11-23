# Fase 04D — Contratos y preparación de integración

Fecha: 22-11-2026, America/Bogota. Base `main`: `d66d77c5adca37e9aec3d6a571ac09976930143c`, árbol inicial limpio, rama/remoto y SHA de `origin/main` verificados. **Entrega documental para revisión: no aprueba DP ni implementa funcionalidades.** La candidata es el ejecutor confiable normalizado de 04C; no se vuelve al agregado descartado de 04B.

## Alcance realizado y documentos

Se revisaron AGENTS, visión, requisitos, reglas de negocio, decisiones, informe/arquitectura 04C, dominio, estado y laboratorio confiable. Se conservaron los documentos originales de aprobación y todo el código. Las preferencias del propietario orientan la propuesta, sin convertirlas en políticas definitivas.

| Documento nuevo | Contenido |
| --- | --- |
| [Tabla del propietario](architecture/OWNER_DECISION_REVIEW.md) | DP-01 a DP-13, base aprobada, recomendación y confirmación necesaria; bloqueos por etapa |
| [FINAL_CONTRACT_PROPOSAL](architecture/FINAL_CONTRACT_PROPOSAL.md) | Nueve tipos solicitados y auxiliares, campos/validaciones, dinero, descuentos, facturas ficticias y rectificaciones completas |
| [PERSISTENCE_POLICY](architecture/PERSISTENCE_POLICY.md) | Fotos, borradores, pendientes, lista activa e historia con destinos/retención/limpieza distintos |
| [INTEGRATION_PLAN](architecture/INTEGRATION_PLAN.md) | Preparación de Functions y etapas A–I con dependencias, cambios futuros, pruebas, riesgos y aceptación |

README incorpora navegación hacia esta entrega. No se modifican React, dominio, estado, laboratorios, dependencias, lockfile, configuración Firebase ni reglas desplegables. `.gitignore` sigue cubriendo los resultados generados y no necesitó ampliación. No hay pantallas nuevas, Firebase real, servicios de pago, OCR, migración o despliegue.

## Recomendaciones revisadas

| Decisión | Propuesta resumida, pendiente de aprobación |
| --- | --- |
| DP-01 | Google si ya lo usa cómodamente; correo/contraseña controlado como alternativa; recuperación y eventual vínculo al mismo UID, sin registro público UI. Precisar bloqueo de altas API |
| DP-02 | COP enteros, cantidades ×1.000, BigInt, redondeo positivo por línea y total exacto revisado; precio desconocido no se convierte en cero |
| DP-03 | Control mixto, conversiones explícitas, apertura sin compra/gasto, no saldo final negativo; cambios de modo/base con historia requieren otro contrato |
| DP-04 | Individual y general explícitos; general proporcional por mayor resto, elegibilidad revisada; impuestos incluidos no se duplican y cargos siempre visibles |
| DP-05 | Original y revisiones inmutables, deltas de inventario y conciliación física explícita cuando haya consumo; anulación de registro erróneo trazable, no devolución comercial |
| DP-06 | Fotos/OCR solo RAM; borrador local temporal; comprobante durable antes de enviar; lista activa remota con acuse y borrado al finalizar; privacidad de pendientes/logout debe aprobarse |
| DP-07 | Functions confiable + Firestore normalizado y cliente sin escritura directa; extender ensayos para nuevos contratos, límites, heads y control de informes; conservar demo |
| DP-08 | Catálogo inicial de categorías acordado, snapshots históricos y «Sin clasificar»; comercio libre, sin administrador nuevo |
| DP-09 | Fecha de calendario visible separada del timestamp; cualquier comercio y desconocido explícito; correcciones cambian el periodo vigente |
| DP-10 | Identificadores estables independientes del nombre, sugerencias confirmadas y presentaciones distintas sin fusión automática |
| DP-11 | Conservar identidad visual y accesibilidad existentes; acordar prueba en dispositivo y objetivo WCAG, sin atribuir uso real a tests automáticos |
| DP-12 | Precios desde revisiones vigentes, original consultable en auditoría; comparación solo de unidades/presentaciones compatibles y descuento efectivo visible |
| DP-13 | Una compra lógica canónica para productos, servicios y cargos; cada versión vigente contada una vez, movimientos sin dinero |

**Todas las DP continúan pendientes en sus aspectos propuestos.** Aprobados/conservados son los requisitos O/D y el prototipo validado, no el conjunto de políticas nuevas. Bloqueos prioritarios: DP-02/03/04/05/06/07/13 antes de escrituras financieras, y DP-01 para acceso real. La tabla permite aprobar con cambios o mantener pendiente; no solicita autorización implícita de infraestructura ni avanza de fase.

## Correcciones posteriores: decisión principal

Se compararon edición directa, prohibición permanente, anulación/nueva compra separadas, compensaciones puras y revisión inmutable completa. Se recomienda esta última: conservar todas las versiones, actualizar en la misma transacción un puntero de versión vigente y aplicar solo la diferencia entre adquisiciones corregidas y anteriores. Se cubren precio, cantidad, producto, categoría, establecimiento y fecha.

Ejemplo de consumo: se registraron cinco unidades, se consumieron cuatro y queda una; corregir a dos no puede dejar −2. La propuesta pide conteo actual/motivo y, si confirma una, deja saldo uno mediante delta de compra −3 y conciliación no financiera +3, ambos visibles en auditoría. No es otra compra ni un gasto; los consumos previos no se reescriben. Sin observación no se inventa stock: la rectificación afectada permanece pendiente de resolución, no se impide corregir por siempre el precio u otros campos sin efecto físico. Productos sencillos requieren estado observado actual para cambios físicos, sin restaurar estados pasados.

Los informes resuelven un solo `purchaseHead` por compra; no suman original y revisiones. Cambiar categoría/fecha corrige las consultas vigentes, conservando auditoría. Los precios antiguos supersedidos no aparecen como nuevas adquisiciones. Un contador financiero permite detectar mezcla de versiones durante paginación. Son nuevas piezas **no implementadas ni probadas en 04C**; añaden escrituras y posible contención. Deben medirse antes de considerarlas definitivas.

## Persistencia propuesta

Cinco ciclos separados: imágenes/OCR íntegro en RAM; borrador estructurado local con siete días propuestos; operación pendiente durable, congelada y sin caducidad mientras sea incierta; una lista activa remota cuya recuperación se promete solo después del acuse; compras/revisiones remotas conservadas para historial. Finalizar lista elimina contenido; solo queda control mínimo de generación/último comando, sin biblioteca de listas.

El cierre tras enviar no equivale a cancelar. Se mantiene ID e intención y se consulta al servidor; `notFound` no prueba que un emisor activo no vaya a confirmar. El comprobante no contiene fotos. Retener pendientes financieros bajo su UID tras logout en dispositivo personal preserva recuperación pero no cifra IndexedDB; es un compromiso de privacidad que el propietario debe aprobar. Borrar fotos de la app tampoco borra las originales de la galería ni garantiza sobrescritura física de memoria.

## Preparación técnica y plan

Se recomienda Node 24 LTS soportado para el futuro ejecutor, con parche compatible con los SDK elegidos; **Node 20 se mantiene solo como entorno histórico de la regresión 04C**, no como recomendación productiva. Se consultaron versiones npm y auditoría sin instalar paquetes: Admin actual 14.5.1 exige Node≥22; rules testing 6 y `@firebase/app` actual exigen ≥24.12. Las versiones candidatas no están probadas en este proyecto. La preparación contempla extracción de código experimental, paquete servidor/auditoría propia, configuración por entornos, UID permitido, revocación, App Check, IAM mínimo, límites, errores y logs privados.

La auditoría raíz continúa con **26 entradas de desarrollo: 21 moderadas y cinco altas**, incluidas cadenas gRPC, OpenTelemetry y herramientas transitivas. `npm audit --omit=dev`: cero para las dependencias actuales del frontend; **no es aprobación de seguridad del futuro paquete servidor**, cuyos SDK hoy figuran como dev del laboratorio. No se aplicaron actualizaciones masivas ni se aceptó un downgrade automático de audit.

El plan sigue A configuración segura → B Auth → C inventario de lectura → D productos/aperturas/ajustes → E confirmación y salida segura por rectificación → F gastos/historia → G lista activa → H OCR temporal → I pruebas finales y despliegue autorizado. Cada etapa especifica dependencias, implementación futura, pruebas, riesgos y aceptación. Se conserva modo demostración mediante puertos/adaptadores y no se autoriza crear recursos/pagar/desplegar por aprobar esta documentación.

## Verificación ejecutada en 04D

| Comprobación | Resultado observado |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm run build` | Correcto, 64 módulos; mismos assets del prototipo base |
| `npm test` | **61 correctas, cinco archivos**, dominio y componentes |
| `npm run test:e2e` | **143 correctas y una omitida** de 144; omisión previa de zoom real |
| `npm run test:firebase:trusted:unit` | **10 correctas** |
| `npm run test:firebase:trusted` | **53 de integración y cuatro de navegador correctas**, código 0; arranque y apagado de Auth/Firestore/Functions demo |
| Regresión 04B | No se reejecutó ni modificó; evidencia histórica preservada |
| Auditoría de paquetes | 26 entradas dev; cero en `--omit=dev`; sin cambios en paquetes/lockfile |

Los emuladores se ejecutaron mediante el mecanismo externo autorizado, en loopback y proyecto ficticio `demo-mi-casa-04c`. Los tests son del prototipo y del **contrato experimental 04C**, no pruebas de los descuentos generales, rectificaciones, IndexedDB o lista propuestos. No se añadieron tests a la aplicación para hacer pasar documentación.

Se verificaron enlaces locales y ejemplos aritméticos COP/conciliación. Los bloques de tipos documentales se extrajeron a un archivo temporal y pasaron TypeScript estricto (`--ignoreConfig --noEmit --strict --target ES2022 --skipLibCheck`); esto comprueba sintaxis/tipos, no comportamiento runtime. Se revisaron fórmulas y estados de aprobación. Gemini CLI sigue disponible, pero se omite revisión efectiva por la falta de autenticación previamente comprobada, sin reintentar credenciales fallidas. La revisión de coherencia es propia; no se presenta como revisión independiente.

## Riesgos y siguiente autorización necesaria

Faltan aprobación explícita de políticas, ensayos de contrato ampliado, autenticación/provisión real, runtime/SDK actualizados y auditados, IAM/App Check reales, privacidad de almacenamiento, pruebas en dispositivo, cuotas/región/facturación y recuperación adicional. El head/control financiero añade costo: confirmar pasaría de D+1 a D+3 documentos leídos/escritos orientativos, y rectificar depende de los productos leídos/escritos; no se reutiliza sin cambios la estimación 04C. El catálogo de 1.000/compra de 100 de 04C no certifica automáticamente el modelo ampliado.

Validación confiable no prueba la autenticidad de datos externos: un precio válido pero inventado o un concepto libre mal clasificado pueden ser internamente coherentes. La revisión humana sigue siendo necesaria; no se atribuye al servidor detección universal de facturas falsas.

La entrega cierra 04D como documentación para aprobación. No se inicia integración, persistencia real, OCR ni otra fase. Se auditan diff/índice y archivos, se crea commit descriptivo y se publica sin force push sobre la base indicada, verificando SHA/árbol remotos. El SHA final se comunica en la entrega para evitar autorreferencia dentro de su propio commit.
