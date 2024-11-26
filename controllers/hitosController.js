const { validationResult } = require('express-validator');
const db = require('../config/db');
const jwt = require('jsonwebtoken');


// Controlador para seleccionar datos de un solo proyecto
exports.getProyecto = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar

    try {
        const [proyects] = await db.query('SELECT proyecto_id, nombre FROM proyectos WHERE proyecto_id = ?', [id]);
        if (proyects.length === 0) {
            return res.status(404).json({ msg: 'Proyecto no encontrado' });
        }
        // Enviar respuesta de éxito
        res.json(proyects[0]); // Retorna solo el primer (y único) resultado de la consulta

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.crearHito = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ statusCode: 400, msg: 'Datos inválidos', errors: errors.array() });
    }

    const { titulo, descripcion, fechaInicio, fechaFin, estado, proyectoId } = req.body;

    if (!proyectoId) {
        return res.status(400).json({ statusCode: 400, msg: 'El proyectoId es obligatorio.' });
    }

    try {
        // Verificar si el proyecto existe
        const [existingProject] = await db.query(
            'SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?',
            [proyectoId]
        );

        if (!existingProject) {
            return res.status(404).json({ statusCode: 404, msg: 'Proyecto no encontrado.' });
        }

        // Verificar si el hito ya existe
        const [existingHito] = await db.query(
            'SELECT id_proyecto, nombre_hito FROM hitos WHERE id_proyecto = ? AND nombre_hito = ?',
            [proyectoId, titulo]
        );

        if (existingHito.length > 0) {
            return res.status(400).json({ statusCode: 400, msg: 'El hito con este nombre ya existe para el proyecto.' });
        }

        // Insertar el nuevo hito
        const [result] = await db.query(
            'INSERT INTO hitos (id_proyecto, nombre_hito, descripcion, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [proyectoId, titulo, descripcion, fechaInicio, fechaFin, estado]
        );

        return res.status(201).json({ statusCode: 201, msg: 'Hito registrado correctamente' });
    } catch (err) {
        return res.status(500).json({ statusCode: 500, msg: 'Error en el servidor al registrar el hito', error: err.message });
    }
};



exports.getHitos = async (req, res) => {
    const { id } = req.params;

    try {
        const [hitos] = await db.query('SELECT * FROM hitos WHERE id_proyecto = ?', [id]);
        if (hitos.length === 0) {
            return res.status(404).json({ statusCode: 404, msg: 'No hay hitos para el proyecto' });
        }
        
        res.json(hitos); // Asegúrate de que los datos estén bien formateados
    } catch (err) {
        res.status(500).json({ statusCode: 500, msg: 'Error en el servidor' });
    }
};


// Controlador para seleccionar datos de un solo proyecto
exports.getHito = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar

    try {
        const [proyects] = await db.query('SELECT id_hito, nombre_hito, descripcion, fecha_inicio, fecha_fin, estado FROM hitos WHERE id_hito = ?', [id]);
        if (proyects.length === 0) {
            return res.status(404).json({ msg: 'Proyecto no encontrado' });
        }
        // Enviar respuesta de éxito
        res.json(proyects[0]); // Retorna solo el primer (y único) resultado de la consulta

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.editarHito = async (req, res) => {
    const { id } = req.params; // ID del hito a editar
    const { nombre_hito, descripcion, fecha_inicio, fecha_fin, estado } = req.body; // Datos a actualizar


    // Validación de los datos recibidos
    if (!nombre_hito || !descripcion || !fecha_inicio || !fecha_fin || !estado) {
        return res.status(400).json({ msg: 'Todos los campos son requeridos.' });
    }

    // Validación de formato de fechas
    if (isNaN(Date.parse(fecha_inicio)) || isNaN(Date.parse(fecha_fin))) {
        return res.status(400).json({ msg: 'Las fechas proporcionadas no son válidas.' });
    }

    // Validación del estado
    const validStates = ['Pendiente', 'En progreso', 'Completado'];
    if (!validStates.includes(estado)) {
        return res.status(400).json({ msg: `El estado debe ser uno de los siguientes: ${validStates.join(', ')}` });
    }

    try {
        // Realizar la actualización del hito en la base de datos
        const result = await db.query(
            'UPDATE hitos SET nombre_hito = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id_hito = ?',
            [nombre_hito, descripcion, fecha_inicio, fecha_fin, estado, id]
        );

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Hito no encontrado' });
        }

        // Enviar respuesta de éxito
        res.json({ msg: 'Hito actualizado exitosamente' });

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


exports.eliminarHito = async (req, res) => {
    const { id } = req.params; // ID del hito a eliminar

    try {
        // Realizar la eliminación del hito en la base de datos
        const result = await db.query(
            'DELETE FROM hitos WHERE id_hito = ?',
            [id]
        );

        // Verificar si se eliminó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Hito no encontrado' });
        }

        // Enviar respuesta de éxito
        res.json({ msg: 'Hito eliminado exitosamente' });

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


