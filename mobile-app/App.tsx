import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, TextInput, Alert, Platform, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { LogIn, ShoppingBag, Bell, LogOut, RefreshCw, ChevronRight } from 'lucide-react-native';

// CONFIGURATION - Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';
const SERVER_URL = 'https://ais-dev-5x3soypc4mbolsewuequye-904064987853.asia-southeast1.run.app'; // Your server URL for registering FCM tokens

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'staff' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [expoPushToken, setExpoPushToken] = useState('');
  
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
      fetchOrders();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getDevicePushTokenAsync()).data;
      console.log('FCM Token:', token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    return token;
  };

  const handleLogin = async () => {
    if (!mobile || !password) return Alert.alert('Error', 'Please enter mobile and password');
    setLoading(true);

    try {
      // Try Owner Login
      const { data: owners } = await supabase.from('restaurants').select('*').eq('owner_mobile', mobile).eq('password_hash', password).maybeSingle();
      if (owners) {
        setIsAuthenticated(true);
        setUserRole('owner');
        setCurrentUser(owners);
        registerTokenOnServer(owners.id);
        fetchOrders(owners.id);
      } else {
        // Try Staff Login
        const { data: staff } = await supabase.from('staff').select('*').eq('mobile', mobile).eq('password_hash', password).maybeSingle();
        if (staff) {
          setIsAuthenticated(true);
          setUserRole('staff');
          setCurrentUser(staff);
          registerTokenOnServer(staff.restaurant_id);
          fetchOrders(staff.restaurant_id);
        } else {
          Alert.alert('Login Failed', 'Invalid mobile number or password.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong during login.');
    } finally {
      setLoading(false);
    }
  };

  const registerTokenOnServer = async (restaurantId: string) => {
    if (!expoPushToken) return;
    try {
      await fetch(`${SERVER_URL}/api/fcm/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, token: expoPushToken }),
      });
    } catch (err) {
      console.warn('Error registering token on server:', err);
    }
  };

  const fetchOrders = async (restId?: string) => {
    const rId = restId || currentUser?.restaurant_id || currentUser?.id;
    if (!rId) return;

    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', rId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setMobile('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCard}>
          <Text style={styles.title}>DigiMoms Manager</Text>
          <Text style={styles.subtitle}>Owner & Staff Login</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#94a3b8"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <LogIn size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Login to Dashboard</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{currentUser.name || 'Manager'}</Text>
          <Text style={styles.headerSubtitle}>{userRole?.toUpperCase()} Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut size={24} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <ShoppingBag size={20} color="#3b82f6" />
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Recent Orders</Text>
        </View>
        <View style={styles.statBox}>
          <Bell size={20} color="#10b981" />
          <Text style={styles.statValue}>Active</Text>
          <Text style={styles.statLabel}>Notifications</Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Live Orders</Text>
        <TouchableOpacity onPress={() => fetchOrders()}>
          <RefreshCw size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <Text style={styles.orderTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            </View>
            <View style={styles.orderBody}>
              <Text style={styles.tableText}>Table: {item.table_number}</Text>
              <Text style={styles.totalText}>₹{item.grand_total}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.badge, { backgroundColor: item.payment_status.includes('paid') ? '#064e3b' : '#451a03' }]}>
                <Text style={[styles.badgeText, { color: item.payment_status.includes('paid') ? '#34d399' : '#fbbf24' }]}>
                  {item.payment_status.toUpperCase()}
                </Text>
              </View>
              <ChevronRight size={16} color="#475569" />
            </View>
          </View>
        )}
        refreshing={loading}
        onRefresh={fetchOrders}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20,
  },
  loginCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 20 : 0,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  orderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  orderTime: {
    fontSize: 12,
    color: '#64748b',
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableText: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
