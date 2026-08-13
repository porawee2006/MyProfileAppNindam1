import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';

export type EditableProduct = {
  id?: number | string;
  name: string;
  category?: string;
  brand?: string;
  capacity?: number;
  price?: number;
  stock: number;
  image?: string;
  location_text?: string;
};

export type AddProductScreenProps = {
  existingCategories?: string[];
  product?: EditableProduct | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function AddProductScreen({
  existingCategories = [],
  product = null,
  onSuccess,
  onCancel,
}: AddProductScreenProps) {
  const isEditMode = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [category, setCategory] = useState(product?.category ?? '');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [price, setPrice] = useState(String(product?.price ?? 0));
  const [capacity, setCapacity] = useState(String(product?.capacity ?? 0));
  const [image, setImage] = useState(product?.image ?? '');
  const [location, setLocation] = useState(product?.location_text ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const payload = {
      name,
      stock: parseInt(stock) || 0,
      category,
      brand,
      price: parseFloat(price) || 0,
      capacity: parseInt(capacity) || 0,
      image,
      location_text: location,
    };

    try {
      setIsLoading(true);
      const url = isEditMode 
        ? `http://119.59.102.161:3028/api/products/${product.id}`
        : 'http://119.59.102.161:3028/api/products';
      
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      Alert.alert('Success', isEditMode ? 'Product updated!' : `Product created! ID: ${data.productId}`);
      
      if (!isEditMode) {
        // Reset form
        setName('');
        setStock('0');
        setCategory('');
        setBrand('');
        setPrice('0');
        setCapacity('0');
        setImage('');
        setLocation('');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{isEditMode ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter product name" />

        <Text style={styles.label}>Category</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Enter category" />

        <Text style={styles.label}>Brand</Text>
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Enter brand" />

        <Text style={styles.label}>Price</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Enter price" keyboardType="numeric" />

        <Text style={styles.label}>Stock</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="Enter stock quantity" keyboardType="numeric" />

        <Text style={styles.label}>Capacity</Text>
        <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="Enter capacity (e.g. 10000)" keyboardType="numeric" />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Enter location" />

        <Text style={styles.label}>Image URL</Text>
        <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="Enter image URL" autoCapitalize="none" />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  cancelText: { fontSize: 16, color: '#4F46E5', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#FFFFFF' },
  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
