// Genera el texto JSON de la copia de seguridad — la usan la ventana
// "Copia de seguridad" (exportar a mano) y las CUATRO acciones
// destructivas que guardan una foto antes de disparar: Borrado total,
// desactivar Modo Pruebas, reiniciar por invitados y reiniciar avisos.
// Pura: no lee nada de React, solo el objeto que se le pasa.
//
// ⚠️ RECIBE LA CAJA ENTERA, NO UNA LISTA DE INGREDIENTES (2026-09-13).
// Antes pedía cinco cosas por su nombre: `exportarTodo({ evento, mesas,
// fotosFamiliares, colaboradores, invitados })`. Esa lista estaba
// escrita a mano, idéntica, en los cinco sitios que la llaman -- así que
// añadir una tabla a la copia obligaba a editar seis archivos. Nadie lo
// hizo nunca: la app creció de 5 a 12 tablas y la copia se quedó
// guardando las cinco de siempre, dejando fuera el tablón, las cuentas,
// el orden de las familias y el historial de avisos. Cuatro avisos de
// "tranquilo, he guardado una copia" que no decían la verdad.
//
// Ahora recibe `data` (lo que devuelve useLedgerData) y guarda TODO lo
// que encuentre dentro que sea un dato. Una tabla nueva en el hook
// aparece sola en la copia, sin tocar este archivo ni los cinco sitios
// que llaman. Es la misma idea que ya está escrita en CLAUDE.md: si dos
// cosas tienen que coincidir siempre, se unen -- no se sincronizan a
// mano.

// Lo que viaja en `data` pero NO es un dato del evento: banderas de
// estado de la propia pantalla. Las funciones (persistX, avisarX...) se
// descartan solas por su tipo, no hace falta nombrarlas.
const NO_ES_DATO = new Set(["loaded", "esAnfitrion", "asistenciaEnVivo"]);

// Secretos que no deben acabar dentro de un archivo que se descarga al
// ordenador. Mismo criterio que el backup diario de la base de datos,
// que excluye a propósito los datos de `anfitrion_secreto` y
// `config_secretos` (ver .github/workflows/backup.yml y CLAUDE.md: un
// primer intento de commitear el volcado lo bloqueó GitHub al detectar
// la clave de Resend en texto plano).
//
// `preguntaTablon` SÍ entra: es solo el enunciado de la pregunta, que
// es público por definición (hay que enseñárselo a quien abre el
// tablón). La respuesta correcta nunca sale de la base de datos.
const ES_SECRETO = new Set(["tokenTablon"]);

export function exportarTodo(data) {
  const datos = {
    version: 2,
    exportadoEn: new Date().toISOString(),
  };

  for (const [clave, valor] of Object.entries(data || {})) {
    if (typeof valor === "function") continue;
    if (NO_ES_DATO.has(clave)) continue;
    if (ES_SECRETO.has(clave)) continue;
    datos[clave] = valor;
  }

  return JSON.stringify(datos, null, 2);
}
