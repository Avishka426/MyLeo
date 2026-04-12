import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';

interface Club {
  _id: string;
  name: string;
  clubCode: string;
  district: string;
  logo?: string;
  status: string;
}

export default function ClubsScreen() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { colors, radius } = useTheme();
  const router = useRouter();

  const fetchClubs = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/clubs');
      setClubs(res.data.data);
    } catch {
      setError('Failed to load clubs. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

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
        numColumns={1}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
       
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              alignItems: 'center',
              gap: 10,
            }}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(public)/clubs/[id]', params: { id: item._id } })}
          >
            {item.logo ? (
              <Image
                source={{ uri: item.logo }}
                style={{ width: 64, height: 64, borderRadius: 32 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: colors.primaryLight,
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
              </View>
            )}
            <Text
              style={{ fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center' }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>{item.clubCode}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="shield-outline"
            title="No clubs found"
            subtitle="There are no active Leo clubs registered yet."
          />
        }
      />
    </View>
  );
}
