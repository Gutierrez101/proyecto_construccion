import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig={
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-L278HZX7BC"
};

// Initialize Firebase
const app=initializeApp(firebaseConfig);
export const messaging=getMessaging(app);

const VAPID_KEY=import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        return currentToken;
      }
    } else {
      console.warn('Permiso de notificaciones denegado por el usuario.');
    }
  } catch (err) {
    console.error('Error obteniendo el token:', err);
  }
};

export const escucharNotificacionesPrimerPlano = () => {
  onMessage(messaging, (payload) => {
    if (Notification.permission === 'granted') {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icons/icon-192.png',
      });
    }
  });
};