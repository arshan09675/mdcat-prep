/**
 * Our receiving account for manual payments. Only JazzCash is active right now;
 * Easypaisa/bank are kept in the data model for later.
 */
export const PAYMENT_CONFIG = {
  jazzcash: {
    enabled: true,
    number: "03248905884",
    accountName: "MDCAT Prep",
  },
  easypaisa: {
    enabled: false,
    number: "",
    accountName: "MDCAT Prep",
  },
} as const;

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";
