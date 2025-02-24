//archivo js para main
import {
    empezarPartida, elegirOrden, revisarEstadoPartida, comienzoTurno, opcionTurno, pasarturno,
    comprobarSiEsUltimaRonda, opcionTurnoDos, contarPuntos, crearOtraRonda,
    comprobarFinPartida,
    alguien100,
    finalPartida,
    selectPrincipioTurn
} from "./librerias/partida.js";

import {
    obtenerCartas, barajarCartas, insertarBaraja, repartirCartas,
    jugadoresLevantanDosCartas, mostrarCartaBarajaVisible, mazoVisibleVacio,
    obtenerCartaPilaBarajadaInvisible, obtenerIdMazo, mostrarComienzo,
    levantarCartas, depositarCartaMazoVisible, cambiarCarta, eliminarPrimeraCarta, comprobarColumnas,
    levantarTodoMazo,
    levantarFront,
    cambiarCartaFront
} from "./librerias/baraja.js";

import express from 'express';   // Importar Express
import cors from 'cors';         // Importar CORS para permitir peticiones desde el frontend
import partidaRoutes from './routes/routes.js';  // Importar las rutas

const app = express();
app.use(express.json());

// Habilitar CORS para permitir solicitudes solo desde el frontend en puerto 3001
app.use(cors({
    origin: 'http://localhost:3000'  // Cambia al puerto donde corre tu frontend React
}));

// Usar las rutas definidas
app.use('/partida', partidaRoutes);  // Aquí se asigna el prefijo '/partida' a las rutas de partida

const port = 5000;  // Puerto donde el servidor va a correr
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});


export let datosPartida = {};
export let contadorUltima = 0;
export async function iniciar(jugadores) {
    try {
        //pide datos de jugador y los sube
        //let json = funcionRouter();
        datosPartida = await empezarPartida(jugadores);
        contadorUltima = datosPartida.numeroJugadores - 1;
        //console.log("ID PARTIDA DESDE MAIN " + datosPartida.idPartida);
        await obtenerBarajarInsertarCartas(datosPartida);
    } catch (error) {
        console.log("Error al iniciar desde el main: " + error)
    }

}

async function obtenerBarajarInsertarCartas(datosPartida) {
    try {
        //obtienes las cartas de la base de datos, las baraja e inserta
        const baraja = await obtenerCartas();
        const barajado = await barajarCartas(baraja);
        const idMazo = await insertarBaraja(datosPartida.idPartida, barajado, datosPartida.ronda);
        datosPartida.idMazo = idMazo;

        await repartirLevantarCartas(datosPartida, baraja);
    } catch (error) {
        console.log("Error al insertar cartas en main: " + error)
    }

}
export async function pasarJson() {
   
    let data = await selectPrincipioTurn(datosPartida.ronda, datosPartida.idPartida)
    return data;
}
async function repartirLevantarCartas(datosPartida, baraja) {
    try {
        //reparte 12 cartas a todos los jugadores
        let info = await repartirCartas(baraja, datosPartida.idPartida, datosPartida.ronda);
        datosPartida["jugadores"] = info;
        await mazoVisibleVacio(datosPartida.idPartida, datosPartida.ronda);
    } catch (error) {
        console.log("Error al repartir cartas en main: " + error);
    }
    //Funcion que levanta dos cartas por jugador
    try {
        //await jugadoresLevantanDosCartas(datosPartida.jugadores)
        //await asignarTurnosPrepararBaraja(datosPartida)
    } catch (error) {
        console.log("Error al levantar cartas en main: " + error);
    }

}

export async function asignarTurnosPrepararBaraja(datosPartida) {
    try {
        //mira cual es el orden de los jugadores ordenandolos primero
        await elegirOrden(datosPartida.jugadores, datosPartida.idPartida, datosPartida.ronda)
       
    } catch (error) {
        console.log("Error al asignar turnos o preparar baraja en main: " + error)
    }
}

