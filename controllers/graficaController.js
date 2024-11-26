const jwt = require('jsonwebtoken'); 
const moment = require('moment');
const db = require('../config/db'); // Asegúrate de que la configuración de la base de datos esté correctamente importada

exports.getVencimientoProyectos = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar
    const token = req.header('x-auth-token');
    
    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que el rol del usuario esté presente y sea válido
        if (!decoded.user.rol) {
            return res.status(403).json({ msg: 'Rol no válido en el token' });
        }

        // Obtener fechas de filtrado de la query (si las hay)
        const { startDate, endDate } = req.query; // startDate y endDate vienen en el query string

        // Convertir las fechas a formato Date (si existen)
        let fechaInicio = startDate ? new Date(startDate) : null;
        let fechaFin = endDate ? new Date(endDate) : null;

        // Variable para almacenar los proyectos a consultar
        let proyectos;

        // Verificar el rol del usuario y hacer la consulta respectiva
        let query = 'SELECT fecha_finalizacion, nombre FROM proyectos';
        let params = [];

        // Filtrar por usuario y fechas si es necesario
        if (decoded.user.rol === 1) {
            // Si es administrador, consultar todos los proyectos
            if (fechaInicio && fechaFin) {
                query += ' WHERE (fecha_finalizacion BETWEEN ? AND ?)';
                params.push(fechaInicio, fechaFin);
            }
        } else {
            // Si no es administrador, consultar solo los proyectos asignados al usuario
            if (!id) {
                return res.status(400).json({ msg: 'ID de usuario no proporcionado' });
            }
            query += ' WHERE id_responsable = ?';
            params.push(id);

            // Agregar el filtro por fechas si se proporcionan
            if (fechaInicio && fechaFin) {
                query += ' AND (fecha_finalizacion BETWEEN ? AND ?)';
                params.push(fechaInicio, fechaFin);
            }
        }

        // Ejecutar la consulta con los filtros
        [proyectos] = await db.query(query, params);

        // Validar si hay proyectos disponibles
        if (!proyectos || proyectos.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron proyectos' });
        }

        const currentDate = moment(); // Fecha actual
        let vencidos = [];
        let noVencidos = [];

        // Clasificar los proyectos como vencidos o no vencidos
        proyectos.forEach(proyecto => {
            const fechaFinalizacion = moment(proyecto.fecha_finalizacion); // Convertir la fecha de finalización del proyecto a un objeto moment

            if (fechaFinalizacion.isBefore(currentDate, 'day')) {
                vencidos.push(proyecto.nombre); // Si la fecha de finalización es antes de la fecha actual, agregarlo a vencidos
            } else {
                noVencidos.push(proyecto.nombre); // Si la fecha de finalización es posterior, agregarlo a no vencidos
            }
        });

        // Preparar los datos para la respuesta
        const labels = ['Vencidos', 'No Vencidos']; // Categorías
        const datasets = [{
            label: 'Proyectos',
            data: [vencidos.length, noVencidos.length], // Cantidades de proyectos vencidos y no vencidos
            backgroundColor: ['red', 'green'], // Colores para los gráficos: rojo para vencidos, verde para no vencidos
        }];

        // Responder con los datos procesados
        return res.json({
            labels,
            datasets,
            vencidos: vencidos.length, // Cantidad de proyectos vencidos
            noVencidos: noVencidos.length, // Cantidad de proyectos no vencidos
            vencidosNombres: vencidos, // Nombres de los proyectos vencidos
            noVencidosNombres: noVencidos // Nombres de los proyectos no vencidos
        });

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};


exports.getEstadoProyectos = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar
    const token = req.header('x-auth-token');
    
    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que el rol del usuario esté presente y sea válido
        if (!decoded.user.rol) {
            return res.status(403).json({ msg: 'Rol no válido en el token' });
        }

        // Obtener fechas de filtrado de la query (si las hay)
        const { startDate, endDate } = req.query; // startDate y endDate vienen en el query string

        // Convertir las fechas a formato Date (si existen)
        let fechaInicio = startDate ? new Date(startDate) : null;
        let fechaFin = endDate ? new Date(endDate) : null;

        // Variable para almacenar los proyectos a consultar
        let proyectos;

        // Verificar el rol del usuario y hacer la consulta respectiva
        let query = 'SELECT estado, fecha_inicio, fecha_finalizacion FROM proyectos';
        let params = [];

        // Filtrar por usuario y fechas si es necesario
        if (decoded.user.rol === 1) {
            // Si es administrador, consultar todos los proyectos
            if (fechaInicio && fechaFin) {
                query += ' WHERE (fecha_inicio BETWEEN ? AND ?) OR (fecha_finalizacion BETWEEN ? AND ?)';
                params.push(fechaInicio, fechaFin, fechaInicio, fechaFin);
            }
        } else {
            // Si no es administrador, consultar solo los proyectos asignados al usuario
            if (!id) {
                return res.status(400).json({ msg: 'ID de usuario no proporcionado' });
            }
            query += ' WHERE id_responsable = ?';
            params.push(id);

            // Agregar el filtro por fechas si se proporcionan
            if (fechaInicio && fechaFin) {
                query += ' AND ((fecha_inicio BETWEEN ? AND ?) OR (fecha_finalizacion BETWEEN ? AND ?))';
                params.push(fechaInicio, fechaFin, fechaInicio, fechaFin);
            }
        }

        // Ejecutar la consulta con los filtros
        [proyectos] = await db.query(query, params);

        // Validar si hay proyectos disponibles
        if (!proyectos || proyectos.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron proyectos' });
        }

        // Inicializar contadores por estado
        let estadoProyectos = {
            enProgreso: 0,
            finalizados: 0,
            suspendidos: 0,
        };

        // Clasificar los proyectos por estado
        proyectos.forEach(proyecto => {
            const estado = proyecto.estado; // estado del proyecto (en progreso, finalizado, suspendido)

            if (estado === 'En progreso') {
                estadoProyectos.enProgreso++;
            } else if (estado === 'Finalizado') {
                estadoProyectos.finalizados++;
            } else if (estado === 'Suspendido') {
                estadoProyectos.suspendidos++;
            }
        });

        // Preparar los datos para la respuesta
        const labels = ['En progreso', 'Finalizado', 'Suspendido']; // Categorías
        const datasets = [{
            label: 'Cantidad de Proyectos',
            data: [estadoProyectos.enProgreso, estadoProyectos.finalizados, estadoProyectos.suspendidos], // Cantidades por estado
            backgroundColor: ['blue', 'green', 'orange'], // Colores: azul (en progreso), verde (finalizado), naranja (suspendido)
        }];

        // Responder con los datos procesados
        return res.json({
            labels,
            datasets,
            estadoProyectos, // Información de cantidad de proyectos por estado
        });

    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};



