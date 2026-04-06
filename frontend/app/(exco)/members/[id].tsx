import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS, ALL_POSITIONS } from '../../../lib/constants';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', position: 'Member' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/members/${id}`);
        const m = res.data.data;
        setForm({ firstName: m.firstName, lastName: m.lastName, phone: m.phone || '', position: m.position });
      } catch { setError('Failed to load member.'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/members/${id}`, form);
      Alert.alert('Saved', 'Member updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = () => {
    Alert.alert('Deactivate Member', 'This will revoke their access. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/members/${id}`);
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed.');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Edit Member</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {[
          { label: 'First Name', key: 'firstName' },
          { label: 'Last Name', key: 'lastName' },
          { label: 'Phone', key: 'phone', keyboard: 'phone-pad' },
        ].map((field) => (
          <View key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={(form as any)[field.key]}
              onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              keyboardType={(field.keyboard as any) || 'default'}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        ))}

        <Text style={styles.label}>Position</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowPicker(!showPicker)}>
          <Text style={styles.pickerText}>{form.position}</Text>
          <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        {showPicker && (
          <View style={styles.dropdown}>
            {ALL_POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.dropdownItem, form.position === pos && styles.activeItem]}
                onPress={() => { setForm({ ...form, position: pos }); setShowPicker(false); }}
              >
                <Text style={[styles.dropdownText, form.position === pos && styles.activeText]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
          <Ionicons name="person-remove-outline" size={16} color={COLORS.error} />
          <Text style={styles.deactivateText}>  Deactivate Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { fontSize: 15, color: COLORS.text },
  dropdown: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginTop: 4 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  activeItem: { backgroundColor: '#E8F0FB' },
  dropdownText: { fontSize: 14, color: COLORS.text },
  activeText: { color: COLORS.primary, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deactivateBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 16, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.error,
  },
  deactivateText: { color: COLORS.error, fontWeight: '600', fontSize: 14 },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 10 },
});
