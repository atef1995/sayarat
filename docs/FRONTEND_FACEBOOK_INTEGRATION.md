# Frontend Facebook Authentication Integration Guide

## 📋 Setup Overview

This guide shows you how to integrate the Facebook authentication components into your React/Vite application.

## 🚀 Quick Start

### 1. Add Components to Your Project

Copy these components to your project:

- `FacebookLoginButton.tsx` - Login button component
- `FacebookCallback.tsx` - OAuth callback handler
- `FacebookAccountLinking.tsx` - Profile page account linking

### 2. Update Your Router

Add the Facebook callback route to your router configuration:

```tsx
// In your router file (App.tsx or router configuration)
import FacebookCallback from './components/FacebookCallback';

// Add this route to your router
{
  path: '/auth/facebook/callback',
  element: <FacebookCallback />,
}
```

### 3. Update Login Page

Your `Login.tsx` has been updated to include the Facebook login button. The changes include:

```tsx
import FacebookLoginButton from "./FacebookLoginButton";

// Added in the form:
<Divider plain>أو</Divider>
<Form.Item>
  <FacebookLoginButton
    block
    loading={isLoading}
    redirectTo="/profile"
  />
</Form.Item>
```

### 4. Add to Profile Page

Add the Facebook account linking component to your profile page:

```tsx
import FacebookAccountLinking from "./components/FacebookAccountLinking";

// In your profile page component:
function ProfilePage() {
  return (
    <div>
      {/* Other profile content */}
      <FacebookAccountLinking />
    </div>
  );
}
```

## 🔧 Backend Configuration Required

### Environment Variables

Add these to your backend `.env.development` file:

```bash
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/auth/facebook/callback
```

### Facebook App Settings

In your Facebook Developer Console:

1. **Valid OAuth Redirect URIs:**

   ```
   http://localhost:5000/auth/facebook/callback
   ```

2. **Recommended Settings:**
   - ✅ Client OAuth Login: Yes
   - ✅ Web OAuth Login: Yes
   - ❌ Force Web OAuth Reauthentication: No
   - ✅ Enforce HTTPS: Yes (production)
   - ❌ Embedded Browser OAuth Login: No
   - ✅ Use Strict Mode for redirect URIs: Yes

## 🎨 Component Features

### FacebookLoginButton

- Ant Design styled button
- Facebook blue theme
- Loading states
- Automatic redirect handling
- RTL/Arabic text support

### FacebookCallback

- Handles OAuth callback processing
- Loading, success, and error states
- Automatic redirect after success
- Error message localization
- Retry functionality

### FacebookAccountLinking

- Shows current linking status
- Link/unlink functionality
- Security information
- Success/error feedback
- Profile page integration

## 🔄 User Flow

### New User Registration

1. User clicks "تسجيل الدخول عبر فيسبوك" on login page
2. Redirected to Facebook for authorization
3. Facebook redirects to `/auth/facebook/callback`
4. Backend creates new user account
5. User redirected to profile page

### Existing User Login

1. User clicks Facebook login button
2. Backend finds existing user by Facebook ID
3. User logged in and redirected

### Account Linking

1. Logged-in user visits profile page
2. Clicks "ربط الحساب" in Facebook section
3. Authorizes Facebook connection
4. Account linked and page refreshed

## 🎯 Features

### Security

- OAuth 2.0 standard implementation
- CSRF protection
- Secure token handling
- No sensitive data in frontend

### User Experience

- Arabic/RTL language support
- Loading states and feedback
- Error handling and recovery
- Seamless redirect flow

### Technical

- TypeScript support
- Ant Design integration
- React Router integration
- Responsive design

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid OAuth URI" Error**

   - Check Facebook app redirect URI settings
   - Ensure backend port (5000) matches configuration

2. **Login Button Not Working**

   - Verify backend is running on port 5000
   - Check browser console for errors
   - Ensure routes are properly configured

3. **Callback Page Shows Error**

   - Check backend environment variables
   - Verify Facebook app is properly configured
   - Review backend logs for authentication errors

4. **Account Linking Fails**
   - Ensure user is logged in before linking
   - Check network requests in browser dev tools
   - Verify `/auth/facebook/unlink` endpoint is accessible

### Debug Commands

```bash
# Check if backend is running
curl http://localhost:5000/auth/check

# Test Facebook auth endpoint
curl http://localhost:5000/auth/facebook

# Check backend logs
npm run start:dev
```

## 📱 Mobile Considerations

The components are responsive and work on mobile devices. For mobile apps:

- Facebook login will open in system browser
- Deep linking back to app may require additional configuration
- Consider Facebook SDK for native apps for better UX

## 🔜 Future Enhancements

Potential improvements:

- Profile picture synchronization
- Facebook friends discovery
- Social sharing integration
- Enhanced error messages
- Offline handling

## ✅ Testing Checklist

- [ ] Facebook login button appears on login page
- [ ] Clicking button redirects to Facebook
- [ ] Successful auth redirects to profile
- [ ] Error handling works for cancelled auth
- [ ] Account linking works from profile page
- [ ] Account unlinking works and shows confirmation
- [ ] Components are responsive on mobile
- [ ] Arabic text displays correctly

## 📞 Support

For technical issues:

- Check browser console for JavaScript errors
- Review network requests in developer tools
- Verify backend authentication logs
- Test with different browsers

For Facebook-specific issues:

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Facebook Developer Community](https://developers.facebook.com/community/)

---

**Status**: ✅ Frontend Integration Complete  
**Components**: 3 React components created  
**Features**: Login, Callback, Account Linking  
**Language**: Arabic/RTL Support  
**Framework**: Ant Design + React Router
