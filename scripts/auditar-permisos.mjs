// Auditoría de permisos contra la base de datos REAL, vista desde fuera:
// se pone en la piel de un desconocido que solo tiene lo que cualquiera
// puede conseguir -- la clave publicable, que va dentro del JavaScript
// de la web y es pública por diseño.
//
// Nació el 2026-09-06 (v24), después de descubrir así que cuatro tablas
// (evento, mesas, fotos_familiares, orden_familias) llevaban meses
// abiertas a ESCRITURA para cualquiera. Leyendo el código no se veía:
// la política decía "datos sin sensibilidad real" y era cierta el día
// que se escribió, pero a `evento` se le fueron añadiendo columnas
// -- las plantillas de los emails, entre otras -- sin revisarla.
//
// Por eso esto es un script y no una nota: la única forma de saber qué
// permite el servidor HOY es preguntárselo al servidor hoy.
//
//   node scripts/auditar-permisos.mjs
//
// NO MODIFICA NADA. Las pruebas de escritura van filtradas a filas que
// no existen (?id=eq.false, numero=eq.999999...): al servidor le basta
// para decidir si concede el permiso, y no hay ninguna fila que tocar.
// Aun así responde ANTES de mirar los datos, así que el permiso queda
// probado de verdad, no supuesto.

const WEB = process.env.WEB_AUDITAR || "https://nexuspoint.rsvp";

// Tablas que deben poder LEERSE sin sesión (el tablón público las
// necesita) pero NUNCA escribirse.
const SOLO_LECTURA = [
  { tabla: "evento", filtro: "id=eq.false", cuerpo: { nombre: "x" } },
  { tabla: "mesas", filtro: "numero=eq.999999", cuerpo: { capacidad: 1 } },
  { tabla: "fotos_familiares", filtro: "grupoFamiliar=eq.__auditoria__", cuerpo: { url: "x" } },
  { tabla: "orden_familias", filtro: "grupoFamiliar=eq.__auditoria__", cuerpo: { invitacionEnviada: true } },
];

// Tablas que no deben poder ni leerse.
const CERRADAS = ["invitados", "colaboradores", "anfitrion_secreto", "config_secretos", "gastos", "avisos_enviados"];

async function extraerCredenciales() {
  const html = await (await fetch(WEB)).text();
  const ruta = html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];
  if (!ruta) throw new Error(`No encuentro el bundle en ${WEB}`);
  const js = await (await fetch(WEB + ruta)).text();
  const url = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0];
  const clave = js.match(/sb_publishable_[A-Za-z0-9_-]+/)?.[0] || js.match(/eyJ[A-Za-z0-9_-]{40,}/)?.[0];
  if (!url || !clave) throw new Error("No encuentro la URL o la clave dentro del bundle");
  return { url, clave, bundle: ruta };
}

const fallos = [];
const linea = (ok, texto) => console.log(`  ${ok ? "✓" : "✗"} ${texto}`);

async function main() {
  const { url, clave, bundle } = await extraerCredenciales();
  const cab = { apikey: clave, "Content-Type": "application/json" };
  console.log(`\nAuditando ${WEB}`);
  console.log(`Bundle ${bundle}`);
  console.log(`Con la clave publicable, tal y como la conseguiría cualquiera.\n`);

  console.log("Tablas públicas — deben dejarse LEER:");
  for (const { tabla } of SOLO_LECTURA) {
    const r = await fetch(`${url}/rest/v1/${tabla}?select=*&limit=1`, { headers: cab });
    const ok = r.status === 200;
    if (!ok) fallos.push(`${tabla}: ya no se puede leer (HTTP ${r.status}) — el tablón público se romperá`);
    linea(ok, `${tabla} → HTTP ${r.status}`);
  }

  console.log("\nTablas públicas — NO deben dejarse ESCRIBIR:");
  for (const { tabla, filtro, cuerpo } of SOLO_LECTURA) {
    for (const [metodo, opciones] of [
      ["PATCH", { method: "PATCH", headers: cab, body: JSON.stringify(cuerpo) }],
      ["DELETE", { method: "DELETE", headers: cab }],
    ]) {
      const r = await fetch(`${url}/rest/v1/${tabla}?${filtro}`, opciones);
      const ok = r.status === 401 || r.status === 403;
      if (!ok) fallos.push(`${tabla}: acepta ${metodo} anónimo (HTTP ${r.status}) — ESCRITURA ABIERTA`);
      linea(ok, `${metodo} ${tabla} → HTTP ${r.status}`);
    }
  }

  console.log("\nTablas cerradas — no deben dejarse ni LEER:");
  for (const tabla of CERRADAS) {
    const r = await fetch(`${url}/rest/v1/${tabla}?select=*&limit=1`, { headers: cab });
    const ok = r.status === 401 || r.status === 403 || r.status === 404;
    if (!ok) fallos.push(`${tabla}: se puede leer sin sesión (HTTP ${r.status}) — FUGA DE DATOS`);
    linea(ok, `${tabla} → HTTP ${r.status}`);
  }

  if (fallos.length === 0) {
    console.log("\nTodo correcto. Nada que un desconocido pueda tocar.\n");
    return;
  }
  console.log(`\n${fallos.length} PROBLEMA(S):\n`);
  for (const f of fallos) console.log(`  ✗ ${f}`);
  console.log("");
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(`\nLa auditoría no pudo completarse: ${e.message}\n`);
  process.exitCode = 2;
});
