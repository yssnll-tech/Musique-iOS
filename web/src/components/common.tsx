import type { ReactNode } from 'react'
import { Play, Shuffle, Upload } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Track } from '@/types'
import { usePlayer } from '@/context/PlayerContext'
import { useImport } from './ImportProvider'

/** Conteneur de page avec le rembourrage standard. */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-6 lg:px-8', className)}>{children}</div>
}

export function PageTitle({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
    return (
        <div className="mb-6">
            <h1 className="text-[28px] font-bold tracking-tight text-ink">{children}</h1>
            {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
        </div>
    )
}

export function PlayShuffleButtons({ tracks }: { tracks: Track[] }) {
    const player = usePlayer()
    if (!tracks.length) return null
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => player.playContext(tracks, 0, false)}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-6 py-2 text-[14px] font-semibold text-accent transition hover:bg-white/15"
            >
                <Play className="size-4 fill-current" />
                Lire
            </button>
            <button
                type="button"
                onClick={() => player.playContext(tracks, 0, true)}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2 text-[14px] font-semibold text-accent transition hover:bg-white/15"
            >
                <Shuffle className="size-4" />
                Aléatoire
            </button>
        </div>
    )
}

export function EmptyState({
    icon,
    title,
    message,
    action,
}: {
    icon: ReactNode
    title: string
    message: string
    action?: ReactNode
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
            <div className="grid size-24 place-items-center rounded-3xl bg-white/5 text-faint">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-semibold text-ink">{title}</h3>
                <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">{message}</p>
            </div>
            {action}
        </div>
    )
}

/** Bouton d'appel à l'import, réutilisé dans les états vides. */
export function ImportCta({ label = 'Importer de la musique' }: { label?: string }) {
    const { open } = useImport()
    return (
        <button
            type="button"
            onClick={open}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white shadow-lg transition hover:brightness-110"
        >
            <Upload className="size-4" />
            {label}
        </button>
    )
}
