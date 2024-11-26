const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const pruebasController = require('../controllers/pruebasController');

//Rura para busqueda de responsables
router.get('/hitos/:id', pruebasController.getHItos);

// Asumiendo que el ID se pasa como parte de la URL:
router.post('/registerPrueba/:id', [
    // Validaciones para los campos del plan de prueba
    check('hitoSeleccionado', 'El hito seleccionado es obligatorio').not().isEmpty(),
    check('estadonuevoHito', 'Cambia el estado del hito: Finalizado si es el unico caso a trabajar de lo contrario En Proceso')
    .isIn(['En progreso','Completado']),
    check('resultadoEsperado', 'El resultado esperado es obligatorio').not().isEmpty(),
    check('pruebaRealizada', 'La prueba realizada es obligatoria').not().isEmpty(),
    check('estadoPrueba', 'El estado de la prueba es obligatorio y debe ser uno de los siguientes: Aprobado, Rechazado, Pendiente, Bloqueado, Desconocido, Requiere más pruebas, No aplicable')
        .not().isEmpty()
        .isIn(['Aprobado','Pendiente', 'Rechazada', 'Pendiente', 'Bloqueado', 'Desconocido', 'Requiere más pruebas', 'No aplicable']),
    check('criterioAceptacion', 'El criterio de aceptación es obligatorio').not().isEmpty(),
    // check('imagenPrueba', 'La imagen de prueba (Base64) es obligatoria').not().isEmpty(),
], pruebasController.registerPlanDePrueba);

//Rura para busqueda de responsables
router.get('/hitosporPruebas/:id', pruebasController.getPruebasHitos);

//Rura para busqueda de responsables
router.get('/casos/:id/:hitoSeleccionado', pruebasController.getPruebas);

//Rura para busqueda de responsables
router.get('/CambioEstadoHito/:hitoSeleccionado', pruebasController.putHito);

//Rura para busqueda de responsables
router.get('/Pruebas/:id', pruebasController.getPruebaTest);


// Asumiendo que el ID se pasa como parte de la URL:
router.put('/updatePlan/:prueba', [
    // Validaciones para los campos del plan de prueba
    check('resultadoEsperado', 'El resultado esperado es obligatorio').not().isEmpty(),
    check('pruebaRealizada', 'La prueba realizada es obligatoria').not().isEmpty(),
    check('estadoPrueba', 'El estado de la prueba es obligatorio y debe ser uno de los siguientes: Aprobado, Rechazado, Pendiente, Bloqueado, Desconocido, Requiere más pruebas, No aplicable')
        .not().isEmpty()
        .isIn(['Aprobado','Pendiente', 'Rechazada', 'Pendiente', 'Bloqueado', 'Desconocido', 'Requiere más pruebas', 'No aplicable']),
    check('criterioAceptacion', 'El criterio de aceptación es obligatorio').not().isEmpty(),
    // check('imagenPrueba', 'La imagen de prueba (Base64) es obligatoria').not().isEmpty(),
], pruebasController.updatePlanDePrueba);


// Ruta para eliminar un rol
router.delete('/pruebaDelete/:pruebaSeleccionada', pruebasController.deletePrueba);


module.exports = router;


