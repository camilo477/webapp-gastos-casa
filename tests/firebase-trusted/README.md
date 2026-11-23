# Laboratorio 04C — Ejecutor confiable

Prueba local independiente de React y del laboratorio histórico 04B. Solo proyecto `demo-mi-casa-04c`, UID `demo-owner-04c` y datos ficticios. No hay credenciales, servicios reales ni despliegue. DP-01 a DP-13 permanecen pendientes.

## Ejecución reproducible en Ubuntu

Desde la raíz del repositorio, con Node 20 del entorno de prueba, Java 21 o posterior y Chromium ya instalado para Playwright:

```bash
npm ci
npm run test:firebase:trusted:unit
npm run test:firebase:trusted
```

El segundo comando ejecuta diez pruebas del contrato. El tercero inicia Auth/Firestore/Functions, ejecuta las 53 pruebas de integración y cuatro de navegador, y apaga los emuladores. Su salida conserva métricas y códigos de error; ejecuta navegador aunque integración falle. No ejecuta ni altera las pruebas negativas de 04B. Las dependencias de `functions/package.json` se resuelven desde `node_modules` de la raíz, fijadas por el lockfile raíz: no hace falta instalar otra copia dentro de `functions/`.

Para dejar el laboratorio iniciado:

```bash
npm run firebase:trusted:start
```

En otra terminal:

```bash
export GCLOUD_PROJECT=demo-mi-casa-04c
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8286
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9199
node --test --test-concurrency=1 tests/firebase-trusted/emulator.test.mjs
npm run test:firebase:trusted:browser
```

No ejecutar ambas suites simultáneamente: preparan/limpian los mismos fixtures. Ctrl+C apaga el arranque manual. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` admite un navegador local ya instalado. No se descarga automáticamente Chromium.

Si los sockets están bloqueados, ejecutar esos comandos desde una terminal normal de Ubuntu o mediante la ejecución externa autorizada del entorno. No cambiar permisos, montajes ni seguridad. En esta fase se comprobó el comando completo fuera del sandbox.

## Aislamiento

Auth usa `127.0.0.1:9199`; Firestore `8286` y websocket `9250`; Functions `5104`; hub `4405`; logging `4505`. UI desactivada. El navegador del laboratorio sirve solo esta carpeta en `127.0.0.1:4187`.

El arranque rechaza variables de credenciales y fija el proyecto demo. El módulo Functions exige además las direcciones exactas de Auth y Firestore y aborta sin ellas; esto impide reutilizar inadvertidamente esta entrada contra producción. La configuración ficticia que inyecta Firebase CLI se valida por proyecto. El descubrimiento de Functions escribe un manifiesto temporal mediante `FIREBASE_FUNCTIONS_DISCOVERY_OUTPUT_PATH=true`, evitando el servidor HTTP auxiliar que el SDK abre por defecto durante el descubrimiento. No hay archivo `.firebaserc` ni script de despliegue.

Los tokens sin firma son exclusivamente el mecanismo admitido por Auth Emulator. No funcionan contra Authentication real. Las pruebas usan privilegios solo para fixtures/limpieza; llamadas adversariales y escrituras directas usan clientes normales. El ejecutor sí utiliza Admin SDK, como corresponde a la frontera confiable, sin credencial real y con Firestore Emulator obligatorio.

## Modelo y contratos provisionales

`users/{uid}/products/{id}` contiene metadatos, saldo exacto o estado sencillo, versión y timestamp. `users/{uid}/operations/{id}` es la compra canónica cuando `kind=purchase`: líneas financieras, movimientos embebidos, productos referenciados, total calculado, hash de intención y timestamp. No hay otra colección de gastos. Un ajuste explícito es otra operación sin importe financiero.

`confirmPurchase`, `adjustStock` y `lookupOperation` son callables reales. `executor.mjs` lee primero operación y productos distintos, valida todos los efectos y luego escribe una transacción completa. La operación solo se crea; las reglas deniegan todas las escrituras directas y permiten lecturas propias autorizadas.

Parámetros sintéticos: COP enteros; cantidades ×1.000; redondeo positivo por línea; conversiones g/kg y ml/L enteras; descuento individual; estados `available|low|empty`; categoría ficticia cerrada; historia inmutable. Un producto nuevo abre explícitamente en cero/`empty` para estos escenarios. No se implementan apertura no nula, correcciones financieras, descuentos generales ni deduplicación semántica de nombres.

Límites del ensayo: 100 líneas por intención, cuerpo JSON hasta 256 KiB, operación hasta 900.000 bytes por fórmula de almacenamiento, precios hasta 1.000.000 COP y cantidades/saldos/totales/versiones hasta 1.000.000.000. Son protecciones y parámetros de prueba, no límites funcionales aprobados. Una compra de 100 se confirma una sola vez.

## Recuperación y medidas

La página de demostración persiste únicamente UID, ID, estado, intención estructurada y su SHA-256 en una clave localStorage del origen local. No hay fotos, base64 ni OCR. Compara la identidad/hash con la consulta remota; una ausencia no implica cancelación de otros envíos aún activos. El reintento conserva el mismo ID. Esta persistencia no se incorpora a React ni aprueba DP-06.

Los contadores miden lecturas de documentos solicitadas por el ejecutor, escrituras comprometidas y enviadas, intentos del callback, bytes del cuerpo callable JSON y tamaño documental calculado con la fórmula oficial. No son una factura ni captura de bytes gRPC/índices. El tiempo interno excluye arranque/autenticación; el round trip del test los incluye. Ver [FASE_04C](../../docs/FASE_04C.md) y [TRUSTED_EXECUTOR](../../docs/architecture/TRUSTED_EXECUTOR.md).

Node 20 funciona para este laboratorio, pero su runtime de Functions está retirado en producción a la fecha de consulta. Antes de cualquier implementación real se debe elegir/probar un runtime soportado. Este laboratorio conserva deliberadamente una barrera contra producción; no constituye un paquete listo para desplegar.
