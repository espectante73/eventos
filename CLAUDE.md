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
- **Una trampa se borra cuando hoy es imposible caer en ella**: un test
  lo impide o el código que lo permitía ya no existe. No vale que sea
  antigua ni que "ya estemos avisados".

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
6. **En la PARTE 1, cada regla va numerada dentro de su sección**, del 1
   seguido: así se cita ("1.6, regla 3") y la app las cuenta. Lo que no
   es una regla (la 1.12) va con viñetas.

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

**Repasarlas antes de construir o retocar cualquier pantalla.** Entre
paréntesis, dónde está el detalle.

1. **Estandarizar = usar el modelo aprobado de la app.** Colores, letras,
   redondeos, sombras y transparencias salen de `theme.js` (`C`, `T`,
   `R`, `S`, `OP`), nunca escritos a mano; si falta un valor, se añade a
   la escala, no al sitio (única salida: `escala-libre:` y el motivo al
   lado). Nunca un estilo elegido por mí: mirar cómo está resuelto lo
   que ya existe en su misma situación y, si hay duda, **preguntar en una
   línea ANTES de tocar el aspecto**. Y si una norma suya choca con algo
   que cualquiera reconoce de internet, preguntar por su alcance antes
   de aplicarla al pie de la letra. Lo vigila `src/theme.test.js`.
2. **Ventanas tan pequeñas como su contenido**: del ancho de un móvil en
   vertical, también en el ordenador. Toda ventana nueva es una
   `VentanaFlotante`; si crece mucho, lanzadora pequeña + una ventana por
   parte. ⚠️ Las que se usan **mientras se mira otra cosa** —Novedades,
   Cronograma, Música, Lista de invitados— son ventanas de verdad del
   sistema (`usePopupWindow`).
3. **Todo al alcance del pulgar QUE ELIJA CADA UNO.** La app entera se
   acomoda a esa elección; la derecha es solo lo que sale por defecto.
   («El pulgar: la regla y cómo funciona»)
4. **Piezas compartidas, nunca hechas a mano.** Los lenguajes propios
   ya aprobados —pastilla de inicio, mando de música— se respetan tal
   cual. Lo vigila `Boton.test.js`.
   - **Lo que se PULSA** —guardar, borrar, abrir una ventana, un
     desplegable, un título plegable, los iconos sueltos de las tablas—
     → `Boton`: relieve, se hunde al tocarlo, clic y vibración.
   - **Lo que es un LINK** a otro sitio —otra pantalla del login, otra
     web— → `EnlaceTexto`: subrayado y en gris, el estándar de internet.
     Suelto lleva `py-2`: en el móvil un link fino se falla.
   - **Quitar o borrar** → `BotonQuitar`: el mismo círculo rojo, 24 px a
     la vista y 44 de toque. X = quitar; papelera = para siempre.
   - **Las fotos** → `HuecoFoto` (16:9, mismo marco).
   - **Los botones de un mismo grupo**, todos iguales y del ancho del más
     largo; si un rótulo no cabe, **se abrevia, no se ensancha**. En Mi
     cuenta son copia de las filas de "Abrir sección…" (`ANCHO_FILA_MENU`).
5. **Todo plegado y una sola cosa abierta**; en el móvil lo abierto es el
   protagonista. Los textos de ayuda también: al pie de la ventana y
   plegados (`<details>`), nunca entre los botones. Todo panel que se abre
   tiene su **salida ARRIBA y a la vista**, y salir deja la pantalla como
   estaba.
6. **Tablas y listas: una sola línea por fila**, todas de la misma altura
   y sin aire extra (con 140 invitados, una lista con aire no cabe). Si
   no cabe, se ensancha o se recorta, nunca dos líneas. Los anchos de las
   columnas, **fijos y definidos una sola vez**. Lo vigila
   `reglas-del-proyecto.test.js` en la fila del colaborador.
7. **Una sola pieza, no sincronizar**: si dos sitios tienen que decir
   siempre lo mismo —un componente, una constante, una función, qué es
   una familia (`claveFamilia`), cómo se nombra a alguien
   (`nombreCompleto`)—, comparten la definición. Dos copias mantenidas a
   mano **derivan sin que nadie lo vea**.
