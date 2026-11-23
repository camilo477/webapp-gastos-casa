# Fase 05B-2 — Preparación segura de Firebase Authentication real

Fecha: 23-11-2026, America/Bogota. Base: `c3e005e30c41ce0ec395d4d95518167fc4355b2e`, rama `main`, árbol inicial limpio, remoto coincidente. **Preparación implementada; ninguna autenticación real activada o probada.** No se crean proyectos, proveedores, cuentas reales, bases, Functions, facturación ni despliegues. No se inicia otra fase.

## Alcance implementado

Se revisaron AGENTS, 05B-1, revisión de decisiones, persistencia, guía Firebase, puertos/configuración, adaptador, contexto y rutas. Se mantienen diseño, estilos, dominio, `DemoContext` y servicios locales. DP-01 a DP-13 conservan sus aspectos pendientes; esta fase no selecciona proveedor productivo ni aprueba privacidad/persistencia financiera.

Hay cuatro condiciones separadas: demo sin SDK ni cuenta; emulador con proyecto/UID/endpoints ficticios; `auth-test` preparado pero deshabilitado sin autorización/configuración; staging/producción rechazados. El modo no cambia por errores de red, detección de móvil ni falta de configuración. No se migra ningún ejemplo a una base.

`dev:auth-test` solicita expresamente el modo y puerto localhost:5175, lee `.env.auth-test.local`, pero **no aporta aprobación ni valores de conexión**. Se probó únicamente su rechazo de configuración ficticia sin autorización: ningún adaptador Firebase se importa ni se realizan solicitudes externas. El propietario deberá autorizar cualquier ejecución posterior con valores reales.

## Configuración y activación futura

El parser exige conjuntamente proyecto de pruebas terminado en `-test`, API key web, dominio Firebase coincidente, appId web, UID explícito, origen exacto, proveedores explícitos y flujo Google definido. Rechaza proyectos `demo`/`example`/`prod`, placeholders de UID, el UID ficticio de 05A, dominios/orígenes cruzados, métodos desconocidos/repetidos y variables de emuladores mezcladas. El adaptador valida otra vez antes de inicializar.

La aprobación debe ser exactamente `owner-approved-auth-only:<projectId>` para el mismo proyecto; permanece vacía en `.env.example`. Es una confirmación de configuración para evitar conexiones accidentales, **no una credencial ni una autorización confiable del servidor**. Los valores reales futuros permanecerán en archivos locales ignorados. El ID de proyecto por sí solo no demuestra que el proyecto sea Spark o esté vacío: el propietario debe comprobarlo en Console. Tampoco se verifica offline la pertenencia real de API key/appId; copiar todos los valores de la misma app web es obligatorio.

No se han introducido claves privadas, service accounts, OAuth secrets, tokens ni valores de un proyecto real. La configuración pública del SDK puede formar parte de un futuro frontend autorizado, pero no concede derechos sobre datos. No se inicializa Admin en React.

## Arquitectura

| Archivo/capa | Responsabilidad |
| --- | --- |
| `src/application/configuration.ts` | Unión explícita de modos y validación restrictiva de aprobación/proyecto/origen/UID/proveedores |
| `src/application/ports.ts` | Entrada de acceso discriminada Google/password y opciones de sesión para la UI |
| `src/application/session-controller.ts` | Ciclo de sesión compartido extraído del adaptador 05B-1; sin imports Firebase; observador, verificación, temporizador, alcance de datos y disposición |
| `src/adapters/firebase/authentication.ts` | Adaptador exclusivamente emulador, UID y correos ficticios conservados; delega el ciclo de sesión |
| `src/adapters/firebase/auth-test.ts` | Adaptador preparado exclusivamente para proyecto de pruebas aprobado; SDK Auth oficial, UID configurable y comprobación de claims de proyecto/identidad |
| `src/main.tsx`, `src/app/App.tsx` | Validación previa a import dinámico, composición por modo y las mismas rutas privadas protegidas |
| `src/features/authentication/SessionPages.tsx` | Métodos visibles solo según configuración, botón Google con componentes aprobados, mensajes de cancelación/error y aviso de ejemplos ajenos a la cuenta |
| `src/application/authentication-errors.ts` | Errores cotidianos, sin volcar objetos/token/credenciales del proveedor |
| `scripts/auth-web.mjs`, `package.json`, `.env.example` | Comandos separados y ejemplo ficticio inactivo, sin nuevas dependencias |
| `security/auth-test.firestore.rules` | Artefacto no desplegado: todas las lecturas/escrituras cerradas incluso para el propietario |
| `src/application/auth-test-configuration.test.ts`, `src/adapters/firebase/auth-test.test.ts`, `src/test/auth-test-fixture.ts` | Configuración y SDK simulado, sin proyecto existente ni conexiones reales |
| `src/features/authentication/SessionPages.test.tsx`, `tests/firebase-auth/` | Interacción de métodos, regresión local y rechazo del comando real sin aprobación |
| `functions/tests/auth-boundary.test.mjs` | Prueba de las reglas cerradas exclusivamente en Firestore Emulator |

