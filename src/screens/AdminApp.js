import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import AdminProductsScreen from './AdminProductsScreen';
import AdminOrdersScreen from './AdminOrdersScreen';
import LowStockScreen from './LowStockScreen';

const TABS = [
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'low', label: 'Low stock' },
];

export default function AdminApp({ user, token, onLogout }) {
  const [tab, setTab] = useState('products');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.hello}>Admin: {user.name}</Text>
            <Text style={styles.sub}>Order & Inventory</Text>
          </View>
          <Pressable onPress={onLogout} hitSlop={10}>
            <Text style={styles.logout}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {tab === 'products' && <AdminProductsScreen token={token} />}
        {tab === 'orders' && <AdminOrdersScreen token={token} />}
        {tab === 'low' && <LowStockScreen token={token} />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
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