# Contexto del proyecto para Claude

Este archivo viaja dentro del repositorio (a diferencia de la memoria
personal de Claude Code, que vive en la Mac de cada usuario) para que
cualquier instancia de Claude Code que abra este proyecto — en cualquier
máquina — tenga el mismo contexto de fondo. Actualízalo cuando algo aquí
quede desactualizado; no dejes que se pudra como pasó con el README.

## Idioma

Responder siempre en español al trabajar en este proyecto, salvo que se
pida explícitamente lo contrario.

## Estado actual (2026-08-06)

La app está en **v6.0**. El evento real de referencia es una **boda el 13
de noviembre de 2026** (Rte. El Rincón, Icod de los Vinos, Tenerife).

El sistema de avisos automáticos por email (Resend, vía función SQL
`enviar_email` que llama a Resend directamente desde Postgres) **ya se ha
probado en vivo con un colaborador real** y funciona. La primera prueba
sacó varios ajustes reales, ya aplicados en código y en la base de datos:

- El email al colaborador con invitados asignados **solo nombra a los
  confirmados** — los que siguen en tentativa no se mencionan, para no
  levantar sospechas sobre la organización antes de tiempo. Si un
  tentativa se confirma más tarde, genera su propia tanda de aviso nueva
  (no se pierde, solo se retrasa).
- "He terminado mi trabajo" (colaborador) ya no lo bloquea tener
  invitados en tentativa sin confirmar — solo mira que los confirmados de
  ese lote estén completos.
- Nuevo botón "Probar" junto al email de cada colaborador (sección
  Colaboradores): envía un email de prueba al momento, con aviso visible
  si el formato no parece válido. Motivo: una errata de un carácter en un
  email de colaborador pasó desapercibida varios días hasta que se
  investigó por qué no le llegaban avisos — la causa raíz de por qué
  corregirla y recargar no bastaba a la primera no se ha localizado del
  todo; si se repite, hace falta investigarlo con el paso a paso exacto.
- "Reiniciar avisos (historial de emails)" ahora también vuelve a marcar
  como pendientes (`avisoPendiente = true`) a todos los invitados ya
  asignados a un colaborador, no solo borra el historial. Motivo: los
  reinicios por invitado (datos/pago/mesa/asignación) ya limpian
  "avisoPendiente" como parte de su categoría — sin este cambio, tras
  usarlos no quedaba ningún botón con el que volver a probar el envío
  real, aunque el colaborador tuviera un email válido.

⚠️ El README sigue sin reflejar nada de esto (habla de "pendiente" para
toda la fase de emails) — está desactualizado, no lo tomes como fuente de
verdad.

Desde que se construyó el sistema de emails, el resto del trabajo se ha
ido en: mejoras de comodidad (Plano de mesas, Estado de cuentas), el
modelo de ventanas flotantes (ver más abajo), solidez general (backup
automático también en BORRAR TODO, reversión de guardados fallidos, Error
Boundary) y backup diario automático de la base de datos (ver más abajo).

**Por qué importa:** el plan es reutilizar esta misma app para **otros
eventos futuros** con pequeñas adaptaciones — no es un proyecto de un solo
uso. Por eso la Zona de Reinicio es una función permanente de la app, no un
script SQL de usar y tirar.

**Próximos pasos probables:** seguir probando el flujo de emails en vivo
con los ajustes de hoy ya activos (código en Vercel y funciones SQL ya
aplicadas en Supabase). Si se reporta un email que no llega o llega mal,
mirar primero el registro "Avisos enviados" dentro de la propia app (tabla
`avisos_enviados`) y, si hace falta, los logs de Resend — no asumir que el
código de envío está roto sin descartar antes un problema de configuración
(clave de API, remitente) o de plantilla.

**2026-08-08: red de pruebas (Vitest + jsdom) y ESLint (`no-undef`).**
`npm test` corre los tests unitarios (co-localizados en `src/lib/*.test.js`)
sobre las funciones puras; `npm run lint` detecta al instante cualquier
referencia a una variable no importada — el fallo silencioso más peligroso
al mover código entre ficheros en JS sin tipos (no rompe el build, solo
revienta en tiempo de ejecución la primera vez que se toca esa rama). Las
dos se usaron como red de seguridad, junto a `npm run build`, en las 3
fases siguientes.

**2026-08-08: `App.jsx` dividido de 6.262 a 240 líneas (rama
`refactor/dividir-app-jsx`, sin fusionar todavía — pendiente de que el
usuario la pruebe a mano en `npm run dev`).** Mismo código, mismos
comentarios, solo cambia el fichero, en 3 fases (cada una con su propio
commit, verificado con lint+test+build antes del siguiente):
- Fase 1: funciones puras a `src/lib/*.js` (con sus tests co-localizados).
- Fase 2: componentes de presentación "hoja" (reciben props, no dependen
  del estado de `VistaAnfitrion`) a `src/components/*.jsx`, más `theme.js`
  (paleta `C`, `inputStyle`) y `constants.js` (`VERSION_APP`) como módulos
  compartidos nuevos para que ni App.jsx ni los componentes dependan el
  uno del otro.
- Fase 3: `VistaAnfitrion` (~3.650 líneas) y `VistaColaborador` a
  `src/vistas/*.jsx`, tal cual, sin dividir su interior todavía.
El tamaño del bundle final es prácticamente idéntico al de antes de
empezar (511.98 kB vs 511.97 kB) — señal de que nada se perdió ni se
duplicó.

**Fase 4 — COMPLETA (2026-08-08/09).** Dividido el interior de
`VistaAnfitrion.jsx` en 5 rondas de riesgo creciente, cada una en su
propia rama, probada a mano por el usuario y fusionada antes de empezar
la siguiente:
- Ronda 1: `versiones`, `progreso`, `copiaSeguridad`, `config-url-web`,
  `config-email-anfitrion`, `config-precios`. De paso, corrigió dos
  fallos reales ya existentes en Invitaciones con el email de un
  invitado que también es colaborador (ver más abajo,
  `emailDeInvitado`/`destinatarioConEmail`).
- Ronda 2: `config-datos-evento`, `config-plantillas-email`,
  `config-zona-reinicio`, `config-zona-peligro`.
- Ronda 3: `colaboradores` y `mesas`.
- Ronda 4 (la más grande): `plano`, `cuentas`, `avisos`, `invitaciones`.
  Avisos e Invitaciones comparten de verdad el motor de "enviar la
  invitación a una familia" — esa parte se quedó en el cascarón, pasada
  como props a las dos, en vez de duplicarla.
- Ronda 5 (última): la tabla "Lista de invitados" (ni siquiera era una
  ventana flotante, era la sección siempre visible) a
  `SeccionInvitados.jsx`.

Resultado: `VistaAnfitrion.jsx` pasó de **3.788 a 548 líneas**. Cada
ventana vive ahora en su propio fichero bajo `src/vistas/anfitrion/`. Lo
que queda en el cascarón (`VistaAnfitrion.jsx`) es exactamente lo que
comparten de verdad 2+ ventanas entre sí (`asignarColaborador`,
`ocupacionMesa`, `panelFlotante`/`setPanelFlotante`,
`filtros`/`setFiltros`, el motor de invitaciones) — pasado como props a
quien lo necesite, nunca duplicado. Patrón a seguir si se añade una
ventana nueva: si su lógica no la usa nadie más, vive entera en su
propio fichero; si la comparten dos o más, se queda en el cascarón y se
pasa como prop.

Dos lecciones confirmadas durante el reparto:
- `npm run lint` (no-undef) cazó al vuelo una constante perdida al mover
  un bloque grande (Ronda 2), antes de llegar al navegador.
- `npm run build` (no el lint) cazó un import de la librería equivocada
  (`calcularEdad`/`edadPromedio` importados de `lib/formato` en vez de
  `lib/invitados`, Ronda 5) — ESLint no lo ve porque el nombre sí existe
  en algún sitio; solo Rollup, al construir de verdad, comprueba que el
  módulo de origen lo exporte. Las dos comprobaciones son necesarias.

## Sesión del 2026-08-12: Modo Pruebas, seguridad, acuse en PDF, y repaso visual

Sesión larga, varios frentes distintos. Resumen para no tener que releer
todo el historial de commits:

