import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, RefreshControl, Text } from 'react-native';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from '../../components/ui/EmptyState';
import HelpRequestCard, { HelpRequestItem } from '../../components/HelpRequestCard';

export default function MemberHelpScreen() {
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/help-requests');
      setRequests(res.data.data);
    } catch { }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  const onRefresh = async () => { setRefreshing(true); await fetchRequests(); setRefreshing(false); };

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
      renderItem={({ item }) => <HelpRequestCard item={item} />}
      ListEmptyComponent={<EmptyState icon="hand-left-outline" title="No help requests yet" subtitle="Community requests will appear here." />}
    />
  );
}
