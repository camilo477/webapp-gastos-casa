# Seguridad — estado vigente y antecedentes de diseño

## Estado vigente — 05C-5, 23-11-2026

El propietario confirmó visualmente mi-casa-camilo-test, Firestore (default) vacío, Spark y reglas activas deny-all; después confirmó Standard, Firestore Native, us-east1, backups programados deshabilitados y cifrado administrado por Google. Es evidencia aportada por él, **no verificación administrativa independiente de Codex**. El lector real permanece bloqueado; no se publicaron reglas personalizadas, crearon ACL/datos o desplegaron servicios.

Para lectura futura se audita [inventory-read.firestore.rules](../../security/inventory-read.firestore.rules): Auth, UID de token igual a ruta y ACL administrativa válida/habilitada; get/list solo de productos propios, list acotado a 100; escrituras, ACL, finanzas y rutas desconocidas cerradas. El UID real nunca se introduce en reglas o documentación. Las pruebas adversariales de Emulator verifican la política, no IAM, reglas activas o un acceso real. **No usar el esqueleto histórico inferior como artefacto de publicación.**

El [procedimiento de verificación/publicación/ACL](FIRESTORE_READ_RELEASE_RUNBOOK.md) distingue consultas permitidas ahora de cambios que requieren otra autorización. [FASE_05C_5](../FASE_05C_5.md) registra resultados y límites. DP-03/07/08/10 están aprobadas únicamente para inventario; las DP financieras, persistencia y demás aspectos pendientes no se resuelven aquí.

## Antecedente histórico — análisis 04A

Los apartados siguientes conservan el análisis original, su esqueleto y resultados de entonces. Sus afirmaciones de ausencia de proyecto/pruebas/proveedores y ubicación del UID en reglas no describen el estado vigente. La autorización por ACL sustituye ese esqueleto para la preparación actual. El análisis distingue autorización, atomicidad y validación del negocio: ninguna sustituye a las otras dos.

## Amenazas y fronteras

| Amenaza | Control previsto | Límite o prueba necesaria |
| --- | --- | --- |
| Persona sin sesión o con otro UID | UID único permitido más igualdad con UID de ruta en cada acceso | Probar lecturas puntuales, consultas y escrituras, no solo interfaz |
| Modificar JS o llamar directamente al SDK/REST | Reglas de campos/tipos y transición completa; denegar por defecto | Las validaciones de `src/domain/` protegen UX, no el servidor |
| Compra sin entrada física, o stock sin compra | Enlace obligatorio bidireccional operación/estado y validación de cada efecto | No basta `lastOperationId`; véase [TRANSACTIONS](TRANSACTIONS.md) |
| Falsificar importes, descuentos, categoría o tipo de línea | Cálculo remoto verificable y snapshots permitidos | Las reglas no pueden saber qué decía el recibo real ni si un servicio era físicamente un producto |
| Repetir solicitudes o alterar un confirmado | Create-only, ID estable y resultado inmutable | Detectar reutilización de ID con intención diferente |
| Cuenta/dispositivo robado | Recuperación del proveedor, bloqueo de pantalla y cierre de sesión | Un titular autorizado puede introducir datos falsos; no es protección contra quien controla su cuenta |
| Filtración desde repositorio, caché, logs u OCR | Sin secretos, imágenes ni contenido privado en esos canales | Código/configuración web públicos no son una frontera de autorización |

## Authentication: recomendación DP-01

Elegir con la usuaria Google si ya lo utiliza con comodidad y cuenta recuperable. Alternativa: una cuenta email/contraseña creada de manera controlada en consola, con recuperación por correo. No usar acceso anónimo como identidad duradera, SMS ni enlaces de acceso como requisito inicial. No almacenar contraseñas ni duplicar mecanismos de recuperación.

El UID autorizado se fijaría en las reglas de cada entorno; no se toma del primer registro que llegue ni de un campo `isOwner` editable. El UID no es una contraseña. No publicar correos personales en ejemplos. El perfil no concede permisos.

