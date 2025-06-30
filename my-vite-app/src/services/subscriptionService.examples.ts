/**
 * Example usage of new SubscriptionService utility methods
 *
 * This demonstrates how to use the enhanced SubscriptionService
 * for better subscription status management in React components
 */

import { SubscriptionService } from "../services/subscriptionService";
import { UserSubscription } from "../types/subscription.types";

// Example subscription data (from your test results)
const exampleSubscription: UserSubscription = {
  id: "sub_123",
  planId: "price_1RbhnwPIR1o3pZmObQQrJgs2",
  planName: "premium_monthly",
  planDisplayName: "الخطة المميزة - شهرية",
  stripeSubscriptionId: "sub_stripe_123",
  price: 2900, // in cents
  currency: "sar",
  status: "active",
  currentPeriodStart: new Date("2025-06-23T16:10:13.000Z"),
  currentPeriodEnd: new Date("2025-07-23T16:10:13.000Z"),
  cancelAtPeriodEnd: true, // This subscription is scheduled for cancellation
  cancellationReason: "User requested cancellation",
  features: [],
  accountType: "individual",
};

// Usage examples:

// 1. Check if subscription is scheduled for cancellation
const isScheduled =
  SubscriptionService.isScheduledForCancellation(exampleSubscription);
console.log("Is scheduled for cancellation:", isScheduled); // true

// 2. Check if subscription is still providing benefits
const isProviding =
  SubscriptionService.isProvidingBenefits(exampleSubscription);
console.log("Is providing benefits:", isProviding); // true (still within period)

// 3. Get human-readable status
const statusText =
  SubscriptionService.getSubscriptionStatusText(exampleSubscription);
console.log("Status text:", statusText); // "نشط - مجدول للإلغاء"

// 4. Calculate days until cancellation
const daysRemaining =
  SubscriptionService.getDaysUntilCancellation(exampleSubscription);
console.log("Days remaining:", daysRemaining); // 30 (approximately)

// 5. Get cancellation warning message
const warning = SubscriptionService.getCancellationWarning(exampleSubscription);
console.log("Warning:", warning); // "الاشتراك سينتهي خلال 30 يوم"

// 6. Format dates in Arabic
const formattedDate = SubscriptionService.formatSubscriptionDate(
  exampleSubscription.currentPeriodEnd
);
console.log("Formatted end date:", formattedDate); // "23 يوليو 2025"

/**
 * COMPONENT USAGE EXAMPLE:
 *
 * In your React components, you can now use these utilities like this:
 *
 * ```tsx
 * const SubscriptionStatus = ({ subscription }: { subscription?: UserSubscription }) => {
 *   if (!subscription) return <Text>لا يوجد اشتراك</Text>;
 *
 *   const isScheduled = SubscriptionService.isScheduledForCancellation(subscription);
 *   const warning = SubscriptionService.getCancellationWarning(subscription);
 *   const statusText = SubscriptionService.getSubscriptionStatusText(subscription);
 *
 *   return (
 *     <div>
 *       <Badge text={statusText} />
 *       {isScheduled && warning && (
 *         <Alert message={warning} type="warning" />
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */

export {};
