import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image,
  Button,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { COLORS } from '../../lib/constants';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useRouter } from 'expo-router';

interface Club {
  _id: string;
  name: string;
  clubCode: string;
  district: string;
  contactEmail: string;
  contactPhone?: string;
  logo?: string;
  status: string;
  description?: string;
}

export default function ClubAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
        district: form.district,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
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
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!club) return <Text style={styles.error}>No club assigned to your account.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {club.logo ? (
          <Image source={{ uri: club.logo }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="shield-checkmark" size={36} color={COLORS.primary} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.clubName}>{club.name}</Text>
          <Text style={styles.clubCode}>{club.clubCode}</Text>
          <Badge label={club.status} status={club.status} />
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={22} color={COLORS.primary} />
        </TouchableOpacity>
        
      </View>

      <View>
        <Button title='View Members' onPress={() => router.push('/(exco)/members')} />
      </View>

      {editing ? (
        <Card>
          <Text style={styles.sectionTitle}>Edit Club Details</Text>
          {[
            { label: 'Club Name', key: 'name' },
            { label: 'District', key: 'district' },
            { label: 'Contact Email', key: 'contactEmail', keyboard: 'email-address' },
            { label: 'Contact Phone', key: 'contactPhone', keyboard: 'phone-pad' },
            { label: 'Description', key: 'description', multiline: true },
          ].map((field) => (
            <View key={field.key}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, field.multiline && styles.textarea]}
                value={(form as any)[field.key] || ''}
                onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                keyboardType={(field.keyboard as any) || 'default'}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : 1}
                textAlignVertical={field.multiline ? 'top' : 'auto'}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          ))}
          <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.sectionTitle}>Club Information</Text>
            {[
              { icon: 'location-outline', label: 'District', value: club.district },
              { icon: 'mail-outline', label: 'Email', value: club.contactEmail },
              { icon: 'call-outline', label: 'Phone', value: club.contactPhone || '—' },
            ].map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Ionicons name={row.icon as any} size={16} color={COLORS.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </Card>
          {club.description && (
            <Card>
              <Text style={styles.sectionTitle}>About.</Text>
              <Text style={styles.body}>{club.description}</Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
} 


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  logo: { width: 64, height: 64, borderRadius: 12 },
  logoPlaceholder: {
    width: 64, height: 64, borderRadius: 12, backgroundColor: '#E8F0FB',
    justifyContent: 'center', alignItems: 'center',
  },
  clubName: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  clubCode: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted },
  infoValue: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  body: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  textarea: { height: 80, paddingTop: 10 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { textAlign: 'center', color: COLORS.error, marginTop: 60 },
});
