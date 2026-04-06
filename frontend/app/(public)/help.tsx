import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { COLORS } from '../../lib/constants';

export default function HelpScreen() {
  const [form, setForm] = useState({
    guestName: '', guestEmail: '', guestPhone: '', subject: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.guestName || !form.guestEmail || !form.subject || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/help-requests', form);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={72} color={COLORS.success} />
        <Text style={styles.successTitle}>Request Submitted!</Text>
        <Text style={styles.successText}>
          Thank you! A Leo club member will review your request and get back to you soon.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => { setSubmitted(false); setForm({ guestName: '', guestEmail: '', guestPhone: '', subject: '', message: '' }); }}>
          <Text style={styles.buttonText}>Submit Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Request Help</Text>
        <Text style={styles.subheading}>Submit a request and a Leo club will get back to you.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={form.guestName} onChangeText={(v) => setForm({ ...form, guestName: v })} placeholder="Your name" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} value={form.guestEmail} onChangeText={(v) => setForm({ ...form, guestEmail: v })} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Phone (optional)</Text>
        <TextInput style={styles.input} value={form.guestPhone} onChangeText={(v) => setForm({ ...form, guestPhone: v })} placeholder="+94 77 000 0000" keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Subject *</Text>
        <TextInput style={styles.input} value={form.subject} onChangeText={(v) => setForm({ ...form, subject: v })} placeholder="What do you need help with?" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={form.message}
          onChangeText={(v) => setForm({ ...form, message: v })}
          placeholder="Describe your situation in detail..."
          multiline numberOfLines={5}
          textAlignVertical="top"
          placeholderTextColor={COLORS.textMuted}
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Submitting…' : 'Submit Request'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  subheading: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.text,
  },
  textarea: { height: 120, paddingTop: 12 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: COLORS.error, marginBottom: 12, fontSize: 13 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.background },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 16, marginBottom: 12 },
  successText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
