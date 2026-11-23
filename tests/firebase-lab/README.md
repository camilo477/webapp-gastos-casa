# Laboratorio Firebase — Fase 04B

**Resultado negativo de viabilidad. No usar estas reglas ni este adaptador en producción.**
El laboratorio conserva pruebas fallidas: rechazar una compra válida significa que la capacidad no está demostrada. No cambiar las expectativas ni quitar validaciones para obtener un resultado verde.

## Ejecutar en Ubuntu

Desde la raíz del repositorio, con Node compatible con `package.json`, Java 21 o posterior y un navegador Chromium de Playwright ya instalado:

```bash
npm ci
npm run test:firebase:unit
npm run test:firebase:rules-check
npm run test:firebase:measure
npm run test:firebase:emulator
```

El último comando inicia Auth y Firestore, ejecuta los 57 casos Node y después los cuatro casos de recuperación en navegador, aunque Node falle, y apaga los emuladores. **Se espera código de salida 1 con el candidato actual**; consultar [FASE_04B](../../docs/FASE_04B.md). Un error de arranque no equivale a haber ejecutado la suite. El primer arranque descarga el JAR oficial a la caché local de Firebase, fuera del repositorio. No requiere `firebase login`.

Para explorar con los emuladores ya iniciados:

```bash
npm run firebase:lab:start
```

En otra terminal:

```bash
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8186
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export GCLOUD_PROJECT=demo-mi-casa-04b
node --test --test-concurrency=1 tests/firebase-lab/emulator.test.mjs
npm run test:firebase:browser
```

Ejecutar esas suites secuencialmente: ambas limpian exclusivamente los escenarios ficticios de este proyecto. El navegador sirve el laboratorio en `127.0.0.1:4186`; no sirve la aplicación React. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permite seleccionar un Chromium ya instalado, igual que en las pruebas existentes. Detener los emuladores con Ctrl+C.

Si aparece `EPERM`/`java.net.SocketException: Operation not permitted`, ejecutar desde una terminal normal de Ubuntu que permita sockets locales. No cambiar montajes, permisos globales, firewall ni restricciones de seguridad. Esta sesión sí pudo ejecutar servicios mediante el mecanismo autorizado fuera del sandbox; no todos los entornos lo permitirán.

## Aislamiento y contrato

- Proyecto fijo `demo-mi-casa-04b`, UID ficticio `demo-owner-04b`. Sin credenciales ni fallback remoto; `guard.mjs` rechaza endpoints distintos, proyecto real y variables de credenciales. No establecer `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_CONFIG` ni `FIREBASE_TOKEN`.
- `emulators:exec` añade internamente una `FIREBASE_CONFIG` ficticia. La guarda solo admite su forma exacta para este proyecto demo; el adaptador no la usa ni conecta esos servicios. Configuraciones externas siguen rechazadas por el comando de arranque.
- Auth `127.0.0.1:9099`, Firestore `127.0.0.1:8186`, hub `4404`, logging `4504`; UI desactivada. Firestore también utiliza un websocket auxiliar en loopback `9150`. No iniciar sobre puertos ocupados.
- `firebase.json` está dentro del laboratorio, sin `.firebaserc`, Hosting, Functions o Storage. No hay comando de despliegue.
- Solo se usa `withSecurityRulesDisabled` para preparar fixtures/limpiar escenarios. Todos los ataques usan el SDK cliente con reglas activas; las solicitudes REST usan un ID token emitido por Auth Emulator.
- `firestore.template.rules` más `generate-rules.mjs` producen el **código de reglas real** versionado en `firestore.rules`. Tras editar la plantilla, ejecutar `node tests/firebase-lab/generate-rules.mjs` y el chequeo de reproducibilidad. No es pseudocódigo ni un placeholder que acepte transiciones.
- Contrato experimental: COP enteros, cantidades ×1.000, conversiones explícitas `g→kg` y `ml→L`, estados sencillos, descuento por línea y compras inmutables. Los límites sintéticos son precio ≤1.000.000 COP y cantidad/saldo/total ≤1.000.000.000; sirven para acotar la aritmética, no para aprobar límites comerciales.
- Productos nuevos abren en cero/`empty`; aperturas no nulas no están implementadas. Servicios tienen importe y descuento sin unidad física. Catálogo ficticio fijo de categorías; fecha de intención de calendario transportada como Timestamp. No hay coincidencia semántica de nombres, edición de catálogo, informes ni consultas de producción.

El intento durable del navegador contiene exclusivamente UID, ID, confirmación e intención estructurada ficticia en una clave localStorage del origen del laboratorio. No se conecta al prototipo ni aprueba DP-06. Las pruebas comprueban ID al servidor mediante `getDocFromServer`; una ausencia no autoriza cancelar un emisor todavía pendiente. Un reintento conserva ID e intención.

## Evidencia y límites

`model.test.mjs` prueba cálculos puros; **no prueba reglas**. `emulator.test.mjs` envía transacciones y ataques reales, incluyendo confirmaciones concurrentes, catálogos, tamaños REST e historial preparado. `browser.spec.mjs` corta red antes de enviar, intercepta el commit, cierra una pestaña y descarta respuestas. La precondición de commit aceptado falla en el último escenario; no hay recuperación posterior a un commit exitoso demostrada.

El validador usa un mapa completo de productos por paso (`frames`) para comprobar que una línea física cambia solo su producto y una de servicio no cambia inventario. Verifica cada prefijo financiero y el número exacto de movimientos. Es una extensión experimental costosa de B: `O(productos × líneas)`. No representa una obligación de adoptar estos testigos en el modelo final.

`measure.mjs` aplica la fórmula oficial de almacenamiento, contrastada con el ejemplo de 147 bytes. También serializa cuerpos REST exactos. **Bytes REST JSON, tamaño de almacenamiento y bytes protobuf del SDK son magnitudes diferentes.** No se midieron índices/facturación ni límite de solicitudes de producción. Los logs y resultados quedan ignorados; no guardar exports, JARs, datos ni cachés en Git.

DP-01 a DP-13 siguen pendientes. Ver [FIREBASE_FEASIBILITY](../../docs/architecture/FIREBASE_FEASIBILITY.md) antes de elegir una arquitectura.
