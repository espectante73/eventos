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

// v63: el enlace del grupo de WhatsApp es el primer filtro para llegar al
// tablón; con la tabla abierta, cualquiera lo leía sin pasar por la app.
describe("el evento no se lee directamente", () => {
  it("evento sin política de lectura pública, y sin permiso de lectura", () => {
    expect(sql).not.toMatch(/CREATE POLICY\s+\w+\s+ON\s+public\.evento\s+FOR\s+SELECT/i);
    expect(sql).toContain("REVOKE SELECT ON public.evento FROM anon, authenticated;");
  });

  it("evento_publico quita lo privado", () => {
    const f = cuerpoDe("evento_publico");
    expect(f).toContain("- 'enlaceGrupoWhatsapp'");
    expect(f).toContain("- 'emailAnfitrion'");
    expect(f).toContain("- 'acomodaciones'");
  });

  it("entero solo al anfitrión; el enlace, al colaborador con permiso de Novedades", () => {
    expect(cuerpoDe("anfitrion_evento")).toMatch(/p_token is distinct from \(select "token" from anfitrion_secreto/);
    const enlace = cuerpoDe("colaborador_enlace_whatsapp");
    expect(enlace).toContain("colaborador_puede_actuar(p_colaborador_id)");
    expect(enlace).toContain("colaborador_tiene_permiso('novedades_editar')");
  });
});

// v63.2: sin cuenta se veían los apellidos de las familias invitadas.
describe("las familias, solo para el equipo", () => {
  it("fotos por familia: anfitrión y colaboradores; orden: solo el anfitrión", () => {
    expect(sql).not.toMatch(/ON public\.(fotos_familiares|orden_familias) FOR SELECT USING \(true\)/);
    expect(sql).toMatch(/ON public\.fotos_familiares FOR SELECT TO authenticated USING \(\(public\.es_anfitrion\(\) OR public\.es_colaborador\(\)\)\)/);
    expect(sql).toMatch(/ON public\.orden_familias FOR SELECT TO authenticated USING \(public\.es_anfitrion\(\)\)/);
  });

  it("es_colaborador mira la cuenta conectada, sin abrir la tabla", () => {
    const f = cuerpoDe("es_colaborador");
    expect(f).toContain("SECURITY DEFINER");
    expect(f).toContain('c."authUserId" = auth.uid()');
  });
});

// v64: en el tablón, cada invitado ve quién le atiende antes del evento.
// v64-64.3: en el tablón, quién ha entrado y quién le atiende.
// comoElTablon (lib/revisionInvitados.js) copia esta regla para avisar de
// los apellidos que no dejarían entrar: si cambia aquí, se cambia allí.
describe("normalizar_nombre_tablon, la regla que copia la Revisión", () => {
  it("sin comas ni espacios de más, sin tildes y en minúscula", () => {
    expect(cuerpoDe("normalizar_nombre_tablon")).toContain(
      "trim(lower(unaccent(regexp_replace(coalesce(p_texto, ''), '[,\\s]+', ' ', 'g'))))"
    );
  });
});

// v70 (él): para entrar al tablón, apellido, nombre Y año de nacimiento. La
// misma clave en la puerta y en todo lo de dentro; sin año en la ficha, no
// hay clave (y la puerta dice por qué).
describe("la clave del tablón, con el año de nacimiento", () => {
  it("la clave exige un año de 4 cifras y lo añade al nombre normalizado", () => {
    const c = cuerpoDe("clave_tablon");
    expect(c).toContain("trim(coalesce(p_anio, '')) ~ '^[0-9]{4}$'");
    expect(c).toContain("normalizar_nombre_tablon(coalesce(p_apellido, '') || ' ' || coalesce(p_nombre, '') || ' ' || trim(p_anio))");
  });
  it("la puerta y lo de dentro comparan con la misma clave; ninguna con el nombre solo", () => {
    for (const f of ["tablon_verificar_respuesta", "tablon_invitado"]) {
      expect(cuerpoDe(f)).toContain('clave_tablon(i."apellido", i."nombre", i."anioNacimiento") = normalizar_nombre_tablon(p_respuesta)');
    }
    expect(cuerpoDe("tablon_verificar_respuesta")).not.toContain(`normalizar_nombre_tablon(i."apellido" || ' ' || i."nombre") = normalizar_nombre_tablon(p_respuesta)`);
  });
  it("la alarma de accesos agrupa por persona, sin el año", () => {
    expect(cuerpoDe("tablon_listar_novedades")).toContain("regexp_replace(normalizar_nombre_tablon(p_respuesta), ' [0-9]{4}$', '')");
  });
});

describe("el tablón: quién ha entrado y su colaborador", () => {
  const f = cuerpoDe("tablon_quien_soy");
  // La pieza común (v67): la usan también las funciones de las fotos.
  const yo = cuerpoDe("tablon_invitado");
  it("con la llave y el mismo nombre que el acceso, y solo si es una persona", () => {
    expect(yo).toContain('p_token = (select "token" from tablon_secreto');
    expect(yo).toContain('i."confirmado" = true');
    expect(yo).toContain('i."excluidoTablon" = false');
    expect(yo).toContain("normalizar_nombre_tablon(p_respuesta)");
    // v70: con el año, la misma clave en la puerta y dentro.
    expect(yo).toContain('clave_tablon(i."apellido", i."nombre", i."anioNacimiento") = normalizar_nombre_tablon(p_respuesta)');
    expect(yo).toContain("(select count(*) from candidatos) = 1");
    expect(f).toContain("from tablon_invitado(p_token, p_respuesta) y");
  });
  it("su nombre como en la lista, su colaborador aunque sea él mismo, y si es colaborador", () => {
    expect(f).toContain(`'nombre', y."apellido" || ', ' || y."nombre"`);
    expect(f).toContain(`'colaborador', c."nombre"`);
    expect(f).toContain("'colaboradorEsYo'");
    expect(f).toContain("'esColaborador'");
    expect(f).not.toContain('is distinct from y."id"');
  });
  // v69.4: la guía de las tres rondas. Solo sí o no, y «datos completos»
  // con la MISMA regla que la app: si una cambia, esta prueba lo dice.
  it("para la guía de las rondas: datos completos, pagado y dentro, solo sí o no", () => {
    expect(f).toContain(`'datosCompletos', coalesce(y."anioNacimiento", '') <> '' and coalesce(y."alergias", '') <> ''`);
    expect(f).toContain(`'pagado', y."pagado"`);
    expect(f).toContain(`'presente', y."presente"`);
    expect(f).not.toMatch(/'\w+',\s*y\."(anioNacimiento|alergias|mesa)"\s*[,)]/);
    const app = readFileSync("src/lib/invitados.js", "utf8");
    expect(app).toContain("return Boolean(g.anioNacimiento) && Boolean(g.alergias);");
  });
});

