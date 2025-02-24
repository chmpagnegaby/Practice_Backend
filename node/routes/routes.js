import express from 'express';

const router = express.Router();
import { asignarTurnosPrepararBaraja, finPartida,empezarOtraRonda, hacerAccionFront, hacerAccionFrontUltima, iniciar, levantarPrincipioFront, recuentoPuntos} from '../main.js';
import { selectPrincipioTurn } from '../librerias/partida.js';
import { datosPartida,pasarJson } from '../main.js';

let ultimaRonda = false;
//let finPartida = false;


// Definir las rutas de tu juego
router.post('/empezar', async (req, res) => {
    const jugadores = req.body;  // Recibe el JSON con los jugadores
    // Aquí puedes agregar la lógica para iniciar la partida
  
    await iniciar(jugadores);
    let dataTurno = await pasarJson()
    // Ejemplo de respuesta
    res.status(200).json({
        dataTurno
    });
});

router.get("/infoTurno", async (req, res) =>{
    try {
        
        const data = await selectPrincipioTurn(datosPartida.ronda, datosPartida.idPartida);
        res.json(data);
    } catch (error) {
        console.log("Error al pasar la info de turno al front: "+error)
    }
});


router.post('/obtenerPosicion',async (req, res) => {
    const datos = req.body; 
    //console.log("Datos recibidos en la ruta:", req.body);
    let {idCarta, accionSeleccionada, pilaSeleccionada} = datos;
    // console.log("idcarta ",idCarta)
    // console.log("accion ",accionSeleccionada)
    // console.log("pila ",pilaSeleccionada)
    ultimaRonda = await hacerAccionFront(idCarta, accionSeleccionada, pilaSeleccionada);
    let dataTurno = await pasarJson();
    res.status(200).json({
            mensaje: 'Enviando datos',
            dataTurno,
            ultimaRonda
        });
   
    
});

router.post('/levantarDos', async (req, res) => {
    const datos = req.body;  // Recibe el JSON con los jugadores
    // Aquí puedes agregar la lógica para iniciar la partida
    const {idCarta, pasar} = datos;
    await levantarPrincipioFront(idCarta, pasar);
    let dataTurno = await pasarJson()
    
    res.status(200).json({
        dataTurno
    });
});

router.get('/nuevosTurnos', async (req, res) => {
    try {
        //nuevo orden despues de levantar 2 cartas y las envia al front
        await asignarTurnosPrepararBaraja(datosPartida);
        let dataTurno = await pasarJson();
        res.status(200).json({
            dataTurno
        });

    } catch (error) {
        console.log("Error al enviar la nueva info de orden: "+error);
    }
   
});

router.post('/ultimaRonda', async (req, res) => {
    try {
        
        const datos = req.body; 
        //console.log("Datos recibidos en la ruta:", req.body);
        let {idCarta, accionSeleccionada, pilaSeleccionada} = datos;
        await hacerAccionFrontUltima(idCarta, accionSeleccionada, pilaSeleccionada);
        let dataTurno = await pasarJson();
        res.status(200).json({
                mensaje: 'Enviando datos',
                dataTurno,
            });
   
    } catch (error) {
        console.log("Error al enviar la nueva info de orden: "+error);
    }
   
});

router.get('/nuevasRonda', async (req, res) => {
    try {
        const [finDePartida,datos] = await recuentoPuntos(datosPartida);

        if (!finDePartida) {

            await empezarOtraRonda(datosPartida);
        }else{
            await finPartida(datosPartida, datos)
        }
        
        let dataTurno = await pasarJson();

        res.status(200).json({
            dataTurno,
            finDePartida
        });

    } catch (error) {
        console.log("Error al enviar la nueva info de orden: "+error);
    }
   
});

router.get("/ranking", async (req, res) => {
    try {
        let [volver,datos] = await  recuentoPuntos(datosPartida);
        const rankingOrdenado = datos.sort((a, b) => a.total - b.total);
        res.status(200).json(rankingOrdenado);
    } catch (error) {
        console.log("Error en el ranking: ",error);
    }
 
});

import Jugador from '../modelo/jugadoresORM.js';

async function contarJugadores() {
  try {
    const totalJugadores = await Jugador.count(); // Cuenta el número total de jugadores
    console.log("Número total de jugadores registrados:", totalJugadores);
    return totalJugadores; 
  } catch (error) {
    console.error("Error al contar jugadores:", error);
  }
}

// Endpoint para recibir la peticion y contar jugadores
router.post("/recibir-jugadores", async (req, res) => {
  try {
    console.log("HOLA ORM")
    const totalJugadores = await contarJugadores(); 
    res.json({ mensaje: "Número recibido correctamente", totalJugadores });
  } catch (error) {
    res.status(500).json({ error: "Error al contar jugadores" });
  }
});



export default router;

 