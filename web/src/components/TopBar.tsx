import {
    ListMusic,
    Maximize2,
    Menu,
    Pause,
    Play,
    Repeat,
    Repeat1,
    Shuffle,
    SkipBack,
    SkipForward,
    Volume1,
    Volume2,
    VolumeX,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'
import { usePlaybackProgress, usePlayer } from '@/context/PlayerContext'
import { useUi } from './UiContext'
import { Artwork } from './Artwork'

export function TopBar() {
    const player = usePlayer()
    const { openNav } = useUi()
    const { current, isPlaying, volume, muted, shuffle, repeat } = player

    return (
        <header
            className="glass glass-hi relative z-30 shrink-0 border-b border-line"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
            <div className="flex h-14 items-center">
                {/* Mobile : ouverture du menu latéral */}
                <div className="flex shrink-0 items-center pl-1 md:hidden">
                    <IconButton label="Menu" onClick={openNav}>
                        <Menu className="size-[22px]" />
                    </IconButton>
                </div>

                {/* Bureau : transport + volume (aligné sur la barre latérale) */}
                <div className="hidden w-[260px] shrink-0 items-center gap-1 border-r border-line px-3 md:flex">
                    <IconButton label="Précédent" onClick={player.prev} disabled={!current}>
                        <SkipBack className="size-[19px] fill-current" />
                    </IconButton>
                    <IconButton
                        label={isPlaying ? 'Pause' : 'Lecture'}
                        onClick={player.toggle}
                        disabled={!current}
                        big
                    >
                        {isPlaying ? (
                            <Pause className="size-[22px] fill-current" />
                        ) : (
                            <Play className="size-[22px] fill-current" />
                        )}
                    </IconButton>
                    <IconButton label="Suivant" onClick={player.next} disabled={!current}>
                        <SkipForward className="size-[19px] fill-current" />
                    </IconButton>

                    <div className="group ml-2 flex flex-1 items-center gap-2">
                        <button
                            type="button"
                            aria-label={muted ? 'Réactiver le son' : 'Couper le son'}
                            onClick={player.toggleMute}
                            className="text-muted transition hover:text-ink"
                        >
                            {muted || volume === 0 ? (
                                <VolumeX className="size-4" />
                            ) : volume < 0.5 ? (
                                <Volume1 className="size-4" />
                            ) : (
                                <Volume2 className="size-4" />
                            )}
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={muted ? 0 : volume}
                            onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                            aria-label="Volume"
                            className="range"
                            style={{ ['--pct' as string]: `${(muted ? 0 : volume) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Zone centrale : afficheur LCD */}
                <div className="flex min-w-0 flex-1 justify-center px-3 sm:px-4">
                    <LcdDisplay />
                </div>

                {/* Bureau : options de lecture */}
                <div className="hidden shrink-0 items-center gap-1 px-3 md:flex">
                    <IconButton label="Aléatoire" onClick={player.toggleShuffle} active={shuffle} small>
                        <Shuffle className="size-[17px]" />
                    </IconButton>
                    <IconButton label="Répéter" onClick={player.cycleRepeat} active={repeat !== 'off'} small>
                        {repeat === 'one' ? (
                            <Repeat1 className="size-[17px]" />
                        ) : (
                            <Repeat className="size-[17px]" />
                        )}
                    </IconButton>
                    <IconButton
                        label="Paroles / À suivre"
                        onClick={() => player.setShowNowPlaying(true)}
                        small
                        disabled={!current}
                    >
                        <ListMusic className="size-[17px]" />
                    </IconButton>
                    <IconButton
                        label="Plein écran"
                        onClick={() => player.setShowNowPlaying(true)}
                        small
                        disabled={!current}
                    >
                        <Maximize2 className="size-[15px]" />
                    </IconButton>
                </div>

                {/* Mobile : lecture / pause rapide */}
                <div className="flex shrink-0 items-center pr-1 md:hidden">
                    <IconButton
                        label={isPlaying ? 'Pause' : 'Lecture'}
                        onClick={player.toggle}
                        disabled={!current}
                        big
                    >
                        {isPlaying ? (
                            <Pause className="size-[24px] fill-current" />
                        ) : (
                            <Play className="size-[24px] fill-current" />
                        )}
                    </IconButton>
                </div>
            </div>
        </header>
    )
}

function LcdDisplay() {
    const player = usePlayer()
    const { current } = player
    const { currentTime, duration } = usePlaybackProgress()

    if (!current) {
        return (
            <div className="flex h-10 w-full max-w-[460px] items-center justify-center rounded-lg border border-line bg-black/20 text-[12px] text-faint">
                Musique
            </div>
        )
    }

    const pct = duration > 0 ? (currentTime / duration) * 100 : 0
    const remaining = duration > 0 ? duration - currentTime : 0

    return (
        <button
            type="button"
            onClick={() => player.setShowNowPlaying(true)}
            className="group flex h-10 w-full max-w-[460px] items-center gap-3 rounded-lg border border-line bg-black/25 px-2 text-left transition hover:bg-black/35"
        >
            <Artwork
                url={current.artwork_url}
                seed={`${current.album} ${current.artist}`}
                className="size-8"
                rounded="rounded"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="flex items-baseline justify-center gap-1 leading-tight">
                    <span className="truncate text-[12px] font-medium text-ink">{current.title}</span>
                </div>
                <div className="flex items-center gap-2 leading-tight">
                    <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-faint opacity-0 transition group-hover:opacity-100">
                        {formatTime(currentTime)}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-center text-[10.5px] text-muted group-hover:hidden">
                            {current.artist} — {current.album}
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.1}
                            value={currentTime}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => player.seek(parseFloat(e.target.value))}
                            aria-label="Progression"
                            className="range hidden group-hover:block"
                            style={{ ['--pct' as string]: `${pct}%` }}
                        />
                    </div>
                    <span className="w-8 shrink-0 text-[10px] tabular-nums text-faint opacity-0 transition group-hover:opacity-100">
                        -{formatTime(remaining)}
                    </span>
                </div>
            </div>
        </button>
    )
}

function IconButton({
    children,
    onClick,
    label,
    disabled,
    active,
    big,
    small,
}: {
    children: React.ReactNode
    onClick: () => void
    label: string
    disabled?: boolean
    active?: boolean
    big?: boolean
    small?: boolean
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'grid shrink-0 place-items-center rounded-full transition disabled:opacity-30',
                big ? 'size-9' : small ? 'size-8' : 'size-8',
                active ? 'text-accent' : 'text-ink hover:bg-white/10',
                active && 'hover:bg-accent/15',
            )}
        >
            {children}
        </button>
    )
}
