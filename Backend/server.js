import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Tus funciones de Gemini y BD
import { generateText } from "./Gemini/gemini.js";
import { executeQuery } from "./db.js";

dotenv.config();

// --- Configuración Inicial ---
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// --- Carga del Contexto de la Base de Datos ---
let dbSchemaContext = "";
try {
 // Asumimos que contexto.txt está en la misma carpeta 'Backend'
 const contextFilePath = path.join(__dirname, 'contexto.txt');
dbSchemaContext = fs.readFileSync(contextFilePath, 'utf8');
console.log("Contexto 'contexto.txt' cargado exitosamente.");
} catch (err) {
 console.error("¡ERROR! No se pudo leer 'contexto.txt'. El bot no podrá consultar la BD.", err.message);
}

// --- Definición de Prompts del Sistema ---

// --- INICIO DE LA CORRECCIÓN ---
// Tu 'contexto.txt' (cargado en dbSchemaContext) YA CONTIENE
// las instrucciones ("ERES UN AGENTE...", "DEBES PODER RESPONDER CON UNA CONSULTA SQL...").
// No necesitamos envolverlo en MÁS instrucciones.
// Simplemente usamos el contenido del archivo como el prompt.
const SQL_GENERATOR_PROMPT = dbSchemaContext;
// --- FIN DE LA CORRECCIÓN ---


// 2. Prompt para el Paso 3: Sintetizar la respuesta final
// (Este prompt SÍ lo definimos aquí, porque no está en tu contexto.txt)
const ANSWER_SYNTHESIZER_PROMPT = `
Eres un asistente de servicio al cliente amigable y servicial llamado MESI.
Tu tarea es responder la pregunta original del usuario en lenguaje natural.
Utiliza los datos (en formato JSON) que te proporciono para formular tu respuesta.

Reglas:
1. Sé claro y conciso.
2. No menciones que estás usando "JSON" o una "base de datos". Simplemente presenta la información.
3. Si los datos están vacíos (ej: "[]"), informa al usuario amablemente que no se encontraron resultados para su consulta.
4. Si los datos contienen un error (ej: '{"error":"...DESC..."}'), pide disculpas e informa que hubo un problema al buscar la información. NO muestres el error de SQL.
5. Tu nombre es MESI.
`;

// --- Endpoint Principal de la IA ---

app.post("/ai/complete", async (req, res) => {
 try {
const { prompt: userPrompt, model, temperature, maxOutputTokens } = req.body || {};
if (!userPrompt || typeof userPrompt !== 'string') {return res.status(400).json({ error: "Falta 'prompt' (string) en el body" });
 }

 // --- PASO 1: Generar SQL o clasificar como "NO_SQL" ---
       // Aquí le pasamos tu contexto.txt COMPLETO como systemPrompt.
 const firstPassResponse = await generateText(userPrompt, {
 systemPrompt: SQL_GENERATOR_PROMPT, // Ahora contiene tus 14,000 palabras
 model: model || "gemini-2.5-flash-preview-09-2025",
 temperature: 0.1, // Muy baja temperatura para precisión en SQL
 maxOutputTokens: 1024, // Aumentado por si el query es largo
});

 const trimmedResponse = firstPassResponse.trim().replace(/^```sql|```$/g, "").trim(); // Limpiamos ```sql

// --- PASO 2: Ejecutar lógica basada en la respuesta del LLM ---

 if (trimmedResponse.toUpperCase() === 'NO_SQL') {
 // Es una pregunta general.
            // Aquí SÍ usamos el AGENT_SYSTEM_PROMPT del .env, o el de síntesis.
 const generalSystemPrompt = process.env.AGENT_SYSTEM_PROMPT || ANSWER_SYNTHESIZER_PROMPT;

 const generalAnswer = await generateText(userPrompt, {
 systemPrompt: generalSystemPrompt,
 model: model || "gemini-2.5-flash-preview-09-2025",
temperature: temperature ?? 0.7,
 maxOutputTokens: maxOutputTokens ?? 512,
 });

return res.json({ 
text: generalAnswer, 
source: "general_chat" 
 });

} else if (trimmedResponse.toUpperCase().startsWith('SELECT')) {
// ¡Tenemos un query SQL!
const sqlQuery = trimmedResponse;
let dbData = null;
let dbError = null;

// --- PASO 2b: Ejecutar el query en la BD ---
 try {
 dbData = await executeQuery(sqlQuery);
} catch (err) {
console.error("Error en executeQuery:", err);
 dbError = err.message;
 }

 // --- PASO 3: Sintetizar la respuesta final ---
 // Creamos un nuevo "user prompt" para el LLM de síntesis
const synthesisUserPrompt = `
 Pregunta Original del Usuario:
 "${userPrompt}"

Datos de la Base de Datos (JSON):
 ${dbError ? `{ "error": "${dbError.replace(/"/g, "'")}" }` : JSON.stringify(dbData)}
 
Por favor, genera una respuesta amigable para el usuario basada en estos datos.
`;

const finalAnswer = await generateText(synthesisUserPrompt, {
 systemPrompt: ANSWER_SYNTHESIZER_PROMPT,
model: model || "gemini-2.5-flash-preview-09-2025",
temperature: temperature ?? 0.7,
 maxOutputTokens: maxOutputTokens ?? 512,
 });

 return res.json({ 
text: finalAnswer, 
source: "database",
generatedQuery: sqlQuery // Opcional: para debugging
});

} else {
  // El LLM devolvió algo inesperado (ni SQL ni NO_SQL)
 console.warn("Respuesta inesperada del LLM (Paso 1):", trimmedResponse);
// ... pero podría ser una respuesta general si el prompt falló.
            // Devolvamos esto al usuario por ahora para ver qué es.
return res.json({ 
                text: trimmedResponse, 
                source: "unexpected_passthrough" 
            });
 }

 } catch (err) {
console.error("Error en /ai/complete:", err);
 const message = err.message || "Error interno en la generación";
 return res.status(500).json({ error: message });
 }
});


app.get("/", (req, res) => {
 res.send("¡El backend del Chatbot RAG-SQL está funcionando!");
});

app.listen(PORT, () => {
 console.log(`Servidor corriendo en http://localhost:${PORT}`);
if (!dbSchemaContext) {
 console.warn("ADVERTENCIA: El servidor inició, pero 'contexto.txt' no se cargó. Las consultas a la BD fallarán.");
 }
});

