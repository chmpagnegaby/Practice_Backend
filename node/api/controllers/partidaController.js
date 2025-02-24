// controllers/partidaController.js

// Función para empezar la partida
function empezarPartida(req, res) {
    const datos = req.body; // Datos enviados desde el frontend
  
    // Lógica de inicialización de la partida
    // Por ejemplo, puedes crear un objeto de estado de la partida, asignar jugadores, etc.
    const estadoPartida = {
      jugadores: datos.jugadores || [],
      estado: "iniciada",  // Ejemplo de un estado de la partida
      baraja: []  // Aquí iría la lógica para la baraja, si es necesario
    };
  
    // Responder con el estado actualizado de la partida
    res.json({
      mensaje: "Partida iniciada correctamente",
      estado: estadoPartida
    });
  }

  module.exports = { empezarPartida };