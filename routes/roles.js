const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/rolesController.js');

// Ruta para crear un nuevo rol
router.post(
    '/register',
    [
        check('rolName', 'El nombre del rol es obligatorio').not().isEmpty(),
        check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    ],authController.register
);

// Ruta para editar un rol
router.put(
    '/rol/:id',
    [
        check('rolName', 'El nombre del rol es obligatorio').not().isEmpty(),
        check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    ],
    authController.editRol
);


//Rura para busqueda de roles
router.get('/rol', authController.getRoles);

// Ruta para eliminar un rol
router.delete('/roldelete/:id', authController.deleteRol);

//Ruta para obtener rol a editar 
router.get('/roledit/:id', authController.getRolEdit);


module.exports = router;
