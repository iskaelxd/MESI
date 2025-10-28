//Backend/Gemini/gemini.js


import { GoogleGenAI } from "@google/genai";



// Instancia del cliente leyendo la API key del entorno
export function getGeminiClient() {
const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en variables de entorno");
  }
  return new GoogleGenAI({ apiKey });
}


export async function generateText(userPrompt, options = {}) {
  const ai = getGeminiClient();

  const systemPrompt =
    options.systemPrompt ||
    process.env.AGENT_SYSTEM_PROMPT ||
    "Eres un asistente útil. Responde claro y con pasos.";

  const model = options.model || "gemini-2.5-flash";

  // Para @google/genai, puedes inyectar el system prompt en contents
  // al inicio y luego el del usuario. (Algunas versiones soportan systemInstruction,
  // pero este método funciona de forma universal).
  const contents = [
    // prompt oculto (no lo envíes al cliente ni lo logs)
    {
      role: "user",
      parts: [{ text: `### SYSTEM (oculto)\n${systemPrompt}` }],
    },
    // prompt del usuario
    {
      role: "user",
      parts: [{ text: userPrompt }],
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 512,
    },
    // safetySettings: [...], // si lo necesitas
  });

  const text =
    response?.text ??
    response?.output_text ??
    response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ??
    "";

  return text.trim();
}
