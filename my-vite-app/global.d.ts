export {}; // Make this file an external module

declare global {
  interface Window {
    _env_?: {
      API_URL?: string;
      // add other env keys as needed
    };
  }
}
