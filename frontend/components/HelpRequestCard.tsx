import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, FlatList, Dimensions, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS_COLORS } from '../lib/constants';
import api from '../lib/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GAP = 2;

export interface JoinRequest {
  club: { _id: string; name: string; clubCode: string };
  status: 'pending' | 'accepted' | 'rejected';
}

export interface HelpRequestItem {
  _id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  subject: string;
  message: string;
  images: string[];
  status: 'pending' | 'claimed' | 'joint' | 'converted_to_project';
  claimedBy?: { _id: string; name: string; clubCode: string };
  isJoint: boolean;
  joinRequests: JoinRequest[];
  createdAt: string;
}

// ── Image viewer ─────────────────────────────────────────────────────────────
function ImageViewer({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar hidden />
        <TouchableOpacity style={vs.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={vs.counter}>{current + 1} / {images.length}</Text>
        <FlatList
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          initialScrollIndex={startIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_W, height: SCREEN_H, justifyContent: 'center' }}>
              <Image source={{ uri: item }} style={{ width: SCREEN_W, height: SCREEN_H }} resizeMode="contain" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// ── Image grid ────────────────────────────────────────────────────────────────
function ImageGrid({ images, onPress }: { images: string[]; onPress: (i: number) => void }) {
  const n = images.length;
  if (!n) return null;
  const W = SCREEN_W - 32;

  if (n === 1) return (
    <TouchableOpacity onPress={() => onPress(0)} activeOpacity={0.9}>
      <Image source={{ uri: images[0] }} style={{ width: W, height: 200, borderRadius: 8, marginBottom: 10 }} resizeMode="cover" />
    </TouchableOpacity>
  );

  if (n === 2) {
    const half = (W - GAP) / 2;
    return (
      <View style={{ flexDirection: 'row', gap: GAP, marginBottom: 10 }}>
        {images.map((uri, i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri }} style={{ width: half, height: 160, borderRadius: 8 }} resizeMode="cover" />
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
          <Image source={{ uri: images[0] }} style={{ width: half, height: 200, borderRadius: 8 }} resizeMode="cover" />
        </TouchableOpacity>
        <View style={{ flex: 1, gap: GAP }}>
          {[1, 2].map((i) => (
            <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
              <Image source={{ uri: images[i] }} style={{ width: half, height: (200 - GAP) / 2, borderRadius: 8 }} resizeMode="cover" />
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
              <Image source={{ uri: images[i] }} style={{ width: half, height: 140, borderRadius: 8 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {[2, 3].map((i) => (
            <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
              <Image source={{ uri: images[i] }} style={{ width: half, height: 140, borderRadius: 8 }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  const topW = (W - GAP) / 2;
  const botW = (W - GAP * 2) / 3;
  return (
    <View style={{ gap: GAP, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {[0, 1].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: topW, height: 150, borderRadius: 8 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {[2, 3, 4].map((i) => (
          <TouchableOpacity key={i} onPress={() => onPress(i)} activeOpacity={0.9}>
            <Image source={{ uri: images[i] }} style={{ width: botW, height: 100, borderRadius: 8 }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  pending: 'Needs Help',
  claimed: 'Being Handled',
  joint:   'Joint Project',
  converted_to_project: 'Project Created',
};
const STATUS_COLOR: Record<string, string> = {
  pending: COLORS.error,
  claimed: '#E67E22',
  joint:   COLORS.primary,
  converted_to_project: COLORS.success,
};

// ── Main card ─────────────────────────────────────────────────────────────────
interface Props {
  item: HelpRequestItem;
  myClubId?: string;           // undefined = public/member view
  isExco?: boolean;
  onUpdate?: (updated: HelpRequestItem) => void;
}

export default function HelpRequestCard({ item, myClubId, isExco, onUpdate }: Props) {
  const [viewer, setViewer] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const joinRequests = item.joinRequests ?? [];
  const images       = item.images ?? [];

  const isClaimer   = !!myClubId && item.claimedBy?._id === myClubId;
  const isClaimed   = item.status !== 'pending';
  const isJointOpen = item.status === 'joint';
  const myJoin      = joinRequests.find((jr) => jr.club?._id === myClubId);

  const doAction = async (fn: () => Promise<any>) => {
    setLoading(true);
    try {
      const res = await fn();
      onUpdate?.(res.data.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = () =>
    doAction(() => api.put(`/help-requests/${item._id}/claim`));

  const handleMarkJoint = () =>
    Alert.alert('Mark as Joint Project?', 'Other clubs will be able to apply to join this project.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Joint', onPress: () => doAction(() => api.put(`/help-requests/${item._id}/joint`)) },
    ]);

  const handleJoin = () =>
    Alert.alert('Apply to Join?', 'Send a join request to the claiming club.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => doAction(() => api.post(`/help-requests/${item._id}/join`)) },
    ]);

  const handleReview = (clubId: string, action: 'accept' | 'reject') =>
    doAction(() => api.put(`/help-requests/${item._id}/join/${clubId}`, { action }));

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatarCircle}>
          <Ionicons name="person" size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.name}>{item.guestName}</Text>
          <Text style={s.time}>{new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20' }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={s.subject}>{item.subject}</Text>
      <Text style={s.message} numberOfLines={4}>{item.message}</Text>

      {/* Images */}
      {images.length > 0 && (
        <ImageGrid images={images} onPress={(i) => setViewer(i)} />
      )}

      {/* Claimed by */}
      {item.claimedBy && (
        <View style={s.claimedRow}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={s.claimedText}>
            {isClaimer ? 'Your club is handling this' : `Handled by ${item.claimedBy.name}`}
          </Text>
        </View>
      )}

      {/* Accepted clubs for joint */}
      {isJointOpen && joinRequests.filter((jr) => jr.status === 'accepted').length > 0 && (
        <View style={s.joinedClubs}>
          <Text style={s.joinedLabel}>Also joining: </Text>
          <Text style={s.joinedNames}>
            {joinRequests.filter((jr) => jr.status === 'accepted').map((jr) => jr.club.name).join(', ')}
          </Text>
        </View>
      )}

      {/* ── Exco action buttons ── */}
      {isExco && (
        <View style={s.actions}>
          {/* Pending: claim */}
          {item.status === 'pending' && (
            <TouchableOpacity style={[s.actionBtn, s.claimBtn]} onPress={handleClaim} disabled={loading}>
              <Ionicons name="hand-left-outline" size={15} color="#fff" />
              <Text style={s.actionBtnText}>We'll Handle This</Text>
            </TouchableOpacity>
          )}

          {/* Claimer: mark joint */}
          {isClaimer && item.status === 'claimed' && (
            <TouchableOpacity style={[s.actionBtn, s.jointBtn]} onPress={handleMarkJoint} disabled={loading}>
              <Ionicons name="people-outline" size={15} color="#fff" />
              <Text style={s.actionBtnText}>Open for Joint Project</Text>
            </TouchableOpacity>
          )}

          {/* Non-claimer: apply to join */}
          {!isClaimer && isJointOpen && !myJoin && (
            <TouchableOpacity style={[s.actionBtn, s.joinBtn]} onPress={handleJoin} disabled={loading}>
              <Ionicons name="add-circle-outline" size={15} color="#fff" />
              <Text style={s.actionBtnText}>Apply to Join</Text>
            </TouchableOpacity>
          )}

          {/* My join status */}
          {myJoin && (
            <View style={[s.joinStatus, myJoin.status === 'accepted' ? s.joinAccepted : myJoin.status === 'rejected' ? s.joinRejected : s.joinPending]}>
              <Text style={s.joinStatusText}>
                {myJoin.status === 'accepted' ? '✓ Join request accepted' : myJoin.status === 'rejected' ? '✗ Join request rejected' : '⏳ Join request pending'}
              </Text>
            </View>
          )}

          {/* Claimer: review join requests */}
          {isClaimer && joinRequests.filter((jr) => jr.status === 'pending').length > 0 && (
            <View style={s.reviewSection}>
              <Text style={s.reviewTitle}>Clubs wanting to join:</Text>
              {joinRequests.filter((jr) => jr.status === 'pending').map((jr) => (
                <View key={jr.club._id} style={s.reviewRow}>
                  <Text style={s.reviewClub}>{jr.club.name}</Text>
                  <View style={s.reviewBtns}>
                    <TouchableOpacity style={[s.reviewBtn, s.acceptBtn]} onPress={() => handleReview(jr.club._id, 'accept')} disabled={loading}>
                      <Text style={s.reviewBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.reviewBtn, s.rejectBtn]} onPress={() => handleReview(jr.club._id, 'reject')} disabled={loading}>
                      <Text style={s.reviewBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Image viewer */}
      {viewer !== null && (
        <ImageViewer images={images} startIndex={viewer} onClose={() => setViewer(null)} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8F0FB', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  time: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  subject: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  message: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 10 },

  claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, backgroundColor: COLORS.success + '12', borderRadius: 8, padding: 8 },
  claimedText: { fontSize: 12, fontWeight: '600', color: COLORS.success },
  joinedClubs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  joinedLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  joinedNames: { fontSize: 12, color: COLORS.primary, fontWeight: '600', flex: 1 },

  actions: { marginTop: 8, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 10 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  claimBtn: { backgroundColor: COLORS.primary },
  jointBtn: { backgroundColor: '#8E44AD' },
  joinBtn:  { backgroundColor: '#16A085' },

  joinStatus: { borderRadius: 8, padding: 10, alignItems: 'center' },
  joinPending:  { backgroundColor: '#FEF9E7', borderWidth: 1, borderColor: '#F39C12' },
  joinAccepted: { backgroundColor: COLORS.success + '15', borderWidth: 1, borderColor: COLORS.success },
  joinRejected: { backgroundColor: COLORS.error   + '15', borderWidth: 1, borderColor: COLORS.error },
  joinStatusText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  reviewSection: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, gap: 8 },
  reviewTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewClub: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 },
  reviewBtns: { flexDirection: 'row', gap: 6 },
  reviewBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  acceptBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.error },
  reviewBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

const vs = StyleSheet.create({
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6 },
  counter: { position: 'absolute', top: 56, alignSelf: 'center', zIndex: 10, color: '#fff', fontSize: 14, fontWeight: '600' },
});
