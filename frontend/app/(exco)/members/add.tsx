import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { ALL_POSITIONS } from '../../../lib/constants';

export default function AddMemberScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', position: 'Member' });
  const [loading, setLoading] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('First name, last name, email, and password are required.'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/members', form);
      Alert.alert('Success', `${form.firstName} has been added.`, [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  };

  const FIELDS = [
    { label: 'First Name *', key: 'firstName', placeholder: 'First name' },
    { label: 'Last Name *', key: 'lastName', placeholder: 'Last name' },
    { label: 'Email *', key: 'email', placeholder: 'member@email.com', keyboard: 'email-address', autoCapitalize: 'none' },
    { label: 'Phone', key: 'phone', placeholder: '+94 77 000 0000', keyboard: 'phone-pad' },
    { label: 'Temporary Password *', key: 'password', placeholder: 'Min 8 characters', secure: true },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 20 }}>Add New Member</Text>
        {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}

        {FIELDS.map((field) => (
          <View key={field.key}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>{field.label}</Text>
            <TextInput
              style={inputStyle}
              value={(form as any)[field.key]}
              onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              placeholder={field.placeholder}
              keyboardType={(field.keyboard as any) || 'default'}
              autoCapitalize={(field.autoCapitalize as any) || 'words'}
              secureTextEntry={field.secure}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        ))}

        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 14 }}>Position *</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...inputStyle }}
          onPress={() => setShowPositionPicker(!showPositionPicker)}
        >
          <Text style={{ fontSize: 15, color: colors.text }}>{form.position}</Text>
          <Ionicons name={showPositionPicker ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {showPositionPicker && (
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginTop: 4 }}>
            {ALL_POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos}
                style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: form.position === pos ? colors.primaryLight : undefined }}
                onPress={() => { setForm({ ...form, position: pos }); setShowPositionPicker(false); }}
              >
                <Text style={{ fontSize: 14, color: form.position === pos ? colors.primary : colors.text, fontWeight: form.position === pos ? '700' : '400' }}>
                  {pos}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 28, opacity: loading ? 0.6 : 1 }}
          onPress={handleAdd} disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{loading ? 'Adding Member…' : 'Add Member'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
