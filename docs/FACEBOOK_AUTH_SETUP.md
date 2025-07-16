# Facebook Authentication Configuration Guide

This guide explains how to set up Facebook authentication for the Sayarat application.

## Prerequisites

1. Facebook Developer Account
2. Facebook App created in the Facebook Developer Console
3. Domain verification (for production)

## Facebook App Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" or "Business" type
4. Fill in app details:
   - App Name: "Sayarat"
   - App Contact Email: your email
   - Business Account: (optional)

### 2. Configure Facebook Login

1. In your app dashboard, go to "Products" → "Facebook Login" → "Settings"
2. Add Valid OAuth Redirect URIs:
   - Development: `http://localhost:5000/auth/facebook/callback`
   - Production: `https://sayarat.com/auth/facebook/callback`

### 3. Get App Credentials

1. Go to "Settings" → "Basic"
2. Copy your App ID and App Secret

## Environment Variables

Add these variables to your `.env.development` and `.env.production` files:

```bash
# Facebook OAuth Configuration
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5000/auth/facebook/callback

# For production, use:
# FACEBOOK_CALLBACK_URL=https://sayarat.com/auth/facebook/callback
```

## Database Migration

Run the migration to add Facebook authentication fields:

```bash
npm run migrate
```

This will add the following fields to the `sellers` table:

- `facebook_id` - Facebook user ID
- `auth_provider` - Authentication provider ('local', 'facebook', or 'local,facebook')
- `facebook_picture_url` - Facebook profile picture URL
- `facebook_profile_data` - Additional Facebook profile data (JSON)
- `facebook_linked_at` - Timestamp when Facebook account was linked

## Frontend Integration

### Login Button

Add a Facebook login button to your login page:

```html
<a href="/auth/facebook" class="facebook-login-btn"> Login with Facebook </a>
```

### Account Linking

For existing users to link their Facebook account:

```html
<a href="/auth/facebook/link" class="facebook-link-btn">
  Link Facebook Account
</a>
```

### Account Unlinking

To unlink Facebook account (AJAX call):

```javascript
fetch("/auth/facebook/unlink", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      // Handle success
      alert("Facebook account unlinked successfully");
    } else {
      // Handle error
      alert(data.message);
    }
  });
```

## Security Considerations

1. **App Secret Security**: Never expose the Facebook App Secret in client-side code
2. **HTTPS in Production**: Always use HTTPS for production OAuth callbacks
3. **Domain Verification**: Verify your domain in Facebook Developer Console for production
4. **Scope Permissions**: Only request necessary permissions ('email', 'public_profile')
5. **Rate Limiting**: Implement rate limiting for authentication endpoints

## User Flow

### New User Registration via Facebook

1. User clicks "Login with Facebook"
2. Redirected to Facebook for authorization
3. User grants permissions
4. Facebook redirects back to your app
5. App creates new user account with Facebook data
6. User is logged in and redirected to dashboard

### Existing User Login via Facebook

1. User clicks "Login with Facebook"
2. App finds existing user by Facebook ID
3. User is logged in immediately
4. Redirected to dashboard

### Account Linking

1. Logged-in user clicks "Link Facebook Account"
2. User authorizes Facebook connection
3. App links Facebook ID to existing account
4. User can now log in using either method

## Error Handling

The system handles these error scenarios:

- Facebook authentication failure
- Email already exists with different provider
- Missing email permission from Facebook
- Network connectivity issues
- Database errors during user creation

## Testing

### Development Testing

1. Set up Facebook app with localhost callback URL
2. Test login flow with test users
3. Test account linking/unlinking functionality

### Production Testing

1. Update Facebook app with production domain
2. Verify HTTPS callback URLs
3. Test with real Facebook accounts
4. Monitor error logs

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Check Facebook app settings
2. **App Not Live**: Facebook apps need to be made live for public use
3. **Missing Permissions**: Ensure app requests email permission
4. **CORS Issues**: Configure CORS for your domain

### Debug Logs

Check application logs for Facebook authentication events:

```bash
# View authentication logs
npm run start:dev | grep "Facebook"
```

## Support

For Facebook-specific issues:

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Facebook Developer Community](https://developers.facebook.com/community/)

For application-specific issues:

- Check application logs
- Review error responses
- Verify environment variables
