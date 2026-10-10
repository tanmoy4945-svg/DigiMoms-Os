import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Default Production URL
const DEFAULT_URL = 'https://os.digimoms.in';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [appUrl, setAppUrl] = useState<string>(DEFAULT_URL);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  const injectTokensIntoWebView = (expTok: string | null, devTok: string | null) => {
    if (!webViewRef.current) return;
    const js = `
      (function() {
        window.expoPushToken = "${expTok || ''}";
        window.fcmDeviceToken = "${devTok || ''}";
        window.isNativeApp = true;
        try {
          window.dispatchEvent(new CustomEvent('native_token_ready', { 
            detail: { expoToken: "${expTok || ''}", fcmToken: "${devTok || ''}" } 
          }));
        } catch (e) {}
      })();
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  };

  // Setup Push Notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync().then(({ expoToken, rawDeviceToken }) => {
      if (expoToken) setPushToken(expoToken);
      if (rawDeviceToken) setDeviceToken(rawDeviceToken);
      injectTokensIntoWebView(expoToken, rawDeviceToken);
    });

    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Native App] Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Native App] Notification clicked:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Handle Android Hardware Back Button to navigate inside WebView
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false; // Let Android exit app if at root
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  const registerForPushNotificationsAsync = async () => {
    let expoToken: string | null = null;
    let rawDeviceToken: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.setNotificationChannelAsync('default', {
        name: 'General Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus === 'granted') {
        try {
          const pushTokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'ee23229b-e7cd-45d3-8dff-8f146abad8ad',
          });
          expoToken = pushTokenData.data;
          console.log('[Native App] Expo Push Token:', expoToken);
        } catch (e) {
          console.log('[Native App] Note on Expo push token:', e);
        }

        try {
          const devicePushData = await Notifications.getDevicePushTokenAsync();
          rawDeviceToken = devicePushData.data;
          console.log('[Native App] Device FCM Token:', rawDeviceToken);
        } catch (e) {
          console.log('[Native App] Note on Device push token:', e);
        }
      }
    }

    return { expoToken, rawDeviceToken };
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  const handleSaveCustomUrl = () => {
    let formatted = customUrlInput.trim();
    if (!formatted) {
      Alert.alert('Notice', 'Please enter a valid web URL.');
      return;
    }
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    setAppUrl(formatted);
    setShowSettingsModal(false);
    setHasError(false);
    setIsLoading(true);
  };

  const injectedJavaScript = `
    (function() {
      window.expoPushToken = "${pushToken || ''}";
      window.fcmDeviceToken = "${deviceToken || ''}";
      window.isNativeApp = true;
      try {
        window.dispatchEvent(new CustomEvent('native_token_ready', { 
          detail: { expoToken: "${pushToken || ''}", fcmToken: "${deviceToken || ''}" } 
        }));
      } catch (e) {}
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* Main Full-Screen Native WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: appUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={async (event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'NATIVE_NOTIFICATION') {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: data.title || '🔔 DigiMoms Alert',
                  body: data.body || '',
                  sound: 'default',
                  vibrate: [0, 250, 250, 250],
                  channelId: 'orders',
                  priority: Notifications.AndroidNotificationPriority.MAX,
                },
                trigger: null, // show immediately
              });
            } else if (data.type === 'REGISTER_PUSH_TOKEN' && data.restaurantId) {
              const activeTokens = [pushToken, deviceToken].filter(Boolean);
              if (activeTokens.length > 0) {
                try {
                  await fetch(`${appUrl}/api/register-fcm-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      restaurantId: data.restaurantId,
                      token: activeTokens,
                    }),
                  });
                  console.log('[Native App] Successfully registered push tokens directly to server for restaurant:', data.restaurantId);
                } catch (netErr) {
                  console.warn('[Native App] Token direct server registration error:', netErr);
                }
              }
            }
          } catch (e) {
            // Ignore non-json messages
          }
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => {
          setIsLoading(false);
          injectTokensIntoWebView(pushToken, deviceToken);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setHasError(true);
          setIsLoading(false);
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Opening DigiMoms Restaurant OS...</Text>
            <Text style={styles.loadingSubText}>Loading live app & real-time updates</Text>
          </View>
        )}
      />

      {/* Sleek Offline / Error Screen with Server URL setting */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Offline</Text>
          <Text style={styles.errorMessage}>
            Could not connect to {appUrl}. Please check your internet connection or update the app domain.
          </Text>

          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                setCustomUrlInput(appUrl);
                setShowSettingsModal(true);
              }}
            >
              <Text style={styles.settingsButtonText}>Change Server URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Domain / Server URL Switcher Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Live App Domain</Text>
            <Text style={styles.modalDescription}>
              Enter your live Vercel or custom domain (e.g. digimoms-os.vercel.app):
            </Text>

            <TextInput
              style={styles.input}
              value={customUrlInput}
              onChangeText={setCustomUrlInput}
              placeholder="https://your-domain.vercel.app"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveCustomUrl}
              >
                <Text style={styles.modalSaveButtonText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingSubText: {
    color: '#64748b',
    marginTop: 6,
    fontSize: 12,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 20,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalDescription: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
