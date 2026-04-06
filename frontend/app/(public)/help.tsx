import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, FlatList, RefreshControl, Image, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS } from '../../lib/constants';
import HelpRequestCard, { HelpRequestItem } from '../../components/HelpRequestCard';

export default function HelpScreen() {
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
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
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
      formData.append('guestName',  form.guestName);
      formData.append('guestEmail', form.guestEmail);
      formData.append('guestPhone', form.guestPhone);
      formData.append('subject',    form.subject);
      formData.append('message',    form.message);
      images.forEach((img) => {
        const filename = img.uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        formData.append('images', { uri: img.uri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' } as any);
      });
      await api.post('/help-requests', formData, {
        transformRequest: (data) => data,
      });
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

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      ListHeaderComponent={
        <View>
          {/* Post bar */}
          <TouchableOpacity style={styles.postBar} onPress={() => setShowForm((v) => !v)} activeOpacity={0.8}>
            <View style={styles.postBarAvatar}><Ionicons name="person-outline" size={18} color={COLORS.textMuted} /></View>
            <Text style={styles.postBarText}>Ask for help from Leo clubs…</Text>
            <Ionicons name={showForm ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Submit form */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Post a Help Request</Text>
              <Text style={styles.formSub}>Leo clubs across your area will see this and can offer help.</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={form.guestName} onChangeText={(v) => setForm({ ...form, guestName: v })} placeholder="Your name" placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Email *</Text>
              <TextInput style={styles.input} value={form.guestEmail} onChangeText={(v) => setForm({ ...form, guestEmail: v })} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput style={styles.input} value={form.guestPhone} onChangeText={(v) => setForm({ ...form, guestPhone: v })} placeholder="+94 77 000 0000" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Subject *</Text>
              <TextInput style={styles.input} value={form.subject} onChangeText={(v) => setForm({ ...form, subject: v })} placeholder="e.g. Repair school classroom" placeholderTextColor={COLORS.textMuted} />

              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textarea]} value={form.message}
                onChangeText={(v) => setForm({ ...form, message: v })}
                placeholder="Describe your situation in detail…" multiline numberOfLines={4}
                textAlignVertical="top" placeholderTextColor={COLORS.textMuted}
              />

              <TouchableOpacity style={styles.imgPickerBtn} onPress={pickImages}>
                <Ionicons name="image-outline" size={18} color={COLORS.primary} />
                <Text style={styles.imgPickerText}>Add Photos ({images.length}/5)</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {images.map((img, i) => (
                    <View key={i} style={styles.thumbWrap}>
                      <Image source={{ uri: img.uri }} style={styles.thumb} />
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => setImages((prev) => prev.filter((_, j) => j !== i))}>
                        <Ionicons name="close-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.submitBtnText}>{loading ? 'Posting…' : 'Post Help Request'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.feedTitle}>Community Help Requests</Text>
        </View>
      }
      renderItem={({ item }) => <HelpRequestCard item={item} />}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="hand-left-outline" size={48} color={COLORS.border} />
          <Text style={styles.empty}>No help requests yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  postBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  postBarAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  postBarText: { flex: 1, fontSize: 14, color: COLORS.textMuted },
  formCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  formTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  formSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.text },
  textarea: { height: 100, paddingTop: 11 },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 8 },
  imgPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, padding: 11, marginTop: 12, marginBottom: 8 },
  imgPickerText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  thumbWrap: { marginRight: 8, position: 'relative' },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  thumbRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.error, borderRadius: 10 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  feedTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 12 },
  empty: { color: COLORS.textMuted, fontSize: 14 },
});
