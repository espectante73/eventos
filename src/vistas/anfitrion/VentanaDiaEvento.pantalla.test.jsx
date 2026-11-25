// La ventana «Día del evento» (v66-67): el estado en texto y el botón con
// lo que hace; cerrar pregunta antes. Llegadas y fotos, la misma fila.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaDiaEvento, cuentaFotosFiesta } from "./VentanaDiaEvento";

const botones = (texto) => [...document.body.querySelectorAll("button")].filter((b) => b.textContent.trim() === texto);
const boton = (texto) => botones(texto)[0];
const sinFotos = () => Promise.resolve([]);

it("cerradas: dice «cerradas» y «Abrir» las abre sin preguntar", () => {
  const guardados = [];
  const vista = montar(
    <VentanaDiaEvento data={{ evento: { asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />
  );
  expect(document.body.textContent).toContain("Acreditación · cerrada");
  vista.pulsar(boton("Abrir"));
  expect(guardados).toEqual([{ asistenciaAbierta: true }]);
  vista.desmontar();
});

it("abiertas: «Cerrar» pregunta antes, y con «Sí» las cierra", () => {
  const guardados = [];
  const vista = montar(
    <VentanaDiaEvento data={{ evento: { asistenciaAbierta: true }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />
  );
  vista.pulsar(boton("Cerrar"));
  expect(document.body.textContent).toContain("¿Cerrar la acreditación?");
  expect(guardados).toEqual([]);
  vista.pulsar(boton("Sí"));
  expect(guardados).toEqual([{ asistenciaAbierta: false }]);
  vista.desmontar();
});

it("las fotos: «Abrir» las abre; «Cerrar» pregunta antes", () => {
  const guardados = [];
  const evento = { asistenciaAbierta: true, fotosFiestaAbierta: false };
  const vista = montar(
    <VentanaDiaEvento data={{ evento, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />
  );
  expect(document.body.textContent).toContain("Fotos · cerradas");
  // El último «Abrir»: antes van el de las llegadas (aquí abiertas) y el del marcador.
  vista.pulsar(botones("Abrir").at(-1));
  expect(guardados).toEqual([{ asistenciaAbierta: true, fotosFiestaAbierta: true }]);
  vista.desmontar();

  const abiertas = montar(
    <VentanaDiaEvento
      data={{ evento: { fotosFiestaAbierta: true, asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }}
      onCerrar={() => {}}
    />
  );
  abiertas.pulsar(boton("Cerrar"));
  expect(document.body.textContent).toContain("¿Cerrar las fotos?");
  abiertas.pulsar(boton("Sí"));
  expect(guardados.at(-1)).toEqual({ fotosFiestaAbierta: false, asistenciaAbierta: false });
  abiertas.desmontar();
});

it("la cuenta: fotos y familias, cada familia una vez", () => {
  expect(cuentaFotosFiesta([{ familia: "medina" }])).toEqual({ titulo: "1 foto", detalle: "De 1 familia, en un ZIP." });
  expect(cuentaFotosFiesta([{ familia: "medina" }, { familia: "medina" }, { familia: "abreu01" }])).toEqual({
    titulo: "3 fotos",
    detalle: "De 2 familias, en un ZIP.",
  });
});

// v99.3: las tarjetas QR ya no se descargan aquí, sino tras verlas («Ver»).
it("«Descargar» las fotos solo sale con alguna", async () => {
  const conFotos = () => Promise.resolve([{ id: "1", familia: "medina", quien: "Medina, Ana", ruta: "fiesta/1.jpg", creadaEn: "2026-11-13T22:47:00" }]);
  const sin = montar(<VentanaDiaEvento data={{ evento: {}, persistEvento: () => {}, obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />);
  await act(async () => {});
  expect(botones("Descargar")).toHaveLength(0);
  sin.desmontar();

  const con = montar(<VentanaDiaEvento data={{ evento: {}, persistEvento: () => {}, obtenerFotosFiesta: conFotos }} onCerrar={() => {}} />);
  await act(async () => {});
  expect(document.body.textContent).toContain("1 foto");
  expect(botones("Descargar")).toHaveLength(1);
  con.desmontar();
});

// v70.8 (él): llegadas y marcador, una sola fila «Acreditación».
it("«Abrir» la acreditación abre también el marcador; «Cerrar», tras el «Sí», cierra los dos", () => {
  const hechos = [];
  const marcador = { abierto: false, abrirAlAcreditar: () => hechos.push("abrir marcador"), cerrar: () => hechos.push("cerrar marcador"), abrir: () => {} };
  const guardados = [];
  const cerrada = montar(
    <VentanaDiaEvento data={{ evento: { asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} marcador={marcador} />
  );
  expect(document.body.textContent).not.toContain("Marcador");
  cerrada.pulsar(boton("Abrir"));
  expect(hechos).toEqual(["abrir marcador"]);
  expect(guardados).toEqual([{ asistenciaAbierta: true }]);
  cerrada.desmontar();

  const abierta = montar(
    <VentanaDiaEvento data={{ evento: { asistenciaAbierta: true }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} marcador={{ ...marcador, abierto: true }} />
  );
  abierta.pulsar(boton("Cerrar"));
  abierta.pulsar(boton("Sí"));
  expect(hechos).toEqual(["abrir marcador", "cerrar marcador"]);
  expect(guardados.at(-1)).toEqual({ asistenciaAbierta: false });
  abierta.desmontar();
});

it("con la acreditación abierta y el marcador cerrado, «Ver marcador» lo abre sin tocar nada más", () => {
  let abierto = 0;
  const vista = montar(
    <VentanaDiaEvento
      data={{ evento: { asistenciaAbierta: true }, persistEvento: () => {}, obtenerFotosFiesta: sinFotos }}
      onCerrar={() => {}}
      marcador={{ abierto: false, abrir: () => (abierto += 1) }}
    />
  );
  vista.pulsar(boton("Ver marcador"));
  expect(abierto).toBe(1);
  vista.desmontar();
});

it("los «Abrir», iguales: rellenos", () => {
  const vista = montar(<VentanaDiaEvento data={{ evento: {}, persistEvento: () => {}, obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />);
  const fondos = botones("Abrir").map((b) => b.style.background);
  expect(fondos).toHaveLength(2);
  expect(new Set(fondos).size).toBe(1);
  vista.desmontar();
});

// v92.9 (él): una tarjeta QR por mesa, con su número. Sin mesas, lo dice.
// v93 (él): solo con «Acomodación terminada»; cada QR, con el código de su mesa.
it("las tarjetas QR: bloqueadas hasta «Acomodación terminada»; sin ninguna mesa, avisa de crearlas", async () => {
  const pedidos = [];
  const data = (evento) => ({
    evento: { urlPublica: "https://nexuspoint.rsvp", ...evento },
    tokenTablon: "0f8fad5b-d9cb-469f-a165-70867728950e",
    persistEvento: () => {},
    obtenerFotosFiesta: sinFotos,
    obtenerQrMesas: async () => {
      pedidos.push(1);
      return [];
    },
  });
  const sinTerminar = montar(<VentanaDiaEvento data={data({ acomodacionTerminada: false })} onCerrar={() => {}} />);
  await act(async () => {});
  expect(document.body.textContent).toContain("Bloqueado: falta marcar «Acomodación terminada» en Acomodación.");
  expect(boton("Ver").disabled).toBe(true);
  sinTerminar.desmontar();

  const terminada = montar(<VentanaDiaEvento data={data({ acomodacionTerminada: true })} onCerrar={() => {}} />);
  await act(async () => {});
  expect(document.body.textContent).toContain("Una por mesa, con su número: 2 por folio.");
  await act(async () => boton("Ver").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(pedidos).toHaveLength(1);
  expect(document.body.textContent).toContain("No hay ninguna mesa: créalas primero en Acomodación.");
  expect(document.body.querySelector("[data-botones-qr]")).toBeNull();
  terminada.desmontar();
});

// v99.3 (él): «primero ver, después descargar», como las de debajo.
it("las tarjetas QR: «Ver», con mesas, abre la vista previa con una tarjeta por mesa", async () => {
  const vista = montar(
    <VentanaDiaEvento
      data={{
        evento: { urlPublica: "https://nexuspoint.rsvp", acomodacionTerminada: true, nombre: "Las Bodas de todos." },
        tokenTablon: "0f8fad5b-d9cb-469f-a165-70867728950e",
        persistEvento: () => {},
        obtenerFotosFiesta: sinFotos,
        obtenerQrMesas: async () => [
          { numero: 2, codigo: "bbbbbbbbbbbb" },
          { numero: 1, codigo: "aaaaaaaaaaaa" },
          { numero: 3, codigo: "cccccccccccc" },
        ],
      }}
      onCerrar={() => {}}
    />
  );
  await act(async () => {});
  await act(async () => boton("Ver").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  // v101.7: «Descargar», en dos, PDF y PNG.
  expect(document.body.querySelector('[data-botones-qr] [data-descargar="pdf"]').textContent).toBe("PDF");
  expect(document.body.querySelector("[data-resumen-qr]").textContent).toBe("3 tarjetas, una por mesa, en 2 folios A4: 2 por folio.");
  vista.desmontar();
});
