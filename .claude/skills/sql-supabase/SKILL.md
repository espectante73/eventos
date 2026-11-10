---
name: sql-supabase
description: Reglas para darle SQL al usuario y cambiar la base de datos de Supabase (tablas, funciones, políticas, schema.sql, migraciones_aplicadas). Úsala SIEMPRE antes de escribir SQL, tocar supabase/schema.sql o comprobar si un cambio de la base ya está subido.
---

# El SQL que se le pasa

Es el apartado 1.6 del CLAUDE.md, sacado aquí para que solo se lea cuando hace falta. Las reglas conservan su número: se siguen citando como «1.6, regla 3».

1. **Yo no ejecuto SQL: se le da como texto, para una pestaña NUEVA** del
   editor de Supabase. Una reutilizada puede llevar debajo un `create or
   replace` viejo que se vuelve a ejecutar.
2. **Cada bloque termina apuntándose** en `migraciones_aplicadas`:
   `schema.sql` dice cómo debería ser la base, no qué ha ejecutado él.

```sql
insert into public.migraciones_aplicadas ("nombre") values ('v40-lo-que-sea')
  on conflict ("nombre") do nothing;
```

3. **Cambiar los parámetros de una función que ya existe**: antes del
   `create or replace`, `drop function if exists nombre(tipos, viejos)`
   con la firma anterior exacta. **Si cambia lo que devuelve**, primero
   se despliega el cliente que entiende las dos formas y luego el SQL: una
   pantalla abierta con el viejo se cae (pasó con `tablon_quien_soy`).
4. **Una función nueva que dependa de `auth.uid()` lleva `revoke execute
   ... from public`**: Postgres da permiso de ejecución a todos por
   defecto. Va en el SQL que se le pasa y, junto a la función, en
   `schema.sql`. (`mi_rol` responde sin sesión, aunque vacío.)
5. **Todo UPDATE/DELETE lleva WHERE** (para la tabla entera, `where
   true`): Supabase rechaza los que no. Y `schema.sql` es un plano: cada
   cambio en su sitio, nada añadido al final. Lo vigila
   `supabase/schema.test.js`.
6. **Comprobar desde fuera si está subido, con la clave pública**:
   - `PGRST202` → **no está subido**. `42501` → **está subido**, y el
     `revoke` funciona.
   - Una columna: `/rest/v1/<tabla>?select=<columna>&limit=1`. `42703` es
     que no existe; `42501`, que la tabla no deja leer a `anon`.
   - Lo aplicado: `GET /rest/v1/migraciones_aplicadas?select=nombre,aplicadaEn&order=aplicadaEn.desc`.
   - El editor ejecuta el bloque entero en una transacción: si dejó huella
     la ÚLTIMA sentencia, entró todo.

```bash
set -a; . ./.env; set +a          # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
curl -s -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/<funcion>" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{}'
```

7. **Antes de desplegar el cliente que usa una función nueva, llamarla así
   con un token falso.** Sin Postgres local, es la única red.
8. **"function is not unique": mirar las firmas que hay de verdad en la
   base**, no en el código.

```sql
select p.oid::regprocedure as firma
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'nombre_funcion' and n.nspname = 'public';
```
