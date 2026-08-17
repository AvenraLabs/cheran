require("dotenv").config();

module.exports = {
  development: {
    use_env_variable: "DB_URI",
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL === "true" ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: console.log,
  },
  production: {
    use_env_variable: "DB_URI",
    dialect: "postgres",
    dialectOptions: {
      ssl: process.env.DB_SSL === "true" || process.env.NODE_ENV === "production" ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: false,
  },
};
