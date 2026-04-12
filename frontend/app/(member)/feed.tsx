import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ImageGridViewer } from '../../components/ImageGridViewer';

interface NewsPost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  publishedAt: string;
  club: { name: string; clubCode: string; logo?: string };
}

export default function MemberFeedScreen() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { colors } = useTheme();

  const fetchPosts = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('/news');
      setPosts(res.data.data);
    } catch {
      setError('Failed to load news. Pull to refresh.');
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const onRefresh = async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); };

  const renderPost = ({ item }: { item: NewsPost }) => (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700', flex: 1 }}>{item.club?.name}</Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          {new Date(item.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 }}>{item.title}</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 10 }} numberOfLines={3}>{item.content}</Text>
      <ImageGridViewer images={item.images ?? []} />
    </Card>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {error ? <Text style={{ color: colors.error, textAlign: 'center', padding: 12, fontSize: 13 }}>{error}</Text> : null}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="newspaper-outline" title="No posts yet" subtitle="Check back soon for the latest news." />}
      />
    </View>
  );
}
