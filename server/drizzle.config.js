require('dotenv').config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};