
import { firebaseApp } from "./firebase";

import {
    getMessaging,
    isSupported,
    register,
    onRegistered,
    onMessage
} from "firebase/messaging";

const API_URL = import.meta.env.VITE_API_URL;

// Sesión activa del ciudadano.
let currentVisitorSessionId = null;

// Evitar registrar listeners repetidos.
let listenersAttached = false;


export async function activarNotificaciones(visitorSessionId) {

    try {

        if (!visitorSessionId) {
            throw new Error("No existe una sesión de visitante.");
        }

        // 1. Comprobar compatibilidad.
        if (!("Notification" in window)) {
            throw new Error("El navegador no admite notificaciones.");
        }

        if (!(await isSupported())) {
            throw new Error("Firebase Messaging no es compatible.");
        }

        // 2. Solicitar permiso.
        let permiso = Notification.permission;

        if (permiso === "default") {
            permiso = await Notification.requestPermission();
        }

        if (permiso !== "granted") {
            throw new Error("No se autorizó el envío de notificaciones.");
        }

        currentVisitorSessionId = visitorSessionId;

        // 3. Registrar Service Worker.
        const swRegistration =
            await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js",
                { scope: "/" }
            );

        // Esperar al Service Worker activo.
        await navigator.serviceWorker.ready;

        // 4. Inicializar Messaging.
        const messaging = getMessaging(firebaseApp);

        // 5. Escuchar el registro del FID.
        if (!listenersAttached) {

            onRegistered(messaging, async (fid) => {

                console.log("FID obtenido:", fid);

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
                            result.error || "Error registrando FID."
                        );
                    }

                    console.log(
                        "Suscripción guardada:",
                        result
                    );

                    window.dispatchEvent(
                        new CustomEvent("queueless:push-registered")
                    );

                } catch (error) {

                    console.error(
                        "Error enviando FID a Django:",
                        error
                    );
                }

            });

            // Mensajes cuando QueueLess está abierta.
            onMessage(messaging, (payload) => {

                console.log(
                    "Mensaje recibido en primer plano:",
                    payload
                );

                window.dispatchEvent(
                    new CustomEvent("queueless:push-message", {
                        detail: payload
                    })
                );

            });

            listenersAttached = true;
        }

        // 6. Registrar instalación en Firebase.
        await register(messaging, {

            vapidKey:
                import.meta.env.VITE_FIREBASE_VAPID_KEY,

            serviceWorkerRegistration: swRegistration

        });

        return {
            success: true,
            message: "Registro de notificaciones iniciado."
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
