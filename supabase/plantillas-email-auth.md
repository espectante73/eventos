# Correos de ACCESO (Supabase Auth), en español

Estos son los correos que manda **Supabase Auth**, no la app: crear
cuenta, recuperar contraseña y cambiar de email. Venían en inglés de
fábrica ("Reset your password") aunque el resto de la app esté en
español.

⚠️ **No viven en el repositorio**: se pegan a mano en el panel de
Supabase, en *Authentication → Emails → Templates*
(`/dashboard/project/<ref>/auth/templates`). Este archivo es la copia de
lo que hay puesto, igual que `schema.sql` lo es de la base: si algún día
se pierde el panel, el texto está aquí.

Los correos que manda la propia app a los colaboradores (avisos,
invitaciones) son otra cosa: esos salen de `enviar_email` con Resend y su
texto se edita dentro de la app, en "Texto emails".

**Solo hacen falta tres.** La app usa `signUp`, `resetPasswordForEmail` y
`updateUser({ email })`; Magic Link, Invite y Reauthentication no se
usan, así que sus plantillas dan igual.

`{{ .ConfirmationURL }}` es el enlace que genera Supabase. Va tal cual,
con las llaves dobles y los espacios de dentro.

Remitente de estos correos: `acceso@mail.nexuspoint.rsvp` (campo "Sender
email" de Authentication → Emails → SMTP).

✅ **Pegadas y probadas en vivo el 2026-09-20**: el correo de recuperar
contraseña llega en español y con el estilo de la app.

---

## 1. Confirm signup

**Subject:** `Confirma tu cuenta`

```html
<div style="font-family: Georgia, 'Times New Roman', serif; background:#EFE9DE; padding:24px; color:#2B2620;">
  <div style="max-width:480px; margin:0 auto; background:#ffffff; border:1px solid #C9BFA9; border-radius:6px; padding:24px;">
    <h2 style="color:#1F3A2E; margin:0 0 16px; font-size:20px;">Confirma tu cuenta</h2>
    <p style="margin:0 0 12px; font-size:15px; line-height:1.5;">Hola:</p>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.5;">Ya casi está. Pulsa el botón para confirmar tu dirección de correo y poder entrar en la aplicación del evento.</p>
    <p style="margin:0 0 20px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#1F3A2E; color:#D9B778; text-decoration:none; padding:12px 20px; border-radius:4px; font-family: Arial, sans-serif; font-size:15px;">Confirmar mi cuenta</a>
    </p>
    <p style="margin:0 0 8px; font-size:13px;">Si el botón no funciona, copia esta dirección y pégala en tu navegador:</p>
    <p style="margin:0 0 20px; font-size:12px; word-break:break-all; color:#8C2F39;">{{ .ConfirmationURL }}</p>
    <p style="margin:0; font-size:13px;">Si no has sido tú, puedes ignorar este correo.</p>
  </div>
</div>
```

---

## 2. Reset Password

**Subject:** `Restablecer tu contraseña`

```html
<div style="font-family: Georgia, 'Times New Roman', serif; background:#EFE9DE; padding:24px; color:#2B2620;">
  <div style="max-width:480px; margin:0 auto; background:#ffffff; border:1px solid #C9BFA9; border-radius:6px; padding:24px;">
    <h2 style="color:#1F3A2E; margin:0 0 16px; font-size:20px;">Restablecer tu contraseña</h2>
    <p style="margin:0 0 12px; font-size:15px; line-height:1.5;">Hola:</p>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.5;">Has pedido cambiar la contraseña con la que entras en la aplicación del evento. Pulsa el botón y elige una nueva.</p>
    <p style="margin:0 0 20px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#1F3A2E; color:#D9B778; text-decoration:none; padding:12px 20px; border-radius:4px; font-family: Arial, sans-serif; font-size:15px;">Elegir una contraseña nueva</a>
    </p>
    <p style="margin:0 0 8px; font-size:13px;">Si el botón no funciona, copia esta dirección y pégala en tu navegador:</p>
    <p style="margin:0 0 20px; font-size:12px; word-break:break-all; color:#8C2F39;">{{ .ConfirmationURL }}</p>
    <p style="margin:0; font-size:13px;">Si no lo has pedido tú, ignora este correo: tu contraseña no cambiará.</p>
  </div>
</div>
```

---

## 3. Change Email Address

**Subject:** `Confirma tu nuevo correo`

```html
<div style="font-family: Georgia, 'Times New Roman', serif; background:#EFE9DE; padding:24px; color:#2B2620;">
  <div style="max-width:480px; margin:0 auto; background:#ffffff; border:1px solid #C9BFA9; border-radius:6px; padding:24px;">
    <h2 style="color:#1F3A2E; margin:0 0 16px; font-size:20px;">Confirma tu nuevo correo</h2>
    <p style="margin:0 0 12px; font-size:15px; line-height:1.5;">Hola:</p>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.5;">Has pedido cambiar tu dirección de <b>{{ .Email }}</b> a <b>{{ .NewEmail }}</b>. Pulsa el botón para confirmarlo.</p>
    <p style="margin:0 0 20px;">
      <a href="{{ .ConfirmationURL }}" style="display:inline-block; background:#1F3A2E; color:#D9B778; text-decoration:none; padding:12px 20px; border-radius:4px; font-family: Arial, sans-serif; font-size:15px;">Confirmar el cambio</a>
    </p>
    <p style="margin:0 0 8px; font-size:13px;">Si el botón no funciona, copia esta dirección y pégala en tu navegador:</p>
    <p style="margin:0 0 20px; font-size:12px; word-break:break-all; color:#8C2F39;">{{ .ConfirmationURL }}</p>
    <p style="margin:0; font-size:13px;">Si no has sido tú, ignora este correo: no se cambiará nada.</p>
  </div>
</div>
```
