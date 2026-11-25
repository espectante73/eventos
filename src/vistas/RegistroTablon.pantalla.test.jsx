// «Comprueba tus datos» en el tablón (v85.1-85.2), DIBUJADO de verdad.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { RegistroTablon } from "./RegistroTablon";
import { MOTIVOS_CANCIONES_TABLON } from "../lib/cancionesTablon";

const evento = { fecha: "2026-12-11" };
const yo = { nombre: "Pacheco, Ana", anio: "1985", tieneEmail: false, colaborador: "Barrios, Jacob", alergias: "Gluten", cancion: "Volare — Gipsy Kings", sinCancion: false, conservarDatos: false, anioBoda: "1990" };

it("abierto: su frase, su nombre, alergias, canciones, boda, email y si guarda sus datos", () => {
  const vista = montar(<RegistroTablon yo={yo} evento={evento} abierta onAlternar={() => {}} />);
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("Comprueba tus datos");
  expect(texto).toContain("Si ves algún error, dile a tu colaborador que lo corrija.");
  expect(texto).toContain("Nombre: Pacheco, Ana");
  expect(texto).toContain("Alergias: Gluten");
  expect(texto).toContain("Email para la invitación: No");
  expect(texto).toContain("Volare — Gipsy Kings");
  expect(texto).toContain("Boda: 1990 · 36º aniversario en 2026");
  expect(texto).toContain("Guardar tus datos tras el evento: No");
  // Nunca el año de nacimiento: es la llave de la puerta.
  expect(texto).not.toMatch(/nacimiento/i);
  vista.desmontar();
});

// v101.9 (él): «este modelo… con la palabra mostrar / ocultar», y el tono
// de color diciendo que ahí hay algo oculto.
it("en su franja: plegado dice «Mostrar» y no enseña los datos; abierto, «Ocultar»; tocarla avisa", () => {
  let alternadas = 0;
  const plegado = montar(<RegistroTablon yo={yo} evento={evento} abierta={false} onAlternar={() => (alternadas += 1)} />);
  const franja = plegado.contenedor.querySelector("[data-franja-plegable]");
  expect(franja.textContent).toBe("Comprueba tus datosMostrar");
  expect(franja.getAttribute("aria-expanded")).toBe("false");
  expect(franja.style.background).toContain("rgba(217, 183, 120, 0.16)");
  expect(plegado.contenedor.textContent).not.toContain("Alergias");
  plegado.pulsar(franja);
  expect(alternadas).toBe(1);
  plegado.desmontar();
  const abierto = montar(<RegistroTablon yo={yo} evento={evento} abierta onAlternar={() => {}} />);
  expect(abierto.contenedor.querySelector("[data-franja-plegable]").textContent).toBe("Comprueba tus datosOcultar");
  abierto.desmontar();
});

it("si es su propio colaborador, lo corrige él; sin boda si no es matrimonio", () => {
  const vista = montar(<RegistroTablon yo={{ ...yo, colaboradorEsYo: true, anioBoda: null }} evento={evento} abierta onAlternar={() => {}} />);
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("corrígelo en tu formulario");
  expect(texto).not.toContain("dile a tu colaborador");
  expect(texto).not.toContain("Boda");
  vista.desmontar();
});

it("sin el SQL de la v85.1 (la base no lo manda), no sale nada", () => {
  const vista = montar(<RegistroTablon yo={{ nombre: "Pacheco, Ana", colaborador: "Barrios, Jacob" }} evento={evento} />);
  expect(vista.contenedor.textContent).toBe("");
  vista.desmontar();
});

// v87.2 (él): el email entero, para ver si está bien escrito; solo con su
// enlace personal. Por la puerta general, «Sí» y cómo verlo.
it("con su enlace personal, el email entero; sin él, «Sí» y cómo verlo", () => {
  let vista = montar(<RegistroTablon yo={{ ...yo, tieneEmail: true, email: "ana@correo.com" }} evento={evento} abierta onAlternar={() => {}} />);
  expect(vista.contenedor.textContent).toContain("Email para la invitación: ana@correo.com");
  expect(vista.contenedor.textContent).not.toContain("enlace personal");
  vista.desmontar();
  vista = montar(<RegistroTablon yo={{ ...yo, tieneEmail: true, email: "" }} evento={evento} abierta onAlternar={() => {}} />);
  expect(vista.contenedor.textContent).toContain("Email para la invitación: Sí");
  expect(vista.contenedor.textContent).toContain("Para verlo, entra con tu enlace personal.");
  vista.desmontar();
});

