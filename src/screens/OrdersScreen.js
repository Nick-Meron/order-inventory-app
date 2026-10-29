import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '../api';
import { colors, fonts } from '../theme';
import { formatMoney, formatStatus } from '../format';

// Colors written directly here, so they cannot come out empty or dark.
const STATUS_COLORS = {
  pending: '#E8A33D',
  confirmed: '#1FA34A',
  delivered: '#1FA34A',
  cancelled: '#D32F2F',
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export default function OrdersScreen({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiRequest('/orders', { token });
      setOrders(data.orders);
    } catch (e) {
      setError(e.message);
    }
  }, [token]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retry} onPress={refresh}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>You have no orders yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.order}>
          <View style={styles.topRow}>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={[styles.status, { color: STATUS_COLORS[item.status] || '#6B7A75' }]}>
              {formatStatus(item.status)}
            </Text>
          </View>

          <Text style={styles.date}>{formatDate(item.created_at)}</Text>

          {item.items.map((line) => (
            <View key={line.id} style={styles.lineRow}>
              <Text style={styles.lineName}>
                {line.quantity} x {line.product ? line.product.name : 'Removed product'}
              </Text>
              <Text style={styles.lineTotal}>
                {formatMoney(Number(line.unit_price) * line.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(item.total)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  error: { fontFamily: fonts.semi, fontSize: 16, color: colors.danger, textAlign: 'center' },
  retry: { backgroundColor: colors.saffron, paddingVertical: 12, paddingHorizontal: 24, marginTop: 18 },
  retryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.green },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  empty: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted, marginTop: 24 },
  order: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  status: { fontFamily: fonts.bold, fontSize: 16 },
  date: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 2, marginBottom: 10 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lineName: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text, paddingRight: 12 },
  lineTotal: { fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLabel: { fontFamily: fonts.semi, fontSize: 16, color: colors.muted },
  totalValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.green },
});