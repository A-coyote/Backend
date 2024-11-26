const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const graficaController = require('../controllers/graficaController');

//Rura para busqueda de responsables
router.get('/VencimientoProyecto/:id', graficaController.getVencimientoProyectos);



//Rura para busqueda de responsables
router.get('/EstadoProyectos/:id', graficaController.getEstadoProyectos);

//Rura para busqueda de responsables
router.get('/EstadoPrueba/:id', graficaController.getEstadoPrueba);



module.exports = router;
