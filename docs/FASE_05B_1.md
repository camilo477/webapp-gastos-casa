# Fase 05B-1 — Firebase Authentication exclusivamente local

Fecha: 23-11-2026, America/Bogota. Base comprobada: `c8a494da315a55a339894124c993f2c97d3d2e52`, rama `main`, árbol inicial limpio y remoto coincidente. **Implementación y validación local completadas.** No hay despliegue, recursos reales ni inicio de 05B-2. DP-01 a DP-13 conservan sus aspectos pendientes.

## Alcance y comportamiento

Se revisaron AGENTS, visión, requisitos, reglas, revisión DP, política de persistencia, plan/guía de integración, informe 05A y arquitectura React/emuladores. Se conserva el diseño marfil/verde, tipografía grande, controles accesibles, dominio y estado en memoria.

El modo demostración sigue siendo el predeterminado y no requiere autenticarse ni inicializa Firebase. La elección explícita `npm run dev:emulator` abre otro servidor, en 5174, con el proyecto y endpoints ficticios de 05A. Ningún fallo cambia de modo o se dirige a Firebase real. Staging/producción, proyectos ajenos, hosts externos y configuración incompleta se rechazan antes de crear servicios.

En modo emulador hay pantalla `/acceso`, login con correo/contraseña ficticios, observación y persistencia oficial de sesión, recuperación después de recargar, logout y errores comprensibles. Solo se admiten correos `@example.test`; ese filtro evita enviar accidentalmente credenciales de cuentas reales, **no autoriza identidades**. La autorización exige el UID `demo-owner-05a` observado desde Firebase Authentication.

Las rutas `/`, `/inventario`, `/compras/nueva`, `/compras/revisar`, `/lista` y `/gastos`, así como el resto del árbol del prototipo, están protegidas únicamente en modo emulador. Sin identidad validada se redirige a `/acceso`; una sesión inicial todavía en comprobación muestra un estado de espera y ninguna pantalla privada. Un acceso correcto recupera la ruta interna solicitada.

La pantalla de bienvenida, los avisos de prueba/ejemplos y el botón Cerrar sesión son las adiciones visuales. Las pantallas del negocio conservan su diseño y operaciones. Se indica explícitamente que los ejemplos no pertenecen a la cuenta y no tienen respaldo remoto. Login no equivale a confirmar una operación financiera.

## Arquitectura y servicios

| Capa / archivos | Responsabilidad |
| --- | --- |
| `src/application/ports.ts` | `SessionPort`, snapshot observable, estados checking/anonymous/authenticated/error, entrada de acceso por método y alcance de sesión |
| `src/application/configuration.ts` | Modos explícitos, proyecto/endpoints exactos, hostname loopback, UID ficticio; sustituye el bloqueo total del frontend 05A por autorización solo de Auth local |
| `src/application/authentication-errors.ts` | Mensajes cotidianos sin detalles del SDK, tokens ni credenciales; mismo mensaje para usuario inexistente y contraseña incorrecta |
| `src/adapters/firebase/authentication.ts` | Inicialización controlada, conexión síncrona al emulador, acceso, cierre, tokens, suscripción, revalidación, protección contra respuestas obsoletas y disposición |
| `src/state/SessionContext.tsx` | Integración React mediante `useSyncExternalStore`, independiente de `DemoContext` |
| `src/features/authentication/SessionPages.tsx` | Bienvenida/formulario, espera, guard y acción de cierre; accesibilidad y limpieza del campo contraseña |
| `src/app/App.tsx`, `AppShell.tsx`, `src/main.tsx` | Composición por modo, import dinámico del adaptador, rutas y aislamiento del estado de ejemplos |
| `src/components/Feedback.tsx`, `src/hooks/useRouteFocus.ts`, `src/styles/app.css` | Avisos que distinguen ejemplos de identidad, título/foco del acceso y estilos acotados a la pantalla nueva |
| `functions/scripts/seed-auth.mjs`, `tests/firebase-auth/fixtures.mjs` | Aprovisionamiento idempotente de dos cuentas ficticias, fuera de React y con guard del servidor |
| `scripts/auth-web.mjs`, `tests/firebase-auth/{run.mjs,playwright.config.ts}` | Arranque explícito y ensayo reproducible con emuladores; se conservan runners y tests históricos |
| `src/adapters/firebase/disabled.ts` | Sigue rechazando servicios de datos; solo se aclara la separación con Auth |

El cliente utiliza **Firebase 12.19.0**, ya fijado en el lockfile raíz; pasa de dependencia de desarrollo a ejecución. No cambian versiones ni se añaden/eliminan paquetes del lockfile. El nuevo servidor sigue con sus SDK independientes de 05A; ningún Admin entra en el frontend. El puerto de sesión permite añadir posteriormente otro método/adaptador autorizado sin reescribir dominio, estado ni pantallas de compras.

