const mysql = require('mysql2/promise'); // Cambia aquí
require('dotenv').config();

// Crear la conexión con MySQL
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

module.exports = connection;
