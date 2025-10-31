/**
 * NOTA: Tu package.json usa "type": "module".
 * Por lo tanto, DEBES usar la sintaxis 'import' y 'export' (ES Modules),
 * no 'require' y 'module.exports' (CommonJS).
*/
import sql from 'mssql';

// Configuración de la base de datos (basada en tu web.config)
const config = {
    // --- CORRECCIÓN N° 4 ---
    // Si SQL Browser no inicia, asignamos un puerto estático (1433)
    // a SQL Server Express y se lo decimos a Node.js.
    //
    // 1. Usa 'localhost' que es más fiable que el nombre de la máquina.
    // 2. Especifica el puerto 1433.
    // 3. Ya NO necesitas 'instanceName' porque el puerto es explícito.
server: 'localhost', // Cambiado de 'ISKAEL2002'
database: 'MES',
    port: 1433, // Añadido el puerto estático
trustedConnection: true,
    connectionTimeout: 30000,
options: {
 encrypt: false,
trustServerCertificate: true,
        // instanceName: 'SQLEXPRESS' // Comentado/Eliminado
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

/**
 * Función para ejecutar queries de forma segura.
 * @param {string} queryString La consulta SELECT generada por el LLM.
// ... (el resto del archivo es idéntico)
*/
export async function executeQuery(queryString) {
 // Validación de seguridad simple: solo permitir 'SELECT'
// Para producción, considera librerías de sanitización más robustas.
if (!queryString.trim().toUpperCase().startsWith('SELECT')) {
 throw new Error("Operación no permitida. Solo se permiten consultas SELECT.");
 }

 const pool = await connectToDatabase();
try {
        console.log(`Ejecutando Query: ${queryString}`); // Añadido para depuración
const result = await pool.request().query(queryString);
 return result.recordset; // Devuelve los registros
 } catch (err) {
 console.error("Error ejecutando el query SQL:", err.message);
throw new Error(`Error en la consulta SQL: ${err.message}`);
}
}

// Exporta sql por si necesitas usar tipos (ej. sql.VarChar)
export { sql };

