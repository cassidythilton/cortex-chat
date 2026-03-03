// Type declarations for Domo global object
declare global {
  const domo: {
    get(endpoint: string): Promise<unknown>;
    post(endpoint: string, body: unknown): Promise<unknown>;
    put(endpoint: string, body: unknown): Promise<unknown>;
    delete(endpoint: string): Promise<unknown>;
  };

  interface Window {
    handleSuggestionClick?: (suggestion: string) => void;
  }
}

export {};
