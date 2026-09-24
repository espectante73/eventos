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

## Cómo está ordenado este archivo, y qué se guarda a partir de ahora

Dos partes, y se usan de forma distinta:

1. **PARTE 1 — Reglas que hay que obedecer siempre.** Se lee antes de
   tocar nada. Incluye «Por qué es así», que son las razones por las que
   algo está hecho de una manera y no de otra.
2. **PARTE 2 — Trampas ya pagadas.** Errores que costaron tiempo real.
   Cada una está aquí porque es lo único que impide repetirla.

⚠️ Una trampa entra aquí **solo si no se le puede poner un test**. Si se
le puede, se le pone: es la regla 6 de «Cómo trabajar aquí».

Hubo una PARTE 3 con la historia — cómo se llegó hasta aquí — y **se
borró el 2026-09-23**, de acuerdo con el usuario. De sus 6.000 palabras,
1.800 eran reglas disfrazadas de relato (están arriba, en «Por qué es
así») y el resto era crónica: *"ese día pasó esto, se probó aquello"*.
Él lo resumió bien: *"si dicen las razones de por qué algo se hace,
entonces son reglas"*. **Lo borrado sigue entero en el historial de
git**, recuperable con un comando.

### La regla, a partir de ahora

La app va a seguir creciendo, así que este archivo volverá a engordar si
no hay un criterio. Es este, y es una sola pregunta antes de escribir un
párrafo:

> **Si borro esto, ¿qué error repetiría o qué decisión desharía?**

- ¿Una regla, o el porqué de que algo sea así? → **PARTE 1**.
- ¿Un error que puede repetirse y **no hay test que lo impida**? →
  **PARTE 2**.
- ¿Ninguno de los dos? → **no se escribe.** El código ya lo cuenta, git
  guarda cómo se llegó, y los tests vigilan lo que se puede vigilar.

Dicho como lo dijo él, que es más corto: **o es una norma de la app, o
es una trampa corregida que explica por qué algo se hace así. Todo lo
que salga de ahí es relato, y por tanto innecesario.**

⚠️ **Un "no" razonado suyo ES una norma**, aunque no lo parezca. Lo
planteó él el 2026-09-23 y tiene razón: después de pesar juntos los pros
y los contras, la conclusión *"esto no se hace así, y este es el
motivo"* cumple todo lo que cumple una norma — es una decisión y no un
suceso, vale hacia adelante, no caduca, y **si no se conoce se
incumple**, que es la prueba de fuego: se la vuelvo a proponer. El mapa
que se queda público, el `DECISIONS.md` que no se hizo, las dos
alternativas de Aniversarios que rechazó: todo eso va a la PARTE 1, en
negativo, no a ningún cajón aparte.

