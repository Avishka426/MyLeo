import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';

interface Club {
  _id: string;
  name: string;
  clubCode: string;
  status: string;
  logo?: string;
  contactEmail?: string;
}

export default function DistrictClubsScreen() {
  const { user } = useAuth();
  const { colors, radius } = useTheme();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const districtId = (user?.district as any)?._id ?? (user?.district as any);

  const fetchClubs = useCallback(async () => {
    if (!districtId) { setLoading(false); return; }
    try {
      setError('');
      const res = await api.get(`/districts/${districtId}/clubs`);
      setClubs(res.data.data);
    } catch {
      setError('Failed to load clubs.');
    } finally {
      setLoading(false);
    }
  }, [districtId]);

  useEffect(() => { fetchClubs(); }, [fetchClubs]);
  const onRefresh = async () => { setRefreshing(true); await fetchClubs(); setRefreshing(false); };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {error ? (
        <Text style={{ color: colors.error, textAlign: 'center', padding: 12, fontSize: 13 }}>{error}</Text>
      ) : null}
      <FlatList
        data={clubs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
              marginBottom: 10, borderWidth: 1, borderColor: colors.border,
              flexDirection: 'row', alignItems: 'center',
            }}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(district)/clubs/[id]', params: { id: item._id } })}
          >
            {item.logo ? (
              <Image source={{ uri: item.logo }} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="cover" />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{item.clubCode}</Text>
              {item.contactEmail ? (
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{item.contactEmail}</Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={{
                backgroundColor: item.status === 'active' ? colors.success + '20' : colors.error + '20',
                borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: item.status === 'active' ? colors.success : colors.error, textTransform: 'capitalize' }}>
                  {item.status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="shield-outline" title="No clubs found" subtitle="No clubs registered in this district yet." />
        }
      />
    </View>
  );
}
