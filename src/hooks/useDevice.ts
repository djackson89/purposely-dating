import { useState, useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export const useDevice = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const initializeDevice = async () => {
      if (isNative) {
        // Set status bar style with iPad-specific handling
        try {
          await StatusBar.setStyle({ style: Style.Light });
          // Use a more compatible color for iPad
          await StatusBar.setBackgroundColor({ color: '#FF6B9D' }); // Primary color
          
          // iPad-specific: Set overlay to true for better compatibility
          if (Capacitor.getPlatform() === 'ios') {
            await StatusBar.setOverlaysWebView({ overlay: true });
          }
        } catch (error) {
          console.warn('Status bar setup failed:', error);
          // Fallback: Continue without status bar customization
        }

        // Network monitoring
        try {
          const status = await Network.getStatus();
          setIsOnline(status.connected);
          setConnectionType(status.connectionType);

          const networkListener = await Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
            setIsOnline(status.connected);
            setConnectionType(status.connectionType);
          });

          // Cleanup function
          return () => {
            networkListener.remove();
          };
        } catch (error) {
          console.warn('Network monitoring setup failed:', error);
        }

        // Keyboard monitoring
        try {
          const showListener = await Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
            setKeyboardVisible(true);
            setKeyboardHeight(info.keyboardHeight);
          });

          const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
          });

          return () => {
            showListener.remove();
            hideListener.remove();
          };
        } catch (error) {
          console.warn('Keyboard monitoring setup failed:', error);
        }
      } else {
        // Web fallback for network status
        const updateOnlineStatus = () => {
          setIsOnline(navigator.onLine);
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
          window.removeEventListener('online', updateOnlineStatus);
          window.removeEventListener('offline', updateOnlineStatus);
        };
      }
    };

    const cleanup = initializeDevice();
    
    return () => {
      cleanup?.then?.((cleanupFn: (() => void) | undefined) => {
        if (cleanupFn) cleanupFn();
      });
    };
  }, [isNative]);

  const setStatusBarStyle = async (style: Style) => {
    if (!isNative) return;
    
    try {
      await StatusBar.setStyle({ style });
    } catch (error) {
      console.warn('Failed to set status bar style:', error);
    }
  };

  const hideKeyboard = async () => {
    if (!isNative) return;
    
    try {
      await Keyboard.hide();
    } catch (error) {
      console.warn('Failed to hide keyboard:', error);
    }
  };

  const showKeyboard = async () => {
    if (!isNative) return;
    
    try {
      await Keyboard.show();
    } catch (error) {
      console.warn('Failed to show keyboard:', error);
    }
  };

  return {
    isNative,
    isOnline,
    connectionType,
    keyboardVisible,
    keyboardHeight,
    setStatusBarStyle,
    hideKeyboard,
    showKeyboard,
  };
};