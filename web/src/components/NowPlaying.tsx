import { useState } from 'react'
import {
    ChevronDown,
    Heart,
    ListMusic,
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
import { gradientCss } from '@/lib/artwork'
import { usePlaybackProgress, usePlayer } from '@/context/PlayerContext'
import { useLibrary } from '@/context/LibraryContext'
import { Artwork } from './Artwork'
import { EqBars } from './EqBars'

export function NowPlaying() {
    const player = usePlayer()
    const { toggleLike } = useLibrary()
    const { currentTime, duration } = usePlaybackProgress()
    const [showQueue, setShowQueue] = useState(false)

    const { current, showNowPlaying } = player
    if (!showNowPlaying || !current) return null

    const seed = `${current.album} ${current.album_artist || current.artist}`
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className="animate-sheet fixed inset-0 z-[150] overflow-hidden">
            {/* Fond : pochette floutée + dégradé de secours */}
            <div className="absolute inset-0" style={{ backgroundImage: gradientCss(seed) }} />
            {current.artwork_url && (
                <div
                    className="absolute inset-0 scale-125 bg-cover bg-center blur-3xl saturate-150"
                    style={{ backgroundImage: `url(${current.artwork_url})` }}
                />
            )}
            <div className="absolute inset-0 bg-black/55 backdrop-blur-2xl" />

            {/* Contenu */}
            <div className="relative flex h-full flex-col">
                <div
                    className="flex items-center justify-between px-6 py-5"
                    style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
                >
                    <button
                        type="button"
                        aria-label="Réduire"
                        onClick={() => player.setShowNowPlaying(false)}
                        className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    >
                        <ChevronDown className="size-5" />
                    </button>
                    <span className="text-[12px] font-semibold uppercase tracking-widest text-white/70">
                        Lecture en cours
                    </span>
                    <button
                        type="button"
                        aria-label="File d'attente"
                        onClick={() => setShowQueue((v) => !v)}
                        className={cn(
                            'grid size-9 place-items-center rounded-full transition',
                            showQueue ? 'bg-white/25 text-white' : 'bg-white/10 text-white hover:bg-white/20',
                        )}
                    >
                        <ListMusic className="size-5" />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center gap-10 px-8 pb-10">
                    {/* Pochette + infos + contrôles */}
                    <div className="flex w-full max-w-md flex-col items-center">
                        <Artwork
                            url={current.artwork_url}
                            seed={seed}
                            className={cn(
                                'aspect-square w-full max-w-[min(52vh,420px)] shadow-2xl transition-transform duration-500',
                                player.isPlaying ? 'scale-100' : 'scale-[0.86]',
                            )}
                            rounded="rounded-2xl"
                        />

                        <div className="mt-8 flex w-full max-w-[420px] items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h2 className="truncate text-2xl font-bold text-white">{current.title}</h2>
                                <p className="truncate text-lg text-white/70">{current.artist}</p>
                            </div>
                            <button
                                type="button"
                                aria-label={current.liked ? "Je n'aime plus" : "J'aime"}
                                onClick={() => void toggleLike(current)}
                                className={cn(
                                    'mt-1 grid size-9 shrink-0 place-items-center rounded-full transition',
                                    current.liked
                                        ? 'text-accent'
                                        : 'bg-white/10 text-white hover:bg-white/20',
                                )}
                            >
                                <Heart className={cn('size-5', current.liked && 'fill-current')} />
                            </button>
                        </div>

                        {/* Progression */}
                        <div className="mt-5 w-full max-w-[420px]">
                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.1}
                                value={currentTime}
                                onChange={(e) => player.seek(parseFloat(e.target.value))}
                                aria-label="Progression"
                                className="range"
                                style={{
                                    ['--pct' as string]: `${pct}%`,
                                    ['--range-track' as string]: 'rgba(255,255,255,0.28)',
                                }}
                            />
                            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-white/60">
                                <span>{formatTime(currentTime)}</span>
                                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
                            </div>
                        </div>

                        {/* Transport */}
                        <div className="mt-4 flex w-full max-w-[420px] items-center justify-center gap-8">
                            <button
                                type="button"
                                aria-label="Aléatoire"
                                onClick={player.toggleShuffle}
                                className={cn(
                                    'transition',
                                    player.shuffle ? 'text-accent' : 'text-white/80 hover:text-white',
                                )}
                            >
                                <Shuffle className="size-5" />
                            </button>
                            <button
                                type="button"
                                aria-label="Précédent"
                                onClick={player.prev}
                                className="text-white transition hover:scale-105"
                            >
                                <SkipBack className="size-8 fill-current" />
                            </button>
                            <button
                                type="button"
                                aria-label={player.isPlaying ? 'Pause' : 'Lecture'}
                                onClick={player.toggle}
                                className="grid size-16 place-items-center rounded-full bg-white text-black shadow-xl transition hover:scale-105"
                            >
                                {player.isPlaying ? (
                                    <Pause className="size-8 fill-current" />
                                ) : (
                                    <Play className="size-8 translate-x-[2px] fill-current" />
                                )}
                            </button>
                            <button
                                type="button"
                                aria-label="Suivant"
                                onClick={player.next}
                                className="text-white transition hover:scale-105"
                            >
                                <SkipForward className="size-8 fill-current" />
                            </button>
                            <button
                                type="button"
                                aria-label="Répéter"
                                onClick={player.cycleRepeat}
                                className={cn(
                                    'transition',
                                    player.repeat !== 'off' ? 'text-accent' : 'text-white/80 hover:text-white',
                                )}
                            >
                                {player.repeat === 'one' ? (
                                    <Repeat1 className="size-5" />
                                ) : (
                                    <Repeat className="size-5" />
                                )}
                            </button>
                        </div>

                        {/* Volume */}
                        <div className="mt-6 flex w-full max-w-[420px] items-center gap-3">
                            <button
                                type="button"
                                aria-label={player.muted ? 'Réactiver le son' : 'Couper le son'}
                                onClick={player.toggleMute}
                                className="text-white/70 transition hover:text-white"
                            >
                                {player.muted || player.volume === 0 ? (
                                    <VolumeX className="size-4" />
                                ) : player.volume < 0.5 ? (
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
                                value={player.muted ? 0 : player.volume}
                                onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                                aria-label="Volume"
                                className="range"
                                style={{
                                    ['--pct' as string]: `${(player.muted ? 0 : player.volume) * 100}%`,
                                    ['--range-track' as string]: 'rgba(255,255,255,0.28)',
                                }}
                            />
                        </div>
                    </div>

                    {/* File « À suivre » */}
                    {showQueue && (
                        <div className="glass hidden h-full max-h-[70vh] w-80 shrink-0 flex-col rounded-2xl border border-white/10 md:flex">
                            <h3 className="border-b border-white/10 px-4 py-3 text-[13px] font-semibold text-white">
                                À suivre
                            </h3>
                            <div className="no-scrollbar flex-1 overflow-y-auto p-2">
                                {player.upNext.length === 0 && (
                                    <p className="px-2 py-4 text-center text-[13px] text-white/50">
                                        Fin de la file d'attente.
                                    </p>
                                )}
                                {player.upNext.map((t, i) => (
                                    <button
                                        key={`${t.id}-${i}`}
                                        type="button"
                                        onClick={() => player.jumpAhead(i + 1)}
                                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/10"
                                    >
                                        <Artwork
                                            url={t.artwork_url}
                                            seed={`${t.album} ${t.artist}`}
                                            className="size-10"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-medium text-white">
                                                {t.title}
                                            </span>
                                            <span className="block truncate text-[12px] text-white/60">
                                                {t.artist}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bandeau bas : le morceau qui joue */}
                <div
                    className="flex items-center justify-center gap-2 border-t border-white/10 pt-3"
                    style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
                >
                    <EqBars paused={!player.isPlaying} />
                    <span className="text-[12px] text-white/70">
                        {current.album}
                        {current.year ? ` · ${current.year}` : ''}
                    </span>
                </div>
            </div>
        </div>
    )
}
