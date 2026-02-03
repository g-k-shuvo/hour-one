import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chromeStorage';

// Widget IDs that can be repositioned in the center area
export type CenterWidgetId = 'clock' | 'greeting' | 'focus';

// Center widget order (top to bottom)
interface LayoutState {
  centerWidgetOrder: CenterWidgetId[];

  // Actions
  reorderCenterWidgets: (newOrder: CenterWidgetId[]) => void;
  swapCenterWidgets: (fromIndex: number, toIndex: number) => void;
  resetLayout: () => void;
}

const DEFAULT_CENTER_ORDER: CenterWidgetId[] = ['clock', 'greeting', 'focus'];

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      centerWidgetOrder: DEFAULT_CENTER_ORDER,

      reorderCenterWidgets: (newOrder) => {
        set({ centerWidgetOrder: newOrder });
      },

      swapCenterWidgets: (fromIndex, toIndex) => {
        set((state) => {
          const newOrder = [...state.centerWidgetOrder];
          const [removed] = newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, removed);
          return { centerWidgetOrder: newOrder };
        });
      },

      resetLayout: () => {
        set({ centerWidgetOrder: DEFAULT_CENTER_ORDER });
      },
    }),
    {
      name: 'hour-one-layout',
      storage: createJSONStorage(() => chromeStorage),
    }
  )
);
