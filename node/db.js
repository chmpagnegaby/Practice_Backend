import pgPromise from "pg-promise";
require('dotenv').config();  // Carga las variables de entorno de .env

// Usamos la URL desde el archivo .env
const db = pgPromise()({
  connectionString: process.env.DATABASE_URL,  // Carga la URL de conexión desde las variables de entorno
  ssl: {
    rejectUnauthorized: false  // Asegura que la conexión sea segura con SSL
  }
});

export default db;
