import { useState, useEffect, useCallback } from "react";
import { SubscriptionService } from "../services/subscriptionService";
import {
  SubscriptionCheckResponse,
  SubscriptionFeatures,
} from "../types/subscription.types";

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionCheckResponse>({
      hasActiveSubscription: false,
      features: {
        aiCarAnalysis: false,
        listingHighlights: false,
        prioritySupport: false,
        advancedAnalytics: false,
        unlimitedListings: false,
      },
      isCompany: false,
      accountType: "individual",
      canSwitchAccountType: true,
    });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SubscriptionService.checkSubscription();
      setSubscriptionData(response);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setError("Failed to check subscription status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);
  const hasFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      const featureValue = subscriptionData.features[feature];
      return typeof featureValue === "boolean"
        ? featureValue
        : Boolean(featureValue);
    },
    [subscriptionData.features]
  );

  const canAccessAI = useCallback((): boolean => {
    return subscriptionData.hasActiveSubscription || subscriptionData.isCompany;
  }, [subscriptionData.hasActiveSubscription, subscriptionData.isCompany]);

  const isPremium = useCallback((): boolean => {
    return subscriptionData.hasActiveSubscription;
  }, [subscriptionData.hasActiveSubscription]);

  const isCompany = useCallback((): boolean => {
    return subscriptionData.isCompany;
  }, [subscriptionData.isCompany]);

  const refresh = useCallback(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    subscriptionData,
    loading,
    error,
    hasFeature,
    canAccessAI,
    isPremium,
    isCompany,
    refresh,
  };
};
