# Contexto del proyecto para Claude

Este archivo viaja dentro del repositorio (a diferencia de la memoria
personal de Claude Code, que vive en la Mac de cada usuario) para que
cualquier instancia de Claude Code que abra este proyecto — en cualquier
máquina — tenga el mismo contexto de fondo. Actualízalo cuando algo aquí
quede desactualizado; no dejes que se pudra como pasó con el README.

⚠️ **Aquí no hay ninguna sección de "estado actual", y es a propósito.**
Había una y llegó a mentir durante siete semanas (decía "v6.0" con la app
en la v39 y una fecha de boda que ya no existía). La versión vive en
`src/constants.js` y la fecha en la base de datos; una copia aquí se
pudre siempre. Lo mismo vale para "próximos pasos": nace caducando.
**Si algo se presenta como el presente, tiene que salir de donde viva el
dato, no de este archivo.** (Decidido con el usuario el 2026-09-23, al
encontrarla él: *"esto es historia, no una norma, y no aplica"*.)

**Para qué se hizo esta app, que sí es estable:** organizar la boda del
usuario, **y reutilizarla para otros eventos** con pequeñas adaptaciones.
No es de un solo uso — por eso la Zona de Reinicio es una función
permanente y no un SQL de usar y tirar. ⚠️ Tiene una consecuencia legal
que él ya conoce: el día que OTRA persona organice su evento con esta
app, deja de ser una actividad personal suya (ver «Autorizo expresamente
a que guarden mis datos»).

## Idioma

Responder siempre en español al trabajar en este proyecto, salvo que se
pida explícitamente lo contrario.

## Cómo trabajar aquí

Reglas de trabajo que el usuario fijó el 2026-09-23, después de estudiar
en otra sesión cómo evitar que yo divague. **Son sobre CÓMO trabajo, no
sobre cómo es la app** (para eso, las "Normas de estándar" de abajo).

1. **Verificar antes de afirmar.** No usar una función, método, import o
   parámetro que no se haya visto en este código sin abrir el archivo o
   la dependencia y comprobar que existe. Si no se puede comprobar,
   decirlo en vez de suponerlo. No inventar nombres de archivo, rutas ni
   APIs internas: buscarlos primero.
   ⚠️ Ya existía una versión estrecha de esto, solo para paneles
   externos (ver «no dar por buenas instrucciones de memoria sobre la UI
   de un dashboard»). Esta es la general.
2. **Versiones reales, no de memoria.** Antes de sugerir sintaxis o
   comportamiento de una librería, leer la versión instalada
   (`package.json`, lockfile). Si la tarea depende de documentación
   externa o de una API de terceros que pudo cambiar, consultarla en vez
   de responder de memoria.
3. **Concisión.** La mínima extensión necesaria. **Sin resúmenes finales
   salvo que los pida**, sin repetir código que ya está a la vista, sin
   explicar lo obvio. De los cambios de código, solo las líneas que
   importan. (Se suma a lo de siempre: conclusión primero, lenguaje de
   andar por casa, UN solo siguiente paso.)
4. **Evaluación honesta.** Si hay un error, un riesgo o un mal enfoque
   —suyo o mío—, decirlo directamente y por qué, aunque no haya pedido
   revisión. **No estar de acuerdo por defecto.** Señalarlo ANTES de
   implementar, no después.
5. **`lint`, `build` y `test`: los tres, siempre.** No es rutina, cazan
   cosas distintas. `npm run lint` (`no-undef`) pilla una variable que se
   quedó sin importar al mover código — no rompe el build, revienta en el
   navegador la primera vez que alguien toca esa rama. Y `npm run build`
   pilla lo que el lint NO ve: un import traído del módulo equivocado (el
   nombre existe en algún sitio, así que ESLint lo da por bueno; solo
   Rollup comprueba que el módulo de origen lo exporte de verdad). Pasó
   con `calcularEdad` importado de `lib/formato` en vez de
   `lib/invitados`.
6. **Comprobar los cálculos.** En cálculos, algoritmos de varios pasos o
   lógica condicional enredada, ejecutarlo o repasarlo paso a paso antes
   de darlo por bueno.

⚠️ **Descartado a propósito, no olvidado:** su borrador traía un punto 6,
llevar las decisiones a un `DECISIONS.md`. Se descartó el mismo día, de
acuerdo con él: **este archivo ya hace ese trabajo**, y dos archivos
contando lo mismo acaban contando cosas distintas — el problema que
ya nos costó tres arreglos (los rojos copiados a mano, los trece tamaños
de letra, la paleta del mapa). Traía también usar `TodoWrite`, que no
está disponible en esta sesión.

## Normas de estándar de la app

Lo que el usuario ya ha fijado como norma, recogido en una lista a
petición suya el 2026-09-18. **Repasarla antes de construir o retocar
cualquier pantalla.** El detalle y el porqué de cada una está más abajo,
en la sección que se indica entre paréntesis.

1. **"Estandarizar" es con SU modelo.** El estilo que él nombra o el que
   ya está aprobado en esa pantalla; nunca uno elegido por mí. Si no está
   claro cuál es, preguntar en una línea ANTES de tocar el aspecto. En Mi
   cuenta cambié el estilo por mi cuenta tres veces (v34.5-34.7) hasta
   preguntar. («Regla de la app: ventanas lo más pequeñas posible»)
2. **Ventanas tan pequeñas como su contenido.** Del ancho de un móvil en
   vertical, también en el ordenador. `ModalFlotante` acepta `ancho`.
   (misma sección)
3. **Todo al alcance del pulgar QUE ELIJA CADA UNO.** Desde la v35 cada
   persona elige mano en su móvil, y **la app entera se acomoda a esa
   elección**: esa es la norma, no "a la derecha". La derecha es solo lo
   que se ve por defecto.
   En la práctica: todo lo que se pulsa se alinea al lado del pulgar y
   lleva SIEMPRE su espejo `zurdo:` (`justify-end zurdo:justify-start`,
   `items-end zurdo:items-start`...). Sin el `zurdo:`, la elección no se
   aplica y el botón se queda donde caiga.
   ⚠️ Vale para CUALQUIER cosa pulsable, no solo para los botones de una
   ventana: se rompió el 2026-09-21 con un link metido dentro de un
   aviso. («El pulgar: la regla y cómo funciona»)
4. **Botones del mismo grupo, todos iguales y del ancho del texto más
   largo.** En Mi cuenta el modelo es el de inicio: copia exacta de las
   filas de "Abrir sección…" (`FilaMenu`), pastilla verde, letra dorada,
   icono de 19 a la izquierda, ancho `ANCHO_FILA_MENU` importado (no
   copiado). Ningún rótulo más largo que "Mapa del sitio". **Si se añade
   un botón, se abrevia el rótulo; no se ensancha el botón.** Margen
   derecho tan justo como el izquierdo. En otra pantalla, el modelo es el
   que ya esté aprobado en ella (norma 1).
5. **Los textos de ayuda, al pie de la ventana y plegados** (`<details>`),
   no en medio de los botones ni del formulario.
6. **Todo plegado y una sola cosa abierta**; en el móvil lo abierto es el
   protagonista y lo demás se esconde. («Filosofía de UX: todo plegado y
   una sola cosa abierta»)
7. **Tablas: una sola línea por fila**, todas de la misma altura; si no
   cabe, se ensancha o se recorta, nunca dos líneas. («Tablas: una sola
   línea por fila…»)
8. **Una sola pieza, no sincronizar**: si dos partes tienen que coincidir
   siempre, comparten componente o constante; no se miden por separado
   para igualarlas.
9. **Toda ventana nueva es una `VentanaFlotante`**; si una crece mucho,
   ventana lanzadora pequeña + una ventana por parte. («Toda UI nueva usa
   `VentanaFlotante`»)
10. **La Lista de invitados es la raíz**: una vista que solo reordena lo
    que la lista ya muestra va dentro de la lista, no aparte. («La Lista
    de invitados es la raíz…»)
11. **Piezas compartidas**: botones comunes con `Boton` (principal /
    secundario / peligro, con relieve 3D al pulsar); fotos con `HuecoFoto`
    (16:9, mismo marco). Los lenguajes propios ya aprobados (pastilla de
    inicio, mando de música) se respetan tal cual. Los iconos sueltos de
    las tablas YA NO son excepción desde la v36: van con `Boton`.
    («Accesibilidad de los botones…»)
12. **Todo quitar o borrar pregunta antes**, en la ventana de la app
    (`usePreguntaSeguridad`), nunca con `window.alert`/`window.confirm`
    (en las ventanas emergentes rompen). («Relieve, clic y pregunta de
    seguridad»)
13. **Lo que se PULSA lleva relieve; lo que es un LINK va subrayado.**
    Son dos cosas distintas, no una norma con una excepción:
    - **ACCIÓN sobre los datos** —guardar, borrar, confirmar, abrir una
      ventana— → `Boton`: relieve, se hunde al tocarlo, clic suave y
      vibración (v36). Incluye desplegables y títulos plegables.
    - **LINK, que te lleva a otro sitio** —otra pantalla del login, otra
      web— → `EnlaceTexto`: **subrayado, en gris suave**. Es el
      **estándar de internet**: lo que cualquiera reconoce al verlo y lo
      que un desarrollador espera encontrar. Por eso se respeta tal cual,
      sin inventar nada.
    Nada de texto subrayado para una ACCIÓN, y nada de pastilla con
    relieve para un LINK. Una sola pieza para los dos usos, en
    `components/Boton.jsx`. `EnlaceTexto` lleva `py-2` aunque se vea como
    texto: en el móvil un link fino se falla.
    ⚠️ Escrita así el 2026-09-23, porque la versión anterior decía "nada
    de texto subrayado" y tres líneas después admitía el subrayado como
    excepción. Lo vio él: **una norma que se contradice no es una norma.**
    («Dos clases de permiso, no una»)
14. **Quitar/borrar = `BotonQuitar`**: el mismo círculo rojo en toda la
    app, 24 px a la vista y 44 px de zona de toque (el mínimo del móvil).
    X = quitar; papelera (`borrar`) = se borra para siempre. Lleva la
    pregunta dentro.
15. **Antes de dar por hecho un cambio de aspecto, pedir una captura
    real**, mejor del móvil.
