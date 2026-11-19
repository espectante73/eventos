// La ventana Invitaciones, DIBUJADA (v90.6, él: «remodelación general, no
// sigue los principios básicos de la app»): todo plegado con las cifras
// arriba, una línea por familia, el orden y el email al tocar el apellido,
// y los ajustes con las piezas de la app (Sí/No, BotonQuitar), sin casillas
// del navegador.
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaInvitaciones } from "./VentanaInvitaciones";

const INVITADOS = [
  { id: "r", apellido: "Cabrera", nombre: "Rosa", email: "rosa@correo.es" },
  { id: "t", apellido: "Cabrera", nombre: "Tomás", email: "" },
  { id: "a", apellido: "Alonso", nombre: "Ana", email: "" },
];
const COLABORADORES = [{ id: "c1", nombre: "Alonso, Ana", invitadoId: "a", email: "ana@correo.es" }];

const NO_LISTAS = [
  { clave: "Pérez01", apellido: "Pérez", miembros: 2, motivos: [{ tipo: "noAsiste", texto: "No asisten" }] },
  {
    clave: "García01",
    apellido: "García",
    miembros: 3,
    motivos: [
      { tipo: "pago", texto: "Sin pagar 2" },
      { tipo: "mesa", texto: "Sin mesa 1" },
    ],
  },
];

function dibujar({ evento = { imagenInvitacion: "https://x/plantilla.png" }, envioBloqueado = false } = {}) {
  const guardados = { invitados: [], eventos: [] };
  function Prueba() {
    const [invitados, setInvitados] = useState(INVITADOS);
    const [ev, setEv] = useState(evento);
    const data = {
      evento: ev,
      colaboradores: COLABORADORES,
      invitados,
      ordenFamiliares: {},
      persistOrdenFamiliares: () => {},
      persistInvitados: (l) => {
        guardados.invitados.push(l);
        setInvitados(l);
      },
      persistEvento: (e) => {
        guardados.eventos.push(e);
        setEv(e);
      },
    };
    const familias = [
      { clave: "Cabrera01", apellido: "Cabrera", confirmados: invitados.filter((g) => g.apellido === "Cabrera"), invitacionEnviada: false },
      { clave: "Alonso01", apellido: "Alonso", confirmados: invitados.filter((g) => g.apellido === "Alonso"), invitacionEnviada: true },
    ];
    return (
      <VentanaInvitaciones
        data={data}
        familiasListasParaInvitacion={familias}
        destinatariosConEmail={(f) => f.confirmados.map((m) => m.email).filter(Boolean)}
        enviarATodos={async () => ({ enviados: [], fallidos: [] })}
        descargando={null}
        setDescargando={() => {}}
        abrirPreviewInvitacion={() => {}}
        generarImagenParaFamilia={async () => null}
        modoCalibracion={false}
        setModoCalibracion={() => {}}
        marcarInvitacionEnviada={() => {}}
        envioBloqueado={envioBloqueado}
        familiasNoListas={NO_LISTAS}
        onCerrar={() => {}}
      />
    );
  }
  const vista = montar(<Prueba />);
  const boton = (texto) =>
    [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(texto) || b.getAttribute("aria-label") === texto);
  return { vista, guardados, boton };
}

it("al abrirla, todo plegado y las cifras arriba; sin casillas del navegador", () => {
  const { vista } = dibujar();
  const texto = vista.contenedor.textContent;
  for (const rotulo of ["Faltan", "Enviadas", "Sin email", "Enviar", "Plantilla", "Qué se imprime", "Calibración", "Cómo funciona"]) {
    expect(texto).toContain(rotulo);
  }
  expect(texto).toContain("1 sin enviar");
  // Plegado: ninguna familia a la vista todavía.
  expect(texto).not.toContain("Cabrera");
  expect(vista.contenedor.querySelector('input[type="checkbox"]')).toBeNull();
  vista.desmontar();
});

