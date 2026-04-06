import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS } from '../../lib/constants';
import HelpRequestCard, { HelpRequestItem } from '../../components/HelpRequestCard';

export default function MemberHelpScreen() {
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      ListHeaderComponent={<Text style={styles.heading}>Community Help Requests</Text>}
      renderItem={({ item }) => <HelpRequestCard item={item} />}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="hand-left-outline" size={48} color={COLORS.border} />
          <Text style={styles.empty}>No help requests yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { color: COLORS.textMuted, fontSize: 14 },
});
