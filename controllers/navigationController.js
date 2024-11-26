const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const { jwtSecret } = require('../config/config');
const { link } = require('../routes/navigation');

// Controlador para registrar un nuevo rol
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { linkName, url, roleID } = req.body;

    try {
        // Verificar si la url ya existe
        db.query('SELECT url FROM navigation WHERE url = ?', [url], async (err, result) => {
            if (err) {
                return res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
            }

            if (result.length > 0) {
                return res.status(400).json({ msg: 'La url ya existe' });
            }

            // Insertar el nuevo rol
            db.query(
                'INSERT INTO navigation (link_name, url, role_id) VALUES (?, ?, ?)',
                [linkName, url, roleID],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ msg: 'Error al registrar la url' });
                    }

                    // Respuesta exitosa
                    return res.status(201).json({ msg: 'Url registrada correctamente', roleId: result.insertId });
                }
            );
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


exports.editNav = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // Obtiene el ID de la navegación
    const { linkName, url, roleID } = req.body;

    try {
        // Verificar si la navegación existe
        db.query('SELECT idNavigation FROM navigation WHERE idNavigation = ?', [id], async (err, result) => {
            if (err) {
                return res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
            }

            if (result.length === 0) {
                return res.status(404).json({ msg: 'URL de navegación no encontrada' });
            }

            // Crear la consulta para actualizar la navegación
            const query = `
                UPDATE navigation 
                SET link_name = ?, url = ?, role_id = ?
                WHERE idNavigation = ?
            `;

            // Ejecutar la consulta
            db.query(query, [linkName, url, roleID, id], (err, result) => {
                if (err) {
                    return res.status(500).json({ msg: 'Error al actualizar la navegación' });
                }

                // Responder con un mensaje de éxito
                res.json({ msg: 'Navegación actualizada correctamente' });
            });
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

/// Controlador para seleccionar los usuarios
exports.getNavigation = async (req, res) => {
    const { search } = req.query;
    // Consulta base
    let query = 'SELECT link_name, url, role_id FROM navigation';
    const params = [];

    // Si se proporciona un término de búsqueda, modificar la consulta
    if (search) {
        query += ' WHERE link_name LIKE ?'; // Añadir espacio antes de WHERE
        params.push(`%${search}%`); // Agrega el término de búsqueda con comodines
    }

    // Ejecutar la consulta
    db.query(query, params, (err, result) => {
        if (err) {
            return res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
        }

        // Devolver los resultados en formato JSON
        res.json(result); // Usar 'result' en lugar de 'results'
    });
};


exports.deleteNavigation = async (req, res) => {
    const { id } = req.params; // Obtener el ID del parámetro de la URL

    try {
        // Verificar si la navegación existe antes de eliminar
        db.query('SELECT idNavigation FROM navigation WHERE idNavigation = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ msg: 'Error en la consulta a la base de datos' });
            }

            if (result.length === 0) {
                return res.status(404).json({ msg: 'Navegación no encontrada' });
            }

            // Si el registro existe, proceder a eliminarlo
            db.query('DELETE FROM navigation WHERE idNavigation = ?', [id], (err, result) => {
                if (err) {
                    return res.status(500).json({ msg: 'Error al eliminar la navegación' });
                }

                // Respuesta exitosa después de la eliminación
                return res.status(200).json({ msg: 'Navegación eliminada correctamente' });
            });
        });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

exports.menus = async (req, res) => {
    const username = req.params.username; 
    const query = `
      SELECT T0.*, 
             CASE 
               WHEN T0.ParentMenuID = 0 THEN T0.MenuID 
               ELSE T0.ParentMenuID 
             END AS Ordenar
      FROM DIG_MENU T0
      INNER JOIN DIG_PERMISOS B ON B.MenuID = T0.MenuID
      INNER JOIN DIG_ROLES R ON R.ROL_ID = B.ROL_ID
      INNER JOIN DIG_ROL_USUARIO D ON D.ROL_ID = R.ROL_ID
      WHERE D.USUARIO = ?
      	AND T0.VisibleUsuario = 1
      ORDER BY Ordenar ASC, T0.OrderNumber ASC, T0.MenuID ASC;
    `;
  
    try {
        const [rows] = await db.query(query, [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No menus found for this user' });
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu', error: error.message });
    }
};

exports.getMenus = async (req, res) => {
    const username = req.params.username; 
    const query = `
      SELECT 
    CASE 
        WHEN ParentMenuID = 0 THEN 'Menu'
        WHEN Accion IN (1, 2) THEN 'Sub-submenu'
        ELSE 'Submenu'
    END AS TipoMenu,
    MenuID,
    ParentMenuID,
    DisplayName,
    Accion
FROM 
    dig_menu
ORDER BY 
    CASE 
        WHEN ParentMenuID = 0 THEN MenuID 
        ELSE ParentMenuID 
    END,
    CASE 
        WHEN ParentMenuID = 0 THEN 0 
        ELSE MenuID 
    END,
    Accion;`
  
    try {
        const [rows] = await db.query(query, [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron los menus' });
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu', error: error.message });
    }
};


exports.registerPermissions = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const { roleId, permissions } = req.body;
  
    if (!roleId || !Array.isArray(permissions)) {
      return res.status(400).json({ msg: "roleId y permissions son requeridos y deben estar en el formato correcto." });
    }
  
    const connection = await db.getConnection();
  
    try {
      await connection.beginTransaction();
  
      // Verificar si el rol existe
      const [roleExists] = await connection.query('SELECT ROL_ID FROM DIG_ROLES WHERE ROL_ID = ?', [roleId]);
      if (!roleExists.length) {
        await connection.rollback();
        return res.status(400).json({ msg: `El rol con ID ${roleId} no existe.` });
      }
  
      // Eliminar permisos existentes para este rol
      await connection.query('DELETE FROM dig_permisos WHERE ROL_ID = ?', [roleId]);
  
      // Insertar los nuevos permisos
      for (const permission of permissions) {
        const { menuId } = permission;
        await connection.query('INSERT INTO DIG_PERMISOS (ROL_ID, MenuID) VALUES (?, ?)', [roleId, menuId]);
      }
  
      await connection.commit();
      res.status(201).json({ msg: 'Permisos registrados correctamente.' });
    } catch (error) {
      await connection.rollback();
      res.status(500).json({ msg: 'Error al registrar permisos.' });
    } finally {
      connection.release();
    }
  };
  



