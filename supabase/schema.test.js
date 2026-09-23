// El guardia del esquema (2026-09-23).
//
// Nace de una idea del usuario: **una trampa que puede tener un test, lo
// tiene**. Lo que se comprueba aquí no es la app corriendo — es el TEXTO
// de `schema.sql`. La misma técnica que `theme.test.js` o el test del
// mapa: no prueban lo que hace el programa, prueban lo que dice el
// proyecto.
//
// Cada `it` de aquí es una trampa que ya se pagó una vez, con su fecha.
// Si alguno se pone en rojo, no es un capricho de estilo: es ese mismo
// fallo volviendo.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(aqui, "schema.sql"), "utf-8");

// El cuerpo de una función, de su CREATE hasta el $$; que la cierra.
function cuerpoDe(nombre) {
  const i = sql.indexOf(`FUNCTION public.${nombre}(`);
  expect(i, `no encuentro la función ${nombre} en schema.sql`).toBeGreaterThan(-1);
  const j = sql.indexOf("\n$$;", i);
  const k = sql.indexOf("\n$_$;", i);
  const fin = j === -1 ? k : k === -1 ? j : Math.min(j, k);
  return sql.slice(i, fin);
}

const tablas = (cuerpo, verbo) =>
  [...cuerpo.matchAll(new RegExp(`${verbo}\\s+([a-z_]+)`, "g"))].map((m) => m[1]);

describe("restaurar_foto: el orden sigue las claves foráneas", () => {
  const cuerpo = cuerpoDe("restaurar_foto");
  const insertadas = tablas(cuerpo, "insert into");

  // 2026-09-20: los invitados se insertaban ANTES que las mesas, y
  // invitados."mesa" apunta a mesas."numero". Con un solo invitado
  // sentado, la restauración entera fallaba: el usuario no podía salir
  // del Modo Pruebas ni usar el Deshacer.
  it("las mesas se insertan antes que los invitados", () => {
    expect(insertadas.indexOf("mesas")).toBeGreaterThan(-1);
    expect(insertadas.indexOf("mesas")).toBeLessThan(insertadas.indexOf("invitados"));
  });

  // Los invitados entran sin colaborador y se enganchan después, porque
  // los colaboradores todavía no existen.
  it("los colaboradores se insertan después que los invitados", () => {
    expect(insertadas.indexOf("invitados")).toBeLessThan(insertadas.indexOf("colaboradores"));
  });

  // 2026-09-17: `novedades` estuvo meses en una lista y no en la otra, y
  // el Modo Pruebas no la restauraba. Si se borra una tabla y no se
  // repone, sus datos se pierden sin que nadie se entere.
  it("borra exactamente las mismas tablas que repone", () => {
    const borradas = [...tablas(cuerpo, "delete from")].sort();
    const repuestas = [...new Set(insertadas)].sort();
    expect(repuestas).toEqual(borradas);
  });

  // El trigger que recalcula "avisoPendiente" reescribiría el valor de
  // la foto al insertarla: una copia tiene que volver tal cual.
  it("apaga el recálculo de avisos mientras repone", () => {
    expect(cuerpo).toContain("eventos.recalculo_aviso_activo");
  });
});

describe("nada abierto a escritura anónima", () => {
  // 2026-09-06: cuatro tablas tenían `for all using (true) with check
  // (true)`. `evento` guarda las plantillas de los emails automáticos:
  // reescribirlas desde fuera es decidir el texto que la app manda a
  // ~140 invitados con el remitente legítimo del anfitrión.
  it("ninguna política es FOR ALL: las públicas son de solo lectura", () => {
    const politicas = [...sql.matchAll(/CREATE POLICY[^;]+;/gi)].map((m) => m[0]);
    const escritura = politicas.filter((p) => /FOR\s+ALL/i.test(p));
    expect(escritura).toEqual([]);
  });

  it("toda política pública de public.* es FOR SELECT", () => {
    const publicas = [...sql.matchAll(/CREATE POLICY\s+\w+\s+ON\s+public\.[^;]+;/gi)].map((m) => m[0]);
    for (const p of publicas) expect(p, p.slice(0, 80)).toMatch(/FOR\s+SELECT/i);
  });

  // `foto_de_datos` y `restaurar_foto` vacían y repueblan tablas
  // enteras. Postgres concede EXECUTE a PUBLIC por defecto.
  it("las funciones que vacían tablas están revocadas", () => {
    for (const f of ["foto_de_datos()", "restaurar_foto(jsonb)"]) {
      expect(sql, f).toContain(`REVOKE EXECUTE ON FUNCTION public.${f} FROM public, anon, authenticated;`);
    }
  });
});

describe("el anfitrión no pisa lo que rellena un colaborador", () => {
  // 2026-09-23. El guardado del anfitrión mandaba la lista ENTERA y la
  // función borraba a quien no viniera en ella. Su pantalla puede llevar
  // hasta un minuto abierta: si un colaborador rellenaba un email en ese
  // rato, el siguiente guardado del anfitrión lo devolvía a como estaba
  // en su copia, sin error y sin aviso. Con un colaborador no coincidía;
  // con cinco a la vez, sí.
  const cuerpo = cuerpoDe("anfitrion_guardar_invitados");

  it("recibe la lista de ids aparte de las filas", () => {
    expect(sql).toContain("anfitrion_guardar_invitados(p_token uuid, p_filas jsonb, p_ids uuid[])");
  });

  it("borra por p_ids, nunca por ausencia en p_filas", () => {
    expect(cuerpo).toMatch(/delete from invitados[\s\S]*p_ids/);
    expect(cuerpo, "vuelve a borrar por lo que falte en p_filas").not.toMatch(
      /delete from invitados[\s\S]{0,200}jsonb_array_elements\(p_filas\)/
    );
  });

  it("un p_ids nulo no puede vaciar la tabla", () => {
    expect(cuerpo).toContain("if p_ids is not null then");
  });
});

describe("el token del anfitrión siempre es uuid", () => {
  // 2026-09-06: cuatro funciones se escribieron con `p_token text`
  // mientras `anfitrion_secreto.token` es uuid. La comparación no
  // fallaba: simplemente nunca era cierta, así que las funciones no
  // hacían nada y no avisaban de nada.
  it("ninguna función declara p_token como text", () => {
    expect(sql).not.toMatch(/p_token\s+text/i);
  });
});