async function bucleJuego(datosPartida) {

    try {
        console.log("_________________________________________________________________")
        console.log("------- RONDA " + datosPartida.ronda + " ----------------------------")
        console.log("_________________________________________________________________")
        //Inicializa el estado de la partida
        let estadoPartida = await revisarEstadoPartida(datosPartida.idPartida);

        while (estadoPartida != 7) {
            //Si mazo vacio no tiene cartas pone la primera del invisible
            await mazoVisibleVacio(datosPartida.idPartida, datosPartida.ronda);
            //obtiene el id del jugador que sea su turno
            let jugadorId = await comienzoTurno(datosPartida.idPartida, datosPartida.ronda);
            //muestra la primera carta del mazo visible
            let cartaVisible = await mostrarCartaBarajaVisible(datosPartida.idPartida, datosPartida.ronda);
            //obtiene el id del mazo del jugador actual
            let idMazo = await obtenerIdMazo(jugadorId, datosPartida.idPartida, datosPartida.ronda);
            //muestra el json en formato matriz
            await mostrarComienzo(idMazo)
            //pregunta que accion quieres hacer
            let accion = await opcionTurno();

            if (accion == 1) {
                //elimina la primera carta del mazo visible y la cambia por una
                //poniendo la cambiada en el mazo visible
                await eliminarPrimeraCarta(datosPartida.idPartida, datosPartida.ronda);
                await cambiarCarta(idMazo, cartaVisible, datosPartida.idPartida, datosPartida.ronda)

            }

            if (accion == 2) {
                //muestra la carta invisible y pregunta por la accion
                let cartaInvisible = await obtenerCartaPilaBarajadaInvisible(datosPartida.idPartida, datosPartida.ronda);
                let accionDos = await opcionTurnoDos();

                if (accionDos == 1) {
                    //hace lo mismo que el cambiar 1 pero con la invisible
                    await cambiarCarta(idMazo, cartaInvisible, datosPartida.idPartida, datosPartida.ronda);
                }

                if (accionDos == 2) {
                    //pone la invisible en el visible y levanta una carta de tu matriz
                    await depositarCartaMazoVisible(datosPartida.idPartida, cartaInvisible, datosPartida.ronda)
                    await levantarCartas(idMazo)
                }
            }
            //comprueba hay alguna columna con todos los valores iguales
            await comprobarColumnas(idMazo);
            //pasa el turno
            await pasarturno(datosPartida.idPartida, datosPartida.numeroJugadores, datosPartida.ronda);
            //comprueba si tiene todo el json levantado
            await comprobarSiEsUltimaRonda(idMazo, datosPartida.idPartida);
            //revisa si el estado a cambiado para salir del bucle
            estadoPartida = await revisarEstadoPartida(datosPartida.idPartida);

        }

        rondaFinal(datosPartida)
    } catch (error) {
        console.log("Error en el buncle en main: " + error)
    }

}

async function rondaFinal(datosPartida) {
    try {
        //Igual que el bucle anterior pero esta vez es solo una ronda mas para
        //todos los jugadores menos el que levanto todas las cartas
        for (let x = 0; x < datosPartida.numeroJugadores - 1; x++) {

            await mazoVisibleVacio(datosPartida.idPartida, datosPartida.ronda)
            let jugadorId = await comienzoTurno(datosPartida.idPartida, datosPartida.ronda);
            let cartaVisible = await mostrarCartaBarajaVisible(datosPartida.idPartida, datosPartida.ronda);
            let idMazo = await obtenerIdMazo(jugadorId, datosPartida.idPartida, datosPartida.ronda);
            await mostrarComienzo(idMazo)
            let accion = await opcionTurno();

            if (accion == 1) {
                await eliminarPrimeraCarta(datosPartida.idPartida, datosPartida.ronda);
                await cambiarCarta(idMazo, cartaVisible, datosPartida.idPartida, datosPartida.ronda)

            }

            if (accion == 2) {
                let cartaInvisible = await obtenerCartaPilaBarajadaInvisible(datosPartida.idPartida, datosPartida.ronda);
                let accionDos = await opcionTurnoDos();

                if (accionDos == 1) {
                    await cambiarCarta(idMazo, cartaInvisible, datosPartida.idPartida, datosPartida.ronda);
                }

                if (accionDos == 2) {
                    await depositarCartaMazoVisible(datosPartida.idPartida, cartaInvisible)
                    await levantarCartas(idMazo)
                }
            }
            await comprobarColumnas(idMazo);
            await levantarTodoMazo(idMazo);
            if (x != datosPartida.numeroJugadores - 2) {
                await pasarturno(datosPartida.idPartida, datosPartida.numeroJugadores, datosPartida.ronda);
            }
        }
        await recuentoPuntos(datosPartida);
    } catch (error) {
        console.log("Error en la ronda final: " + error)
    }
}

export async function recuentoPuntos(datosPartida) {
    //funcion que cuenta los puntos de todos los jugadores y se lo pone
    await contarPuntos(datosPartida.idPartida, datosPartida.ronda);

    //la primera funcion obtiene la suma de las puntuacion
    //la segunda es un true o false segun si alguien tiene 100 o mas
    let datos = await comprobarFinPartida(datosPartida.idPartida);
    let volver = await alguien100(datos);
    
    return [volver,datos];
    
}

