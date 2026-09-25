// Guardias de reglas que viven en el proyecto, no en una función.
//
// Idea del usuario (2026-09-23): **una trampa que puede tener un test,
// lo tiene.** Aquí no se prueba la app corriendo, se prueba lo que dice
// el repositorio — la misma técnica que `theme.test.js`, el test del
// mapa y `supabase/schema.test.js`.
//
// Cada `it` es una trampa que ya se pagó. Si se pone en rojo, es ese
// mismo fallo volviendo.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

function jsx(dir = "src", acc = []) {
  for (const n of readdirSync(dir)) {
    const r = join(dir, n);
    if (statSync(r).isDirectory()) jsx(r, acc);
    // ⚠️ `.test.jsx` también fuera: las pruebas de pantalla llevan datos
    // de mentira dentro, y los guardias de abajo los tomaban por código
    // de la app.
    else if (/\.jsx?$/.test(n) && !/\.test\.jsx?$/.test(n)) acc.push(r);
  }
  return acc;
}
const archivos = jsx();
const leer = (r) => readFileSync(r, "utf-8");
// Una línea que empieza por // o * es un comentario: ahí las palabras
// prohibidas se mencionan a propósito, explicando por qué no se usan.
const sinComentarios = (t) =>
  t.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");

describe("norma 12: nada de ventanas del navegador", () => {
  // Bloquean el navegador, y desde una ventana emergente salen en la
  // pestaña equivocada y la dejan colgada. Se migraron todas en la
  // v37.12; el guardia impide que vuelva a colarse una.
  it("ni window.alert ni window.confirm ni window.prompt", () => {
    // Cualquier objeto, no solo `window`: dentro de una ventana emergente
    // se llama desde SU window (`ventanaPropia.prompt(...)`), y así se
    // coló uno en Novedades que el guardia no veía (2026-09-25).
    const culpables = archivos.filter((r) => /\.(alert|confirm|prompt)\s*\(/.test(sinComentarios(leer(r))));
    expect(culpables).toEqual([]);
  });
});

describe("norma 7: la fila del invitado, de una sola línea y a la misma altura", () => {
  // Él, 2026-09-24: con "Rodríguez, Natasha" la fila se deformaba y el
  // botón de llegada dejaba de caer donde el de las filas de al lado.
  // Las columnas son fijas y el nombre se recorta; lo que no puede
  // volver es una altura escrita a mano, que es como se descuadran.
  const fila = leer("src/vistas/VistaColaborador.jsx");

  it("el nombre se recorta con puntos suspensivos, nunca envuelve", () => {
    expect(fila).toMatch(/className="truncate"/);
  });

  it("las alturas de la fila salen todas de ALTO_BOTON_FILA", () => {
    const aMano = sinComentarios(fila).match(/height: \d+,/g) || [];
    expect(aMano).toEqual([]);
  });

  it("las columnas fijas están definidas una sola vez", () => {
    for (const medida of ["ANCHO_PAGO", "ANCHO_DATOS", "ALTO_BOTON_FILA"]) {
      expect((fila.match(new RegExp(`const ${medida} = `, "g")) || []).length).toBe(1);
    }
  });
});

describe("norma 21: a las personas se las nombra Apellido, Nombre", () => {
  // Él, 2026-09-24: "los localizo por apellido, es la filosofía de la
  // app", y venía "desde su origen primitivo". La lista, el buscador y
  // los desplegables ya lo hacían; se salían los avisos y las preguntas
  // de confirmación, que decían "Juan Gatell". Una sola definición,
  // `nombreCompleto` en lib/formato.js.
  it("nadie vuelve a escribir el nombre delante del apellido", () => {
    const culpables = archivos.filter((r) =>
      /\$\{\w+\.nombre\}\s+\$\{\w+\.apellido\}/.test(sinComentarios(leer(r)))
    );
    expect(culpables).toEqual([]);
  });
});

describe("Mi cuenta recibe todo lo que sabe mostrar", () => {
  // La v45 salió con el botón "Diseño app" invisible: VistaAnfitrion
  // mandaba `mostrarDiseno` a la Portada, y la Portada no se lo pasaba a
  // MiCuenta. Las pruebas de la ventana estaban en verde porque probaban
  // la ventana suelta, no el camino hasta el botón. Lo vio él: "v45 no
  // muestra nada nuevo".
  it("la Portada reenvía a MiCuenta cada `mostrar…` que MiCuenta acepta", () => {
    const firma = leer("src/components/MiCuenta.jsx").match(/export function MiCuenta\(\{([^}]*)\}\)/)[1];
    const mostrar = firma.match(/mostrar\w+/g);
    const portada = leer("src/components/Portada.jsx");
    const perdidos = mostrar.filter((p) => !portada.includes(`${p}={${p}}`));
    expect(perdidos).toEqual([]);
  });
});

