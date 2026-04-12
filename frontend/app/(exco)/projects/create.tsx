import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { PROJECT_STATUSES } from '../../../lib/constants';

const CATEGORIES = ['Community Service', 'Environment', 'Health', 'Education', 'Disaster Relief', 'Youth Development', 'Other'];

export default function CreateProjectScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const [form, setForm] = useState({ title: '', category: 'Community Service', description: '', status: 'upcoming', outcomes: '' });
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.title || !form.description) { setError('Title and description are required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/projects', form);
      Alert.alert('Created!', 'Project created successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  };
  const labelStyle = { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: 6, marginTop: 14 };

  const PickerField = ({ label, value, options, visible, onToggle, onSelect }: any) => (
    <>
      <Text style={labelStyle}>{label}</Text>
      <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...inputStyle }} onPress={onToggle}>
        <Text style={{ fontSize: 15, color: colors.text }}>{value}</Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {visible && (
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: 4 }}>
          {options.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: value === opt ? colors.primaryLight : undefined }}
              onPress={() => onSelect(opt)}
            >
              <Text style={{ fontSize: 14, color: value === opt ? colors.primary : colors.text, fontWeight: value === opt ? '700' : '400' }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 }}>New Project</Text>
        {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}

        <Text style={labelStyle}>Title *</Text>
        <TextInput style={inputStyle} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Project title" placeholderTextColor={colors.textMuted} />

        <PickerField
          label="Category" value={form.category} options={CATEGORIES}
          visible={showCategoryPicker} onToggle={() => setShowCategoryPicker(!showCategoryPicker)}
          onSelect={(v: string) => { setForm({ ...form, category: v }); setShowCategoryPicker(false); }}
        />
        <PickerField
          label="Status" value={form.status} options={[...PROJECT_STATUSES]}
          visible={showStatusPicker} onToggle={() => setShowStatusPicker(!showStatusPicker)}
          onSelect={(v: string) => { setForm({ ...form, status: v }); setShowStatusPicker(false); }}
        />

        <Text style={labelStyle}>Description *</Text>
        <TextInput style={[inputStyle, { height: 100, paddingTop: 12, textAlignVertical: 'top' }]} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Describe the project…" multiline numberOfLines={5} placeholderTextColor={colors.textMuted} />

        <Text style={labelStyle}>Outcomes (optional)</Text>
        <TextInput style={[inputStyle, { height: 80, paddingTop: 12, textAlignVertical: 'top' }]} value={form.outcomes} onChangeText={(v) => setForm({ ...form, outcomes: v })} placeholder="Expected outcomes…" multiline numberOfLines={3} placeholderTextColor={colors.textMuted} />

        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 28, opacity: loading ? 0.6 : 1 }}
          onPress={handleCreate} disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{loading ? 'Creating…' : 'Create Project'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
