# Fase 05B-3 — Validación real de Firebase Authentication

Fecha: 23-11-2026, America/Bogota. Base de esta continuación: `4ff74f98cd271aa40d67e27bed14aa9359f55141`, rama `main`, árbol inicial limpio y remoto coincidente. La revisión anterior partió de `eb2ef76a021574e7de0e120a9133e7234295c1fe` y documentó el bloqueo por ausencia de configuración.

**Correo y contraseña validados realmente con la cuenta y el proyecto de pruebas autorizados por el propietario.** No se utilizaron mocks para los resultados reales descritos abajo. Google y una segunda cuenta real no forman parte de este ensayo autorizado. No se inicia 05C.

## Autorización y configuración local

El propietario confirmó la creación del proyecto de pruebas, app web, proveedor de correo/contraseña y primera cuenta, y autorizó expresamente usar ese proyecto. Se creó/completó `.env.auth-test.local` con los valores proporcionados, sin imprimirlos ni copiarlos a código, ejemplos o documentación. Proyecto, API key web, appId, UID y texto de aprobación quedan exclusivamente en ese archivo local ignorado. El plan Spark consta por la confirmación del propietario; no se accedió a Console/Billing ni se verificó administrativamente su facturación.

Se comprobó con el parser existente que la configuración es válida, que aprobación/proyecto coinciden, que origen y dominio son coherentes y que el único método es password. `git check-ignore .env.auth-test.local` confirma su exclusión; `git ls-files` confirma que no está versionado. Una búsqueda por valores reales, sin imprimirlos, confirmó su ausencia en archivos versionados y en el build de demo. No se añadieron contraseñas, tokens, service accounts ni claves administrativas.

El volumen local presenta permisos 0777 y no aplica `chmod 0600`: se intentó restringir el archivo, pero la lectura posterior mostró que no cambió. No se afirma protección por permisos Unix que este volumen no proporciona. La exclusión de Git está verificada; la configuración contiene valores públicos del SDK e identidad autorizada, nunca contraseñas ni tokens. No se modificó ningún montaje o permiso del sistema para eludir esa limitación.

Se ejecutó `npm run dev:auth-test`, con la arquitectura existente, en `http://localhost:5175/acceso`. El intento restringido falló con EPERM al abrir el puerto; se inició fuera del sandbox con autorización. No se cambiaron SDK, rutas, componentes, diseño, reglas, dominio, dependencias ni lógica de sesión.

## Cómo se obtuvo la evidencia real

Se abrió una ventana aislada de Chrome, sin perfil personal ni sesión previa. El propietario escribió correo y contraseña directamente en el formulario. La automatización no escribió ni leyó contraseñas, no inspeccionó perfiles personales y no exportó storageState, HAR, capturas, grabaciones, headers o cuerpos de respuestas de la sesión real.

El primer controlador perdió su canal stdin entre turnos. La ventana y su proceso permanecieron abiertos; se recuperó el control de ese mismo proceso mediante un canal local temporal, sin reiniciar la sesión ni pedir credenciales al asistente. El diagnóstico temporal se cerró al terminar cada intervención. La primera comprobación encontró sesión anónima; el propietario confirmó que había probado también el logout. Después dejó la sesión abierta para poder verificarla directamente. No se presentó ese estado anónimo como prueba de un login fallido.

La instrumentación temporal, fuera del repositorio, leyó el estado del SDK oficial de la propia ventana y devolvió únicamente booleanos de coincidencia y contadores. Se verificaron UID, proyecto (`aud`), emisor (`iss`), sujeto (`sub`), proveedor password y token vigente; ninguno de sus valores se imprimió o versionó. Se observaron ocho renovaciones con HTTP 200 del endpoint real de tokens durante la secuencia, incluidas restauraciones al recargar/navegar y recuperación de red. No se sustituyeron respuestas del proveedor por mocks ni se usó el emulador como servidor de la sesión real.

Se supervisaron solo metadatos de solicitudes de la ventana, sin capturar credenciales o payloads. La ventana de pruebas restringía los destinos a localhost y los servicios Auth configurados; se bloqueaban altas/actualizaciones/borrados de cuentas y destinos ajenos. No se observaron solicitudes financieras remotas durante la secuencia instrumentada. Esa observación no es una auditoría de IAM, reglas productivas, otras ventanas o de toda la infraestructura del proyecto.

## Resultados reales comprobados

