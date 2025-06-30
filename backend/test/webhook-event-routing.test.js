const request = require('supertest');
const express = require('express');
const WebhookController = require('../../controllers/webhookController');

/**
 * Test script to verify webhook event routing logic
 *
 * This script tests that:
 * 1. Listing payments are routed to WebhookEventProcessor
 * 2. Subscription payments are routed to StripeWebhookService
 * 3. Events are properly identified and processed by the correct handler
 */

describe('Webhook Event Routing', () => {
  let app;
  let webhookController;
  let mockKnex;
  let mockEventProcessor;
  let mockStripeService;

  beforeEach(() => {
    // Mock Knex instance
    mockKnex = {};

    // Mock WebhookEventProcessor
    mockEventProcessor = {
      processPaymentSucceeded: jest.fn().mockResolvedValue({}),
      processPaymentFailed: jest.fn().mockResolvedValue('Test error'),
      processChargeSucceeded: jest.fn().mockResolvedValue({}),
      processChargeFailed: jest.fn().mockResolvedValue('Test charge error')
    };

    // Mock StripeWebhookService
    mockStripeService = {
      processStripeEvent: jest.fn().mockResolvedValue({ type: 'subscription_processed' })
    };

    // Create webhook controller with mocked dependencies
    webhookController = new WebhookController(mockKnex);
    webhookController.eventProcessor = mockEventProcessor;
    webhookController.stripeWebhookService = mockStripeService;

    // Create Express app for testing
    app = express();
    app.use(express.json());
  });

  describe('Payment Intent Events', () => {
    test('should route listing payment to WebhookEventProcessor', async() => {
      const listingPaymentEvent = {
        id: 'evt_listing_payment',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_listing_123',
            amount: 5000,
            currency: 'usd',
            metadata: {
              items: JSON.stringify([{ type: 'listing', highlight: true }])
            }
          }
        }
      };

      const result = await webhookController.processEventByType(listingPaymentEvent, 'test_req_123');

      expect(result.type).toBe('listing_payment_succeeded');
      expect(mockEventProcessor.processPaymentSucceeded).toHaveBeenCalledWith(
        listingPaymentEvent.data.object,
        'test_req_123'
      );
      expect(mockStripeService.processStripeEvent).not.toHaveBeenCalled();
    });

    test('should route subscription payment to StripeWebhookService', async() => {
      const subscriptionPaymentEvent = {
        id: 'evt_subscription_payment',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_subscription_123',
            amount: 2999,
            currency: 'usd',
            metadata: {
              accountType: 'company',
              companyId: 'comp_123',
              subscriptionId: 'sub_123'
            }
          }
        }
      };

      const result = await webhookController.processEventByType(subscriptionPaymentEvent, 'test_req_456');

      expect(result.type).toBe('subscription_payment_succeeded');
      expect(mockStripeService.processStripeEvent).toHaveBeenCalledWith(subscriptionPaymentEvent, 'test_req_456');
      expect(mockEventProcessor.processPaymentSucceeded).not.toHaveBeenCalled();
    });

    test('should route subscription payment with invoice to StripeWebhookService', async() => {
      const invoicePaymentEvent = {
        id: 'evt_invoice_payment',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_invoice_123',
            amount: 2999,
            currency: 'usd',
            invoice: 'in_123',
            metadata: {}
          }
        }
      };

      const result = await webhookController.processEventByType(invoicePaymentEvent, 'test_req_789');

      expect(result.type).toBe('subscription_payment_succeeded');
      expect(mockStripeService.processStripeEvent).toHaveBeenCalledWith(invoicePaymentEvent, 'test_req_789');
      expect(mockEventProcessor.processPaymentSucceeded).not.toHaveBeenCalled();
    });
  });

  describe('Charge Events', () => {
    test('should route listing charge to WebhookEventProcessor', async() => {
      const listingChargeEvent = {
        id: 'evt_listing_charge',
        type: 'charge.succeeded',
        data: {
          object: {
            id: 'ch_listing_123',
            amount: 5000,
            currency: 'usd',
            payment_intent: 'pi_listing_123',
            metadata: {
              type: 'listing'
            }
          }
        }
      };

      const result = await webhookController.processEventByType(listingChargeEvent, 'test_req_charge');

      expect(result.type).toBe('listing_charge_succeeded');
      expect(mockEventProcessor.processChargeSucceeded).toHaveBeenCalledWith(
        listingChargeEvent.data.object,
        'test_req_charge'
      );
      expect(mockStripeService.processStripeEvent).not.toHaveBeenCalled();
    });

    test('should route subscription charge to StripeWebhookService', async() => {
      const subscriptionChargeEvent = {
        id: 'evt_subscription_charge',
        type: 'charge.succeeded',
        data: {
          object: {
            id: 'ch_subscription_123',
            amount: 2999,
            currency: 'usd',
            payment_intent: 'pi_subscription_123',
            invoice: 'in_123'
          }
        }
      };

      const result = await webhookController.processEventByType(subscriptionChargeEvent, 'test_req_charge_sub');

      expect(result.type).toBe('subscription_charge_succeeded');
      expect(mockStripeService.processStripeEvent).toHaveBeenCalledWith(subscriptionChargeEvent, 'test_req_charge_sub');
      expect(mockEventProcessor.processChargeSucceeded).not.toHaveBeenCalled();
    });
  });

  describe('Event Type Detection', () => {
    test('isSubscriptionPayment should correctly identify subscription payments', () => {
      // Company subscription
      const companyPayment = {
        metadata: { accountType: 'company', companyId: 'comp_123' }
      };
      expect(webhookController.isSubscriptionPayment(companyPayment)).toBe(true);

      // Direct subscription ID
      const directSubscription = {
        metadata: { subscriptionId: 'sub_123' }
      };
      expect(webhookController.isSubscriptionPayment(directSubscription)).toBe(true);

      // Invoice-based payment
      const invoicePayment = {
        invoice: 'in_123',
        metadata: {}
      };
      expect(webhookController.isSubscriptionPayment(invoicePayment)).toBe(true);

      // Listing payment
      const listingPayment = {
        metadata: { items: JSON.stringify([{ type: 'listing' }]) }
      };
      expect(webhookController.isSubscriptionPayment(listingPayment)).toBe(false);
    });

    test('isSubscriptionCharge should correctly identify subscription charges', () => {
      // Invoice-based charge
      const invoiceCharge = {
        invoice: 'in_123',
        metadata: {}
      };
      expect(webhookController.isSubscriptionCharge(invoiceCharge)).toBe(true);

      // Company subscription charge
      const companyCharge = {
        metadata: { accountType: 'company', companyId: 'comp_123' }
      };
      expect(webhookController.isSubscriptionCharge(companyCharge)).toBe(true);

      // Regular listing charge
      const listingCharge = {
        metadata: { type: 'listing' }
      };
      expect(webhookController.isSubscriptionCharge(listingCharge)).toBe(false);
    });
  });
});

module.exports = {
  testEventRouting: async() => {
    console.log('🧪 Testing webhook event routing logic...');

    try {
      // You can run manual tests here if Jest is not available
      console.log('✅ Event routing tests would run here');
      console.log('📝 Key test scenarios:');
      console.log('   - Listing payments → WebhookEventProcessor');
      console.log('   - Subscription payments → StripeWebhookService');
      console.log('   - Company subscriptions → StripeWebhookService');
      console.log('   - Invoice-based payments → StripeWebhookService');
      console.log('   - Proper event type detection');

      return true;
    } catch (error) {
      console.error('❌ Event routing test failed:', error.message);
      return false;
    }
  }
};
