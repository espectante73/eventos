// Acabados de "Música del evento" (2026-09-01, a petición del usuario:
// "que yo pueda tocar un botón y elegir tres o cuatro opciones").
//
// ⚠️ Cada tema es una PALETA COMPLETA, no solo un color de fondo. Es
// obligatorio que sea así: sobre un fondo champán claro, el texto crema
// y el latón del tema verde serían ilegibles. Cambiar solo el fondo
// habría roto la pantalla en cuanto se eligiera un acabado claro.
//
// Todos mantienen el espíritu de la fiesta (verde/dorado/marfil) y el
// mismo lenguaje metálico de la v20.15: superficie curva, bisel arriba
// y abajo, y zonas hundidas para los visores.
//
// - `claro: true` avisa a la ventana de que está sobre fondo claro, para
//   invertir los brillos del bisel (sobre metal claro, el filo de luz
//   casi no se ve y manda la sombra).
export const TEMAS_MUSICA = {
  anodizado: {
    nombre: "Verde anodizado",
    fondo: "linear-gradient(178deg, #2A4A37 0%, #1D3628 38%, #0F1C15 100%)",
    texto: "#F2EDE3",
    tenue: "rgba(242, 237, 227, 0.52)",
    oro: "#D9B778",
    oroRelleno: "linear-gradient(180deg, #F0DDA9 0%, #D9B778 42%, #A87F4A 100%)",
    mando: "radial-gradient(circle at 34% 26%, #F7E9C4 0%, #E2C489 34%, #C29A5E 68%, #96703E 100%)",
    oscuro: "#12201A",
    linea: "rgba(217, 183, 120, 0.18)",
    claro: false,
  },
  champan: {
    nombre: "Champán",
    fondo: "linear-gradient(178deg, #F3E7CE 0%, #E4D2B0 42%, #C9B08A 100%)",
    texto: "#2E2618",
    tenue: "rgba(46, 38, 24, 0.55)",
    oro: "#8A6A32",
    oroRelleno: "linear-gradient(180deg, #FFF6DF 0%, #E8CE94 45%, #B08D57 100%)",
    mando: "radial-gradient(circle at 34% 26%, #FFFBEE 0%, #F0DDA9 34%, #D9B778 68%, #A07C42 100%)",
    oscuro: "#3A2F1C",
    linea: "rgba(138, 106, 50, 0.28)",
    claro: true,
  },
  grafito: {
    nombre: "Grafito",
    fondo: "linear-gradient(178deg, #3A3D40 0%, #26292B 40%, #131516 100%)",
    texto: "#EDEDEA",
    tenue: "rgba(237, 237, 234, 0.5)",
    oro: "#D9B778",
    oroRelleno: "linear-gradient(180deg, #F0DDA9 0%, #D9B778 42%, #A87F4A 100%)",
    mando: "radial-gradient(circle at 34% 26%, #F7E9C4 0%, #E2C489 34%, #C29A5E 68%, #96703E 100%)",
    oscuro: "#131516",
    linea: "rgba(217, 183, 120, 0.16)",
    claro: false,
  },
  marfil: {
    nombre: "Marfil",
    fondo: "linear-gradient(178deg, #FBF7EF 0%, #EFE9DE 45%, #D8CFBD 100%)",
    texto: "#26302A",
    tenue: "rgba(38, 48, 42, 0.55)",
    oro: "#7C6230",
    oroRelleno: "linear-gradient(180deg, #FFFDF7 0%, #E4D9C2 45%, #A8987A 100%)",
    mando: "radial-gradient(circle at 34% 26%, #FFFFFF 0%, #F0E7D4 34%, #CBB994 68%, #94825F 100%)",
    oscuro: "#26302A",
    linea: "rgba(38, 48, 42, 0.18)",
    claro: true,
  },
};

export const TEMA_POR_DEFECTO = "anodizado";
export const CLAVE_TEMA = "musica-evento-tema";
// Clave con la que se guarda una imagen de fondo propia en el mismo
// almacén que las pistas (lib/almacenPistas.js) -- una imagen puede
// pesar megas, así que no cabe en localStorage.
export const CLAVE_FONDO_PROPIO = "fondo-propio";

// Distribución de los paneles en la ventana. "vertical" = todo en una
// columna (lo que pidió el usuario para tener la ventana estrecha a un
// lado de la pantalla); "horizontal" = uno al lado de otro, para la
// ventana abierta del todo en el MacBook Air de 13".
export const PANELES = ["bloques", "reproductor", "volumen", "pistas"];
export const ASPECTO_POR_DEFECTO = {
  tema: TEMA_POR_DEFECTO,
  disposicion: "horizontal",
  orden: PANELES,
};
const CLAVE_ASPECTO = "musica-evento-aspecto";

// ⚠️ `localStorage` a secas es correcto aquí, igual que `indexedDB` en
// almacenPistas.js: pertenece al ORIGEN, no a una ventana concreta, así
// que la pestaña y la ventana emergente ven lo mismo. No cambiarlo a
// `ventana.localStorage` pensando que es un olvido.
export function leerAspecto() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_ASPECTO) || "{}");
    const orden = Array.isArray(guardado.orden)
      ? // Se filtra y se completa contra PANELES: si algún día se añade
        // o se quita un panel, una preferencia vieja no puede dejar la
        // ventana a medias ni pintar un panel que ya no existe.
        [...guardado.orden.filter((p) => PANELES.includes(p)), ...PANELES.filter((p) => !guardado.orden.includes(p))]
      : PANELES;
    return {
      tema: TEMAS_MUSICA[guardado.tema] ? guardado.tema : TEMA_POR_DEFECTO,
      disposicion: guardado.disposicion === "vertical" ? "vertical" : "horizontal",
      orden,
    };
  } catch {
    return ASPECTO_POR_DEFECTO;
  }
}

export function guardarAspecto(aspecto) {
  try {
    localStorage.setItem(CLAVE_ASPECTO, JSON.stringify(aspecto));
  } catch {
    // Sin almacenamiento (navegación privada) la ventana sigue
    // funcionando: solo se olvida el aspecto al cerrarla.
  }
}
