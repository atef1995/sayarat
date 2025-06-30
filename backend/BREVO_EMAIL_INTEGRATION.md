# Brevo Email Service Integration

This document outlines the integration of the Brevo Email Service for sending templated payment notification emails.

## Overview

The system now uses Brevo (formerly Sendinblue) for sending professional, templated emails for payment success and failure notifications. This replaces the previous inline HTML emails with more maintainable, responsive templates.

## Architecture

### Components

1. **BrevoEmailService** (`backend/service/brevoEmailService.js`)

   - Handles template loading and caching
   - Processes Handlebars-style parameters
   - Sends emails via Brevo API
   - Includes retry logic and error handling

2. **Email Templates** (`backend/email-templates/`)

   - `success-payment.html` - Payment success notification
   - `payment-failed.html` - Payment failure notification
   - Responsive design with RTL support
   - Brevo parameter syntax (`{{ params.variable }}`)

3. **WebhookEventProcessor** (`backend/service/webhookEventProcessor.js`)
   - Updated to use BrevoEmailService
   - Includes fallback to old email service
   - Enhanced error handling and logging

## Template Syntax

Templates use Brevo-compatible Handlebars syntax:

### Variables

```html
{{ params.customerName }} {{ params.paymentId }} {{ params.amount }}
```

### Conditional Blocks

```html
{{#if params.listingType}}
<div>{{ params.listingType }}</div>
{{/if}}
```

## Environment Variables

Required environment variables:

```bash
# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key

# Email Settings
EMAIL_FROM_NAME=Cars Bids
EMAIL_FROM=noreply@carsbids.com

# Application URLs
CLIENT_URL=http://localhost:5173
```

## Usage

### Payment Intent Success Email

```javascript
const brevoService = new BrevoEmailService();
await brevoService.sendPaymentSuccessEmail(paymentIntent, requestId);
```

### Payment Intent Failed Email

```javascript
const brevoService = new BrevoEmailService();
await brevoService.sendPaymentFailedEmail(failedPaymentIntent, requestId);
```

### Charge Success Email

```javascript
const brevoService = new BrevoEmailService();
await brevoService.sendChargeSuccessEmail(charge, requestId);
```

### Charge Failed Email

```javascript
const brevoService = new BrevoEmailService();
await brevoService.sendChargeFailedEmail(failedCharge, requestId);
```

### Custom Template

```javascript
await brevoService.sendTemplatedEmail({
  templateName: "custom-template",
  to: { email: "user@example.com", name: "User Name" },
  subject: "Custom Subject",
  params: { customParam: "value" },
  requestId: "req_123",
});
```

## Features

### Template Caching

Templates are cached in memory after first load to improve performance.

### Fallback Mechanism

If Brevo service fails, the system automatically falls back to the old email service to ensure reliability.

### Responsive Design

Email templates are responsive and work well on both desktop and mobile devices.

### RTL Support

Templates support right-to-left languages (Arabic) with proper text direction.

### Conditional Content

Templates support conditional blocks for dynamic content inclusion.

### Error Handling

Comprehensive error handling with detailed logging for debugging.

## Testing

Run the test script to validate the integration:

```bash
cd backend/test
node test-brevo-email.js
```

The test script validates:

- Template loading
- Parameter processing
- Conditional block handling
- Environment variable configuration

## Email Template Parameters

### Success Payment Template

- `customerName` - Customer name
- `paymentId` - Payment intent ID
- `amount` - Payment amount (formatted)
- `currency` - Currency code (uppercase)
- `paymentDate` - Payment date (Arabic locale)
- `listingType` - Type of listing (optional)
- `orderUrl` - URL to view order details

### Failed Payment Template

- `customerName` - Customer name
- `paymentId` - Payment intent ID
- `amount` - Payment amount (formatted)
- `currency` - Currency code (uppercase)
- `attemptDate` - Payment attempt date
- `errorMessage` - Error message (optional)
- `retryUrl` - URL to retry payment
- `supportUrl` - URL to contact support

## Webhook Integration

The webhook event processor automatically:

1. Processes successful payment intents using `sendPaymentSuccessEmail()`
2. Processes failed payment intents using `sendPaymentFailedEmail()`
3. Processes successful charges using `sendChargeSuccessEmail()`
4. Processes failed charges using `sendChargeFailedEmail()`
5. Falls back to old service if Brevo fails
6. Logs all email sending attempts

### Supported Webhook Events

- `payment_intent.succeeded` - Sends success email for payment intents
- `payment_intent.payment_failed` - Sends failure email for payment intents
- `charge.succeeded` - Sends success email for charges
- `charge.failed` - Sends failure email for charges

## Deployment Notes

1. Ensure `BREVO_API_KEY` is set in production environment
2. Verify `EMAIL_FROM` and `EMAIL_FROM_NAME` are configured
3. Update `CLIENT_URL` to production domain
4. Test email sending in staging environment first

## Monitoring

Email sending is logged with the following information:

- Request ID for tracking
- Template name used
- Recipient email
- Success/failure status
- Error details (if any)

Check logs for email sending issues:

```bash
grep "email" backend/logs/combined.log
```

## Future Enhancements

Potential improvements:

1. Email analytics and tracking
2. A/B testing for email templates
3. Multi-language template support
4. Email template editor interface
5. Advanced personalization features
