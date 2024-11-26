const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');

// Definir la ruta para eliminar un usuario
router.delete('/users/delete/:id', authController.DeleteUser);  // Asegúrate de que 'DeleteUser' esté correctamente exportado

// Ruta para desactivar un usuario (estado = 0)
router.put('/users/deactivate/:id', authController.deactivateUser);


// Ruta para editar un usuario
router.put('/users/:id', authController.editUsers);

//Rura para busqueda de usuario
router.get('/users', authController.getUsers);

//Ruta para obtener usuario a editar 
router.get('/usersedit/:id', authController.getUsersUnique);

// Ruta para registrar un nuevo usuario
router.post(
    '/register',
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('apellido', 'El apellido es obligatorio').not().isEmpty(),
        check('username', 'El nombre de usuario es obligatorio').not().isEmpty(),
        check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
        check('rol', 'El rol es obligatorio').isInt(),
    ],
    authController.register
);

// Ruta para iniciar sesión
router.post(
    '/login',
    [
        check('username', 'El nombre de usuario es obligatorio').not().isEmpty(),
        check('password', 'La contraseña es obligatoria').exists(),
    ],
    authController.login
);

// Ruta para recuperar permisos del usuario para las URL's
router.get('/permisosUser/:userRoleId', authController.getRolesUser);


module.exports = router;
