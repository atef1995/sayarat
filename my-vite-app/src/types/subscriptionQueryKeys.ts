// Query keys for subscription-related queries
export const subscriptionKeys = {
  all: ["subscription"] as const,
  check: () => [...subscriptionKeys.all, "check"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  plansFiltered: (accountType?: string) =>
    [...subscriptionKeys.plans(), accountType] as const,
  userSubscription: () =>
    [...subscriptionKeys.all, "userSubscription"] as const,
  companies: () => [...subscriptionKeys.all, "companies"] as const,
  company: (id: string) => [...subscriptionKeys.companies(), id] as const,
  accountType: () => [...subscriptionKeys.all, "accountType"] as const,
} as const;

export type SubscriptionQueryKeys = typeof subscriptionKeys;
