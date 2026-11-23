# Guía Firebase — Infraestructura local y preparación de Auth de pruebas

## Preparación 05C-2: futura lectura Firestore, sin conexión real

El inventario local 05C-1 sigue funcionando. La nueva preparación añade un puerto **solo lectura**, adaptador Firestore Lite probado con mocks/emuladores y [reglas candidatas](../../security/inventory-read.firestore.rules) basadas en una ACL administrativa privada. El UID real no figura en reglas ni archivos públicos; anónimo, otras identidades, escrituras y rutas no previstas permanecen denegados. Las reglas candidatas no se desplegaron y no sustituyen el artefacto deny-all existente.

`main.tsx`, la autenticación real y su archivo local no se modifican. La factoría futura permanece bloqueada por código antes de obtener servicios SDK, aun con configuración/aprobación completas. No hay un modo nuevo activo ni una variable que permita desbloquear esta fase. No se creó Firestore, activó Blaze o desplegó ningún servicio; no se validaron reglas ni conexión en el proyecto real.

Consultar la [guía del propietario](FIRESTORE_READ_PREPARATION.md) para Standard/Native, recomendación pendiente `us-east1`, cuotas/costos, UID administrativo, índices y condiciones de autorización/activación. La [propuesta de contrato](INVENTORY_CONTRACT_REVIEW.md) mantiene pendientes DP-03/07/08/10 y las demás decisiones no aprobadas; el lector solo acepta el formato experimental 05C-1, no el contrato anidado 04D ni las siete categorías propuestas.

Pruebas locales: `npm run test:inventory:read` (Node 24/JDK≥21). Ejecuta reglas y adaptador real **contra emuladores**, sin conectar el proyecto real. Ejecutar aparte `test:auth:emulator` y `test:inventory:emulator` para conservar sus reglas y regresiones anteriores. [Resultados y limitaciones 05C-2](../FASE_05C_2.md). Las secciones inferiores conservan su contexto histórico; la preparación no autoriza ejecutar los pasos manuales futuros.

## Validación 05B-3: correo y contraseña comprobados en el proyecto autorizado

El propietario proporcionó y aprobó expresamente la configuración de su proyecto de pruebas y su primera cuenta. Los valores permanecen solo en `.env.auth-test.local`, excluido de Git. Se comprobaron realmente login introducido por el propietario, UID/claims de proyecto, recarga, rutas privadas, logout, contraseña incorrecta y recuperación de conexión; la secuencia supervisada no mostró solicitudes financieras remotas. Ver [resultados y límites de 05B-3](../FASE_05B_3.md).

No se habilitaron otros proveedores, cuentas, recursos ni despliegues. Google, una segunda identidad real y dispositivos físicos no se dan por probados. El servidor de datos sigue cerrado y no se inicia 05C. La preparación y las condiciones de configuración siguientes se conservan; una autorización no se extiende automáticamente a otro proyecto, proveedor o cuenta.

## Preparación 05B-2: adaptador preparado, sin activación real

Fecha: 23-11-2026. **El asistente no ha creado proyectos, activado proveedores, registrado cuentas reales ni realizado conexiones Auth reales.** Producción y servicios de datos siguen deshabilitados. Esta sección sustituye el estado actual de la sección histórica 05B-1 inferior únicamente en cuanto a preparación de Auth. DP-01/06/07 y las demás DP siguen pendientes en sus aspectos no aprobados.

### Modos y condiciones de activación

| Modo | Selección | Qué puede inicializar |
| --- | --- | --- |
| Demostración | Predeterminado, `VITE_APP_MODE=demo` | React y ejemplos en RAM; ningún SDK Firebase |
| Emulador | `npm run dev:emulator` | Auth en `127.0.0.1:9299`, proyecto/UID ficticios 05A; sin servicios financieros desde React |
| Prueba Auth real | Futuro `npm run dev:auth-test`, con archivo local completo **y aprobación explícita del propietario** | Solo SDK Auth del proyecto aprobado; ninguna base, Storage, Functions o compra remota |
| Staging/producción | No admitidos | Error antes de inicializar SDK, sin fallback |

El nuevo comando solicita el modo `auth-test`; no aporta aprobación, valores reales ni proveedores predeterminados. Sin archivo/configuración completos muestra un aviso y no inicializa servicios. **No ejecutarlo con cuentas/configuración reales sin autorización específica posterior.** El trabajo de esta fase solo ejecutó mocks, emuladores y una configuración negativa sin aprobación.