export async function empezarOtraRonda(datosPartida) {
    try {
        //suma uno a la ronda
        datosPartida.ronda++;
        //crea otra ronda con los mismos jugadores y vuelve al principio
        await crearOtraRonda(datosPartida.idPartida, datosPartida.ronda)
        await obtenerBarajarInsertarCartas(datosPartida);
    } catch (error) {
        console.log("Error al empezar otra ronda desde main: " + error)
    }
}

export async function finPartida(datosPartida, datos) {
    //funcion que muestra el ranking final
    await finalPartida(datos, datosPartida.idPartida)
}

export async function hacerAccionFront(idCarta, accion, pila) {

    let jugadorId = await comienzoTurno(datosPartida.idPartida, datosPartida.ronda);
    let cartaVisible = await mostrarCartaBarajaVisible(datosPartida.idPartida, datosPartida.ronda);
    let idMazo = await obtenerIdMazo(jugadorId, datosPartida.idPartida, datosPartida.ronda);

    if (pila == "visible") {

        if (accion == "Intercambiar") {
            //visible intercambia
            await eliminarPrimeraCarta(datosPartida.idPartida, datosPartida.ronda);
            await cambiarCartaFront(idMazo, cartaVisible, datosPartida.idPartida, datosPartida.ronda, idCarta);
        }

        if (accion == "Levantar") {
            //levanta
            await levantarFront(idCarta, idMazo);
        }

    }

    if (pila == "oculta") {
        let cartaInvisible = await obtenerCartaPilaBarajadaInvisible(datosPartida.idPartida, datosPartida.ronda);
        
        if (accion == "Intercambiar") {
            console.log("intercambia oculta")
            await cambiarCartaFront(idMazo, cartaInvisible, datosPartida.idPartida, datosPartida.ronda, idCarta);
        }
        if (accion == "Levantar") {
            console.log("levanta oculta")
            await depositarCartaMazoVisible(datosPartida.idPartida, cartaInvisible,datosPartida.ronda);
            await levantarFront(idCarta, idMazo);
        }
    }

    await comprobarColumnas(idMazo);
    //pasa el turno
    await pasarturno(datosPartida.idPartida, datosPartida.numeroJugadores, datosPartida.ronda);
    //comprueba si tiene todo el json levantado
    await comprobarSiEsUltimaRonda(idMazo, datosPartida.idPartida);
    //revisa si el estado a cambiado para salir del bucle
    let estadoPartida = await revisarEstadoPartida(datosPartida.idPartida);
    //7 es ultima ronda
    if(estadoPartida == 7) return true;
    return false;
}

export async function hacerAccionFrontUltima(idCarta, accion, pila) {

    let jugadorId = await comienzoTurno(datosPartida.idPartida, datosPartida.ronda);
    let cartaVisible = await mostrarCartaBarajaVisible(datosPartida.idPartida, datosPartida.ronda);
    let idMazo = await obtenerIdMazo(jugadorId, datosPartida.idPartida, datosPartida.ronda);
 
    if (pila == "visible") {

        if (accion == "Intercambiar") {
            //visible intercambia
            await eliminarPrimeraCarta(datosPartida.idPartida, datosPartida.ronda);
            await cambiarCartaFront(idMazo, cartaVisible, datosPartida.idPartida, datosPartida.ronda, idCarta);
        }

        if (accion == "Levantar") {
            //levanta
            await levantarFront(idCarta, idMazo);
        }

    }

    if (pila == "oculta") {
        let cartaInvisible = await obtenerCartaPilaBarajadaInvisible(datosPartida.idPartida, datosPartida.ronda);
        
        if (accion == "Intercambiar") {
            //console.log("intercambia oculta")
            await cambiarCartaFront(idMazo, cartaInvisible, datosPartida.idPartida, datosPartida.ronda, idCarta);
        }
        if (accion == "Levantar") {
            //console.log("levanta oculta")
            await depositarCartaMazoVisible(datosPartida.idPartida, cartaInvisible,datosPartida.ronda);
            await levantarFront(idCarta, idMazo);
        }
    }

    await comprobarColumnas(idMazo);
    //pasa el turno
    await levantarTodoMazo(idMazo);
    
    await pasarturno(datosPartida.idPartida, datosPartida.numeroJugadores, datosPartida.ronda);
    
}

export async function levantarPrincipioFront(idCarta, pasar) {
    try {

        let jugadorId = await comienzoTurno(datosPartida.idPartida, datosPartida.ronda);
        let idMazo = await obtenerIdMazo(jugadorId, datosPartida.idPartida, datosPartida.ronda);

        await levantarFront(idCarta, idMazo);

        if(pasar) await pasarturno(datosPartida.idPartida, datosPartida.numeroJugadores, datosPartida.ronda);

    } catch (error) {
        console.log("Error al levantar al principio: "+error);
    }
    

}