16. **MODELO A SEGUIR para los datos (el usuario, 2026-09-19: "una mejora
    sustancial, práctica y para anotar como modelo a seguir").** Lo que en
    la vida real va junto (una pareja, una familia), la app lo mantiene
    junto SOLA, sin depender de que alguien se acuerde:
    - un dato compartido vale para todos (el año de boda de la pareja);
      una acción sobre uno se aplica a todos (la mesa de la familia);
    - UNA sola definición de "familia"/"pareja" para toda la app
      (`lib/mesas.js`, `lib/matrimonios.js`), nunca una copia por pantalla;
    - si la regla no se puede cumplir entera, no se hace a medias: no se
      toca nada y se avisa con la cifra concreta ("son 4 y quedan 2
      sitios"), en una ventana que se vea;
    - si quien escribe puede ser un colaborador que solo guarda una ficha,
      la regla va en la BASE (trigger), no solo en la pantalla;
    - lo que ya estaba mal de antes lo encuentra la Revisión; no se
      "arregla" a escondidas;
    - las excepciones que marca el usuario quedan fuera por diseño (el
      hijo mayor con otro apellido es otra familia);
    - ⚠️ y hay reglas del usuario POR ENCIMA: cada colaborador lleva un
      número parecido de invitados, **entre 10 y 12**, para igualar el
      trabajo y el dinero a recoger ("el mismo peso de responsabilidad").
      Por eso un matrimonio PUEDE tener dos colaboradores distintos
      (también cuando solo uno de los dos es colaborador, o los dos). No
      avisar de eso ni "juntarlos" (decidido el 2026-09-19);
    - y la regla lleva sus pruebas automáticas.
    Ante un dato nuevo, preguntarse: ¿debería ir junto con el de alguien
    más? («Una familia no se separa en las mesas», «El año de boda,
    compartido entre los cónyuges»)
17. **Los valores del acabado salen de `theme.js`, nunca a mano.** Tamaño
    de letra (`T`), redondeo (`R`), sombra (`S`) y opacidad (`OP`). Un
    número suelto pone en rojo `src/theme.test.js`. Si de verdad hace
    falta uno que no está, se añade a la escala, no al sitio; la única
    salida es marcar la línea con `escala-libre:` y el motivo al lado, y
    es para lo que no es ni caja ni texto. El aire (`AIRE`) va en
    tarjetas, paneles y formularios, **nunca en las filas de las
    tablas** — ahí mandan las normas 7 y 8. («El acabado, con una escala
    y no a ojo»)

## Sesión del 2026-08-12: Modo Pruebas, seguridad, acuse en PDF, y repaso visual

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

Regla del reparto de `VistaAnfitrion.jsx` (agosto 2026), y sigue en pie:
**si la lógica de una ventana no la usa nadie más, vive entera en su
propio fichero** bajo `src/vistas/anfitrion/`. **Si la comparten dos o
más ventanas, se queda en el cascarón** (`VistaAnfitrion.jsx`) y se pasa
como prop — nunca duplicada. Hoy comparten de verdad
`asignarColaborador`, `ocupacionMesa`, `panelFlotante`, `filtros` y el
motor de invitaciones; nada más.

Una errata de UN carácter en el email de un colaborador pasó varios días
sin detectarse — simplemente no le llegaban los avisos, y nada lo decía.
De ahí el botón **"Probar"** junto al email de cada colaborador: envía
uno de prueba al momento. ⚠️ Y la regla al depurar un envío: mirar
primero el historial "Avisos enviados" (`avisos_enviados`) y, si hace
falta, los logs de Resend. **No dar por roto el código de envío sin
descartar antes la configuración o la plantilla.**

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
SQL nuevo: decirle que abra una **pestaña nueva** del editor y
pegue ahí. Una pestaña nueva nace vacía siempre — el usuario lo señaló
el 2026-09-06, harto de leer "borra todo el contenido" en cada tanda. El
aviso de borrar solo tiene sentido si se REUTILIZA una pestaña ya usada,
que es justo lo que pasó aquel día. Para diagnosticar "function is not unique" con
certeza, esta consulta lista las firmas reales que existen de verdad en
la base de datos (más fiable que mirar el código fuente, que solo dice
lo que *debería* haber):
```sql
select p.oid::regprocedure as firma
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'nombre_funcion' and n.nspname = 'public';
```

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

Cualquier código nuevo que necesite "el email de un invitado" (no solo
mostrarlo, también para decidir si puede enviársele algo) tiene que
mirar los dos sitios, nunca solo `invitado.email` — si esa persona es
además la única de su unidad familiar, no hay ningún otro miembro al que
recurrir como alternativa. Ver `emailDeInvitado()` y
`destinatarioConEmail()` en `VistaAnfitrion.jsx` (ventana Invitaciones,
detectado y corregido el 2026-08-08 al probar la Fase 4 Ronda 1) —
mismo patrón a seguir si aparece otro sitio que necesite esto.

**2026-08-12: enlace-token retirado para colaboradores (Fase B resuelta
a medias).** En pruebas en vivo se confirmó que un colaborador seguía
pudiendo entrar con su enlace `?rol=...` antiguo aunque ya tuviera
cuenta — el enlace nunca dejó de "funcionar" de verdad, solo dejó de
ser el camino recomendado. Las 6 RPC `colaborador_*` ahora exigen
además `"authUserId" = auth.uid()`: sin sesión real (el caso del enlace
viejo), `auth.uid()` es `null` y no coincide con nada, así que esas
funciones dejan de devolver datos — el enlace-token de colaborador ya
NO funciona, solo el login. El enlace del **anfitrión** no se tocó
(entonces se dejó válido a propósito, como plan B — ⚠️ RETIRADO el
2026-09-06, ver v24.2 al final de este archivo) — su seguridad nunca
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

## 2026-08-24: Fase C ampliada (sincronizar email de acceso con avisos) y Fase D (CAPTCHA)

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

⚠️ **Aviso ya dejado por escrito en la propia ventana de Configuración**:
si el anfitrión reemplaza la foto más tarde, un enlace YA compartido
antes puede tardar en actualizarse en WhatsApp — cachean la miniatura
por su cuenta la primera vez que alguien pega el enlace, no en cada
visita. No hay nada que hacer desde este lado del código si eso pasa
(haría falta la herramienta de depuración de Meta/Facebook para forzar
un re-escaneo de esa URL en concreto).

## 2026-08-25 (mismo día, tercera tanda): rediseño de Novedades + ventana de verdad (v6.5)

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

**Lección para cualquier cosa nueva que se añada dentro de esta ventana
emergente (o de cualquier otra que se construya así en el futuro) y
que dependa de "qué ventana tiene el foco" (portapapeles, notificaciones,
`window.open` en cadena...): usar siempre el objeto `window` de ESA
ventana, nunca los globales `window`/`navigator`/`document` a secas** --
aunque el código "viva visualmente" en la ventana emergente, sigue
ejecutándose en el realm de la pestaña principal.

## 2026-08-25 (novena tanda): pregunta de acceso al tablón (v6.7)

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

**Mismo problema de fondo, otra vez: `window.alert()` dentro de la
ventana emergente.** El usuario reportó que al guardar la pregunta
saltaba "no se ha podido guardar" y la ventana se quedaba "en bucle",
sin dejar escribir. Causa: `persistPreguntaTablon` (useLedgerData.js)
usaba el `avisar()` compartido de siempre, que llama a `window.alert()`
a secas -- mismo problema que el portapapeles de la tanda anterior:
el `window` al que apunta es el de la pestaña principal, no el de la
ventana emergente donde de verdad se estaba escribiendo, y al ser una
llamada BLOQUEANTE, colgaba la ventana hasta encontrar y cerrar una
alerta que podía ni siquiera verse bien. Arreglado quitando el
`window.alert()` de `persistPreguntaTablon` por completo (ahora
devuelve `true`/`false`, solo hace `console.error` si falla) --
`VentanaNovedades.jsx` muestra el aviso como texto normal dentro de su
propia interfaz, sin ningún diálogo nativo de por medio. **Regla ya
consolidada para cualquier cosa nueva dentro de esta ventana emergente:
nunca `window.alert()`/`window.confirm()`/`window.prompt()` a secas --
ni un mensaje de error debe depender de un diálogo nativo del
navegador, que siempre corre el riesgo de apuntar a la ventana
equivocada.**

**Tercer bug real de la misma tanda: el propio guardado borraba lo que
se estaba escribiendo al lado.** El usuario lo describió bien una vez
se le pidió explicarlo despacio: "el guardado automático nos traiciona,
al saltar de la ventana pregunta a la de respuesta guarda pero no me
da tiempo a escribir la respuesta". Causa: `pregunta`/`respuesta`
(y también `enlaceWhatsapp`, mismo patrón) se inicializaban con
`useState(prop)` PERO además llevaban un `useEffect` que los
volvía a copiar cada vez que la prop cambiaba. Secuencia real: se sale
del campo "pregunta" (onBlur) → se guarda con la `respuesta` de ESE
momento (la vieja, antes de tocarla) → eso actualiza `data` en el hook
→ `VistaAnfitrion.jsx` repinta la ventana entera (mismo mecanismo de
`actualizar()` de siempre) → el `useEffect` de sincronización se
dispara con la prop ya actualizada → sobrescribe el campo "respuesta"
justo cuando la persona empezaba a teclear en él. Arreglado quitando
esos `useEffect` de sincronización sin más: se inicializan una sola
vez al montar y se guardan al salir del campo (`onBlur`), igual que ya
hacía `NovedadCard` sin este problema. **Lección para cualquier campo
de texto nuevo dentro de esta ventana (o de cualquier otra que se
repinte a sí misma tras guardar): NUNCA "recopiar desde la prop" con un
`useEffect` en cada cambio -- inicializar solo al montar** (con
`useState(prop)`, sin más), o el propio guardado puede acabar
borrando lo que la persona esté escribiendo al lado.

**Cuarto bug de la misma tanda -- este sí de fondo, no de la ventana
emergente: `anfitrion_guardar_pregunta_tablon` fallaba SIEMPRE.**
Confirmado probando la función directamente por `curl` (con un token
falso, para comprobar solo que existe sin necesitar el de verdad): la
función SÍ existía (la migración se había pegado bien), así que el
fallo tenía que estar dentro de su propio cuerpo. Causa: su
`update tablon_secreto set ...` no llevaba `WHERE` -- y este proyecto
tiene activada la protección real contra `UPDATE`/`DELETE` sin filtro
(ver la regla "Supabase exige WHERE en todo UPDATE/DELETE" más arriba
en este mismo archivo, ya documentada desde el 2026-08-12 por el mismo
motivo en las funciones de Modo Pruebas) -- se me olvidó aplicarla
aquí. Arreglado añadiendo `where true` (mismo criterio que el resto de
funciones de esta app que tocan una tabla entera a propósito).
**Lección que ya estaba escrita y aun así se repitió: cualquier
`UPDATE`/`DELETE` nuevo sin una condición real por columna necesita
`where true` desde el principio, no esperar a que falle en
producción.**

## 2026-08-25 (undécima tanda): FAQ vs Novedades como etiqueta, no como secciones separadas (v6.8)

`novedades` gana `"esNovedad"` boolean (default `false` -- FAQ es el
caso mayoritario). `anfitrion_guardar_novedades` actualizada para
incluirla tanto en el `insert` como en el `on conflict do update`
(mismo patrón que las demás columnas). Checkbox nuevo en
`VentanaNovedades.jsx` ("Marcarla como NOVEDADES") + la misma etiqueta
visual (fondo verde tinta si es NOVEDADES, contorno neutro si es FAQ)
en el editor y en `VistaTablon.jsx`, delante del título -- se ve igual
plegada que desplegada.

## 2026-08-25 (decimotercera tanda): tres permisos más (v6.10)

**Ninguna de las tres ventanas nuevas es una ventana emergente** (a
diferencia de Novedades) -- son `VentanaFlotante` normales, dentro de
la propia pestaña del colaborador, con `useState` locales en vez de
`usePopupWindow.js`. Evita a propósito reintroducir toda la clase de
bugs de "ventana equivocada" (portapapeles, `window.alert`...) de las
tandas anteriores: `window.confirm()` (la pregunta del dinero) funciona
sin problema aquí porque el código y el usuario comparten de verdad la
misma ventana del navegador.

## 2026-08-26: esquema de versionado corregido (entero.decimal, sin el "6." fijo)

"Versión 6.10 es 7" (petición del usuario) se interpretó primero como
"a partir de ahora, cada cambio sube un número entero" -- mal: eso
disparó `VERSION_APP` de 7 a 13 en una sola sesión, un entero por cada
ajuste pequeño (texto, orden, un detalle visual), cuando la intención
real era mucho más simple: **dejar de anteponer un "6." fijo a todo**,
no abandonar los decimales.

**Esquema correcto, confirmado con el usuario:** un número entero por
cada tema/funcionalidad nueva de verdad (como antes: Cronograma,
Logística...), y un decimal detrás para cada ajuste posterior sobre ESE
mismo tema (8, 8.1, 8.2... hasta que llegue el siguiente tema de
verdad, que pasa a 9). Exactamente el mismo criterio que ya usaba el
antiguo esquema "6.x" -- solo cambia que el número entero ya no lleva
un "6." delante fijo.

`HISTORIAL_VERSIONES` (`VentanaVersiones.jsx`) se renumeró para
reflejar esto: la ventana "Logística" y sus 3 retoques posteriores, que
habían recibido enteros 10/11/12/13 por error, pasaron a ser 9/9.1/9.2/9.3.
**Antes de subir `VERSION_APP` en cualquier cambio futuro, preguntarse
si es un tema nuevo (entero) o un ajuste sobre uno ya en curso
(decimal) -- nunca subir el entero por defecto.**

## Ventana "Aniversarios" y las fotos fuera de la base (2026-09-17, v30)

Regla nueva y la más importante de esta tanda. Serán ~100 fotos (50
matrimonios x 2). Guardadas como texto en una columna, la app se las
descargaría TODAS en cada apertura -- también en el móvil y con el wifi
del local el día del evento. En `fotos_familiares` solo va la RUTA;
el archivo vive en el cubo cerrado `fotos-matrimonios`
(`lib/fotosAlmacen.js`), ajustado al subirlo para caber en 1920x1080 sin
recortar ni deformar (hasta v30.8 se limitaba el lado largo a 1080, poco
para proyectar). Las miniaturas de Aniversarios son 16:9 con
`object-fit: contain`: el usuario pasará todas las fotos a 16:9 antes de
subirlas, y si alguna no lo está se ve con bandas, como aviso.

⚠️ La mitad de boda TODAVÍA es base64: el formulario del colaborador
sigue guardando un `data:` URI en `fotos_familiares.url`. Está a medias
a propósito (nadie ha subido ninguna aún, la tabla está vacía), pero hay
que terminarlo antes de que los 12 colaboradores empiecen a subir: 48
fotos en base64 son ~20 MB en cada apertura de la app.

La regla dice que una vista que solo reordena es un duplicado, y la
ventana "Matrimonios" se quitó en septiembre justo por eso. Esta no
reordena: es una zona de TRABAJO para cargar ~50 fotos a lo largo de
semanas. El usuario descartó explícitamente las dos alternativas que se
le propusieron -- un panel dentro de la celda de la lista ("mucho lío") y
soltar la carpeta entera de golpe con los archivos renombrados ("tengo
que escogerla, ubicarla"). Quería una lista con el apellido y el nombre
del cabeza de familia, y pinchar y subir. Eso es lo que hay.

El contador 0/1/2 en una columna de la Lista de invitados fue idea suya y
sigue pendiente; se dejó fuera para no meter dos cosas a la vez.

Confirmado por el usuario punto a punto (A sí, B sí, C sí, D sí) y
construido. El flujo real:
1. El colaborador sube la foto de boda ORIGINAL en su formulario.
2. El anfitrión descarga todas las originales en Aniversarios.
3. Las pasa por OTRA IA especializada, que las monta en una plantilla ya
   diseñada con el año de boda. Se probó con Claude y no respeta las caras:
   no volver a ofrecerlo.
4. Sube la terminada desde la vista grande de la columna Boda.

- **Hoja de encargo** (v31.1): dentro del mismo ZIP, un `Hoja de
  encargo.txt` con un bloque redactado por foto (nombres, año de boda,
  años que cumplen) para copiar y pegar en ChatGPT. ⚠️ Regla del usuario:
  **solo se incluye si los datos están COMPLETOS** -- con un año a medias
  la instrucción saldría mal y el fallo se repetiría en las 48. Si falta
  algo, la app dice quiénes y ofrece bajar solo las fotos.

Pendiente de comprobar por el usuario: si al pedirle a ChatGPT que
devuelva la imagen **como archivo con un nombre exacto** el nombre llega
intacto. Si llega, merece la pena montar la subida EN BLOQUE de las
terminadas (emparejando por nombre); si no, se quedan una a una.

⚠️ A día de hoy los 48 matrimonios están "sin año" en la Lista de
invitados: lo rellena el colaborador junto con la foto.

**El año de boda, compartido entre los cónyuges (2026-09-19, v36.2)**.
Lo cazó el usuario: la foto de boda es POR FAMILIA (`fotos_familiares`),
así que al subirla en la ficha de un cónyuge aparece en la del otro; el
año, en cambio, es una columna de CADA invitado (`invitados.anioBoda`), y
el otro se quedaba sin año o con uno distinto. `matrimoniosDeInvitados`
tapaba el hueco con `primeroNoVacio(esposo, esposa)`, pero el contador
"datos X de Y" y la columna de la lista seguían viendo el vacío, y con
dos años distintos ganaba el del esposo sin avisar.
- Arreglo en la BASE, no en la pantalla: el colaborador guarda UNA ficha
  cada vez (`colaborador_guardar_invitado`), y su cónyuge puede ni estar
  en su lista. Trigger `invitados_anio_boda_pareja` →
  `trg_igualar_anio_boda_pareja()`: al cambiar el año de un esposo/esposa
  se copia al otro de la misma familia (mismo criterio de familia que
  `lib/matrimonios.js`). Si alguien se estrena como cónyuge sin año, toma
  el de su pareja. Borrar el año lo borra en los dos.
- ⚠️ Los valores guardados son "esposo"/"esposa"; la O y la A son solo lo
  que se ve en la lista.
- Relee la fila en vez de fiarse de NEW: en el guardado de muchas filas
  del anfitrión, otra pasada del mismo trigger puede haberla cambiado ya.
  `pg_trigger_depth() > 1` corta la cadena de su propia copia.
- Se descartó mover el año a `fotos_familiares` (lo más "una sola pieza"):
  obligaba a cambiar ~8 archivos que leen `g.anioBoda` a diez semanas de
  la boda. La regla de la base garantiza lo mismo: siempre iguales.
- `useLedgerData.js`: tras guardar un cambio de año, el colaborador
  recarga su lista para que la ficha de la pareja lo enseñe al momento.
- SQL dado al usuario el 2026-09-19, con un arreglo de una vez (rellena
  el año que falte con el de la pareja, sin generar avisos) y una consulta
  que lista las parejas con dos años DISTINTOS, si las hubiera.
- **Ejecutado y probado por el usuario el 2026-09-19**: con la primera
  pareja, antes del SQL el año estaba solo en uno; después, en los dos.

### Accesibilidad de los botones: paso 1 hecho, paso 2 pendiente (2026-09-17)

- **12 combinaciones distintas** de tamaño/padding/redondeo escritas a
  mano; solo 39 llevan `.boton-3d`. **No existe un componente `Boton`.**
- **0 `aria-label`** y **0 reglas de foco** en todo el CSS.
- Objetivos táctiles por debajo de 44px (la papelera de Aniversarios, 19px).

**Paso 1 (hecho, v31.3)** -- sin ningún cambio visual:
- Regla global `:focus-visible` en `index.css` (aro dorado; verde dentro
  del cuerpo claro de las ventanas). `:focus-visible` y no `:focus`, para
  que el aro no salga al hacer clic con el ratón.
- `aria-label` en los 24 botones de solo icono: 21 copiados de su `title`
  por script, y 3 que estaban mudos etiquetados a mano (eliminar invitado
  en la lista, y los dos saltos del reproductor de música).

⚠️ Si el usuario dice que "el tabulador no pasa por los botones": es
**Safari**, que de fábrica solo tabula entre campos de texto (Ajustes →
Avanzado → "Pulsar Tab para resaltar cada elemento"; o Opción+Tab). No es
un fallo de la app -- comprobarlo antes de tocar nada.

**Paso 2 (hecho el 2026-09-17, v31.5)**: `components/Boton.jsx`, con tres
variantes (principal / secundario / peligro), dos tamaños (normal /
pequeno), soporte de icono y de fondo oscuro. Da de serie el relieve, el
aro de foco, el estado desactivado y el `aria-label` de los botones de
solo icono (avisa por consola en desarrollo si falta el `titulo`).
`estilosBoton()` se exporta aparte para las etiquetas `<label>` que
disparan un `<input type="file">` y no pueden ser `<button>`.

⚠️ Al migrar se perdió el texto de 3 botones por un `\1` que no era una
sustitución de verdad (se escribió literal). Se recuperó del diff. Si se
vuelve a migrar algo en bloque: comprobar el diff, no solo que compile.

Aniversarios (v30.6) pega su cabecera de columnas al borde de arriba del
cuerpo de la ventana, que lleva `p-4`. Con `top: 0` quedaba una rendija
de 16px al desplazar: el navegador inmoviliza respetando el relleno del
contenedor. Lo que funciona: márgenes negativos de `-16px` (arriba y a
los lados) y `top: -16`. **Confirmado por el usuario en pantalla real el
2026-09-17** ("scroll perfecto"). Mismo truco para cualquier cabecera
fija que se monte dentro de una VentanaFlotante normal.

## Pendiente: hacer el mapa del sitio privado de verdad (aparcado el 2026-09-16)

Decisión del usuario, después de una conversación larga: **para él la
imagen del mapa es un dato a ocultar, igual que los datos personales.**
Hoy no lo es -- `public/mapa-de-la-aplicacion.png` lo sirve la web a
cualquiera con la URL, y el permiso `mapa_sitio_ver` solo decide si se
enseña el enlace. Aparcado por hoy, no descartado.

⚠️ **Decisión firme del 2026-09-20: se queda como está.** El usuario:
*"lo dejamos como está hasta que vuelva a preguntar"*. No volver a
sacarlo en las listas de pendientes ni ofrecerlo como siguiente paso —
lo retomará él cuando quiera. Lo de abajo es el porqué, para no tener
que reconstruir la conversación si algún día vuelve.

### Por qué costó entenderlo (y cómo se explicó al final)

El usuario razonaba que si hay login, lo de dentro está protegido. Lo que
funcionó no fue la metáfora, fue la demostración: pedirle que abriera
`https://nexuspoint.rsvp/cabecera-defecto.jpg` sin sesión (se ve), y
enseñarle la respuesta real de la base a `select` sobre `invitados` sin
token (`permission denied for table invitados`). La frase que cerró el
asunto: **el navegador se descarga la app entera, imágenes incluidas,
antes de preguntarte quién eres; la lista de invitados no viene en esa
descarga, la app la pide después.** Guardar por si vuelve a salir.

### El bloqueante de verdad: el repositorio es público

`github.com/espectante73/eventos` es **público** (comprobado el
2026-09-16 por la API de GitHub). Mientras siga así, esconder la imagen
en la app no sirve: se ve en GitHub. Y las versiones ya subidas **quedan
en el historial de commits** aunque se borre el archivo de hoy -- por eso
la respuesta no es un `git rm`, es la visibilidad del repositorio.

⚠️ No empezar por el código. El primer paso es del usuario y está sin
hacer: Settings -> Change repository visibility -> Private. Vercel sigue
desplegando igual desde un repo privado. Efecto colateral a recordarle:
para enseñárselo al desarrollador que se ofreció a revisarlo habrá que
invitarle como colaborador.

### Plan, cuando se retome

1. Repositorio a privado (usuario).
2. Cubo **privado** `mapa-sitio` en Supabase (`public` = false), con
   política de SELECT para `es_anfitrion() or
   colaborador_tiene_permiso('mapa_sitio_ver')`. Es lo que convierte la
   casilla en un candado de verdad en vez de un adorno del menú.
3. Subir el PNG al cubo (arrastrar desde el panel de Supabase).
4. `MapaSitio.jsx` deja de usar la ruta fija y pide un enlace temporal
   (`createSignedUrl`); mientras carga, un "cargando"; si el servidor
   dice que no, un mensaje claro en vez de una imagen rota.
5. Sacar el PNG de `public/` y devolver `scripts/dibujar-mapa.mjs` a una
   carpeta que no sirva la web. Ojo: `scripts/dibujar-mapa.test.js` no se
   entera de esto (compara listas, no rutas), pero el comentario de
   cabecera de los dos archivos cita la ruta y hay que actualizarlo.
6. Regenerar y volver a subir el PNG pasa a ser un paso manual más. Vale
   la pena decírselo antes de empezar.

### La casilla se queda como está (decidido el 2026-09-17)

Se le ofreció al usuario quitar "Ver el mapa del sitio" de
`lib/permisos.js` o cambiarle el texto, porque tal como está parece un
candado y solo decide si se enseña el enlace. **Dijo que la deja como
está.** Decisión tomada con la información delante: no volver a
proponerlo.

## "Mapa del sitio" en Mi cuenta, con permiso propio (2026-09-16, v29)

⚠️ Este permiso **no existe en `schema.sql`**, a diferencia de los otros
tres. Solo decide si se enseña un enlace; la imagen la sirve la web a
cualquiera que sepa la URL, así que no hay nada que comprobar en la base
de datos y `colaborador_tiene_permiso` no lo mira nunca. No es un
descuido: es la primera clave de la app que es solo de pantalla.

## El plano de la app no se regenera solo: hay un test que vigila (2026-09-16)

El test NO comprueba que la imagen esté regenerada, solo que las listas
coinciden. Cuando se ponga en rojo: arreglar el script y luego
`npm i -D canvas --no-save && node scripts/dibujar-mapa.mjs`.

## El Modo Pruebas no guardaba Novedades (2026-09-17)

Lo cazó el usuario preguntando si la lista de tablas de la foto seguía al
día: *"hablas de 8 tablas y eso parece de hace más de un mes"*. Tenía
razón a medias, y la mitad que tenía era la importante.

**Lo que estaba bien**: la foto se guarda con `jsonb_agg(fila entera)` y
se repone con `jsonb_populate_recordset`, así que las COLUMNAS nuevas
entran solas (urlAniversario, urlBodaFinal, presente, cortinillaRealce…).
Por ahí no había agujero.

**El agujero**: `novedades` se creó en v6.3, DESPUÉS del Modo Pruebas, y
nunca se añadió a la foto. Lo que se escribiera o borrara en el tablón
durante una prueba se quedaba así al salir. Corregido: entra en la foto y
se repone al desactivar.

⚠️ Quedan fuera A PROPÓSITO, y conviene no "arreglarlo" sin pensar:
- `historial_texto` y `tablon_accesos`: son registros de lo que pasó de
  verdad; reponerlos borraría historia real.
- `anfitriones`, `anfitrion_secreto`, `config_secretos`: cuentas y
  llaves. Vaciarlas dejaría a todo el mundo fuera.
- `tablon_secreto`: la pregunta del tablón sí se quedaría cambiada tras
  una prueba. Se deja fuera porque la fila lleva también el token, y
  reponerla entera es más peligroso que el problema que resuelve.

**Regla que se lleva de aquí**: al crear una tabla nueva, mirar si tiene
que entrar en la foto del Modo Pruebas. Nadie lo hizo en su día.

## El pulgar: la regla y cómo funciona (v35, 2026-09-19)

⚠️ **Esto eran DOS secciones** —la regla por un lado y cómo funciona por
otro— y decían tres veces lo mismo. Las fundió él el 2026-09-23: *"creo
que hay dos secciones distintas que dicen lo mismo"*. Tenía razón, y de
paso destapó que una estaba marcada como "la vigila un test" cuando
`mano.test.js` comprueba el mecanismo, **no** que cada botón lleve su
espejo. Esa parte no la vigila nada: por eso está escrita.

### La regla

**Todo lo que se pulsa va al lado del pulgar de quien lo usa.** Desde la
v35 cada persona elige mano en su móvil y la app entera se acomoda a esa
elección; la derecha es solo lo que sale por defecto, no la norma.

**La única instrucción que hay que recordar:** todo lo pulsable que se
ponga a un lado lleva SIEMPRE su espejo `zurdo:` en el mismo cambio
(`justify-end zurdo:justify-start`, `items-end zurdo:items-start`,
`zurdo:flex-row-reverse` en filas de varios botones). Sin él, la
elección de esa persona no se aplica y el botón se queda donde caiga.

⚠️ Vale para **cualquier cosa pulsable, no solo los botones de una
ventana**. Se rompió el 2026-09-21 con el link al proyecto de GitHub:
metido dentro de un aviso como un `inline-flex` suelto, se fue a la
izquierda con él teniendo elegida la derecha. Lo cazó él. La forma
correcta es envolverlo: `<div className="flex justify-end
zurdo:justify-start">`.

Si varios botones tienen que medir lo mismo: ancho fijo común y
alineados, no a lo ancho con el texto centrado. En Mi cuenta,
`ANCHO_FILA_MENU` + `items-end`.

### Cómo funciona (`lib/mano.js`, una sola pieza)

- La elección se guarda **en el móvil** (localStorage `manoPreferida`),
  no en la base: es cómo coge cada uno su teléfono. Sin SQL.
- Solo cuenta en aparatos **táctiles** (`pointer: coarse` + `hover:
  none`). En el ordenador todo sigue a la derecha.
- `aplicarMano()` pone `data-mano="izquierda"` en `<html>`. De ahí
  cuelga todo: la variante `zurdo:` de Tailwind, los menús (que abren en
  espejo) y `useMano()` para lo que se coloca desde JS.
- Las ventanas emergentes tienen su propio `<html>`: se les pone el
  atributo al abrirlas y se sigue al cambiar.
- La primera vez, `PreguntaMano` (dentro de MiCuenta.jsx, así que solo
  con sesión) pregunta. Cerrarla sin elegir cuenta como derecha. Se
  cambia después en Mi cuenta, y el selector solo sale en el móvil.
- En el tablón no se pregunta, pero si ese móvil ya lo tiene elegido, el
  botón de la música se pone a la izquierda.

⚠️ **Lo que NO se invierte, a propósito**: el mando de la música (con él
invertido, "atrás" quedaría a la derecha de "adelante"), la X de cerrar
de las ventanas, las filas de las listas (el check de llegada, las
papeleras) y las filas alineadas abajo (`items-end` en una fila es
alinear abajo, no a la derecha).

**Probado por él en su móvil y aprobado a la primera** ("es exactamente
lo que había pedido"). Lo que funcionó: antes de construir, una sola
pregunta con dos bocetos del aspecto (norma 1) y otra sobre a quién
preguntar. Repetir esa forma con lo nuevo que tenga aspecto propio.
## Las pruebas de GitHub nunca habían pasado (2026-09-20)

El usuario: "me llegan bastantes emails de GitHub". El flujo **Pruebas**
(`.github/workflows/pruebas.yml`) fallaba en TODAS las subidas -- y al
mirarlo, **no había pasado ni una sola vez desde que se creó**
(`actions/workflows/pruebas.yml/runs?status=success` -> `total_count: 0`).
Un aviso que siempre está en rojo no avisa de nada: se vuelve ruido y se
ignora, que es justo lo contrario de para lo que se puso.

**El fallo**: reventaba en `npm ci`, a los 10 segundos, con
`Missing: esbuild@0.28.2 from lock file` (y sus 26 paquetes de
plataforma). La máquina de desarrollo tiene **Node 24 / npm 11**, y el
flujo pedía **Node 20 / npm 10**. `vitest` 4 trae su propia copia de Vite,
que declara `esbuild ^0.27 || ^0.28` como dependencia *peer*; npm 11 no
la escribe en el `package-lock.json` y npm 10 exige que esté. Lo mismo en
local pasaba desapercibido porque nadie ejecuta `npm ci` a mano.

**Arreglo, dos cosas**:
1. `node-version: "24"` en el flujo -- **la misma que la máquina donde se
   desarrolla**. Es la protección de verdad: mientras CI use otro npm que
   el de casa, el lockfile puede volver a discrepar.
2. `package-lock.json` regenerado con npm 10 (`npm install
   --package-lock-only`), que añade las 27 entradas que faltaban.
   Comprobado que `npm ci` pasa con npm 10 **y** con npm 11.

De paso, `actions/checkout` y `actions/setup-node` de v4 a v5: GitHub
está retirando Node 20 para las propias acciones y ya lo avisaba en cada
ejecución.

**Cómo se diagnosticó sin tener acceso a los registros** (los de Actions
piden permisos de administrador, y aquí no hay `gh` instalado): el repo
es público, así que la API anónima da el estado de cada paso
(`/actions/runs/<id>/jobs`) -- eso señaló `npm ci`. Luego, para ver el
error de verdad, `nvm install 20` y reproducirlo en un clon limpio del
repo. Ese es el camino cuando CI falla y el registro no se alcanza:
**clonar limpio y reproducir con la versión exacta que usa el flujo**.

## No se podía salir del Modo Pruebas (2026-09-20, v37.13)

**El fallo**: `restaurar_foto()` -- la que usan TANTO la salida del Modo
Pruebas COMO el "Deshacer" -- borraba todo y volvía a meterlo, pero
insertaba los **invitados antes que las mesas**. `invitados."mesa"` es
una clave foránea a `mesas."numero"` (`invitados_mesa_fk`): en cuanto un
solo invitado tiene mesa puesta, ese insert revienta y la restauración
entera se deshace. El Modo Pruebas se quedaba activo para siempre.

**Por qué apareció justo ahora**: llevaba meses ahí sin molestar porque
NADIE tenía mesa asignada. El 2026-09-19 (v37, "una familia no se
separa") el usuario empezó a sentar gente, y al día siguiente ya no
podía salir del Modo Pruebas. Las dos funciones que dependen de esto
-- Deshacer y Modo Pruebas -- estaban rotas a la vez, y el "probar
Deshacer" que había pendiente habría fallado igual.

**Arreglo**: las mesas se insertan las PRIMERAS. De paso, `coalesce(...,
'[]')` en cada tabla (una foto vieja sin alguna clave ya no rompe) y
`set_config('eventos.recalculo_aviso_activo','off')` durante la
restauración, para que `avisoPendiente` vuelva tal cual estaba en vez de
recalcularlo el trigger.

**Lección, y esto vale para cualquier restauración futura**: el orden de
inserción tiene que seguir las claves foráneas. Hoy son estas:
`invitados."mesa"` -> `mesas`, `invitados."colaboradorId"` ->
`colaboradores` (por eso los invitados entran sin colaborador y se
enganchan al final) y `colaboradores."invitadoId"` -> `invitados`. Al
añadir una tabla o una clave foránea nueva, repasar `restaurar_foto`.

✅ **Probado en vivo por el usuario el 2026-09-20**: sale del Modo
Pruebas y el "Deshacer" funciona. Con esto queda cerrado el "probar
Deshacer" que llevaba pendiente desde el 2026-09-17.

**Lo otro que falló**: el aviso decía solo "No se pudo desactivar el
Modo Pruebas", sin el motivo -- imposible de diagnosticar sin abrir la
consola del navegador, que el usuario no va a abrir. Ahora `avisar()`
manda `error.message` y la ventana lo enseña en letra pequeña debajo
(`detalle` en `PreguntaSeguridad`). **Todo aviso de error lleva el
motivo técnico.**

## "Autorizo expresamente a que guarden mis datos" (2026-09-21, v39.2)

El texto vive en `evento."notaPrivacidad"`, se ve al pie del tablón y se
edita en Datos del evento (v39.3 y v39.4). ⚠️ **La nota manda sobre el
código**: esta casilla existe porque la nota lo promete. Y ahora que el
texto es editable, **nadie avisa si alguien lo cambia**: la ventana de
edición lo dice en rojo, pero es lo único que hay. Historia de las
decisiones en `textos/nota-privacidad-tablon.md`.

**El Borrado total la respeta** (`VentanaConfigZonaPeligro.jsx`): quien
autorizó se queda, y **solo con su parte personal**. Se le quita todo lo
de este evento — mesa, pago, confirmación, llegada, colaborador, avisos,
roles y excepciones. Guardar "para otra ocasión" es guardar a la persona,
no la boda. La ventana y la pregunta de seguridad dicen **cuántos** son,
por la norma de avisar con cifras.

⚠️ **Las fotos de boda SÍ se borran**, también las de quien autorizó
(`persistFotosFamiliares({})`). La autorización habla de "mis datos"; una
foto es otra cosa y ante la duda se borra. Si algún día se quiere lo
contrario, es una decisión suya, no un descuido que arreglar.

✅ **Probado en vivo por el usuario el 2026-09-21**: la casilla guarda
tanto al marcarla como al desmarcarla.

```sql
select
  (select count(*) from information_schema.columns
     where table_name = 'invitados' and column_name = 'conservarDatos') as en_invitados,
  (select count(*) from information_schema.columns
     where table_name = 'evento'    and column_name = 'notaPrivacidad') as en_evento;
```

## Cómo se le habla al invitado: tú y USTEDES, nunca vosotros (2026-09-21)

El usuario, corrigiendo un borrador mío: *"no uso el término sentaros,
sí uso sentarles"*. Es el español de Canarias: el plural de "tú" es
**ustedes**, no "vosotros". Vale para TODO el texto que lee un invitado
o un colaborador — pantallas, emails, el tablón y la nota de privacidad.

- Singular: **tú** ("tus datos", "puedes pedirme").
- Plural: **ustedes / les / su** ("sentarles", "avisarles", "sus fotos",
  "si prefieren", "díganselo").
- ❌ Nunca: vosotros, vuestro, -áis, -éis, -asteis, decidme, os esperamos.

Repasado el 2026-09-21: en la app solo quedaba un "¡Os esperamos con
muchas ganas!", en la plantilla de la invitación a la familia (el valor
por defecto de `useLedgerData.js` y el de "restaurar textos" de
`VentanaConfigZonaPeligro.jsx`, los dos corregidos a "¡Les esperamos!").
⚠️ El texto que está GUARDADO en la base es suyo y lo cambia él desde
"Texto emails": el suyo también lo tenía y se le avisó.

## "Todavía no hay fecha confirmada" (2026-09-21, v39)

⚠️ **A propósito NO borra la fecha escrita**, aunque él dijo "anule la
fecha". Dos motivos, los dos reales:
- el **año** se sigue usando para calcular los aniversarios de los 48
  matrimonios (`anioDelEvento`); borrarlo vaciaría esa columna entera;
- si mañana se confirma ese mismo día, no hay que volver a teclearlo.
Lo que hace la casilla es dejar de **enseñarla**. El formulario lo dice
en voz alta cuando está marcada, para que no parezca que se ha perdido.

```sql
alter table public.evento add column if not exists "fechaSinConfirmar" boolean default false;
```

```sql
update public.evento set "fechaSinConfirmar" = true, "tablonOcultarFecha" = false
where "tablonOcultarFecha";
```

⚠️ **`VistaTablon.jsx` sigue respetando `tablonOcultarFecha`, y eso NO es
un resto que quitar sin pensarlo.** Se puso para cubrir la ventana entre
el despliegue y el SQL, pero se queda por un motivo mejor: **una foto de
Deshacer o de Modo Pruebas anterior a la migración** trae
`tablonOcultarFecha = true` y `fechaSinConfirmar` vacío. Al restaurarla,
sin esa línea, la fecha provisional se les escaparía a los invitados sin
que nadie se entere. Es el mismo tipo de trampa que las columnas nuevas
NOT NULL rompiendo restauraciones antiguas. Quitarlo solo cuando ya no
quede ninguna foto vieja.

✅ **Aprobado por el usuario el 2026-09-21** ("superior, ha quedado muy
bien").

## Dos clases de permiso, no una (2026-09-21, v38.5)

✅ **Resuelto en la v38.6, con la idea del usuario**: *"quitar el botón
dentro de Mi cuenta y que la expresión link al proyecto en GitHub sea
realmente un link y acceder desde ahí"*. **Donde se anuncia el permiso
es donde se entra.** El aviso se queda (él lo pidió expresamente: "no
quitaría el baner"), y dentro lleva el link.

Dos detalles que decidió él y no yo:
- **Con relieve, no subrayado.** Su idea original era un link de texto
  subrayado; preguntado con las dos versiones dibujadas, eligió el
  relieve, que entonces era lo que decía la norma 13.
- **La etiqueta vuelve a nombrar GitHub** ("Ver el proyecto en GitHub").
  En la v38.5 se lo habíamos quitado porque confundía — pero lo que
  confundía era la frase que lo envolvía, no la palabra. Con el link a la
  vista, decir a dónde lleva es justo lo que hace falta.

⚠️ El botón desaparece de "Mi cuenta" **también para el anfitrión**
(`VistaAnfitrion` ya no pasa `mostrarRepositorio`). Es lo que se pidió, y
el anfitrión tiene el repositorio en su propio ordenador.

**Y en la v38.9, la forma definitiva**: *"quiero que la frase 'ver
proyecto de GitHub' sea el link como tal, y que ese banner sea de una
sola línea"*. El aviso queda en un renglón — **"🔑 Tienes permiso para
_ver el proyecto en GitHub_."** — con la última parte subrayada en
dorado. El permiso y la forma de usarlo son la misma cosa, así que se
dicen una sola vez, y "GitHub" aparece una sola vez.
⚠️ Al ir DENTRO de la frase ya no puede irse al lado del pulgar: es
texto, no un acceso suelto. Por eso `EnlaceTexto` tiene el modo
`enLinea`, que hereda tamaño y grosor del renglón (si no, se vería un
trozo de otra letra en medio de la frase) y conserva el relleno de dedo,
que en un elemento en línea no descuadra el renglón.

✅ **Aprobado por el usuario el 2026-09-21** ("sencillamente maravilloso").

**La lección de toda esta tanda, que es la que vale para mañana**: una
norma suya tiene un ÁMBITO, y el ámbito no siempre está escrito. La 13
nació con los botones 3D y hablaba de acciones; yo la apliqué a un link
de login, que es una convención universal de internet, y quedó mal. Fue
él quien lo vio: *"no me acuerdo en qué momento te puse esa norma, pero
en todas las páginas web oficialmente se ve como un link subrayado"*.
Cuando una norma suya choca de frente con algo que cualquiera reconoce
de internet, el choque es la señal: **preguntar por el alcance antes de
aplicarla al pie de la letra.**

**Y en la v38.8, el paso intermedio**, después de verlo funcionando:
*"colocaste GitHub dos veces... un botón grande, largo, que encima se ve
basto, no armoniza con la aplicación... aquí haríamos una excepción, lo
dejamos como un link, tal vez con los colores de la aplicación"*.
- La frase de arriba ya dice GitHub, así que el link de abajo es solo
  **"Link para acceder al proyecto"**. La palabra no se repite.
- Fuera la pastilla con relieve: **link subrayado en dorado**
  (`C.goldClaro`) sobre el rojo del aviso. Un botón de ese tamaño dentro
  de un aviso de dos líneas pesaba más que el aviso. Esto es lo que dos
  días después hizo reescribir la norma 13 entera: no era una excepción,
  era que la norma estaba mal planteada.
- ⚠️ Conserva `py-2`: se ve como una línea de texto, pero el dedo tiene
  dónde acertar.

**Corregido en la v38.7**, con dos fallos míos que cazó el usuario en la
misma frase:
1. **El link se fue a la izquierda** teniendo él elegida la mano derecha.
   Lo metí como `inline-flex` suelto dentro del aviso, sin el envoltorio
   `justify-end zurdo:justify-start`. Ver la nota nueva en "Regla de la
   app: todo al alcance del pulgar".
2. **Quité la frase que anuncia el permiso** y dejé el link a secas. Él
   lo quería **igual que el otro banner**: "en vez de permiso de
   edición, tienes permiso para ver el link de GitHub". El aviso dice lo
   que tienes; el botón es cómo se usa. Las dos cosas, no una.

**Lección general**: al añadir una clave a una lista existente, leer el
texto que la lista ya imprime. Aquí la etiqueta era correcta y la frase
que la envolvía, no.

## El mapa se quedaba viejo sin que nadie se enterara (2026-09-23)

**Y de paso, la paleta.** El script tenía los colores **copiados a mano**
de `theme.js`, y ya habían derivado: sus dos dorados (#A87C3A, #8A6A34)
no existen en la app (`C.gold` es #B08D57). Misma historia que los rojos
y los tamaños de letra. Ahora la paleta sale de `theme.js`, y las tres
tintas oscuras se calculan a partir de `C.ink` en vez de escribirse.
⚠️ Los dos dorados se quedan como estaban **de momento**: cambiarlos
cambia una imagen que él ya aprobó, así que está preguntado. Al
contestar, o pasan a `TEMA.gold` o se anota aquí el porqué.

⚠️ **Node, roto de rebote.** El `nvm install 20` del 2026-09-20 (para
reproducir el fallo de GitHub) dejó el alias `default` en `lts/*`, que no
resolvía a nada: en un terminal nuevo no había `node` ni `npm`. Corregido
con `nvm alias default v24.18.1`. **Lección: `nvm install` toca la
configuración de su máquina, no solo la mía.** Si hace falta otra versión
para una prueba, dejar el `default` como estaba al terminar.

## El acabado, con una escala y no a ojo (2026-09-20, v38)

**El aire**: los paneles y tarjetas (`p-3 rounded`) pasan a `p-4`. ⚠️ Las
**filas de las tablas no se tocan**: más aire ahí choca de frente con dos
normas suyas anteriores ("una sola línea por fila" y "las ventanas, lo
más pequeñas posible"). Una lista de 140 invitados con más aire es una
lista que no cabe.

✅ **Dado por bueno por el usuario el 2026-09-20** ("quedó muy bien").
Pedí las capturas de la norma 15 (lista de invitados y formulario del
colaborador, que son las pantallas que más cambiaron) y él las dio por
innecesarias. Queda dicho aquí porque **no lo he visto yo**: si algún
día aparece algo apretado o cortado en esas dos pantallas, el repaso de
acabados de la v38 es el primer sitio donde mirar.

**Lo que NO entra**: `VentanaMusicaEvento.jsx`. El mando de música tiene
lenguaje propio ya aprobado (norma 11) — paleta oscura suya y teclas con
su relieve. Está excluido del repaso Y del test.

**El guardia**: `src/theme.test.js`. Recorre todos los `.jsx` y se pone
en rojo si encuentra un `fontSize`, `borderRadius` u `opacity` escrito a
mano. Sin esto, en unos meses vuelve a haber trece tamaños: la escala se
arregla una vez, la deriva vuelve sola. Mismo espíritu que
`scripts/dibujar-mapa.test.js`. Salida de emergencia estrecha: marcar la
línea con `escala-libre:` y el motivo (hoy hay UNA, el rombo de 11px de
Aniversarios, que con redondeo de caja dejaría de parecer un rombo).

## El sello que late (2026-09-20, v38.1)

**Elegido: late el SELLO rojo, no el botón.** Dos motivos, y los dos son
normas suyas de antes:
- el botón es la pastilla de cristal sobre la foto, lenguaje ya aprobado
  (norma 11);
- el rojo ya significa "falta algo" en toda la app, y el dorado es
  adorno. Si el dorado empieza a parpadear, pasa a hacer dos trabajos.

`.sello-latiendo` en index.css, al lado de `.ficha-incompleta` y **al
mismo ritmo (2s)**: es el mismo aviso, contado en vez de suelto.
`Seal` gana el prop `late`, solo donde el número quiere decir "esto falta
por hacer". ⚠️ Con latido, la sombra la pone la animación: si se deja
también en el `style`, gana esa y el halo no se ve.

**Y en la v38.3 y la v38.4**, un segundo y un tercer aro, pedidos de uno
en uno: 8 px a 0,45, 17 px a 0,18 y 27 px a 0,30 — este último en un rojo
más puro (#D60822) que el burdeos de la app (`C.peligro`, #B00020),
porque a 27 px el burdeos se disolvía en la foto. Es el ÚNICO sitio donde
se usa un rojo que no es el de la paleta, y es a propósito: no es color
de interfaz, es el borde de una onda. ⚠️ El halo sale FUERA del botón: si
alguna vez se mete el sello en un contenedor con `overflow: hidden`, se
recortará y parecerá que el latido se ha roto.

✅ **Aprobado por el usuario el 2026-09-20** ("espectacular"). Y una
lección de método: los tres aros salieron de tres vueltas suyas seguidas
("más llamativo", "otro aro", "un tercero más rojo"). Ninguna de las
tres la habría acertado yo de una: con él conviene **construir de uno en
uno y enseñar**, no proponer el resultado final de golpe.

Ahora mira la expresión entera, descuenta lo que ya sale de la escala
(`${R.caja}px`) y perdona el `0` y el `1`, que no son un valor elegido a
ojo sino "nada" y "del todo". Las opacidades de estado (botón
deshabilitado, icono que no aplica) entran en la escala como
`OP.apagado`. **Lección: un guardia que solo mira la forma más obvia da
una seguridad falsa.**

## Se acabaron los avisos del navegador (2026-09-20, v37.12)

Último resto de la norma 12: `window.alert` estaba prohibido, pero
seguían vivos ~12 -- casi todos en `avisar()` de `useLedgerData.js` (los
"no se pudo guardar, se deshace el cambio en pantalla") más los de
`useMotorInvitaciones.js` y `VentanaInvitaciones.jsx`. No se habían
migrado porque `avisar()` es una función suelta, fuera de React, y
`usePreguntaSeguridad` es un hook: no se puede llamar desde ahí.

- `avisos.js` no pinta nada: solo guarda la lista de *sitios* donde se
  puede enseñar un aviso. `avisoEnPantalla(mensaje, titulo?)` es una
  función normal, llamable desde cualquier parte.
- `AvisosGlobales` es el sitio: monta un `usePreguntaSeguridad` en modo
  `soloAviso` y se apunta a esa lista con el `document` en el que vive.
- **En qué ventana sale**: la del documento que tiene el foco
  (`doc.hasFocus()`). Va montado una vez en `main.jsx` (la pestaña) y
  una vez dentro de `usePopupWindow.actualizar()` -- o sea, en TODA
  ventana emergente, sin tocar las cinco por separado. Así se cierra de
  raíz el bug repetido de "el aviso sale en la ventana de detrás".
- Un aviso disparado antes del primer render (fallo al arrancar) espera
  en una cola de 5 como mucho, y sale en cuanto hay dónde.
- `partirAviso` corta el mensaje en título + explicación (la primera
  frase si mide 70 o menos), para que se vea igual que el resto de
  preguntas de la app. Con título propio cuando el mensaje es largo.

⚠️ Sigue habiendo DOS excepciones a propósito, y no son un olvido:
`persistNovedades` y `persistPreguntaTablon` devuelven `true`/`false` sin
avisar, porque `VentanaNovedades.jsx` enseña el fallo en su propia
pantalla, junto al texto que no se ha podido guardar -- ahí se entiende
mejor que en una ventana aparte.

## "Datos X de Y": completo es siempre N de N (2026-09-19, v37.5)

El usuario: un niño salía "5 de 7" aunque tuviera todo lo suyo, y así
siempre parecía incompleto. Además canción y observaciones casi siempre se
quedan vacías y contaban igual.
- La cuenta vive SOLO en `lib/invitados.js` (`camposQueAplican`,
  `totalDatosInvitado`, `contarDatosRellenados`): lo que no aplica (email
  de un menor, año y foto de boda de quien no es O ni A) no cuenta.
- Canción y observaciones son `CAMPOS_OPCIONALES`: en el formulario, una
  casilla "Sí" con el mismo aspecto que las de alergias. Sin marcar =
  "no", plegadas, fuera de la cuenta. Marcada = aparece el campo y cuenta
  (vacía, como pendiente). Guardado, "sí" es tener texto: no hay columna
  nueva. Desmarcar con texto pregunta antes de borrarlo.
- Ejemplos (pruebas en invitados.test.js): esposo adulto 5, suelto adulto
  3, hijo menor 2; +1 por cada opcional elegido.
- `datosCompletos` (los dos obligatorios, año de nacimiento y alergias) no
  cambia: es lo que decide "completo" para pagos y llegadas.
- v37.6: un invitado que ES colaborador (Raúl Sierra) salía "3 de 4": su
  email vive en Colaboradores y su ficha de invitado lo tiene vacío a
  propósito, pero la cuenta miraba la ficha. `conEmailDeColaborador(g,
  colaboradorVinculado)` pone el de Colaboradores antes de contar, en los
  dos sitios donde se ve la cuenta. Y la alergia "de fuera" (Melocotón)
  ya contaba bien: su "6 de 7" era la cuenta vieja de canción y
  observaciones (prueba añadida).
  ⚠️ Límite conocido: si ese invitado-colaborador está asignado a OTRO
  colaborador, ese otro no recibe los datos de Colaboradores (por
  privacidad solo ve su propio perfil), así que ahí el email sigue
  pareciendo vacío y editable. No resuelto.
- v37.7: en la lista del colaborador, ficha CERRADA que no está en N de N
  → fondo `C.avisoFondo`, borde rojo y latido lento (`.ficha-incompleta`,
  2,8 s, sombra roja al 16%; quieta con "reducir movimiento"). Elegido por
  el usuario: rojo mientras falte cualquier dato que se le pide, también
  email o foto -- sabiendo que un adulto que no dé su email se quedaría en
  rojo. Las secciones NUEVOS/COMPLETADOS siguen por los obligatorios, así
  que puede haber una ficha roja en COMPLETADOS: es lo esperado.
- v37.8: **"no tienen foto de boda"**. Casilla "Sí" en la foto de boda,
  MARCADA por defecto (al revés que canción y observaciones: lo normal es
  que haya foto). Desmarcada = ese matrimonio no tiene. Es de la FAMILIA,
  como la foto (`fotos_familiares."sinFotoBoda"`), así que vale para los
  dos cónyuges (norma 16). Efectos, todos desde el mismo dato:
  `pideFotoBoda` la saca de "datos X de Y"; Aniversarios pone "No tienen"
  en el hueco y no la cuenta en "falta plantilla"; `matrimoniosParaEncargo`
  la deja fuera de la hoja de encargo (si no, el encargo no estaría nunca
  completo). Con la foto ya subida la casilla no se puede desmarcar: hay
  que quitar la foto primero.
  `useLedgerData`: `repartirFilasDeFotos` reparte ahora las filas de
  `fotos_familiares` en sus cuatro mapas en UN sitio (antes eran tres
  copias de tres líneas); `guardarFilasDeFotos` manda las cuatro cosas.
  SQL dado al usuario el 2026-09-19 (columna + `guardar_fotos_familiares`).
- v37.9: **una sola definición de "incompleta"** en la vista del
  colaborador: `estadoDatos` (lib/invitados.js) = no está en N de N. La
  usan la fila roja, la sección (rebautizada de NUEVOS a **INCOMPLETOS**,
  a petición del usuario), `Seal` de "Abrir formulario", "Con datos
  completos" y el botón "Datos completos": con fichas en rojo ya no avisa
  al anfitrión (el servidor, `colaborador_confirmar_datos_completos`, sigue
  mirando solo los dos obligatorios; el cliente es quien decide ahora).
  Latido más rojo y más marcado (el fondo late de #F9DADF a #F2B9C1, 2 s).
  Los avisos de esos dos botones, en la ventana de la app.
  **EL MODELO DEL FORMULARIO, dicho por el usuario**: "lo obligado es
  marcar sí o no; lo otro es automático: aplica o no aplica por edad o por
  single". Es decir: el colaborador solo decide Sí/No (canción,
  observaciones, foto de boda); si un dato aplica o no lo decide la app
  sola (email por la edad, año y foto de boda por ser O/A). Todo dato
  nuevo del formulario tiene que encajar en una de las dos cosas.
  ⚠️ Queda un hueco: el email de un adulto que no lo quiera dar no tiene
  Sí/No, y esa ficha no llega nunca a N de N.
- v37.10: **valores por defecto de las casillas, decididos por el
  usuario**: foto de boda SÍ, canción SÍ, observaciones NO, alergias
  ninguna marcada (se contesta a propósito: es lo seguro para la comida;
  "alergias no" se entendió como "sin marcar", no como "No" marcado).
  Canción "Sí" por defecto obliga a GUARDAR su "no": `invitados."sinCancion"`
  (sin "not null", como las otras columnas nuevas). `eligeOpcional` lo lee;
  el formulario lo guarda al desmarcar (y borra lo escrito, preguntando
  antes) y lo quita al volver a marcar. SQL: columna +
  `anfitrion_guardar_invitados` + `colaborador_guardar_invitado`.
  Efecto esperado: toda ficha sin canción pasa a rojo hasta que el
  colaborador la escriba o la desmarque.
- v37.11: **email**, regla del usuario: "mínimo uno por familia, esposo o
  esposa; si es un single, es necesario; mejor opción sí por defecto y un
  mensaje al colaborador si ningún miembro de la familia pone email".
  - Casilla "Sí" marcada por defecto; su "no" en `invitados."sinEmail"`.
    Para el suelto (S) no hay casilla ni "no": `eligeOpcional` lo fuerza.
  - "Familia sin ningún email" = familia con algún confirmado y ningún
    adulto (esposo, esposa, padre, suelto) con email en su ficha O en
    Colaboradores. La regla está DOS veces a propósito: `familiasSinEmail`
    (lib/invitados.js, la usa el anfitrión, que ve la lista entera: vista
    previa y Revisión) y la función SQL `colaborador_familias_sin_email`
    (el colaborador solo ve a sus invitados, y un matrimonio puede tener
    dos colaboradores). Devuelve solo la clave de la familia, nada
    personal. Se recarga con el ciclo de cada minuto y tras guardar un
    email. Si cambia una de las dos, cambiar la otra.
  - El colaborador ve el aviso bajo el email de cada miembro de esa familia;
    el anfitrión, en la Revisión ("Familias sin ningún email", pendiente).
  SQL: columna + las dos funciones de guardar + la función nueva.

## Una familia no se separa en las mesas (2026-09-19, v37)

- `lib/mesas.js` es la única definición. `claveFamiliaMesa` = grupo
  familiar o, si está vacío, el apellido: la MISMA que ya usaba el
  "Auto-asignar", que ahora la importa en vez de tener su copia.
- `asignarMesaConSuFamilia`: poner la mesa a uno la pone a toda su familia
  CONFIRMADA; quitarla, la quita a todos. Si no caben todos, no se sienta
  a nadie y se avisa ("son 4 y solo quedan 2 sitios"). Los no confirmados
  se quedan sin mesa (la mesa es sitio real).
- `confirmarConSuFamilia`: al confirmar a alguien cuya familia ya está en
  una mesa, se sienta con ella si cabe; si no, se confirma igual, sin mesa,
  y se avisa. Desconfirmar no toca ninguna mesa.
- Los avisos salen con `preguntar({ soloAviso: true })`, en medio de la
  pantalla: el aviso de arriba de la lista no se ve desde la fila 100.
- La Revisión gana "Familia repartida en varias mesas", para lo que se
  repartió a mano antes de la regla.
- v37.1: y "Matrimonio con uno confirmado y el otro no" (la O y la A son
  solo para quien viene con su pareja). El aviso de "colaboradores
  distintos" que se le propuso lo RECHAZÓ el usuario: ver la norma 16.
- v37.2: "Colaboradores fuera del reparto (10 a 12 invitados)", tipo
  pendiente. `INVITADOS_POR_COLABORADOR` en `revisionInvitados.js` es la
  única cifra. Cuenta TODOS los asignados (confirmados o no), y no avisa
  de quien tiene 0 (el desarrollador, dado de alta solo para ver el
  código, o un reparto sin empezar). Cada botón del hallazgo es un
  colaborador ("Ana: 14") que filtra la lista por él: un hallazgo puede
  traer `etiqueta` y `filtros` propios, y `InformeInvitados`/`onBuscar`
  los usan si vienen.
- v37.3: el usuario no podía SALIR de la Revisión: tocar el título solo la
  plegaba (y al tocarlo otra vez se abría), y el único "Cerrar" estaba al
  final de todos los avisos. Ahora "Cerrar" va en la fila del título, del
  lado del pulgar. Y al cerrar, la lista vuelve a los filtros que tenía
  al abrir la Revisión (`filtrosAntesDeRevision` en SeccionInvitados): un
  nombre pulsado en el informe la dejaba filtrada para siempre. También
  si se cierra la ventana de la lista con la Revisión abierta.
  ⚠️ Lección general: todo panel que se abre tiene que tener su salida
  ARRIBA y a la vista, y salir deja la pantalla como estaba.
- v37.4: **excepciones**. El caso real: una madre con S dentro del grupo
  Gatell01 de su hija, a propósito, para sentarse juntas; la Revisión lo
  daba por error sin dejar aceptarlo. El usuario quiere que SIGA avisando
  ("en líneas generales esto sería un error") pero poder dar por bueno
  ESE caso. Se guarda en el propio invitado: `invitados.excepcionesRevision`
  (jsonb, lista de claves de aviso aceptadas). `revisarConExcepciones`
  devuelve los avisos sin las aceptadas y la lista de aceptadas; la
  Revisión pone "Excepción" junto a cada nombre (pregunta antes) y, al
  pie y plegado, "Excepciones permitidas" con su X para quitarlas. Solo
  para invitados: los colaboradores del reparto no llevan el botón.
  ⚠️ La columna es SIN "not null" a propósito: una foto de Deshacer o del
  Modo Pruebas anterior a la columna la trae vacía, y con "not null"
  reponerla fallaría (`jsonb_populate_recordset` pone NULL en lo que falta).
  Lo mismo aplica a cualquier columna nueva que se añada.
  SQL: `alter table` + la función `anfitrion_guardar_invitados` con la
  columna (dado al usuario el 2026-09-19). Sin ese SQL, la excepción se
  pierde al recargar. **Ejecutado y probado por el usuario el mismo
  día**: la excepción de Gatell01 se guarda y sigue tras recargar.
- ⚠️ El desplegable de mesa sigue desactivando solo las mesas llenas para
  UNA persona. Una mesa con 1 hueco sale elegible para una familia de 3;
  al elegirla, sale el aviso y no se mueve nadie.

## Relieve, clic y pregunta de seguridad (2026-09-19, v36)

El usuario lo pidió como norma ya hablada y sin cumplir del todo: todo
botón con relieve, que dé sensación de clic al pulsarlo, un clic suave de
sonido, vibración en el móvil ("si no, puedo apretarlo muchas veces e ir
creando miles de mesas"), todas las X del mismo tamaño y con el mínimo
táctil del móvil, y todo quitar/borrar con pregunta de seguridad. Él
eligió: títulos plegables con relieve (sí), subrayados → botones (sí), y
papelera dentro del círculo rojo cuando se borra para siempre.

**Tres piezas, una por cosa:**
- `index.css`: `.boton-3d, select` en la MISMA regla (todo desplegable
  nuevo la hereda sin clase). Levantarse al pasar el ratón solo con
  `@media (hover: hover)`: en el móvil se quedaba pegado. Al pulsar se
  hunde (`translateY(1px)` + sombra por dentro, 0.04 s).
  ⚠️ **Fallo que había**: `.boton-3d.boton-flotante-imagen:hover` ganaba a
  `.boton-3d:active`, así que las pastillas verdes NO se hundían al
  pulsarlas. Ahora tienen su propio `:active`, detrás.
- `lib/respuestaTactil.js`: UN escuchador por documento (pestaña y cada
  ventana emergente). Clic fabricado con Web Audio (sin archivo) y
  vibración: `navigator.vibrate` en Android; en iPhone no existe, y se usa
  el truco de iOS 18 de pulsar un `<input type="checkbox" switch>`
  escondido. Si Apple lo quita, no vibra y ya está. ⚠️ Además escucha
  `touchstart`: **sin eso el iPhone no aplica `:active`** y ningún botón
  se hunde al tocarlo. Dentro de la Música no suena (`data-sin-sonido-clic`:
  ese aparato puede ir a los altavoces del local), pero sí vibra.
- `components/PreguntaSeguridad.jsx`: `usePreguntaSeguridad()` (la
  pregunta, con el aspecto de la de "¿Quitar la foto?" de Aniversarios) y
  `BotonQuitar` (el círculo rojo, que lleva la pregunta dentro). La
  pregunta se pinta con un portal en el `<body>` del documento del botón:
  dentro de una fila de tabla heredaría el "una sola línea" y el recorte.
  `yaPregunta` solo para quien ya tiene la suya (Aniversarios y el
  formulario del colaborador con la foto; el Cronograma, debajo).

✅ **Cerrado en la v37.12**: los ~12 `window.alert` que quedaban (avisos
de un solo botón) ya salen en la ventana de la app. Ver "Se acabaron los
avisos del navegador".

El usuario lo probó en su iPhone: ni sonido ni vibración.
- **Vibración**: el truco de pulsar un `<input switch>` escondido DESDE EL
  CÓDIGO lo cerró Apple en **iOS 26.5** (comprobado en la documentación
  de varias librerías, sep. 2026). Lo único que sigue funcionando es que
  el DEDO toque un interruptor nativo. `respuestaTactil.js` mete, solo en
  el iPhone (táctil y sin `navigator.vibrate`), un
  `<input type="checkbox" switch class="interruptor-haptico">` invisible
  dentro de CADA `<button>` (un `MutationObserver` lo pone también en los
  que aparecen después). Cubre el botón (`opacity: 0`, `clip-path` para
  que el toque no se salga de la forma) y el toque sigue subiendo al
  botón, así que su `onClick` funciona igual. Técnica de
  github.com/m1ckc3s/project-fathom, probada allí en aparato real.
  ⚠️ Consecuencias a recordar:
  - Solo en `<button>`: dentro de un enlace, una etiqueta de subir foto o
    un `<summary>`, el interruptor les robaría la acción (se toca el
    interruptor y el navegador ya no sigue el enlace ni abre el archivo).
  - Un botón `type="submit"`: el navegador ya no envía el formulario solo
    (el que recibe el toque es el interruptor). Se envía a mano con
    `form.requestSubmit(boton)` en el mismo escuchador.
  - Si un botón no está posicionado, se le pone `position: relative`
    (si no, el interruptor cubriría otra cosa).
  - Si algo raro pasa con un botón SOLO en el iPhone, sospechar de esto
    primero. Se apaga quitando la llamada a `vigilarBotones`.
- **Sonido**: el primer clic era un pitido a volumen 0,05, inaudible en el
  altavoz del móvil. Ahora es un golpe de ruido filtrado de 12 ms a 0,6.
  El iPhone lo calla con el interruptor de silencio (igual que el
  teclado): es lo correcto, no se fuerza con `navigator.audioSession`.

**Probado por el usuario en su iPhone el 2026-09-19 y aprobado**: la
vibración funciona (el interruptor invisible dentro de cada botón), la
elección de mano, la X de quitar con su pregunta y los avisos. Es decir,
la técnica del interruptor SÍ funciona en su iOS: no volver al truco de
pulsarlo desde el código.

## Regla de la app: ventanas lo más pequeñas posible (2026-09-18)

Pedido explícito del usuario, "tomamos nota de esto": **una ventana mide
lo que necesita su contenido, no más**. El ejemplo que puso: en Mi cuenta
solo hay una contraseña de 8-12 caracteres y un email de unos 20; no
necesita una ventana grande. Del ancho de un móvil en vertical, **también
en el ordenador**.

Aplicado en Mi cuenta: primero `ancho={400}`, y tras ver una captura del
móvil el usuario la quiso aún más estrecha -- quedó en `ancho={300}`, con
el texto de ayuda de la contraseña acortado a "Mínimo 8 caracteres" para
que quepa (el título de la sección ya dice qué es). Al construir o
revisar cualquier ventana, empezar por preguntarse cuánto ocupa de verdad
lo de dentro. `ModalFlotante` acepta `ancho` para esto (720 por defecto).

Y en la misma ventana, **todos** los botones (los cinco accesos y los dos
de los formularios) son copia EXACTA de las filas del menú "Abrir
sección…" (`FilaMenu` en MenuFlotante.jsx), que el usuario llama **"el
modelo de inicio"**: misma clase, relleno, icono de 19 a la izquierda,
pastilla redondeada, letra dorada. Y **la misma medida que allí**:
`ANCHO_FILA_MENU` (ANCHO_PANEL − 12), exportada desde MenuFlotante e
importada en MiCuenta, no copiada. El usuario pidió que ningún rótulo pase
de "Mapa del sitio" y que el margen derecho quede tan justo como el
izquierdo: los rótulos se abrevian ("Código app", "Errores app", "Cambiar
clave") para caber. **Si se añade un botón, se abrevia el rótulo; no se
ensancha el botón.** A la derecha, por el pulgar.

La explicación del email de acceso va en el **pie de la ventana, plegada**
(`<details>`): en medio del formulario rompía la línea de los botones.

⚠️ **Lección de esta tanda**: en la v34.5 los pasé a la variante
secundaria de `Boton` (cuadrada, solo contorno) porque me pareció mejor,
y dejé los de los formularios a medida de su texto. El usuario lo había
pedido con el estilo de inicio y todos iguales, y lo tuvo que señalar.
**Cuando el usuario dice "estandarizar", es con el estilo que ÉL ha
nombrado o el que ya existe en la pantalla, no con el que yo prefiera.**
Si hay duda sobre cuál, preguntar antes de cambiar el aspecto.

Y se repitió dos veces más (v34.6 a todo lo ancho, v34.7 a 240px centrado)
antes de preguntar. La tercera vez, una pregunta de una línea ("¿es el
menú de Abrir sección…?") lo resolvió a la primera. Preguntar ANTES.

## Registro de errores con Sentry (2026-09-18, v34.3)

Antes, un fallo en el móvil de un colaborador no dejaba rastro. Ahora
llega a Sentry (cuenta del usuario, región **EU/Alemania** -- `.de.` en la
dirección). `lib/registroErrores.js` lo inicia desde `main.jsx`, lo
primero, y el `ErrorBoundary` informa de lo que atrapa.

La dirección (DSN) va en `VITE_SENTRY_DSN`, guardada en Vercel para
production/preview/development con la CLI (`vercel env add ... --value
... --no-sensitive --yes`; esta versión de la CLI no acepta el valor por
stdin) y en `.env` local. No es secreta: solo sirve para enviar. Sin ella
la app funciona igual y no avisa.

⚠️ **Privacidad, decidido con el usuario**: los avisos no llevan datos de
invitados. `sendDefaultPii: false`, sin rendimiento ni grabación de
sesión, fuera las migas de consola, y `limpiarEvento` quita el usuario,
cabeceras, cookies, cuerpo y **todas las consultas de las URLs** -- el
enlace del tablón lleva la llave en `?tablon=...` y sin eso viajaría en
cada informe. Probado en `registroErrores.test.js`; no quitar esas
pruebas.

Coste: +31 KB comprimidos al abrir (de 125 a 156). Se aceptó: sigue
siendo más de dos veces más ligera que antes de trocear.

Comprobado enviando un evento de prueba a la dirección con `curl`:
Sentry lo aceptó. Aparece en el panel como "Prueba de conexión…", con
entorno "prueba"; se puede borrar.

⚠️ **Ese evento de prueba mostró la IP del usuario** (85.86.x.x): Sentry
la deduce EN SU SERVIDOR de la conexión entrante, aunque el evento no la
traiga. `sendDefaultPii: false` no basta para eso. Hay que activar en el
panel de Sentry: proyecto → Settings → **Security & Privacy** → "Prevent
Storing of IP Addresses". Se le pidió al usuario el 2026-09-18; confirmar
que lo hizo.

v34.4: enlace "Errores de la app" en Mi cuenta, solo anfitrión
(`URL_REGISTRO_ERRORES` en constants.js). Pintar los errores DENTRO de la
app no se hace: exigiría una clave secreta de Sentry en el navegador.

## Permiso "Ver el código de la app" (2026-09-18, v34.2)

⚠️ Mismo caso que `mapa_sitio_ver`: **solo de pantalla**. El repositorio
es público, así que el permiso decide quién ve el enlace, no quién entra.
Se le dijo al usuario antes de construirlo. Si el repo pasa a privado,
habrá que invitar al desarrollador también desde GitHub.

## Peso de la app: de 1.196 KB a 443 KB al abrir (2026-09-18, v34.1)

⚠️ **La ventana de Música NO se trocea, a propósito**: se abre en el
local con un wifi desconocido y no puede quedarse descargando delante de
los invitados. Va dentro de VistaAnfitrion, que carga al entrar. Si
alguien propone "optimizarla", este es el motivo para no hacerlo.

⚠️ **Efecto secundario cubierto**: tras un despliegue, una pestaña
abierta de antes pide trozos con nombres que ya no existen. `main.jsx`
escucha `vite:preloadError` y recarga UNA vez (marca en sessionStorage
para no entrar en bucle si el fallo es otro, como estar sin conexión).

## Lo que está esperando, y por qué no es un fallo

Cosas que llevan tiempo sin moverse **porque no toca**, no porque se
hayan olvidado. Antes esto era una sección "Dónde lo dejamos" con fecha,
que se quedó vieja en una semana; esto no caduca porque no habla de un
día concreto.

✅ **La licencia está decidida** (2026-09-20): **privada, todos los
derechos reservados**, como pone el README. Él lo confirmó. Cerrado, no
volver a sacarlo.

**Bloqueado por datos:** la hoja de encargo de las fotos necesita el año
de boda, y los 48 matrimonios lo tienen vacío. Lo rellenan los
colaboradores junto con la foto; no es trabajo suyo.

**El ritmo real del evento** (él, 2026-09-20). Dos cosas que conviene no
confundir con un fallo:
- **Las pocas mesas de hoy no son las del evento.** Serán **12-14**, y el
  reparto se hace cuando estén TODAS las confirmaciones: con ~60
  confirmados de ~140 no se puede sentar a nadie. Si hay pocas mesas en
  la base, es que no toca, no que se hayan perdido. (El tope de 15 mesas
  ya está quitado.)
- **Las fotos terminadas van después**, y la prueba del nombre de archivo
  con ChatGPT (para subirlas en bloque) la hará cuando las tenga. No
  insistir antes.

**La prueba del local** —la tele, la cortinilla y la música con el wifi
de allí— es **para bastante más cerca del evento**, dicho por él
(2026-09-20). Y la fecha ni siquiera está fijada. No listarla entre lo
pendiente de ahora ni ofrecerla como siguiente paso.

**El mapa de la app** se queda como está hasta que él lo retome
(2026-09-20). Ver «Pendiente: hacer el mapa del sitio privado de verdad»
para el porqué de entonces.
## Deshacer de verdad, y fuera las copias en JSON (2026-09-17, v34)

El usuario lo cerró con una frase que da en el clavo: *"no puedo
restaurar yo, o sea que no tengo la opción de control z de toda la app;
si no me vale para eso, no le veo utilidad"*. Tenía razón: descargar una
copia que no se puede volver a subir no es un deshacer.

**Cómo quedó**: antes de un reinicio, del borrado total o de salir del
Modo Pruebas, la app llama a `anfitrion_guardar_foto_deshacer(token,
accion)` -- la foto va al SERVIDOR (`deshacer_snapshot`, una sola fila) --
y `components/AvisoDeshacer.jsx` pinta el botón con la acción y la hora.
`anfitrion_deshacer` repone y borra la foto: solo se deshace una vez.

⚠️ La foto se guarda **antes** de la acción, y si falla no se toca nada.
Al revés (como estaba con la descarga) el reinicio podía ejecutarse igual
aunque la copia no llegara a existir.

**Una sola reposición para todo**: `foto_de_datos()` y
`restaurar_foto(jsonb)` son ahora los únicos sitios donde se hace la foto
y donde se repone. El Modo Pruebas pasa a usarlas, así que su lista de
tablas y la del deshacer no pueden desincronizarse nunca más -- que es
exactamente el fallo que tuvo `novedades` durante meses. Las dos llevan
`REVOKE EXECUTE ... FROM public, anon, authenticated`: vacían tablas
enteras y Postgres concede EXECUTE a PUBLIC por defecto.

**Borrado**: `lib/backup.js` y su test. Ya no lo usaba nadie tras esto, y
la regla de la casa es no dejar código muerto.

**Limitación conocida y aceptada**: solo se guarda la ÚLTIMA foto.
Deshacer lo de anteayer sigue siendo el volcado diario.

## Retirada la ventana "Backup" (2026-09-17, v32)

⚠️ **`lib/backup.js` NO se ha tocado y sigue en uso**: BORRAR TODO, Modo
Pruebas y los reinicios descargan con `exportarTodo` su copia automática
antes de la acción destructiva. Eso se queda. Lo retirado es solo la
ventana y su entrada de menú.

Si algún día se quiere un "exportar/restaurar" de verdad, primero hay que
arreglar `exportarTodo` para que guarde las doce tablas conservando los
ids -- no reconstruir esta ventana tal cual.

## El registro de migraciones (2026-09-23)

Pregunta suya: *"¿tienes que llevar un registro de todos los SQL que has
subido, o te vale con consultarlo en GitHub?"*.

La respuesta: **el TEXTO del SQL ya está en git** (`schema.sql` y su
historial), y duplicarlo sería el mismo error que descartamos con
`DECISIONS.md`. Pero falta otra cosa: **schema.sql dice cómo debería ser
la base, no qué ha ejecutado él de verdad.** Eso no es un dato del
código, es un dato de su Supabase, y git no puede saberlo.

Nos mordió dos veces en cuatro días: `sinCancion`/`sinEmail` (20 de
septiembre) y `conservarDatos` (21), las dos dadas por subidas sin
estarlo.

**La tabla `migraciones_aplicadas`** lo cierra: nombre y fecha, de
lectura pública, y cada bloque de SQL termina apuntándose solo.
Entonces se comprueba desde fuera con la clave anon, en una llamada, sin
preguntarle nada:

```
GET /rest/v1/migraciones_aplicadas?select=nombre,aplicadaEn&order=aplicadaEn.desc
```

⚠️ **La regla, y es lo único que hay que recordar:** todo SQL que se le
pase termina con su línea. Si no se apunta, el registro miente — y un
registro que miente es peor que no tenerlo.

```sql
insert into public.migraciones_aplicadas ("nombre") values ('v40-lo-que-sea')
  on conflict ("nombre") do nothing;
```

## Comprobar si un SQL está subido, con la clave pública (2026-09-20)

Yo no puedo ejecutar SQL ni tengo la clave de servicio, pero SÍ puedo
comprobar desde fuera si lo que le paso al usuario llegó a la base --
sin ver ni un dato de nadie. La API REST de Supabase distingue "no
existe" de "no tienes permiso", y eso basta:

```bash
set -a; . ./.env; set +a          # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
curl -s -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/<funcion>" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{}'
```

- `PGRST202` ("Could not find the function") -> **no está subido**.
- `42501` ("permission denied for function") -> **está subido**, y
  además el `REVOKE ... FROM anon` funciona.
- Una columna se comprueba igual con
  `/rest/v1/<tabla>?select=<columna>&limit=1`: `42703` es que no existe;
  `42501` es que la tabla no deja leer a `anon` (no dice nada de la
  columna: hay que mirar por otro lado).

Truco que ahorra trabajo: el editor SQL de Supabase ejecuta el script
**entero en una transacción**. Si la ÚLTIMA sentencia del bloque dejó su
huella, todo lo anterior también entró. Con comprobar la última función
del bloque basta.

Así se verificó el 2026-09-20 que los bloques de la v37.8, la v37.10 y la
v37.11 estaban aplicados (`colaborador_familias_sin_email` existe y está
revocada; `fotos_familiares."sinFotoBoda"` existe).

## `schema.sql` reescrito desde cero (2026-09-16)

```sql
alter table evento add column if not exists "cortinillaRealce" integer not null default 15;
alter table mesas drop constraint if exists mesas_numero_check;
alter table mesas add constraint mesas_numero_check check ("numero" >= 1);
```

⚠️ Regla que sustituye a la de antes: **no se añade nada al final de
`schema.sql`**. Si cambia una función, se cambia en su sitio. Si cambia
una columna, se cambia dentro de su `create table` y se anota aquí la
migración que hay que ejecutar en la base real.

El usuario lo dijo claro: *"lo lógico es que la app tenga una misma
filosofía de UX"*. El patrón de Novedades (todo plegado al abrir, como
mucho una sección desplegada) pasa a ser el de la app.

⚠️ **Al añadir una columna nueva**, subir también el `minWidth` del
contenedor de la tabla (`tablaRef`): si las columnas se ahogan, el texto
se recorta antes de tiempo y la tabla se vuelve ilegible aunque
técnicamente cumpla la regla.

## 2026-09-06 (v24): agujero real de escritura anónima, encontrado y cerrado

Salió de una pregunta del usuario ("¿qué peligros hay en que el
repositorio sea público?"). Al auditarlo apareció algo bastante peor que
el repositorio: **cuatro tablas estaban abiertas a ESCRITURA para
cualquiera de internet** — `evento`, `mesas`, `fotos_familiares` y
`orden_familias`, con la política `anon_full_access ... for all using
(true) with check (true)` y los permisos de tabla por defecto intactos.

**Comprobado en vivo, no deducido del código.** Con la clave publicable
sacada del JS compilado de `nexuspoint.rsvp` (que es pública por diseño;
eso no es el fallo), un `PATCH` anónimo sobre `evento` devolvía `204`,
no `403`. La prueba se hizo filtrando a una fila inexistente
(`?id=eq.false`) para confirmar el permiso sin modificar ni un byte real
— merece la pena repetir ese truco cada vez que haya que verificar
permisos contra la base de producción.

**Por qué era grave, y no un detalle:** `evento` guarda las PLANTILLAS
de los emails automáticos. Reescribirlas desde fuera equivale a decidir
el texto de los correos que la propia app manda, con el remitente
legítimo del anfitrión, a los ~140 invitados. El resto (fecha, lugar,
precios, fotos familiares, borrar las mesas, borrar la fila de `evento`
entera) viene detrás.

**Por qué pasó, que es lo que hay que recordar:** la decisión original
era CORRECTA cuando se tomó. El comentario decía "datos sin sensibilidad
real" y esas tablas solo tenían las mesas y el orden de las familias.
Después se le añadieron 13 columnas a `evento` — plantillas de email,
email del anfitrión, cronograma, `asistenciaAbierta`,
`modoPruebasActivo` — sin volver a mirar aquella decisión. **El
comentario se quedó igual mientras el riesgo crecía por debajo.**

⚠️ **Regla nueva: al añadir una columna a una tabla abierta a `anon`,
releer la política de esa tabla en el mismo cambio.** No basta con que
la decisión fuera buena el día que se tomó.

**Cómo quedó:** la lectura sigue abierta (el tablón público la
necesita); escribir pasa por 4 funciones nuevas — `guardar_evento`,
`anfitrion_guardar_mesas`, `guardar_fotos_familiares`,
`guardar_orden_familias` — con el mismo doble cierre que ya tenían
`invitados` y `colaboradores`: política `for select` + `revoke insert,
update, delete, truncate`. Con una sola de las dos capas, la puerta
sigue entornada.

Detalles que conviene no perder:

- **`colaborador_tiene_permiso(text)`**: versión genérica de
  `colaborador_puede_editar_novedades(uuid)`. Resuelve el colaborador
  por `auth.uid()` y NO acepta ningún id que venga del cliente. Usar
  esta para cualquier permiso nuevo.
- **`guardar_evento` aplica lista blanca de columnas a los
  colaboradores.** Sin ella, el permiso `datos_evento_editar` habría
  dejado a un colaborador abrir el control de llegadas
  (`asistenciaAbierta`) o activar el Modo Pruebas — columnas que no
  están en su ventana y que nadie quiso concederle. ⚠️ Al añadir un
  campo a `VentanaConfigDatosEvento.jsx`, añadirlo también a
  `v_permitidas` dentro de la función, o ese campo dejará de guardarse
  para los colaboradores en silencio (el resto de la fila sí se guarda).
- **El `SET` de `guardar_evento` se construye desde `pg_attribute`**, no
  con una lista de columnas escrita a mano. `evento` ya va por 37
  columnas y crece cada pocas sesiones: una lista fija se habría
  desactualizado al primer `alter table`, perdiendo campos sin avisar.
  Los nombres salen del catálogo y van con `%I`; el valor viaja como
  parámetro (`$1`), nunca concatenado.
- **`persistMesas` dejó de ser `delete` + `upsert` en dos llamadas.** Es
  una sola función transaccional, así que ya no puede quedarse a medias
  — el comentario que avisaba de eso en `useLedgerData.js` desapareció
  porque el problema desapareció.

⚠️ **El fallo que se coló y por qué:** las 4 funciones se escribieron con
`p_token text`, pero `anfitrion_secreto.token` es `uuid` y todas las
funciones anteriores declaran `p_token uuid`. Falló al primer intento
(`42883: operator does not exist: text = uuid`) y hubo que rehacerlas
con el `drop function` de rigor. Lo cazó una llamada de prueba con token
falso contra la base real, antes de subir el código — **no la revisión
del código, que dio la firma por buena**. Sin Postgres local ni
credenciales de escritura, esa llamada anónima es la única red que hay:
hacerla siempre antes de desplegar el cliente.

**Orden de despliegue, importante si se repite algo así:** crear las
funciones primero (el código viejo sigue funcionando, no cambia ningún
permiso), desplegar el cliente después, y cerrar los permisos al final.
Al revés hay una ventana en la que nadie puede guardar nada.

## 2026-09-06/07 (v24.2): retirado el enlace ?rol= y rotado el token

✅ **RESUELTO el 2026-09-20.** Era la contrapartida de todo esto: al no
haber ya enlace de emergencia, la única vía de recuperación del
anfitrión es el correo de "recuperar contraseña" de Supabase Auth, que
en el plan gratuito tiene un límite de envío bajo y **falló una vez**
("email rate limit exceeded", agosto). Ya hay **SMTP propio con Resend**
configurado (`smtp.resend.com`, puerto 465, usuario `resend`, la API key
de Resend en el campo Password) y **probado en vivo**: el correo de
recuperación llega al instante desde `mail.nexuspoint.rsvp`, firmado por
ese dominio, no desde `supabase.io`.

⚠️ Dónde vive esa pantalla, que Supabase la ha movido: **Authentication →
Emails → SMTP**, o sea `/dashboard/project/<ref>/auth/smtp`. El viejo
`/settings/auth` ya no lleva ahí.
