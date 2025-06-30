import { loadApiConfig } from "../config/apiConfig";
import { ClientSecretResponse } from "../types/api.types";

const { apiUrl } = loadApiConfig();

interface items {
  productId: string;
  quantity: number;
  priceId: string;
}

export async function fetchClientSecret(body: items[]): Promise<string> {
  try {
    console.log("Fetching client secret with body:", body);

    const response = await fetch(
      `${apiUrl}/api/payment/create-payment-intent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: body,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch client secret");
    }

    const data: ClientSecretResponse = await response.json();
    console.log("data.checkoutSessionClientSecret", data.clientSecret);

    return data.clientSecret;
  } catch (error) {
    console.error("Error fetching client secret:", error);
    throw error;
  }
}
