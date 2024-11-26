const { validationResult } = require('express-validator');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // Asegúrate de tener jwt instalado

// Controlador para obtener todas las tareas del usuario logueado
exports.getTareas = async (req, res) => {
    const { search } = req.query;

    // Extraer el token del encabezado de la solicitud
    const token = req.header('x-auth-token'); // El token enviado en los headers
    
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar token con tu clave secreta

        // Extraer el id del usuario del payload del token
        const userId = decoded.user.id;  // Asegúrate de acceder correctamente al id del usuario

        // Consulta base
        let query = 'SELECT p.proyecto_id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_finalizacion, p.estado, p.presupuesto, p.id_responsable, p.fecha_creacion, p.fecha_actualizacion, u.u_usuario FROM proyectos p JOIN users u ON p.id_responsable = u.id WHERE p.id_responsable = ? AND (p.estado = "En progreso" OR p.estado = "Suspendido")';
        const params = [userId];

        // Si se proporciona un término de búsqueda, modificar la consulta
        if (search) {
            query += ' AND nombre LIKE ?';  // Modificar el WHERE existente para agregar la condición de búsqueda
            params.push(`%${search}%`);          // Añadir el término de búsqueda con comodines
        }

        query += ' ORDER BY proyecto_id DESC';  // Asegurar que siempre se ordena por id en orden descendente

        // Ejecutar la consulta
        const [result] = await db.query(query, params);  // Asegúrate de usar await para obtener el resultado

        // Devolver los resultados en formato JSON
        res.json(result);

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Token no válido' });
        }
        return res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
    }
};