describe("1.6: tú y ustedes, nunca vosotros", () => {
  // Español de Canarias. Solo palabras que no tienen otra lectura, para
  // que el guardia no salte en falso. Las plantillas que él guarda en la
  // base no las ve este test: son suyas y las cambia él.
  it("ningún texto de la app habla de vosotros", () => {
    const culpables = archivos.filter((r) =>
      /\b(vosotros|vosotras|vuestr[oa]s?|os esperamos|sentaros|decidme)\b/i.test(sinComentarios(leer(r)))
    );
    expect(culpables).toEqual([]);
  });
});

describe("norma 3: lo que se alinea a la derecha lleva su espejo zurdo", () => {
  // La elección de mano solo se aplica si CADA cosa pulsable lleva su
  // espejo. `mano.test.js` prueba el mecanismo, no esto: hasta hoy no lo
  // vigilaba nadie y se rompió una vez (2026-09-21).
  //
  // ⚠️ Dos casos que NO son fallo y por eso se saltan:
  //   · en una columna (`flex-col`), `justify-end` significa ABAJO, no a
  //     la derecha;
  //   · el mando de música tiene lenguaje propio aprobado (norma 11).
  //
  // ⚠️ Y lo que este guardia NO caza: un elemento pulsable suelto que no
  // se alinea a ningún lado. Ese fue justo el fallo del link de GitHub, y
  // sigue dependiendo de mirarlo.
  it("ningún `justify-end` horizontal se queda sin su `zurdo:`", () => {
    const culpables = [];
    for (const ruta of archivos) {
      if (ruta.endsWith("VentanaMusicaEvento.jsx")) continue;
      leer(ruta)
        .split("\n")
        .forEach((linea, i) => {
          if (!linea.includes("justify-end")) return;
          if (linea.includes("flex-col")) return;
          if (linea.includes("zurdo:")) return;
          culpables.push(`${ruta}:${i + 1}`);
        });
    }
    expect(culpables).toEqual([]);
  });
});

describe("norma 16: una sola definición de familia", () => {
  // La norma lo prometía y no era verdad: había CUATRO. Tres copiadas
  // palabra por palabra (matrimonios, revisión, invitados) y una
  // distinta (mesas, que añade el id). Lo destapó él el 2026-09-24
  // pidiendo repasar la 16 "que seguro que hay algo que corregir".
  it("solo `lib/invitados.js` define claveFamilia", () => {
    const definen = archivos.filter((r) => /function claveFamilia\b/.test(leer(r)));
    expect(definen).toEqual(["src/lib/invitados.js"]);
  });
});

