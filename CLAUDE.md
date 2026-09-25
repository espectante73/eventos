# Contexto del proyecto para Claude

**Si algo tiene que sobrevivir, va aquí:** este archivo se relee en cada
conversación; el chat se compacta o se cierra.

**Para qué es la app:** organizar la boda del usuario **y reutilizarla
para otros eventos**. Por eso la Zona de Reinicio es permanente. ⚠️ El
día que OTRA persona organice su evento con ella, deja de ser una
actividad personal suya (ver «Autorizo expresamente a que guarden mis
datos»).

## Cómo está ordenado este archivo, y qué se guarda

1. **PARTE 1 — Reglas que hay que obedecer siempre**, con el porqué de
   las que sin él parecerían mejorables. Se lee antes de tocar nada.
2. **PARTE 2 — Trampas ya pagadas**: errores que pueden repetirse y
   **no se pueden vigilar con un test**. Si se puede, se pone el test
   (regla 5 de «Cómo trabajar aquí»).

⚠️ **Se lee también dentro de la app** (Mi cuenta → «Diseño app»). Por
eso la numeración 1.x / 2.x no puede saltarse (lo vigila
`lib/manual.test.js`), solo se pintan párrafos, listas, código, títulos,
negrita y cursiva, y **tras cada cambio se sella**: `node
scripts/sellar-manual.mjs`.

### Qué entra

> **Si borro esto, ¿qué error repetiría o qué decisión desharía?**

- Una regla, o el porqué de algo → **PARTE 1**.
- Un error repetible sin test que lo impida → **PARTE 2**.
- Ninguno → **no se escribe.** El código lo cuenta, git guarda cómo se
  llegó y los tests vigilan lo demás.

Dicho como él: **o es una norma, o es una trampa corregida. Lo demás es
relato.**

- **Un "no" suyo razonado ES una norma**: si no se conoce, se la vuelvo
  a proponer. Va a la PARTE 1, en negativo.
