import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseConfigurado = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
  && firebaseConfig.messagingSenderId && firebaseConfig.appId
);

export const firebaseApp = firebaseConfigurado
  ? (getApps()[0] || initializeApp(firebaseConfig))
  : null;

let messaging = null;
if (firebaseApp && typeof window !== 'undefined') {
  try {
    messaging = getMessaging(firebaseApp);
  } catch (error) {
    console.warn('Firebase Messaging no está disponible en este navegador.', error);
  }
}

export { messaging };

export const requestForToken = async () => {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!messaging || !vapidKey || !(await isSupported())) return null;

  try {
    if (!('Notification' in window)) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return await getToken(messaging, { vapidKey });
  } catch (error) {
    console.warn('No se pudo obtener el token de notificaciones Firebase.', error);
    return null;
  }
};

export const escucharNotificacionesPrimerPlano = (onNotificacionRecibida) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted' && payload.notification) {
      new Notification(payload.notification.title || 'QueueLess', {
        body: payload.notification.body || '',
        icon: '/icons/icon-192.png',
      });
    }
    onNotificacionRecibida?.(payload);
  });
};
