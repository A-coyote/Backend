const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const hitosController = require('../controllers/hitosController');

//Rura para busqueda de responsables
router.get('/proyecto/:id', hitosController.getProyecto);

// Ruta para registrar un nuevo hito
router.post('/register', [
    // Validaciones existentes
    check('titulo', 'El nombre del hito es obligatorio').not().isEmpty(),
    check('fechaInicio', 'La fecha de inicio es obligatoria y debe ser una fecha válida').not().isEmpty().isDate(),
    check('fechaFin', 'La fecha de fin es obligatoria y debe ser una fecha válida').not().isEmpty().isDate(),
    check('estado', 'El estado es obligatorio y debe ser uno de los siguientes: Pendiente, En progreso, Completado')
        .not().isEmpty()
        .isIn(['Pendiente', 'En progreso', 'Completado']),
    // Validación para proyectoId
    check('proyectoId', 'El proyectoId es obligatorio').not().isEmpty().isInt(),
], hitosController.crearHito);


//Rura para busqueda de responsables
router.get('/hito/:id', hitosController.getHitos);

//Rura para busqueda de hito a editar
router.get('/EditarHito/:id', hitosController.getHito);

// Ruta para editar un hito
router.put('/EditHito/:id', [
    // Validaciones existentes
    check('titulo', 'El nombre del hito es obligatorio').not().isEmpty(),
    check('fechaInicio', 'La fecha de inicio es obligatoria y debe ser una fecha válida').not().isEmpty().isDate(),
    check('fechaFin', 'La fecha de fin es obligatoria y debe ser una fecha válida').not().isEmpty().isDate(),
    check('estado', 'El estado es obligatorio y debe ser uno de los siguientes: Pendiente, En progreso, Completado')
        .not().isEmpty()
        .isIn(['Pendiente', 'En progreso', 'Completado']),
    // Validación para el id_hito en los parámetros de la URL
    check('id', 'El id_hito es obligatorio y debe ser un número entero válido').not().isEmpty().isInt(),
], hitosController.editarHito);

// Ruta para eliminar un hito
router.delete('/EliminarHito/:id', hitosController.eliminarHito);


module.exports = router;
