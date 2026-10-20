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
function pregunta(nombre) {
  llamadas.push({ nombre, vuelta });
  const respuesta = new Promise((resolve) => pendientes.push(() => resolve({ data: DATOS[nombre] ?? [], error: null })));
  const consulta = { then: (bien, mal) => respuesta.then(bien, mal), select: () => consulta, order: () => consulta };
  return consulta;
}
vi.mock("./supabaseClient", () => ({ supabase: { rpc: (nombre) => pregunta(nombre), from: (tabla) => pregunta(tabla) } }));
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

it("el anfitrión: no se le pregunta si es colaborador, y abre en dos vueltas", async () => {
  const { vista, visto } = abrir("llave-anfitrion", true);
  expect(llamadas.map((l) => l.nombre)).not.toContain("colaborador_mi_perfil");
  expect(llamadas.length).toBeGreaterThan(10);
  await contestar();
  await contestar();
  expect(visto.loaded).toBe(true);
  expect(visto.esAnfitrion).toBe(true);
  // Todo sale en la primera vuelta, salvo la lista de avisos, que espera a
  // que se compruebe el estado de los envíos.
  expect(llamadas.filter((l) => l.vuelta > 0).map((l) => l.nombre)).toEqual(["anfitrion_listar_avisos_enviados"]);
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
