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
