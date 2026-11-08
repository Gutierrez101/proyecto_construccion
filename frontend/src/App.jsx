import { useState } from "react";

import {
    activarNotificaciones
} from "./services/pushNotifications";


function App() {

    const [mensaje, setMensaje] = useState("");

    const activar = async () => {

        const visitorSessionId =
            import.meta.env.VITE_TEST_VISITOR_SESSION_ID;

        const resultado = await activarNotificaciones(
            visitorSessionId
        );

        setMensaje(resultado.message);
    };

    return (

        <main style={{ padding: "40px" }}>

            <h1>QueueLess</h1>

            <h2>Activación de notificaciones</h2>

            <button onClick={activar}>
                Activar notificaciones
            </button>

            <p>{mensaje}</p>

        </main>

    );
}

export default App;