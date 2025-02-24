//archivo js para baraja
import db from '../db.js';
import promptSync from "prompt-sync";
const prompt = promptSync();

export async function obtenerCartas() {
    try {
        // Llamada a la función SQL para obtener todas las cartas
        const cartas = await db.any('SELECT * FROM skyt_cartas_car');
        
        //Devuelve array de json con todas las cartas
        return cartas;

    } catch (error) {
        console.error('Error al obtener las cartas:', error);
    }
}

export async function barajarCartas(baraja) {

    //barajas las cartas intercambiando posiciones
    for (let x = baraja.length - 1; x > 0; x--) {

        const y = Math.floor(Math.random() * (x + 1));
        [baraja[x], baraja[y]] = [baraja[y], baraja[x]];
    }
    //devuelve las cartas barajadas
    return baraja;
}

export async function insertarBaraja(idPartida, baraja, ronda) {
    let idMazo;
    try {
        //llama a una funcion que le pasas idpartida, ronda y el json y lo inserta
        const data = await db.func('skyf_insertar_mazo_barajado', [idPartida, JSON.stringify(baraja),ronda]);
        idMazo = parseInt(data[0].skyf_insertar_mazo_barajado);
        console.log("Baraja barajada subida");

    } catch (error) {
        console.log("Error al insertas cartas: " + error);
    }
    //devuelve el id del mazo central
    return idMazo;
}


export async function repartirCartas(baraja, idPartida, ronda) {

    try {
        //obtienes el id de los jugadores de una partida y ronda
        const data = await db.func("skyf_obtener_id_jugadores", [idPartida, ronda]);
        const idsJugadores = data[0].skyf_obtener_id_jugadores;
        console.log("ids ", idsJugadores);
        let info = [];
        //por el numero de jugadores
        for (let x = 0; x < idsJugadores.length; x++) {

            //le pone 12 cartas al jugador y las elimina de la baraja
            let barajaJugador = baraja.splice(0, 12);
            //iniciamos columna y fila en 0
            let columna = 0;
            let fila = 0;
            //pone todas las cartas como false y les da una posicion en la matriz
            barajaJugador.forEach(carta => {
                carta.fila = fila;
                carta.columna = columna;
                carta.revelada = false;
                if (columna + 1 > 3) {
                    fila++;
                    columna = 0;
                } else {
                    columna++;
                }
            });
            //funcion que crear el mazo en la base de datos
            let data = await db.func("skyf_crear_json_mazo", [idPartida, idsJugadores[x], JSON.stringify(barajaJugador),ronda]);
            let idMazo = data[0].skyf_crear_json_mazo;
            info.push({ "idJugador": idsJugadores[x], "idMazo": idMazo });

        }
        console.log("Mazos creados");
        //devuelve info
        return info;
    } catch (error) {
        console.log("Error al repartir cartas: " + error)
    }

}

async function crearMatriz(idMazo) {
    try {
        //obtienes el json del mazo
        const data = await db.any('SELECT maz_cartas FROM skyt_mazo_maz WHERE pk_maz_id = $1', [idMazo]);
        let mazo = data[0].maz_cartas;
        let matriz = [
            [],
            [],
            []
        ];
        const opciones = [];
        //Asigna los valores a la matriz segun su posicion en fila y columna y crea opciones, un array para mostrar en termianl
        mazo.forEach((carta, index) => {

            opciones.push({ "indice": (index + 1), "fila": carta.fila, "columna": carta.columna, "valor": carta.car_valor, "revelada": carta.revelada })
            matriz[carta.fila][carta.columna] = { "revelada": carta.revelada, "valor": carta.car_valor, "color": carta.car_color, "id": carta.pk_car_id, "nombre": carta.car_nombre };

        });
        //devuelve el mazo formato array json, el array con forma de matriz y las opciones
        return [mazo, matriz, opciones]
    } catch (error) {
        console.log("Error al crear la matriz: " + error)
    }
}

