// Backend/server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import { generateText } from "./Gemini/gemini.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("¡Hola desde el backend!");
});

app.post("/ai/complete", async (req, res) => {
  try {
    const { prompt, model, temperature, maxOutputTokens } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Falta 'prompt' (string) en el body" });
    }

    const text = await generateText(prompt, {
      model,
      temperature,
      maxOutputTokens,
    });

    return res.json({ text, model: model || "gemini-2.5-flash" });
  } catch (err) {
    console.error("Error /ai/complete:", err);
    const message =
      (err?.message || "Error interno").toLowerCase().includes("apikey")
        ? "Configuración de API Key inválida o ausente"
        : err?.message || "Error interno en la generación";

    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});