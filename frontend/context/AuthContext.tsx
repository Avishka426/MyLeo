import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import api from '../lib/api';
import { ROLES, Role } from '../lib/constants';

interface ClubInfo {
  _id: string;
  name: string;
  clubCode: string;
  district?: string;
  logo?: string;
}

interface MemberProfileInfo {
  _id: string;
  firstName: string;
  lastName: string;
  position: string;
  profileImage?: string;
}

interface User {
  id: string;
  email: string;
  role: Role;
  club?: ClubInfo;
  memberProfile?: MemberProfileInfo;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: () => boolean;
  isMember: () => boolean;
  isExco: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('leo_moment_token');
      if (storedToken) {
        setToken(storedToken);
        const response = await api.get('/auth/me');
        setUser(mapUserResponse(response.data.data));
      }
    } catch {
      await AsyncStorage.removeItem('leo_moment_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const mapUserResponse = (data: any): User => ({
    id: data._id,
    email: data.email,
    role: data.role,
    club: data.club,
    memberProfile: data.memberProfile,
  });

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/auth/signin', { email, password });
    const { token: newToken, user: userData } = response.data;

    await AsyncStorage.setItem('leo_moment_token', newToken);
    setToken(newToken);

    const mappedUser: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      club: userData.club,
      memberProfile: userData.memberProfile,
    };
    setUser(mappedUser);

    if (mappedUser.role === ROLES.ADMIN || mappedUser.role === ROLES.EXCO) {
      router.replace('/(exco)/news');
    } else {
      router.replace('/(member)/dashboard');
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('leo_moment_token');
    setToken(null);
    setUser(null);
    router.replace('/(public)/feed');
  };

  const isGuest = () => !user;
  const isMember = () => user?.role === ROLES.MEMBER;
  const isExco = () => user?.role === ROLES.EXCO || user?.role === ROLES.ADMIN;
  const isAdmin = () => user?.role === ROLES.ADMIN;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, isGuest, isMember, isExco, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