Ocultar «Crear cuenta» **no impide** que alguien invoque los endpoints de Auth para crear otra cuenta si el proveedor lo permite. La seguridad de datos dependerá siempre de denegar cualquier otro UID. Si «no registro público» exige impedir también toda creación de cuentas Auth, hay que aprobar un mecanismo adicional: la [documentación de bloqueo de Authentication](https://firebase.google.com/docs/auth/extend-with-blocking-functions) exige Identity Platform para esas funciones. No se incorpora esa infraestructura a Spark por suposición.

La recuperación debe conservar la identidad (mismo UID). No sustituir automáticamente la cuenta por otra ni reasignar sus datos desde el navegador. Pérdida definitiva del proveedor necesita un procedimiento administrativo explícito, fuera del autoservicio del MVP. Aprobar cómo custodiar ese acceso y quién puede operarlo.

Persistencia de sesión: proponer mantener acceso en su celular personal; sesión temporal en equipo compartido. Explicar diferencia con almacenamiento de datos. Revocar una sesión no borra copias ya leídas. Configurar dominios autorizados y probar Safari/iPhone: [redirección y almacenamiento de terceros](https://firebase.google.com/docs/auth/web/redirect-best-practices) pueden afectar el acceso federado. No se han probado proveedores reales.

## Reglas base seguras para una futura prueba

Este es un **esqueleto cerrado**, con UID ficticio y escrituras denegadas; no es el conjunto que permitiría guardar compras. No desplegarlo sin sustituir la identidad mediante configuración controlada y revisar todo el contrato.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function owner(uid) {
      return request.auth != null
        && request.auth.uid == 'UID_AUTORIZADO_PENDIENTE'
        && request.auth.uid == uid;
    }
    match /users/{uid} {
      allow get: if owner(uid);
      allow list, create, update, delete: if false;
      match /state/current {
        allow read: if owner(uid);
        allow write: if false;
      }
      match /operations/{operationId} {
        allow read: if owner(uid);
        allow write: if false;
      }
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

La lista persistida queda denegada por defecto. No añadir un `allow write: if owner(uid)` global durante desarrollo. Las reglas se combinan por OR: una coincidencia permisiva amplia anularía las restricciones específicas. SDK Admin/IAM evitan las reglas; no incluir credenciales Admin en React y no dar por probada seguridad del cliente con un test Admin.

## Contrato de validación remota necesario

| Documento / operación | Condiciones necesarias para habilitarlo |
| --- | --- |
| Perfil | Campos exactos; nombre no vacío/acotado; timestamps y versión válidos; sin roles o identidad editable. Alta controlada; no listar otros perfiles. |
| Inicialización de estado | Documento ausente, revisión 0, catálogo inicial aprobado, sin compras ni stock inventado. Si se requieren saldos iniciales, usar operaciones explícitas posteriores. |
| Compra | Crear, nunca modificar/borrar; ID y revisión correctos; fecha válida; comercio explícito; ≥1 línea; tipos cerrados; todos los pendientes resueltos; netos/total/proyección comprobables; estado posterior exacto. |
| Producto nuevo | ID estable, definición única y completa; modo/unidad válidos; apertura explícita; ninguna creación ajena a las líneas/operación; evitar creación concurrente accidental por identidad/nombre según DP-10. |
| Inventario exacto | Enteros escalados dentro de límites aprobados; unidades compatibles; saldo ≥0; movimientos encadenados; suma exacta o ajuste autorizado; impedir desbordamiento aritmético. |
| Inventario sencillo | Enum cerrado; no cantidad disponible ficticia; cantidad comprada conservada en línea; cambios de estado y movimiento coincidentes. |
| Edición de producto | Solo campos autorizados, sin reescribir historial ni cambiar silenciosamente modo/unidad. |
| Ajuste/consumo | Producto existe, expectativa/revisión correcta, antes/después y movimiento exactos; ningún campo financiero permitido. |
| Lista, si se aprueba persistencia | Esquema cerrado, cantidades/unidades válidas, IDs únicos; ningún efecto en operación/stock. |

Usar `keys().hasOnly/hasAll`, `diff().affectedKeys()` y discriminantes; no basta que los campos principales existan. Prohibir campos binarios, URLs temporales, OCR, credenciales y estructuras desconocidas **por lista de permitidos**, no mediante un filtro de palabras.

Firestore guarda enteros de 64 bits; JavaScript admite enteros exactos solo hasta su límite seguro. Campos compartidos deberán quedar en la intersección y evitar desbordamientos de productos intermedios. `BigInt` local no demuestra que las reglas multipliquen sin desbordar. Aprobar límites técnicos con DP-02/07 y probar fronteras antes de habilitar. Validar un patrón `AAAA-MM-DD` no comprueba un calendario: incluir años bisiestos y fechas inexistentes.

La [validación oficial de campos](https://firebase.google.com/docs/firestore/security/rules-fields) no proporciona un tipo genérico que valide todos los elementos de un arreglo. Las reglas no tienen un bucle para reproducir `confirmPurchase`. Hará falta un validador acotado explícito y medido, o un ejecutor confiable aprobado. Un hash enviado por el cliente, un campo `validated:true` o un resultado de reducer enviado como JSON no son pruebas remotas.

## Presupuestos de reglas y aceptación

Para el modelo B, la envoltura consulta estado anterior/posterior y operación posterior: tres llamadas, dos rutas distintas. Esto deja margen de accesos, **no demuestra** que quepa la verificación de 100 líneas. Medir expresiones, profundidad y tamaño compilado además de accesos. El caso A con verificación de productos distintos ya excede un límite por escritura antes de considerar movimientos.

No habilitar compras con un helper ficticio `validBusinessTransition()` sin su implementación y pruebas. Tampoco autorizar una compra pequeña mediante reglas débiles y aceptar una grande por otro camino menos protegido.

## Pruebas de seguridad previas a habilitar escrituras

Ejecutarlas con Firebase Emulator, un proyecto `demo-*` y contextos sin privilegios administrativos:

1. Contextos: sin Auth, UID distinto y UID autorizado, incluidos intentos en la ruta del autorizado por otro UID.
2. Todos los contextos anteriores sobre get/list/create/update/delete de cada colección. Consultas nunca deben filtrar datos después de exponerlos.
3. Dueña con compra válida 5/50/100; misma operación con producto faltante, stock adicional, movimiento omitido, total alterado, descuento excesivo o categoría falsa.
4. Compra con todos los campos válidos, enviada **sin** su estado; estado enviado sin diario; revisión saltada, operación antigua reutilizada y operación duplicada con contenido diferente.
5. Cadenas donde van enteros, floats, null, negativos, campos desconocidos, arrays/mapas malformados, importes gigantes y fechas inválidas.
6. Modificar o borrar compra confirmada; alterar inventario a la vez que una operación de edición de nombre; `expense` con `productId` o movimiento.
7. Agotar presupuestos con nombres largos/100 líneas; intentar aprovechar campos no indexados o fuera de consulta para ocultar datos.

Resultados esperados: aceptar solo cargas válidas completas, denegar las demás **sin ningún documento modificado**. [Matriz detallada](TRANSACTIONS.md#matriz-de-viabilidad-y-aceptación). Ninguna de estas reglas de negocio se ha ejecutado en esta fase: el emulador fue bloqueado al abrir un socket. Las pruebas locales actuales no reemplazan este requisito.

## Secretos y operación futura

La configuración pública del SDK web identifica el proyecto; no concede permiso administrativo. Service accounts, claves privadas y tokens no deben llegar a código, Git, URLs o logs. Mantener `.gitignore` y auditar el índice; `.env.example` solo con nombres/valores ficticios. App Check puede evaluarse después como defensa frente a abuso; no sustituye Auth/reglas ni se da por implementado. En Spark, un abuso puede agotar cuotas y afectar disponibilidad.
