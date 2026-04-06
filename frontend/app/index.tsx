import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ROLES } from '../lib/constants';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!user) return <Redirect href="/(public)/feed" />;

  if (user.role === ROLES.EXCO || user.role === ROLES.ADMIN) {
    return <Redirect href="/(exco)/news" />;
  }

  return <Redirect href="/(member)/dashboard" />;
}
