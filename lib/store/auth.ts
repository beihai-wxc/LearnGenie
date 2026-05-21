import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  email: string;
  nickname: string;
  avatar: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Login failed');
          set({ token: data.token, user: data.user, isAuthenticated: true, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      register: async (email, password, nickname) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, nickname }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Registration failed');
          set({ isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        set({ token: null, user: null, isAuthenticated: false });
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          /* proceed even if API call fails */
        }
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!data.success) {
            set({ token: null, user: null, isAuthenticated: false });
          } else {
            set({ user: data.user, isAuthenticated: true });
          }
        } catch {
          set({ token: null, user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      updateAvatar: async (avatar) => {
        const { token, user } = get();
        if (!token) return;
        const res = await fetch('/api/auth/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatar }),
        });
        const data = await res.json();
        if (data.success && user) {
          set({ user: { ...user, avatar } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