## Sesiones, cambio de identidad y persistencia

- `initializeAuth` usa `browserLocalPersistence`; `connectAuthEmulator` se invoca inmediatamente, antes de cualquier operación asíncrona. Configuración pública ficticia, proyecto `demo-mi-casa-05a`, endpoint `127.0.0.1:9299`, app nombrada y sin proveedores reales.
- `onIdTokenChanged` observa la identidad del SDK. Una identidad restaurada exige renovación/validación antes de abrir pantallas. Se programa comprobación al vencer el token y se revalida al recuperar foco, visibilidad o conexión. La expiración no se deja exclusivamente al evento del observador.
- Una revalidación de la misma identidad con token todavía vigente ocurre en segundo plano, conservando formularios abiertos; un token vencido, identidad nueva o sesión inicial permanece oculto hasta validar. Los errores de red cierran el acceso a pantallas y limpian ejemplos, conservando solo la sesión oficial para reintento.
- Un contador de alcance reinicia `DemoProvider` al salir, cambiar de UID o fallar la verificación. La versión de cada comprobación evita que una respuesta tardía de otra identidad reabra pantallas. Logout oculta y limpia antes de esperar al SDK. También se comprueba propagación entre pestañas.
- La contraseña se borra del formulario al enviar; no se añade a React Context, URL, localStorage, sessionStorage, IndexedDB ni logs. El SDK conserva tokens, no la contraseña. Sus metadatos locales de heartbeat pueden aparecer en `firebase-heartbeat-database`; el ensayo inspecciona que no contengan contraseñas ni datos del dominio.
- No se añaden borradores ni operaciones financieras durables. Recargar conserva la identidad válida pero reinicia todos los ejemplos. No se migran ejemplos a una base ni se cargan datos de la cuenta. La política financiera pendiente de DP-06 sigue sin implementar.
- Disponer el servicio libera suscripción, listeners y temporizador; HMR dispone también el router. La renovación válida de un mismo UID no cambia el alcance. No se promete revocación instantánea mientras el navegador está inactivo.

## Seguridad y limitaciones de emuladores

No existe registro UI, reset por correo real, Google Sign-In ni proveedor productivo. Los fixtures son `duena@example.test`/UID permitido y `otra@example.test`/UID rechazado; las contraseñas públicas de prueba se identifican como ficticias en la guía y no deben reutilizarse con cuentas reales. El script de alta valida el proyecto, endpoints, runtime y ausencia de credenciales. Valida también la configuración pública que inyecta `emulators:exec`, sin descartarla silenciosamente.

La allowlist de React protege navegación; la seguridad de datos depende de las reglas y el servidor. Se conservan sin cambios las reglas que deniegan **todas las escrituras cliente**, las lecturas de otros UID y rutas desconocidas, y la autorización del ejecutor anterior al acceso al repositorio. El frontend no importa Firestore/Functions ni llama al ejecutor financiero. Solo se ensayan operaciones ficticias desde los laboratorios previamente autorizados.

**Ocultar el registro no bloquea `accounts:signUp`.** Se comprueba que el emulador acepta una alta directa por API, mientras su UID no puede abrir las pantallas ni leer/escribir datos protegidos (HTTP 403). El emulador acepta identidades/tokens de prueba y requiere confianza en el entorno local; no constituye una barrera contra alguien con control del host y capacidad de simular el UID autorizado. No se declara seguridad productiva por estos ensayos. Elegir restricciones globales de alta y proveedor requiere resolver DP-01 y verificar Identity Platform/costos posteriormente.

Se revisaron diff, archivos del dominio, imports del bundle, versiones del lockfile y exclusiones. Sin cambios de dominio, `DemoContext`, código/reglas del servidor, configuración de despliegue ni laboratorios históricos. `.gitignore` ya excluye `.env`, claves, dependencias, builds, logs, capturas/resultados y bases/exportaciones. No fue necesario ampliar sus patrones. La búsqueda de formatos de claves/tokens privados no encontró coincidencias en el alcance; solo se publican fixtures explícitamente ficticios.

## Verificación ejecutada

Runtime actual: Node **24.22.3** instalado temporalmente para los ensayos, sin sustituir Node del sistema; laboratorio histórico de contratos con Node **20.19.5**. Compilación del frontend: 81 módulos, chunk Auth separado y cargado solo al elegir emulador. No hay imports Admin/Firestore/Functions en `src`.

