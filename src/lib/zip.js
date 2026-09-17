// ZIP mínimo, sin compresión ("store"), escrito a mano (2026-09-17).
//
// Para qué: descargar de golpe las ~48 fotos de boda desde Aniversarios.
// Safari bloquea una descarga detrás de otra, así que tienen que ir en un
// solo archivo. No se añade ninguna librería: las fotos son JPEG, que ya
// vienen comprimidas, así que comprimir otra vez no ahorra nada y el
// formato "store" son cuatro cabeceras y un CRC.
//
// Nombres de archivo en UTF-8 (bit 11 de las banderas): los apellidos
// llevan tildes y eñes, y sin esa bandera Windows los enseña rotos.

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = TABLA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Fecha y hora en el formato de MS-DOS que pide el ZIP.
function fechaDos(d) {
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { hora, dia };
}

// archivos: [{ nombre: string, datos: Uint8Array }]. Devuelve Uint8Array.
export function crearZip(archivos, fecha = new Date()) {
  const cod = new TextEncoder();
  const { hora, dia } = fechaDos(fecha);
  const partes = [];
  const central = [];
  let desplazamiento = 0;

  for (const { nombre, datos } of archivos) {
    const n = cod.encode(nombre);
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, hora, true);
    local.setUint16(12, dia, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, n.length, true);
    local.setUint16(28, 0, true);
    partes.push(new Uint8Array(local.buffer), n, datos);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, hora, true);
    cen.setUint16(14, dia, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, datos.length, true);
    cen.setUint32(24, datos.length, true);
    cen.setUint16(28, n.length, true);
    cen.setUint32(42, desplazamiento, true);
    central.push(new Uint8Array(cen.buffer), n);

    desplazamiento += 30 + n.length + datos.length;
  }

  const tamCentral = central.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, tamCentral, true);
  fin.setUint32(16, desplazamiento, true);

  const todo = [...partes, ...central, new Uint8Array(fin.buffer)];
  const total = todo.reduce((s, p) => s + p.length, 0);
  const salida = new Uint8Array(total);
  let pos = 0;
  for (const p of todo) {
    salida.set(p, pos);
    pos += p.length;
  }
  return salida;
}