`SessionContext` no necesita cambios: recibe el mismo puerto y solo expone estado/UID; nunca tokens ni contraseñas. No cambian `src/domain`, `DemoContext`, estilos, código del servidor, reglas 05A, configuración de emuladores, versiones de paquetes ni lockfiles. El CSS compilado conserva el hash visual de 05B-1.

## Proveedores, sesiones y experiencia

Google y correo/contraseña son capacidades preparadas; los proveedores reales siguen sin elegir ni activar. La selección `google`, `password` o `google,password` es explícita; no se habilita un método por existir un botón. La app no ofrece registro público ni llama a APIs de creación/vinculación de usuarios desde React.

Google utiliza `GoogleAuthProvider`, selección explícita de cuenta y funciones oficiales `signInWithPopup`, `signInWithRedirect`, `getRedirectResult`. No añade scopes de Gmail, Drive o contactos, ni extrae OAuth access tokens de resultados/errores. Se traducen cancelación, popup bloqueado, entorno no compatible, conflicto con otro proveedor, dominio/proveedor no habilitado y red. Un fallo permite reintento y no cambia automáticamente de flujo o proveedor.

En localhost se permite popup iniciado por la usuaria. La redirección se prepara únicamente para `https://<projectId>.firebaseapp.com` como origen autorizado y `authDomain` iguales: evita ofrecer un flujo que dependa de almacenamiento entre sitios bloqueado por móviles/navegadores modernos. No se configura proxy, Hosting ni despliegue para hacerlo funcionar ahora. Antes de servir allí la app se necesita autorización aparte. La cancelación o error al recuperar redirección limpia primero cualquier identidad parcial; si falla la limpieza, las pantallas siguen bloqueadas y se permite reintentar. Mientras se procesa el resultado, no se muestra una pantalla privada.

Se conserva persistencia oficial, comprobación inicial y restauración tras recarga, validación/renovación de token, logout inmediato, limpieza por alcance y rechazo de resultados tardíos de identidades anteriores. En el adaptador preparado se comprueban además `aud`, `iss` y `sub`; un token de otro proyecto o sujeto se rechaza. Esa comprobación del cliente complementa el SDK, no verifica firmas para un servidor. Las instancias de Auth y sus claves de almacenamiento separan emulador y cada proyecto de pruebas. No se copian tokens entre instancias.

Los estados de ejemplos siguen en RAM. Login no confirma operaciones financieras ni carga inventario personal. La UI indica que los ejemplos no pertenecen a la cuenta y que salir descarta sus cambios. No se rediseñan pantallas; Google usa el botón aprobado, texto legible, foco de errores y controles accesibles. Una renovación de la misma identidad vigente conserva formularios abiertos.

## Seguridad fuera del frontend

No existe servidor de datos real habilitado en esta fase. `requireLocal` del servidor existente sigue rechazando proyectos/configuración reales antes de Admin. React no importa Firestore, Functions o Admin ni realiza operaciones financieras remotas. El artefacto de reglas de pruebas deniega todos los accesos; su comprobación local acredita el rechazo de anónimo, UID configurado ficticio, UID demo y UID ajeno, independientemente de los botones o del estado de React. **No se ha desplegado ese archivo ni creado una base real.**

Para habilitar servicios en otra fase, configurar administrativamente el UID real permitido tanto en el servidor como en sus reglas; no importarlo desde Vite ni aceptar un UID del cuerpo/correo. Verificar token, firma/proyecto/caducidad e identidad antes del repositorio; Admin omite reglas y requiere su propia autorización. No conceder escrituras financieras directas. Esta configuración y sus pruebas son condiciones previas, no servicios productivos implementados aquí.

Ocultar registro no bloquea altas por API. Un primer acceso Google puede crear una cuenta Auth antes de que la aplicación rechace su UID; no se han realizado esos accesos reales en esta fase. No se borra automáticamente una cuenta rechazada ni se vinculan cuentas por email. La allowlist no sustituye decidir bloqueo global de altas, aprovisionamiento, recuperación y vinculación en DP-01.