async function elegirOpcionLevantar(opciones) {
    try {
        //muestra opciones
        opciones.forEach((opcion) => {
            console.log(`${opcion.indice}. Fila: ${opcion.fila} Columna: ${opcion.columna} Valor: ${opcion.revelada ? opcion.valor : "X"}`);
        });
        let eleccion;
        do {
            //Mientras que eleccion este dentro del rango de opciones y no este ya revelada se toma ese valor si no se hace n bucle
            eleccion = parseInt(prompt("Ingresa el número de tu elección: "), 10);

            if (isNaN(eleccion) || eleccion < 1 || eleccion > opciones.length || opciones[eleccion - 1].revelada) {
                console.log("Por favor, ingresa un número válido(1-12 o no revelada");
            }
        } while (isNaN(eleccion) || eleccion < 1 || eleccion > opciones.length || opciones[eleccion - 1].revelada);

        let resultado = opciones[eleccion - 1]
        //devuelve la opcion
        return resultado
    } catch (error) {
        console.log("Error al elegir opcion: " + error)
    }
}
//Igual que el anterior pero permite la eleccion de cartas ya reveladas
async function elegirOpcion(opciones) {
    try {
        opciones.forEach((opcion) => {
            console.log(`${opcion.indice}. Fila: ${opcion.fila} Columna: ${opcion.columna} Valor: ${opcion.revelada ? opcion.valor : "X"}`);
        });
        let eleccion;
        do {
            eleccion = parseInt(prompt("Ingresa el número de tu elección: "), 10);

            if (isNaN(eleccion) || eleccion < 1 || eleccion > opciones.length) {
                console.log("Por favor, ingresa un número válido(1-12)");
            }
        } while (isNaN(eleccion) || eleccion < 1 || eleccion > opciones.length);

        let resultado = opciones[eleccion - 1]
        return resultado
    } catch (error) {
        console.log("Error al elegir opcion: " + error)
    }
}
//muestra el mazo con la forma de matriz
async function mostrarMatriz(matriz) {
    try {
        console.log("-----------------------------------------")
        matriz.forEach(fila => {
            let fil = "";
            fila.forEach(columna => {

                let valor = columna.revelada ? columna.valor : "X";
                fil += "|" + valor + "|";
            })
            console.log(fil + "\n");
        })
        console.log("-----------------------------------------")
    } catch (error) {
        console.log("Error al mostrar la matriz: " + error)
    }

}
//mostrar matriz que se llama al principio de cada ronda sin generar opciones
export async function mostrarComienzo(idMazo) {
    let [mazo, matriz, opciones] = await crearMatriz(idMazo)
    await mostrarMatriz(matriz);
}

export async function levantarCartas(idmazo) {
    try {
        //primero crea y muestra la matriz
        let [mazo, matriz, opciones] = await crearMatriz(idmazo)
        mostrarMatriz(matriz)
        //luego pregunta por resultado
        let resultado = await elegirOpcionLevantar(opciones)
        matriz[resultado.fila][resultado.columna].revelada = true
        //cambia la carta elegida a revelada
        mazo.forEach(carta => {
            if (carta.fila == resultado.fila && carta.columna == resultado.columna) {
                carta.revelada = true
            }
        })
        //update el json de la tabla y muestra la matriz al final
        await db.func("skyf_cambiar_json_mazo", [idmazo, JSON.stringify(mazo)])
        mostrarMatriz(matriz)
    } catch (error) {
        console.log("Error al levantar carta: " + error)
    }

}
//funcion que segun el numero de jugadores llama 2 veces por jugador a levantar carta
export async function jugadoresLevantanDosCartas(jugadores) {
    for await (const jugador of jugadores) {
        for (let x = 0; x < 2; x++) {
            await levantarCartas(jugador.idMazo);
        }
    }
}

