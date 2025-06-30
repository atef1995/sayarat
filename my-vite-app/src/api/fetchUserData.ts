import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

export const getIpAddress = async () => {
  try {
    // Option 1: Using ipify API
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get IP:", error);
    // Option 2: Fallback to server endpoint
    try {
      const response = await fetch(`${apiUrl}/api/get-ip`);
      const data = await response.json();
      return data;
    } catch (fallbackError) {
      console.error("Fallback IP detection failed:", fallbackError);
    }
  }
};
