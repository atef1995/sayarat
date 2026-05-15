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
  const PLACEHOLDER_API_URL = "__VITE_API_ENDPOINT__";
  const PLACEHOLDER_STRIPE_PUBLIC_KEY = "__VITE_STRIPE_PUBLIC_KEY__";
  const PLACEHOLDER_STRIPE_SECRET_KEY = "__VITE_STRIPE_SECRET_KEY__";

  let apiUrl = PLACEHOLDER_API_URL;
  let stripePublicKey = PLACEHOLDER_STRIPE_PUBLIC_KEY;
  let stripeSecretKey = PLACEHOLDER_STRIPE_SECRET_KEY;

  // In dev, use Vite env
  if (import.meta.env.DEV) {
    apiUrl = import.meta.env.VITE_API_ENDPOINT || "http://localhost:5000/api";
    stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
    stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY || "";
  } else {
    // For production/mobile builds, try to use environment variables or fallback
    // Try multiple IPs for Android emulator compatibility: 10.0.2.2 is standard emulator host IP
    apiUrl = (window as any).__VITE_API_ENDPOINT || import.meta.env.VITE_API_ENDPOINT || "http://10.0.2.2:5000/api";
    stripePublicKey = (window as any).__VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
    stripeSecretKey = (window as any).__VITE_STRIPE_SECRET_KEY || import.meta.env.VITE_STRIPE_SECRET_KEY || "";
    console.log("Mobile build detected. API URL:", apiUrl);
  }

  // Validation: Check if placeholders weren't replaced (still contain double underscores)
  if (!apiUrl || apiUrl.includes("VITE_") || apiUrl === "default") {
    console.error("API URL is not configured or not replaced at runtime. Using fallback: http://192.168.56.1:5000/api");
    apiUrl = "http://192.168.56.1:5000/api";
  }

  // For mobile/production, allow empty Stripe keys (will be loaded on-demand or user can set up later)
  if (
    !stripePublicKey ||
    stripePublicKey.includes("VITE_") ||
    stripePublicKey === "default"
  ) {
    console.warn(
      "Stripe public key is not configured. Payments may not work until configured."
    );
    stripePublicKey = ""; // Allow empty for mobile/testing
  }

  if (
    !stripeSecretKey ||
    stripeSecretKey.includes("VITE_") ||
    stripeSecretKey === "default"
  ) {
    console.warn(
      "Stripe secret key is not configured. Payments may not work until configured."
    );
    stripeSecretKey = ""; // Allow empty for mobile/testing
  }

  return {
    apiUrl,
    stripePublicKey,
    stripeSecretKey,
  };
}
