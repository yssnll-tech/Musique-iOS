import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { RepeatMode, Track } from '@/types'
import { useLibrary } from './LibraryContext'

interface QueueState {
    base: Track[]
    order: number[]
    pos: number
}

interface PlayerValue {
    current: Track | null
    queue: Track[]
    upNext: Track[]
    isPlaying: boolean
    duration: number
    volume: number
    muted: boolean
    shuffle: boolean
    repeat: RepeatMode
    showNowPlaying: boolean
    audioRef: React.RefObject<HTMLAudioElement | null>
    playContext: (tracks: Track[], startIndex?: number, forceShuffle?: boolean) => void
    toggle: () => void
    next: () => void
    prev: () => void
    jumpAhead: (n: number) => void
    seek: (t: number) => void
    setVolume: (v: number) => void
    toggleMute: () => void
    toggleShuffle: () => void
    cycleRepeat: () => void
    setShowNowPlaying: (b: boolean) => void
    isCurrent: (id: string) => boolean
}

const PlayerContext = createContext<PlayerValue | null>(null)

export function usePlayer(): PlayerValue {
    const ctx = useContext(PlayerContext)
    if (!ctx) throw new Error('usePlayer doit être utilisé dans <PlayerProvider>')
    return ctx
}

function identityOrder(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i)
}

