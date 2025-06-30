// Extend the Window interface for runtime env config

declare global {
  interface Window {
    _env_?: {
      API_URL?: string;
      // #TODO: Add more runtime config variables as needed
    };
  }
}

export {};
