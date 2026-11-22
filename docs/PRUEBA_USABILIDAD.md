# Mi Casa — Guía para la prueba con la usuaria

**Estado: preparada; prueba todavía no realizada.** Los espacios de resultados están vacíos deliberadamente. Las cifras indicadas son resultados esperados de escenarios ficticios, no observaciones de una persona.

## Preparación

Probar en el celular que utilizará habitualmente, con su navegador, orientación y tamaño de texto preferidos. Preguntar si la letra resulta cómoda y permitir que ajuste el dispositivo. No asumir su experiencia digital ni tratarla como si necesitara ayuda constante.

Ejecutar el prototipo con `npm run dev` desde el proyecto. En el mismo computador, abrir la dirección anunciada por Vite. Para probar desde un celular en la misma red local, el facilitador puede iniciar `npm run dev -- --host 0.0.0.0` y abrir `http://<IP-local-del-computador>:5173` en el celular, usando el puerto anunciado. Es una sesión de desarrollo local, sin despliegue, cuentas ni servicios externos. No es una prueba de instalación PWA ni de cámara.

Preparar los escenarios **en la misma pestaña y dispositivo de la usuaria**. Los datos no se comparten entre dispositivos ni pestañas. No recargar entre tareas enlazadas: la recarga restablece los ejemplos. Anotar cualquier interrupción o reinicio. Usar solo productos, nombres de comercios e importes ficticios. No se necesitan recibos ni fotografías reales.

Completar antes de empezar:

| Dato | Registro |
| --- | --- |
| Fecha y facilitador | ____________________ |
| Dispositivo, sistema y navegador | ____________________ |
| Orientación y tamaño de texto/zoom | ____________________ |
| ¿La usuaria puede leer cómodamente? Ajustes solicitados | ____________________ |
| Versión/copia del prototipo utilizada | ____________________ |

Explicación inicial sugerida: «Vamos a probar si esta aplicación resulta fácil de usar. Estamos evaluando la aplicación. Puedes decirme lo que entiendes, lo que te confunde y cuándo prefieres parar. Todo es de ejemplo: al recargar se pierde lo que hagamos».

Leer la instrucción de cada tarea una vez y dejar que actúe. Evitar señalar botones o anticipar el recorrido. Si pide ayuda, registrar primero dónde se detuvo y qué esperaba encontrar. Si resulta necesario intervenir, explicar lo mínimo y registrar exactamente la ayuda. No fijar un tiempo de aprobación ni interpretar lentitud como un fallo de la persona. Permitir pausas.

Medir desde que termina de leer/escuchar la instrucción hasta que termina la tarea o decide detenerse. Registrar por separado pausas e intervenciones. Usar como resultado: **sin ayuda / con ayuda / incompleta / no realizada**. Ninguna categoría está preseleccionada.

## Tarea 1 — Consultar inventario

**Preparación del facilitador:** restablecer los ejemplos y dejar Inicio. La leche tiene 3 unidades; los gastos de noviembre de 2026 son $286.400.

**Objetivo:** localizar un producto y comprender cuánto queda.

**Instrucción para leer:** «¿Puedes encontrar la leche y decirme cuánto queda en casa?»

**Resultado esperado:** llega a Inventario, encuentra Leche entera por búsqueda o lectura y reconoce 3 unidades. No modifica datos.

**Qué observar:** cómo identifica Inventario, si descubre la búsqueda, cómo interpreta cantidad/unidad y si distingue otros productos que muestran un estado. No exigir que use el buscador si encuentra el producto de otra forma.

| Registro de la tarea | Completar después |
| --- | --- |
| Resultado observado | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria, con sus palabras | ____________________ |

## Tarea 2 — Actualizar existencias

**Preparación:** continuar desde Tarea 1. Si esa tarea no se completó, el facilitador puede dejar visible Inventario y registrar la intervención.

**Objetivo:** corregir una existencia sin registrar una compra.

**Instrucción para leer:** «Ahora supongamos que revisaste y hay cuatro unidades de leche. Cambia lo que aparece en la aplicación para que muestre cuatro».

**Resultado esperado:** establece el saldo en 4; no añade 4 al saldo anterior. Aparece una confirmación de actualización en esta sesión y el gasto sigue en $286.400. Como variante opcional, pedir que marque el café como «Hay suficiente»; no exigir un número para ese producto.

