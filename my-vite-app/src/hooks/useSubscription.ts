// Export the new TanStack Query implementation
export {
  useSubscription,
  useSubscriptionCheck,
  useSubscriptionPlans,
  useSubscriptionFeatures,
  useCreateSubscription,
  useCancelSubscription,
  useReactivateSubscription,
  useSwitchAccountType,
  useCreateCompany,
  useAssociateWithCompany,
} from "./useSubscriptionQuery";

// Legacy export for backward compatibility
export { useSubscription as useSubscriptionLegacy } from "./useSubscriptionQuery";
