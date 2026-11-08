
import { firebaseApp } from "./firebase";

import {
    getMessaging,
    isSupported,
    register,
    onRegistered,
    onMessage
} from "firebase/messaging";

const API_URL = import.meta.env.VITE_API_URL;

let listenersAttached = false;
let currentVisitorSessionId = null;

export async function activarNotificaciones(visitorSessionId) {

    try {

        // 1. Verificar compatibilidad.
        if (!("Notification" in window)) {
            throw new Error(
                "El navegador no admite notificaciones."
            );
        }

        if (!(await isSupported())) {
            throw new Error(
                "Firebase Messaging no es compatible con este navegador."
            );
        }

        if (!visitorSessionId) {
            throw new Error(
                "No existe una sesión de visitante."
            );
        }

        // 2. Solicitar permiso.
        let permiso = Notification.permission;

        if (permiso === "default") {
            permiso = await Notification.requestPermission();
        }

        if (permiso !== "granted") {
            throw new Error(
                "No se concedieron permisos para mostrar notificaciones."
            );
        }

        currentVisitorSessionId = visitorSessionId;

        // 3. Registrar Service Worker.
        await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
        );

        // 4. Esperar hasta que esté activo.
        const registro = await navigator.serviceWorker.ready;

        if (!registro.active) {
            throw new Error(
                "El Service Worker no se encuentra activo."
            );
        }

        // 5. Inicializar Firebase Messaging.
        const messaging = getMessaging(firebaseApp);

        // 6. Configurar eventos.
        if (!listenersAttached) {

            // Recibir el FID de Firebase.
            onRegistered(messaging, async (fid) => {

                console.log("FID registrado:", fid);

                try {

                    const response = await fetch(
                        `${API_URL}/api/notificaciones/suscripciones/`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                fid: fid,
                                visitor_session_id:
                                    currentVisitorSessionId
                            })
                        }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            result.error || "Error registrando dispositivo."
                        );
                    }

                    console.log(
                        "Dispositivo guardado en QueueLess:",
                        result
                    );

                } catch (error) {

                    console.error(
                        "Error enviando FID a Django:",
                        error
                    );

                }

            });

            // Recibir mensajes cuando la página está abierta.
            onMessage(messaging, async (payload) => {

                console.log(
                    "Notificación FCM recibida:",
                    payload
                );

                const data = payload.data || {};

                // Mostrar notificación también en primer plano.
                const activeRegistration =
                    await navigator.serviceWorker.ready;

                await activeRegistration.showNotification(
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

            listenersAttached = true;
        }

        // 7. Registrar la instalación en Firebase.
        await register(messaging, {

            vapidKey:
                import.meta.env.VITE_FIREBASE_VAPID_KEY,

            serviceWorkerRegistration: registro

        });

        // 8. Mostrar notificación de confirmación local.
        await registro.showNotification(
            "QueueLess",
            {
                body: "¡Las notificaciones se han activado correctamente!",
                icon: "/icons/icon-192.png",
                badge: "/icons/icon-192.png",
                tag: "queueless-activacion",
                data: {
                    url: "/"
                }
            }
        );

        return {
            success: true,
            message: "Notificaciones activadas correctamente."
        };

    } catch (error) {

        console.error(
            "Error activando notificaciones:",
            error
        );

        return {
            success: false,
            message: error.message
        };

    }
}
