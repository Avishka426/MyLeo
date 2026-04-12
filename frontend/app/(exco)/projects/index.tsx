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
  const { colors } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/(exco)/projects/[id]', params: { id: item._id } })} activeOpacity={0.7}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 }}>{item.title}</Text>
                <Badge label={item.status} status={item.status} />
              </View>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 4 }}>{item.category}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {item.startDate ? (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{new Date(item.startDate).toLocaleDateString()}</Text>
                ) : <View />}
                {item.isMapVisible && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="location" size={12} color={colors.success} />
                    <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>On Map</Text>
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EmptyState icon="folder-open-outline" title="No projects yet" subtitle="Tap + to create your first project." />}
      />
      <TouchableOpacity
        style={{
          position: 'absolute', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
        onPress={() => router.push('/(exco)/projects/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
