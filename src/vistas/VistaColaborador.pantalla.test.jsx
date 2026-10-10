// La pantalla del colaborador, DIBUJADA de verdad.
//
// Es la más delicada de las tres que faltaban: la abren 13 personas que
// no son él, desde sus móviles, durante meses. Si se cae, se entera
// tarde y por WhatsApp.
//
// Comprueba que se PUEDE ver, no cómo se ve (para eso sigue haciendo
// falta su captura, norma 10).
import { describe, it, expect } from "vitest";
import { act } from "react";
import { montar, dibujarYSoltar } from "../pruebas/dibujar";
import { VistaColaborador } from "./VistaColaborador";
import { ROL_FAMILIAR } from "../lib/rolFamiliar";

const evento = {
  fecha: "2026-11-13",
  hora: "18:00",
  lugar: "El sitio",
  nombre: "La boda",
  precioAdulto: "45",
  precioNino: "20",
  edadNinoDesde: "3",
  edadNinoHasta: "12",
  urlPublica: "https://ejemplo.com",
};

// Una familia entera y un suelto: cubre las ramas del formulario que
// dependen del papel de cada uno (matrimonio, hijo menor, quien viene
// solo) y la del invitado que además es colaborador.
const invitados = [
  { id: "g1", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios01", zona: "Icod", rolFamiliar: ROL_FAMILIAR.SUELTO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1990", alergias: "No", email: "", rolesTrabajo: ["Acomodador"] },
  { id: "g2", nombre: "Omar", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Orotava", rolFamiliar: ROL_FAMILIAR.ESPOSO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "1985", anioBoda: "2010", alergias: "", email: "" },
  { id: "g3", nombre: "Míriam", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Orotava", rolFamiliar: ROL_FAMILIAR.ESPOSA, colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1988", anioBoda: "2010", alergias: "No", email: "m@m.com" },
  { id: "g4", nombre: "Lucía", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Orotava", rolFamiliar: ROL_FAMILIAR.HIJO, colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "2018", alergias: "Gluten", email: "" },
];

const colaboradores = [{ id: "c1", nombre: "Barrios, Jacob", invitadoId: "g1", email: "j@j.com", permisos: [] }];

const data = {
  colaboradores,
  invitados,
  persistInvitados: () => {},
  fotosFamiliares: {},
  persistFotosFamiliares: () => {},
  fotosSinBoda: {},
  persistFotosSinBoda: () => {},
  evento,
  ordenFamiliares: [],
  tokenTablon: "",
  esAnfitrion: false,
  familiasSinEmailServidor: ["pacheco01"],
  gastos: [],
  novedades: [],
};

// El formulario se abre desde "Abrir sección…" → "Formulario" (v50.6),
// que además es el camino real de cualquier colaborador.
function abrirPorMenu(vista) {
  const botones = () => [...document.body.querySelectorAll("button")];
  vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
  vista.pulsar(botones().find((b) => b.textContent.trim().replace(/^\d+|\d+$/g, "") === "Formulario"));
}

const dibujar = (extra = {}) =>
  dibujarYSoltar(
    <VistaColaborador
      data={{ ...data, ...extra }}
      colaboradorId="c1"
      esAnfitrionOriginal={false}
      setRol={() => {}}
      anfitrionToken={null}
      onCerrarSesion={() => {}}
    />
  );

// La lista de invitados de esta pantalla vive detrás del botón "Abrir
// formulario": al entrar solo se ve la portada. Así que hay que pulsarlo,
// que además es el camino real de cualquier colaborador.
function abrirFormulario(extra = {}) {
  const vista = montar(
    <VistaColaborador
      data={{ ...data, ...extra }}
      colaboradorId="c1"
      esAnfitrionOriginal={false}
      setRol={() => {}}
      anfitrionToken={null}
      onCerrarSesion={() => {}}
    />
  );
  abrirPorMenu(vista);
  const html = vista.html;
  vista.desmontar();
  return html;
}

describe("la pantalla del colaborador se puede dibujar", () => {
  it("la portada, al entrar", () => {
    expect(() => dibujar()).not.toThrow();
  });

  it("y su lista de invitados al abrir el formulario", () => {
    const html = abrirFormulario();
    expect(html).toContain("Pacheco, Omar");
    expect(html).toContain("Pacheco, Lucía");
  });

  // Las rondas (él, v46.5): con datos a medias la fila solo lleva
  // "datos 0 de 6" y el nombre; ni pago ni check hasta completarlos.
  it("una fila con datos a medias enseña «datos N de M» y el nombre", () => {
    const html = abrirFormulario();
    expect(html).toMatch(/datos \d+ de \d+/);
  });

  it("recién estrenado, sin ningún invitado asignado todavía", () => {
    expect(() => dibujar({ invitados: [] })).not.toThrow();
  });

  it("sin fecha confirmada en el evento", () => {
    expect(() => dibujar({ evento: { ...evento, fechaSinConfirmar: true } })).not.toThrow();
  });

  it("con la ficha de alguien abierta, el formulario entero", () => {
    // Abrir una ficha es donde se dibuja todo lo delicado: el importe,
    // la zona, el año de boda, la foto y los avisos.
    const vista = montar(
      <VistaColaborador
        data={data}
        colaboradorId="c1"
        esAnfitrionOriginal={false}
        setRol={() => {}}
        anfitrionToken={null}
        onCerrarSesion={() => {}}
      />
    );
    abrirPorMenu(vista);
    const ficha = [...vista.contenedor.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Pacheco, Omar")
    );
    expect(ficha).toBeTruthy();
    vista.pulsar(ficha);
    const html = vista.html;
    vista.desmontar();
    expect(html).toContain("Año nac.");
    // La zona, en su pastilla (v42): es de solo ver, y estaba en letra
    // pequeña hasta que él pidió resaltarla.
    expect(html).toContain("Orotava");
  });

  // El anfitrión ve esta misma pantalla desde "Formularios" (vista
  // previa), y por ahí pasa por otra rama: calcula él las familias sin
  // email en vez de recibirlas de la base.
  it("también como vista previa del anfitrión", () => {
    expect(() => dibujar({ esAnfitrion: true })).not.toThrow();
  });

  it("si el colaborador no existe (enlace viejo) no revienta", () => {
    expect(() =>
      dibujarYSoltar(
        <VistaColaborador
          data={data}
          colaboradorId="no-existe"
          esAnfitrionOriginal={false}
          setRol={() => {}}
          anfitrionToken={null}
          onCerrarSesion={() => {}}
        />
      )
    ).not.toThrow();
  });
});

// El pago para toda la familia (norma 11): al tocar "Pago pendiente" de
// uno, si hay más de su familia, pregunta "¿toda la familia?" con Sí y No.
describe("el pago y la llegada, por familias (v60)", () => {
  const hermano = (id, nombre, extra = {}) => ({
    id, nombre, apellido: "Ruiz", grupoFamiliar: "Ruiz01", rolFamiliar: ROL_FAMILIAR.HIJO,
    colaboradorId: "c1", confirmado: true, pagado: false, anioNacimiento: "2010", alergias: "No",
    email: "r@r.com", cancion: "Una", conservarDatos: true, ...extra,
  });
  // Luis lo lleva OTRO colaborador: la familia se ve entera igual.
  const familia = [hermano("r1", "Ana"), hermano("r2", "Luis", { colaboradorId: "c2" })];
  const comoMiembros = familia.map((m) => ({ ...m, datosCompletos: true, presente: false, esMio: m.colaboradorId === "c1" }));
  // `luis`: lo que traiga Luis de más (su pago pendiente, v61).
  const montarRuiz = (luis = {}) => {
    const marcadas = [];
    const elegidas = [];
    const respuestas = [];
    const datos = {
      ...data,
      invitados: [...invitados, familia[0]],
      responderImpago: async (g, id, va) => respuestas.push([g.id, id, va]),
      obtenerMisFamilias: async () => [...comoMiembros.map((m) => (m.id === "r2" ? { ...m, ...luis } : m)), ...invitados.filter((g) => g.colaboradorId === "c1").map((g) => ({ ...g, datosCompletos: Boolean(g.anioNacimiento && g.alergias), esMio: true }))],
      marcarFamilia: async (g, campo, valor) => marcadas.push([g.id, campo, valor]),
      marcarMiembros: async (g, ids, campo, valor) => elegidas.push([g.id, ids, campo, valor]),
    };
    const vista = montar(
      <VistaColaborador data={datos} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} />
    );
    abrirPorMenu(vista);
    return { vista, marcadas, elegidas, respuestas };
  };
  const botones = () => [...document.body.querySelectorAll("button")];
  const pulsarAsync = (b) => act(async () => b.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  const pagoRuiz = () => botones().find((b) => b.textContent.startsWith("Pago ·") && b.parentElement.parentElement.textContent.includes("Ruiz"));

  it("con los datos cerrados, la familia va en una fila con su pago", async () => {
    const { vista } = montarRuiz();
    await act(async () => {});
    expect(document.body.textContent).toContain("Familias");
    expect(pagoRuiz(), "la fila de los Ruiz con «Pago ·»").toBeTruthy();
    // Los Pacheco tienen datos a medias (Omar): siguen persona a persona.
    expect(botones().some((b) => b.textContent.includes("Pacheco, Omar"))).toBe(true);
    vista.desmontar();
  });

  it("«¿Pagan todos los Ruiz?»: «Sí» marca a toda la familia", async () => {
    const { vista, marcadas } = montarRuiz();
    await act(async () => {});
    await pulsarAsync(pagoRuiz());
    const html = document.body.innerHTML;
    expect(html).toContain("¿Pagan todos los Ruiz?");
    expect(html).toContain("Total:");
    expect(html).toContain("Después ya no podrás cambiar sus datos ni su foto.");
    expect(botones().some((b) => b.textContent.trim() === "No")).toBe(true);
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "Sí"));
    expect(marcadas).toEqual([["r1", "pagado", true]]);
    vista.desmontar();
  });

  it("tocar el nombre abre la familia; su miembro abre su ficha y el de otro colaborador solo se ve", async () => {
    const { vista } = montarRuiz();
    await act(async () => {});
    const nombreFamilia = botones().find((b) => b.textContent.startsWith("Ruiz") && b.textContent.includes("▸"));
    await pulsarAsync(nombreFamilia);
    expect(document.body.textContent).toContain("Ruiz, Luis");
    expect(botones().some((b) => b.textContent.includes("Ruiz, Luis"))).toBe(false);
    await pulsarAsync(botones().find((b) => b.textContent.includes("Ruiz, Ana")));
    expect(botones().some((b) => b.textContent.trim() === "Guardar")).toBe(true);
    vista.desmontar();
  });

  it("«No»: la familia se abre para elegir quién, y «Guardar» marca a los elegidos", async () => {
    const { vista, elegidas } = montarRuiz();
    await act(async () => {});
    await pulsarAsync(pagoRuiz());
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    expect(document.body.textContent).toContain("2 de 2");
    // Luis no paga: se le quita.
    await pulsarAsync(botones().find((b) => b.getAttribute("aria-label") === "Ruiz, Luis: sí"));
    expect(document.body.textContent).toContain("1 de 2");
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "Guardar"));
    expect(elegidas).toEqual([["r1", ["r1"], "pagado", true]]);
    vista.desmontar();
  });

  // El que no paga con su familia (él, v61).
  it("al guardar el cobro, por el que no paga: «¿va a ir a la fiesta?», Sí/No", async () => {
    const { vista, respuestas } = montarRuiz();
    await act(async () => {});
    await pulsarAsync(pagoRuiz());
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    await pulsarAsync(botones().find((b) => b.getAttribute("aria-label") === "Ruiz, Luis: sí"));
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "Guardar"));
    expect(document.body.textContent).toContain("¿Ruiz, Luis va a ir a la fiesta?");
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    expect(respuestas).toEqual([["r1", "r2", false]]);
    vista.desmontar();
  });

  it("con su plazo en curso, su aviso en rojo y no se le vuelve a preguntar", async () => {
    const { vista } = montarRuiz({ pagoPendienteHasta: "2999-01-01", plazosPago: 1 });
    await act(async () => {});
    expect(document.body.textContent).toContain("Ruiz, Luis: pago pendiente hasta el");
    await pulsarAsync(pagoRuiz());
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    await pulsarAsync(botones().find((b) => b.getAttribute("aria-label") === "Ruiz, Luis: sí"));
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "Guardar"));
    expect(document.body.textContent).not.toContain("va a ir a la fiesta?");
    vista.desmontar();
  });

  // Tocar el aviso, en cualquier momento (él, v61.1).
  const avisoLuis = () => botones().find((b) => b.textContent.includes("Ruiz, Luis:"));

  it("en plazo, tocar el aviso deja acreditar el pago", async () => {
    const { vista, elegidas } = montarRuiz({ pagoPendienteHasta: "2999-01-01", plazosPago: 1 });
    await act(async () => {});
    await pulsarAsync(avisoLuis());
    expect(document.body.textContent).toContain("¿Ha pagado Ruiz, Luis?");
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "Sí"));
    expect(elegidas).toEqual([["r1", ["r2"], "pagado", true]]);
    vista.desmontar();
  });

  it("en plazo, «No ha pagado» y «Sí va»: se queda como está, sin gastar otro plazo", async () => {
    const { vista, respuestas } = montarRuiz({ pagoPendienteHasta: "2999-01-01", plazosPago: 1 });
    await act(async () => {});
    await pulsarAsync(avisoLuis());
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    expect(document.body.textContent).toContain("sigue con su pago pendiente");
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "Sí"));
    expect(respuestas).toEqual([]);
    vista.desmontar();
  });

  it("en plazo, cambiar la respuesta a «No»: «No asiste»", async () => {
    const { vista, respuestas } = montarRuiz({ pagoPendienteHasta: "2999-01-01", plazosPago: 1 });
    await act(async () => {});
    await pulsarAsync(avisoLuis());
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    expect(respuestas).toEqual([["r1", "r2", false]]);
    vista.desmontar();
  });

  it("el último plazo vencido: tocar el aviso pregunta, y solo deja «No»", async () => {
    const { vista, respuestas } = montarRuiz({ pagoPendienteHasta: "2020-01-01", plazosPago: 3 });
    await act(async () => {});
    expect(avisoLuis().textContent).toContain("Ruiz, Luis: último plazo vencido");
    await pulsarAsync(avisoLuis());
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    expect(document.body.textContent).toContain("Ya no quedan plazos");
    expect(botones().find((b) => b.textContent.trim() === "Sí").disabled).toBe(true);
    await pulsarAsync(botones().find((b) => b.textContent.trim() === "No"));
    expect(respuestas).toEqual([["r1", "r2", false]]);
    vista.desmontar();
  });
});

