import { GoogleGenAI } from "@google/genai";

// Official unified Google Gen AI SDK (@google/genai).
// Reads GEMINI_API_KEY from the environment (loaded from .env.local by Next).
export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
