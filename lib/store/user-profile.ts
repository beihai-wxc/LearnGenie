/**
 * User Profile Store
 * Persists avatar, nickname, bio & learning profile to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createDefaultProfileDimensions,
  mergeProfileDimensions,
  type StudentProfileDimensions,
  type DimensionKey,
  type ProfileConversationEntry,
} from '@/lib/types/student-profile';

/** Predefined avatar options */
export const AVATAR_OPTIONS = [
  '/avatars/user.png',
  '/avatars/teacher-2.png',
  '/avatars/assist-2.png',
  '/avatars/clown-2.png',
  '/avatars/curious-2.png',
  '/avatars/note-taker-2.png',
  '/avatars/thinker-2.png',
] as const;

export interface UserProfileState {
  /** Local avatar path or data-URL (for custom uploads) */
  avatar: string;
  nickname: string;
  bio: string;
  /** 8-dimension learning profile built conversationally */
  learningProfile: StudentProfileDimensions;
  /** Number of conversation rounds used for profile building */
  conversationCount: number;
  /** Last profile update timestamp */
  updatedAt: number;
  /** Profile building conversation history */
  conversationHistory: ProfileConversationEntry[];
  setAvatar: (avatar: string) => void;
  setNickname: (nickname: string) => void;
  setBio: (bio: string) => void;
  setLearningProfile: (dimensions: Partial<StudentProfileDimensions>) => void;
  incrementConversationCount: () => void;
  addConversationEntry: (entry: Omit<ProfileConversationEntry, 'id' | 'timestamp'>) => void;
  clearConversationHistory: () => void;
  getSnapshot: () => StudentProfileDimensions;
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      avatar: AVATAR_OPTIONS[0],
      nickname: '',
      bio: '',
      learningProfile: createDefaultProfileDimensions(),
      conversationCount: 0,
      updatedAt: 0,
      conversationHistory: [],
      setAvatar: (avatar) => set({ avatar }),
      setNickname: (nickname) => set({ nickname }),
      setBio: (bio) => set({ bio }),
      setLearningProfile: (partial) =>
        set((state) => ({
          learningProfile: mergeProfileDimensions(state.learningProfile, partial),
          updatedAt: Date.now(),
        })),
      incrementConversationCount: () =>
        set((state) => ({
          conversationCount: state.conversationCount + 1,
          updatedAt: Date.now(),
        })),
      addConversationEntry: (entry) =>
        set((state) => ({
          conversationHistory: [
            ...state.conversationHistory.slice(-49),
            { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),
      clearConversationHistory: () => set({ conversationHistory: [] }),
      getSnapshot: () => get().learningProfile,
    }),
    {
      name: 'user-profile-storage',
      version: 2,
      migrate: (persistedState: unknown) => {
        const persisted = persistedState as Record<string, unknown>;
        if (!persisted.learningProfile) {
          persisted.learningProfile = createDefaultProfileDimensions();
        }
        if (persisted.conversationCount === undefined) {
          persisted.conversationCount = 0;
        }
        if (!persisted.updatedAt) {
          persisted.updatedAt = 0;
        }
        if (!persisted.conversationHistory) {
          persisted.conversationHistory = [];
        }
        return persisted as unknown as UserProfileState;
      },
    },
  ),
);
