import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { ALL_POSITIONS } from '../../../lib/constants';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, radius } = useTheme();
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
    setSaving(true); setError('');
    try {
      await api.put(`/members/${id}`, form);
      Alert.alert('Saved', 'Member updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = () =>
    Alert.alert('Deactivate Member', 'This will revoke their access. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: async () => {
        try { await api.delete(`/members/${id}`); router.back(); }
        catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed.'); }
      }},
    ]);

  if (loading) return <LoadingSpinner />;

  const inputStyle = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  };

  const FIELDS = [
    { label: 'First Name', key: 'firstName' },
    { label: 'Last Name', key: 'lastName' },
    { label: 'Phone', key: 'phone', keyboard: 'phone-pad' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 }}>Edit Member</Text>
        {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}

        {FIELDS.map((field) => (
          <View key={field.key}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>{field.label}</Text>
            <TextInput
              style={inputStyle}
              value={(form as any)[field.key]}
              onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              keyboardType={(field.keyboard as any) || 'default'}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        ))}

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>Position</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...inputStyle }}
          onPress={() => setShowPicker(!showPicker)}
        >
          <Text style={{ fontSize: 15, color: colors.text }}>{form.position}</Text>
          <Ionicons name={showPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {showPicker && (
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: 4 }}>
            {ALL_POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos}
                style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: form.position === pos ? colors.primaryLight : undefined }}
                onPress={() => { setForm({ ...form, position: pos }); setShowPicker(false); }}
              >
                <Text style={{ fontSize: 14, color: form.position === pos ? colors.primary : colors.text, fontWeight: form.position === pos ? '700' : '400' }}>
                  {pos}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 28, opacity: saving ? 0.6 : 1 }}
          onPress={handleSave} disabled={saving}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.error }}
          onPress={handleDeactivate}
        >
          <Ionicons name="person-remove-outline" size={16} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '600', fontSize: 14, marginLeft: 6 }}>Deactivate Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
