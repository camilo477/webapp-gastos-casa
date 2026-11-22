# Fase 04A — Arquitectura, datos, seguridad y viabilidad de Firebase

**Entrega documental para revisión, no autorización de implementación.** Fecha: 21-11-2026. Base inspeccionada: `main`, commit `677c7610f82c6458ff282e7297f02180f1a4f0e7`, raíz `/mnt/Datos/mi-casa/versionado`. Se comprobó un árbol inicialmente limpio y remoto de Mi Casa. Las decisiones propuestas continúan pendientes.

## Alcance realizado

Se revisaron AGENTS, visión, requisitos, reglas, casos de uso, diseño, fases anteriores, Git, dominio, Context, semilla y pruebas. El prototipo conserva todas sus pantallas, políticas provisionales y funcionamiento en memoria. No se modifica código, diseño, requisitos aprobados, dependencias ni lockfile.

Se documenta una arquitectura React/Authentication/Firestore/Hosting/PWA con OCR local posterior, orientada a Spark y sin Functions, Storage o backend propio inicialmente. No hay proyecto Firebase creado, SDK instalado, autenticación, reglas desplegadas, persistencia, captura, OCR ni despliegue. Un diagrama o una interfaz TypeScript documental no son funcionalidades ejecutables.

## Documentos y resultados

| Documento | Contenido principal |
| --- | --- |
| [FIREBASE_ARCHITECTURE](architecture/FIREBASE_ARCHITECTURE.md) | Comparación de esquemas, capas/puertos/adaptadores, reutilización de dominio y ciclo de vida privado de fotografías |
| [FIRESTORE_MODEL](architecture/FIRESTORE_MODEL.md) | Rutas, campos/tipos, operaciones, ejemplos ficticios, consultas, índices y comparación de 5/50/100 líneas |
| [SECURITY](architecture/SECURITY.md) | Amenazas, Auth/recuperación/UID permitido, esquema de reglas cerrado y validaciones/pruebas negativas |
| [TRANSACTIONS](architecture/TRANSACTIONS.md) | Protocolo de confirmación, concurrencia, idempotencia, resultado incierto, contraejemplos y matriz V-01 a V-18 |
| [COST_ESTIMATION](architecture/COST_ESTIMATION.md) | Seis escenarios, lecturas de reglas/índices, escrituras, almacenamiento, transferencia, cuotas oficiales y fecha de consulta |
| [DECISIONS](architecture/DECISIONS.md) | Problema, alternativas, recomendación, ventajas, riesgos, efectos de datos/UX y aprobación para cada DP-01 a DP-13 |

README añade únicamente un enlace a esta entrega. Los documentos aprobados originales no se reescriben.

## Conclusión de viabilidad y riesgos

1. El modelo normalizado ingenuo no garantiza una compra de 50 productos distintos si la regla de compra debe comprobar todos sus documentos. Validar solo lo enviado permite omitir stock o movimientos. Se muestra el contraejemplo y el presupuesto de accesos; no se afirma imposibilidad universal de Firestore.
2. Se propone como **candidato a ensayar**, no arquitectura aprobada de producción, un estado actual agregado y diario inmutable. La transacción escribe dos documentos y empareja sus revisiones con pocas dependencias. El total financiero y los precios proceden de la compra canónica, no de otra tabla.
3. El emparejamiento no valida por sí mismo cantidades, sumas, líneas repetidas ni cambios ajenos. Falta demostrar un validador completo para 50/100 artículos dentro de límites de reglas/documentos. Mantener escrituras denegadas hasta lograrlo. Si no es viable, pedir aprobación de otro modelo o ejecutor confiable; no rebajar garantías ni partir la compra.
4. El estado agregado reduce lecturas/escrituras, pero crea contención global y riesgo de tamaño para catálogos grandes. Los costos estimados son bajos para una usuaria; no prueban seguridad ni capacidad para cualquier catálogo de 1.000 productos.
5. Un intento incierto no es recuperable tras cerrar si su ID solo existe en memoria. DP-06 debe aprobar recuperación estructurada mínima o alternativa demostrada antes de guardar compras reales.
6. Auth de una sola usuaria requiere restricción remota al UID. Quitar el botón de registro no impide por sí solo altas Auth por API. Proveedor/recuperación deben validarse con ella.
7. Las fotografías no se envían ni persisten; liberar referencias no garantiza borrado físico de RAM ni elimina fotos originales de la galería. El navegador/SO imponen esos límites.

