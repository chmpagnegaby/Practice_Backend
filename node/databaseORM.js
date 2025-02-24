import { Sequelize } from "sequelize";

const sequelize = new Sequelize("skyjo_entrega", "root", "Root123", {
  host: "localhost", 
  port: 5432, 
  dialect: "postgres",
});

export default sequelize;