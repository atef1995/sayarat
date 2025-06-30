import { loadStripe } from "@stripe/stripe-js";
import { loadApiConfig } from "./apiConfig";
const { stripePublicKey } = loadApiConfig();
export const stripePromise = loadStripe(stripePublicKey, {
  betas: ["custom_checkout_beta_6"],
});
