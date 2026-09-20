import { describe, it, expect, beforeEach } from "vitest";
import { registrarHostAvisos, avisoEnPantalla, partirAviso } from "./avisos";

// La norma: ningún aviso con window.alert, y el aviso sale en la ventana
// que la persona está mirando.
function hostFalso(tieneFoco) {
  const vistos = [];
  const quitar = registrarHostAvisos({
    doc: { hasFocus: () => tieneFoco },
    mostrar: (mensaje, titulo) => vistos.push({ mensaje, titulo }),
  });
  return { vistos, quitar };
}

describe("dónde sale el aviso", () => {
  let abiertos;
  beforeEach(() => {
    abiertos?.forEach((h) => h.quitar());
    abiertos = [];
  });

  it("sale en la ventana que tiene el foco, no en la de detrás", () => {
    const pestana = hostFalso(false);
    const emergente = hostFalso(true);
    abiertos = [pestana, emergente];
    avisoEnPantalla("No se pudo guardar.");
    expect(emergente.vistos).toHaveLength(1);
    expect(pestana.vistos).toHaveLength(0);
  });

  it("si ninguna tiene el foco, sale en la última abierta", () => {
    const pestana = hostFalso(false);
    const emergente = hostFalso(false);
    abiertos = [pestana, emergente];
    avisoEnPantalla("No se pudo guardar.");
    expect(emergente.vistos).toHaveLength(1);
  });

  it("un aviso sin nadie escuchando espera al primero que se apunte", () => {
    avisoEnPantalla("Fallo al arrancar.");
    const pestana = hostFalso(true);
    abiertos = [pestana];
    expect(pestana.vistos[0].mensaje).toBe("Fallo al arrancar.");
  });
});

describe("título y explicación", () => {
  it("la primera frase es el título", () => {
    expect(partirAviso("No se pudieron guardar las mesas. Se deshace el cambio en pantalla.")).toEqual({
      titulo: "No se pudieron guardar las mesas.",
      texto: "Se deshace el cambio en pantalla.",
    });
  });

  it("un mensaje corto va entero en el título", () => {
    expect(partirAviso("No se pudo deshacer.")).toEqual({ titulo: "No se pudo deshacer.", texto: "" });
  });

  it("un mensaje largo sin frase corta no deja un título kilométrico", () => {
    const largo = "No se ha podido generar la imagen, probablemente porque la URL del evento no deja descargarla. Prueba con otra.";
    expect(partirAviso(largo)).toEqual({ titulo: "Aviso", texto: largo });
  });

  it("el título se puede poner a mano", () => {
    expect(partirAviso("pepe@correo.com", "Invitación enviada")).toEqual({
      titulo: "Invitación enviada",
      texto: "pepe@correo.com",
    });
  });
});
