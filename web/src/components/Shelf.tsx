import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Étagère horizontale (façon page « Écouter »). */
export function Shelf({
    title,
    to,
    children,
}: {
    title: string
    to?: string
    children: ReactNode
}) {
    return (
        <section className="mb-9">
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-[20px] font-bold tracking-tight text-ink">{title}</h2>
                {to && (
                    <Link
                        to={to}
                        className="shrink-0 text-[13px] font-medium text-accent hover:underline"
                    >
                        Tout afficher
                    </Link>
                )}
            </div>
            <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">{children}</div>
        </section>
    )
}
