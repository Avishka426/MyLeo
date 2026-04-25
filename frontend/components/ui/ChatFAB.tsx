import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width: W, height: H } = Dimensions.get('window');
const SIZE = 56;

export function ChatFAB() {
  const router = useRouter();
  const { colors } = useTheme();
  const pos = useRef(new Animated.ValueXY({ x: W - SIZE - 16, y: H - SIZE - 160 })).current;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pos.setOffset({ x: (pos.x as any)._value, y: (pos.y as any)._value });
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pos.flattenOffset();
        const moved = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        if (moved < 5) {
          router.push('/chat');
          return;
        }
        const nx = Math.max(0, Math.min(g.moveX - SIZE / 2, W - SIZE));
        const ny = Math.max(80, Math.min(g.moveY - SIZE / 2, H - SIZE - 80));
        Animated.spring(pos, { toValue: { x: nx, y: ny }, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.fab, { backgroundColor: colors.primary }, pos.getLayout()]} {...pan.panHandlers}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/chat')}
        style={styles.touch}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={9} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    zIndex: 999,
    ...Platform.select({
      android: { elevation: 8 },
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
    }),
  },
  touch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