8. **Una vista que solo reordena o filtra lo que la Lista de invitados
   ya muestra va DENTRO de la lista, no aparte**: la lista es la raíz.
9. **Quitar o borrar pregunta antes**, en la ventana de la app
   (`usePreguntaSeguridad`; `BotonQuitar` ya la lleva dentro), nunca con
   `window.alert`, `window.confirm` ni `prompt`: en las ventanas
   emergentes rompen. Lo vigila `reglas-del-proyecto.test.js`.
10. **No está hecho hasta que él lo ha visto**: pedir la captura (mejor
    del móvil) ANTES de decir que un cambio de aspecto está hecho. Y
    **construir de uno en uno y enseñar**, no el resultado final de
    golpe.
11. **Lo que en la vida real va junto —una pareja, una familia— la app
    lo mantiene junto SOLA.** Ante un dato nuevo, preguntarse si debería
    ir junto con el de alguien más («Un matrimonio comparte año y foto
    de boda»).
    - un dato compartido vale para todos (el año de boda); una acción
      sobre uno se aplica a todos (la mesa de la familia);
    - si no se puede cumplir entera, no se toca nada y se avisa con la
      cifra concreta ("son 4 y quedan 2 sitios"), en una ventana que se
      vea;
    - si quien escribe puede ser un colaborador que guarda una sola
      ficha, la regla va en la BASE (trigger), no solo en la pantalla;
    - lo que ya estaba mal lo ENCUENTRA la Revisión, no se arregla a
      escondidas. ⚠️ Esto protege DECISIONES suyas, no la fontanería:
      mover un archivo de sitio se hace sin preguntar;
    - las excepciones que él marca quedan fuera;
    - ⚠️ hay reglas suyas POR ENCIMA: cada colaborador lleva de 10 a 12
      invitados, así que un matrimonio PUEDE tener dos colaboradores.
      No avisar de eso ni "juntarlos".
12. **Guardar solo lo que cambió, nunca el estado entero.** Siempre hay
    dos escritores posibles —un colaborador, o él con el móvil y el Mac
    abiertos— y a veces un trigger: mandar la colección entera escribe tu
    copia encima de lo que el otro acaba de guardar, sin ningún error.
    Modelo: `anfitrion_guardar_invitados` (las filas cambiadas y, aparte,
    la lista de ids para el borrado). Lo vigilan
    `reglas-del-proyecto.test.js` y `supabase/schema.test.js`.
13. **Un mensaje de error dice en qué se ha podido equivocar**, y qué no
    importa: *"escribe primero tu apellido y después tu nombre; dan igual
    las mayúsculas y las tildes"*. El motivo técnico, aparte y en pequeño
    (`detalle` de `PreguntaSeguridad`). ⚠️ Antes de escribir un "no
    importa", mirar el código que compara: `normalizar_nombre_tablon` no
    perdona el orden.
14. **Lo que ESCRIBE en los datos vive en `lib/`, con pruebas**, nunca
    dentro de una pantalla. Devuelve la lista nueva y un `aviso`: si trae
    texto, o no se hizo el cambio (y ahí está el motivo) o se hizo con
    una salvedad que hay que contar. Modelo: `lib/mesas.js`. Lo que solo
    lee o pinta se queda en la pantalla.
15. **Una persona se nombra siempre "Apellido, Nombre"**: en listas,
    desplegables, avisos y preguntas (`nombreCompleto`). Lo vigila
    `reglas-del-proyecto.test.js`.
16. **Una persona, varios papeles** (invitado, colaborador, acomodador).
    Una lista de gente se arma con personas y sus papeles al lado, nunca
    pegando una fuente tras otra, que duplica a quien está en las dos.
    Modelo: `personasAsignables` (`lib/cronograma.js`).


## 1.3 Cómo está hecha por dentro

1. **El reparto del código.** Si la lógica de una ventana no la usa nadie
   más, vive entera en su propio fichero bajo `src/vistas/anfitrion/`. Si
   la comparten dos o más, se queda en el cascarón (`VistaAnfitrion.jsx`)
   y se pasa como prop, nunca duplicada.
