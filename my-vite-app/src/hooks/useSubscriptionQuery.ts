import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { SubscriptionService } from "../services/subscriptionService";
import { subscriptionKeys } from "../types/subscriptionQueryKeys";
import { useAuth } from "./useAuth";
import {
  SubscriptionFeatures,
  SubscriptionCreateRequest,
  SubscriptionCreateResponse,
  SubscriptionCancelRequest,
  SubscriptionReactivateRequest,
  AccountTypeSwitchRequest,
  CompanyCreateRequest,
  CompanyAssociationRequest,
  AccountType,
} from "../types/subscription.types";

/**
 * Hook for subscription status check
 * Optimized to prevent excessive API calls
 */
export const useSubscriptionCheck = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: subscriptionKeys.check(),
    queryFn: () => SubscriptionService.checkSubscription(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to reduce calls
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry 401 or 429 errors
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 429) {
          return false;
        }
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false, // Disable to prevent loops
    refetchOnReconnect: true,
    refetchInterval: false, // Disable automatic refetching
  });
};

/**
 * Hook for subscription plans
 */
export const useSubscriptionPlans = (accountType?: AccountType) => {
  return useQuery({
    queryKey: subscriptionKeys.plansFiltered(accountType),
    queryFn: () => SubscriptionService.getPlans({ accountType }),
    staleTime: 10 * 60 * 1000, // 10 minutes (plans don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

/**
 * Hook for creating subscription
 */
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: SubscriptionCreateRequest
    ): Promise<SubscriptionCreateResponse> =>
      SubscriptionService.createSubscription(data),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate subscription-related queries
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

        message.success("تم إنشاء الاشتراك بنجاح");
      } else {
        message.error(data.error || "فشل في إنشاء الاشتراك");
      }
    },
    onError: (error: Error) => {
      console.error("Create subscription failed:", error);
      message.error(error.message || "فشل في إنشاء الاشتراك");
    },
  });
};

/**
 * Hook for canceling subscription
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubscriptionCancelRequest) =>
      SubscriptionService.cancelSubscription(data),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

        message.success(data.message || "تم إلغاء الاشتراك بنجاح");
      } else {
        message.error(data.error || "فشل في إلغاء الاشتراك");
      }
    },
    onError: (error: Error) => {
      console.error("Cancel subscription failed:", error);
      message.error(error.message || "فشل في إلغاء الاشتراك");
    },
  });
};

/**
 * Hook for reactivating subscription
 */
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubscriptionReactivateRequest) =>
      SubscriptionService.reactivateSubscription(data),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

        message.success(data.message || "تم تجديد الاشتراك بنجاح");
      } else {
        message.error(data.error || "فشل في تجديد الاشتراك");
      }
    },
    onError: (error: Error) => {
      console.error("Reactivate subscription failed:", error);
      message.error(error.message || "فشل في تجديد الاشتراك");
    },
  });
};

/**
 * Hook for switching account type
 */
export const useSwitchAccountType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountTypeSwitchRequest) =>
      SubscriptionService.switchAccountType(data),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

        message.success(data.message || "تم تغيير نوع الحساب بنجاح");
      } else {
        message.error(data.error || "فشل في تغيير نوع الحساب");
      }
    },
    onError: (error: Error) => {
      console.error("Switch account type failed:", error);
      message.error(error.message || "فشل في تغيير نوع الحساب");
    },
  });
};

/**
 * Hook for creating company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyCreateRequest) =>
      SubscriptionService.createCompany(data),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate subscription and company queries
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

        message.success(data.message || "تم إنشاء الشركة بنجاح");
      } else {
        message.error(data.error || "فشل في إنشاء الشركة");
      }
    },
    onError: (error: Error) => {
      console.error("Create company failed:", error);
      message.error(error.message || "فشل في إنشاء الشركة");
    },
  });
};

/**
 * Hook for associating with company
 */
export const useAssociateWithCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompanyAssociationRequest) =>
      SubscriptionService.associateWithCompany(data),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate subscription queries
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });

        message.success(data.message || "تم ربط الحساب بالشركة بنجاح");
      } else {
        message.error(data.error || "فشل في ربط الحساب بالشركة");
      }
    },
    onError: (error: Error) => {
      console.error("Associate with company failed:", error);
      message.error(error.message || "فشل في ربط الحساب بالشركة");
    },
  });
};

/**
 * Hook for subscription feature checks
 */
export const useSubscriptionFeatures = () => {
  const { data: subscriptionData, isLoading } = useSubscriptionCheck();
  const { isAuthenticated } = useAuth();

  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    if (!isAuthenticated || !subscriptionData) return false;

    const featureValue = subscriptionData.features[feature];
    return typeof featureValue === "boolean"
      ? featureValue
      : Boolean(featureValue);
  };

  const canAccessAI = (): boolean => {
    if (!isAuthenticated || !subscriptionData) return false;
    return subscriptionData.hasActiveSubscription || subscriptionData.isCompany;
  };

  const isPremium = (): boolean => {
    if (!isAuthenticated || !subscriptionData) return false;
    return subscriptionData.hasActiveSubscription;
  };

  const isCompany = (): boolean => {
    if (!isAuthenticated || !subscriptionData) return false;
    return subscriptionData.isCompany;
  };

  return {
    subscriptionData,
    isLoading,
    hasFeature,
    canAccessAI,
    isPremium,
    isCompany,
    isAuthenticated,
  };
};

/**
 * Enhanced subscription hook with all functionality
 */
export const useSubscription = () => {
  const { isAuthenticated } = useAuth();
  const subscriptionQuery = useSubscriptionCheck();
  const features = useSubscriptionFeatures();
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();
  const reactivateSubscription = useReactivateSubscription();
  const switchAccountType = useSwitchAccountType();
  const createCompany = useCreateCompany();
  const associateWithCompany = useAssociateWithCompany();

  const queryClient = useQueryClient();

  return {
    // Data (avoid duplication by using query data directly)
    subscriptionData: subscriptionQuery.data,
    loading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error?.message || null,

    // Feature checks (spread without subscriptionData to avoid conflict)
    hasFeature: features.hasFeature,
    canAccessAI: features.canAccessAI,
    isPremium: features.isPremium,
    isCompany: features.isCompany,

    // Actions
    createSubscription: createSubscription.mutateAsync,
    cancelSubscription: cancelSubscription.mutateAsync,
    reactivateSubscription: reactivateSubscription.mutateAsync,
    switchAccountType: switchAccountType.mutateAsync,
    createCompany: createCompany.mutateAsync,
    associateWithCompany: associateWithCompany.mutateAsync,

    // Refresh functionality
    refresh: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
      }
    },

    // Action states
    isCreatingSubscription: createSubscription.isPending,
    isCancelingSubscription: cancelSubscription.isPending,
    isReactivatingSubscription: reactivateSubscription.isPending,
    isSwitchingAccountType: switchAccountType.isPending,
    isCreatingCompany: createCompany.isPending,
    isAssociatingWithCompany: associateWithCompany.isPending,

    // Auth state
    isAuthenticated,
  };
};
