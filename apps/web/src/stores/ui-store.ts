import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface UiState {
  theme: Theme;
  toggleTheme: () => void;
}

const apply = (t: Theme) => document.documentElement.classList.toggle('dark', t === 'dark');

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        apply(next);
        set({ theme: next });
      },
    }),
    {
      name: 'ironwood-ui',
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (s) => s && apply(s.theme),
    },
  ),
);
