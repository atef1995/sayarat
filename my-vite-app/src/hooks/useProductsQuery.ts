import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchProducts from "../api/fetchProducts";
import { Product } from "../types/payment";

/**
 * Products query configuration and keys
 * Centralized query configuration following TanStack Query best practices
 */
export const productsQueryKeys = {
  all: ["products"] as const,
  lists: () => [...productsQueryKeys.all, "list"] as const,
  list: (filters: string) =>
    [...productsQueryKeys.lists(), { filters }] as const,
  details: () => [...productsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...productsQueryKeys.details(), id] as const,
};

/**
 * Products query options
 * Reusable query configuration for products
 */
export const productsQueryOptions = {
  queryKey: productsQueryKeys.all,
  queryFn: async (): Promise<Product[]> => {
    try {
      const productsData = await fetchProducts();

      if (!Array.isArray(productsData)) {
        throw new Error("Invalid data format for products");
      }

      // Transform data to the expected format
      return productsData.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.default_price.unit_amount / 100, // Convert to dollars
        currency: product.default_price.currency,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }
  },
  staleTime: 5 * 60 * 1000, // 5 minutes - products don't change frequently
  gcTime: 10 * 60 * 1000, // 10 minutes cache time
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false, // Products rarely change
};

/**
 * Hook for fetching products with TanStack Query
 * Following the recommended pattern of separating query logic
 */
export const useProductsQuery = (): UseQueryResult<Product[], Error> => {
  return useQuery(productsQueryOptions);
};

/**
 * Hook for getting a specific product by ID
 * Demonstrates how to derive data from existing queries
 */
export const useProductQuery = (productId: string) => {
  const { data: products, ...rest } = useProductsQuery();

  const product = products?.find((p) => p.id === productId);

  return {
    data: product,
    isLoading: rest.isLoading,
    error: rest.error,
    isError: rest.isError,
  };
};

/**
 * Utility functions for products
 * Can be used across the application
 */
export const useProductsUtils = () => {
  const { data: products } = useProductsQuery();

  const getProductById = (id: string): Product | undefined => {
    return products?.find((product) => product.id === id);
  };

  const getProductByName = (name: string): Product | undefined => {
    return products?.find((product) => product.name === name);
  };

  const getProductsByPriceRange = (min: number, max: number): Product[] => {
    return (
      products?.filter(
        (product) => product.price >= min && product.price <= max
      ) || []
    );
  };

  return {
    products: products || [],
    getProductById,
    getProductByName,
    getProductsByPriceRange,
  };
};
