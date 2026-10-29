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
import { formatMoney } from '../format';

export default function ProductsScreen({ token, cart, onAdd }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await apiRequest('/products', { token });
      setProducts(data.products);
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

  if (error && products.length === 0) {
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
      data={products}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
      renderItem={({ item }) => {
        const inCart = cart[item.id] ? cart[item.id].quantity : 0;
        const outOfStock = item.stock <= 0;
        const maxed = inCart >= item.stock;

        let stockText = `${item.stock} in stock`;
        if (outOfStock) stockText = 'Out of stock';
        else if (item.stock <= 5) stockText = `Only ${item.stock} left`;

        return (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{formatMoney(item.price)}</Text>
              <Text style={[styles.stock, item.stock <= 5 && styles.stockLow]}>
                {stockText}
                {inCart > 0 ? `  ·  In cart: ${inCart}` : ''}
              </Text>
            </View>

            <Pressable
              style={[styles.add, maxed && styles.addDisabled]}
              onPress={() => onAdd(item)}
              disabled={maxed}
            >
              <Text style={styles.addText}>{outOfStock ? 'Sold out' : maxed ? 'Max' : 'Add'}</Text>
            </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  info: { flex: 1, paddingRight: 12 },
  name: { fontFamily: fonts.semi, fontSize: 18, color: colors.text },
  price: { fontFamily: fonts.bold, fontSize: 16, color: colors.green, marginTop: 2 },
  stock: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  stockLow: { color: colors.danger },
  add: {
    backgroundColor: colors.saffron,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 84,
    alignItems: 'center',
  },
  addDisabled: { opacity: 0.4 },
  addText: { fontFamily: fonts.bold, fontSize: 16, color: colors.green },
});