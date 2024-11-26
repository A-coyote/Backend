const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tareasController = require('../controllers/tareasController.js');

//Rura para busqueda de roles
router.get('/tarea', tareasController.getTareas);


module.exports = router;
