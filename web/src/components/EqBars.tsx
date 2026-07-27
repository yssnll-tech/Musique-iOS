import { cn } from '@/lib/cn'

/** Petites barres d'égaliseur animées, pour le morceau en cours de lecture. */
export function EqBars({ className, paused }: { className?: string; paused?: boolean }) {
    return (
        <div className={cn('flex h-3.5 items-end gap-[2px]', className)}>
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="eq-bar"
                    style={{
                        animationDelay: `${i * 0.16}s`,
                        animationPlayState: paused ? 'paused' : 'running',
                        height: paused ? '35%' : undefined,
                    }}
                />
            ))}
        </div>
    )
}