exports.getEstadoPrueba = async (req, res) => {
    const { id } = req.params; // ID del usuario a recuperar
    const token = req.header('x-auth-token');
    
    // Verificar si el token existe
    if (!token) {
        return res.status(401).json({ msg: 'Token de autenticación no proporcionado' });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar que el rol del usuario esté presente y sea válido
        if (!decoded.user.rol) {
            return res.status(403).json({ msg: 'Rol no válido en el token' });
        }

        // Obtener fechas de filtrado de la query (si las hay)
        const { startDate, endDate } = req.query; // startDate y endDate vienen en el query string

        // Convertir las fechas a formato Date (si existen)
        let fechaInicio = startDate ? new Date(startDate) : null;
        let fechaFin = endDate ? new Date(endDate) : null;

        // Variable para almacenar los proyectos a consultar
        let proyectos;

        // Construir la consulta SQL
        let query = `
            SELECT 
                p.proyecto_id, 
                p.nombre, 
                pp.estado_prueba, 
                COUNT(pp.estado_prueba) AS cantidad
            FROM 
                proyectos p 
            LEFT JOIN 
                planPruebas pp ON p.proyecto_id = pp.id_proyecto
        `;
        
        let params = [];

        // Filtrar por usuario y fechas si es necesario
        if (decoded.user.rol === 1) {
            // Si es administrador, consultar todos los proyectos
            query += ' WHERE 1=1'; // Agregar una condición trivial para facilitar la concatenación
            if (fechaInicio && fechaFin) {
                query += ' AND (fecha_inicio BETWEEN ? AND ?) OR (fecha_finalizacion BETWEEN ? AND ?)';
                params.push(fechaInicio, fechaFin, fechaInicio, fechaFin);
            }
        } else {
            // Si no es administrador, consultar solo los proyectos asignados al usuario
            if (!id) {
                return res.status(400).json({ msg: 'ID de usuario no proporcionado' });
            }
            query += ' WHERE id_responsable = ?';
            params.push(id);

            // Agregar el filtro por fechas si se proporcionan
            if (fechaInicio && fechaFin) {
                query += ' AND ((fecha_inicio BETWEEN ? AND ?) OR (fecha_finalizacion BETWEEN ? AND ?))';
                params.push(fechaInicio, fechaFin, fechaInicio, fechaFin);
            }
        }

        query += ' GROUP BY p.proyecto_id, pp.estado_prueba'; // Agrupar por ID de proyecto y estado de prueba

        // Ejecutar la consulta con los filtros
        [proyectos] = await db.query(query, params);

        // Validar si hay proyectos disponibles
        if (!proyectos || proyectos.length === 0) {
            return res.status(404).json({ msg: 'No se encontraron proyectos' });
        }

        // Inicializar un objeto para almacenar proyectos agrupados
        const proyectosAgrupados = {};

        // Clasificar los proyectos por nombre y estado
        proyectos.forEach(proyecto => {
            const nombre = proyecto.nombre; // nombre del proyecto
            const estado = proyecto.estado_prueba; // estado del proyecto

            // Si el proyecto no existe en el objeto, inicializarlo
            if (!proyectosAgrupados[nombre]) {
                proyectosAgrupados[nombre] = {
                    aprobado: 0,
                    rechazada: 0,
                    pendiente: 0,
                    bloqueado: 0,
                    desconocido: 0,
                    requiereMasPruebas: 0,
                    noAplicable: 0,
                };
            }

            // Incrementar el contador del estado correspondiente
            switch (estado) {
                case 'Aprobado':
                    proyectosAgrupados[nombre].aprobado += proyecto.cantidad;
                    break;
                case 'Rechazada':
                    proyectosAgrupados[nombre].rechazada += proyecto.cantidad;
                    break;
                case 'Pendiente':
                    proyectosAgrupados[nombre].pendiente += proyecto.cantidad;
                    break;
                case 'Bloqueado':
                    proyectosAgrupados[nombre].bloqueado += proyecto.cantidad;
                    break;
                case 'Desconocido':
                    proyectosAgrupados[nombre].desconocido += proyecto.cantidad;
                    break;
                case 'Requiere más pruebas':
                    proyectosAgrupados[nombre].requiereMasPruebas += proyecto.cantidad;
                    break;
                case 'No aplicable':
                    proyectosAgrupados[nombre].noAplicable += proyecto.cantidad;
                    break;
                default:
                    break;
            }
        });

        // Devolver la respuesta con los proyectos agrupados
        return res.status(200).json(proyectosAgrupados);
    } catch (error) {
        return res.status(500).json({ msg: 'Error en el servidor' });
    }
};