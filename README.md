# Mi Casa

Prototipo React de **Fase 03B**, auditado y ajustado en **Fase 03C**, con inventario, compras, gastos y lista temporal conectados a un estado compartido en memoria. Conserva el diseño aprobado de Fase 02.

**Modo demostración:** todos los cambios se pierden al recargar. No hay respaldo en la nube ni fotografías reales. El botón Restablecer datos de ejemplo permite reiniciar la sesión, previa confirmación.

## Ejecutar localmente

Requiere Node.js 20.19+ de la rama 20, 22.12+ de la rama 22, o 24+. Prototipo verificado con Node 20.19.5 y 24.22.3, npm 11.6.4. Para el nuevo ejecutor local se requiere Node 24; Node 20 queda como entorno histórico, no runtime productivo futuro.

```bash
git clone https://github.com/camilo477/webapp-gastos-casa.git mi-casa
cd mi-casa
npm ci
npm run dev
```

En el entorno original ya preparado, el directorio de trabajo es **`/mnt/Datos/mi-casa/versionado`**. Entra allí y ejecuta `npm ci` y `npm run dev`; no necesitas clonar otra vez.

Abrir `http://127.0.0.1:5173` o el puerto que anuncie Vite. Si las dependencias ya están instaladas, basta con `npm run dev`. No requiere cuenta, credenciales ni variables de entorno.

## Qué se puede probar

- Inventario: buscar, filtrar, crear/editar productos, sumar/consumir/establecer cantidades y cambiar estados. Los movimientos se inspeccionan al final de la pantalla.
- Compra manual: establecimiento, fecha y tantos artículos como se necesiten; seleccionar productos existentes o preparar nuevos; cantidades, unidades, precios y descuento individual.
- Recibo simulado: cinco o cincuenta artículos, filtro de pendientes, correcciones, eliminación y adición manual. No se lee ninguna fotografía.
- Confirmación conjunta: una compra válida actualiza existencias y movimientos una sola vez; los gastos se derivan de sus artículos. No se modifica el inventario durante la revisión.
- Gastos: total, historial, detalle y filtros por mes, fechas, categoría y establecimiento.
- Mi lista: crear, añadir, cambiar cantidades, marcar/desmarcar, quitar y finalizar. Marcar no cambia inventario ni dinero.
- Advertencia al abandonar un borrador con cambios, incluido Atrás dentro de la aplicación. No se recuperan borradores después de recargar.

El modo demostración no inicializa Firebase ni requiere cuenta. Desde **05C-1**, solo el inventario del modo emulador usa Firestore local y modificaciones mediante Functions locales. Compras, gastos, lista e Inicio conservan sus ejemplos independientes en memoria. `auth-test` conserva exclusivamente Authentication real autorizado: su inventario sigue siendo demostración. No hay OCR, service worker ni despliegue.

## Probar el acceso local — Fase 05B-1

Requiere Node **24.22.3**, Java≥21 y las dependencias de ambos paquetes. No requiere cuenta Firebase, proyecto real, claves ni login del CLI.

1. Ejecutar `npm run firebase:local:start` y dejarlo activo.
2. En otra terminal, ejecutar `npm run firebase:auth:seed` para preparar las cuentas ficticias.
3. Ejecutar `npm run dev:emulator` y abrir `http://127.0.0.1:5174`.
4. Ingresar con el fixture público `duena@example.test` y contraseña **solo ficticia** `Solo-local-05B1!`. No reutilizarla con ninguna cuenta real.

`npm run dev` sigue abriendo el modo demostración sin cuenta (sin `.env` local que cambie el modo). El acceso local no ofrece registro ni proveedores reales. Solo admite correos de prueba `@example.test` y autoriza el UID fijo del laboratorio. En `/inventario`, el catálogo local comienza vacío: añade productos ficticios y recarga para comprobar los cambios confirmados. Las demás pantallas conservan ejemplos separados.

