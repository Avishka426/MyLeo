import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Image, Modal, Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../lib/api';
import { COLORS } from '../../../lib/constants';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useAuth } from '../../../context/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAP = 2;

interface NewsPost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

// ── Image Viewer Modal ────────────────────────────────────────────────────────
function ImageViewer({
  images, startIndex, onClose,
}: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={viewer.overlay}>
        <StatusBar hidden />

        {/* Close */}
        <TouchableOpacity style={viewer.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        <Text style={viewer.counter}>{current + 1} / {images.length}</Text>

        {/* Swipeable images */}
        <FlatList
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setCurrent(idx);
          }}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_W, height: SCREEN_H, justifyContent: 'center' }}>
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_W, height: SCREEN_H }}
                resizeMode="contain"
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// ── Image Grid ────────────────────────────────────────────────────────────────
function ImageGrid({ images, onPress }: { images: string[]; onPress: (i: number) => void }) {
  const n = images.length;
  if (n === 0) return null;

  const W = SCREEN_W - 32; // card width (16 padding each side)

  if (n === 1) {
    return (
      <TouchableOpacity onPress={() => onPress(0)} activeOpacity={0.9}>
        <Image source={{ uri: images[0] }} style={{ width: W, height: 220, borderRadius: 8, marginBottom: 10 }} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  if (n === 2) {
    const half = (W - GAP) / 2;
    return (
      <View style={{ flexDirection: 'row', gap: GAP, marginBottom: 10 }}>
        {images.map((uri, i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri }} style={{ width: half, height: 180, borderRadius: 8 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (n === 3) {
    const half = (W - GAP) / 2;
    return (
      <View style={{ flexDirection: 'row', gap: GAP, marginBottom: 10 }}>
        <TouchableOpacity onPress={() => onPress(0)} activeOpacity={0.9}>
          <Image source={{ uri: images[0] }} style={{ width: half, height: 220, borderRadius: 8 }} resizeMode="cover" />
        </TouchableOpacity>
        <View style={{ flex: 1, gap: GAP }}>
          {[1, 2].map((i) => (
            <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
              <Image source={{ uri: images[i] }} style={{ width: half, height: (220 - GAP) / 2, borderRadius: 8 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (n === 4) {
    const half = (W - GAP) / 2;
    return (
      <View style={{ gap: GAP, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {[0, 1].map((i) => (
            <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
              <Image source={{ uri: images[i] }} style={{ width: half, height: 150, borderRadius: 8 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {[2, 3].map((i) => (
            <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
              <Image source={{ uri: images[i] }} style={{ width: half, height: 150, borderRadius: 8 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // 5 images: 2 on top, 3 on bottom
  const topW = (W - GAP) / 2;
  const botW = (W - GAP * 2) / 3;
  return (
    <View style={{ gap: GAP, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {[0, 1].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: topW, height: 160, borderRadius: 8 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {[2, 3, 4].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: botW, height: 110, borderRadius: 8 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ExcoNewsScreen() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchPosts = useCallback(async () => {
    try {
      const params = user?.club ? { club: (user.club as any)._id || user.club } : {};
      const res = await api.get('/news', { params });
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
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={[styles.dot, { backgroundColor: item.isPublished ? COLORS.success : COLORS.textMuted }]} />
            </View>
            <Text style={styles.content} numberOfLines={3}>{item.content}</Text>

            {item.images?.length > 0 && (
              <ImageGrid
                images={item.images}
                onPress={(i) => setViewer({ images: item.images, index: i })}
              />
            )}

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                {'  '}
                {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
              <Text style={styles.deleteText}> Delete</Text>
            </TouchableOpacity>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(exco)/news/create')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {viewer && (
        <ImageViewer
          images={viewer.images}
          startIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  content: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  date: { fontSize: 11, color: COLORS.textMuted },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  deleteText: { color: COLORS.error, fontSize: 13 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60 },
});

const viewer = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6,
  },
  counter: {
    position: 'absolute', top: 56, alignSelf: 'center', zIndex: 10,
    color: '#fff', fontSize: 14, fontWeight: '600',
  },
});
