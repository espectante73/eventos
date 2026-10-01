// La Lista de invitados, DIBUJADA de verdad.
//
// Por qué existe (él, 2026-09-24): al añadir "Colaborador" al filtro de
// Función, la pantalla entera se cayó con "Algo ha fallado" en cuanto él
// pulsó "Acomodador". Ni `npm run lint` ni `npm run build` lo vieron --
// leer una constante antes de declararla es código válido y solo revienta
// al ejecutarse -- y el resto de las pruebas de este proyecto comprueban
// funciones o el texto del repositorio, nunca una pantalla.
//
// Esto es lo que faltaba: montar la sección con datos de mentira y pasar
// por CADA valor de CADA filtro. No comprueba cómo se ve (para eso sigue
// haciendo falta su captura, norma 10); comprueba que se puede ver.
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { dibujarYSoltar, montar } from "../../pruebas/dibujar";
import { SeccionInvitados } from "./SeccionInvitados";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

// Los PDF de verdad no se fabrican aquí (jsdom no dibuja): basta saber que
// la pantalla avisa al terminar.
vi.mock("../../lib/pdfAcomodadores", () => ({ descargarListasAcomodadores: async () => 3 }));

const evento = { fecha: "2026-11-13", precioAdulto: "45", precioNino: "20", edadNinoDesde: "3", edadNinoHasta: "12" };

