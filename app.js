const express = require('express');
const db = require('./config/db');
const app = express();
const { port } = require('./config/config');
const cors = require('cors'); // Importa cors
const path = require('path'); // Importa path

// Habilita CORS para todas las rutas
app.use(cors());

// Middleware para manejar JSON
app.use(express.json({ extended: false }));

// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));

// Rutas de roles
app.use('/api/roles', require('./routes/roles'));

// Rutas de navegación
app.use('/api/navigation', require('./routes/navigation'));

// Rutas de los proyectos
app.use('/api/proyectos', require('./routes/proyectos'));

// Rutas de hitos
app.use('/api/hitos', require('./routes/hitos'));

// Rutas de tareas
app.use('/api/tareas', require('./routes/tareas'));

// Rutas de tareas
app.use('/api/pruebas', require('./routes/pruebas'));

// Rutas de grafiacs
app.use('/api/grafica', require('./routes/grafica'));



// Servir archivos estáticos desde el directorio de construcción de React
app.use(express.static(path.join(__dirname, 'src')));

// Redirigir cualquier otra solicitud al index.html de la aplicación React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

// Puerto de escucha
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
