const { obtenerCartas, barajarCartas, insertarBaraja, repartirCartas } = require('./baraja');
import db from './db.js';

describe('Pruebas para baraja.js', () => {
    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    test('obtenerCartas debería devolver una lista de cartas', async () => {
        // Mock de db.any para devolver datos simulados
        db.any.mockResolvedValue([{ id: 1, nombre: 'Carta 1' }, { id: 2, nombre: 'Carta 2' }]);

        // Llamar a la función que estás probando
        const cartas = await obtenerCartas();

        // Verificar que db.any fue llamado correctamente
        expect(db.any).toHaveBeenCalledWith('SELECT * FROM skyt_cartas_car');

        // Verificar que la función devuelve los datos simulados
        expect(cartas).toEqual([{ id: 1, nombre: 'Carta 1' }, { id: 2, nombre: 'Carta 2' }]);
    });

    test('barajarCartas debería barajar la baraja', async () => {
        const baraja = [1, 2, 3, 4, 5];
        const barajaBarajada = await barajarCartas([...baraja]);

        // Verificar que la baraja ha sido barajada (no es igual a la original)
        expect(barajaBarajada).not.toEqual(baraja);
        // Verificar que la longitud de la baraja es la misma
        expect(barajaBarajada.length).toBe(baraja.length);
    });

    test('insertarBaraja debería insertar la baraja y devolver el idMazo', async () => {
        // Mock de db.func para devolver un idMazo simulado
        db.func.mockResolvedValue([{ skyf_insertar_mazo_barajado: 123 }]);

        // Llamar a la función que estás probando
        const idMazo = await insertarBaraja(1, [{ id: 1, nombre: 'Carta 1' }]);

        // Verificar que db.func fue llamado correctamente
        expect(db.func).toHaveBeenCalledWith('skyf_insertar_mazo_barajado', [1, JSON.stringify([{ id: 1, nombre: 'Carta 1' }])]);

        // Verificar que la función devuelve el idMazo simulado
        expect(idMazo).toBe(123);
    });

    test('repartirCartas debería repartir cartas a los jugadores', async () => {
        // Mock de db.func para simular la obtención de IDs de jugadores
        db.func.mockResolvedValueOnce([{ skyf_obtener_id_jugadores: [1, 2] }]);

        // Mock de db.func para simular la creación de mazos
        db.func.mockResolvedValue([{ skyf_crear_json_mazo: 456 }]);

        // Baraja de cartas simulada
        const baraja = Array.from({ length: 24 }, (_, i) => ({ id: i + 1, nombre: `Carta ${i + 1}` }));

        // Llamar a la función que estás probando
        const info = await repartirCartas(baraja, 1);

        // Verificar que db.func fue llamado correctamente
        expect(db.func).toHaveBeenCalledWith('skyf_obtener_id_jugadores', [1]);
        expect(db.func).toHaveBeenCalledWith('skyf_crear_json_mazo', [1, 1, expect.any(String)]);
        expect(db.func).toHaveBeenCalledWith('skyf_crear_json_mazo', [1, 2, expect.any(String)]);

        // Verificar que la función devuelve la información correcta
        expect(info).toEqual([{ idJugador: 1, idMazo: 456 }, { idJugador: 2, idMazo: 456 }]);
    });
});