## Verificación

Ejecutado con Node 24.22.3 temporal y emuladores locales; ninguna cuenta real ni configuración real. La prueba Google usa **SDK simulado**, no Google real. El ensayo de reglas también es local.

| Verificación ejecutada | Resultado |
| --- | --- |
| `npm run typecheck`, también durante build | Correcto |
| `npm run build` | Correcto, 83 módulos, carga dinámica de SDK según modo |
| `npm test` | **135 correctas / diez archivos**; 86 anteriores conservadas y 49 nuevas |
| `npm run test:e2e` | **144 correctas y una omisión histórica** de zoom real en Chromium headless, sin eliminar/deshabilitar pruebas |
| `npm run test:auth:emulator` | **24 Playwright correctas + cuatro casos de reglas cerradas**, salida 0 y apagado |
| `npm run typecheck:server` | Correcto |
| `npm run test:server` | **10 casos correctos**, acreditados individualmente fuera del sandbox |
| `FUNCTIONS_DISCOVERY_TIMEOUT=60 npm run test:firebase:local` | **30 correctas**, tres callables locales cargados, salida 0 y apagado |
| `npm audit --omit=dev --json` | Cero avisos en dependencias de ejecución raíz; no se añaden dependencias ni cambian versiones |

Pruebas nuevas: parámetros ausentes, aprobación incorrecta/cruzada, proyecto/dominio/origen/UID inválidos, mezcla de modos, proveedor no aprobado, Google cancelado/bloqueado, red y conflicto de cuenta, logout y restauración, identidad ajena, token de otro proyecto/sujeto, espera por redirección, limpieza fallida y recuperación, disposición con respuesta pendiente, UI Google/password sin doble envío y rechazo del comando futuro sin importar SDK. Las suites anteriores conservan rutas privadas, cambios de identidad entre pestañas, demo sin solicitudes externas, persistencia/recarga, expiración, formulario abierto y tamaños/accesibilidad.

Las ejecuciones iniciales restringidas fallaron por sockets EPERM; la auditoría npm falló por DNS y el runner Node de servidor informó solo un archivo. Se repitieron fuera del sandbox con autorización; los primeros intentos no se contaron como validación de negocio. No se cambiaron puertos ajenos, montajes, pruebas anteriores ni reglas del laboratorio para conseguir resultados.

## Revisión y límites

Gemini CLI se intentó en modo de solo lectura para revisar el plan; el proveedor respondió 503 repetidamente y el proceso terminó por timeout. **Gemini fue omitido como revisor efectivo**, sin atribuirle hallazgos ni repetir la invocación. Se realizó revisión propia de modos, sesión/redirección, concurrencia, claims, SDK, rutas, reglas, tests y contenido preparado.

**No está probado Google Sign-In real**, popup/redirección real, Console, cuotas, restricciones de API keys, dominios o navegadores móviles/Safari reales. El texto al 200 %, teclado y geometría del prototipo sí mantienen sus pruebas locales; no acreditan un flujo OAuth real ni zoom de navegador donde la prueba histórica se omite. Las comprobaciones locales no prueban facturación ni seguridad productiva. Permanecen los riesgos históricos de herramientas ya documentados; la auditoría de ejecución no equivale a auditoría completa de desarrollo.

## Pasos pendientes del propietario

La [guía Firebase](architecture/FIREBASE_IMPLEMENTATION_GUIDE.md) detalla seis pasos: crear personalmente un proyecto Spark sin Billing, registrar app web sin Hosting, autorizar/elegir proveedor, copiar configuración pública de la misma app, obtener UID de una cuenta legítimamente aprovisionada y configurar dominios para el ensayo local. No crear Firestore ni desplegar Functions. El primer aprovisionamiento Google, si falta, requiere autorización específica y un flujo controlado externo; Mi Casa no tiene una excepción que autorice al primer login.

Después debe registrar expresamente la aprobación vinculada al proyecto, completar `.env.auth-test.local` y autorizar el ensayo real, con una cuenta dedicada de pruebas. Hasta entonces el adaptador queda inactivo. DP-01 (proveedor, altas, recuperación/vinculación), DP-06 (dispositivo/privacidad) y DP-07 (recursos/entornos) conservan sus decisiones pendientes. No se avanza a otra fase.

Se audita el diff/índice y se publica solo código, fixtures ficticios y documentación. `.gitignore` ya excluye los archivos locales, builds, bases, logs y resultados; no necesitó cambios. El SHA final y su comprobación remota se comunican fuera de este archivo.