`npm run test:auth:emulator` inicia emuladores, prepara fixtures, ejecuta Playwright y apaga los servicios automáticamente; usar con los emuladores manuales detenidos. No importar/exportar bases. La [guía](docs/architecture/FIREBASE_IMPLEMENTATION_GUIDE.md) explica configuración, persistencia oficial de sesión y límites; el [informe 05B-1](docs/FASE_05B_1.md) recoge pruebas y decisiones pendientes. Staging y producción permanecen bloqueados.

La **Fase 05B-2** prepara un adaptador Auth para un futuro proyecto real de pruebas, deshabilitado sin configuración y aprobación del propietario. Google y correo/contraseña se eligen explícitamente; producción y datos remotos siguen bloqueados. El asistente no ha creado proyectos/cuentas reales ni activado Firebase real. Consultar la [guía del propietario](docs/architecture/FIREBASE_IMPLEMENTATION_GUIDE.md) antes de usar el nuevo comando `dev:auth-test`; la selección del proveedor y su activación siguen pendientes. Los modos demo y emulador conservan sus comandos anteriores.

En **05B-3** se validó correo/contraseña en el proyecto real autorizado por el propietario; su configuración permanece exclusivamente local e ignorada. **05C-1 no amplía esa autorización a Firestore ni Functions reales.** Para repetir la nueva integración completa, con los emuladores manuales detenidos: `npm run test:inventory:emulator` (Node 24, JDK≥21). Incluye las pruebas del servidor 05A y el recorrido React. [Resultados y límites 05C-1](docs/FASE_05C_1.md).

**05C-2 prepara una futura lectura real, todavía bloqueada:** puerto sin modificaciones, adaptador Firestore Lite y reglas con autorización administrativa por UID, sin incluir identidades reales en archivos públicos. No está conectado a `main.tsx`; ninguna variable `.env` desbloquea esta fase. Demo, emuladores y Auth real conservan su comportamiento. `npm run test:inventory:read` prueba la preparación exclusivamente con Auth/Firestore Emulator; ejecutar separado de las demás suites que usan sus puertos. [Entrega 05C-2](docs/FASE_05C_2.md), [guía manual y región propuesta](docs/architecture/FIRESTORE_READ_PREPARATION.md), [contratos pendientes de aprobación](docs/architecture/INVENTORY_CONTRACT_REVIEW.md). No crear bases ni publicar reglas/ACL sin autorización posterior.

## Contrato candidato de inventario — Fase 05C-3

`npm run dev:emulator` usa ahora **inventory-candidate-v1**, esquema 2: presentación opcional, siete categorías candidatas, exacto/aproximado, cantidades y conversiones explícitas, sugerencias de coincidencia y versión única. Comparte las mismas validaciones con el servidor mediante un paquete interno portable; no añade bibliotecas externas. `dev` sigue siendo demostración y `dev:auth-test` conserva solo Authentication real.

Para verlo con datos ficticios: iniciar `npm run firebase:local:start`, preparar `npm run firebase:auth:seed` y abrir `npm run dev:emulator` en `http://127.0.0.1:5174/inventario`. No usar datos reales. Si ya hay productos experimentales, el candidato avisa y no los convierte. **No borrar ni sobrescribir para ocultar el aviso:** `npm run dev:emulator:legacy` permite consultar/modificar el laboratorio anterior con su formato original; usar el perfil correspondiente al conjunto de datos. No hay selector técnico dentro de la app.

`npm run test:inventory:candidate` inicia emuladores propios, prueba servidor y React y los apaga. `test:inventory:emulator` conserva las regresiones 05C-1 mediante el perfil histórico explícito; `test:inventory:read` incluye lectores históricos y candidato, siempre local. Ejecutar suites de emuladores separadamente porque comparten puertos y sus fixtures se descartan al terminar. Ningún comando migra una base existente o inicia Firebase real.