2. **El anfitrión ve la pantalla de un colaborador sin ser él**
   (`vistaPrevia` en `App.jsx`): se le pasan los datos que ya tiene
   cargados y `VistaColaborador` los filtra. Las funciones `colaborador_*`
   exigen la sesión de ESE colaborador (`auth.uid()`), así que una nueva
   no necesita ninguna excepción para el anfitrión.
3. **El email de un invitado está en dos sitios**: su ficha o, si es
   colaborador, el registro de colaboradores. Siempre con
   `emailDeInvitado()` (`lib/useMotorInvitaciones.js`), nunca con
   `invitado.email` a secas.
4. **Los avisos pendientes se recalculan solos: leer lo que la app TIENE,
   no registrar lo que HACE.** `avisoPendiente` e `invitacionEnviada` los
   recalculan dos triggers de `invitados` (`trg_recalcular_aviso_pendiente`,
   `trg_invalidar_invitacion_familia`). Ninguna función los pone a mano,
   salvo estas:
   - `anfitrion_avisar_colaborador`: el "ya avisé" de verdad.
   - `anfitrion_resetear_avisos`: los vuelve a encender para repetir una
     prueba.
   - Las funciones en que el COLABORADOR cambia sus propios datos
     (`colaborador_guardar_invitado`, `colaborador_marcar_pagado`…) llaman
     antes a `set_config('eventos.recalculo_aviso_activo', 'off', true)`,
     para no avisarle de su propio cambio. Una nueva de ese tipo, también.
5. **Un reinicio nuevo:**
   - por `id` de invitado explícito y acotado (modelo:
     `anfitrion_resetear_por_invitados`);
   - `avisoPendiente` solo se apaga si la categoría desasigna al
     colaborador; en las demás vuelve a `("colaboradorId" is not null)`,
     para poder repetir una prueba sin reasignar;
   - palabra de confirmación exacta, y la foto del Deshacer ANTES (lo
     vigila `reglas-del-proyecto.test.js`);
   - "invitación enviada" y "foto familiar" son **por familia**: con
     alcance "un invitado" no aplican.

## 1.4 El pulgar: la regla y cómo funciona

Lo vigilan `reglas-del-proyecto.test.js` y `mano.test.js`; cómo funciona,
en la cabecera de `lib/mano.js`.

1. **Todo lo pulsable que se ponga a un lado lleva SIEMPRE su espejo
   `zurdo:`** en el mismo cambio (`justify-end zurdo:justify-start`,
   `items-end zurdo:items-start`, `zurdo:flex-row-reverse` en filas de
   varios botones). Sin él, la elección de esa persona no se aplica.
2. **Un pulsable suelto que no se alinea a ningún lado se envuelve**:
   `<div className="flex justify-end zurdo:justify-start">`. Esto no lo
   caza ningún test.
3. **Lo que NO se invierte, a propósito**: el mando de la música (con él
   invertido, "atrás" quedaría a la derecha de "adelante"), la X de cerrar
   de las ventanas, las filas de las listas (el check de llegada, las
   papeleras) y las filas alineadas abajo (`items-end` en una fila es
   alinear abajo, no a la derecha).

## 1.5 Cómo se le habla al invitado: tú y USTEDES, nunca vosotros

Español de Canarias, en todo lo que lee un invitado o un colaborador. Lo
vigila `reglas-del-proyecto.test.js`.

1. **Singular tú** ("tus datos"); **plural ustedes / les / su**
   ("sentarles", "sus fotos").
2. ❌ **Nunca vosotros**, vuestro, -áis, -éis, os.
3. **Tilde**, no "acento", cuando se habla de lo que alguien escribe.
4. **Las plantillas guardadas en la base son suyas**: se le avisa, no se
   tocan.

## 1.6 El SQL que se le pasa

1. **Yo no ejecuto SQL: se le da como texto, para una pestaña NUEVA** del
   editor de Supabase. Una reutilizada puede llevar debajo un `create or
   replace` viejo que se vuelve a ejecutar.
2. **Cada bloque termina apuntándose** en `migraciones_aplicadas`:
   `schema.sql` dice cómo debería ser la base, no qué ha ejecutado él. Un
   bloque sin su línea deja el registro mintiendo.

```sql
insert into public.migraciones_aplicadas ("nombre") values ('v40-lo-que-sea')
  on conflict ("nombre") do nothing;
```

