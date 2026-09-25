// La pantalla del colaborador, DIBUJADA de verdad.
//
// Es la más delicada de las tres que faltaban: la abren 13 personas que
// no son él, desde sus móviles, durante meses. Si se cae, se entera
// tarde y por WhatsApp.
//
// Comprueba que se PUEDE ver, no cómo se ve (para eso sigue haciendo
// falta su captura, norma 10).
import { describe, it, expect } from "vitest";
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
  const boton = [...vista.contenedor.querySelectorAll("button")].find((b) =>
    b.textContent.includes("Abrir formulario")
  );
  if (boton) vista.pulsar(boton);
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
    const abrir = [...vista.contenedor.querySelectorAll("button")].find((b) =>
      b.textContent.includes("Abrir formulario")
    );
    vista.pulsar(abrir);
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
