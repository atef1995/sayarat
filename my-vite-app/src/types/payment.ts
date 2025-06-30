// Payment related types
export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
}

export interface PaymentItem {
  productId: string;
  quantity: number;
  priceId: string;
}

export interface PaymentState {
  clientSecret: string | null;
  showPayment: boolean;
  products: Product[];
  items: PaymentItem[];
  handlePayment: () => Promise<string | null>;
  handlePaymentSuccess: () => Promise<void>;
  handlePaymentCancel: () => void;
  onProductChange: (checkedValues: string[]) => void;
  hasSelectedProducts: boolean;
}
