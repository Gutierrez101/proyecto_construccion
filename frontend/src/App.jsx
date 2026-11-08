
import { useState } from "react";

import {
    activarNotificaciones
} from "./services/pushNotifications";

function App() {

    const [mensaje, setMensaje] = useState("");

    const activar = async () => {

        const sessionId =
            import.meta.env.VITE_TEST_VISITOR_SESSION_ID;

        const resultado = await activarNotificaciones(
            sessionId
        );

        setMensaje(resultado.message);

    };

    return (
        <main style={{
            padding: "40px",
            fontFamily: "Arial",
            textAlign: "center"
        }}>

            <h1>QueueLess</h1>

            <h2>Notificaciones móviles</h2>

            <p>
                Activa las notificaciones para recibir
                actualizaciones de tu turno.
            </p>

            <button onClick={activar}>
                Activar notificaciones
            </button>

            <p>{mensaje}</p>

        </main>
    );
}

export default App;
