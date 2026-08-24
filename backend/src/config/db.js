import { Sequelize } from "sequelize";
import env from "./env.js";

const dialectOptions = {
  statement_timeout: env.DB_STATEMENT_TIMEOUT || 30000,
  idle_in_transaction_session_timeout: env.DB_IDLE_TX_TIMEOUT || 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
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
    max: env.DB_POOL_MAX || 20,
    min: 0, // CRITICAL: Never keep dead idle pool connections in remote/cloud environments
    acquire: env.DB_POOL_ACQUIRE || 30000,
    idle: env.DB_POOL_IDLE || 5000,
    evict: 1000, // Evict dead sockets every 1s
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
