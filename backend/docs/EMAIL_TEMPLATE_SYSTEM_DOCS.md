# Email Template System Documentation

## Overview

The new email template system provides a modular, maintainable approach to email generation with full Arabic RTL support, anti-spam compliance, and professional design.

## Architecture

### Components

1. **Base Template** (`email-templates/base-template.html`)
   - Reusable HTML wrapper with header, content area, and footer
   - Responsive design with mobile optimization
   - Arabic RTL support with proper text direction
   - Professional styling with gradients and spacing
   - Anti-spam headers and compliance features

2. **Content Templates** (`email-templates/content/`)
   - Individual content templates for each email type
   - Inject into base template via `{{ content }}` placeholder
   - Template-specific styling and messaging

3. **Email Template Service** (`service/emailTemplateService.js`)
   - Core service for template compilation and generation
   - Parameter validation and error handling
   - Caching and performance optimization

4. **Updated Brevo Email Service** (`service/brevoEmailService.js`)
   - Integration with new template system
   - Fallback to old templates if needed
   - Enhanced error handling and logging

## Available Templates

### 1. Email Verification

- **Template**: `verify-email-content.html`
- **Method**: `generateVerificationEmail(params)`
- **Required Params**: `userName`, `verificationUrl`
- **Features**: Welcome message, verification button, security notes, benefits list

### 2. Password Reset

- **Template**: `password-reset-content.html`
- **Method**: `generatePasswordResetEmail(params)`
- **Required Params**: `userName`, `resetUrl`
- **Features**: Reset button, expiration warning, security notes

### 3. Welcome Email

- **Template**: `welcome-content.html`
- **Method**: `generateWelcomeEmail(params)`
- **Required Params**: `userName`
- **Features**: Welcome message, getting started tips, feature highlights

### 4. Company Welcome

- **Template**: `company-welcome-content.html`
- **Method**: `generateCompanyWelcomeEmail(params)`
- **Required Params**: `userName`, `companyName`
- **Features**: Company activation message, dashboard link, premium features

## Usage Examples

### Basic Usage

```javascript
const emailTemplateService = require('./service/emailTemplateService');

// Generate verification email
const verificationHtml = await emailTemplateService.generateVerificationEmail({
  userName: 'أحمد محمد',
  verificationUrl: 'https://sayarat.com/verify-email?token=abc123',
  logoUrl: 'https://sayarat.com/logo.png'
});

// Generate password reset email
const resetHtml = await emailTemplateService.generatePasswordResetEmail({
  userName: 'فاطمة أحمد',
  resetUrl: 'https://sayarat.com/reset-password/xyz789',
  expirationTime: '30 دقيقة'
});
```

### Advanced Usage

```javascript
// Generate custom email with additional parameters
const customHtml = await emailTemplateService.generateEmail('verify-email', {
  userName: 'محمد علي',
  verificationUrl: 'https://sayarat.com/verify',
  customMessage: 'رسالة مخصصة',
  siteUrl: 'https://sayarat.com',
  supportEmail: 'support@sayarat.com'
});
```

### Integration with Brevo Email Service

```javascript
const BrevoEmailService = require('./service/brevoEmailService');
const brevoService = new BrevoEmailService();

// Send verification email using new template system
await brevoService.sendVerificationEmail('user@example.com', 'أحمد محمد', 'request-123', 'verification-token-456');
```

## Template Parameters

### Global Parameters (Available in all templates)

- `siteUrl`: Website URL (default: from CLIENT_URL env)
- `supportEmail`: Support email address
- `companyName`: Company name (default: 'سيارات')
- `logoUrl`: Company logo URL
- `currentYear`: Current year
- `unsubscribeUrl`: Unsubscribe link

### Template-Specific Parameters

#### Verification Email

- `userName`: User's display name
- `verificationUrl`: Email verification link

#### Password Reset

- `userName`: User's display name
- `resetUrl`: Password reset link
- `expirationTime`: Link expiration time (default: '30 دقيقة')

#### Welcome Email

- `userName`: User's display name
- `loginUrl`: Login page URL

#### Company Welcome

- `userName`: User's display name
- `companyName`: Company name
- `dashboardUrl`: Company dashboard URL

## Features

### Design Features