**Modo Pruebas gana selección de colaboradores habilitados.**
`colaboradores.habilitadoEnPruebas` (default `true`) + la función
`colaborador_puede_actuar()` centraliza el bloqueo para las 5 RPC
`colaborador_*` que actúan de verdad (`colaborador_mi_perfil` queda
fuera a propósito: un colaborador bloqueado debe poder seguir viendo su
propio perfil). `anfitrion_activar_modo_pruebas` ganó el parámetro
`p_colaborador_ids_habilitados` (cambio de firma → hizo falta el `drop
function` de siempre). `VentanaConfigModoPruebas.jsx` muestra un
checklist con "Todos/Ninguno" antes de activar. Dos bugs reales
encontrados y corregidos en el camino:
- Las funciones de Modo Pruebas (activar/desactivar) tenían varios
  `UPDATE`/`DELETE` intencionalmente sin `WHERE` (toda la tabla a
  propósito) -- Supabase lo bloquea con código 21000 salvo que lleven
  `where true` (ver la regla ya añadida más abajo, sección "Reglas de
  diseño").
- `colaborador_mis_invitados` quedó mal enganchada a
  `colaborador_puede_actuar()` en la primera versión: eso bloqueaba
  también la VISIBILIDAD de la lista (no solo los gestos) a quien
  estuviera deshabilitado. Corregido para que solo dependa de
  `authUserId = auth.uid()`, igual que `colaborador_mi_perfil`.

**Bug de seguridad real, no solo de estilo: la previsualización
"Formularios" del anfitrión llevaba rota desde el 12 de agosto (Fase
B, retirada del enlace-token de colaborador)** -- cambiar `rol` para
previsualizar disparaba una recarga real vía
`colaborador_mi_perfil`/`colaborador_mis_invitados`, que exigen sesión
real de ESE colaborador; el anfitrión sigue con la suya propia, así que
nunca coincidía. `App.jsx` ganó un estado separado, `vistaPrevia`
(distinto de `rol`): la previsualización ya no dispara ningún refetch,
reutiliza los datos que el anfitrión ya tiene cargados enteros. Lección:
cualquier RPC `colaborador_*` nueva que dependa de `auth.uid()` debe
asumir que el anfitrión puede querer "verla" sin ser esa persona --
para eso está `vistaPrevia`, no para añadir excepciones a la propia RPC.

**Enlace `?rol=...` de colaborador sin sesión: pantalla dedicada "No
tienes acceso"** (antes mostraba una franja técnica confusa que un
colaborador probando la seguridad interpretó como un fallo de la app,
no como un bloqueo). Condición `session === null && !esAnfitrionOriginal
&& urlRol` -- el `session === null` importa: sin él, bloquearía por
error a un colaborador con sesión real que además tuviera ese enlace
viejo suelto en la URL.

**PDF del acuse de recogida, rediseño completo** (`lib/acuseImagen.js`):
antes se dibujaba a tamaño propio y se ESCALABA para caber en un A4 --
eso encogía también la letra (el pie de página acababa a ~8pt reales).
Ahora se dibuja YA a las medidas exactas de un A4 (595.28 x 841.89pt),
sin ningún escalado. Tabla con cabecera y filas cebra, bloque de TOTAL
en caja destacada, nombre del evento en script dorado (fuente "Alex
Brush", cargada con `document.fonts.load()` porque no se usa en ningún
otro sitio de la app -- mismo gotcha que Fraunces en
`generarImagenParaFamilia`). Con pocos invitados (máximo real: 12-14)
el hueco sobrante se reparte entre 3 puntos del dibujo para que se vea
igual de equilibrado con 2 invitados que con 14. Verificado con
node-canvas antes de subir cada ronda, no solo por cálculo -- así se
cazó un hueco vacío real que el cálculo solo no habría revelado.

**"Estado de cuentas": "Confirmar recogida" y "Probar acuse" ya no
envían directamente** -- generan el PDF y abren una vista previa
(mismo patrón que ya usaba Invitaciones) con el destinatario, el
importe y el PDF incrustado; el envío real solo pasa al aceptar ahí.

