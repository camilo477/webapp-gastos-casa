# Guía de implementación Firebase — Infraestructura 05A y Auth local 05B-1

## Estado actual: autenticación local 05B-1

Actualización: 23-11-2026. Solo está autorizado **Firebase Authentication Emulator desde React**. Staging/producción y los adaptadores de datos del frontend permanecen bloqueados. La sección 05A inferior describe la infraestructura original; la excepción actual es el adaptador de sesión documentado aquí. DP-01 a DP-13 conservan los aspectos pendientes. No se inicia 05B-2.

### Capas y seguridad

- `src/application/ports.ts`: puerto `SessionPort`, estados `checking`, `anonymous`, `authenticated`, `error`, entrada discriminada por método y alcance de estado de ejemplos. No importa SDK ni React. Incorporar después un método autorizado no exige cambiar las pantallas del dominio.
- `src/adapters/firebase/authentication.ts`: único adaptador Auth, importado dinámicamente desde `main.tsx` tras validar modo, proyecto, hosts y hostname loopback. Usa exclusivamente `firebase/app` y `firebase/auth` cliente **12.19.0**, versión ya fijada en raíz, ahora dependencia de ejecución. Se conserva el SDK 13.4.0 del paquete servidor y los laboratorios históricos independientes.
- `initializeAuth` con `browserLocalPersistence` y `connectAuthEmulator` síncrono antes de cualquier operación asíncrona. Proyecto `demo-mi-casa-05a`, API key ficticia `demo-only-05b-1`, app nombrada para separar su almacenamiento. No se usa `authDomain`, popup, Google, Analytics, Admin, Firestore ni Functions en React.
- Identidad siempre desde el usuario Auth observado; únicamente `demo-owner-05a` puede abrir las pantallas locales. No se autoriza por correo, campos del formulario, primer login ni cuerpo de peticiones. Se rechaza cualquier otro UID y se intenta retirar su sesión local.
- `SessionContext` integra el puerto con `useSyncExternalStore`. El guard no monta rutas privadas mientras se valida. Un contador de alcance reinicia `DemoProvider` en logout, identidad distinta y error de verificación; los resultados asíncronos obsoletos se ignoran mediante versión. Renovar la misma identidad conserva el alcance.
- Todas las rutas del prototipo están protegidas en modo emulador. `/acceso` es pública. Tras ingresar se recupera la ruta interna solicitada; no se admiten redirecciones externas. En demo `/acceso` vuelve al inicio y las rutas normales no necesitan sesión.
- `disabled.ts` sigue rechazando servicios de datos; **no importar ni llamar a los callables financieros desde este frontend**. Las reglas existentes deniegan toda escritura cliente y las lecturas de otros UID; el servidor mantiene su autorización anterior al repositorio. Ocultar UI no es una barrera de seguridad.