3. **Cambiar los parámetros de una función que ya existe**: antes del
   `create or replace`, `drop function if exists nombre(tipos, viejos)`
   con la firma anterior exacta.
4. **Una función nueva que dependa de `auth.uid()` lleva `revoke execute
   ... from public`**: Postgres da permiso de ejecución a todos por
   defecto. `schema.sql` no guarda estos permisos, así que el `revoke` va
   en el SQL que se le pasa. (`mi_rol` responde sin sesión, aunque vacío.)
5. **Todo UPDATE/DELETE lleva WHERE** (para la tabla entera, `where
   true`): Supabase rechaza los que no. Y `schema.sql` es un plano: cada
   cambio en su sitio, nada añadido al final. Lo vigila
   `supabase/schema.test.js`.
6. **Comprobar desde fuera si está subido, con la clave pública**, sin
   ver ningún dato (la API distingue "no existe" de "no tienes permiso"):
   - `PGRST202` → **no está subido**. `42501` → **está subido**, y el
     `revoke` funciona.
   - Una columna: `/rest/v1/<tabla>?select=<columna>&limit=1`. `42703` es
     que no existe; `42501`, que la tabla no deja leer a `anon`.
   - Lo aplicado: `GET /rest/v1/migraciones_aplicadas?select=nombre,aplicadaEn&order=aplicadaEn.desc`.
   - El editor ejecuta el bloque entero en una transacción: si dejó huella
     la ÚLTIMA sentencia, entró todo.

```bash
set -a; . ./.env; set +a          # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
curl -s -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/<funcion>" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{}'
```

7. **Antes de desplegar el cliente que usa una función nueva, llamarla así
   con un token falso.** Sin Postgres local, es la única red.
8. **"function is not unique": mirar las firmas que hay de verdad en la
   base**, no en el código.

```sql
select p.oid::regprocedure as firma
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'nombre_funcion' and n.nspname = 'public';
```

## 1.7 El Deshacer

Lo vigila `supabase/schema.test.js`.

1. **Vive en el SERVIDOR, y las copias en JSON están descartadas.** Él lo
   cerró así: *"no puedo restaurar yo... si no me vale para eso, no le veo
   utilidad"*.
2. **`foto_de_datos()` y `restaurar_foto()` son los ÚNICOS sitios** donde
   se hace la foto y donde se repone; el Modo Pruebas usa esas mismas.
3. **Solo se guarda la ÚLTIMA foto**: lo de anteayer está en el volcado
   diario.
4. **`lib/backup.js` y la ventana "Backup" no se resucitan.** Un
   exportar/restaurar de verdad habría que escribirlo desde cero, con
   todas las tablas y conservando los ids.
5. **Quedan fuera a propósito**: `historial_texto` y `tablon_accesos` (es
   historia real), `anfitriones`, `anfitrion_secreto` y `config_secretos`
   (cuentas y llaves: vaciarlas dejaría a todos fuera) y `tablon_secreto`
   (la fila lleva también el token).
6. **Restaurar sigue el orden de las claves foráneas**: mesas antes que
   invitados; invitados sin colaborador y enganchados al final. Una tabla o
   una clave nueva obliga a repasar `restaurar_foto`.
7. **Una columna nueva va SIN `not null`**: una foto guardada antes de
   existir la trae vacía, y reponerla fallaría.

## 1.8 Los correos

1. **Los de Supabase Auth** (confirmar cuenta, recuperar contraseña)
   **salen por SMTP propio** desde `acceso@mail.nexuspoint.rsvp`
   (Authentication → Emails → SMTP; comprobar la ruta antes de dársela).
   El compartido de Supabase tiene un límite muy bajo: si vuelve "email
   rate limit exceeded", mirar ahí.
2. **Su enlace apunta a la Site URL** (Authentication → URL
   Configuration): si no es `https://nexuspoint.rsvp`, el enlace no abre.
   A vigilar si cambia el dominio.
3. **Un aviso que no llega**: mirar primero "Avisos enviados"
   (`avisos_enviados`) y los logs de Resend, y probar con el botón
   "Probar" junto al email del colaborador. No dar por roto el código sin
   descartar la configuración o la plantilla.

