import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Switch,
  Image, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS } from '../../../lib/constants';

export default function CreateNewsScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', content: '', isPublished: true });
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const handleCreate = async () => {
    if (!form.title || !form.content) {
      setError('Title and content are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('isPublished', String(form.isPublished));

      images.forEach((img) => {
        const filename = img.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', { uri: img.uri, name: filename, type } as any);
      });

      await api.post('/news', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Published!', 'Your news post has been created.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>New Post</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input} value={form.title}
          onChangeText={(v) => setForm({ ...form, title: v })}
          placeholder="Post title" placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Content *</Text>
        <TextInput
          style={[styles.input, styles.textarea]} value={form.content}
          onChangeText={(v) => setForm({ ...form, content: v })}
          placeholder="Write your post content here..." multiline numberOfLines={8}
          textAlignVertical="top" placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Images (up to 5)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
          <Ionicons name="image-outline" size={22} color={COLORS.primary} />
          <Text style={styles.imagePickerText}>
            {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'Tap to add images'}
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <FlatList
            data={images}
            horizontal
            keyExtractor={(item) => item.uri}
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            renderItem={({ item }) => (
              <View style={styles.imageThumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.imageThumb} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(item.uri)}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Publish immediately</Text>
          <Switch
            value={form.isPublished}
            onValueChange={(v) => setForm({ ...form, isPublished: v })}
            trackColor={{ true: COLORS.primary }}
          />
        </View>
        <Text style={styles.switchHint}>
          {form.isPublished ? 'Post will be visible on the public news feed.' : 'Post will be saved as a draft.'}
        </Text>

        <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleCreate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating…' : form.isPublished ? 'Publish Post' : 'Save Draft'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  textarea: { height: 200, paddingTop: 12 },
  imagePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primary,
    borderStyle: 'dashed', borderRadius: 10, padding: 14,
  },
  imagePickerText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  imageList: { marginTop: 12 },
  imageThumbWrap: { marginRight: 10, position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: COLORS.error, borderRadius: 10,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  switchHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 10 },
});
