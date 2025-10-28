//Funcion para manejar Procedimientos Almacenados en SQL SERVER

const { sql, connectToDatabase } = require('./db');

async function executeStoredProcedure(procedureName, inputParams = {}, outputParams = {}) {
    const pool = await connectToDatabase();
    try {
        const request = pool.request();
        // Agregar parámetros de entrada
        for (const param in inputParams) {
            request.input(param, inputParams[param]);
        }
        // Agregar parámetros de salida
        for (const param in outputParams) {
            request.output(param, outputParams[param]);
        }
        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        console.error(`Error al ejecutar el procedimiento almacenado ${procedureName}:`, err);
        throw err;
    }
}

// Exportar la función para usarla en otros módulos


module.exports = {
    executeStoredProcedure
};


//Funcion para manejar Consultas Directas en SQL SERVER

async function executeQuery(query, params = {}) {
    const pool = await connectToDatabase();
    try {
        const request = pool.request();
        // Agregar parámetros
        for (const param in params) {
            request.input(param, params[param]);
        }
        const result = await request.query(query);
        return result;
    } catch (err) {
        console.error(`Error al ejecutar la consulta:`, err);
        throw err;
    }
}

module.exports = {

    executeQuery
    
};