| Comprobación | Resultado y evidencia |
| --- | --- |
| Conexión Auth | Correcta: SDK real y renovaciones HTTP 200 contra el servicio real de tokens del proyecto autorizado |
| Inicio de sesión | Correcto: credenciales introducidas por el propietario; después se observó usuario Auth autenticado y pantalla privada accesible |
| UID autorizado | Correcto: identidad obtenida desde Firebase Auth, coincidencia exacta con el UID local aprobado, sujeto del token y proyecto/emisor esperados |
| Restauración al recargar | Correcta: recarga sin introducir contraseña, identidad/claims nuevamente válidos y vista privada recuperada |
| Rutas con sesión | Correctas: inventario, gastos, lista y nueva compra accesibles, con aviso de ejemplos ficticios |
| Rutas sin sesión | Correctas: antes de ingresar, inventario llevó al acceso sin contenido privado; después del logout, gastos volvió al acceso |
| Cierre de sesión | Correcto: botón Cerrar sesión, SDK sin usuario, vistas privadas ocultas; recarga mantiene logout y la ruta privada redirige |
| Credenciales incorrectas | Correcto: el propietario introdujo una contraseña deliberadamente incorrecta para la misma cuenta; se observó un HTTP 400 de Authentication y el mensaje «No pudimos ingresar con esos datos. Revisa el correo y la contraseña.»; SDK anónimo y ninguna vista privada |
| Error de conexión | Correcto: se desconectó solo la red de la ventana durante una revalidación real; apareció el error de conexión y se ocultó contenido privado. Se observaron dos solicitudes fallidas deliberadas, no un fallo espontáneo del servicio |
| Recuperación de red | Correcta: al restaurar red se recuperó la misma identidad autorizada, con token vigente y acceso privado; no hubo fallback a otro modo/proyecto |
| Ejemplos y finanzas | Aviso explícito de que los ejemplos no pertenecen a la cuenta; cero solicitudes financieras remotas observadas durante las comprobaciones. No se guardaron compras ni se migraron datos a una base |
| Interfaz de acceso | Chrome de escritorio a 360/390/430/768 px, texto 100 % y 200 %: sin desbordamiento horizontal, campos y botón visibles. Navegación por teclado correo → contraseña → Ingresar correcta; sin capturas de la sesión real |

Al finalizar estas comprobaciones, la ventana quedó sin sesión, mostrando el error esperado del intento incorrecto. La aplicación local puede seguir sirviéndose en 5175; no se despliega en ningún entorno.

## Límites de la validación real

- No se creó ni utilizó una segunda cuenta real: el rechazo de otro UID real sigue sin ensayar porque únicamente se autorizó la primera cuenta y se prohibieron altas adicionales. El rechazo de UID ajeno permanece cubierto por unitarias y emuladores; no se presenta como ensayo real con otra identidad.
- Google no está habilitado ni autorizado para esta ejecución. No se probó Google real, su cancelación ni redirección. Sus mocks anteriores no se convierten en evidencia real. Cancelación de proveedor no aplica al formulario password.
- No se provocó revocación administrativa, deshabilitación de la cuenta ni expiración real de un refresh token. Se comprobó renovación real y recuperación de red; la expiración inválida/revocación simulada conserva pruebas locales.
- Las anchuras móviles y ampliación de texto corresponden a Chrome de escritorio. No acreditan teléfono físico, Safari, lector de pantalla ni zoom de navegador donde la prueba histórica se omite.
- No hay servidor de datos real habilitado. La allowlist de React no sustituye las futuras reglas y la validación del servidor. No se crearon Firestore, Functions, Hosting, otros proveedores, cuentas adicionales ni recursos de producción; no se activó Blaze ni se operó sobre datos financieros reales.

## Regresiones automatizadas y auditoría

Se ejecutaron las regresiones correspondientes con Node 24.22.3 y los fixtures locales existentes, separadas de la ventana real:

| Verificación | Resultado |
| --- | --- |
| `npm run build` (incluye `npm run typecheck`) | Correcto; 83 módulos y artefactos de demo sin valores de la configuración real |
| `npm test` | 135 correctas / diez archivos, unitarias y componentes |
| `npm run test:e2e` | 144 correctas, una omisión histórica de zoom real en Chromium headless; incluye aislamiento de demo, accesibilidad, teclado y tamaños |
| `npm run test:auth:emulator` | 24 Playwright correctas y cuatro casos de reglas cerradas, salida 0 y apagado de emuladores |
| Servidor, revisión inicial de esta misma 05B-3 | `typecheck:server` correcto y diez pruebas correctas acreditadas individualmente; no cambió código del servidor en esta continuación |

Los primeros intentos restringidos de navegador/emuladores fallaron por sockets y se repitieron fuera del sandbox con autorización. No se eliminaron ni deshabilitaron pruebas. La suite Auth usa un caso negativo de configuración sin aprobación; no utiliza los valores locales como autorización para conectarse al proyecto real. La prueba de demo tampoco inicializa servicios reales. No se vuelve a contar un mock Google como prueba real.

Solo cambian este informe y el estado de la guía Firebase. `.gitignore` ya excluye `.env`, resultados, builds, logs y datos de emuladores. Se audita contenido y valores reales antes de preparar/publicar: ningún UID real, configuración local, token, dato personal o archivo generado debe entrar al commit. No hay cambios de diseño, negocio o SDK ni necesidad de un commit de código.

Gemini se omite: no se modifica implementación ni arquitectura; el trabajo consiste en verificar comportamiento existente y documentar evidencia. Se mantiene revisión propia de límites, configuración, resultados y contenido versionado. Las decisiones funcionales pendientes conservan su estado.

El commit/push documental se verifica contra el SHA remoto y se comunica fuera de este archivo. **No se inicia la Fase 05C.**
