import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface UIState {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  folderModalOpen: boolean;
  folderModalTarget: "session" | "default";
  openFolderModal: (target: "session" | "default") => void;
  closeFolderModal: () => void;
}

let counter = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    counter += 1;
    const id = `toast-${Date.now()}-${counter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  folderModalOpen: false,
  folderModalTarget: "session",
  openFolderModal: (target) => set({ folderModalOpen: true, folderModalTarget: target }),
  closeFolderModal: () => set({ folderModalOpen: false }),
}));