El emulador es infraestructura local de confianza para desarrollo, no un servidor público seguro. Su API permite crear usuarios e incluso simular identidades; un atacante con control del entorno local puede impersonar el UID permitido. La allowlist prueba el contrato de autorización, no reemplaza validación criptográfica/productiva. Los tokens del emulador no son aceptados por servicios Firebase productivos. Referencia: [conectar Authentication Emulator](https://firebase.google.com/docs/emulator-suite/connect_auth).

### Sesiones y limpieza

El SDK conserva oficialmente tokens de acceso/renovación en localStorage, nunca la contraseña. El SDK de app también puede crear `firebase-heartbeat-database` en IndexedDB para metadatos de versión/fecha; las pruebas inspeccionan su contenido y descartan contraseñas o datos del dominio. No existe almacenamiento de borradores, compras, fotos, inventario o lista. El formulario borra la contraseña al enviar y no la añade al contexto, URL, logs ni stores.

`onIdTokenChanged` observa login/logout, cambios entre pestañas y renovaciones. La primera identidad restaurada se valida forzando renovación de token antes de mostrar pantallas. Hay revalidación al recuperar foco, visibilidad, conexión y al vencer el token; la caducidad por sí sola no dispara `onIdTokenChanged`, por eso hay temporizador explícito. La comprobación de la misma identidad con token vigente ocurre en segundo plano y conserva formularios; identidad inicial/distinta o token vencido se ocultan hasta validar. Renovación válida mantiene la sesión; token inválido, vencido o cuenta deshabilitada cierran acceso. Un error de red oculta las pantallas y limpia ejemplos; conserva solo la sesión oficial para un reintento explícito. No se promete detección instantánea de revocación mientras la ventana está inactiva. [Persistencia oficial](https://firebase.google.com/docs/auth/web/auth-state-persistence), [referencia Auth](https://firebase.google.com/docs/reference/js/auth).

Logout oculta las pantallas y cambia el alcance antes de esperar al SDK; ninguna respuesta anterior puede reabrirlas. Se retiran observador, listeners de ventana/documento y temporizador al disponer el servicio; HMR dispone también el router. La sesión Auth no confirma una compra ni un gasto. La recarga conserva identidad cuando la validación funciona, pero reinicia todos los ejemplos del prototipo.

### Ejecución manual

Con Node 24.22.3 y Java≥21, instalar ambos lockfiles según la sección 05A. Mantener tres terminales en la raíz:

```bash
# Terminal 1: laboratorio 05A completo, sin datos reales
npm run firebase:local:start
```

```bash
# Terminal 2: aprovisionamiento ficticio e idempotente, solo con emuladores activos
npm run firebase:auth:seed
# El demo independiente sigue disponible sin iniciar sesión
npm run dev
```

```bash
# Terminal 3: elección explícita del acceso local, sin crear ni copiar un .env
npm run dev:emulator
```

Abrir `http://127.0.0.1:5174/inventario`: redirige a `/acceso`. Fixture permitido: `duena@example.test`, contraseña **ficticia de laboratorio** `Solo-local-05B1!`, UID `demo-owner-05a`. Fixture rechazado: `otra@example.test`, contraseña ficticia `Otra-local-05B1!`, UID `demo-other-05b1`. Nunca reutilizar contraseñas reales ni introducir cuentas reales. El adaptador rechaza correos fuera de `@example.test` antes de transmitirlos. El runner de fixtures valida configuración, rechaza credenciales y no crea registros financieros; Admin queda exclusivamente en el script Node.

`dev:emulator` fija los valores locales exactos y puerto 5174. Sin variables de modo, `dev` sigue siendo demo en 5173; un `.env` local puede cambiar esa elección explícita. Si se cambia de modo/servidor, se recarga toda la aplicación, sin mover ni reenviar datos entre modos. React no cambia a Firebase silenciosamente. Un emulador caído produce error, nunca fallback a servicios reales. Configuración no autorizada muestra un aviso y no inicia servicios.

Probar credenciales incorrectas, UID ajeno, recarga, cerrar sesión, dos pestañas, desconexión/recuperación y ejemplos nuevos tras entrar otra vez. Las compras siguen en memoria y se identifican como ejemplos ajenos a la cuenta. Ctrl+C detiene los servidores; no se exportan ni publican bases de emuladores.

### Pruebas automáticas

Con los emuladores manuales detenidos:

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e
npm run typecheck:server
npm run test:server
npm run test:firebase:local
npm run test:auth:emulator
```

La suite Auth usa `firebase.local.json` validado y CLI fijado de `functions/`, proyecto demo y solo Auth/Firestore para los negativos de reglas. Prepara fixtures y arranca React emulador en 5174 y demo en 4175. Playwright bloquea cualquier destino externo y llamadas del navegador a servicios financieros. Incluye persistencia/recarga, carga inicial bloqueada con respuesta retrasada, fallo de red, renovación inválida, UID ajeno/cambio entre pestañas, altas directas por API denegadas por autorización, independencia del demo, teclado, axe y anchuras 360/390/430/768 con texto 200%. La simulación de errores de renovación no acredita revocación productiva real. Los resultados exactos y limitaciones están en [FASE_05B_1](../FASE_05B_1.md).

### Proveedores posteriores: solo preparación

Esta fase no decide Google frente a correo/contraseña productivos. Para un proveedor real se necesita autorización independiente, resolver DP-01/06 y recursos/costos/entornos de DP-07. Aprovisionar administrativamente la identidad y su UID durable; si después se vincula Google, usar vinculación al mismo UID en un adaptador autorizado, sin crear una cuenta por coincidencia de correo. Añadir la variante de entrada al puerto y UI de acceso; el dominio y los componentes del prototipo permanecen independientes del proveedor. No añadir configuración real a los scripts locales ni relajar sus guards para hacerlo.

Antes de habilitarlo, definir recuperación, dispositivo/navegador, dominios autorizados, errores de popup/redirección, vinculación y revocación; configurar allowlist del servidor y reglas administrativamente, nunca copiando el UID demo. No hay comandos de activación ni despliegue en esta fase.

**Sin registro público UI no significa bloquear altas por API.** La suite demuestra que Authentication Emulator acepta `accounts:signUp`; el UID generado sigue rechazado por la app y las reglas. Si DP-01 exige bloqueo global, evaluar después restricciones de autoservicio de Identity Platform, compatibilidad/costos y aprovisionamiento inicial, sin activarlas ahora. [Administrar autoservicio de usuarios](https://cloud.google.com/identity-platform/docs/concepts-manage-users).

## Infraestructura original 05A (referencia histórica)

Fecha: 22-11-2026. **Infraestructura local experimental, sin autorización productiva.** DP-01 a DP-13 siguen pendientes en los documentos originales. Se conserva el núcleo normalizado y transaccional de [04C](TRUSTED_EXECUTOR.md), no el agregado descartado de 04B. Los [contratos 04D](FINAL_CONTRACT_PROPOSAL.md) continúan siendo propuestas; no se implementaron rectificaciones, descuentos generales ni su política de persistencia.

## Responsabilidades y estructura

| Capa | Archivos | Estado en 05A |
| --- | --- | --- |
| Interfaz | `src/app`, páginas y componentes existentes | Sin cambios visuales ni pantallas nuevas |
| Estado de presentación | `src/state/DemoContext.tsx` | Sin cambios; conserva estado en memoria y `reduceDomain` |
| Dominio del prototipo | `src/domain/` | Intacto; no importa Firebase ni el servidor |
| Servicios de aplicación | `src/application/ports.ts` | Interfaces de sesión, inventario paginado, compra, resultado, historial y pendientes. DTO genéricos: no fijan políticas DP |
| Configuración del cliente | `src/application/configuration.ts`, guard en `src/main.tsx` | Demo predeterminado. Configuración incorrecta produce `ConfigurationError` en consola y no inicia conexiones |
| Adaptador cliente futuro | `src/adapters/firebase/disabled.ts` | Punto reservado que siempre rechaza inicialización. No importa SDK ni hace solicitudes |
| Contrato/dominio servidor | `functions/src/experimental/{types,validation,plan}.ts` | Tipado y validación estricta del **contrato provisional 04C**; cálculo sin acceso Firestore |
| Servicio ejecutor | `functions/src/application/{repository,executor}.ts` | Puerto transaccional, autorización antes del repositorio, hash/idempotencia y orquestación |
| Adaptadores servidor | `functions/src/adapters/{firestore,callable-errors}.ts`, `functions/src/index.ts` | Admin solo aquí; transacción y callables locales con errores saneados en todos los endpoints |
| Configuración/pruebas | `functions/src/config/local.ts`, `functions/scripts/`, `functions/tests/`, `firebase.local.json` | Paquete, lockfile, pruebas y emuladores propios; sin configuración predeterminada de despliegue |

El servidor no importa dominio React, semillas ni estado de presentación. La traducción de 04C a TypeScript conserva sus cálculos/validaciones y se contrasta con sus fixtures/validador en pruebas; no comparte dependencias instaladas con la raíz. No se eliminan ni reescriben los laboratorios históricos. La separación permite sustituir el contrato experimental cuando se aprueben las políticas, sin reconstruir los componentes.

## Runtime y dependencias fijadas

| Uso | Selección / comprobación |
| --- | --- |
| Nuevo servidor y herramientas locales 05A | **Node 24.22.3**, `functions/.nvmrc`; `engines.node=24`, guard de emuladores exige 24.12 o posterior dentro de 24 |
| SDK de ejecución | `firebase-admin` **14.5.1**, `firebase-functions` **7.4.0** |
| SDK de pruebas cliente/reglas | `firebase` **13.4.0**, `@firebase/rules-unit-testing` **6.0.0**; nunca importados por React |
| Herramientas del paquete | `firebase-tools` **15.37.0**, TypeScript **6.0.3**, `@types/node` **24.19.2** |
| Java | Recomendar **JDK 21 o posterior**; ejecutado con OpenJDK **25.0.5.1** |
| Regresión 04C | Runtime histórico Node **20.19.5**, SDK/versiones directas originales, sin modificar sus archivos; no se recomienda Node 20 para el futuro servidor |

Se verificaron requisitos npm `engines` y `peerDependencies`: Admin 14 requiere Node≥22; Functions 7.4 admite Admin 14; reglas 6 requiere Firebase 13 y Node≥24.12; `@firebase/app` 0.16.7 también exige ≥24.12. CLI 15.37 reconoce `nodejs24` y el arranque comprobó «Using node@24 from host». Las versiones directas raíz se conservaron.

El [calendario oficial de runtimes](https://docs.cloud.google.com/functions/docs/runtime-support) incluye Node 24, retirada prevista 31-10-2028; Node 20 fue retirado el 30-10-2026. La [guía general de administración](https://firebase.google.com/docs/functions/manage-functions) mantiene ejemplos/listados antiguos: no se usan para justificar Node 20 ni se confunde soporte local con despliegue verificado. [Admin 14 y sus cambios](https://firebase.google.com/support/release-notes/admin/node), [SDK cliente](https://firebase.google.com/support/release-notes/js), [requisitos generales de emuladores](https://firebase.google.com/docs/emulator-suite/install_and_configure), [aviso específico de Java 21](https://firebase.google.com/docs/emulator-suite/connect_firestore). Referencias consultadas en esta fase; volver a verificarlas antes de otra integración.

Node 24 se descargó para esta comprobación en `/tmp`, sin cambiar Node del sistema ni instalar recursos Firebase. Esa ruta es temporal, no requisito de la aplicación. Para una terminal normal Ubuntu, seleccionar la versión mediante el gestor habitual; no se instala Node desde scripts de la app.

## Instalación y ejecución local

Desde la raíz Git del clon, con Node 24.22.3 y JDK≥21 disponibles:

```bash
node --version
java -version
npm ci
npm --prefix functions ci
npm run typecheck
npm run typecheck:server
npm run build
npm run test:server
npm run test:firebase:local
```

Con nvm instalado, `nvm install 24.22.3` y `nvm use 24.22.3` seleccionan la versión; `cd functions && nvm use` usa su `.nvmrc`. Instalar paquetes no crea un proyecto Firebase. El CLI puede descargar su binario de emulador si falta: queda en caché local, nunca se añade a Git. No hace falta login Firebase ni credenciales.

`npm run firebase:local:start` compila y deja los emuladores activos; **Ctrl+C** solicita su apagado. `npm run test:firebase:local` compila, valida configuración, inicia, ejecuta pruebas y apaga con `emulators:exec`; devuelve error si falla cualquier caso. No inicia React ni transmite datos al frontend. El runner solo acepta `start` o `test`, utiliza su CLI fijado y siempre pasa `--project demo-mi-casa-05a --config firebase.local.json`. No usar invocaciones genéricas que dependan de un proyecto activo.

Si el entorno restringido rechaza sockets con `EPERM`/`Operation not permitted`, ejecutar esos mismos comandos en una terminal normal o mediante la ejecución externa autorizada. No cambiar permisos, montajes ni seguridad del sistema. Un fallo de arranque no acredita pruebas ejecutadas. No basta contar un archivo de test como una suite de casos: comprobar nombres, cantidad y código de salida.

## Entornos y variables

| Modo | Configuración actual | Acceso remoto |
| --- | --- | --- |
| Demo | `VITE_APP_MODE` ausente o `demo` | Ninguno; prototipo existente |
| Emulador | Proyecto exacto y tres endpoints completos de `.env.example` | Parser admite la configuración, pero **el arranque React la rechaza**: adaptador aún no conectado. El cliente aislado de tests sí utiliza SDK contra emuladores |
| Staging futuro | Reservado; sin valores ni recursos | Rechazado por `REMOTE_ENVIRONMENT_DISABLED_05A` |
| Producción futura | Reservado; sin valores ni recursos | Rechazado por el mismo guard; sin fallback |

`.env.example` contiene únicamente proyecto/puertos ficticios y demo como opción activa. Copiarlo a `.env` es opcional; no versionar `.env`. `VITE_FIREBASE_PROJECT_ID`, `VITE_AUTH_EMULATOR_HOST`, `VITE_FIRESTORE_EMULATOR_HOST`, `VITE_FUNCTIONS_EMULATOR_HOST` solo admiten sus valores locales exactos cuando se pide modo emulador. No se introduce apiKey real ni identidad de usuaria. Las variables `VITE_*` son públicas, no un mecanismo de secretos.

El runner proporciona `MI_CASA_ENV=emulator`, `FUNCTIONS_EMULATOR=true`, `GCLOUD_PROJECT`/`GOOGLE_CLOUD_PROJECT`, `FIRESTORE_EMULATOR_HOST` y `FIREBASE_AUTH_EMULATOR_HOST` ficticios. Rechaza valores heredados incompatibles y variables de credenciales; no los corrige silenciosamente hacia otro destino. Functions exige su señal oficial `FUNCTIONS_EMULATOR=true`, proyecto/hosts exactos, ausencia de credenciales y configuración Firebase coincidente **antes de inicializar Admin**. `MI_CASA_ENV`, si llega, también debe coincidir. El CLI filtra variables arbitrarias durante descubrimiento; por eso la seguridad no depende exclusivamente de esa variable personalizada.

No hay `.firebaserc` nuevo, `firebase.json` productivo, alias real ni script de deploy. Cambiar un nombre de proyecto no basta para habilitar producción. Futuros adaptadores deberán vincular todo pendiente a proyecto/entorno/UID, sin reenviarlo al cambiar de modo; hoy solo existe la interfaz, no un almacén durable.

## Emuladores y seguridad

Todos los listeners declarados usan `127.0.0.1`:

| Servicio | Puerto |
| --- | ---: |
| Authentication | 9299 |
| Firestore / websocket | 8386 / 9350 |
| Functions | 5205 |
| Hub / logging | 4406 / 4506 |
| Eventarc / Tasks auxiliares de Functions | 9400 / 9500 |

UI desactivada; `singleProjectMode=true`. Eventarc/Tasks son auxiliares locales del CLI, no recursos de pago ni funcionalidades nuevas. Se fijaron sus puertos para evitar la colisión del puerto Eventarc predeterminado con Auth. El runner comprueba toda la configuración antes de iniciar y rechaza una fuente/host/puerto inesperado. No correr 04C y 05A simultáneamente: el puerto Eventarc predeterminado de 04C puede colisionar con Auth 05A.

Se comprobaron los ocho listeners durante arranque manual: Node en `127.0.0.1`, Java en `::ffff:127.0.0.1` (IPv4 loopback mapeado), ninguno en interfaces públicas. Tras Ctrl+C todos cerraron. La interrupción manual de la cadena npm devolvió 1; no se presenta como un test con salida 0. La ejecución automática de la suite sí terminó con 0 y apagado limpio.

Callables: `confirmPurchaseExperimental`, `adjustStockExperimental`, `lookupOperationExperimental`. Único UID ficticio autorizado: `demo-owner-05a`, tomado del contexto verificado por el framework, jamás del cuerpo. Reglas solo permiten lecturas propias de productos/operaciones y deniegan **toda escritura cliente**, incluso de ese UID; cualquier ruta no declarada queda cerrada. Las pruebas adversariales usan SDK cliente sin privilegios; bypass de reglas exclusivamente al preparar/limpiar fixtures.

El contrato experimental conserva COP enteros, cantidades ×1.000, redondeo `BigInt`, descuentos individuales, categorías de prueba, hasta 100 líneas, intención ≤256 KiB y operación ≤900.000 bytes estimados. Nuevos productos abren sintéticamente en cero como en 04C; **no es la política definitiva de aperturas**. No se añaden prorrateos ni correcciones 04D. Las líneas/movimientos se guardan dentro de la operación financiera canónica, con productos normalizados independientes.

El servicio valida antes de acceder a datos, congela por copia la intención, recalcula total/hash y usa una transacción: operación primero, D productos después; todas las lecturas antes de escrituras. Mismo ID/hash devuelve resultado confirmado sin nuevos efectos; otro contenido produce conflicto. La planificación no emite logs, red, reloj ni IDs. Un error tardío no aplica cambios parciales. `lookupOperationExperimental` también sanea errores de infraestructura; resultado ausente no prueba que un envío previo activo esté cancelado.

No hay fotos, base64, OCR íntegro ni datos personales en contratos/logs de aplicación. Solo fixtures ficticios. Auth Emulator no demuestra autenticación real; Admin omite reglas; pruebas locales no validan IAM, revocación real, App Check, costos o resistencia a abuso. `enforceAppCheck:false` es local. Su integración posterior requiere proveedor web/dispositivo validado, control por entorno y enforcement además de Auth/UID; nunca enviar tokens de debug a producción. IAM futuro separará cuenta de ejecución mínima y permisos de despliegue, sin claves en React.

## Auditoría de dependencias y exposición

Comandos independientes: `npm audit --json`, `npm audit --omit=dev`, `npm --prefix functions audit --json` y `npm --prefix functions audit --omit=dev`. Un código 1 de audit significa hallazgos, no una ejecución correcta sin riesgos.

| Grafo | Antes | Resultado 05A |
| --- | --- | --- |
| Raíz completa, desarrollo incluido | 26: cinco altos/21 moderados | **21 moderados; cero altos** |
| Frontend raíz, solo dependencias de ejecución | Cero | **Cero**; solo React/router, sin SDK Firebase incorporado |
| Paquete servidor nuevo completo | Primera instalación: 18, cinco altos/13 moderados | **13 moderados; cero altos** |
| Servidor nuevo, solo dependencias de ejecución | Auditoría propia inicial: cero | **Cero** tras la corrección; no se deduce de la auditoría del frontend |

Corrección acotada: override de `@grpc/grpc-js` **1.9.16 → 1.14.7** bajo `@firebase/firestore` en ambos paquetes. El cliente Node tenía un pin `~1.9.0`; se documenta esta excepción explícita al rango del proveedor, sin asumir compatibilidad de cualquier minor. Se comprobaron build, cliente/reglas, RPC reales de emulador y todas las pruebas 04C sin alterar sus expectativas. El lock raíz solo cambia esa resolución, proto-loader asociado y deduplicación; las versiones directas se conservan. Se intentó actualizar `re2`/`gcp-metadata` dentro de sus rangos, sin cambios adicionales disponibles en ese árbol; no se forzó otro major.

Avisos originales: [autenticación de certificados gRPC](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j) y [errores expuestos por handlers gRPC](https://github.com/grpc/grpc-node/security/advisories/GHSA-f596-whhp-79r4). Se eliminan sus entradas de auditoría propagadas a Firebase/reglas; no eran cinco defectos independientes. Las pruebas locales no ensayan mTLS productivo ni certifican todo el SDK con el override. Revisarlo de nuevo cuando el proveedor publique un pin corregido.

Clasificación y límites de exposición:

- **Cliente de pruebas:** gRPC se usa realmente en los tests Node de Firestore. La vulnerabilidad de autenticación afecta configuraciones servidor específicas; no se reproduce en el navegador demo ni se afirma explotación demostrada. Se parchea igualmente. El bundle React no carga Firebase.
- **Ejecutor nuevo:** Admin 14.5.1 resuelve Firestore 9.4.1 y su cadena actualizada, distinta del Admin 13 histórico. Cero hallazgos conocidos en su grafo de ejecución no significa seguridad absoluta ni aprobación de producción.
- **CLI 05A, 13 moderados:** cadenas Pub/Sub/OpenTelemetry Core, google-gax/gaxios/uuid y herramientas de archivos archiver/zip-stream/glob/minimatch/rimraf/exegesis. Son dependencias de desarrollo, no del ejecutor. Los comandos usados no habilitan Pub/Sub ni Hosting ni entradas públicas; no se demostró explotación, pero tampoco se certifica que todo camino interno sea inalcanzable. Ejecutar localmente sin datos reales, en loopback, y seguir parches oficiales.
- **Raíz histórica, 21 moderados:** añade cadenas antiguas de Admin/Firestore/Storage/google-gax y herramientas como re2/gcp-metadata. Admin raíz solo sirve los laboratorios históricos; no es el SDK del futuro ejecutor. El inventario completo se obtiene con audit; los avisos se propagan a paquetes padres y no se suman como defectos independientes. Algunas soluciones sugeridas por npm son downgrades mayores: se rechazaron, sin `audit fix --force` ni overrides masivos de APIs incompatibles.

Actualizar/retirar dependencias antiguas y resolver exposición remanente requiere un cambio acotado con regresión. No publicar herramientas/fixtures como runtime. Ambos lockfiles se versionan; dependencias, cachés, builds, logs y datos emulados permanecen ignorados.

## Procedimiento de verificación y despliegue futuro

Regresión UI: `npm test`, `npm run test:e2e`; esta última incluye compra manual demo sin red externa ni IndexedDB/localStorage, además de accesibilidad/diseño previos. Nuevo servidor: `npm run test:server`, `npm run test:firebase:local`. El [informe 05A](../FASE_05A.md) distingue casos ejecutados de preparación futura y registra fallos corregidos.

Para repetir 04C conservar su Node 20 histórico en una terminal separada y sus comandos originales `npm run test:firebase:trusted:unit` y `npm run test:firebase:trusted`. No convertir ese runtime en recomendación productiva ni modificar el laboratorio para admitir los contratos 04D. 04B queda como evidencia negativa; no es una puerta de aprobación de la nueva suite.

Antes de un **futuro** despliegue: obtener autorización explícita para fase/recursos/presupuesto; aprobar DP y contratos pertinentes; probar nuevos esquemas y recuperación; crear configuración de staging separada e IAM mínimo; actualizar/auditar artefactos; configurar Auth/App Check/índices/reglas y controles económicos aprobados; revisar migración/rollback y demostración. Solo después se preparará un procedimiento concreto revisable para autorización final. El entry actual seguirá siendo local: no se «habilita producción» quitando sus guards. No existe ni se ejecutó un comando de despliegue en 05A.
