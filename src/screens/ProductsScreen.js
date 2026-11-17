import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Text style={styles.thumbEmptyText}>No photo</Text>
              </View>
            )}

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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 72, height: 72, backgroundColor: colors.line, marginRight: 14 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbEmptyText: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  info: { flex: 1, paddingRight: 10 },
  name: { fontFamily: fonts.semi, fontSize: 17, color: colors.text },
  price: { fontFamily: fonts.bold, fontSize: 16, color: colors.green, marginTop: 2 },
  stock: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  stockLow: { color: '#D32F2F' },
  add: {
    backgroundColor: colors.saffron,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 76,
    alignItems: 'center',
  },
  addDisabled: { opacity: 0.4 },
  addText: { fontFamily: fonts.bold, fontSize: 15, color: colors.green },
});