El paquete `functions/packages/inventory-contract` se instala mediante los dos lockfiles locales. `dev`, pruebas y builds compilan su fuente antes de consumirla; los outputs ignorados solo se actualizan si cambia el contenido, para evitar recargas durante preflights repetidos. Desde un clon nuevo instalar las dependencias raíz y de `functions/` como en la guía. No publicar su `lib/`, datos o capturas.

[Entrega 05C-3](docs/FASE_05C_3.md), [contrato candidato consolidado](docs/architecture/CONSOLIDATED_INVENTORY_CONTRACT.md) y [decisiones pendientes](docs/architecture/OWNER_DECISION_REVIEW.md). La migración disponible es únicamente una **vista previa pura**, con revisión explícita por producto; no aplica cambios. La preparación de Firestore real ahora referencia ese candidato, pero su bloqueo continúa y no se autoriza producción ni una fase posterior.

## Aprobaciones de inventario — Fase 05C-4

El propietario aprobó el 23-11-2026 DP-03/07/08/10 para inventory-candidate-v1/esquema 2 y sus siete categorías. El identificador no cambia. También autorizó crear **manualmente** Firestore Standard/Native, (default), us-east1, en mi-casa-camilo-test, conservando Spark y deny-all. Esto no habilita la lectura real ni implica que Codex haya verificado la base remota.

Sin cambios de aplicación, Authentication o reglas: demo y emuladores continúan funcionando; el adaptador real sigue bloqueado. No publicar reglas/ACL, introducir datos, activar Blaze o desplegar servicios. [Alcances aprobados](docs/architecture/OWNER_DECISION_REVIEW.md), [evidencia y pruebas 05C-4](docs/FASE_05C_4.md). Los textos 05C-3 anteriores describen esa entrega histórica; límites técnicos/económicos y migración conservan sus pendientes.

## Preparación final de lectura — Fase 05C-5

La **Fase 05C-5** registra la confirmación visual del propietario de Firestore Standard/Native, (default), us-east1, vacío, Spark y deny-all, sin verificación administrativa independiente de Codex. Añade pruebas adversariales y un [procedimiento de verificación y futura activación](docs/architecture/FIRESTORE_READ_RELEASE_RUNBOOK.md); no publica reglas/ACL ni conecta React a Firestore real. [Resultados y límites](docs/FASE_05C_5.md). No crear otra base ni repetir los pasos históricos de creación.

## Rutas

| Ruta | Pantalla |
| --- | --- |
| `/` | Inicio con datos de la sesión. |
| `/inventario` | Productos, ajustes y movimientos. |
| `/compras/nueva` | Iniciar compra manual o simulada. |
| `/compras/revisar` | Revisión del borrador activo; sin borrador inicial abre una simulación de 5 artículos. |
| `/compras/revisar?ejemplo=grande` | Inicia la simulación de 50 artículos si no existe otro borrador ni una compra recién confirmada. |
| `/compras/revisar?ejemplo=grande&vista=pendientes` | Los pendientes de esa misma compra. |
| `/lista` | Una lista temporal activa. |
| `/gastos` | Gastos derivados de compras. |
| `/gastos?compra=<id>` | Consulta del detalle dentro de la sesión. |

Los enlaces a ejemplos respetan el borrador activo. Para probar otro escenario, descartarlo o restablecer los datos. Los identificadores de compras nuevas dejan de existir al recargar.

## Ejemplo para comprobar coherencia

1. Restablecer los ejemplos: leche, 3 unidades; gastos del mes, $286.400.
2. Registrar compra manual, indicar establecimiento y continuar.
3. Añadir Leche entera: cantidad 6, precio por unidad 4200. Guardar el artículo y después la compra.
4. Inventario: 9 unidades. Gastos: $311.600 y cinco compras.
5. Consumir 2 unidades desde Inventario: quedan 7; el gasto sigue en $311.600.

El mes inicial de demostración es noviembre de 2026. La simulación pequeña vale $61.100 y tiene un pendiente; la grande vale $435.600 y tiene seis. Al añadir o corregir importes de un recibo simulado, se exige revisar y aceptar la diferencia del total.