// v67-68: las fotos de la fiesta. Solo las sube quien entra al tablón con
// su nombre, con la recogida abierta, de 16 años o más y 2 por persona;
// solo las quita el móvil que las subió; nadie las ve salvo el anfitrión;
// el almacén rechaza lo que pase de 1,5 MB.
describe("las fotos de la fiesta", () => {
  it("reservar: invitado reconocido, recogida abierta, 16 o más y menos de 2 por persona, sin carreras", () => {
    const f = cuerpoDe("tablon_reservar_foto");
    expect(f).toContain("from tablon_invitado(p_token, p_respuesta)");
    expect(f).toContain('"fotosFiestaAbierta"');
    expect(f).toContain("edad_en_evento(v_yo.\"anioNacimiento\") < 16");
    expect(f).toContain("hashtext('fotos_fiesta:' || v_yo.id)");
    expect(f).toMatch(/f\."invitadoId" = v_yo\.id and not f\."quitada"[\s\S]{0,120}\) >= 2 then/);
    expect(f).toContain("interval '15 minutes'");
    expect(f).toContain("p_dispositivo);");
  });

  it("confirmar, solo su autor; quitar, además, solo desde el móvil que la subió", () => {
    expect(cuerpoDe("tablon_confirmar_foto")).toContain('f."invitadoId" = v_yo.id');
    const quitar = cuerpoDe("tablon_quitar_foto");
    expect(quitar).toContain('f."invitadoId" = v_yo.id');
    expect(quitar).toContain('f."dispositivoId" = p_dispositivo');
  });

  it("los nuevos parámetros llevan DEFAULT: un tablón abierto con la app de antes no se cae", () => {
    for (const firma of [
      "tablon_fotos(p_token uuid, p_respuesta text, p_dispositivo text DEFAULT NULL)",
      "tablon_reservar_foto(p_token uuid, p_respuesta text, p_dispositivo text DEFAULT NULL)",
      "tablon_quitar_foto(p_token uuid, p_respuesta text, p_id uuid, p_dispositivo text DEFAULT NULL)",
    ])
      expect(sql).toContain(`CREATE FUNCTION public.${firma}`);
  });

  it("el cajón: cerrado, 1,5 MB, y solo sube quien reservó; ve y borra el anfitrión", () => {
    expect(sql).toContain("values ('fotos-fiesta', 'fotos-fiesta', false, 1572864, array['image/jpeg'])");
    expect(sql).toMatch(/fotos_fiesta_sube[\s\S]{0,140}foto_fiesta_reservada\(name\)/);
    expect(sql).toMatch(/fotos_fiesta_ver[\s\S]{0,160}public\.es_anfitrion\(\)/);
  });

  it("subir pide antes confirmar el móvil: año y mesa contra su ficha, con tope de 5 fallos", () => {
    expect(cuerpoDe("tablon_reservar_foto")).toContain("if not foto_fiesta_movil_verificado(v_yo.id, p_dispositivo) then");
    const v = cuerpoDe("tablon_verificar_foto");
    expect(v).toContain("from tablon_invitado(p_token, p_respuesta)");
    // Los DOS, siempre (él, v68.3): sin alguno en la ficha no se confirma.
    expect(v).toContain('if not ficha_con_claves(v_yo."anioNacimiento", v_yo."mesa") then');
    expect(v).toContain('v_acierto := trim(v_yo."anioNacimiento") = trim(coalesce(p_anio, \'\')) and v_yo."mesa" = p_mesa;');
    expect(v).not.toMatch(/"mesa" is null or/);
    expect(v).toMatch(/not i\."acierto"[\s\S]{0,90}interval '15 minutes'\) >= 5 then/);
    expect(v).toContain("insert into fotos_fiesta_intentos");
    expect(sql).toContain("alter table public.fotos_fiesta_intentos enable row level security;");
  });

  it("para elegir sin teclado, el tablón recibe el rango de años de la lista y las mesas, nunca la ficha", () => {
    const f = cuerpoDe("tablon_fotos");
    expect(f).toContain("'anios', (");
    expect(f).toContain("min(trim(i.\"anioNacimiento\")::int)");
    expect(f).toContain("'mesas', coalesce((select jsonb_agg(m.\"numero\" order by m.\"numero\") from mesas m)");
    // Solo si la ficha TIENE las claves (sí/no), nunca cuáles son.
    expect(f).not.toMatch(/'\w+',\s*v_yo\."(mesa|anioNacimiento)"/);
  });

  it("la ficha entera del invitado no sale nunca por fuera", () => {
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.tablon_invitado(uuid, text) FROM PUBLIC, anon, authenticated;");
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
    const dentro = ["historial_texto", "tablon_accesos", "fotos_fiesta", "fotos_fiesta_intentos", "anfitriones", "anfitrion_secreto", "config_secretos", "tablon_secreto"]
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

describe("el que no paga con su familia (v61)", () => {
  const cuerpo = cuerpoDe("colaborador_responder_impago");

  it("solo ese colaborador, y solo alguien confirmado y sin pagar de SU familia", () => {
    expect(cuerpo).toContain("colaborador_puede_actuar(p_colaborador_id)");
    expect(cuerpo).toContain('"colaboradorId" = p_colaborador_id');
    expect(cuerpo).toMatch(/"confirmado" = true and coalesce\(i\."pagado", false\) = false/);
    expect(cuerpo).toContain("= v_familia");
  });

  it("«Sí»: una semana, y como mucho 3 plazos", () => {
    expect(cuerpo).toContain("current_date + 7");
    expect(cuerpo).toMatch(/coalesce\(i\."plazosPago", 0\) < 3/);
  });

  it("«No»: deja de estar confirmado y libera su mesa", () => {
    expect(cuerpo).toMatch(/"noAsiste" = true, "confirmado" = false, "mesa" = null/);
  });

  it("no le avisa al colaborador de su propio cambio", () => {
    expect(cuerpo).toContain("set_config('eventos.recalculo_aviso_activo', 'off', true)");
  });

  it("pagar borra el plazo y volver a confirmar quita «No asiste», lo guarde quien lo guarde", () => {
    const disparador = cuerpoDe("trg_pago_y_asistencia");
    expect(disparador).toMatch(/if new\."pagado" then[\s\S]*"pagoPendienteHasta" := null/);
    expect(disparador).toMatch(/if new\."confirmado" then\s+new\."noAsiste" := false/);
    expect(sql).toMatch(/CREATE TRIGGER invitados_pago_y_asistencia BEFORE INSERT OR UPDATE ON public\.invitados/);
  });

  it("el anfitrión guarda las columnas nuevas", () => {
    const guardar = cuerpoDe("anfitrion_guardar_invitados");
    for (const c of ['"noAsiste"', '"pagoPendienteHasta"', '"plazosPago"']) expect(guardar).toContain(c);
  });
});

describe("marcar a toda la familia: o todos o ninguno (norma 11)", () => {
  // Desde v60 marca la pieza común, colaborador_marcar_miembros (toda la
  // familia, o los elegidos): las comprobaciones viven ahí.
  const cuerpo = cuerpoDe("colaborador_marcar_miembros");

  it("marcar a toda la familia pasa por la misma pieza que marcar a los elegidos", () => {
    expect(cuerpoDe("colaborador_marcar_familia")).toMatch(/colaborador_marcar_miembros\(/);
  });

  it("solo los de esa familia: un id de fuera se ignora", () => {
    expect(cuerpo).toMatch(/i\."id" = any\(coalesce\(p_ids, '\{\}'\)\)/);
  });

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
  it("la última entrada es el último USO (la sesión renovada), no la última contraseña", () => {
    const f = cuerpoDe("anfitrion_estado_cuentas");
    expect(f).toMatch(/auth\.sessions/);
    expect(f).toMatch(/max\(s\.refreshed_at\)/);
    expect(f).toMatch(/auth\.refresh_tokens/);
  });

  it("al entrar, el anfitrión que también es colaborador queda unido a su ficha", () => {
    const f = cuerpoDe("mi_rol");
    expect(f.indexOf("update colaboradores c")).toBeGreaterThan(-1);
    expect(f.indexOf("update colaboradores c")).toBeLessThan(f.indexOf("from anfitriones a"));
  });
});

// v72.7 (él: «no me deja corregir»): el nombre del colaborador era una copia
// de su ficha hecha al nombrarle, y al corregir la ficha la copia se
// quedaba con la errata. Ahora lo mantiene la base, desde los dos lados.
describe("el nombre del colaborador sale de su ficha de invitado", () => {
  it("al guardar un colaborador enganchado, su nombre se toma de la ficha", () => {
    expect(sql).toMatch(/CREATE TRIGGER colaboradores_nombre_de_su_ficha BEFORE INSERT OR UPDATE ON public\.colaboradores/);
    expect(cuerpoDe("trg_nombre_colaborador_de_su_ficha")).toMatch(/new\."nombre" := v_nombre/);
  });

  it("al corregir el nombre o el apellido de la ficha, se corrige el del colaborador", () => {
    expect(sql).toMatch(/CREATE TRIGGER invitados_nombre_colaborador AFTER INSERT OR UPDATE OF nombre, apellido ON public\.invitados/);
    expect(cuerpoDe("trg_nombre_colaborador_al_cambiar_ficha")).toMatch(/update colaboradores[\s\S]*where "invitadoId" = new\."id"/);
  });

  it("con el mismo formato que nombreCompleto: «Apellido, Nombre»", () => {
    expect(cuerpoDe("trg_nombre_colaborador_de_su_ficha")).toContain(`trim(coalesce(i."apellido", '')) || ', ' || trim(coalesce(i."nombre", ''))`);
  });
});

// v73.5 (él): «antes de avisar a los nuevos, comprobar que no lo son; si no,
// enviaremos varios emails y dejarán de prestarles atención».
describe("el aviso al colaborador: solo los nuevos de verdad", () => {
  it("«nuevo» es confirmado y aún sin avisarle a ÉL; cambiar la ficha ya no lo vuelve nuevo", () => {
    const f = cuerpoDe("trg_recalcular_aviso_pendiente");
    expect(f).toMatch(/new\."colaboradorId" is distinct from new\."avisadoA"/);
    expect(f).not.toMatch(/new\."mesa" is distinct from old\."mesa"/);
  });

  it("al avisar, se apunta a quién; y los que ya tenía sin datos van aparte, diciendo que no son nuevos", () => {
    const f = cuerpoDe("anfitrion_avisar_colaborador");
    expect(f).toMatch(/update invitados set "avisadoA" = "colaboradorId"/);
    expect(f).toContain("(no son nuevos)");
    expect(f).toMatch(/if nuevos is null and sin_datos is null then\s+return;/);
  });

  it("los reinicios los vuelven nuevos, para repetir una prueba sin reasignar", () => {
    expect(cuerpoDe("anfitrion_resetear_avisos")).toMatch(/"avisadoA" = null/);
    expect(cuerpoDe("anfitrion_resetear_por_invitados").match(/"avisadoA" = null/g)).toHaveLength(3);
  });
});

// v75.2 (él): el circulito del tablón en la Lista.
describe("quién ha entrado al tablón", () => {
  it("solo con la llave del anfitrión, y solo desde que la puerta pide el año", () => {
    const f = cuerpoDe("anfitrion_entradas_tablon");
    expect(f).toContain(`p_token = (select "token" from anfitrion_secreto limit 1)`);
    expect(f).toContain(`where "nombre" = 'v70-tablon-anio'`);
    // Reconoce a cada uno como la puerta: apellido y nombre, sin el año.
    expect(f).toContain("normalizar_nombre_tablon(");
    expect(f).not.toContain("anioNacimiento");
  });
});
