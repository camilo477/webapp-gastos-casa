# Fase 05A — Infraestructura Firebase local

Fecha: 22-11-2026, America/Bogota. Base comprobada: `7305ce4677384b2ae41cea91f07827387d63b695`, rama `main`, árbol inicial limpio y `origin/main` coincidente. **Preparación técnica local terminada; no integración productiva ni aprobación funcional.** DP-01 a DP-13 conservan su estado pendiente. No se inicia 05B.

## Arquitectura preparada

Se revisaron AGENTS, visión, requisitos/reglas, revisión DP, contratos/persistencia/plan 04D, arquitectura/informe 04C, dominio, estado y laboratorio confiable. Se mantiene la arquitectura normalizada y el ejecutor confiable de 04C; no se retoma 04B.

Nuevo paquete `functions/`, privado, con dependencias/lockfile propios, TypeScript estricto, ESM, build y pruebas independientes. Se separan tipos/validación/planificación experimental, puerto de repositorio, servicio transaccional, acceso Firestore, manejo de errores y entrada callable. El contrato 04C se revisó al traducirlo, conservando sus parámetros y bloqueo local; no se copió su UID/proyecto como configuración real. Los tipos 04D y su comportamiento ampliado siguen sin implementar.

La operación es la compra financiera canónica; líneas/movimientos embebidos, productos/existencias independientes. Se autentica/autoriza antes del repositorio, se valida el cuerpo completo, se recalcula dinero y hash, se leen documentos antes de escribir y se confirma atómicamente. La misma intención/ID no duplica efectos; otro contenido produce conflicto. Los errores de **todos** los callables, incluida consulta, se traducen sin exponer errores de base ni datos de compras.

Se añadieron interfaces de aplicación para sesión, inventario, compras, resultado, historial y pendientes, sin fijar DTO funcionales definitivos. Los adaptadores remotos del frontend quedan deshabilitados; no se implementó almacenamiento durable. El único cambio en el arranque React es un guard de configuración. `DemoContext`, `src/domain/`, componentes, pantallas y estilos permanecen intactos.

## Archivos y configuración

| Ruta | Cambio |
| --- | --- |
| `functions/package.json`, `package-lock.json`, `tsconfig.json`, `.nvmrc`, README | Paquete independiente, runtime y comandos |
| `functions/src/experimental/{types,validation,plan}.ts` | Contrato de ensayo y cálculos puros, sin acceso Firestore |
| `functions/src/application/{repository,executor}.ts` | Puerto transaccional y servicio de aplicación |
| `functions/src/adapters/{firestore,callable-errors}.ts`, `src/config/local.ts`, `src/index.ts` | Adaptadores Admin, errores, guards y tres callables experimentales |
| `functions/firestore.rules`, `firestore.indexes.json` | Lecturas UID ficticio, todas las escrituras cliente cerradas; exclusiones de indexación |
| `functions/scripts/`, `functions/tests/` | Arranque validado, fixtures, pruebas unitarias y de integración |
| `firebase.local.json`, `.env.example` | Solo proyecto/endpoints ficticios; demo sigue predeterminado |
| `src/application/`, `src/adapters/firebase/disabled.ts`, `src/main.tsx` | Interfaces, configuración/negativos y guard de entrada; sin SDK Firebase en React |
| `tests/e2e/demo-isolation.spec.ts` | Compra demo sin solicitudes externas ni almacenamiento durable |
| `package.json`, `package-lock.json`, `.gitignore`, README | Comandos, corrección gRPC, exclusión del build servidor y navegación |
| [FIREBASE_IMPLEMENTATION_GUIDE](architecture/FIREBASE_IMPLEMENTATION_GUIDE.md) | Instalación, capas, seguridad, auditoría, pruebas y preparación futura |

No se alteran los documentos originales de DP, dominio/estado ni archivos históricos 04B/04C. Se mantienen ignorados `.env`, dependencias, builds, datos, cachés y resultados de emuladores/tests. No se añadieron credenciales ni datos reales.

Entornos explícitos: demo activo; configuración emulador solo con los endpoints completos y exactos; frontend emulador todavía rechazado; staging/producción rechazados. Si faltan datos o se solicita otro destino se produce error, sin fallback. El runner servidor fija `demo-mi-casa-05a`, rechaza credenciales/configuración conflictiva y verifica configuración antes de iniciar. Functions exige señal oficial de emulador, proyecto/hosts coincidentes y runtime antes de inicializar Admin. UID de prueba: `demo-owner-05a`, solo desde contexto Auth.

