import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, RefreshControl, Text } from 'react-native';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/ui/EmptyState';
import HelpRequestCard, { HelpRequestItem } from '../../components/HelpRequestCard';

export default function ExcoHelpScreen() {
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { user } = useAuth();
  const myClubId = (user?.club as any)?._id || user?.club;

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/help-requests');
      setRequests(res.data.data);
    } catch { }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  const onRefresh = async () => { setRefreshing(true); await fetchRequests(); setRefreshing(false); };
  const updateRequest = (updated: HelpRequestItem) =>
    setRequests((prev) => prev.map((r) => r._id === updated._id ? updated : r));

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, backgroundColor: colors.background }}
      style={{ backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Community Help Requests
        </Text>
      }
      renderItem={({ item }) => (
        <HelpRequestCard item={item} myClubId={myClubId} isExco onUpdate={updateRequest} />
      )}
      ListEmptyComponent={<EmptyState icon="hand-left-outline" title="No help requests yet" subtitle="Community requests will appear here." />}
    />
  );
}
