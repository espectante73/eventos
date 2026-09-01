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
// Cada tema trae sus propios `panel`/`panelVivo`/`bordePanel` en vez de
// un velo genérico calculado sobre el fondo (como en la v20.16): con un
// velo blanco al 5%, un panel sobre champán y el propio champán eran
// casi el mismo color y no se veía dónde empezaba un mando -- el
// usuario lo pidió expresamente ("más contraste entre el fondo y los
// botones", 2026-09-01). Ahora el panel se aleja del fondo a propósito:
// en los temas oscuros aclara, en los claros blanquea, y siempre lleva
// un borde propio que dibuja el canto de la pieza.
export const TEMAS_MUSICA = {
  anodizado: {
    nombre: "Verde anodizado",
    fondo: "linear-gradient(178deg, #24402F 0%, #16291E 40%, #080F0B 100%)",
    panel: "rgba(255, 255, 255, 0.10)",
    panelVivo: "rgba(255, 255, 255, 0.19)",
    bordePanel: "rgba(217, 183, 120, 0.30)",
    texto: "#F2EDE3",
    tenue: "rgba(242, 237, 227, 0.58)",
    oro: "#D9B778",
    oroRelleno: "linear-gradient(180deg, #F0DDA9 0%, #D9B778 42%, #A87F4A 100%)",
    mando: "radial-gradient(circle at 34% 26%, #F7E9C4 0%, #E2C489 34%, #C29A5E 68%, #96703E 100%)",
    oscuro: "#12201A",
    linea: "rgba(217, 183, 120, 0.26)",
    claro: false,
  },
  champan: {
    nombre: "Champán",
    // El fondo baja un punto respecto a la v20.16 (llegaba casi a
    // blanco) justo para dejarle sitio a los paneles, que ahora son los
    // que van casi blancos.
    fondo: "linear-gradient(178deg, #E8D5AE 0%, #D6BE8F 45%, #B2986B 100%)",
    panel: "rgba(255, 253, 246, 0.80)",
    panelVivo: "rgba(255, 255, 255, 0.96)",
    bordePanel: "rgba(120, 92, 40, 0.34)",
    texto: "#2E2618",
    tenue: "rgba(46, 38, 24, 0.62)",
    oro: "#7A5C24",
    oroRelleno: "linear-gradient(180deg, #FFF6DF 0%, #E8CE94 45%, #B08D57 100%)",
    mando: "radial-gradient(circle at 34% 26%, #FFFBEE 0%, #F0DDA9 34%, #D9B778 68%, #A07C42 100%)",
    oscuro: "#3A2F1C",
    linea: "rgba(120, 92, 40, 0.34)",
    claro: true,
  },
  grafito: {
    nombre: "Grafito",
    fondo: "linear-gradient(178deg, #34383B 0%, #202325 42%, #0D0F10 100%)",
    panel: "rgba(255, 255, 255, 0.11)",
    panelVivo: "rgba(255, 255, 255, 0.20)",
    bordePanel: "rgba(217, 183, 120, 0.28)",
    texto: "#EDEDEA",
    tenue: "rgba(237, 237, 234, 0.56)",
    oro: "#D9B778",
    oroRelleno: "linear-gradient(180deg, #F0DDA9 0%, #D9B778 42%, #A87F4A 100%)",
    mando: "radial-gradient(circle at 34% 26%, #F7E9C4 0%, #E2C489 34%, #C29A5E 68%, #96703E 100%)",
    oscuro: "#131516",
    linea: "rgba(217, 183, 120, 0.24)",
    claro: false,
  },
  marfil: {
    nombre: "Marfil",
    fondo: "linear-gradient(178deg, #E6E0D2 0%, #D6CDB9 45%, #B9AE96 100%)",
    panel: "rgba(255, 255, 252, 0.82)",
    panelVivo: "rgba(255, 255, 255, 0.96)",
    bordePanel: "rgba(52, 62, 54, 0.30)",
    texto: "#232C26",
    tenue: "rgba(35, 44, 38, 0.62)",
    oro: "#6E5828",
    oroRelleno: "linear-gradient(180deg, #FFFDF7 0%, #E4D9C2 45%, #A8987A 100%)",
    mando: "radial-gradient(circle at 34% 26%, #FFFFFF 0%, #F0E7D4 34%, #CBB994 68%, #94825F 100%)",
    oscuro: "#232C26",
    linea: "rgba(52, 62, 54, 0.30)",
    claro: true,
  },
};

export const TEMA_POR_DEFECTO = "anodizado";
export const CLAVE_TEMA = "musica-evento-tema";
// Clave con la que se guarda una imagen de fondo propia en el mismo
// almacén que las pistas (lib/almacenPistas.js) -- una imagen puede
// pesar megas, así que no cabe en localStorage.
export const CLAVE_FONDO_PROPIO = "fondo-propio";
// Se probó un quinto acabado, "Acero pulido", dibujado con CSS
// (microlíneas verticales + degradado). Retirado el 2026-09-01: de
// cerca no parecía acero, solo rayas verticales. Un metal convincente
// necesita una FOTO de metal, no un degradado -- y para eso ya está la
// imagen de fondo propia. No volver a intentarlo con CSS.

// Distribución de los paneles en la ventana. "vertical" = todo en una
// columna (lo que pidió el usuario para tener la ventana estrecha a un
// lado de la pantalla); "horizontal" = uno al lado de otro, para la
// ventana abierta del todo en el MacBook Air de 13".
export const PANELES = ["bloques", "reproductor", "volumen", "pistas"];
export const ASPECTO_POR_DEFECTO = {
  tema: TEMA_POR_DEFECTO,
  // ¿Está puesta la imagen de fondo propia? Es una opción MÁS del
  // catálogo de acabados, no un ajuste aparte: el usuario subió una
  // imagen y esperaba verla ahí para poder elegirla (2026-09-01). El
  // acabado sigue mandando en los colores del texto y los paneles --
  // una foto no puede decidir si el texto va claro u oscuro.
  fondoPropioActivo: false,
  // ¿La imagen es clara (metal pulido, mármol...) u oscura? Decide si
  // el texto y los mandos van oscuros o claros ENCIMA de ella. Una foto
  // no puede decidirlo sola, y el acabado tampoco vale para esto: si
  // pones tu imagen, el acabado deja de pintarse.
  imagenClara: false,
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
      fondoPropioActivo: guardado.fondoPropioActivo === true,
      imagenClara: guardado.imagenClara === true,
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