## Runtime y versiones

Se seleccionó y ejecutó **Node 24.22.3** para 05A, instalado temporalmente en `/tmp`; no se sustituyó Node del sistema. Nuevo runtime declarado `nodejs24`; SDK/pruebas más exigentes requieren ≥24.12 dentro de 24. Se verificaron documentación oficial, metadatos npm, soporte del CLI y arranque real del worker. Java disponible: **25.0.5.1**, compatible con la recomendación JDK≥21. El calendario oficial mantiene Node 24 soportado y Node 20 retirado; fuentes y diferencias con ejemplos antiguos de documentación en la guía.

Servidor: Admin **14.5.1**, Functions **7.4.0**. Desarrollo propio: Firebase cliente **13.4.0**, reglas **6.0.0**, CLI **15.37.0**, TypeScript **6.0.3**, tipos Node **24.19.2**. React y versiones directas raíz no se actualizaron. La regresión histórica 04C se ejecutó con Node **20.19.5** y sus SDK originales; ese runtime no es candidato productivo. React pasó tipos/build/tests/Playwright también bajo Node 24.

## Auditoría y vulnerabilidades

| Auditoría ejecutada | Inicial | Final |
| --- | --- | --- |
| Raíz completa | 26: cinco altas y 21 moderadas | **21 moderadas, cero altas** |
| Frontend, `--omit=dev` | Cero | **Cero** |
| Nuevo paquete completo | 18: cinco altas y 13 moderadas | **13 moderadas, cero altas** |
| Nuevo servidor, `--omit=dev` | Cero, auditoría independiente | **Cero** |

Se corrigió gRPC 1.9.16 con un override acotado a 1.14.7 bajo Firestore cliente, en ambos paquetes. Eliminó los avisos originales y sus entradas propagadas. No hubo actualización masiva, downgrade ni `audit fix --force`. El pin del proveedor era `~1.9.0`: se documenta que el override lo excede y que se verificaron los usos del proyecto, no todo el SDK ni mTLS real. Las versiones del lock raíz solo cambian gRPC/proto-loader y deduplicación. Los intentos de actualizar re2/gcp-metadata respetando sus rangos no cambiaron otras versiones.

Admin 14 separa el nuevo runtime del árbol Admin 13 histórico. Sus dependencias de ejecución no presentan avisos conocidos en esta auditoría; esto no deriva del «cero» del frontend ni prueba seguridad absoluta. Persisten avisos moderados en CLI (Pub/Sub/OpenTelemetry, archivos/glob/minimatch y cadenas gaxios/uuid) y en herramientas/SDK históricos raíz. El ejecutor no depende del CLI en producción; React no carga Firebase. No se habilitan Pub/Sub/Hosting ni entradas públicas en estos ensayos. La guía clasifica exposición y limitaciones, sin afirmar inalcanzabilidad universal ni aceptar automáticamente los downgrades sugeridos por npm.

## Pruebas ejecutadas y emuladores

| Comando / verificación | Resultado final observado |
| --- | --- |
| `npm run typecheck` | Correcto, Node 24; también comprobado con el entorno previo |
| `npm run build` | Correcto, Node 24; 65 módulos. CSS conserva `index-YwRL9HMq.css`; JS cambia por el guard, sin cambio visual |
| `npm test` | **65 correctas / seis archivos**: las 61 anteriores y cuatro casos de configuración |
| `npm run test:e2e` | **144 correctas y una omitida previa** / 145. Incluye nueva compra demo aislada; no se eliminan tests |
| `npm run typecheck:server` | Correcto, TypeScript estricto independiente |
| `npm run test:server` | **10 correctas**, casos identificados; repetidas después de instalación limpia |
| `npm --prefix functions ci` | Correcto desde lockfile con Node 24; auditoría completa conserva 13 moderadas |
| `npm run test:firebase:local` | **30 correctas**, cero omitidas/fallidas; Auth/Firestore/Functions, salida 0 y apagado |
| `npm run firebase:local:start` | Arranque manual hasta ready; ocho listeners comprobados en loopback (Java usa IPv4 mapeado). Ctrl+C cerró todos; npm terminó con código 1 por interrupción, no es una suite de negocio |
| `npm run test:firebase:trusted:unit` | **10 correctas**, laboratorio histórico sin cambios |
| `npm run test:firebase:trusted` | **53 correctas de integración y cuatro de navegador**, salida 0, apagado; incluye pérdida real de respuesta exitosa 04C |
| Auditorías independientes | Ejecutadas y clasificadas arriba; audit completo devuelve hallazgos, no aprobación de seguridad |
| Inspección de límites | Dominio/estado/04B/04C sin diff; sin imports Firebase Admin/SDK en fuente/bundle React; `.env.example` ficticio y reglas de escritura cerradas |