Lo mismo con un duplicado que se descubre. El hallazgo es relato ("los
rojos estaban copiados a mano"); la conclusión es la norma ("los colores
salen de `theme.js`, nunca escritos en el sitio").

### Y cuánto motivo se escribe

> **El motivo se guarda cuando su ausencia provoca un error.**

Suya, el 2026-09-23, y resuelve la duda de siempre: cuánto de lo que
razonamos juntos hay que dejar escrito. Tres líneas:

- **La conclusión** se guarda siempre. Es el "igual a".
- **El motivo**, solo si sin él la conclusión parece arbitraria o
  mejorable y alguien —yo— la va a deshacer creyendo que simplifica.
  *"Las fotos viven fuera de la base"* leído solo suena a complicación
  innecesaria; con cinco palabras detrás (*son 100 y se descargarían
  todas en cada apertura*) ya nadie la toca. Esa línea no es relato: es
  lo que protege la conclusión.
- **El camino se tira siempre.** Los pros y los contras que se pesaron
  no se escriben. Era justo lo que yo venía haciendo al revés: contar el
  razonamiento entero y dejar la conclusión enterrada al final.

⚠️ Única excepción, y es una frase, no una página: **si alguien ya se
equivocó por ese camino, se escribe dónde está el resbalón.** Como el
versionado: "6.10 es 7" se entendió mal y `VERSION_APP` saltó de 7 a 13
en una sesión.

Y cuatro reglas que salen de esta criba, cada una de un error real:

1. **Si un fallo se cierra con un test, el test ES el registro.** No se
   escribe además su historia. Pasó con las mesas, la escala del
   acabado, los permisos y el mapa: el relato sobraba desde el día uno.
2. **Nada que se presente como "el presente"** — estado, versión,
   próximos pasos. Nace caducando. Había una sección «Estado actual» que
   mintió durante siete semanas. El dato vive donde vive: la versión en
   `src/constants.js`, la fecha en la base.
3. **Una advertencia dentro de un relato no protege a nadie.** Si algo
   merece un ⚠, va **solo**, en la PARTE 2. Enterrada en una historia,
   nadie la lee y además impide podar esa historia.
4. **Corto.** Una entrada de la PARTE 2 son de 3 a 8 líneas: qué pasó,
   dónde y qué no repetir. Si crece más, es que se ha colado relato.

⚠️ Y al terminar algo: **preguntarse si hace falta escribirlo, no darlo
por hecho.** La mitad de lo que se borró en la criba lo escribí yo
creyendo que ayudaba.

⚠️ **Este archivo se relee al empezar CADA conversación. El chat no:** se
compacta o se cierra y desaparece. De ahí el error fácil de cometer —
explicarle algo importante en la conversación, quedarse tranquilo porque
"ya está dicho", y perderlo. **Si tiene que sobrevivir, va aquí. Si se
queda en el chat, no existe.**

### Las normas también se pudren

Lo planteó él el 2026-09-23: a medida que la app se concrete, parte de
lo guardado habrá que cambiarlo. Cierto, y el mismo día pasó tres veces
— la norma del pulgar llevaba desfasada desde la v35, la 13 se
contradecía a sí misma, y «Estado actual» mentía desde hacía siete
semanas.

Se pudren de tres maneras: la app cambia y la norma no; una norma nueva
choca con una vieja que nadie miró; o la norma describe un estado en vez
de un criterio.

⚠️ **Las tres las encontró ÉL leyendo, ninguna yo.** Un test vigila que
el código cumpla una regla, pero **no puede vigilar que la regla siga
siendo verdad**. Así que el guardia es de mano, y va en dos momentos:

- **Al tocar una zona de la app**, releer su norma ANTES de escribir
  código. Si ya no describe lo que hay, se corrige en el mismo cambio.
- **Al escribir una norma nueva**, buscar si ya existe otra que diga lo
  contrario. Eso es justo lo que falló con la 13.
- ⚠️ **Al BORRAR código, borrar su norma en el mismo cambio.** Si
  desaparece el botón, la función o la ventana que una regla vigilaba,
  esa regla deja de proteger y pasa a mentir. Pasó con `lib/backup.js`:
  se borró en la v34 y su trampa siguió seis días diciendo que "sigue en
  uso". Una regla falsa es peor que ninguna — me haría proteger algo que
  no existe.

⚠️ **Y la consecuencia buena, que la vio él (2026-09-23): este archivo
encoge cuando la APP se simplifica, no cuando se edita el texto.** Si
dos conceptos se funden, sobra una de sus dos reglas; si una función
desaparece, sobra su trampa entera. Igual que un test lo encoge porque
la app es más segura. En los tres casos el texto sigue a la realidad, y
nunca al revés.

======================================================================

# PARTE 1 — Reglas que hay que obedecer siempre

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
   ⚠️ **El motivo, con sus palabras (2026-09-23): "no darme la razón por
   defecto hace más segura tu aportación como IA".** Está escrito porque
   sin él esta norma se ablanda sola: llevar la contraria se acaba
   leyendo como ser innecesariamente difícil, y entonces desaparece.
   Contradecirle no es un roce, es de lo que depende que pueda fiarse de
   lo que le digo.
5. **`lint`, `build` y `test`: los tres, siempre.** No es rutina, cazan
   cosas distintas. `npm run lint` (`no-undef`) pilla una variable que se
   quedó sin importar al mover código — no rompe el build, revienta en el
   navegador la primera vez que alguien toca esa rama. Y `npm run build`
   pilla lo que el lint NO ve: un import traído del módulo equivocado (el
   nombre existe en algún sitio, así que ESLint lo da por bueno; solo
   Rollup comprueba que el módulo de origen lo exporte de verdad). Pasó
   con `calcularEdad` importado de `lib/formato` en vez de
   `lib/invitados`.
6. **Al arreglar un fallo, dejar un vigilante.** Una trampa que pueda
   tener un test, **lo tiene**: escribir el test es parte de arreglar el
   fallo, no un extra para después. Solo se queda como texto en la PARTE
   2 la que NO se puede probar, y entonces se dice por qué (vive en
   Supabase, en el iPhone, en su Mac o en el panel de otra empresa).
   ⚠️ **No hace falta que el test ejecute la app: se puede probar el
   TEXTO del proyecto.** `supabase/schema.test.js` comprueba que
   `restaurar_foto` inserte las mesas antes que los invitados y que
   ninguna política sea `for all`; `src/reglas-del-proyecto.test.js`,
   que no vuelva un `window.alert`; `src/theme.test.js`, que no se
   escriba un color a mano. Esa puerta es más ancha de lo que parece:
   **antes de dar una trampa por no comprobable, buscar qué archivo
   delataría el fallo.**
7. **Comprobar los cálculos.** En cálculos, algoritmos de varios pasos o
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
   protagonista y lo demás se esconde.
7. **Tablas y listas: una sola línea por fila**, todas de la misma
   altura; si no cabe, se ensancha o se recorta, nunca dos líneas. Y las
   columnas cuadran ENTRE filas: cada fila es su propia caja y no ve a
   las de al lado, así que los anchos van fijos y definidos una sola vez,
   no a lo que mida el contenido de cada una. Lo vigila
   `reglas-del-proyecto.test.js`.
8. **Una sola pieza, no sincronizar**: si dos partes tienen que coincidir
   siempre, comparten componente o constante; no se miden por separado
   para igualarlas.
9. **Toda ventana nueva es una `VentanaFlotante`**; si una crece mucho,
   ventana lanzadora pequeña + una ventana por parte.
10. **La Lista de invitados es la raíz**: una vista que solo reordena lo
    que la lista ya muestra va dentro de la lista, no aparte.
11. **Piezas compartidas**: botones comunes con `Boton` (principal /
    secundario / peligro, con relieve 3D al pulsar); fotos con `HuecoFoto`
    (16:9, mismo marco). Los lenguajes propios ya aprobados (pastilla de
    inicio, mando de música) se respetan tal cual. Los iconos sueltos de
    las tablas YA NO son excepción desde la v36: van con `Boton`.
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
15. **Un cambio de aspecto no está hecho hasta que él lo ha visto.**
    Pedir la captura —mejor del móvil— **antes de decir que está hecho**,
    no después de que él lo vea mal. "Puesto", "hecho" o "ya está" sobre
    algo que no se ha visto es una afirmación sin comprobar, y eso lo
    prohíbe la regla 1 de «Cómo trabajar aquí».
    ⚠️ Y antes de escribir el cambio: **mirar cómo está resuelto lo que
    ya existe al lado** (norma 1). No el primero que se parezca — el de
    su misma situación. El 2026-09-23 hicieron falta tres intentos para
    una columna nueva de la Lista de invitados: se copió el estilo de la
    columna más estrecha (que va sin flecha y centrada), luego la palabra
    del filtro chocaba con otra columna, y el título se puso en la fila
    de abajo en vez de arriba. **Las dos normas estaban escritas; el
    fallo fue no aplicarlas.** Por eso esto no es una norma nueva: es
    esta misma, sin la rendija.
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
20. **Lo que ESCRIBE en los datos vive en `lib/`, con pruebas.** Nunca
    dentro de un componente: ahí no se puede probar sin dibujar la
    pantalla entera, y lo que no se puede probar acaba rompiéndose. Son
    funciones puras que reciben la lista y devuelven la nueva, y
    devuelven `{ datos, aviso }` — si el aviso trae texto, NO se ha
    tocado nada y ese es el motivo. Modelo: `lib/mesas.js`,
    `lib/edicionInvitados.js`. Lo que solo lee o pinta puede quedarse en
    el componente.
19. **Un mensaje de error dice en qué se ha podido equivocar, no solo
    que está mal.** "Respuesta incorrecta" o "No se pudo guardar" dejan a
    la persona sin saber qué hacer distinto. Hay que nombrar lo que
    puede fallar y lo que no importa: *"escribe primero tu apellido y
    después tu nombre; dan igual las mayúsculas y las tildes"*. Y si el
    motivo es técnico, va en letra pequeña (`detalle` de
    `PreguntaSeguridad`). ⚠️ Antes de escribir un "no importa", mirar el
    código que compara: aquí `normalizar_nombre_tablon` perdona
    mayúsculas, tildes, comas y espacios, pero **no el orden**.
18. **Guardar solo lo que cambió, nunca el estado entero.** Cuando dos
    personas pueden escribir a la vez —y aquí pueden: el anfitrión y sus
    colaboradores, o el propio anfitrión con el móvil y el Mac abiertos—
    mandar la colección completa significa **escribir tu copia encima de
    lo que el otro acaba de guardar**. Se pierde sin error y sin aviso:
    el dato simplemente vuelve atrás. Lo destapó él el 2026-09-23
    preguntando qué pasa con varios colaboradores a la vez.
    **Cómo se hace bien** (modelo: `anfitrion_guardar_invitados`): se
    mandan solo las filas que difieren de la última verdad del servidor,
    y **aparte** la lista completa de ids, que es lo único que el
    borrado necesita. Lo que no se manda, no se toca.
    ⚠️ **No hay "solo lo escribe el anfitrión".** Él es anfitrión Y
    colaborador a la vez (lleva 10 invitados suyos) y puede tener el
    formulario en el móvil y la lista en el portátil abiertos a la vez:
    entonces son dos escritores aunque sea una sola persona. Lo dijo él
    el 2026-09-23, y por eso se arreglaron **los siete sitios**, no solo
    los que tenían un colaborador delante: invitados, novedades, fotos
    familiares, mesas, colaboradores, gastos y orden de familias.
    ⚠️ Y hay escritores que no son personas: el trigger
    `invitados_invalidar_invitacion` pone `invitacionEnviada` a false por
    su cuenta. Mandar `orden_familias` entera lo deshacía.
    ⚠️ **No arreglarlo a medias** (él, el mismo día): un patrón peligroso
    corregido en tres sitios de siete no protege nada, solo da sensación
    de que está resuelto.
    ✅ Los siete arreglados, SQL ejecutado y guardado probado en vivo el
    2026-09-23 (`v40-guardar-solo-lo-cambiado` y
    `v40.1-colaboradores-solo-lo-cambiado` en `migraciones_aplicadas`).
    («Tests»: `supabase/schema.test.js` y `src/reglas-del-proyecto.test.js`)
21. **A las personas se las nombra "Apellido, Nombre"**, en toda la app:
    listas, desplegables, avisos y preguntas de confirmación. Así es como
    él las busca — *"los localizo por apellido, es la filosofía de la
    app"*, y venía de su origen. Una sola definición, `nombreCompleto` en
    `lib/formato.js`. Lo vigila `reglas-del-proyecto.test.js`.
22. **Una persona, varios papeles.** Alguien puede ser invitado,
    colaborador y acomodador a la vez: son papeles de la MISMA persona,
    no personas distintas (él, 2026-09-24). Una lista de gente se arma
    **con personas**, y los papeles se enseñan al lado. Nunca pegando una
    fuente detrás de otra: así salía «¿Quién lo atiende?», una fila por
    papel, y quien estaba en los dos cajones aparecía dos veces. Modelo:
    `personasAsignables` en `lib/cronograma.js`.


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

## Cómo se le habla al invitado: tú y USTEDES, nunca vosotros (2026-09-21)

El usuario, corrigiendo un borrador mío: *"no uso el término sentaros,
sí uso sentarles"*. Es el español de Canarias: el plural de "tú" es
**ustedes**, no "vosotros". Vale para TODO el texto que lee un invitado
o un colaborador — pantallas, emails, el tablón y la nota de privacidad.

- Singular: **tú** ("tus datos", "puedes pedirme").
- Plural: **ustedes / les / su** ("sentarles", "avisarles", "sus fotos",
  "si prefieren", "díganselo").
- ❌ Nunca: vosotros, vuestro, -áis, -éis, -asteis, decidme, os esperamos.

⚠️ **"Tilde", no "acento"** (él, 2026-09-23). El **acento** es fonético
—la fuerza de voz—; la **tilde** es el signo que se escribe. Si se habla
de lo que alguien teclea, es tilde. Vale para las pantallas y también
para los comentarios del código: un solo vocabulario.

Repasado el 2026-09-21: en la app solo quedaba un "¡Os esperamos con
muchas ganas!", en la plantilla de la invitación a la familia (el valor
por defecto de `useLedgerData.js` y el de "restaurar textos" de
`VentanaConfigZonaPeligro.jsx`, los dos corregidos a "¡Les esperamos!").
⚠️ El texto que está GUARDADO en la base es suyo y lo cambia él desde
"Texto emails": el suyo también lo tenía y se le avisó.

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

