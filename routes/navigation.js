const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const navController = require('../controllers/navigationController.js');

// Ruta para crear un nuevo rol
router.post(
    '/register',
    [
        check('linkName', 'El nombre de la ruta obligatorio').not().isEmpty(),
        check('url', 'La url es obligatoria').not().isEmpty(),
        check('roleID','El rol es obligatorio').not().isEmpty().isInt()
    ],
    navController.register
);

//Ruta para editar una URL
router.put(
    '/nav/:id',
    [
        check('linkName', 'El nombre de la ruta obligatorio').not().isEmpty(),
        check('url', 'La url es obligatoria').not().isEmpty(),
        check('roleID','El rol es obligatorio').not().isEmpty().isInt()
    ],
    navController.editNav
);

router.get('/menu', navController.getMenus)

//Rura para busqueda de navegaciones
router.get('/nav', navController.getNavigation);

// Ruta para eliminar un rol
router.delete('/navdelete/:id', navController.deleteNavigation);

// Ruta para obtener el menú
router.get('/menu/:username', navController.menus);

//Para guardar permisos
router.post('/permissions', navController.registerPermissions);


module.exports = router;
