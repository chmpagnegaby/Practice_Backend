import pgPromise from "pg-promise"

//Configuro la base de datos
const db = pgPromise()({
    host: process.env.NODE_ENV === 'production' ? 'db' : 'localhost',  // Cambia el host según el entorno
    port: 5432,
    database: 'skyjo_entrega',
    user: 'root',
    password: 'root',
});

export default db;

