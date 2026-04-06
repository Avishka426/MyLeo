import { Stack } from 'expo-router';
import { COLORS } from '../../lib/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Sign In', headerBackVisible: false }} />
    </Stack>
  );
}