export async function comprobarColumnas(idMazo) {
    try {
        //obtienes el json de un mazo
        let data = await db.any('SELECT maz_cartas FROM skyt_mazo_maz WHERE pk_maz_id = $1', [idMazo]);
        let mazo = data[0].maz_cartas;
        let columnas = []
        //por las 4 columnas obtienes las cartas de cada columna
        for (let x = 0; x < 4; x++) {
            let columna = mazo.filter(carta => carta.columna == x)
            //comprueba que todas las columnas tengan el mismo valor y estan reveladas
            let iguales = columna.every(carta => carta.car_valor === columna[0].car_valor && carta.revelada ==true)
            //si iguales es tru lo mete en columnas
            if (iguales) {
                columnas.push(x)
            }
        }
        //si 1 columna o mas iguales las manda a eliminar
        if (columnas.length > 0) {
            await eliminarColumna(columnas, mazo, idMazo);
        }

    } catch (error) {
        console.log("Error al comprobar columna:", error)
    }

}

async function eliminarColumna(columnas, mazo, idMazo) {
    try {

        let nuevoMazo = mazo;
        //obtienes el json sin esas columnas
        for (let x = 0; x < columnas.length; x++) {

            let columna = columnas[x]
            nuevoMazo = nuevoMazo.filter(carta => carta.columna != columna);

        }
        //lo actualiza en la base de datos
        await db.func('skyf_cambiar_json_mazo', [idMazo, JSON.stringify(nuevoMazo)])
    } catch (error) {
        console.log("Error al eliminar columna:", error)
    }

}

export async function mostrarCartaBarajaVisible(idPartida,ronda) {
    try {
        //obtiene la primera carta visible y la muestra en consula y devuelve el json
        let data = await db.any('SELECT pba_cartas_visible->0 AS carta_visible FROM skyt_pila_barajada_pba WHERE fk_par_pba_partida_id = $1 AND pba_partida_ronda = $2;', [idPartida,ronda])
        let cartaVisible = data[0].carta_visible;
        //console.log("La carta de arriba del mazo visible es: " + cartaVisible.car_valor)
        return cartaVisible;
    } catch (error) {
        console.log("Error al obtener la primera carta baraja visible: " + error)
    }
}


export async function mazoVisibleVacio(idPartida,ronda) {
    try {
        //si el mazo visible esta vacio pone la primera carta del mazo invisible
        let data = await db.any('SELECT pba_cartas_visible FROM skyt_pila_barajada_pba WHERE fk_par_pba_partida_id = $1 AND pba_partida_ronda = $2', [idPartida,ronda])
        let barajaVisible = data[0].pba_cartas_visible;
        if (barajaVisible.length < 1) {
            console.log("Poniendo carta en mazo visible")
            await db.func('skyf_mazo_visible_vacio', [idPartida, ronda]);
        }
        return;
    } catch (error) {
        console.log("Error al poner carta invisible en visible: " + error)
    }
}

//obtiene la primera del mazo invisible y la elimina de mazo invisible
export async function obtenerCartaPilaBarajadaInvisible(partidaId, ronda) {
    const result = await db.func('skyf_obtener_carta_pila_barajada', [partidaId, ronda]);
    let carta = result[0].skyf_obtener_carta_pila_barajada
    //console.log("La carta del mazo invisible es: " + carta.car_valor)
    return carta;
}

export async function obtenerIdMazo(idJugador, partidaId, ronda) {
    try {
        //obtiene el id del mazo de un jugador en x partida y x ronda
        let data = await db.func('skyf_obtener_id_mazo', [partidaId, idJugador,ronda]);
        let idMazo = data[0].skyf_obtener_id_mazo;
        return idMazo;
    } catch (error) {
        console.log("Error al obtener el id del mazo: " + error)
    }

}

export async function depositarCartaMazoVisible(partidaId, carta, ronda) {
    try {
        //le pasas una carta y la pone la primera en el mazo visible de x partida y x ronda
        await db.func('skyf_depositar_carta_mazo_visible', [partidaId, carta, ronda])
    } catch (error) {
        console.log("Error al depositar carta en mazo visible: " + error)
    }
}

