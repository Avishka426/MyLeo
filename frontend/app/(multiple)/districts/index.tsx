import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';

interface District {
  _id: string;
  name: string;
  code: string;
  status: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function MDDistrictsScreen() {
  const { colors, radius } = useTheme();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDistricts = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/districts');
      setDistricts(res.data.data);
    } catch {
      setError('Failed to load districts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDistricts(); }, [fetchDistricts]);
  const onRefresh = async () => { setRefreshing(true); await fetchDistricts(); setRefreshing(false); };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {error ? (
        <Text style={{ color: colors.error, textAlign: 'center', padding: 12, fontSize: 13 }}>{error}</Text>
      ) : null}
      <FlatList
        data={districts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
            marginBottom: 10, borderWidth: 1, borderColor: colors.border,
            flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="map" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>{item.code}</Text>
              {item.contactEmail ? (
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{item.contactEmail}</Text>
              ) : null}
            </View>
            <View style={{
              backgroundColor: item.status === 'active' ? colors.success + '20' : colors.error + '20',
              borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: item.status === 'active' ? colors.success : colors.error, textTransform: 'capitalize' }}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="map-outline" title="No districts found" subtitle="No districts registered in this multiple district." />
        }
      />
    </View>
  );
}
