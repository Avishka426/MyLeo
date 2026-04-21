import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

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
  createdAt: string;
}

export default function DistrictClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius } = useTheme();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/clubs/${id}`)
      .then((res) => setClub(res.data.data))
      .catch(() => setError('Failed to load club details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !club) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={{ color: colors.error, marginTop: 12, fontSize: 15 }}>{error || 'Club not found.'}</Text>
      </View>
    );
  }

  const details = [
    { icon: 'location-outline' as const, label: 'District', value: club.district?.name ?? '—' },
    { icon: 'mail-outline' as const, label: 'Email', value: club.contactEmail },
    { icon: 'call-outline' as const, label: 'Phone', value: club.contactPhone || '—' },
    { icon: 'calendar-outline' as const, label: 'Member Since', value: new Date(club.createdAt).getFullYear().toString() },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{
        backgroundColor: colors.primary,
        paddingTop: insets.top + 12,
        paddingBottom: 40,
        alignItems: 'center',
        gap: 14,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: insets.top + 10, left: 16, padding: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {club.logo ? (
          <Image
            source={{ uri: club.logo }}
            style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Ionicons name="shield-checkmark" size={44} color="#fff" />
          </View>
        )}

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', paddingHorizontal: 24 }}>
            {club.name}
          </Text>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full,
            paddingHorizontal: 12, paddingVertical: 4,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 1 }}>{club.clubCode}</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 16, gap: 12, marginTop: -20 }}>
        {club.description ? (
          <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>About</Text>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{club.description}</Text>
          </View>
        ) : null}

        <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {details.map((item, index) => (
            <View key={item.label} style={{
              flexDirection: 'row', alignItems: 'center', padding: 14,
              borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.divider, gap: 12,
            }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 2 }}>{item.label}</Text>
                <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
