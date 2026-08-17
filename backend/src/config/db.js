import { Sequelize } from "sequelize";
import env from "./env.js";

const dialectOptions = {
  statement_timeout: env.DB_STATEMENT_TIMEOUT,
  idle_in_transaction_session_timeout: env.DB_IDLE_TX_TIMEOUT,
  keepAlive: true,
};

if (env.DB_SSL || env.NODE_ENV === "production") {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

const db = new Sequelize(env.DB_URI, {
  dialect: "postgres",
  logging: env.NODE_ENV === "development" ? (msg) => console.log(`[SQL] ${msg}`) : false,
  pool: {
    max: env.DB_POOL_MAX,
    min: env.DB_POOL_MIN,
    acquire: env.DB_POOL_ACQUIRE,
    idle: env.DB_POOL_IDLE,
    evict: 1000,
  },
  timezone: "+05:30", // India Standard Time
  dialectOptions,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
});

export default db;
