export const SUBSCRIPTION_STATUS = {
  TRIAL: "trial",
  ACTIVE: "active",
  EXPIRED: "expired",
  PAST_DUE: "past_due",
  SUSPENDED: "suspended",
  CANCELLED: "cancelled",
} as const;

export const PURCHASE_ORDER_STATUS = {
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  PARTIALLY_RECEIVED: "partially_received",
  RECEIVED: "received",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export const INVOICE_STATUS = {
  DRAFT: "draft",
  FINALIZED: "finalized",
  NORMALIZED: "normalized",
  CANCELLED: "cancelled",
} as const;

export const INVOICE_PAYMENT_STATE = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
} as const;

export const CERTIFICATE_STATUS = {
  PENDING: "pending",
  VALID: "valid",
  EXPIRED: "expired",
  ERROR: "error",
} as const;
