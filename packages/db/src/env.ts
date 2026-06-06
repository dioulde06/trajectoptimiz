import { validateServerEnv } from "@trajectoptimiz/validators";

// Validation au chargement du module — fail-fast si DATABASE_URL manque
export const env = validateServerEnv(process.env);
