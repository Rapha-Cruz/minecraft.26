// require('dotenv').config();
// const { Pool } = require('pg');
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });
// module.exports = pool;

require('dotenv').config(); 
const { Pool } = require('pg'); 
 
const pool = new Pool({ 
    host: process.env.DB_HOST, 
    port: Number(process.env.DB_PORT), 
    database: process.env.DB_NAME, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    ssl: { 
      rejectUnauthorized: false }, 
      max: 3 
    }
);

module.exports = pool;