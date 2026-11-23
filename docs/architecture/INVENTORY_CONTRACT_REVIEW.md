# Inventario — aprobaciones vigentes y propuestas históricas

**Seguimiento operativo 05C-6:** el contrato de inventario no cambia. El propietario autorizó y confirmó reglas de lectura/ACL en el proyecto de pruebas, y se implementó/probó lectura real opt-in con Auth, sin escrituras o Functions. [Evidencia actual](../FASE_05C_6.md). Esta autorización operativa es posterior a las restricciones históricas inferiores y no aprueba migración o políticas financieras.

**Actualización 05C-4, 23-11-2026:** el propietario aprobó expresamente DP-03/07/08/10 para el inventario del [contrato consolidado](CONSOLIDATED_INVENTORY_CONTRACT.md), revisión inventory-candidate-v1 / schemaVersion=2. El [registro de aprobación](OWNER_DECISION_REVIEW.md) distingue alcances y exclusiones.

Quedan aprobados control exacto/aproximado, unidades enteras y kg/L hasta tres decimales, g/kg y ml/L explícitos, contenido confirmado de envases, aperturas sin gasto, no negativos, los tres estados y ausencia de umbrales automáticos; cambios de base/control con historial exigen migración específica. También los siete IDs/etiquetas del catálogo, Sin clasificar por defecto y distinto de Otros, sin administración adicional y preservando etiquetas históricas; IDs estables, sugerencias por nombre/presentación y decisión humana, sin fusión automática ni efectos duplicados por reintentos o garantía de deduplicación perfecta.

Arquitectura aprobada de inventario: Standard/Native, documentos por producto, esquema 2 y versión única, `(default)`, us-east1, mi-casa-camilo-test, Spark; Auth/reglas para lectura y ejecutor confiable/Functions para escrituras futuras, demo independiente. El propietario tiene permiso separado para crear manualmente una base con deny-all; no equivale a evidencia de creación ni a permiso para conectar el lector, publicar reglas, aprovisionar ACL o desplegar servicios.

Siguen pendientes máximos técnicos/económicos, ajustes técnicos de coincidencias basados en medición, mapeos/migración y contratos financieros. Los bloques inferiores son el **antecedente 05C-2**, incluidos sus textos «pendiente»: no revocan los alcances aprobados ni describen el runtime actual. No se aprueban otras DP por asociación.

**Actualización 05C-3:** el [contrato consolidado](CONSOLIDATED_INVENTORY_CONTRACT.md) implementa y prueba un único candidato local con presentación, siete categorías y schemaVersion=2. No aprueba producción ni migra documentos. Los detalles inferiores conservan la propuesta histórica 05C-2; donde describen código experimental son antecedentes, no el estado del candidato actual.

## Propuesta histórica 05C-2

**Propuesta, no aprobación ni migración.** Fecha: 23-11-2026. Complementa [OWNER_DECISION_REVIEW](OWNER_DECISION_REVIEW.md), [contrato 04D](FINAL_CONTRACT_PROPOSAL.md) e [integración](INTEGRATION_PLAN.md). El código conserva el contrato experimental plano de 05C-1; no se activan estas propuestas al publicar este documento.

## DP-03 — Unidades, apertura y control

Propuesta: bases `unidad`, `kg`, `L`. Presentar unidades, kilogramos/gramos y litros/mililitros según corresponda; convertir explícitamente a la base del producto, sin convertir masa en volumen, sin deducir contenido por nombre y sin cambiar base/control por editar etiquetas. Los envases exigen contenido declarado y revisión humana; dos botellas no equivalen automáticamente a dos litros.

Conservar cantidades como enteros ×1.000 en la base. Unidades individuales enteras; kg y L hasta tres decimales. Ejemplos que el propietario debe revisar:

| Cantidad revisada | Base | Cantidad escalada | Decisión propuesta |
| --- | --- | ---: | --- |
| 2 unidades | unidad | 2.000 | Aceptar |
| 1,25 kg | kg | 1.250 | Aceptar |
| 250 g | kg | 250 | Aceptar conversión explícita |
| 0,125 L | L | 125 | Aceptar |
| 500 ml | L | 500 | Aceptar conversión explícita |
| 1,5 unidades | unidad | — | Rechazar, salvo nuevo contrato autorizado |
| 0,5 g o 0,5 ml | kg o L | — | No representable con esta escala; rechazar, nunca redondear en silencio |
| Cantidad de kg aplicada a un producto en L | — | — | Rechazar por incompatibilidad |

Apertura independiente con cantidad inicial explícita, incluso cero, **sin gasto** y con identificador idempotente. En una futura compra, distinguir apertura de entrada comprada: apertura 2 + compra 3 deja 5, y el gasto solo cubre 3. No se implementa esa compra en 05C-2. Saldos finales nunca negativos. Las correcciones y los consumos requieren versión, con conflicto revisable si cambió el producto.

Control aproximado: `available` → Hay suficiente, `low` → Queda poco, `empty` → Agotado. Lo elige la persona según lo observado; no guardar una cantidad inventada, aplicar umbrales ni reponer el estado automáticamente por una compra. No cambiar un producto entre exacto/sencillo ni su base con historial sin migración específica aprobada.

