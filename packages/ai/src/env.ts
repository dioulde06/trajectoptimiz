import { validateServerEnv } from "@trajectoptimiz/validators";

// Validation au chargement du module — fail-fast si ANTHROPIC_API_KEY manque
export const env = validateServerEnv(process.env);
