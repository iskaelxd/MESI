import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";


export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY en variables de entorno");
  }

  return new GoogleGenAI(apiKey);
}


export async function generateText(userPrompt, options = {}) {
  const ai = getGeminiClient();

  const modelName = options.model || "gemini-2.5-flash-preview-09-2025";
  

  const systemInstruction = options.systemPrompt || "Eres un asistente útil.";


  const combinedPrompt = `${systemInstruction}

--- PREGUNTA DEL USUARIO ---
${userPrompt}`;

  const requestPayload = {
    model: modelName,
    

    contents: [
      {
        role: "user",
        parts: [{ text: combinedPrompt }],
      },
    ],


    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
    },

í
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
         throw err; 
    }
    
    throw new Error(`Error al generar contenido: ${err.message}`);
  }
}

