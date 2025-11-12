import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


import { generateText } from "./Gemini/gemini.js";
import { executeQuery } from "./db.js";

dotenv.config();

// --- Configuración Inicial ---
const app = express();
const PORT = process.env.PORT || 3000;


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


const SQL_GENERATOR_PROMPT = dbSchemaContext;
// --- FIN DE LA CORRECCIÓN ---


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


 const firstPassResponse = await generateText(userPrompt, {
 systemPrompt: SQL_GENERATOR_PROMPT, // Ahora contiene tus 14,000 palabras
 model: model || "gemini-2.5-flash-preview-09-2025",
 temperature: 0.1, // Muy baja temperatura para precisión en SQL
 maxOutputTokens: 1024, // Aumentado por si el query es largo
});

 const trimmedResponse = firstPassResponse.trim().replace(/^```sql|```$/g, "").trim(); // Limpiamos ```sql

// --- PASO 2: Ejecutar lógica basada en la respuesta del LLM ---

 if (trimmedResponse.toUpperCase() === 'NO_SQL') {

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


 try {
 dbData = await executeQuery(sqlQuery);
} catch (err) {
console.error("Error en executeQuery:", err);
 dbError = err.message;
 }

s
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

 console.warn("Respuesta inesperada del LLM (Paso 1):", trimmedResponse);

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