describe("las imágenes no vuelven a meterse dentro de la ficha del evento", () => {
  // La norma «Las imágenes viven FUERA de la base» estaba escrita desde
  // el 2026-09-17 para las fotos de boda, y se incumplía en `evento`: la
  // portada y la plantilla de invitación iban como texto dentro de la
  // fila. 830 KB que se bajaban en cada apertura y cada minuto, y que de
  // paso cortaban el guardado por "statement timeout" al tocar cualquier
  // otra cosa del evento.
  it("nadie guarda un data: en evento.imagen ni en imagenInvitacion", () => {
    const culpables = archivos.filter((r) => /imagen\w*:\s*(dataUrl|"?data:)/.test(sinComentarios(leer(r))));
    expect(culpables).toEqual([]);
  });

  it("las dos subidas pasan por el almacén", () => {
    for (const ruta of [
      "src/vistas/anfitrion/VentanaConfigDatosEvento.jsx",
      "src/vistas/anfitrion/VentanaInvitaciones.jsx",
    ]) {
      expect(leer(ruta)).toContain("guardarImagenEvento(");
    }
  });
});

describe("cada pantalla tiene una prueba que la dibuja", () => {
  // Nació el 2026-09-24: un "Algo ha fallado" al pulsar un filtro que no
  // vieron ni el lint, ni el build, ni las 305 pruebas de entonces --
  // ninguna dibujaba una pantalla. Lo encontró él, pulsando.
  //
  // Esto está en vez de escribirlo como norma: un guardia dispara solo,
  // una norma solo si alguien la lee. Y no cuesta ni una palabra de
  // CLAUDE.md.
  //
  // ⚠️ La lista de abajo es de las que FALTAN, y va encogiendo. Añadir
  // una pantalla nueva sin su prueba obliga a meterla aquí, y eso se ve
  // en el diff: no es un olvido silencioso, es una decisión escrita.
  const SIN_PRUEBA_TODAVIA = [
    "VentanaInvitacionesColaborador",
    "VistaAnfitrion",
    "VistaLogin",
    "VistaNuevaContrasena",
    "VistaTablon",
    "VentanaAniversarios",
    "VentanaColaboradoresDatos",
    "VentanaConfigDatosEvento",
    "VentanaConfigModoPruebas",
    "VentanaConfigZonaPeligro",
    "VentanaConfigZonaReinicio",
    "VentanaInvitaciones",
    "VentanaMesas",
    "VentanaMusicaEvento",
    "VentanaPermisos",
    "VentanaProgreso",
    "VentanaVersiones",
  ];

  const pantallas = archivos
    .filter((r) => r.startsWith("src/vistas/"))
    .map((r) => r.split("/").pop().replace(".jsx", ""));

  const pruebasDePantalla = (function reunir(dir = "src", acc = []) {
    for (const n of readdirSync(dir)) {
      const r = join(dir, n);
      if (statSync(r).isDirectory()) reunir(r, acc);
      else if (/\.pantalla\.test\.jsx$/.test(n)) acc.push(leer(r));
    }
    return acc;
  })().join("\n");

  it("hay pantallas que mirar (si esto falla, el buscador está roto)", () => {
    expect(pantallas.length).toBeGreaterThan(15);
  });

  it("las que no están en la lista de pendientes, tienen su prueba", () => {
    const sinCubrir = pantallas.filter(
      (nombre) => !SIN_PRUEBA_TODAVIA.includes(nombre) && !pruebasDePantalla.includes(nombre)
    );
    expect(sinCubrir).toEqual([]);
  });

  it("la lista de pendientes no miente: si una ya tiene prueba, se quita de la lista", () => {
    const yaCubiertas = SIN_PRUEBA_TODAVIA.filter((nombre) => pruebasDePantalla.includes(nombre));
    expect(yaCubiertas).toEqual([]);
  });
});

describe("la Música del evento no se descarga en el local", () => {
  // Se abre en el local, con un wifi desconocido, delante de los
  // invitados: no puede quedarse descargando. Va DENTRO del trozo de
  // VistaAnfitrion a propósito, no en uno suyo.
  it("VentanaMusicaEvento no se carga con lazy()", () => {
    const culpables = archivos.filter((r) => /lazy\s*\([^)]*Musica/i.test(leer(r)));
    expect(culpables).toEqual([]);
  });
});

describe("una pestaña vieja tras un despliegue", () => {
  // Desde que la app se descarga a trozos, una pestaña abierta de antes
  // pide un trozo que ya no existe. Sin esto, se queda en blanco.
  it("main.jsx escucha vite:preloadError", () => {
    expect(leer("src/main.jsx")).toContain("vite:preloadError");
  });
});

describe("el tablón no enseña una fecha provisional", () => {
  // `tablonOcultarFecha` parece un resto de una opción retirada, pero
  // una foto de Deshacer o de Modo Pruebas ANTERIOR a la migración la
  // trae puesta: sin esta línea, al restaurarla se le escaparía la
  // fecha a los invitados sin que nadie se entere.
  it("VistaTablon sigue respetando tablonOcultarFecha", () => {
    expect(leer("src/vistas/VistaTablon.jsx")).toContain("tablonOcultarFecha");
  });
});

describe("el mapa no inventa colores", () => {
  // Tenía la paleta copiada a mano de theme.js y ya había derivado: sus
  // dos dorados no existían en la app.
  it("dibujar-mapa.mjs saca los colores de theme.js", () => {
    const t = leer("scripts/dibujar-mapa.mjs");
    expect(t).toContain('from "../src/theme.js"');
    const hex = [...t.matchAll(/"#[0-9A-Fa-f]{6}"/g)].map((m) => m[0]);
    // El blanco puro es el único literal admitido: no es de la paleta.
    expect(hex.filter((h) => h.toUpperCase() !== '"#FFFFFF"')).toEqual([]);
  });
});

describe("CI y la máquina de desarrollo, la misma versión de Node", () => {
  // 2026-09-20: el flujo pedía Node 20 y aquí se usa el 24. El
  // package-lock que escribe npm 11 se dejaba fuera una dependencia que
  // npm 10 exige, y `npm ci` reventaba. El flujo llevaba desde que se
  // creó sin pasar ni una vez.
  it(".nvmrc y pruebas.yml coinciden", () => {
    expect(existsSync(".nvmrc"), "falta .nvmrc").toBe(true);
    const nvmrc = leer(".nvmrc").trim().replace(/^v/, "").split(".")[0];
    const flujo = leer(".github/workflows/pruebas.yml");
    const m = flujo.match(/node-version:\s*"?(\d+)/);
    expect(m, "no encuentro node-version en pruebas.yml").not.toBeNull();
    expect(m[1]).toBe(nvmrc);
  });
});

describe("el guardado del anfitrión manda solo lo cambiado", () => {
  // La otra mitad del mismo arreglo: si el cliente vuelve a mandar
  // `next` entero, la función nueva ya no borra de más pero el anfitrión
  // seguiría pisando con su copia vieja lo que un colaborador acabe de
  // rellenar.
  const ledger = leer("src/useLedgerData.js");

  it("calcula las filas cambiadas contra la última verdad del servidor", () => {
    expect(ledger).toMatch(/const cambiadas = next\.filter/);
  });

  it("no manda la lista entera como p_filas", () => {
    expect(ledger).toContain("p_filas: cambiadas,");
    expect(ledger).not.toMatch(/anfitrion_guardar_invitados[\s\S]{0,120}p_filas:\s*next\b/);
  });

  it("manda aparte la lista completa de ids, para el borrado", () => {
    expect(ledger).toContain("p_ids: next.map((g) => g.id)");
  });

  // Norma 18, los otros dos sitios con más de un escritor. El usuario es
  // anfitrión Y colaborador a la vez (lleva 10 invitados suyos), así que
  // puede tener el móvil y el portátil escribiendo a la vez él solo.
  it("las novedades también mandan solo lo cambiado", () => {
    expect(ledger).toContain("p_filas: cambiadas,");
    expect(ledger).not.toMatch(/guardar_novedades[\s\S]{0,140}p_filas:\s*next\b/);
  });

  it("las fotos familiares también", () => {
    expect(ledger).toMatch(/const cambiadas = filas\.filter/);
    expect(ledger).not.toMatch(/guardar_fotos_familiares[\s\S]{0,120}p_filas:\s*filas\b/);
  });

  // ⚠️ La fila de `evento` se escapó de todo lo anterior porque va sola
  // (`p_fila`, sin ese), no en una colección. Y es la más cara de todas:
  // lleva la portada y la plantilla de invitación en base64, ~830 KB, así
  // que mandarla entera en cada tecla se cortaba por statement timeout.
  it("la fila del evento también manda solo lo cambiado", () => {
    expect(ledger).toContain("p_fila: cambios }");
    expect(ledger).not.toMatch(/guardar_evento[\s\S]{0,120}p_fila:\s*next\b/);
  });

  it("ninguna llamada de guardado manda una colección entera", () => {
    const sospechosas = [...ledger.matchAll(/p_filas:\s*(\w+)/g)].map((m) => m[1]);
    // `cambiadas` es lo correcto; cualquier otra cosa es la lista entera.
    expect([...new Set(sospechosas)]).toEqual(["cambiadas"]);
  });
});

describe("la Música del evento viene cargada, no a trozos", () => {
  // Se abre en el local con un wifi desconocido: si se descargara al
  // pulsarla, podría quedarse cargando delante de los invitados.
  it("VistaAnfitrion la importa directamente, sin lazy", () => {
    const vista = leer("src/vistas/VistaAnfitrion.jsx");
    expect(vista).toMatch(/^import \{ VentanaMusicaEvento \} from/m);
    expect(vista).not.toMatch(/lazy\([^)]*VentanaMusicaEvento/);
  });
});

describe("el Deshacer: la foto va ANTES, y si falla no se toca nada", () => {
  // Al revés, la acción se ejecutaba aunque la copia no llegara a existir.
  it("cada foto va seguida de «si no se guardó, parar»", () => {
    const usos = archivos
      .map((r) => [r, leer(r)])
      .filter(([, texto]) => texto.includes("await guardarFotoDeshacer("));
    expect(usos.length).toBeGreaterThan(0);
    for (const [ruta, texto] of usos) {
      const trozos = texto.split("await guardarFotoDeshacer(").slice(1);
      for (const trozo of trozos) {
        expect(trozo.slice(0, 200), ruta).toMatch(/if \(!guardada\)\s*(return|\{[^}]*return)/);
      }
    }
  });
});
