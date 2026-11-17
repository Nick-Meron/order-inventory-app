import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from '../api';
import { colors, fonts } from '../theme';
import { formatMoney } from '../format';

export default function CartScreen({ token, cart, onChangeQuantity, onPlaced, onGoToProducts }) {
  const [deliveryName, setDeliveryName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lines = Object.values(cart);
  // This total is only a preview. The server calculates the real total.
  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  async function placeOrder() {
    if (busy || lines.length === 0) return;
    setError('');

    const cleanPhone = phone.replace(/[\s-]/g, '');

    if (deliveryName.trim().length < 2) {
      setError('Please enter the name for delivery.');
      return;
    }
    if (!/^(\+94|0)\d{9}$/.test(cleanPhone)) {
      setError('Enter a valid phone number like 0771234567.');
      return;
    }
    if (address.trim().length < 5) {
      setError('Please enter the delivery address.');
      return;
    }
    if (city.trim().length < 2) {
      setError('Please enter the city.');
      return;
    }

    setBusy(true);
    try {
      const items = lines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
      }));

      const data = await apiRequest('/orders', {
        method: 'POST',
        token,
        body: {
          delivery_name: deliveryName.trim(),
          phone: cleanPhone,
          address: address.trim(),
          city: city.trim(),
          items,
        },
      });

      setBusy(false);
      Alert.alert('Order placed', `Order #${data.order.id} total: ${formatMoney(data.order.total)}`);
      onPlaced();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Pressable style={styles.secondary} onPress={onGoToProducts}>
          <Text style={styles.secondaryText}>Browse products</Text>
        </Pressable>
      </View>
    );
  }

  const footer = (
    <View style={styles.footer}>
      <Text style={styles.sectionTitle}>Delivery details</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={deliveryName}
        onChangeText={setDeliveryName}
        autoCapitalize="words"
        editable={!busy}
      />

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="0771234567"
        placeholderTextColor={colors.muted}
        editable={!busy}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        autoCapitalize="words"
        editable={!busy}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        autoCapitalize="words"
        editable={!busy}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatMoney(total)}</Text>
      </View>

      <Pressable
        style={[styles.button, busy && styles.buttonBusy]}
        onPress={placeOrder}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color={colors.green} />
        ) : (
          <Text style={styles.buttonText}>Place order</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={lines}
        keyExtractor={(line) => String(line.product.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.product.image_url ? (
              <Image source={{ uri: item.product.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Text style={styles.thumbEmptyText}>No photo</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>{formatMoney(item.product.price)} each</Text>
              <Text style={styles.lineTotal}>
                {formatMoney(Number(item.product.price) * item.quantity)}
              </Text>
            </View>

            <View style={styles.stepper}>
              <Pressable
                style={styles.stepButton}
                onPress={() => onChangeQuantity(item.product.id, item.quantity - 1)}
                disabled={busy}
              >
                <Text style={styles.stepText}>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Pressable
                style={[styles.stepButton, item.quantity >= item.product.stock && styles.stepDisabled]}
                onPress={() => onChangeQuantity(item.product.id, item.quantity + 1)}
                disabled={busy || item.quantity >= item.product.stock}
              >
                <Text style={styles.stepText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  emptyTitle: { fontFamily: fonts.semi, fontSize: 18, color: colors.muted },
  secondary: {
    borderWidth: 1,
    borderColor: colors.green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 18,
  },
  secondaryText: { fontFamily: fonts.semi, fontSize: 16, color: colors.green },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 64, height: 64, backgroundColor: colors.line, marginRight: 12 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbEmptyText: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  info: { flex: 1, paddingRight: 8 },
  name: { fontFamily: fonts.semi, fontSize: 16, color: colors.text },
  price: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  lineTotal: { fontFamily: fonts.bold, fontSize: 15, color: colors.green, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.green,
  },
  stepDisabled: { opacity: 0.3 },
  stepText: { fontFamily: fonts.bold, fontSize: 20, color: colors.green },
  quantity: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  footer: { paddingTop: 24 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.green },
  label: { fontFamily: fonts.semi, fontSize: 14, color: colors.muted, marginTop: 16 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
  },
  error: { fontFamily: fonts.semi, fontSize: 15, color: '#D32F2F', marginTop: 18 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  totalLabel: { fontFamily: fonts.semi, fontSize: 18, color: colors.muted },
  totalValue: { fontFamily: fonts.bold, fontSize: 24, color: colors.green },
  button: {
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 14,
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { fontFamily: fonts.bold, fontSize: 18, color: colors.green },
});