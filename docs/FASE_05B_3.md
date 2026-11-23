# Fase 05B-3 — Validación real pendiente de configuración autorizada

Fecha: 23-11-2026, America/Bogota. Base comprobada: `eb2ef76a021574e7de0e120a9133e7234295c1fe`, rama `main`, árbol inicial limpio y remoto coincidente.

**La fase permanece abierta: NO se ha validado Firebase Authentication real.** En la revisión inicial no existe `.env.auth-test.local`. No se conocen ni se inventan proyecto de pruebas, UID, proveedor o aprobación vinculada al proyecto. No se establece ninguna conexión Auth real ni se crea el archivo local con valores ficticios como sustituto de una aprobación.

## Alcance realizado y bloqueo

Se revisaron AGENTS, [05B-2](FASE_05B_2.md), [guía Firebase](architecture/FIREBASE_IMPLEMENTATION_GUIDE.md), parser de configuración, comando de arranque y suites. El mensaje del propietario autoriza exclusivamente el proyecto que haya configurado y aprobado expresamente; no identifica por sí mismo un proyecto o unas cuentas. Falta el archivo local que permite comprobar esa vinculación.

No se inspeccionó una sesión personal del navegador ni se solicitaron contraseñas, tokens o archivos administrativos. No se ejecutó el adaptador con configuración real. Las pruebas locales usan los fixtures previamente existentes y el caso negativo sin aprobación; no sirven para acreditar Google ni correo/contraseña reales.

No cambian SDK, rutas, componentes, diseño, negocio, reglas, dependencias ni configuración de servicios. Este documento registra el avance local y la guía para reanudar; publicarlo no cierra la validación real ni autoriza otra fase.

## Preparar el archivo local, sin compartir secretos

