export {};

declare global {
  interface Window {
    AffiliateBridge?: {
      setStorage: (key: string, value: unknown) => void;
      getStorage: <T = unknown>(key: string) => T | null;
      affiliateData: {
        id: string;
        campaign: string;
      };
    };
  }
}