// Pagado, la ficha se cierra al colaborador (él, v54): ni se abre ni se ve.
describe("la ficha pagada, cerrada", () => {
  it("tocar el nombre avisa «Datos cerrados» y no abre el formulario", () => {
    const vista = montar(
      <VistaColaborador data={data} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} />
    );
    abrirPorMenu(vista);
    // Míriam ya ha pagado.
    const nombre = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Pacheco, Míriam"));
    vista.pulsar(nombre);
    const html = document.body.innerHTML;
    expect(html).toContain("Datos cerrados");
    expect(html).toContain("díselo al anfitrión");
    expect(html).not.toContain("Guardar");
    vista.desmontar();
  });
});

// El formulario de la ficha (él, v50): nada sube hasta "Guardar", que no
// guarda sin los obligatorios; "Cancelar" descarta, preguntando antes; y
// mientras está abierto, no se sale por ningún otro sitio.
describe("el formulario: Guardar y Cancelar", () => {
  const botones = () => [...document.body.querySelectorAll("button")];
  const boton = (t) => botones().find((b) => b.textContent.trim() === t);
  const escribir = (vista, input, valor) =>
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

  // Los campos viven en apartados plegados (v52): hay que abrirlos.
  const abrirApartado = (vista, titulo) =>
    vista.pulsar(botones().find((b) => b.textContent.trim().startsWith(titulo)));
  const escribirEmail = (vista, valor) => {
    abrirApartado(vista, "Año nac.");
    escribir(vista, document.body.querySelector('input[placeholder="correo@ejemplo.com"]'), valor);
  };
  const escribirOtraAlergia = (vista, valor) => {
    abrirApartado(vista, "Alergias");
    const otras = [...document.body.querySelectorAll("label")].find((l) => l.textContent.trim() === "Otras");
    vista.pulsar(otras.querySelector("input"));
    escribir(vista, document.body.querySelector('input[placeholder="Otra (máx. 15)"]'), valor);
  };

  // Omar: esposo, sin alergias, y su familia no tiene email.
  function abrirOmar() {
    const guardados = [];
    const vista = montar(
      <VistaColaborador
        data={{ ...data, persistInvitados: (lista) => guardados.push(lista) }}
        colaboradorId="c1"
        esAnfitrionOriginal={false}
        setRol={() => {}}
        anfitrionToken={null}
        onCerrarSesion={() => {}}
      />
    );
    abrirPorMenu(vista);
    vista.pulsar(botones().find((b) => b.textContent.includes("Pacheco, Omar")));
    return { vista, guardados };
  }

  it("al pie «* Obligatorios», sin «Cerrar» ni el aviso largo del email", () => {
    const { vista } = abrirOmar();
    const html = vista.html;
    vista.desmontar();
    expect(html).toContain("* Obligatorios");
    expect(html).not.toContain("Nadie de esta familia tiene email");
    expect(boton("Cerrar")).toBeFalsy();
    // Su familia no tiene email y él es esposo: le toca, con asterisco.
    expect(html).toContain("Email *");
  });

  it("sin los obligatorios, «Guardar» no guarda y la ficha sigue abierta", () => {
    const { vista, guardados } = abrirOmar();
    vista.pulsar(boton("Guardar"));
    expect(guardados).toHaveLength(0);
    expect(boton("Guardar")).toBeTruthy();
    vista.desmontar();
  });

  // v50.4: el cursor va al primero que falta, y lo que falta late en rojo
  // hasta rellenarlo.
  it("«Guardar» abre el apartado del primero que falta, lleva el cursor y lo que falta late", () => {
    const { vista } = abrirOmar();
    vista.pulsar(boton("Guardar"));
    const email = document.body.querySelector('[data-campo="email"]');
    expect(email, "el apartado del email tenía que abrirse solo").toBeTruthy();
    expect(email.contains(document.activeElement)).toBe(true);
    expect(document.body.querySelector('[data-apartado="datos"]').className).toContain("ficha-incompleta");
    // Alergias sigue cerrado (uno abierto a la vez), pero late igual.
    expect(document.body.querySelector('[data-apartado="alergias"]').className).toContain("ficha-incompleta");
    expect(document.body.textContent).toContain("Faltan datos");
    escribirOtraAlergia(vista, "Marisco");
    expect(document.body.querySelector('[data-apartado="alergias"]').className ?? "").not.toContain("ficha-incompleta");
    vista.desmontar();
  });

  // La foto de boda de Omar (esposo): «No», que no tienen (v58.2).
  // Si Guardar ya abrió el apartado, no se vuelve a pulsar: lo cerraría.
  const marcarSinFotoBoda = (vista) => {
    const casilla = () => [...document.body.querySelectorAll("label")].find((l) => l.title === "No tienen foto de boda");
    if (!casilla()) abrirApartado(vista, "Boda");
    vista.pulsar(casilla().querySelector("input"));
  };

  it("con todo lo obligatorio, «Guardar» sube una vez y cierra", () => {
    const { vista, guardados } = abrirOmar();
    escribirEmail(vista, "omar@ejemplo.com");
    escribirOtraAlergia(vista, "Marisco");
    marcarSinFotoBoda(vista);
    expect(guardados).toHaveLength(0); // escribir no sube nada
    vista.pulsar(boton("Guardar"));
    expect(guardados).toHaveLength(1);
    const omar = guardados[0].find((g) => g.id === "g2");
    expect(omar.email).toBe("omar@ejemplo.com");
    expect(omar.alergias).toBe("Marisco");
    expect(boton("Guardar")).toBeFalsy();
    vista.desmontar();
  });

  // El caso de Daniel Luis (v58.2): con lo obligatorio ya relleno, escribir
  // solo la canción y pulsar «Guardar» la sube. Lucía: menor, con año y
  // alergias, sin pagar.
  it("con lo obligatorio completo, escribir solo la canción y «Guardar» la sube", () => {
    const guardados = [];
    const vista = montar(
      <VistaColaborador data={{ ...data, persistInvitados: (lista) => guardados.push(lista) }} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} />
    );
    abrirPorMenu(vista);
    vista.pulsar(botones().find((b) => b.textContent.includes("Pacheco, Lucía")));
    abrirApartado(vista, "Canción");
    escribir(vista, document.body.querySelector('input[placeholder="Título — Artista"]'), "Bailando — Enrique Iglesias");
    vista.pulsar(boton("Guardar"));
    expect(guardados).toHaveLength(1);
    expect(guardados[0].find((g) => g.id === "g4").cancion).toBe("Bailando — Enrique Iglesias");
    vista.desmontar();
  });

  // Él, v58.2: un matrimonio sin foto y sin «No» no se guarda, y se dice.
  it("matrimonio sin foto de boda ni «No»: no guarda y avisa", () => {
    const { vista, guardados } = abrirOmar();
    escribirEmail(vista, "omar@ejemplo.com");
    escribirOtraAlergia(vista, "Marisco");
    vista.pulsar(boton("Guardar"));
    expect(guardados).toHaveLength(0);
    expect(document.body.textContent).toContain("Falta la foto de boda: súbela, o marca «No» si no tienen.");
    vista.pulsar(boton("Entendido"));
    marcarSinFotoBoda(vista);
    vista.pulsar(boton("Guardar"));
    expect(guardados).toHaveLength(1);
    vista.desmontar();
  });

  // Él, v58.3: foto y año en bloque. Con foto y sin año, no guarda.
  it("con foto de boda y sin año: no guarda y avisa", () => {
    const guardados = [];
    const sinAnio = invitados.map((g) => (g.grupoFamiliar === "Pacheco01" ? { ...g, anioBoda: "" } : g));
    const vista = montar(
      <VistaColaborador
        data={{ ...data, invitados: sinAnio, fotosFamiliares: { Pacheco01: "https://ejemplo.com/boda.jpg" }, persistInvitados: (lista) => guardados.push(lista) }}
        colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}}
      />
    );
    abrirPorMenu(vista);
    vista.pulsar(botones().find((b) => b.textContent.includes("Pacheco, Omar")));
    escribirEmail(vista, "omar@ejemplo.com");
    escribirOtraAlergia(vista, "Marisco");
    vista.pulsar(boton("Guardar"));
    expect(guardados).toHaveLength(0);
    expect(document.body.textContent).toContain("Falta el año de boda: con la foto, va su año.");
    vista.desmontar();
  });

  it("«Cancelar» con algo escrito pregunta «¿Descartar los cambios?»", () => {
    const { vista, guardados } = abrirOmar();
    escribirOtraAlergia(vista, "Marisco");
    vista.pulsar(boton("Cancelar"));
    expect(document.body.textContent).toContain("¿Descartar los cambios?");
    // "No" vuelve al formulario con lo escrito.
    vista.pulsar(boton("No"));
    expect(document.body.querySelector('input[placeholder="Otra (máx. 15)"]').value).toBe("Marisco");
    // "Sí, descartar" cierra sin subir nada.
    vista.pulsar(boton("Cancelar"));
    vista.pulsar(boton("Sí, descartar"));
    expect(guardados).toHaveLength(0);
    expect(boton("Guardar")).toBeFalsy();
    vista.desmontar();
  });

  // v52: seis apartados plegados, uno abierto a la vez; Boda solo O y A.
  it("todo cerrado al abrir, y uno solo abierto a la vez", () => {
    const { vista } = abrirOmar();
    expect(document.body.querySelector('input[placeholder="correo@ejemplo.com"]')).toBeFalsy();
    abrirApartado(vista, "Año nac.");
    expect(document.body.querySelector('input[placeholder="correo@ejemplo.com"]')).toBeTruthy();
    abrirApartado(vista, "Canción");
    expect(document.body.querySelector('input[placeholder="correo@ejemplo.com"]')).toBeFalsy();
    expect(document.body.querySelector('input[placeholder="Título — Artista"]')).toBeTruthy();
    vista.desmontar();
  });

  it("«Boda» sale al esposo, no a quien no viene con pareja", () => {
    const { vista } = abrirOmar();
    expect(botones().some((b) => b.textContent.trim().startsWith("Boda"))).toBe(true);
    vista.desmontar();
    const otra = montar(
      <VistaColaborador data={data} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} />
    );
    abrirPorMenu(otra);
    otra.pulsar(botones().find((b) => b.textContent.includes("Pacheco, Lucía")));
    expect(botones().some((b) => b.textContent.trim().startsWith("Boda"))).toBe(false);
    otra.desmontar();
  });

  it("en Alergias, el campo de «Otras» solo sale al marcarla", () => {
    const { vista } = abrirOmar();
    abrirApartado(vista, "Alergias");
    expect(document.body.querySelector('input[placeholder="Otra (máx. 15)"]')).toBeFalsy();
    const otras = [...document.body.querySelectorAll("label")].find((l) => l.textContent.trim() === "Otras");
    vista.pulsar(otras.querySelector("input"));
    expect(document.body.querySelector('input[placeholder="Otra (máx. 15)"]')).toBeTruthy();
    vista.desmontar();
  });

  it("«Cancelar» sin cambios cierra sin preguntar", () => {
    const { vista } = abrirOmar();
    vista.pulsar(boton("Cancelar"));
    expect(document.body.textContent).not.toContain("¿Descartar los cambios?");
    expect(boton("Guardar")).toBeFalsy();
    vista.desmontar();
  });

  it("con la ficha abierta, tocar otra fila no la cierra (se perdería lo escrito)", () => {
    const { vista } = abrirOmar();
    escribirOtraAlergia(vista, "Marisco");
    vista.pulsar(botones().find((b) => b.textContent.includes("Pacheco, Lucía")));
    vista.pulsar(botones().find((b) => b.textContent.includes("Pacheco, Omar")));
    expect(document.body.querySelector('input[placeholder="Otra (máx. 15)"]').value).toBe("Marisco");
    vista.desmontar();
  });
});

