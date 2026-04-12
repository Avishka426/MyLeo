import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ImageGridViewer } from '../../../components/ImageGridViewer';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';

interface NewsPost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function ExcoNewsScreen() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      const res = await api.get('/news');
      setPosts(res.data.data);
    } catch { }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  const handleDelete = async (postId: string) => {
    try {
      await api.delete(`/news/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch { }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 10 }}>{item.title}</Text>
              <View style={{
                width: 9, height: 9, borderRadius: 5, marginTop: 4,
                backgroundColor: item.isPublished ? colors.success : colors.textMuted,
              }} />
            </View>

            <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 10 }} numberOfLines={3}>
              {item.content}
            </Text>

            <ImageGridViewer images={item.images ?? []} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                {'  '}
                {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, alignSelf: 'flex-start' }}
              onPress={() => handleDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={15} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600' }}>Delete</Text>
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={<EmptyState icon="newspaper-outline" title="No posts yet" subtitle="Tap + to create your first news post." />}
      />

      <TouchableOpacity
        style={{
          position: 'absolute', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: 'center', alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
        onPress={() => router.push('/(exco)/news/create')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
