const { validationResult } = require('express-validator');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // Asegúrate de tener jwt instalado

// Controlador para obtener todos los usuarios
exports.getResponsable = async (req, res) => {
    try {
        // Consulta para recuperar todos los usuarios (id y u_usuario)
        const [users] = await db.query('SELECT id, u_usuario FROM users'); // Corrige la consulta eliminando la coma extra

        // Verificar si la consulta no devuelve resultados
        if (users.length === 0) {
            return res.status(404).json({ msg: 'No hay usuarios que mostrar' });
        }

        // Retornar todos los resultados de la consulta
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


exports.register = async (req, res) => {
    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombreProyecto, descripcion, fechaInicio, fechaFin, estado, presupuesto, responsable } = req.body;

    // Validar el token
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validar que la fecha de finalización no sea menor a la fecha de inicio
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);

        if (fin < inicio) {
            return res.status(400).json({ msg: 'La fecha de finalización no puede ser menor a la fecha de inicio' });
        }

        // Verificar si el proyecto ya existe
        const [existingProject] = await db.query(
            'SELECT nombre, id_responsable FROM proyectos WHERE nombre = ? AND id_responsable = ?',
            [nombreProyecto, responsable]
        );
        if (existingProject.length > 0) {
            return res.status(400).json({ msg: 'El proyecto ya fue asignado a un colaborador' });
        }

        // Insertar el nuevo proyecto
        const [result] = await db.query(
            'INSERT INTO proyectos (nombre, descripcion, fecha_inicio, fecha_finalizacion, estado, presupuesto, id_responsable, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [nombreProyecto, descripcion, fechaInicio, fechaFin, estado, presupuesto, responsable]
        );

        // Respuesta exitosa
        return res.status(201).json({ msg: 'Proyecto registrado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al registrar el proyecto' });
    }
};



// Controlador para seleccionar los usuarios
exports.getProyectos = async (req, res) => {
    const { search } = req.query;
    
    // Consulta base
    let query = 'SELECT p.proyecto_id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_finalizacion, p.estado, p.presupuesto, p.id_responsable, p.fecha_creacion, p.fecha_actualizacion, u.u_usuario  FROM proyectos p JOIN users u ON p.id_responsable = u.id ';
    const params = [];

    // Si se proporciona un término de búsqueda, modificar la consulta
    if (search) {
        query += ' WHERE nombre LIKE ?';  // Añadir WHERE si hay búsqueda
        params.push(`%${search}%`);          // Añadir el término de búsqueda con comodines
    }

    query += ' ORDER BY proyecto_id DESC';  // Asegurar que siempre se ordena por id en orden descendente

    try {
        // Ejecutar la consulta
        const [result] = await db.query(query, params);

        // Devolver los resultados en formato JSON
        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
    }
};


// Controlador para eliminar un proyecto
exports.deleteProyecto = async (req, res) => {
    const { id } = req.params;

    try {
        // Eliminar el rol
        const [deleteResult] = await db.query('DELETE FROM proyectos WHERE proyecto_id = ?', [id]);

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ msg: 'El protecto no existe' });
        }

        return res.status(200).json({ msg: 'Proyecto eliminado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al eliminar el rol' });
    }
};

// Controlador para editar los proyectos
exports.editProyectos = async (req, res) => {
    const errors = validationResult(req);  // Validar entradas si se usa express-validator
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombreProyecto, descripcion, fechaInicio, fechaFin, estado, presupuesto, responsable } = req.body;

    try {
        // Verificar si el rol existe
        const [role] = await db.query('SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?', [id]);
        if (role.length === 0) {
            return res.status(404).json({ msg: 'Proyecto no encontrado' });
        }

        // Actualizar el rol
        const [result] = await db.query(
            'UPDATE proyectos SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_finalizacion = ?, estado = ?, presupuesto = ?, id_responsable = ?, fecha_actualizacion = NOW() WHERE proyecto_id = ?',
            [nombreProyecto, descripcion, fechaInicio, fechaFin, estado, presupuesto, responsable, id]
        );
        

        // Responder con un mensaje de éxito
        return res.status(200).json({ msg: 'Proyecto actualizado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al actualizar el proyecto' });
    }
};


// Controlador para seleccionar datos de un solo usaurio
exports.getProyecto = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar
    
    try {
        // Consulta para verificar si el usuario existe
        const [user] = await db.query(
            'SELECT p.proyecto_id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_finalizacion, p.estado, p.presupuesto, p.id_responsable, p.fecha_creacion, p.fecha_actualizacion, u.u_usuario ' +
            'FROM proyectos p JOIN users u ON p.id_responsable = u.id ' +
            'WHERE p.proyecto_id = ?', [id]
          );
          
        if (user.length === 0) {
            return res.status(404).json({ msg: 'Rol no encontrado' });
        }
        // Enviar respuesta de éxito
        res.json(user[0]); // Retorna solo el primer (y único) resultado de la consulta
        
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};