## Pruebas ejecutadas en esta fase

| Verificación | Resultado observado |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm run build` | Correcto, Vite 8.3.8; 64 módulos transformados |
| `npm test` | **61 pruebas correctas, 5 archivos**, dominio y componentes incluidos |
| `npm run test:e2e` | **143 correctas, 1 omitida**, 144 casos; incluye accesibilidad, contraste, flujos y responsive |
| Zoom real del navegador | Caso omitido por limitación ya documentada de Chromium headless; no se declara probado |
| Responsive/teclado de la suite existente | Ejecutados a 320/360/390/430/768/1280, texto normal/ampliado, formularios y compra grande; caso adicional de escritorio 1440 |
| Verificación documental | Revisión de propuestas, JSON de ejemplo, enlaces locales, DP-01 a DP-13, coherencia aritmética y diff; sin cambiar políticas originales |

Una primera ejecución encadenada no pudo arrancar el webserver de Playwright. La ejecución posterior directa de `npm run test:e2e` completó la suite con el resultado anterior, sin modificar ni desactivar pruebas. Son pruebas del **prototipo existente**, no de Firebase.

No se ha usado lector de pantalla real, dispositivo físico, teclado virtual, proveedor Auth, red Firestore, índices desplegados ni facturación real. Las limitaciones de la auditoría 03C siguen vigentes. No se atribuyen resultados a una prueba con la usuaria que todavía no se ha realizado.

## Intento aislado de emulador — sin resultados de reglas

Herramientas disponibles: Firebase CLI 15.1.0, Java 25.0.5.1. Se descargó **solo en `/tmp`** el emulador Firestore 1.20.2 desde la URL oficial usada por Firebase CLI y se verificó su SHA-256:

```text
4a117fc297b1441eac1b7756e80442e86ef88865b9e3caf6f59eabf83da574f8
```

Comando intentado, sin proyecto real ni credenciales:

```bash
java -jar /tmp/mi-casa-firestore-1.20.2.jar \
  --host 127.0.0.1 --port 8186 \
  --project_id demo-mi-casa-04a \
  --single_project_mode true --single_project_mode_error true
```

El arranque terminó con `java.net.SocketException: Operation not permitted` al crear un socket; después apareció un fallo secundario `NoClassDefFoundError`. No se intentó cambiar permisos/montajes ni evadir restricciones. No llegó a haber servidor, datos, tests de reglas o prueba de concepto ejecutada. El JAR/cache no forma parte del repositorio. La matriz V-01 a V-18 es un plan, no resultados teóricos presentados como mediciones.

## Revisión y publicación

Se conserva el flujo de [GIT](GIT.md): auditar archivos/diff/índice y publicar sobre `main` sin sobrescribir historia, verificando el mismo SHA local/remoto. El transporte Git convencional tiene restricciones conocidas; el conector GitHub autorizado permite publicación con padre explícito y actualización condicional de la referencia. El SHA final se comunica en la entrega para no autorreferenciar el commit dentro de su propio contenido.

Gemini se omitió: CLI disponible, pero sin clave ni archivo de credencial OAuth; consta fallo de autenticación en fase anterior. Se siguió el fallback, sin reintentos para evadir esa condición. La revisión de arquitectura y documentos fue propia, apoyada en código y documentación oficial actual.

## Recomendación antes de autorizar Fase 04B

- Revisar primero DP-06/07 y la obligación de validación completa; aprobar el alcance de la prueba técnica y ejecutarla en un entorno donde el emulador pueda abrir sockets.
- Aprobar contratos de dinero/unidades/descuentos/representación financiera; no adoptar supuestos del prototipo por omisión.
- Elegir acceso/recuperación con la usuaria y cerrar catálogo, fechas, correcciones e historial de precios.
- Medir tamaño/contención para 100/500/1.000 productos y compras de 5/50/100, además de ataques directos del UID autorizado.
- Solo con evidencia positiva decidir esquema/región, adaptadores y futura configuración. Si falla el candidato Spark, revisar explícitamente las restricciones económicas/arquitectónicas antes de seguir.

La Fase 04A queda entregada para evaluación técnica. **No se inicia Fase 04B ni se conectan servicios reales.**
