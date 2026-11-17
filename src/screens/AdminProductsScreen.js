import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiRequest, apiUpload } from '../api';
import { colors, fonts } from '../theme';
import { formatMoney } from '../format';

function buildPhotoForm(asset) {
  const type = asset.mimeType || 'image/jpeg';
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';

  const form = new FormData();
  form.append('image', { uri: asset.uri, name: `photo.${extension}`, type });
  return form;
}

export default function AdminProductsScreen({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // editing: null = form closed, {} = adding a new product, {id...} = editing one
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [active, setActive] = useState(true);
  const [photo, setPhoto] = useState(null); // a newly picked photo, not uploaded yet
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

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

  function openNew() {
    setName('');
    setPrice('');
    setStock('');
    setActive(true);
    setPhoto(null);
    setFormError('');
    setEditing({});
  }

  function openEdit(product) {
    setName(product.name);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setActive(Boolean(product.active));
    setPhoto(null);
    setFormError('');
    setEditing(product);
  }

  function closeForm() {
    if (saving) return;
    setEditing(null);
  }

  async function pickPhoto() {
    if (saving) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0]);
      }
    } catch (e) {
      setFormError('Could not open the photo library.');
    }
  }

  async function save() {
    if (saving) return;
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(price.trim())) {
      setFormError('Price must be a number like 4.50.');
      return;
    }
    if (!/^\d+$/.test(stock.trim())) {
      setFormError('Stock must be a whole number like 40.');
      return;
    }

    const body = {
      name: name.trim(),
      price: Number(price.trim()),
      stock: parseInt(stock.trim(), 10),
      active,
    };

    setSaving(true);
    let photoProblem = '';
    try {
      let saved;
      if (editing && editing.id) {
        saved = await apiRequest(`/products/${editing.id}`, { method: 'PUT', token, body });
      } else {
        saved = await apiRequest('/products', { method: 'POST', token, body });
      }

      if (photo) {
        try {
          await apiUpload(`/products/${saved.product.id}/image`, buildPhotoForm(photo), token);
        } catch (e) {
          photoProblem = e.message;
        }
      }

      setSaving(false);
      setEditing(null);
      await load();

      if (photoProblem) {
        Alert.alert('Photo not uploaded', `The product was saved, but the photo failed: ${photoProblem}`);
      }
    } catch (e) {
      setFormError(e.message);
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!editing || !editing.id || saving) return;

    Alert.alert('Delete product', `Delete ${editing.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          setFormError('');
          try {
            await apiRequest(`/products/${editing.id}`, { method: 'DELETE', token });
            setSaving(false);
            setEditing(null);
            await load();
          } catch (e) {
            // for example: the product is in existing orders
            setFormError(e.message);
            setSaving(false);
          }
        },
      },
    ]);
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

  const isNew = !(editing && editing.id);
  const previewUri = photo ? photo.uri : editing && editing.image_url ? editing.image_url : null;

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Pressable style={styles.addButton} onPress={openNew}>
            <Text style={styles.addButtonText}>+ Add product</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openEdit(item)}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbEmpty]}>
                <Text style={styles.thumbEmptyText}>No photo</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={[styles.name, !item.active && styles.inactiveText]}>{item.name}</Text>
              <Text style={styles.price}>{formatMoney(item.price)}</Text>
              <Text style={[styles.stock, item.stock <= 5 && styles.stockLow]}>
                {item.stock} in stock
                {!item.active ? '  ·  Inactive' : ''}
              </Text>
            </View>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        )}
      />

      <Modal visible={editing !== null} animationType="slide" onRequestClose={closeForm}>
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isNew ? 'Add product' : 'Edit product'}</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Photo</Text>
              <Pressable style={styles.photoBox} onPress={pickPhoto} disabled={saving}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoHint}>Tap to choose a photo</Text>
                )}
              </Pressable>
              {previewUri ? (
                <Pressable onPress={pickPhoto} disabled={saving}>
                  <Text style={styles.photoChange}>Change photo</Text>
                </Pressable>
              ) : null}

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                editable={!saving}
              />

              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                editable={!saving}
              />

              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
                editable={!saving}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active (customers can see it)</Text>
                <Switch
                  value={active}
                  onValueChange={setActive}
                  disabled={saving}
                  trackColor={{ true: colors.saffron }}
                />
              </View>

              {formError ? <Text style={styles.formError}>{formError}</Text> : null}

              <Pressable
                style={[styles.saveButton, saving && styles.busy]}
                onPress={save}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.green} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={closeForm} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              {!isNew && (
                <Pressable style={styles.deleteButton} onPress={confirmDelete} disabled={saving}>
                  <Text style={styles.deleteText}>Delete product</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  error: { fontFamily: fonts.semi, fontSize: 16, color: colors.danger, textAlign: 'center' },
  retry: { backgroundColor: colors.saffron, paddingVertical: 12, paddingHorizontal: 24, marginTop: 18 },
  retryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.green },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  empty: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted, marginTop: 24 },
  addButton: {
    backgroundColor: colors.saffron,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  addButtonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.green },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 64, height: 64, backgroundColor: colors.line, marginRight: 14 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  thumbEmptyText: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  info: { flex: 1, paddingRight: 12 },
  name: { fontFamily: fonts.semi, fontSize: 18, color: colors.text },
  inactiveText: { color: colors.muted },
  price: { fontFamily: fonts.bold, fontSize: 16, color: colors.green, marginTop: 2 },
  stock: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },
  stockLow: { color: '#D32F2F' },
  edit: { fontFamily: fonts.semi, fontSize: 15, color: colors.green },
  modal: { flex: 1, backgroundColor: colors.background },
  modalScroll: { flexGrow: 1 },
  modalHeader: {
    backgroundColor: colors.green,
    paddingTop: 64,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 26, color: colors.saffron },
  form: { padding: 24 },
  label: { fontFamily: fonts.semi, fontSize: 14, color: colors.muted, marginTop: 18 },
  photoBox: {
    height: 180,
    marginTop: 10,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoHint: { fontFamily: fonts.semi, fontSize: 15, color: colors.muted },
  photoChange: { fontFamily: fonts.semi, fontSize: 14, color: colors.green, marginTop: 10 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  switchLabel: { fontFamily: fonts.semi, fontSize: 16, color: colors.text, flex: 1, paddingRight: 12 },
  formError: { fontFamily: fonts.semi, fontSize: 15, color: '#D32F2F', marginTop: 18 },
  saveButton: {
    backgroundColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 28,
  },
  busy: { opacity: 0.7 },
  saveText: { fontFamily: fonts.bold, fontSize: 18, color: colors.green },
  cancelButton: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  cancelText: { fontFamily: fonts.semi, fontSize: 16, color: colors.green },
  deleteButton: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  deleteText: { fontFamily: fonts.semi, fontSize: 16, color: '#D32F2F' },
});