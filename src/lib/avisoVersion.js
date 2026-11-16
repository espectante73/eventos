// El aviso rojo de «Actualizar» (él, v81.6): TODOS los que entran con su
// cuenta ven a qué versión lleva y, en 2 o 3 líneas, qué cambia. La pestaña
// abierta lleva el código viejo, así que lo nuevo lo lee de /version.json,
// que escribe cada publicación (vite.config.js) con VERSION_APP y
// AVISO_VERSION de constants.js.

// Letras como mucho del aviso: 3 líneas en el móvil más estrecho.
export const TOPE_AVISO = 120;

// Lo publicado, o null si no se pudo leer o no tiene forma de versión.
export async function leerVersionPublicada(pedir = fetch) {
  try {
    const res = await pedir("/version.json", { cache: "no-store" });
    if (!res.ok) return null;
    const { version, aviso } = await res.json();
    if (typeof version !== "string" || !/^\d+(\.\d+)?$/.test(version)) return null;
    return { version, aviso: typeof aviso === "string" ? aviso.trim().slice(0, TOPE_AVISO) : "" };
  } catch {
    return null;
  }
}

// ¿Se enseña ya el aviso? Al publicar, la página nueva y /version.json no
// llegan a la vez: una pestaña puede ver el código nuevo con el número de
// antes y decir «sin número nuevo» sin serlo (pasó en la v88). Con el mismo
// número se espera ESPERAS_SIN_NUMERO comprobaciones (una por minuto); si
// sigue igual, entonces sí se avisa. Sin poder leerlo, el aviso de siempre.
export const ESPERAS_SIN_NUMERO = 3;
export function avisarYa({ actual, nueva, esperas }) {
  return !nueva || nueva.version !== actual || esperas >= ESPERAS_SIN_NUMERO;
}

// Título y texto del aviso. Una actualización sin número nuevo no debería
// llegar (el freno de subida lo impide): al anfitrión se le dice, para que
// pregunte antes (él temió algo de fuera al ver una así); al resto, el aviso
// de siempre.
export function textoAvisoVersion({ actual, nueva, esAnfitrion }) {
  if (nueva && nueva.version !== actual) return { titulo: `Versión ${nueva.version}`, texto: nueva.aviso };
  if (nueva && esAnfitrion) {
    return { titulo: "Actualización sin número nuevo", texto: "Consúltalo antes de actualizar: toda versión nueva lleva su número." };
  }
  return { titulo: "Hay una versión nueva de la app", texto: "" };
}
