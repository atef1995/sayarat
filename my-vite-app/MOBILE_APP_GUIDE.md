# Sayarat Mobile App Setup Guide

## 📱 Mobile App Development with Capacitor

Your Sayarat website has been successfully converted to a mobile app using Capacitor! This guide will help you build, test, and deploy the mobile application.

## 🚀 Quick Start

### Prerequisites
- **For Android**: Android Studio installed
- **For iOS**: Xcode installed (macOS only)
- Node.js and npm installed

### Development Workflow

#### 1. Build and Sync
```bash
npm run mobile:build
```
This command:
- Builds the web app
- Copies assets to mobile platforms
- Syncs Capacitor plugins

#### 2. Open in Native IDEs
```bash
# Open Android Studio
npm run mobile:open:android

# Open Xcode (macOS only)
npm run mobile:open:ios
```

#### 3. Run on Device/Emulator
```bash
# Run on Android
npm run mobile:dev

# Run on iOS (macOS only)
npm run mobile:dev:ios
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run mobile:build` | Build web app and sync with platforms |
| `npm run mobile:dev` | Build and run on Android |
| `npm run mobile:dev:ios` | Build and run on iOS |
| `npm run mobile:open:android` | Open Android Studio |
| `npm run mobile:open:ios` | Open Xcode |
| `npm run mobile:sync` | Sync web assets with platforms |

## 🔧 Configuration

### Capacitor Config (`capacitor.config.ts`)
```typescript
const config: CapacitorConfig = {
  appId: 'com.sayarat.app',
  appName: 'Sayarat',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: { /* splash screen config */ }
  }
};
```

### Mobile-Specific Features Added

#### 1. Platform Detection
```typescript
import { CapacitorUtils } from './utils/capacitor';

// Check if running as native app
CapacitorUtils.isNativeApp();

// Platform-specific logic
if (CapacitorUtils.isAndroid()) {
  // Android-specific code
} else if (CapacitorUtils.isIOS()) {
  // iOS-specific code
}
```

#### 2. Mobile Optimizations
- **Safe Area Support**: Automatic padding for notched devices
- **Touch Optimizations**: 44px minimum touch targets
- **Overscroll Prevention**: Prevents bounce effects
- **Text Selection**: Optimized for mobile UX
- **Context Menu**: Disabled on long press for native feel

#### 3. Network Detection
```typescript
const isConnected = await CapacitorUtils.isConnected();
```

## 🎨 Mobile-Specific Styling

The app automatically adds platform classes:
- `.platform-android` - Android devices
- `.platform-ios` - iOS devices  
- `.platform-web` - Web browsers
- `.mobile-app` - All native mobile apps

### CSS Examples
```css
/* Android-specific styles */
.platform-android .header {
  background: #4285f4;
}

/* iOS-specific styles */
.platform-ios .header {
  background: #007aff;
}

/* Mobile app optimizations */
.mobile-app button {
  min-height: 44px;
  min-width: 44px;
}
```

## 📱 App Store Deployment

### Android (Google Play Store)
1. Build signed APK in Android Studio
2. Follow Google Play Console guidelines
3. Upload to Play Store

### iOS (Apple App Store)
1. Build archive in Xcode
2. Follow App Store Connect guidelines
3. Submit for review

## 🔒 Security Considerations

- **Content Security Policy**: Configured for mobile apps
- **HTTPS Enforcement**: Android scheme set to HTTPS
- **Network Security**: All API calls use secure connections

## 🧪 Testing

### Physical Device Testing
1. Enable Developer Options (Android) or Developer Mode (iOS)
2. Connect device via USB
3. Run `npm run mobile:dev` or `npm run mobile:dev:ios`

### Emulator Testing
1. Start Android Emulator or iOS Simulator
2. Run the development scripts
3. App will install and launch automatically

## 🐛 Troubleshooting

### Common Issues

#### Android Build Errors
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run mobile:build
```

#### iOS Build Errors (macOS)
```bash
# Update CocoaPods
cd ios/App
pod install
cd ../..
npm run mobile:build
```

#### Plugin Sync Issues
```bash
npx cap sync
```

## 📝 Next Steps

1. **Test on Physical Devices**: Ensure app works on real devices
2. **Add App Icons**: Customize app icons for both platforms
3. **Configure Splash Screens**: Brand the app launch experience
4. **Add Push Notifications**: Implement with `@capacitor/push-notifications`
5. **Add App Store Metadata**: Prepare descriptions, screenshots, etc.

## 📚 Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Development Guide](https://developer.android.com/docs)
- [iOS Development Guide](https://developer.apple.com/documentation/)
- [App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Google Play Guidelines](https://developer.android.com/distribute/best-practices)

---

🎉 **Congratulations!** Your Sayarat website is now a fully functional mobile app!