// v50.6: el colaborador tiene su "Abrir sección…", con el sello de sus
// fichas incompletas encima y solo sus líneas dentro.
describe("el «Abrir sección…» del colaborador", () => {
  const botones = () => [...document.body.querySelectorAll("button")];
  const montarVista = (extra = {}) =>
    montar(
      <VistaColaborador data={{ ...data, ...extra }} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} />
    );

  it("lleva el sello encima, y ya no hay botones sueltos", () => {
    const vista = montarVista();
    const abrir = botones().find((b) => b.textContent.includes("Abrir sección"));
    expect(abrir.textContent).toMatch(/\d/); // el número del sello
    expect(botones().some((b) => b.textContent.includes("Abrir formulario"))).toBe(false);
    expect(botones().some((b) => b.textContent.trim().endsWith("Mi cuenta"))).toBe(false);
    vista.desmontar();
  });

  it("dentro: Formulario y Mi cuenta; lo de permiso, solo con permiso", () => {
    const vista = montarVista();
    vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
    const nombres = botones().map((b) => b.textContent.trim().replace(/^\d+|\d+$/g, ""));
    expect(nombres).toContain("Formulario");
    expect(nombres).toContain("Mi cuenta");
    expect(nombres).not.toContain("Datos evento");
    expect(nombres).not.toContain("Invitaciones");
    vista.pulsar(botones().find((b) => b.textContent.trim() === "Mi cuenta"));
    expect(document.body.textContent).toContain("Cerrar sesión");
    vista.desmontar();
  });

  // El permiso Multimedia (v57.2): Música, solo a quien lo tiene.
  it("«Multimedia», solo con su permiso", () => {
    const nombresCon = (permisos) => {
      const vista = montarVista({ colaboradores: [{ ...colaboradores[0], permisos }] });
      vista.pulsar(botones().find((b) => b.textContent.includes("Abrir sección")));
      const nombres = botones().map((b) => b.textContent.trim().replace(/^\d+|\d+$/g, ""));
      vista.desmontar();
      return nombres;
    };
    expect(nombresCon([])).not.toContain("Multimedia");
    expect(nombresCon(["multimedia"])).toContain("Multimedia");
  });
});

