import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from '../api';
import { colors, fonts } from '../theme';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  async function submit() {
    setError('');

    if (isRegister && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      const body = isRegister
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const data = await apiRequest(isRegister ? '/register' : '/login', {
        method: 'POST',
        body,
      });

      await onAuthenticated(data.token, data.user);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Order & Inventory</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Create your account' : 'Log in to continue'}
          </Text>
        </View>

        <View style={styles.form}>
          {isRegister && (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!busy}
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!busy}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, busy && styles.buttonBusy]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.green} />
            ) : (
              <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Log in'}</Text>
            )}
          </Pressable>

          <Pressable onPress={switchMode} disabled={busy} style={styles.switch}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account? Log in' : 'New here? Create an account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  header: {
    backgroundColor: colors.green,
    paddingTop: 90,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  brand: { fontFamily: fonts.bold, fontSize: 32, color: colors.saffron },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.background,
    marginTop: 8,
  },
  form: { padding: 24 },
  label: {
    fontFamily: fonts.semi,
    fontSize: 14,
    color: colors.muted,
    marginTop: 18,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
  },
  error: {
    fontFamily: fonts.semi,
    fontSize: 15,
    color: colors.danger,
    marginTop: 18,
  },
  button: {
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 28,
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { fontFamily: fonts.bold, fontSize: 18, color: colors.green },
  switch: { alignItems: 'center', marginTop: 22 },
  switchText: { fontFamily: fonts.semi, fontSize: 15, color: colors.green },
});