**Qué observar:** si comprende Actualizar, si distingue establecer de añadir/consumir, si encuentra Guardar y si entiende la confirmación. Preguntar después qué cree que ha pasado con los gastos, sin corregirla durante la tarea.

| Registro de la tarea | Completar después |
| --- | --- |
| Resultado observado y variante utilizada | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria | ____________________ |

## Tarea 3 — Registrar una compra manual de tres productos

**Preparación:** el facilitador restablece los ejemplos y deja Inicio. Explicar brevemente que se inicia otro caso de prueba; no presentar el reinicio como una pérdida inesperada.

Entregar o leer esta compra ficticia, sin enseñar dónde están los controles:

| Producto | Cantidad | Precio por unidad de la cantidad |
| --- | --- | --- |
| Leche entera | 2 unidades | $4.200 por unidad |
| Arroz | 1,5 kg | $7.800 por kg |
| Huevos | 6 unidades | $630 por unidad |

Establecimiento: **Tienda de prueba**. Fecha: **21 de noviembre de 2026**.

**Objetivo:** completar un registro manual, seleccionar productos existentes y distinguir guardar un artículo de guardar toda la compra.

**Instrucción para leer:** «Compraste estas tres cosas en la Tienda de prueba. Registra la compra y comprueba que quedó bien».

**Resultado esperado:** total $23.880; al confirmar, leche 5 unidades, arroz 3,5 kg y huevos 18 unidades. Cinco compras y gasto mensual $310.280. Antes de confirmar, las existencias iniciales no deben cambiar.

**Qué observar:** elección manual frente al recibo simulado, búsqueda/selección de existentes, comprensión de cantidad y precio, uso de coma decimal, pasos repetidos y dudas sobre guardar. Registrar intentos fallidos o duplicados; no hacer la selección por ella. Observar si puede encontrar inventario y gasto después de confirmar.

| Registro de la tarea | Completar después |
| --- | --- |
| Resultado observado; total e inventario que encontró | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria | ____________________ |

## Tarea 4 — Corregir una factura simulada

**Preparación del facilitador, sin pedir esta preparación a la usuaria:**

1. Restablecer los ejemplos. Abrir Registrar compra y simular el recibo de **5 productos**.
2. Abrir Arroz → Editar y cambiar su **precio total de esta cantidad** de 7800 a **9800**. Guardar únicamente el artículo. No aceptar la diferencia ni guardar la compra completa.
3. Conservar pendiente la leche. Volver al principio de Revisar compra. El ejemplo preparado tiene un precio incorrecto y otro artículo por revisar. No se introduce un escenario nuevo en la aplicación ni se procesa una imagen.

Entregar esta referencia ficticia para comparar:

| Artículo | Cantidad correcta | Importe total correcto |
| --- | --- | --- |
| Arroz | 1 kg | $7.800 |
| Leche entera | 3 unidades | $12.600 |
| Huevos AA | 30 unidades | $18.900 |
| Detergente líquido | 1 litro | $14.800 |
| Banano | 1 kg | $7.000 |
| **Total** | | **$61.100** |

**Objetivo:** corregir un artículo que parece reconocido y resolver otro que necesita revisión.

**Instrucción para leer:** «Esta es una compra de ejemplo. El arroz tiene un precio equivocado y la leche necesita revisión. Comprueba ambos con esta referencia y corrígelos. Todavía no termines la compra: falta una cosa que veremos después».

**Resultado esperado:** arroz vuelve a $7.800; leche queda con 3 unidades por $12.600 y sin pendiente. Total $61.100; cero pendientes; la compra sigue sin confirmar. El inventario y los gastos iniciales permanecen iguales.

**Qué observar:** si encuentra la edición de un producto sin advertencia, si utiliza Por revisar para la leche, si entiende precio total frente a precio unitario, si vuelve al resumen y si comprende que un pendiente ya está incluido en el contador de productos. No exigir que edite los otros tres artículos correctos.

| Registro de la tarea | Completar después |
| --- | --- |
| Resultado observado; correcciones y pendientes restantes | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria | ____________________ |

## Tarea 5 — Añadir un artículo a la compra simulada

**Preparación:** continuar en la misma pestaña y borrador de Tarea 4, sin reiniciar. Si fue necesario completar Tarea 4 con ayuda, registrarlo; no atribuir esa corrección a la usuaria.

**Objetivo:** añadir lo que falta incluso cuando ya no hay errores, y confirmar la compra completa.

**Instrucción para leer:** «En esta misma compra faltó un café molido: una unidad por nueve mil pesos. Añádelo y termina de registrar la compra».

