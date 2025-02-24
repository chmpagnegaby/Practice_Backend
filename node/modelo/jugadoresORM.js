import { DataTypes } from 'sequelize';

import sequelize from "../databaseORM.js"; 

const Jugador = sequelize.define("Jugador", {
  pk_jug_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  jug_nombre: {
    type: DataTypes.STRING, 
    allowNull: false,
  },
  jug_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true, 
    },
  },
  jug_fechareg: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: "skyt_jugador_jug", 
  timestamps: false, // No agrega columnas 
});

export default Jugador;