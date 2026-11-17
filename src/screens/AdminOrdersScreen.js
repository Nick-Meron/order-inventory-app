import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '../api';
import { colors, fonts } from '../theme';
import { formatMoney, formatStatus } from '../format';

const STATUS_COLORS = {
  pending: '#E8A33D',
  confirmed: '#1FA34A',
  delivered: '#1FA34A',
  cancelled: '#D32F2F',
};

// Same rules as the server. The server still checks them again.
const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const BUTTON_LABELS = {
  confirmed: 'Confirm',
  delivered: 'Mark delivered',
  cancelled: 'Cancel order',
};

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export default function AdminOrdersScreen({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

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

  async function sendStatus(order, status) {
    setBusyId(order.id);
    try {
      await apiRequest(`/orders/${order.id}/status`, {
        method: 'PATCH',
        token,
        body: { status },
      });
    } catch (e) {
      Alert.alert('Could not change status', e.message);
    }
    await load();
    setBusyId(null);
  }

  function changeStatus(order, status) {
    if (busyId !== null) return;

    if (status === 'cancelled') {
      Alert.alert(
        'Cancel order',
        `Cancel order #${order.id}? The stock will be returned.`,
        [
          { text: 'Keep order', style: 'cancel' },
          { text: 'Cancel order', style: 'destructive', onPress: () => sendStatus(order, status) },
        ]
      );
      return;
    }

    sendStatus(order, status);
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
      ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      renderItem={({ item }) => {
        const next = NEXT_STATUSES[item.status] || [];
        const busy = busyId === item.id;

        return (
          <View style={styles.order}>
            <View style={styles.topRow}>
              <Text style={styles.orderId}>Order #{item.id}</Text>
              <Text style={[styles.status, { color: STATUS_COLORS[item.status] || '#6B7A75' }]}>
                {formatStatus(item.status)}
              </Text>
            </View>

            <Text style={styles.customer}>
              {item.user ? item.user.name : 'Unknown customer'} · {formatDate(item.created_at)}
            </Text>

            {item.items.map((line) => (
              <View key={line.id} style={styles.lineRow}>
                {line.product && line.product.image_url ? (
                  <Image source={{ uri: line.product.image_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Text style={styles.thumbEmptyText}>No photo</Text>
                  </View>
                )}
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName}>
                    {line.product ? line.product.name : 'Removed product'}
                  </Text>
                  <Text style={styles.lineDetail}>
                    {line.quantity} x {formatMoney(line.unit_price)}
                  </Text>
                </View>
                <Text style={styles.lineTotal}>
                  {formatMoney(Number(line.unit_price) * line.quantity)}
                </Text>
              </View>
            ))}

            {item.delivery_name ? (
              <View style={styles.delivery}>
                <Text style={styles.deliveryTitle}>Deliver to</Text>
                <Text style={styles.deliveryName}>{item.delivery_name}</Text>
                <Text style={styles.deliveryText}>{item.phone}</Text>
                <Text style={styles.deliveryText}>
                  {item.address}, {item.city}
                </Text>
              </View>
            ) : (
              <Text style={styles.noDelivery}>No delivery details (older order)</Text>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatMoney(item.total)}</Text>
            </View>

            {next.length > 0 && (
              <View style={styles.actions}>
                {busy ? (
                  <ActivityIndicator color={colors.green} />
                ) : (
                  next.map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.action,
                        status === 'cancelled' ? styles.actionDanger : styles.actionMain,
                      ]}
                      onPress={() => changeStatus(item, status)}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          status === 'cancelled' ? styles.actionTextDanger : styles.actionTextMain,
                        ]}
                      >
                        {BUTTON_LABELS[status]}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </View>
        );
      }}
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
  customer: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  lineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  thumb: { width: 48, height: 48, backgroundColor: colors.line, marginRight: 12 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbEmptyText: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted },
  lineInfo: { flex: 1, paddingRight: 8 },
  lineName: { fontFamily: fonts.semi, fontSize: 15, color: colors.text },
  lineDetail: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  lineTotal: { fontFamily: fonts.semi, fontSize: 15, color: colors.text },
  delivery: { marginTop: 14 },
  deliveryTitle: { fontFamily: fonts.semi, fontSize: 13, color: colors.muted, marginBottom: 2 },
  deliveryName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  deliveryText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, marginTop: 1 },
  noDelivery: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  totalLabel: { fontFamily: fonts.semi, fontSize: 16, color: colors.muted },
  totalValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.green },
  actions: { flexDirection: 'row', marginTop: 14 },
  action: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
  },
  actionMain: { backgroundColor: colors.saffron },
  actionDanger: { borderWidth: 1, borderColor: '#D32F2F' },
  actionText: { fontFamily: fonts.bold, fontSize: 15 },
  actionTextMain: { color: colors.green },
  actionTextDanger: { color: '#D32F2F' },
});