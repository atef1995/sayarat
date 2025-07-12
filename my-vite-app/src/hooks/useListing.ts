import { useState, useEffect, useCallback } from "react";
import { CarInfo, ListingInfo } from "../types";
import { fetchListingById } from "../api/fetchCars";
import { ListingError } from "../utils/listingTransform";

/**
 * Interface for listing fetch state
 */
interface UseListingState {
  listing: ListingInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing listing data
 * Implements proper separation of concerns and error handling
 *
 * @param id - Listing ID
 * @returns UseListingState - Listing data, loading state, error, and refetch function
 */
export const useListing = (id: CarInfo["id"] | undefined): UseListingState => {
  const [listing, setListing] = useState<ListingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    if (!id) {
      setError("Listing ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const listingData = await fetchListingById(id);
      setListing(listingData);
    } catch (err) {
      console.error("Error fetching listing:", err);

      if (err instanceof ListingError) {
        setError(err.message);
      } else {
        setError("Failed to fetch listing. Please try again.");
      }

      setListing(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const refetch = useCallback(async () => {
    await fetchListing();
  }, [fetchListing]);

  return {
    listing,
    loading,
    error,
    refetch,
  };
};