## 1.9 Backup automático de la base de datos

1. **Cada día, GitHub Actions hace un volcado de la base**
   (`.github/workflows/backup.yml`; también a mano: Actions → "Run
   workflow"). Se guarda como **artifact** de esa ejecución (90 días),
   **nunca en un commit**: el repositorio es público y la base guarda
   secretos. Por eso además excluye los datos de `config_secretos` y
   `anfitrion_secreto`. Si el "secret scanning" de GitHub bloquea algo, es
   la señal correcta.
2. **Necesita el secreto `SUPABASE_DB_URL` con la cadena "Session
   pooler"**: la "Direct connection" es solo IPv6 y GitHub no llega.
3. ⚠️ **`pg_dump` tiene que ser de versión igual o mayor que el Postgres
   de Supabase** (imagen `postgres:17`). Si falla con "server version
   mismatch", subir ese número.

## 1.10 Registro de errores con Sentry

Los fallos del móvil de cualquiera llegan a Sentry (región EU, `.de.` en
la dirección). `lib/registroErrores.js` lo arranca desde `main.jsx`, y el
`ErrorBoundary` informa. La dirección (`VITE_SENTRY_DSN`) no es secreta:
está en Vercel y en `.env` (la CLI de Vercel la recibe con `--value`, no
por stdin).

1. ⚠️ **Sin datos de invitados** (decidido con él): `sendDefaultPii:
   false`, sin grabación ni rendimiento, y `limpiarEvento` quita usuario,
   cabeceras, cuerpo y **las consultas de las URLs** (el enlace del tablón
   lleva la llave). Lo vigila `registroErrores.test.js`.
2. ⚠️ **La IP la deduce Sentry en su servidor**: tiene que estar activado
   en su panel Settings → Security & Privacy → "Prevent Storing of IP
   Addresses".
3. **Pesa +31 KB al abrir, y se aceptó.**
4. **Los errores se ven con "Errores app" en Mi cuenta** (solo
   anfitrión), nunca dentro de la app: exigiría una clave secreta de
   Sentry en el navegador.

## 1.11 Por qué es así: decisiones que no se ven en el código

Sin esto escrito, yo propondría deshacerlas creyendo que mejoro algo.

1. **Las imágenes viven FUERA de la base**, en los cajones del almacén; en
   la base solo va la ruta. Son ~100 fotos: metidas en una columna, la app
   se las descargaría TODAS en cada apertura, también el día del evento
   con el wifi del local. Vale para cualquier imagen, también la portada y
   la plantilla de invitación. Lo vigila `reglas-del-proyecto.test.js`.
2. **La ventana "Aniversarios" no es una vista duplicada** (norma 8): no
   reordena la lista, es una zona de TRABAJO para ir cargando ~50 fotos a
   lo largo de semanas. Él descartó las dos alternativas —un panel dentro
   de la celda ("mucho lío") y soltar la carpeta entera de golpe ("tengo
   que escogerla, ubicarla")—. No volver a proponerlas.
3. **Ninguna tabla abierta a escritura anónima, nunca**: una política de
   lectura pública es `for select`, nunca `for all`. `evento` guarda las
   plantillas de los emails, y reescribirlas desde fuera es decidir lo que
   la app manda a los invitados con el remitente del anfitrión. Lo vigila
   `supabase/schema.test.js`. ⚠️ Lo que el test no ve: **una columna nueva
   en una tabla de lectura pública la lee cualquiera**. Antes de añadirla,
   preguntarse si es privada.
4. **El versionado: entero = tema nuevo, decimal = ajuste** (38, 38.1,
   38.2… hasta el siguiente tema, que pasa a 39). ⚠️ Se malinterpretó una
   vez y `VERSION_APP` saltó de 7 a 13 en una sesión. **Nunca subir el
   entero por defecto.**

## 1.12 Lo que está esperando, y por qué no es un fallo

Cosas que no se mueven **porque no toca**. No ofrecerlas como pendiente.

- ✅ **La licencia está decidida**: privada, todos los derechos
  reservados, como pone el README. Cerrado.
- **La hoja de encargo de las fotos** necesita el año de boda, y casi
  ningún matrimonio lo tiene todavía. Lo rellenan los colaboradores con
  la foto.
- **Las pocas mesas de hoy no son las del evento**: serán 12-14, y el
  reparto se hace cuando estén TODAS las confirmaciones.
- **Las fotos terminadas van después**, y la prueba de subirlas en
  bloque (nombre de archivo con ChatGPT) la hará cuando las tenga.
- **La prueba del local** —la tele, la cortinilla y la música con el
  wifi de allí— es para cerca del evento, y la fecha ni está fijada.
- **Sin confirmar si el correo de confirmar cuenta llega ya a Recibidos**
  y no a spam. El de recuperar contraseña, que va por el mismo camino, sí
  llega; lo probará con un colaborador nuevo. El de invitación siempre
  llegó bien.
- **El mapa de la app se queda público** hasta que él lo retome. Si se
  hace privado, el primer paso es suyo: poner privado el repositorio en
  GitHub (Vercel despliega igual; al desarrollador que lo revisa habría
  que invitarle).

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

### 2.4 Un campo de texto no se recopia de su prop

⚠️ **Nunca con un `useEffect`**: se inicializa una vez al montar
(`useState(prop)`) y se guarda al salir del campo. Si no, el propio
guardado repinta la ventana y borra lo que se está escribiendo al lado.

### 2.5 Un matrimonio comparte año y foto de boda

Es el **administrador** quien declara el matrimonio, al poner a dos
personas de la misma familia los papeles **O (esposo) y A (esposa)**.
Desde ese momento, **lo que rellena uno sale ya en la ficha del otro.**
- La **foto** es una por familia, así que ya es la misma.
- El **año** es de cada invitado, y lo iguala la BASE
  (`trg_igualar_anio_boda_pareja`), no la pantalla: el colaborador
  guarda una ficha cada vez, y el cónyuge puede ni estar en su lista.

⚠️ No mover el año a `fotos_familiares`, aunque parezca "una sola
pieza": obliga a cambiar una decena de archivos que leen `g.anioBoda`, y
el disparador ya los mantiene iguales.

### 2.6 "Autorizo expresamente a que guarden mis datos"

⚠️ **La nota de privacidad manda sobre el código**: la casilla existe
porque la nota lo promete. El texto vive en `evento."notaPrivacidad"` y
es editable, así que nadie avisa si alguien lo cambia (la ventana lo
dice en rojo, y es lo único). Porqués en `textos/nota-privacidad-tablon.md`.

⚠️ **Las fotos de boda SÍ se borran**, también las de quien autorizó: la
autorización habla de "mis datos", y ante la duda una foto se borra.
Cambiarlo es decisión suya, no un descuido que arreglar.

### 2.7 "Todavía no hay fecha confirmada"

⚠️ **La casilla NO borra la fecha escrita, solo deja de enseñarla**: el
año se sigue usando para los aniversarios (`anioDelEvento`), y si se
confirma ese mismo día no hay que volver a teclearlo.

⚠️ `VistaTablon.jsx` sigue respetando `tablonOcultarFecha` y **no es un
resto que quitar**: una foto de Deshacer o de Modo Pruebas anterior la
trae, y sin esa línea la fecha provisional se les escaparía a los
invitados. Lo vigila `reglas-del-proyecto.test.js`.

### 2.8 `nvm install` cambia su Mac, no solo la prueba

⚠️ Instalar otra versión de Node para una prueba dejó el alias `default`
apuntando a nada, y en un terminal nuevo no había `node` ni `npm`. Al
terminar, dejar el `default` como estaba (hoy `v24.18.1`; se mira con
`nvm alias default`).

### 2.9 Algo raro con un botón SOLO en el iPhone

⚠️ Sospechar primero del interruptor invisible que `lib/respuestaTactil.js`
mete dentro de cada `<button>` para que vibre (el porqué y sus efectos,
en su cabecera). Se apaga quitando la llamada a `vigilarBotones`. Y no
volver al truco de pulsarlo desde el código: iOS 26.5 lo cerró.

### 2.10 "El tabulador no pasa por los botones"

⚠️ Es **Safari**, que de fábrica solo tabula campos de texto (Ajustes →
Avanzado, u Opción+Tab). No es un fallo de la app.
