// La carga al abrir (él, v72.2): eran unas 16 preguntas al servidor una
// detrás de otra y, con 0,2-2 s cada una, a menudo pasaban de los 8 s en
// que la app avisa «El servidor tarda en responder». Ahora van todas a la
// vez, y al anfitrión ya no se le pregunta antes si es un colaborador.
import { it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "./pruebas/dibujar";

// Un servidor de mentira que no contesta hasta que se le dice: así se ve en
// qué «vuelta» se hizo cada pregunta.
const llamadas = [];
let vuelta = 0;
let pendientes = [];
const DATOS = {
  anfitrion_verificar_token: true,
  colaborador_mi_perfil: [{ id: "col-1", permisos: [] }],
};
function pregunta(nombre, args) {
  llamadas.push({ nombre, vuelta, args });
  const respuesta = new Promise((resolve) => pendientes.push(() => resolve({ data: DATOS[nombre] ?? [], error: null })));
  const consulta = { then: (bien, mal) => respuesta.then(bien, mal), select: () => consulta, order: () => consulta };
  return consulta;
}
vi.mock("./supabaseClient", () => ({ supabase: { rpc: (nombre, args) => pregunta(nombre, args), from: (tabla) => pregunta(tabla) } }));
vi.mock("./lib/useCanalAsistencia", () => ({ useCanalAsistencia: () => ({ avisarLlegada: () => {}, conectado: false }) }));
const { useLedgerData } = await import("./useLedgerData");

async function contestar() {
  vuelta += 1;
  const ahora = pendientes;
  pendientes = [];
  await act(async () => ahora.forEach((f) => f()));
}

function abrir(rol, esTokenAnfitrion) {
  llamadas.length = 0;
  vuelta = 0;
  pendientes = [];
  const visto = {};
  function Prueba() {
    Object.assign(visto, useLedgerData(rol, esTokenAnfitrion));
    return null;
  }
  return { vista: montar(<Prueba />), visto };
}

it("el anfitrión: no se le pregunta si es colaborador, y abre en una vuelta", async () => {
  const { vista, visto } = abrir("llave-anfitrion", true);
  const nombres = llamadas.map((l) => l.nombre);
  expect(nombres).not.toContain("colaborador_mi_perfil");
  expect(nombres.length).toBeGreaterThan(5);
  // Lo de Cuentas, Colaboradores y Novedades no viene al abrir (v72.3).
  for (const deUnaVentana of ["anfitrion_listar_gastos", "anfitrion_listar_avisos_enviados", "anfitrion_listar_novedades"]) {
    expect(nombres).not.toContain(deUnaVentana);
  }
  await contestar();
  expect(visto.loaded).toBe(true);
  expect(visto.esAnfitrion).toBe(true);
  expect(llamadas.every((l) => l.vuelta === 0)).toBe(true);
  vista.desmontar();
});

// v72.3 (él): lo de una sola ventana se trae al abrirla; mientras está
// abierta, también en cada actualización; al cerrarla, ya no.
it("Cuentas: sus gastos llegan al abrirla, y dice que ya están", async () => {
  const { vista, visto } = abrir("llave-anfitrion", true);
  await contestar();
  expect(visto.seccionesCargadas.cuentas).toBeFalsy();
  let cerrar;
  act(() => {
    cerrar = visto.abrirSeccion("cuentas");
  });
  expect(llamadas.at(-1).nombre).toBe("anfitrion_listar_gastos");
  await contestar();
  expect(visto.seccionesCargadas.cuentas).toBe(true);
  cerrar();
  vista.desmontar();
});

it("el colaborador: lo suyo en una sola vuelta, y sin las preguntas del anfitrión", async () => {
  const { vista, visto } = abrir("col-1", false);
  await contestar();
  expect(visto.loaded).toBe(true);
  expect(visto.esAnfitrion).toBe(false);
  expect(llamadas.every((l) => l.vuelta === 0)).toBe(true);
  expect(llamadas.some((l) => l.nombre.startsWith("anfitrion_"))).toBe(false);
  vista.desmontar();
});

// v82.8: ya pagado, el colaborador solo puede cambiar la canción, y va por
// su función estrecha; la general rechazaría a quien ya ha pagado.
it("colaborador: la canción de un pagado va por colaborador_guardar_canciones", async () => {
  DATOS.colaborador_mis_invitados = [{ id: "g1", pagado: true, cancion: "" }];
  const { vista, visto } = abrir("col-1", false);
  for (let i = 0; i < 5; i++) await contestar();
  expect(visto.invitados).toHaveLength(1);
  llamadas.length = 0;
  await act(async () => {
    visto.persistInvitados([{ id: "g1", pagado: true, cancion: "Bailando" }]);
  });
  const nombres = llamadas.map((l) => l.nombre);
  expect(nombres).toContain("colaborador_guardar_canciones");
  expect(nombres).not.toContain("colaborador_guardar_invitado");
  await contestar();
  delete DATOS.colaborador_mis_invitados;
  vista.desmontar();
});

// v82.9 (él, familia Martínez): con foto y con «No» a la vez, la ficha
// escondía la foto y bloqueaba la casilla, sin salida.
it("una familia con foto de boda nunca lleva «No»: se limpia al leer, sin volver a mandarla", async () => {
  DATOS.fotos_familiares = [
    { grupoFamiliar: "Martinez01", url: "boda/m.jpg", sinFotoBoda: true },
    { grupoFamiliar: "Gil01", url: "", sinFotoBoda: true },
  ];
  const { vista, visto } = abrir("llave-anfitrion", true);
  for (let i = 0; i < 5; i++) await contestar();
  expect(visto.fotosSinBoda).toEqual({ Martinez01: false, Gil01: true });
  llamadas.length = 0;
  await act(async () => {
    visto.persistFotosAniversario({ Gil01: "aniv/g.jpg" });
  });
  const guardado = llamadas.find((l) => l.nombre === "guardar_fotos_familiares");
  expect(guardado.args.p_filas.map((f) => f.grupoFamiliar), "Martínez no se ha tocado").toEqual(["Gil01"]);
  await contestar();
  delete DATOS.fotos_familiares;
  vista.desmontar();
});

it("subir la foto se lleva el «No» en el mismo guardado", async () => {
  DATOS.fotos_familiares = [{ grupoFamiliar: "Gil01", url: "", sinFotoBoda: true }];
  const { vista, visto } = abrir("llave-anfitrion", true);
  for (let i = 0; i < 5; i++) await contestar();
  llamadas.length = 0;
  await act(async () => {
    visto.persistFotosFamiliares({ Gil01: "boda/g.jpg" });
  });
  expect(visto.fotosSinBoda.Gil01).toBe(false);
  const envios = llamadas.filter((l) => l.nombre === "guardar_fotos_familiares");
  expect(envios).toHaveLength(1);
  expect(envios[0].args.p_filas[0]).toMatchObject({ grupoFamiliar: "Gil01", url: "boda/g.jpg", sinFotoBoda: false });
  await contestar();
  delete DATOS.fotos_familiares;
  vista.desmontar();
});
