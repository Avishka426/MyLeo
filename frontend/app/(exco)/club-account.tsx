import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useRouter } from 'expo-router';

interface Club {
  _id: string;
  name: string;
  clubCode: string;
  district: { _id: string; name: string; code: string };
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  status: string;
  description?: string;
}

export default function ClubAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Club>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.club?._id) fetchClub(user.club._id);
  }, [user]);

  const fetchClub = async (id: string) => {
    try {
      const res = await api.get(`/clubs/${id}`);
      setClub(res.data.data);
      setForm(res.data.data);
    } catch {
      setError('Failed to load club data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!club) return;
    setSaving(true);
    try {
      const res = await api.put(`/clubs/${club._id}`, {
        name: form.name,
        contactEmail: form.contactEmail, contactPhone: form.contactPhone,
        description: form.description,
      });
      setClub(res.data.data);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error || !club) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.error, fontSize: 14 }}>{error || 'No club assigned to your account.'}</Text>
    </View>
  );

  const FIELDS = [
    { label: 'Club Name', key: 'name' },
    { label: 'Contact Email', key: 'contactEmail', keyboard: 'email-address' },
    { label: 'Contact Phone', key: 'contactPhone', keyboard: 'phone-pad' },
    { label: 'Description', key: 'description', multiline: true },
  ];

  const INFO_ROWS = [
    { icon: 'location-outline', label: 'District', value: club.district?.name ?? '—' },
    { icon: 'mail-outline', label: 'Email', value: club.contactEmail },
    { icon: 'call-outline', label: 'Phone', value: club.contactPhone || '—' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      {/* Header card */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.card, borderRadius: radius.lg,
        padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: colors.border,
      }}>
        {club.logo ? (
          <Image source={{ uri: club.logo }} style={{ width: 64, height: 64, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 2 }}>{club.name}</Text>
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 6 }}>{club.clubCode}</Text>
          <Badge label={club.status} status={club.status} />
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* View Members */}
      <Button
        label="View Members"
        variant="secondary"
        onPress={() => router.push('/(exco)/members')}
        style={{ marginBottom: 16 }}
      />

      {editing ? (
        <Card>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Edit Club Details</Text>
          {FIELDS.map((field) => (
            <View key={field.key}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 5, marginTop: 10 }}>
                {field.label}
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
                  borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
                  fontSize: 14, color: colors.text,
                  height: field.multiline ? 80 : undefined,
                  textAlignVertical: field.multiline ? 'top' : 'auto',
                }}
                value={(form as any)[field.key] || ''}
                onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                keyboardType={(field.keyboard as any) || 'default'}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : 1}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ))}
          <Button label={saving ? 'Saving…' : 'Save Changes'} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
        </Card>
      ) : (
        <>
          <Card>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Club Information</Text>
            {INFO_ROWS.map((row) => (
              <View key={row.label} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                <Ionicons name={row.icon as any} size={16} color={colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{row.label}</Text>
                  <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{row.value}</Text>
                </View>
              </View>
            ))}
          </Card>
          {club.description && (
            <Card>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 }}>About</Text>
              <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 22 }}>{club.description}</Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}
