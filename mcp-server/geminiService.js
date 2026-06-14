
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

export async function askGemini(prompt, context = "") {
  const fullPrompt = `
Eres un asistente técnico industrial especializado en hardware.

Reglas:
- Usa SOLO la información proporcionada en el contexto si existe
- Si no sabes algo, dilo claramente
- Sé preciso y técnico

Contexto:
${context}

Pregunta:
${prompt}
`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;

  return response.text();
}
