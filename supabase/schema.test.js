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

describe("la foto del Deshacer deja fuera lo que no se repone", () => {
  // Historia real (historial_texto, tablon_accesos) y cuentas y llaves
  // (anfitriones, anfitrion_secreto, config_secretos, tablon_secreto).
  // Reponerlas borraría lo que pasó o dejaría a todo el mundo fuera.
  it("foto_de_datos no incluye ninguna", () => {
    const i = sql.indexOf("FUNCTION public.foto_de_datos");
    const cuerpo = sql.slice(i, sql.indexOf("$$;", sql.indexOf("AS $$", i)));
    const dentro = ["historial_texto", "tablon_accesos", "anfitriones", "anfitrion_secreto", "config_secretos", "tablon_secreto"]
      .filter((t) => cuerpo.includes(t));
    expect(dentro).toEqual([]);
  });
});

describe("todo UPDATE y DELETE lleva WHERE", () => {
  // Supabase rechaza un UPDATE/DELETE sin filtro. La función de la
  // pregunta del tablón fallaba SIEMPRE por eso. Si de verdad se quiere
  // tocar la tabla entera, se escribe \`where true\`, a propósito.
  const sentencias = (texto) =>
    [...texto.replace(/--[^\n]*/g, "").matchAll(/\b(?:update\s+(?:public\.)?"?\w+"?\s+set\b|delete\s+from\s+\S+)[^;]*;/gi)].map((m) => m[0]);
  const sinWhere = (texto) => sentencias(texto).filter((t) => !/\bwhere\b/i.test(t));

  it("en schema.sql no hay ninguno sin WHERE", () => {
    expect(sentencias(sql).length).toBeGreaterThan(20);
    expect(sinWhere(sql)).toEqual([]);
  });

  it("el guardia caza uno sin WHERE (y deja pasar el que lo lleva)", () => {
    expect(sinWhere("update tablon_secreto set pregunta = 'x';")).toHaveLength(1);
    expect(sinWhere("update tablon_secreto set pregunta = 'x' where true;")).toHaveLength(0);
    expect(sinWhere("insert into t values (1) on conflict (id) do update set a = 1;")).toHaveLength(0);
  });
});

describe("una política nunca mira una tabla cerrada a pelo", () => {
  // Los cajones de fotos llevaron vacíos desde que se crearon: sus
  // políticas consultaban directamente una tabla cerrada, y eso falla en
  // silencio. Se arregló pasando por es_anfitrion() (security definer).
  it("ninguna política consulta anfitrion_secreto, anfitriones, config_secretos ni tablon_secreto", () => {
    const politicas = [...sql.matchAll(/CREATE POLICY[^;]+;/gi)].map((m) => m[0]);
    const culpables = politicas.filter((p) => /anfitrion_secreto|anfitriones|config_secretos|tablon_secreto/.test(p));
    expect(culpables).toEqual([]);
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

describe("schema.sql es un plano, no un diario", () => {
  // Antes se apuntaba cada cambio al final y había funciones repetidas
  // hasta cinco veces: al ir a tocar una, era fácil copiar la vieja. Si
  // cambia algo, se cambia en su sitio (cabecera de schema.sql).
  it("cada tabla y cada función aparecen una sola vez", () => {
    const nombres = [...sql.matchAll(/^create (?:or replace )?(function|table) (?:if not exists )?([\w."]+)/gim)].map(
      (m) => `${m[1].toLowerCase()} ${m[2].toLowerCase().replace(/"/g, "")}`
    );
    expect(nombres.length).toBeGreaterThan(20);
    const repetidos = nombres.filter((n, i) => nombres.indexOf(n) !== i);
    expect(repetidos).toEqual([]);
  });
});

describe("marcar a toda la familia: o todos o ninguno (norma 11)", () => {
  const cuerpo = cuerpoDe("colaborador_marcar_familia");

  it("comprueba que quien marca es ese colaborador", () => {
    expect(cuerpo).toContain("colaborador_puede_actuar(p_colaborador_id)");
    expect(cuerpo).toContain('"colaboradorId" = p_colaborador_id');
  });

  it("si uno de la familia no cumple, sale ANTES de tocar a nadie", () => {
    const comprobacion = cuerpo.indexOf("if found then");
    const primerUpdate = cuerpo.indexOf("update invitados");
    expect(comprobacion).toBeGreaterThan(-1);
    expect(comprobacion).toBeLessThan(primerUpdate);
  });

  it("no le avisa al colaborador de su propio cambio", () => {
    expect(cuerpo).toContain("set_config('eventos.recalculo_aviso_activo', 'off', true)");
  });
});
