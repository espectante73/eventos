// Guarda las pistas de "Música del evento" DENTRO del navegador del
// ordenador que suena, para que no haya que volver a elegirlas cada vez
// -- bug real reportado por el usuario el 2026-08-31: al recargar la
// ventana, las pistas desaparecían y tocaba cargarlas otra vez.
//
// ⚠️ Por qué se guarda una COPIA y no la ruta del archivo: ninguna
// página web puede quedarse con la ruta de un archivo del disco ni
// volver a abrirlo por su cuenta -- es una restricción de seguridad de
// todos los navegadores, no un límite que se pueda rodear. Lo que sí se
// puede es guardar el archivo entero dentro del almacén del propio
// navegador, y eso es lo que hace esto. A efectos prácticos da igual:
// se elige una vez y se queda, aunque se cierre el navegador o se
// reinicie el Mac.
//
// Se usa IndexedDB (no localStorage) porque es el único almacén del
// navegador que admite archivos binarios grandes: una pista de una hora
// puede pesar decenas de megas, y localStorage solo guarda texto y se
// queda en unos pocos megas.
//
// ⚠️ `indexedDB` a secas SÍ es correcto aquí, a diferencia de
// `navigator.clipboard`/`window.alert` (ver la regla de CLAUDE.md sobre
// ventanas emergentes): una base de IndexedDB pertenece al ORIGEN
// (nexuspoint.rsvp), no a una ventana concreta, así que la pestaña
// principal y la ventana emergente ven exactamente la misma. No es un
// descuido -- no cambiar esto a `ventana.indexedDB` pensando que es un
// olvido.
const NOMBRE_BD = "eventos-musica";
const ALMACEN = "pistas";

function abrirBD() {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(NOMBRE_BD, 1);
    peticion.onupgradeneeded = () => {
      const bd = peticion.result;
      if (!bd.objectStoreNames.contains(ALMACEN)) bd.createObjectStore(ALMACEN);
    };
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

function conAlmacen(modo, trabajo) {
  return abrirBD().then(
    (bd) =>
      new Promise((resolve, reject) => {
        const transaccion = bd.transaction(ALMACEN, modo);
        const peticion = trabajo(transaccion.objectStore(ALMACEN));
        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error);
        transaccion.oncomplete = () => bd.close();
      })
  );
}

// `clave` es el índice del bloque (0-8) o la cadena "cortinilla".
export function guardarPista(clave, archivo) {
  return conAlmacen("readwrite", (almacen) =>
    almacen.put({ nombre: archivo.name, tipo: archivo.type, datos: archivo }, String(clave))
  );
}

export function borrarPista(clave) {
  return conAlmacen("readwrite", (almacen) => almacen.delete(String(clave)));
}

// Devuelve { clave: { nombre, datos } } con todo lo guardado. Quien lo
// llame se encarga de convertir `datos` en una URL reproducible (y de
// liberarla después) -- esta capa no sabe nada de ventanas ni de audio.
export function leerTodasLasPistas() {
  return abrirBD().then(
    (bd) =>
      new Promise((resolve, reject) => {
        const transaccion = bd.transaction(ALMACEN, "readonly");
        const almacen = transaccion.objectStore(ALMACEN);
        const resultado = {};
        const cursor = almacen.openCursor();
        cursor.onsuccess = () => {
          const puntero = cursor.result;
          if (!puntero) {
            resolve(resultado);
            return;
          }
          resultado[puntero.key] = puntero.value;
          puntero.continue();
        };
        cursor.onerror = () => reject(cursor.error);
        transaccion.oncomplete = () => bd.close();
      })
  );
}