// v92.3 (él: «donde están todos los datos que ha dado… ahí buscará sus
// canciones»): con su enlace personal, «Cambiar» junto a «Canciones:» y
// ahí mismo los 3 huecos; sin él, o cerradas, solo se ven.
function conCanciones({ cerradas = false, respuesta = "", buscar } = {}) {
  const guardadas = [];
  const vista = montar(
    <RegistroTablon
      yo={{ ...yo, cancion: "Titanium — David Guetta" }}
      evento={evento}
      canciones={{
        cerradas,
        buscar,
        onGuardar: async (h) => {
          guardadas.push(h);
          return respuesta;
        },
      }}
      abierta
      onAlternar={() => {}}
    />
  );
  return { vista, guardadas };
}
const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent === t);
const campo = (n) => document.body.querySelector(`input[aria-label="${n}"]`);
const escribir = (el, valor) =>
  act(() => {
    const fijar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    fijar.call(el, valor);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const pulsarYEsperar = (b) => act(async () => b.dispatchEvent(new MouseEvent("click", { bubbles: true })));

it("sin su enlace personal, sus canciones solo se ven: ni «Cambiar» ni huecos", () => {
  const vista = montar(<RegistroTablon yo={yo} evento={evento} abierta onAlternar={() => {}} />);
  expect(boton("Cambiar")).toBeUndefined();
  expect(campo("Canción 1")).toBeNull();
  expect(vista.contenedor.textContent).not.toContain("Tus canciones las cambias tú");
  vista.desmontar();
});

it("con su enlace personal, «Cambiar» abre ahí mismo sus 3 huecos con lo que ya tenía", () => {
  const { vista } = conCanciones();
  expect(vista.contenedor.textContent).toContain("Tus canciones las cambias tú.");
  expect(campo("Canción 1")).toBeNull();
  vista.pulsar(boton("Cambiar"));
  expect(campo("Canción 1").value).toBe("Titanium");
  expect(campo("Artista 1").value).toBe("David Guetta");
  expect(campo("Canción 3")).not.toBeNull();
  expect(boton("Cambiar")).toBeUndefined();
  // v92.7 (él): nunca se promete que el DJ las pondrá; no es para eso.
  expect(vista.contenedor.textContent).not.toMatch(/pondr[áa]|sonar[áa]n?/i);
  // v92.8 (él): para qué son, en una línea y plegado.
  const ayuda = vista.contenedor.querySelector("details");
  expect(ayuda.querySelector("summary").textContent).toBe("Hasta 3 canciones, ¿para qué son?");
  expect(ayuda.open).toBe(false);
  expect(ayuda.textContent).toContain("perfil musical y generacional de todos los invitados");
  expect(ayuda.textContent).toContain("No será posible ponerlas todas");
  // Sin cambios, «Guardar» no hace nada.
  expect(boton("Guardar").disabled).toBe(true);
  vista.desmontar();
});

it("escribir una y «Guardar» la manda, y vuelve a la lista", async () => {
  const { vista, guardadas } = conCanciones();
  vista.pulsar(boton("Cambiar"));
  escribir(campo("Canción 2"), "Bamboleo");
  expect(boton("Guardar").disabled).toBe(false);
  await pulsarYEsperar(boton("Guardar"));
  expect(guardadas[0][1]).toEqual({ titulo: "Bamboleo", artista: "" });
  expect(campo("Canción 1")).toBeNull();
  expect(boton("Cambiar")).toBeTruthy();
  vista.desmontar();
});

it("si no se guarda, lo dice y se queda con lo escrito", async () => {
  const { vista } = conCanciones({ respuesta: MOTIVOS_CANCIONES_TABLON.llave });
  vista.pulsar(boton("Cambiar"));
  escribir(campo("Canción 2"), "Bamboleo");
  await pulsarYEsperar(boton("Guardar"));
  expect(vista.contenedor.textContent).toContain(MOTIVOS_CANCIONES_TABLON.llave);
  expect(campo("Canción 2").value).toBe("Bamboleo");
  vista.desmontar();
});

it("«Cancelar» con algo escrito pregunta antes de descartarlo; sin nada, vuelve sin preguntar", () => {
  const { vista } = conCanciones();
  vista.pulsar(boton("Cambiar"));
  vista.pulsar(boton("Cancelar"));
  expect(document.body.textContent).not.toContain("¿Descartar los cambios?");
  expect(campo("Canción 1")).toBeNull();
  vista.pulsar(boton("Cambiar"));
  escribir(campo("Canción 2"), "Bamboleo");
  vista.pulsar(boton("Cancelar"));
  expect(document.body.textContent).toContain("¿Descartar los cambios?");
  vista.desmontar();
});

it("cerradas: se ven, sin «Cambiar», y lo dice", () => {
  const { vista } = conCanciones({ cerradas: true });
  expect(vista.contenedor.textContent).toContain("Titanium — David Guetta");
  expect(vista.contenedor.textContent).toContain("Ya están cerradas.");
  expect(vista.contenedor.textContent).not.toContain("Tus canciones las cambias tú");
  expect(boton("Cambiar")).toBeUndefined();
  vista.desmontar();
});

// v92.5 (él: «no veo la opción de escucha previa»): el mismo ▶ que en el
// formulario del colaborador, en cuanto hay algo escrito.
it("con su enlace personal, cada canción escrita lleva su ▶ de escucha previa", () => {
  const { vista } = conCanciones({ buscar: async () => ({ candidatos: [], soloTitulo: false }) });
  vista.pulsar(boton("Cambiar"));
  const escuchar = () => document.body.querySelectorAll('button[title="Escuchar 30 segundos"]');
  // Tiene una escrita: un ▶; al escribir otra, dos.
  expect(escuchar().length).toBe(1);
  escribir(campo("Canción 2"), "Bamboleo");
  expect(escuchar().length).toBe(2);
  vista.desmontar();
});
