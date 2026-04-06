import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS } from '../../../lib/constants';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface Project {
  _id: string;
  title: string;
  category: string;
  status: string;
  startDate?: string;
  club: { name: string };
}

export default function MemberProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const onRefresh = async () => { setRefreshing(true); await fetchProjects(); setRefreshing(false); };

  const filters = ['all', 'upcoming', 'ongoing', 'completed'];

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/(member)/projects/[id]', params: { id: item._id } })}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.title}>{item.title}</Text>
                <Badge label={item.status} status={item.status} />
              </View>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.club}>{item.club?.name}</Text>
              {item.startDate && <Text style={styles.date}>{new Date(item.startDate).toLocaleDateString()}</Text>}
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No projects found.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(member)/projects/create')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  category: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 2 },
  club: { fontSize: 12, color: COLORS.textMuted },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
});
