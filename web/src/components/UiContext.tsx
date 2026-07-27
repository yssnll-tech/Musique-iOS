import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

// État d'interface partagé par la coquille (barre latérale en tiroir sur mobile).
interface UiValue {
    navOpen: boolean
    openNav: () => void
    closeNav: () => void
}

const UiContext = createContext<UiValue | null>(null)

export function useUi(): UiValue {
    const ctx = useContext(UiContext)
    if (!ctx) throw new Error('useUi doit être utilisé dans <UiProvider>')
    return ctx
}

export function UiProvider({ children }: { children: ReactNode }) {
    const [navOpen, setNavOpen] = useState(false)
    // Identités stables : un effet « fermer à la navigation » ne doit pas se
    // redéclencher à chaque rendu (sinon le tiroir ne pourrait jamais rester ouvert).
    const openNav = useCallback(() => setNavOpen(true), [])
    const closeNav = useCallback(() => setNavOpen(false), [])
    const value = useMemo(() => ({ navOpen, openNav, closeNav }), [navOpen, openNav, closeNav])
    return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}
