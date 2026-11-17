// Las alergias de un invitado, en un solo texto («Gluten, Lactosa, Gambas,
// nueces y almendras»; «No» es la respuesta de que no tiene). Las marca
// ElegirAlergias (components/CamposFicha.jsx): «No», «Gluten», «Lactosa» y
// «Otras», con su campo; lo de «Otras» puede llevar sus propias comas.
//
// Uniformes (él, v88.9: «letra capital mayúscula y el resto minúscula»): lo
// de «Otras» se guarda así, y lo que ya estaba escrito de otra forma
// («MARISCO», «marisco») se enseña así en todas partes (alergiasUniformes).

// 15 se quedaban cortas para «GAMBAS, NUECES Y ALMENDRAS» (él, v88.8).
export const MAX_OTRAS_ALERGIAS = 60;

const FIJAS = ["No", "Gluten", "Lactosa"];

// «MARISCO» y «marisco» → «Marisco»; «GAMBAS, NUECES» → «Gambas, nueces».
export function capitalizar(texto) {
  const t = String(texto || "").trim().toLocaleLowerCase("es");
  return t.charAt(0).toLocaleUpperCase("es") + t.slice(1);
}

export function parsearAlergias(texto) {
  const partes = (texto || "").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    no: partes.includes("No"),
    gluten: partes.includes("Gluten"),
    lactosa: partes.includes("Lactosa"),
    // Todo lo demás es «Otras», con sus comas: antes solo se quedaba la
    // primera parte, y «Gambas, nueces» volvía como «Gambas» (v88.8).
    otras: partes.filter((p) => !FIJAS.includes(p)).join(", "),
  };
}

export function textoAlergias(sel) {
  if (sel.no) return "No";
  const partes = [];
  if (sel.gluten) partes.push("Gluten");
  if (sel.lactosa) partes.push("Lactosa");
  if (sel.otras.trim()) partes.push(capitalizar(sel.otras));
  return partes.join(", ");
}

// Para enseñarlas (la ventana de Alergias, su CSV, las mesas, el tablón):
// siempre con la misma forma, aunque se escribieran de otra.
export const alergiasUniformes = (texto) => textoAlergias(parsearAlergias(texto));
