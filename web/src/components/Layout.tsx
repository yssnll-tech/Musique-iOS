import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NowPlaying } from './NowPlaying'
import { UiProvider, useUi } from './UiContext'

export function Layout() {
    return (
        <UiProvider>
            <LayoutInner />
        </UiProvider>
    )
}

function LayoutInner() {
    const location = useLocation()
    const scrollRef = useRef<HTMLDivElement>(null)
    const { navOpen, closeNav } = useUi()

    // Repart en haut à chaque changement de page (comme une navigation d'app)
    // et referme le tiroir latéral mobile.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 })
        closeNav()
    }, [location.pathname, closeNav])

    return (
        <div className="flex h-full flex-col bg-bg text-ink">
            <TopBar />
            <div className="relative flex min-h-0 flex-1">
                <Sidebar />
                {/* Voile mobile derrière le tiroir latéral */}
                {navOpen && (
                    <button
                        type="button"
                        aria-label="Fermer le menu"
                        onClick={closeNav}
                        className="animate-fade fixed inset-0 z-40 bg-black/50 md:hidden"
                    />
                )}
                <main
                    ref={scrollRef}
                    className="min-w-0 flex-1 overflow-y-auto"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <Outlet />
                </main>
            </div>
            <NowPlaying />
        </div>
    )
}
