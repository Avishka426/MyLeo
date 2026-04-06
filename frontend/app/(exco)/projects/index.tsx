import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS } from '../../../lib/constants';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';

interface Project {
  _id: string;
  title: string;
  category: string;
  status: string;
  startDate?: string;
  isMapVisible: boolean;
}

export default function ExcoProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    try {
      const params = user?.club ? { club: (user.club as any)._id || user.club } : {};
      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
    } catch { }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  const onRefresh = async () => { setRefreshing(true); await fetchProjects(); setRefreshing(false); };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/(exco)/projects/[id]', params: { id: item._id } })}>
            <Card>
              <View style={styles.row}>
                <Text style={styles.title}>{item.title}</Text>
                <Badge label={item.status} status={item.status} />
              </View>
              <Text style={styles.category}>{item.category}</Text>
              <View style={styles.meta}>
                {item.startDate && <Text style={styles.date}>{new Date(item.startDate).toLocaleDateString()}</Text>}
                {item.isMapVisible && (
                  <View style={styles.mapBadge}>
                    <Ionicons name="location" size={12} color={COLORS.success} />
                    <Text style={styles.mapText}> On Map</Text>
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No projects yet. Create your first one!</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(exco)/projects/create')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  category: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 12, color: COLORS.textMuted },
  mapBadge: { flexDirection: 'row', alignItems: 'center' },
  mapText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60 },
});
