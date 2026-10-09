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
import { readFileSync, readdirSync, statSync } from "node:fs";
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

// Modo Pruebas (v49): los colaboradores quedan fuera y los correos van solo
// al anfitrión. Si una de estas puertas olvida la comprobación, un
// colaborador trabajaría sobre datos que se van a restaurar.
describe("Modo Pruebas en la base", () => {
  it("toda puerta de escritura de colaborador comprueba modo_pruebas_activo()", () => {
    for (const f of ["colaborador_puede_actuar", "colaborador_tiene_permiso", "colaborador_puede_editar_novedades", "guardar_fotos_familiares"]) {
      expect(cuerpoDe(f), f).toMatch(/modo_pruebas_activo\(\)/);
    }
  });

  it("en pruebas, el correo va al anfitrión y el asunto dice a quién iba", () => {
    const f = cuerpoDe("enviar_email");
    expect(f).toMatch(/if modo_pruebas_activo\(\) then/);
    expect(f).toMatch(/v_para := \(select "emailAnfitrion" from evento/);
    expect(f).toMatch(/'to', v_para/);
    expect(f).toMatch(/'subject', v_asunto/);
  });

  it("ya no queda la lista de colaboradores habilitados", () => {
    expect(sql).not.toMatch(/habilitadoEnPruebas/);
  });
});

// v53.4: el acceso de anfitrión no se da SOLO nunca. Antes, una cuenta
// nueva con el correo de "Email anfitrión" se hacía anfitriona, y ese campo
// lo podía cambiar un colaborador con permiso: se hacía anfitrión él mismo.
describe("el acceso de anfitrión", () => {
  it("ninguna función de la base mete a nadie en anfitriones", () => {
    expect(sql).not.toMatch(/insert into anfitriones/i);
  });

  it("un colaborador no puede cambiar el «Email anfitrión»", () => {
    const permitidas = cuerpoDe("guardar_evento").match(/v_permitidas text\[\] := array\[([\s\S]*?)\];/)[1];
    expect(permitidas).not.toMatch(/emailAnfitrion/);
  });

  it("al entrar, una cuenta ya existente se une a su ficha por su correo CONFIRMADO", () => {
    const f = cuerpoDe("mi_rol");
    expect(f).toMatch(/update colaboradores c/);
    expect(f).toMatch(/email_confirmed_at is not null/);
    expect(f).toMatch(/c\."authUserId" is null/);
  });
});

// v53.5: al eliminar un colaborador se borra su cuenta de acceso, con dos
// seguros; y el Deshacer no puede romperse por una cuenta que ya no existe.
describe("borrar la cuenta al eliminar un colaborador", () => {
  it("solo se borra con los dos seguros: nunca la del anfitrión ni una que use otra ficha", () => {
    const f = cuerpoDe("eliminar_colaboradores");
    const borrado = f.slice(f.indexOf("delete from auth.users"));
    expect(borrado).toMatch(/not exists \(select 1 from anfitriones a where a\."authUserId" = u\.id\)/);
    expect(borrado).toMatch(/not exists \(select 1 from colaboradores c where c\."authUserId" = u\.id\)/);
  });

  it("ninguna otra función borra cuentas de acceso", () => {
    const veces = (sql.match(/delete from auth\.users/gi) || []).length;
    expect(veces).toBe(1);
  });

  it("restaurar una foto no falla por la cuenta de un colaborador que ya no existe", () => {
    const f = cuerpoDe("restaurar_foto");
    expect(f).toMatch(/elem - 'authUserId'/);
  });
});

// v53.8: un colaborador existe porque se eligió de la Lista de invitados.
// Borrarlo desde la Lista lo elimina del todo, por la MISMA pieza que
// eliminarlo desde Colaboradores.
describe("eliminar a un colaborador desde la Lista de invitados", () => {
  it("los dos caminos usan la misma pieza, eliminar_colaboradores", () => {
    expect(cuerpoDe("anfitrion_guardar_colaboradores")).toMatch(/perform eliminar_colaboradores\(/);
    expect(cuerpoDe("anfitrion_guardar_invitados")).toMatch(/perform eliminar_colaboradores\(/);
  });

  it("borrar invitados elimina antes a los colaboradores que eran esos invitados", () => {
    const f = cuerpoDe("anfitrion_guardar_invitados");
    expect(f.indexOf("perform eliminar_colaboradores(")).toBeLessThan(f.indexOf("delete from invitados"));
    expect(f).toMatch(/c\."invitadoId" = any\(p_ids\)/);
  });

  it("nadie de fuera puede llamar a la pieza que borra cuentas", () => {
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.eliminar_colaboradores\(uuid\[\]\) FROM public, anon, authenticated;/);
  });
});


// Pagado, los datos ya solo los cambia el anfitrión (él, v54). La pantalla
// no abre la ficha; esto es lo que de verdad lo impide.
describe("la ficha pagada, cerrada al colaborador", () => {
  it("colaborador_guardar_invitado no toca a un invitado pagado", () => {
    expect(cuerpoDe("colaborador_guardar_invitado")).toMatch(/and not coalesce\("pagado", false\)/);
  });

  it("la foto de boda: solo de sus matrimonios, y mientras la pareja no haya pagado", () => {
    const f = cuerpoDe("guardar_fotos_familiares");
    expect(f).toMatch(/c\."authUserId" = auth\.uid\(\)/);
    expect(f).toMatch(/i\."rolFamiliar" in \('esposo', 'esposa'\)/);
    expect(f).toMatch(/and not coalesce\(i\."pagado", false\)/);
  });
});

// Los canales en vivo, privados (v55): sin sesión no se entra. Un canal
// nuevo que no fuera privado, o que no tuviera su permiso aquí, o se
// quedaría abierto a cualquiera o no conectaría nunca.
describe("los canales en vivo, solo con sesión y permiso", () => {
  const src = join(aqui, "..", "src");
  const conCanal = [];
  const buscar = (dir) => {
    for (const n of readdirSync(dir)) {
      const r = join(dir, n);
      if (statSync(r).isDirectory()) buscar(r);
      else if (/\.jsx?$/.test(n) && !/\.test\./.test(n) && readFileSync(r, "utf-8").includes("supabase.channel(")) conCanal.push(r);
    }
  };
  buscar(src);

  it("hay canales que mirar (si no, el buscador está roto)", () => {
    expect(conCanal.length).toBeGreaterThanOrEqual(2);
  });

  it("todo canal se abre con private: true", () => {
    for (const r of conCanal) {
      const llamadas = readFileSync(r, "utf-8").match(/supabase\.channel\([^)]*\)/gs) || [];
      for (const l of llamadas) expect(l, r).toMatch(/private: true/);
    }
  });

  it("y cada uno tiene su permiso en puede_usar_canal", () => {
    const permisos = cuerpoDe("puede_usar_canal");
    // Todos los nombres de canal de esos archivos ("…-evento"), no solo
    // el primero: useMandoMusica abre también el del vídeo (v58).
    const nombres = conCanal.flatMap((r) => [...readFileSync(r, "utf-8").matchAll(/= "([a-z]+-evento)"/g)].map((m) => m[1]));
    expect(nombres).toEqual(expect.arrayContaining(["musica-evento", "asistencia-evento", "video-evento"]));
    for (const nombre of nombres) expect(permisos, nombre).toContain(`'${nombre}'`);
  });

  it("al mando de la música entra el anfitrión y quien tenga el permiso Multimedia", () => {
    expect(cuerpoDe("puede_usar_canal")).toMatch(/when 'musica-evento' then es_anfitrion\(\) or colaborador_tiene_permiso\('multimedia'\)/);
  });

  it("las políticas de realtime.messages preguntan a puede_usar_canal, solo con sesión", () => {
    expect(sql).toMatch(/CREATE POLICY canales_leer ON realtime\.messages FOR SELECT TO authenticated[^;]*puede_usar_canal/);
    expect(sql).toMatch(/CREATE POLICY canales_escribir ON realtime\.messages FOR INSERT TO authenticated[^;]*puede_usar_canal/);
  });
});

// El enlace-token ?rol= se retiró en agosto de 2026: el que lo abre sin
// sesión ve "No tienes acceso". Se coló en dos correos, de uno en uno
// (2026-09-23 y v58.6). Ningún correo de la base puede volver a llevarlo.
describe("ningún correo lleva el enlace viejo ?rol=", () => {
  it("ni una sola vez en schema.sql (los comentarios que lo cuentan, aparte)", () => {
    const sinComentarios = sql.replace(/--.*$/gm, "");
    expect(sinComentarios).not.toMatch(/'\?rol='/);
  });
});

// Si cada colaborador tiene cuenta y cuándo entró (v58.7): lee auth.users,
// así que solo con la llave del anfitrión, y nadie de fuera la puede llamar.
describe("el estado de las cuentas de los colaboradores", () => {
  it("pide la llave del anfitrión y no la puede usar anon", () => {
    expect(cuerpoDe("anfitrion_estado_cuentas")).toMatch(/if p_token is distinct from \(select "token" from anfitrion_secreto/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.anfitrion_estado_cuentas\(uuid\) FROM PUBLIC, anon;/);
  });

  // Una persona, dos papeles (norma 16): la llave se une a su ficha de
  // colaborador ANTES de devolver "anfitrion", no se queda sin ella.
  it("al entrar, el anfitrión que también es colaborador queda unido a su ficha", () => {
    const f = cuerpoDe("mi_rol");
    expect(f.indexOf("update colaboradores c")).toBeGreaterThan(-1);
    expect(f.indexOf("update colaboradores c")).toBeLessThan(f.indexOf("from anfitriones a"));
  });
});