El propietario debe seleccionar su proyecto ya creado y aprobado y comprobar personalmente que sigue en **Spark**, sin cuenta de facturación vinculada. Los pasos detallados de Console están en la [guía](architecture/FIREBASE_IMPLEMENTATION_GUIDE.md#guía-manual-para-el-propietario-solo-tras-autorizar-el-proyecto). No crear proyectos sustitutivos, activar proveedores nuevos ni aprovisionar usuarios adicionales dentro de este ensayo.

En Configuración del proyecto → General → Tus apps → aplicación web → Configuración del SDK, copiar de la **misma app** `projectId`, `apiKey`, `authDomain` y `appId`. En Authentication → Usuarios, obtener el UID de la cuenta existente autorizada. Si no existe esa cuenta, mantener el ensayo pendiente; no autorizar automáticamente al primer usuario ni usar su email como UID.

Crear `/mnt/Datos/mi-casa/versionado/.env.auth-test.local` con este formato, dejando cada valor pendiente vacío hasta disponer del dato verdadero:

```dotenv
VITE_APP_MODE=auth-test
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_APP_ID=
VITE_AUTH_TEST_OWNER_UID=
VITE_AUTH_TEST_PROVIDERS=
VITE_AUTH_TEST_GOOGLE_FLOW=popup
VITE_AUTH_TEST_ORIGIN=http://localhost:5175
VITE_AUTH_TEST_APPROVAL=
```

En proveedores, escribir `google` o `password` según el método ya configurado y expresamente aprobado; usar ambos únicamente si ambos están autorizados. En aprobación, el propietario escribe `owner-approved-auth-only:` seguido exactamente de su `projectId`. No se completa esa aprobación en su nombre.

El parser actual exige ID terminado en `-test`, dominio `<projectId>.firebaseapp.com` y UID distinto del demo. Si el proyecto existente no cumple el formato, informar la incompatibilidad antes de intentar conexiones; no inventar otro ID, intentar renombrarlo ni crear otro proyecto automáticamente. No copiar variables del emulador a este archivo ni mezclar orígenes. Revisar `localhost` en los dominios autorizados de Authentication. No hace falta Hosting, Firestore o Functions para el ensayo local con popup.

No escribir contraseñas, refresh/access tokens, claves privadas ni credenciales administrativas en el archivo, la terminal, capturas o chat. La configuración pública del SDK no es una service account. `.gitignore` ya excluye `.env.auth-test.local`; comprobarlo con `git check-ignore .env.auth-test.local`, nunca con un comando que imprima el contenido. El asistente deberá revisar presencia/coherencia sin imprimir valores sensibles antes de activar el ensayo.

## Guía de validación manual, todavía SIN ejecutar

Requisitos: archivo válido con aprobación vinculada, proveedor confirmado, cuenta existente autorizada y navegador del propietario. Para el caso de rechazo, hace falta además otra cuenta **ya existente en el mismo proyecto y expresamente autorizada para esa prueba**. Con Google, no probar una cuenta ausente del proyecto: el primer acceso podría crearla, operación no autorizada en esta fase.

Con esos requisitos completos y comprobados, iniciar únicamente `npm run dev:auth-test` y abrir `http://localhost:5175/inventario`. El propietario introduce las credenciales solo en la interfaz o ventana oficial del proveedor, sin entregarlas al asistente. No reutilizar perfiles personales, exportar HAR/storageState ni grabar tokens, emails o datos de cuentas en evidencias versionadas.

| Caso real | Procedimiento y resultado esperado | Estado actual |
| --- | --- | --- |
| Rutas privadas sin sesión | Abrir inventario/compras/lista/gastos; mostrar acceso, nunca contenido privado mientras se comprueba identidad | Pendiente |
| Inicio de sesión | Entrar con la cuenta y método aprobados; recuperar la ruta y mostrar el aviso de ejemplos ajenos a la cuenta | Pendiente |
| Recarga/restauración | Recargar y abrir otra pestaña del mismo origen; recuperar solo identidad validada, sin recuperar cambios financieros de ejemplo | Pendiente |
| Logout | Salir, volver con Atrás, recargar y revisar otra pestaña; no reaparece sesión ni estado de ejemplos anterior | Pendiente |
| UID diferente | Usar únicamente la segunda cuenta existente autorizada; acceso denegado y limpieza de identidad local, sin crear ni borrar cuentas Auth | Pendiente; falta también aprobación de segunda cuenta |
| Credenciales incorrectas | Solo con password aprobado, un intento controlado sobre la cuenta permitida; error cotidiano y contraseña retirada del formulario, sin reiterar intentos | Pendiente; depende del proveedor |
| Cancelación Google | Solo con Google aprobado, cerrar la ventana antes de completar el acceso; mensaje comprensible y reintento disponible | Pendiente; depende del proveedor |
| Conexión interrumpida | Interrumpir únicamente el acceso de red del navegador durante login/revalidación; error y recuperación sin fallback a otro proyecto/modo | Pendiente |
| Ejemplos e identidad | Confirmar avisos de que los ejemplos no pertenecen a la cuenta, editar solo un ejemplo y salir; no queda estado de la identidad previa | Pendiente en modo real |
| Red sin finanzas | Inspeccionar solo host/ruta/método/tipo de solicitudes; ninguna llamada a Firestore, Functions, Storage u otros servicios financieros; no copiar headers/cuerpos/tokens | Pendiente en modo real |
| Accesibilidad/móvil | Teclado, foco, mensajes, 360/390/430/768 px y texto 200 %; después dispositivo/navegador real aprobado, incluyendo el popup del proveedor | Pendiente del flujo real |

Registrar únicamente fecha, navegador/dispositivo, método aprobado y resultado de cada caso; sin valores de configuración, identificadores personales, contraseñas ni tokens. Un caso no disponible por falta de cuenta/proveedor/dispositivo queda pendiente o no aplicable con su motivo; no se reemplaza por un mock y se marca correcto.

El entorno del asistente no dispone de credenciales ni de una sesión interactiva del proveedor aprobado. Si no puede completar Google real, el propietario debe ejecutar esos pasos en su navegador e informar resultados; no introducir contraseñas personales en herramientas de automatización. No se promete que la emulación de viewport o el SDK simulado validen Safari/móvil/OAuth reales.

## Seguridad conservada

Modo demostración sin SDK ni cuenta; emuladores con proyecto/UID ficticios independientes; producción y staging rechazados. Ninguna alta de usuario real, proyecto, base, despliegue o cambio de facturación. No se ejecutan operaciones financieras remotas ni se migran ejemplos. La autorización UI por UID no sustituye las futuras reglas y validaciones del servidor: el servidor actual sigue siendo exclusivamente local y el artefacto de reglas de pruebas sigue cerrado y no desplegado.

## Evidencia local de esta revisión

Ejecutadas de nuevo con Node 24.22.3, sin configuración/cuentas reales:

| Comando | Resultado en esta revisión |
| --- | --- |
| `npm run build` (incluye `npm run typecheck`) | Correcto; 83 módulos y mismos hashes de artefactos que la base, sin cambios de código/estilos |
| `npm test` | **135 correctas / diez archivos**, unitarias y componentes |
| `npm run test:e2e` | **144 correctas, una omisión histórica** de zoom real en Chromium headless; las pruebas de accesibilidad, teclado, tamaños y ampliación de texto del prototipo permanecen activas |
| `npm run test:auth:emulator` | **24 Playwright correctas y cuatro casos de reglas cerradas**, salida 0 y apagado de emuladores |
| `npm run typecheck:server` | Correcto |
| `npm run test:server` | **Diez casos correctos**, acreditados individualmente fuera del sandbox |

Los intentos iniciales restringidos no iniciaron los servidores/puertos de navegador y emuladores; el runner del servidor informó solo un archivo. Se repitieron fuera del sandbox con autorización y se contaron los casos reales de las suites. Esos fallos iniciales no se presentaron como verificaciones correctas.

Se inspeccionó la captura local de acceso a 360 px con texto 200 %. La evidencia de geometría/axe se limita a Chromium y a la interfaz del prototipo/emulador; no acredita un dispositivo físico ni la pantalla del proveedor real. Las pruebas Google unitarias siguen usando SDK simulado. No se ejecutó ninguna prueba de autenticación real ni se eligió proveedor para sustituir la decisión pendiente del propietario.

Los logs, builds, capturas, bases y resultados generados quedan ignorados por Git. No se versionan configuraciones, datos personales ni archivos generados. No se copian resultados históricos como si se hubieran ejecutado en esta revisión. La publicación documental es un punto de avance, no el cierre de 05B-3.

Gemini se omite: no hay implementación ni decisiones arquitectónicas nuevas; se revisan documentación y resultados de las suites existentes. Se mantiene revisión propia de alcance, configuración, contenido versionado y límites de evidencia.

La ausencia del archivo y la autorización/configuración específica impide completar el objetivo real de 05B-3. No se declara proveedor real funcionando, login/logout/restauración reales correctos ni ausencia de llamadas financieras en una sesión real no ejecutada. **No se inicia 05C.**
