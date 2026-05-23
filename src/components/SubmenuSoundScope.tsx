import { createContext, useContext } from 'react'

const SubmenuSoundScopeContext = createContext(false)

export function SubmenuSoundScope({ children }: { children: React.ReactNode }) {
  return (
    <SubmenuSoundScopeContext.Provider value={true}>
      {children}
    </SubmenuSoundScopeContext.Provider>
  )
}

export function useSubmenuSoundScope(): boolean {
  return useContext(SubmenuSoundScopeContext)
}