export async function cambiarCarta(idMazo, carta,partidaId, ronda) {
    try {
        //crea la matriz y la muestra en consola
        let [mazo, matriz, opciones] = await crearMatriz(idMazo)
        mostrarMatriz(matriz)
        //pregunta por la carta a cambiar
        let resultado = await elegirOpcion(opciones)
        //obtenemos el indice de la carta a cambiar y obtiene la carta antigua
        let index = mazo.findIndex(carta => carta.columna == resultado.columna && carta.fila == resultado.fila)
        let cartaAntigua = mazo[index];
        //le mete fila columna y revelada a la carta
        carta["columna"] = resultado.columna;
        carta["fila"] = resultado.fila;
        carta["revelada"] = true;
        //la pone en el json
        mazo[index] = carta;
        //matriz[resultado.fila][resultado.columna] = carta;
        //actualizamos el json en la bd y ponemos la carta antigua la primera del mazo visible
        await db.func("skyf_cambiar_json_mazo", [idMazo, JSON.stringify(mazo)]);
        await depositarCartaMazoVisible(partidaId,cartaAntigua, ronda);
        [mazo, matriz, opciones] = await crearMatriz(idMazo);
        mostrarMatriz(matriz)
    } catch (error) {
        console.log("Error al cambiar una carta: "+error)
    }

}

export async function eliminarPrimeraCarta(partidaId, ronda) {
    try {
        //elimina la primera carta del mazo visible
        await db.proc('skyp_eliminar_primera_carta',[partidaId, ronda])
    } catch (error) {
        console.log("Error al eliminar la primera carta: "+error)
    }
}

export async function levantarTodoMazo(idMazo) {
    //obtiene el mazo y pone todas las cartas en reveladas luego lo sube a la bd
    const data = await db.any('SELECT maz_cartas FROM skyt_mazo_maz WHERE pk_maz_id = $1', [idMazo]);
    let mazo = data[0].maz_cartas;
    mazo.forEach(carta => carta.revelada = true);
    await db.func("skyf_cambiar_json_mazo", [idMazo, JSON.stringify(mazo)]);
    let [mazo2, matriz, opciones] = await crearMatriz(idMazo);
    mostrarMatriz(matriz);
}

export async function levantarFront(idCarta, idMazo) {
    try {
        console.log("LEVANTADO?¿?")
        const data = await db.any('SELECT maz_cartas FROM skyt_mazo_maz WHERE pk_maz_id = $1', [idMazo]);
        let mazo = data[0].maz_cartas;
        let index = mazo.findIndex(carta => carta.pk_car_id == idCarta)
        mazo[index].revelada = true;
        await db.func("skyf_cambiar_json_mazo", [idMazo, JSON.stringify(mazo)])
        return;
    } catch (error) {
        console.log("Error al levantar carta: " + error)
    }
}

export async function cambiarCartaFront(idMazo, cartaVisible, idPartida, ronda, idCarta) {
    try {
        const data = await db.any('SELECT maz_cartas FROM skyt_mazo_maz WHERE pk_maz_id = $1', [idMazo]);
        let mazo = data[0].maz_cartas;
        console.log("mazo ",mazo)
        let index = await mazo.findIndex(carta => carta.pk_car_id == idCarta)
        console.log("indice ",index);
        let cartaAntigua = mazo[index];
        console.log("carta ant ",cartaAntigua)
        cartaVisible["columna"] = cartaAntigua.columna;
        cartaVisible["fila"] = cartaAntigua.fila;
        cartaVisible["revelada"] = true;
        mazo[index] = cartaVisible;
        await db.func("skyf_cambiar_json_mazo", [idMazo, JSON.stringify(mazo)]);
        console.log("ronda ",ronda)
        await depositarCartaMazoVisible(idPartida,cartaAntigua, ronda);
        return;
    } catch (error) {
        console.log("Error al cambiar una carta front: "+error)
    }
}