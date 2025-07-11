import { useState, useCallback } from "react";
import { message } from "antd";
import { PaymentItem } from "../types/payment";
import { useProductsQuery } from "./useProductsQuery";
import { usePaymentMutations } from "./usePaymentMutations";

/**
 * Payment hook with TanStack Query integration
 * Follows TanStack Query best practices for data fetching and caching
 */
export const usePayment = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [items, setItems] = useState<PaymentItem[]>([]);

  // Use separated products query hook
  const {
    data: productsData = [],
    isLoading: isLoadingProducts,
    error: productsError,
    isError: isProductsError,
  } = useProductsQuery();

  // Use separated payment mutations hook
  const {
    createPaymentIntent,
    handlePaymentSuccess: paymentSuccessMutation,
    isCreatingPayment,
    isProcessingSuccess,
    createPaymentError,
  } = usePaymentMutations();

  // Handle payment initiation
  const handlePayment = useCallback(async (): Promise<string | null> => {
    if (items.length === 0) {
      message.warning("الرجاء اختيار منتج للدفع");
      return null;
    }

    try {
      const clientSecret = await createPaymentIntent.mutateAsync(items);
      setClientSecret(clientSecret);
      setShowPayment(true);
      return clientSecret;
    } catch (error) {
      console.error("Payment initiation failed:", error);
      setShowPayment(false);
      setClientSecret(null);
      return null;
    }
  }, [items, createPaymentIntent]);

  // Handle successful payment
  const handlePaymentSuccess = useCallback(async () => {
    setShowPayment(false);
    setClientSecret(null);
    setItems([]);

    // Use the separated payment success mutation
    await paymentSuccessMutation.mutateAsync();
  }, [paymentSuccessMutation]);

  // Handle payment cancellation
  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false);
    setClientSecret(null);
    setItems([]);
    message.info("تم إلغاء الدفع");

    // Reset mutation state
    createPaymentIntent.reset();
  }, [createPaymentIntent]);

  // Handle product selection changes
  const onProductChange = useCallback(
    (checkedValues: string[]) => {
      if (!productsData) {
        console.warn("Products data not available yet");
        return;
      }

      const selectedProducts = productsData.filter((product) =>
        checkedValues.includes(product.name)
      );

      const newItems: PaymentItem[] = selectedProducts.map((product) => ({
        productId: product.id,
        quantity: 1,
        priceId: product.id,
        productName: product.name,
        highlight: product.name === "تمييز الإعلان",
      }));

      console.log("Selected products:", newItems.length);
      setItems(newItems);
    },
    [productsData]
  );

  // Computed values
  const hasSelectedProducts = items.length > 0;
  const isProcessingPayment = isCreatingPayment || isProcessingSuccess;

  // Calculate total amount
  const totalAmount = items.reduce((total, item) => {
    const product = productsData?.find((p) => p.id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  return {
    // Payment state
    clientSecret,
    showPayment,
    items,
    hasSelectedProducts,
    totalAmount,

    // Products data and loading states
    products: productsData || [],
    isLoadingProducts,
    productsError,
    isProductsError,

    // Payment processing state
    isProcessingPayment,
    paymentError: createPaymentError,
    isPaymentError: !!createPaymentError,

    // Actions
    handlePayment,
    handlePaymentSuccess,
    handlePaymentCancel,
    onProductChange,

    // Utility functions
    resetPaymentState: () => {
      setShowPayment(false);
      setClientSecret(null);
      setItems([]);
      createPaymentIntent.reset();
    },
  };
};