- ✅ **Arabic RTL Support**: Proper text direction and layout
- ✅ **Mobile Responsive**: Optimized for all screen sizes
- ✅ **Professional Styling**: Modern gradients and spacing
- ✅ **Logo Integration**: Company branding with fallback support
- ✅ **Consistent Typography**: Readable fonts and sizes

### Technical Features

- ✅ **Anti-Spam Compliance**: Proper headers and unsubscribe links
- ✅ **Template Caching**: Performance optimization
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Parameter Validation**: Required parameter checking
- ✅ **Fallback System**: Old template system backup

### Content Features

- ✅ **Security Notes**: User education and safety
- ✅ **Benefits Lists**: Feature highlights and value propositions
- ✅ **Call-to-Action Buttons**: Clear action guidance
- ✅ **Social Links**: Company social media presence
- ✅ **Contact Information**: Support and help resources

## File Structure

```
backend/
├── email-templates/
│   ├── base-template.html          # Reusable wrapper template
│   └── content/
│       ├── verify-email-content.html
│       ├── password-reset-content.html
│       ├── welcome-content.html
│       └── company-welcome-content.html
├── service/
│   ├── emailTemplateService.js     # Core template service
│   └── brevoEmailService.js        # Updated email sending service
└── test-email-templates.js         # Test and demo script
```

## Testing

### Run Template Tests

```bash
# Navigate to backend directory
cd backend

# Run email template tests
node test-email-templates.js
```

### Test Output

- Generates HTML files in `test-outputs/` directory
- Tests all template types with sample data
- Validates template compilation and parameter injection

### Preview Emails

Open generated HTML files in browser to preview:

- `verification-email.html`
- `password-reset-email.html`
- `welcome-email.html`
- `company-welcome-email.html`

## Migration from Old System

### Automatic Fallback

The system automatically falls back to old templates if new ones fail, ensuring zero downtime during migration.

### Gradual Migration

1. New methods use new template system
2. Old methods continue to work with old templates
3. Gradually update old methods to use new system
4. Remove old templates once migration is complete

## Best Practices

### Template Development

1. **Content First**: Focus on content templates, base template handles layout
2. **Arabic Support**: Always test with Arabic text and RTL layout
3. **Mobile Testing**: Verify responsive design on mobile devices
4. **Parameter Validation**: Include all required parameters in method calls

### Email Sending

1. **Error Handling**: Always wrap email sending in try-catch blocks
2. **Logging**: Include request IDs for tracking and debugging
3. **Testing**: Test in spam filters and various email clients
4. **Fallback**: Have backup email sending methods

### Performance

1. **Template Caching**: Templates are cached automatically
2. **Parameter Reuse**: Reuse common parameters across emails
3. **Batch Sending**: Consider batching for bulk emails
4. **Monitoring**: Monitor email delivery rates and performance

## Troubleshooting

### Common Issues

1. **Template Not Found**
   - Check file paths and naming conventions
   - Verify content templates exist in `content/` directory

2. **Parameter Missing**
   - Validate required parameters before generation
   - Check parameter names match template placeholders

3. **Arabic Text Issues**
   - Verify RTL CSS is included
   - Check font support for Arabic characters

4. **Spam Filter Issues**
   - Review anti-spam headers
   - Test with multiple email providers
   - Verify unsubscribe links are functional

### Debug Mode

```javascript
// Enable debug logging
const emailTemplateService = require('./service/emailTemplateService');

// Preview email before sending
await emailTemplateService.previewEmail('verify-email', {
  userName: 'تست',
  verificationUrl: 'https://test.com'
});
```

## Future Enhancements

### Planned Features

- [ ] **Template Builder UI**: Visual template editor
- [ ] **A/B Testing**: Template variant testing
- [ ] **Analytics Integration**: Open/click tracking
- [ ] **Internationalization**: Multi-language support
- [ ] **Dark Mode**: Dark theme email templates

### Template Ideas

- [ ] **Newsletter Templates**: Company updates and news
- [ ] **Transaction Emails**: Payment confirmations
- [ ] **Notification Emails**: System alerts and updates
- [ ] **Marketing Emails**: Promotional campaigns
- [ ] **Support Emails**: Help desk responses

---

**Note**: This system is designed to be extensible and maintainable. Follow the established patterns when adding new templates or features.