La configuración exige ID de proyecto de pruebas terminado en `-test` (10–30 caracteres; no `demo`, `example` ni prefijo `prod`), `authDomain` exactamente `<projectId>.firebaseapp.com`, appId web válido, API key pública, un UID explícito no ficticio y proveedores elegidos. Debe incluir el origen exacto y el texto de aprobación vinculado al mismo proyecto. No se admiten variables de emuladores en ese modo, ni aprobación de proyecto real en emulador. El adaptador vuelve a validar la configuración/origen antes de `initializeApp`.

Los formatos y coincidencias locales no verifican que una API key o appId pertenezcan realmente al proyecto: hay que copiarlos juntos desde la **misma aplicación web de la Console**. El SDK se configura únicamente con esos valores aprobados; al validar una sesión se comprueban además `aud`, `iss` y `sub` del token respecto al proyecto/identidad esperados. Esa comprobación del cliente no sustituye verificar el token y autorizar en un servidor confiable cuando se habilite alguno.

### Guía manual para el propietario, solo tras autorizar el proyecto

No entregar contraseñas, tokens, claves privadas ni archivos administrativos al asistente. Hacer las operaciones siguientes personalmente en Firebase Console con una cuenta administrativa autorizada. Para el acceso de la app, utilizar una cuenta dedicada de pruebas acordada, sin credenciales personales.

