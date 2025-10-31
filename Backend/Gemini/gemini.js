import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

/**
 * Obtiene una instancia del cliente de Gemini (SDK v1.x).
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en variables de entorno");
  }
  // CORRECCIÓN: Usamos GoogleGenAI (singular) como en tu versión
  return new GoogleGenAI(apiKey);
}

/**
 * Genera texto usando el LLM con un prompt de sistema.
 * @param {string} userPrompt El prompt del usuario.
 */
export async function generateText(userPrompt, options = {}) {
  const ai = getGeminiClient();

  const modelName = options.model || "gemini-2.5-flash-preview-09-2025";
  
  // --- INICIO DE LA CORRECCIÓN N° 5 ---
  // El log 'Respuesta inesperada' prueba que el 'systemInstruction' separado 
  // está siendo ignorado por esta versión/método (ai.models.generateContent).
  //
  // SOLUCIÓN: Vamos a "hornear" las instrucciones del sistema DENTRO del
  // prompt del usuario, en lugar de pasarlo como un campo separado.

  // 1. Obtenemos las instrucciones del sistema (o un default)
  const systemInstruction = options.systemPrompt || "Eres un asistente útil.";

  // 2. Creamos un ÚNICO prompt que el modelo no pueda ignorar.
  const combinedPrompt = `${systemInstruction}

--- PREGUNTA DEL USUARIO ---
${userPrompt}`;

  const requestPayload = {
    model: modelName,
    
    // 3. ELIMINAMOS 'systemInstruction' de aquí, ya no es necesario.
    /*
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
    */

    // 4. Pasamos el prompt combinado como el contenido principal del usuario
    contents: [
      {
        role: "user",
        parts: [{ text: combinedPrompt }],
      },
    ],

    // 5. 'generationConfig' va aquí
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },

    // 6. 'safetySettings' va aquí
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  };
  // --- FIN DE LA CORRECCIÓN N° 5 ---

  try {
    const result = await ai.models.generateContent(requestPayload);
    
    if (result && result.candidates && result.candidates[0] &&
        result.candidates[0].content && 
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts[0] &&
        typeof result.candidates[0].content.parts[0].text === 'string'
    ) {
      const text = result.candidates[0].content.parts.map(p => p.text).join("");
      return text.trim();
    } else if (result && result.promptFeedback) { 
       console.error("Feedback del Prompt:", result.promptFeedback);
       throw new Error(`Generación bloqueada. Razón: ${result.promptFeedback.blockReason}`);
    } else {
      console.error("Respuesta inesperada de la API:", result);
       if (result && result.candidates && result.candidates[0]) {
        console.error("Contenido del candidato (para depurar):", result.candidates[0].content);
      }
      throw new Error("No se pudo extraer texto de la respuesta de la API.");
    }

  } catch (err) {
    console.error("Error en la API de Gemini:", err.message);
    
    if (err.message.includes("Generación bloqueada")) {
         throw err; // Re-lanzar el error que ya creamos
    }
    
    throw new Error(`Error al generar contenido: ${err.message}`);
  }
}

