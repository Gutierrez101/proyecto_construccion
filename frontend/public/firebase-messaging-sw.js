// Capturar el clic antes de cargar las bibliotecas Firebase.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow(targetUrl);
    })()
  );
});

// Bibliotecas Firebase Compat.
importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js"
);

// Configuración pública de Firebase.
firebase.initializeApp({
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
});

// Inicializar Firebase Messaging.
const messaging = firebase.messaging();

// Recibir mensajes cuando la aplicación está en segundo plano.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};

  return self.registration.showNotification(
    data.title || "QueueLess",
    {
       body: data.body || "Tienes una actualización de tu turno.",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: data.tag || "queueless",
            data: {
                url: data.url || "/"
            }
    }
  );
});