function shuffledOrder(n: number, startIndex: number): number[] {
    const idx = identityOrder(n)
    for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
    const p = idx.indexOf(startIndex)
    if (p > 0) [idx[0], idx[p]] = [idx[p], idx[0]]
    return idx
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { markPlayed } = useLibrary()
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const [q, setQ] = useState<QueueState>({ base: [], order: [], pos: 0 })
    const [isPlaying, setIsPlaying] = useState(false)
    const [duration, setDuration] = useState(0)
    const [volume, setVolumeState] = useState(1)
    const [muted, setMuted] = useState(false)
    const [shuffle, setShuffle] = useState(false)
    const [repeat, setRepeat] = useState<RepeatMode>('off')
    const [showNowPlaying, setShowNowPlaying] = useState(false)

    const current = q.base.length ? (q.base[q.order[q.pos]] ?? null) : null

    // Refs pour lire l'état à jour dans les callbacks (event handlers audio).
    const qRef = useRef(q)
    const repeatRef = useRef(repeat)
    const shuffleRef = useRef(shuffle)
    const countedRef = useRef<string | null>(null)
    useEffect(() => {
        qRef.current = q
    }, [q])
    useEffect(() => {
        repeatRef.current = repeat
    }, [repeat])
    useEffect(() => {
        shuffleRef.current = shuffle
    }, [shuffle])

    const upNext = useMemo(() => {
        if (!q.base.length) return []
        return q.order.slice(q.pos + 1).map((i) => q.base[i])
    }, [q])

    // ---- Chargement / lecture du morceau courant ----
    const currentId = current?.id ?? null
    const currentUrl = current?.audio_url ?? null
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        if (!currentUrl) {
            audio.removeAttribute('src')
            audio.load()
            setIsPlaying(false)
            return
        }
        audio.src = currentUrl
        audio.load()
        const p = audio.play()
        if (p && typeof p.catch === 'function') p.catch(() => setIsPlaying(false))
        // Comptage d'écoute (une fois par changement de morceau).
        if (current && countedRef.current !== current.id) {
            countedRef.current = current.id
            void markPlayed(current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentId, currentUrl])

    // ---- Volume ----
    useEffect(() => {
        const audio = audioRef.current
        if (audio) audio.volume = muted ? 0 : volume
    }, [volume, muted])

    // ---- Navigation ----
    const computeNext = useCallback((): number | null => {
        const cur = qRef.current
        if (!cur.base.length) return null
        if (cur.pos >= cur.order.length - 1) {
            return repeatRef.current === 'all' ? 0 : null
        }
        return cur.pos + 1
    }, [])

    const next = useCallback(() => {
        const np = computeNext()
        if (np == null) {
            const audio = audioRef.current
            if (audio) audio.pause()
            setIsPlaying(false)
            return
        }
        setQ((prev) => ({ ...prev, pos: np }))
    }, [computeNext])

    const prev = useCallback(() => {
        const audio = audioRef.current
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0
            return
        }
        setQ((prevQ) => {
            if (!prevQ.base.length) return prevQ
            if (prevQ.pos <= 0) {
                if (audio) audio.currentTime = 0
                return prevQ
            }
            return { ...prevQ, pos: prevQ.pos - 1 }
        })
    }, [])

    // Saute directement à un morceau de la file « À suivre » (offset relatif au morceau courant).
    const jumpAhead = useCallback((n: number) => {
        setQ((prev) => {
            if (!prev.base.length) return prev
            const target = prev.pos + n
            if (target < 0 || target >= prev.order.length) return prev
            return { ...prev, pos: target }
        })
        setIsPlaying(true)
    }, [])

    const playContext = useCallback(
        (tracks: Track[], startIndex = 0, forceShuffle?: boolean) => {
            if (!tracks.length) return
            const start = Math.max(0, Math.min(startIndex, tracks.length - 1))
            const useShuffle = forceShuffle ?? shuffleRef.current
            if (forceShuffle !== undefined) setShuffle(forceShuffle)
            if (useShuffle) {
                setQ({ base: tracks, order: shuffledOrder(tracks.length, start), pos: 0 })
            } else {
                setQ({ base: tracks, order: identityOrder(tracks.length), pos: start })
            }
            setIsPlaying(true)
        },
        [],
    )

    const toggle = useCallback(() => {
        const audio = audioRef.current
        if (!audio || !qRef.current.base.length) return
        if (audio.paused) {
            const p = audio.play()
            if (p && typeof p.catch === 'function') p.catch(() => setIsPlaying(false))
        } else {
            audio.pause()
        }
    }, [])

    const seek = useCallback((t: number) => {
        const audio = audioRef.current
        if (audio && Number.isFinite(t)) audio.currentTime = t
    }, [])

    const setVolume = useCallback((v: number) => {
        const clamped = Math.max(0, Math.min(1, v))
        setVolumeState(clamped)
        if (clamped > 0) setMuted(false)
    }, [])

    const toggleMute = useCallback(() => setMuted((m) => !m), [])

    const toggleShuffle = useCallback(() => {
        setShuffle((s) => {
            const ns = !s
            setQ((prev) => {
                if (!prev.base.length) return prev
                const curBaseIdx = prev.order[prev.pos] ?? 0
                if (ns) {
                    return { ...prev, order: shuffledOrder(prev.base.length, curBaseIdx), pos: 0 }
                }
                return { ...prev, order: identityOrder(prev.base.length), pos: curBaseIdx }
            })
            return ns
        })
    }, [])

    const cycleRepeat = useCallback(() => {
        setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'))
    }, [])

    const isCurrent = useCallback((id: string) => currentId === id, [currentId])

    // ---- Handlers de l'élément audio ----
    const onEnded = useCallback(() => {
        if (repeatRef.current === 'one') {
            const audio = audioRef.current
            if (audio) {
                audio.currentTime = 0
                void audio.play()
            }
            return
        }
        next()
    }, [next])

    const value: PlayerValue = {
        current,
        queue: q.base,
        upNext,
        isPlaying,
        duration,
        volume,
        muted,
        shuffle,
        repeat,
        showNowPlaying,
        audioRef,
        playContext,
        toggle,
        next,
        prev,
        jumpAhead,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        setShowNowPlaying,
        isCurrent,
    }

    return (
        <PlayerContext.Provider value={value}>
            {children}
            <audio
                ref={audioRef}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={onEnded}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
            />
        </PlayerContext.Provider>
    )
}

/**
 * Progression de lecture isolée : chaque composant qui l'utilise se met à jour
 * ~4×/s sans re-rendre le reste de l'arbre (listes longues incluses).
 */
export function usePlaybackProgress(): { currentTime: number; duration: number } {
    const { audioRef, current, duration } = usePlayer()
    const [currentTime, setCurrentTime] = useState(0)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        const onTime = () => setCurrentTime(audio.currentTime)
        setCurrentTime(audio.currentTime)
        audio.addEventListener('timeupdate', onTime)
        return () => audio.removeEventListener('timeupdate', onTime)
    }, [audioRef, current?.id])

    return { currentTime, duration }
}
