import type { ReactNode } from 'react'
import { Artwork } from './Artwork'

interface DetailHeaderProps {
    artworkUrl?: string | null
    seed: string
    rounded?: string
    eyebrow?: string
    title: ReactNode
    subtitle?: ReactNode
    meta?: string
    actions?: ReactNode
}

/** En-tête de page de détail : grande pochette à gauche, infos + actions à droite. */
export function DetailHeader({
    artworkUrl,
    seed,
    rounded = 'rounded-xl',
    eyebrow,
    title,
    subtitle,
    meta,
    actions,
}: DetailHeaderProps) {
    return (
        <div className="flex flex-col items-center gap-6 pb-6 sm:flex-row sm:items-end">
            <Artwork
                url={artworkUrl}
                seed={seed}
                rounded={rounded}
                className="size-48 shadow-2xl sm:size-52"
            />
            <div className="flex min-w-0 flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                {eyebrow && (
                    <span className="text-[12px] font-semibold uppercase tracking-widest text-accent">
                        {eyebrow}
                    </span>
                )}
                <h1 className="mt-1 text-[clamp(24px,4vw,42px)] font-bold leading-tight tracking-tight text-ink">
                    {title}
                </h1>
                {subtitle && <div className="mt-1 text-[15px] text-muted">{subtitle}</div>}
                {meta && <p className="mt-1 text-[13px] text-faint">{meta}</p>}
                {actions && <div className="mt-5">{actions}</div>}
            </div>
        </div>
    )
}
