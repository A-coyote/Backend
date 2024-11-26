const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey'; // Usa una clave segura desde variables de entorno

// Controlador para desactivar el usuario (poner estado en 0)
exports.deactivateUser = async (req, res) => {
    const { id } = req.params; // ID del usuario a activar/desactivar

    try {
        // Consulta para obtener el estado actual del usuario
        const [user] = await db.query('SELECT u_estado FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Alternar el estado del usuario (si está activo, lo desactivamos; si está desactivado, lo activamos)
        const newStatus = user[0].u_estado === 1 ? 0 : 1;

        // Actualizar el estado del usuario
        const query = 'UPDATE users SET u_estado = ?, u_fechacreacion = NOW() WHERE id = ?';
        const [result] = await db.query(query, [newStatus, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Enviar respuesta de éxito
        res.json({ msg: `Usuario ${newStatus === 1 ? 'activado' : 'desactivado'} correctamente` });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Controlador para editar los usuarios
exports.editUsers = async (req, res) => {
    const { id } = req.params; // Obtiene el ID del usuario de los parámetros de la ruta
    const { nombre, apellido, username, password, estado, rol } = req.body;

    try {
        // Verificar si el usuario existe
        const [userResult] = await db.query('SELECT id, u_password FROM users WHERE id = ?', [id]);
        
        if (userResult.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        const currentPassword = userResult[0].u_password; // Contraseña actual

        // Si se proporciona una nueva contraseña, la encripta
        let hashedPassword = currentPassword; // Inicializa con la contraseña actual

        if (password) {
            // Si hay una nueva contraseña, la encriptamos
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Crear la consulta para actualizar el usuario
        const query = `
            UPDATE users 
            SET u_nombre = ?, u_apellido = ?, u_usuario = ?, u_password = ?, u_estado = ?, u_rolId = ?
            WHERE id = ?
        `;

        // Ejecutar la consulta
        await db.query(query, [nombre, apellido, username, hashedPassword, estado, rol, id]);

        // Crear la consulta para actualizar el rol del usuario en la tabla DIG_ROL_USUARIO
        const query2 = `
            UPDATE DIG_ROL_USUARIO 
            SET USUARIO = ?, ROL_ID = ?
            WHERE ROL_USUARIO_ID = ?
        `;

        // Ejecutar la consulta para actualizar el rol del usuario
        await db.query(query2, [username, rol, id]);

        // Responder con un mensaje de éxito
        res.json({ msg: 'Usuario actualizado correctamente' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


// Controlador para seleccionar los usuarios
exports.getUsers = async (req, res) => {
    const { search } = req.query;
    
    // Consulta base
    let query = 'SELECT id, u_nombre, u_apellido, u_usuario, u_estado, u_fechacreacion FROM users';
    const params = [];

    // Si se proporciona un término de búsqueda, modificar la consulta
    if (search) {
        query += ' WHERE u_usuario LIKE ?';  // Añadir WHERE si hay búsqueda
        params.push(`%${search}%`);          // Añadir el término de búsqueda con comodines
    }

    query += ' ORDER BY id DESC';  // Asegurar que siempre se ordena por id en orden descendente

    try {
        // Ejecutar la consulta
        const [result] = await db.query(query, params);

        // Devolver los resultados en formato JSON
        res.json(result);
    } catch (err) {
        res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
    }
};


// Controlador para registrar un nuevo usuario
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, apellido, username, password, rol } = req.body;

    try {
        // Verificar si el usuario ya existe
        const [userResult] = await db.query('SELECT u_usuario FROM users WHERE u_usuario = ?', [username]);

        if (userResult.length > 0) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar el nuevo usuario
        const [result] = await db.query(
            'INSERT INTO users (u_nombre, u_apellido, u_usuario, u_password, u_fechacreacion, u_rolId) VALUES (?, ?, ?, ?, NOW(), ?)',
            [nombre, apellido, username, hashedPassword, rol]
        );

        // Insertar el nuevo usuario
        const [result2] = await db.query(
            'INSERT INTO DIG_ROL_USUARIO (USUARIO, ROL_ID) VALUES (?, ?)',
            [username, rol]
        );

        // Crear y firmar el JWT
        const payload = {
            user: {
                id: result.insertId,
                username,
            },
        };

        // Firmar el JWT
        jwt.sign(payload, jwtSecret, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                return res.status(500).json({ msg: 'Error al generar el token' });
            }

            res.json({ token });
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// Controlador para login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        // Verificar si el usuario existe
        const query = 'SELECT * FROM users WHERE u_usuario = ?';
        const [result] = await db.query(query, [username]);

        if (result.length === 0 ) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const user = result[0];
        if (user.u_estado !== 1) {
            return res.status(400).json({ msg: 'El usuario se encuentra inactivo' });
        }
        
        // Verificar la contraseña
        const isMatch = await bcrypt.compare(password, user.u_password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        // Crear y firmar el JWT, incluyendo el id y username
        const payload = {
            user: {
                id: user.id,
                username: user.u_usuario,
                rol: user.u_rolId
            },
        };

        // Firmar el JWT
        jwt.sign(payload, jwtSecret, { expiresIn: '1h' }, (err, token) => {
            if (err) {
                return res.status(500).json({ msg: 'Error al generar el token' });
            }
            res.json({ token });
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// autocontroller.js
exports.DeleteUser = async (req, res) => {
    const { id } = req.params; // ID del usuario a eliminar

    try {
        // Consulta para verificar si el usuario existe
        const [user] = await db.query('SELECT id FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Consulta para eliminar el usuario
        const query = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'No se pudo eliminar el usuario' });
        }

        // Enviar respuesta de éxito
        res.json({ msg: 'Usuario eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


// Controlador para seleccionar datos de un solo usaurio
exports.getUsersUnique = async (req, res) => {
    const { id } = req.params; // ID del usuario a eliminar
    
    try {
        // Consulta para verificar si el usuario existe
        const [user] = await db.query('SELECT id, u_nombre, u_apellido, u_usuario, u_estado, u_rolId FROM users WHERE id = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        // Enviar respuesta de éxito
        res.json(user[0]); // Retorna solo el primer (y único) resultado de la consulta
        
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


exports.getRolesUser = async (req, res) => {
    const { userRoleId } = req.params; // ID del rol a buscar

    try {
        // Consulta para verificar si el rol existe
        const [rolUser] = await db.query('SELECT * FROM dig_permisos WHERE ROL_ID = ?', [userRoleId]);

        if (!rolUser || rolUser.length === 0) {
            return res.status(404).json({ msg: 'Rol no encontrado' });
        }

        // Respuesta de éxito con los datos del rol
        return res.status(200).json(rolUser); // Retorna solo el primer resultado, ya que ROL_ID es único
    } catch (err) {
        return res.status(500).json({ msg: 'Error interno del servidor' });
    }
};