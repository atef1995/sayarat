import { useState, useEffect, useCallback } from "react";
import {
  ListingLimitService,
  ListingStatus,
} from "../services/listingLimitService";
import { useAuth } from "./useAuth";

export const useListingLimits = () => {
  const [status, setStatus] = useState<ListingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const checkStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ListingLimitService.checkListingStatus();

      if (response.success) {
        setStatus(response.status);
      } else {
        setError(response.error || "Failed to check listing status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const canCreateListing = status?.canCreate ?? false;
  const needsSubscription = status
    ? ListingLimitService.needsSubscription(status)
    : false;
  const statusMessage = status
    ? ListingLimitService.getStatusMessage(status)
    : "";

  return {
    status,
    loading,
    error,
    canCreateListing,
    needsSubscription,
    statusMessage,
    refreshStatus: checkStatus,
  };
};
