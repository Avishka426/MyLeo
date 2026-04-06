import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../lib/constants';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>Leo Moment</Text>
          <Text style={styles.tagline}>Member Sign In</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorText}> {error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="member@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.signInBtn, loading && styles.disabled]} onPress={handleSignIn} disabled={loading}>
          <Text style={styles.signInText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/(public)/feed')}>
          <Ionicons name="arrow-back-outline" size={16} color={COLORS.primary} />
          <Text style={styles.backLinkText}> Back to News Feed</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Accounts are created by your club administrator. Contact your EXCO if you need access.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40 },
  logoSection: { alignItems: 'center', paddingVertical: 40 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F0FB',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  tagline: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 13 },
  signInBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  disabled: { opacity: 0.6 },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  backLinkText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FDECEA', borderRadius: 8, padding: 12, marginBottom: 8,
  },
  errorText: { color: COLORS.error, fontSize: 13 },
  note: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 32, lineHeight: 18 },
});
