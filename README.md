# Eventos — libro de invitados

Aplicación para gestionar invitados, colaboradores, mesas y pagos de un
evento (pensada originalmente para una boda, pero reutilizable para
futuros eventos). Empezó como un boceto ("Artifact") en Claude.ai y ahora
es una web real: **Vite + React**, con **Supabase** (Postgres + Auth)
como base de datos compartida entre el anfitrión y sus colaboradores,
desplegada en **Vercel**, con avisos automáticos por email vía
**Resend**.

> Este README cubre cómo poner en marcha el proyecto y cómo está
> organizado. El **historial de decisiones, bugs ya resueltos y
> gotchas conocidos** vive en [`CLAUDE.md`](./CLAUDE.md) — consúltalo
> antes de tocar nada que suene a "esto ya se intentó una vez".

## El boceto (`app-eventos-v2.jsx`)

Ese archivo suelto en la raíz del repo **no se usa para la web real** — es
una copia autocontenida pensada para pegarse en un Artifact de Claude.ai y
seguir probando ideas de lógica/UX rápidamente, sin montar nada. La web de
verdad vive en `src/`.

## Cómo está organizado `src/`

- `App.jsx` — cascarón: decide qué rol/vista mostrar y reparte lo que de
  verdad comparten dos o más ventanas (asignar colaborador, panel
  flotante activo, filtros, motor de invitaciones).
- `useLedgerData.js` — toda la carga y guardado de datos contra Supabase
  (RPCs), un `persistX`/acción por tabla o gesto.
- `vistas/` — `VistaLogin.jsx`, `VistaAnfitrion.jsx`, `VistaColaborador.jsx`,
  y dentro de `vistas/anfitrion/` cada ventana flotante del anfitrión en
  su propio fichero (Colaboradores, Mesas, Cuentas, Avisos, Invitaciones,
  Configuración, Versiones...).
- `components/` — piezas de presentación reutilizadas por más de una
  vista (`ColaboradorCard`, `MiCuenta`, `VentanaFlotante`/`ModalFlotante`,
  `Portada`, etc.).
- `lib/` — funciones puras (formato, validación, cálculos sobre
  invitados) con sus tests co-localizados (`*.test.js`).
- `theme.js` / `constants.js` — paleta de colores compartida y
  `VERSION_APP`.

## Poner en marcha el proyecto en local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia `.env.example` a `.env` y rellena los dos valores con los de tu
   proyecto de Supabase (Project Settings → API):
   ```bash
   cp .env.example .env
   ```
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Antes de dar por bueno cualquier cambio, esta es la red de seguridad
   real del proyecto:
   ```bash
   npm run lint    # detecta al instante variables no importadas (no-undef)
   npm run build   # detecta imports de módulo equivocado que el lint no ve
   npm test        # funciones puras de lib/ — puede no arrancar en algunos Mac,
                    # ver "Vitest no arranca" en CLAUDE.md; lint+build ya cubren
                    # la mayoría de fallos reales del día a día.
   ```

## Configurar Supabase (una sola vez)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. Abre el editor SQL del proyecto (Database → SQL Editor), **borra
   cualquier contenido que hubiera antes en el editor** y pega/ejecuta
   todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   Es re-ejecutable de forma segura (usa `if not exists`/`create or
   replace` en todo), así que también es el mismo archivo que se vuelve
   a pegar cuando se le añade algo nuevo.
3. Copia la **Project URL** y la clave **`anon` `public`** (Project Settings
   → API) a tu `.env` local. **Nunca** uses ni compartas la clave
   `service_role` — esa da acceso total sin restricciones.
4. En **Authentication → URL Configuration**, pon la "Site URL" real de
   tu despliegue (por ejemplo `https://tu-dominio.com`) — los enlaces de
   confirmación/recuperación de email de Supabase apuntan ahí.
5. Guarda la clave de API de **Resend** en la tabla `config_secretos`
   (usada por la función SQL `enviar_email` para mandar los avisos
   automáticos) — ver `supabase/schema.sql` para el nombre exacto de la
   fila esperada.