## Por qué es así: decisiones que no se ven en el código

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

**Ninguna tabla abierta a escritura anónima, nunca.** En septiembre
había cuatro (`evento`, `mesas`, `fotos_familiares`, `orden_familias`)
con una política `for all using (true) with check (true)`. Era grave, y
no por lo obvio: `evento` guarda las PLANTILLAS de los emails
automáticos, así que reescribirlas desde fuera es decidir el texto que
la app manda a ~140 invitados con el remitente legítimo del anfitrión.
La decisión original fue correcta cuando se tomó ("datos sin
sensibilidad real") y se pudrió al crecer la tabla por debajo. Regla:
una política de lectura pública es `for select`, nunca `for all`.

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
primero hay que arreglar `exportarTodo` para las doce tablas
conservando los ids.

**El versionado: entero = tema nuevo, decimal = ajuste.** Un entero por
cada funcionalidad nueva de verdad, y un decimal detrás por cada retoque
sobre ESE mismo tema (38, 38.1, 38.2… hasta el siguiente tema, que pasa
a 39). ⚠️ Se malinterpretó una vez y `VERSION_APP` saltó de 7 a 13 en
una sola sesión. **Nunca subir el entero por defecto**: preguntarse
antes si es tema nuevo o ajuste.

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

**⏳ ENCARGO ABIERTO: bajar de las 14.000 palabras.** Él, 2026-09-23,
insistiendo después de la poda: *"son muchas, hay que simplificar más y
dejar solo lo que es realmente útil"*. Para otra sesión, no a última
hora de un día de trabajo. El peso: PARTE 1 **7.619** palabras, PARTE 2
**4.915**, encabezado **~1.500** — empezar por la PARTE 1, que además se
lee entera cada vez. ⚠️ No vale leer por encima y borrar lo que suene a
relleno: la poda de hoy ya se llevó el relato. Solo cede aplicando el
criterio de entrada a **cada párrafo, uno por uno**. Y apretar la
redacción no es recortar: si la norma sigue ahí, las palabras vuelven
la próxima vez que haya que explicarla. Recortar es **quitar**, o dejar
el puntero a un test.

**Adelgazar la PARTE 2 convirtiendo trampas en tests** (idea suya,
2026-09-23; no toca ahora). A medida que la app se concrete, algunas
trampas dejarán de poder ocurrir y su párrafo podrá quedarse en una
línea: *"lo vigila tal test"*. El documento adelgaza **como
consecuencia** de que la app es más segura, no a costa de nada.

⚠️ Con la cuenta hecha, para que la meta sea realista: de las 61
trampas, **28 dependen de algo externo** (Supabase, el iPhone, paneles
de otras empresas, npm, su Mac) y suman 5.201 palabras — esas **no
desaparecen nunca**, por bien que programemos. Las otras **34 son de
nuestro código**, 2.388 palabras: ese es el techo real de lo que se
puede convertir en test.

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

**El mapa de la app** se queda como está hasta que él lo retome
(2026-09-20). Ver «Pendiente: hacer el mapa del sitio privado de verdad»
para el porqué de entonces.

======================================================================

# PARTE 2 — Trampas ya pagadas

Cada entrada dice de qué sección de la PARTE 3 viene, por si hace
falta el contexto completo.

### Sesión del 2026-08-12: Modo Pruebas, seguridad, acuse en PDF, y repaso visual

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

### 2026-08-24: Fase C ampliada (sincronizar email de acceso con avisos) y Fase D (CAPTCHA)

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

### 2026-08-25 (mismo día): refuerzos sobre el tablón, tras verlo listo para ~140 personas (v6.4)

⚠️ **Los navegadores bloquean el audio automático sin interacción
previa del usuario** — no hay forma de que suene sola de verdad al
abrir la página. Se resolvió con un botón flotante visible (nunca un
intento silencioso de `audio.play()` en el `useEffect` inicial, que
fallaría y podría confundirse con un fallo real) — el primer clic de
cada visitante activa la música a partir de ahí.

⚠️ **Aviso ya dejado por escrito en la propia ventana de Configuración**:
si el anfitrión reemplaza la foto más tarde, un enlace YA compartido
antes puede tardar en actualizarse en WhatsApp — cachean la miniatura
por su cuenta la primera vez que alguien pega el enlace, no en cada
visita. No hay nada que hacer desde este lado del código si eso pasa
(haría falta la herramienta de depuración de Meta/Facebook para forzar
un re-escaneo de esa URL en concreto).

### 2026-08-25 (mismo día, tercera tanda): rediseño de Novedades + ventana de verdad (v6.5)

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

### 2026-08-25 (quinta tanda): acordeón de una sola + límite real explicado (WhatsApp)

⚠️ Mismo cuidado que en `usePopupWindow.js`: `window.open(enlaceGrupo)`
se llama ANTES del `.then()` del portapapeles, nunca después -- si se
abriera tras esperar esa promesa, algunos navegadores ya no lo
considerarían una acción directa del clic original y lo bloquearían.

### 2026-08-25 (sexta tanda): bug real -- los buckets de Storage llevaban vacíos desde que se crearon (v6.6)

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

### 2026-08-25 (séptima tanda): el botón "Enlace" copiaba lo de antes, no el enlace nuevo

**Lección para cualquier acción futura que combine portapapeles +
`window.open`/navegación:** el portapapeles siempre primero. Cualquier
cosa que pueda robar el foco de la pestaña (abrir una ventana, enviar a
otra URL) debe ir después, nunca antes.

### 2026-08-25 (octava tanda): el reordenado no bastó -- causa raíz de verdad

**Lección para cualquier cosa nueva que se añada dentro de esta ventana
emergente (o de cualquier otra que se construya así en el futuro) y
que dependa de "qué ventana tiene el foco" (portapapeles, notificaciones,
`window.open` en cadena...): usar siempre el objeto `window` de ESA
ventana, nunca los globales `window`/`navigator`/`document` a secas** --
aunque el código "viva visualmente" en la ventana emergente, sigue
ejecutándose en el realm de la pestaña principal.

### 2026-08-25 (novena tanda): pregunta de acceso al tablón (v6.7)

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

### Ventana "Aniversarios" y las fotos fuera de la base (2026-09-17, v30)

- **Hoja de encargo** (v31.1): dentro del mismo ZIP, un `Hoja de
  encargo.txt` con un bloque redactado por foto (nombres, año de boda,
  años que cumplen) para copiar y pegar en ChatGPT. ⚠️ Regla del usuario:
  **solo se incluye si los datos están COMPLETOS** -- con un año a medias
  la instrucción saldría mal y el fallo se repetiría en las 48. Si falta
  algo, la app dice quiénes y ofrece bajar solo las fotos.

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

⚠️ Si el usuario dice que "el tabulador no pasa por los botones": es
**Safari**, que de fábrica solo tabula entre campos de texto (Ajustes →
Avanzado → "Pulsar Tab para resaltar cada elemento"; o Opción+Tab). No es
un fallo de la app -- comprobarlo antes de tocar nada.

⚠️ Al migrar se perdió el texto de 3 botones por un `\1` que no era una
sustitución de verdad (se escribió literal). Se recuperó del diff. Si se
vuelve a migrar algo en bloque: comprobar el diff, no solo que compile.

### Pendiente: hacer el mapa del sitio privado de verdad (aparcado el 2026-09-16)

⚠️ **Decisión firme del 2026-09-20: se queda como está.** El usuario:
*"lo dejamos como está hasta que vuelva a preguntar"*. No volver a
sacarlo en las listas de pendientes ni ofrecerlo como siguiente paso —
lo retomará él cuando quiera. Lo de abajo es el porqué, para no tener
que reconstruir la conversación si algún día vuelve.

⚠️ No empezar por el código. El primer paso es del usuario y está sin
hacer: Settings -> Change repository visibility -> Private. Vercel sigue
desplegando igual desde un repo privado. Efecto colateral a recordarle:
para enseñárselo al desarrollador que se ofreció a revisarlo habrá que
invitarle como colaborador.

### "Mapa del sitio" en Mi cuenta, con permiso propio (2026-09-16, v29)

⚠️ Este permiso **no existe en `schema.sql`**, a diferencia de los otros
tres. Solo decide si se enseña un enlace; la imagen la sirve la web a
cualquiera que sepa la URL, así que no hay nada que comprobar en la base
de datos y `colaborador_tiene_permiso` no lo mira nunca. No es un
descuido: es la primera clave de la app que es solo de pantalla.

### El Modo Pruebas no guardaba Novedades (2026-09-17)

⚠️ Quedan fuera A PROPÓSITO, y conviene no "arreglarlo" sin pensar:
- `historial_texto` y `tablon_accesos`: son registros de lo que pasó de
  verdad; reponerlos borraría historia real.
- `anfitriones`, `anfitrion_secreto`, `config_secretos`: cuentas y
  llaves. Vaciarlas dejaría a todo el mundo fuera.
- `tablon_secreto`: la pregunta del tablón sí se quedaría cambiada tras
  una prueba. Se deja fuera porque la fila lleva también el token, y
  reponerla entera es más peligroso que el problema que resuelve.

### No se podía salir del Modo Pruebas (2026-09-20, v37.13)

**Lección, y esto vale para cualquier restauración futura**: el orden de
inserción tiene que seguir las claves foráneas. Hoy son estas:
`invitados."mesa"` -> `mesas`, `invitados."colaboradorId"` ->
`colaboradores` (por eso los invitados entran sin colaborador y se
enganchan al final) y `colaboradores."invitadoId"` -> `invitados`. Al
añadir una tabla o una clave foránea nueva, repasar `restaurar_foto`.

### "Autorizo expresamente a que guarden mis datos" (2026-09-21, v39.2)

El texto vive en `evento."notaPrivacidad"`, se ve al pie del tablón y se
edita en Datos del evento (v39.3 y v39.4). ⚠️ **La nota manda sobre el
código**: esta casilla existe porque la nota lo promete. Y ahora que el
texto es editable, **nadie avisa si alguien lo cambia**: la ventana de
edición lo dice en rojo, pero es lo único que hay. Historia de las
decisiones en `textos/nota-privacidad-tablon.md`.

⚠️ **Las fotos de boda SÍ se borran**, también las de quien autorizó
(`persistFotosFamiliares({})`). La autorización habla de "mis datos"; una
foto es otra cosa y ante la duda se borra. Si algún día se quiere lo
contrario, es una decisión suya, no un descuido que arreglar.

### "Todavía no hay fecha confirmada" (2026-09-21, v39)

⚠️ **A propósito NO borra la fecha escrita**, aunque él dijo "anule la
fecha". Dos motivos, los dos reales:
- el **año** se sigue usando para calcular los aniversarios de los 48
  matrimonios (`anioDelEvento`); borrarlo vaciaría esa columna entera;
- si mañana se confirma ese mismo día, no hay que volver a teclearlo.
Lo que hace la casilla es dejar de **enseñarla**. El formulario lo dice
en voz alta cuando está marcada, para que no parezca que se ha perdido.

⚠️ **`VistaTablon.jsx` sigue respetando `tablonOcultarFecha`, y eso NO es
un resto que quitar sin pensarlo.** Se puso para cubrir la ventana entre
el despliegue y el SQL, pero se queda por un motivo mejor: **una foto de
Deshacer o de Modo Pruebas anterior a la migración** trae
`tablonOcultarFecha = true` y `fechaSinConfirmar` vacío. Al restaurarla,
sin esa línea, la fecha provisional se les escaparía a los invitados sin
que nadie se entere. Es el mismo tipo de trampa que las columnas nuevas
NOT NULL rompiendo restauraciones antiguas. Quitarlo solo cuando ya no
quede ninguna foto vieja.

### Dos clases de permiso, no una (2026-09-21, v38.5)

⚠️ El botón desaparece de "Mi cuenta" **también para el anfitrión**
(`VistaAnfitrion` ya no pasa `mostrarRepositorio`). Es lo que se pidió, y
el anfitrión tiene el repositorio en su propio ordenador.

**La lección de toda esta tanda, que es la que vale para mañana**: una
norma suya tiene un ÁMBITO, y el ámbito no siempre está escrito. La 13
nació con los botones 3D y hablaba de acciones; yo la apliqué a un link
de login, que es una convención universal de internet, y quedó mal. Fue
él quien lo vio: *"no me acuerdo en qué momento te puse esa norma, pero
en todas las páginas web oficialmente se ve como un link subrayado"*.
Cuando una norma suya choca de frente con algo que cualquiera reconoce
de internet, el choque es la señal: **preguntar por el alcance antes de
aplicarla al pie de la letra.**

**Lección general**: al añadir una clave a una lista existente, leer el
texto que la lista ya imprime. Aquí la etiqueta era correcta y la frase
que la envolvía, no.

### El mapa se quedaba viejo sin que nadie se enterara (2026-09-23)

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

### El acabado, con una escala y no a ojo (2026-09-20, v38)

**El aire**: los paneles y tarjetas (`p-3 rounded`) pasan a `p-4`. ⚠️ Las
**filas de las tablas no se tocan**: más aire ahí choca de frente con dos
normas suyas anteriores ("una sola línea por fila" y "las ventanas, lo
más pequeñas posible"). Una lista de 140 invitados con más aire es una
lista que no cabe.

### El sello que late (2026-09-20, v38.1)

✅ **Aprobado por el usuario el 2026-09-20** ("espectacular"). Y una
lección de método: los tres aros salieron de tres vueltas suyas seguidas
("más llamativo", "otro aro", "un tercero más rojo"). Ninguna de las
tres la habría acertado yo de una: con él conviene **construir de uno en
uno y enseñar**, no proponer el resultado final de golpe.

### Se acabaron los avisos del navegador (2026-09-20, v37.12)

⚠️ Sigue habiendo DOS excepciones a propósito, y no son un olvido:
`persistNovedades` y `persistPreguntaTablon` devuelven `true`/`false` sin
avisar, porque `VentanaNovedades.jsx` enseña el fallo en su propia
pantalla, junto al texto que no se ha podido guardar -- ahí se entiende
mejor que en una ventana aparte.

### "Datos X de Y": completo es siempre N de N (2026-09-19, v37.5)

### Una familia no se separa en las mesas (2026-09-19, v37)

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

### Relieve, clic y pregunta de seguridad (2026-09-19, v36)

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

### Permiso "Ver el código de la app" (2026-09-18, v34.2)

⚠️ Mismo caso que `mapa_sitio_ver`: **solo de pantalla**. El repositorio
es público, así que el permiso decide quién ve el enlace, no quién entra.
Se le dijo al usuario antes de construirlo. Si el repo pasa a privado,
habrá que invitar al desarrollador también desde GitHub.

### Peso de la app: de 1.196 KB a 443 KB al abrir (2026-09-18, v34.1)

⚠️ **La ventana de Música NO se trocea, a propósito**: se abre en el
local con un wifi desconocido y no puede quedarse descargando delante de
los invitados. Va dentro de VistaAnfitrion, que carga al entrar. Si
alguien propone "optimizarla", este es el motivo para no hacerlo.

⚠️ **Efecto secundario cubierto**: tras un despliegue, una pestaña
abierta de antes pide trozos con nombres que ya no existen. `main.jsx`
escucha `vite:preloadError` y recarga UNA vez (marca en sessionStorage
para no entrar en bucle si el fallo es otro, como estar sin conexión).

### Deshacer de verdad, y fuera las copias en JSON (2026-09-17, v34)

⚠️ La foto se guarda **antes** de la acción, y si falla no se toca nada.
Al revés (como estaba con la descarga) el reinicio podía ejecutarse igual
aunque la copia no llegara a existir.

### `schema.sql` reescrito desde cero (2026-09-16)

⚠️ Regla que sustituye a la de antes: **no se añade nada al final de
`schema.sql`**. Si cambia una función, se cambia en su sitio. Si cambia
una columna, se cambia dentro de su `create table` y se anota aquí la
migración que hay que ejecutar en la base real.

⚠️ **Al añadir una columna nueva**, subir también el `minWidth` del
contenedor de la tabla (`tablaRef`): si las columnas se ahogan, el texto
se recorta antes de tiempo y la tabla se vuelve ilegible aunque
técnicamente cumpla la regla.

### 2026-09-06 (v24): agujero real de escritura anónima, encontrado y cerrado

⚠️ **Regla nueva: al añadir una columna a una tabla abierta a `anon`,
releer la política de esa tabla en el mismo cambio.** No basta con que
la decisión fuera buena el día que se tomó.

⚠️ **El fallo que se coló y por qué:** las 4 funciones se escribieron con
`p_token text`, pero `anfitrion_secreto.token` es `uuid` y todas las
funciones anteriores declaran `p_token uuid`. Falló al primer intento
(`42883: operator does not exist: text = uuid`) y hubo que rehacerlas
con el `drop function` de rigor. Lo cazó una llamada de prueba con token
falso contra la base real, antes de subir el código — **no la revisión
del código, que dio la firma por buena**. Sin Postgres local ni
credenciales de escritura, esa llamada anónima es la única red que hay:
hacerla siempre antes de desplegar el cliente.

### 2026-09-06/07 (v24.2): retirado el enlace ?rol= y rotado el token

⚠️ Dónde vive esa pantalla, que Supabase la ha movido: **Authentication →
Emails → SMTP**, o sea `/dashboard/project/<ref>/auth/smtp`. El viejo
`/settings/auth` ya no lleva ahí.
