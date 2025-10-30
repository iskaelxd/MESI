//Comentario Valido Conexion BD SQL SERVER


const sql = require('mssql');
const config = {
    user: '',
    password: '',
    server: '',
    database: 'MRO',
    options: {
        encrypt: true, // Usar cifrado si es necesario
        trustServerCertificate: true // Cambiar a true para desarrollo local
    }
};

async function connectToDatabase() {
    try {
        let pool = await sql.connect(config);
        console.log('Conexión a la base de datos exitosa');
        return pool;
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
    }
}

module.exports = {
    sql,
    connectToDatabase
};