## Desplegar (Vercel)

1. Conecta este repositorio de GitHub a un proyecto nuevo en
   [vercel.com](https://vercel.com) (detecta Vite automáticamente).
2. En los ajustes del proyecto en Vercel, añade las mismas dos variables de
   entorno que en tu `.env` local (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`).
3. Cada `git push` a `main` despliega una versión nueva automáticamente.

## Cómo funciona el acceso

**Login real** (email + contraseña, Supabase Auth) para el anfitrión y
para cada colaborador:

- Cada colaborador crea su propia cuenta desde **"Crear cuenta"** en la
  pantalla de login, usando el mismo email con el que ya está dado de
  alta (el de los avisos) — un trigger en la base de datos
  (`vincular_cuenta_nueva`) la enlaza sola comparando ese email; si no
  coincide con nadie conocido, la cuenta se crea igual pero sin ningún
  acceso.
- Una vez dentro, el botón **"Mi cuenta"** (junto a "Cerrar sesión")
  deja a cualquiera cambiar su propia contraseña o su email de acceso
  sin tener que cerrar sesión. Si quien cambia el email es un
  colaborador, ese mismo email pasa a ser también el suyo de avisos
  automáticos (con aviso visible para el anfitrión en la ventana
  Colaboradores hasta que lo confirma).
- El aislamiento entre colaboradores se hace cumplir **en el propio
  servidor** (las RPC `colaborador_*` filtran siempre por
  `"authUserId" = auth.uid()`), no solo ocultando cosas en pantalla.

El enlace-token antiguo (`?rol=<secreto>`) sigue existiendo **solo como
plan B para el anfitrión** — para colaboradores ya no funciona (retirado
tras confirmarse en pruebas en vivo que seguía dando acceso sin sesión
real). Guarda ese enlace en un sitio privado: quien lo tenga, tiene
acceso total a los datos del evento.

## Avisos automáticos por email

Ya en producción, probado en vivo. Vía **Resend**, disparado desde la
propia base de datos (función SQL `enviar_email`, llamada
`fire-and-forget` con `pg_net` — nunca espera de forma bloqueante la
respuesta HTTP, ver el porqué en `CLAUDE.md`):

- Anfitrión asigna un invitado a un colaborador → email a ese colaborador
  (solo cuando el propio anfitrión lo dispara desde "Avisar ahora", no
  automático al asignar, para agrupar varias asignaciones en un solo
  correo).
- Un colaborador completa los datos de todos sus confirmados, o marca
  todos sus pagos → email automático al anfitrión.
- El anfitrión confirma la recogida de dinero entregado por un
  colaborador → acuse en PDF adjunto, por email, al propio colaborador.

## Backup automático de la base de datos

Backup diario vía GitHub Actions
([`.github/workflows/backup.yml`](./.github/workflows/backup.yml)),
también lanzable a mano desde la pestaña Actions. El volcado se guarda
como *artifact* de la ejecución (90 días), nunca commiteado al
repositorio (los datos de `config_secretos`/`anfitrion_secreto` se
excluyen del volcado a propósito). Requiere el secreto de repositorio
`SUPABASE_DB_URL` (cadena de conexión "Session pooler" de Supabase).

## Estado del proyecto

- ✅ Web funcionando: datos compartidos vía Supabase, aislamiento real
  entre colaboradores a nivel de base de datos, despliegue automático.
- ✅ Login real (email + contraseña) para anfitrión y colaboradores, con
  autorregistro y autogestión de cuenta ("Mi cuenta").
- ✅ Avisos automáticos por email (Resend) en producción y probados en
  vivo.
- ✅ Backup diario automático de la base de datos.
- ⏳ Pendiente, sin urgencia (ver historial de sesiones en `CLAUDE.md`):
  onboarding del resto de colaboradores a login real, decidir si retirar
  también el enlace-token del anfitrión, revisar el endurecimiento del
  login (fuerza bruta / 2FA), y ampliar la batería de tests automáticos
  al propio flujo de login.
