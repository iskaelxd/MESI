
import sql from 'mssql';


const config = {

server: 'localhost', // Cambiado de 'ISKAEL2002'
database: 'Mre',
    port: 1433, // Añadido el puerto estático
trustedConnection: true,
    connectionTimeout: 30000,
options: {
 encrypt: false,
trustServerCertificate: true,
       
 }
};

let pool = null;

/**
 * Conecta a la base de datos y mantiene un pool de conexiones.
 */
// ... (el resto del archivo es idéntico)
export async function connectToDatabase() {
if (pool) {
 return pool; // Retorna el pool si ya existe
}
 try {
 pool = await sql.connect(config);
 console.log('Conexión a la base de datos SQL Server exitosa.');
return pool;
 } catch (err) {
 console.error('Error al conectar a la base de datos:', err);
 // Si la conexión falla, resetea el pool para intentar de nuevo
 pool = null; 
throw err; // Lanza el error para que el servidor lo maneje
 }
}


export async function executeQuery(queryString) {

if (!queryString.trim().toUpperCase().startsWith('SELECT')) {
 throw new Error("Operación no permitida. Solo se permiten consultas SELECT.");
 }

 const pool = await connectToDatabase();
try {
        console.log(`Ejecutando Query: ${queryString}`); 
const result = await pool.request().query(queryString);
 return result.recordset; 
 } catch (err) {
 console.error("Error ejecutando el query SQL:", err.message);
throw new Error(`Error en la consulta SQL: ${err.message}`);
}
}

// Exporta sql por si necesitas usar tipos (ej. sql.VarChar)
export { sql };