**Pendiente:** escala y máximo definitivo (el laboratorio limita a 1.000.000.000 escalados), necesidad de fracciones de unidad o subgramos, representación de envases, apertura y estados por defecto, bloqueo de negativos y política de cambios de base/control. No se implementa gestión de ubicaciones.

## DP-08 — Categorías iniciales sugeridas

| ID candidato estable | Etiqueta propuesta |
| --- | --- |
| `food` | Alimentos |
| `household-care` | Aseo del hogar |
| `personal-hygiene` | Higiene personal |
| `pharmacy` | Farmacia |
| `pets` | Mascotas |
| `other` | Otros |
| `unclassified` | Sin clasificar |

Propuesta: catálogo inicial aprovisionado administrativamente, sin pantalla nueva de administración; una categoría explícita por producto, con selección Sin clasificar cuando no se haya decidido. Otros significa decisión consciente de no usar las demás categorías. La etiqueta histórica de una operación no cambia al reclasificar un producto.

**Pendiente:** confirmar lista, etiquetas e IDs, diferencia Otros/Sin clasificar, categoría por defecto y quién puede cambiar el catálogo. El ID `unclassified` es una alternativa concreta a `null` en la propuesta 04D y requiere elección expresa antes de modificar el esquema. No se aprueba esa diferencia por documentarla.

El laboratorio conserva **food/cleaning/service** (Alimentos/Limpieza/Servicios). La demostración conserva su catálogo previo. No se cambian `cleaning` ni `service`, ni se reinterpretan documentos existentes. Aprobar las siete categorías requerirá adaptar el contrato runtime y ensayar una migración/lectura compatible por separado; el lector preparado rechaza categorías desconocidas.

## DP-10 — Duplicados

Propuesta: identidades opacas estables, independientes del nombre; UUID para nuevas identidades cuando se adopte el contrato final. Mantener IDs existentes al leer o migrar; nunca regenerarlos al cambiar una etiqueta.

Sugerir coincidencias por nombre normalizado y, cuando exista un campo de presentación aprobado, por presentación/contenido. Mostrar candidatos para elegir el existente o confirmar que se trata de uno distinto. Por ejemplo, «Arroz, bolsa 500 g» y «Arroz, bolsa 1 kg» pueden ser productos diferentes; una semejanza de nombre no autoriza fusión. «Jabón barra» y «Jabón líquido» tampoco se suman ni convierten automáticamente.

Coincidencias dudosas requieren confirmación humana. Dos ID distintos parecidos pueden coexistir si la persona lo decide; un reintento de la misma creación no produce un ID nuevo ni otra apertura. No se promete unicidad semántica global ni deduplicación automática de recibos. La reserva concurrente del mismo ID sigue siendo un conflicto, no una fusión.

| Comparación propuesta | Sugerencia para revisar |
| --- | --- |
| Nombre normalizado y presentación iguales, base/control compatibles | Mostrar primero el producto existente y pedir elegirlo o confirmar un alta distinta |
| Mismo nombre, presentación diferente | Mostrar ambas presentaciones; no sumar ni fusionar por nombre |
| Nombre parecido o presentación ausente | Marcar coincidencia dudosa y pedir revisión humana, sin decidir equivalencia |
| Base o forma de control incompatibles | No combinar saldos ni convertir automáticamente; conservar identidades independientes |

**Pendiente:** campos de presentación, criterios de sugerencia, aviso y confirmación de alta similar, límites de texto y tratamiento de productos ya duplicados. El esquema 05C-1 no tiene presentación separada; no se añade ese campo en esta fase.

## DP-07 — Arquitectura y preparación real

Conservar Firestore normalizado, consultas por productos/páginas y ejecutor confiable para **futuras** mutaciones. Clientes sin escrituras directas; Auth verifica identidad y reglas/servidor autorizan por UID. La nueva preparación de lectura no autoriza Functions, gastos o compras reales.

El lector preparado entiende únicamente el documento plano experimental 05C-1 (versión inicial 0, metadatos y existencia juntos). La propuesta 04D usa `schemaVersion`, `product`/`stock`, presentación y versiones separadas desde 1: **no son formatos intercambiables**. Elegir y aprobar la revisión de contrato es un requisito previo a usar datos reales; no implementar una conversión permisiva para ocultar la diferencia.

La región, edición, almacenamiento fuera de Colombia, cuota/presupuesto y estrategia administrativa de autorización necesitan confirmación del propietario. El [procedimiento de preparación real](FIRESTORE_READ_PREPARATION.md) propone Standard/Native regional y `us-east1`, conserva Spark y prohíbe despliegues/creación actuales. La política de intentos locales DP-06 tampoco queda aprobada por esta lectura.

## Aprobación posterior

El propietario puede aprobar cada DP, aprobar con cambios o dejar pendiente. Registrar fecha, alcance y revisión aceptada, con ejemplos y límites. Una aprobación de contrato no autoriza automáticamente crear Firestore, publicar reglas/ACL, conectar el cliente, activar Blaze ni desplegar Functions; son autorizaciones separadas. Hasta entonces, mantienen su estado pendiente los documentos originales y el código real permanece bloqueado.
