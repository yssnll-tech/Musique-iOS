import { Music } from 'lucide-react'
import { cn } from '@/lib/cn'
import { gradientCss } from '@/lib/artwork'

interface ArtworkProps {
    url?: string | null
    seed: string
    className?: string
    rounded?: string
    alt?: string
}

/** Pochette : image si disponible, sinon dégradé déterministe avec une note. */
export function Artwork({ url, seed, className, rounded = 'rounded-md', alt }: ArtworkProps) {
    return (
        <div
            className={cn(
                'relative shrink-0 overflow-hidden bg-surface-2 shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
                rounded,
                className,
            )}
            style={!url ? { backgroundImage: gradientCss(seed) } : undefined}
        >
            {url ? (
                <img
                    src={url}
                    alt={alt ?? seed}
                    loading="lazy"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Music className="h-2/5 w-2/5 text-white/75" strokeWidth={1.75} />
                </div>
            )}
        </div>
    )
}
