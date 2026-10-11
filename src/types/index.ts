export type Role = "OWNER" | "MANAGER" | "CASHIER" | "INVENTORY";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessId: string;
  businessName: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku?: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  maxStock: number;
}

export type PaymentMethodType = "CASH" | "TELEBIRR" | "CBE_BIRR" | "BANK_TRANSFER" | "OTHER";