| Comando / comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto; también incluido en el build final |
| `npm run build` | Correcto |
| `npm test` | **86 correctas / ocho archivos**: 65 anteriores y 21 nuevas de adaptador/componentes |
| `npm run test:e2e` | **144 correctas, una omitida previa** / 145; no se eliminan ni deshabilitan pruebas anteriores |
| `npm run test:auth:emulator` | **23 correctas**, cero omitidas/fallidas; arranque/fixtures, navegador y apagado con salida 0 |
| `npm run typecheck:server` | Correcto |
| `npm run test:server` | **10 casos correctos**, verificados individualmente fuera del sandbox |
| `FUNCTIONS_DISCOVERY_TIMEOUT=60 npm run test:firebase:local` | **30 correctas**, cero fallidas/omitidas; Auth/Firestore/Functions, tres callables cargados, salida 0 y apagado |
| `npm run test:firebase:trusted:unit` | **10 casos correctos** de contratos históricos |
| `npm run test:firebase:trusted` | Integración adicional 04C **no ejecutable**: 9199 ocupado por un emulador del proyecto ajeno `demo-gastos-compartidos`; no se detuvo ni se cambió su configuración |
| `npm audit --json` | 21 moderadas, cero altas/críticas, árbol completo; avisos de herramientas/servidor históricos conservados |
| `npm audit --omit=dev --json` | **Cero avisos** en dependencias de ejecución raíz, incluyendo ahora Firebase cliente |
| Auditoría de contenido | Diff sin errores, versiones de paquetes intactas, sin secretos encontrados ni artefactos generados en el alcance versionado |

Los 23 recorridos Auth incluyen todas las rutas, acceso correcto/incorrecto, usuario inexistente, logout, persistencia/recarga, dos pestañas, UID rechazado, identidad reemplazada, estado inicial retrasado sin pantalla privada, conexión realmente abortada, error de renovación y reintento, token de renovación vencido simulado, alta directa y reglas, independencia de demo y formulario conservado en revalidación. Red del navegador limitada por la suite a loopback, con fallo inmediato si intenta servicios financieros o destinos externos.

Se comprueban 360, 390, 430 y 768 px, texto al 200 %, teclado, etiquetas, foco, axe sin violaciones detectadas y ausencia de desbordamiento horizontal. Capturas generadas e inspeccionadas, ignoradas por Git. Ampliar texto con CSS no acredita zoom de navegador real; la omisión histórica de Chromium headless se conserva. Faltan dispositivo/usuaria, Safari y tecnologías de asistencia reales.

### Problemas encontrados y tratamiento

1. El sandbox rechazó sockets con EPERM y algunas ejecuciones Node reportaron solo un archivo. Se repitieron los comandos autorizados fuera del sandbox y se acreditaron los casos individuales; esos primeros intentos no se contaron como éxitos.
2. `emulators:exec` incorpora `FIREBASE_CONFIG`. El seed inicial lo rechazaba antes de probar la UI. Se valida con el guard del servidor y se mantuvo el rechazo de credenciales/configuración real. La suite completa pasó después.
3. El SDK crea heartbeat en IndexedDB, además de guardar tokens en localStorage. Se inspecciona explícitamente el almacenamiento oficial y se comprueba que no haya contraseñas ni datos financieros; no se confunde esto con persistencia de compras.
4. La inicialización de Functions excedió diez segundos en el primer laboratorio completo; los 30 casos fallaron por indisponibilidad/404 y **no** se contaron como rechazos válidos. Se confirmó el timeout de descubrimiento del CLI y se repitió con `FUNCTIONS_DISCOVERY_TIMEOUT=60`, sin modificar código ni pruebas: 30/30 correctas.
5. El puerto histórico 9199 pertenece a otro proyecto en ejecución. Se preservó ese trabajo y se documenta la limitación de la regresión adicional 04C. No afecta los emuladores 05A/05B-1, que completaron sus suites en puertos propios.

## Revisión y decisiones pendientes

Gemini CLI se ejecutó en modo de revisión de solo lectura, pero terminó sin revisión por falta de autenticación (`GEMINI_API_KEY`). **Gemini fue omitido como revisor efectivo.** No se intentó conseguir credenciales ni se le atribuyen hallazgos. Se hizo revisión propia de guards, fronteras SDK/dominio, carreras de sesión/logout, almacenamiento, red, rutas y pruebas; se corrigió que una comprobación en segundo plano pudiera desmontar un formulario de la misma identidad.

Continúan pendientes proveedor/recuperación y política de altas DP-01, privacidad/dispositivo/persistencia DP-06, recursos/costos/entornos DP-07 y las restantes decisiones funcionales DP-02 a DP-13 en su alcance no aprobado. Esta prueba de password no elige proveedor productivo. No se habilitan escrituras financieras remotas, OCR, rectificaciones, proyectos reales, Blaze ni despliegue. No se inicia 05B-2.

La [guía de implementación](architecture/FIREBASE_IMPLEMENTATION_GUIDE.md) y README contienen los comandos manuales, fixtures ficticios y preparación para proveedores posteriores sin activarlos. El commit/push se realiza tras revisar el índice y se verifica contra GitHub; el SHA final se comunica fuera de este documento para evitar autorreferencia.
