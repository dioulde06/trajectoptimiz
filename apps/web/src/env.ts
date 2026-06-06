import { validateServerEnv } from "@trajectoptimiz/validators";

// Validation au démarrage — l'app refuse de démarrer si une variable manque
export const env = validateServerEnv(process.env);
