// Query keys for listing-related queries
export const listingKeys = {
  all: ["listings"] as const,
  status: () => [...listingKeys.all, "status"] as const,
  validation: () => [...listingKeys.all, "validation"] as const,
  validationHealth: () => [...listingKeys.validation(), "health"] as const,
  fieldValidation: (fields: Record<string, unknown>) =>
    [...listingKeys.validation(), "fields", fields] as const,
  userListings: () => [...listingKeys.all, "user"] as const,
  create: () => [...listingKeys.all, "create"] as const,
  update: (id: string) => [...listingKeys.all, "update", id] as const,
} as const;

export type ListingQueryKeys = typeof listingKeys;
