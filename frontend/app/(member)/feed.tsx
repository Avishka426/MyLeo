import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image,
  TouchableOpacity, RefreshControl, Modal, Dimensions, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS } from '../../lib/constants';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAP = 2;

interface NewsPost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  publishedAt: string;
  club: { name: string; clubCode: string; logo?: string };
}

// ── Image Viewer Modal ────────────────────────────────────────────────────────
function ImageViewer({
  images, startIndex, onClose,
}: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={viewerStyles.overlay}>
        <StatusBar hidden />
        <TouchableOpacity style={viewerStyles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={viewerStyles.counter}>{current + 1} / {images.length}</Text>
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

  const W = SCREEN_W - 32;

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
export default function FeedScreen() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const router = useRouter();
  const { user } = useAuth();

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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const renderPost = ({ item }: { item: NewsPost }) => (
    <Card>
      <View style={styles.clubRow}>
        <Ionicons name="shield-outline" size={14} color={COLORS.primary} />
        <Text style={styles.clubName}>{item.club?.name}</Text>
        <Text style={styles.date}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
      {item.images?.length > 0 && (
        <ImageGrid
          images={item.images}
          onPress={(i) => setViewer({ images: item.images, index: i })}
        />
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      {!user && (
        <TouchableOpacity style={styles.signInBanner} onPress={() => router.push('/(auth)/sign-in')}>
          <Ionicons name="log-in-outline" size={16} color="#fff" />
          <Text style={styles.signInText}>  Sign in for full access</Text>
        </TouchableOpacity>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet. Check back soon!</Text>}
      />
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
  list: { padding: 16, paddingBottom: 32 },
  clubRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  clubName: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginLeft: 4, flex: 1 },
  date: { fontSize: 11, color: COLORS.textMuted },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  content: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 10 },
  signInBanner: {
    backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', padding: 10,
  },
  signInText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  error: { color: COLORS.error, textAlign: 'center', padding: 12 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 60, fontSize: 15 },
});

const viewerStyles = StyleSheet.create({
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
