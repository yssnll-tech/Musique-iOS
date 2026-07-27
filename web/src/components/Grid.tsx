import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Grille responsive de cartes (albums, artistes, playlists). */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
                className,
            )}
        >
            {children}
        </div>
    )
}

export function Spinner() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
    )
}
