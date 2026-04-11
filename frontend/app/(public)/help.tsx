import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, FlatList, RefreshControl, Image, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/ui/EmptyState';
import HelpRequestCard, { HelpRequestItem } from '../../components/HelpRequestCard';

export default function HelpScreen() {
  const { colors, radius } = useTheme();
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', subject: '', message: '' });
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/help-requests');
      setRequests(res.data.data);
    } catch { }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  const onRefresh = async () => { setRefreshing(true); await fetchRequests(); setRefreshing(false); };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow photo access to attach images.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets].slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!form.guestName || !form.guestEmail || !form.subject || !form.message) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('guestName', form.guestName);
      formData.append('guestEmail', form.guestEmail);
      formData.append('guestPhone', form.guestPhone);
      formData.append('subject', form.subject);
      formData.append('message', form.message);
      images.forEach((img) => {
        const filename = img.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        formData.append('images', { uri: img.uri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' } as any);
      });
      await api.post('/help-requests', formData, { transformRequest: (data) => data });
      setForm({ guestName: '', guestEmail: '', guestPhone: '', subject: '', message: '' });
      setImages([]);
      setShowForm(false);
      await fetchRequests();
      Alert.alert('Submitted!', 'Your request is now visible to all Leo clubs.');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: colors.text,
  };
  const labelStyle = { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: 5, marginTop: 12 };

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, backgroundColor: colors.background }}
      style={{ backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          {/* Post bar */}
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.card, borderRadius: radius.lg,
              padding: 14, marginBottom: 12,
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={() => setShowForm((v) => !v)} activeOpacity={0.8}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: colors.textMuted }}>Ask for help from Leo clubs…</Text>
            <Ionicons name={showForm ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Form */}
          {showForm && (
            <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 }}>Post a Help Request</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 }}>
                Leo clubs across your area will see this and can offer help.
              </Text>
              {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}

              <Text style={labelStyle}>Full Name *</Text>
              <TextInput style={inputStyle} value={form.guestName} onChangeText={(v) => setForm({ ...form, guestName: v })} placeholder="Your name" placeholderTextColor={colors.textMuted} />

              <Text style={labelStyle}>Email *</Text>
              <TextInput style={inputStyle} value={form.guestEmail} onChangeText={(v) => setForm({ ...form, guestEmail: v })} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textMuted} />

              <Text style={labelStyle}>Phone (optional)</Text>
              <TextInput style={inputStyle} value={form.guestPhone} onChangeText={(v) => setForm({ ...form, guestPhone: v })} placeholder="+94 77 000 0000" keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />

              <Text style={labelStyle}>Subject *</Text>
              <TextInput style={inputStyle} value={form.subject} onChangeText={(v) => setForm({ ...form, subject: v })} placeholder="e.g. Repair school classroom" placeholderTextColor={colors.textMuted} />

              <Text style={labelStyle}>Message *</Text>
              <TextInput
                style={[inputStyle, { height: 100, paddingTop: 11, textAlignVertical: 'top' }]}
                value={form.message} onChangeText={(v) => setForm({ ...form, message: v })}
                placeholder="Describe your situation in detail…" multiline numberOfLines={4}
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, padding: 11, marginTop: 12, marginBottom: 8 }}
                onPress={pickImages}
              >
                <Ionicons name="image-outline" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Add Photos ({images.length}/5)</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {images.map((img, i) => (
                    <View key={i} style={{ marginRight: 8, position: 'relative' }}>
                      <Image source={{ uri: img.uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
                      <TouchableOpacity
                        style={{ position: 'absolute', top: -6, right: -6, backgroundColor: colors.error, borderRadius: 10 }}
                        onPress={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <Ionicons name="close-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 8, opacity: loading ? 0.6 : 1 }}
                onPress={handleSubmit} disabled={loading}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{loading ? 'Posting…' : 'Post Help Request'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Community Help Requests
          </Text>
        </View>
      }
      renderItem={({ item }) => <HelpRequestCard item={item} />}
      ListEmptyComponent={<EmptyState icon="hand-left-outline" title="No help requests yet" subtitle="Be the first to post a request." />}
    />
  );
}
