const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const proyectController = require('../controllers/proyectoController.js');

//Rura para busqueda de responsables
router.get('/responsables', proyectController.getResponsable);

// Ruta para crear un nuevo rol
router.post(
    '/register',
    [
        check('nombreProyecto', 'El nombre del rol es obligatorio').not().isEmpty(),
        check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
        check('fechaInicio', 'La fecha es obligatoria').not().isEmpty().isDate(),
        check('fechaFin', 'La fecha es obligatoria').not().isEmpty().isDate(),
        check('presupuesto', 'Debe ser en formato moneda').isDecimal(),
        check('estado', 'El estado es obligatorio').not().isEmpty(),
        check('responsable', 'El responsable es obligatorio').not().isEmpty().isInt(),

    ],proyectController.register
);

//Rura para busqueda de responsables
router.get('/proyectos', proyectController.getProyectos);

// Ruta para eliminar un rol
router.delete('/proyectoDelete/:id', proyectController.deleteProyecto);

//Rura para busqueda de responsables
router.get('/proyecto/:id', proyectController.getProyecto);

// Ruta para editar un rol
router.put(
    '/editProyecto/:id',
    [
        check('nombreProyecto', 'El nombre del rol es obligatorio').not().isEmpty(),
        check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
        check('fechaInicio', 'La fecha es obligatoria').not().isEmpty().isDate(),
        check('fechaFin', 'La fecha es obligatoria').not().isEmpty().isDate(),
        check('presupuesto', 'Debe ser en formato moneda').isDecimal(),
        check('estado', 'El estado es obligatorio').not().isEmpty(),
        check('responsable', 'El responsable es obligatorio').not().isEmpty().isInt(),
    ],
    proyectController.editProyectos
);
module.exports = router;