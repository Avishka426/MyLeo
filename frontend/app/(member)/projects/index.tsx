import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';

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
  const { colors, radius } = useTheme();
  const router = useRouter();

  const fetchProjects = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/projects', { params });
      setProjects(res.data.data);
    } catch { }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  const onRefresh = async () => { setRefreshing(true); await fetchProjects(); setRefreshing(false); };

  const FILTERS = ['all', 'upcoming', 'ongoing', 'completed'];

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filter chips */}
      <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
              backgroundColor: filter === f ? colors.primary : colors.card,
              borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border,
            }}
            onPress={() => setFilter(f)}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#fff' : colors.textMuted }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/(member)/projects/[id]', params: { id: item._id } })} activeOpacity={0.7}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 }}>{item.title}</Text>
                <Badge label={item.status} status={item.status} />
              </View>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 2 }}>{item.category}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.club?.name}</Text>
              {item.startDate && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{new Date(item.startDate).toLocaleDateString()}</Text>}
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="folder-open-outline" title="No projects found" subtitle="Try a different filter or pull to refresh." />}
      />

      <TouchableOpacity
        style={{
          position: 'absolute', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
        onPress={() => router.push('/(member)/projects/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
