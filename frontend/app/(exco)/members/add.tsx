import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS, ALL_POSITIONS } from '../../../lib/constants';

export default function AddMemberScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', position: 'Member',
  });
  const [loading, setLoading] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('First name, last name, email, and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/members', form);
      Alert.alert('Success', `${form.firstName} has been added and a welcome email sent.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Add New Member</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {[
          { label: 'First Name *', key: 'firstName', placeholder: 'First name' },
          { label: 'Last Name *', key: 'lastName', placeholder: 'Last name' },
          { label: 'Email *', key: 'email', placeholder: 'member@email.com', keyboard: 'email-address', autoCapitalize: 'none' },
          { label: 'Phone', key: 'phone', placeholder: '+94 77 000 0000', keyboard: 'phone-pad' },
          { label: 'Temporary Password *', key: 'password', placeholder: 'Min 8 characters', secure: true },
        ].map((field) => (
          <View key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              value={(form as any)[field.key]}
              onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              placeholder={field.placeholder}
              keyboardType={(field.keyboard as any) || 'default'}
              autoCapitalize={(field.autoCapitalize as any) || 'words'}
              secureTextEntry={field.secure}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        ))}

        <Text style={styles.label}>Position *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setShowPositionPicker(!showPositionPicker)}>
          <Text style={styles.pickerText}>{form.position}</Text>
          <Ionicons name={showPositionPicker ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        {showPositionPicker && (
          <View style={styles.dropdown}>
            {ALL_POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.dropdownItem, form.position === pos && styles.dropdownItemActive]}
                onPress={() => { setForm({ ...form, position: pos }); setShowPositionPicker(false); }}
              >
                <Text style={[styles.dropdownText, form.position === pos && styles.dropdownTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleAdd} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Adding Member…' : 'Add Member'}</Text>
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
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { fontSize: 15, color: COLORS.text },
  dropdown: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginTop: 4 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: '#E8F0FB' },
  dropdownText: { fontSize: 14, color: COLORS.text },
  dropdownTextActive: { color: COLORS.primary, fontWeight: '700' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: COLORS.error, fontSize: 13, marginBottom: 10 },
});
