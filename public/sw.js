// El programa que recibe los avisos con la app cerrada (él, v79). Solo eso:
// NO guarda copias de la web (no hay "fetch" aquí), así nadie se queda con
// una versión vieja en el móvil.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { texto: evento.data ? evento.data.text() : "" };
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo || "Las Bodas", {
      body: datos.texto || "",
      icon: "/icono-192.png",
      badge: "/icono-192.png",
      data: { url: datos.url || "/" },
      // Los del anfitrión (v79.3) llevan su tipo: el nuevo sustituye al
      // anterior del mismo tipo y vuelve a sonar.
      ...(datos.etiqueta ? { tag: datos.etiqueta, renotify: true } : {}),
    })
  );
});

// Al tocarlo: la app, si ya estaba abierta (solo delante: recargarla
// perdería lo que se estuviera haciendo); si no, se abre.
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data?.url || "/", self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin));
      if (abierta) return abierta.focus();
      return self.clients.openWindow(destino);
    })
  );
});
