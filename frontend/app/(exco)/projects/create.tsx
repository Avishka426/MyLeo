import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS, PROJECT_STATUSES } from '../../../lib/constants';

const CATEGORIES = ['Community Service', 'Environment', 'Health', 'Education', 'Disaster Relief', 'Youth Development', 'Other'];

export default function CreateProjectScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', category: 'Community Service', description: '', status: 'upcoming', outcomes: '' });
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/projects', form);
      Alert.alert('Created!', 'Project created successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const PickerField = ({ label, value, options, visible, onToggle, onSelect }: any) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.picker} onPress={onToggle}>
        <Text style={styles.pickerText}>{value}</Text>
        <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdown}>
          {options.map((opt: string) => (
            <TouchableOpacity key={opt} style={[styles.dropdownItem, value === opt && styles.activeItem]} onPress={() => onSelect(opt)}>
              <Text style={[styles.dropdownText, value === opt && styles.activeText]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>New Project</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} placeholder="Project title" placeholderTextColor={COLORS.textMuted} />

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

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textarea]} value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          placeholder="Describe the project..." multiline numberOfLines={5}
          textAlignVertical="top" placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Outcomes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]} value={form.outcomes}
          onChangeText={(v) => setForm({ ...form, outcomes: v })}
          placeholder="Expected or achieved outcomes..." multiline numberOfLines={3}
          textAlignVertical="top" placeholderTextColor={COLORS.textMuted}
        />

        <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleCreate} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating…' : 'Create Project'}</Text>
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
  textarea: { height: 100, paddingTop: 12 },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { fontSize: 15, color: COLORS.text },
  dropdown: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginTop: 4 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 11 },
  activeItem: { backgroundColor: '#E8F0FB' },
  dropdownText: { fontSize: 14, color: COLORS.text },
  activeText: { color: COLORS.primary, fontWeight: '700' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 10 },
});
