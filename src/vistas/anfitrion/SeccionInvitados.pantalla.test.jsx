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
// haciendo falta su captura, norma 15); comprueba que se puede ver.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SeccionInvitados } from "./SeccionInvitados";
import { ROL_FAMILIAR } from "../../lib/rolFamiliar";

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
  return renderToStaticMarkup(
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
      renderToStaticMarkup(
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
