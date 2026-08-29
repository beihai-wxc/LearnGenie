/**
 * User Profile Store
 * Persists avatar, nickname, bio & learning profile to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { useAuthStore } from '@/lib/store/auth';

const getUserId = () => useAuthStore.getState().user?.email ?? 'anonymous';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userScopedStorage: any = {
  getItem: (name: string) => {
    const raw = localStorage.getItem(`${name}-${getUserId()}`);
    return raw ? JSON.parse(raw) : null;
  },
  setItem: (name: string, value: unknown) => {
    localStorage.setItem(`${name}-${getUserId()}`, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    localStorage.removeItem(`${name}-${getUserId()}`);
  },
};
import {
  createDefaultProfileDimensions,
  createDefaultLearningSummary,
  mergeProfileDimensions,
  type StudentProfileDimensions,
  type LearningSummary,
  type DimensionKey,
  type ProfileConversationEntry,
  type ProfileHistorySnapshot,
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
  /** User identity — stable self-description (DeepTutor-style Identity) */
  identity: string;
  /** Learning journey summary (DeepTutor-style SUMMARY.md) */
  learningSummary: LearningSummary;
  /** Number of conversation rounds used for profile building */
  conversationCount: number;
  /** Last profile update timestamp */
  updatedAt: number;
  /** Profile building conversation history */
  conversationHistory: ProfileConversationEntry[];
  /** Historical snapshots of learning profile — appended on each update, used for trend charts */
  profileHistory: ProfileHistorySnapshot[];
  setAvatar: (avatar: string) => void;
  setNickname: (nickname: string) => void;
  setBio: (bio: string) => void;
  setLearningProfile: (dimensions: Partial<StudentProfileDimensions>) => void;
  setIdentity: (identity: string) => void;
  setLearningSummary: (summary: Partial<LearningSummary>) => void;
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
      identity: '',
      learningSummary: createDefaultLearningSummary(),
      conversationCount: 0,
      updatedAt: 0,
      conversationHistory: [],
      profileHistory: [],
      setAvatar: (avatar) => set({ avatar }),
      setNickname: (nickname) => set({ nickname }),
      setBio: (bio) => set({ bio }),
      setLearningProfile: (partial) =>
        set((state) => {
          const now = Date.now();
          // Push a snapshot of the CURRENT profile before merging, so the trend
          // chart can render a real time series. Only snapshot when there is
          // already meaningful data (skip the very first update from all-zeros).
          const hasExistingData = Object.values(state.learningProfile).some(
            (dim) => (dim as { score?: number })?.score ?? 0 > 0,
          );
          const nextHistory = hasExistingData
            ? [
                ...state.profileHistory,
                {
                  dimensions: state.learningProfile,
                  conversationCount: state.conversationCount,
                  updatedAt: state.updatedAt || now,
                },
              ].slice(-50) // cap to last 50 snapshots to avoid unbounded growth
            : state.profileHistory;
          return {
            learningProfile: mergeProfileDimensions(state.learningProfile, partial),
            profileHistory: nextHistory,
            updatedAt: now,
          };
        }),
      setIdentity: (identity) => set({ identity }),
      setLearningSummary: (partial) =>
        set((state) => ({
          learningSummary: {
            ...state.learningSummary,
            ...partial,
            updatedAt: Date.now(),
          },
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
            { ...entry, id: nanoid(), timestamp: Date.now() },
          ],
        })),
      clearConversationHistory: () => set({ conversationHistory: [] }),
      getSnapshot: () => get().learningProfile,
    }),
    {
      name: 'user-profile-storage',
      storage: userScopedStorage,
      version: 4,
      migrate: (persistedState: unknown, version: number) => {
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
        if (version < 3) {
          if (!persisted.identity) {
            persisted.identity = '';
          }
          if (!persisted.learningSummary) {
            persisted.learningSummary = createDefaultLearningSummary();
          }
        }
        if (version < 4) {
          if (!persisted.profileHistory) {
            persisted.profileHistory = [];
          }
        }
        return persisted as unknown as UserProfileState;
      },
    },
  ),
);
