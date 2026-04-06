import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../lib/constants';
import api from '../lib/api';

const ROLE_LABEL: Record<string, string> = {
  club_exco: 'Exco Member',
  leo_member: 'Leo Member',
  system_admin: 'System Admin',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
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
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      Alert.alert('Success', 'Password updated successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwExpanded(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Avatar & name ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{ROLE_LABEL[user?.role || ''] ?? user?.role}</Text>
          </View>
          {user?.club && (
            <View style={styles.clubRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
              <Text style={styles.clubText}>{user.club.name}</Text>
              <Text style={styles.clubCode}>  ·  {user.club.clubCode}</Text>
            </View>
          )}
          {user?.memberProfile?.position && (
            <Text style={styles.position}>{user.memberProfile.position}</Text>
          )}
        </View>

        {/* ── Change Password ── */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => setPwExpanded((v) => !v)} activeOpacity={0.7}>
            <View style={styles.sectionLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Change Password</Text>
            </View>
            <Ionicons
              name={pwExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {pwExpanded && (
            <View style={styles.pwForm}>
              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={pwForm.current}
                onChangeText={(v) => setPwForm((p) => ({ ...p, current: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={pwForm.newPw}
                onChangeText={(v) => setPwForm((p) => ({ ...p, newPw: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={pwForm.confirm}
                onChangeText={(v) => setPwForm((p) => ({ ...p, confirm: v }))}
              />
              <TouchableOpacity
                style={[styles.saveBtn, pwLoading && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={pwLoading}
              >
                <Text style={styles.saveBtnText}>{pwLoading ? 'Saving…' : 'Update Password'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 60 },

  heroCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 28 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  rolePill: {
    backgroundColor: COLORS.primary + '18', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  clubText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  clubCode: { fontSize: 12, color: COLORS.textMuted },
  position: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  section: {
    backgroundColor: COLORS.surface, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  pwForm: { paddingHorizontal: 16, paddingBottom: 16 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.text, marginBottom: 10,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.error + '40',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  signOutText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
});
