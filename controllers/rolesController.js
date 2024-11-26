const { validationResult } = require('express-validator');
const db = require('../config/db');
const jwt = require('jsonwebtoken'); // Asegúrate de tener jwt instalado

// Controlador para registrar un nuevo rol
exports.register = async (req, res) => {
    // Validar entradas
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rolName, descripcion } = req.body;
    
    // Extraer el token del encabezado de la solicitud
    const token = req.header('x-auth-token'); // El token enviado en los headers

    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar token con tu clave secreta

        // Extraer el username o id del usuario del payload del token
        const { username } = decoded.user;

        // Verificar si el rol ya existe en la base de datos
        const [existingRole] = await db.query('SELECT NOMBRE FROM DIG_ROLES WHERE NOMBRE = ?', [rolName]);
        if (existingRole.length > 0) {
            return res.status(400).json({ msg: 'El rol ya existe' });
        }

        // Insertar el nuevo rol en la base de datos
        const [result] = await db.query(
            'INSERT INTO DIG_ROLES (NOMBRE, DESCRIPCION, FECHA_CREACION, USUARIO_CREA) VALUES (?, ?, NOW(), ?)',
            [rolName, descripcion, username]
        );

        // Respuesta exitosa
        return res.status(201).json({ msg: 'Rol registrado correctamente' });
        
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al registrar el rol' });
    }
}


// Controlador para editar los roles
exports.editRol = async (req, res) => {
    const errors = validationResult(req);  // Validar entradas si se usa express-validator
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { rolName, descripcion } = req.body;

    try {
        // Verificar si el rol existe
        const [role] = await db.query('SELECT ROL_ID FROM DIG_ROLES WHERE ROL_ID = ?', [id]);
        if (role.length === 0) {
            return res.status(404).json({ msg: 'Rol no encontrado' });
        }

        // Actualizar el rol
        const [result] = await db.query(
            'UPDATE DIG_ROLES SET NOMBRE = ?, DESCRIPCION = ? WHERE ROL_ID = ?',
            [rolName, descripcion, id]
        );

        // Responder con un mensaje de éxito
        return res.status(200).json({ msg: 'Rol actualizado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al actualizar el rol' });
    }
};

// Controlador para obtener los roles
exports.getRoles = async (req, res) => {
    const { search } = req.query;  // Obtener el parámetro de búsqueda (si existe)
    
    try {
        let query = 'SELECT ROL_ID, NOMBRE, DESCRIPCION, FECHA_CREACION, USUARIO_CREA FROM dig_roles';
        const params = [];

        if (search) {
            query += ' WHERE NOMBRE LIKE ?';
            params.push(`%${search}%`);
        }
        query += ' ORDER BY ROL_ID DESC';  // Asegurar que siempre se ordena por id en orden descendente

        const [rows] = await db.query(query, params);

        // Formatear las fechas antes de devolver los resultados
        const formattedRows = rows.map(role => {
            const formattedDate = new Date(role.FECHA_CREACION);
            const day = String(formattedDate.getDate()).padStart(2, '0');
            const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
            const year = formattedDate.getFullYear();
            const hours = String(formattedDate.getHours()).padStart(2, '0');
            const minutes = String(formattedDate.getMinutes()).padStart(2, '0');
            const seconds = String(formattedDate.getSeconds()).padStart(2, '0');
            
            // Formato dd/mm/yyyy HH:MM:SS
            const formattedFecha = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            
            return { ...role, FECHA_CREACION: formattedFecha };
        });

        res.json(formattedRows);
    } catch (err) {
        res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
    }
};


// Controlador para eliminar un rol
exports.deleteRol = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar si el rol tiene usuarios asociados
        const [userCountResult] = await db.query('SELECT COUNT(*) AS userCount FROM users WHERE u_rolId = ?', [id]);
        const userCount = userCountResult[0].userCount;

        // Verificar si el rol tiene navegación asociada
        const [navCountResult] = await db.query('SELECT COUNT(*) AS navCount FROM navigation WHERE role_id = ?', [id]);
        const navCount = navCountResult[0].navCount;

        // Si hay usuarios o navegación asociada, desactivar el rol
        if (userCount > 0 || navCount > 0) {
            return res.status(404).json({ msg: 'El rol no puede ser eliminado, existen registros asociados al rol, por lo que solo ha sido desactivado' });
        }

        // Eliminar el rol
        const [deleteResult] = await db.query('DELETE FROM dig_roles WHERE ROL_ID = ?', [id]);

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ msg: 'El rol no existe' });
        }

        return res.status(200).json({ msg: 'Rol eliminado correctamente' });
    } catch (err) {
        return res.status(500).json({ msg: 'Error en el servidor al eliminar el rol' });
    }
};


// Controlador para seleccionar datos de un solo usaurio
exports.getRolEdit = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar
    
    try {
        // Consulta para verificar si el usuario existe
        const [user] = await db.query('SELECT ROL_ID, NOMBRE, DESCRIPCION FROM DIG_ROLES WHERE ROL_ID = ?', [id]);

        if (user.length === 0) {
            return res.status(404).json({ msg: 'Rol no encontrado' });
        }
        // Enviar respuesta de éxito
        res.json(user[0]); // Retorna solo el primer (y único) resultado de la consulta
        
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

