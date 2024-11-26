const { validationResult } = require('express-validator');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // Asegúrate de tener jwt instalado


// Controlador para seleccionar datos de un solo usaurio
exports.getHItos = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar

    try {
        // Consulta para verificar si el usuario existe
        const [hitos] = await db.query('SELECT id_hito, nombre_hito, descripcion, estado FROM hitos WHERE id_proyecto = ?', [id]);

        if (hitos.length === 0) {
            return res.status(404).json({ msg: 'No existen hitos para el proyecto' });
        }
        // Enviar respuesta de éxito
        res.json(hitos); // Retorna solo el primer (y único) resultado de la consulta

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor al consultar hitos' });
    }
};



exports.registerPlanDePrueba = async (req, res) => {
    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { hitoSeleccionado, estadonuevoHito, resultadoEsperado, pruebaRealizada, estadoPrueba, criterioAceptacion, imagenPrueba } = req.body;
    const { id } = req.params; // Recuperamos el id del proyecto desde la URL

    // Validar el token
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validar que el id proporcionado corresponda a un proyecto válido
        const [project] = await db.query('SELECT proyecto_id FROM proyectos WHERE proyecto_id = ?', [id]);

        if (project.length === 0) {
            return res.status(404).json({ msg: 'Proyecto no encontrado' });
        }

        // Si se proporciona un nuevo estado para el hito y no está vacío, actualiza el estado
        if (estadonuevoHito && estadonuevoHito.trim()) { // Verifica que no esté vacío
            const updateHitoQuery = `
            UPDATE hitos 
            SET estado = ? 
            WHERE id_hito = ? AND id_proyecto = ?
        `;

            const [updateResult] = await db.query(updateHitoQuery, [estadonuevoHito, hitoSeleccionado, id]);

            if (updateResult.affectedRows === 0) {
                return res.status(404).json({ msg: 'Hito no encontrado o no pertenece al proyecto' });
            }
        }

        // Insertar el plan de prueba
        const insertQuery = `
        INSERT INTO planPruebas 
        (hito_seleccionado, resultado_esperado, prueba_realizada, estado_prueba, criterio_aceptacion, imagen_prueba, id_proyecto, fecha_creacion, fecha_actualizacion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

        // Si la imagen fue proporcionada, la almacenamos en la base de datos
        const imagen = imagenPrueba || null; // Asumiendo que ya se recibe la imagen en base64 desde el cliente

        const [result] = await db.query(insertQuery, [
            hitoSeleccionado,
            resultadoEsperado,
            pruebaRealizada,
            estadoPrueba,
            criterioAceptacion,
            imagen,
            id
        ]);

        // Respuesta exitosa
        return res.status(201).json({ msg: 'Plan de prueba creado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al registrar el plan de prueba' });
    }

};


// Controlador para recuperar las pruebas por hitos
exports.getPruebasHitos = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar

    try {
        // Consulta para verificar si el usuario existe
        const [hitos] = await db.query('SELECT id_hito, nombre_hito, descripcion FROM hitos WHERE id_proyecto = ?', [id]);

        if (hitos.length === 0) {
            return res.status(404).json({ msg: 'No existen hitos para el proyecto' });
        }
        // Enviar respuesta de éxito
        res.json(hitos); // Retorna solo el primer (y único) resultado de la consulta

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor al consultar hitos' });
    }
};


// Controlador para recuperar las pruebas por hitos
exports.getPruebas = async (req, res) => {
    const { id, hitoSeleccionado} = req.params; // ID del usuario a recuperar

    try {
        // Consulta para verificar si el usuario existe
        const [hitos] = await db.query('SELECT p.id_plan, p.hito_seleccionado, p.resultado_esperado, p.prueba_realizada, p.estado_prueba, p.criterio_aceptacion, p.imagen_prueba,  p.fecha_creacion,  p.fecha_actualizacion, h.nombre_hito FROM planPruebas p  JOIN hitos h ON p.hito_seleccionado =  h.id_hito WHERE p.id_proyecto = ? and p.hito_seleccionado = ?', [id, hitoSeleccionado]);

        if (hitos.length === 0) {
            return res.status(404).json({ msg: 'No existen hitos para el proyecto' });
        }
        // Enviar respuesta de éxito
        res.json(hitos); // Retorna solo el primer (y único) resultado de la consulta

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor al consultar hitos' });
    }
};


exports.putHito = async (req, res) => {
    const { hitoSeleccionado } = req.params; // ID del hito a recuperar y actualizar
    const nuevoValor = 'Completado'

    try {
        // Verificar si el hito existe
        const [hitos] = await db.query('SELECT id_hito FROM hitos WHERE id_hito = ?', [hitoSeleccionado]);

        if (hitos.length === 0) {
            // Si no existe el hito, devolver un mensaje de error
            return res.status(404).json({ msg: 'El hito a finalizar no existe' });
        }

        // Si el hito existe, proceder a actualizarlo
        await db.query('UPDATE hitos SET estado = ? WHERE id_hito = ?', [nuevoValor, hitoSeleccionado]);

        // Responder con el hito actualizado
        res.json({ msg: 'Hito actualizado correctamente' });

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor al consultar y actualizar hitos' });
    }
};



// Controlador para seleccionar datos de un solo usaurio
exports.getPruebaTest = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar

    try {
        // Consulta para verificar si el usuario existe
        const [pruebas] = await db.query('SELECT id_plan, hito_seleccionado, resultado_esperado, prueba_realizada, estado_prueba, criterio_aceptacion, imagen_prueba  FROM planPruebas WHERE id_plan = ?', [id]);

        if (pruebas.length === 0) {
            return res.status(404).json({ msg: 'La prueba no existe' });
        }
        // Enviar respuesta de éxito
        res.json(pruebas[0]); // Retorna solo el primer (y único) resultado de la consulta

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor al consultar la prueba' });
    }
};

exports.updatePlanDePrueba = async (req, res) => {
    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { resultadoEsperado, pruebaRealizada, estadoPrueba, criterioAceptacion, imagenPrueba } = req.body;
    const { prueba } = req.params; // Recuperamos el id del proyecto y el id del plan de prueba desde la URL

    // Validar el token
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validar que el id proporcionado corresponda a un proyecto válido
        const [project] = await db.query('SELECT id_plan FROM planPruebas WHERE id_plan = ?', [prueba]);

        if (project.length === 0) {
            return res.status(404).json({ msg: 'Prueba no encontrada' });
        }

        // Actualizar el plan de prueba
        const updateQuery = `
        UPDATE planPruebas 
        SET 
            resultado_esperado = ?, 
            prueba_realizada = ?, 
            estado_prueba = ?, 
            criterio_aceptacion = ?, 
            imagen_prueba = ?, 
            fecha_actualizacion = NOW() 
        WHERE id_plan = ?
    `;

        // Si la imagen fue proporcionada, la almacenamos en la base de datos
        const imagen = imagenPrueba || null; // Asumiendo que ya se recibe la imagen en base64 desde el cliente

        const [result] = await db.query(updateQuery, [
            resultadoEsperado,
            pruebaRealizada,
            estadoPrueba,
            criterioAceptacion,
            imagen,
            prueba,
        ]);

        // Verificar si realmente se actualizó algo
        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'No se pudo actualizar el plan de prueba' });
        }

        // Respuesta exitosa
        return res.status(200).json({ msg: 'Plan de prueba actualizado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al actualizar el plan de prueba' });
    }
};


// Controlador para eliminar un proyecto
exports.deletePrueba = async (req, res) => {
    const { pruebaSeleccionada } = req.params;

    try {
        // Eliminar el rol
        const [deleteResult] = await db.query('DELETE FROM planPruebas WHERE id_plan = ?', [pruebaSeleccionada]);

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ msg: 'La prueba no existe' });
        }

        return res.status(200).json({ msg: 'Prueba eliminada correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al eliminar la prueba' });
    }
};