it("«Enviar»: una línea por familia; tocar el apellido enseña el orden y el email, que se corrige aquí y va a su ficha", () => {
  const { vista, guardados, boton } = dibujar();
  vista.pulsar(boton("Enviar"));
  expect(vista.contenedor.textContent).toContain("Cabrera");
  expect(vista.contenedor.textContent).toContain("Enviada");
  expect(vista.contenedor.querySelectorAll('button[aria-label="Descargar la invitación"]').length).toBe(2);
  vista.pulsar(boton("Cabrera"));
  const email = vista.contenedor.querySelector('input[aria-label="Email de Cabrera, Tomás"]');
  expect(email).toBeTruthy();
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(email, "tomas@correo.es");
    email.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => email.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
  const ultima = guardados.invitados.at(-1);
  expect(ultima.find((g) => g.id === "t").email).toBe("tomas@correo.es");
  vista.desmontar();
});

it("el email de quien también es colaborador se ve, pero se cambia en Colaboradores", () => {
  const { vista, boton } = dibujar();
  vista.pulsar(boton("Enviar"));
  vista.pulsar(boton("Alonso"));
  expect(vista.contenedor.querySelector('input[aria-label="Email de Alonso, Ana"]')).toBeNull();
  expect(vista.contenedor.textContent).toContain("ana@correo.es");
  vista.desmontar();
});

it("«Qué se imprime»: el Sí/No de la app guarda en el evento", () => {
  const { vista, guardados, boton } = dibujar();
  vista.pulsar(boton("Qué se imprime"));
  const hora = vista.contenedor.querySelector('[role="radiogroup"][aria-label="Imprimir hora"]');
  const no = [...hora.querySelectorAll("button")].find((b) => b.textContent === "No");
  vista.pulsar(no);
  expect(guardados.eventos.at(-1).imprimirHora).toBe(false);
  vista.desmontar();
});

it("«Plantilla»: quitarla es el círculo rojo de la app y pregunta antes", () => {
  const { vista, guardados, boton } = dibujar();
  vista.pulsar(boton("Plantilla"));
  vista.pulsar(boton("Quitar la plantilla"));
  expect(document.body.textContent).toContain("¿Quitar la plantilla?");
  expect(guardados.eventos).toEqual([]);
  vista.desmontar();
});

it("con la acomodación sin terminar (v90.7): lo dice, y se descarga pero no se envía", () => {
  const { vista, boton } = dibujar({ envioBloqueado: true });
  expect(vista.contenedor.textContent).toContain("bloqueado · 1 sin enviar");
  vista.pulsar(boton("Enviar"));
  expect(vista.contenedor.textContent).toContain("Bloqueado: falta marcar «Acomodación terminada» en Acomodación.");
  const enviar = [...vista.contenedor.querySelectorAll('button[aria-label="Enviar por email"], button[aria-label="Enviar otra vez por email"], button[title*="Acomodación terminada"]')];
  expect(enviar.length).toBeGreaterThan(0);
  enviar.forEach((b) => expect(b.disabled).toBe(true));
  vista.contenedor.querySelectorAll('button[aria-label="Descargar la invitación"]').forEach((b) => expect(b.disabled).toBe(false));
  vista.desmontar();
});

it("las cuentas cuadran (v90.8): «No listas» arriba, y su apartado dice por qué cada una", () => {
  const { vista, boton } = dibujar();
  const cabecera = vista.contenedor.textContent;
  for (const rotulo of ["Faltan", "Enviadas", "Sin email", "No listas"]) expect(cabecera).toContain(rotulo);
  expect(cabecera).toContain("2 familias");
  vista.pulsar(boton("No listas"));
  const texto = vista.contenedor.textContent;
  expect(texto).toContain("García");
  expect(texto).toContain("Sin pagar 2");
  expect(texto).toContain("Sin mesa 1");
  expect(texto).toContain("No asisten");
  // Sin pagar y sin mesa, cada uno de su color (él, v90.9).
  const color = (t) => vista.contenedor.querySelector(`[data-motivo="${t}"]`).style.color;
  expect(color("pago")).not.toBe(color("mesa"));
  vista.desmontar();
});
