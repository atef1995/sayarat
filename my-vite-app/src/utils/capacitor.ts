import { Capacitor } from '@capacitor/core';

export class CapacitorUtils {
  /**
   * Check if the app is running as a native mobile app
   */
  static isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check if the app is running on Android
   */
  static isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  /**
   * Check if the app is running on iOS
   */
  static isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  /**
   * Check if the app is running in a web browser
   */
  static isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  /**
   * Get the current platform
   */
  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * Check if the device has network connectivity
   */
  static async isConnected(): Promise<boolean> {
    if (this.isNativeApp()) {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return status.connected;
    }
    return navigator.onLine;
  }

  /**
   * Add platform-specific class to body for styling
   */
  static addPlatformClasses(): void {
    const platform = this.getPlatform();
    document.body.classList.add(`platform-${platform}`);
    
    if (this.isNativeApp()) {
      document.body.classList.add('mobile-app');
    }
  }

  /**
   * Configure app for mobile-specific behaviors
   */
  static configureMobileApp(): void {
    if (this.isNativeApp()) {
      // Prevent context menu on long press
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      // Prevent zoom on double tap
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
  }
}