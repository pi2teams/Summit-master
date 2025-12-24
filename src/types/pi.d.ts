/* eslint-disable @typescript-eslint/no-explicit-any */

// Minimal Pi SDK typings for the Summit app.

declare global {
  interface Window {
    Pi?: {
      init: (options: { version: string }) => Promise<void> | void;
      authenticate: (
        scopes: string[],
        onIncompletePayment?: (payment: any) => void
      ) => Promise<{
        accessToken: string;
        user: { uid?: string; username?: string };
      }>;
      createPayment: (
        paymentData: {
          amount: number;
          memo: string;
          metadata?: Record<string, any>;
          to?: string;
        },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>;
          onCancel?: (paymentId: string) => void;
          onError?: (error: any, payment?: any) => void;
        }
      ) => Promise<void>;
      Ads?: any;
    };
  }
}

export {};
