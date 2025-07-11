import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { fetchClientSecret } from "../api/fetchClientSecret";
import { PaymentItem } from "../types/payment";

/**
 * Payment mutations hook
 * Separates payment-related mutations following TanStack Query best practices
 */
export const usePaymentMutations = () => {
  const queryClient = useQueryClient();

  // Mutation for creating payment intent
  const createPaymentIntentMutation = useMutation({
    mutationKey: ["create-payment-intent"],
    mutationFn: async (paymentItems: PaymentItem[]): Promise<string> => {
      if (!paymentItems || paymentItems.length === 0) {
        throw new Error("No items selected for payment");
      }

      const clientSecret = await fetchClientSecret(paymentItems);

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      return clientSecret;
    },
    onSuccess: (clientSecret: string) => {
      console.log("Payment intent created successfully:", clientSecret);
      message.success("تم إنشاء طلب الدفع بنجاح");
    },
    onError: (error: Error) => {
      console.error("Payment intent creation failed:", error);
      message.error("حدث خطأ أثناء إنشاء طلب الدفع");
    },
  });

  // Mutation for handling successful payment
  const paymentSuccessMutation = useMutation({
    mutationKey: ["payment-success"],
    mutationFn: async () => {
      // Any additional API calls needed after successful payment
      // For example, updating user subscription status
      return Promise.resolve();
    },
    onSuccess: async () => {
      // Invalidate relevant queries after successful payment
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["subscription"] }),
        queryClient.invalidateQueries({ queryKey: ["user-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["user-subscriptions"] }),
      ]);

      message.success("تم الدفع بنجاح");
    },
    onError: (error: Error) => {
      console.error("Payment success handling failed:", error);
      message.error("حدث خطأ أثناء معالجة الدفع");
    },
  });

  return {
    createPaymentIntent: createPaymentIntentMutation,
    handlePaymentSuccess: paymentSuccessMutation,

    // Computed values for easy access
    isCreatingPayment: createPaymentIntentMutation.isPending,
    isProcessingSuccess: paymentSuccessMutation.isPending,
    isAnyMutationLoading:
      createPaymentIntentMutation.isPending || paymentSuccessMutation.isPending,

    // Error states
    createPaymentError: createPaymentIntentMutation.error,
    paymentSuccessError: paymentSuccessMutation.error,
  };
};
