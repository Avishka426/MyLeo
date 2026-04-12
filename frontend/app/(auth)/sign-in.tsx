import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { colors, radius } = useTheme();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Sign in failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 24,
            backgroundColor: colors.primaryLight,
            justifyContent: 'center', alignItems: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="shield-checkmark" size={46} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 30, fontWeight: '900', color: colors.text, letterSpacing: -0.5 }}>MyLeo</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 6 }}>Sign in to your account</Text>
        </View>

        {/* Form card */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: radius.xl,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          {error ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: colors.error + '15',
              borderRadius: radius.md,
              padding: 12, marginBottom: 16,
              borderWidth: 1, borderColor: colors.error + '30',
            }}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={{ color: colors.error, fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="member@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            isPassword
          />

          <Button
            label={loading ? 'Signing in…' : 'Sign In'}
            onPress={handleSignIn}
            loading={loading}
            size="lg"
            style={{ marginTop: 24 }}
          />
        </View>

        <TouchableOpacity
          style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 6 }}
          onPress={() => router.replace('/(public)/feed')}
        >
          <Ionicons name="arrow-back-outline" size={15} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Back to News Feed</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 32, lineHeight: 18, paddingHorizontal: 16 }}>
          Accounts are created by your club administrator.{'\n'}Contact your EXCO if you need access.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
