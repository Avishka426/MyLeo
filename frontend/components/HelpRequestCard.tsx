import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { STATUS_COLORS } from '../lib/theme';
import { ImageGridViewer } from './ImageGridViewer';
import api from '../lib/api';

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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Needs Help',
  claimed: 'Being Handled',
  joint: 'Joint Project',
  converted_to_project: 'Project Created',
};

interface Props {
  item: HelpRequestItem;
  myClubId?: string;
  isExco?: boolean;
  onUpdate?: (updated: HelpRequestItem) => void;
}

export default function HelpRequestCard({ item, myClubId, isExco, onUpdate }: Props) {
  const { colors, radius } = useTheme();
  const [busy, setBusy] = useState(false);

  const joinRequests = item.joinRequests ?? [];
  const images = item.images ?? [];
  const isClaimer = !!myClubId && item.claimedBy?._id === myClubId;
  const isJointOpen = item.status === 'joint';
  const myJoin = joinRequests.find((jr) => jr.club?._id === myClubId);

  const statusColor = STATUS_COLORS[item.status] ?? colors.textMuted;

  const doAction = async (fn: () => Promise<any>) => {
    setBusy(true);
    try {
      const res = await fn();
      onUpdate?.(res.data.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = () => doAction(() => api.put(`/help-requests/${item._id}/claim`));

  const handleMarkJoint = () =>
    Alert.alert('Open for Joint Project?', 'Other clubs will be able to apply to join.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => doAction(() => api.put(`/help-requests/${item._id}/joint`)) },
    ]);

  const handleJoin = () =>
    Alert.alert('Apply to Join?', 'Send a join request to the handling club.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply', onPress: () => doAction(() => api.post(`/help-requests/${item._id}/join`)) },
    ]);

  const handleReview = (clubId: string, action: 'accept' | 'reject') =>
    doAction(() => api.put(`/help-requests/${item._id}/join/${clubId}`, { action }));

  const ActionBtn = ({
    label, icon, bg, onPress,
  }: { label: string; icon: keyof typeof Ionicons.glyphMap; bg: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: radius.md, paddingVertical: 10, backgroundColor: bg,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <Ionicons name={icon} size={15} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border,
    }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.guestName}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={{ borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: statusColor + '20' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 }}>{item.subject}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 10 }} numberOfLines={4}>
        {item.message}
      </Text>

      {/* Images */}
      <ImageGridViewer images={images} />

      {/* Claimed by row */}
      {item.claimedBy && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, backgroundColor: colors.success + '12', borderRadius: radius.sm, padding: 8 }}>
          <Ionicons name="shield-checkmark" size={14} color={colors.success} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.success }}>
            {isClaimer ? 'Your club is handling this' : `Handled by ${item.claimedBy.name}`}
          </Text>
        </View>
      )}

      {/* Accepted partner clubs */}
      {isJointOpen && joinRequests.filter((jr) => jr.status === 'accepted').length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '600' }}>Also joining: </Text>
          <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
            {joinRequests.filter((jr) => jr.status === 'accepted').map((jr) => jr.club.name).join(', ')}
          </Text>
        </View>
      )}

      {/* Exco actions */}
      {isExco && (
        <View style={{ marginTop: 10, gap: 8 }}>
          {item.status === 'pending' && (
            <ActionBtn label="We'll Handle This" icon="hand-left-outline" bg={colors.primary} onPress={handleClaim} />
          )}
          {isClaimer && item.status === 'claimed' && (
            <ActionBtn label="Open for Joint Project" icon="people-outline" bg="#8B5CF6" onPress={handleMarkJoint} />
          )}
          {!isClaimer && isJointOpen && !myJoin && (
            <ActionBtn label="Apply to Join" icon="add-circle-outline" bg="#0D9488" onPress={handleJoin} />
          )}

          {myJoin && (() => {
            const st = myJoin.status;
            const bg = st === 'accepted' ? colors.success + '15' : st === 'rejected' ? colors.error + '15' : colors.warning + '15';
            const border = st === 'accepted' ? colors.success : st === 'rejected' ? colors.error : colors.warning;
            const label = st === 'accepted' ? '✓ Join request accepted' : st === 'rejected' ? '✗ Join request rejected' : '⏳ Join request pending';
            return (
              <View style={{ borderRadius: radius.sm, padding: 10, alignItems: 'center', backgroundColor: bg, borderWidth: 1, borderColor: border }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{label}</Text>
              </View>
            );
          })()}

          {isClaimer && joinRequests.filter((jr) => jr.status === 'pending').length > 0 && (
            <View style={{ backgroundColor: colors.background, borderRadius: radius.md, padding: 12, gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>Clubs wanting to join:</Text>
              {joinRequests.filter((jr) => jr.status === 'pending').map((jr) => (
                <View key={jr.club._id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1 }}>{jr.club.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.success }}
                      onPress={() => handleReview(jr.club._id, 'accept')} disabled={busy}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.error }}
                      onPress={() => handleReview(jr.club._id, 'reject')} disabled={busy}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
