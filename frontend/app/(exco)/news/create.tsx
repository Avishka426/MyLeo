import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Switch, Image, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';

export default function CreateNewsScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const [form, setForm] = useState({ title: '', content: '', isPublished: true });
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Please allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets].slice(0, 5));
  };

  const handleCreate = async () => {
    if (!form.title || !form.content) { setError('Title and content are required.'); return; }
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('isPublished', String(form.isPublished));
      images.forEach((img) => {
        const filename = img.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        formData.append('images', { uri: img.uri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' } as any);
      });
      await api.post('/news', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Published!', 'Your news post has been created.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 20 }}>New Post</Text>

        {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>Title *</Text>
        <TextInput
          style={inputStyle} value={form.title}
          onChangeText={(v) => setForm({ ...form, title: v })}
          placeholder="Post title" placeholderTextColor={colors.textMuted}
        />

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>Content *</Text>
        <TextInput
          style={[inputStyle, { height: 200, paddingTop: 12, textAlignVertical: 'top' }]} value={form.content}
          onChangeText={(v) => setForm({ ...form, content: v })}
          placeholder="Write your post content here..." multiline numberOfLines={8}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>Images (up to 5)</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: radius.md, padding: 14 }}
          onPress={pickImages}
        >
          <Ionicons name="image-outline" size={22} color={colors.primary} />
          <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
            {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'Tap to add images'}
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <FlatList
            data={images} horizontal
            keyExtractor={(item) => item.uri}
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
            renderItem={({ item }) => (
              <View style={{ marginRight: 10, position: 'relative' }}>
                <Image source={{ uri: item.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                <TouchableOpacity
                  style={{ position: 'absolute', top: -6, right: -6, backgroundColor: colors.error, borderRadius: 10 }}
                  onPress={() => setImages((prev) => prev.filter((img) => img.uri !== item.uri))}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Publish immediately</Text>
          <Switch
            value={form.isPublished}
            onValueChange={(v) => setForm({ ...form, isPublished: v })}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
          {form.isPublished ? 'Post will be visible on the public news feed.' : 'Post will be saved as a draft.'}
        </Text>

        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 24, opacity: loading ? 0.6 : 1 }}
          onPress={handleCreate} disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{loading ? 'Creating…' : form.isPublished ? 'Publish Post' : 'Save Draft'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
