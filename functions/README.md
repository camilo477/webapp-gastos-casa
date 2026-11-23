# Ejecutor local experimental 05A

Paquete TypeScript independiente, **solo** `demo-mi-casa-05a`. Desde 05C-1 conecta exclusivamente el inventario React en modo emulador; no está preparado para despliegue. DP-01 a DP-13 siguen pendientes en sus aspectos no aprobados; las reglas financieras conservan los parámetros de ensayo 04C, no implementan las propuestas 04D.

Node **24.22.3** (`.nvmrc`), JDK≥21. Desde la raíz, con ese Node seleccionado:

```bash
npm --prefix functions ci
npm run typecheck:server
npm run test:server
npm run test:firebase:local
```

`npm run firebase:local:start` inicia Auth/Firestore/Functions en loopback; Ctrl+C los apaga. El runner rechaza proyectos/endpoints/credenciales incompatibles. Sin sockets en el entorno restringido, ejecutar en terminal normal Ubuntu; no alterar restricciones del sistema.

`src/experimental` contiene tipos/validación/planificación sin Firestore; `src/application` la orquestación y puerto transaccional; `src/adapters` acceso Admin y errores callable; `src/config` guards. Pruebas, CLI y SDK cliente solo son dependencias de desarrollo. `lib/`, logs, datos y dependencias no se versionan.

Las auditorías son independientes: `npm --prefix functions audit` y `npm --prefix functions audit --omit=dev`. Hay hallazgos moderados pendientes en herramientas; cero en el grafo de ejecución no implica aprobación productiva.

[Guía de configuración, seguridad y riesgos](../docs/architecture/FIREBASE_IMPLEMENTATION_GUIDE.md). [Resultados ejecutados](../docs/FASE_05A.md).

05C-1 añade `mutateInventoryExperimental`: crear con apertura no financiera, editar nombre/categoría y ajustar existencias/estado. El esquema cerrado prohíbe UID, cambios de unidad/control y campos financieros. Transacción de operación + producto; hash de intención, versiones estrictas, sin incremento repetido por reintentos. Reutiliza repositorio, autorización y reglas 05A sin abrir escrituras cliente. `npm run test:inventory:emulator` desde la raíz ejecuta servidor y navegador; [contrato y límites](../docs/FASE_05C_1.md).
