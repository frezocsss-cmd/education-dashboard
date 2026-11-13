import { create } from 'zustand'

export const useConfirmStore = create((set, get) => ({
  open: false,
  options: {},
  resolver: null,
  ask(options) {
    return new Promise((resolve) => {
      set({ open: true, options: options || {}, resolver: resolve })
    })
  },
  resolve(result) {
    const resolver = get().resolver
    set({ open: false, resolver: null, options: {} })
    if (resolver) resolver(result)
  },
}))

export function confirm(options) {
  return useConfirmStore.getState().ask(options)
}
