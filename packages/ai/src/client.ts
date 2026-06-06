import Anthropic from "@anthropic-ai/sdk";
import "./env"; // Déclenche la validation de ANTHROPIC_API_KEY

// Instance singleton du client Anthropic
// Lit ANTHROPIC_API_KEY depuis process.env automatiquement
export const anthropic = new Anthropic();