## Estructura

```text
src/
  app/              Rutas, estructura, advertencia de salida y pruebas de interfaz.
  components/       Componentes visuales compartidos.
  features/
    home/           Inicio.
    inventory/      Productos, formularios de edición y ajustes.
    purchases/      Registro manual, revisión y confirmación.
    shopping-list/  Lista temporal.
    expenses/       Filtros y detalle de compras.
  domain/           Tipos, validación, compras, inventario y cálculos puros.
  state/            Context, publicación atómica e identidades de operaciones.
  data/             Estado inicial y escenarios ficticios.
  hooks/            Foco, títulos y errores de formularios.
  lib/              Formato visual de importes y fechas.
  styles/           CSS y variables aprobados, con ajustes de interacción.
  types/            Tipos de las muestras de presentación originales.
  test/             Preparación de pruebas DOM.
tests/e2e/          Recorridos, responsive, consola y teclado en Chromium.
docs/FASE_03B.md     Arquitectura, políticas provisionales y validación.
design/preview/     Referencias HTML/CSS aprobadas, intactas.
artifacts/phase-03b/ Capturas de la aplicación renderizada en esta fase.
```

Se reutilizan React, TypeScript, Vite, React Router, Vitest, Testing Library y Playwright; CSS controlado e iconos existentes. Fase 03C añade únicamente `@axe-core/playwright` como dependencia de desarrollo para la auditoría; no forma parte de la aplicación compilada.

## Verificar y compilar

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:a11y
```

El build comprueba tipos y genera `dist/`. Para inspeccionarlo: `npm run preview`; sirve localmente, sin despliegue.

Playwright inicia y detiene un servidor en 4173; no ejecutar otro servidor en ese puerto al mismo tiempo. Reutiliza Chromium de la caché si está disponible. Puede indicarse otro ejecutable instalado mediante `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; el proyecto no descarga un navegador automáticamente.

Las pruebas cubren 320/360/390/430/768/1280 px con raíz tipográfica al 100 % y 200 %, formularios abiertos a 360/390/430/768 px, escritorio a 1440 px y recorridos de negocio. Se comprueban además espaciado personalizado, movimiento reducido y reglas automatizadas de accesibilidad. Esta simulación de texto ampliado no sustituye zoom real ni pruebas nativas de Android/iPhone o lectores de pantalla; el intento de zoom por teclado no surtió efecto en Chromium headless.

## Ejecutor local 05A

Con Node 24.22.3 y JDK≥21, desde la raíz:

```bash
npm --prefix functions ci
npm run typecheck:server
npm run test:server
npm run test:firebase:local
```

`npm run firebase:local:start` inicia Auth, Firestore y Functions en loopback; Ctrl+C los detiene. Solo `demo-mi-casa-05a`, sin credenciales ni recursos reales. La conexión React al inventario requiere `dev:emulator`; `dev` conserva demo. No hay fallback a producción. Los contratos del ejecutor siguen siendo experimentales. [Guía y auditoría](docs/architecture/FIREBASE_IMPLEMENTATION_GUIDE.md).

## Documentación y límites

