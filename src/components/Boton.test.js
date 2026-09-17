import { describe, it, expect } from "vitest";
import { estilosBoton } from "./Boton";

// La pieza existe para que no vuelva a haber 12 tamaños distintos: estas
// pruebas fijan que cada variante y cada tamaño tengan un único aspecto.
describe("estilosBoton", () => {
  it("el principal va lleno y el secundario solo con contorno", () => {
    expect(estilosBoton("principal").background).toBe("#1F3A2E");
    expect(estilosBoton("secundario").background).toBe("transparent");
    expect(estilosBoton("secundario").border).toContain("#1F3A2E");
  });

  it("el peligro es rojo y con letra blanca, en cualquier fondo", () => {
    expect(estilosBoton("peligro").background).toBe("#8C2F39");
    expect(estilosBoton("peligro", "pequeno", true).color).toBe("#fff");
  });

  it("sobre fondo oscuro cambia para que se vea", () => {
    expect(estilosBoton("principal", "normal", true).background).toBe("#D9B778");
    expect(estilosBoton("secundario", "normal", true).color).toBe("#D9B778");
  });

  it("solo hay dos tamaños, y el pequeño es más bajo", () => {
    expect(estilosBoton("principal", "normal").minHeight).toBe(36);
    expect(estilosBoton("principal", "pequeno").minHeight).toBe(28);
  });

  it("una variante desconocida no rompe: cae en secundario", () => {
    expect(estilosBoton("inventada").background).toBe(estilosBoton("secundario").background);
  });
});
