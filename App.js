import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import { apiRequest } from './src/api';
import { colors } from './src/theme';
import AuthScreen from './src/screens/AuthScreen';
import CustomerApp from './src/screens/CustomerApp';
import AdminApp from './src/screens/AdminApp';

const TOKEN_KEY = 'auth_token';

export default function App() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // On start: if a token was saved, ask the server who it belongs to.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          const data = await apiRequest('/me', { token: saved });
          if (!cancelled) {
            setToken(saved);
            setUser(data.user);
          }
        }
      } catch (e) {
        // 401 means the saved token is no longer valid, so forget it.
        if (e.status === 401) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAuthenticated(newToken, newUser) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function handleLogout() {
    try {
      await apiRequest('/logout', { method: 'POST', token });
    } catch (e) {
      // even if the server can't be reached, log out on this phone
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  if (!fontsLoaded || checking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.green,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.saffron} size="large" />
      </View>
    );
  }

  let screen;
  if (!token || !user) {
    screen = <AuthScreen onAuthenticated={handleAuthenticated} />;
  } else if (user.role === 'admin') {
    screen = <AdminApp user={user} token={token} onLogout={handleLogout} />;
  } else {
    screen = <CustomerApp user={user} token={token} onLogout={handleLogout} />;
  }

  return (
    <>
      {screen}
      <StatusBar style="light" />
    </>
  );
}