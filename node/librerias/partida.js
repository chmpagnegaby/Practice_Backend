//archivo js para partida
import promptSync from "prompt-sync";  // Importa usando 'import' en lugar de 'require'

//Configuro la base de datos
import db from '../db.js';

const prompt = promptSync();

export async function empezarPartida(jugadores) {

    try {
        console.log("JUGADORES DESDE PARTIDA: ", jugadores)
        //llama a un funcion que crea los jugadores, la partida y la parjug
        const data = await db.func('skyf_crear_partida_jugador_parjug', [JSON.stringify(jugadores)])
        let idPartida = parseInt(data[0].skyf_crear_partida_jugador_parjug);

        return { "idPartida": idPartida, "numeroJugadores": jugadores.length, "ronda": 1 };
    } catch (error) {
        console.log("Error al crear partida: " + error);
    }

    //


}

export async function elegirOrden(jugadores, idPartida, ronda) {
    let primero;
    const suma = [];

    for (const jugador of jugadores) {
        let sumas = 0;

        try {
            //obtiene las cartas reveladas
            const valores = await db.any(
                `
                SELECT (carta->>'car_valor')::int AS valor
                FROM skyt_mazo_maz,
                     jsonb_array_elements(maz_cartas) AS carta
                WHERE pk_maz_id = $1 AND (carta->>'revelada')::boolean = true
                `,
                [jugador.idMazo]
            );

            // Suma los valores de las cartas reveladas
            valores.forEach(carta => {
                sumas += carta.valor;
            });

            suma.push({ idJugador: jugador.idJugador, total: sumas });

        } catch (error) {
            console.log("Error al intentar obtener el mazo de cada jugador", error);
        }
    }

    // Ordenar los jugadores por suma total (descendente)
    suma.sort((a, b) => b.total - a.total);

    // El primer turno lo tiene el jugador con más puntos
    primero = suma[0];

    // Mostrar el orden y guardar en la base de datos
    //console.log("Orden de turnos:");
    try {
        for (let i = 0; i < suma.length; i++) {
            const jugador = suma[i];
           // console.log(`Puesto ${i + 1}: Jugador con id ${jugador.idJugador} con ${jugador.total} puntos.`);

            // Llama al procedimiento almacenado (asegúrate de que la sintaxis es correcta)
            await db.proc('skyp_guardar_orden', [jugador.total, i + 1, jugador.idJugador, idPartida, ronda]);
        }

        //console.log(`El jugador con el primer turno es el jugador ${primero.idJugador} con ${primero.total} puntos.`);
    } catch (error) {
        console.log("Error al guardar el orden en la base de datos o mostrar los resultados", error);
    }
}

export async function pasarturno(idPartida, numerojugadores, ronda) {

    try {
        //selecciona el jugador de x partia y x ronda que tenga el turno en true
        let data = await db.any(`SELECT  fk_jug_parjug_jugador_id,parjug_orden
            FROM skyt_partida_jugador_parjug
            WHERE  parjug_turno = 'true'
            AND fk_par_parjug_partida_id = $1
            AND parjug_partida_ronda = $2;`, [idPartida, ronda]);

        let jugadorId = data[0].fk_jug_parjug_jugador_id;
        //obtenemos el turno actual en true
        let turno = data[0].parjug_orden;
        //con este ternario vemos cual es el siguiente turno 
        let proximoTurno = turno == numerojugadores ? 1 : turno + 1;
        //funcion que pone en false el true antiguo y pone en true el turno calculado como siguiente
        let data2 = await db.func('skyf_pasar_turno', [idPartida, proximoTurno, ronda])
        let nombre = data2[0].skyf_pasar_turno;
        //console.log("______________________________________________________________________")
        //console.log("Siguiente turno: ")
    } catch (error) {
        console.log("Error al pasar de turno: " + error)
    }

}

export async function comprobarSiEsUltimaRonda(i_pk_maz_id, idPartida) {


    //selecciona el numero de cartas con revelada false del mazo de un jugador
    let turno = await db.any(`SELECT  carta::jsonb
    FROM skyt_mazo_maz,
    jsonb_array_elements(maz_cartas) AS carta
    WHERE pk_maz_id = $1
    AND carta->>'revelada' = 'false'`, [i_pk_maz_id]);

    //y si es igual a 0 es que todas estan reveladas,por lo que ultima ronda 
    if (turno.length === 0) {

        try {
            //pone el estador de la partida como ultima ronda
            console.log("Entramos en la ronda final")
            await db.none(`UPDATE skyt_partida_par
            SET fk_esp_par_estado = 7
             WHERE pk_par_id = $1; `, [idPartida])

        } catch (error) {
            console.log("Error al intentar cambiar el estado de la partida:" + error)
        }
    }

}

