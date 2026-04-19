import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import { ROLES } from '../lib/constants';

const ROLE_LABEL: Record<string, string> = {
  leo_member:      'Leo Member',
  club_exco:       'Club Exco',
  district_member: 'District Member',
  district_exco:   'District Exco',
  multiple_member: 'Multiple District Member',
  multiple_exco:   'Multiple District Exco',
  system_admin:    'System Admin',
};

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { colors, radius } = useTheme();
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwExpanded, setPwExpanded] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const initials = user?.memberProfile
    ? `${user.memberProfile.firstName[0]}${user.memberProfile.lastName[0]}`.toUpperCase()
    : user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email?.[0]?.toUpperCase() || '?';

  const displayName = user?.memberProfile
    ? `${user.memberProfile.firstName} ${user.memberProfile.lastName}`
    : user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email;

  const profileImageUrl = user?.profileImage || user?.memberProfile?.profileImage;

  const pickAndUploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('avatar', { uri: asset.uri, type: asset.mimeType ?? 'image/jpeg', name: 'avatar.jpg' } as any);

    setAvatarUploading(true);
    try {
      await api.put('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Upload failed');
    } finally {
      setAvatarUploading(false);
    }
  };

  const pickAndUploadEntityLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to upload a logo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('logo', { uri: asset.uri, type: asset.mimeType ?? 'image/jpeg', name: 'logo.jpg' } as any);

    setLogoUploading(true);
    try {
      if (user?.role === ROLES.EXCO || user?.role === ROLES.MEMBER) {
        await api.put(`/clubs/${(user.club as any)?._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else if (user?.role === ROLES.DISTRICT_EXCO) {
        await api.put(`/districts/${(user as any).district?._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else if (user?.role === ROLES.MULTIPLE_EXCO) {
        await api.put(`/multiple-districts/${(user as any).multipleDistrict?._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await refreshUser();
      Alert.alert('Success', 'Logo updated!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Upload failed');
    } finally {
      setLogoUploading(false);
    }
  };

  const isEntityExco = user?.role === ROLES.EXCO || user?.role === ROLES.DISTRICT_EXCO || user?.role === ROLES.MULTIPLE_EXCO;

  const entityLogoUrl =
    user?.role === ROLES.EXCO || user?.role === ROLES.MEMBER ? user?.club?.logo :
    user?.role === ROLES.DISTRICT_EXCO ? (user as any)?.district?.logo :
    user?.role === ROLES.MULTIPLE_EXCO ? (user as any)?.multipleDistrict?.logo : undefined;

  const entityLabel =
    user?.role === ROLES.EXCO || user?.role === ROLES.MEMBER ? 'Club Logo' :
    user?.role === ROLES.DISTRICT_EXCO ? 'District Logo' :
    user?.role === ROLES.MULTIPLE_EXCO ? 'Multiple District Logo' : '';

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
          {/* Avatar */}
          <TouchableOpacity onPress={pickAndUploadAvatar} activeOpacity={0.8} style={{ marginBottom: 14 }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, overflow: 'hidden', backgroundColor: colors.primary }}>
              {profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={{ width: 90, height: 90 }} />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 28 }}>{initials}</Text>
                </View>
              )}
            </View>
            <View style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.card,
              justifyContent: 'center', alignItems: 'center',
            }}>
              {avatarUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>

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
          {(user as any)?.district && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Ionicons name="map-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{(user as any).district.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>  ·  {(user as any).district.code}</Text>
            </View>
          )}
          {(user as any)?.multipleDistrict && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Ionicons name="globe-outline" size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>{(user as any).multipleDistrict.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>  ·  {(user as any).multipleDistrict.code}</Text>
            </View>
          )}
          {(user?.memberProfile?.position || user?.position) && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {user?.memberProfile?.position ?? user?.position}
            </Text>
          )}
        </View>

        {/* Entity logo upload (exco only) */}
        {isEntityExco && (
          <View style={{
            backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: 12,
            borderWidth: 1, borderColor: colors.border, padding: 16,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 12 }}>{entityLabel}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.primaryLight }}>
                {entityLogoUrl ? (
                  <Image source={{ uri: entityLogoUrl }} style={{ width: 64, height: 64 }} />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={26} color={colors.primary} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={pickAndUploadEntityLogo}
                disabled={logoUploading}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 8, paddingVertical: 12, borderRadius: radius.md,
                  borderWidth: 1.5, borderColor: colors.primary,
                  backgroundColor: colors.primary + '10',
                  opacity: logoUploading ? 0.6 : 1,
                }}
                activeOpacity={0.7}
              >
                {logoUploading
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />}
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  {logoUploading ? 'Uploading…' : 'Upload Logo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