// En el móvil, el formulario va a pantalla entera en la barra de ventanas
// (él, v57.1); en el ordenador, sigue siendo una ventana flotante.
describe("el formulario en la barra de ventanas del móvil", () => {
  const conTactil = (fn) => {
    const antes = window.matchMedia;
    window.matchMedia = () => ({ matches: true });
    try {
      return fn();
    } finally {
      window.matchMedia = antes;
    }
  };
  const barraDe = (extra = {}) => ({
    delante: "inicio",
    formularioEnBarra: false,
    abrirFormulario: () => {},
    cerrarFormulario: () => {},
    ...extra,
  });

  it("en el móvil, «Formulario» lo manda a la barra", () =>
    conTactil(() => {
      const abiertos = [];
      const vista = montar(
        <VistaColaborador data={data} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} barra={barraDe({ abrirFormulario: () => abiertos.push(1) })} />
      );
      abrirPorMenu(vista);
      expect(abiertos).toEqual([1]);
      vista.desmontar();
    }));

  it("en la barra y delante, se dibuja a pantalla entera; detrás, sigue montado pero oculto", () =>
    conTactil(() => {
      const dibujarCon = (delante) => {
        const vista = montar(
          <VistaColaborador data={data} colaboradorId="c1" esAnfitrionOriginal={false} setRol={() => {}} anfitrionToken={null} onCerrarSesion={() => {}} barra={barraDe({ formularioEnBarra: true, delante })} />
        );
        const ventana = document.body.querySelector(".ventana-fija");
        const capa = ventana?.parentElement;
        const resultado = {
          hay: Boolean(ventana),
          oculta: capa?.style.display === "none",
          texto: document.body.textContent,
          desplaza: ventana?.querySelector(".ventana-cuerpo")?.style.overflowY,
          conX: Boolean(ventana?.querySelector('button[aria-label="Cerrar"]')),
        };
        vista.desmontar();
        return resultado;
      };
      const delante = dibujarCon("formulario");
      expect(delante.hay).toBe(true);
      // Su cuerpo desplaza: si no, lo de abajo (y «Guardar») no se alcanza.
      expect(delante.desplaza).toBe("auto");
      // Y se cierra desde arriba, como toda ventana (norma 5).
      expect(delante.conX).toBe(true);
      expect(delante.oculta).toBe(false);
      expect(delante.texto).toContain("Tus datos");
      const detras = dibujarCon("inicio");
      expect(detras.hay).toBe(true);
      expect(detras.oculta).toBe(true);
    }));
});
