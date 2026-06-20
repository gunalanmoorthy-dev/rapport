import OpenAI from "openai";

// Reads OPENAI_API_KEY from the environment (loaded from .env.local by Next).
export const openai = new OpenAI();
