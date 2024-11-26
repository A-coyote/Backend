// routes/api.js
const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middlewares/auth.js');

// Ejemplo de ruta protegida
router.get('/dashboard/usuarios', authenticateJWT, (req, res) => {
    res.json({ msg: 'Acceso a usuarios permitido', user: req.user });
});

// Aquí puedes agregar más rutas protegidas

module.exports = router;
