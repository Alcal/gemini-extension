import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askGemini(prompt, context = "") {
  try {
    const fullPrompt = `
Eres un asistente técnico.

Contexto:
${context}

Pregunta:
${prompt}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",  // ✅ correcto
      contents: fullPrompt,
    });

    return result.text;

  } catch (error) {
    console.error("❌ Gemini error:", error);
    return "Error generando respuesta";
  }
}
