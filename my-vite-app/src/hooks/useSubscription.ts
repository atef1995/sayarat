import { useState, useEffect, useCallback } from "react";
import { SubscriptionService } from "../services/subscriptionService";
import {
  SubscriptionCheckResponse,
  SubscriptionFeatures,
} from "../types/subscription.types";
import { useAuth } from "./useAuth";

export const useSubscription = () => {
  const { isAuthenticated } = useAuth();
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
    // Only check subscription if user is authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      checkSubscription();
    } else {
      // Reset subscription data when user is not authenticated
      setSubscriptionData({
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
      setLoading(false);
      setError(null);
    }
  }, [isAuthenticated, checkSubscription]);

  const hasFeature = useCallback(
    (feature: keyof SubscriptionFeatures): boolean => {
      // Return false if user is not authenticated
      if (!isAuthenticated) return false;

      const featureValue = subscriptionData.features[feature];
      return typeof featureValue === "boolean"
        ? featureValue
        : Boolean(featureValue);
    },
    [isAuthenticated, subscriptionData.features]
  );

  const canAccessAI = useCallback((): boolean => {
    // Return false if user is not authenticated
    if (!isAuthenticated) return false;

    return subscriptionData.hasActiveSubscription || subscriptionData.isCompany;
  }, [
    isAuthenticated,
    subscriptionData.hasActiveSubscription,
    subscriptionData.isCompany,
  ]);

  const isPremium = useCallback((): boolean => {
    // Return false if user is not authenticated
    if (!isAuthenticated) return false;

    return subscriptionData.hasActiveSubscription;
  }, [isAuthenticated, subscriptionData.hasActiveSubscription]);

  const isCompany = useCallback((): boolean => {
    // Return false if user is not authenticated
    if (!isAuthenticated) return false;

    return subscriptionData.isCompany;
  }, [isAuthenticated, subscriptionData.isCompany]);

  const refresh = useCallback(() => {
    if (isAuthenticated) {
      checkSubscription();
    }
  }, [isAuthenticated, checkSubscription]);

  return {
    subscriptionData,
    loading,
    error,
    hasFeature,
    canAccessAI,
    isPremium,
    isCompany,
    refresh,
    isAuthenticated, // Include authentication status for component logic
  };
};