1. **Crear un proyecto de pruebas en Spark.** En [Firebase Console](https://console.firebase.google.com/), elegir Añadir/Crear proyecto. Escoger un ID único terminado en `-test` y anotar ese ID, no solo el nombre visible. Mantener **Spark**; no vincular una cuenta Cloud Billing, añadir tarjeta ni aceptar una conversión a Blaze. Google Analytics no es necesario para esta prueba y puede dejarse desactivado. Si el proyecto elegido ya tiene facturación vinculada, no usarlo para este alcance. [Planes y vínculo con Cloud Billing](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).
2. **Registrar una app web.** En la descripción del proyecto o Configuración del proyecto → General → Tus apps, elegir el icono Web (`</>`), asignar un nombre de pruebas y registrar. No marcar configuración de Hosting, crear bases ni desplegar nada. [Registro de app web](https://firebase.google.com/docs/web/setup).
3. **Elegir y habilitar únicamente el proveedor autorizado.** En Authentication → Comenzar/Sign-in method, habilitar **Google** o **Correo/contraseña**, según la decisión expresa del propietario. Para Google, completar el nombre público del proyecto y correo de asistencia solicitados en Console. Para correo/contraseña no habilitar enlace por correo. No habilitar anónimo, teléfono/SMS, otros proveedores ni solicitar permisos Gmail/Drive/Contactos. Esta guía no elige proveedor ni aprueba ambos por defecto. [Google web](https://firebase.google.com/docs/auth/web/google-signin), [correo/contraseña](https://firebase.google.com/docs/auth/web/password-auth).
4. **Consultar la configuración web.** En Configuración del proyecto → General → Tus apps → app web → Configuración del SDK/Config, copiar `projectId`, `apiKey`, `authDomain`, `appId` de esa misma app a un archivo local ignorado, nunca a un commit. La configuración web identifica el proyecto y no es una service account; restringir la API key a los usos/referentes apropiados para Auth siguiendo la Console, sin habilitar APIs adicionales. [API keys Firebase](https://firebase.google.com/docs/projects/api-keys).
5. **Obtener el UID de una cuenta ya creada legítimamente.** En Authentication → Users/Usuarios, abrir la cuenta dedicada autorizada y copiar su **UID completo**, no su correo. Para correo/contraseña, el propietario puede aprovisionar esa cuenta de pruebas manualmente desde Añadir usuario, después de autorizarlo; el asistente no lo hace ni recibe su contraseña. Para Google, la cuenta debe estar ya aprovisionada/vinculada en ese proyecto. Si aún no existe, el primer acceso federado puede crear una cuenta Auth: autorizar y realizar ese aprovisionamiento aislado de forma supervisada usando el [flujo oficial](https://firebase.google.com/docs/auth/web/google-signin), volver a Usuarios y obtener su UID **antes de activar Mi Casa**. No quitar la allowlist, reutilizar el UID demo, habilitar una excepción para el primer login ni deducir un UID por correo. Si falta ese aprovisionamiento o su autorización, mantener la integración deshabilitada. [Gestión de usuarios](https://firebase.google.com/docs/auth/web/manage-users).
6. **Revisar dominios y probar localmente.** En Authentication → Settings/Configuración → Authorized domains/Dominios autorizados, añadir `localhost` expresamente para el ensayo local y conservar el dominio Firebase de la app de pruebas. Añadir solo hostnames necesarios, sin esquema, rutas ni puertos en esa lista. Los proyectos nuevos ya no incluyen `localhost` por defecto; comprobarlo en Console. El origen de la app sí incluye esquema y puerto y debe coincidir con su configuración local. Abrir luego `http://localhost:5175/acceso` con el comando indicado abajo, únicamente tras autorizar el acceso. No se despliega la aplicación completa. [Dominios en proyectos nuevos](https://firebase.google.com/docs/auth/web/email-link-auth), [problemas comunes de Auth](https://firebase.google.com/docs/auth/faq-and-troubleshooting).

### Archivo local y prueba futura

Crear **`.env.auth-test.local`**, que ya está ignorado. No copiar aquí los hosts/UID del emulador. Los siguientes valores son ficticios y deliberadamente no activan el adaptador:

```dotenv
VITE_APP_MODE=auth-test
VITE_FIREBASE_PROJECT_ID=example-auth-test
VITE_FIREBASE_API_KEY=example-public-web-key-not-valid
VITE_FIREBASE_AUTH_DOMAIN=example-auth-test.firebaseapp.com
VITE_FIREBASE_APP_ID=1:1234567890:web:0123456789abcdef
VITE_AUTH_TEST_OWNER_UID=REPLACE_WITH_AUTHORIZED_UID
VITE_AUTH_TEST_PROVIDERS=google
VITE_AUTH_TEST_GOOGLE_FLOW=popup
VITE_AUTH_TEST_ORIGIN=http://localhost:5175
VITE_AUTH_TEST_APPROVAL=
```

Reemplazar los valores por los de la Console solo después de su autorización. Proveedores permitidos: `google`, `password` o `google,password` sin espacios, duplicados ni métodos implícitos. Para activar, el propietario debe registrar expresamente la aprobación y escribir `VITE_AUTH_TEST_APPROVAL=owner-approved-auth-only:<projectId>` con **su mismo ID**. Ese texto es un control contra activación accidental, **no un secreto, firma ni autorización del servidor**. No escribirlo ni completarlo automáticamente en esta fase.

Comprobar que no haya variables de emuladores heredadas en `.env`, `.env.local` o el entorno; un conflicto se rechaza. Con Node compatible seleccionado, después de instalar desde lockfile y una vez autorizada la activación, el propietario podrá ejecutar `npm run dev:auth-test`. El comando lee `.env.auth-test.local` y usa exclusivamente localhost:5175. `npm run dev` continúa en demo y `npm run dev:emulator` sigue usando 5174 y su configuración ficticia. No utilizar builds, hosts o puertos del emulador para validar un proyecto real.

### Google, móvil y sesiones

Se usan `GoogleAuthProvider` y las funciones oficiales del SDK; selección de cuenta explícita y scopes de identidad predeterminados, sin permisos adicionales ni extracción de OAuth access tokens. La UI muestra solo los métodos configurados, mantiene botones grandes y anuncia cancelaciones, popup bloqueado, conflicto de proveedor y red con lenguaje cotidiano. No hay fallback automático entre popup y redirección ni vinculación de cuentas por correo.

**Localhost utiliza `popup`.** Iniciarlo pulsando el botón, permitir la ventana de acceso y usar un navegador normal si un navegador integrado la bloquea. No pedir a la usuaria desactivar protecciones de privacidad. Google recomienda redirección en móvil, pero el SDK necesita un auxiliar compatible con las restricciones de almacenamiento de los navegadores. Por eso `redirect` solo se admite cuando el origen autorizado sea `https://<projectId>.firebaseapp.com`, igual al `authDomain`. Se restaura con `getRedirectResult` antes de abrir rutas; un error limpia la identidad parcial antes de volver a observar sesiones. Preparar esa variante **no despliega Hosting**: servir allí la app requeriría autorización aparte, fuera de esta fase. No se ha probado Google real ni Safari/móviles reales; popup local y redirección preparada requieren validación manual posterior. [Recomendaciones oficiales para redirección y alternativa popup](https://firebase.google.com/docs/auth/web/redirect-best-practices).

El controlador compartido conserva comprobación inicial, revalidación/expiración, logout inmediato, descarte de respuestas obsoletas y reinicio de ejemplos al cambiar identidad. La instancia real de pruebas se nombra por proyecto y se separa de la app del emulador; el SDK guarda sus tokens con persistencia oficial, sin contraseña. La cuenta autenticada sigue viendo **ejemplos ficticios identificados**, no inventario guardado en su cuenta. No se cargan ni migran datos a una base. Cerrar sesión limpia los ejemplos y la sesión activa del SDK; no borra identidades de otros proyectos/orígenes ni revoca todas las sesiones remotas de Google.

### Barreras confiables y condición previa a servicios de datos

`security/auth-test.firestore.rules` es un artefacto **no desplegado**, sin UID real: deniega todas las lecturas y escrituras incluso al propietario. Se verifica en emulador contra anónimo, UID configurado ficticio, UID demo y otro UID. No se crea Firestore para aplicarlo en esta fase. El servidor actual mantiene `requireLocal`: rechaza configuración de cualquier proyecto real antes de inicializar Admin. React no importa Firestore, Functions ni Admin. Así, preparar el acceso UI no habilita servicios financieros ni depende de esconder botones para proteger datos.

Si en otra fase se autorizan servicios, configurar administrativamente el **mismo UID real** en el servidor y las reglas correspondientes, en configuración ignorada/administrada ajena a Vite. El servidor deberá verificar firma, caducidad y proyecto emisor mediante Auth/Admin, después comparar UID con su configuración, antes del repositorio; reglas deberán autorizar por `request.auth.uid` y ruta, nunca por email o UID del cuerpo. No abrir lecturas/escrituras con una aprobación del frontend. Los clientes no pueden escribir finanzas directamente y Admin omite reglas: la autorización del servidor es obligatoria. No se implementan ni despliegan esos servicios aquí.

No hay alta pública UI, pero Firebase Auth permite altas por API y Google puede crear el usuario en su primer acceso. Rechazar su UID en la app no elimina la cuenta Auth ni bloquea esos endpoints. Resolver el significado de registro cerrado, vinculación, recuperación, restricciones de autoservicio y sus costos en DP-01, sin activar Identity Platform/Blaze ahora.

Para regresar a las pruebas sin servicios reales: detener el servidor de pruebas y volver a `npm run dev` o `npm run dev:emulator`; no cambiar de modo en caliente ni reenviar datos. Revisar siempre `git status` antes de publicar: nunca añadir `.env.auth-test.local`, configuración personal, tokens o cuentas al índice.

Los resultados y límites de esta preparación están en [FASE_05B_2](../FASE_05B_2.md). Las secciones siguientes conservan la evidencia histórica.

## Estado histórico: autenticación local 05B-1

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

## Inventario React local — Fase 05C-1

Esta sección actualiza exclusivamente el comportamiento del inventario del modo emulador; las secciones 05A/05B describen sus entregas históricas. No habilita Firestore real, facturación, despliegues, compras remotas ni decisiones DP pendientes.

Con Node 24.22.3 y Java≥21, dependencias raíz y `functions/` instaladas:

1. En una terminal: `npm run firebase:local:start`. Mantener Auth 9299, Firestore 8386 y Functions 5205 activos, solo en loopback.
2. En otra: `npm run firebase:auth:seed`. Crea exclusivamente las cuentas ficticias publicadas en `tests/firebase-auth/fixtures.mjs`.
3. Ejecutar `npm run dev:emulator` y abrir `http://127.0.0.1:5174/inventario`. Ingresar con la cuenta ficticia autorizada. El catálogo inicialmente vacío no se rellena con `src/data/seed.ts`.
4. Añadir un producto ficticio con existencia inicial; comprobar «Producto guardado en el laboratorio local». Buscar/filtrar, editar nombre/categoría y probar Añadir cantidad, Registrar consumo o Establecer cuánto hay. En sencillo elegir el estado observado.
5. Recargar, navegar, cerrar/reabrir pestaña o cerrar sesión y volver a ingresar. Los cambios confirmados siguen disponibles **mientras Firestore Emulator conserve sus datos**. Salir limpia las vistas y estados privados.
6. Para probar concurrencia: abrir el mismo producto en dos pestañas, guardar en una y guardar en la otra. La segunda muestra conflicto. Volver sin cambiar, Actualizar productos, revisar el saldo y abrir un nuevo ajuste. No se sobrescribe silenciosamente una cantidad/version anterior.

Para pruebas automáticas, detener los emuladores manuales y ejecutar `npm run test:inventory:emulator`. Prepara cuentas ficticias antes de las pruebas servidor con custom tokens, para no crear un UID sin el correo esperado por el fixture. Ejecuta el laboratorio 05A ampliado y Playwright; apaga los servicios al finalizar. Las pruebas generan catálogos ficticios de 100/500/1.000 productos mediante Admin solo en el proceso de preparación, nunca en React. No ejecutar simultáneamente suites que compartan puertos. `test:auth:emulator` conserva sus pruebas de autenticación y ahora permite lecturas locales de inventario, manteniendo bloqueados callables financieros y escrituras directas.

### Lecturas, escrituras y aislamiento

`main.tsx` carga el adaptador de inventario **solo** después de validar modo emulador y crear Authentication Emulator. Reutiliza su app con nombre fijo, comprueba proyecto y endpoint Auth y conecta explícitamente Firestore/Functions locales. `auth-test` no importa este adaptador; su archivo privado no se modifica. Demo no inicializa SDK ni hace solicitudes Firebase.

Se usa el SDK oficial **Firestore Lite**, con consultas puntuales al servidor, sin IndexedDB, caché offline, cola de escrituras ni listeners. Se eligió Lite tras comprobar que WebChannel del SDK completo intenta cargar una imagen de diagnóstico externa cuando falla la red; ese intento fue bloqueado por la prueba, y Lite elimina ese transporte. No existe fallback remoto. Referencias oficiales: [Firestore Lite](https://firebase.google.com/docs/firestore/solutions/firestore-lite), [paginación con cursores](https://firebase.google.com/docs/firestore/query-data/query-cursors), [Functions Emulator](https://firebase.google.com/docs/emulator-suite/connect_functions).

Lectura de `users/{uid}/products`, nunca del historial: lotes de hasta 100, cursor por ID y filtro de categoría en servidor. La búsqueda por fragmento, sin distinguir acentos, filtra cada lote de productos. Si quedan páginas, muestra Ver más productos y no anuncia ausencia definitiva. Puede recorrer todo el catálogo para encontrar un nombre: es una limitación explícita local, no un motor de búsqueda productivo. Las páginas no constituyen un snapshot global atómico; cada modificación comprueba la versión del producto. Se refresca al entrar, recuperar foco sin editor abierto, confirmar cambios o pulsar Actualizar productos.

Toda modificación usa `mutateInventoryExperimental`, con `req.auth` verificado, UID local autorizado por servidor y reglas, validación cerrada, transacción y hash SHA-256 de intención. No se acepta UID del cuerpo. La versión empieza en 0 y aumenta con cada edición/ajuste; unidad y control no se modifican. El resultado se anuncia solo tras el acuse confirmado/ya confirmado. El registro de operación no financiera comparte la colección idempotente con el laboratorio histórico, sin total pagado. La interfaz no invoca los callables de compra ni modifica su estado demo con productos locales.

El borrador/referencia del reintento vive únicamente en RAM. Si se pierde la respuesta, se congelan los campos y Reintentar guardado reenvía la misma intención/ID. No se promete cancelar una operación ya enviada. Se advierte al abandonar la ruta o recargar con un guardado pendiente. Cerrar la pestaña o salir de la cuenta puede perder esa referencia: antes de crear otra operación, revisar el inventario confirmado. No se implementa la política durable DP-06 ni borradores financieros persistentes.

Los parámetros locales siguen siendo experimentales: cantidades ×1.000, enteros para unidad, máximo 1.000.000.000 en la representación escalada, bases unidad/kg/L, estados available/low/empty y categorías food/cleaning/service con etiquetas Alimentos/Limpieza/Servicios. El catálogo demo conserva sus categorías anteriores. No se aprueban DP-03/08/10, ubicaciones, fusión por nombre ni cambios de modo/base.

La autorización en React sirve para la experiencia de uso; la frontera de datos sigue siendo servidor + reglas. Las escrituras cliente permanecen denegadas incluso al UID autorizado. Los errores autenticados de permiso/sesión invalidan el acceso local; no se muestran tokens ni errores internos. Producción continúa bloqueada y no se exportan/importan datos de emulador automáticamente.
