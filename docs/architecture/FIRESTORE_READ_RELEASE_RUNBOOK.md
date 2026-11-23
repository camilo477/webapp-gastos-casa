# Lectura de inventario real — procedimiento de verificación y activación futura

Preparado en 05C-5, 23-11-2026. **Solo los pasos de consulta/verificación están autorizados ahora.** Publicar reglas, crear ACL, modificar datos o conectar React requieren una fase y autorización posteriores. No ejecutar este documento entero como una receta autorizada.

## 1. Verificar sin cambiar recursos

Estado aportado por el propietario: mi-casa-camilo-test, (default), vacío, Spark y reglas deny-all; después confirmó visualmente en Google Cloud Console Standard, Firestore Native, us-east1, backups programados deshabilitados y cifrado administrado por Google. Es evidencia del propietario, no consulta administrativa independiente de Codex. Ver [FASE_05C_5](../FASE_05C_5.md).

Para volver a comprobarlo manualmente, sin crear una base:

1. Abrir [Firebase Console del proyecto](https://console.firebase.google.com/project/mi-casa-camilo-test/overview) y comprobar el ID del proyecto en configuración general. No confundir nombre visible con ID.
2. Ir a Firestore (Databases & Storage / Bases de datos y almacenamiento), pestaña Datos, seleccionar la base **(default)** y consultar su ubicación. Comprobar **us-east1**, no solo «Estados Unidos» ni la ubicación predeterminada genérica del proyecto. La documentación oficial indica dónde [consultar ubicaciones](https://firebase.google.com/docs/firestore/locations#view_the_location_of_your_databases).
3. En [Google Cloud Console → Firestore → Bases de datos](https://console.cloud.google.com/firestore/databases?project=mi-casa-camilo-test), comprobar selector de proyecto, fila/detalles de (default), edición **Standard**, modo **Firestore Native** y región **us-east1**. Si la interfaz no muestra alguno, no inferirlo del SDK ni modificar modo/edición para que coincida.
4. Revisar Spark en Firebase y confirmar que no se ha vinculado facturación. No pulsar Actualizar plan ni activar pruebas de pago. La consulta de metadatos de Firestore no demuestra el plan Firebase.
5. En Firestore → (default) → Reglas, consultar el contenido **publicado**, no un borrador del editor: regla global `allow read, write: if false;`, sin otros allow permisivos. Comprobar Datos vacío sin crear colección/documento; Console/IAM puede acceder aunque clientes estén denegados. No usar una escritura de prueba para demostrar deny-all.
6. Registrar únicamente fecha, proyecto/base y valores comprobados, junto con quién aportó la evidencia. No guardar capturas privadas, UID, emails, tokens o salidas completas en Git. Backups/cifrado son observaciones de configuración, no permisos para activar esos servicios.

Consulta administrativa opcional, **solo si ya existe gcloud instalado y una sesión autorizada para ese proyecto**, sin login nuevo, claves, tokens descargados o activación de APIs:

```sh
gcloud firestore databases describe --project=mi-casa-camilo-test --database='(default)' --format='json(name,locationId,type,databaseEdition)'
```

Es una consulta de metadatos, no lectura/escritura de productos. Comprobar name correspondiente al proyecto/base, locationId=us-east1, type=FIRESTORE_NATIVE y databaseEdition=STANDARD. Si falta un campo, hay 401/403 o pide habilitar servicios, detenerse y usar la verificación visual; no conceder permisos o inferir valores para completar el resultado. No usar print-access-token, login:ci, service accounts, ADC nuevas o credenciales en comandos. Aquí no se ejecutó describe porque no hubo sesión administrativa verificable ni gcloud disponible. [Consulta oficial](https://docs.cloud.google.com/sdk/gcloud/reference/firestore/databases/describe), [campos de metadatos](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases).

Firebase CLI instalada también ofrece `firestore:databases:get`, como documenta [Manage databases](https://firebase.google.com/docs/firestore/manage-databases#view_database_details); no es un sustituto del plan/reglas activos ni un permiso de sesión. No publicar salida completa de login:list: puede incluir datos de cuentas. No se preparó un script automático que conecte al proyecto o extraiga credenciales.

## 2. Publicación futura de reglas — no ejecutar en 05C-5

Condiciones previas: propietario autoriza expresamente publicación en ese proyecto/base; se revisa nuevamente el commit concreto; las pruebas locales y evidencia de configuración siguen vigentes. No autoriza Functions, Hosting o Blaze.

1. Comparar el artefacto completo [inventory-read.firestore.rules](../../security/inventory-read.firestore.rules), sin reemplazarlo por el esqueleto histórico de SECURITY ni por reglas del emulador. No insertar un UID en el archivo. Registrar el hash local como referencia de contenido; **no prueba qué está publicado**.
2. En Firebase Console, seleccionar mi-casa-camilo-test → Firestore → (default) → Reglas. Revisar toda la fuente activa y sustituirla únicamente por el artefacto aprobado, sin allow adicionales. No utilizar comandos deploy del laboratorio ni cambiar su configuración para apuntar a un proyecto real.
3. Solo con autorización de ese cambio, publicar. Después volver a consultar las reglas activas/proyecto/base, comparar con la fuente aprobada y registrar versión/fecha de publicación sin datos privados. Esperar su propagación antes de probar o habilitar el cliente; un borrador o mensaje de compilación no confirma que estén activas. [Procedimiento oficial de reglas](https://firebase.google.com/docs/rules/manage-deploy#use_the_firebase_console).
4. Mantener React bloqueado durante todo el procedimiento. Sin ACL válida las reglas siguen denegando productos. Las escrituras directas, ACL, finanzas y rutas desconocidas permanecen cerradas incluso cuando después se habilite lectura.

## 3. ACL administrativa futura — no crear en 05C-5

Requiere permiso específico para escribir **solo la autorización administrativa**, no productos. Usar una sesión Console/IAM previamente autorizada; no descargar una clave ni incorporar Admin a React. Console/IAM no depende de que las reglas permitan al cliente crear la ACL: nunca abrir reglas para aprovisionarla.

1. En Firebase Authentication del **mismo proyecto**, abrir la cuenta previamente aprobada y consultar su UID. No crear usuarios, elegir la primera cuenta por automatismo, utilizar el correo como autorización o copiar un UID ficticio del laboratorio.
2. Comparar privadamente ese UID con la configuración Auth local aprobada. No pegarlo en terminal, documentación, ejemplos, capturas versionadas o reglas. Si difiere, detenerse: no reasignar cuentas/datos ni cambiar Authentication por esta guía.
3. Una vez autorizadas y verificadas las reglas de lectura, ir a Firestore → (default) → Datos. Antes de cualquier creación, comprobar si ya existe `_access/inventory`; si existe, revisarlo sin sobrescribirlo automáticamente y resolver cualquier diferencia con el propietario.
4. Solo con permiso de creación, elegir colección **_access**, documento **inventory** (ID fijo, no automático). Crear exactamente estos campos, sin extras:

| Campo | Tipo en Console | Valor a introducir solo en la sesión administrativa |
| --- | --- | --- |
| schemaVersion | number, entero | 1 |
| enabled | boolean | true |
| ownerUid | string | Copiar el UID de la cuenta aprobada consultada en el paso 1; su valor no figura en este documento |

5. Revisar proyecto/base/ruta/tipos/UID antes de guardar. Volver a consultar el documento después, sin crear productos ni alterar el historial. Los clientes no podrán leer o modificar este documento; las reglas lo consultan internamente. Esta acción significa que la base ya no estará completamente vacía, pero su inventario podrá seguir vacío.
6. Comprobar que únicamente el UID configurado puede leer su ruta de productos y que otros accesos/rutas siguen denegados, con herramientas o cuentas expresamente autorizadas. No crear otra cuenta real para un negativo. Los contextos sintéticos de Emulator prueban la política, no son identidades válidas para ensayos reales.

## 4. Activación posterior de React — otro permiso y cambio revisado

Mantener `requireRealInventoryReadRelease` incondicional hasta esa fase. El cambio deberá:

- Conservar Auth-only por defecto y requerir selección/aprobación explícita de lectura por proyecto/base/origen, sin reutilizar la autorización de Auth como permiso Firestore. Mantener demo sin Firebase y emuladores sin endpoints reales.
- Reutilizar la app Auth del proyecto, schemaVersion 2 y las siete categorías, sin tocar Authentication. Componer el lector **sin mutate**; ampliar App/InventoryContext o usar un ámbito específico de lectura sin casts que inventen escrituras. LocalInventoryPage ya acepta lectura sola.
- Montar dentro de las rutas privadas y del ámbito de sesión; limpiar al cerrar/cambiar identidad, descartar respuestas tardías y liberar servicios. Una sesión comprobándose/vencida no puede mostrar productos anteriores.
- Distinguir fallo de configuración/lectura de ausencia de servicio: nunca caer al seed de demostración para suplir inventario real. Mostrar vacío si solo existe la ACL. Revisar mensajes de LoginPage/SessionActions que hoy hablan de Auth-only o persistencia del emulador, conservando el diseño.
- Verificar consultas de 100 documentos/cursor, categorías, esquema, permisos/red/sesiones, ausencia de escrituras/Functions y regresión demo. La región se comprueba en la base; el lector Firestore no tiene un parámetro regional que la cambie.

No sembrar datos para probar el lector: leer una colección vacía es un resultado válido. Aprovisionar productos, migrar documentos antiguos o desplegar ejecutores necesita otro permiso.

## 5. Interrupción y reversión futura

Si proyecto, región, edición, modo, UID o reglas difieren, no conectar ni recrear/migrar recursos. Una reversión administrativa autorizada puede volver a deny-all o deshabilitar la ACL; requiere verificar reglas activas y propagación. No revoca tokens Auth, borra copias ya leídas o limita administradores IAM. Detener el cliente y limpiar sus vistas es una responsabilidad adicional, no una garantía de borrado remoto.

Mantener pendientes cuotas, costos/abuso, índices reales y mediciones del dispositivo. Spark no garantiza disponibilidad ilimitada. Los límites/migraciones y DP financieras no se aprueban mediante este procedimiento.
