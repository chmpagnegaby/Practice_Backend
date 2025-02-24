# Importación de la librería psycopg2
import psycopg2
#Impotamos también Flask, jsonfy y CORS
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) #Permitir solicitudes desde el Frontend

#Funcion para obtener un JSON con las partidas totales y las rondas totales
def obtener_estadisticas():
    # Configuración de la conexión con la base de datos
    conexion = psycopg2.connect(
        host="localhost",
        database="skyjo_entrega",
        user="root",
        password="root"
    )

    cursor = conexion.cursor()

    # Obtener el número total de partidas
    cursor.execute("SELECT COUNT(*) FROM skyt_partida_par")
    partidas = cursor.fetchone()[0]

    # Obtener el número total de rondas sumadas
    cursor.execute("SELECT SUM(par_rondas) FROM skyt_partida_par")
    rondas = cursor.fetchone()[0]
    rondas = rondas if rondas is not None else 0  # Evitar errores si no hay datos

    # Cerrar la conexión
    cursor.close()
    conexion.close()

    return {"total_partidas": partidas, "total_rondas": rondas}

#Ruta para obtener estadísticas
@app.route("/api/estadisticas", methods=["GET"])
def get_estadisticas():
    return jsonify(obtener_estadisticas())

#Nos aseguramos de que Flask se ejecute mientras se desarrolla la aplicacion  
if __name__ == "__main__":
    app.run(debug=True)