// Un invitado de cada clase que la lista trata distinto: colaborador con
// función, invitado con función y a secas, menor, y quien no tiene rol
// familiar todavía.
const invitados = [
  { id: "g1", nombre: "Jacob", apellido: "Barrios", grupoFamiliar: "Barrios01", zona: "Icod", rolFamiliar: ROL_FAMILIAR.SUELTO, rolesTrabajo: ["Acomodador"], confirmado: true, pagado: true, presente: false, anioNacimiento: "1990", alergias: "No", email: "j@j.com", mesa: 1 },
  { id: "g2", nombre: "Omar", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Orotava", rolFamiliar: ROL_FAMILIAR.ESPOSO, rolesTrabajo: ["Acomodador"], confirmado: true, pagado: false, presente: false, anioNacimiento: "1985", anioBoda: "2010", alergias: "", email: "", mesa: null },
  { id: "g3", nombre: "Míriam", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Orotava", rolFamiliar: ROL_FAMILIAR.ESPOSA, rolesTrabajo: [], confirmado: false, pagado: false, presente: false, anioNacimiento: "1988", anioBoda: "2010", alergias: "No", email: "m@m.com", mesa: null },
  { id: "g4", nombre: "Lucía", apellido: "Pacheco", grupoFamiliar: "Pacheco01", zona: "Orotava", rolFamiliar: ROL_FAMILIAR.HIJO, rolesTrabajo: [], confirmado: true, pagado: false, presente: true, anioNacimiento: "2018", alergias: "Gluten", email: "", mesa: null },
  { id: "g5", nombre: "Loly", apellido: "Abrante", grupoFamiliar: "Abrante01", zona: "", rolFamiliar: "", rolesTrabajo: [], confirmado: false, pagado: false, presente: false, anioNacimiento: "", alergias: "", email: "", mesa: null },
];

// Jacob es colaborador Y acomodador: el caso que destapó todo esto.
const colaboradores = [{ id: "c1", nombre: "Barrios, Jacob", invitadoId: "g1", email: "j@j.com", permisos: [] }];

const data = {
  evento,
  persistEvento: () => {},
  colaboradores,
  invitados,
  mesas: [{ numero: 1, capacidad: 10 }],
  persistInvitados: () => {},
  avisarColaborador: () => {},
  asistenciaEnVivo: false,
};

const FILTROS_VACIOS = {
  texto: "",
  grupoFamiliar: "",
  rolFamiliar: "",
  anioBoda: "",
  zona: "",
  colaboradorId: "",
  mesa: "",
  confirmado: "",
  datos: "",
  pagado: "",
  presente: "",
  rolTrabajo: "",
};

function dibujar(filtros = {}) {
  return dibujarYSoltar(
    <SeccionInvitados
      data={data}
      asignarColaborador={() => null}
      ocupacionMesa={() => 1}
      panelFlotante={null}
      setPanelFlotante={() => {}}
      colaboradoresPendientes={[]}
      filtros={{ ...FILTROS_VACIOS, ...filtros }}
      setFiltros={() => {}}
      onCerrar={() => {}}
      fijo
    />
  );
}

describe("la Lista de invitados se puede dibujar", () => {
  it("sin ningún filtro, con todos dentro", () => {
    const html = dibujar();
    expect(html).toContain("Barrios, Jacob");
    expect(html).toContain("Abrante, Loly");
  });

  // ⚠️ El fallo real: "Cannot access ... before initialization" al entrar
  // en la rama del filtro de Función. Cada valor de cada filtro se dibuja
  // una vez; si alguno revienta, esta prueba se pone roja en vez de
  // hacerlo la pantalla de él.
  const casos = [
    ["texto", ["barrios", "pacheco", "nadie"]],
    ["grupoFamiliar", ["Barrios01"]],
    ["rolFamiliar", ["matrimonio", "esposo", "esposa", "hijo", "sin"]],
    ["anioBoda", ["con", "sin"]],
    ["zona", ["Icod", "Orotava"]],
    ["colaboradorId", ["sin", "c1"]],
    ["mesa", ["1", "sin"]],
    ["confirmado", ["si", "no"]],
    ["datos", ["si", "no"]],
    ["pagado", ["si", "no"]],
    ["presente", ["si", "no"]],
    ["rolTrabajo", ["Acomodador", "es-colaborador", "sin"]],
  ];

  for (const [campo, valores] of casos) {
    for (const valor of valores) {
      it(`con el filtro ${campo} = "${valor}"`, () => {
        expect(() => dibujar({ [campo]: valor })).not.toThrow();
      });
    }
  }

  it("filtrando por Colaborador solo queda quien lo es", () => {
    const html = dibujar({ rolTrabajo: "es-colaborador" });
    expect(html).toContain("Barrios, Jacob");
    expect(html).not.toContain("Abrante, Loly");
  });

  it('"Sin función" deja fuera a quien tiene un papel del día', () => {
    const html = dibujar({ rolTrabajo: "sin" });
    expect(html).toContain("Abrante, Loly");
    // ⚠️ Aquí NO vale mirar a Jacob: su nombre sale también en el
    // desplegable de "Colaborador" de cada fila, así que estaría en el
    // html aunque su fila no se pinte. Omar es acomodador y no es
    // colaborador: solo aparece si su fila está.
    expect(html).not.toContain("Pacheco, Omar");
  });

  it("con la lista vacía tampoco se cae", () => {
    const vacio = { ...data, invitados: [], colaboradores: [], mesas: [] };
    expect(() =>
      dibujarYSoltar(
        <SeccionInvitados
          data={vacio}
          asignarColaborador={() => null}
          ocupacionMesa={() => 0}
          panelFlotante={null}
          setPanelFlotante={() => {}}
          colaboradoresPendientes={[]}
          filtros={FILTROS_VACIOS}
          setFiltros={() => {}}
          onCerrar={() => {}}
          fijo
        />
      )
    ).not.toThrow();
  });
});

// v53.8: borrar desde la Lista a quien es colaborador lo elimina del todo;
// antes de hacerlo, la pregunta lo dice con el texto del usuario.
describe("eliminar desde la Lista a quien es colaborador", () => {
  it("la pregunta avisa de que se elimina también su función de colaborador", () => {
    const vista = montar(
      <SeccionInvitados
        data={data}
        asignarColaborador={() => null}
        ocupacionMesa={() => 1}
        panelFlotante={null}
        setPanelFlotante={() => {}}
        colaboradoresPendientes={[]}
        filtros={FILTROS_VACIOS}
        setFiltros={() => {}}
        onCerrar={() => {}}
        fijo
      />
    );
    const papelera = [...document.body.querySelectorAll("button")].find(
      (b) => (b.getAttribute("aria-label") || b.title || "") === "Eliminar a Barrios, Jacob"
    );
    expect(papelera, "no encuentro la papelera de Jacob").toBeTruthy();
    vista.pulsar(papelera);
    expect(document.body.textContent).toContain(
      "Si eliminas a este colaborador desde invitados, eliminas al invitado y su función de colaborador."
    );
    vista.desmontar();
  });
});


// Las dos listas para acomodadores salen del Imprimir de la Lista (él,
// v54.1): sin pantalla nueva, y solo ahí, no en canciones ni alergias.
describe("Imprimir: la lista para acomodadores", () => {
  const conPanel = (panelFlotante) =>
    dibujarYSoltar(
      <SeccionInvitados
        data={data}
        asignarColaborador={() => null}
        ocupacionMesa={() => 1}
        panelFlotante={panelFlotante}
        setPanelFlotante={() => {}}
        colaboradoresPendientes={[]}
        filtros={FILTROS_VACIOS}
        setFiltros={() => {}}
        onCerrar={() => {}}
        fijo
      />
    );

  it("el botón está en el Imprimir de la lista de invitados", () => {
    expect(conPanel("tabla")).toContain("Lista para acomodadores");
  });

  it("al terminar avisa de que se han descargado y dónde están (norma 9)", async () => {
    const vista = montar(
      <SeccionInvitados
        data={data}
        asignarColaborador={() => null}
        ocupacionMesa={() => 1}
        panelFlotante="tabla"
        setPanelFlotante={() => {}}
        colaboradoresPendientes={[]}
        filtros={FILTROS_VACIOS}
        setFiltros={() => {}}
        onCerrar={() => {}}
        fijo
      />
    );
    const boton = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Lista para acomodadores"));
    await act(async () => boton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(document.body.textContent).toContain("Listas descargadas");
    expect(document.body.textContent).toContain("carpeta de Descargas");
    vista.desmontar();
  });

  it("y no en el de canciones ni en el de alergias", () => {
    expect(conPanel("canciones")).not.toContain("Lista para acomodadores");
    expect(conPanel("alergias")).not.toContain("Lista para acomodadores");
  });
});
