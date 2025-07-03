/**
 * Modular API config loader for Cars Bids frontend.
 * Handles both Vite dev server (npm run dev) and Docker/production builds.
 *
 * - In dev: uses import.meta.env.VITE_API_ENDPOINT, VITE_STRIPE_PUBLIC_KEY, VITE_STRIPE_SECRET_KEY
 * - In Docker/prod: uses literal placeholders for runtime env.sh injection
 */

export interface ApiConfig {
  apiUrl: string;
  stripePublicKey: string;
  stripeSecretKey: string;
}

export function loadApiConfig(): ApiConfig {
  // Use consistent variable names - match your environment variables
  const PLACEHOLDER_API_URL = "VITE_API_ENDPOINT";
  const PLACEHOLDER_STRIPE_PUBLIC_KEY = "VITE_STRIPE_PUBLIC_KEY";
  const PLACEHOLDER_STRIPE_SECRET_KEY = "VITE_STRIPE_SECRET_KEY";

  let apiUrl = PLACEHOLDER_API_URL;
  let stripePublicKey = PLACEHOLDER_STRIPE_PUBLIC_KEY;
  let stripeSecretKey = PLACEHOLDER_STRIPE_SECRET_KEY;

  // In dev, use Vite env
  if (import.meta.env.DEV) {
    apiUrl = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000/api";
    stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
    stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || "";
  }

  // Validation: Check if placeholders weren't replaced (still contain double underscores)
  if (!apiUrl || apiUrl.includes("VITE_") || apiUrl === "default") {
    console.error("API URL is not configured or not replaced at runtime.");
    throw new Error("API URL is not configured.");
  }

  if (
    !stripePublicKey ||
    stripePublicKey.includes("VITE_") ||
    stripePublicKey === "default"
  ) {
    console.error(
      "Stripe public key is not configured or not replaced at runtime."
    );
    throw new Error("Stripe public key is not configured.");
  }

  if (
    !stripeSecretKey ||
    stripeSecretKey.includes("VITE_") ||
    stripeSecretKey === "default"
  ) {
    console.error(
      "Stripe secret key is not configured or not replaced at runtime."
    );
    throw new Error("Stripe secret key is not configured.");
  }

  return {
    apiUrl,
    stripePublicKey,
    stripeSecretKey,
  };
}
