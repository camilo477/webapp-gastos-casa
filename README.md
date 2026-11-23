# Mi Casa

Prototipo React de **Fase 03B**, auditado y ajustado en **Fase 03C**, con inventario, compras, gastos y lista temporal conectados a un estado compartido en memoria. Conserva el diseño aprobado de Fase 02.

**Modo demostración:** todos los cambios se pierden al recargar. No hay respaldo en la nube ni fotografías reales. El botón Restablecer datos de ejemplo permite reiniciar la sesión, previa confirmación.

## Ejecutar localmente

Requiere Node.js 20.19+ de la rama 20, 22.12+ de la rama 22, o 24+. Verificado con Node 20.19.5 y npm 11.6.4.

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

No hay Firebase, autenticación, OCR, servicios externos, persistencia, service worker ni despliegue. Las operaciones son locales y sincrónicas; su comportamiento no demuestra transacciones ni sincronización remotas.

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

`.gitignore` excluye dependencias, compilaciones, reportes, archivos de trabajo comprimidos, credenciales, datos privados y temporales de Firebase/OCR. Conserva `package-lock.json`, SVG y demás recursos legítimos. Un futuro `.env.example` solo puede contener nombres y valores ficticios; la configuración pública del SDK web de Firebase no equivale a una clave administrativa, pero Firebase sigue sin implementar.

Las capturas e informes de `artifacts/` **no se publican**: son resultados regenerables con las pruebas. Por ello, los enlaces de evidencias de las entregas históricas se consultan localmente después de ejecutarlas; no son recursos necesarios para reconstruir la aplicación.

La Fase 03C prepara una prueba guiada en dispositivo real; no equivale a validación con la usuaria ni a conformidad WCAG completa. Las nuevas evidencias están en `artifacts/phase-03c/`. Cualquier fase posterior requiere autorización.
