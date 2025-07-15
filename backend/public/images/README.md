# Email Logo Setup Instructions

## 📁 Logo File Location

**Add your logo file to:** `backend/public/images/`

### Recommended file names:

- `logo-email.png` (Primary recommendation)
- `logo.png` (Alternative)
- `sayarat-logo.png` (Branded option)

### Logo Specifications:

- **Format:** PNG with transparent background (recommended) or JPG
- **Dimensions:** 300x120px to 400x160px (recommended)
- **File size:** Under 50KB to avoid email blocking
- **Style:** Clean, professional, readable at small sizes

## 🔧 Backend Configuration

Update your email service to include the logo URL in the template parameters:

```javascript
// In your email service file (e.g., emailService.js or brevoEmailService.js)
const emailParams = {
  userName: user.firstName || user.username,
  verificationUrl: verificationLink,
  logoUrl: `${process.env.FRONTEND_URL || 'https://sayarat.autos'}/api/public/images/logo-email.png`,
  supportEmail: 'support@sayarat.autos',
  supportUrl: 'https://sayarat.autos/support',
  companyName: 'سيارات',
  companyAddress: 'المملكة العربية السعودية', // Update with actual address
  companyPhone: '+966-XXX-XXXX', // Update with actual phone
  currentYear: new Date().getFullYear(),
  userEmail: user.email,
  unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}`,
  privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
  facebookUrl: 'https://facebook.com/sayarat', // Update with actual URLs
  twitterUrl: 'https://twitter.com/sayarat',
  instagramUrl: 'https://instagram.com/sayarat'
};
```

## 🌐 Server Route Setup

Make sure your backend serves static files. Add this to your server.js if not already present:

```javascript
// In server.js
app.use('/api/public', express.static(path.join(__dirname, 'public')));
```

## 📧 Email Template Variables

The template now uses these parameters:

- `{{ params.logoUrl }}` - Logo image URL
- `{{ params.userName }}` - User's name
- `{{ params.verificationUrl }}` - Email verification link
- `{{ params.supportEmail }}` - Support email address
- `{{ params.companyName }}` - Company name
- `{{ params.companyAddress }}` - Company address
- `{{ params.companyPhone }}` - Company phone
- `{{ params.currentYear }}` - Current year
- `{{ params.userEmail }}` - User's email
- `{{ params.unsubscribeUrl }}` - Unsubscribe link
- `{{ params.privacyUrl }}` - Privacy policy link
- Social media URLs (Facebook, Twitter, Instagram)

## 🔄 Fallback Options

If you don't have a logo ready, you can:

1. Use a text-based logo temporarily
2. Use a simple icon or emoji
3. Remove the logo line until you have one ready

## 🎨 Logo Design Tips

For best email delivery:

- Keep it simple and clean
- Ensure good contrast
- Make sure it's readable at small sizes
- Use web-safe colors
- Include your brand name in the image if possible
