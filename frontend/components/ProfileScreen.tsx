import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

const ROLE_LABEL: Record<string, string> = {
  club_exco: 'Exco Member',
  leo_member: 'Leo Member',
  system_admin: 'System Admin',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, radius } = useTheme();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwExpanded, setPwExpanded] = useState(false);

  const initials = user?.memberProfile
    ? `${user.memberProfile.firstName[0]}${user.memberProfile.lastName[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const displayName = user?.memberProfile
    ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}`
    : user?.email;

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (pwForm.newPw !== pwForm.confirm) { Alert.alert('Error', 'New passwords do not match'); return; }
    if (pwForm.newPw.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      Alert.alert('Success', 'Password updated successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwExpanded(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const inputStyle = {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.text, marginBottom: 10,
    backgroundColor: colors.background,
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero card */}
        <View style={{
          backgroundColor: colors.card, borderRadius: 20, padding: 28,
          alignItems: 'center', marginBottom: 16,
          borderWidth: 1, borderColor: colors.border,
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.primary,
            justifyContent: 'center', alignItems: 'center', marginBottom: 14,
          }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 28 }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 }}>{displayName}</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>{user?.email}</Text>
          <View style={{ backgroundColor: colors.primary + '18', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{ROLE_LABEL[user?.role || ''] ?? user?.role}</Text>
          </View>
          {user?.club && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{user.club.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>  ·  {user.club.clubCode}</Text>
            </View>
          )}
          {user?.memberProfile?.position && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{user.memberProfile.position}</Text>
          )}
        </View>

        {/* Change Password */}
        <View style={{
          backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: 12,
          borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
            onPress={() => setPwExpanded((v) => !v)} activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>Change Password</Text>
            </View>
            <Ionicons name={pwExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {pwExpanded && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <TextInput
                style={inputStyle}
                placeholder="Current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={pwForm.current}
                onChangeText={(v) => setPwForm((p) => ({ ...p, current: v }))}
              />
              <TextInput
                style={inputStyle}
                placeholder="New password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={pwForm.newPw}
                onChangeText={(v) => setPwForm((p) => ({ ...p, newPw: v }))}
              />
              <TextInput
                style={inputStyle}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={pwForm.confirm}
                onChangeText={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
              />
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', marginTop: 4, opacity: pwLoading ? 0.6 : 1 }}
                onPress={handleChangePassword}
                disabled={pwLoading}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{pwLoading ? 'Saving…' : 'Update Password'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: colors.card, borderRadius: radius.lg, padding: 16,
            borderWidth: 1, borderColor: colors.error + '40',
          }}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={{ color: colors.error, fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
