// La ventana Permisos, DIBUJADA (v91.7, él: «deberían estar ordenados por
// secciones, música y multimedia no están juntos»): un título por zona de
// la app y, debajo, sus casillas; plegadas, una zona abierta a la vez
// (v91.8, él: «plegada, que es la filosofía de la app»).
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { PERMISOS, ETIQUETAS_PERMISOS, GRUPOS_PERMISOS } from "../../lib/permisos";
import { VentanaPermisos } from "./VentanaPermisos";

function dibujar(colaboradores) {
  const guardados = [];
  const vista = montar(<VentanaPermisos data={{ colaboradores, persistColaboradores: (l) => guardados.push(l) }} onCerrar={() => {}} />);
  return { vista, guardados };
}
const grupo = (titulo) => document.body.querySelector(`[role="group"][aria-label="${titulo}"]`);
const abrir = (vista, titulo) => vista.pulsar(grupo(titulo).querySelector("button[aria-expanded]"));
const casillas = () => document.body.querySelectorAll('input[type="checkbox"]');

it("todo plegado al abrir; cada zona, con su título y cuántos tiene marcados", () => {
  const { vista } = dibujar([{ id: "c1", nombre: "Brown, Julien", permisos: [PERMISOS.MULTIMEDIA] }]);
  expect(casillas().length).toBe(0);
  for (const g of GRUPOS_PERMISOS) expect(grupo(g.titulo), g.titulo).not.toBeNull();
  expect(grupo("Música").textContent).toContain("1 de 2");
  expect(grupo("Textos del evento").textContent).toContain("0 de 2");
  vista.desmontar();
});

it("una zona abierta a la vez; Multimedia y Canciones para bailar, juntas en «Música»", () => {
  const { vista } = dibujar([{ id: "c1", nombre: "Brown, Julien", permisos: [] }]);
  for (const g of GRUPOS_PERMISOS) {
    abrir(vista, g.titulo);
    expect(casillas().length, g.titulo).toBe(g.claves.length);
    expect(grupo(g.titulo).querySelectorAll('input[type="checkbox"]').length).toBe(g.claves.length);
  }
  abrir(vista, "Música");
  expect(grupo("Música").textContent).toContain(ETIQUETAS_PERMISOS[PERMISOS.MULTIMEDIA]);
  expect(grupo("Música").textContent).toContain(ETIQUETAS_PERMISOS[PERMISOS.CANCIONES_DJ]);
  abrir(vista, "Música");
  expect(casillas().length).toBe(0);
  vista.desmontar();
});

it("marcar una casilla guarda ese permiso al colaborador elegido", () => {
  const { vista, guardados } = dibujar([{ id: "c1", nombre: "Brown, Julien", permisos: [PERMISOS.MULTIMEDIA] }]);
  abrir(vista, "Música");
  vista.pulsar(grupo("Música").querySelectorAll('input[type="checkbox"]')[1]);
  expect(guardados.at(-1)[0].permisos).toEqual([PERMISOS.MULTIMEDIA, PERMISOS.CANCIONES_DJ]);
  vista.desmontar();
});

it("«Permisos concedidos» los cuenta en el orden de los grupos", () => {
  const { vista } = dibujar([{ id: "c1", nombre: "Brown, Julien", permisos: [PERMISOS.CANCIONES_DJ, PERMISOS.NOVEDADES_EDITAR] }]);
  const resumen = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Permisos concedidos"));
  vista.pulsar(resumen);
  const texto = document.body.textContent;
  expect(texto.indexOf(ETIQUETAS_PERMISOS[PERMISOS.NOVEDADES_EDITAR], texto.indexOf("Brown, Julien:"))).toBeLessThan(
    texto.indexOf(ETIQUETAS_PERMISOS[PERMISOS.CANCIONES_DJ], texto.indexOf("Brown, Julien:"))
  );
  vista.desmontar();
});
