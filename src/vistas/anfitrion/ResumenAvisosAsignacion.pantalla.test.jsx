// La pregunta al cerrar la Lista con colaboradores por avisar (v73.4).
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { ResumenAvisosAsignacion } from "./ResumenAvisosAsignacion";

it("nombra a quién hay que avisar, avisa de quien no tiene email, y cada botón hace lo suyo", () => {
  const hechos = [];
  const vista = montar(
    <ResumenAvisosAsignacion
      colaboradores={[
        { id: "c1", nombre: "Luis, Míriam", email: "m@m.com" },
        { id: "c2", nombre: "Sierra, Raul", email: "" },
      ]}
      invitados={[
        { id: "g1", colaboradorId: "c1", avisoPendiente: true, confirmado: true },
        { id: "g2", colaboradorId: "c1", avisoPendiente: true, confirmado: true },
        { id: "g3", colaboradorId: "c1", avisoPendiente: false, confirmado: true },
      ]}
      enviando={false}
      onEnviar={() => hechos.push("enviar")}
      onSeguirEditando={() => hechos.push("seguir")}
      onNoAvisar={() => hechos.push("no")}
    />
  );
  const texto = document.body.textContent;
  // v73.5: cuántos nuevos de verdad tiene cada uno.
  expect(texto).toContain("Luis, Míriam · 2 nuevos");
  expect(texto).toContain("Sierra, Raul — sin email, no se le podrá avisar");
  const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
  vista.pulsar(boton("Enviar avisos"));
  vista.pulsar(boton("Seguir editando"));
  vista.pulsar(boton("Cancelar (no avisar)"));
  expect(hechos).toEqual(["enviar", "seguir", "no"]);
  vista.desmontar();
});
