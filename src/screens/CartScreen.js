import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '../api';
import { colors, fonts } from '../theme';
import { formatMoney } from '../format';

export default function CartScreen({ token, cart, onChangeQuantity, onPlaced, onGoToProducts }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const lines = Object.values(cart);
  // This total is only a preview. The server calculates the real total.
  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  async function placeOrder() {
    if (busy || lines.length === 0) return;

    setError('');
    setBusy(true);
    try {
      const items = lines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
      }));

      const data = await apiRequest('/orders', {
        method: 'POST',
        token,
        body: { items },
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

  return (
    <View style={styles.container}>
      <FlatList
        data={lines}
        keyExtractor={(line) => String(line.product.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>
                {formatMoney(item.product.price)} each · {formatMoney(Number(item.product.price) * item.quantity)}
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

      <View style={styles.footer}>
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
    </View>
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
  list: { paddingHorizontal: 24, paddingBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  info: { flex: 1, paddingRight: 12 },
  name: { fontFamily: fonts.semi, fontSize: 18, color: colors.text },
  price: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.green,
  },
  stepDisabled: { opacity: 0.3 },
  stepText: { fontFamily: fonts.bold, fontSize: 20, color: colors.green },
  quantity: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  error: { fontFamily: fonts.semi, fontSize: 15, color: colors.danger, marginBottom: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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