import type { GuestDetails } from '@ironwood/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BookingDraft {
  guest: GuestDetails;
  specialRequests: string;
  setGuest: (g: Partial<GuestDetails>) => void;
  setSpecialRequests: (v: string) => void;
  clear: () => void;
}

const empty = { guest: { firstName: '', lastName: '', email: '' }, specialRequests: '' };

/** Session-scoped form draft: survives refresh/back-navigation, never outlives the tab. */
export const useBookingStore = create<BookingDraft>()(
  persist(
    (set) => ({
      ...empty,
      setGuest: (g) => set((s) => ({ guest: { ...s.guest, ...g } })),
      setSpecialRequests: (specialRequests) => set({ specialRequests }),
      clear: () => set(empty),
    }),
    { name: 'ironwood-booking', storage: createJSONStorage(() => sessionStorage) },
  ),
);
