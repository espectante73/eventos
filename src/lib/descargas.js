// Descargas al dispositivo: CSV, JSON (copias de seguridad), y la carpeta
// persistente de invitaciones (File System Access API en Chromium, con
// alternativa de descarga clásica en Safari/Firefox). Sin JSX, sin estado
// de React — movida fuera de App.jsx en el reparto del 2026-08-08 (ver
// CLAUDE.md).

export function descargarCSV(nombreArchivo, cabeceras, filas) {
  const escapar = (v) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [cabeceras, ...filas].map((fila) => fila.map(escapar).join(";"));
  const csv = "﻿" + lineas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Copia de seguridad en JSON de lo que se va a poner a cero, descargada al
// dispositivo justo antes de ejecutar cualquier reinicio en bloque — para
// poder recuperar los datos a mano si hiciera falta.
export function descargarJSON(nombreArchivo, datos) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Redimensiona una foto subida desde el dispositivo a un JPEG razonable antes
// de guardarla como data URL, para no disparar el tamaño de lo almacenado.
export function redimensionarImagenArchivo(file, maxDim = 1600, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const escala = maxDim / Math.max(width, height);
          width = Math.round(width * escala);
          height = Math.round(height * escala);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL("image/jpeg", calidad));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = lector.result;
    };
    lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
    lector.readAsDataURL(file);
  });
}

// ---------- Carpeta de guardado de invitaciones (persistente) ----------
// La API de acceso al sistema de archivos (showDirectoryPicker) solo existe
// en navegadores basados en Chromium (Chrome, Edge...) — en Safari/Firefox
// se usa automáticamente el método de descarga normal, sin carpeta fija.
const IDB_NOMBRE = "eventos-app";
const IDB_ALMACEN = "handles";
const IDB_CLAVE_CARPETA = "carpetaInvitaciones";

function abrirIDB() {
  return new Promise((resolve, reject) => {
    const peticion = indexedDB.open(IDB_NOMBRE, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(IDB_ALMACEN);
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });
}

async function guardarHandleCarpeta(handle) {
  const db = await abrirIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_ALMACEN, "readwrite");
    tx.objectStore(IDB_ALMACEN).put(handle, IDB_CLAVE_CARPETA);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function leerHandleCarpeta() {
  const db = await abrirIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_ALMACEN, "readonly");
    const peticion = tx.objectStore(IDB_ALMACEN).get(IDB_CLAVE_CARPETA);
    peticion.onsuccess = () => resolve(peticion.result || null);
    peticion.onerror = () => reject(peticion.error);
  });
}

// Pide la carpeta al usuario (una vez) y la recuerda para la próxima vez —
// "forzarElegir" se usa desde el botón "Cambiar carpeta" para elegir otra.
export async function obtenerCarpetaInvitaciones({ forzarElegir }) {
  if (!window.showDirectoryPicker) return null;

  if (!forzarElegir) {
    try {
      const handleGuardado = await leerHandleCarpeta();
      if (handleGuardado) {
        const permiso = await handleGuardado.queryPermission({ mode: "readwrite" });
        if (permiso === "granted") return handleGuardado;
        if (permiso === "prompt") {
          const concedido = await handleGuardado.requestPermission({ mode: "readwrite" });
          if (concedido === "granted") return handleGuardado;
        }
      }
    } catch (_) {
      // Sigue abajo y pide una carpeta nueva si algo falla.
    }
  }

  try {
    const handleNuevo = await window.showDirectoryPicker();
    await guardarHandleCarpeta(handleNuevo);
    return handleNuevo;
  } catch (_) {
    return null; // El usuario cerró el selector sin elegir nada.
  }
}

function descargarDataUrlClasico(dataUrl, nombreArchivo) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Guarda directamente en la carpeta elegida si el navegador lo permite;
// si no (Safari/Firefox, o el usuario nunca eligió carpeta), cae al método
// clásico de descarga (va a la carpeta de Descargas de siempre).
export async function guardarArchivoInvitacion(dataUrl, nombreArchivo) {
  const carpeta = await obtenerCarpetaInvitaciones({ forzarElegir: false });
  if (!carpeta) {
    descargarDataUrlClasico(dataUrl, nombreArchivo);
    return;
  }
  try {
    const respuesta = await fetch(dataUrl);
    const blob = await respuesta.blob();
    const fileHandle = await carpeta.getFileHandle(nombreArchivo, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (_) {
    descargarDataUrlClasico(dataUrl, nombreArchivo);
  }
}
