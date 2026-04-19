import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CreateEventScreen() {
  const { colors, radius } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [visibility, setVisibility] = useState<'own' | 'all'>('own');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: colors.text, backgroundColor: colors.card, marginBottom: 14,
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!d || !m || !y || m < 1 || m > 12 || d < 1 || d > 31) {
      Alert.alert('Error', 'Enter a valid date (day 1-31, month 1-12, year)'); return;
    }
    const eventDate = new Date(y, m - 1, d);
    if (eventDate <= new Date()) { Alert.alert('Error', 'Event date must be in the future'); return; }

    setLoading(true);
    try {
      await api.post('/events', { title: title.trim(), description: description.trim() || undefined, eventDate: eventDate.toISOString(), visibility });
      Alert.alert('Success', 'Event created!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{
        backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center',
        paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, flex: 1 }}>New Event</Text>
        <TouchableOpacity
          onPress={handleSubmit} disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 8, opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{loading ? 'Saving…' : 'Post'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Title *</Text>
        <TextInput
          style={inputStyle} placeholder="Event title" placeholderTextColor={colors.textMuted}
          value={title} onChangeText={setTitle}
        />

        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</Text>
        <TextInput
          style={[inputStyle, { minHeight: 90, textAlignVertical: 'top' }]}
          placeholder="What's happening? (optional)" placeholderTextColor={colors.textMuted}
          value={description} onChangeText={setDescription} multiline
        />

        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Visibility</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {(['own', 'all'] as const).map((v) => {
            const active = visibility === v;
            const label = v === 'own' ? 'Our Multiple Only' : 'All Districts';
            const icon = v === 'own' ? 'lock-closed-outline' : 'globe-outline';
            return (
              <TouchableOpacity
                key={v}
                onPress={() => setVisibility(v)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary + '18' : colors.card,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={icon as any} size={15} color={active ? colors.primary : colors.textMuted} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: active ? colors.primary : colors.textMuted }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Event Date *</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Day</Text>
            <TextInput
              style={inputStyle} placeholder="DD" placeholderTextColor={colors.textMuted}
              keyboardType="number-pad" maxLength={2} value={day} onChangeText={setDay}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Month</Text>
            <TextInput
              style={inputStyle} placeholder="MM" placeholderTextColor={colors.textMuted}
              keyboardType="number-pad" maxLength={2} value={month} onChangeText={setMonth}
            />
          </View>
          <View style={{ flex: 1.4 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Year</Text>
            <TextInput
              style={inputStyle} placeholder="YYYY" placeholderTextColor={colors.textMuted}
              keyboardType="number-pad" maxLength={4} value={year} onChangeText={setYear}
            />
          </View>
        </View>

        {day && month && year && parseInt(month) >= 1 && parseInt(month) <= 12 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryLight + '44', borderRadius: radius.md, padding: 12 }}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
              {`${parseInt(day)} ${MONTHS[parseInt(month) - 1]} ${year}`}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
