import type { ContentModel } from '@ironwood/shared';
import { create } from 'zustand';

export interface EditTarget {
  model: ContentModel;
  id: string;
  prop: string;
  label: string;
  value: string;
  multiline: boolean;
}

interface AuthorState {
  enabled: boolean;
  editing: EditTarget | null;
  setEnabled: (v: boolean) => void;
  openEditor: (t: EditTarget) => void;
  closeEditor: () => void;
}

export const useAuthorStore = create<AuthorState>((set) => ({
  enabled: false,
  editing: null,
  setEnabled: (enabled) => set({ enabled, editing: null }),
  openEditor: (editing) => set({ editing }),
  closeEditor: () => set({ editing: null }),
}));