export async function revisarEstadoPartida(idPartida) {
    try {
        //obtiene el estado de la partida y lo devuelve
        let data = await db.any('SELECT fk_esp_par_estado FROM skyt_partida_par WHERE pk_par_id = $1', [idPartida])
        let estado = data[0].fk_esp_par_estado;
        return estado
    } catch (error) {
        console.log("Error al revisar estado partida: " + error)
    }

}

export async function comienzoTurno(idPartida, ronda) {
    try {
        //obtiene el id del jugador que le toca y su nombre, muestra de quien es el turno y devuelve el id
        let data = await db.func('skyf_quien_juega', [idPartida, ronda])
        let [idJugador, nombreJugador] = [data[0].id_jugador, data[0].nombre_jugador]
        //console.log("Turno de ", nombreJugador);
        return idJugador
    } catch (error) {
        console.log("Error al comienzo de turno: " + error)
    }
}

export async function opcionTurno() {
    try {
        //pregunta que quieres hacer y mediante do while se asegura que solo respondas 1 o 2
        let eleccion;
        console.log("Decide que accion quieres hacer:")
        console.log("1. Cambio la carta visible por una mia.")
        console.log("2. Miro la primera carta del mazo no visible.")
        do {
            eleccion = parseInt(prompt("-> "), 10);

            if (isNaN(eleccion) || eleccion < 1 || eleccion > 2) {
                console.log("Por favor, ingresa un número válido(1 o 2)");
            }
        } while (isNaN(eleccion) || eleccion < 1 || eleccion > 2);

        return eleccion
    } catch (error) {
        console.log("Error al elegir la accion del turno: " + error)
    }

}

export async function opcionTurnoDos() {
    try {
        //pregunta que quieres hacer y mediante do while se asegura que solo respondas 1 o 2
        let eleccion;
        console.log("Decide que accion quieres hacer:")
        console.log("1. Cambio la carta invisible por una mia.")
        console.log("2. Levanto una carta mia.")
        do {
            eleccion = parseInt(prompt("-> "), 10);

            if (isNaN(eleccion) || eleccion < 1 || eleccion > 2) {
                console.log("Por favor, ingresa un número válido(1 o 2)");
            }
        } while (isNaN(eleccion) || eleccion < 1 || eleccion > 2);

        return eleccion
    } catch (error) {
        console.log("Error al elegir la accion del turno dos: " + error)
    }
}

export async function contarPuntos(idPartida, ronda) {
    try {
        //Pone los puntos de los jugadores en el json al final de la ultima ronda
        await db.proc('skyp_poner_puntuacion', [idPartida, ronda]);
    } catch (error) {
        console.log("Error al contar los puntos: " + error);
    }

}

export async function comprobarFinPartida(idPartida) {
    //compruebs que nadie tenga 100 puntos o mas en X partida 
    let data = await db.func('skyf_comprobar_100_puntos', [idPartida])
    return data;
}

export async function crearOtraRonda(idPartida, ronda) {
    try {
        //crea otra ronda, se utiliza de las ronda dos en adelante
        await db.func('skyf_crear_partida_ronda_dos', [idPartida, ronda]);

    } catch (error) {
        console.log("Error al empezar otra ronda: " + error)
    }
}

export async function alguien100(datos) {
    //pasa os datos y mira si alguien tiene 100 o mas
    //devuelve true false
    let resultado = datos.some(dat => dat.total >= 100);
    return resultado;
}

export async function finalPartida(datos, idPartida) {
    try {
        //ordena los jugadores de menos a mas 
        let info = datos.sort((a, b) => a.total - b.total);
        let id = info[0].id_jugador;
        let puntuacion = info[0].total;
        //pone el ganador en la partida con los puntos y el numerod e ronda que hubo
        await db.proc('skyp_poner_ganador_fin', [idPartida, id, puntuacion])
       
    } catch (error) {
        console.log("Error al final de la partida: " + error);
    }

}

export async function selectPrincipioTurn(ronda,idPartida) {
    //console.log("RONDA DESDE SELECT "+ronda)
    //console.log("IDpartida "+idPartida)
    let data = await db.func('skyf_select_info_front_end',[idPartida,ronda]);
    
    return data;
}