- [Auditoría, correcciones y limitaciones de Fase 03C](docs/FASE_03C.md).
- [Guía de prueba con la usuaria, todavía sin resultados](docs/PRUEBA_USABILIDAD.md).
- [Entrega, pruebas y decisiones provisionales de Fase 03B](docs/FASE_03B.md).
- [Entrega histórica de Fase 03A](docs/FASE_03A.md).
- [Visión y decisiones pendientes](docs/VISION.md).
- [Requisitos aprobados](docs/REQUISITOS.md).
- [Diseño aprobado](docs/design/DESIGN_SYSTEM.md).
- [Preparación de Git, auditoría y limitaciones de transporte](docs/GIT.md).
- [Fase 04A: propuestas de arquitectura Firebase y condiciones de viabilidad](docs/FASE_04A.md). Documentación para revisión; no implementa persistencia ni aprueba automáticamente decisiones pendientes.
- [Fase 04B: laboratorio Firebase y resultado negativo de viabilidad](docs/FASE_04B.md). Pruebas aisladas, reglas reales y límites medidos; [dictamen y alternativas](docs/architecture/FIREBASE_FEASIBILITY.md). No conecta el prototipo a Firebase.
- [Fase 04C: ejecutor confiable en emuladores](docs/FASE_04C.md). Resultado local positivo con Auth, Functions y Firestore; [modelo, garantías y límites](docs/architecture/TRUSTED_EXECUTOR.md). Sin persistencia productiva ni despliegues.
- [Fase 04D: propuestas de contratos e integración](docs/FASE_04D.md). [Decisiones para revisión del propietario](docs/architecture/OWNER_DECISION_REVIEW.md), rectificaciones y persistencia propuestas; ninguna DP aprobada automáticamente ni integración real iniciada.
- [Fase 05A: infraestructura técnica local](docs/FASE_05A.md). [Guía de instalación y seguridad](docs/architecture/FIREBASE_IMPLEMENTATION_GUIDE.md), [paquete servidor](functions/README.md) con Node 24 y emuladores `demo-mi-casa-05a`. React conserva demostración; sin producción ni decisiones DP aprobadas.

COP enteros; cantidades con hasta tres decimales; conversiones únicamente kg/g y L/ml. El redondeo, las categorías de ejemplo y el estado propuesto al reponer son supuestos documentados del prototipo. No hay descuentos generales/prorrateos, cambios de control o unidad de un producto existente ni correcciones de compras confirmadas.

## Git y contribuciones

Repositorio: [camilo477/webapp-gastos-casa](https://github.com/camilo477/webapp-gastos-casa). Rama principal: `main`.

La copia anterior de `/mnt/Datos/mi-casa` se conserva: su `.git` estaba vacío y montado como solo lectura. Se preparó una raíz Git escribible en `/mnt/Datos/mi-casa/versionado`, sin destruir archivos ni alterar el montaje. Los documentos históricos describen el directorio anterior; para trabajar ahora utiliza la raíz Git de tu clon.

Antes de trabajar:

```bash
git status --short --branch
git branch --show-current
git remote -v
git fetch origin
```

Conserva cambios anteriores, consulta el alcance autorizado y mantén las pruebas. Al finalizar una fase validada, revisa el contenido y los posibles datos sensibles antes del commit:

```bash
npm run typecheck
npm run build
npm test
npm run test:e2e
git diff
git add <archivos-revisados>
git diff --cached --check
git diff --cached
git ls-files
git commit -m "descripcion de la fase validada"
git push origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Comprobar que ambos SHA coinciden y que GitHub muestra los archivos esperados. Si hay cambios remotos, inspeccionarlos e integrarlos sin sobrescribir historia ni utilizar force push. El flujo permanente y la autorización de cierre de fases están en [AGENTS.md](AGENTS.md). GitHub no implica despliegue.

`.gitignore` excluye dependencias, compilaciones, reportes, archivos de trabajo comprimidos, credenciales, datos privados y temporales de Firebase/OCR. Conserva `package-lock.json`, SVG y demás recursos legítimos. `.env.example` solo contiene valores ficticios; la configuración pública del SDK web de Firebase no equivale a una clave administrativa. `.env.auth-test.local` nunca se publica.

Las capturas e informes de `artifacts/` **no se publican**: son resultados regenerables con las pruebas. Por ello, los enlaces de evidencias de las entregas históricas se consultan localmente después de ejecutarlas; no son recursos necesarios para reconstruir la aplicación.

La Fase 03C prepara una prueba guiada en dispositivo real; no equivale a validación con la usuaria ni a conformidad WCAG completa. Las nuevas evidencias están en `artifacts/phase-03c/`. Cualquier fase posterior requiere autorización.
