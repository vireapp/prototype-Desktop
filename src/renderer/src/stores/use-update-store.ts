import { create } from 'zustand'

export type UpdateStatus =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; version: string; releaseNotes?: string }
  | { status: 'up-to-date' }
  | { status: 'downloading'; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string }

interface UpdateState {
  update: UpdateStatus
  dismissed: boolean
  panelOpen: boolean
  setUpdate: (update: UpdateStatus) => void
  setDismissed: (dismissed: boolean) => void
  setPanelOpen: (open: boolean) => void
}

export const useUpdateStore = create<UpdateState>()((set) => ({
  update: { status: 'idle' },
  dismissed: false,
  panelOpen: false,
  setUpdate: (update) => set({ update, dismissed: false }),
  setDismissed: (dismissed) => set({ dismissed }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
}))
