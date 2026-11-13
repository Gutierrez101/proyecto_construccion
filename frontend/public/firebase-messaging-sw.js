// Bibliotecas Firebase Compat.
importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging-compat.js"
);

// Configuración pública de Firebase.
firebase.initializeApp({
  apiKey: "AIzaSyClmkuF-Tjgpg6ZWhsay20lNl6RwPhq7cI",
  authDomain: "queueless-35b23.firebaseapp.com",
  projectId: "queueless-35b23",
  storageBucket: "queueless-35b23.firebasestorage.app",
  messagingSenderId: "285139383782",
  appId: "1:285139383782:web:fe155e1c93e07b9c829227",
});

// Inicializar Firebase Messaging.
const messaging = firebase.messaging();

// Recibir mensajes cuando la aplicación está en segundo plano.
messaging.onBackgroundMessage(function(payload){
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification?.body || 'Por favor, acércate a la ventanilla.',
    icon: '/icons/icon-512.png',
    icon: '/icons/icon-192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});