- De un duplicado descubierto se escribe la conclusión ("los colores
  salen de `theme.js`"), no el hallazgo.
- **Las decisiones van aquí, no en un `DECISIONS.md` aparte**: dos
  archivos contando lo mismo acaban contando cosas distintas.

### Cuánto motivo

> **El motivo se guarda cuando su ausencia provoca un error.**

- **La conclusión**, siempre.
- **El motivo**, solo si sin él alguien —yo— la desharía creyendo que
  simplifica. Basta una línea: *"las fotos viven fuera de la base: son
  100 y se descargarían todas en cada apertura"*.
- **El camino, nunca**: los pros y contras que se pesaron no se
  escriben. Solo si alguien ya resbaló por él, una frase con dónde.

### Cómo se escribe

1. **Si un fallo se cierra con un test, el test ES el registro.**
2. **Nada que se presente como "el presente"**: estado, versión,
   próximos pasos. Nace caducando. La versión vive en
   `src/constants.js` y la fecha en la base.
3. **Un ⚠ va solo**, nunca dentro de un relato: ahí nadie lo lee.
4. **Corto**: una trampa, de 3 a 8 líneas. Si crece, se ha colado
   relato.
5. Al terminar algo, **preguntarse si hace falta escribirlo**.

### Las normas también se pudren

La app cambia y la norma no; una norma nueva choca con una vieja; o la
norma describe un estado en vez de un criterio. **Un test no puede
vigilar que una regla siga siendo verdad**, así que el guardia es de
mano:

- **Al tocar una zona**, releer su norma ANTES de escribir código, y
  corregirla en el mismo cambio si ya no es verdad.
- **Al escribir una norma**, buscar si otra dice lo contrario.
- ⚠️ **Al BORRAR código, borrar su norma en el mismo cambio.** Una regla
  falsa es peor que ninguna.

Y la consecuencia: **este archivo encoge cuando la APP se simplifica**,
no al editar el texto. El texto sigue a la realidad, nunca al revés.

======================================================================

# PARTE 1 — Reglas que hay que obedecer siempre

## 1.1 Cómo trabajar aquí

**Siempre en español**, salvo que se pida lo contrario.

**Son sobre CÓMO trabajo, no sobre cómo es la app** (para eso, las "Normas de estándar" de abajo).

1. **Comprobar en la fuente, nunca de memoria.** El código, la versión
   instalada de cada librería (`package.json`) y los paneles o API de
   otras empresas (cambian a menudo) se abren y se comprueban antes de
   afirmar nada. Si no se puede, decirlo. Si hay línea de comandos o
   API, usarla en vez de narrar clics.
2. **Concisión.** La mínima extensión necesaria. **Sin resúmenes finales
   salvo que los pida**, sin repetir código que ya está a la vista, sin
   explicar lo obvio. De los cambios de código, solo las líneas que
   importan. (Se suma a lo de siempre: conclusión primero, lenguaje de
   andar por casa, UN solo siguiente paso.)
3. **"NO DARME LA RAZÓN POR DEFECTO HACE MÁS SEGURA TU APORTACIÓN COMO
   IA."** Si hay un error, un riesgo o un mal enfoque —suyo o mío—,
   decirlo directamente y por qué, ANTES de implementar, aunque no haya
   pedido revisión.
4. **`lint`, `build` y `test`: los tres, siempre.** Cada uno caza lo que
   los otros no ven: el lint, una variable sin importar; el build, un
   import traído del archivo equivocado.
5. **Al arreglar un fallo, dejar un vigilante.** Si se puede probar, el
   test es parte del arreglo. Solo queda como texto en la PARTE 2 lo que
   no, diciendo dónde vive (Supabase, el iPhone, su Mac, el panel de
   otra empresa).
   ⚠️ **Un test también puede leer el TEXTO del proyecto**, sin ejecutar
   la app (`supabase/schema.test.js`, `src/reglas-del-proyecto.test.js`,
   `src/theme.test.js`). Antes de dar un fallo por no comprobable,
   buscar qué archivo lo delataría.
6. **Comprobar los cálculos.** En cálculos, algoritmos de varios pasos o
   lógica condicional enredada, ejecutarlo o repasarlo paso a paso antes
   de darlo por bueno.


## 1.2 Normas de estándar de la app

Lo que el usuario ya ha fijado como norma, recogido en una lista a
petición suya el 2026-09-18. **Repasarla antes de construir o retocar
cualquier pantalla.** El detalle y el porqué de cada una está más abajo,
en la sección que se indica entre paréntesis.
1. **"Estandarizar" es con SU modelo.** El estilo que él nombra o el que
   ya está aprobado en esa pantalla; nunca uno elegido por mí. Si no está
   claro cuál es, **preguntar en una línea ANTES de tocar el aspecto**.
   («Regla de la app: ventanas lo más pequeñas posible»)
2. **Ventanas tan pequeñas como su contenido.** Del ancho de un móvil en
   vertical, también en el ordenador. `ModalFlotante` acepta `ancho`.
   (misma sección)
3. **Todo al alcance del pulgar QUE ELIJA CADA UNO.** La app entera se
   acomoda a esa elección; la derecha es solo lo que sale por defecto.
   («El pulgar: la regla y cómo funciona»)
4. **Botones del mismo grupo, todos iguales y del ancho del texto más
   largo.** En Mi cuenta el modelo es el de inicio: copia exacta de las
   filas de "Abrir sección…" (`FilaMenu`), pastilla verde, letra dorada,
   icono de 19 a la izquierda, ancho `ANCHO_FILA_MENU` importado (no
   copiado). El rótulo más largo es "Mapa del sitio"; si uno pasa de ahí,
   **se abrevia el rótulo, no se ensancha el botón**. Márgenes derecho e
   izquierdo iguales. En otra pantalla, el modelo es el que ya esté
   aprobado en ella (norma 1).
5. **Los textos de ayuda, al pie de la ventana y plegados** (`<details>`),
   no en medio de los botones ni del formulario.
6. **Todo plegado y una sola cosa abierta**; en el móvil lo abierto es el
   protagonista y lo demás se esconde. Y todo panel que se abre tiene su
   **salida ARRIBA y a la vista**, y salir deja la pantalla como estaba
   (la Revisión dejaba la lista filtrada para siempre).
7. **Tablas y listas: una sola línea por fila**, todas de la misma
   altura; si no cabe, se ensancha o se recorta, nunca dos líneas. Y los
   anchos de las columnas van **fijos y definidos una sola vez**: cada
   fila es su propia caja y no ve a las de al lado. Lo vigila
   `reglas-del-proyecto.test.js`, de momento solo en la fila del
   colaborador. ⚠️ Y sin aire extra en las filas (en paneles y tarjetas
   sí): con 140 invitados, una lista con más aire es una lista que no
   cabe.
8. **Una sola pieza, no sincronizar**: si dos sitios tienen que decir
   siempre lo mismo —un componente, una constante, una función—,
   comparten la definición. Nunca dos copias mantenidas iguales a mano:
   **derivan sin que nadie lo vea**.
9. **Toda ventana nueva es una `VentanaFlotante`**; si crece mucho,
   lanzadora pequeña + una ventana por parte. ⚠️ Excepción: las que se
   usan **mientras se mira otra cosa** —Novedades, Cronograma, Música,
   Lista de invitados— son ventanas de verdad del sistema
   (`usePopupWindow`).
10. **Una vista que solo reordena o filtra lo que la Lista de invitados
    ya muestra va DENTRO de la lista, no aparte**: la lista es la raíz.
11. **Piezas compartidas**: los botones con `Boton` (principal /
    secundario / peligro), las fotos con `HuecoFoto` (16:9, mismo marco),
    y también los iconos sueltos de las tablas. Los lenguajes propios ya
    aprobados —pastilla de inicio, mando de música— se respetan tal cual.
12. **Todo quitar o borrar pregunta antes**, en la ventana de la app
    (`usePreguntaSeguridad`), nunca con `window.alert`, `window.confirm`
    ni `prompt` (en las ventanas emergentes rompen). Lo vigila
    `reglas-del-proyecto.test.js`.
13. **Lo que se PULSA lleva relieve; lo que es un LINK va subrayado.**
    Son dos cosas distintas, no una norma con una excepción:
    - **ACCIÓN sobre los datos** —guardar, borrar, confirmar, abrir una
      ventana— → `Boton`: relieve, se hunde al tocarlo, clic y vibración.
      Incluye desplegables y títulos plegables.
    - **LINK que lleva a otro sitio** —otra pantalla del login, otra
      web— → `EnlaceTexto`: subrayado y en gris. Es el **estándar de
      internet**, y por eso se respeta sin inventar nada.
    Una sola pieza para los dos usos (`components/Boton.jsx`); suelto
    lleva `py-2`, que en el móvil un link fino se falla. Lo vigila
    `Boton.test.js`.
    ⚠️ Nació hablando de acciones y yo la apliqué a un link de login. Si
    una norma suya choca con algo que cualquiera reconoce de internet,
    **preguntar por su alcance antes de aplicarla al pie de la letra.**
14. **Quitar/borrar = `BotonQuitar`**: el mismo círculo rojo en toda la
    app, 24 px a la vista y 44 px de zona de toque (el mínimo del móvil).
    X = quitar; papelera (`borrar`) = se borra para siempre. Lleva la
    pregunta dentro.
15. **Pedir la captura ANTES de decir que un cambio de aspecto está
    hecho**: no está hecho hasta que él lo ha visto. Mejor del móvil.
    Decir "hecho" sobre algo que no se ha visto es afirmar sin comprobar,
    justo lo que prohíbe la regla 1 de «Cómo trabajar aquí».
    ⚠️ Y antes de escribir el cambio: **mirar cómo está resuelto lo que
    ya existe al lado** — el de su misma situación, no el primero que se
    parezca.
    Y **construir de uno en uno y enseñar**, no el resultado final de
    golpe: los tres aros del sello salieron de tres vueltas suyas, y
    ninguna la habría acertado yo de una.
16. **Lo que en la vida real va junto —una pareja, una familia— la app
    lo mantiene junto SOLA:**
    1. un dato compartido vale para todos (el año de boda de la pareja);
       una acción sobre uno se aplica a todos (la mesa de la familia);
    2. UNA sola definición de "familia": `claveFamilia` en
       `lib/invitados.js`, nunca una copia por archivo. La única variante
       es `claveFamiliaMesa`, que añade el id y dice por qué;
    3. si no se puede cumplir entera, no se hace a medias: no se toca
       nada y se avisa con la cifra concreta ("son 4 y quedan 2 sitios"),
       en una ventana que se vea;
    4. si quien escribe puede ser un colaborador que solo guarda una
       ficha, la regla va en la BASE (trigger), no solo en la pantalla;
    5. lo que ya estaba mal de antes lo ENCUENTRA la Revisión; no se
       arregla a escondidas. ⚠️ Protege DECISIONES suyas, no la
       fontanería: cambiar un archivo de sitio se hace y ya, sin
       preguntar (él, 2026-09-24);
    6. las excepciones que él marca quedan fuera por diseño;
    7. ⚠️ y hay reglas suyas POR ENCIMA: cada colaborador lleva entre 10
       y 12 invitados ("el mismo peso de responsabilidad"), así que un
       matrimonio PUEDE tener dos colaboradores distintos. No avisar de
       eso ni "juntarlos";
    8. y la regla lleva sus pruebas automáticas.
    Ante un dato nuevo: **¿debería ir junto con el de alguien más?**
    («El año de boda, compartido entre los cónyuges»)

17. **Los valores del acabado salen de `theme.js`, nunca a mano.** Tamaño
    de letra (`T`), redondeo (`R`), sombra (`S`) y transparencia (`OP`).
    Un número suelto pone en rojo `src/theme.test.js`. Si hace falta uno
    que no está, se añade a la
    escala, no al sitio; la única salida es marcar la línea con
    `escala-libre:` y el motivo al lado.
18. **Guardar solo lo que cambió, nunca el estado entero.** Aquí siempre
    hay dos escritores posibles: un colaborador, o él mismo con el móvil
    y el Mac abiertos. Mandar la colección entera es **escribir tu copia
    encima de lo que el otro acaba de guardar**, y el dato vuelve atrás
    sin que salte ningún error.
    **Cómo se hace bien** (modelo: `anfitrion_guardar_invitados`): solo
    las filas que difieren de la última verdad del servidor y, **aparte**,
    la lista completa de ids, que es lo único que el borrado necesita. Lo
    que no se manda, no se toca.
    ⚠️ Y hay escritores que no son personas: un trigger cambia una
    columna por su cuenta, y mandar la colección entera lo deshace. Lo
    vigilan `reglas-del-proyecto.test.js` y `supabase/schema.test.js`.
19. **Un mensaje de error dice en qué se ha podido equivocar, no solo
    que está mal.** Se nombra lo que puede fallar y lo que no importa:
    *"escribe primero tu apellido y después tu nombre; dan igual las
    mayúsculas y las tildes"*. El motivo técnico va aparte, en letra
    pequeña (`detalle` de `PreguntaSeguridad`). ⚠️ Antes de escribir un
    "no importa", mirar el código que compara: `normalizar_nombre_tablon`
    perdona mayúsculas, tildes, comas y espacios, pero **no el orden**.
20. **Lo que ESCRIBE en los datos vive en `lib/`, con pruebas.** Nunca
    dentro de una pantalla: suelto se prueba a fondo, dentro no.
    Devuelven la lista nueva y un `aviso`; si el aviso trae texto, o **no
    se hizo el cambio** y ahí está el motivo, o **se hizo con una
    salvedad** que hay que contar. Modelo: `lib/mesas.js`,
    `lib/edicionInvitados.js`. Lo que solo lee o pinta se queda en la
    pantalla.
21. **La identidad de una persona se muestra siempre como "Apellido,
    Nombre"**, en toda la app: listas, desplegables, avisos y preguntas
    de confirmación. Una sola definición, `nombreCompleto` en
    `lib/formato.js`. Lo vigila `reglas-del-proyecto.test.js`.
22. **Una persona, varios papeles.** Invitado, colaborador y acomodador
    pueden ser el mismo. Una lista de gente se arma **con personas**, con
    sus papeles al lado; nunca pegando una fuente detrás de otra, que
    duplica a quien está en las dos. Modelo: `personasAsignables`
    (`lib/cronograma.js`).


## 1.3 Reglas de diseño ya decididas

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

⚠️ Todo SQL se le pasa para una **pestaña NUEVA** del editor: una
reutilizada puede llevar debajo un `create or replace` viejo que se
vuelve a ejecutar y deja dos versiones de la misma función. Para
diagnosticar "function is not unique", las firmas reales que hay en la
base (más fiable que el código, que solo dice lo que *debería* haber):
```sql
select p.oid::regprocedure as firma
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'nombre_funcion' and n.nspname = 'public';
```

### "avisoPendiente" e "invitacionEnviada" se recalculan solos (triggers), no se fijan a mano

El principio: **leer lo que la app TIENE, no registrar lo que HACE.**
Una bandera que cada función enciende y apaga a mano obliga a mantener la
misma lógica en varios sitios, y se desincroniza en cuanto se toca uno.

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

⚠️ Y un control interactivo puesto en la CABECERA de una ventana (prop
`extra`) tiene que cortar la propagación del `mousedown`/`touchstart`
(`e.stopPropagation()`): si no, tocarlo arrastra la ventana.

Cualquier código nuevo que necesite "el email de un invitado" (no solo
mostrarlo, también para decidir si puede enviársele algo) tiene que
mirar los dos sitios, nunca solo `invitado.email` — si esa persona es
además la única de su unidad familiar, no hay ningún otro miembro al que
recurrir como alternativa. Ver `emailDeInvitado()` y
`destinatarioConEmail()` en `VistaAnfitrion.jsx` (ventana Invitaciones,
detectado y corregido el 2026-08-08 al probar la Fase 4 Ronda 1) —
mismo patrón a seguir si aparece otro sitio que necesite esto.

**2026-08-12: enlace-token de colaborador retirado.** Las 6 RPC
`colaborador_*` exigen además `"authUserId" = auth.uid()`: sin sesión
real, `auth.uid()` es `null` y esas funciones dejan de devolver datos.
El enlace del **anfitrión** se retiró después, en v24.2.

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

⚠️ Los correos de Supabase Auth (confirmación, recuperar contraseña)
salen por SMTP propio desde `acceso@mail.nexuspoint.rsvp`, no por el
compartido de Supabase, que tiene un límite de envío muy bajo. Si
alguna vez vuelve "email rate limit exceeded", mirar ahí primero:
**Authentication → Emails → SMTP** (Supabase ya la movió una vez;
comprobar la ruta antes de dársela).

⚠️ **El enlace de confirmación/recuperación de Supabase apunta a la
"Site URL" configurada en Authentication → URL Configuration** — si no
coincide con el dominio real (`https://nexuspoint.rsvp`), el enlace del
email lleva a una URL que no conecta ("Safari no puede abrir..."). Ya
corregido, pero a vigilar si se cambia de dominio en el futuro.

## 1.4 El pulgar: la regla y cómo funciona

### La regla

**Todo lo que se pulsa va al lado del pulgar de quien lo usa.** Desde la
v35 cada persona elige mano en su móvil y la app entera se acomoda a esa
elección; la derecha es solo lo que sale por defecto, no la norma.

**La única instrucción que hay que recordar:** todo lo pulsable que se
ponga a un lado lleva SIEMPRE su espejo `zurdo:` en el mismo cambio
(`justify-end zurdo:justify-start`, `items-end zurdo:items-start`,
`zurdo:flex-row-reverse` en filas de varios botones). Sin él, la
elección de esa persona no se aplica y el botón se queda donde caiga.
Lo vigila `reglas-del-proyecto.test.js` (el espejo) y `mano.test.js` (el
mecanismo).

⚠️ Lo que ningún test caza: **un pulsable suelto que no se alinea a
ningún lado** (se rompió así el link de GitHub, dentro de un aviso). Hay
que envolverlo: `<div className="flex justify-end zurdo:justify-start">`.

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

## 1.5 Regla de la app: ventanas lo más pequeñas posible

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
lo de dentro.

En esa ventana los rótulos se abrevian ("Código app", "Errores app",
"Cambiar clave") para caber en el ancho del modelo (norma 4).

⚠️ **Lección de esta tanda**: en la v34.5 los pasé a la variante
secundaria de `Boton` (cuadrada, solo contorno) porque me pareció mejor,
y dejé los de los formularios a medida de su texto. El usuario lo había
pedido con el estilo de inicio y todos iguales, y lo tuvo que señalar.
Y se repitió dos veces más (v34.6 a todo lo ancho, v34.7 a 240px centrado)
antes de preguntar. La tercera vez, una pregunta de una línea ("¿es el
menú de Abrir sección…?") lo resolvió a la primera. Preguntar ANTES.

## 1.6 Cómo se le habla al invitado: tú y USTEDES, nunca vosotros

Español de Canarias, en todo lo que lee un invitado o un colaborador:
- Singular **tú** ("tus datos"); plural **ustedes / les / su**
  ("sentarles", "sus fotos").
- ❌ Nunca vosotros, vuestro, -áis, -éis, os.
- **Tilde**, no "acento", cuando se habla de lo que alguien escribe.
- Las plantillas guardadas en la base son suyas: se le avisa, no se tocan.

Lo vigila `reglas-del-proyecto.test.js`.

## 1.7 Backup automático de la base de datos

Existe un backup diario automático vía GitHub Actions
(`.github/workflows/backup.yml`). Se ejecuta
solo cada día y también se puede lanzar a mano desde la pestaña Actions
("Run workflow"). El volcado (`pg_dump`) se guarda como **artifact** de
esa ejecución (Actions → la ejecución → sección "Artifacts", se conservan
90 días) — deliberadamente **no** se commitea al repositorio.

Motivo: la base guarda secretos en `config_secretos` (la clave de
Resend) y `anfitrion_secreto` (el token del anfitrión), y el repositorio
es público. Por eso, dos medidas a la vez: el volcado excluye los datos
de esas dos tablas (`--exclude-table-data`, se conserva su estructura) y
va como artifact, nunca en un commit. Si el "secret scanning" de GitHub
bloquea algo, es la señal correcta, no un error a silenciar.

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

## 1.8 Registro de errores con Sentry

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

⚠️ **La IP la deduce Sentry EN SU SERVIDOR**, de la conexión entrante,
aunque el evento no la traiga: `sendDefaultPii: false` no basta. Hay que
activar en su panel: proyecto → Settings → **Security & Privacy** →
"Prevent Storing of IP Addresses". Pendiente de confirmar que él lo hizo.

v34.4: enlace "Errores de la app" en Mi cuenta, solo anfitrión
(`URL_REGISTRO_ERRORES` en constants.js). Pintar los errores DENTRO de la
app no se hace: exigiría una clave secreta de Sentry en el navegador.

## 1.9 El registro de migraciones

**El TEXTO del SQL ya está en git** (`schema.sql` y su
historial), y duplicarlo sería el mismo error que descartamos con
`DECISIONS.md`. Pero falta otra cosa: **schema.sql dice cómo debería ser
la base, no qué ha ejecutado él de verdad.** Eso no es un dato del
código, es un dato de su Supabase, y git no puede saberlo.

Nos mordió dos veces: dos migraciones dadas por subidas sin estarlo.

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

## 1.10 Comprobar si un SQL está subido, con la clave pública

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

⚠️ **Antes de desplegar el cliente que usa una función nueva, llamarla
así con un token falso.** Sin Postgres local, es la única red: una vez
cazó un `text = uuid` que la revisión del código había dado por bueno.

Truco que ahorra trabajo: el editor SQL de Supabase ejecuta el script
**entero en una transacción**. Si la ÚLTIMA sentencia del bloque dejó su
huella, todo lo anterior también entró. Con comprobar la última función
del bloque basta.

## 1.11 Por qué es así: decisiones que no se ven en el código

Lo que queda cuando se tira la historia. No son anécdotas: son las
razones por las que algo está hecho de esta manera y no de otra. **Sin
esto escrito, yo propondría deshacerlas creyendo que mejoro algo**, que
es exactamente lo que hay que evitar.

**Las imágenes viven FUERA de la base.** En
`fotos_familiares` solo va la RUTA; el archivo está en el cubo cerrado
`fotos-matrimonios` (`lib/fotosAlmacen.js`). Son ~100 fotos: metidas
como texto en una columna, la app se las descargaría TODAS cada vez que
alguien la abre — también en el móvil y con el wifi del local el día del
evento. Las miniaturas son 16:9 con `object-fit: contain`; si una foto
no viene en 16:9 se ve con bandas, y eso es el aviso.

⚠️ **Vale para CUALQUIER imagen**, no solo las de boda: la portada y la
plantilla de invitación van al cajón `imagenes-evento` (v44). Lo vigila
`reglas-del-proyecto.test.js`.

**La ventana "Aniversarios" no es una vista duplicada.** La regla de la
casa dice que una vista que solo reordena lo que la lista ya enseña es
un duplicado (por eso se quitó "Matrimonios"). Esta no reordena: es una
zona de TRABAJO para ir cargando ~50 fotos a lo largo de semanas. El
usuario descartó las dos alternativas que se le propusieron — un panel
dentro de la celda ("mucho lío") y soltar la carpeta entera de golpe
("tengo que escogerla, ubicarla"). No volver a proponerlas.

**Ninguna tabla abierta a escritura anónima, nunca**: una política de
lectura pública es `for select`, nunca `for all`. No es teórico:
`evento` guarda las plantillas de los emails, y reescribirlas desde
fuera es decidir lo que la app manda a los invitados con el remitente
del anfitrión. Lo vigila `supabase/schema.test.js`.
⚠️ Lo que el test no ve: **una columna nueva en una tabla de lectura
pública la lee cualquiera**. Antes de añadirla, preguntarse si es
privada.

**El Deshacer vive en el SERVIDOR, y las copias en JSON están
descartadas.** Él lo cerró así: *"no puedo restaurar yo... si no me vale
para eso, no le veo utilidad"*. Descargar una copia que no se puede
volver a subir no es un deshacer. `foto_de_datos()` y
`restaurar_foto()` son los ÚNICOS sitios donde se hace la foto y donde
se repone; el Modo Pruebas usa esas mismas, para que sus listas de
tablas no puedan desincronizarse (fallo que ya tuvo `novedades` durante
meses). Solo se guarda la ÚLTIMA foto: deshacer lo de anteayer es el
volcado diario. `lib/backup.js` y la ventana "Backup" se borraron; **no
resucitarlas**. Si algún día se quiere un exportar/restaurar de verdad,
hay que escribirlo desde cero: para las doce tablas y conservando los
ids.

**El versionado: entero = tema nuevo, decimal = ajuste.** Un entero por
cada funcionalidad nueva de verdad, y un decimal detrás por cada retoque
sobre ESE mismo tema (38, 38.1, 38.2… hasta el siguiente tema, que pasa
a 39). ⚠️ Se malinterpretó una vez y `VERSION_APP` saltó de 7 a 13 en
una sola sesión. **Nunca subir el entero por defecto**: preguntarse
antes si es tema nuevo o ajuste.

## 1.12 Lo que está esperando, y por qué no es un fallo

Cosas que llevan tiempo sin moverse **porque no toca**, no porque se
hayan olvidado. Antes esto era una sección "Dónde lo dejamos" con fecha,
que se quedó vieja en una semana; esto no caduca porque no habla de un
día concreto.

✅ **La licencia está decidida** (2026-09-20): **privada, todos los
derechos reservados**, como pone el README. Él lo confirmó. Cerrado, no
volver a sacarlo.

**Bloqueado por datos:** la hoja de encargo de las fotos necesita el año
de boda, y casi ningún matrimonio lo tiene todavía. Lo rellenan los
colaboradores junto con la foto; no es trabajo suyo.

**El ritmo real del evento** (él, 2026-09-20). Dos cosas que conviene no
confundir con un fallo:
- **Las pocas mesas de hoy no son las del evento.** Serán **12-14**, y el
  reparto se hace cuando estén TODAS las confirmaciones; antes no se
  puede sentar a nadie. Si hay pocas mesas en
  la base, es que no toca, no que se hayan perdido. (El tope de 15 mesas
  ya está quitado.)
- **Las fotos terminadas van después**, y la prueba del nombre de archivo
  con ChatGPT (para subirlas en bloque) la hará cuando las tenga. No
  insistir antes.

**La prueba del local** —la tele, la cortinilla y la música con el wifi
de allí— es **para bastante más cerca del evento**, dicho por él
(2026-09-20). Y la fecha ni siquiera está fijada. No listarla entre lo
pendiente de ahora ni ofrecerla como siguiente paso.

**Adelgazar la PARTE 2 convirtiendo trampas en tests** (idea suya). A medida que la app se concrete, algunas
trampas dejarán de poder ocurrir y su párrafo podrá quedarse en una
línea: *"lo vigila tal test"*. El documento adelgaza **como
consecuencia** de que la app es más segura, no a costa de nada.

⚠️ Para que la meta sea realista: las trampas que dependen de algo
externo (Supabase, el iPhone, paneles de otras empresas, npm, su Mac)
**no desaparecen nunca**, por bien que programemos. Solo las de nuestro
código pueden acabar siendo un test.

El criterio para cuando se haga: **una trampa se borra cuando hoy es
imposible caer en ella**, y solo hay dos formas — un test lo impide, o
el código que lo permitía ya no existe. No vale que sea antigua, ni que
lleve meses sin pasar, ni que "ya estemos avisados". La prueba concreta,
una por una: **¿qué test o qué línea lo impide hoy?** Si se sabe
nombrar, la trampa se va y queda el puntero; si no, se queda entera.

**Sin confirmar todavía: si el correo de CONFIRMACIÓN de cuenta ya
llega a la bandeja principal.** Sus colaboradores lo encontraban en
spam, pero eso fue con la configuración vieja, cuando Supabase lo
mandaba desde sus servidores compartidos
(`noreply@mail.app.supabase.io`). Desde el 2026-09-20 sale de
`acceso@mail.nexuspoint.rsvp`, y el correo de recuperar contraseña —que
va por el mismo camino— sí le llegó a Recibidos. Lo probará con un
colaborador nuevo. ⚠️ El correo de INVITACIÓN nunca fue el problema: ese
siempre llegó bien.

**El mapa de la app se queda público** hasta que él lo retome: no
ofrecerlo como pendiente. Si algún día se hace privado, el primer paso
es suyo, no del código: poner privado el repositorio en GitHub (Vercel
despliega igual; al desarrollador que lo revisa habría que invitarle).

======================================================================

# PARTE 2 — Trampas ya pagadas

### 2.1 El tablón: música y miniatura de WhatsApp

⚠️ **El navegador no deja sonar audio sin un toque previo.** Por eso la
música del tablón va en un botón visible; nunca un `audio.play()` al
abrir, que fallaría en silencio y parecería un fallo de la app.

⚠️ **WhatsApp guarda la miniatura de un enlace** la primera vez que
alguien lo pega. Si se cambia la foto después, los enlaces ya
compartidos siguen con la vieja un tiempo, y desde el código no se
puede forzar. La ventana de Configuración ya lo avisa.

### 2.2 Ventanas de verdad del sistema (Novedades, Cronograma, Música, Lista)

⚠️ `abrir()` tiene que llamarse **dentro del propio clic**, sin pasar por
un estado y un `useEffect`: si no, Safari la bloquea en silencio. Lo
demás (copiar los estilos, saber si se cerró) está explicado en
`lib/usePopupWindow.js`.

⚠️ **Dentro de esas ventanas, usar SU `window`** (el que da
`usePopupWindow`), nunca `window`/`navigator`/`document` a secas: el
código corre en la pestaña principal, y el portapapeles o un
`window.open` se rechazan en silencio porque el foco lo tiene la otra.

⚠️ **Copiar y abrir en el mismo clic:** empezar a copiar primero y abrir
enseguida, **sin esperar** a que acabe la copia; si se espera, ya no
cuenta como clic y el navegador lo bloquea. (Botón del grupo de WhatsApp
en Novedades.)

### 2.3 Políticas que necesitan saber si eres el anfitrión

⚠️ Una política de seguridad (RLS) **nunca consulta directamente una
tabla cerrada**: falla en silencio. Así llevaron vacíos los cajones de
fotos desde que se crearon. Se pregunta a través de `es_anfitrion()`,
y se prueba una subida real antes de darla por buena. Lo vigila
`supabase/schema.test.js`.

### 2.4 Dos que borraban o fallaban en silencio al guardar

⚠️ **Un campo de texto nunca se vuelve a copiar de su prop con un
`useEffect`**: se inicializa una vez al montar (`useState(prop)`) y se
guarda al salir del campo. Si no, el propio guardado repinta la
ventana y borra lo que se está escribiendo al lado. (Pasó en la
pregunta y la respuesta del tablón.)

⚠️ **Todo UPDATE/DELETE lleva WHERE**; para la tabla entera, `where
true`. Supabase rechaza los que no lo llevan. Lo vigila
`supabase/schema.test.js`.

### 2.5 El año de boda, compartido entre los cónyuges

La foto de boda es POR FAMILIA, pero el año es una columna de CADA
invitado: el cónyuge se quedaba sin año o con otro distinto. Se arregla
**en la base**, no en la pantalla, porque el colaborador guarda una
ficha cada vez y el otro cónyuge puede ni estar en su lista: el
disparador `trg_igualar_anio_boda_pareja` copia el año al cónyuge (y lo
borra en los dos). Relee la fila en vez de fiarse de NEW, y
`pg_trigger_depth() > 1` corta su propia cadena.
- ⚠️ No mover el año a `fotos_familiares`, aunque sería "una sola
  pieza": obliga a cambiar ~8 archivos que leen `g.anioBoda`, y el
  disparador ya garantiza que sean iguales.
- ⚠️ La **hoja de encargo** de las fotos solo se incluye si los datos
  están COMPLETOS: con un año a medias, el fallo se repetiría en las 48.

⚠️ Si "el tabulador no pasa por los botones": es **Safari**, que de
fábrica solo tabula campos de texto (Ajustes → Avanzado, u Opción+Tab).
No es un fallo de la app.

### 2.6 Lo que el Deshacer y el Modo Pruebas dejan fuera, a propósito

⚠️ Quedan fuera A PROPÓSITO, y conviene no "arreglarlo" sin pensar:
- `historial_texto` y `tablon_accesos`: son registros de lo que pasó de
  verdad; reponerlos borraría historia real.
- `anfitriones`, `anfitrion_secreto`, `config_secretos`: cuentas y
  llaves. Vaciarlas dejaría a todo el mundo fuera.
- `tablon_secreto`: la pregunta del tablón sí se quedaría cambiada tras
  una prueba. Se deja fuera porque la fila lleva también el token, y
  reponerla entera es más peligroso que el problema que resuelve.
Lo vigila `supabase/schema.test.js`.

### 2.7 Restaurar sigue el orden de las claves foráneas

⚠️ Mesas antes que invitados, invitados sin colaborador y enganchados al
final. El orden de hoy lo vigila `supabase/schema.test.js`; lo que el
test no puede prever es una tabla o una clave nueva: al añadirla,
repasar `restaurar_foto`.

⚠️ **Una columna nueva va SIN `not null`**: una foto guardada antes de
existir la trae vacía, `jsonb_populate_recordset` pone NULL y reponerla
fallaría. La app trata el vacío como "ninguno".

### 2.8 "Autorizo expresamente a que guarden mis datos"

⚠️ **La nota de privacidad manda sobre el código**: la casilla existe
porque la nota lo promete. El texto vive en `evento."notaPrivacidad"` y
es editable, así que nadie avisa si alguien lo cambia (la ventana lo
dice en rojo, y es lo único). Porqués en `textos/nota-privacidad-tablon.md`.

⚠️ **Las fotos de boda SÍ se borran**, también las de quien autorizó: la
autorización habla de "mis datos", y ante la duda una foto se borra.
Cambiarlo es decisión suya, no un descuido que arreglar.

### 2.9 "Todavía no hay fecha confirmada"

⚠️ **La casilla NO borra la fecha escrita, solo deja de enseñarla**: el
año se sigue usando para los aniversarios (`anioDelEvento`), y si se
confirma ese mismo día no hay que volver a teclearlo.

⚠️ `VistaTablon.jsx` sigue respetando `tablonOcultarFecha` y **no es un
resto que quitar**: una foto de Deshacer o de Modo Pruebas anterior la
trae, y sin esa línea la fecha provisional se les escaparía a los
invitados. Lo vigila `reglas-del-proyecto.test.js`.

### 2.10 `nvm install` cambia su Mac, no solo la prueba

⚠️ Instalar otra versión de Node para una prueba dejó el alias `default`
apuntando a nada, y en un terminal nuevo no había `node` ni `npm`. Al
terminar, dejar el `default` como estaba (hoy `v24.18.1`; se mira con
`nvm alias default`).

### 2.11 Algo raro con un botón SOLO en el iPhone

⚠️ Sospechar primero del interruptor invisible que `lib/respuestaTactil.js`
mete dentro de cada `<button>` para que vibre (el porqué y sus efectos,
en su cabecera). Se apaga quitando la llamada a `vigilarBotones`. Y no
volver al truco de pulsarlo desde el código: iOS 26.5 lo cerró.