**Resultado esperado:** selecciona el café existente, añade 1 unidad por $9.000, ve seis artículos y total $70.100. Revisa y acepta la diferencia respecto al recibo simulado y confirma. Se registra una sola compra: gasto mensual $356.500; café pasa a «Hay suficiente» según el supuesto visible del prototipo. La cantidad comprada se conserva en el detalle.

**Qué observar:** si encuentra Añadir producto con cero pendientes, si diferencia producto existente de crear otro, si entiende el cambio de total y el guardado final. Observar si el formulario abierto y su indicación de bloqueo ayudan a evitar olvidos.

| Registro de la tarea | Completar después |
| --- | --- |
| Resultado observado; total y confirmación encontrados | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria | ____________________ |

## Tarea 6 — Consultar gastos

**Preparación:** conservar la sesión posterior a Tarea 5. Si esta no terminó, anotar el estado real. Como alternativa independiente, restablecer los ejemplos y registrar expresamente que el total esperado cambia a $286.400.

**Objetivo:** encontrar e interpretar el gasto mensual.

**Instrucción para leer:** «¿Puedes decirme cuánto se ha gastado durante el mes que aparece en la aplicación?»

**Resultado esperado:** encuentra $356.500 para noviembre de 2026 si completó el escenario enlazado, o $286.400 si se usó la alternativa restablecida. Puede reconocer que COP son pesos colombianos y que los datos son de demostración. No exigir filtros avanzados para responder.

**Qué observar:** cómo encuentra Inicio/Gastos, qué periodo cree estar viendo, si confunde el total de una compra con el mensual y si comprende que actualizar existencias no modifica gastos pasados. Preguntar después qué información le falta para confiar en el resultado.

| Registro de la tarea | Completar después |
| --- | --- |
| Escenario utilizado y resultado observado | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria | ____________________ |

## Tarea 7 — Crear y finalizar una lista

**Preparación:** el facilitador finaliza la lista de ejemplo si sigue activa, sin crear otra. Anotar el gasto e inventario anteriores; no hace falta restablecer toda la sesión.

**Objetivo:** utilizar una lista temporal y comprender que marcar no registra compras.

**Instrucción para leer:** «Prepara una lista llamada Para el sábado con leche, arroz y café. Cambia la cantidad de leche a dos, marca el arroz como comprado y luego desmárcalo. Quita el café. Cuando termines, finaliza y descarta la lista».

**Resultado esperado:** puede crear, añadir, editar cantidad, marcar/desmarcar, quitar y finalizar. Tras confirmar el descarte no queda lista activa ni historial de listas. Inventario y gastos conservan los valores anteriores a la tarea.

**Qué observar:** si encuentra las acciones, comprende pendientes/comprados y entiende qué desaparece al finalizar, incluidos los pendientes. Preguntar qué esperaba que ocurriera con el inventario al marcar un artículo, sin sugerir la respuesta.

| Registro de la tarea | Completar después |
| --- | --- |
| Resultado observado; inventario/gasto antes y después | ____________________ |
| Dificultades y punto del recorrido | ____________________ |
| Inicio / fin / duración / pausas | ____________________ |
| ¿Necesitó ayuda? ¿Cuál y cuándo? | ____________________ |
| Comentarios de la usuaria | ____________________ |

## Cierre y seguimiento

Preguntar: «¿Qué fue lo más fácil?», «¿Qué te costó más?», «¿Hubo palabras que cambiarías?» y «¿Te resultó cómodo leer y tocar los controles?». Registrar las respuestas textuales y evitar defender el diseño.

Si la sesión lo permite, ofrecer una prueba adicional de la compra de **50 productos**, primero solo para localizar sus seis pendientes y regresar al total. Es opcional; no convertir cansancio en una exigencia ni obligar a recorrer cincuenta formularios. Anotar por separado si la cantidad de desplazamiento resulta cómoda.

| Hallazgo observado | Tarea/dispositivo | Frecuencia observada | Impacto en completar la tarea | Propuesta para revisar |
| --- | --- | --- | --- | --- |
| ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |
| ____________________ | ____________________ | ____________________ | ____________________ | ____________________ |

Separar los errores de la aplicación de preferencias y propuestas. Las decisiones de negocio pendientes no se aprueban mediante una observación aislada. Revisar los hallazgos con la usuaria antes de planear otra fase. No afirmar que la aplicación está validada hasta realizar y documentar esta prueba.
