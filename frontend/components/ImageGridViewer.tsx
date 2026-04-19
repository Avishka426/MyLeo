import React, { useState } from 'react';
import {
  View, Image, TouchableOpacity, FlatList, Text, Modal, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const GAP = 2;

// ── Full-screen viewer modal ──────────────────────────────────────────────────
function ImageViewer({
  images, startIndex, onClose,
}: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute', top: 50, right: 20, zIndex: 10,
            backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8,
          }}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        {images.length > 1 && (
          <Text style={{
            position: 'absolute', top: 56, alignSelf: 'center', zIndex: 10,
            color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600',
          }}>
            {current + 1} / {images.length}
          </Text>
        )}
        <FlatList
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / W))}
          renderItem={({ item }) => (
            <View style={{ width: W, height: H, justifyContent: 'center' }}>
              <Image source={{ uri: item }} style={{ width: W, height: H }} resizeMode="contain" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// ── Image grid (1-5 images, Facebook-style) ───────────────────────────────────
function ImageGrid({ images, cardWidth, onPress }: { images: string[]; cardWidth: number; onPress: (i: number) => void }) {
  const n = images.length;
  if (n === 0) return null;

  if (n === 1) return (
    <TouchableOpacity onPress={() => onPress(0)} activeOpacity={0.9}>
      <Image source={{ uri: images[0] }} style={{ width: cardWidth, height: 220, borderRadius: 10, marginBottom: 10 }} resizeMode="cover" />
    </TouchableOpacity>
  );

  const half = (cardWidth - GAP) / 2;

  if (n === 2) return (
    <View style={{ flexDirection: 'row', gap: GAP, marginBottom: 10 }}>
      {images.map((uri, i) => (
        <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
          <Image source={{ uri }} style={{ width: half, height: 180, borderRadius: 10 }} resizeMode="cover" />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (n === 3) return (
    <View style={{ flexDirection: 'row', gap: GAP, marginBottom: 10 }}>
      <TouchableOpacity onPress={() => onPress(0)} activeOpacity={0.9}>
        <Image source={{ uri: images[0] }} style={{ width: half, height: 220, borderRadius: 10 }} resizeMode="cover" />
      </TouchableOpacity>
      <View style={{ flex: 1, gap: GAP }}>
        {[1, 2].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: half, height: (220 - GAP) / 2, borderRadius: 10 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (n === 4) return (
    <View style={{ gap: GAP, marginBottom: 10 }}>
      {[[0, 1], [2, 3]].map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: GAP }}>
          {row.map((i) => (
            <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
              <Image source={{ uri: images[i] }} style={{ width: half, height: 150, borderRadius: 10 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  // 5+
  const third = (cardWidth - GAP * 2) / 3;
  return (
    <View style={{ gap: GAP, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {[0, 1].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: half, height: 160, borderRadius: 10 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {[2, 3, 4].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: third, height: 110, borderRadius: 10 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Composed component ────────────────────────────────────────────────────────
interface Props {
  images: string[];
  cardWidth?: number;
}

export function ImageGridViewer({ images, cardWidth = W - 62 }: Props) {
  const [viewer, setViewer] = useState<{ index: number } | null>(null);
  if (!images || images.length === 0) return null;

  return (
    <>
      <ImageGrid images={images} cardWidth={cardWidth} onPress={(i) => setViewer({ index: i })} />
      {viewer && (
        <ImageViewer images={images} startIndex={viewer.index} onClose={() => setViewer(null)} />
      )}
    </>
  );
}