**Repaso visual completo ("toque más moderno, verde/dorado/marfil,
toque 3D suave"), en Portada.jsx y de ahí a toda la app:**
- Portada: pasó por 3 rediseños hasta encontrar el bueno. Primero
  imagen a pantalla completa con datos superpuestos (recortaba la foto
  en móvil), luego foto+franja separadas (arregló el recorte pero
  pensada para foto panorámica), y por fin el definitivo: el póster
  VERTICAL real de la invitación (`evento.imagen`, NO
  `evento.imagenInvitacion` -- son dos imágenes distintas, la de
  Invitaciones lleva recuadros de Familia/Mesa que no pintan nada en un
  dashboard) en una tarjeta centrada de ancho máximo 480px, con
  fecha/hora/lugar en vivo en su propia franja verde debajo (no
  "quemados" en la imagen, para no depender de regenerarla si cambia
  algo en Configuración).
- Dos clases CSS reutilizables (`index.css`): `.boton-3d` (relieve
  sutil, cualquier botón) y `.boton-verde-solido`/`.boton-flotante-imagen`
  (degradado verde + letra dorada `C.goldClaro`, opaco para tarjetas
  claras / translúcido+difuminado para ir sobre una foto).
  `.panel-flotante-cristal` para paneles/cabeceras (desplegables,
  cabeceras de `VentanaFlotante`).
- `theme.js` ganó `C.goldClaro` (#D9B778): `C.gold` (#B08D57) es
  demasiado apagado sobre fondo oscuro -- `C.gold` se queda para fondos
  claros (uso original), `C.goldClaro` para texto sobre verde oscuro.
- Cabeceras de `VentanaFlotante` y del recuadro de `VistaColaborador`:
  mismo verde/dorado que los botones. La cabecera de `VistaColaborador`
  es `sticky` -- ⚠️ gotcha real: no funcionaba hasta quitar
  `overflow-hidden` del contenedor exterior (que estaba ahí solo para
  redondear esquinas) -- `position: sticky` se anula sin avisar si
  cualquier antecesor tiene `overflow` distinto de `visible`. El
  redondeado se reparte ahora en cada pieza por separado
  (`borderTopLeftRadius`/etc.) en vez de un `overflow-hidden` compartido.
- Login (`VistaLogin.jsx`): mismo fondo verde y botón dorado.
- `VistaColaborador.jsx`: recuadro de datos reordenado varias veces
  hasta el layout final (2 filas de 3 tarjetas: Importe total/Cobrado/
  Pendiente arriba, No pagados/Pagados/porcentajes abajo; Cobrado con
  fondo verde y letra blanca, Pendiente con fondo rojo y letra blanca;
  texto arriba y número/importe debajo en las 6, sin excepción). El
  formulario de cada invitado (`FormularioDatos`) quedó en pruebas con
  fondo verde oscuro (`C.ink`) + letras doradas, con el aviso de "*
  campos obligatorios" en su propio recuadro crema (el rojo directo
  sobre verde oscuro no se leía bien).

⚠️ **Sin acceso a un navegador real para verificar visualmente estos
cambios en vivo** (la sandbox no deja que un navegador headless lanzado
aquí alcance `localhost`, y no hay credenciales de anfitrión
compartidas) -- todo este repaso se verificó con lint/build y revisión
cuidadosa del código, y se corrigió con las capturas reales que fue
mandando el usuario en cada ronda. Varios bugs reales se colaron así
(recorte de imagen por aspect-ratio, imagen equivocada usada en la
Portada, fecha/hora/lugar desaparecidos por una condición mal
compartida, sticky roto por overflow-hidden) -- si se retoma este
repaso visual, pedir una captura real antes de dar un cambio de layout
por bueno, no fiarse solo del razonamiento sobre el CSS.

## Backup automático de la base de datos

Existe un backup diario automático vía GitHub Actions
(`.github/workflows/backup.yml`), configurado el 2026-08-05. Se ejecuta
solo cada día y también se puede lanzar a mano desde la pestaña Actions
("Run workflow"). El volcado (`pg_dump`) se guarda como **artifact** de
esa ejecución (Actions → la ejecución → sección "Artifacts", se conservan
90 días) — deliberadamente **no** se commitea al repositorio.

Motivo de no commitearlo: la base de datos guarda credenciales propias en
las tablas `config_secretos` (clave de la API de Resend) y
`anfitrion_secreto` (token de acceso del anfitrión). Un primer intento de
guardar el volcado dentro del repo fue bloqueado por el "secret scanning"
de GitHub al detectar la clave real de Resend en texto plano — señal
correcta, no un error a silenciar. La solución fue doble: excluir los
datos de esas dos tablas del volcado (`--exclude-table-data`, se conserva
la estructura por si hace falta restaurar, pero no el secreto) y además
sacar el backup por completo del historial de git usando artifacts en vez
de un commit.

Requiere el secreto de repositorio `SUPABASE_DB_URL` (Settings → Secrets
and variables → Actions), con la cadena de conexión **"Session pooler"**
de Supabase (no "Direct connection": esa es solo IPv6 y GitHub Actions no
la alcanza de forma fiable).

⚠️ Gotcha ya encontrado: `pg_dump` debe ser de una versión igual o mayor
que la del servidor de Postgres de Supabase, si no aborta con "server
version mismatch". El workflow usa la imagen Docker `postgres:17`; si
Supabase sube de versión mayor en el futuro (revisar en Project Settings →
Database, o en el mensaje de error si el workflow empieza a fallar de
nuevo), hay que subir el número de esa imagen a juego.

## Reglas de diseño ya decididas

### `enviar_email` nunca debe esperar de forma bloqueante la respuesta HTTP

Se probó el 2026-08-08: usar `net.http_collect_response(request_id, async
:= false)` dentro de `enviar_email` para confirmar si Resend aceptó el
envío. Provocó `ERROR 57014: canceling statement due to statement
timeout` en los logs reales de Postgres al probarlo — y lo más grave:
Postgres cancela la transacción **entera** cuando eso pasa, deshaciendo
también el propio `net.http_post` que dispara el envío. Es decir, el
intento de "saber si se envió" podía hacer que el email **ni se llegara
a enviar de verdad**. Se revirtió de inmediato.

`net.http_post` es "disparar y no esperar" a propósito — es lo único
seguro de hacer dentro de `enviar_email`. La confirmación real ya está
resuelta (2026-08-07, mismo día): `enviar_email` guarda el `request_id`
que devuelve `net.http_post` (eso sí es instantáneo, no espera nada) en
`avisos_enviados.requestId`, y una función **totalmente aparte**,
`anfitrion_actualizar_estado_avisos`, es la que más tarde mira si ya hay
respuesta — con `net.http_collect_response(request_id, async := true)`,
que es la versión que NUNCA bloquea: si la respuesta no está lista
todavía, lo dice al momento ('PENDING') y sigue con el siguiente aviso.
Esa comprobación se dispara sola desde `useLedgerData.js`, aprovechando
el refresco automático de cada minuto — nunca desde dentro del envío.
`avisos_enviados.exito` vuelve a mostrarse como ✓/✗/? en el historial de
Avisos, ahora sí con datos reales detrás.

### Cambiar la firma de una función SQL exige `drop function` de la firma vieja

Esto ya ha roto la app **tres veces** (todas en `enviar_email`, la última
el 2026-08-06 al añadir `p_tipo` — rompió "Avisar ahora" en toda la app
porque las llamadas con pocos argumentos se volvían ambiguas entre las
dos versiones coexistentes). `create or replace function` en Postgres
**no** reemplaza una función si cambia su número de parámetros — crea una
segunda función en paralelo (mismo nombre, distinta firma). Con
parámetros opcionales de por medio, cualquier llamada que no dé el
número exacto de argumentos de ninguna de las dos se vuelve ambigua
("function is not unique") y falla.

**Antes de añadir o quitar un parámetro a cualquier función SQL ya
existente**, incluir siempre, justo antes del `create or replace`:
```sql
drop function if exists nombre_funcion(tipos, de, los, parámetros, viejos);
```
con la firma **anterior** exacta (tipos en el mismo orden). Ver el
historial de `drop function if exists enviar_email(...)` en
`supabase/schema.sql` como referencia de las tres firmas que ha tenido.

⚠️ Cómo se acabó de diagnosticar el episodio del 2026-08-06 (por si se
repite): el primer intento de `drop function` no lo arregló porque el
propio SQL Editor de Supabase tenía contenido antiguo sin borrar en la
misma pestaña ("Untitled query" reutilizada de una vez anterior) — al
pulsar "Run" se re-ejecutó también un `create or replace function
enviar_email(...)` viejo de 6 parámetros que quedaba ahí debajo, y volvió
a dejar las dos versiones a la vez. Para pedirle al usuario que ejecute
SQL nuevo: decirle explícitamente que **borre todo el contenido del
editor primero** y pegue solo el bloque nuevo, en vez de asumir que la
pestaña está vacía. Para diagnosticar "function is not unique" con
certeza, esta consulta lista las firmas reales que existen de verdad en
la base de datos (más fiable que mirar el código fuente, que solo dice
lo que *debería* haber):
```sql
select p.oid::regprocedure as firma
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'nombre_funcion' and n.nspname = 'public';
```

### Supabase exige `WHERE` en todo `UPDATE`/`DELETE` -- usar `where true` si de verdad es toda la tabla

Detectado el 2026-08-12 al probar Modo Pruebas en vivo por primera vez:
"Activar Modo Pruebas" fallaba con `code: 21000, message: "UPDATE
requires a WHERE clause"`. Este proyecto de Supabase tiene activada la
protección contra `UPDATE`/`DELETE` sin filtro (para evitar el clásico
"borré/actualicé la tabla entera sin querer") -- se aplica a cualquier
conexión, incluida la de las funciones `security definer` que llaman las
RPC, no solo al SQL Editor.

Cuando una función necesita de verdad tocar **toda** la tabla a
propósito (no es un descuido, es la intención), añadir `where true` al
final -- cumple la exigencia sintáctica sin cambiar el comportamiento.
`anfitrion_resetear_avisos` ya lo hacía bien desde el principio
(`delete from avisos_enviados where true;`); las funciones de Modo
Pruebas (`anfitrion_activar_modo_pruebas`,
`anfitrion_desactivar_modo_pruebas` -- esta última vacía y repuebla 8
tablas enteras desde la foto guardada) se escribieron sin él y no se
detectó hasta el primer uso real, porque nunca se había probado en vivo
hasta entonces.

**Al escribir cualquier `UPDATE`/`DELETE` nuevo que afecte a toda una
tabla a propósito**, añadir `where true` desde el principio en vez de
esperar a que falle en producción.

### "avisoPendiente" e "invitacionEnviada" se recalculan solos (triggers), no se fijan a mano

El 2026-08-06, tras varias rondas de bugs (cada uno en un sitio distinto
donde se nos olvidaba actualizar la bandera al tocar otra parte del
código), se identificó el patrón de fondo: la app "registraba lo que
HACÍA" (una bandera que alguien enciende/apaga a mano en cada función)
en vez de "leer lo que TIENE" (recalcular del estado actual cada vez).
Eso obligaba a mantener la misma lógica sincronizada a mano en 4+ sitios
distintos, y se desincronizaba cada vez que se tocaba solo uno.

Solución: dos triggers en Postgres sobre `invitados`
(`trg_recalcular_aviso_pendiente`, `trg_invalidar_invitacion_familia`,
ver `supabase/schema.sql`) que recalculan estas dos columnas solos en
cuanto cambia algo relevante. Ninguna función RPC debería volver a poner
`avisoPendiente` o `invitacionEnviada` a mano salvo:
- `anfitrion_avisar_colaborador`: el único gesto deliberado de "ya avisé
  de verdad" (`avisoPendiente = false`).
- `anfitrion_resetear_avisos`: fuerza `avisoPendiente = true` a propósito,
  para poder repetir una prueba sin reasignar (el trigger no interfiere
  porque solo actúa si detecta un cambio en las columnas que vigila).
- `colaborador_guardar_invitado` / `colaborador_marcar_pagado`: llaman a
  `perform set_config('eventos.recalculo_aviso_activo', 'off', true)`
  antes de su propio `update`, para que el trigger no le "avise" al
  colaborador de su propio cambio — si algún día se ve `avisoPendiente`
  activándose solo porque un colaborador rellenó datos, es que a esa
  función nueva le falta este mismo `set_config`.

**Si se añade una función nueva que cambia campos de `invitados`
relevantes para avisos** (confirmado, colaboradorId, datos, pago, mesa),
no hace falta tocar `avisoPendiente` — el trigger ya se entera solo. Si
esa función representa una acción del propio colaborador sobre sus
datos (no del anfitrión), añadir el mismo `set_config` de supresión.

### "Reset" nunca borra invitados ni colaboradores

Cualquier función de reinicio/limpieza de datos de prueba (mesas, pagos,
datos de invitado, asignación de colaborador, invitación enviada, foto
familiar) debe **quitar la asignación o vaciar un campo, nunca borrar la
fila** del invitado ni del colaborador. Motivo: un colaborador es un
invitado del evento que colabora — son la misma entidad: borrar el registro
de colaborador destruiría también al invitado real.

Al construir un reinicio nuevo:
- Operar por `id` de invitado explícito (nunca `UPDATE ... WHERE true`
  salvo que de verdad se quiera afectar a todos), idealmente acotado por
  colaborador/familia/invitado concreto — patrón
  `anfitrion_resetear_por_invitados(p_token, p_invitado_ids, p_categoria)`.
- `avisoPendiente` en el mismo paso: **solo se limpia a `false` si la
  categoría de verdad desasigna al colaborador** ("asignación" — ya no hay
  a quién avisar). Las demás (datos/pago/mesa) no desasignan, así que
  vuelven a poner `avisoPendiente = ("colaboradorId" is not null)`: si el
  invitado sigue siendo de ese colaborador, borrarle sus datos de prueba
  lo deja igual que recién asignado — tiene de nuevo algo pendiente de
  rellenar, y hace falta poder avisarle otra vez sin reasignar a mano
  (imprescindible para repetir una prueba completa con el mismo
  colaborador).
- Pedir escribir una palabra de confirmación exacta (no un simple clic) y
  descargar automáticamente una copia de seguridad completa del evento
  (JSON) antes de ejecutar — nunca ejecutar un reinicio en bloque sin ese
  respaldo.
- "Invitación enviada" y "foto familiar" son datos **por familia**
  (`grupoFamiliar`, con reserva a `apellido`), no por invitado individual —
  si el alcance elegido es "un invitado en concreto", esas dos categorías
  no aplican a ese nivel (ofrecer "por familia" en su lugar).

### Toda UI nueva usa `VentanaFlotante`

Para cualquier funcionalidad nueva que necesite su propia superficie de UI
(no un campo suelto dentro de una ventana ya existente), usar el componente
compartido `VentanaFlotante` de `src/App.jsx` — no crear modales ni paneles
nuevos con otro comportamiento.

`VentanaFlotante` ya incluye, de fábrica, para toda la app:
- Arrastrable por la cabecera y redimensionable desde la esquina.
- Varias pueden estar abiertas a la vez, sin bloquear el resto de la
  pantalla (a diferencia de `ModalFlotante`).
- Cualquier ventana pasa a primer plano en cuanto se toca (z-index dinámico
  compartido, `contadorZIndexVentanas`), y los controles de su cabecera
  (como un desplegable) no inician el arrastre.

⚠️ Gotcha ya encontrado: `ModalFlotante` (los diálogos con fondo oscurecido
— confirmaciones, vistas previas) comparte el mismo `contadorZIndexVentanas`
y también debe pedir un número al montarse (`useState(() => ++contadorZIndexVentanas)`).
Si algún modal nuevo se queda con un z-index fijo en vez de pedirlo al
contador, puede abrirse oculto detrás de una `VentanaFlotante` que ya
llevara un rato en uso (su z-index ya habría subido por encima).

Cómo aplicar:
1. Toda ventana nueva se monta con `VentanaFlotante`, heredando gratis el
   comportamiento anterior.
2. Si una sección crece hasta tener varias partes claramente distintas
   (como pasó con Configuración: Datos del evento, Precios, URL web, Email
   anfitrión, Texto emails, Reinicios, Borrado total), no amontonarlas
   todas en una sola ventana larga. En su lugar: una ventana "lanzadora"
   pequeña con un desplegable "SECCIÓN" que abre cada parte como su propia
   `VentanaFlotante` independiente — mismo patrón que usa la navegación de
   la Portada para abrir Mesas, Avisos, etc.
3. Cualquier control interactivo añadido a la cabecera de una ventana (vía
   el prop `extra`) debe cortar la propagación del `mousedown`/
   `touchstart` (`e.stopPropagation()`), para no arrastrar la ventana sin
   querer.

### Calibrar posiciones sobre canvas con una cuadrícula, no a ciegas

Para posicionar texto con precisión sobre una imagen generada por canvas
(por ejemplo la plantilla de invitación con fecha/hora/lugar), añadir un
**modo de cuadrícula de calibración temporal**: un checkbox que dibuja
líneas cada 5% del ancho y alto, con la fracción (0.05, 0.10...) escrita en
cada línea. Así se puede pedir un ajuste como "está en y=0.54, debe ir a
y=0.52" en vez de estimar a partir de capturas sin referencias. Proponer
esto proactivamente ANTES de iterar a ciegas con capturas de pantalla.
Preferir coordenadas fijas leídas de la cuadrícula antes que acumular
offsets relativos sobre fórmulas antiguas (arrastran errores difíciles de
razonar).

### El email de un invitado que también es colaborador vive en dos sitios

Cuando un invitado es también colaborador (gestiona sus propios
invitados asignados), su email **no se edita en su propia ficha** — el
campo se deja vacío a propósito y se muestra de solo lectura ("Se edita
en Colaboradores, no aquí", ver `VistaColaborador.jsx`); el email real
vive en el registro de `colaboradores` (`colaboradores.find(c =>
c.invitadoId === invitado.id)`).

Cualquier código nuevo que necesite "el email de un invitado" (no solo
mostrarlo, también para decidir si puede enviársele algo) tiene que
mirar los dos sitios, nunca solo `invitado.email` — si esa persona es
además la única de su unidad familiar, no hay ningún otro miembro al que
recurrir como alternativa. Ver `emailDeInvitado()` y
`destinatarioConEmail()` en `VistaAnfitrion.jsx` (ventana Invitaciones,
detectado y corregido el 2026-08-08 al probar la Fase 4 Ronda 1) —
mismo patrón a seguir si aparece otro sitio que necesite esto.

### Login real (Supabase Auth) — capa añadida en paralelo al enlace-token

**2026-08-09.** Se añadió login real (email + contraseña) para anfitrión
y colaboradores, SIN reescribir ninguna de las ~20 RPC existentes: una
función nueva, `mi_rol()`, traduce `auth.uid()` (quién ha iniciado
sesión) al mismo token/id que ya usaba el enlace mágico. El enlace-token
se mantiene funcionando en paralelo (si no hay sesión pero sí hay
`?rol=...`, se usa el flujo de siempre) — ver
`.claude/plans/login-supabase-auth.md` para el plan completo.

Cada colaborador crea su PROPIA cuenta desde "Crear cuenta" en el login,
usando el mismo email con el que ya está dado de alta — un trigger
(`vincular_cuenta_nueva` sobre `auth.users`) la enlaza sola comparando
ese email con `colaboradores.email` / `evento.emailAnfitrion`. Si el
email no coincide con nadie conocido, la cuenta se crea igual pero sin
ningún acceso (autorregistrarse nunca concede acceso por sí solo).

**Cambio de email de un colaborador ya enlazado:** basta con que el
anfitrión actualice su email en Colaboradores y esa persona vuelva a
"Crear cuenta" con el email nuevo — el trigger re-enlaza sin pedir
ningún paso manual de por medio (el `update` de `colaboradores` no lleva
condición "solo si no tenía cuenta ya", a propósito, para permitir
justo este caso). La cuenta de Auth vieja queda huérfana (sin acceso,
inofensiva) y no hace falta borrarla para que esto funcione — se puede
limpiar a mano desde el panel si se quiere, sin prisa.

**2026-08-12: enlace-token retirado para colaboradores (Fase B resuelta
a medias).** En pruebas en vivo se confirmó que un colaborador seguía
pudiendo entrar con su enlace `?rol=...` antiguo aunque ya tuviera
cuenta — el enlace nunca dejó de "funcionar" de verdad, solo dejó de
ser el camino recomendado. Las 6 RPC `colaborador_*` ahora exigen
además `"authUserId" = auth.uid()`: sin sesión real (el caso del enlace
viejo), `auth.uid()` es `null` y no coincide con nada, así que esas
funciones dejan de devolver datos — el enlace-token de colaborador ya
NO funciona, solo el login. El enlace del **anfitrión** no se tocó
(sigue siendo válido a propósito, como plan B) — su seguridad nunca
dependió de estas 6 funciones. Ver Fase B en
`.claude/plans/mejoras-pendientes-login-y-solidez.md` para la decisión
pendiente que queda (qué hacer con el enlace del anfitrión).

**2026-08-12: pantalla dedicada "No tienes acceso" para el enlace
`?rol=...` viejo sin sesión.** El usuario le pidió a un colaborador que
probara entrar con un enlace de un email antiguo, sin haber iniciado
sesión, para comprobar la seguridad — el colaborador lo describió como
"una vista de colaborador sin datos", no como un bloqueo claro. La app
sí lo bloqueaba de verdad (Fase B ya impedía que devolviera ningún
dato), pero el AVISO al usuario final era confuso: una franja técnica
("Vista fija de enlace · rol no encontrado") seguida de un párrafo
discreto al fondo de la pantalla, que se podía leer como un fallo de la
app en vez de como un cierre de seguridad correcto. `App.jsx` añadió una
pantalla propia y clara ("No tienes acceso" + enlace a iniciar sesión)
que corta el render ANTES de llegar al resto de la app, con la condición
`session === null && !esAnfitrionOriginal && urlRol` — el `session ===
null` es importante: sin él, un colaborador con sesión real que además
tuviera un `?rol=...` suelto en la URL (arrastrado de un enlace viejo)
vería este bloqueo por error, aunque `mi_rol()` ya le hubiera resuelto
el acceso de verdad por su cuenta. La franja técnica que había antes se
retiró (quedaba sin uso real tras esto).

⚠️ **Ese mismo cambio rompió, de rebote, la previsualización "Formularios"
del anfitrión (App.jsx) sin que nadie lo notara hasta el 2026-08-12,
al probar Modo Pruebas en vivo.** "Formularios" reutilizaba `setRol` para
cambiar a la vista de un colaborador, lo que disparaba una recarga real
de datos vía `colaborador_mi_perfil`/`colaborador_mis_invitados` — y esas
dos exigen `authUserId = auth.uid()` desde la entrada de arriba. Como el
anfitrión sigue con SU PROPIA sesión al previsualizar (nunca inicia
sesión como ese colaborador), la condición nunca se cumplía: la
previsualización mostraba "Este enlace no es válido..." en vez del
formulario. Arreglado separando "quién soy" de "qué estoy
previsualizando": `App.jsx` añadió un estado aparte, `vistaPrevia`, que
NO toca `rol` ni dispara ningún refetch — simplemente le pasa a
`VistaColaborador` los datos que el anfitrión YA tiene cargados enteros
(todos los colaboradores, todos los invitados), y `VistaColaborador`
los filtra por `colaboradorId` en el propio cliente (ya lo hacía así,
funciona igual de bien con el listado completo que con uno ya
filtrado). **Cualquier función nueva `colaborador_*` que dependa de
`auth.uid()` debe asumir que el anfitrión puede querer "verla" sin ser
esa persona** — para eso sirve `vistaPrevia`, no añadir excepciones a la
propia RPC.

⚠️ **Postgres concede EXECUTE a PUBLIC por defecto en cualquier función
nueva.** `mi_rol()` se creó con `grant execute ... to authenticated`
pero SIN revocar antes el permiso por defecto de PUBLIC — una prueba en
vivo confirmó que respondía 200 OK con datos aunque la llamada viniera
sin sesión (`anon`). No llegó a ser una fuga real (sin sesión,
`auth.uid()` es `null` y no encuentra ninguna fila), pero el aislamiento
no era el que decía el comentario. Se corrigió añadiendo `revoke execute
on function mi_rol() from public;` antes del `grant`. **Cualquier
función nueva que dependa de `auth.uid()` para su seguridad debe llevar
ese `revoke` explícito** — a diferencia de las RPC del enlace-token (que
sí se conceden a propósito a `anon`, porque ellas mismas comprueban el
token dentro del SQL), aquí el permiso de ejecución en sí es parte del
cierre de seguridad.

⚠️ **El envío de emails de Supabase Auth (confirmación, recuperación de
contraseña) tiene un límite de tasa bajo en el plan gratuito** — ya se
alcanzó ("email rate limit exceeded") solo con las pruebas de esta
sesión. Si hace falta dar de alta a varios colaboradores por
autorregistro en poco tiempo, puede hacer falta escalonarlo o configurar
un SMTP propio (p.ej. Resend, ya usado para los avisos) en Authentication
→ Settings → SMTP Settings.

⚠️ **El enlace de confirmación/recuperación de Supabase apunta a la
"Site URL" configurada en Authentication → URL Configuration** — si no
coincide con el dominio real (`https://nexuspoint.rsvp`), el enlace del
email lleva a una URL que no conecta ("Safari no puede abrir..."). Ya
corregido, pero a vigilar si se cambia de dominio en el futuro.

## 2026-08-24: Fase C ampliada (sincronizar email de acceso con avisos) y Fase D (CAPTCHA)

**Se revisó la decisión de Fase C.** La primera versión de "Mi cuenta"
dejaba el email de acceso (login) deliberadamente separado de
`colaboradores.email` (el de los avisos automáticos), para no tocarlo
sin que el anfitrión se enterase. El usuario pidió revisarlo: separado
resultaba confuso (alguien cambia "su email" y sigue sin recibir avisos
importantes). Ahora se sincronizan de verdad, pero sin perder
visibilidad: un trigger nuevo sobre `auth.users`
(`trg_sincronizar_email_colaborador`, disparado tras la confirmación
real del cambio, no al pedirlo) actualiza `colaboradores.email` y deja
una marca (`emailSincronizadoEn`); `ColaboradorCard.jsx` muestra un
aviso con esa fecha hasta que el anfitrión pulsa "Entendido"
(`anfitrion_confirmar_email_colaborador_actualizado`, nueva RPC que solo
borra la marca, nunca el email).

**Fase D (endurecer el login), investigada y cerrada con una acción
concreta.** Se comprobó contra la documentación oficial de Supabase
(no se había verificado antes, solo asumido):
- Supabase Auth **no** trae de fábrica ningún bloqueo tras varios
  intentos fallidos de contraseña en `signInWithPassword` — solo
  límites de tasa por IP en otros endpoints (renovación de token:
  1800/hora con ráfagas de 30; verificación: 360/hora; emails: ~2/hora
  combinado; OTP: 360/hora).
- Sí ofrece CAPTCHA (hCaptcha o Cloudflare Turnstile) en
  signup/signin/password-reset, pero apagado por defecto.
- 2FA (TOTP) está soportado pero exige un flujo de enrolamiento +
  verificación extra en cada login — descartado por ahora: trabajo real
  para un beneficio marginal con 10-15 personas de confianza, no un
  objetivo de alto valor.

**Decisión: activar CAPTCHA (Cloudflare Turnstile), no 2FA.**
Implementado en `VistaLogin.jsx` (entrar/crear cuenta/recuperar
contraseña) — el script de Turnstile se carga en `index.html` (fuera
del árbol de React, `window.turnstile.render(...)` sobre un `<div>`
propio), el token se manda como `options.captchaToken` a
`signInWithPassword`/`signUp` y como segundo argumento
(`{ captchaToken }`, sin envolver en `options`) a
`resetPasswordForEmail` — firmas distintas entre sí, confirmado contra
la documentación de supabase-js antes de escribirlo, para no romper el
login de todo el mundo por un detalle de forma. El token es de un solo
uso y caduca a los pocos minutos: se resetea el widget
(`window.turnstile.reset(widgetId)`) tras cada intento, con éxito o sin
él. Site Key nueva en `.env`/Vercel: `VITE_TURNSTILE_SITE_KEY` (pública,
sin ella el widget simplemente no se pinta ni se exige — no bloquea
clones locales sin configurar). La Secret Key va solo en el dashboard de
Supabase (Authentication → Attack Protection), nunca en el repo.

**Completado y confirmado en producción (mismo día).** El sitio de
Cloudflare Turnstile lo creó el usuario a mano; la Site Key se añadió a
Vercel (`VITE_TURNSTILE_SITE_KEY`, los tres entornos) y el proyecto se
redesplegó, todo ello vía la CLI de `vercel` (login con flujo de
dispositivo, `vercel link`, `vercel env add`, `vercel redeploy`) en vez
de guiar al usuario por un dashboard que había cambiado desde lo que yo
recordaba — la guía inicial por el dashboard le hizo perder el tiempo
más de una vez (menús de Vercel/Supabase distintos a los descritos),
lección ya anotada más abajo. La Secret Key se activó en Supabase por
la **Management API** (`PATCH /v1/projects/{ref}/config/auth`,
`security_captcha_enabled`/`security_captcha_provider`/
`security_captcha_secret` — nombres de campo sacados del OpenAPI real
de `api.supabase.com`, no adivinados) usando un Personal Access Token
de un solo uso que el usuario revocó justo después. Verificado con un
`GET` al mismo endpoint (`security_captcha_enabled: true`) y, ya en
vivo, el usuario confirma ver el check de Turnstile al entrar en
`nexuspoint.rsvp`.

⚠️ **Lección de esta sesión: no dar por buenas instrucciones de
memoria sobre la UI de un dashboard externo (Vercel, Supabase,
Cloudflare...) sin verificarlas antes.** Esas interfaces cambian con
frecuencia; una instrucción equivocada ahí no rompe código, pero le
hace perder tiempo real al usuario dando vueltas por menús que no
coinciden. A partir de ahora: si hay CLI o API oficial disponible,
preferirla y hacerlo directamente (como aquí, con `vercel` CLI y la
Management API de Supabase) en vez de narrar clics; si no queda más
remedio que guiar por un dashboard, comprobar antes la ruta exacta
(documentación oficial o búsqueda reciente) en vez de recordarla.

**Fase G, aparcada a petición del usuario.** Evaluada (ver más arriba
el análisis de coste/beneficio: montar tests de integración de
login/RLS exige un proyecto de Supabase aparte solo para pruebas) y
decidido no abordarla ahora — desproporcionada para 10-15 personas,
con la Fase A todavía pendiente y más urgente de cara a noviembre.
Se retoma si algún día conviene.

## 2026-08-24: examen honesto del código (a petición del usuario) — 5 hallazgos, los 5 arreglados

Petición explícita: "dime el resultado de un examen honrado de la app
si ves fallos reales o redundancia en la estructura o código muerto".
Revisión manual (no solo lint — ver el punto 5) de `useLedgerData.js`,
`App.jsx`, `schema.sql` y una búsqueda de exports nunca importados
fuera de su propio fichero. Se descartaron dos sospechas tras
comprobarlas de verdad (quedan aquí para no repetir la misma
comprobación en el futuro): `anfitrion_guardar_colaboradores` /
`anfitrion_guardar_invitados` usan `set "columna" = excluded."columna"`
columna a columna, no una sobrescritura completa de fila — no hay
riesgo de que un guardado masivo borre una columna nueva que el `insert`
no mencione explícitamente; y la arquitectura login+token en paralelo
en `App.jsx`/`useLedgerData.js` cuadra exactamente con lo ya documentado
más arriba, nada roto ahí.

1. **Código muerto real: `buildLink()` en `lib/url.js`.** Sobrevivía
   desde la Fase B (2026-08-12, retirada del enlace-token de
   colaborador) sin ninguna llamada real en la app — sustituida de
   hecho por `anfitrion_enviar_invitacion_login` +
   `getEmailCrearCuentaFromUrl`, pero nadie borró la función vieja ni
   su test (`url.test.js`), que seguía pasando en verde dando una falsa
   sensación de cobertura real. Eliminada la función y su test.
2. **Redundancia real de estructura: colores duplicados a mano en vez
   de usar `theme.js`.** `#B00020` suelto en `App.jsx` (x2),
   `VistaColaborador.jsx`, `VentanaConfigZonaPeligro.jsx` (x2, una
   dentro de una plantilla de email) y `useLedgerData.js` (la misma
   plantilla de email duplicada por segunda vez, detectado de rebote al
   arreglar esto). `#FBEAEC` suelto en `ColaboradorCard.jsx` y
   `VentanaAvisos.jsx` (x2), y en `VentanaMesas.jsx` con una desviación
   real de un carácter (`#FBEAEA`, visualmente idéntico) — prueba de
   que copiar hexadecimales a mano ya había empezado a desviarse.
   Centralizados en `theme.js` como `C.peligro` y `C.avisoFondo`; los 9
   sitios ahora apuntan al mismo token.
3. **Tres exports que no importaba nadie fuera de su propio fichero:**
   `ANCHO_MAXIMO_PORTADA`, `CAMPOS_DATOS_INVITADO` (se les quitó
   `export`, sin más) y `supabaseConfigurado` — este último sí tenía un
   uso real posible y se le dio: `App.jsx` ahora lo importa y muestra
   una pantalla clara ("Falta configuración") si `.env`/Vercel se
   queda sin las claves de Supabase, en vez del único `console.error`
   de antes (invisible para cualquiera que no abra las herramientas de
   desarrollador) o un "Abriendo el libro de invitados…" infinito sin
   ninguna pista real.
4. **Bug real pero solo en `npm run dev` local, no en producción:** el
   widget de Turnstile (`VistaLogin.jsx`) se montaba con
   `window.turnstile.render(...)` pero su `useEffect` de limpieza nunca
   llamaba a `window.turnstile.remove(...)`. Con `React.StrictMode`
   activo (`main.jsx`), el doble montaje/desmontaje intencional de
   React en desarrollo dejaba dos widgets de CAPTCHA superpuestos sobre
   el mismo `<div>` al probar el login en local (nunca en el build de
   producción real, donde StrictMode no actúa así). Corregido llamando
   a `remove()` en la limpieza.
5. **Por qué nada de esto lo había cazado `npm run lint`:**
   `"no-unused-vars": "off"` en `.eslintrc.json` — ya sabido de antes
   (ver `project_eventos_estado` en la memoria de Claude), pero
   confirma que "lint en verde" nunca ha sido garantía de "sin código
   muerto", solo de "sin referencias a variables inexistentes"
   (`no-undef`). Tras limpiar los puntos 1-3, activar la regla de
   verdad (`"error"`) no generó ni un solo aviso nuevo — se dejó
   encendida para que un `buildLink()` futuro no pueda volver a
   colarse sin que lint lo note.

## 2026-08-25: Tablón público de novedades (v6.3)

Necesidad nueva del usuario: se comunica con los invitados ya
confirmados por un grupo de WhatsApp "tablón de anuncios" (solo
lectura para los integrantes), que va creciendo hasta el número final
de confirmados. Para no saturar ese chat con avisos largos, pidió una
página de la propia web, pública solo mediante enlace, de solo lectura,
con una parte plegable por secciones (las novedades) en vez de un
bloque grande de texto.

**Decisión de acceso (aclarada con el usuario antes de construir):**
UN enlace único (`?tablon=<token>`) para todo el grupo, no uno por
persona — se comparte una sola vez en el propio WhatsApp. Mismo
espíritu de seguridad que el resto de la app: `novedades` es una tabla
completamente cerrada (como `invitados`/`colaboradores`), y el enlace
depende de un secreto propio en su propia tabla cerrada
(`tablon_secreto`) — nunca de una columna en `evento` (que está
abierta a todo el mundo a propósito, sin sensibilidad real).

**Qué se construyó:**
- `schema.sql`: tabla `novedades` (titulo, cuerpo con HTML sencillo
  como las plantillas de email, `publicada`, `creadaEn`), tabla
  `tablon_secreto` (mismo patrón que `anfitrion_secreto`), y 5 RPC —
  lado anfitrión: `anfitrion_obtener_token_tablon`,
  `anfitrion_listar_novedades` (ve borradores también),
  `anfitrion_guardar_novedades` (mismo patrón `set columna=excluded.
  columna` que colaboradores/invitados, `creadaEn` nunca se
  sobreescribe en un `update`); lado público: `tablon_verificar_token`,
  `tablon_listar_novedades` (solo `publicada = true`).
- `useLedgerData.js`: `novedades`/`persistNovedades` (mismo patrón
  optimista de siempre) y `tokenTablon`, cargados solo en la rama
  anfitrión de `cargarDatos`.
- `VentanaNovedades.jsx` (nueva ventana del anfitrión, "Abrir
  sección…"): añadir/editar/borrar novedades, checkbox "Publicada",
  y el enlace público con botón de copiar.
- `VistaTablon.jsx` (nueva, pública): deliberadamente **no** usa
  `useLedgerData` -- no hay rol ni sesión que resolver, solo llama a
  Supabase directo con el token de la URL. `App.jsx` la monta ANTES de
  cualquier lógica de sesión/login en cuanto detecta `?tablon=...` en
  la URL (mismo patrón de "cortar el render pronto" que ya usaba la
  pantalla de "Falta configuración"). Muestra fecha/hora/lugar fijos
  arriba (reutiliza `InfoItem` de `Portada.jsx`) y las novedades como
  acordeón (la más reciente empieza abierta, el resto plegado) con
  refresco cada minuto, igual que el resto de la app.
- `lib/url.js`: `getTokenTablonFromUrl()`, mismo patrón que
  `getRolFromUrl`/`getEmailCrearCuentaFromUrl`.

## 2026-08-25 (mismo día): refuerzos sobre el tablón, tras verlo listo para ~140 personas (v6.4)

**Seguridad del enlace, confirmada (no hizo falta cambiar nada):** las
dos RPC del lado público (`tablon_verificar_token`,
`tablon_listar_novedades`) son `language sql`, sólo `select` — no hay
ningún camino de escritura alcanzable con el token del tablón. La
única superficie de escritura pública que ya existía en el proyecto
(la tabla `evento` abierta a `anon`, documentada arriba en el bloque de
RLS) es anterior a esta función y no cambia por compartir este enlace
— la clave `anon` ya viajaba dentro del JS compilado desde mucho antes.

**Aviso de privacidad** en `VistaTablon.jsx` ("🔒 Enlace privado — no lo
compartas fuera del grupo") — a petición del usuario, al caer en la
cuenta de que compartir este enlace con ~140 personas hacía real el
riesgo de que alguna lo reenviara sin querer.

**Botón "Novedades" + volver, para anfitrión Y colaborador (no solo el
anfitrión).** `Portada.jsx` gana `enlaceTablon` (prop ya calculada por
quien la monta) — como la comparten `VistaAnfitrion.jsx` y
`VistaColaborador.jsx`, hizo falta que un colaborador *logueado* pueda
consultar el token del tablón también: `colaborador_obtener_token_tablon`,
mismo patrón de seguridad que `colaborador_mis_invitados`
(`"authUserId" = auth.uid()`, nunca solo el id suelto). Fórmula del
enlace centralizada en `lib/url.js` (`construirEnlaceTablon`) para que
las dos vistas no puedan desincronizarse copiándola cada una por su
lado. "Volver" es un `<a href="/">` normal (mismo patrón que "No tienes
acceso") — con Supabase Auth persistiendo la sesión en el navegador,
un anfitrión/colaborador con login real vuelve directo a su vista;
solo un invitado sin cuenta (el caso normal para el tablón) acabaría en
el login, que es lo esperado.

**Botón de WhatsApp: al GRUPO, no a un chat 1 a 1.** Pedido inicial
ambiguo ("botón que lo lance al grupo... con mi número de teléfono") —
aclarado con el usuario: un enlace basado en número de teléfono
(`wa.me/...`) abre un chat privado, y con ~140 confirmados eso le
dejaría recibiendo mensajes directos de todos, anulando la figura del
colaborador como intermediario (motivo explícito del usuario). Se
implementó con el enlace de INVITACIÓN al grupo
(`chat.whatsapp.com/XXXX`, se genera desde la propia app de WhatsApp:
grupo → Info del grupo → Invitar mediante enlace) — campo nuevo
`evento.enlaceGrupoWhatsapp`, editable directamente en la ventana
Novedades (no en Configuración: el usuario pidió que viviera ahí,
junto al propio flujo de publicar). El botón resultante NO está en el
tablón público — es un atajo para que el propio anfitrión abra su
grupo y avise "hay novedades nuevas" tras publicar, nunca algo que vea
un confirmado.

**Música ambiental — primer uso de Supabase Storage en este proyecto.**
Hasta ahora toda imagen de la app se guarda como base64 en columnas de
texto (`evento.imagen`, fotos familiares...) porque son pocos KB y no
compensaba montar Storage solo para eso. Un archivo de audio es
demasiado pesado para ese mismo truco, sobre todo porque el tablón
público vuelve a pedir sus datos cada minuto (mismo refresco que el
resto de la app) — guardar el audio en una columna reenviaría varios MB
en cada uno de esos refrescos. Se creó el bucket `musica-ambiental`
(`insert into storage.buckets`, con `public = true` para que el tablón
reproduzca sin login) con 3 políticas sobre `storage.objects`: lectura
pública, subida y borrado solo si `auth.uid()` está en la tabla
`anfitriones` (mismo criterio que `mi_rol()`). `VentanaConfigMusica.jsx`
(nueva, Configuración → Música ambiental) sube/lista/borra pistas;
`VistaTablon.jsx` las reproduce en bucle con un botón flotante.

⚠️ **Los navegadores bloquean el audio automático sin interacción
previa del usuario** — no hay forma de que suene sola de verdad al
abrir la página. Se resolvió con un botón flotante visible (nunca un
intento silencioso de `audio.play()` en el `useEffect` inicial, que
fallaría y podría confundirse con un fallo real) — el primer clic de
cada visitante activa la música a partir de ahí.

**Formato de texto (negrita/cursiva/subrayado) en Novedades**, pedido
a mitad de esta misma sesión: en vez de escribir `<b>`/`<i>`/`<u>` a
mano en el `textarea` (que ya admitía HTML sencillo desde el principio,
igual que las plantillas de email), 3 botones envuelven la selección
actual. Gotcha real evitado: los botones llevan
`onMouseDown={(e) => e.preventDefault()}` — sin eso, pulsarlos le
quita el foco al `textarea` antes de que el `click` llegue a disparar
(se pierde la selección de texto, y el `onBlur` del `textarea` guarda
la versión vieja, sin la etiqueta nueva).

**Miniatura al compartir el enlace (og:image), pedido a mitad de la
misma sesión ("en el link de WhatsApp me gustaría que se viera una
imagen del evento").** Limitación real explicada y resuelta: las
etiquetas `og:image`/`og:title` que lee el rastreador de WhatsApp/
Facebook son **estáticas** — leen `index.html` tal cual, sin ejecutar
React, así que no pueden depender de datos de la base en tiempo real
(y `evento.imagen` tampoco serviría aunque pudieran: es un `data:` URI
en base64, no una URL http). Solución: segundo bucket de Storage
(`og-imagen`, mismas 3 políticas que `musica-ambiental`) con un
**nombre de archivo fijo** (`portada.jpg`, subido siempre con
`upsert: true`) — la URL pública nunca cambia, así que
`index.html` puede tenerla escrita de una vez para siempre y aun así
reflejar la foto más reciente que suba el anfitrión. Nueva sección en
`VentanaConfigDatosEvento.jsx` para subirla (separada a propósito de
"Imagen de portada": esa es base64 en `evento.imagen`, para dentro de
la app; esta es Storage, para fuera).

La URL de Supabase en `index.html` usa la sustitución nativa de Vite
en HTML (`%VITE_SUPABASE_URL%`, rellenado en el build con el valor real
de `.env`/Vercel) en vez de escribirla a mano — verificado leyendo
`dist/index.html` tras `npm run build` para confirmar que Vite la
sustituye de verdad. Así esta plantilla se puede reutilizar en un
evento futuro (con su propio proyecto de Supabase) sin tocar
`index.html`.

⚠️ **Aviso ya dejado por escrito en la propia ventana de Configuración**:
si el anfitrión reemplaza la foto más tarde, un enlace YA compartido
antes puede tardar en actualizarse en WhatsApp — cachean la miniatura
por su cuenta la primera vez que alguien pega el enlace, no en cada
visita. No hay nada que hacer desde este lado del código si eso pasa
(haría falta la herramienta de depuración de Meta/Facebook para forzar
un re-escaneo de esa URL en concreto).

## 2026-08-25 (mismo día, tercera tanda): rediseño de Novedades + ventana de verdad (v6.5)

**Rediseño de la ventana**, a petición del usuario tras verla en uso:
quitado el texto explicativo (ya sabe qué es, lo escribió él mismo),
"Nueva novedad" y "Copiar enlace" pasan a la cabecera (iconos sueltos,
mismo estilo que el botón de cerrar ya existente), el enlace del
tablón deja de mostrarse como texto (solo hace falta poder copiarlo,
no leerlo), y el campo del grupo de WhatsApp baja al pie.

**Ventana de verdad del sistema operativo, no una VentanaFlotante —
primer uso de este patrón en el proyecto.** Pedido explícito: "que
flote fuera del navegador para poder ver todo el texto antes de
enviarlo". Aclarado con el usuario que había dos lecturas posibles
(una VentanaFlotante más grande por defecto, o una ventana real vía
`window.open`) — eligió la segunda, sabiendo que es un mecanismo
nunca usado antes aquí. Implementado en `lib/usePopupWindow.js`:

- `window.open()` + `createPortal` (React 18) sobre un `<div>` creado a
  mano dentro del `document` de esa otra ventana.
- ⚠️ **`abrir()` tiene que llamarse de forma SÍNCRONA dentro del propio
  clic que la dispara** — de ahí que `DesplegableSecciones.jsx` reciba
  la función `abrir` ya lista (subida desde `VistaAnfitrion.jsx`, a
  través de `Portada.jsx`) y la llame directamente como `onClick`, en
  vez de pasar por un `toggle(clave)` + estado + `useEffect` como el
  resto de ventanas — un `useEffect` corre DESPUÉS del evento de clic
  original, y ahí ya no cuenta como "acción directa del usuario" para
  Safari y otros navegadores exigentes con las ventanas emergentes:
  las bloquearían en silencio.
- Los estilos (Tailwind compilado + `index.css`, que a su vez trae la
  fuente de Google Fonts por `@import`) se copian a mano
  (`querySelectorAll('link[rel="stylesheet"], style')` +
  `cloneNode(true)`) al `<head>` de la ventana nueva — sin esto, el
  contenido se vería sin ningún estilo (esa ventana arranca con un
  `document` completamente en blanco, no comparte nada con la
  pestaña).
- Detecta que la persona cierre la ventana a mano (la X del sistema
  operativo) escuchando `beforeunload` — sin esto, `abrir()` pensaría
  que la ventana seguía abierta y no crearía una nueva la próxima vez
  que se pulsara "Novedades" en el menú.
- Como ya no es una VentanaFlotante, `VentanaNovedades.jsx` perdió el
  prop `onCerrar` (no hace falta: la ventana del sistema operativo ya
  trae su propio cierre) y su cabecera propia dejó de ser arrastrable
  (tampoco hace falta: se mueve como cualquier ventana normal).
- `DesplegableSecciones.jsx`: la entrada "Novedades" es un caso
  especial dentro del `.map` de `ORDEN_VENTANAS` — no lleva el
  prefijo "✓ " que sí llevan las demás (no hay ningún estado fiable de
  "¿sigue abierta?" que reflejar ahí: la persona pudo haberla cerrado
  con la X sin que este menú se entere al momento).

Reordenados también los botones de la portada (Cerrar sesión →
Novedades → Mi cuenta, de arriba a abajo) a petición del usuario.

## 2026-08-25 (cuarta tanda): bug real de createPortal entre ventanas + plegado en Novedades

**Bug real reportado por el usuario: los botones de la cabecera
(Enlace/Nueva) de la ventana emergente no respondían.** Causa raíz
confirmada: la primera versión de `usePopupWindow.js` usaba
`createPortal` desde el árbol de React de la pestaña principal hacia
un `<div>` dentro del `document` de la ventana emergente. Esto mueve
DÓNDE se pintan los nodos, pero React engancha su sistema de eventos
sintéticos en el contenedor raíz de la pestaña principal (no en
`document`) -- los clics dentro de la ventana emergente son eventos
nativos de OTRO `document` por completo, y nunca llegan a burbujear
hasta ese escuchador. Resultado: los nodos se veían bien, pero ningún
`onClick` se disparaba nunca.

**Corregido con un `createRoot()` propio** dentro del `document` de la
ventana emergente (en vez de un portal desde el root principal) --
`usePopupWindow.js` ahora expone `actualizar(hijos)`, que llama a
`raiz.render(hijos)` sobre ESE root. `VistaAnfitrion.jsx` la llama
desde un `useEffect` que depende de `data` (y de si la ventana sigue
abierta), para que el contenido se mantenga al día con cada refresco
sin tener que cerrar y volver a abrir la ventana. El estado local de
React (p.ej. qué novedades están plegadas) sobrevive a estos repintados
porque siguen siendo el MISMO componente en la MISMA posición del árbol
-- React reconcilia en vez de desmontar y remontar.

**Plegado por novedad, en las dos ventanas.** El usuario señaló que con
varias novedades escritas, tenerlas todas desplegadas de golpe (tanto
en el editor del anfitrión como, potencialmente, en el tablón público)
sería un muro de texto ilegible. El tablón público (`VistaTablon.jsx`)
YA tenía este acordeón desde que se construyó (la más reciente empieza
abierta, el resto plegado) -- se confirmó que seguía funcionando,
sin necesidad de tocarlo. Lo que sí faltaba era en el propio editor:
`VentanaNovedades.jsx` ahora pliega cada tarjeta por defecto (mostrando
solo título, fecha, y una etiqueta "Borrador" si no está publicada),
con una nueva desplegándose sola al crearla (hay que escribir en ella,
no tendría sentido que naciera plegada).

## 2026-08-25 (quinta tanda): acordeón de una sola + límite real explicado (WhatsApp)

**"Al desplegar una novedad se plieguen las demás"** — el Set de ids
plegables (permitía varias abiertas a la vez) se cambió a un único id
(`idExpandido`/`idAbierto`, `null` si ninguna) tanto en
`VentanaNovedades.jsx` como en `VistaTablon.jsx` — pedido explícito del
usuario, aplicado a las dos ventanas por coherencia (era el mismo
problema de fondo en las dos).

**Botón "Enlace": copiar + abrir grupo, no "enviar".** El usuario pidió
que el botón copiara el enlace, abriera el grupo, lo pegara y lo
enviara. Las dos primeras partes son perfectamente posibles y se
implementaron (`copiarYAbrirGrupo` en `VentanaNovedades.jsx`); las dos
últimas NO lo son y se explicó por qué en vez de fingir hacerlo o
callarlo: ninguna página web tiene ninguna vía para escribir dentro del
cuadro de mensaje de WhatsApp ni pulsar su botón de enviar -- es una
aplicación de otra empresa, sin ninguna API pública para eso (ni
`wa.me` ni `chat.whatsapp.com` lo permiten para un grupo ya existente al
que ya perteneces). El clic queda reducido a "copiar + abrir", dejando
solo un Ctrl/Cmd+V + Enter manual como paso final -- lo más cerca de la
petición original que la propia WhatsApp deja llegar desde fuera.

⚠️ Mismo cuidado que en `usePopupWindow.js`: `window.open(enlaceGrupo)`
se llama ANTES del `.then()` del portapapeles, nunca después -- si se
abriera tras esperar esa promesa, algunos navegadores ya no lo
considerarían una acción directa del clic original y lo bloquearían.

## 2026-08-25 (sexta tanda): bug real -- los buckets de Storage llevaban vacíos desde que se crearon (v6.6)

El usuario reportó que la imagen para WhatsApp no cargaba en la app.
Primera sospecha (equivocada): que seguía entrando con el enlace-token
viejo en vez de login real -- descartada, confirmó que solo usa login.
Segunda comprobación, esta vez por fuera del código: `curl` contra la
API pública de Storage confirmó que **los dos buckets
(`og-imagen` y `musica-ambiental`) estaban completamente vacíos** --
ninguna subida había llegado a completarse nunca, ni siquiera la de
música probada en la sesión anterior. El mensaje de error de la app
era genérico ("No se ha podido subir la imagen. Prueba con otra.") y
no dejaba ver la causa real -- corregido primero para mostrar
`error.message` tal cual (en `VentanaConfigDatosEvento.jsx` y
`VentanaConfigMusica.jsx`), lo que reveló el mensaje real:
**`permission denied for table anfitriones`**.

**Causa raíz real:** las 5 políticas de Storage escritas en la sesión
anterior comprobaban `exists (select 1 from anfitriones a where
a."authUserId" = auth.uid())` DIRECTAMENTE dentro de la propia
política. Pero `anfitriones` es una tabla deliberadamente cerrada
(`revoke all ... from anon, authenticated`, ver la sección de login)
para que solo se pueda leer desde dentro de una función con privilegios
elevados (como `mi_rol()`), nunca por consulta directa -- y una
política de RLS se evalúa con los permisos de la propia conexión
(`authenticated`), no con privilegios elevados. El error no aparecía en
ningún sitio hasta que se mostró `error.message` de verdad: antes de
eso, la subida simplemente "no hacía nada" de cara al usuario.

**Arreglo:** función envoltorio `es_anfitrion()` (`security definer`,
igual que `mi_rol()`), y las 5 políticas pasan a llamarla en vez de
consultar la tabla directamente. **Lección para cualquier política de
RLS futura que necesite comprobar algo contra una tabla cerrada
(`anfitrion_secreto`, `anfitriones`, `config_secretos`...): nunca
consultarla directamente desde la política -- envolverla siempre en una
función `security definer` primero,** exactamente igual que ya se hace
para las RPC normales, y probar la subida real en vivo antes de darla
por buena en vez de asumir que "la política parece correcta" a simple
vista.

## 2026-08-25 (séptima tanda): el botón "Enlace" copiaba lo de antes, no el enlace nuevo

Bug real reportado por el usuario: al pulsar "Enlace" en Novedades y
pegar después, salía un bloque de SQL que había copiado antes para
pegarlo en Supabase -- no el enlace del tablón. Causa: `copiarYAbrirGrupo`
llamaba a `window.open(enlaceGrupo)` ANTES de
`navigator.clipboard.writeText(enlace)`. `window.open()` le quita el
foco a la pestaña (pasa a la ventana nueva del grupo) antes de que
termine de escribirse el portapapeles, y escribir en el portapapeles
sin foco falla EN SILENCIO en la mayoría de navegadores -- sin ninguna
alerta ni error, sencillamente no llega a sobrescribir lo que ya
hubiera copiado antes. Arreglado invirtiendo el orden: el portapapeles
va primero (con el foco todavía en la pestaña), `window.open()`
después -- sigue disparándose de forma síncrona dentro del mismo clic,
así que tampoco lo bloquea ningún navegador por no venir de una acción
directa.

**Lección para cualquier acción futura que combine portapapeles +
`window.open`/navegación:** el portapapeles siempre primero. Cualquier
cosa que pueda robar el foco de la pestaña (abrir una ventana, enviar a
otra URL) debe ir después, nunca antes.

## 2026-08-25 (octava tanda): el reordenado no bastó -- causa raíz de verdad

El reordenado de la tanda anterior no arregló el botón "Enlace" del
todo: el usuario siguió viendo el permiso de "abrir WhatsApp" del
navegador y el portapapeles seguía sin escribirse (con el aviso de
"copia manualmente" apareciendo oculto detrás de la ventana de
WhatsApp).

**Causa raíz de verdad:** este componente vive dentro de una ventana
emergente (`window.open`, ver `usePopupWindow.js`), pero su CÓDIGO
sigue ejecutándose técnicamente en el realm de JavaScript de la
pestaña principal -- ahí es donde el navegador cargó el script la
primera vez, y `createRoot()` solo cambia DÓNDE se pintan los nodos,
no en qué ventana "vive" el código que los genera. El portapapeles del
navegador exige que la ventana que hace la petición tenga el foco de
verdad en ese momento; como quien tiene el foco real es la ventana
emergente pero `navigator`/`window` a secas, dentro de este componente,
siguen apuntando a los globales de la pestaña principal (NO
focalizada), el navegador rechazaba la escritura en silencio -- sin
ningún error, solo dejaba el portapapeles tal cual estuviera antes.

**Arreglo:** `usePopupWindow.js` expone ahora también el propio objeto
`window` de la ventana emergente (`ventana`, en estado además de en la
ref de control interno). `VistaAnfitrion.jsx` se lo pasa a
`VentanaNovedades` como prop, y `copiarYAbrirGrupo` usa
`ventana.navigator.clipboard`/`ventana.open()`/`ventana.prompt()` en
vez de los globales `navigator`/`window` a secas.

**Lección para cualquier cosa nueva que se añada dentro de esta ventana
emergente (o de cualquier otra que se construya así en el futuro) y
que dependa de "qué ventana tiene el foco" (portapapeles, notificaciones,
`window.open` en cadena...): usar siempre el objeto `window` de ESA
ventana, nunca los globales `window`/`navigator`/`document` a secas** --
aunque el código "viva visualmente" en la ventana emergente, sigue
ejecutándose en el realm de la pestaña principal.

## 2026-08-25 (novena tanda): pregunta de acceso al tablón (v6.7)

Petición nueva: "añadirle una capa de protección al enlace por
WhatsApp" -- aclarada como una pregunta con respuesta (no un PIN
suelto) que hay que responder antes de ver nada del tablón, ni
siquiera la fecha del evento.

- `tablon_secreto` gana dos columnas: `pregunta` (pública, hay que
  mostrarla) y `respuestaCorrecta` (nunca sale de la tabla cerrada --
  se compara siempre dentro de una función, igual que el resto de
  secretos de la app).
- `tablon_listar_novedades` cambia de firma (1 → 2 parámetros, con el
  `drop function` de rigor antes -- misma lección de siempre) para
  exigir TAMBIÉN la respuesta correcta, no solo el token: así, alguien
  que llamara a la función directamente sin pasar por la pantalla de la
  pregunta tampoco obtendría datos reales -- la pregunta protege de
  verdad la API, no es solo una pantalla decorativa por delante.
- Comparación case-insensitive y sin espacios de sobra (`lower(trim(...))`
  en las dos partes) pero SÍ sensible a acentos -- documentado en la UI
  para que el anfitrión elija una respuesta sencilla.
- Sin pregunta configurada (`respuestaCorrecta = ''`), cualquier
  respuesta vacía coincide sola -- el tablón no pide nada en ese caso,
  ni hace falta que el anfitrión "desactive" nada a propósito.
- `VentanaNovedades.jsx` gana un campo pregunta+respuesta en el pie,
  encima del enlace de WhatsApp.
- `VistaTablon.jsx`: nuevo estado "bloqueado" -- antes de cargar NADA
  (ni siquiera fecha/hora/lugar), comprueba si hay pregunta configurada
  y, si la hay, si este dispositivo ya tiene una respuesta guardada en
  `localStorage` de una vez anterior (y sigue siendo válida -- si el
  anfitrión cambió la pregunta desde entonces, se descarta y se vuelve
  a pedir). La respuesta ya verificada viaja en cada refresco periódico
  (la RPC la exige en cada llamada), guardada en un `ref` para no
  disparar re-renders de más.
