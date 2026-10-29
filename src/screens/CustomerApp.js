import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import ProductsScreen from './ProductsScreen';
import CartScreen from './CartScreen';
import OrdersScreen from './OrdersScreen';

const TABS = [
  { key: 'products', label: 'Products' },
  { key: 'cart', label: 'Cart' },
  { key: 'orders', label: 'Orders' },
];

export default function CustomerApp({ user, token, onLogout }) {
  const [tab, setTab] = useState('products');
  // cart looks like: { 3: { product: {...}, quantity: 2 } }
  const [cart, setCart] = useState({});

  const cartCount = Object.values(cart).reduce((sum, line) => sum + line.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const existing = current[product.id];
      const quantity = existing ? existing.quantity : 0;
      if (quantity >= product.stock) return current;
      return { ...current, [product.id]: { product, quantity: quantity + 1 } };
    });
  }

  // Set a new quantity. Zero or less removes the line.
  function changeQuantity(productId, quantity) {
    setCart((current) => {
      const line = current[productId];
      if (!line) return current;

      if (quantity <= 0) {
        const { [productId]: removed, ...rest } = current;
        return rest;
      }

      if (quantity > line.product.stock) return current;
      return { ...current, [productId]: { ...line, quantity } };
    });
  }

  function handlePlaced() {
    setCart({});
    setTab('orders');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.hello}>Hello, {user.name}</Text>
            <Text style={styles.sub}>Order & Inventory</Text>
          </View>
          <Pressable onPress={onLogout} hitSlop={10}>
            <Text style={styles.logout}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'products' && (
          <ProductsScreen token={token} cart={cart} onAdd={addToCart} />
        )}
        {tab === 'cart' && (
          <CartScreen
            token={token}
            cart={cart}
            onChangeQuantity={changeQuantity}
            onPlaced={handlePlaced}
            onGoToProducts={() => setTab('products')}
          />
        )}
        {tab === 'orders' && <OrdersScreen token={token} />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
              {t.key === 'cart' && cartCount > 0 ? ` (${cartCount})` : ''}
            </Text>
            {tab === t.key && <View style={styles.tabLine} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.green,
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { flex: 1, paddingRight: 12 },
  hello: { fontFamily: fonts.bold, fontSize: 24, color: colors.saffron },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.background, marginTop: 4 },
  logout: { fontFamily: fonts.semi, fontSize: 15, color: colors.background },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.background,
    paddingBottom: 24,
  },
  tab: { flex: 1, alignItems: 'center', paddingTop: 14 },
  tabText: { fontFamily: fonts.semi, fontSize: 15, color: colors.muted },
  tabTextActive: { color: colors.green },
  tabLine: { height: 3, width: 28, backgroundColor: colors.saffron, marginTop: 8 },
});