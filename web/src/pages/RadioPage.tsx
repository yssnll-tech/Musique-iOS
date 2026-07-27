import { useMemo } from 'react'
import { Play, Radio, Shuffle } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { usePlayer } from '@/context/PlayerContext'
import { EmptyState, ImportCta, PageContainer, PageTitle } from '@/components/common'
import { Spinner } from '@/components/Grid'
import { gradientCss } from '@/lib/artwork'
import { plural } from '@/lib/format'
import type { Track } from '@/types'

interface Station {
    id: string
    title: string
    subtitle: string
    tracks: Track[]
}

export function RadioPage() {
    const { tracks, loading } = useLibrary()
    const player = usePlayer()

    // Des « stations » construites à partir de VOTRE bibliothèque (aucun flux externe).
    const stations = useMemo<Station[]>(() => {
        if (tracks.length === 0) return []
        const out: Station[] = []

        out.push({
            id: 'all',
            title: 'Toute ma musique',
            subtitle: 'Lecture aléatoire de la bibliothèque',
            tracks,
        })

        const liked = tracks.filter((t) => t.liked)
        if (liked.length) {
            out.push({
                id: 'liked',
                title: "Mes titres aimés",
                subtitle: 'Vos coups de cœur, en boucle',
                tracks: liked,
            })
        }

        // Une station par genre marquant (au moins 3 morceaux).
        const byGenre = new Map<string, Track[]>()
        for (const t of tracks) {
            if (!t.genre) continue
            const arr = byGenre.get(t.genre) ?? []
            arr.push(t)
            byGenre.set(t.genre, arr)
        }
        for (const [g, list] of [...byGenre.entries()].sort((a, b) => b[1].length - a[1].length)) {
            if (list.length >= 3) {
                out.push({
                    id: `genre-${g}`,
                    title: `Station ${g}`,
                    subtitle: plural(list.length, 'morceau', 'morceaux'),
                    tracks: list,
                })
            }
        }

        // Une station par décennie.
        const byDecade = new Map<number, Track[]>()
        for (const t of tracks) {
            if (!t.year) continue
            const d = Math.floor(t.year / 10) * 10
            const arr = byDecade.get(d) ?? []
            arr.push(t)
            byDecade.set(d, arr)
        }
        for (const [d, list] of [...byDecade.entries()].sort((a, b) => b[0] - a[0])) {
            if (list.length >= 3) {
                out.push({
                    id: `decade-${d}`,
                    title: `Années ${d}`,
                    subtitle: plural(list.length, 'morceau', 'morceaux'),
                    tracks: list,
                })
            }
        }

        return out
    }, [tracks])

    if (loading) return <Spinner />

    if (tracks.length === 0) {
        return (
            <PageContainer>
                <PageTitle>Radio</PageTitle>
                <EmptyState
                    icon={<Radio className="size-10" />}
                    title="Vos stations vous attendent"
                    message="La Radio crée des stations en lecture aléatoire à partir de votre propre musique (genres, décennies, coups de cœur). Importez des morceaux pour commencer."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <PageTitle subtitle="Des stations créées à partir de votre bibliothèque">Radio</PageTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stations.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => player.playContext(s.tracks, 0, true)}
                        className="group relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-lg transition hover:brightness-110"
                        style={{ backgroundImage: gradientCss(s.title) }}
                    >
                        <div className="absolute inset-0 bg-black/15" />
                        <div className="relative flex items-center justify-between">
                            <Radio className="size-5 text-white/90" />
                            <Shuffle className="size-4 text-white/70" />
                        </div>
                        <div className="relative">
                            <h3 className="text-[17px] font-bold text-white">{s.title}</h3>
                            <p className="text-[12px] text-white/80">{s.subtitle}</p>
                        </div>
                        <div className="absolute bottom-4 right-4 grid size-10 translate-y-1 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                            <Play className="size-5 translate-x-[1px] fill-current" />
                        </div>
                    </button>
                ))}
            </div>
        </PageContainer>
    )
}