Suite nueva: 5/50/100 productos existentes y nuevos, replay de nuevas altas, líneas repetidas, conversiones/fracciones, control sencillo y servicios; total/movimientos/saldos verificados en Firestore. Rechaza identidad ajena/ausente, escritura directa, precio/total/cantidad/descuento inválidos, unidad incompatible, identidad/categoría alteradas, movimientos/campos adicionales, modificación histórica y reutilización de ID. Un fallo en una línea posterior conserva todo el estado previo. La suite exige códigos concretos; 404 no significa rechazo de negocio.

Concurrencia: mismo ID confirma una vez; compras distintas del mismo producto conservan ambas entradas y gastos; productos distintos son independientes; ajuste absoluto obsoleto se rechaza o se aplica antes de la entrada sin perderla. Consulta por ID/hash con cliente nuevo y reintento conservan la operación. Esa última prueba **no simula por sí sola** una respuesta perdida; la simulación HTTP 200 perdida sigue cubierta por las cuatro pruebas de navegador 04C, no por IndexedDB/React nuevo.

Emuladores 05A: Auth 9299, Firestore 8386/websocket 9350, Functions 5205, hub/logging 4406/4506 y auxiliares Eventarc/Tasks 9400/9500. Configurados en `127.0.0.1`, UI desactivada, proyecto demo único. Se comprobó carga de los tres callables bajo Node 24 y apagado de los servicios. No hubo `firebase deploy`, proyectos reales, Blaze, Hosting, Storage, OCR ni cuentas reales.

### Bloqueos iniciales y correcciones

- Ejecución restringida: arranque bloqueado por sockets `EPERM`; algunos reportes Node contaban solo un archivo, sin acreditar los diez casos. No se consideran prueba de negocio correcta. Se usó la ejecución externa ya autorizada y se verificaron los casos individuales; no se tocaron permisos/montajes del sistema.
- Primera ejecución externa: el CLI filtró la variable personalizada `MI_CASA_ENV` durante descubrimiento. El guard abortó, no se cargaron los callables y 14 de 30 pruebas fallaron. Los rechazos por 404 de esa ejecución tampoco se cuentan como validación financiera. Se sustituyó la dependencia exclusiva de esa variable por la señal **oficial** obligatoria `FUNCTIONS_EMULATOR=true`, conservando todos los controles de proyecto/hosts/credenciales y rechazando `MI_CASA_ENV` incompatible cuando está presente. Se añadieron comprobación de disponibilidad y códigos específicos, y se ejecutó completa de nuevo: 30/30.
- El puerto Eventarc predeterminado chocaba con Auth 9299; se fijaron explícitamente Eventarc/Tasks en loopback. No se acepta exposición pública ni selección silenciosa de destinos reales como solución.

Gemini CLI sigue instalado, pero su autenticación no estaba disponible según la comprobación histórica. Se omitió revisión Gemini efectiva, sin reintentar credenciales ni atribuirle revisión. Se realizó revisión propia de dependencias, cambios, errores, fronteras, transacciones y pruebas.

## Limitaciones y preparación posterior

La nueva estructura es mantenible y funciona localmente; **no está habilitada ni certificada para producción**. Faltan decisiones funcionales y ensayos de los contratos ampliados 04D, proveedor/recuperación real, persistencia privada durable, índices/consultas finales, identidad/IAM/App Check reales, cuotas/facturación, controles de abuso y prueba en dispositivo. Los catálogos/latencias productivos y el futuro modelo con heads/rectificaciones no se certifican por estos resultados.

Antes de Auth real: DP-01/06 y autorización concreta de recursos. Antes de compras reales: DP-02/03/04/05/06/07/09/13, con rectificación aprobada y probada; categorías/duplicados/historial y accesibilidad deben cerrar sus DP correspondientes para el alcance. Conservar el demo hasta pasar los criterios del [plan 04D](architecture/INTEGRATION_PLAN.md). La guía describe cómo preparar un futuro despliegue, sin un comando activo ni ejecución de ese alcance.

La fase se versiona/publica después de revisar diff, índice y contenido; el SHA final se comunica fuera de este archivo para evitar autorreferencia. Su publicación no aprueba DP, recursos de pago ni la fase siguiente.
